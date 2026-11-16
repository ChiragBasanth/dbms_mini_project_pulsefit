# Final handoff verification — 16 November 2026

This records **Codex's executed checks for the documentation/setup handoff**, not Chirag's laptop results. Chirag must fill [his blank checklist](TEAMMATE_EXECUTION_CHECKLIST.md) only after personally executing it. Academic contribution, originality policy and viva competence remain human confirmations.

## Scope and confirmed fixes

Base: original main `e63dd87c8f221659dc7eda2c867e11e897958a0b`, which includes merged PR #2. Follow-up branch: `docs/chhavi-final-demo-handoff`. The application, API, migrations, tests, model/dimensions, RLS policies and existing attribution were preserved. Changes are setup/documentation plus explanatory environment-example comments; no new feature, dependency or deployment.

Publication: primary commit `2497b33` pushed to Chhavi's fork; [PR #3](https://github.com/ChiragBasanth/dbms_mini_project_pulsefit/pull/3) created against original main and left unmerged. The teammate message is a draft, not a communication sent on anyone's behalf.

- Current Git handoff now identifies PR #2 as merged. The earlier open-PR observation is explicitly historical and preserved under docs/archive; the independent audit was not rewritten.
- Native setup now gives explicit administrator role/database/extension commands and separate private owner/runtime URLs. Administrator-precreated runtime roles allow the maintenance owner to remain NOSUPERUSER/NOCREATEROLE/NOCREATEDB/NOBYPASSRLS; automatic role creation is clearly distinguished.
- Added Chirag's complete Windows/browser/SQL/Mongo/vector execution guide with blank personal results, and final source-based viva questions/10–15 minute plan.
- Added both-student personal contribution/rehearsal confirmation fields, without prefilled outcomes or invented feature ownership.

## Least-privilege setup actually tested

A new disposable database `pulsefit_handoff_1116_test` was owned by a separate namespaced maintenance login `pulsefit_handoff_owner`. Direct pg_roles inspection confirmed all four flags false: rolsuper, rolcreaterole, rolcreatedb and rolbypassrls. An administrator enabled vector and btree_gist first; an existing separately restricted test runtime login/password was reused, without changing its global flags/credentials. The recommended native setup uses the equivalent flags with the documented `pulsefit`/`pulsefit_app`/`pulsefit_app_test` names.

As that **non-superuser NOCREATEROLE owner**, actual db:migrate (all three migrations), db:mongo, db:seed, db:rbac and db:embed succeeded. This proves owner-granted schema/table/column/function provisioning works with precreated runtime roles, without granting the migration login CREATEROLE or weakening runtime RLS.

This was a fresh database/schema/configuration test using already-installed PostgreSQL/MongoDB binaries and genuine cached MiniLM weights. It was **not** a full new-Windows native installer test, and it was not performed on Chirag's laptop. Compatible native extensions/model access remain prerequisites there.

## Actual commands and results

All commands used the unchanged supported package scripts on the handoff branch. Fresh raw outputs and timestamps were stored outside the repository in the local final-handoff evidence bundle, avoiding accidental staging of transient test data/secrets.

| Executed command | Actual result |
|---|---|
| `npm run db:migrate` | Exit 0; 001/002/003 applied on new non-superuser-owned DB |
| `npm run db:mongo` | Exit 0; real collection validator/indexes installed |
| `npm run db:seed` | Exit 0; actual users/availability/catalog seeded |
| `npm run db:rbac` | Exit 0; real precreated restricted runtime password/ownership verified and grants applied |
| `npm run db:embed` | Exit 0; six exercise/three seed-trainer genuine 384D MiniLM embeddings |
| `npm run typecheck` | Exit 0 |
| `npm run lint` | Exit 0 |
| `npm test` | Exit 0; **9 pass, 0 fail, 0 skip** |
| `npm run test:integration` | Exit 0; **8 reported pass, 0 fail, 0 skip**; PostgreSQL/concurrency/rollback, Mongo CRUD/aggregation/validator and actual vectors |
| `npm run test:rbac` | Exit 0; **1 pass, 0 fail, 0 skip**; actual runtime login, role/ownership/grant denials and actor reset |
| `npm run build` | Exit 0; optimized Next.js production build |
| `npm run test:server` | Production app started on localhost:3001 with new disposable test DBs |
| `npm run test:api` | Exit 0; **1 workflow pass, 0 fail, 0 skip**; both role registration/login, persisted SQL/Mongo flows, populated vector results, forbidden actions |
| `npm run test:smoke` | Exit 0; **1 pass, 0 fail, 0 skip**; 11 page responses and three route/auth checks |

**20 Node-reported tests, zero failures/skips; 19 leaf cases plus one integration parent.** Multi-assertion workflows are counted once, not as invented additional tests. Type/lint/build have no test-case counts.

Additional executed probes: all actual course SQL/inspect/safe-drop files; separate simple SELECT, INNER/LEFT JOIN, nested/correlated/recursive/ordinary CTE, grouping/HAVING/order/aggregate queries with representative rows; committed SQL DML readback/deletion; Mongo insert/reconnect/read/update/aggregation/delete; prepared vector search with genuine query embedding. Exact SQL inspection/reference-vector/RLS-denial blocks and Mongo aggregation copied from the new teammate guide were executed successfully against disposable data. Expected direct permission errors were **42501**. Concurrency remained **one SQL winner/seven 23505 conflicts**, and HTTP contention **201/409**.

Codex also rechecked both MEMBER and TRAINER login/dashboard/logout through the actual browser using fictitious test accounts. These screenshots are Codex evidence, **not Chirag's manual verification**.

## Retained implementation counts and limits

Seven conservative complete functional workflows, nine distinct advanced concept categories. Live catalog remained **8 tables (7 business + metadata), 3 views, 17 indexes, 7 project functions, 0 procedures, 3 triggers and 12 RLS policies**. The two ordinary/one recursive CTE examples, Mongo collection/pipelines and two vector retrieval paths were retained. No HNSW index or separate stored procedure is claimed.

Technical demonstration readiness: PASS in the tested local environment. Remaining manual items: Chirag's complete independent laptop/browser/database checklist and screenshots/errors, both students' genuine contributions/originality confirmation, and demo/viva rehearsal. Localhost is sufficient under the supplied requirements. The follow-up PR must be reviewed and merged by a human before its guides are described as present on original main.
