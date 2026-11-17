# Chirag's independent execution and demo checklist

**Chirag Basanth — PES1UG24CS133:** run these steps yourself on your laptop. Chhavi should also rehearse them. Codex's earlier successful runs are background evidence, **not your manual PASS results**. Leave result cells blank until you execute each check. Do not submit passwords, cookies or .env in screenshots.

PR #2 merged into original main at `e63dd87c8f221659dc7eda2c867e11e897958a0b`. This follow-up guide must be merged before a normal main-branch clone includes it. For pre-merge review, use the follow-up PR branch and record its SHA; do not claim it is already main.

## 1. Record your environment first

| Item | Chirag's actual value |
|---|---|
| Student / date / local time and timezone | |
| Commit SHA: `git rev-parse HEAD` | |
| OS/version | |
| Browser/version | |
| `node --version` / `npm.cmd --version` | |
| `psql --version`; server `SELECT version();` | |
| Mongo server `db.version()` | |
| PostgreSQL pgvector/btree_gist versions | |
| Errors and evidence folder location | |

Keep your own screenshots and completed checklist outside tracked docs, for example an ignored `work/chirag-verification/` folder. Do not overwrite another person's evidence or prefill this template in the shared repository.

## 2. Clean Windows setup

### Prerequisites and administrator responsibilities

Install Git, Node.js 22+ with npm, PostgreSQL 16+ (18 is the tested major), matching pgvector and btree_gist, and MongoDB Community 7+. Install psql/pgAdmin and mongosh for console demonstration. A pgvector extension DLL must match PostgreSQL's major version and architecture; CREATE EXTENSION does not download/install the DLL. Follow [SETUP.md](SETUP.md), including the upstream Windows build link, rather than removing vector columns when an extension is missing.

The **PostgreSQL administrator** performs SETUP.md step 3: create `pulsefit` (non-superuser maintenance/object owner), `pulsefit_app` and `pulsefit_app_test` (restricted runtime logins), create `pulsefit`/`pulsefit_test` databases owned by the maintenance role, and enable both extensions in each DB. The recommended path keeps all three logins NOSUPERUSER/NOCREATEROLE/NOCREATEDB/NOBYPASSRLS. Runtime logins are also NOINHERIT and must not be members of the maintenance/admin role. The administrator uses interactive `\password`; runtime passwords are separate privately generated **48-character hex strings**.

Migrations/seed/embedding use DATABASE_URL as the maintenance owner. Next.js uses APP_DATABASE_URL as the restricted runtime. Test server uses TEST_APP_DATABASE_URL. With administrator-precreated runtime roles and explicit private URLs, `db:rbac` applies owner-granted table/column/function privileges without CREATEROLE. Do not put the administrator password in an application URL. Do not grant runtime superuser/BYPASSRLS.

MongoDB must actually be running. For installed Windows services, inspect names with `Get-Service *postgres*` and `Get-Service *mongo*`; start the selected installed service using Services or an administrator PowerShell. Service names/ports depend on the installation. Keep the local demo bound to loopback. If Mongo authentication is enabled, use your own authenticated URI; no committed/shared password is provided.

### Clone the original and install dependencies

After the handoff PR is merged:

```powershell
git clone https://github.com/ChiragBasanth/dbms_mini_project_pulsefit.git
Set-Location dbms_mini_project_pulsefit
git switch main
git pull --ff-only origin main
git status --short
git rev-parse HEAD
npm.cmd ci
Copy-Item .env.example .env
```

Copy the environment example **only once on a fresh checkout**. Never overwrite a working .env or someone else's uncommitted work. If PowerShell blocks npm.ps1, use `npm.cmd` as shown. Database/model/runtime data are not in the source repository.

### Fill private environment values

Edit .env locally. This example lists variable names and destinations; the placeholders are not usable passwords:

