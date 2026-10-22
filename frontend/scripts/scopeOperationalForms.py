"""Scope compound original forms; preserve source table/paragraph identities."""
from pathlib import Path
import json,copy
p=Path('src/workflow/sourceChecklistCatalog.json');catalog=[d for d in json.loads(p.read_text()) if not d.get('derivedFrom')]
def segment(base,blocks,phase,suffix,level=None):
 d=copy.deepcopy(base);d['id']=base['id']+'-'+suffix;d['derivedFrom']=base['id'];d['phase']=phase;blocks=copy.deepcopy(blocks)
 for block in blocks:
  if block['kind']=='heading' and block.get('text')==block.get('chapter'):break
  block['chapter']='';block['heading']=''
 d['blocks']=blocks;ids={b['table'] for b in blocks if b['kind']=='table'};d['tables']=[t for t in base['tables'] if t['table'] in ids]
 if level:d['auditLevel']=level
 return d
iri=next(d for d in catalog if d['survey']=='IRI' and d['phase']=='calibration');catalog.append(segment(iri,[b for b in iri['blocks'] if b.get('chapter','').startswith('B. CHECKLIST KONSISTENSI')],'consistency','consistency'))
iri['blocks']=[b for b in iri['blocks'] if not b.get('chapter','').startswith('B. CHECKLIST KONSISTENSI')];ids={b['table'] for b in iri['blocks'] if b['kind']=='table'};iri['tables']=[t for t in iri['tables'] if t['table'] in ids]
lend=next(d for d in catalog if d['survey']=='Lendutan' and d['phase']=='calibration');full=copy.deepcopy(lend)
def part(lo,hi):
 result=[];paragraph=0
 for block in full['blocks']:
  if block.get('id'):paragraph=int(block['id'][1:])
  if lo<=paragraph<hi:result.append(block)
 return result
for lo,hi,phase,suffix,level in [(29,50,'consistency','ongoing',None),(50,76,'audit','audit-internal',1),(76,101,'audit','audit-balai',2),(101,125,'audit','audit-directorate',3),(125,10000,'acceptance','acceptance',None)]:catalog.append(segment(full,part(lo,hi),phase,suffix,level))
lend['blocks']=part(1,29);ids={b['table'] for b in lend['blocks'] if b['kind']=='table'};lend['tables']=[t for t in lend['tables'] if t['table'] in ids]
p.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n');print('Scoped forms',len(catalog))
