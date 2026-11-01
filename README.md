# PulseFit — Hybrid Smart Gym & Trainer Booking System

DBMS Level 3 project by **Chirag Basanth Bellavi (PES1UG24CS133)** and **Chhavi S Wadhwa (PES1UG24CS132)**. Faculty: **Dr. Nagasundari S**, Department of Computer Science and Engineering, PES University.

PulseFit combines PostgreSQL transactions and constraints for accounts and trainer booking, MongoDB for flexible workout records and analytics, and pgvector for cosine-similarity recommendations.

## Requirements and startup

Install Node.js 20+, PostgreSQL 16+ with `pgvector`, and MongoDB 7+. The simplest local option is Docker Desktop:

```powershell
docker compose up -d
```

Copy `.env.example` to `.env`, then replace the values with the local credentials below. The supplied compose file uses database `pulsefit`, user `pulsefit`, and password `pulsefit_local_only` for local evaluation only. Enable extensions supported by the server (`pgcrypto`, `btree_gist`, `vector`). Then run:

```powershell
npm install
Get-Content -Raw database/sql/001_schema.sql | docker compose exec -T postgres psql -U pulsefit -d pulsefit
Get-Content -Raw database/sql/002_seed.sql | docker compose exec -T postgres psql -U pulsefit -d pulsefit
npm run dev
```

Open http://localhost:3000. Do not commit `.env`. The implementation includes registration/login, signed sessions, member profile and booking management, trainer availability and booking decisions, workout CRUD, MongoDB analytics and pgvector recommendation endpoints.

### Local demo credentials

After executing `002_seed.sql`, use either account below. Both use password `PulseFitDemo!2026`.

| Role | Email |
| --- | --- |
| Member | `member.demo@pulsefit.local` |
| Trainer | `trainer.maya@pulsefit.local` |

### Validation

```powershell
npx tsc --noEmit
npm test
npm run build
```

The first two commands were executed successfully on 1 November 2026. `npm test` passed 7 independent tests for session payload validation, Edge HMAC tamper rejection, role route policy and deterministic embeddings. Run the production build, database scripts and service-backed tests from an unrestricted terminal with Docker or local PostgreSQL/MongoDB running.

## DBMS viva guide

- **Exclusion constraint:** GiST compares each confirmed booking's half-open time range; overlapping trainer ranges cannot coexist, even under concurrent writes.
- **Atomic booking:** `create_booking` locks the matching availability row and inserts the confirmed booking. The database constraint is the final integrity boundary.
- **Trigger + audit:** `bookings_audit_trigger` records creation and status transitions.
- **View + indexes:** `trainer_booking_summary` and query indexes support reporting and discovery.
- **MongoDB:** `workout_logs` keeps an extensible typed exercise/set document. Aggregations compute totals, weekly counts, volume and progress.
- **pgvector:** vectors are 128 dimensions and searched by cosine distance. Embeddings use deterministic token and bigram feature hashing; this local reproducible baseline is not a pretrained model, so semantic quality is limited.

See `database/sql/command_gallery.sql`, `mongodb/aggregations/workout-analytics.ts`, `docs/relational-schema.md`, `docs/data-dictionary.md`, and `docs/er-diagram/pulsefit.mmd`.

## Student report status

The requested student and faculty details are included above. Application features requiring live databases cannot be marked tested until PostgreSQL/pgvector and MongoDB are configured and migrations run. Screenshots and final PDF/DOCX report must be produced from a running configured app; no fabricated evidence is included.

## Repository

https://github.com/ChiragBasanth/dbms_mini_project_pulsefit
