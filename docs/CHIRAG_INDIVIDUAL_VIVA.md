# Chirag Basanth — individual PulseFit viva preparation

**PES1UG24CS133. Base reviewed: original main `dba53379c0a480901ffde75214bef02cca7ac1fb`.** PR #2 and PR #3 are merged. This is preparation, not a claim that a viva was conducted/passed or that Chirag personally executed the agent's checks. Read [CHIRAG_EXECUTION_RESULTS.md](CHIRAG_EXECUTION_RESULTS.md) for fresh agent-executed evidence and outstanding human confirmations.

## 1. My contribution: what the evidence supports

Use the following as an evidence-based speaking outline. Say “the commit is attributed to my Git identity” where independent manual authorship has not yet been personally confirmed. Existing documentation discloses AI assistance. Do not claim Chhavi's current implementation as your own.

| Evidence | Supported Chirag-attributed work | Current status / limit |
|---|---|---|
| `24cc449` — ChiragBasanth, chiragbasanthb@gmail.com | Earlier Next.js app/ and lib/ prototype; earlier SQL tables/constraints/functions/trigger/view and 128D vector design; earlier Mongo analytics, tests and reports | Most runtime code was superseded in the integration merge. SQL originals remain in database/legacy/sql and the earlier report binaries/history. Historical work is not the current 384D implementation |
| `9bb11d2` | Integration merge bringing implementations together | Evidence of integration, not authorship of every imported line; the active src/ implementation comes from Chhavi-attributed `7d489e6` |
| `4e398a2` | Active portable-service restart/recovery changes in scripts/local-services.ts | Strongest current runtime contribution trace: saved/configurable PG port, private config/credential reuse, readiness/port checks, stale-lock handling, IPv4 admin connection, persistent runtime directories and clearer logs |
| `f17c3e7`, `92499a3` | Team/report/handoff documentation corrections; generate-report.py/render-report.py updates | Documentation/report maintenance, not evidence of implementing unrelated app/database modules |

**Chhavi-attributed work to keep separate:** `7d489e6` introduced the active src app, 384D migrations, genuine MiniLM path, Mongo validator/production analytics and tests. `e567352` added current RLS/grants/guarded reservation, explicit query demonstrations and verification improvements; later commits and PR #3 added setup/teammate/viva handoff. PRs #1–#3 were created under chhavi2308-s. Owning the original repository or having a PR head in it is not authorship evidence.

**Shared/integrated work:** the integrated product and cross-store workflows must be understood by both students. local-services.ts contains original Chhavi-attributed code, Chirag-attributed changes and later Chhavi-attributed additions that preserve restricted runtime URLs. It is a shared-history file, not wholly owned by either person. No arbitrary feature split or percentages are asserted.

No unfinished feature implementation exclusively assigned to Chirag was found in the reviewed records. The outstanding documented responsibilities are independent laptop/browser/database verification, personal contribution confirmation and viva rehearsal. Agent execution supplies technical evidence but does not complete those personal tasks.

### Observable decisions and challenges, without invented personal history

- `4e398a2` preserves existing private database/session/seed values rather than regenerating them on a normal restart. Explain why changing them can make persisted accounts/services inaccessible.
- It allows an alternate PG port and checks a bound port before startup. Explain why an occupied port must be reported rather than stopping an unrelated process.
- It explicitly uses `127.0.0.1` for the PostgreSQL administration connection because the service is IPv4-bound. The code comment describes avoiding a possible Windows localhost/IPv6 wait; do not invent a personal debugging story beyond the evidence.
- It reuses project-local persistent data directories; the package starts actual PostgreSQL and mongod. “Memory server” in a dependency name does not mean the app stores workouts in a JavaScript array.
- It handles stale project-local lock state and startup errors. A port check alone is not a universal process-identity proof; follow documented recovery carefully and do not manually remove locks from a live/unrelated server.

### Testing I can honestly discuss

