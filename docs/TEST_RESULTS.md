# Current test results — 16 November 2026

See [final verification report](LEVEL3_FINAL_REPORT.md#verification-report) and raw [dated logs](evidence/level3-2026-11-16/).

All current typecheck, lint, unit (9), real PostgreSQL/Mongo/vector integration (8 reported including parent/subtests), restricted-login RBAC (1), API workflow (1), production smoke (1) and production build checks passed. Total reported automated tests: 20, zero failures/skips. Setup initialized fresh project-owned real databases and generated actual MiniLM vectors.

setup.json, checks.json and http.json record exact commands, UTC timestamps and exit codes. The HTTP workflow verified populated exercise/trainer vector results, not only a 200 status. I06 asserted seven distinct dates from the recursive report. R01 used the actual restricted login and omitted API owner filters. Eight competing SQL connections produced one winner/seven 23505 errors, and two HTTP booking requests produced 201/409.

Earlier sandbox DNS, npm EPERM and loopback EACCES attempts failed; approved final executions resolved them. Installation completed with 458 packages; a final --ignore-scripts repair was used, and required native runtimes loaded successfully in actual checks. These are local results, not production-scale validation.

Previous November 1 report is retained under archive/TEST_RESULTS-2026-11-01.md. Top-level evidence files are historical. Current source/behavior is described in LEVEL3_FINAL_REPORT.md.
