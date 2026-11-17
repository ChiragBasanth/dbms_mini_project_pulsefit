// Rebuilds the column/constraint reference from the reviewed model and catalog.
import fs from "node:fs";
import { fileURLToPath } from "node:url";
const dir = fileURLToPath(new URL(".", import.meta.url)),
  m = JSON.parse(fs.readFileSync(dir + "schema-model.json")),
  c = JSON.parse(fs.readFileSync(dir + "catalog-verification.json"));
const out = [
  "# Relational schema — academic mapping and physical implementation",
  "",
  "The implemented PostgreSQL migrations 001–003 are authoritative. [Academic relational diagram: SVG](database-design/pulsefit-relational-academic.svg) / [PNG](database-design/pulsefit-relational-academic.png) uses horizontal attribute cells, solid PK underlines, dotted FK underlines and numbered FK-to-reference arrows. Its grouped taps represent one constraint each; exact tuple mappings define the order, not functional dependencies. [Detailed physical diagram: SVG](database-design/pulsefit-relational-schema.svg) / [PNG](database-design/pulsefit-relational-schema.png) is preserved unchanged as the implementation supplement. This document retains all columns, types, defaults, CHECKs and indexes. [Extended Chen ER](ER_DIAGRAM.md) shows concepts/participation; [hybrid architecture](HYBRID_DATA_MODEL.md) shows database boundaries.",
  "",
  "## Notation and reading rules",
  "",
  "A signature uses `RELATION(attribute:type PK/FK/UK, ...)`. PK is the chosen primary key; FK marks every participating component, including role discriminators; UK is a single-column UNIQUE key. NN means NOT NULL; NULL means optional attribute value. CK means a **minimal candidate key**, not any unique superkey. Defaults and full SQL constraints appear below each signature. All six foreign keys are MATCH SIMPLE, NOT DEFERRABLE, initially immediate, with ON UPDATE/DELETE NO ACTION. Their components are all NOT NULL.",
  "",
  "SQL quoted defaults/casts below are actual catalog expressions. `GENERATED ALWAYS AS IDENTITY` is distinct from an ordinary DEFAULT. PostgreSQL CHECK does not itself imply NOT NULL. Missing defaults are shown as —.",
  "",
];
for (const t of m.tables) {
  out.push(
    "## " + t.name,
    "",
    "```text",
    t.name.toUpperCase() +
      "(\n" +
      t.columns
        .map(
          (x) =>
            "  " +
            x.name +
            ":" +
            x.type +
            (x.key.length ? " " + x.key.join("/") : ""),
        )
        .join(",\n") +
      "\n)",
    "```",
    "",
    "| Attribute | PostgreSQL type | Keys | Nullability | Default / generation |",
    "|---|---|---|---|---|",
  );
  for (const x of t.columns)
    out.push(
      "| `" +
        x.name +
        "` | `" +
        x.type +
        "` | " +
        (x.key.join(", ") || "—") +
        " | " +
        (x.nullable ? "NULL" : "NN") +
        " | " +
        (x.default === null ? "—" : "`" + x.default + "`") +
        " |",
    );
  out.push(
    "",
    "Implemented SQL constraints (excluding NOT NULL, already marked above):",
    "",
    "```sql",
    ...c.constraints
      .filter((x) => x.table_name === t.name && x.contype !== "n")
      .map((x) => "-- " + x.conname + "\n" + x.definition + ";"),
    "```",
    "",
  );
}
out.push(`## Keys and reference mappings

The chosen PKs are users.id, both profiles.user_id, trainer_availability.id, bookings.id, booking_audit.id and exercises.id. Additional explicit UNIQUE/NOT NULL candidate keys are users.email and exercises.name. The exclusion rule plus positive slot duration also implies uniqueness of (trainer_id, starts_at) for availability; that is a temporal semantic key, not a separately declared UNIQUE constraint.

**UNIQUE users(id, role)** and **UNIQUE trainer_availability(id, trainer_id)** are nonminimal superkeys: id alone is already unique. They exist as exact composite FK targets. The partial index on bookings.slot_id is unique only within CONFIRMED rows, so slot_id is not a candidate key of the whole history relation.

| Referencing relation / columns | Referenced columns | Meaning |
|---|---|---|
| member_profiles(user_id, role) | users(id, role) | Same UUID and MEMBER role |
| trainer_profiles(user_id, role) | users(id, role) | Same UUID and TRAINER role |
| trainer_availability(trainer_id) | trainer_profiles(user_id) | Typed trainer, not arbitrary user |
| bookings(member_id) | member_profiles(user_id) | Typed member |
| bookings(slot_id, trainer_id) | trainer_availability(id, trainer_id) | Trainer must belong to that exact slot |
| booking_audit(booking_id) | bookings(id) | Booking change history |

There is **no standalone FK** from bookings.trainer_id to trainer_profiles. The slot/trainer composite FK plus availability's trainer FK enforces the chain. Diagram FK markings identify components, not extra independent constraints. Exercises is not FK-linked to trainers or Mongo snapshots.

## Temporal integrity, transactions and triggers

The GiST exclusion rejects any overlapping [starts_at, ends_at) intervals for the same trainer, including CLOSED slots; adjoining endpoints are allowed. It is not a UNIQUE timestamp rule. CHECK limits duration to >0 and <=4 hours. protect_availability / availability_guard require an inserted start in the next 90 days, prevent changes of trainer/times, and reject closure while a CONFIRMED booking exists. The trigger itself is not the source of overlap exclusion.

one_confirmed_booking_per_slot is a **partial unique B-tree index**, not an unconditional 1:1 relationship. reserve_slot locks the selected slot FOR UPDATE, checks status/time and inserts; app_reserve_slot additionally verifies the trusted request actor is the specified member. validate_booking / booking_validation reject invalid time/status and immutable identity changes; a cancelled row cannot be revived. audit_booking / booking_changes append audit records after inserts/status updates. FK cardinality permits zero audit rows, although normal trigger-covered inserts produce one. SQL does not enforce total participation of users in a profile.

Foreign-key NO ACTION can block deletion of referenced records; no ON DELETE CASCADE is declared. Cancellation preserves rows. Neither a cross-store ACID transaction nor a SQL FK to Mongo exists.

## Index catalog

Seventeen physical indexes were read from the live catalog: seven business PK indexes, one migration PK, two business single-column unique indexes, two composite reference-unique indexes, one GiST exclusion index, one partial unique booking index and three lookup indexes. PostgreSQL automatically creates backing indexes for PK/UNIQUE/exclusion constraints; referencing FK columns do not automatically receive indexes.

| Index | Relation / purpose |
|---|---|
| users_pkey; users_email_key; users_id_role_key | Identity PK, email candidate key, composite role-reference superkey |
| member_profiles_pkey; trainer_profiles_pkey | Profile UUID PKs |
| trainer_availability_pkey; trainer_availability_id_trainer_id_key | Slot PK and composite reference target |
| trainer_availability_trainer_id_tstzrange_excl | GiST same-trainer non-overlap |
| availability_trainer_date | B-tree (trainer_id, starts_at) |
| bookings_pkey | Booking PK |
| one_confirmed_booking_per_slot | UNIQUE (slot_id) WHERE status='CONFIRMED' |
| bookings_member_date | B-tree (member_id, created_at DESC) |
| bookings_trainer | B-tree (trainer_id, status) |
| booking_audit_pkey | Audit identity PK |
| exercises_pkey; exercises_name_key | Catalog PK and name candidate key |
| schema_migrations_pkey | Infrastructure filename PK |

Embeddings use exact cosine scans today. No HNSW/IVFFlat index or independently hosted vector database is claimed. See the full [catalog snapshot](database-design/catalog-verification.json) for index definitions.

## Infrastructure, reporting and access control

schema_migrations(name text PK, checksum text NN, applied_at timestamptz NN DEFAULT now()) is created by scripts/migrate.ts. It records applied filename/checksum; it is not an eighth business entity.

The three views are upcoming_bookings, trainer_utilization and occupied_slots. Migration 003 makes the first two security_invoker; occupied_slots exposes occupied slot IDs without booking identities. Seven project functions and three triggers exist; none is a stored procedure. RLS is enabled on both profiles, availability, bookings and audit (12 policies). scripts/rbac.ts grants the non-owner runtime login appropriate table/column/function privileges; migration ownership is separate. Actor context is supplied by the trusted backend and checked using users.role; it is not protection against a compromised backend credential. See SECURITY_AND_CONSISTENCY.md.

## Normalization: actual design and deliberate exceptions

**1NF:** scalar identity, booking, availability, audit and exercise attributes use single declared values per row; keys identify records. PostgreSQL text[] specialties deliberately represents a multivalued attribute. Classical atomic-value 1NF analysis would normalize it into a specialty relation and association table. PostgreSQL supports arrays physically; this does not justify claiming strict classical 1NF/3NF for trainer_profiles. vector(384) is a typed derived feature value used as one application attribute; it is not 384 repeating relational columns or a new entity.

**2NF:** chosen surrogate PKs (and profile user_id PKs) have one attribute, so no partial dependency on a proper subset of those keys is introduced. users.email and exercises.name are also single-attribute candidate keys. The availability temporal semantic key (trainer_id, starts_at) determines the complete slot under the exclusion/positive-duration rule; the implemented slot attributes have no stated dependency on only its trainer or only its timestamp. Two-column *supporting superkeys* must not be mistaken for composite candidate keys when analysing 2NF. This is an analysis of documented dependencies, not a proof against every possible unstated business dependency.

**3NF:** identity/profile separation removes repeated credential/contact details from booking rows. The scalar relations largely follow key-based dependencies. However bookings has id -> slot_id -> trainer_id: slot_id determines trainer_id but is not a superkey of the full booking history, and trainer_id is nonprime. The physical relation is therefore **deliberately not fully decomposed 3NF**. Retaining trainer_id supports an exact composite FK against mismatched slot/trainer combinations, direct trainer filtering and authorization. An alternative normalized design could derive trainer_id through the slot join; that is a future schema change, not this documentation task.

The fixed profile role columns are intentional discriminator redundancy: a CHECK plus composite FK prevents attaching a member profile to a trainer user or the reverse. Their constant values exist for declarative integrity, not additional independent business facts. Derived embeddings/model tags are materialized retrieval features maintained by the application. No claim is made that all relations are strictly 3NF/BCNF. If specialties acquire identifiers/per-specialty metadata or a stricter classical normalized design is required, normalize them through explicit relations in a separately approved implementation change.

Mongo workout documents intentionally embed exercise/set snapshots for document-oriented history and aggregation; relational normal forms do not describe their physical layout in the same way. There is no automatic cross-store referential integrity.

## Presenting this diagram in viva

“This is the implemented physical schema. I read each signature as a relation with its types and keys, then show the full composite FK mappings. The unique role/slot pairs are supporting superkeys, not minimal candidate keys. The partial booking index applies only to confirmed rows; history remains one-to-many. Booking trainer redundancy and the specialty array are conscious departures from a universally strict 3NF claim.”

## References and verification

[PostgreSQL constraints](https://www.postgresql.org/docs/18/ddl-constraints.html) explains composite references, unique/exclusion constraints and null semantics. Project-specific names and rules above come from the three active migration files and the read-only live catalog, not from an idealized schema. [Validation checklist and methodology](database-design/VALIDATION.md).
`);
fs.writeFileSync(dir + "../RELATIONAL_SCHEMA.md", out.join("\n"));
