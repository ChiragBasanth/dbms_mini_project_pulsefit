# PulseFit — DBMS Level 3 final audit and demonstration handoff

Audit date: 16 November 2026, Asia/Calcutta. Team: **Chhavi S — PES1UG24CS132; Chirag Basanth — PES1UG24CS133**. This is the current technical report. Older PDF/DOCX reports and top-level evidence logs are historical snapshots; they do not include migration 003 or the current tests.

## Problem, objectives, scope and requirements

PulseFit addresses conflicting trainer reservations, member/trainer identities, flexible workout tracking, performance summaries and semantic trainer/exercise discovery. Objectives are durable database-backed workflows, concurrency-safe reservations, meaningful SQL/NoSQL/vector integration and demonstrable authorization. Scope is a functional localhost academic system, without payments, password reset, public hosting or distributed cross-store transactions. Functional requirements are registration/login, profiles, trainer discovery, availability, booking/cancellation/history, workout CRUD, analytics, goal matching and role dashboards.

## Initial evidence-based gap analysis

The supplied workspace contained only work/ and outputs/. A fresh clone of the original repository had clean main at **92499a3cbd21a2d1da249e77e08af5a04e2fafc7**, origin **ChiragBasanth/dbms_mini_project_pulsefit**, not the fork. A prior local checkout under the November 1 workspace was on fix/pulsefit-final-submission-audit at fd516e9 with uncommitted source, test, documentation and evidence changes. It was inspected and preserved untouched. Its validation fix and related assertions were carried forward with provenance in CONTRIBUTIONS.md.

Discovery covered the tracked directory inventory, README/package/lock/config/environment example, src pages and Portal, catch-all API, libraries, ordered migrations, all SQL/Mongo demo scripts, model/seed/migration/runtime scripts, tests and relevant docs/evidence. Git logs and commit file scopes were inspected; PR #1 metadata was fetched from GitHub. No AGENTS.md was found in the inspected project paths.

| Hypothesis | Source evidence before changes | Resolution |
|---|---|---|
| Conflicting SQL models | scripts/migrate.ts applies only database/postgres/migrations; database/sql/001_schema.sql had 128D, different tables/columns | Preserve originals in database/legacy/sql; old entry points fail clearly; active 384D migrations unchanged except additive 003 |
| Broken runbook | Docker Compose and seed:vectors absent from package scripts; old account names/identity commands | Replace with native/portable supported npm commands, private passwords, feature-branch workflow |
| Missing correlated query | Correlated EXISTS already in API availability and trainer recommendation SQL | Add an explicit executable, commented course example; preserve API implementation |
| Missing recursion | No WITH RECURSIVE in active examples | Seven-date capacity report, joined to actual slots, with seven-date assertion in I06 |
| Database authorization | API role checks and profile FKs existed; no restricted app connection or RLS | Migration 003, restricted runtime logins, actor transactions, guarded reservation wrapper and actual-login negative tests |
| Contribution claims | Docs said pending/no history despite real commits and PR | Record verifiable commit/PR/file evidence and disclose attribution limits |
| Mongo/API mismatch | Zod accepted duration/distance below Mongo minimum 0.001 | Preserve prior local fix plus U09 and HTTP rejection assertion |
| Stale supporting docs | Lowercase schema/dictionary, architecture and Mermaid described 128D | Point aliases to canonical docs and replace architecture/diagram source |

## Stack, justification and architecture

Next.js 16.4.3 App Router, React 19.2, TypeScript, parameterized pg, MongoDB driver, Zod, bcryptjs and jose. Lockfile-installed Node/npm dependencies were used. PostgreSQL handles relationships and transactional integrity; MongoDB embeds variable exercise/set structures and computes real aggregation; pgvector keeps text embeddings next to SQL metadata without another hosted service. Frontend pages call a Node-only API, which authenticates, validates, checks permissions and queries databases. See architecture/overview.md.

The backend uses APP_DATABASE_URL, a non-owner NOSUPERUSER/NOBYPASSRLS login. DATABASE_URL remains the private migration/seed owner. The API rejects a privileged runtime connection. queryAs sets the verified session UUID locally inside BEGIN/COMMIT, with ROLLBACK/release on failure; RLS resolves the actor role from users. The backend credential remains a trusted boundary: it can supply actor context, so this is defense against omitted ownership filters, not compromised-backend arbitrary SQL. Mongo owner filtering remains in the API. See SECURITY_AND_CONSISTENCY.md for exact limits.

## Compliance matrix

PASS means supported source and the stated executed evidence; PARTIAL identifies human or artifact limitations. Runtime proof is only for this local environment, not production scale.

