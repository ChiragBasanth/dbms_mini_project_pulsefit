# PulseFit viva preparation

| Question | Answer tied to the implementation |
|---|---|
| Why PostgreSQL? | Referential integrity and atomic reservations; FKs, exclusion/unique constraints, triggers and row-level policies must survive concurrency. |
| Why MongoDB? | Variable strength/cardio exercise sets fit embedded documents and real aggregation. Strict schema validators still enforce allowed measurements. SQL JSON is also possible; this is a design choice. |
| Why pgvector? | Keep learned text representations beside SQL metadata and rank/filter in the database without another hosted service. |
| What is ACID here? | Atomic booking statements, constraints preserve consistency, READ COMMITTED plus row locks serialize contenders, committed storage is durable. No ACID transaction spans PostgreSQL and MongoDB. |
| Why not SELECT then INSERT? | A race remains without locks/constraints. reserve_slot locks one slot and the partial unique index rejects other confirmed reservations. Eight-client test proves one winner. |
| Why partial UNIQUE? | Historical CANCELLED rows remain while exactly one CONFIRMED booking per slot is allowed. Rebooking creates a new row. |
| How are overlaps prevented? | GiST exclusion on trainer and half-open tstzrange [start,end). Adjacent slots are valid, intersecting slots for one trainer are rejected. Bookings reference those slots. |
| Why composite FKs? | users(id,role) makes profiles role-correct; slot(id,trainer_id) ensures booked trainer matches the slot. |
| CHECK versus trigger? | CHECK handles row facts such as duration; triggers handle transitions and related-row validation; exclusion handles cross-row overlap. |
| Function versus trigger? | reserve_slot/app_reserve_slot are called explicitly. booking_validation, booking_changes and availability_guard run automatically on writes. Audit commits/rolls back with the booking. |
| INNER versus LEFT JOIN? | INNER JOIN connects actual booking identities; LEFT JOIN preserves members/dates with zero bookings/capacity. |
| WHERE versus HAVING? | WHERE filters rows before grouping; HAVING filters grouped results, as demonstrated in course SQL. |
| Nested versus correlated query? | Nested IN finds members via booked trainer IDs. Correlated EXISTS references the current outer trainer/slot to test availability. |
| Recursive CTE and termination? | Anchor current_date, UNION ALL next day until current_date+6; LEFT JOIN actual capacity. Exactly seven dates, including empty days. |
| CTE versus view? | A CTE exists for one statement. Views persist query definitions; the reporting views use security_invoker so caller RLS is respected. |
| Why Mongo $facet? | Count sessions before unwinding sets, while separately computing volume/cardio measures; otherwise multi-set logs inflate session counts. |
| Do SQL FKs validate Mongo userId? | No. API verifies the member and scopes documents. Future account deletion needs cross-store reconciliation/outbox/saga planning. |
| What model/dimension? | Xenova/all-MiniLM-L6-v2, q8 inference, mean pooling, normalization, 384 values. No random/hash fallback. |
| What is cosine similarity? | pgvector <=> is cosine distance; app returns 1-distance. Text similarity is not a fitness outcome prediction or calibrated probability. |
| Why no HNSW? | Exact search suits six exercises/few trainers. Approximate indexes should follow measured scale/recall needs. Ordinary SQL/Mongo indexes already exist. |
| Three RBAC layers? | Portal navigation, API requireUser/owner predicates, PostgreSQL grants/RLS/guarded reservation. R01 deliberately omits API owner filters. |
| Why can't the owner prove RLS? | Owners/superusers normally bypass policies. Use the restricted non-owner NOSUPERUSER/NOBYPASSRLS login; the API rejects privileged runtime configuration. |
| Can a stolen backend credential forge context? | Yes, it can set actor GUC. The backend is trusted; this design protects omitted ownership filters, not arbitrary SQL after backend compromise. End users have no database credentials. |
| Password/session handling? | bcrypt cost 12, 12–72 characters and at most 72 UTF-8 bytes; HS256 issuer/audience/expiry, HttpOnly and SameSite=Lax cookies, Secure in production, private secrets. |
| Main limitations? | No password reset, per-session revocation, distributed rate limit, cross-store transaction, large-load benchmark or independent contribution certification. |

Both students must read the actual source and rehearse the running tests. Git author names do not establish independent personal authorship. See CONTRIBUTIONS.md for verified records and human confirmations.
