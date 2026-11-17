// Editable, deterministic documentation figures. Run from repository root after npm ci.
// Uses the sharp dependency already installed with Next.js; no database writes.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
const dir = fileURLToPath(new URL(".", import.meta.url));
const model = JSON.parse(fs.readFileSync(dir + "schema-model.json"));
const tables = Object.fromEntries(model.tables.map((t) => [t.name, t]));
const INK = "#193348",
  BLUE = "#234d67",
  MUTED = "#526674",
  LINE = "#aab9c3",
  PALE = "#eef3f6";
let parts = [],
  W,
  H,
  textBounds = [];
const esc = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
function start(w, h, title, sub) {
  W = w;
  H = h;
  parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><title>${esc(title)}</title><desc>${esc(sub)}</desc><rect width="100%" height="100%" fill="white"/>`,
  ];
  textBounds = [];
  text(50, 60, title, 32, true);
  text(50, 98, sub, 18);
  line(
    [
      [50, 122],
      [w - 50, 122],
    ],
    LINE,
  );
}
function text(x, y, s, size = 19, bold = false, color = INK, anchor = "start") {
  parts.push(
    `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${bold ? 700 : 400}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text>`,
  );
  textBounds.push({ x, y, s, size });
}
function rect(x, y, w, h, fill = "white", stroke = LINE) {
  parts.push(
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`,
  );
}
function line(points, color = BLUE, dashed = false, width = 2) {
  parts.push(
    `<polyline points="${points.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${color}" stroke-width="${width}" ${dashed ? 'stroke-dasharray="8 6"' : ""}/>`,
  );
}
function wrap(s, n = 90) {
  const words = s.split(" "),
    out = [];
  let t = "";
  for (const word of words) {
    if ((t + " " + word).trim().length > n) {
      out.push(t);
      t = word;
    } else t = (t + " " + word).trim();
  }
  if (t) out.push(t);
  return out;
}
function label(x, y, s) {
  const width = s.length * 8.7 + 16;
  rect(x - width / 2, y - 18, width, 26, "white", "none");
  text(x, y, s, 17, false, INK, "middle");
}
function endpoint(p, next, kind) {
  const dx = Math.sign(next[0] - p[0]),
    dy = Math.sign(next[1] - p[1]);
  const pt = (d, o = 0) => [p[0] + dx * d - dy * o, p[1] + dy * d + dx * o];
  const bar = (d) => line([pt(d, -9), pt(d, 9)]);
  if (kind === "one") {
    bar(10);
    bar(21);
  } else {
    const [x, y] = pt(32);
    parts.push(
      `<circle cx="${x}" cy="${y}" r="6" fill="white" stroke="${BLUE}" stroke-width="2"/>`,
    );
    if (kind === "optional") {
      bar(10);
    } else for (const o of [-10, 0, 10]) line([pt(18), pt(0, o)]);
  }
}
function relationship(points, kind, identifying, labelText, lx, ly) {
  line(points, BLUE, !identifying);
  endpoint(points[0], points[1], "one");
  endpoint(points.at(-1), points.at(-2), kind);
  if (labelText) label(lx, ly, labelText);
}
function erEntity(name, x, y, w) {
  const t = tables[name],
    h = 50 + t.columns.length * 31 + 14;
  rect(x, y, w, h);
  rect(x, y, w, 48, BLUE, BLUE);
  text(x + 18, y + 31, name, 23, true, "white");
  t.columns.forEach((c, i) => {
    const cy = y + 76 + i * 31;
    text(x + 16, cy, c.key.join(","), 15, true, BLUE);
    text(x + 91, cy, c.name, 19, c.key.includes("PK"));
    text(
      x + w - 15,
      cy,
      c.type + (c.nullable ? " ?" : ""),
      18,
      false,
      MUTED,
      "end",
    );
  });
  return { x, y, w, h };
}
function legend(y) {
  text(50, y, "NOTATION", 19, true);
  relationship(
    [
      [70, y + 37],
      [190, y + 37],
    ],
    "optional",
    true,
    "",
    0,
    0,
  );
  text(
    220,
    y + 43,
    "Exactly one to zero-or-one; solid = identifying (parent key forms child PK).",
    18,
  );
  relationship(
    [
      [70, y + 83],
      [190, y + 83],
    ],
    "many",
    false,
    "",
    0,
    0,
  );
  text(
    220,
    y + 89,
    "Exactly one to zero-or-many; dashed = non-identifying. Circle = optional; fork = many.",
    18,
  );
  text(
    50,
    y + 132,
    "PK primary key · FK foreign-key component · UK single-column unique key · ? nullable attribute",
    18,
  );
}
async function save(name) {
  for (const b of textBounds)
    if (b.y > H - 12 || b.x < 0 || b.x > W)
      throw Error("Text outside canvas: " + b.s);
  parts.push("</svg>");
  const svg = parts.join("\n");
  fs.writeFileSync(dir + name + ".svg", svg);
  await sharp(Buffer.from(svg))
    .resize(W * 2, H * 2)
    .png()
    .withMetadata({ density: 192 })
    .toFile(dir + name + ".png");
  console.log(name, W * 2 + "x" + H * 2);
}

