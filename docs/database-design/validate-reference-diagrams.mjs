// Read-only source/model checks, with a local result record. No DB connection.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
const dir = fileURLToPath(new URL(".", import.meta.url)),
  root = path.resolve(dir, "../..");
const model = JSON.parse(fs.readFileSync(dir + "schema-model.json")),
  cat = JSON.parse(fs.readFileSync(dir + "catalog-verification.json"));
const hash = (p) =>
  createHash("sha256").update(fs.readFileSync(p)).digest("hex");
for (const m of cat.migrations)
  assert.equal(
    hash(root + "/database/postgres/migrations/" + m.name),
    m.checksum,
    "Active migration " + m.name,
  );
const columns = model.tables.flatMap((t) =>
  t.columns.map((c) => ({ table: t.name, ...c })),
);
assert.equal(columns.length, 41);
assert.equal(model.tables.length, 7);
for (const c of columns) {
  const live = cat.columns.find(
    (x) => x.table_name === c.table && x.column_name === c.name,
  );
  assert.ok(live);
  assert.equal(
    c.type,
    live.formatted_type.replace("timestamp with time zone", "timestamptz"),
  );
  assert.equal(c.nullable, live.is_nullable === "YES");
  const pks = cat.constraints.filter(
    (x) => x.table_name === c.table && x.contype === "p",
  );
  assert.equal(
    c.key.includes("PK"),
    pks.some((x) => x.definition === `PRIMARY KEY (${c.name})`),
  );
}
const read = (n) => JSON.parse(fs.readFileSync(dir + n + ".manifest.json"));
const a = read("pulsefit-er-conceptual-identity"),
  b = read("pulsefit-er-conceptual-booking"),
  r = read("pulsefit-relational-academic");
assert.deepEqual(
  [
    ...new Set(
      [...a.entities, ...b.entities]
        .filter((x) => !x.context)
        .map((x) => x.table),
    ),
  ].sort(),
  model.tables.map((x) => x.name).sort(),
);
const attrs = [...a.attributes, ...b.attributes],
  represented = new Set(attrs.map((x) => x.table + "." + x.column));
const relationshipColumns = [
  "trainer_availability.trainer_id",
  "bookings.member_id",
  "bookings.trainer_id",
  "bookings.slot_id",
  "booking_audit.booking_id",
];
assert.equal(attrs.length, 36);
for (const c of relationshipColumns) represented.add(c);
assert.deepEqual(
  [...represented].sort(),
  columns.map((x) => x.table + "." + x.name).sort(),
);
assert.deepEqual(
  attrs.filter((x) => x.multi).map((x) => x.table + "." + x.column),
  ["trainer_profiles.specialties"],
);
assert.equal(attrs.filter((x) => x.key).length, 7);
const expected = {
  "Has member profile": { users: [0, 1], member_profiles: [1, 1] },
  "Has trainer profile": { users: [0, 1], trainer_profiles: [1, 1] },
  Offers: { trainer_profiles: [0, "N"], trainer_availability: [1, 1] },
  Reserves: { member_profiles: [0, "N"], bookings: [1, 1] },
  Allocates: { trainer_availability: [0, "N"], bookings: [1, 1] },
  Records: { bookings: [0, "N"], booking_audit: [1, 1] },
  Coaches: { trainer_profiles: [0, "N"], bookings: [1, 1] },
};
const participation = [...a.relationships, ...b.relationships];
assert.equal(participation.length, 14);
for (const x of participation)
  assert.deepEqual([x.min, x.max], expected[x.relationship][x.entity]);
assert.equal(r.attributes.length, 41);
for (const t of model.tables)
  assert.deepEqual(
    r.attributes
      .filter((c) => c.table === t.name)
      .map((c) => ({ name: c.column, key: c.key })),
    t.columns.map((c) => ({ name: c.name, key: c.key })),
  );
