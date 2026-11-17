// Documentation-only model derived from the read-only PostgreSQL catalog snapshot.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
const dir = fileURLToPath(new URL(".", import.meta.url));
const catalog = JSON.parse(fs.readFileSync(dir + "catalog-verification.json"));
const names = [
  "users",
  "member_profiles",
  "trainer_profiles",
  "trainer_availability",
  "bookings",
  "booking_audit",
  "exercises",
];
const pk = {
  users: "id",
  member_profiles: "user_id",
  trainer_profiles: "user_id",
  trainer_availability: "id",
  bookings: "id",
  booking_audit: "id",
  exercises: "id",
};
const fk = {
  member_profiles: ["user_id", "role"],
  trainer_profiles: ["user_id", "role"],
  trainer_availability: ["trainer_id"],
  bookings: ["member_id", "slot_id", "trainer_id"],
  booking_audit: ["booking_id"],
};
const rules = {
  users: [
    "CK: id; email. PK: id. UNIQUE(id, role) is a nonminimal reference superkey.",
    "CHECK: name length 2–100; email = lower(btrim(email)) and contains @.",
    "CHECK: password_hash length >= 60; role IN (MEMBER, TRAINER).",
  ],
  member_profiles: [
    "FK (user_id, role) -> users(id, role).",
    "CHECK role = MEMBER; fitness_goals length <= 2000.",
  ],
  trainer_profiles: [
    "FK (user_id, role) -> users(id, role).",
    "CHECK: role = TRAINER; bio length <= 2000; experience_years 0–80.",
    "CHECK: location length <= 120. specialties is a PostgreSQL text[] array.",
  ],
  trainer_availability: [
    "FK trainer_id -> trainer_profiles(user_id). UNIQUE(id, trainer_id): nonminimal superkey.",
    "CHECK: status IN (OPEN, CLOSED); 0 < duration <= 4 hours.",
    "EXCLUDE GiST: trainer_id WITH =, tstzrange(starts_at, ends_at, [)) WITH &&.",
    "Trigger: new start in next 90 days; trainer/time immutable; no occupied closure.",
  ],
  bookings: [
    "FK member_id -> member_profiles(user_id).",
    "FK (slot_id, trainer_id) -> trainer_availability(id, trainer_id).",
    "CHECK status IN (CONFIRMED, CANCELLED).",
    "PARTIAL UNIQUE: slot_id WHERE status = CONFIRMED; history may contain many rows.",
    "Triggers guard booking identity/time/state and append booking_audit.",
  ],
  booking_audit: [
    "FK booking_id -> bookings(id). old_status is nullable for initial insert.",
    "Trigger appends changes; FK itself permits zero audit rows per booking.",
  ],
  exercises: [
    "CK: id; name. PK: id. No FK to workout snapshots or trainer profiles.",
    "CHECK difficulty IN (BEGINNER, INTERMEDIATE, ADVANCED).",
    "CHECK category IN (STRENGTH, CARDIO, MOBILITY).",
  ],
};
const model = {
  sourceMain: catalog.sourceMain,
  tables: names.map((name) => ({
    name,
    columns: catalog.columns
      .filter((c) => c.table_name === name)
      .map((c) => ({
        name: c.column_name,
        type:
          c.udt_name === "vector"
            ? "vector(384)"
            : c.udt_name === "_text"
              ? "text[]"
              : c.data_type === "timestamp with time zone"
                ? "timestamptz"
                : c.data_type,
        nullable: c.is_nullable === "YES",
        default:
          c.is_identity === "YES"
            ? "GENERATED ALWAYS AS IDENTITY"
            : c.column_default,
        key: [
          ...(pk[name] === c.column_name ? ["PK"] : []),
          ...(fk[name]?.includes(c.column_name) ? ["FK"] : []),
          ...((name === "users" && c.column_name === "email") ||
          (name === "exercises" && c.column_name === "name")
            ? ["UK"]
            : []),
        ],
      })),
    rules: rules[name],
  })),
  relationships: [
    {
      parent: "users",
      child: "member_profiles",
      mapping: "(user_id, role) -> users(id, role)",
      identifying: true,
      childMin: 0,
      childMax: 1,
    },
    {
      parent: "users",
      child: "trainer_profiles",
      mapping: "(user_id, role) -> users(id, role)",
      identifying: true,
      childMin: 0,
      childMax: 1,
    },
    {
      parent: "trainer_profiles",
      child: "trainer_availability",
      mapping: "trainer_id -> trainer_profiles(user_id)",
      identifying: false,
      childMin: 0,
      childMax: "many",
    },
    {
      parent: "member_profiles",
      child: "bookings",
      mapping: "member_id -> member_profiles(user_id)",
      identifying: false,
      childMin: 0,
      childMax: "many",
    },
    {
      parent: "trainer_availability",
      child: "bookings",
      mapping: "(slot_id, trainer_id) -> trainer_availability(id, trainer_id)",
      identifying: false,
      childMin: 0,
      childMax: "many",
    },
    {
      parent: "bookings",
      child: "booking_audit",
      mapping: "booking_id -> bookings(id)",
      identifying: false,
      childMin: 0,
      childMax: "many",
    },
  ],
};
fs.writeFileSync(
  dir + "schema-model.json",
  JSON.stringify(model, null, 2) + "\n",
);
let mermaid =
  "%% PostgreSQL-only ER companion; canonical layout: ../database-design/pulsefit-er-crows-foot.svg\nerDiagram\n";
for (const r of model.relationships)
  mermaid +=
    " " +
    r.parent.toUpperCase() +
    " ||" +
    (r.identifying ? "--" : "..") +
    (r.childMax === 1 ? "o|" : "o{") +
    " " +
    r.child.toUpperCase() +
    ' : "' +
    (r.child === "bookings" && r.parent === "trainer_availability"
      ? "slot_id + trainer_id"
      : r.mapping.split(" -> ")[0]) +
    '"\n';
for (const t of model.tables) {
  mermaid += " " + t.name.toUpperCase() + " {\n";
  for (const c of t.columns)
    mermaid +=
      "  " +
      c.type.replace("vector(384)", "vector384").replace("[]", "_array") +
      " " +
      c.name +
      (c.key.length ? " " + c.key.join(",") : "") +
      "\n";
  mermaid += " }\n";
}
fs.writeFileSync(dir + "../er-diagram/pulsefit.mmd", mermaid);
console.log(
  "Model:",
  model.tables.length,
  "business relations;",
  model.tables.reduce((n, t) => n + t.columns.length, 0),
  "columns;",
  model.relationships.length,
  "FK mappings.",
);