| Faculty deliverable | Status | Supporting files/functions | Executed evidence / limitation |
|---|---|---|---|
| ER diagram | PASS | ER_DIAGRAM.md; database-design/pulsefit-er-crows-foot.svg/png; Mermaid companion | 17 Nov design revision: all 41 business columns, correct IE cardinalities and identifying/non-identifying connectors; live catalog/source/visual checks in database-design/VALIDATION.md |
| Relational keys/relationships/constraints | PASS | RELATIONAL_SCHEMA.md; database-design/pulsefit-relational-schema.svg/png; DATA_DICTIONARY.md | Separate physical diagram and full column/default/constraint catalog; six FKs, nonminimal superkeys, partial uniqueness and normalization exceptions verified |
| SQL DDL including CREATE/ALTER/DROP | PASS | migrations; queries/course_demo.sql | I06 executes temporary DDL and rollback-protected domain DML |
| NoSQL/vector creation | PASS | database/mongo/setup.ts; migration 001 | db:mongo, db:migrate; I07/I08 |
| Technology justification | PASS | this report; architecture/overview.md; viva-notes.md | Matches actual source and real service runs |
| DML INSERT/UPDATE/DELETE/SELECT | PASS | course_demo.sql; API; Mongo demo | I06/I07/A01; real persistent database operations |
| Nested/correlated/recursive/JOIN queries | PASS | course_demo.sql; API availability/recommendations | I06 executes course SQL and asserts seven distinct dates |
| GROUP BY/HAVING/ORDER BY/aggregates | PASS | course_demo.sql; utilization view; progressPipeline | I06/I07; known aggregate values |
| Functions/procedures, triggers and CTEs | PASS | reserve_slot, app_reserve_slot, validate_booking, audit_booking, protect_availability; course CTEs | I02/I03/I06/R01; stored functions satisfy function/procedure requirement |
| Transactions, views and indexes | PASS | migrations; registration; queryAs; seed/migration scripts | Concurrency, rollback, audit and actual build/API runs |
| NoSQL/vector features and RUD | PASS | workout API, setup, progressPipeline; embedding and vector SQL | I07 actual CRUD/validator/analytics; I08 and A01 populated SQL vector results |
| Functional Next.js interface | PASS | src/app; src/components/Portal.tsx | Production build; 11-page smoke; current member/trainer/recommendation browser observations |
| Backend/API/database integration | PASS | src/app/api/[...path]/route.ts; src/lib/db.ts | A01 entire persisted HTTP workflow |
| Frontend + two-role authentication | PASS | Portal; auth.ts; route requireUser | bcrypt unit test; A01 both logins, role denials; genuine current role screenshots |
| Database-enforced RBAC | PASS | migration 003; rbac.ts; appSql/assertRuntime/queryAs | R01 actual restricted password login, direct SQL grants/policies/ownership/reset checks |
| Database integrity and booking concurrency | PASS | 001 constraints/triggers; reserve_slot | Eight independent connections: 1 winner, 7 SQLSTATE 23505; overlap 23P01; HTTP 201/409 |
| Secure passwords/environment variables | PASS | validation.ts; auth.ts; .env.example; ignored .env | U03 hash checks; validation; no current secret values in source/evidence |
| At least two paradigms and four advanced concepts | PASS | PostgreSQL, MongoDB, pgvector; transactions/functions/triggers/views/CTEs/RLS/indexes | Local service integration and HTTP evidence, beyond simple CRUD |
| Documentation/screenshots/testing | PASS | current report; SETUP/runbook/demo/viva; dated evidence and screenshots | Current raw results and four browser captures; older artifacts explicitly dated |
| Git/GitHub | PASS locally; publication recorded separately | Feature branch and meaningful commits, original history retained | Fork accessible by Git; final publication result in GIT_HANDOFF.md |
| Originality/individual contribution/modification/viva | PARTIAL | CONTRIBUTIONS.md; Git/PR evidence; current modifications | Attribution reconstructed; independent manual work, student understanding and instructor policy require human confirmation |

## Implementation summary and compatibility

Already implemented: complete Next.js role portals, parameterized APIs, signed sessions, bcrypt, typed PostgreSQL profiles, atomic booking, exclusion/partial unique indexes, triggers/views, Mongo validator/CRUD/analytics, real MiniLM/pgvector, seeds and tests. Preserved the existing lock/function booking algorithm, model, 384 dimensions, UI styling and legitimate Git history.

