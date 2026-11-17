# PulseFit database design — four separate representations

**User-approved current diagrams.** Extended Chen and the academic relational view are the primary assessment figures; the physical/hybrid views are supplements.

| View | SVG | High-resolution PNG |
|---|---|---|
| A1. Extended Chen conceptual ER: identity/profiles | [SVG](pulsefit-er-conceptual-identity.svg) | [PNG](pulsefit-er-conceptual-identity.png) |
| A2. Extended Chen conceptual ER: scheduling/history/catalog | [SVG](pulsefit-er-conceptual-booking.svg) | [PNG](pulsefit-er-conceptual-booking.png) |
| B. Academic relational schema: horizontal cells / FK arrows | [SVG](pulsefit-relational-academic.svg) | [PNG](pulsefit-relational-academic.png) |
| C. Detailed physical PostgreSQL schema — preserved | [SVG](pulsefit-relational-schema.svg) | [PNG](pulsefit-relational-schema.png) |
| D. Hybrid database architecture — preserved | [SVG](pulsefit-hybrid-architecture.svg) | [PNG](pulsefit-hybrid-architecture.png) |

[Landscape three-page review PDF](pulsefit-conceptual-and-academic-review.pdf) contains A1/A2/B at A2 page size using original-resolution images. Editable vector masters are the SVGs. Use vector zoom or table groups when projecting dense relational details.

## Editable sources and reproduction

schema-model.json is the unchanged validated implementation model. render-reference-diagrams.mjs generates both extended-Chen pages and the academic relational sheet, plus semantic manifests used for validation. The SVGs are directly editable shapes/text. export-reference-pdf.py uses ReportLab, already used by the existing project-report workflow, to create the optional high-resolution review PDF.

```powershell
# Existing npm dependencies, no database access or writes:
node docs/database-design/render-reference-diagrams.mjs
node docs/database-design/validate-reference-diagrams.mjs
# With the existing Python/ReportLab environment:
python docs/database-design/export-reference-pdf.py
```

render-diagrams.mjs still maintains the detailed physical/hybrid figures and the superseded Crow's Foot exports in archive/, then invokes the new renderer so compatibility links resolve to the corrected conceptual page. The physical/hybrid SVG/PNG files remain byte-identical to the previously validated versions. ../er-diagram/pulsefit.svg/png alias conceptual page 1 only; page 2 is always linked explicitly. The Mermaid file is a physical-reference companion, not the Chen source.

[RELATIONAL_SCHEMA.md](../RELATIONAL_SCHEMA.md) retains the full types/defaults/CHECKs/indexes and normalization discussion. [ER_DIAGRAM.md](../ER_DIAGRAM.md) explains the chosen participation convention, omitted reference-only ovals and implied coaching association. [LOCAL_REVIEW.md](LOCAL_REVIEW.md) preserves the original pre-approval review record; [VALIDATION.md](VALIDATION.md) preserves the previous PR #5 validation with a revision notice. Catalog snapshots contain no row data or credentials.

No new database objects, functional dependencies, total-specialization constraints or cross-store FKs are introduced by these drawings.
