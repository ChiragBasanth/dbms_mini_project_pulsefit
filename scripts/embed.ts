import "dotenv/config";
import { sql } from "../src/lib/db";
import { embed, vector, MODEL } from "../src/lib/embedding";
try {
  for (const e of (
    await sql().query("SELECT id,name,description FROM exercises")
  ).rows) {
    await sql().query(
      "UPDATE exercises SET embedding=$1::vector,embedding_model=$2 WHERE id=$3",
      [vector(await embed(e.name + " " + e.description)), MODEL, e.id],
    );
    console.log("Embedded exercise", e.name);
  }
  for (const t of (
    await sql().query("SELECT user_id,bio,specialties FROM trainer_profiles")
  ).rows) {
    await sql().query(
      "UPDATE trainer_profiles SET embedding=$1::vector,embedding_model=$2 WHERE user_id=$3",
      [
        vector(await embed(t.bio + " " + t.specialties.join(" "))),
        MODEL,
        t.user_id,
      ],
    );
    console.log("Embedded trainer", t.user_id);
  }
} finally {
  await sql().end();
}