```dotenv
DATABASE_URL=postgresql://pulsefit:URL_ENCODED_OWNER_PASSWORD@127.0.0.1:5432/pulsefit
TEST_DATABASE_URL=postgresql://pulsefit:URL_ENCODED_OWNER_PASSWORD@127.0.0.1:5432/pulsefit_test
APP_DATABASE_URL=postgresql://pulsefit_app:PRIVATE_48_HEX_RUNTIME_PASSWORD@127.0.0.1:5432/pulsefit
TEST_APP_DATABASE_URL=postgresql://pulsefit_app_test:DIFFERENT_PRIVATE_48_HEX_PASSWORD@127.0.0.1:5432/pulsefit_test
MONGODB_URI=mongodb://127.0.0.1:27017
TEST_MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=pulsefit
TEST_MONGODB_DB=pulsefit_test
SESSION_SECRET=YOUR_PRIVATE_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
SEED_PASSWORD=YOUR_PRIVATE_DEMO_PASSWORD
APP_ORIGIN=http://localhost:3000
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
EMBEDDING_CACHE=./.cache/models
```

Generate SESSION_SECRET privately with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Choose an ASCII SEED_PASSWORD of 12–72 characters/bytes. URL-encode special characters in database passwords; runtime hex avoids that issue. No model API key is needed. Do not paste connection URLs into chat/screenshots. A system environment variable can override .env: check privately if the app connects to the wrong service.

### Initialize demo and disposable test databases

The administrator must already have created the two SQL databases/extensions and runtime roles. Then, as your normal Windows account in the repo:

```powershell
npm.cmd run verify:final -- setup
npm.cmd run verify:final -- checks
npm.cmd start -- --hostname 127.0.0.1
```

`verify:final -- setup` uses actual package scripts: migrates both SQL databases; initializes the demo Mongo validator/indexes; seeds/embeds both SQL catalogs; calls `db:rbac -- --with-tests`. `test:server` initializes test Mongo separately. `checks` runs typecheck, lint, unit, SQL/Mongo/vector integration, RBAC and build. Missing test configuration can cause skips: **a zero exit with skipped tests is not proof of completion**.

For only the demo DB, the individual order is `db:migrate`, `db:rbac`, `db:mongo`, `db:seed`, `db:embed`, `build`, `start`. No command named seed:vectors exists. Do not execute database/legacy or deprecated database/sql schema/seed files.

### Portable alternative

`npm.cmd run services` is supported as an optional developer helper. It starts real PostgreSQL and mongod, not in-memory arrays. It needs the matching pgvector native files and may need a downloaded mongod executable/model; these are **not bundled in Git**. Follow SETUP.md's exact file locations. On its first run do **not** copy .env.example first: the helper generates an ignored PORTABLE_SERVICES=1 configuration and refuses unrelated .env files. Keep its terminal running; use another terminal for setup/checks/app. Its default ports are 55432/57017. It has a development bootstrap owner; use the separate restricted runtime URLs it provisions via db:rbac. Do not copy portable service credentials between laptops.

## 3. Launch and prove database connectivity

Open **http://localhost:3000** using that exact host (APP_ORIGIN must match). Keep app and DB service terminals visible enough to notice errors, but hide credentials. A working landing page alone proves little.

1. Log in and load trainer discovery/bookings: these perform PostgreSQL reads.
2. Save a disposable workout, refresh and open Progress: these require MongoDB writes/reads/aggregation.
3. Run Goal matching: this requires actual model inference and PostgreSQL vector retrieval.
4. In browser DevTools Network, inspect status/data for `/api/me`, `/api/trainers`, `/api/bookings`, `/api/workouts`, `/api/analytics`, `/api/recommendations`. Do not screenshot Cookie/Set-Cookie headers.

If you use `npm.cmd run dev` instead of a production build, use the same origin and databases. Production cookies are Secure; use a current browser with localhost support. Do not disable cookie security to mask a connection problem.

### Troubleshooting

