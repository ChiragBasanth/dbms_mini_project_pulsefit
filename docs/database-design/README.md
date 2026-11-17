# Current database design figures

| Representation | Editable SVG | High-resolution PNG |
|---|---|---|
| Crow's Foot / IE ER | [ER SVG](pulsefit-er-crows-foot.svg) | [3680 × 3380 PNG](pulsefit-er-crows-foot.png) |
| Physical relational schema | [Relational SVG](pulsefit-relational-schema.svg) | [4240 × 4340 PNG](pulsefit-relational-schema.png) |
| Hybrid database architecture | [Hybrid SVG](pulsefit-hybrid-architecture.svg) | [3600 × 2540 PNG](pulsefit-hybrid-architecture.png) |

Use SVG for scalable slides/PDF placement; use original-resolution PNG when a presentation tool lacks SVG support. The complete relational sheet is a reference poster: project table groups individually or zoom the vector source rather than shrinking all 41 attributes to one slide.

## Editable sources and reproduction

schema-model.json contains 41 business columns, key markings and six mappings. render-diagrams.mjs is the editable layout/render source. SVGs contain editable vector shapes/text. ../er-diagram/pulsefit.mmd is a companion expressing identical ER semantics; its automatic layout may differ, so the committed SVG is the presentation master.

From repository root after the existing npm ci setup (a fresh read-only catalog can first be captured with node docs/database-design/inspect-catalog.mjs using your private DATABASE_URL):

```powershell
node docs/database-design/build-model.mjs
node docs/database-design/write-schema-doc.mjs
node docs/database-design/render-diagrams.mjs
node docs/database-design/validate-model.mjs
```

sharp is available in the existing Next.js dependency installation; no package/lock change is needed. These commands never write to databases. build-model reads the committed read-only catalog snapshot. If migrations change, capture/review a fresh catalog; do not present the old snapshot as current. Validation detects changed migration checksums.

[catalog-verification.json](catalog-verification.json) contains schema metadata only, with no row data or credentials. [VALIDATION.md](VALIDATION.md) distinguishes source/catalog/render checks from application tests not rerun for this documentation-only change.
