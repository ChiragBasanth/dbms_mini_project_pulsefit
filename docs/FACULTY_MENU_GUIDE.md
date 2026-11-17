# Interactive DBMS faculty menu and source navigation

The complete working program is [pulsefit-demo-menu.mjs](../pulsefit-demo-menu.mjs). Open the repository folder in VS Code, start the existing local database runtime as described in [SETUP.md](SETUP.md), open PowerShell at the repository root and run:

```powershell
node .\pulsefit-demo-menu.mjs
```

Enter 1–26, read the source excerpt and live result, then press Enter to return. Enter 0 to exit. The menu uses the **source checkout** for code excerpts and an already configured **local database runtime** for live output; it does not start services, migrate, reseed or deploy the application.

## Configuration and safety

A normal supported checkout uses its own installed npm dependencies and private .env. The existing two-directory arrangement is also supported automatically: pulsefit-main-audit supplies source while its configured sibling pulsefit supplies dependencies/.env and portable services. Neither a Windows username nor a dated workspace path is embedded in the program. Explicit overrides, if needed, are PULSEFIT_SOURCE and PULSEFIT_RUNTIME; these are local directory paths, not credentials. Existing process environment variables take precedence over dotenv defaults.

DATABASE_URL is the existing maintenance/demo connection used for catalog inspection and rollback-contained demonstrations. MONGODB_URI and MONGODB_DB select MongoDB. This menu accepts only loopback hosts and database names pulsefit/pulsefit_test; it refuses arbitrary remote servers or database names before connecting. Keep all credentials in private environment configuration. Errors redact connection URLs; .env values/passwords/session secrets are never displayed. The application continues to use its separate restricted APP_DATABASE_URL and RLS model; this maintenance menu is not an application authorization boundary.

SQL inspections use BEGIN READ ONLY. Options 4/5 use temporary tables inside a transaction that always rolls back. Option 25 executes the real course_demo.sql, validates BEGIN/final ROLLBACK and absence of COMMIT, and attempts ROLLBACK even on error. It may temporarily create fixture user/profile rows inside that transaction; they are not committed. No persistent schema changes occur.

Mongo options 14/15 read only. Option 16 requires typing DEMO and operates exclusively on a unique pulsefit_faculty_demo_<pid>_<timestamp> collection, not workout_logs; its finally block attempts removal. An abrupt process kill or cleanup failure may leave that disposable collection, so verify the displayed outcome. Do not confuse this isolated collection demonstration with the application's workout ownership/validation tests.

Option 12 lists only the seven named PulseFit functions and excludes extension-owned functions via pg_depend; pgvector's hundreds of helpers are not faculty-facing project functions. Option 15 explains that an empty aggregation array is the correct result when no workout_logs exist. Save a real disposable workout through the member UI for nonempty analytics; no menu reseeding is needed.

## 26-option Explorer reference

Paths below are exact repository-relative **VS Code Explorer paths**. Click/open the file in Explorer and highlight the named statement/function. No shell commands are required to open files. The menu also prints matching source excerpts. Live catalog inspection proves object existence, not a fresh execution of every stored function or authorization rejection.