The execution-results document identifies **Codex as executor**, exact SHA/commands, browser actions, readbacks, screenshots and limits. A fresh isolated portable first start, duplicate-launch rejection and stop/restart were performed; PG/Mongo marker data and private credentials survived. The current application integrations were exercised to check dependencies, not to reassign authorship.

**Chirag fills after personal rehearsal:** date/laptop/commit: ______; tests I personally ran: ______; screenshots/errors I personally observed: ______; contribution claims I confirm: ______; assistance I must disclose: ______. Keep the blank human confirmation rows in CONTRIBUTIONS.md and TEAMMATE_EXECUTION_CHECKLIST.md until actually completed.

## 2. Code walkthrough relevant to my work

| File/function | What to show / database connection | Why it matters / attribution boundary |
|---|---|---|
| scripts/local-services.ts: savedPort/pgPort | Chooses saved or explicitly requested local PG port | Chirag-attributed restart configuration; native setup is an alternative, not this helper |
| writePortableEnv | Maintains ignored private PG/Mongo/session/seed configuration | Chirag-attributed structure; later APP_DATABASE_URL preservation is Chhavi-attributed; do not show actual secret values |
| isPortOpen | Short loopback TCP probe | Diagnoses already-bound service ports; does not query member/trainer data |
| clearDeadPostgresLock | Checks project PID file/listening port before stale-lock cleanup | Recovery logic; explain assumptions, not an unconditional guarantee about any arbitrary PID |
| EmbeddedPostgres configuration/start/admin client | Actual persistent PostgreSQL; explicit IPv4 admin connection; create missing demo/test DBs | Helper bootstrap uses a local maintenance/admin identity; runtime API must use a different restricted login |
| MongoMemoryServer configuration | Actual mongod, loopback and project-local WiredTiger path | Persistent flexible-workout storage across restarts; URI may use an alternate free port if the default is occupied |
| shutdown finally block | Stops helper-owned Mongo/PostgreSQL instances and keeps persistent state | Rehearse safe lifecycle with disposable fixtures; never stop another person's service during the demo |
| database/legacy/sql/001_schema.sql | Earlier 128D design and create_booking/audit_booking_change/recommend_trainers | Historical Chirag-attributed SQL. Do not run it on current main's DB or confuse it with current function names |
| migrations/001_core.sql and 003_database_authorization.sql | Current constraints/reserve_slot/trigger/RLS implementation | Integration understanding; introduced by Chhavi-attributed commits, not claimed as Chirag's new work |
| src/lib/db.ts: appSql/queryAs/mongo | Restricted SQL transaction actor and actual Mongo connection | Connect helper configuration to backend behavior; app connection cannot own tables/bypass RLS |
| src/lib/workouts.ts: progressPipeline | Owner/date match, separate session/volume facets | Current production analytics, distinct from the superseded memberId/workoutDate/weightKg prototype |
| src/lib/embedding.ts; recommendation API | Genuine MiniLM 384D inference and SQL cosine ranking | Current source is not the prototype's 128D representation; understand and demonstrate without claiming it as your implementation |

## 3. Individual viva questions and model answers

These are model explanations to practise, not proof of your understanding. Follow-up questions deliberately test tradeoffs.

