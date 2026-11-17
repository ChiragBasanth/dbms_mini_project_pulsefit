#!/usr/bin/env node
// PulseFit DBMS Faculty Demo Menu — database-safe, source-linked demo runner.
// Run in PowerShell: node .\pulsefit-demo-menu.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(process.env.PULSEFIT_SOURCE || HERE);
// Normal checkout: use its own installed dependencies/configuration. Preserve the
// established pulsefit-main-audit + sibling pulsefit portable-runtime arrangement.
const siblingRuntime = path.join(path.dirname(SOURCE), "pulsefit");
const isConfigured = (p) =>
  fs.existsSync(path.join(p, ".env")) &&
  fs.existsSync(path.join(p, "package.json"));
const legacyPair =
  path.basename(SOURCE) === "pulsefit-main-audit" &&
  isConfigured(siblingRuntime);
const RUNTIME = path.resolve(
  process.env.PULSEFIT_RUNTIME ||
    (legacyPair
      ? siblingRuntime
      : isConfigured(SOURCE)
        ? SOURCE
        : isConfigured(siblingRuntime)
          ? siblingRuntime
          : SOURCE),
);
const requireRuntime = createRequire(path.join(RUNTIME, "package.json"));
let pg, MongoClient;
try {
  requireRuntime("dotenv").config({
    path: path.join(RUNTIME, ".env"),
    quiet: true,
  });
  pg = requireRuntime("pg");
  MongoClient = requireRuntime("mongodb").MongoClient;
} catch {
  console.error(
    "Missing installed dependencies. Run npm ci in the configured source/runtime checkout.",
  );
  console.error(
    "Use a repository-root .env, or set PULSEFIT_RUNTIME to your configured local runtime folder.",
  );
  process.exit(1);
}
const commandMode =
  process.argv.includes("--check") || process.argv.includes("--smoke");
const rl = commandMode ? null : readline.createInterface({ input, output });
let checking = false,
  sourceChecks = 0;
