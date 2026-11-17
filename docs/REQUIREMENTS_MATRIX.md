# Current faculty compliance matrix

See [LEVEL3_FINAL_REPORT.md](LEVEL3_FINAL_REPORT.md#compliance-matrix), covering every deliverable supplied in the current task with PASS/PARTIAL status, supporting files, executed evidence and limits. The older matrix is retained in archive/REQUIREMENTS_MATRIX-2026-11-01.md.

## Database-design documentation revision — 17 November 2026

| Deliverable | Evidence | Validation |
|---|---|---|
| Crow's Foot / IE ER | [ER](ER_DIAGRAM.md), [SVG/PNG](database-design/README.md) | Seven business entities; 41 columns; minimum/maximum participation; historical booking cardinality |
| Separate physical relational schema | [Schema](RELATIONAL_SCHEMA.md), [diagram](database-design/pulsefit-relational-schema.svg) | Exact types/keys/defaults; six composite/ordinary FKs; superkeys; normalization exceptions |
| Hybrid architecture | [Hybrid model](HYBRID_DATA_MODEL.md) | Logical Mongo reference; pgvector inside PostgreSQL, 384D on trainers/exercises |

[Executed source/catalog/render checklist](database-design/VALIDATION.md). These design checks do not newly certify student contributions, originality or viva mastery.