| Menu | What it demonstrates | VS Code Explorer path | Statement / code to highlight | What live output proves |
|---|---|---|---|---|
| 1 | PostgreSQL table creation | database/postgres/migrations/001_core.sql | CREATE TABLE users and following domain tables | Actual public base-table names; schema_migrations is infrastructure |
| 2 | PK/FK/CHECK/UNIQUE/exclusion | database/postgres/migrations/001_core.sql | trainer_availability, bookings and typed profile constraints | Real pg_constraint definitions, not diagram-only claims |
| 3 | Indexes | database/postgres/migrations/001_core.sql | one_confirmed_booking_per_slot; GiST exclusion; lookup indexes | Existing partial/GiST/B-tree definitions |
| 4 | CREATE/ALTER/DROP | database/postgres/queries/course_demo.sql; pulsefit-demo-menu.mjs | CREATE TEMP TABLE; ALTER TABLE; DROP TABLE; sql.ddl | Temporary structure works; rollback leaves no saved changes |
| 5 | INSERT/SELECT/UPDATE/DELETE | database/postgres/queries/course_demo.sql; pulsefit-demo-menu.mjs | INSERT INTO ddl_demonstration; sql.dml | Before/after temporary rows and rollback |
| 6 | Actual SQL reads | pulsefit-demo-menu.mjs | sql.real; users GROUP BY role; exercise/bookings SELECT | Current stored role/catalog/status counts |
| 7 | INNER/LEFT JOIN | database/postgres/queries/course_demo.sql | SELECT b.id,m.name; LEFT JOIN bookings | Joined booking context and zero-booking members where present |
| 8 | Nested subquery | database/postgres/queries/course_demo.sql | Explicit nested subquery; nested IN | Results follow independent nested membership tests; empty is valid |
| 9 | Correlated subquery | database/postgres/queries/course_demo.sql | Correlated EXISTS; outer t.user_id and s.id | Trainers with future open unoccupied slots |
| 10 | Recursive SQL/CTE | database/postgres/queries/course_demo.sql | WITH RECURSIVE training_days; day+1 termination | Exactly seven planning dates, including zero-capacity days |
| 11 | Ordinary CTE/aggregation | database/postgres/queries/course_demo.sql | WITH totals AS; avg(total) | Confirmed-booking groups compared to average; empty is valid |
| 12 | Stored functions | database/postgres/migrations/001_core.sql; database/postgres/migrations/003_database_authorization.sql | reserve_slot FOR UPDATE; request_actor/request_has_role/app_reserve_slot; sql.functions in menu | Seven project functions exist; excludes extension helpers; does not invoke reservation |
| 13 | Triggers/audit | database/postgres/migrations/001_core.sql | booking_validation; booking_changes; availability_guard | Installed definitions and existing audit rows, if any |
| 14 | Mongo creation/validator/indexes | database/mongo/setup.ts | validator.$jsonSchema; setup createCollection/collMod/createIndex | Collection/validator/index presence and document count; no creation performed by this option |
| 15 | Mongo read/aggregation | src/lib/workouts.ts; pulsefit-demo-menu.mjs | progressPipeline; option 15 $group by workoutType | Actual collection summaries; empty collection returns empty totals. Full member/date/volume analytics use production progressPipeline/UI |
| 16 | Mongo RUD | pulsefit-demo-menu.mjs; database/mongo/setup.ts | case 16 insertOne/findOne/updateOne/deleteOne; finally drop | Typed approval permits isolated disposable-collection CRUD; workout_logs untouched |
| 17 | pgvector extension/storage | database/postgres/migrations/001_core.sql | CREATE EXTENSION vector; trainer/exercise vector(384) columns | Installed vector/btree_gist, embedding columns and populated exercise count |
| 18 | Vector similarity | database/postgres/queries/semantic_search.sql; pulsefit-demo-menu.mjs | embedding <=> query; sql.vector using a stored genuine reference embedding | Ranked cosine similarity; self-match normally 1.0000. UI goals use generated query embeddings |
| 19 | Authentication roles/RLS flags | database/postgres/migrations/003_database_authorization.sql; src/lib/auth.ts | ENABLE ROW LEVEL SECURITY; session/role lookup | Existing roles and RLS-enabled table flags; flags alone do not prove denied access |
| 20 | RLS policies | database/postgres/migrations/003_database_authorization.sql; tests/rbac.test.ts | CREATE POLICY member_read/booking_cancel; restricted-login negative tests | Installed policy predicates; run the documented RBAC test separately for actual rejection proof |
| 21 | API/backend integration | src/app/api/[...path]/route.ts; src/lib/db.ts; src/lib/auth.ts | API handlers; queryAs transaction actor; mongo connection; session verification | Displays actual integration source; no live user mutation performed |
| 22 | Next.js frontend integration | package.json; src/components/Portal.tsx | dev/start scripts; Portal member/trainer workflows | HTTP status for localhost:3000 if already running; browser role login still required |
| 23 | Technology justification | database/postgres/migrations/001_core.sql; database/mongo/setup.ts; database/postgres/queries/semantic_search.sql | SQL integrity, embedded workout model, cosine retrieval | Source-backed explanation of database choices, not a new runtime test |
| 24 | GitHub/documentation/originality | docs/CONTRIBUTIONS.md; docs/ER_DIAGRAM.md; docs/RELATIONAL_SCHEMA.md; docs/LEVEL3_FINAL_REPORT.md; docs/DEMO_SCRIPT.md | Contribution evidence and canonical approved diagrams | Required documentation presence and repository URL; students must confirm genuine work |
| 25 | Complete course SQL | database/postgres/queries/course_demo.sql | BEGIN through ROLLBACK; DDL/DML/JOIN/CTE/nested/correlated/recursive queries | Real source script executes with rollback; no data is committed |
| 26 | SQL reporting views | database/postgres/migrations/001_core.sql; database/postgres/migrations/003_database_authorization.sql | upcoming_bookings/trainer_utilization; occupied_slots; security_invoker | Actual pg_views definitions |

## Non-destructive verification commands

```powershell
node --check .\pulsefit-demo-menu.mjs
node .\pulsefit-demo-menu.mjs --check
node .\pulsefit-demo-menu.mjs --smoke
```

--check iterates all 26 branches in source-only mode, verifying 29 actual source calls/highlights without database access. --smoke adds live read-only SQL/Mongo checks, seven project functions, seven recursive dates, stored-vector ranking, policies/views and rollback-only options 4/5/25. It compares user/booking/audit counts before and after; it never runs option 16. Use it only against the already configured isolated localhost demo runtime.

Fresh approval-stage verification: syntax/source checks passed; localhost SQL/Mongo smoke passed; seven project functions returned; recursive report returned seven dates; DDL/DML/full-course rollback completed and user/booking/audit counts were unchanged. workout_logs contained no documents, and option 15 correctly explained empty totals. Mongo RUD was intentionally not executed. No migrations/reseeding or application source changes were needed. See PR #5 for published commit/check status; manual browser/viva understanding remains student work.