Added/fixed: additive RLS migration and restricted application connection, explicit grants, protected function wrapper, pool-local actor scope, runtime bypass check, actual-login RBAC tests, explicit correlated/nested/recursive SQL, recursive result assertion, populated exercise/trainer API recommendation assertions, validation parity from prior local work, canonical schema/runbook/architecture and contribution evidence, dated verification runner, demo/viva handoff.

Compatibility change: HTTP requests now require the restricted APP_DATABASE_URL and migration 003; run db:migrate then db:rbac before restarting. Test HTTP uses TEST_APP_DATABASE_URL and a seeded/embedded test catalog. The maintenance owner continues to run migrations/seeds and existing owner integration fixtures. Applied migrations 001/002 were not edited, preserving recorded checksums. Old 128D entry points intentionally fail with canonical-path guidance; their original contents remain in legacy. The portable service helper preserves generated restricted URLs on restart.

Clean-setup verification: db:rbac provisions the demo login alone; test provisioning explicitly adds --with-tests after both databases are migrated. verify:final setup adds that flag automatically. A final check supplied an unreachable TEST_DATABASE_URL and confirmed demo-only provisioning still succeeded; full setup and R01 were rerun successfully after this repair. See demo-only-rbac.txt and the refreshed setup.json.

## Actual module inventory

These are nine logical areas sharing Portal and one catch-all route, not nine isolated services. Generic /[view] pages select the supported screen; trainer detail has its own dynamic page. There is no middleware file in the active src implementation; authorization is enforced by the server API and SQL policies.

| Module | Frontend | API | Database interaction | Coverage |
|---|---|---|---|---|
| Authentication/RBAC | /login, /register; Portal auth | /api/auth/register, login, logout; /api/me | users + typed profile transaction; signed cookie; DB role lookup | U01–U03/U09, A01, R01, smoke |
| Profiles | /dashboard; trainer cards | PUT /api/profile | Own goals/bio/specialties/experience; trainer embedding; RLS | A01 trainer update; R01 ownership |
| Trainer discovery | /trainers, /trainers/[id] | GET /api/trainers[/id] | users JOIN trainer_profiles; bound text search | A01 injection search; smoke; earlier/current UI |
| Availability | /availability | GET/POST /api/availability; DELETE /api/availability/id | Actual slot insert/close; exclusion and trigger; capacity view | I04, A01, R01; current screenshot |
| Booking/history/cancel | /bookings, /appointments | GET/POST /api/bookings; DELETE /api/bookings/id | guarded atomic reservation; own future cancellation; audit | I01–I06, A01, R01 |
| Workout management | /workouts | GET/POST /api/workouts; GET/PUT/DELETE /api/workouts/id | Actual Mongo workout_logs owner CRUD, date/type filters | U05/U06/U09, I07, A01 |
| Performance analytics | /analytics | GET /api/analytics | Mongo aggregation through progressPipeline | I07 exact 350-volume and cardio/session values; A01 |
| Semantic recommendations | /recommendations | POST /api/recommendations | Real MiniLM inference, SQL cosine exercise/trainer ranking; goals update | I08; A01 populated scores; current browser search |
| Role dashboards | /dashboard | /api/me, bookings and profile | Real role-specific booking lists and trainer profile writes | A01, smoke; current member/trainer captures |

## Database feature inventory, schema and dictionary

Canonical details: [relational schema](RELATIONAL_SCHEMA.md), [dictionary](DATA_DICTIONARY.md), [ER diagram](ER_DIAGRAM.md), [hybrid architecture](HYBRID_DATA_MODEL.md), [editable figures](database-design/README.md) and migrations. The 17 November documentation-only design revision is validated in [database-design/VALIDATION.md](database-design/VALIDATION.md); it does not change the dated runtime audit results. PostgreSQL has seven domain tables plus migration metadata:

| Table | Keys and main constraints |
|---|---|
| users | UUID PK, UNIQUE email, UNIQUE(id,role), name length, normalized email, hash length, MEMBER/TRAINER role, created_at default |
| member_profiles | user_id PK; composite (user_id,role) FK to users; fixed MEMBER; goal length ≤2000 |
| trainer_profiles | user_id PK; typed FK; fixed TRAINER; bio length; experience 0–80; location length; specialties array; nullable vector(384)/model |
| trainer_availability | UUID PK; trainer FK; UNIQUE(id,trainer_id); OPEN/CLOSED; positive ≤4h range; GiST trainer/range exclusion; trigger future-window/immutability |
| bookings | UUID PK; member FK; composite slot/trainer FK; CONFIRMED/CANCELLED; created_at default; one confirmed reservation per slot |
| booking_audit | Identity bigint PK; booking FK; status transition and timestamp fields |
| exercises | UUID PK; UNIQUE name; required description/muscle group; category/difficulty checks; nullable vector(384)/model |
| schema_migrations | name PK, checksum, applied_at; migration metadata rather than business entity |