assert.equal(r.fkGroups.length, 6);
for (const g of r.fkGroups) {
  const definition = `FOREIGN KEY (${g.columns.join(", ")}) REFERENCES ${g.parent}(${g.references.join(", ")})`;
  assert.ok(
    cat.constraints.some(
      (c) =>
        c.table_name === g.child &&
        c.contype === "f" &&
        c.definition === definition,
    ),
    g.id + " exact tuple mapping",
  );
}
assert.equal(cat.constraints.filter((c) => c.contype === "f").length, 6);
assert.equal(cat.indexes.length, 17);
assert.ok(
  cat.indexes
    .find((i) => i.indexname === "one_confirmed_booking_per_slot")
    .indexdef.includes("WHERE (status = 'CONFIRMED'::text)"),
);
assert.ok(
  cat.constraints.some(
    (c) =>
      c.contype === "x" &&
      c.definition.includes("tstzrange(starts_at, ends_at, '[)'::text)"),
  ),
);
function crossing(a, b, c, d) {
  const vertical = a[0] === b[0],
    other = c[0] === d[0];
  if (vertical === other) return false;
  const v = vertical ? [a, b] : [c, d],
    h = vertical ? [c, d] : [a, b];
  return (
    v[0][0] > Math.min(h[0][0], h[1][0]) &&
    v[0][0] < Math.max(h[0][0], h[1][0]) &&
    h[0][1] > Math.min(v[0][1], v[1][1]) &&
    h[0][1] < Math.max(v[0][1], v[1][1])
  );
}
for (let i = 0; i < r.fkGroups.length; i++)
  for (let j = i + 1; j < r.fkGroups.length; j++) {
    const one = r.fkGroups[i],
      two = r.fkGroups[j];
    for (let k = 1; k < one.route.length; k++)
      for (let l = 1; l < two.route.length; l++)
        assert.ok(
          !crossing(
            one.route[k - 1],
            one.route[k],
            two.route[l - 1],
            two.route[l],
          ),
          "Crossing FK routes " + one.id + "/" + two.id,
        );
  }
for (const [n, size] of [
  ["pulsefit-er-conceptual-identity", [6000, 3800]],
  ["pulsefit-er-conceptual-booking", [6000, 3800]],
  ["pulsefit-relational-academic", [7600, 4880]],
]) {
  const png = await sharp(dir + n + ".png").metadata();
  assert.deepEqual([png.width, png.height], size);
  const svg = fs.readFileSync(dir + n + ".svg", "utf8");
  assert.ok(svg.includes("<title>"));
  if (n.includes("conceptual")) assert.ok(!svg.includes("marker-end="));
  else {
    assert.ok(!svg.includes("<ellipse") && !svg.includes("<polygon"));
    assert.equal((svg.match(/marker-end=/g) || []).length, 9);
    assert.equal((svg.match(/text-decoration="underline"/g) || []).length, 7);
  }
}
for (const ext of ["svg", "png"])
  assert.equal(
    hash(dir + "pulsefit-er-conceptual-identity." + ext),
    hash(root + "/docs/er-diagram/pulsefit." + ext),
  );
const preserved = [
  "pulsefit-relational-schema.svg",
  "pulsefit-relational-schema.png",
  "pulsefit-hybrid-architecture.svg",
  "pulsefit-hybrid-architecture.png",
];
for (const p of preserved) {
  const old = execFileSync("git", ["show", "HEAD:docs/database-design/" + p], {
    cwd: root,
    maxBuffer: 8 * 1024 * 1024,
  });
  assert.equal(
    hash(dir + p),
    createHash("sha256").update(old).digest("hex"),
    "Preserved " + p,
  );
}
assert.equal(
  execFileSync(
    "git",
    [
      "diff",
      "HEAD",
      "--",
      "src",
      "scripts",
      "database",
      "tests",
      "package.json",
      "package-lock.json",
    ],
    { cwd: root, encoding: "utf8" },
  ),
  "",
);
const out = {
  checkedAt: new Date().toISOString(),
  status: "PASS",
  scope:
    "Approved diagram source verification; no database writes; publication status recorded separately",
  counts: {
    businessEntities: 7,
    businessColumns: 41,
    conceptualOvals: 36,
    relationshipRepresentedColumns: 5,
    conceptualRelationships: 7,
    foreignKeyConstraints: 6,
    compositeForeignKeys: 3,
    targetAttributeArrows: 9,
    primaryKeys: 7,
    indexes: 17,
    newSvgPngPairs: 3,
    preservedPhysicalHybridFiles: 4,
  },
  limitations: [
    "Existing live catalog snapshot compared to unchanged migration hashes; no fresh runtime workflow test claimed.",
    "Visual and PDF review recorded separately in LOCAL_REVIEW.md.",
  ],
};
fs.writeFileSync(
  dir + "reference-validation-results.json",
  JSON.stringify(out, null, 2) + "\n",
);
console.log(JSON.stringify(out));
