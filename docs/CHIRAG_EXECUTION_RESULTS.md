# Chirag individual execution results

## Scope and executor

Reviewed original main **dba53379c0a480901ffde75214bef02cca7ac1fb**, including merged PRs #2 and #3. Fresh work took place 16–17 November 2026 (Asia/Kolkata). **Codex executed these terminal/browser checks on the available Windows host at Chirag's request. They are not claims that Chirag personally performed them.** Human confirmation fields in CONTRIBUTIONS.md and TEAMMATE_EXECUTION_CHECKLIST.md remain blank.

No unfinished implementation exclusively assigned to Chirag was found. No source, migration, security or test changes were needed. This is a documentation/evidence change, not a new implementation contribution. Personal authorship, originality-policy compliance and viva understanding remain student/instructor confirmations.

## Contribution findings

| Category | Evidence and conclusion |
|---|---|
| Confirmed Git-attributed Chirag work | 24cc449: earlier app/lib prototype, 128D SQL and Mongo/report material, largely superseded; 4e398a2: surviving portable-service restart/recovery changes; f17c3e7 and 92499a3: report/team/handoff maintenance; 9bb11d2: integration merge |
| Documented Chirag responsibilities not personally verified | Independent laptop execution, contribution confirmation, screenshots/results from his own actions and individual viva practice. No outstanding exclusively assigned feature was identified |
| Chhavi work | 7d489e6 introduced current src app, 384D migrations/MiniLM, Mongo validator/analytics and tests; e567352 and follow-ups added RLS/runtime/query verification and setup improvements; PR #3 added final handoff docs. These remain Chhavi-attributed |
| Shared work | Integrated product and integration understanding; scripts/local-services.ts has contributions from both identities. Chirag's merge does not transfer authorship of imported implementations |
| Personal confirmation required | Actual manual work behind attributed commits, unrecorded collaboration, assistance used, decisions personally made, and ability to explain the code |

Git attribution proves recorded identity/file scope, not unaided authorship. Repository ownership alone proves none of the database features. Earlier SQL in database/legacy/sql is historical 128D work, not the current 384D implementation. PRs #1–#3 were created by chhavi2308-s. See [CONTRIBUTIONS.md](CONTRIBUTIONS.md) and [individual viva](CHIRAG_INDIVIDUAL_VIVA.md).

## Environment and isolation

- Windows x64, kernel 10.0.26200; Node v26.13.0; npm 11.20.0.
- PostgreSQL 18.6; pgvector 0.8.7; MongoDB 8.2.6. Versions read from live servers, not assumed from package ranges.
- Codex in-app browser; its version was not exposed.
- Fresh isolated project-local PostgreSQL cluster on port 55435 and persistent MongoDB directory. Separate pulsefit and pulsefit_test databases; test-server browser runs used the latter. Existing demonstration services/data were preserved.
- Production browser/API test server used **http://localhost:3001**, deliberately separate from the ordinary localhost:3000 demo. See the teammate checklist to launch the ordinary demo.
- Existing native binaries and cached genuine MiniLM weights were reused. Fresh migrations, seeds and inference were executed. This was not a clean OS install or Chirag's own laptop test.
- Credentials remained in ignored private environment files. No password/session secret is included in the evidence committed here.

## Chirag-attributed portable-service behavior: freshly executed

The unchanged scripts/local-services.ts at the tested main was invoked from an isolated working directory through an external harness. It initialized real PostgreSQL/MongoDB; inserted disposable SQL/Mongo markers; attempted a duplicate start; stopped normally; restarted; read the markers and compared private configuration values; then removed its own markers.

| Test | Expected | Actual | Result |
|---|---|---|---|
| First start | Real services initialize and become ready | Both ready; fresh private configuration generated | PASS |
| Duplicate launch | Reject without disturbing running fixture | Exit 1; original SQL marker still readable | PASS |
| PostgreSQL persistence | Marker retained after normal stop/start | Exact marker retained | PASS |
| MongoDB persistence | Marker retained after normal stop/start | Exact document retained | PASS |
| Configuration reuse | PG URL/session/seed values remain unchanged | Internal equality checks passed; values not published | PASS |

