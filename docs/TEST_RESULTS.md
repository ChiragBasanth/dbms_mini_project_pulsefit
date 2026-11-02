# Test results

Observed on 1 November 2026, Asia/Calcutta, using real portable PostgreSQL 18.6, pgvector 0.8.7 and MongoDB 8.2.6. Node v26.13.0/npm 11.20.0. Database credentials were generated locally and are not evidence artifacts.

## Executed commands

| Command | Exit code | Observed result | Evidence |
|---|---:|---|---|
| npm install / npm ci preparation | 0 final | Dependencies and lockfile installed; optional Mongo postinstall initially stalled and was replaced with official project-local binary | package-lock.json; SETUP.md |
| npm run db:migrate | 0 | 001_core.sql and 002_profile_metadata.sql applied | evidence/migrations.txt |
| npm run db:mongo | 0 | Strict validator and two indexes installed | evidence/mongo-setup.txt |
| npm run db:seed | 0 | Fictitious users, slots and exercise texts inserted | evidence/seed.txt |
| npm run db:embed | 0 | Six exercise and three trainer model embeddings generated | evidence/embeddings.txt |
| npm run typecheck | 0 | No TypeScript errors | evidence/typecheck.txt |
| npm run lint | 0 | No lint errors or warnings in final verification | evidence/lint.txt |
| npm test | 0 | 8 passed, 0 failed, 0 skipped | evidence/test.txt |
| npm run test:integration | 0 | 8 passed (including parent/subtests), 0 failed, 0 skipped | evidence/test-integration.txt |
| npm run build | 0 | Optimized production build and page generation succeeded | evidence/build.txt |
| npm run test:api | 0 | One multi-assertion complete HTTP workflow test passed | evidence/api.txt |
| npm run test:smoke | 0 | One smoke test passed: 11 page responses and three HTTP status checks | evidence/smoke.txt |
| node --import tsx scripts/capture-db-evidence.ts | 0 | Actual schema/functions/views, safe domain DML and prepared vector query executed | evidence/sql-inspect.json; sql-course_demo.json; sql-semantic_search.json |

`evidence/verification.json` records start/end timestamps and exact exit codes for the final five-command verification run. There are **18 reported automated tests** across unit (8), integration (8), API workflow (1) and production smoke (1) runs. A multi-assertion workflow is not inflated into an invented count of separate tests. Browser checks below are separate manual/tool observations.

## Required scenarios

| Test ID | Scenario | Expected result | Actual observed result | Pass/Fail/Blocked | Evidence |
|---|---|---|---|---|---|
| T01 | Member registration/login | 201 registration and 200 login with cookie | API fixture member registered and authenticated; seeded member also signed in through browser | PASS | A01 in api.txt; 02-member-dashboard.jpg |
| T02 | Trainer registration/login | 201/200 and trainer portal | API fixture trainer authenticated; seeded trainer portal displayed member appointment | PASS | A01; 03-trainer-dashboard.jpg |
| T03 | Role/ownership rejection | 401 unauthenticated, 403 role, 404 non-owned mutation | Member availability creation 403; trainer workouts 403; unauthenticated bookings 401; non-owned cancel/delete 404 | PASS | A01 and smoke.txt |
| T04 | Availability creation | Valid future slot inserted; overlap rejected | API and browser created slots; repeated browser range rejected; direct SQL overlap 23P01 | PASS | I04; A01; 03-trainer-availability.jpg; 05-availability-overlap-rejected.jpg |
| T05 | Valid booking | Exactly one committed reservation | Stored function and member browser reservation succeeded | PASS | I02; A01; 04-booking-history.jpg |
| T06 | Parallel double-booking | One winner; all other contenders conflict | Eight DB connections: 1 success, 7 errors 23505 and 1 confirmed row; two HTTP requests: 201/409 asserted | PASS | I02 concurrency array; A01 |
| T07 | Cancellation/rebooking | Cancelled row preserved and slot reusable | Cancellation then rebooking succeeded; 3 audit rows observed | PASS | I03; A01 |
| T08 | Invalid/past slot | Reject invalid durations, reversed/past intervals and role violations | Zod rejected invalid intervals; SQL rejected past and >4h slots; API past slot returned 400 | PASS | U04; I04; A01 |
| T09 | Workout CRUD | Own insert/read/update/delete succeed | Real Mongo CRUD and HTTP workflow passed; strength/cardio logs visible in browser | PASS | I07; A01; 06-workout-history.jpg |
| T10 | Mongo analytics accuracy | 2 sessions; 350 volume; cardio 600s/1500m | Exact expected values returned; missing weights/reps contributed zero volume | PASS | I07 MONGO_AGGREGATION; 07-progress.jpg |
| T11 | Legitimate vector query/ranking | Real 384-D embeddings and paraphrase ranks aerobic first | pgvector similarities 0.4065922983 vs 0.1471995852; browser stiffness goal ranked mobility first | PASS | I08 VECTOR; embeddings.txt; 08-recommendations.jpg |
| T12 | Cross-user isolation | No access/update/delete of other user's log/booking | Other owner query empty, update/delete zero/404; non-owned cancellation 404 | PASS | I05; I07; A01 |
| T13 | Validation and SQL injection | Bad fields rejected; injected input treated as data | Role/password/measure validation passed; parameterized injected email/search returned no rows | PASS | U01–U08; I05; A01 |
| T14 | Build and route smoke | Build/type/lint succeed; core routes serve; auth enforced | All final checks exit 0; 11 pages returned 200, unknown page 404, bookings API 401 | PASS | verification.json; build.txt; smoke.txt |
| T15 | Schema/DDL/DML/views | Ordered migrations and reversible demonstrations execute | Both migrations and safe course SQL executed; trigger/function/view catalogs captured | PASS | migrations.txt; I06; sql-*.json |
| T16 | Both students' contributions | Real team identities and attributable work | Names/SRNs confirmed: Chirag Basanth Bellavi — PES1UG24CS133; Chhavi S Wadhwa — PES1UG24CS132. Instructor approval and individual contribution evidence remain pending | BLOCKED | CONTRIBUTIONS.md |
| T17 | Dedicated code/terminal/DB-console screenshots | Genuine editor/console images | App images captured; dedicated console images pending | BLOCKED | SCREENSHOT_CHECKLIST.md |

## Concurrency proof and isolation assumptions

The test acquires all eight clients before starting the booking statements and releases them through a shared promise barrier. The default PostgreSQL isolation is READ COMMITTED. Each reserve_slot call locks the same availability row. The first inserts; later callers serialize on the lock and encounter the partial unique index. Assertions verify one success, seven 23505 errors and one committed CONFIRMED row. The invariant is enforced in PostgreSQL, not by a JavaScript check-then-insert. The trigger applies to direct writes too. The HTTP conflict test independently asserts a 409 for the loser.

No distributed ACID claim is made. MongoDB fixture isolation and PostgreSQL transactions were tested separately. Wider load/latency, deadlock/cancellation stress, hosted TLS deployment, multiple server replicas and exhaustive semantic relevance have not been benchmarked.

## Resolved setup/check failures

The first sandboxed production build failed with Windows EPERM creating a generated .next directory; rerunning with approved local permissions succeeded. The first lint pass reported render-time Date.now() purity errors and navigation warnings; code was corrected and the final run passed. A guessed portable PostgreSQL version did not exist on npm; the available version was installed. MongoDB's optional automatic archive download was stopped after excessive delay; the official executable was obtained from its official archive and ran successfully. No failed attempt was relabeled a pass; final evidence comes from later actual executions.
