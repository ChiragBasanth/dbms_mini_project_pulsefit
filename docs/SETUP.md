# Setup and reproducible environment

## Native Windows (no Docker required)

1. Install Node.js 22 LTS, PostgreSQL 18 (or a compatible 16+ server) and MongoDB Community 7+. Use pgAdmin/psql and mongosh if desired. Keep databases bound to localhost for the classroom demonstration.
2. Install pgvector for the **same PostgreSQL major version and architecture**. The official project documents Windows compilation with Visual Studio C++ tools: https://github.com/pgvector/pgvector#windows. `CREATE EXTENSION vector` does not install the native DLL; it only enables an already-installed extension. `btree_gist` is a PostgreSQL contrib extension.
3. As a PostgreSQL administrator, create a login role with a private password and two databases owned by that role: `pulsefit` and `pulsefit_test`. Example SQL below uses psql's interactive password command so no password is embedded in documentation.

```sql
CREATE ROLE pulsefit LOGIN;
\password pulsefit
CREATE DATABASE pulsefit OWNER pulsefit;
CREATE DATABASE pulsefit_test OWNER pulsefit;
\connect pulsefit
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS btree_gist;
\connect pulsefit_test
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

4. Run `npm ci`, copy `.env.example` to `.env`, edit private values. DATABASE_URL must use URL-encoded password characters. Set MONGODB_URI and MONGODB_DB. Generate SESSION_SECRET with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` and store it privately. Set APP_ORIGIN to the exact browser origin; state-changing requests without a matching Origin are rejected.
5. Run `npm run db:migrate`, `npm run db:mongo`, `npm run db:seed`, `npm run db:embed`, then `npm run dev`. The migration runner acquires an advisory lock and applies checksum-tracked SQL in a transaction. Failed extension installation rolls the migration back.
6. Login using fictitious seed emails from README and your chosen SEED_PASSWORD. If there are no upcoming seed slots because many days have elapsed, create new times through a trainer account; rerunning the seed intentionally does not change existing identities or schedules.

## Cross-platform alternatives

Use PostgreSQL and MongoDB packages for your OS, or a managed database that supports pgvector and TLS. Enable both PostgreSQL extensions administratively first. On Debian/Ubuntu, a matching `postgresql-<major>-pgvector` package is commonly available from the PostgreSQL package repository; follow that repository's current instructions. macOS users can use a PostgreSQL distribution and matching pgvector build. Never disable certificate validation to connect to a hosted database. No API keys or paid embedding service are needed.

## Optional portable runtime used during this implementation

`embedded-postgres` and `mongodb-memory-server` are development dependencies, not application storage substitutes. They run actual PostgreSQL and mongod processes. `scripts/local-services.ts` writes only ignored project-local runtime state and random credentials. It uses ports 55432 and 57017 bound to 127.0.0.1. MongoDB uses a project-local WiredTiger data directory and is unauthenticated only on loopback. Do not expose this portable setup to a network.

On this Windows machine, PostgreSQL 18.6 binaries came from npm `@embedded-postgres/windows-x64`; the matching pgvector 0.8.7 community build came from:

https://github.com/andreiramani/pgvector_pgsql_windows/releases/download/0.8.7/vector.v0.8.7-pg18.zip

Archive SHA-256 observed: `7C4AE0E2B2CB1E547779209A34A7D3F05B82FD7912818BF3D7042266EDA87E7D`. This identifies the downloaded artifact; it is not an independent security audit. The build is community-provided, not an official pgvector binary. For production use, build from the official source or use a trusted managed distribution.

To reproduce the optional setup: download/extract that archive to `work/pgvector-pg18` (lib/vector.dll and share/extension files), or install a compatible extension into the npm runtime. MongoDB's official Windows 8.2.6 archive contains `bin/mongod.exe`; place it at `work/mongodb-binaries/mongod.exe` to avoid the package's full archive download. The full official ZIP is large; automatic download also works when permitted. Avoid redistributing database binaries in the source repository.

```powershell
# Before first npm install if the optional automatic MongoDB download stalls:
$env:MONGOMS_DISABLE_POSTINSTALL='1'
npm ci
# First run requires no existing .env; the script refuses to overwrite unrelated config.
node --import tsx scripts/local-services.ts
# Keep that terminal running. In another terminal:
npm run db:migrate
npm run db:mongo
npm run db:seed
npm run db:embed
npm run dev
```

The service script reuses only an `.env` marked PORTABLE_SERVICES=1 and existing project data; it does not reset credentials. Stop with Ctrl+C. Restart with the same command. Do not remove work/postgres or change its password without an explicit data/reset plan. Runtime files, `.env`, models, node_modules and builds are ignored.

## Test and demo safety

TEST_DATABASE_URL must end in `_test`, as must TEST_MONGODB_DB. Tests create their own schema or UUID-scoped records. `scripts/test-server.ts` starts a separate app on port 3001 using these test settings, leaving the regular demonstration database untouched. Use `TEST_APP_ORIGIN=http://localhost:3001` and `ALLOW_API_TEST_FIXTURES=yes` for API tests. The latter explicitly acknowledges retained fictitious API fixtures.

`database/postgres/queries/course_demo.sql` runs DDL and real domain DML within BEGIN/ROLLBACK and uses only its own fixtures. Seed at least one member first. Its DROP target is a temporary demonstration table. No real accounts or bookings are deleted by the course demonstration.

## Troubleshooting

- Extension missing: check server version, native extension files and administrator installation. Do not remove vector columns to make tests pass.
- Connection error: verify service, port, credentials and database name privately. Do not paste connection strings into the report.
- Port already used: stop the previous project-owned process or choose matching alternate ports and APP_ORIGIN. Do not kill unrelated processes.
- Model load error: allow Hugging Face model download once, verify local cache access and ONNX runtime. The required model is fixed at 384 dimensions. Do not replace it with random vectors.
- 409 booking: refresh slot list; another member may have reserved it. A transaction rollback preserves the invariant. A rare deadlock victim may retry after refreshing.
- Database unavailable: API returns a generic 503; no stack traces or credentials are sent to the browser.
