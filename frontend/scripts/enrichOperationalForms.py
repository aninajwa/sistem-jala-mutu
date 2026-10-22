"""Extract ordered operational forms; include checkbox text nested in Word content controls.
Run from frontend. Existing table/question IDs are retained.
"""
from pathlib import Path
import json,re
from docx import Document
W='{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
def text(el):
 return '\n'.join(''.join(p.itertext(W+'t')) for p in el.iter(W+'p')).strip() if el.tag!=W+'p' else ''.join(el.itertext(W+'t')).strip()
def is_heading(s):return bool(re.match(r'^(?:[IVX]+\.\s|BAGIAN\s+\d+)',s)) or bool(re.match(r'^(?:[A-Z]\.\s|\d+(?:\.\d+)*\.?\s+\S|[A-Z]\.\d+\.?\s)',s)) or s.upper() in ['LAMPIRAN','PERSETUJUAN']
path=Path('src/workflow/sourceChecklistCatalog.json');catalog=[d for d in json.loads(path.read_text()) if not d.get('derivedFrom')]
for doc in catalog:
 source=Document(Path('public')/doc['asset']);tables=iter(source.tables);number=0;blocks=[];chapter='';heading='';pi=0
 hasRoman=any(re.match(r'^[IVX]{2,}\.\s',text(el)) for el in source.element.body if el.tag==W+'p')
 selected=doc['id'].startswith('ba-audit-');newtables=[]
 for el in source.element.body:
  if el.tag==W+'p':
   value=text(el);pi+=1
   if not value:continue
   if re.match(r'^BAGIAN\s+\d+',value) or re.match(r'^[IVX]+\.\s',value) and hasRoman or re.match(r'^[A-Z]\.\s+',value) and not hasRoman:chapter=value
   if is_heading(value):heading=value
   if not selected:blocks.append({'kind':'heading' if is_heading(value) else 'paragraph','id':f'p{pi}','text':value,'chapter':chapter,'heading':heading})
  elif el.tag==W+'tbl':
   table=next(tables);number+=1
   if selected:continue
   rows=[[text(cell._tc) for cell in row.cells] for row in table.rows]
   newtables.append({'table':number,'heading':heading,'chapter':chapter,'rows':rows});blocks.append({'kind':'table','table':number,'chapter':chapter,'heading':heading})
 if not selected:doc['tables']=newtables;doc['blocks']=blocks
 else:
  for t in doc['tables']:t['chapter']=''
  doc['blocks']=[{'kind':'table','table':t['table'],'chapter':'','heading':t.get('heading','')} for t in doc['tables']]
path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n');print('Enriched',len(catalog),'documents')
