"""Generate source-linked academic Markdown; no invented tree or screenshots."""
from pathlib import Path
import json,re
ROOT=Path(__file__).resolve().parent.parent
D=ROOT/'docs'
def read(p):return (ROOT/p).read_text(encoding='utf-8-sig')
def code(p,lang='sql',text=None):return f'\nSource: `{p}`.\n\n```{lang}\n{(read(p) if text is None else text).strip()}\n```\n'
requirements=[
('1. Unique meaningful title','Double-booking and flexible tracking problem; title selected','README.md; docs/DBMS_PROJECT_REPORT.md','Live booking and analytics; section uniqueness unconfirmed','PARTIAL','Instructor confirms title uniqueness'),
('2. Two-person team and both contribute','Chirag Basanth Bellavi — PES1UG24CS133; Chhavi Siddarth Wadhwa — PES1UG24CS132; contributions pending','docs/CONTRIBUTIONS.md','No student contribution history supplied','BLOCKED','Team approval and confirmed contributions with evidence'),
('3. SQL plus NoSQL/vector','PostgreSQL + MongoDB + pgvector','src/lib/db.ts; database/','Live migrations, I01, I07, I08','COMPLETE','None for local demo'),
('4. Database design','ER, typed FKs, constraints, schema, dictionary and vector metadata','docs/ER_DIAGRAM.md; docs/RELATIONAL_SCHEMA.md; docs/DATA_DICTIONARY.md','Migrations executed against PostgreSQL','COMPLETE','None for local demo'),
('5. SQL DDL','CREATE, safe ALTER, temporary DROP, indexes and views','database/postgres/migrations/; database/postgres/queries/course_demo.sql','I06 and captured SQL outputs','COMPLETE','None'),
('6. DML and meaningful queries','Domain INSERT/UPDATE/DELETE/SELECT; joins, aggregates, HAVING, CTE/subquery','database/postgres/queries/course_demo.sql; src/app/api/[...path]/route.ts','Live SQL and API tests','COMPLETE','None'),
('7. At least four advanced concepts','Transactions, views, functions, triggers, indexes, exclusion, Mongo aggregation, vector search','database/postgres/migrations/001_core.sql; src/lib/workouts.ts','I01–I08; API 201/409','COMPLETE','None'),
('8. Semantic search','Quantized MiniLM, 384-D, cosine, metadata filters, exact retrieval','src/lib/embedding.ts; scripts/embed.ts; API recommendations branch','I08 paraphrase scores; real UI search','COMPLETE','Broader relevance evaluation is future work'),
('9. Next.js interface','Role portals, forms, tables, search, date/type filters and real charts','src/app/; src/components/Portal.tsx','Build plus real desktop/mobile browser screenshots','COMPLETE','JSON editor can be simplified in future'),
('10. Database/API integration','Server-only handlers, environment credentials, parameterized queries','src/app/api/[...path]/route.ts; src/lib/db.ts; .env.example','A01 and live browser workflows','COMPLETE','None for local demo'),
('11. Authentication/authorization','MEMBER/TRAINER, bcrypt, signed cookies, ownership predicates','src/lib/auth.ts; API route','A01 login, 401/403/404 and isolation','COMPLETE','Production revocation/reset outside scope'),
('12. Validation/integrity','PostgreSQL constraints/triggers; Mongo validator; Zod inputs','database/postgres/migrations/; database/mongo/setup.ts; src/lib/validation.ts','U01–U08; I04/I05/I07; A01','COMPLETE','None for local demo'),
('13. Security','Hashed passwords, HttpOnly sessions, Origin checks, no client secrets','src/lib/auth.ts; src/lib/errors.ts; docs/SECURITY_AND_CONSISTENCY.md','Hash and unauthorized-request tests; no deployment claim','COMPLETE','Production hardening documented'),
('14. Documentation','Report, design, setup, tests and app images; source/terminal image checklist','docs/; README.md','Actual images and raw logs exist','PARTIAL','Capture remaining code/terminal images if required'),
('15. Git/GitHub and contributions','Local git initialized with requested origin; README and source ready','docs/IMPLEMENTATION_AUDIT.md; docs/CONTRIBUTIONS.md','Local PR preparation; no remote publication; academic contributions unverified','PARTIAL','Students review and commit under actual identities; authorize push'),
('16. Evaluation/demonstration','Seven-minute script and evidence-based results','docs/DEMO_SCRIPT.md; docs/TEST_RESULTS.md','Local app and database flows exercised','PARTIAL','Student-led live presentation and contribution explanation'),
('17. Originality','Implementation authored for supplied brief; AI assistance disclosed','docs/CONTRIBUTIONS.md; docs/IMPLEMENTATION_AUDIT.md','No prior app copied; institutional policy unverified','PARTIAL','Instructor confirms assistance policy and originality expectations'),
('18. Level 3 beyond CRUD','Concurrency invariants + aggregation + semantic retrieval','database/; src/lib/; tests/','Actual DB and HTTP experiments','COMPLETE','None for technical local demo'),
]
header='| Requirement | Weight/Marks | Implementation | Evidence/File | Verification | Status | Remaining Work |\n|---|---|---|---|---|---|---|\n'
matrix=header+'\n'.join('| '+' | '.join([r[0],'Not provided',r[1],f'`{r[2]}`',r[3],r[4],r[5]])+' |' for r in requirements)
(D/'REQUIREMENTS_MATRIX.md').write_text('# Course requirements matrix\n\nAll 18 numbered requirements from the supplied four-page course document are mapped below. No official marks were provided. COMPLETE refers to the verified local academic scope, not public deployment or student contribution certification.\n\n'+matrix+'\n',encoding='utf-8')
excluded={'node_modules','.next','.git','.cache','work','screenshots','evidence','__pycache__'}
def tree(path,prefix=''):
 items=sorted([x for x in path.iterdir() if x.name not in excluded and (not x.name.startswith('.env') or x.name=='.env.example') and not x.name.endswith(('.tsbuildinfo','.pdf','.docx','.zip'))],key=lambda x:(x.is_file(),x.name))
 out=[]
 for i,p in enumerate(items):
  last=i==len(items)-1;out.append(prefix+('└── ' if last else '├── ')+p.name+('/' if p.is_dir() else ''))
  if p.is_dir():out+=tree(p,prefix+('    ' if last else '│   '))
 return out
