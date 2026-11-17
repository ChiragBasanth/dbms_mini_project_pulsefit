> Approval update: the user approved publication of these diagrams and the faculty menu to existing PR #5. The pre-approval record below is retained as dated evidence; statements about uncommitted status and an untouched menu describe that earlier review stage only. Current menu verification/publication is recorded in ../FACULTY_MENU_GUIDE.md and Git/PR metadata.

# Local reference-based diagram review

**Review only. No commit, push, merge, new PR or remote publication was performed.** Work remains on docs/chhavi-standard-er-relational-schema at unchanged HEAD 60efea00445bd32424fd84535f6e244aff4739a0. PR #5 was not updated by this local revision. The pre-existing untracked pulsefit-demo-menu.mjs remains untouched and unstaged.

## Before / after

| View | Previous PR #5 design | Local revised design |
|---|---|---|
| Conceptual ER | Crow's Foot table-like entities/attribute lists | Extended Chen: teal rectangles, blue verb diamonds, magenta ovals, underlined identifiers, one double oval for specialties, explicit entity-side min/max and single/double participation |
| ER layout | One portrait-like overview | Two landscape pages: identity/profiles; scheduling/history/catalog, with clearly repeated context entities |
| Academic relational | Previously used the detailed physical card diagram | New horizontal adjacent attribute cells, relation names above, solid/dotted PK/FK underlines, six FK groups with nine referenced-attribute arrowheads |
| Detailed physical PostgreSQL | Types, keys, defaults, constraints and indexes | Preserved byte-for-byte as a separate supplementary figure |
| Hybrid architecture | PostgreSQL, MongoDB and pgvector inside PostgreSQL | Preserved byte-for-byte as the separate fourth representation |

Reference images informed shapes/colors/layout conventions only; none of their business entities, attributes, dependencies or relationships was copied.

## Files and editable sources

Presentation masters:

- pulsefit-er-conceptual-identity.svg/png — page 1, 6000×3800 PNG.
- pulsefit-er-conceptual-booking.svg/png — page 2, 6000×3800 PNG.
- pulsefit-relational-academic.svg/png — 7600×4880 PNG.
- pulsefit-conceptual-and-academic-review.pdf — three landscape A2 pages; original-resolution PNGs embedded through the existing ReportLab workflow. SVGs remain editable/vector masters.

render-reference-diagrams.mjs is the editable layout source; the unchanged schema-model.json supplies implemented attributes/keys. Per-figure manifests provide machine-checkable entity/attribute/relationship/FK mappings. export-reference-pdf.py reproduces the review PDF. Documentation references were updated so the revised views become the current conceptual/academic figures when approved. Compatibility pulsefit.svg/png point to conceptual page 1; the documentation also links page 2 explicitly. The Mermaid file remains a physical Crow's Foot companion, not a mislabelled Chen source.

## Cardinality and conceptual qualifications

The complete participation table is in ../ER_DIAGRAM.md. All seven entities are represented. Both profiles participate totally in their qualifying user relationship; each user participates in 0..1 of either type, with role disjointness. Trainers may offer 0..N slots; slots require one trainer. Members may reserve 0..N bookings; each booking requires one member and one slot. A slot may have 0..N historical bookings; partial uniqueness limits only CONFIRMED rows. Audit structurally permits 0..N child records per booking; each audit record has one booking, with triggers producing normal audit history.

Coaches is a seventh **conceptual implied association**, derived through availability and constrained to the selected slot's trainer. It is not a seventh SQL FK. Each booking has exactly one coach; a trainer may coach many bookings. There are exactly six actual SQL FK constraints, including three composite constraints. Their exact ordered mappings appear beside numbered groups F1–F6 in the academic relational figure. Grouping bars connect only the named FK components; they do not claim functional dependencies.

The conceptual pages use 36 actual attribute ovals. Five reference-only physical columns are expressed by relationships instead of duplicate FK spokes: availability.trainer_id; bookings.member_id/trainer_id/slot_id; audit.booking_id. All 41 physical business columns remain present in the academic and detailed physical views. Profile user_id identifiers and role domain attributes are retained. Nullable attributes are documented in the physical schema rather than confused with entity participation.