| Symptom | Check / safe recovery |
|---|---|
| 503 or refused connection | Confirm actual DB service, port, database name and private credentials; PostgreSQL and MongoDB are separate services |
| Port in use | Identify the process/service first. Reuse or stop only the project-owned process; do not kill unrelated processes. APP_ORIGIN must match any changed browser port |
| vector control/DLL missing | Verify PostgreSQL major/architecture and extension installation; administrator enables extensions in both databases |
| CREATE ROLE permission denied | Recommended path: administrator precreates runtime roles and you fill both runtime URLs. An empty runtime URL asks the helper to create a role; NOCREATEROLE correctly denies it |
| Unsafe runtime-login error | APP_DATABASE_URL must use the non-owner runtime login, never pulsefit/postgres/admin; do not remove RLS/permission checks |
| Password auth failure | Check the private URL/password mapping. db:seed does not reset an existing account's password |
| Migration checksum failure | Do not edit applied SQL or wipe data. Check checkout/line endings/history and use a new disposable test DB if rebuilding test fixtures; preserve existing demo data |
| Model unavailable | Allow initial genuine model download, verify cache access; rerun db:embed. No random-vector fallback exists |
| No future seed slots | Existing seed accounts/schedules are preserved on rerun. Trainer creates fresh nonoverlapping future slots |
| 403 mutation | Check exact Origin, login role and session; wrong-role actions are expected to fail |
| 409 booking/overlap | Refresh actual capacity; create a different slot. This is expected integrity enforcement |

## 4. Mandatory browser login and role checks

Use seed member `member@pulsefit.example` and a seed trainer such as `endurance@pulsefit.example`. Their initial password is **your private SEED_PASSWORD** used when the accounts were first seeded. Rerunning seed does not reset passwords. Alternatively register fresh fictitious MEMBER/TRAINER accounts yourself and record identifiers privately. Never use an old historical report's public demo password.

Actually perform: MEMBER login → member dashboard → logout → TRAINER login → trainer dashboard → logout → wrong password. Capture both role dashboards and the invalid-login error without showing passwords.

**Cross-role expectation:** role navigation differs, but URL shells may return 200 rather than redirect/403. As MEMBER manually visit `/availability` and try creating a harmless future slot: the backend must deny it (403); no row may be added. As TRAINER visit `/workouts`: private member logs must not appear and member-only requests must fail (403). A visible shell is not successful authorization. Anonymous `/api/bookings` must return 401. Do not mark the check PASS solely because a menu link is hidden.

## 5. Trainer and member booking workflows

1. Trainer logs in; Overview contains profile controls. Existing values are not prefilled in this version: first view the trainer card through Find a trainer, then deliberately enter the intended bio, comma-separated specialties and experience. Save; search/view the profile again to verify persisted text. Profile saving generates its real embedding.
2. Availability: choose a future interval within 90 days, lasting ≤4 hours. Save, reload the page and confirm it remains. Repeat an overlapping interval and verify conflict. Use a non-overlapping second interval if needed.
3. Member logs in in a separate browser profile. Search by trainer name/bio/specialty; these are the supported discovery filters. Open the correct trainer, select an open slot, book, and verify CONFIRMED history after refresh. There are no price/rating filters or approval queue to demonstrate.
4. The reserved slot should show Reserved/disabled. To see the actual concurrent rejection rather than only a disabled button, use two member sessions with the same stale slot, or run test:api/test:integration as described below; one succeeds and the other conflicts. Do not count a disabled button alone as concurrency proof.
5. Cancel your own future booking; refresh and verify CANCELLED history, audit transition and released capacity. Trainer checks Appointments/history. Bookings are immediate confirmations, not pending requests awaiting approval.
6. Trainer closes an unoccupied OPEN slot. Reload and verify CLOSED. Occupied slots cannot be closed. Time/trainer changes in an existing slot are unsupported; close it and create a **different non-overlapping** interval. Closed rows still participate in the exclusion constraint, so do not recreate the identical interval.

In a maintenance-owner psql session, inspect only fictitious demo data:

```sql
SELECT b.id,m.name member,t.name trainer,s.starts_at,b.status
FROM bookings b JOIN users m ON m.id=b.member_id
JOIN users t ON t.id=b.trainer_id
JOIN trainer_availability s ON s.id=b.slot_id ORDER BY b.created_at DESC;
SELECT * FROM booking_audit ORDER BY changed_at DESC;
```