start(
  1840,
  1690,
  "PulseFit | Entity–Relationship Diagram",
  "Crow’s Foot / Information Engineering · Seven PostgreSQL business entities · Migrations 001–003",
);
const e = {};
e.users = erEntity("users", 650, 170, 510);
e.exercises = erEntity("exercises", 50, 170, 530);
e.member_profiles = erEntity("member_profiles", 50, 600, 480);
e.trainer_profiles = erEntity("trainer_profiles", 1260, 500, 530);
e.trainer_availability = erEntity("trainer_availability", 1260, 1050, 530);
e.bookings = erEntity("bookings", 650, 1050, 500);
e.booking_audit = erEntity("booking_audit", 50, 1050, 480);
relationship(
  [
    [850, 170 + e.users.h],
    [850, 540],
    [290, 540],
    [290, 600],
  ],
  "optional",
  true,
  "has member profile",
  570,
  528,
);
relationship(
  [
    [1160, 300],
    [1500, 300],
    [1500, 500],
  ],
  "optional",
  true,
  "has trainer profile",
  1490,
  280,
);
relationship(
  [
    [1500, 500 + e.trainer_profiles.h],
    [1500, 1050],
  ],
  "many",
  false,
  "offers",
  1500,
  993,
);
relationship(
  [
    [290, 600 + e.member_profiles.h],
    [290, 880],
    [820, 880],
    [820, 1050],
  ],
  "many",
  false,
  "reserves",
  600,
  867,
);
relationship(
  [
    [1260, 1170],
    [1150, 1170],
  ],
  "many",
  false,
  "slot",
  1205,
  1145,
);
relationship(
  [
    [650, 1170],
    [530, 1170],
  ],
  "many",
  false,
  "records",
  590,
  1145,
);
text(
  50,
  1370,
  "ROLE RULE: each profile has exactly one matching user; MEMBER/TRAINER checks and composite FKs make profile types disjoint.",
  19,
);
text(
  50,
  1404,
  "HISTORY RULE: a slot has 0..many booking rows; partial UNIQUE(slot_id) WHERE status = CONFIRMED limits active capacity to one.",
  19,
);
text(
  50,
  1438,
  "CATALOG: exercises has no relational FK to workouts/trainers. schema_migrations is infrastructure and is intentionally omitted.",
  19,
);
legend(1495);
fs.mkdirSync(dir + "archive", { recursive: true });
await save("archive/pulsefit-er-crows-foot");

