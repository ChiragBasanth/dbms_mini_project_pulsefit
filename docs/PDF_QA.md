# Printable report verification

Generated from the complete Markdown report with ReportLab using real source excerpts and actual screenshot JPEGs. The converter renders the architecture and ER diagrams as vector graphics derived from the documented design; they are diagrams, not screenshots. Arial/Consolas fonts are embedded for text/code.

The final PDF was reopened with pypdf, checked for all nine main headings, and every page rendered using pypdfium2. Contact sheets were visually reviewed, followed by full-size inspection of representative diagram, image, rubric and testing pages. Layout revisions widened the status/marks columns and removed an overlapping diagram-edge label. Final rendering was reviewed again. Source and console screenshots listed as pending remain pending in both formats.

Reproduce on Windows with the bundled Python or an environment providing reportlab, pypdf, pypdfium2 and Pillow:

```powershell
python scripts/generate-report.py
python scripts/render-report.py
```

The converter expects Windows Arial and Consolas fonts; adjust those paths on another OS. Markdown remains the canonical editable report and carries Mermaid diagram sources. There is no DOCX conversion claim.
