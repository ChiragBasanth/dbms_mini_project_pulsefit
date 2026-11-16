# PulseFit final viva and practical demonstration

Team: **Chhavi S — PES1UG24CS132** and **Chirag Basanth — PES1UG24CS133**. Both students should rehearse the complete system. This guide explains actual implementation; it does not certify independent authorship or assign features arbitrarily. Personal confirmations belong in [CONTRIBUTIONS.md](CONTRIBUTIONS.md).

## Source map to open before the viva

| Topic | Exact source / objects |
|---|---|
| Architecture/design | [ER diagram](ER_DIAGRAM.md), [PNG export](er-diagram/pulsefit.png), [relational schema](RELATIONAL_SCHEMA.md), [dictionary](DATA_DICTIONARY.md) |
| Core SQL | `database/postgres/migrations/001_core.sql`: users, typed profiles, availability, bookings, audit, exercises; constraints/indexes/functions/triggers/views |
| Additive schema | `002_profile_metadata.sql`: trainer location; `003_database_authorization.sql`: RLS, actor helpers, guarded reservation, capacity view |
| Query demonstrations | `database/postgres/queries/course_demo.sql`, `inspect.sql`, `semantic_search.sql`; safe temporary DDL/DML and actual SQL relationships |
| Database connection boundary | `src/lib/db.ts`: sql (maintenance), appSql/assertRuntime/queryAs (restricted runtime), mongo |
| Authentication/API | `src/lib/auth.ts`: session/currentUser/requireUser/guardOrigin; `src/app/api/[...path]/route.ts` |
| MongoDB | `database/mongo/setup.ts`: validator/indexes; `src/lib/workouts.ts`: progressPipeline; workout/analytics API branches |
| Vectors | `src/lib/embedding.ts`: MODEL, DIMENSION, embed; `scripts/embed.ts`; recommendation SQL in API |
| UI | `src/components/Portal.tsx`; `src/app/[view]/page.tsx`; trainer detail page |
| Tests | unit.test.ts, integration.test.ts (I01–I08), rbac.test.ts (R01), api.test.ts (A01), smoke.test.ts (S01) |

## Counts and scope to state accurately

The audited implementation has **7 conservatively counted complete workflows**: authentication/authorization, trainer discovery, availability, booking/history/cancellation, workout management, analytics, semantic recommendations. Profile editing and role dashboards are real supporting features, not extra independent modules required to reach four.

There are **9 advanced categories**: stored functions, triggers, transactions/concurrency, CTEs, views, indexes, Mongo aggregation, vector retrieval, database RLS/grants. Object counts: **8 PostgreSQL tables (7 business + migration metadata), 3 views, 17 indexes, 7 project functions, 0 procedures, 3 triggers, 12 RLS policies**. SQL course examples contain 2 ordinary CTEs and 1 recursive CTE. Mongo has 1 application collection with 3 indexes (including _id), 1 production aggregation definition with two facets, plus 1 simpler teaching pipeline. Vectors occupy two columns and support exercise/trainer retrieval. Extension helper functions and repeated report excerpts are excluded from project counts.

## Likely faculty questions

