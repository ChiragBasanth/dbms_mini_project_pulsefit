import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { MongoClient } from "mongodb";
import { readFile, readdir } from "node:fs/promises";
import { setup } from "../database/mongo/setup";
import { progressPipeline } from "../src/lib/workouts";
import { embed, vector, MODEL } from "../src/lib/embedding";
const pgUrl = process.env.TEST_DATABASE_URL;
const mongoUrl = process.env.TEST_MONGODB_URI;
function safePg(url: string) {
  if (!new URL(url).pathname.endsWith("_test"))
    throw new Error("Refusing non-test PostgreSQL database");
}
test(
  "I01 PostgreSQL constraints, concurrent reservations, cancellation and audit",
  { skip: !pgUrl ? "BLOCKED: TEST_DATABASE_URL not configured" : false },
  async (t) => {
    safePg(pgUrl!);
    const pool = new Pool({
      connectionString: pgUrl,
      max: 12,
      connectionTimeoutMillis: 5000,
    });
    const schema = "test_" + randomUUID().replaceAll("-", "");
    // Dedicated schema plus extensions in public. Fixture never drops the database or public schema.
    try {
      await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
      await pool.query("CREATE EXTENSION IF NOT EXISTS btree_gist");
      await pool.query(`CREATE SCHEMA ${schema}`);
      await pool.end();
      const db = new Pool({
        connectionString: pgUrl,
        options: `-c search_path=${schema},public`,
        max: 12,
      });
      try {
        for (const name of (await readdir("database/postgres/migrations"))
          .filter((v) => v.endsWith(".sql"))
          .sort())
          await db.query(
            await readFile("database/postgres/migrations/" + name, "utf8"),
          );
        const trainer = randomUUID(),
          m1 = randomUUID(),
          m2 = randomUUID();
        for (const [id, role] of [
          [trainer, "TRAINER"],
          [m1, "MEMBER"],
          [m2, "MEMBER"],
        ]) {
          await db.query(
            "INSERT INTO users(id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5)",
            [id, "Test User", id + "@example.test", "x".repeat(60), role],
          );
          if (role === "TRAINER")
            await db.query("INSERT INTO trainer_profiles(user_id) VALUES($1)", [
              id,
            ]);
          else
            await db.query("INSERT INTO member_profiles(user_id) VALUES($1)", [
              id,
            ]);
        }
        const slot = (
          await db.query(
            "INSERT INTO trainer_availability(trainer_id,starts_at,ends_at) VALUES($1,now()+interval '1 day',now()+interval '1 day 1 hour') RETURNING id",
            [trainer],
          )
        ).rows[0].id;
        await t.test(
          "I02 parallel independent connections yield one winner and SQLSTATE 23505 losers",
          async () => {
            const clients = await Promise.all(
              Array.from({ length: 8 }, () => db.connect()),
            );
            let release!: () => void;
            const gate = new Promise<void>((r) => {
              release = r;
            });
            const jobs = clients.map((c, i) =>
              (async () => {
                await gate;
                try {
                  return {
                    ok: true,
                    id: (
                      await c.query("SELECT reserve_slot($1,$2) id", [
                        i % 2 ? m1 : m2,
                        slot,
                      ])
                    ).rows[0].id,
                  };
                } catch (e) {
                  return { ok: false, code: (e as { code: string }).code };
                } finally {
                  c.release();
                }
              })(),
            );
            release();
            const results = await Promise.all(jobs);
            console.log("CONCURRENCY", JSON.stringify(results));
            assert.equal(results.filter((r) => r.ok).length, 1);
            assert.equal(
              results.filter((r) => !r.ok && r.code === "23505").length,
              7,
            );
            assert.equal(
              (
                await db.query(
                  "SELECT count(*)::int n FROM bookings WHERE slot_id=$1 AND status='CONFIRMED'",
                  [slot],
                )
              ).rows[0].n,
              1,
            );
          },
        );
        await t.test(
          "I03 cancellation releases slot; audit records committed transitions",
          async () => {
            await db.query(
              "UPDATE bookings SET status='CANCELLED' WHERE slot_id=$1",
              [slot],
            );
            await db.query("SELECT reserve_slot($1,$2)", [m1, slot]);
            assert.equal(
              (await db.query("SELECT count(*)::int n FROM booking_audit"))
                .rows[0].n,
              3,
            );
          },
        );
        await t.test(
          "I04 overlap, invalid duration and past availability rejected",
          async () => {
            await assert.rejects(
              db.query(
                "INSERT INTO trainer_availability(trainer_id,starts_at,ends_at) VALUES($1,now()+interval '1 day 30 minutes',now()+interval '1 day 90 minutes')",
                [trainer],
              ),
              { code: "23P01" },
            );
            await assert.rejects(
              db.query(
                "INSERT INTO trainer_availability(trainer_id,starts_at,ends_at) VALUES($1,now()-interval '1 day',now()-interval '23 hours')",
                [trainer],
              ),
              { code: "23514" },
            );
            await assert.rejects(
              db.query(
                "INSERT INTO trainer_availability(trainer_id,starts_at,ends_at) VALUES($1,now()+interval '2 days',now()+interval '2 days 5 hours')",
                [trainer],
              ),
              { code: "23514" },
            );
          },
        );
        await t.test(
          "I05 normalized email, typed profile FK, ownership query and SQL injection parameterization",
          async () => {
            await assert.rejects(
              db.query("INSERT INTO member_profiles(user_id) VALUES($1)", [
                trainer,
              ]),
              { code: "23503" },
            );
            assert.equal(
              (
                await db.query("SELECT id FROM users WHERE email=$1", [
                  "x' OR 1=1 --",
                ])
              ).rowCount,
              0,
            );
            assert.equal(
              (
                await db.query("SELECT id FROM bookings WHERE member_id=$1", [
                  randomUUID(),
                ])
              ).rowCount,
              0,
            );
          },
        );
        await t.test("I06 rollback and safe course SQL execute", async () => {
          await db.query(
            await readFile("database/postgres/queries/course_demo.sql", "utf8"),
          );
          const c = await db.connect();
          try {
            await c.query("BEGIN");
            await c.query(
              "UPDATE bookings SET status='CANCELLED' WHERE slot_id=$1",
              [slot],
            );
            await c.query("ROLLBACK");
            assert.equal(
              (
                await c.query(
                  "SELECT count(*)::int n FROM bookings WHERE status='CONFIRMED'",
                )
              ).rows[0].n,
              1,
            );
          } finally {
            c.release();
          }
        });
      } finally {
        await db.query(`DROP SCHEMA ${schema} CASCADE`);
        await db.end();
      }
    } finally {
      if (!(pool as unknown as { ended: boolean }).ended) await pool.end();
    }
  },
);
test(
  "I07 real MongoDB CRUD, ownership, validator and aggregation accuracy",
  { skip: !mongoUrl ? "BLOCKED: TEST_MONGODB_URI not configured" : false },
  async () => {
    const dbName = process.env.TEST_MONGODB_DB || "pulsefit_test";
    if (!dbName.endsWith("_test"))
      throw new Error("Refusing non-test MongoDB database");
    const client = await new MongoClient(mongoUrl!, {
      serverSelectionTimeoutMS: 5000,
    }).connect();
    const u = randomUUID(),
      other = randomUUID();
    const c = client.db(dbName).collection("workout_logs");
    try {
      await setup(client.db(dbName));
      const base = {
        userId: u,
        performedAt: new Date("2026-01-01T10:00:00Z"),
        createdAt: new Date(),
        workoutType: "MIXED",
      };
      const a = await c.insertOne({
        ...base,
        exercises: [
          {
            name: "Squat",
            sets: [
              { reps: 10, weight: 20 },
              { reps: 5, weight: 30 },
            ],
          },
        ],
      });
      await c.insertOne({
        ...base,
        exercises: [
          { name: "Cycling", sets: [{ duration: 600, distance: 1500 }] },
        ],
      });
      await c.insertOne({
        ...base,
        userId: other,
        exercises: [{ name: "Squat", sets: [{ reps: 100, weight: 100 }] }],
      });
      assert.equal(await c.countDocuments({ userId: u }), 2);
      assert.equal(
        (
          await c.updateOne(
            { _id: a.insertedId, userId: other },
            { $set: { notes: "attack" } },
          )
        ).matchedCount,
        0,
      );
      assert.equal(
        (await c.deleteOne({ _id: a.insertedId, userId: other })).deletedCount,
        0,
      );
      await c.updateOne(
        { _id: a.insertedId, userId: u },
        { $set: { notes: "updated" } },
      );
      assert.equal((await c.findOne({ _id: a.insertedId }))?.notes, "updated");
      const result = (await c.aggregate(progressPipeline(u)).toArray())[0];
      assert.deepEqual(result.sessions, [{ sessions: 2, date: "2026-01-01" }]);
      assert.equal(
        result.volume.find((v: { exercise: string }) => v.exercise === "Squat")
          .volume,
        350,
      );
      const cardio = result.volume.find(
        (v: { exercise: string }) => v.exercise === "Cycling",
      );
      assert.equal(cardio.volume, 0);
      assert.equal(cardio.duration, 600);
      assert.equal(cardio.distance, 1500);
      console.log("MONGO_AGGREGATION", JSON.stringify(result));
      await assert.rejects(
        c.insertOne({
          ...base,
          exercises: [{ name: "Bad", sets: [{ reps: 0, weight: -2 }] }],
        }),
        { code: 121 },
      );
      assert.equal(
        (await c.deleteOne({ _id: a.insertedId, userId: u })).deletedCount,
        1,
      );
    } finally {
      await c.deleteMany({ userId: { $in: [u, other] } });
      await client.close();
    }
  },
);
test(
  "I08 legitimate embeddings and pgvector semantic ranking",
  {
    skip: !pgUrl
      ? "BLOCKED: TEST_DATABASE_URL and downloaded model required"
      : false,
  },
  async () => {
    safePg(pgUrl!);
    const query = await embed(
      "I get out of breath easily and want to last longer without getting tired",
    );
    const aerobic = await embed(
      "Steady cycling develops cardiovascular endurance and aerobic stamina",
    );
    const strength = await embed(
      "Heavy overhead pressing builds shoulder muscle size and maximum strength",
    );
    const cosine = (a: number[], b: number[]) =>
      a.reduce((s, v, i) => s + v * b[i], 0);
    assert.equal(query.length, 384);
    assert.ok(cosine(query, aerobic) > cosine(query, strength));
    const pool = new Pool({ connectionString: pgUrl });
    try {
      await pool.query("CREATE EXTENSION IF NOT EXISTS vector");
      const r = await pool.query(
        "SELECT name,1-(v::vector <=> $1::vector) similarity FROM (VALUES ($2::text,$3::text),($4::text,$5::text)) AS candidate(name,v) ORDER BY v::vector <=> $1::vector",
        [
          vector(query),
          "aerobic",
          vector(aerobic),
          "strength",
          vector(strength),
        ],
      );
      assert.equal(r.rows[0].name, "aerobic");
      console.log("VECTOR", MODEL, JSON.stringify(r.rows));
    } finally {
      await pool.end();
    }
  },
);