# Ensure the generated report is present before enumerating the real tree.
report_path=D/'DBMS_PROJECT_REPORT.md'
report_path.touch(exist_ok=True)
real_tree='pulsefit/\n'+'\n'.join(tree(ROOT))
(D/'PROJECT_TREE.txt').write_text(real_tree+'\n',encoding='utf-8')
pkg=json.loads(read('package.json'))
stack=[('Frontend','Next.js '+pkg['dependencies']['next']+'; React '+pkg['dependencies']['react-dom'],'App Router, responsive role portals'),('Language','TypeScript '+pkg['devDependencies']['typescript'],'Strict API/component types'),('Backend','Next.js Node.js route handlers; pg; mongodb; Zod','Server-only connections, validation, parameter binding'),('SQL','PostgreSQL 18.6 portable runtime; btree_gist','Relational integrity, transactional reservations, exclusion constraints'),('NoSQL','MongoDB 8.2.6 real mongod; MongoDB driver','Variable workout/set documents and aggregation'),('Vector','pgvector 0.8.7; Transformers.js; Xenova/all-MiniLM-L6-v2','Real normalized 384-D model embeddings and exact cosine search'),('Authentication','bcryptjs cost 12; jose HS256 JWT; HttpOnly cookies','Password hashing and signed expiring sessions'),('Testing','node:test via tsx; ESLint; tsc; browser tool','Unit, database, HTTP, production build and visible UI checks'),('Version control','Git; requested GitHub origin','Local inspectable changes; no artificial commits'),('Runtime','Node.js v26.13.0; npm 11.20.0 observed','Node 22 LTS or later documented; package-lock included')]
stack_table='| Layer | Technology | Purpose and justification |\n|---|---|---|\n'+'\n'.join('| '+' | '.join(r)+' |' for r in stack)
sql=read('database/postgres/migrations/001_core.sql')
def sqlfn(name):return re.search(r'CREATE FUNCTION '+name+r'\(.*?END \$\$;',sql,re.S).group(0)
api=read('src/app/api/[...path]/route.ts')
rec=api[api.index('if (route === "recommendations"'):api.index('throw new HttpError(404, "Endpoint not found")')]
shots=[('01-landing-desktop.jpg','Running landing page at the desktop breakpoint. Progress bars here are explicitly illustrative.'),('01-landing-mobile.jpg','Running landing page at the narrow default viewport, showing responsive layout.'),('02-member-dashboard.jpg','Authenticated fictitious member dashboard before the first booking.'),('03-trainer-dashboard.jpg','Authenticated fictitious trainer dashboard displaying the member appointment.'),('03-trainer-availability.jpg','Trainer form after a real availability INSERT succeeded.'),('04-booking-history.jpg','Member history with a genuinely committed CONFIRMED reservation.'),('05-availability-overlap-rejected.jpg','Actual overlapping availability rejection. This is an availability conflict, not a screenshot of duplicate reservation rejection.'),('06-workout-history.jpg','Two real saved MongoDB logs with differing strength/cardio shapes.'),('07-progress.jpg','Actual MongoDB-derived two-session and 350 kg×reps dashboard.'),('08-recommendations.jpg','Real goal query and pgvector-ranked mobility exercise; no hardcoded result list.')]
images=''
for i,(filename,caption) in enumerate(shots,1):
 if(D/'screenshots'/filename).exists():images+=f'\n![Figure {i}: {caption}](screenshots/{filename})\n\n**Figure {i}.** {caption}\n'
 else:images+=f'\n**Pending screenshot {i}:** {caption} Expected file: `screenshots/{filename}`.\n'