function defaultText(c) {
  if (c.default === null) return "—";
  return c.default
    .replaceAll("::text[]", "")
    .replaceAll("::text", "")
    .replaceAll("::integer", "");
}
function relationHeight(t, w) {
  return (
    91 +
    t.columns.length * 29 +
    20 +
    t.rules.flatMap((r) => wrap(r, Math.floor((w - 40) / 8.9))).length * 24
  );
}
function relation(t, x, y, w) {
  const h = relationHeight(t, w);
  rect(x, y, w, h);
  rect(x, y, w, 45, BLUE, BLUE);
  text(x + 18, y + 30, t.name.toUpperCase(), 23, true, "white");
  const cols = [x + 18, x + 115, x + 370, x + 535];
  ["KEY", "ATTRIBUTE : TYPE", "NULL", "DEFAULT"].forEach((s, i) =>
    text(cols[i], y + 72, s, 16, true, MUTED),
  );
  t.columns.forEach((c, i) => {
    const cy = y + 103 + i * 29;
    line(
      [
        [x + 15, cy + 8],
        [x + w - 15, cy + 8],
      ],
      "#e1e7eb",
      false,
      1,
    );
    text(cols[0], cy, c.key.join(","), 15, true, BLUE);
    text(cols[1], cy, c.name + " : " + c.type, 17, c.key.includes("PK"));
    text(cols[2], cy, c.nullable ? "NULL" : "NN", 16);
    text(cols[3], cy, defaultText(c), 16);
  });
  let cy = y + 103 + t.columns.length * 29 + 12;
  for (const r of t.rules)
    for (const s of wrap(r, Math.floor((w - 40) / 8.9))) {
      text(x + 18, cy, s, 17);
      cy += 24;
    }
  return h;
}
const rows = [
  ["users", "trainer_profiles"],
  ["member_profiles", "exercises"],
  ["trainer_availability", "bookings"],
  ["booking_audit"],
];
let ys = [],
  yy = 166;
for (const row of rows) {
  ys.push(yy);
  yy += Math.max(...row.map((n) => relationHeight(tables[n], 990))) + 40;
}
const rh = yy + 305;
start(
  2120,
  rh,
  "PulseFit | Physical Relational Schema",
  "Relation signatures, complete attributes and SQL constraints · Separate from the ER model · Migrations 001–003",
);
rows.forEach((row, i) =>
  row.forEach((n, j) => relation(tables[n], 50 + j * 1030, ys[i], 990)),
);
const last = ys[3];
rect(1080, last, 990, 334, PALE);
text(1100, last + 35, "REFERENTIAL MAPPINGS", 22, true);
model.relationships.forEach((r, i) =>
  text(1100, last + 72 + i * 29, r.child + ": " + r.mapping, 16),
);
text(
  1100,
  last + 270,
  "All FKs: NOT NULL components; MATCH SIMPLE; NO ACTION; not deferrable.",
  16,
);
text(
  1100,
  last + 300,
  "No standalone bookings.trainer_id FK; the slot/trainer pair enforces it.",
  16,
);
text(
  50,
  yy + 10,
  "KEY LEGEND: PK chosen primary key · FK component of a reference · UK unique column · CK candidate key (minimal) · NN NOT NULL",
  19,
  true,
);
text(
  50,
  yy + 48,
  "Nonminimal UNIQUE(id, role) and UNIQUE(id, trainer_id) are supporting reference superkeys, not additional candidate keys.",
  19,
);
text(
  50,
  yy + 86,
  "Physical indexes: PK/UNIQUE B-trees; GiST non-overlap; partial booking uniqueness; member/date, trainer/status and trainer/date B-trees.",
  19,
);
text(
  50,
  yy + 124,
  "Vector columns are nullable, stored in PostgreSQL via pgvector; current searches use exact cosine distance, with no HNSW/IVFFlat index.",
  19,
);
text(
  50,
  yy + 162,
  "RLS: member_profiles, trainer_profiles, trainer_availability, bookings, booking_audit (12 policies). Runtime grants are configured separately.",
  19,
);
text(
  50,
  yy + 200,
  "Infrastructure only: schema_migrations(name text PK, checksum text NN, applied_at timestamptz NN DEFAULT now()).",
  19,
);
text(
  50,
  yy + 238,
  "See RELATIONAL_SCHEMA.md for full SQL predicates, index catalog, normalization exceptions, trigger behavior and authorization limits.",
  19,
);
await save("pulsefit-relational-schema");