const q = async (prompt) => (await rl.question(prompt)).trim();
const safeError = (error) =>
  String(error?.message || error).replace(
    /\b(?:postgres(?:ql)?|mongodb(?:\+srv)?):\/\/[^\s'"]+/gi,
    "[redacted connection]",
  );
function localDatabase(uri, explicitName, kind) {
  if (!uri)
    throw new Error(
      kind + " connection is not configured. Follow docs/SETUP.md.",
    );
  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    throw new Error(kind + " connection URL is invalid (value hidden).");
  }
  if (
    !["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname.toLowerCase())
  )
    throw new Error(
      "Faculty menu refuses non-loopback " +
        kind +
        " servers. Use an isolated localhost demo runtime.",
    );
  const name = explicitName || decodeURIComponent(parsed.pathname.slice(1));
  if (!["pulsefit", "pulsefit_test"].includes(name))
    throw new Error(
      "Faculty menu requires a local pulsefit or pulsefit_test database. Connection value hidden.",
    );
  return name;
}
const hr = () => console.log("\n" + "─".repeat(74));
const header = (title) => {
  hr();
  console.log(title);
  hr();
};
const spath = (rel) => path.join(SOURCE, ...rel.split("/"));
function source(rel, terms = [], maxLines = 42) {
  if (checking) {
    const f = spath(rel);
    if (!fs.existsSync(f)) throw new Error("Missing source: " + rel);
    const body = fs.readFileSync(f, "utf8").toLowerCase();
    if (terms.length && !terms.some((t) => body.includes(t.toLowerCase())))
      throw new Error(
        "Missing source highlight: " + rel + " / " + terms.join(", "),
      );
    sourceChecks++;
    return;
  }
  console.log("\nSOURCE: " + rel);
  const f = spath(rel);
  if (!fs.existsSync(f)) {
    console.log("Source file not found at: " + f);
    return;
  }
  const lines = fs.readFileSync(f, "utf8").split(/\r?\n/);
  if (!terms.length) {
    console.log(
      lines
        .slice(0, maxLines)
        .map((s, i) => `${String(i + 1).padStart(3)} | ${s}`)
        .join("\n"),
    );
    return;
  }
  const hit = lines.findIndex((x) =>
    terms.some((t) => x.toLowerCase().includes(t.toLowerCase())),
  );
  if (hit < 0) {
    console.log("Keyword not found. Open the file in VS Code.");
    return;
  }
  const start = Math.max(0, hit - 3),
    end = Math.min(lines.length, hit + maxLines);
  console.log(
    lines
      .slice(start, end)
      .map((s, i) => `${String(start + i + 1).padStart(3)} | ${s}`)
      .join("\n"),
  );
}
function code(sql) {
  console.log("\nEXECUTED SQL / DEMO CODE:\n" + sql.trim());
}
function explain(text) {
  console.log("\nWHAT THIS DEMONSTRATES:\n" + text);
}
function rows(result) {
  if (Array.isArray(result)) {
    result.forEach((r, i) => {
      console.log(
        `Result ${i + 1} (${r.command || "SQL"}; ${r.rowCount ?? "?"} rows)`,
      );
      if (r.rows?.length) console.table(r.rows.slice(0, 25));
    });
  } else {
    console.log(
      `Output: ${result.command || "QUERY"} (${result.rowCount ?? "?"} rows)`,
    );
    console.table(result.rows.slice(0, 30));
  }
}
async function sqlRun(sql, { sandbox = false, fileTransaction = false } = {}) {
  if (checking) return;
  localDatabase(process.env.DATABASE_URL, null, "PostgreSQL");
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 4500,
    query_timeout: 15000,
    application_name: "pulsefit-faculty-demo",
  });
  try {
    await client.connect();
    if (!fileTransaction)
      await client.query(sandbox ? "BEGIN" : "BEGIN READ ONLY");
    const r = await client.query(sql);
    rows(r);
    return r;
  } finally {
    try {
      await client.query("ROLLBACK");
      if (sandbox || fileTransaction)
        console.log("ROLLBACK completed; demo changes not saved.");
    } catch (e) {
      console.log("Rollback warning: " + safeError(e));
    }
    await client.end().catch(() => {});
  }
}
async function showSQL({ title, why, files = [], sql, sandbox = false }) {
  header(title);
  explain(why);
  for (const [f, terms] of files) source(f, terms, 24);
  code(sql);
  console.log("\nLIVE OUTPUT:");
  await sqlRun(sql, { sandbox });
}
async function withMongo(fn) {
  if (checking) return;
  const name = localDatabase(
    process.env.MONGODB_URI,
    process.env.MONGODB_DB,
    "MongoDB",
  );
  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 4500,
  });
  try {
    await client.connect();
    const db = client.db(name);
    console.log("Connected to MongoDB database: " + db.databaseName);
    return await fn(db);
  } finally {
    await client.close();
  }
}
const sql = {
  tables: `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;`,
  constraints: `SELECT conrelid::regclass::text table_name, conname constraint_name, CASE contype WHEN 'p' THEN 'PRIMARY KEY' WHEN 'f' THEN 'FOREIGN KEY' WHEN 'u' THEN 'UNIQUE' WHEN 'c' THEN 'CHECK' WHEN 'x' THEN 'EXCLUSION' WHEN 'n' THEN 'NOT NULL' ELSE contype::text END constraint_type, pg_get_constraintdef(oid) definition FROM pg_constraint WHERE connamespace='public'::regnamespace ORDER BY table_name, constraint_type, constraint_name;`,
  indexes: `SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname;`,
  ddl: `CREATE TEMP TABLE faculty_demo (id integer PRIMARY KEY, exercise text NOT NULL);\nALTER TABLE faculty_demo ADD COLUMN repetitions integer DEFAULT 10 CHECK(repetitions>0);\nINSERT INTO faculty_demo VALUES(1,'Squat',12),(2,'Push Up',15);\nSELECT * FROM faculty_demo ORDER BY id;\nDROP TABLE faculty_demo;`,
  dml: `CREATE TEMP TABLE faculty_demo (id integer PRIMARY KEY, exercise text NOT NULL, repetitions integer CHECK(repetitions>0));\nINSERT INTO faculty_demo VALUES(1,'Squat',10),(2,'Push Up',15);\nSELECT * FROM faculty_demo ORDER BY id;\nUPDATE faculty_demo SET repetitions=20 WHERE id=1;\nSELECT * FROM faculty_demo ORDER BY id;\nDELETE FROM faculty_demo WHERE id=2;\nSELECT * FROM faculty_demo ORDER BY id;`,
  real: `SELECT role,COUNT(*) AS total FROM users GROUP BY role ORDER BY role; SELECT name,category,difficulty FROM exercises ORDER BY name LIMIT 12; SELECT status,COUNT(*) AS total FROM bookings GROUP BY status ORDER BY status;`,
  joins: `SELECT b.id, m.name AS member, t.name AS trainer, s.starts_at, b.status FROM bookings b INNER JOIN users m ON m.id=b.member_id INNER JOIN users t ON t.id=b.trainer_id INNER JOIN trainer_availability s ON s.id=b.slot_id ORDER BY s.starts_at DESC LIMIT 10; SELECT u.name,COUNT(b.id) AS bookings FROM users u LEFT JOIN bookings b ON b.member_id=u.id WHERE u.role='MEMBER' GROUP BY u.id,u.name ORDER BY bookings DESC LIMIT 10;`,
  nested: `SELECT name FROM users WHERE id IN (SELECT member_id FROM bookings WHERE trainer_id IN (SELECT user_id FROM trainer_profiles WHERE embedding IS NOT NULL)) ORDER BY name;`,
  correlated: `SELECT u.name FROM trainer_profiles t JOIN users u ON u.id=t.user_id WHERE EXISTS(SELECT 1 FROM trainer_availability s WHERE s.trainer_id=t.user_id AND s.status='OPEN' AND s.starts_at>now() AND NOT EXISTS(SELECT 1 FROM bookings b WHERE b.slot_id=s.id AND b.status='CONFIRMED')) ORDER BY u.name;`,
  recursive: `WITH RECURSIVE training_days(day) AS (SELECT current_date UNION ALL SELECT day+1 FROM training_days WHERE day<current_date+6) SELECT d.day,count(s.id) FILTER (WHERE s.status='OPEN' AND s.starts_at>now() AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.slot_id=s.id AND b.status='CONFIRMED')) AS free_slots FROM training_days d LEFT JOIN trainer_availability s ON s.starts_at::date=d.day GROUP BY d.day ORDER BY d.day;`,
  cte: `WITH totals AS (SELECT trainer_id,count(*) AS total FROM bookings WHERE status='CONFIRMED' GROUP BY trainer_id) SELECT * FROM totals WHERE total >= (SELECT avg(total) FROM totals);`,
  functions: `SELECT p.proname AS function_name, pg_get_function_identity_arguments(p.oid) AS arguments, pg_get_function_result(p.oid) AS returns FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prokind='f' AND p.proname IN ('validate_booking','audit_booking','reserve_slot','protect_availability','request_actor','request_has_role','app_reserve_slot') AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid='pg_proc'::regclass AND d.objid=p.oid AND d.deptype='e') ORDER BY p.proname;`,
  triggers: `SELECT tgrelid::regclass::text AS table_name, tgname AS trigger_name, pg_get_triggerdef(oid) AS definition FROM pg_trigger WHERE NOT tgisinternal ORDER BY table_name,trigger_name; SELECT booking_id,old_status,new_status,changed_at FROM booking_audit ORDER BY changed_at DESC LIMIT 5;`,
  extensions: `SELECT extname,extversion FROM pg_extension WHERE extname IN ('vector','btree_gist') ORDER BY extname; SELECT table_name,column_name,udt_name FROM information_schema.columns WHERE table_schema='public' AND column_name IN ('embedding','embedding_model') ORDER BY table_name,column_name; SELECT COUNT(*) AS exercises,COUNT(embedding) AS embedded_exercises FROM exercises;`,
  vector: `SELECT a.name AS reference_exercise, e.name AS match_name, round((1-(e.embedding <=> a.embedding))::numeric,4) AS cosine_similarity FROM (SELECT name,embedding FROM exercises WHERE embedding IS NOT NULL ORDER BY name LIMIT 1) a CROSS JOIN exercises e WHERE e.embedding IS NOT NULL ORDER BY e.embedding <=> a.embedding LIMIT 5;`,
  roles: `SELECT role,COUNT(*) AS total FROM users GROUP BY role ORDER BY role; SELECT relname AS table_name,relrowsecurity AS rls_enabled FROM pg_class WHERE relkind='r' AND relnamespace='public'::regnamespace AND relname IN ('member_profiles','trainer_profiles','trainer_availability','bookings','booking_audit') ORDER BY relname;`,
  rls: `SELECT tablename,policyname,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname;`,
  views: `SELECT viewname,definition FROM pg_views WHERE schemaname='public' ORDER BY viewname;`,
  course: null,
};
const menu = [
  [
    1,
    "PostgreSQL tables (SQL creation evidence)",
    "Real SQL tables + migrations",
  ],
  [
    2,
    "PK/FK/UNIQUE/CHECK/EXCLUSION constraints",
    "Physical schema & constraints",
  ],
  [
    3,
    "Indexes (partial unique, GiST etc.)",
    "Booking guarantees and performance",
  ],
  [4, "DDL: CREATE, ALTER, DROP (safe rollback)", "Temporary SQL structure"],
  [
    5,
    "DML: INSERT, SELECT, UPDATE, DELETE (safe)",
    "Temporary rows; project untouched",
  ],
  [6, "DML: inspect real PulseFit rows", "Roles, exercises, booking counts"],
  [7, "SQL JOIN queries", "INNER JOIN and LEFT JOIN"],
  [8, "Nested subqueries", "Nested IN subquery"],
  [9, "Correlated subqueries", "EXISTS with outer-row references"],
  [10, "Recursive SQL and recursive CTE", "Seven-day planning report"],
  [11, "Ordinary CTE and aggregation", "WITH and averages"],
  [12, "Stored functions", "Inspect database functions"],
  [13, "Triggers and audit", "Trigger definitions and saved audit"],
  [14, "MongoDB creation, validator, indexes", "NoSQL collection evidence"],
  [15, "MongoDB Read and aggregation", "Read documents, show pipeline"],
  [
    16,
    "MongoDB RUD (isolated disposable collection)",
    "Optional write demo; auto-cleanup",
  ],
  [17, "pgvector extension and columns", "Vector database creation evidence"],
  [18, "Vector similarity execution", "Live cosine similarity ranking"],
  [19, "Authentication roles + RLS enabled", "Database-level RBAC status"],
  [20, "Actual PostgreSQL RLS policies", "Inspect per-role permissions"],
  [21, "Backend/API and database code", "View real source files"],
  [22, "Next.js website status", "Check local server / show source"],
  [23, "Technology justification", "Why PostgreSQL + MongoDB + pgvector"],
  [24, "Git/GitHub and documentation", "Latest commit and evidence paths"],
  [25, "Full original course_demo.sql", "Execute real source in transaction"],
  [26, "SQL views", "Inspect available reporting views"],
  [0, "Exit", ""],
];
async function run(n) {
  switch (n) {
    case 1:
      return showSQL({
        title: "PostgreSQL tables",
        why: "Catalog confirms tables created by active migrations.",
        files: [
          ["database/postgres/migrations/001_core.sql", ["CREATE TABLE users"]],
        ],
        sql: sql.tables,
      });
    case 2:
      return showSQL({
        title: "SQL constraints",
        why: "Real database-level PK/FK, checks, uniqueness and overlapping-slot exclusion.",
        files: [
          [
            "database/postgres/migrations/001_core.sql",
            ["CREATE TABLE trainer_availability"],
          ],
        ],
        sql: sql.constraints,
      });
    case 3:
      return showSQL({
        title: "SQL indexes",
        why: "Includes one_confirmed_booking_per_slot, a partial UNIQUE index.",
        files: [
          [
            "database/postgres/migrations/001_core.sql",
            ["one_confirmed_booking_per_slot"],
          ],
        ],
        sql: sql.indexes,
      });
    case 4:
      return showSQL({
        title: "DDL demo — rolled back",
        why: "CREATE, ALTER and DROP a transaction-scoped temporary table.",
        files: [
          ["database/postgres/queries/course_demo.sql", ["CREATE TEMP TABLE"]],
        ],
        sql: sql.ddl,
        sandbox: true,
      });
    case 5:
      return showSQL({
        title: "DML demo — rolled back",
        why: "INSERT, SELECT, UPDATE and DELETE; no permanent changes.",
        files: [
          [
            "database/postgres/queries/course_demo.sql",
            ["INSERT INTO ddl_demonstration(id,label)"],
          ],
        ],
        sql: sql.dml,
        sandbox: true,
      });
    case 6:
      return showSQL({
        title: "Actual PulseFit records",
        why: "SELECT returns real user-role counts, exercise catalog and booking counts.",
        files: [
          ["database/postgres/migrations/001_core.sql", ["CREATE TABLE users"]],
        ],
        sql: sql.real,
      });
    case 7:
      return showSQL({
        title: "INNER/LEFT JOIN",
        why: "Joins related booking, trainer, member, and availability tables.",
        files: [
          ["database/postgres/queries/course_demo.sql", ["SELECT b.id,m.name"]],
        ],
        sql: sql.joins,
      });
    case 8:
      return showSQL({
        title: "Nested query",
        why: "The inner IN selects trainers with embeddings; outer IN selects their booked members.",
        files: [
          [
            "database/postgres/queries/course_demo.sql",
            ["Explicit nested subquery"],
          ],
        ],
        sql: sql.nested,
      });
    case 9:
      return showSQL({
        title: "Correlated query",
        why: "Inner subqueries use outer t.user_id and s.id; read the outer reference aloud.",
        files: [
          ["database/postgres/queries/course_demo.sql", ["Correlated EXISTS"]],
        ],
        sql: sql.correlated,
      });
    case 10:
      return showSQL({
        title: "Recursive CTE",
        why: "Anchor = CURRENT_DATE, recursive member = day+1, stop after 7 days; counts free capacity.",
        files: [
          ["database/postgres/queries/course_demo.sql", ["WITH RECURSIVE"]],
        ],
        sql: sql.recursive,
      });
    case 11:
      return showSQL({
        title: "Ordinary CTE",
        why: "WITH totals aggregates confirmed bookings, outer SELECT compares against average.",
        files: [
          ["database/postgres/queries/course_demo.sql", ["WITH totals AS"]],
        ],
        sql: sql.cte,
      });
    case 12:
      return showSQL({
        title: "Stored functions",
        why: "Inspect implemented stored functions; reserve_slot uses FOR UPDATE for booking concurrency.",
        files: [
          [
            "database/postgres/migrations/001_core.sql",
            ["CREATE FUNCTION reserve_slot"],
          ],
        ],
        sql: sql.functions,
      });
    case 13:
      return showSQL({
        title: "Triggers and audit",
        why: "Database triggers validate bookings, create audit events and protect slot changes.",
        files: [
          [
            "database/postgres/migrations/001_core.sql",
            ["CREATE TRIGGER booking_validation"],
          ],
        ],
        sql: sql.triggers,
      });
    case 14: {
      header("MongoDB creation and indexes");
      explain(
        "MongoDB workout_logs JSON Schema validator and index definitions.",
      );
      source("database/mongo/setup.ts", ["export const validator"], 60);
      code(
        'const collections = await db.listCollections().toArray();\nconst indexes = await db.collection("workout_logs").indexes();\nconst count = await db.collection("workout_logs").countDocuments();',
      );
      return withMongo(async (db) => {
        let cols = await db.listCollections().toArray();
        console.table(
          cols.map((c) => ({
            name: c.name,
            validator: !!c.options?.validator,
          })),
        );
        if (cols.some((c) => c.name === "workout_logs")) {
          console.table(
            (await db.collection("workout_logs").indexes()).map((i) => ({
              name: i.name,
              keys: JSON.stringify(i.key),
            })),
          );
          console.log(
            "Workout documents:",
            await db.collection("workout_logs").countDocuments(),
          );
        }
      });
    }
    case 15: {
      header("MongoDB Read and Aggregation");
      explain(
        "Read documents without exposing account identifiers; use actual progressPipeline if TS executor available.",
      );
      source("src/lib/workouts.ts", ["export function progressPipeline"], 73);
      code(
        'const docs = await db.collection("workout_logs").find({}, {projection:{userId:0}}).limit(5).toArray();\nconst totals = await db.collection("workout_logs").aggregate([{ $group: { _id: "$workoutType", count: {$sum:1} } }]).toArray();',
      );
      return withMongo(async (db) => {
        const documents = await db
          .collection("workout_logs")
          .find({}, { projection: { userId: 0 } })
          .limit(5)
          .toArray();
        console.table(documents);
        const totals = await db
          .collection("workout_logs")
          .aggregate([
            { $group: { _id: "$workoutType", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ])
          .toArray();
        console.table(totals);
        if (!totals.length)
          console.log(
            "No saved workout_logs documents: the aggregation correctly returns an empty array. Save a workout through the member UI to demonstrate non-empty totals; this menu does not seed data.",
          );
        console.log(
          "For full per-member analytics: show src/lib/workouts.ts and use member UI.",
        );
      });
    }
    case 16: {
      header("MongoDB RUD — isolated disposable collection");
      explain(
        "Creates a temporary demo COLLECTION (not workout_logs), reads, updates and deletes a fixture, then drops the collection. If interrupted, a collection with prefix pulsefit_faculty_demo_ might remain.",
      );
      source("database/mongo/setup.ts", ["export async function setup"], 18);
      if (checking) return;
      const answer = await q(
        "Type DEMO to permit isolated MongoDB writes, or Enter to cancel: ",
      );
      if (answer !== "DEMO") {
        console.log("Cancelled.");
        return;
      }
      code(
        'const c = db.collection("pulsefit_faculty_demo_<unique>");\nconst ins = await c.insertOne({exercise:"Squat",reps:10,demo:true});\nawait c.findOne({_id:ins.insertedId});\nawait c.updateOne({_id:ins.insertedId},{$set:{reps:20}});\nawait c.findOne({_id:ins.insertedId});\nawait c.deleteOne({_id:ins.insertedId});\nawait c.drop(); // finally cleanup',
      );
      return withMongo(async (db) => {
        const c = db.collection(
          "pulsefit_faculty_demo_" + process.pid + "_" + Date.now(),
        );
        try {
          let ins = await c.insertOne({
            exercise: "Squat",
            reps: 10,
            demo: true,
          });
          console.log("INSERT:", ins.acknowledged);
          console.log("READ:", await c.findOne({ _id: ins.insertedId }));
          console.log(
            "UPDATE:",
            (await c.updateOne({ _id: ins.insertedId }, { $set: { reps: 20 } }))
              .modifiedCount,
          );
          console.log(
            "READ UPDATED:",
            await c.findOne({ _id: ins.insertedId }),
          );
          console.log(
            "DELETE:",
            (await c.deleteOne({ _id: ins.insertedId })).deletedCount,
          );
        } finally {
          await c.drop().catch((e) => {
            if (e.codeName !== "NamespaceNotFound")
              console.log("Cleanup error:", safeError(e));
          });
          console.log(
            "Temporary MongoDB collection removed (cleanup attempted).",
          );
        }
      });
    }
    case 17:
      return showSQL({
        title: "pgvector installed and embedded columns",
        why: "pgvector resides inside PostgreSQL; vector(384) used for exercise and trainer embeddings.",
        files: [
          [
            "database/postgres/migrations/001_core.sql",
            ["CREATE EXTENSION IF NOT EXISTS vector"],
          ],
        ],
        sql: sql.extensions,
      });
    case 18:
      return showSQL({
        title: "Cosine similarity ranked results",
        why: "Uses a genuine stored exercise embedding as the query vector; score 1 - cosine_distance.",
        files: [
          ["database/postgres/queries/semantic_search.sql", ["SELECT id,name"]],
        ],
        sql: sql.vector,
      });
    case 19:
      return showSQL({
        title: "Authentication roles and RLS",
        why: "Member and Trainer roles plus flags showing database row-level security activation.",
        files: [
          [
            "database/postgres/migrations/003_database_authorization.sql",
            ["ENABLE ROW LEVEL SECURITY"],
          ],
        ],
        sql: sql.roles,
      });
    case 20:
      return showSQL({
        title: "Database RLS policies",
        why: "Inspects row-level SELECT/INSERT/UPDATE policies, not just frontend RBAC.",
        files: [
          [
            "database/postgres/migrations/003_database_authorization.sql",
            ["CREATE POLICY member_read"],
          ],
        ],
        sql: sql.rls,
      });
    case 21: {
      header("Backend/API and DB integration");
      explain(
        "Open these real code files in VS Code; code is not executed here because it handles live user requests.",
      );
      source("src/app/api/[...path]/route.ts", [], 65);
      source("src/lib/db.ts", [], 55);
      source("src/lib/auth.ts", [], 35);
      return;
    }
    case 22: {
      header("Next.js interface");
      explain(
        "Locally running site demonstrates UI. Browser login with both roles and show booking/workout operations.",
      );
      source("package.json", ['"dev"'], 20);
      console.log("URL: http://127.0.0.1:3000");
      if (checking) return;
      try {
        const r = await fetch("http://127.0.0.1:3000", {
          signal: AbortSignal.timeout(4000),
        });
        console.log("HTTP result:", r.status, r.statusText);
      } catch (e) {
        console.log("Site not reachable: " + safeError(e));
      }
      return;
    }
    case 23: {
      header("Technology justification");
      explain(
        "PostgreSQL: ACID + relational FKs/constraints for bookings. MongoDB: nested workout documents and aggregation. pgvector (PostgreSQL extension): semantic search using MiniLM embeddings. PostgreSQL JSONB could also hold workouts; this is a design choice.",
      );
      source(
        "database/postgres/migrations/001_core.sql",
        ["CREATE EXTENSION"],
        14,
      );
      source("database/mongo/setup.ts", ["$jsonSchema"], 15);
      source("database/postgres/queries/semantic_search.sql", ["PREPARE"], 15);
      return;
    }
    case 24: {
      header("GitHub/docs/originality");
      explain(
        "Show commits/PRs and explicitly explain your real contribution; no automatic attribution claims.",
      );
      for (const f of [
        "docs/ER_DIAGRAM.md",
        "docs/RELATIONAL_SCHEMA.md",
        "docs/LEVEL3_FINAL_REPORT.md",
        "docs/CONTRIBUTIONS.md",
        "docs/DEMO_SCRIPT.md",
      ])
        console.log((fs.existsSync(spath(f)) ? "FOUND" : "MISSING") + " " + f);
      console.log(
        "Repository: https://github.com/ChiragBasanth/dbms_mini_project_pulsefit",
      );
      console.log(
        "Git from VS Code PowerShell: git log -6 --oneline ; git status --short",
      );
      return;
    }
    case 25: {
      header("FULL course_demo.sql");
      const rel = "database/postgres/queries/course_demo.sql";
      source(rel, [], 120);
      const script = fs.readFileSync(spath(rel), "utf8");
      const statements = script.replace(/--[^\n]*/g, "").trim();
      if (
        !/^BEGIN\s*;/i.test(statements) ||
        !/ROLLBACK\s*;$/i.test(statements) ||
        /\bCOMMIT\s*;/i.test(statements)
      ) {
        console.log(
          "Safety verification failed: cannot confirm rollback boundaries.",
        );
        return;
      }
      explain(
        "Executes original repo SQL. The script starts BEGIN and ends ROLLBACK. No changes committed. May fail if database fixture records missing.",
      );
      console.log("\nEXECUTING EXACT FILE: " + rel);
      return sqlRun(script, { fileTransaction: true });
    }
    case 26:
      return showSQL({
        title: "SQL reporting views",
        why: "Proves the implementation of database views including upcoming_bookings and trainer_utilization.",
        files: [
          [
            "database/postgres/migrations/001_core.sql",
            ["CREATE VIEW upcoming_bookings"],
          ],
        ],
        sql: sql.views,
      });
  }
}
async function main() {
  console.log(
    "PulseFit DBMS — Faculty Menu (source from latest checkout; DB from configured runtime)",
  );
  console.log("Source:", SOURCE);
  console.log("Runtime:", RUNTIME);
  console.log(
    "Connection values are hidden. Only loopback pulsefit/pulsefit_test databases are accepted. SQL inspections use READ ONLY transactions.",
  );
  if (!fs.existsSync(spath("database/postgres/migrations/001_core.sql")))
    console.log(
      "WARNING: source path does not contain the expected migrations.",
    );
  if (!process.env.DATABASE_URL)
    console.log(
      "WARNING: DATABASE_URL missing. SQL options will fail until configured.",
    );
  try {
    while (true) {
      hr();
      for (const [n, label, desc] of menu)
        console.log(
          `${String(n).padStart(2)}  ${label}${desc ? ` — ${desc}` : ""}`,
        );
      const value = await q("\nChoose number (0 to exit): ");
      if (value === "0" || value.toLowerCase() === "exit") break;
      const n = Number(value);
      if (!Number.isInteger(n) || !menu.some((x) => x[0] === n)) {
        console.log("Invalid selection.");
        continue;
      }
      try {
        await run(n);
      } catch (e) {
        console.error("DEMO ERROR:", safeError(e));
        if (e.code) console.error("SQL/driver code:", e.code);
      }
      await q("\nPress Enter to return to the menu...");
    }
  } finally {
    rl.close();
  }
}
async function checkSources() {
  const ids = menu.filter((x) => x[0] !== 0).map((x) => x[0]);
  if (ids.length !== 26 || ids.some((x, i) => x !== i + 1))
    throw Error("Expected options 1–26");
  const log = console.log;
  checking = true;
  sourceChecks = 0;
  console.log = () => {};
  try {
    for (const id of ids) await run(id);
  } finally {
    checking = false;
    console.log = log;
  }
  if (sourceChecks < 26) throw Error("Incomplete source verification");
  console.log(
    "PASS: 26 options; " +
      sourceChecks +
      " actual source calls/highlights verified without database access.",
  );
}
async function smoke() {
  await checkSources();
  // Snapshot counts before and after the already rollback-contained SQL exercises.
  const before = await sqlRun(
    "SELECT (SELECT count(*) FROM users) users,(SELECT count(*) FROM bookings) bookings,(SELECT count(*) FROM booking_audit) audit",
  );
  const functions = await sqlRun(sql.functions);
  if (functions.rows.length !== 7)
    throw Error("Expected seven project-defined functions");
  await sqlRun(sql.constraints);
  await sqlRun(sql.indexes);
  const days = await sqlRun(sql.recursive);
  if (days.rows.length !== 7) throw Error("Expected seven recursive dates");
  await sqlRun(sql.vector);
  await sqlRun(sql.roles);
  await sqlRun(sql.rls);
  await sqlRun(sql.views);
  await sqlRun(sql.ddl, { sandbox: true });
  await sqlRun(sql.dml, { sandbox: true });
  await run(25);
  const after = await sqlRun(
    "SELECT (SELECT count(*) FROM users) users,(SELECT count(*) FROM bookings) bookings,(SELECT count(*) FROM booking_audit) audit",
  );
  if (JSON.stringify(before.rows) !== JSON.stringify(after.rows))
    throw Error("SQL before/after counts differ");
  await run(14);
  await run(15);
  console.log(
    "PASS: SQL/Mongo read-only inspections, seven project functions, seven recursive dates, vector search and rollback demonstrations; user/booking/audit counts unchanged. Mongo RUD option 16 was not run.",
  );
}
try {
  if (process.argv.includes("--smoke")) await smoke();
  else if (process.argv.includes("--check")) await checkSources();
  else await main();
} catch (error) {
  console.error("DEMO ERROR:", safeError(error));
  process.exitCode = 1;
}
