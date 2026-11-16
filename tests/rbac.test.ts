import "dotenv/config";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Pool, type PoolClient } from "pg";

test(
  "R01 real restricted login enforces role, ownership, grants and pool isolation",
  {
    skip: !process.env.TEST_APP_DATABASE_URL
      ? "BLOCKED: run migrations and db:rbac for disposable test DB"
      : false,
  },
  async () => {
    for (const key of ["TEST_DATABASE_URL", "TEST_APP_DATABASE_URL"])
      assert.ok(new URL(process.env[key]!).pathname.endsWith("_test"));
    const owner = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const app = new Pool({
      connectionString: process.env.TEST_APP_DATABASE_URL,
      max: 1,
    });
    const trainer = randomUUID(),
      member = randomUUID(),
      other = randomUUID();
    let slot: string | undefined;
    async function as(
      actor: string | null,
      fn: (c: PoolClient) => Promise<void>,
    ) {
      const c = await app.connect();
      try {
        await c.query("BEGIN");
        if (actor)
          await c.query("SELECT set_config('pulsefit.actor_id',$1,true)", [
            actor,
          ]);
        await fn(c);
      } finally {
        await c.query("ROLLBACK");
        c.release();
      }
    }
    try {
      const flags = (
        await app.query(
          "SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user",
        )
      ).rows[0];
      assert.deepEqual(flags, { rolsuper: false, rolbypassrls: false });
      for (const [id, role] of [
        [trainer, "TRAINER"],
        [member, "MEMBER"],
        [other, "MEMBER"],
      ]) {
        await owner.query(
          "INSERT INTO users(id,name,email,password_hash,role) VALUES($1,'RBAC fixture',$2,$3,$4)",
          [id, id + "@example.test", "x".repeat(60), role],
        );
        await owner.query(
          `INSERT INTO ${role === "MEMBER" ? "member_profiles" : "trainer_profiles"}(user_id) VALUES($1)`,
          [id],
        );
      }
      slot = (
        await owner.query(
          "INSERT INTO trainer_availability(trainer_id,starts_at,ends_at) VALUES($1,now()+interval '3 days',now()+interval '3 days 1 hour') RETURNING id",
          [trainer],
        )
      ).rows[0].id;
      await as(member, async (c) => {
        await assert.rejects(
          c.query(
            "INSERT INTO trainer_availability(trainer_id,starts_at,ends_at) VALUES($1,now()+interval '5 days',now()+interval '5 days 1 hour')",
            [trainer],
          ),
          { code: "42501" },
        );
      });
      await as(trainer, async (c) => {
        await assert.rejects(
          c.query("SELECT app_reserve_slot($1,$2)", [trainer, slot]),
          { code: "42501" },
        );
      });
      await as(member, async (c) => {
        await assert.rejects(
          c.query("SELECT app_reserve_slot($1,$2)", [other, slot]),
          { code: "42501" },
        );
      });
      await as(member, async (c) => {
        await assert.rejects(
          c.query("UPDATE users SET role='TRAINER' WHERE id=$1", [member]),
          { code: "42501" },
        );
      });
      await as(member, async (c) => {
        await assert.rejects(
          c.query("SELECT reserve_slot($1,$2)", [member, slot]),
          { code: "42501" },
        );
      });
      const booking = (
        await owner.query("SELECT reserve_slot($1,$2) id", [member, slot])
      ).rows[0].id;
      await as(other, async (c) => {
        // Deliberately omit API ownership predicates: the database filters rows.
        assert.equal(
          (await c.query("SELECT * FROM bookings WHERE id=$1", [booking]))
            .rowCount,
          0,
        );
        assert.equal(
          (
            await c.query(
              "UPDATE bookings SET status='CANCELLED' WHERE id=$1",
              [booking],
            )
          ).rowCount,
          0,
        );
        assert.equal(
          (
            await c.query(
              "UPDATE member_profiles SET fitness_goals='intrusion' WHERE user_id=$1",
              [member],
            )
          ).rowCount,
          0,
        );
        assert.equal(
          (
            await c.query(
              "UPDATE trainer_profiles SET bio='intrusion' WHERE user_id=$1",
              [trainer],
            )
          ).rowCount,
          0,
        );
      });
      await as(member, async (c) => {
        assert.equal(
          (await c.query("SELECT * FROM bookings WHERE id=$1", [booking]))
            .rowCount,
          1,
        );
      });
      await as(trainer, async (c) => {
        assert.equal(
          (await c.query("SELECT * FROM bookings WHERE id=$1", [booking]))
            .rowCount,
          1,
        );
        assert.equal(
          (
            await c.query(
              "UPDATE bookings SET status='CANCELLED' WHERE id=$1",
              [booking],
            )
          ).rowCount,
          0,
        );
      });
      await as(null, async (c) => {
        assert.equal(
          (await c.query("SELECT * FROM bookings WHERE id=$1", [booking]))
            .rowCount,
          0,
        );
      });
      await as(member, async (c) => {
        assert.equal(
          (
            await c.query(
              "UPDATE bookings SET status='CANCELLED' WHERE id=$1 RETURNING id",
              [booking],
            )
          ).rowCount,
          1,
        );
      });
      await as(member, async (c) => {
        await assert.rejects(c.query("DELETE FROM booking_audit"), {
          code: "42501",
        });
      });
      console.log(
        "RLS: member/trainer denial, cross-owner filtering, direct function denial, audit protection and reused-connection reset verified",
      );
    } finally {
      await owner.query(
        "DELETE FROM booking_audit WHERE booking_id IN(SELECT id FROM bookings WHERE trainer_id=$1)",
        [trainer],
      );
      await owner.query("DELETE FROM bookings WHERE trainer_id=$1", [trainer]);
      await owner.query(
        "DELETE FROM trainer_availability WHERE trainer_id=$1",
        [trainer],
      );
      await owner.query(
        "DELETE FROM member_profiles WHERE user_id=ANY($1::uuid[])",
        [[member, other]],
      );
      await owner.query("DELETE FROM trainer_profiles WHERE user_id=$1", [
        trainer,
      ]);
      await owner.query("DELETE FROM users WHERE id=ANY($1::uuid[])", [
        [trainer, member, other],
      ]);
      await app.end();
      await owner.end();
    }
  },
);