Specialties is genuinely multivalued; its double oval does not imply nonempty/set semantics. Embeddings are stored and application-maintained, so ordinary ovals are used rather than claiming virtual/SQL-generated attributes. Role-qualified profiles could alternatively use EER subtype notation; this revision consistently uses explicit named relationships. Exercises has no invented FK, and Mongo's UUID reference is not an SQL FK. These qualifications are explained rather than concealed for symmetry.

## Verification actually performed

- Re-read active migrations 001–003, schema model, dictionary/relational documentation, Mongo validator and relevant embedding/API source. Compared all 41 academic attributes/types/key flags to the implementation catalog and verified all three unchanged applied migration checksums.
- Checked all six exact FK tuple mappings, 7 PK markings, 9 target-attribute arrows, 3 composite references, 17 index metadata entries, partial confirmed-booking uniqueness and GiST exclusion.
- Checked 36 actual conceptual ovals plus five relationship-represented fields against all 41 columns; all 14 entity-side participation labels across seven conceptual relationships match documented semantics. Double oval used only for specialties. No Crow's Foot endpoints occur in conceptual SVGs; no diamonds/ovals/Crow's Foot markers occur in the academic relational drawing.
- Compared all six FK trunk routes pairwise: no inter-constraint crossings. Visually inspected each final SVG rendering via its original-resolution PNG, plus unscaled detail crops of PK/FK underlines, composite reference arrows, participation and multivalue symbols. All three new PNG/SVG pairs are legible with no clipped text or overlapping labels/connectors in the final figures.
- Font/dimension check using actual Arial metrics: 37 identity-page, 52 booking-page and 114 academic-sheet text elements fit their canvases (203 total). Original PNG dimensions match the declared sizes.
- Built PDF, checked metadata (three landscape A2 pages), rendered all pages with Poppler and visually inspected all three final rendered pages after the last layout correction.
- ESLint on docs/database-design passed. All 127 checked relative documentation links resolve; whitespace checks passed. See local validation results for machine-check scope. No unit/API/build/runtime-workflow results are newly claimed for this documentation-only revision.
- Six baseline SHA-256 checks passed: menu program, unchanged schema-model, and four physical/hybrid SVG/PNG files. git diff HEAD over src/scripts/database/tests/package/lock is empty; Git index remains empty. No runtime environment file, credentials, database data or application behavior was changed.

Existing catalog metadata is the prior live read-only inspection; this revision verifies it against unchanged migration hashes and does not claim a fresh database execution audit. New validation tooling never connects to a database.

## Reproduction

```powershell
node docs/database-design/render-reference-diagrams.mjs
node docs/database-design/validate-reference-diagrams.mjs
python docs/database-design/export-reference-pdf.py
```

Stop at local review. Commit/publication requires the user's explicit approval.

## Exact changed-file list

Generated from tracked diff and new documentation files after the revision; excludes the pre-existing, unchanged menu program. All paths are relative to the existing repository worktree.

```text
README.md
docs/DBMS_PROJECT_REPORT.md
docs/DEMO_SCRIPT.md
docs/ER_DIAGRAM.md
docs/FINAL_VIVA_PREPARATION.md
docs/LEVEL3_FINAL_REPORT.md
docs/RELATIONAL_SCHEMA.md
docs/REQUIREMENTS_MATRIX.md
docs/database-design/LOCAL_REVIEW.md
docs/database-design/README.md
docs/database-design/VALIDATION.md
docs/database-design/export-reference-pdf.py
docs/database-design/pulsefit-conceptual-and-academic-review.pdf
docs/database-design/pulsefit-er-conceptual-booking.manifest.json
docs/database-design/pulsefit-er-conceptual-booking.png
docs/database-design/pulsefit-er-conceptual-booking.svg
docs/database-design/pulsefit-er-conceptual-identity.manifest.json
docs/database-design/pulsefit-er-conceptual-identity.png
docs/database-design/pulsefit-er-conceptual-identity.svg
docs/database-design/pulsefit-relational-academic.manifest.json
docs/database-design/pulsefit-relational-academic.png
docs/database-design/pulsefit-relational-academic.svg
docs/database-design/reference-validation-results.json
docs/database-design/render-diagrams.mjs
docs/database-design/render-reference-diagrams.mjs
docs/database-design/validate-reference-diagrams.mjs
docs/database-design/write-schema-doc.mjs
docs/er-diagram/README.md
docs/er-diagram/pulsefit.png
docs/er-diagram/pulsefit.svg
```