| Question | Concise, source-based answer |
|---|---|
| What problem does PulseFit solve? | Trainer scheduling conflicts, member/trainer accounts, varied workout records, meaningful progress summaries and semantic exercise/trainer discovery. |
| How is it beyond CRUD? | A row-lock/unique/exclusion booking invariant under real contention, transactionally generated audit, strict flexible-document validation, aggregate analytics, learned vector retrieval and SQL-enforced ownership/role restrictions. |
| Why PostgreSQL? | Identity/roles/profiles/slots/bookings are related, transactional data. Composite FKs, CHECK/UNIQUE/exclusion, functions/triggers and RLS enforce invariants beyond UI validation. |
| Why MongoDB? | A workout embeds varying exercises and sets: strength uses reps/kg, cardio seconds/metres. Documents keep a session together; validators constrain fields. SQL JSON could also work; Mongo is a deliberate second paradigm, not proof that SQL cannot store flexible data. |
| Why pgvector? | Store real text representations beside SQL metadata and rank/filter using SQL without a separate hosted vector service. Exact search suits the small catalog. |
| Explain the ER relationships. | users have optional role-specific profiles enforced by typed composite FKs. Trainer profiles publish many availability rows; members make many historical bookings; a slot has at most one confirmed booking but can have cancelled history. Audit rows reference bookings. Workout userId is only a logical cross-store member reference. |
| PK versus FK versus candidate key? | PK identifies a row. FK references a unique parent key. Email/exercise name are alternative unique identifiers. UNIQUE(id,role) and UNIQUE(slot_id,trainer_id parent pair) support typed/composite references; a pair containing an already unique ID is a superkey, not an additional minimal candidate key. See actual constraint definitions. |
| What constraints matter most? | Typed profile FK, booking slot/trainer FK, normalized unique email, valid roles/status/duration CHECKs, GiST trainer/range exclusion and partial unique confirmed-slot index. NOT NULL blocks missing required data. |
| Is everything strictly 3NF? | Identity/profile separation reduces duplication. Booking trainer_id is deliberately redundant with slot membership to support the composite FK; do not claim a fully decomposed 3NF relation there. Specialties[] is a practical multivalued array, not a strict classical 1NF claim. RELATIONAL_SCHEMA.md explains these tradeoffs. |
| What are ACID properties here? | Booking statements/registration commit or roll back together; database constraints preserve consistency; row locks at default READ COMMITTED serialize competing reservations; committed database storage provides durability. No transaction spans PostgreSQL and MongoDB. |
| What isolation level is used? | Default PostgreSQL READ COMMITTED. reserve_slot SELECT FOR UPDATE locks the availability row; the partial unique index independently prevents a second CONFIRMED reservation. We do not claim every workflow runs at SERIALIZABLE. |
| Why isn't a JavaScript availability check sufficient? | Two requests could both see capacity before inserting. PostgreSQL locking and constraints arbitrate independently of request timing. I02 acquires eight connections before releasing a barrier: one winner/seven 23505 conflicts. A01 separately gets HTTP 201/409. |
| Why an exclusion constraint? | Overlap is a cross-row interval rule. GiST excludes equal trainer IDs with overlapping tstzrange [start,end). Adjacent slots are allowed. Closed rows still exclude their original interval. |
| How is cancellation safe? | An owned future booking transitions to CANCELLED, retaining history/audit and releasing the partial unique-index entry. Rebooking uses a new booking row. Deadlock victims can roll back and retry; no race-free promise is based on UI buttons. |
| Function versus procedure? | A function returns a value and is used by SELECT or trigger execution; a procedure is called with CALL and can have different transaction-control use cases. PulseFit has 7 functions and **0 procedures**; the faculty's functions/procedures requirement is satisfied by actual functions. |
| Which functions can we show? | reserve_slot(uuid,uuid), app_reserve_slot(uuid,uuid), validate_booking(), audit_booking(), protect_availability(), request_actor(), request_has_role(text). Their definitions are in migrations 001/003 and inspectable with pg_get_functiondef. |
| Which triggers fire when? | booking_validation BEFORE booking INSERT/UPDATE validates slot/identity; booking_changes AFTER INSERT or UPDATE OF status appends booking_audit; availability_guard BEFORE availability INSERT/UPDATE checks future window, immutable times and occupied-slot closure. |
| Does audit survive a rolled-back booking? | No: audit is part of the same SQL transaction. A cancellation's new audit row disappears after ROLLBACK. I03/I06 and the independent audit exercised this. |
| CTE versus recursive CTE? | course_demo's added CTE does fixture INSERT RETURNING; totals computes aggregates for one statement. training_days anchors current_date and adds one day until current_date+6, yielding exactly 7 planning dates then LEFT JOINing actual capacity. The bound guarantees termination. |
| What makes a query correlated? | Its inner query references the current outer row. The trainer query's s.trainer_id=t.user_id and occupied-slot b.slot_id=s.id depend on the outer trainer/slot; this differs from independent nested IN queries. |
| INNER JOIN versus LEFT JOIN? | INNER connects matching booking/member/trainer/slot rows. LEFT keeps members/trainers/report dates with no booking/capacity. Show actual results, including zero groups. |
| WHERE versus HAVING? | WHERE filters input rows; HAVING filters aggregate groups after GROUP BY. ORDER BY then controls presentation. course_demo uses these on real entities. |
| Why views and indexes? | upcoming_bookings/trainer_utilization give reusable reports; occupied_slots exposes only capacity IDs. Reporting views use security_invoker to respect caller RLS. PK/unique/exclusion and lookup indexes enforce/support constraints and queries. There is no claimed HNSW index. |
| What is the Mongo document model? | workout_logs has member UUID string, BSON dates, workoutType, notes and exercises[{name,sets[{reps?,weight?,duration?,distance?}]}]. A strict JSON Schema enforces nonempty bounded arrays, reps or duration, integer positive reps and valid measurement ranges. |
| How does aggregation avoid wrong session counts? | progressPipeline starts with owner/date $match. $facet counts sessions by UTC date before unwinding, while another branch unwinds exercises/sets and sums reps×weight, duration and distance. Missing optional measures use $ifNull=0. |
| What fixture totals should we explain? | Two distinct workouts: Squat sets 10×20+5×30 = 350 kg×reps; Cycling 600s/1500m; 2 sessions. Existing extra workouts change totals, so compare the same user/date range. |
| Can Mongo enforce a SQL FK? | No. API authentication/owner predicates supply member IDs; administrative cross-store deletion could orphan records. No account-delete API or distributed-ACID guarantee is claimed; future lifecycle handling needs reconciliation/outbox/saga design. |
| How are embeddings generated? | Xenova/all-MiniLM-L6-v2, q8 inference, mean pooling, normalization, 384 dimensions. embed trims/collapses whitespace and lowercases. Exercise name/description and trainer bio/specialties are indexed by scripts/embed.ts; API embeds the live goal. |
| What is cosine similarity? | pgvector <=> gives cosine distance; the app returns 1-distance. ORDER BY distance ascending retrieves close text representations. Scores are not calibrated probabilities or fitness-outcome predictions. |
| How do we prove vectors aren't hardcoded? | Show actual vector columns/model metadata, generated dimensions, the API's bound SQL and ranked results, plus I08 and the live reference-vector SQL in TEAMMATE_EXECUTION_CHECKLIST.md. PREPARE alone does not execute retrieval. |
| Where are the three RBAC layers? | Portal role navigation, server requireUser/owner predicates, and PostgreSQL grants/RLS/guarded app_reserve_slot. queryAs sets verified actor UUID transaction-locally; policies resolve role from users. R01 connects with the actual restricted password and omits API filters to prove DB enforcement. |
| Why separate owner and runtime logins? | Maintenance owns schema and handles migrations/seed/embeddings. Runtime is non-owner NOSUPERUSER/NOBYPASSRLS with limited columns/functions, no role mutation/audit deletion/direct reserve_slot. assertRuntime rejects privileged runtime configuration. |
| Does the owner demonstrate RLS rejection? | No, owners normally bypass RLS. Use pulsefit_app_test on disposable data. The recommended native setup precreates runtime roles administratively so the maintenance owner need not have CREATEROLE. |
| Can a stolen runtime credential forge actor context? | Yes, the backend credential is trusted and can set a custom GUC. This RLS model protects omitted ownership predicates, not arbitrary SQL from a compromised backend. End users get signed cookies, not SQL credentials. |
| How are login/sessions protected? | bcrypt cost 12; 12–72 characters and at most 72 UTF-8 bytes; signed HS256 JWT with subject, issuer/audience/8-hour expiry. HttpOnly/SameSite=Lax cookies and Secure in production. currentUser checks token then reads actual role from PostgreSQL. |
| What prevents injected or cross-origin requests? | Bound SQL parameters, Zod/API validation, Mongo owner predicates and JSON Schema, exact APP_ORIGIN checks for mutations, React escaping and generic service errors. There is an in-process bounded login throttle, not a distributed production limiter. |
| How is the application connected? | Next.js pages/Portal fetch server-only Node route handlers; handlers authenticate/validate and query actual PG/Mongo. Model inference stays server-side. The landing illustration is not real analytics; saved-workout charts are real aggregation output. |
| What did tests actually verify? | Unit validation/hash; real SQL constraints/concurrency/audit/rollback; real Mongo CRUD/aggregation/validator; real embedding/pgvector ranking; actual restricted-login RLS; API persisted flows/role denial; optimized build and 11-page smoke. Current counts are 20 Node-reported including one integration parent, 19 leaf cases. Missing URLs/skips are blockers, not passes. |
| What are the limits/future improvements? | No payments, password reset/email verification, per-session revocation, distributed rate limiter, global distributed transaction, broad relevance/load benchmark or full account lifecycle. Profile form doesn't preload values. Future work: lifecycle reconciliation, guided workout form, pagination, immutable model revision, measured vector-index selection. |
| Is deployment mandatory? | Not in the supplied faculty requirements. A functional localhost demo with installed SQL/Mongo/model prerequisites is the primary target. Do not claim cloud deployment. |
| Who implemented each part? | Use actual Git/PR/file evidence and each student's personal confirmation. AI-assisted attribution is not proof of independent manual work; do not invent percentages or split features after the fact. |