Primary/unique constraints create their indexes. Explicit indexes: one_confirmed_booking_per_slot (partial UNIQUE), bookings_member_date, bookings_trainer, availability_trainer_date; exclusion creates GiST index. No ANN vector index is claimed for this small catalog. Views: upcoming_bookings, trainer_utilization (security_invoker), occupied_slots (owner view exposes only confirmed slot IDs). RLS tables: both profiles, availability, bookings and audit. Runtime grants restrict columns and forbid direct booking insert, users/role updates and audit writes/deletion.

Functions: validate_booking, audit_booking, reserve_slot, protect_availability, request_actor, request_has_role, app_reserve_slot. Triggers: booking_validation, booking_changes, availability_guard. CTEs: course fixture INSERT RETURNING, totals aggregation, recursive training_days. Correlation: future open trainer slots with nested NOT EXISTS occupied reservation; API also uses capacity correlation. Explicit nested IN and INNER/LEFT JOIN examples use actual domain relations. COMMIT occurs in migration/seed/registration/queryAs; rollback behavior is tested by I06 and the course script.

MongoDB collection workout_logs: ObjectId _id; PostgreSQL UUID-string userId; BSON dates performedAt/createdAt; workoutType enum; notes; exercises[{name,sets[{reps?,weight?,duration?,distance?}]}]. Strict JSON Schema requires nonempty bounded exercise/set arrays, reps or duration, positive integer reps, nonnegative bounded kg, and minimum 0.001 duration/distance. Compound indexes (userId,performedAt DESC) and (userId,workoutType,performedAt DESC). Creation/setup is real MongoDB, not a SQL/in-memory replacement. Pipeline: owner/date $match then $facet sessions and volume; sessions $group/$sort/$project by UTC date; volume unwinds exercises and sets then aggregates reps×weight, seconds/metres with $ifNull. I07 tests inserts/reads/updates/deletes, ownership, validation code 121 and exact totals.

pgvector: vector extension, exercise and trainer vector(384) columns, embedding_model metadata. Xenova/all-MiniLM-L6-v2 q8 inference, mean pooling, normalization; preprocessing trims/collapses whitespace and lowercases. db:embed generates exercise name/description and trainer bio/specialty vectors. API embeds the goal then SQL ORDER BY embedding <=> query LIMIT 5, returning 1-distance. Exercises support category filter; trainers require future OPEN unoccupied slots. No silent model/dimension change, random vectors or keyword-only fallback. I08's paraphrase similarities were ~0.4066 aerobic versus ~0.1472 strength. A01 retrieved cardio exercises (~0.7114/~0.6305) and the saved trainer (~0.7981).

## Verification report

Environment: Windows, Node v26.13.0, npm 11.20.0, actual portable PostgreSQL 18.6 + pgvector 0.8.7 + btree_gist, actual MongoDB executable from the prior local setup. Fresh project-owned database directories were initialized; prior user checkout and database state were not modified. Cached genuine MiniLM model and matching native binaries were reused, not fabricated. Native DLL and model compatibility were established by successful actual execution.

