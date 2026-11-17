// Documentation validation only: no application test substitute or database writes.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
const dir = fileURLToPath(new URL(".", import.meta.url)),
  root = path.resolve(dir, "../..");
const model = JSON.parse(fs.readFileSync(dir + "schema-model.json")),
  cat = JSON.parse(fs.readFileSync(dir + "catalog-verification.json"));
for (const m of cat.migrations) {
  const source = fs.readFileSync(
    root + "/database/postgres/migrations/" + m.name,
  );
  assert.equal(
    createHash("sha256").update(source).digest("hex"),
    m.checksum,
    "Migration checksum " + m.name,
  );
}
const sql = fs.readFileSync(
  root + "/database/postgres/migrations/001_core.sql",
  "utf8",
);
function fragments(s) {
  const result = [];
  let level = 0,
    quote = false,
    start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "'") {
      if (quote && s[i + 1] === "'") {
        i++;
        continue;
      }
      quote = !quote;
    }
    if (quote) continue;
    if (s[i] === "(") level++;
    if (s[i] === ")") level--;
    if (s[i] === "," && level === 0) {
      result.push(s.slice(start, i).trim());
      start = i + 1;
    }
  }
  result.push(s.slice(start).trim());
  return result;
}
function columns(name) {
  const match = new RegExp("CREATE TABLE " + name + " \\(").exec(sql);
  assert.ok(match, name);
  const start = match.index + match[0].length;
  let end = start,
    level = 1,
    quote = false;
  for (; end < sql.length; end++) {
    const ch = sql[end];
    if (ch === "'") {
      if (quote && sql[end + 1] === "'") {
        end++;
        continue;
      }
      quote = !quote;
    }
    if (quote) continue;
    if (ch === "(") level++;
    if (ch === ")" && !--level) break;
  }
  return fragments(sql.slice(start, end))
    .filter(
      (x) => !/^\s*(FOREIGN|UNIQUE|CHECK|EXCLUDE|CONSTRAINT|PRIMARY)\b/.test(x),
    )
    .map((x) => {
      const m =
        /^(\w+)\s+(uuid|text\[\]|text|integer|bigint|timestamptz|vector\(384\))/.exec(
          x,
        );
      assert.ok(m, "Column parser: " + x);
      return {
        name: m[1],
        type: m[2],
        nullable: !/NOT NULL|PRIMARY KEY/.test(x),
        definition: x,
      };
    });
}
let total = 0;
for (const t of model.tables) {
  const source = columns(t.name);
  if (t.name === "trainer_profiles")
    source.push({ name: "location", type: "text", nullable: false });
  assert.deepEqual(
    t.columns.map((c) => ({
      name: c.name,
      type: c.type,
      nullable: c.nullable,
    })),
    source.map((c) => ({ name: c.name, type: c.type, nullable: c.nullable })),
    t.name + " migration attributes",
  );
  const actual = cat.columns.filter((c) => c.table_name === t.name);
  assert.deepEqual(
    t.columns.map((c) => c.name),
    actual.map((c) => c.column_name),
  );
  for (const c of t.columns) {
    const actualColumn = actual.find((a) => a.column_name === c.name);
    assert.equal(
      c.type,
      actualColumn.formatted_type.replace(
        "timestamp with time zone",
        "timestamptz",
      ),
      "Live catalog type: " + t.name + "." + c.name,
    );
    assert.equal(
      c.nullable,
      actual.find((a) => a.column_name === c.name).is_nullable === "YES",
    );
    const pk = cat.constraints.find(
      (k) => k.table_name === t.name && k.contype === "p",
    );
    assert.equal(
      c.key.includes("PK"),
      pk.definition === "PRIMARY KEY (" + c.name + ")",
    );
    const foreign = cat.constraints.filter(
      (k) => k.table_name === t.name && k.contype === "f",
    );
    assert.equal(
      c.key.includes("FK"),
      foreign.some((k) =>
        k.definition
          .match(/^FOREIGN KEY \(([^)]+)\)/)[1]
          .split(", ")
          .includes(c.name),
      ),
    );
  }
  total += source.length;
}
assert.equal(total, 41);
assert.equal(model.tables.length, 7);
assert.equal(cat.constraints.filter((k) => k.contype === "f").length, 6);
for (const r of model.relationships) {
  const [from, to] = r.mapping.split(" -> ");
  const def =
    "FOREIGN KEY " +
    (from.startsWith("(") ? from : "(" + from + ")") +
    " REFERENCES " +
    to;
  assert.ok(
    cat.constraints.some(
      (k) =>
        k.table_name === r.child && k.contype === "f" && k.definition === def,
    ),
    "FK mapping: " + r.mapping,
  );
  assert.equal(r.childMin, 0);
}
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
for (const [name, size] of [
  ["pulsefit-er-crows-foot", [3680, 3380]],
  ["pulsefit-relational-schema", [4240, 4340]],
  ["pulsefit-hybrid-architecture", [3600, 2540]],
]) {
  const png = await sharp(dir + name + ".png").metadata();
  assert.deepEqual([png.width, png.height], size);
  const svg = fs.readFileSync(dir + name + ".svg", "utf8");
  assert.ok(svg.includes("<title>") && svg.includes("<desc>"));
  if (!name.includes("hybrid"))
    for (const t of model.tables)
      for (const c of t.columns)
        assert.ok(
          svg.includes(c.name),
          "Missing rendered attribute " + t.name + "." + c.name,
        );
}
const er = fs.readFileSync(root + "/docs/er-diagram/pulsefit.mmd", "utf8");
for (const t of model.tables)
  for (const c of t.columns) assert.ok(er.includes(c.name));
assert.ok(er.includes("TRAINER_AVAILABILITY ||..o{ BOOKINGS"));
const report = {
  verifiedAt: new Date().toISOString(),
  checks: {
    migrationChecksums: 3,
    businessRelations: 7,
    businessColumns: total,
    foreignKeys: 6,
    indexes: 17,
    svgPngPairs: 3,
  },
  result: "PASS",
  scope:
    "Documentation source/catalog/asset checks only; visual review separately recorded in VALIDATION.md.",
};
fs.writeFileSync(
  dir + "validation-results.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report));