Record the booking ID and statuses to connect UI actions with actual persisted SQL rows. Do not edit other people's reservations.

## 6. MongoDB workout CRUD and meaningful analytics

As a MEMBER open Workout journal. The JSON editor is the implemented form. Use a **past ISO timestamp on the day you choose for this demo**, and record that UTC date for filters. Example strength document:

```json
{
  "performedAt": "2026-11-15T10:00:00Z",
  "workoutType": "STRENGTH",
  "notes": "Disposable teammate demo",
  "exercises": [{"name":"Demo Squat","sets":[{"reps":10,"weight":20},{"reps":5,"weight":30}]}]
}
```

Replace the date as needed; future workouts are rejected. Save, refresh, confirm history persists, edit the note, save and refresh again. Add a separate CARDIO workout on the same chosen UTC day, using `{"name":"Demo Cycling","sets":[{"duration":600,"distance":1500}]}` as its exercise. Use seconds/metres, not minutes/kilometres. Use workout type/date filters and verify appropriate entries appear.

With only these **two** workouts in the selected range, Progress must show **2 sessions, volume 350 kg×reps (10×20+5×30), Cycling duration 600s and distance 1500m**. If other workouts exist, expect totals to include those too: choose a clean fixture account/range instead of asserting the hardcoded example totals. Filter to an empty day, expect zero sessions/volume, then restore the chosen date.

Get your member UUID from DevTools `/api/me` response, not a cookie. In mongosh connected to your actual local MongoDB database (example default):

```powershell
mongosh --host 127.0.0.1 --port 27017 pulsefit
```

Portable setup uses port 57017. Authenticated installations require their private connection configuration; do not paste passwords into shared commands. In mongosh substitute **your own fictitious fixture UUID**:

```javascript
const uid = 'YOUR_MEMBER_UUID';
db.workout_logs.find({userId:uid}, {userId:1,performedAt:1,workoutType:1,notes:1,exercises:1}).sort({performedAt:-1});
db.workout_logs.getIndexes();
db.getCollectionInfos({name:'workout_logs'})[0].options;
db.workout_logs.aggregate([
  {$match:{userId:uid}},
  {$unwind:'$exercises'}, {$unwind:'$exercises.sets'},
  {$group:{_id:'$exercises.name',volume:{$sum:{$multiply:[{$ifNull:['$exercises.sets.reps',0]},{$ifNull:['$exercises.sets.weight',0]}]}},duration:{$sum:{$ifNull:['$exercises.sets.duration',0]}},distance:{$sum:{$ifNull:['$exercises.sets.distance',0]}}}},
  {$sort:{volume:-1}}
]);
```

This is a read-only inspection pipeline over the user's fixtures. The application's `src/lib/workouts.ts:progressPipeline` additionally uses `$facet` to count sessions **before** unwinding sets, avoiding overcounting. For exact UI equivalence apply the same performedAt range, which the UI labels UTC. Capture document/aggregation outputs. Delete only your disposable cardio workout in the UI, refresh, confirm its ID disappears from MongoDB and totals decrease. Keep a disposable strength fixture if useful for the live demonstration.

Standalone collection CRUD/aggregation teaching script: connect mongosh to **pulsefit_test**, then `load('database/mongo/course_demo.mongosh.js')` from repository root. It refuses database names not ending `_test`, creates and removes its own fixture. Production-pipeline verification is `npm.cmd run test:integration` (I07), but Chirag must still do the browser workflow himself.

## 7. Semantic recommendations and pgvector

As MEMBER open Goal matching. Enter “I want better endurance and stamina without high impact jumping”, select CARDIO, run search and inspect ranked exercises/trainers. Trainer matches require a saved embedded bio and future OPEN unoccupied capacity. Model errors must not be treated as legitimate empty recommendations. DevTools POST `/api/recommendations` should return real results, model name and dimension; do not record session headers.

In PostgreSQL use genuine already generated **stored** MiniLM vectors to demonstrate the operator without hand-typing 384 values:

