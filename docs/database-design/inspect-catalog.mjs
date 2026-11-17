// Read-only schema inspection. Run from repository root with a private .env configured.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
const req = createRequire(process.cwd() + "/package.json"),
  env = req("dotenv").parse(fs.readFileSync(".env")),
  { Pool } = req("pg");
const p = new Pool({
  connectionString: env.DATABASE_URL,
  connectionTimeoutMillis: 4000,
});
try {
  const columns = (
    await p.query(
      "SELECT ic.table_name,ic.column_name,ic.ordinal_position,ic.data_type,ic.udt_name,ic.is_nullable,ic.column_default,ic.is_identity,(SELECT format_type(a.atttypid,a.atttypmod) FROM pg_attribute a WHERE a.attrelid=format('%I.%I',ic.table_schema,ic.table_name)::regclass AND a.attname=ic.column_name) formatted_type FROM information_schema.columns ic WHERE ic.table_schema='public' ORDER BY ic.table_name,ic.ordinal_position",
    )
  ).rows;
  const constraints = (
    await p.query(
      "SELECT c.relname table_name,k.conname,k.contype,pg_get_constraintdef(k.oid) definition FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid WHERE c.relnamespace='public'::regnamespace ORDER BY c.relname,k.conname",
    )
  ).rows;
  const indexes = (
    await p.query(
      "SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname",
    )
  ).rows;
  const tables = (
    await p.query(
      "SELECT tablename,rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename",
    )
  ).rows;
  const migrations = (
    await p.query("SELECT name,checksum FROM schema_migrations ORDER BY name")
  ).rows;
  fs.writeFileSync(
    "docs/database-design/catalog-verification.json",
    JSON.stringify(
      {
        inspectedAt: new Date().toISOString(),
        sourceMain: execFileSync("git", ["rev-parse", "origin/main"], {
          encoding: "utf8",
        }).trim(),
        serverVersion: (await p.query("SHOW server_version")).rows[0]
          .server_version,
        tables,
        columns,
        constraints,
        indexes,
        migrations,
      },
      null,
      2,
    ),
  );
  console.log(
    "Live read-only catalog captured:",
    tables.length,
    "tables,",
    columns.length,
    "columns,",
    constraints.length,
    "constraints,",
    indexes.length,
    "indexes.",
  );
} finally {
  await p.end();
}
