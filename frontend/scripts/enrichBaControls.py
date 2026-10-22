"""Map blank cells and original checkbox/decision groups; do not edit source DOCX."""
from pathlib import Path
from lxml import etree
import zipfile,json,re
W='{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
def tx(e):return ''.join(e.itertext(W+'t')).strip()
p=Path('src/workflow/ba/templateCatalog.json');catalog=json.loads(p.read_text())
for template in catalog:
 root=etree.fromstring(zipfile.ZipFile(Path('public/ba-templates')/template['filename']).read('word/document.xml'));body=root.find(W+'body');paras=list(root.iter(W+'p'));indices={el:i for i,el in enumerate(paras)}
 template['fields']=[f for f in template['fields'] if not f.get('target')];extra=[];heading='';tableIndex=0
 def survey_for(child):
  i=list(body).index(child)
  if template['id']=='audit':return {'2':'IRI','3':'PCI','4':'Jembatan','5':'Lendutan','6':'Lereng','7':'Drainase','8':'Lalu Lintas','9':'RNI'}.get(heading.split('.')[0])
  return next((survey for survey,r in template['bodyRanges'].items() if r[0]<=i<r[1]),None) if template['id']=='penerimaan' else None
 for child in body:
  value=tx(child)
  if child.tag==W+'p' and re.match(r'^\d+(?:\.\d+)*\.?\s+[A-Z]',value):heading=value
  if child.tag!=W+'tbl':continue
  tableIndex+=1;rows=child.findall(W+'tr');headers=[tx(cell) for cell in rows[0].findall(W+'tc')] if rows else []
  choices=[(j,label) for j,label in enumerate(headers) if label.lower() in ['ya','tidak','n/a','sesuai','tidak sesuai']]
  for ri,row in enumerate(rows[1:],1):
   cells=row.findall(W+'tc');labels=[tx(cell) for cell in cells]
   if len(choices)>1:
    label=next((cell for j,cell in enumerate(labels) if j not in [0]+[c[0] for c in choices] and cell),'Pemeriksaan')
    extra.append({'id':f'word/document.xml:choice:t{tableIndex}:r{ri}','part':'word/document.xml','paragraph':0,'match':0,'placeholder':'','label':label,'context':label,'section':heading,'tableRow':ri,'survey':survey_for(child),'required':True,'choices':[c[1] for c in choices],'target':{'kind':'checkbox-row','table':tableIndex-1,'row':ri,'columns':[c[0] for c in choices]}})
   for ci,cell in enumerate(cells):
    if tx(cell) or not cell.findall('.//'+W+'p') or ci==0 or ci in [c[0] for c in choices]:continue
    label=headers[ci] if ci<len(headers) else ''
    if re.search('tanda tangan',label,re.I):continue
    extra.append({'id':f'word/document.xml:empty:t{tableIndex}:r{ri}:c{ci}','part':'word/document.xml','paragraph':0,'match':0,'placeholder':'','label':label or 'Keterangan','context':labels[0] if labels else '', 'section':heading or 'Rincian data','tableRow':ri,'tableColumn':ci,'survey':survey_for(child),'required':False,'target':{'kind':'cell','table':tableIndex-1,'row':ri,'column':ci}})
 if template['id']=='penerimaan':
  for survey,bounds in template['bodyRanges'].items():
   candidates=[el for el in list(body)[bounds[0]:bounds[1]] if el.tag==W+'p']
   for label,predicate in [('Keputusan penerimaan',lambda s:s in ['DITERIMA','DITERIMA DENGAN CATATAN','DITOLAK']),('Periode penerimaan',lambda s:s.startswith('Penerimaan Data Semester'))]:
    selected=[el for el in candidates if predicate(tx(el))]
    if len(selected)>1:extra.append({'id':f'word/document.xml:group:{survey}:{label}','part':'word/document.xml','paragraph':0,'match':0,'placeholder':'','label':label,'context':label,'section':'Keputusan dan periode penerimaan','survey':survey,'required':True,'choices':[tx(el) for el in selected],'target':{'kind':'paragraph-group','paragraphs':[indices[el] for el in selected]}})
 if template['id']=='audit':
  for field in template['fields']:
   section=field.get('section','');number=re.match(r'^(\d+)\.',section)
   if number:field['survey']={'2':'IRI','3':'PCI','4':'Jembatan','5':'Lendutan','6':'Lereng','7':'Drainase','8':'Lalu Lintas','9':'RNI'}.get(number[1])
 template['fields']+=extra
 appendix=False;requirements=[]
 for child in body:
  if child.tag!=W+'p':continue
  value=tx(child)
  if value.upper()=='LAMPIRAN':appendix=True;continue
  if appendix and value:requirements.append(re.sub(r'\s*:\s*\[[^\]]*\]','',value).strip())
 template['attachmentRequirements']=list(dict.fromkeys(requirements))
p.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n');print('Mapped supplemental BA controls:',sum(bool(f.get('target')) for t in catalog for f in t['fields']))
