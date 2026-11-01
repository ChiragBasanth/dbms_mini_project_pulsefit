# Evaluation checklist

| Requirement | Status | Evidence |
|---|---|---|
| Normalized PostgreSQL design | Implemented, not executed | `database/sql/001_schema.sql` |
| Double-booking constraint | Implemented, not executed | `trainer_no_confirmed_overlap` exclusion constraint |
| Trigger, function, view and indexes | Implemented, not executed | `database/sql/001_schema.sql` |
| MongoDB flexible workout model | Implemented, not executed | `lib/workout-model.ts` |
| MongoDB analytics | Implemented, not executed | `mongodb/aggregations/workout-analytics.ts` |
| pgvector retrieval | Implemented, not executed | `lib/semantic-search.ts` |
| Registration/login/session security | Implemented; TypeScript checked | `app/api/register`, `app/api/login`, `lib/auth.ts` |
| Role/ownership authorization | Implemented; TypeScript checked | `lib/authorization.ts`, bookings/workouts routes |
| TypeScript validation | Completed and tested | `npx tsc --noEmit` passed on 2026-11-01 |
| Independent session, Edge HMAC and embedding tests | Completed and tested | `npm test`: 7 passed on 2026-11-01 |
| Member booking history, profile, workouts and analytics UI | Implemented, not service-tested | `app/booking-history`, `app/profile`, `app/workouts`, `app/analytics` |
| Trainer profile, availability, bookings and dashboard UI | Implemented, not service-tested | `app/trainer/*`, `app/api/trainer/*` |
| Production build/screenshots/database tests | Pending live execution | Run from unrestricted terminal with PostgreSQL/pgvector and MongoDB configured |
| Live execution and evidence procedure | Ready to run | `docs/live-evaluation-runbook.md` |