This directly checks 4e398a2's surviving contribution. The helper was originally added by Chhavi and later changed by both identities. No claim of whole-file ownership is made. External harnesses are evidence tooling, not supported new npm scripts.

## Actual browser execution

All PASS rows below describe **Codex's actual actions**, not filled-in student self-verification. Screenshot names refer to docs/screenshots/chirag-agent-rehearsal/. Screenshots contain disposable fixture data.

| Test | Expected result | Actual result | Result | Screenshot/evidence |
|---|---|---|---|---|
| Invalid login | Reject wrong password | Invalid email or password shown | PASS | 01-invalid-login.jpg |
| Trainer login/dashboard | Trainer session and dashboard | Trainer space and profile form displayed | PASS | 02-trainer-profile.jpg; browser observation |
| Session persistence | Refresh retains session | Trainer dashboard and later member journal remain authenticated after reload | PASS | Browser observation; persisted journal below |
| Trainer profile edit | Save profile and embedding | Bio/specialties/6 years saved; SQL readback confirms 384D embedding | PASS | 02-trainer-profile.jpg; SQL readback |
| Trainer/member route protection | Reject wrong-role operations | Trainer workouts denied; member availability submission rejected for role | PASS | 03-trainer-role-denial.jpg; 17-member-role-rejection.jpg |
| Past availability | Reject invalid time | Validation shown | PASS | 04-past-slot-rejected.jpg |
| New availability/persistence | Future slot saved | 21 Nov 14:00–15:00 IST appears in member detail and trainer schedule | PASS | 05-overlap-rejected.jpg; SQL readback |
| Overlapping availability | Reject same interval | Overlap rejected | PASS | 05-overlap-rejected.jpg |
| Member login/dashboard | Member session/dashboard | Member space opened; subsequent protected workflows succeed | PASS | 06-search-profile-readback.jpg; browser observation |
| Discovery/search/details | Filter trainer and see saved data/slot | Search for Chirag rehearsal isolates edited trainer; details show slot | PASS | 06-search-profile-readback.jpg |
| Booking/history | Confirm reservation | Nov 21 booking CONFIRMED in member history | PASS | 08-booking-confirmed.jpg |
| Unavailable/duplicate booking | Reject stale same-slot submission | Second tab retained old slot; submission rejected after first tab booked | PASS | 07-duplicate-booking-rejected.jpg |
| Cancellation | Persist CANCELLED | Member history updated; trainer history and SQL agree | PASS | 09-booking-cancelled.jpg; 18-trainer-history.jpg |
| Workout create/refresh/edit | Persist document and edited note | Strength entry survives refresh; edited note read directly from Mongo | PASS | 10-workout-edit-persistence.jpg |
| Analytics | Aggregate real saved data | Two sessions, volume 350, duration 600 seconds, distance 1500 metres | PASS | 11-mongo-analytics.jpg; 13-analytics-breakdown.jpg |
| Date filter | Exclude/restore chosen day | Nov 14 empty; Nov 15 restores values | PASS | 12-empty-date-filter.jpg |
| Delete disposable workout | Remove only selected document | Cardio entry removed; strength remains; direct Mongo absence checked | PASS | 14-workout-deletion.jpg |
| Exercise recommendations | Real goal produces ranked CARDIO results | Steady cycling 64.9%, Interval running 49.6% | PASS | 15-semantic-recommendations.jpg; 16-ranked-results.jpg |
| Trainer recommendations | Ranked trainers displayed | Dev Sen 58.0%, Asha Rao 38.5%, edited API trainer 32.9%, Mira Das 23.4% | PASS | 16-ranked-results.jpg; full browser text observation |
| Trainer booking history | Member cancellation visible to trainer | Nov 21 row CANCELLED | PASS | 18-trainer-history.jpg |
| Slot management | Close free slot | Nov 21 slot CLOSED; SQL confirms | PASS | 19-slot-closed.jpg |
| Both role logout | Clear session | Each role signed out; final protected dashboard requests sign-in | PASS | Browser observation; API logout assertions |

