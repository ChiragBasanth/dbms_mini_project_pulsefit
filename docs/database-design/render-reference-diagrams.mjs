// User-approved academic edition. Extended Chen concepts and academic relation signatures.
// Input is the validated implementation model; never connects to a database.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
const dir = fileURLToPath(new URL(".", import.meta.url));
const model = JSON.parse(fs.readFileSync(dir + "schema-model.json"));
const TEAL = "#009eac",
  BLUE = "#00557d",
  MAGENTA = "#b80b50",
  INK = "#263238",
  GREY = "#64717a";
const names = {
  users: "User",
  member_profiles: "Member Profile",
  trainer_profiles: "Trainer Profile",
  trainer_availability: "Availability Slot",
  bookings: "Booking",
  booking_audit: "Booking Audit",
  exercises: "Exercise",
};
const omitted = {
  trainer_availability: ["trainer_id"],
  bookings: ["member_id", "trainer_id", "slot_id"],
  booking_audit: ["booking_id"],
};
let shapes, edges, labels, manifest, W, H;
const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
function text(
  x,
  y,
  s,
  size = 24,
  fill = INK,
  anchor = "start",
  bold = false,
  underline = false,
) {
  labels.push(
    `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${bold ? 700 : 400}" text-anchor="${anchor}" fill="${fill}"${underline ? ' text-decoration="underline"' : ""}>${escape(s)}</text>`,
  );
}
function path(
  points,
  { color = INK, double = false, arrow = false, dash = false } = {},
) {
  const draw = (ps) =>
    edges.push(
      `<polyline points="${ps.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${color}" stroke-width="2"${dash ? ' stroke-dasharray="3 4"' : ""}${arrow ? ' marker-end="url(#fk-arrow)"' : ""}/>`,
    );
  if (!double) draw(points);
  else {
    // Orthogonal participation path; two symmetric strokes, no arrowheads.
    for (const k of [-3, 3])
      draw(
        points.map(([x, y], i) => {
          const normal = (a, b) => {
            const dx = b[0] - a[0],
              dy = b[1] - a[1],
              len = Math.hypot(dx, dy);
            return [-dy / len, dx / len];
          };
          const v =
            i === 0
              ? normal(points[0], points[1])
              : i === points.length - 1
                ? normal(points[i - 1], points[i])
                : normal(points[i - 1], points[i]).map(
                    (n, j) => n + normal(points[i], points[i + 1])[j],
                  );
          return [x + v[0] * k, y + v[1] * k];
        }),
      );
  }
}
function begin(w, h, title, subtitle) {
  W = w;
  H = h;
  shapes = [];
  edges = [];
  labels = [];
  manifest = {
    title,
    entities: [],
    attributes: [],
    relationships: [],
    fkGroups: [],
  };
  text(70, 65, title, 37, INK, "start", true);
  text(70, 108, subtitle, 24, GREY);
}
function entity(table, x, y, { context = false } = {}) {
  const e = { table, x, y, w: 280, h: 80 };
  shapes.push(
    `<rect x="${x - 140}" y="${y - 40}" width="280" height="80" fill="${TEAL}" stroke="${TEAL}" stroke-width="2"/>`,
  );
  text(x, y + 7, names[table], 27, "white", "middle", true);
  if (context) text(x, y - 64, "Attributes: page 1", 20, GREY, "middle");
  manifest.entities.push({ table, context });
  return e;
}
function diamond(verb, x, y) {
  const d = { x, y, rx: 135, ry: 78 };
  shapes.push(
    `<polygon points="${x},${y - 78} ${x + 135},${y} ${x},${y + 78} ${x - 135},${y}" fill="${BLUE}" stroke="${BLUE}" stroke-width="2"/>`,
  );
  verb
    .split("\n")
    .forEach((s, i, a) =>
      text(
        x,
        y + 8 + (i - (a.length - 1) / 2) * 29,
        s,
        25,
        "white",
        "middle",
        true,
      ),
    );
  return d;
}
function attribute(e, column, x, y, { multi = false } = {}) {
  const rx = Math.max(130, column.name.length * 7 + 28),
    ry = 37;
  const dx = x - e.x,
    dy = y - e.y;
  const k = 1 / Math.max(Math.abs(dx) / (e.w / 2), Math.abs(dy) / (e.h / 2));
  const sx = e.x + dx * k,
    sy = e.y + dy * k;
  const norm = Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2);
  path([
    [sx, sy],
    [x - dx / norm, y - dy / norm],
  ]);
  shapes.push(
    `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${MAGENTA}" stroke="${MAGENTA}" stroke-width="2"/>`,
  );
  if (multi)
    shapes.push(
      `<ellipse cx="${x}" cy="${y}" rx="${rx + 7}" ry="${ry + 7}" fill="none" stroke="${MAGENTA}" stroke-width="2"/>`,
    );
  text(
    x,
    y + 8,
    column.name,
    24,
    "white",
    "middle",
    false,
    column.key.includes("PK"),
  );
  if (column.name === "embedding")
    text(x, y + 66, "384D · stored", 18, GREY, "middle");
  manifest.attributes.push({
    table: e.table,
    column: column.name,
    key: column.key.includes("PK"),
    multi,
  });
}
function attrs(e, points) {
  const cols = model.tables
    .find((t) => t.name === e.table)
    .columns.filter((c) => !omitted[e.table]?.includes(c.name));
  if (cols.length !== points.length)
    throw Error("Attribute layout mismatch " + e.table);
  cols.forEach((c, i) =>
    attribute(e, c, ...points[i], { multi: c.name === "specialties" }),
  );
}
function participation(entityName, diamondName, points, min, max, lx, ly) {
  path(points, { double: min === 1 });
  text(lx, ly, `(${min},${max})`, 24, INK, "middle", true);
  manifest.relationships.push({
    entity: entityName,
    relationship: diamondName,
    min,
    max,
  });
}
function conceptualLegend(y) {
  text(70, y, "EXTENDED CHEN", 23, INK, "start", true);
  text(
    340,
    y,
    "Rectangle: entity · Diamond: relationship · Oval: stored attribute · Underlined: primary identifier",
    23,
  );
  text(
    70,
    y + 43,
    "Double oval: multivalued specialties · Single line: partial participation (min 0) · Double line: total participation (min 1)",
    23,
  );
  text(
    70,
    y + 86,
    "(min,max) beside an entity counts its relationship participations; N = many. No Crow’s Foot endpoints; no derived-attribute ovals.",
    23,
  );
}
async function save(name) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img"><title>${escape(manifest.title)}</title><desc>User-approved PulseFit academic design. Exact entities and mappings from active PostgreSQL migrations.</desc><defs><marker id="fk-arrow" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" orient="auto-start-reverse"><path d="M1 1 L11 6 L1 11" fill="none" stroke="#34434b" stroke-width="1.5"/></marker></defs><rect width="100%" height="100%" fill="white"/>${edges.join("\n")}${shapes.join("\n")}${labels.join("\n")}</svg>`;
  fs.writeFileSync(dir + name + ".svg", svg);
  await sharp(Buffer.from(svg))
    .resize(W * 2, H * 2)
    .png()
    .withMetadata({ density: 192 })
    .toFile(dir + name + ".png");
  fs.writeFileSync(
    dir + name + ".manifest.json",
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(name, W * 2, H * 2);
}

// PAGE 1: all identity/profile attributes. Role FKs are explained as semantics.
begin(
  3000,
  1900,
  "PulseFit | Conceptual ER — Identity and Profiles",
  "Page 1 of 2 · Extended Chen notation · Read with page 2: scheduling, booking, audit and independent exercise catalog",
);
const user = entity("users", 1500, 450),
  member = entity("member_profiles", 800, 1250),
  trainer = entity("trainer_profiles", 2200, 1250);
attrs(user, [
  [850, 250],
  [1250, 200],
  [1750, 200],
  [2150, 250],
  [850, 500],
  [2150, 500],
]);
attrs(member, [
  [300, 1000],
  [300, 1350],
  [850, 1550],
]);
attrs(trainer, [
  [1650, 1000],
  [1950, 950],
  [2400, 950],
  [2750, 1100],
  [2750, 1350],
  [2550, 1580],
  [2150, 1650],
  [1700, 1510],
]);
diamond("Has member\nprofile", 800, 800);
diamond("Has trainer\nprofile", 2200, 800);
participation(
  "users",
  "Has member profile",
  [
    [1400, 490],
    [1400, 800],
    [935, 800],
  ],
  0,
  1,
  1300,
  550,
);
participation(
  "member_profiles",
  "Has member profile",
  [
    [800, 878],
    [800, 1210],
  ],
  1,
  1,
  880,
  1150,
);
participation(
  "users",
  "Has trainer profile",
  [
    [1600, 490],
    [1600, 800],
    [2065, 800],
  ],
  0,
  1,
  1710,
  550,
);
participation(
  "trainer_profiles",
  "Has trainer profile",
  [
    [2200, 878],
    [2200, 1210],
  ],
  1,
  1,
  2280,
  1050,
);
text(
  70,
  635,
  "Role condition: profiles are disjoint; the stored user role must qualify for the profile type.",
  24,
);
text(
  70,
  675,
  "A user is not required by SQL to have a profile. The application creates it during registration.",
  24,
);
conceptualLegend(1750);
await save("pulsefit-er-conceptual-identity");

// PAGE 2: remaining entities. Context entities explicitly repeat page-1 identity.
begin(
  3000,
  1900,
  "PulseFit | Conceptual ER — Scheduling, History and Catalog",
  "Page 2 of 2 · Context profiles refer to page 1 · No SQL FK columns are duplicated as conceptual attribute ovals",
);
const slot = entity("trainer_availability", 700, 450),
  booking = entity("bookings", 700, 1050),
  audit = entity("booking_audit", 1500, 1190),
  exercise = entity("exercises", 2350, 650);
entity("member_profiles", 250, 650, { context: true });
entity("trainer_profiles", 1500, 450, { context: true });
attrs(slot, [
  [250, 250],
  [550, 200],
  [850, 200],
  [1100, 250],
]);
attrs(booking, [
  [400, 1260],
  [700, 1400],
  [1000, 1260],
]);
attrs(audit, [
  [1100, 1430],
  [1470, 1540],
  [1830, 1430],
  [1930, 1190],
]);
attrs(exercise, [
  [1980, 300],
  [2360, 250],
  [2750, 330],
  [2750, 570],
  [2750, 810],
  [2500, 1050],
  [2150, 1080],
  [1950, 850],
]);
diamond("Offers", 1100, 450);
diamond("Reserves", 250, 1050);
diamond("Allocates", 700, 760);
diamond("Records", 1100, 1050);
diamond("Coaches", 1500, 760);
participation(
  "trainer_profiles",
  "Offers",
  [
    [1360, 450],
    [1235, 450],
  ],
  0,
  "N",
  1300,
  420,
);
participation(
  "trainer_availability",
  "Offers",
  [
    [965, 450],
    [840, 450],
  ],
  1,
  1,
  900,
  420,
);
participation(
  "member_profiles",
  "Reserves",
  [
    [250, 690],
    [250, 972],
  ],
  0,
  "N",
  330,
  830,
);
participation(
  "bookings",
  "Reserves",
  [
    [385, 1050],
    [560, 1050],
  ],
  1,
  1,
  490,
  1020,
);
participation(
  "trainer_availability",
  "Allocates",
  [
    [700, 490],
    [700, 682],
  ],
  0,
  "N",
  785,
  560,
);
participation(
  "bookings",
  "Allocates",
  [
    [700, 838],
    [700, 1010],
  ],
  1,
  1,
  620,
  970,
);
participation(
  "bookings",
  "Records",
  [
    [840, 1050],
    [965, 1050],
  ],
  0,
  "N",
  900,
  1020,
);
participation(
  "booking_audit",
  "Records",
  [
    [1235, 1050],
    [1320, 1050],
    [1320, 1190],
    [1360, 1190],
  ],
  1,
  1,
  1240,
  1170,
);
participation(
  "trainer_profiles",
  "Coaches",
  [
    [1500, 490],
    [1500, 682],
  ],
  0,
  "N",
  1580,
  580,
); // Context caption occupies y519, clear of the cardinality.
// Total participation is drawn as parallel orthogonal segments without implying a new SQL FK.
path(
  [
    [1500, 838],
    [1500, 900],
    [770, 900],
    [770, 1010],
  ],
  { double: true },
);
text(850, 975, "(1,1)", 24, INK, "middle", true);
manifest.relationships.push({
  entity: "bookings",
  relationship: "Coaches",
  min: 1,
  max: 1,
});
text(
  70,
  1630,
  "Booking coach = selected slot’s trainer. “Coaches” is an implied association, not an additional independent SQL foreign key.",
  24,
);
text(
  70,
  1672,
  "A slot has many historical bookings, but ≤1 CONFIRMED row. Audit is structurally optional; normal booking triggers append records.",
  24,
);
text(
  70,
  1714,
  "Exercise is an independent SQL catalog. Stored embeddings are ordinary attributes here, not SQL-generated or virtual values.",
  24,
);
conceptualLegend(1770);
await save("pulsefit-er-conceptual-booking");

// ACADEMIC RELATIONAL SIGNATURES. Child FK -> parent reference group, no FD arrows.
begin(
  3800,
  2440,
  "PulseFit | Academic Relational Schema",
  "Seven business relations · All 41 attributes and actual PostgreSQL types · Six numbered FK constraints, including three composite references",
);
const rows = {};
function relation(table, x, y) {
  const t = model.tables.find((t) => t.name === table);
  text(x, y - 65, table.toUpperCase(), 28, INK, "start", true);
  let cx = x;
  const cells = {};
  for (const c of t.columns) {
    const w = Math.max(160, c.name.length * 13 + 38);
    shapes.push(
      `<rect x="${cx}" y="${y}" width="${w}" height="82" fill="white" stroke="#4f5c63" stroke-width="1.5"/>`,
    );
    text(
      cx + w / 2,
      y + 31,
      c.name,
      24,
      INK,
      "middle",
      c.key.includes("PK"),
      c.key.includes("PK"),
    );
    text(cx + w / 2, y + 63, c.type, 20, GREY, "middle");
    if (c.key.includes("FK")) {
      const length = c.name.length * 12;
      shapes.push(
        `<line x1="${cx + w / 2 - length / 2}" y1="${y + 40}" x2="${cx + w / 2 + length / 2}" y2="${y + 40}" stroke="#34434b" stroke-width="1.8" stroke-dasharray="2 4"/>`,
      );
    }
    if (c.key.includes("UK"))
      text(cx + w - 12, y + 18, "U", 16, GREY, "end", true);
    cells[c.name] = { x: cx + w / 2, y, w };
    cx += w;
    manifest.attributes.push({ table, column: c.name, key: c.key });
  }
  rows[table] = { x, y, end: cx, cells };
  manifest.entities.push({ table, context: false });
}
relation("users", 900, 260);
relation("member_profiles", 150, 700);
relation("trainer_profiles", 2100, 700);
relation("bookings", 400, 1300);
relation("trainer_availability", 2400, 1300);
relation("booking_audit", 400, 1830);
relation("exercises", 2100, 1830);
function group(table, cols, side, id, { target = false } = {}) {
  const r = rows[table],
    xs = cols.map((c) => r.cells[c].x),
    edge = side === "top" ? r.y : r.y + 82,
    y = edge + (side === "top" ? -34 : 34);
  if (cols.length > 1)
    path(
      [
        [Math.min(...xs), y],
        [Math.max(...xs), y],
      ],
      { color: GREY },
    );
  for (const x of xs)
    path(
      target
        ? [
            [x, y],
            [x, edge],
          ]
        : [
            [x, edge],
            [x, y],
          ],
      { color: GREY, arrow: target },
    );
  const x = xs.reduce((a, b) => a + b, 0) / xs.length;
  text(x + 22, y + (side === "top" ? 24 : 30), id, 21, INK, "start", true);
  return [x, y];
}
const mappings = [
  [
    "F1",
    "member_profiles",
    ["user_id", "role"],
    "users",
    ["id", "role"],
    "top",
    "bottom",
  ],
  [
    "F2",
    "trainer_profiles",
    ["user_id", "role"],
    "users",
    ["id", "role"],
    "top",
    "top",
  ],
  [
    "F3",
    "trainer_availability",
    ["trainer_id"],
    "trainer_profiles",
    ["user_id"],
    "top",
    "bottom",
  ],
  [
    "F4",
    "bookings",
    ["member_id"],
    "member_profiles",
    ["user_id"],
    "top",
    "bottom",
  ],
  [
    "F5",
    "bookings",
    ["slot_id", "trainer_id"],
    "trainer_availability",
    ["id", "trainer_id"],
    "bottom",
    "bottom",
  ],
  ["F6", "booking_audit", ["booking_id"], "bookings", ["id"], "top", "bottom"],
];
for (const [id, child, cols, parent, refs, fromSide, toSide] of mappings) {
  const a = group(child, cols, fromSide, id),
    b = group(parent, refs, toSide, id, { target: true });
  let route;
  if (id === "F1") route = [a, [80, a[1]], [80, 430], [b[0], 430], b];
  if (id === "F2") route = [a, [2000, a[1]], [2000, 170], [b[0], 170], b];
  if (id === "F3") route = [a, [3300, a[1]], [3300, 1080], [b[0], 1080], b];
  if (id === "F4") route = [a, [a[0], 1080], [b[0], 1080], b];
  if (id === "F5") route = [a, [a[0], 1530], [b[0], 1530], b];
  if (id === "F6") route = [a, [a[0], 1600], [b[0], 1600], b];
  path(route, { color: "#34434b" });
  manifest.fkGroups.push({
    id,
    child,
    columns: cols,
    parent,
    references: refs,
    route,
  });
}
text(70, 2040, "KEYS & REFERENCES", 25, INK, "start", true);
text(
  440,
  2040,
  "Solid underline: PK · Dotted underline: FK component · U: single-column UNIQUE · Arrow: child FK → referenced key group",
  24,
);
text(
  70,
  2088,
  "F1 (user_id,role) → USERS(id,role) · F2 (user_id,role) → USERS(id,role) · F3 trainer_id → TRAINER_PROFILES(user_id)",
  24,
);
text(
  70,
  2136,
  "F4 member_id → MEMBER_PROFILES(user_id) · F5 (slot_id,trainer_id) → TRAINER_AVAILABILITY(id,trainer_id) · F6 booking_id → BOOKINGS(id)",
  24,
);
text(
  70,
  2184,
  "Grouped taps belong to ONE FK constraint; tuple order is defined above. No composite PKs are declared. These are reference arrows, not functional dependencies.",
  24,
);
text(
  70,
  2232,
  "UNIQUE: USERS.email, EXERCISES.name; (id,role) and (id,trainer_id) are nonminimal supporting superkeys. All FK components are NOT NULL.",
  24,
);
text(
  70,
  2280,
  "PARTIAL UNIQUE: BOOKINGS(slot_id) WHERE status = CONFIRMED. GiST exclusion prevents overlapping availability intervals for each trainer.",
  24,
);
text(
  70,
  2328,
  "CHECK/NN/defaults and all indexes: detailed physical diagram + RELATIONAL_SCHEMA.md. Booking trainer redundancy and specialties[] are normalization tradeoffs.",
  24,
);
text(
  70,
  2376,
  "Infrastructure only: schema_migrations. No strict universal 3NF/BCNF claim. Exercises has no FK; MongoDB and pgvector boundaries remain in the hybrid figure.",
  24,
);
await save("pulsefit-relational-academic");
// Existing ER links resolve to the first conceptual page; docs explicitly link page 2.
for (const ext of ["svg", "png"])
  fs.copyFileSync(
    dir + "pulsefit-er-conceptual-identity." + ext,
    dir + "../er-diagram/pulsefit." + ext,
  );
