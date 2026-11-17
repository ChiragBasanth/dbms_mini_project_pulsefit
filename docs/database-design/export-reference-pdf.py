"""Local review PDF from original-resolution diagram PNGs; no database access.

Uses ReportLab, as does the project's existing report rendering workflow.
Editable/vector masters remain the SVGs. This PDF embeds high-resolution images.
"""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A2, landscape
from reportlab.lib.utils import ImageReader

ROOT = Path(__file__).resolve().parent
out = ROOT / "pulsefit-conceptual-and-academic-review.pdf"
size = landscape(A2)
pdf = canvas.Canvas(str(out), pagesize=size, pageCompression=1)
pdf.setTitle("PulseFit - Conceptual ER and Academic Relational Schema - Approved Academic Design")
pdf.setAuthor("PulseFit documentation - approved academic design")
for name in (
    "pulsefit-er-conceptual-identity",
    "pulsefit-er-conceptual-booking",
    "pulsefit-relational-academic",
):
    image = ImageReader(str(ROOT / (name + ".png")))
    width, height = image.getSize()
    scale = min((size[0] - 36) / width, (size[1] - 36) / height)
    w, h = width * scale, height * scale
    pdf.drawImage(image, (size[0] - w) / 2, (size[1] - h) / 2, w, h)
    pdf.showPage()
pdf.save()
print(out)