| # | Faculty question / difficult follow-up | Model answer grounded in PulseFit |
|---|---|---|
| 1 | What exactly did you contribute? | Cite the four evidence groups above, especially 4e398a2's portable restart changes, earlier prototype and report maintenance. Distinguish recorded attribution from personally confirmed authorship and current code from superseded code. Do not say “I implemented all backend/database features.” |
| 2 | Did you author the active 384D schema because the repo is yours? | No. Repository ownership is access/hosting, not code authorship. The active migrations/embedding path trace to Chhavi-attributed commits; my earlier 128D SQL survives as history/legacy. |
| 3 | What problem does the project solve, beyond CRUD? | Trainer conflicts plus flexible workout tracking and relevant discovery. SQL locks/constraints arbitrate contention; triggers/audit preserve transitions; Mongo aggregation derives measures; learned vector retrieval and DB RLS add behavior beyond record editing. |
| 4 | Why PostgreSQL and MongoDB together? | Related identity/booking data needs FKs and ACID transactions; varied strength/cardio sets fit embedded documents and aggregation. SQL JSON could also store flexible records: this is a justified design choice, not a claim of SQL incapability. |
| 5 | Why pgvector instead of keyword matching? | Genuine sentence embeddings represent related descriptions without exact token equality. They are stored with SQL metadata and ranked with <=>, not a hardcoded response. Exact search is sufficient for this small catalog. |
| 6 | What does portable startup actually start? | Real PostgreSQL and mongod processes with project-local data directories. It is a development convenience; no source dependency replaces the actual DB with an array. Native installed services are also supported. |
| 7 | Which restart behavior did your code add? | Reuse of private config/port/credentials, persistent directories, port/readiness checks, clearer errors, and explicit IPv4 admin connection. The fresh agent test retained SQL/Mongo data and secrets after restart; I still must rehearse personally. |
| 8 | Could you simply reset the data directory when startup fails? | No: that discards persisted work. Check service/port/config/extension and project-owned state; preserve/back up data. The helper refuses certain missing-credential/unrelated-env cases instead of silently resetting them. |
| 9 | What if localhost resolves to IPv6? | An IPv4-bound server may not accept ::1. The helper's admin client uses 127.0.0.1; browser APP_ORIGIN still must match the actual browser origin exactly. |
| 10 | Can two helper launches share one PG directory safely? | The helper is designed to refuse an already-running port/cluster. A fresh duplicate-launch test exited 1 and left the first fixture operational. Do not bypass that refusal or treat a TCP probe as a universal process-identity check. |
| 11 | Explain the active ER design. | Users have optional typed member/trainer profiles; trainer profiles publish many slots; members create bookings against slots; audit rows reference bookings. There are seven business tables plus migration metadata. Mongo userId is a logical SQL member reference, not an enforced cross-store FK. |
| 12 | PK/FK/unique key: which actual constraints can you show? | PKs identify rows; typed (user_id,role) FK references users(id,role); booking(slot_id,trainer_id) references availability(id,trainer_id). Email/exercise names are unique; the partial unique booking index permits cancelled history but only one confirmed reservation per slot. |
| 13 | Is UNIQUE(id,role) another candidate key? | It is a supporting superkey because id alone is already a PK; it is not an additional minimal candidate key. It lets the profile FK declaratively include the role discriminator. |
| 14 | Is the design entirely 3NF? | Do not overclaim. Profiles separate identity-specific attributes, but bookings.trainer_id is deliberately redundant with slot membership to support its composite FK. specialties[] is a practical multivalued attribute, not a strict classical 1NF claim. |
| 15 | CHECK versus exclusion versus trigger? | CHECK validates row facts such as positive ≤4h duration. GiST exclusion handles overlapping trainer ranges across rows. Trigger logic checks transition rules/related state and writes audit. A cross-row booking rule is not replaced by a JavaScript CHECK. |
| 16 | Explain ACID with an actual workflow. | A booking/registration statement or explicit transaction commits or rolls back atomically; constraints preserve consistency; row locks under READ COMMITTED serialize contenders; committed DB storage provides durability. No global transaction covers PostgreSQL plus MongoDB. |
| 17 | Why isn't SELECT availability then INSERT sufficient? | Two requests can observe the same state. reserve_slot locks the slot FOR UPDATE and the partial unique index independently rejects a second confirmed row. I02 releases eight acquired connections together: one winner/seven 23505 conflicts. |
| 18 | Why not SERIALIZABLE for everything? | The existing single-slot invariant is enforced with row locks/constraints at READ COMMITTED; SERIALIZABLE would add retry behavior without replacing constraints. Wider multi-slot/member scheduling invariants would need separate design/testing. |
| 19 | Can cancelling and rebooking race? | Locks/unique constraints still protect capacity, but conflicting lock orders can yield a deadlock victim that rolls back and should retry. Cancellation retains history; a new booking gets a new ID. Do not claim the absence of all possible contention errors. |
| 20 | Stored function versus procedure; how many exist? | PulseFit has seven project functions and zero procedures. Functions return values or support triggers; a procedure is invoked with CALL and has different transaction-control possibilities. The functions/procedures faculty requirement is satisfied by real functions. |
| 21 | Name the current functions without attributing them to yourself. | reserve_slot, app_reserve_slot, validate_booking, audit_booking, protect_availability, request_actor, request_has_role. Their source is migrations 001/003, primarily Chhavi-attributed; I understand them as integration dependencies. |
| 22 | Which triggers fire and what do they enforce? | booking_validation BEFORE booking INSERT/UPDATE checks slot/immutable identity; booking_changes AFTER INSERT or UPDATE OF status appends audit; availability_guard BEFORE INSERT/UPDATE checks future creation, immutable times and occupied closure. |
| 23 | Will a rolled-back cancellation leave an audit entry? | No. The audit insert is in the same PostgreSQL transaction; rollback restores both booking state and audit count. This is a stronger design than independent best-effort app logging. |
| 24 | Ordinary versus recursive CTE? | Course SQL has added (fixture INSERT RETURNING), totals (aggregation), and training_days. The recursive anchor is current_date; successive day+1 stops at +6, giving exactly seven dates for a LEFT JOIN capacity report. |
| 25 | What makes the availability EXISTS correlated? | Its inner s.trainer_id=t.user_id depends on the current outer trainer; booking b.slot_id=s.id depends on the current slot. Independent nested IN is a different example. Show actual results, not a keyword in a comment. |
| 26 | INNER JOIN versus LEFT JOIN and HAVING? | INNER joins existing booking/user/slot matches; LEFT preserves zero-booking trainers/members/dates. WHERE filters rows before grouping; HAVING filters aggregate groups; ORDER BY controls presentation. |
| 27 | Which views/indexes are real? | Views: upcoming_bookings, trainer_utilization, occupied_slots. Seventeen SQL indexes include PK/unique/exclusion plus four explicit indexes. Reporting views use security_invoker; capacity view exposes slot IDs without member identities. No HNSW index is claimed for the active small catalog. |
| 28 | How did the earlier vector design differ? | The Chirag-attributed legacy schema had vector(128), different tables/functions/statuses and HNSW definitions. Current main has two vector(384) columns and genuine MiniLM. Do not initialize the app using legacy SQL or claim those old objects are active. |
| 29 | Explain the Mongo document and validation. | workout_logs contains userId, BSON dates, workoutType, notes and exercises/sets with reps/kg or duration/metres. Strict JSON Schema validates nonempty arrays, numeric limits and reps-or-duration; the API also validates/authenticates. |
| 30 | Why $facet in analytics? | Count sessions by UTC date before unwinding sets; independently unwind/group exercise measures. Otherwise multi-set logs inflate session counts. Missing optional values contribute zero resistance volume while cardio seconds/metres remain separate. |
| 31 | Prove Mongo persistence rather than a mocked API. | Save/refresh a workout, read it from an independent Mongo client, edit/read back, aggregate, delete a disposable row and confirm absence. The fresh portable test additionally preserved a marker across a real mongod restart. |
| 32 | Can SQL delete a member and automatically delete Mongo logs? | No cross-database FK/cascade exists. There is no account-deletion API; future lifecycle handling needs reconciliation/outbox/saga design. Do not claim distributed ACID. |
| 33 | What model/distance are used? | Xenova/all-MiniLM-L6-v2, q8 inference, mean pooling and normalization, 384 values. SQL <=> is cosine distance; similarity=1-distance. Scores are text association, not fitness-outcome predictions/probabilities. |
| 34 | How do you prove vector recommendations are DB retrieval? | Show actual stored vector dimensions/model metadata, API's bound ORDER BY embedding <=> query, and real ranked exercise/available-trainer results. A reference-vector SELECT can use the stored cycling vector; PREPARE alone does not execute a search. |
| 35 | Where is authentication versus authorization? | bcrypt verifies passwords; signed HS256 subject/issuer/audience/expiry authenticates the cookie. currentUser rereads the actual DB role. API role/owner checks plus PostgreSQL grants/RLS authorize operations. HttpOnly/SameSite/Secure reduce cookie exposure but are not ownership checks. |
| 36 | Why a separate runtime login? Can an owner prove RLS? | Owner/maintenance connections can bypass owner-table policies; runtime must be non-owner NOSUPERUSER/NOBYPASSRLS with limited grants. R01 uses the actual restricted login and omits API filters. The app rejects unsafe owner/bypass configuration. |
| 37 | What is the trusted-actor limitation? | queryAs sets verified session UUID using transaction-local set_config; policies derive role from users, then commit/rollback resets it. A stolen backend credential could forge context. RLS protects omitted owner predicates, not arbitrary compromised-backend SQL. |
| 38 | What tests are yours versus the agent's? | Current results explicitly identify Codex as executor. I must supply my own laptop date/SHA/browser/evidence and confirmations before claiming “I personally tested it.” Test ownership is not inferred from a commit or a request to the agent. |
| 39 | What remains outside the demo scope? | No payments, password reset/email verification, per-session revocation, distributed rate limiter, cross-store transactions, exhaustive load/relevance evaluation or certified independent authorship. Profile values are not prefilled. Localhost is sufficient under the given specification. |
| 40 | What would you improve in your runtime area? | Propose measured recovery/process identity checks, explicit multi-instance port configuration and clearer prerequisite validation after instructor review. Do not invent a completed improvement or change working code merely to claim activity. |

