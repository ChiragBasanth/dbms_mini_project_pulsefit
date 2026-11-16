import "dotenv/config";
import { randomBytes } from "node:crypto";
import { appendFile } from "node:fs/promises";
import { Pool } from "pg";

// Run with the migration owner. Never accept a role name from HTTP input.
export async function provision(ownerUrl: string, appUrl: string) {
  const app = new URL(appUrl);
  const role = decodeURIComponent(app.username);
  if (!/^pulsefit_app(?:_test)?$/.test(role))
    throw new Error("Use a dedicated pulsefit_app or pulsefit_app_test login");
  const password = decodeURIComponent(app.password);
  if (!/^[a-f0-9]{48,}$/.test(password))
    throw new Error(
      "Use a random hex runtime password of at least 48 characters",
    );
  const pool = new Pool({ connectionString: ownerUrl });
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const found = await c.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [
      role,
    ]);
    if (!found.rowCount)
      await c.query(
        `CREATE ROLE "${role}" LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`,
      );
    const flags = (
      await c.query(
        "SELECT rolsuper,rolbypassrls,rolcreaterole,rolcreatedb FROM pg_roles WHERE rolname=$1",
        [role],
      )
    ).rows[0];
    if (Object.values(flags).some(Boolean))
      throw new Error("Runtime role has unsafe privileges");
    await c.query(`REVOKE CREATE ON SCHEMA public FROM PUBLIC`);
    await c.query(`GRANT USAGE ON SCHEMA public TO "${role}"`);
    await c.query(
      `GRANT SELECT ON users,member_profiles,trainer_profiles,trainer_availability,bookings,booking_audit,exercises,occupied_slots,upcoming_bookings,trainer_utilization TO "${role}"`,
    );
    await c.query(
      `GRANT INSERT ON users,member_profiles,trainer_profiles,trainer_availability TO "${role}"`,
    );
    await c.query(
      `GRANT UPDATE(fitness_goals) ON member_profiles TO "${role}"`,
    );
    await c.query(
      `GRANT UPDATE(bio,specialties,experience_years,embedding,embedding_model) ON trainer_profiles TO "${role}"`,
    );
    await c.query(
      `GRANT UPDATE(status) ON trainer_availability,bookings TO "${role}"`,
    );
    await c.query(
      `GRANT EXECUTE ON FUNCTION app_reserve_slot(uuid,uuid) TO "${role}"`,
    );
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
    await pool.end();
  }
  // Verify the real password, role flags, and table ownership before saving config.
  const runtime = new Pool({ connectionString: appUrl });
  try {
    const r = await runtime.query(
      "SELECT rolsuper,rolbypassrls,pg_has_role(current_user,c.relowner,'USAGE') owns FROM pg_roles r CROSS JOIN pg_class c WHERE r.rolname=current_user AND c.oid='bookings'::regclass",
    );
    if (!r.rowCount || Object.values(r.rows[0]).some(Boolean))
      throw new Error("Runtime login bypasses RLS");
  } finally {
    await runtime.end();
  }
}
if (process.argv[1]?.endsWith("rbac.ts")) {
  for (const [ownerKey, appKey, role] of [
    ["DATABASE_URL", "APP_DATABASE_URL", "pulsefit_app"],
    ["TEST_DATABASE_URL", "TEST_APP_DATABASE_URL", "pulsefit_app_test"],
  ]) {
    // A demo-only quick start must not depend on a migrated test database.
    // The full verification setup opts into both after migrating them.
    if (
      ownerKey === "TEST_DATABASE_URL" &&
      !process.argv.includes("--with-tests")
    )
      continue;
    const owner = process.env[ownerKey];
    if (!owner) continue;
    let app = process.env[appKey];
    if (!app) {
      const url = new URL(owner);
      url.username = role;
      url.password = randomBytes(24).toString("hex");
      app = url.toString();
    }
    await provision(owner, app);
    if (!process.env[appKey]) await appendFile(".env", `\n${appKey}=${app}\n`);
    console.log(
      `${appKey}: restricted login verified; private configuration saved/reused.`,
    );
  }
}
