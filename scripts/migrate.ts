import "dotenv/config";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { sql } from "../src/lib/db";
export async function migrate() {
  const c = await sql().connect();
  try {
    await c.query("SELECT pg_advisory_lock(91847211)");
    await c.query(
      "CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())",
    );
    for (const name of (await readdir("database/postgres/migrations"))
      .filter((f) => f.endsWith(".sql"))
      .sort()) {
      const content = await readFile(
        "database/postgres/migrations/" + name,
        "utf8",
      );
      const checksum = createHash("sha256").update(content).digest("hex");
      const previous = (
        await c.query("SELECT checksum FROM schema_migrations WHERE name=$1", [
          name,
        ])
      ).rows[0];
      if (previous) {
        if (previous.checksum !== checksum)
          throw new Error("Applied migration was changed: " + name);
        continue;
      }
      try {
        await c.query("BEGIN");
        await c.query(content);
        await c.query(
          "INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)",
          [name, checksum],
        );
        await c.query("COMMIT");
        console.log("Applied", name);
      } catch (e) {
        await c.query("ROLLBACK");
        throw e;
      }
    }
  } finally {
    await c.query("SELECT pg_advisory_unlock(91847211)");
    c.release();
  }
}
if (process.argv[1]?.endsWith("migrate.ts")) {
  try {
    await migrate();
  } finally {
    await sql().end();
  }
}
