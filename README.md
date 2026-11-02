# PulseFit

**Hybrid Smart Gym & Trainer Booking System** — university DBMS Experiential Learning Level 3.

Repository: https://github.com/ChiragBasanth/dbms_mini_project_pulsefit

PulseFit combines database-enforced trainer reservations with flexible workout history and semantic goal matching. The repository was empty at inspection; this implementation was authored for this brief.

## Project team

- **Student 1: Chirag Basanth Bellavi — PES1UG24CS133**
- **Student 2: Chhavi S Wadhwa — PES1UG24CS132**

Names and SRNs were explicitly confirmed by the user. Individual database/application contributions remain pending confirmation; see [contribution record](docs/CONTRIBUTIONS.md).

## Quick start

Use Node.js 22 LTS or later, npm, PostgreSQL with **pgvector + btree_gist**, and MongoDB. Native installation and optional portable setup are explained in [docs/SETUP.md](docs/SETUP.md). Docker is optional.

```powershell
npm ci
Copy-Item .env.example .env
# Edit .env privately: actual database URLs, 32+ character SESSION_SECRET, SEED_PASSWORD.
npm run db:migrate
npm run db:mongo
npm run db:seed
npm run db:embed
npm run dev
```

Open http://localhost:3000. Demo emails: `member@pulsefit.example`, `strength@pulsefit.example`, `endurance@pulsefit.example`, `mobility@pulsefit.example`. The password is **your SEED_PASSWORD**, never a hardcoded shared password. Seed accounts are fictitious. Seeds do not overwrite existing accounts or reset passwords. The first embedding run downloads the quantized MiniLM model; later runs use the ignored local cache. Model failure is reported as service unavailable and never replaced with fake vectors.

On macOS/Linux use `cp .env.example .env`. If PowerShell blocks npm.ps1, use `npm.cmd`. Start with `npm run build` then `npm start` for a production smoke check. The production server uses Secure cookies; localhost is supported by modern browsers, and a remote deployment requires HTTPS and matching APP_ORIGIN. No deployment was performed.

## Workflows

- Register as MEMBER or TRAINER. Passwords require 12–72 characters and at most 72 UTF-8 bytes; bcrypt cost 12. Sessions expire after eight hours.
- A trainer writes a bio/specialties on Overview and creates future availability. Bio saving generates its real embedding, so the model must be available.
- Members search trainers, inspect available slots, reserve, view history and cancel their own future bookings. A cancelled booking remains in history and releases the slot.
- Members log strength/cardio/mobility sessions, edit/delete their own entries and filter by date/type. The flexible JSON workout editor includes strength and cardio examples; use numeric kg, seconds and metres.
- Progress queries MongoDB aggregation. The landing-page bars are explicitly labeled an illustration; they are not claimed to be analytics.
- Goal matching embeds free text and queries PostgreSQL cosine distance. Trainer results require an indexed bio and an open, unoccupied future slot.

## Architecture

Next.js App Router → server-only route handler → PostgreSQL and MongoDB. All database access and model inference run on Node.js. PostgreSQL manages users, role-specific profiles, availability, bookings, audit and catalog embeddings. MongoDB stores varied exercise/set records. A PostgreSQL UUID is the MongoDB member reference; no distributed ACID guarantee is claimed.

Reservations call `reserve_slot(member,slot)`. The function locks the slot; a partial unique index protects every insert against multiple confirmed bookings. A GiST exclusion constraint prevents arbitrary overlapping trainer intervals. Validation and audit triggers, utilization/upcoming views, migrations, query indexes, NoSQL aggregation and vector retrieval provide more than four advanced concepts.

## Verification

```powershell
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run build
# Terminal 2: app using explicitly configured disposable test databases
node --import tsx scripts/test-server.ts
# Terminal 3:
$env:TEST_APP_ORIGIN='http://localhost:3001'
$env:ALLOW_API_TEST_FIXTURES='yes'
npm run test:api
```

Set TEST_DATABASE_URL and TEST_MONGODB_URI/DB first. Tests refuse database names not ending in `_test`; missing configuration is a **skip/blocker**, never an integration pass. Integration tests create and drop only their own PostgreSQL schema and delete only their own MongoDB fixture UUIDs. Extensions may remain installed. API tests retain fictitious accounts and reservations in the disposable test DB for inspection. Do not point the API test server at a real user database.

The concurrency test releases eight separately acquired PostgreSQL connections through a shared barrier, asserts one committed winner and seven unique violations, then checks cancellation, audit and rebooking. The API test independently asserts one 201 and one 409 under parallel HTTP requests. [Observed test results](docs/TEST_RESULTS.md) and raw [evidence logs](docs/evidence/) document what actually ran.

## Academic deliverables

- [Initial audit](docs/IMPLEMENTATION_AUDIT.md) and [requirements matrix](docs/REQUIREMENTS_MATRIX.md)
- [ER diagram](docs/ER_DIAGRAM.md), [relational schema](docs/RELATIONAL_SCHEMA.md), [data dictionary](docs/DATA_DICTIONARY.md)
- [Project report](docs/DBMS_PROJECT_REPORT.md) with the nine required headings and [printable PDF](docs/DBMS_PROJECT_REPORT.pdf)
- [Seven-minute demo](docs/DEMO_SCRIPT.md) and [screenshot checklist](docs/SCREENSHOT_CHECKLIST.md)

## Limits and authorship

This is a local academic demonstrator. It has no payment system, password reset, email verification, per-session revocation or distributed rate limiter. The in-process login throttle is appropriate to this single-process demo; scale-out requires a shared limiter. DB credentials are server-only and must use least privilege in deployment. MongoDB cannot enforce a PostgreSQL FK: users have no deletion API, and reconciliation is required before adding cross-store account deletion. Never assign student authorship or commit history that did not occur. Both students must review, understand and make identifiable database and application contributions according to their instructor's policy.
