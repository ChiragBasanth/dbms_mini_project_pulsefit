import { Pool } from "pg";
import { embedText, toPgVector } from "../lib/embeddings.ts";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required. Load .env into your shell before running this script.");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const trainers = [{ email: "trainer.maya@pulsefit.local", text: "Maya Chen strength mobility functional movement resistance training beginner friendly" }];
const exercises = [
  ["Treadmill intervals", "Cardio intervals that improve aerobic capacity and support weight management.", "cardio"],
  ["Goblet squat", "A lower body strength exercise for legs, hips and core stability.", "strength"],
  ["Hip mobility flow", "A controlled mobility sequence for hip range of motion and recovery.", "mobility"]
] as const;
async function seed() {
  for (const trainer of trainers) await pool.query("UPDATE trainer_profiles SET embedding=$1::vector WHERE user_id=(SELECT id FROM users WHERE email=$2)", [toPgVector(embedText(trainer.text)), trainer.email]);
  for (const [name, description, category] of exercises) await pool.query("INSERT INTO exercise_embeddings(name,description,category,embedding,metadata) VALUES($1,$2,$3,$4::vector,$5) ON CONFLICT(name) DO UPDATE SET description=EXCLUDED.description,category=EXCLUDED.category,embedding=EXCLUDED.embedding", [name, description, category, toPgVector(embedText(`${name} ${description}`)), JSON.stringify({ seeded: true })]);
  await pool.end();
}
seed().catch(async error => { await pool.end(); throw error; });
