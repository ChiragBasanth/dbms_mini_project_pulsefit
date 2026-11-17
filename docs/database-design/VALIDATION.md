# Database-design comparison and validation

Date: 17 November 2026, Asia/Kolkata. Base: latest merged original main e8424de (PR #4 included); full SHA is recorded in catalog-verification.json. Scope: documentation/design only. No application, migrations, Mongo validator, package/lock or database behavior changes.

## Actual checks performed

1. Read migrations 001_core.sql, 002_profile_metadata.sql and 003_database_authorization.sql; current design/dictionary, previous exports, Mongo validator and embedding/API implementation.
2. Connected to the configured PostgreSQL 18.6 instance **read-only**. Captured information_schema columns, pg_attribute type modifiers (including vector(384)), pg_constraint definitions, pg_indexes, RLS table flags and applied migration names/checksums. No row data or credentials were captured. Snapshot has 8 base tables, 44 base-table columns (41 business + 3 migration infrastructure) plus 13 reporting-view columns; the 57 column entries are not 57 business attributes. Seventeen indexes and 73 catalog constraints include PostgreSQL 18 NOT NULL constraint entries.
3. Compared all three migration file SHA-256 hashes with the applied database records. Parsed every business table's columns/types/nullability from source, included migration 002 location, and compared to the editable model/catalog. Checked PK/FK flags and all six FK mappings against the catalog.
4. Verified the partial index predicate and same-trainer GiST exclusion. Reviewed CHECK/default/identity/reference rules against source and actual catalog expressions; complete constraints/defaults are included in RELATIONAL_SCHEMA.md. Composite roles and slot/trainer mappings are shown as references to nonminimal superkeys, not additional candidate keys.
5. Generated three SVG masters and their high-resolution PNGs. Viewed all three complete rendered figures, reviewed cardinality markers/connectors, text, spacing, defaults and logical storage boundaries; fixed the array default display and bottom reference-panel padding during review. Rerendered and viewed all final exports. Each PNG is rasterized from its corresponding SVG, so the reviewed SVG rendering and delivered PNG share the same geometry/text. Compatibility ER SVG/PNG copies are byte-identical to the reviewed ER master.
6. Measured all 420 SVG text elements with actual Arial regular/bold font metrics: all within canvas bounds. Checked PNG dimensions (3680×3380, 4240×4340, 3600×2540). Visual review found no crossed entity connectors, clipped attributes or ambiguous cardinality endpoints. The relational sheet is a reference poster; use vector zoom/table groups in slides for readability.
7. Updated current references and marked the existing dated project report/PDF as historical, with a current design addendum. Historical audits/student evidence are preserved. Current ER no longer combines MongoDB with SQL relations.

## Compact source-to-diagram checklist

PASS below means this documentation check was executed; it does not recertify application workflows or student mastery.

| Schema object / rule | ER representation | Relational representation | Checked result |
|---|---|---|---|
| users: 6 columns | All attributes/types; id PK, email UK; parent of optional profiles | Full defaults/NN/checks; PK, email CK; UNIQUE(id,role) supporting superkey | PASS |
| member_profiles: 3 columns | PK/FK user_id; FK role; identifying 1 to 0..1 | Exact (user_id,role) FK and MEMBER CHECK | PASS |
| trainer_profiles: 8 columns | All attributes including location, specialties[], nullable 384D/model | Full defaults/checks, typed composite FK; array caveat | PASS |
| trainer_availability: 5 columns | Mandatory trainer parent; optional many child slots | UNIQUE(id,trainer_id) nonminimal target; GiST/time constraints | PASS |
| bookings: 6 columns | Mandatory member and slot; many historical rows per slot | Both FKs, immutable identity, partial confirmed uniqueness | PASS |
| booking_audit: 5 columns | Mandatory booking parent; 0..many structural child records | Identity generation, nullable old_status, trigger behavior | PASS |
| exercises: 8 columns | Standalone entity; id PK/name UK; vector/model nullable | Name candidate key, category/difficulty CHECKs; no invented FKs | PASS |
| Six FK constraints | Six connectors; all child parents exactly one | Six exact mappings; role and slot/trainer pairs explicit | PASS |
| All business columns | 41 attributes | 41 typed attributes with NN/default metadata | PASS |
| Nullable embedding attributes | Exactly two embedding/model pairs | Two vector(384) columns + two nullable model fields; audit old_status is fifth nullable attribute | PASS |
| Optional profile participation | 0..1; disjointness explained by role rules | Profile presence not required by users FK; application creates it | PASS |
| Slot history vs active capacity | 0..many bookings, not unconditional 1:1 | Partial UNIQUE(slot_id) WHERE CONFIRMED | PASS |
| schema_migrations | Omitted as nonbusiness | Separate infrastructure signature | PASS |
| 17 indexes, views/RLS/functions/triggers | Not invented as business entities | Index catalogue + reporting/authorization/trigger discussion | PASS |
| Mongo workout_logs | Excluded from PostgreSQL ER | Excluded from SQL relation signatures; separate hybrid diagram | PASS |
| Mongo member UUID | No false cross-store ER FK | Hybrid dashed logical reference; no cascade/ACID guarantee | PASS |
| pgvector | Attributes inside trainers/exercises | Exact 384D columns; hybrid shows PostgreSQL extension, no third server | PASS |
| Normal forms | No claim all entities automatically 3NF | 1NF array caveat, 2NF dependency analysis, bookings 3NF exception | PASS |

## Reproduction and command results

```powershell
# Optional fresh read-only capture; requires configured private DATABASE_URL.
node docs/database-design/inspect-catalog.mjs
node docs/database-design/build-model.mjs
node docs/database-design/write-schema-doc.mjs
node docs/database-design/render-diagrams.mjs
node docs/database-design/validate-model.mjs
npm.cmd run lint
git diff --check
git diff --exit-code origin/main -- src scripts database tests package.json package-lock.json
```

Executed: catalogue capture PASS; source/model/catalog validator PASS (3 hashes, 7 entities, 41 columns, 6 FKs, 17 indexes, 3 asset pairs); all render commands exit 0; font/dimension check PASS; ESLint exit 0; diff whitespace check PASS; implementation-only diff empty; all 100 relative links in changed/new documentation resolve. Documentation JavaScript was formatted with the installed Prettier. validation-results.json records the machine-check scope/time.

No production build, unit/API/concurrency test or fresh workflow audit was rerun for this documentation-only change. Earlier technical results remain dated evidence rather than new results. No generated figure was presumed correct solely because its source parsed.