Route protection has a practical limitation: a wrong-role page shell/form can render (member /availability); its submission is rejected. This is authorization of operations, not a claim that every wrong-role URL redirects. The trainer profile edit form also opens blank rather than prefilling existing values; saved values are visible in trainer discovery and SQL. Neither behavior was represented as a failed security/data operation.

## Direct database checks and brief faculty dependency check

Fresh SQL reads confirmed the exact edited trainer bio, Cycling/Endurance specialties, experience 6, vector_dims = 384; the Nov 21 booking CANCELLED and its slot CLOSED. Mongo reads before deletion found both actual browser-created workouts and edited notes. The production progressPipeline returned 2 sessions, 350 lifting volume (10×20 + 5×30), 600 seconds and 1500 metres. After deletion, exactly the edited strength document remained; cardio document count was zero and aggregation returned 1 session/350 volume.

Live catalog: **8 PostgreSQL tables, 3 views, 17 indexes, 7 project functions, 3 triggers and 12 RLS policies**. No stored procedures are claimed. Seven functional modules remain: authentication/roles, trainer profiles/discovery, availability, booking/history/cancellation, workout journal, analytics and recommendations. Nine advanced categories: functions, triggers, transactions/concurrency, CTEs/recursive SQL, nested/correlated/JOIN/aggregate queries, indexes/views, database RBAC/RLS, Mongo aggregation and vector search. Categories describe implemented demonstrations, not ownership claims.

| Required dependency | Fresh evidence / source | Status |
|---|---|---|
| ER/relational schema | docs/ER_DIAGRAM.md, docs/RELATIONAL_SCHEMA.md and database/postgres/migrations/001_core.sql; current FK/role constraints exercised by integration tests | Present; no diagram rewrite |
| DDL/DML, nested/correlated/recursive/JOIN, ordinary CTE, aggregates | I06 executes database/postgres/queries/course_demo.sql using disposable/rollback operations; recursive output has 7 dates | PASS |
| Functions/triggers/views/transactions/indexes | Fresh migrations and integration assertions; reserve_slot/app_reserve_slot, booking_validation/booking_changes/availability_guard; live catalog above | PASS |
| Mongo CRUD/aggregation | I07 plus actual browser create/read/update/delete and direct readback using src/lib/workouts.ts progressPipeline | PASS |
| Genuine vector similarity | I08 real MiniLM inference: aerobic similarity .406592 > strength .147199; API and browser ranks; src/app/api/[...path]/route.ts and semantic_search.sql use cosine distance <=> | PASS |
| Next.js/API/authentication | Production build, HTTP tests and actual role logins/logout above | PASS |
| Database RBAC | test:rbac uses restricted login; direct unauthorized operations reject with 42501/zero visible rows; actor context reset checked | PASS |
| Documentation | Existing teammate setup and SQL catalog retained; individual execution/viva evidence added | Present |

These checks demonstrate integration dependencies and do not attribute current database objects to Chirag. The current 384D/RLS/Mongo implementation is principally Chhavi-attributed; Chirag's historical database design is separately recorded. Faculty originality/contribution/mastery requirements remain unverified by automation.

## Commands and automated results

Actual supported commands run against fresh environments:

```powershell
npm.cmd run db:migrate
npm.cmd run db:mongo
npm.cmd run db:seed
npm.cmd run db:rbac -- --with-tests
npm.cmd run db:embed
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run test:integration
npm.cmd run test:rbac
npm.cmd run build
npm.cmd run test:server
npm.cmd run test:api
npm.cmd run test:smoke
```

