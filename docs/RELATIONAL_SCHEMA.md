# Physical relational schema and normalization

The implemented PostgreSQL migrations 001–003 are authoritative. This document describes the current physical relations, not an idealized redesign. [Separate relational diagram: SVG](database-design/pulsefit-relational-schema.svg) / [high-resolution PNG](database-design/pulsefit-relational-schema.png). [ER model](ER_DIAGRAM.md) shows participation; [hybrid architecture](HYBRID_DATA_MODEL.md) shows storage boundaries.

## Notation and reading rules

A signature uses `RELATION(attribute:type PK/FK/UK, ...)`. PK is the chosen primary key; FK marks every participating component, including role discriminators; UK is a single-column UNIQUE key. NN means NOT NULL; NULL means optional attribute value. CK means a **minimal candidate key**, not any unique superkey. Defaults and full SQL constraints appear below each signature. All six foreign keys are MATCH SIMPLE, NOT DEFERRABLE, initially immediate, with ON UPDATE/DELETE NO ACTION. Their components are all NOT NULL.

SQL quoted defaults/casts below are actual catalog expressions. `GENERATED ALWAYS AS IDENTITY` is distinct from an ordinary DEFAULT. PostgreSQL CHECK does not itself imply NOT NULL. Missing defaults are shown as —.

## users

```text
USERS(
  id:uuid PK,
  name:text,
  email:text UK,
  password_hash:text,
  role:text,
  created_at:timestamptz
)
```

| Attribute | PostgreSQL type | Keys | Nullability | Default / generation |
|---|---|---|---|---|
| `id` | `uuid` | PK | NN | `gen_random_uuid()` |
| `name` | `text` | — | NN | — |
| `email` | `text` | UK | NN | — |
| `password_hash` | `text` | — | NN | — |
| `role` | `text` | — | NN | — |
| `created_at` | `timestamptz` | — | NN | `now()` |

Implemented SQL constraints (excluding NOT NULL, already marked above):

```sql
-- users_email_check
CHECK (((email = lower(btrim(email))) AND (POSITION(('@'::text) IN (email)) > 1)));
-- users_email_key
UNIQUE (email);
-- users_id_role_key
UNIQUE (id, role);
-- users_name_check
CHECK (((length(name) >= 2) AND (length(name) <= 100)));
-- users_password_hash_check
CHECK ((length(password_hash) >= 60));
-- users_pkey
PRIMARY KEY (id);
-- users_role_check
CHECK ((role = ANY (ARRAY['MEMBER'::text, 'TRAINER'::text])));
```

## member_profiles

```text
MEMBER_PROFILES(
  user_id:uuid PK/FK,
  role:text FK,
  fitness_goals:text
)
```

| Attribute | PostgreSQL type | Keys | Nullability | Default / generation |
|---|---|---|---|---|
| `user_id` | `uuid` | PK, FK | NN | — |
| `role` | `text` | FK | NN | `'MEMBER'::text` |
| `fitness_goals` | `text` | — | NN | `''::text` |

Implemented SQL constraints (excluding NOT NULL, already marked above):

```sql
-- member_profiles_fitness_goals_check
CHECK ((length(fitness_goals) <= 2000));
-- member_profiles_pkey
PRIMARY KEY (user_id);
-- member_profiles_role_check
CHECK ((role = 'MEMBER'::text));
-- member_profiles_user_id_role_fkey
FOREIGN KEY (user_id, role) REFERENCES users(id, role);
```

## trainer_profiles

```text
TRAINER_PROFILES(
  user_id:uuid PK/FK,
  role:text FK,
  bio:text,
  specialties:text[],
  experience_years:integer,
  embedding:vector(384),
  embedding_model:text,
  location:text
)
```

| Attribute | PostgreSQL type | Keys | Nullability | Default / generation |
|---|---|---|---|---|
| `user_id` | `uuid` | PK, FK | NN | — |
| `role` | `text` | FK | NN | `'TRAINER'::text` |
| `bio` | `text` | — | NN | `''::text` |
| `specialties` | `text[]` | — | NN | `'{}'::text[]` |
| `experience_years` | `integer` | — | NN | `0` |
| `embedding` | `vector(384)` | — | NULL | — |
| `embedding_model` | `text` | — | NULL | — |
| `location` | `text` | — | NN | `'PulseFit Campus Gym'::text` |

Implemented SQL constraints (excluding NOT NULL, already marked above):

```sql
-- trainer_profiles_bio_check
CHECK ((length(bio) <= 2000));
-- trainer_profiles_experience_years_check
CHECK (((experience_years >= 0) AND (experience_years <= 80)));
-- trainer_profiles_location_check
CHECK ((length(location) <= 120));
-- trainer_profiles_pkey
PRIMARY KEY (user_id);
-- trainer_profiles_role_check
CHECK ((role = 'TRAINER'::text));
-- trainer_profiles_user_id_role_fkey
FOREIGN KEY (user_id, role) REFERENCES users(id, role);
```