results=read('docs/TEST_RESULTS.md') if (D/'TEST_RESULTS.md').exists() else 'See TEST_RESULTS.md when final verification completes.'
report=f'''# 1. TITLE

**PulseFit – Hybrid Smart Gym & Trainer Booking System**

DBMS Experiential Learning – Level 3 Project. Evidence recorded on 1 November 2026, Asia/Calcutta.

**Student 1: Chirag Basanth Bellavi — PES1UG24CS133**

**Student 2: Chhavi Siddarth Wadhwa — PES1UG24CS132**

Repository: https://github.com/ChiragBasanth/dbms_mini_project_pulsefit

## 1.1 Problem statement

Gym members and trainers need a shared schedule that prevents simultaneous confirmed reservations, preserves cancellation history and supports workouts whose measurements differ by activity. A single rigid workout row cannot naturally represent both weighted sets and timed cardio. Members also need a way to describe fitness goals beyond selecting fixed categories.

## 1.2 Objectives and scope

Provide transactionally safe, capacity-one trainer booking; role-authorized scheduling; owned workout history and progress; and goal-to-exercise/trainer semantic matching. Scope includes local university demonstration, reproducible migrations/seeds and evidence. Payments, medical advice, administration, email delivery, public hosting and distributed cross-store transactions are outside the implementation.

# 2. STUDENTS' SRN AND NAME

Student 1: Chirag Basanth Bellavi — PES1UG24CS133

Student 2: Chhavi Siddarth Wadhwa — PES1UG24CS132

Both names and SRNs were explicitly confirmed by the user. Team approval and individual contributions remain pending confirmation. No GitHub handle was used to infer a student identity. See Appendix B and `CONTRIBUTIONS.md` for the contribution record; no individual work is attributed without evidence. This submission requires student review and instructor-policy confirmation for AI assistance.

# 3. ABSTRACT

PulseFit addresses conflicting trainer reservations and inflexible gym workout tracking through a hybrid database application. PostgreSQL stores identities, typed roles, schedules, reservations and audit history. Row-level locks, a partial unique index and a GiST interval exclusion constraint provide transactional reservation integrity. MongoDB stores variable exercise/set documents and computes member-scoped session counts, resistance volume and cardio measures. PostgreSQL pgvector stores normalized 384-dimensional MiniLM sentence embeddings for goal-based exercise and available-trainer retrieval. A Next.js interface integrates both databases through authorized server-only handlers. Local tests demonstrated one successful reservation among eight concurrent database clients, safe cancellation/rebooking, validated workout CRUD, exact fixture aggregates and semantic ranking from paraphrased text. HTTP and browser checks exercised member and trainer journeys. The implementation makes no distributed ACID claim; attributable student contributions and institutional originality approval remain outstanding.

# 4. TECH STACK

{stack_table}

## 4.1 Architecture and data flow

```mermaid
flowchart LR
 B[Member / Trainer browser] -->|HTTPS in deployment; localhost for demo| N[Next.js App Router]
 N --> A[Server-only API: auth, validation, ownership]
 A --> P[(PostgreSQL: users, slots, bookings, audit)]
 A --> M[(MongoDB: workout_logs)]
 A --> E[Local MiniLM sentence encoder]
 E --> V[(pgvector 384-D in PostgreSQL)]
 M --> G[Member-scoped aggregation]
 G --> B
 V --> R[Cosine-ranked exercise and available trainer results]
 R --> B
```

SQL was chosen for strong relational references and conflicting reservation writes. MongoDB was chosen for nested, optional strength/cardio measurements and aggregation. Vector columns share PostgreSQL identities and metadata, avoiding an extra vector service. The model runs locally after one download; no paid API or fabricated embedding fallback is present. Database secrets are never NEXT_PUBLIC variables.

## 4.2 ER diagram

{read('docs/ER_DIAGRAM.md').split(chr(10),1)[1]}

## 4.3 Relational schema and normalization

{read('docs/RELATIONAL_SCHEMA.md').split(chr(10),1)[1]}

## 4.4 Data dictionary

{read('docs/DATA_DICTIONARY.md').split(chr(10),1)[1]}

# 5. SQL – DATABASE COMMANDS

Commands below are actual repository excerpts. Apply migrations in filename order with `npm run db:migrate`; checksums and advisory locking prevent conflicting or silently edited migrations. Observed execution: both migrations applied successfully; `evidence/migrations.txt`. Real query output is captured in `evidence/sql-inspect.json` and `evidence/sql-course_demo.json` when the capture script is run.

## 5.1 CREATE, keys, constraints and indexes

The following creates the core relations, role-specific FKs, composite booking/slot FK and capacity-one partial unique index. Trainer overlap is a cross-row exclusion constraint, not an invalid CHECK subquery.
{code('database/postgres/migrations/001_core.sql',text=sql.split('CREATE FUNCTION validate_booking')[0])}

## 5.2 ALTER and safe DROP

The additive profile location migration is meaningful and preserves existing rows with a default.
{code('database/postgres/migrations/002_profile_metadata.sql')}

The executable course demonstration creates/alters/drops only a temporary DDL table, then performs domain CRUD on newly generated fixture identities. Everything is rolled back. Its copied password hash is a fixture hash from the seeded member, never a new plaintext credential. No production account is altered.

## 5.3 DML, joins, grouping, aggregates and subqueries
{code('database/postgres/queries/course_demo.sql')}

Expected effects: fixture INSERT/UPDATE/DELETE are visible inside the transaction, joins display booking context, LEFT JOIN retains members with zero bookings, HAVING filters grouped counts, and the CTE/subquery compares trainer reservation totals with their average. Observed: I06 executed this exact script successfully and verified rollback. Results vary with seeded/demo bookings; no fabricated fixed row count is asserted.

## 5.4 Transactionally safe reservation function
{code('database/postgres/migrations/001_core.sql',text=sqlfn('reserve_slot'))}

The function is SECURITY INVOKER and called with bound authenticated member UUID and slot UUID. One SQL statement executes in a PostgreSQL transaction; READ COMMITTED is the default isolation assumption. `FOR UPDATE` serializes competing callers on the slot. The unique partial index independently rejects a second confirmed booking, including paths outside the function. Unknown slots raise P0002; unavailable/window violations raise 23514; unique conflicts raise 23505 and map to HTTP 409.

Cancellation uses an owned future booking UPDATE to CANCELLED, leaving the old row/audit trail. The partial index no longer includes that row and a new reservation can succeed. Times and trainer identity are immutable. Concurrent cancellation/booking contention can make PostgreSQL choose a deadlock victim; its transaction rolls back and the user may refresh/retry. No claim of globally serializable operation across databases is made.

## 5.5 Validation and audit triggers
{code('database/postgres/migrations/001_core.sql',text=sqlfn('validate_booking'))}
{code('database/postgres/migrations/001_core.sql',text=sqlfn('audit_booking'))}

`booking_validation` is a BEFORE INSERT/UPDATE trigger; `booking_changes` is an AFTER INSERT/UPDATE OF status trigger. `availability_guard` prevents invalid insertion windows, time/identity changes and closing an occupied slot. These invariants remain effective for direct database writes. They complement, rather than trust, API validation.

## 5.6 Views and query indexing
{code('database/postgres/migrations/001_core.sql',text=sql[sql.index('CREATE VIEW upcoming_bookings'):])}

`upcoming_bookings` provides joined member/trainer/slot context. `trainer_utilization` retains trainers with no slots through LEFT JOIN. Availability and booking owner indexes match real API predicates; no unmeasured performance improvement is claimed. Exact vector scans are intentional for six exercise rows and three seeded trainers.

## 5.7 Parallel reservation experiment and failure behavior

`tests/integration.test.ts` acquired eight independent pooled connections before releasing a shared promise barrier. All invoked `reserve_slot` for the same slot. Observed: **one success, seven SQLSTATE 23505 failures, exactly one confirmed row**. Cancellation followed by rebooking succeeded; audit count was three (initial reservation, cancellation, second reservation). The rollback test restored the confirmed state. The HTTP test additionally observed one 201 and one 409 from parallel booking requests. Raw evidence: `evidence/test-integration.txt` and `evidence/api.txt`.

# 6. NOSQL / VECTOR DATABASE COMMANDS

## 6.1 MongoDB collection and validation

`workout_logs` uses BSON ObjectIds and dates; `userId` is the PostgreSQL member UUID string, supplied by the session. A representative **schema example** (not a claimed database screenshot):

```javascript
{{
 userId: '<authenticated PostgreSQL member UUID>',
 performedAt: ISODate('2026-01-01T10:00:00Z'),
 createdAt: ISODate('2026-01-01T10:01:00Z'),
 workoutType: 'MIXED',
 notes: 'Strength plus cardio',
 exercises: [
  {{name:'Squat',sets:[{{reps:10,weight:20}},{{reps:5,weight:30}}]}},
  {{name:'Cycling',sets:[{{duration:600,distance:1500}}]}}
 ]
}}
```

`database/mongo/setup.ts` installs a strict `$jsonSchema` validator requiring userId, timestamps, workout type and nonempty exercise/set arrays. Numeric minima/maxima reject invalid measurements, and sets need reps or duration. Compound indexes support member/date and member/type/date queries. The application additionally rejects future performedAt values. ObjectId conversion validates hex format and serialization returns hex strings. Each query/update/delete includes the session userId; another user's ID is never accepted from the JSON body.

## 6.2 Executable CRUD and aggregation commands
{code('database/mongo/course_demo.mongosh.js','javascript')}

`insertOne` saves a document, `findOne` reads the owned fixture, `updateOne` changes only that fixture and `deleteOne` removes it. The script refuses databases not ending in `_test`. The application's history route also supports date/type filters and descending order, limited to 100 rows per request.

The actual analytics pipeline is below. `$facet` counts sessions before exercise unwinding, preventing inflated counts. `$ifNull` treats missing strength measurements as zero and reports cardio duration/distance separately.
{code('src/lib/workouts.ts','typescript')}

Observed I07: two sessions on 2026-01-01; Squat volume 350, cardio volume 0, duration 600 seconds and distance 1500 metres. Cross-user update/delete matched zero; malformed measurement insertion failed with MongoDB validation code 121. The visible demonstration used the same measures in independently saved logs and produced two sessions and 350 on the dashboard.

## 6.3 Embedding generation and storage
{code('src/lib/embedding.ts','typescript')}

Model: **Xenova/all-MiniLM-L6-v2**, quantized q8 ONNX via Transformers.js. Dimension: **384**. Mean pooling and L2 normalization are applied. Preprocessing trims, collapses whitespace and lowercases identically at indexing and query time. Exercise name/description and trainer bio/specialties become embeddings, stored with the exact model identifier in vector(384) columns. Reproducibility comes from fixed seed texts, model ID and deterministic inference; small floating-point differences across CPU runtimes are possible. The remote model revision is not cryptographically pinned, a reproducibility limitation.

Run `npm run db:seed` then `npm run db:embed`; observed six exercise and three trainer embeddings were generated. A missing model/runtime produces an explicit service failure, not keyword matching or random vectors. Initial model download and ONNX runtime are dependencies.

## 6.4 Actual vector retrieval and metadata filtering
{code('src/app/api/[...path]/route.ts','typescript',rec)}

pgvector `<=>` computes cosine distance. Results sort by ascending distance; displayed similarity is `1 - distance`, not a probability or medically validated suitability score. Exercise category filtering is parameterized. Trainers must have a compatible indexed model and at least one open, future, unoccupied slot. Exact search is adequate at this scale; no HNSW index is claimed or needed. `database/postgres/queries/semantic_search.sql` supplies an executable prepared-query example using actual embeddings supplied by the encoder.

Observed paraphrase test: the query about getting out of breath and lasting longer ranked aerobic training at **0.4065922983** over shoulder strength at **0.1471995852**, without relying on exact category words. Browser goal matching about stiffness after desk work returned Hip mobility flow first (58.5% text similarity) and Mira Das first among available trainers (63.8%). This is a small, meaningful semantic test, not a comprehensive recommendation-quality benchmark.

## 6.5 Cross-database consistency limits

PostgreSQL transactions do not encompass MongoDB writes. Log ownership references are checked by the server but are not cross-database foreign keys. No member-deletion endpoint exists. A future administrative deletion requires a reconciliation/outbox/saga design. Bio text and its embedding update atomically in PostgreSQL after inference succeeds; bulk embedding refresh is per-row, not one global transaction. See `SECURITY_AND_CONSISTENCY.md`.

# 7. NEXT.JS – PROJECT TREE STRUCTURE

This tree is enumerated from actual files by `scripts/generate-report.py`. It excludes node_modules, .next, .git, secrets, model/runtime files, screenshot binaries and raw evidence clutter. `docs/screenshots/` and `docs/evidence/` exist separately and are cited throughout.

```text
{real_tree}
```

## 7.1 Application integration

`src/app/layout.tsx` defines shared chrome. The landing page is `src/app/page.tsx`. `[view]/page.tsx` whitelists dashboard, trainers, bookings, workouts, analytics, recommendations, availability, appointments, login and register. `trainers/[id]/page.tsx` opens a real trainer profile. `Portal.tsx` contains interactive forms, tables, loading/error/empty states and aggregation-based charts. The workout editor exposes flexible JSON plus examples; a friendlier exercise form is future usability work.

`src/app/api/[...path]/route.ts` is the actual server-only Node.js route, not an invented route tree. It dispatches auth, me, profile, trainers, availability, bookings, workouts, analytics and recommendations. `requireUser` enforces roles before writes and resource predicates enforce ownership. `db.ts` maintains pooled server connections; no browser component imports database clients. `scripts/` contains migration, seed, embedding, test-server, optional portable-service and evidence commands.

## 7.2 API contract

| Method and endpoint | Authorization | Effect |
|---|---|---|
| POST /api/auth/register, /login | Same-origin; validated credentials | Hash/create typed user profile or authenticate; set session |
| POST /api/auth/logout | Same-origin | Clear session cookie |
| GET /api/me | Optional session | Current safe user fields or null |
| GET /api/trainers[/id]?q= | Authenticated | Search joined trainer profiles |
| PUT /api/profile | Authenticated owner | Save goals or trainer bio/specialties/embedding |
| GET /api/availability?trainerId= | Authenticated | Future slots and current occupancy |
| POST /api/availability | TRAINER | Insert own slot |
| DELETE /api/availability/id | TRAINER owner | Close own unoccupied slot |
| GET /api/bookings | Authenticated | Own member bookings or trainer appointments |
| POST /api/bookings | MEMBER | Invoke reserve_slot |
| DELETE /api/bookings/id | MEMBER owner | Cancel own future confirmed reservation |
| GET/POST/PUT/DELETE /api/workouts[/id] | MEMBER owner | Scoped workout CRUD; date/type filters |
| GET /api/analytics | MEMBER | Real user/date-scoped MongoDB aggregation |
| POST /api/recommendations | MEMBER | Embed goal, query pgvector, save own goal |

# 8. FEW SAMPLE SCREENSHOTS OF APPLICATION CODE AND DEMO

These are genuine browser captures from the locally running application using fictitious demo accounts. They are not mockups, generated graphics or screenshots of fabricated terminal output. Source code itself is quoted verbatim in sections 5–6. Dedicated editor/terminal/DB-console screenshots remain pending and have precise capture instructions in `SCREENSHOT_CHECKLIST.md`. Duplicate reservation rejection is proved by actual DB/HTTP logs; the conflict image below specifically demonstrates availability overlap.
{images}

# 9. EVALUATION RUBRICS – COMPLETION STATUS

The supplied course document contains no official rubric weights or marks. The table therefore records **Not provided** and maps each of its 18 requirements. COMPLETE denotes verified technical local scope; teamwork/academic certification is not silently assumed.

{matrix}

## 9.1 Measured testing outcomes

{results.split(chr(10),1)[1] if results.startswith('#') else results}

## 9.2 Conclusion

The local implementation demonstrated its primary DBMS outcomes: PostgreSQL prevented duplicate confirmed reservations under concurrent calls, MongoDB handled varied owned workouts and accurate aggregation, and pgvector retrieved semantically related exercise/trainer records from actual model embeddings. Next.js exposed these operations through tested role-aware APIs and visibly exercised interfaces. Technical success does not complete the two-person contribution or institutional approval requirements; those remain explicit.

## 9.3 Limitations and future work

The demonstration has not been deployed or load-tested at production scale. The in-memory authentication throttle is single-process, sessions lack individual revocation, and account reset/email verification are absent. Analytics provide saved-history measures rather than inferred fitness outcomes. History endpoints cap results without pagination. Closed availability still blocks its original interval; create a different time. The JSON logger can be replaced with an accessible guided multi-exercise form. Future work can add broader semantic relevance evaluation, immutable model revisions, pagination, shared rate limiting, account lifecycle reconciliation and measured vector-index selection. None of these is represented as completed.

## Appendix A. Reproduction and live demonstration

Follow `README.md` and `SETUP.md`. Run migrations, Mongo validation, seed and embedding commands before starting the app. `npm run verify` records lint/typecheck/unit/integration/build commands and exit codes. For HTTP tests, start `npm run test:server` and run `npm run test:api` with the documented test-origin/fixture flags. Missing service configuration is reported as a skip/blocker, never counted as passed. `DEMO_SCRIPT.md` organizes a seven-minute presentation around actual database concepts.

## Appendix B. Individual contributions and authorship

{read('docs/CONTRIBUTIONS.md').split(chr(10),1)[1]}

## Appendix C. Evidence sources and references

- Instructor document: *DBMS Level 3 Project Requirements draft.pdf*, supplied local four-page draft. It defines the 18 requirements and provides no official marks. The user prescribed the nine main report headings used here.
- PostgreSQL explicit locking: https://www.postgresql.org/docs/current/explicit-locking.html
- pgvector upstream and Windows build instructions: https://github.com/pgvector/pgvector
- Model repository and Transformers.js usage: https://huggingface.co/Xenova/all-MiniLM-L6-v2
- Next.js cookies/route handler reference: https://nextjs.org/docs/app/api-reference/functions/cookies
- Actual implementation, tests, logs and images in this checkout. Generated source excerpts and the filtered tree come from files, not a hypothetical architecture.

## Appendix D. Final handoff

Initial workspace: empty non-git directory; remote API also reported empty. A local checkout was initialized. During later authorized PR preparation, a minimal local main commit and feature branch were prepared using the Git author explicitly supplied by the user. Both students' names and SRNs are confirmed. No push, merge, deployment or manufactured contribution claim occurred. Contribution records, title uniqueness/instructor approval and remaining console/code screenshots require human completion. Private runtime credentials exist only in ignored local .env and must never be submitted in the report.
'''
report_path.write_text(report,encoding='utf-8')
print('Generated requirements matrix, real project tree and academic Markdown report')