The migration/seed/embed commands were also run with DATABASE_URL set to TEST_DATABASE_URL for the test database. External harness labels test-db:migrate/test-db:seed/test-db:embed identify those environment switches; they are **not npm script names**. HTTP tests used TEST_APP_ORIGIN/SMOKE_ORIGIN http://localhost:3001 and ALLOW_API_TEST_FIXTURES=yes against disposable test databases.

| Command | Actual result |
|---|---|
| typecheck / lint / build | Each exit 0 |
| test | 9 pass, 0 fail, 0 skip |
| test:integration | 8 Node-reported pass (includes parent), 0 fail, 0 skip |
| test:rbac | 1 pass, 0 fail, 0 skip |
| test:api | 1 pass, 0 fail, 0 skip |
| test:smoke | 1 pass, 0 fail, 0 skip; 11 pages checked |
| Total | 20 Node-reported passes / 19 leaf cases; 0 fail, 0 skip |

Concurrency evidence: eight simultaneous SQL reservations yield one winner and seven 23505 rejections; two parallel HTTP bookings yield 201 and 409. No separate concurrency npm script is invented.

Initial external-harness Windows loader syntax was corrected to a file URL. A later direct-read attempt hit sandbox loopback EACCES; rerunning the same read with permitted local network access succeeded. These were execution-environment issues, not application fixes. Full raw logs, JSON readbacks and environment metadata are retained in the local outputs/Chirag-Individual-Verification/evidence bundle; screenshots are committed below. No credentials or temporary harnesses are staged.

## Git handoff and remaining personal work

Branch: **docs/chirag-individual-verification**, based on original main dba5337. Commit author/committer configured only for this worktree as ChiragBasanth / chiragbasanthb@gmail.com, matching Chirag's historical identity. User explicitly approved publication through the existing authenticated collaborator **chhavi2308-s**; that account will be PR creator, not commit author/committer. New docs are AI-assisted preparation on Chirag's request and do not certify original manual implementation.

Before faculty evaluation Chirag must independently follow [TEAMMATE_EXECUTION_CHECKLIST.md](TEAMMATE_EXECUTION_CHECKLIST.md) on his laptop, enter his actual results/software versions/SHA/screenshots/errors, confirm genuine contribution and assistance in CONTRIBUTIONS.md, and practise the 40 questions and focused demo in [CHIRAG_INDIVIDUAL_VIVA.md](CHIRAG_INDIVIDUAL_VIVA.md). A viva has not been conducted or passed on his behalf. No feature work is reassigned from Chhavi.

**CHIRAG'S TECHNICAL RESPONSIBILITIES: COMPLETE** — no unresolved exclusively assigned implementation task found; personal contribution confirmation remains.

**CHIRAG'S LIVE DEMO READINESS: NOT FULLY VERIFIED** — fresh agent rehearsal passed; own-laptop/personal execution remains.

**CHIRAG'S INDIVIDUAL VIVA PREPARATION: REQUIRES STUDENT PRACTICE** — source-grounded material prepared.


## Screenshot gallery

All 19 original captures are in [screenshots/chirag-agent-rehearsal](screenshots/chirag-agent-rehearsal). These are agent-rehearsal captures, not student self-certification.

- [Stale duplicate booking rejected](screenshots/chirag-agent-rehearsal/07-duplicate-booking-rejected.jpg)
- [Mongo-backed analytics measures](screenshots/chirag-agent-rehearsal/13-analytics-breakdown.jpg)
- [Ranked exercise and trainer matches](screenshots/chirag-agent-rehearsal/16-ranked-results.jpg)
- [Member role rejection](screenshots/chirag-agent-rehearsal/17-member-role-rejection.jpg)
- [Trainer history](screenshots/chirag-agent-rehearsal/18-trainer-history.jpg)
- [Closed disposable slot](screenshots/chirag-agent-rehearsal/19-slot-closed.jpg)