## 10–15 minute practical plan

Prepare two role browser profiles, future slots, cached model, a disposable seeded test DB/console and current logs. Open the source-map files before presenting; never project .env or session headers.

| Time | Action | Explain / expected evidence |
|---|---|---|
| 0:00–1:00 | Motivation/architecture/team | Concrete scheduling/flexible-log problem; SQL/Mongo/vector responsibilities |
| 1:00–2:15 | ER/schema/constraints | Typed profiles, composite FKs, partial unique/exclusion, actual counts |
| 2:15–3:45 | Execute course_demo.sql | Safe DDL/DML, JOINs, nested/correlated query, ordinary and seven-date recursive CTE; ROLLBACK |
| 3:45–5:45 | Trainer slot/overlap; member search/book/cancel | Persisted state, atomic function, trigger/audit, capacity release; one-winner concurrency log |
| 5:45–7:45 | Workout CRUD and Progress | Different document shapes; 2 sessions, 350 volume, 600s/1500m; date filter and owned deletion |
| 7:45–9:00 | Goal matching | Genuine 384D vectors; actual <=> query/results and future capacity filtering |
| 9:00–10:30 | RBAC/negative tests | Actual restricted login, 42501/filtered rows, owner-vs-runtime distinction |
| 10:30–12:00 | Test/build evidence and two-role UI | Correct counts, no skipped integrations, private environment handling |
| 12:00–14:00 | Contributions, limits and viva | Each student explains actual work/concepts; disclose assistance and cross-store limit |

If time is short, use already executed dated logs for contention rather than waiting during the presentation. Do not describe an unavailable live operation as successful. Both students should be able to drive any step; this plan is not a claim of individual feature ownership.

## Rehearsal confirmation — students fill privately

| Student | Date / commit / performed demo steps | Database concept explained | Application concept explained | Contribution evidence reviewed | Remaining questions |
|---|---|---|---|---|---|
| Chhavi S — PES1UG24CS132 | | | | | |
| Chirag Basanth — PES1UG24CS133 | | | | | |

Use the separate blank actual-result table in TEAMMATE_EXECUTION_CHECKLIST.md. Codex's successful runs do not fill these human confirmations.