Current raw outputs: **evidence/level3-2026-11-16/**. setup.json/checks.json/http.json have exact commands, UTC timestamps and exit codes. These are separate from older November 1 logs. Current reported automated counts: 9 unit + 8 integration (including parent/subtests) + 1 RBAC + 1 HTTP workflow + 1 smoke = **20 reported tests, zero failures/skips**. Multi-assertion workflows are not counted as invented independent tests.

| Executed command | Actual result |
|---|---|
| npm.cmd ci --no-audit --no-fund; final repair with --ignore-scripts | Final installation exit 0, 458 packages. Earlier sandbox attempt had EPERM and left packages unavailable; repaired before checks. Existing required native artifacts loaded successfully |
| npm run verify:final -- setup | Exit 0. Both DBs migrated; Mongo initialized; both catalogs seeded/embedded; restricted passwords verified and private URLs saved |
| npm run typecheck | Exit 0 |
| npm run lint | Exit 0 |
| npm test | Exit 0, 9 pass, 0 skip |
| npm run test:integration | Exit 0, 8 reported pass, 0 skip; real SQL/Mongo/vector |
| npm run test:rbac | Exit 0, actual restricted login, all negative and positive assertions |
| npm run build | Exit 0; optimized Next.js production build and route generation |
| npm run test:server | Production server started localhost:3001 with disposable test databases |
| npm run verify:final -- http | Exit 0; test:api and test:smoke each pass; HTTP concurrency 201/409 and populated vector matches |
| Browser local member/trainer login and goal matching | Both portals and saved trainer availability observed; ranked exercise/trainer results observed and captured |
| Production demo startup and both seeded logins on localhost:3000 | Actual demo database connection and MEMBER/TRAINER login returned 200; HttpOnly/Secure flags checked; credentials/cookies omitted from evidence |
| git diff --check | No whitespace errors at check time; final Git state recorded separately |

Sandbox limitations were resolved with approved local execution: initial Git DNS failure, npm EPERM, and database loopback EACCES were not relabeled successes. The final successful commands ran with service/network access. Historical installation/build failures remain distinct from current passing logs. No public deployment, production-scale load/TLS testing, cross-store atomicity, exhaustive semantic relevance or independent student authorship was verified.

## Screenshots, demonstration and viva

Fresh captures in screenshots/level3-2026-11-16/: member-dashboard.jpg, trainer-dashboard.jpg, trainer-availability.jpg, semantic-recommendations.jpg. They show the current production app with fictitious test fixtures. Other screenshot files are existing historical evidence. Fresh console/DB-GUI screenshots were not captured; raw SQL/Mongo/vector and test outputs provide executable evidence. If the faculty requires GUI-console images, capture the RLS failure, overlap conflict, concurrency output, Mongo aggregation and vector query using the checklist; do not manufacture them.

Use DEMO_SCRIPT.md for 10–15 minutes; live-evaluation-runbook.md for exact commands; viva-notes.md for database concept answers. Both students must rehearse all modules. CONTRIBUTIONS.md records real evidence and manual confirmation limits. Existing report binaries are not regenerated or represented as current.

## Setup, recovery, Git and remaining actions

SETUP.md documents native prerequisites and optional project-local real database processes. Environment variable names: DATABASE_URL, APP_DATABASE_URL, TEST_DATABASE_URL, TEST_APP_DATABASE_URL, MONGODB_URI, MONGODB_DB, TEST_MONGODB_URI, TEST_MONGODB_DB, SESSION_SECRET, APP_ORIGIN, EMBEDDING_MODEL, EMBEDDING_CACHE, SEED_PASSWORD; optional PORTABLE_SERVICES/PULSEFIT_PG_PORT and test-origin/fixture flags. No secret values belong in submission. Never replace a working private .env with the example. Use db:migrate → db:rbac → db:mongo → db:seed → db:embed, or verify:final setup for both DBs. Build then start; run services in a separate terminal for portable databases. Preserve project data on restart; expired slots require trainer-created availability.

Branch: feature/chhavi-dbms-level3-demo-readiness. Origin is original ChiragBasanth repository; fork remote is the user-confirmed chhavi2308-s repository, verified accessible through git ls-remote with matching main baseline. GitHub connector returned 404 for the fork even though Git succeeded; publication uses available Git transport. Repository-local identity is chhavi2308-s / chhavi.s2308@gmail.com. No historical author rewrite, force push, original-main push or automatic merge. See GIT_HANDOFF.md for actual final commits/push/PR result and fallback commands.

**Current status addendum:** PR #2 merged into original main at e63dd87c8f221659dc7eda2c867e11e897958a0b on 16 November 2026. Current teammate execution and viva instructions are TEAMMATE_EXECUTION_CHECKLIST.md and FINAL_VIVA_PREPARATION.md.

Historical publication observation, before that merge: fork feature branch pushed; [PR #2](https://github.com/ChiragBasanth/dbms_mini_project_pulsefit/pull/2) is OPEN and MERGEABLE, not merged. Implementation commit e567352; documentation/evidence commit 8e0c478; final status commit available in Git. The demo app was started on localhost:3000 and both seeded role logins were verified against its real databases.

Remaining human actions: inspect/review the PR or local changes, confirm actual personal contributions and institutional AI/originality policy, rehearse and perform viva, capture additional console screenshots if required. A clean machine still needs installed compatible database extensions/executables and initial model access. Public deployment is not required.

## Conclusion and future enhancements

The local implementation now has one explicit canonical database model, genuine SQL/NoSQL/vector integration, tested booking contention, database-enforced role/ownership restrictions, explicit advanced query demonstrations and reproducible demo guidance. Academic contribution certification and the live student presentation remain human responsibilities. Future work includes shared login throttling, session revocation/reset, account lifecycle reconciliation across stores, pagination, broader semantic relevance tests, immutable model revision pinning and measured ANN indexing at larger scale.

Reference for RLS ownership/bypass behavior: https://www.postgresql.org/docs/current/ddl-rowsecurity.html. The implemented role checks and tests account for owners/superusers normally bypassing row policies.