```sql
SELECT extname,extversion FROM pg_extension WHERE extname IN('vector','btree_gist');
SELECT embedding_model,vector_dims(embedding),count(*)
FROM exercises GROUP BY embedding_model,vector_dims(embedding);
SELECT name,1-(embedding <=> (SELECT embedding FROM exercises WHERE name='Steady cycling')) similarity
FROM exercises WHERE embedding IS NOT NULL
ORDER BY embedding <=> (SELECT embedding FROM exercises WHERE name='Steady cycling') LIMIT 5;
```

Expected: vector installed, dimensions 384, real ranked scores; cycling self-match approximately 1. This reference-vector query is not the free-text embedding step. The API uses `embed(goals)` from `src/lib/embedding.ts` and binds its genuine output to SQL `<=>`; exercise/trainer queries are in the recommendation branch of `src/app/api/[...path]/route.ts`. `database/postgres/queries/semantic_search.sql` only PREPAREs/deallocates unless you supply an actual generated vector for EXECUTE. Do not claim that running PREPARE alone displayed a semantic search.

## 8. SQL demonstration catalog — safe disposable data

Use a maintenance-owner psql connection to **pulsefit_test**. In psql, run `\conninfo` before any demo and keep password entry private. All statements in course_demo.sql run within BEGIN/ROLLBACK; DROP targets a temporary table, and domain DELETE targets only its generated fixture. Do not substitute a DROP of an application table.

```powershell
psql -h 127.0.0.1 -p 5432 -U pulsefit -d pulsefit_test -W -v ON_ERROR_STOP=1 -f database/postgres/queries/course_demo.sql
psql -h 127.0.0.1 -p 5432 -U pulsefit -d pulsefit_test -W -v ON_ERROR_STOP=1 -f database/postgres/queries/inspect.sql
```

Use your actual port. Native psql may need PostgreSQL's bin folder added to PATH. Migrations are applied by `npm.cmd run db:migrate`, not rerun blindly with psql on an initialized schema. For both demo/test migration use `verify:final -- setup` as above.

| Requirement | Actual script/object and expected explanation |
|---|---|
| CREATE / ALTER / DROP | course_demo: temporary ddl_demonstration creation, column addition and DROP; no business-table destruction |
| INSERT / SELECT / UPDATE / DELETE | course_demo: generated users/member_profiles fixture, changed goals/readback/removal, all rolled back |
| PK / FK / UNIQUE / CHECK / NOT NULL | inspect.sql lists constraints; migrations 001/002 define actual rules; typed profile and slot/trainer composite FKs enforce identity |
| JOIN / multiple tables | course_demo INNER JOIN booking/member/trainer/slot; LEFT JOIN keeps members with zero bookings |
| Nested subquery | course_demo nested IN, members booked with an embedded trainer; may be empty until you create a representative test booking |
| Correlated subquery | course_demo trainer EXISTS with inner s.trainer_id=t.user_id and occupied-slot NOT EXISTS |
| Recursive CTE | training_days returns exactly 7 planning dates, including days with zero capacity |
| Ordinary CTE | added uses INSERT RETURNING; totals groups confirmed bookings and compares average |
| GROUP BY / HAVING / ORDER BY / aggregates | course member counts and trainer totals; group rows vs HAVING group filtering; chronological date ordering |
| Stored functions | reserve_slot and app_reserve_slot; I02/R01 prove atomic reservation and role guard |
| Triggers | booking_validation, booking_changes, availability_guard; invalid writes rejected and audit transitions recorded |
| Views | upcoming_bookings, trainer_utilization, occupied_slots; reporting views use caller RLS; capacity view does not expose member identities |
| Transactions | course BEGIN/ROLLBACK; registration/queryAs/migrate/seed/provision use COMMIT on success, ROLLBACK on failure |
| Indexes | inspect.sql lists 17 SQL indexes including PK/unique/exclusion; partial one_confirmed_booking_per_slot is the capacity invariant |
| Similarity operator | Section 7's executable `<=>` query plus live free-text API |

To show populated test JOIN/nested outputs, first run the HTTP fixture test below against pulsefit_test; it retains fictitious users/bookings. Empty results are legal but are not as useful for explaining relationships. Do not invent an expected row where no matching data exists.