## trainer_availability

```text
TRAINER_AVAILABILITY(
  id:uuid PK,
  trainer_id:uuid FK,
  starts_at:timestamptz,
  ends_at:timestamptz,
  status:text
)
```

| Attribute | PostgreSQL type | Keys | Nullability | Default / generation |
|---|---|---|---|---|
| `id` | `uuid` | PK | NN | `gen_random_uuid()` |
| `trainer_id` | `uuid` | FK | NN | — |
| `starts_at` | `timestamptz` | — | NN | — |
| `ends_at` | `timestamptz` | — | NN | — |
| `status` | `text` | — | NN | `'OPEN'::text` |

Implemented SQL constraints (excluding NOT NULL, already marked above):

```sql
-- trainer_availability_check
CHECK (((ends_at > starts_at) AND (ends_at <= (starts_at + '04:00:00'::interval))));
-- trainer_availability_id_trainer_id_key
UNIQUE (id, trainer_id);
-- trainer_availability_pkey
PRIMARY KEY (id);
-- trainer_availability_status_check
CHECK ((status = ANY (ARRAY['OPEN'::text, 'CLOSED'::text])));
-- trainer_availability_trainer_id_fkey
FOREIGN KEY (trainer_id) REFERENCES trainer_profiles(user_id);
-- trainer_availability_trainer_id_tstzrange_excl
EXCLUDE USING gist (trainer_id WITH =, tstzrange(starts_at, ends_at, '[)'::text) WITH &&);
```

## bookings

```text
BOOKINGS(
  id:uuid PK,
  member_id:uuid FK,
  trainer_id:uuid FK,
  slot_id:uuid FK,
  status:text,
  created_at:timestamptz
)
```

| Attribute | PostgreSQL type | Keys | Nullability | Default / generation |
|---|---|---|---|---|
| `id` | `uuid` | PK | NN | `gen_random_uuid()` |
| `member_id` | `uuid` | FK | NN | — |
| `trainer_id` | `uuid` | FK | NN | — |
| `slot_id` | `uuid` | FK | NN | — |
| `status` | `text` | — | NN | `'CONFIRMED'::text` |
| `created_at` | `timestamptz` | — | NN | `now()` |

Implemented SQL constraints (excluding NOT NULL, already marked above):

```sql
-- bookings_member_id_fkey
FOREIGN KEY (member_id) REFERENCES member_profiles(user_id);
-- bookings_pkey
PRIMARY KEY (id);
-- bookings_slot_id_trainer_id_fkey
FOREIGN KEY (slot_id, trainer_id) REFERENCES trainer_availability(id, trainer_id);
-- bookings_status_check
CHECK ((status = ANY (ARRAY['CONFIRMED'::text, 'CANCELLED'::text])));
```

## booking_audit

```text
BOOKING_AUDIT(
  id:bigint PK,
  booking_id:uuid FK,
  old_status:text,
  new_status:text,
  changed_at:timestamptz
)
```

| Attribute | PostgreSQL type | Keys | Nullability | Default / generation |
|---|---|---|---|---|
| `id` | `bigint` | PK | NN | `GENERATED ALWAYS AS IDENTITY` |
| `booking_id` | `uuid` | FK | NN | — |
| `old_status` | `text` | — | NULL | — |
| `new_status` | `text` | — | NN | — |
| `changed_at` | `timestamptz` | — | NN | `now()` |

Implemented SQL constraints (excluding NOT NULL, already marked above):

```sql
-- booking_audit_booking_id_fkey
FOREIGN KEY (booking_id) REFERENCES bookings(id);
-- booking_audit_pkey
PRIMARY KEY (id);
```

## exercises

```text
EXERCISES(
  id:uuid PK,
  name:text UK,
  muscle_group:text,
  description:text,
  difficulty:text,
  category:text,
  embedding:vector(384),
  embedding_model:text
)
```

| Attribute | PostgreSQL type | Keys | Nullability | Default / generation |
|---|---|---|---|---|
| `id` | `uuid` | PK | NN | `gen_random_uuid()` |
| `name` | `text` | UK | NN | — |
| `muscle_group` | `text` | — | NN | — |
| `description` | `text` | — | NN | — |
| `difficulty` | `text` | — | NN | — |
| `category` | `text` | — | NN | — |
| `embedding` | `vector(384)` | — | NULL | — |
| `embedding_model` | `text` | — | NULL | — |

Implemented SQL constraints (excluding NOT NULL, already marked above):

```sql
-- exercises_category_check
CHECK ((category = ANY (ARRAY['STRENGTH'::text, 'CARDIO'::text, 'MOBILITY'::text])));
-- exercises_difficulty_check
CHECK ((difficulty = ANY (ARRAY['BEGINNER'::text, 'INTERMEDIATE'::text, 'ADVANCED'::text])));
-- exercises_name_key
UNIQUE (name);
-- exercises_pkey
PRIMARY KEY (id);
```

## Keys and reference mappings

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
