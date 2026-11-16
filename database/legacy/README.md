# Historical schema, not an initialization path

These files preserve the earlier 128D design from commit 24cc449. They are incompatible with the running 384D MiniLM application. Do not execute them against an application database. Active SQL lives in database/postgres/migrations and database/postgres/queries. Old password hashes are historical public demo values, never current credentials.