## 9. Database-enforced RBAC and concurrent booking

Prepare both test DBs/runtime URLs as above. Execute:

```powershell
npm.cmd run test:rbac
npm.cmd run test:integration
```

R01 connects using **TEST_APP_DATABASE_URL**, not the maintenance owner, and deliberately omits API ownership predicates. Expected: member/trainer forbidden operations raise **42501**, other-member booking SELECT/UPDATE returns zero rows, allowed owner reads/cancellation work, audit deletion/role mutation/direct maintenance function are denied, transaction actor clears on reuse. I02 releases eight separately acquired PostgreSQL connections together: **one winner and seven 23505 unique conflicts**. I04 rejects overlap with **23P01**. I03/I06 prove audit and rollback behavior. Check no skipped cases.

For a safe direct console denial, connect to **pulsefit_test** as pulsefit_app_test (your runtime password, NOT owner). Use fictitious seeded accounts only:

```sql
SELECT current_user,rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user;
BEGIN;
SELECT set_config('pulsefit.actor_id',(SELECT id::text FROM users WHERE email='member@pulsefit.example'),true);
INSERT INTO trainer_availability(trainer_id,starts_at,ends_at)
SELECT id,now()+interval '8 days',now()+interval '8 days 1 hour'
FROM users WHERE email='strength@pulsefit.example';
-- Expected: 42501 row-level security violation; the member cannot create trainer capacity.
ROLLBACK;
BEGIN;
DELETE FROM booking_audit;
-- Expected: 42501 permission denied, even if there are no audit rows.
ROLLBACK;
```

Run these interactively so you can issue ROLLBACK after the expected error. Do not use ON_ERROR_STOP for a whole error-expecting interactive block. The first flags must be false. Owners normally bypass RLS and cannot demonstrate this denial. The backend is trusted to set the verified session's actor UUID: credential theft/arbitrary backend SQL is outside this RLS boundary. Do not hand runtime credentials to application end users.

## 10. Full regression and API workflow

