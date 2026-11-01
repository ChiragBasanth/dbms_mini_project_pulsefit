import "dotenv/config";
import { hash } from "bcryptjs";
import { readFile } from "node:fs/promises";
import { sql } from "../src/lib/db";
if (!process.env.SEED_PASSWORD || process.env.SEED_PASSWORD.length < 12)
  throw new Error(
    "Set SEED_PASSWORD to a demo password of at least 12 characters",
  );
const c = await sql().connect();
try {
  await c.query("BEGIN");
  const password = await hash(process.env.SEED_PASSWORD, 12);
  for (const [name, email, role, bio, specialties] of [
    ["Demo Member", "member@pulsefit.example", "MEMBER", "", ""],
    [
      "Asha Rao",
      "strength@pulsefit.example",
      "TRAINER",
      "Resistance coaching for muscle growth, safe lifting and full body strength.",
      "Strength,Hypertrophy",
    ],
    [
      "Dev Sen",
      "endurance@pulsefit.example",
      "TRAINER",
      "Aerobic conditioning for heart health, stamina and low impact endurance.",
      "Cardio,Endurance",
    ],
    [
      "Mira Das",
      "mobility@pulsefit.example",
      "TRAINER",
      "Gentle flexibility, joint range of motion and posture for desk workers.",
      "Mobility,Flexibility",
    ],
  ]) {
    const u = (
      await c.query(
        "INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING RETURNING id",
        [name, email, password, role],
      )
    ).rows[0];
    if (!u) continue; // Never reset an existing account or alter its identity.
    if (role === "MEMBER")
      await c.query("INSERT INTO member_profiles(user_id) VALUES($1)", [u.id]);
    else {
      await c.query(
        "INSERT INTO trainer_profiles(user_id,bio,specialties,experience_years) VALUES($1,$2,$3,4)",
        [u.id, bio, specialties.split(",")],
      );
      for (let day = 1; day <= 7; day++)
        await c.query(
          "INSERT INTO trainer_availability(trainer_id,starts_at,ends_at) VALUES($1,date_trunc('day',now())+($2::int*interval '1 day')+interval '10 hours',date_trunc('day',now())+($2::int*interval '1 day')+interval '11 hours')",
          [u.id, day],
        );
    }
  }
  for (const e of JSON.parse(
    await readFile("database/postgres/seed/exercises.json", "utf8"),
  ))
    await c.query(
      "INSERT INTO exercises(name,muscle_group,description,difficulty,category) VALUES($1,$2,$3,$4,$5) ON CONFLICT(name) DO NOTHING",
      [e.name, e.muscle_group, e.description, e.difficulty, e.category],
    );
  await c.query("COMMIT");
  console.log(
    "Demo users, slots and exercise texts seeded; run db:embed next.",
  );
} catch (e) {
  await c.query("ROLLBACK");
  throw e;
} finally {
  c.release();
  await sql().end();
}
