# Live evaluation runbook — 16 November 2026

Use the active 384D migrations. Do not execute historical 128D SQL under database/legacy. Docker is optional; no Compose file is supplied.

Prerequisites: Node.js 22+, npm, PostgreSQL with matching pgvector and btree_gist, MongoDB 7+, and the MiniLM model downloaded once. Follow SETUP.md's administrator-created maintenance/runtime roles, databases and extensions; fill both runtime URLs privately. This path keeps the maintenance owner NOCREATEROLE: db:rbac applies owner-granted object permissions to existing runtime logins. Only optional automatic creation of missing runtime roles requires CREATEROLE.

For the full independent laptop/browser/database workflow and blank actual results use [TEAMMATE_EXECUTION_CHECKLIST.md](TEAMMATE_EXECUTION_CHECKLIST.md). For the final source-based viva and timing use [FINAL_VIVA_PREPARATION.md](FINAL_VIVA_PREPARATION.md).

```powershell
npm.cmd ci
# Fresh native installation only; never overwrite an existing private .env:
Copy-Item .env.example .env
# Edit private SQL/Mongo URLs, test databases, SESSION_SECRET and SEED_PASSWORD.
npm.cmd run verify:final -- setup
npm.cmd run verify:final -- checks
npm.cmd start -- --hostname 127.0.0.1
```

For portable services, do not copy .env.example first. Provision pgvector DLL/mongod.exe as described in SETUP.md, run `npm.cmd run services`, and keep that terminal open. It creates/reuses ignored private configuration. Run setup/check/start in another terminal.

Open http://localhost:3000. Member: member@pulsefit.example. Trainers: endurance@pulsefit.example, strength@pulsefit.example, mobility@pulsefit.example. Password: your private SEED_PASSWORD. Use separate browser profiles. Never project .env.

After building, start `npm.cmd run test:server` in another terminal, then:

```powershell
$env:TEST_APP_ORIGIN='http://localhost:3001'
$env:SMOKE_ORIGIN='http://localhost:3001'
$env:ALLOW_API_TEST_FIXTURES='yes'
npm.cmd run verify:final -- http
```

This retains fictitious API fixtures only in disposable test databases. Current logs are docs/evidence/level3-2026-11-16/. A zero exit code with skipped tests is not an integration pass. `test:rbac` uses the actual restricted login; owner connections intentionally bypass RLS.

In an owner psql session run `\i database/postgres/queries/course_demo.sql`. It rolls back its own fixtures and returns a seven-date capacity report. Show correlated EXISTS, nested IN, JOINs, aggregates/HAVING, recursive CTE and safe temporary CREATE/ALTER/DROP.

Follow DEMO_SCRIPT.md for the 10–15 minute presentation. Recovery: refresh conflicted capacity; cancel an owned future reservation to release it. Expired seed times require new trainer availability; seed reruns preserve existing schedules. Stop app/services with Ctrl+C and reopen the same directory to restart. Retain .env, work/postgres and work/mongo. Never delete data to solve startup errors. Publication uses the feature branch and PR, never a main-branch push or automatic merge.