Already supported npm scripts, no new dependencies:

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run test:integration
npm.cmd run test:rbac
npm.cmd run build
# Second terminal:
npm.cmd run test:server
# Third terminal:
$env:TEST_APP_ORIGIN='http://localhost:3001'
$env:SMOKE_ORIGIN='http://localhost:3001'
$env:ALLOW_API_TEST_FIXTURES='yes'
npm.cmd run test:api
npm.cmd run test:smoke
```

Test server runs the production build against *_test databases. API fixtures are retained for inspection, not written to the demo DB. The current suite reports 9 unit + 8 integration (includes one parent) + 1 RBAC + 1 API + 1 smoke = **20 Node-reported tests / 19 leaf cases**. These are expected counts, **not Chirag's prefilled results**. Record actual pass/fail/skip and exact command output. `verify:final` is an optional recorder that writes repository docs/evidence; do not commit generated logs or secrets unintentionally.

## 11. Chirag's results — leave blank until independently executed

Every row requires your own result. “Codex passed it earlier” is not a valid actual result.

| Test | Expected result | Actual result | PASS/FAIL | Screenshot/evidence |
|---|---|---|---|---|
| Clone/update and record SHA/environment | Correct original main/approved PR commit; versions recorded | | | |
| Owner/runtime/admin separation | Restricted runtimes; maintenance non-superuser; extensions ready | | | |
| Fresh migrations/seed/Mongo/embeddings | Real services initialize; no skipped setup | | | |
| Member browser login | Authenticated MEMBER | | | |
| Member dashboard | Own role/navigation/bookings | | | |
| Member logout | Protected data no longer available | | | |
| Trainer browser login | Authenticated TRAINER | | | |
| Trainer dashboard/logout | Own trainer view; logout clears session | | | |
| Invalid credentials | Rejected; no session | | | |
| Cross-role page/action checks | No protected data/forbidden writes; 403 API | | | |
| Trainer profile view/save/readback | Intended values persist and embedding updates | | | |
| Add slot and refresh | Future slot persists in PostgreSQL | | | |
| Overlap attempt | Conflict rejected | | | |
| Trainer appointments/history | Real member booking/status visible | | | |
| Close unoccupied slot and refresh | CLOSED persists; booked slot protected | | | |
| Search trainer/open profile | Text search matches actual saved profile | | | |
| Applicable filters | Supported search/date/type/category filters behave correctly | | | |
| Member booking and history refresh | CONFIRMED persisted row | | | |
| Duplicate/concurrent booking | One winner; conflicting reservation rejected | | | |
| Cancellation/history refresh | CANCELLED persisted; capacity released; audit entry | | | |
| SQL booking/audit inspection | UI IDs/statuses match database | | | |
| Strength/cardio save and refresh | Two Mongo documents persist | | | |
| Workout edit/readback | Updated note/metrics persist | | | |
| Mongo console document/index/validator inspection | Actual document and strict schema/indexes | | | |
| Analytics counts/volume/time/distance | Expected fixture totals or explained actual totals | | | |
| Analytics date filter | Empty day gives zero; chosen day restores results | | | |
| Delete disposable workout | UI/document removed; remaining data preserved | | | |
| Mongo aggregation output | Measures agree with same-user/date UI data | | | |
| Semantic goal search | Populated ranked exercise/trainer results | | | |
| Vector SQL/operator/dimensions | Actual `<=>`, genuine 384D model vectors | | | |
| Safe DDL/DML/course SQL | CREATE/ALTER/temp DROP; all DML; rollback | | | |
| Joins/nested/correlated/recursive/CTE | Actual outputs; 7 recursive dates | | | |
| Functions/triggers/views/indexes | Actual named objects/effects explained | | | |
| PostgreSQL RBAC negative tests | 42501/zero rows using actual restricted login | | | |
| Unit/type/lint/build | Record exact command results | | | |
| SQL/Mongo/vector/concurrency integration | Record pass/fail/skip; no hidden skips | | | |
| HTTP API/production smoke | Record pass/fail/skip on test server | | | |
| Personal contribution confirmation | Evidence and genuine personal work confirmed | | | |
| Both-member demo/viva rehearsal | Explain concepts and complete 10–15 minute run | | | |

## 12. Contribution confirmation and viva

Review [CONTRIBUTIONS.md](CONTRIBUTIONS.md) and complete its personal-confirmation fields. Verifiable Git attribution is evidence of commits, not proof of independent manual coding. Both students should explain all core database/application boundaries; do not assign ownership of features merely to divide a viva.

Use [FINAL_VIVA_PREPARATION.md](FINAL_VIVA_PREPARATION.md) for actual object names, questions, limitations and the 10–15 minute sequence. Originality/AI-policy acceptance and oral understanding require human confirmation even after every automated check is green.

## Chirag-focused evidence supplement — 17 November 2026

Fresh **agent-executed** results for original main dba53379c0a480901ffde75214bef02cca7ac1fb are in [CHIRAG_EXECUTION_RESULTS.md](CHIRAG_EXECUTION_RESULTS.md), with screenshots and exact test counts. Codex performed those actions at Chirag's request. They do not complete the blank student-execution table above or personal contribution confirmation.

| Test | Expected result | Actual result | PASS/FAIL | Screenshot/evidence |
|---|---|---|---|---|
| Agent: isolated portable restart | SQL/Mongo data and private config retained | Retained after actual stop/restart; duplicate start safely rejected | PASS | Execution-results portable-service table and raw evidence bundle |
| Agent: actual member/trainer browser workflows | Authenticate, persist CRUD and enforce roles | Actual workflows completed; wrong-role submission denied | PASS | Execution-results browser table; screenshots/chirag-agent-rehearsal/ |
| Agent: database/API regression | No failures/skips; genuine DB operations | 20 reported passes, 0 fail/skip; typecheck/lint/build exit 0 | PASS | Execution-results commands and database readbacks |

Chirag should use [CHIRAG_INDIVIDUAL_VIVA.md](CHIRAG_INDIVIDUAL_VIVA.md) for his evidence-based contribution walkthrough and 40 questions, then record his own execution and understanding separately.
