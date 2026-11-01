import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { sql } from "../src/lib/db";
try {
  for (const name of ["inspect", "course_demo", "semantic_search"]) {
    const result = await sql().query(
      await readFile("database/postgres/queries/" + name + ".sql", "utf8"),
    );
    await writeFile(
      "docs/evidence/sql-" + name + ".json",
      JSON.stringify(result, null, 2),
    );
    console.log(
      "Executed and captured database/postgres/queries/" + name + ".sql",
    );
  }
} finally {
  await sql().end();
}
