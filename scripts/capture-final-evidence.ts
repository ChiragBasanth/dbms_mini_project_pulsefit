import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { sql } from "../src/lib/db";
const directory = "docs/evidence/level3-2026-11-16";
try {
  const inventory = await sql().query(`
    SELECT tablename,rowsecurity FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
    SELECT tablename,policyname,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname;
    SELECT grantee,table_name,privilege_type FROM information_schema.role_table_grants WHERE grantee='pulsefit_app' ORDER BY table_name,privilege_type;
    SELECT grantee,table_name,column_name,privilege_type FROM information_schema.column_privileges WHERE grantee='pulsefit_app' AND privilege_type='UPDATE' ORDER BY table_name,column_name;
    SELECT extname,extversion FROM pg_extension WHERE extname IN('vector','btree_gist') ORDER BY extname;
    SELECT embedding_model,vector_dims(embedding) dimensions,count(*) FROM exercises GROUP BY embedding_model,vector_dims(embedding);
    SELECT embedding_model,vector_dims(embedding) dimensions,count(*) FROM trainer_profiles GROUP BY embedding_model,vector_dims(embedding);
  `);
  await writeFile(
    `${directory}/database-inventory.json`,
    JSON.stringify(inventory, null, 2),
  );
  const result = await sql().query(
    await readFile("database/postgres/queries/course_demo.sql", "utf8"),
  );
  await writeFile(
    `${directory}/course-demo.json`,
    JSON.stringify(result, null, 2),
  );
  console.log(
    "Captured actual public schema policies/grants/vector dimensions and rollback-protected course queries",
  );
} finally {
  await sql().end();
}