function arrow(points) {
  line(points);
  const end = points.at(-1),
    prev = points.at(-2),
    dx = Math.sign(end[0] - prev[0]),
    dy = Math.sign(end[1] - prev[1]);
  line([
    [end[0] - dx * 12 - dy * 6, end[1] - dy * 12 + dx * 6],
    end,
    [end[0] - dx * 12 + dy * 6, end[1] - dy * 12 - dx * 6],
  ]);
}
start(
  1800,
  1270,
  "PulseFit | Hybrid Database Architecture",
  "Application integration and storage boundaries · Architecture arrows are not ER/FK connectors",
);
rect(410, 160, 980, 160, PALE);
text(900, 204, "Next.js UI → authenticated Node API", 27, true, INK, "middle");
text(
  900,
  242,
  "Session UUID / role checks · Zod validation · parameterized SQL · owner-scoped Mongo operations",
  19,
  false,
  INK,
  "middle",
);
text(
  900,
  280,
  "src/app/api/[...path]/route.ts · src/lib/db.ts · src/lib/workouts.ts · src/lib/embedding.ts",
  18,
  false,
  MUTED,
  "middle",
);
arrow([
  [650, 320],
  [650, 430],
]);
label(650, 385, "Restricted SQL runtime login / transactions");
arrow([
  [1240, 320],
  [1490, 320],
  [1490, 430],
]);
label(1490, 385, "MongoDB driver / scoped CRUD + aggregation");
rect(50, 430, 1030, 650);
rect(50, 430, 1030, 48, BLUE, BLUE);
text(75, 463, "POSTGRESQL SERVER", 25, true, "white");
text(
  75,
  514,
  "Relational integrity: PK / FK / CHECK / UNIQUE / GiST / RLS",
  22,
  true,
);
const rels = [
  "users — identity, role and credential hash",
  "member_profiles — typed member identity and goals",
  "trainer_profiles — bio, specialties, experience and location",
  "trainer_availability — trainer/time/status; overlap exclusion",
  "bookings — member + slot/trainer; history and active uniqueness",
  "booking_audit — append trail of booking changes",
  "exercises — standalone semantic exercise catalog",
];
rels.forEach((s, i) => text(75, 559 + i * 35, s, 20));
rect(75, 825, 980, 170, PALE);
text(95, 860, "pgvector extension INSIDE PostgreSQL", 24, true);
text(95, 899, "trainer_profiles.embedding vector(384) + embedding_model", 21);
text(95, 935, "exercises.embedding vector(384) + embedding_model", 21);
text(
  95,
  970,
  "MiniLM mean-pooled, normalized vectors · exact cosine <=> · not another server",
  18,
);
text(
  75,
  1045,
  "Infrastructure: schema_migrations. Reporting: upcoming_bookings / trainer_utilization / occupied_slots.",
  17,
);
rect(1150, 430, 600, 650);
rect(1150, 430, 600, 48, BLUE, BLUE);
text(1175, 463, "MONGODB SERVER", 25, true, "white");
text(1175, 519, "workout_logs collection", 25, true);
const fields = [
  "_id : ObjectId",
  "userId : string (member UUID)",
  "performedAt / createdAt : BSON date",
  "workoutType : enum; notes : optional string",
  "exercises[] : name + sets[] snapshots",
  "sets[] : reps / weight / duration / distance",
];
fields.forEach((s, i) => text(1175, 565 + i * 39, s, 20));
text(1175, 850, "Strict collection validator; no SQL FK.", 21, true);
text(1175, 892, "Compound indexes begin with userId.", 20);
text(1175, 934, "Owner/date match + facet/unwind/group.", 20);
text(1175, 976, "No enforced link to exercise catalog rows.", 20);
line(
  [
    [500, 1080],
    [500, 1130],
    [1450, 1130],
    [1450, 1080],
  ],
  MUTED,
  true,
);
label(
  975,
  1120,
  "Logical reference: workout_logs.userId ↔ member_profiles.user_id (UUID as string)",
);
text(
  50,
  1190,
  "Dashed logical link is application-managed: no cross-store FK, cascade or atomic transaction. Each store enforces only its own constraints.",
  20,
);
text(
  50,
  1230,
  "No embedding field exists in workout_logs. PostgreSQL roles/RLS do not authorize MongoDB; the API applies Mongo owner filtering.",
  20,
);
await save("pulsefit-hybrid-architecture");
// Refresh the reference-based conceptual/academic views and compatibility aliases last.
await import("./render-reference-diagrams.mjs");
