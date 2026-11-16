-- DEPRECATED: retained original at database/legacy/sql/command_gallery.sql
-- Canonical initialization: npm run db:migrate / db:seed / db:embed
DO $$ BEGIN RAISE EXCEPTION 'Obsolete 128D schema: use database/postgres/migrations and npm scripts'; END $$;
