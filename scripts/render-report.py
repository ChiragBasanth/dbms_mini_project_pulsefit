"""Printable PDF from the complete Markdown report, with genuine images and vector diagrams."""
from pathlib import Path
import re,html,textwrap
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,Preformatted,LongTable,TableStyle,Image,KeepTogether
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.graphics.shapes import Drawing,Rect,Line,String,Polygon
from reportlab.lib.utils import ImageReader

ROOT=Path(__file__).resolve().parent.parent
for name,file in [('Body','arial.ttf'),('Bold','arialbd.ttf'),('Italic','ariali.ttf'),('Code','consola.ttf')]:
 p=Path('C:/Windows/Fonts')/file
 if not p.exists():raise RuntimeError('Install compatible fonts or adjust converter: '+str(p))
 pdfmetrics.registerFont(TTFont(name,str(p)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Italic',boldItalic='Bold')
INK=colors.HexColor('#183d35');MUTED=colors.HexColor('#627268');LIME=colors.HexColor('#e8efd9');LINE=colors.HexColor('#d4ddce')
WIDTH=511.28
styles=getSampleStyleSheet()
styles.add(ParagraphStyle('Text',fontName='Body',fontSize=9.3,leading=14,spaceAfter=8,textColor=INK))
styles.add(ParagraphStyle('Major',fontName='Bold',fontSize=20,leading=26,spaceAfter=17,textColor=INK,keepWithNext=True))
styles.add(ParagraphStyle('Sub',fontName='Bold',fontSize=12,leading=17,spaceBefore=13,spaceAfter=8,textColor=INK,keepWithNext=True))
styles.add(ParagraphStyle('CodeBlock',fontName='Code',fontSize=6.9,leading=9,spaceAfter=12,backColor=colors.HexColor('#f1f4ee'),borderPadding=8))
styles.add(ParagraphStyle('Cell',fontName='Body',fontSize=7.7,leading=11,textColor=INK,splitLongWords=True))
styles.add(ParagraphStyle('HeadCell',parent=styles['Cell'],fontName='Bold',textColor=colors.white))
styles.add(ParagraphStyle('Caption',fontName='Italic',fontSize=8.5,leading=12,textColor=MUTED,spaceAfter=14))
def inline(s):
 s=html.escape(s)
 s=re.sub(r'`([^`]+)`',r'<font name="Code">\1</font>',s)
 s=re.sub(r'\*\*([^*]+)\*\*',r'<b>\1</b>',s)
 s=re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)',r'<i>\1</i>',s)
 s=re.sub(r'\[([^]]+)\]\(([^)]+)\)',lambda m:f'<link href="{m[2]}">{m[1]}</link>',s)
 return s
def box(d,x,y,w,h,title,lines):
 d.add(Rect(x,y,w,h,rx=6,ry=6,fillColor=colors.HexColor('#f5f8ef'),strokeColor=LINE))
 d.add(Rect(x,y+h-25,w,25,rx=5,ry=5,fillColor=INK,strokeColor=INK))
 d.add(String(x+10,y+h-17,title,fontName='Bold',fontSize=9,fillColor=colors.white))
 for i,line in enumerate(lines):d.add(String(x+10,y+h-40-i*13,line,fontName='Code',fontSize=7.3,fillColor=INK))
def arrow(d,x1,y1,x2,y2,label=''):
 d.add(Line(x1,y1,x2,y2,strokeColor=MUTED,strokeWidth=1))
 import math
 a=math.atan2(y2-y1,x2-x1);size=5
 d.add(Polygon([x2,y2,x2-size*math.cos(a-.5),y2-size*math.sin(a-.5),x2-size*math.cos(a+.5),y2-size*math.sin(a+.5)],fillColor=MUTED,strokeColor=MUTED))
 if label:d.add(String((x1+x2)/2+3,(y1+y2)/2+5,label,fontName='Body',fontSize=7,fillColor=MUTED))
def architecture():
 d=Drawing(WIDTH,270)
 box(d,0,180,135,75,'Member / Trainer',['Browser forms','HttpOnly session'])
 box(d,190,180,140,75,'Next.js API',['Auth + ownership','Validated inputs'])
 box(d,375,180,135,75,'PostgreSQL',['Users, slots, bookings','Audit + constraints'])
 box(d,190,40,140,80,'MiniLM encoder',['Mean pool + normalize','384 dimensions'])
 box(d,375,40,135,80,'pgvector',['Cosine-ranked results','Same PostgreSQL DB'])
 box(d,0,40,135,80,'MongoDB',['Workout documents','Scoped aggregation'])
 arrow(d,135,215,190,215,'request');arrow(d,330,215,375,215,'SQL')
 arrow(d,230,180,90,120,'workouts');arrow(d,260,180,260,120,'goals')
 arrow(d,330,80,375,80,'vector');arrow(d,442,120,442,180,'stored')
 return d
def er():
 d=Drawing(WIDTH,440)
 box(d,177,330,160,95,'USERS',['PK id; UNIQUE email','password_hash; role','UNIQUE(id,role)'])
 box(d,0,180,157,105,'MEMBER_PROFILES',['PK user_id','FK(user_id,role)','fitness_goals; role=MEMBER'])
 box(d,355,180,156,105,'TRAINER_PROFILES',['PK user_id','FK(user_id,role)','bio; specialties','embedding vector(384)'])
 box(d,177,100,160,110,'BOOKINGS',['PK id; FK member_id','FK(slot_id,trainer_id)','status; unique active slot'])
 box(d,355,15,156,120,'AVAILABILITY',['PK id; FK trainer_id','starts_at; ends_at','EXCLUDE overlap','OPEN / CLOSED'])
 box(d,0,15,157,100,'BOOKING_AUDIT',['PK id; FK booking_id','old_status; new_status','changed_at'])
 arrow(d,220,330,95,285,'1 : 0..1');arrow(d,295,330,430,285,'1 : 0..1')
 arrow(d,110,180,177,160,'1 : many');arrow(d,433,180,433,135,'1 : many')
 arrow(d,355,80,337,125);arrow(d,177,120,157,80,'1 : many')
 box(d,177,0,160,85,'EXERCISES',['PK id; UNIQUE name','category; description','embedding vector(384)'])
 return d
story=[];lines=(ROOT/'docs/DBMS_PROJECT_REPORT.md').read_text(encoding='utf-8').splitlines();i=0;major=0
while i<len(lines):
 line=lines[i]
 if not line.strip():i+=1;continue
 if line.startswith('```'):
  lang=line[3:].strip();block=[];i+=1
  while i<len(lines) and not lines[i].startswith('```'):block.append(lines[i]);i+=1
  i+=1
  if lang=='mermaid':
   is_er=any('erDiagram' in x for x in block);story+=[er() if is_er else architecture(),Spacer(1,10)]
  else:
   wrapped=[]
   for x in block:wrapped+=textwrap.wrap(x,width=112,expand_tabs=True,replace_whitespace=False,drop_whitespace=False,break_long_words=True,break_on_hyphens=False) or ['']
   story.append(Preformatted('\n'.join(wrapped),styles['CodeBlock']))
  continue
 if line.startswith('|'):
  rows=[]
  while i<len(lines) and lines[i].startswith('|'):
   cells=[x.strip() for x in lines[i].strip().strip('|').split('|')]
   if not all(re.fullmatch(r'[:\s-]+',x or '-') for x in cells):rows.append(cells)
   i+=1
  n=len(rows[0]);ratios={3:[.17,.40,.43],4:[.13,.31,.13,.43],5:[.11,.26,.20,.13,.30],6:[.07,.15,.20,.28,.10,.20],7:[.12,.09,.18,.17,.14,.12,.18]}.get(n,[1/n]*n)
  content=[[Paragraph(inline(c).replace('Weight/Marks','Weight /<br/>Marks'),styles['HeadCell' if r==0 else 'Cell']) for c in row]for r,row in enumerate(rows)]
  table=LongTable(content,colWidths=[WIDTH*x for x in ratios],repeatRows=1,hAlign='LEFT')
  table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),INK),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f4f7ef')]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LINEBELOW',(0,0),(-1,-1),.35,LINE)]))
  story += [table,Spacer(1,12)];continue
 if line.startswith('# '):
  if major:story.append(PageBreak())
  major+=1;story.append(Paragraph(inline(line[2:]),styles['Major']));i+=1;continue
 if line.startswith('##'):
  story.append(Paragraph(inline(line.lstrip('#').strip()),styles['Sub']));i+=1;continue
 image=re.match(r'!\[(.*?)\]\((.*?)\)',line)
 if image:
  p=ROOT/'docs'/image[2]
  if p.exists():
   w,h=ImageReader(str(p)).getSize();scale=min(WIDTH/w,440/h)
   story.append(Image(str(p),width=w*scale,height=h*scale,hAlign='LEFT'))
  i+=1;continue
 para=[line];i+=1
 while i<len(lines) and lines[i].strip() and not lines[i].startswith(('#','|','```','![')):
  para.append(lines[i]);i+=1
 text=' '.join(para)
 if text.startswith('- '):text='• '+text[2:]
 style=styles['Caption'] if text.startswith('**Figure') else styles['Text']
 story.append(Paragraph(inline(text),style))

def page(canvas,doc):
 canvas.saveState();w,h=doc.pagesize
 canvas.setFillColor(INK);canvas.setFont('Bold',8);canvas.drawString(42,h-28,'PULSEFIT  /  DBMS LEVEL 3')
 canvas.setStrokeColor(LINE);canvas.line(42,h-35,w-42,h-35)
 canvas.setFont('Body',7.5);canvas.setFillColor(MUTED);canvas.drawString(42,23,'Evidence-based project report | 1 November 2026');canvas.drawRightString(w-42,23,str(doc.page));canvas.restoreState()
out=ROOT/'docs/DBMS_PROJECT_REPORT.pdf'
doc=SimpleDocTemplate(str(out),pagesize=(595.28,841.89),leftMargin=42,rightMargin=42,topMargin=53,bottomMargin=43,title='PulseFit - Hybrid Smart Gym & Trainer Booking System',author='Chirag Basanth Bellavi (PES1UG24CS133); Chhavi Siddarth Wadhwa (PES1UG24CS132)',allowSplitting=True)
doc.build(story,onFirstPage=page,onLaterPages=page)
print('Created',out)
