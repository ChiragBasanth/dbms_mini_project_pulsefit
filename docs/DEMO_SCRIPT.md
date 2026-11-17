# PulseFit: 10–15 minute faculty demonstration

Design figures: [ER](ER_DIAGRAM.md), [physical relational schema](RELATIONAL_SCHEMA.md), [hybrid architecture](HYBRID_DATA_MODEL.md). Use the scalable SVGs from [database-design](database-design/README.md); zoom table groups for presentation. Explain 0..many historical bookings versus partial confirmed uniqueness, and identify composite reference superkeys correctly.

Prepare with live-evaluation-runbook.md and SETUP.md. Run all setup/check/HTTP commands beforehand. Keep member and trainer browser profiles ready, fresh slots available, database processes running and model cached. Never project passwords.

| Time | Action | DBMS explanation / evidence |
|---|---|---|
| 0:00–1:00 | Motivation, team and architecture | Double-booking and variable workout structures; SQL/NoSQL/vector responsibilities |
| 1:00–2:15 | ER diagram and relational schema | Typed profiles, composite FKs, booking/slot cardinality, half-open ranges |
| 2:15–3:15 | Migrations 001–003 | PK/FK/UNIQUE/CHECK, GiST overlap exclusion, partial unique booking index, database RLS |
| 3:15–4:30 | Execute course_demo.sql | Correlated EXISTS, nested IN, INNER/LEFT JOIN, GROUP BY/HAVING, seven-day WITH RECURSIVE; temporary CREATE/ALTER/DROP and rolled-back domain DML |
| 4:30–6:00 | Trainer creates slot, rejects overlap; member reserves | reserve_slot row lock; eight-client test gives one winner/seven 23505; HTTP test gives 201/409 |
| 6:00–6:45 | Cancel and rebook | Historical cancellation, partial index releases capacity, transactional booking_changes audit |
| 6:45–8:15 | Strength/cardio workout CRUD | Mongo workout_logs: reps/weight versus duration/distance, strict validation, own edit/delete and filters |
| 8:15–9:00 | Progress and aggregation | Owner $match, $facet, $unwind, $group and $sort. I07 fixture expects 2 sessions, 350 kg×reps, 600s/1500m; these are not automatically the live user's totals |
| 9:00–10:15 | Goal: Improve stamina and cardiovascular endurance | Genuine MiniLM 384D, mean pooling/normalization, PostgreSQL cosine <=> and 1-distance; show exercise and available trainer ranking |
| 10:15–11:30 | Run test:rbac | Restricted login rejects member availability creation, trainer reservation, cross-user cancellation, role updates and audit deletion; pool actor reset |
| 11:30–12:30 | Member/trainer interfaces, route and test logs | Signed cookies, DB role lookup, Origin/Zod/bcrypt; build and 11-page smoke |
| 12:30–14:00 | Contributions, limitations and viva | Actual Git/PR evidence; no fabricated independent authorship or distributed ACID claim |

Both students rehearse the complete system; no arbitrary division of ownership is asserted. For a 10-minute slot, shorten navigation and show already executed contention/HTTP logs. If a live service fails, state that result and distinguish dated evidence from the failed action. Check startup/recovery once before faculty evaluation.
