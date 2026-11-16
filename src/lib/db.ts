import { Pool } from "pg";
import type { QueryResultRow } from "pg";
import { MongoClient } from "mongodb";
const state = globalThis as unknown as {
  pg?: Pool;
  app?: Pool;
  mongo?: Promise<MongoClient>;
};
export function appSql() {
  if (!process.env.APP_DATABASE_URL)
    throw new Error("APP_DATABASE_URL missing: run db:rbac after migrations");
  return (state.app ??= new Pool({
    connectionString: process.env.APP_DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5000,
    statement_timeout: 15000,
  }));
}
let runtimeCheck: Promise<void> | undefined;
export function assertRuntime() {
  return (runtimeCheck ??= (async () => {
    const r = await appSql().query(
      "SELECT r.rolsuper,r.rolbypassrls,r.rolcreaterole,r.rolcreatedb,pg_has_role(current_user,c.relowner,'USAGE') owns FROM pg_roles r CROSS JOIN pg_class c WHERE r.rolname=current_user AND c.oid='bookings'::regclass",
    );
    if (!r.rowCount || Object.values(r.rows[0]).some(Boolean))
      throw new Error(
        "Application login must not own tables or bypass row security",
      );
  })().catch((e) => {
    runtimeCheck = undefined;
    throw e;
  }));
}
// Identity comes only from the verified session. SET LOCAL cannot leak to the
// next request when a pooled connection is reused (commit and rollback reset it).
export async function queryAs<T extends QueryResultRow = QueryResultRow>(
  actor: { id: string },
  text: string,
  values?: unknown[],
) {
  const c = await appSql().connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT set_config('pulsefit.actor_id',$1,true)", [actor.id]);
    const result = await c.query<T>(text, values);
    await c.query("COMMIT");
    return result;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
export function sql() {
  if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL is not configured");
  return (state.pg ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5000,
    statement_timeout: 15000,
  }));
}
export async function mongo() {
  if (!process.env.MONGODB_URI)
    throw new Error("MONGODB_URI is not configured");
  state.mongo ??= new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  })
    .connect()
    .catch((e) => {
      state.mongo = undefined;
      throw e;
    });
  return (await state.mongo).db(process.env.MONGODB_DB || "pulsefit");
}