## 4. Short individual practical demonstration — about 5–7 minutes

1. **Show attribution (45s):** `git show 4e398a2 -- scripts/local-services.ts`. Identify the exact changes you can personally confirm. Show 24cc449 only as an earlier prototype; say clearly that the active implementation was integrated later.
2. **Show runtime persistence (1–2 min):** in an isolated disposable setup prepared in advance, run services, save/read a fixture, stop/restart that same setup and read it again. Demonstrate an already-running instance refusal or use the newly executed dated evidence. Never restart a shared/live faculty database unexpectedly, show .env, or manually delete a live PID file.
3. **Connect to one DBMS concept (1 min):** explain persistent storage versus transactions. Query a booking/audit row and show how the app's constraint/function/trigger enforces integrity; attribute those current objects accurately.
4. **Demonstrate integration (1–2 min):** a member login, persisted workout/analytics or trainer slot/booking/cancellation, then actual SQL/Mongo readback. Say this verifies your understanding of integrated dependencies, not sole authorship.
5. **Explain tradeoffs/limits (1 min):** role/owner separation, no cross-store transaction, legacy 128D versus current 384D, and what still requires personal confirmation.

The integrated project retains at least four working modules and four distinct advanced categories; your individual contribution need not be inflated to claim all of them. Use TEAMMATE_EXECUTION_CHECKLIST.md for the full rehearsal and its blank human result rows.

## 5. Personal confirmation — Chirag completes, not Codex

| Personal item | Chirag's confirmation/evidence |
|---|---|
| Which Git-attributed changes I personally performed and what assistance I used | |
| Which design decisions/challenges I can truthfully explain from experience | |
| Own laptop date/time, tested SHA and software/browser versions | |
| Browser/SQL/Mongo/vector checks I personally performed | |
| Questions I can explain without reading the model answer | |
| Remaining questions for teammate/instructor; originality/AI-policy confirmation | |

No row here is prefilled as complete. **Individual viva preparation: requires student practice.**
