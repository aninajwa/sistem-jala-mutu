import {displayText} from '../displayText';
import {unzipSync,zipSync,strFromU8,strToU8} from 'fflate';
import type {SurveyType} from '../model';
import {fieldsFor,type BaTemplate} from './baTemplateModel';
export * from './baTemplateModel';
const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const paragraphs=(doc:Document)=>Array.from(doc.getElementsByTagNameNS(W,'p'));
/** Replace text ranges across split Word runs while retaining paragraph/table/section formatting. */
export function fillDocx(bytes:Uint8Array,template:BaTemplate,values:Record<string,string>,survey:SurveyType):Uint8Array{
 const parts=unzipSync(bytes);
 for(const name of Object.keys(parts)){
  if(!/^word\/(document|header\d+|footer\d+)\.xml$/.test(name))continue;
  const doc=new DOMParser().parseFromString(strFromU8(parts[name]),'application/xml');
  if(doc.getElementsByTagName('parsererror').length)throw new Error(`Template XML tidak valid: ${name}`);
  paragraphs(doc).forEach((p,index)=>{
   const nodes=Array.from(p.getElementsByTagNameNS(W,'t'));const full=nodes.map(n=>n.textContent??'').join('');
   const matches=Array.from(full.matchAll(/\[[^\]]+\]|\.{3,}|_{3,}/g));
   const ranges=nodes.map((node,i)=>({node,start:nodes.slice(0,i).reduce((n,x)=>n+(x.textContent?.length??0),0),length:node.textContent?.length??0}));
   for(let i=matches.length-1;i>=0;i--){const match=matches[i];if(match[0].startsWith('_'))continue;
    const fieldId=`${name}:p${index}:m${i}`;const field=template.fields.find(f=>f.id===fieldId);
    const applicable=!field||fieldsFor(template,survey).some(item=>item.id===field.id);
    const replacement=applicable?displayText(values[fieldId]?.trim()||'[BELUM DIISI]'):'[TIDAK BERLAKU UNTUK '+survey+']';
    const start=match.index!,end=start+match[0].length;
    for(const {node,start:nodeStart,length} of ranges){const nodeEnd=nodeStart+length;if(nodeEnd<=start||nodeStart>=end)continue;const text=node.textContent??'';const a=Math.max(0,start-nodeStart),b=Math.min(length,end-nodeStart);node.textContent=text.slice(0,a)+(nodeStart<=start?replacement:'')+text.slice(b);node.setAttribute('xml:space','preserve');}
   }
  });
  if(name==='word/document.xml'){
   const originalParagraphs=paragraphs(doc),tables=Array.from(doc.getElementsByTagNameNS(W,'tbl'));
   const setCell=(cell:Element,text:string)=>{const texts=Array.from(cell.getElementsByTagNameNS(W,'t'));if(texts.length){texts[0].textContent=text;for(const node of texts.slice(1))node.textContent='';}else{const p=cell.getElementsByTagNameNS(W,'p')[0]??cell.appendChild(doc.createElementNS(W,'w:p'));const run=doc.createElementNS(W,'w:r'),node=doc.createElementNS(W,'w:t');node.textContent=text;run.appendChild(node);p.appendChild(run);}};
   for(const field of fieldsFor(template,survey)){
    const target=field.target;if(!target)continue;const value=displayText(values[field.id]?.trim()??'');
    if(field.choices&&value&&!field.choices.includes(value))throw new Error('Pilihan BA tidak sesuai formulir.');
    if(target.kind==='paragraph-group'){for(const [index,paragraphIndex] of (target.paragraphs??[]).entries()){const p=originalParagraphs[paragraphIndex];if(!p)continue;const first=p.getElementsByTagNameNS(W,'t')[0];if(first)first.textContent=(value===field.choices?.[index]?'☒ ':'☐ ')+(first.textContent??'');}continue;}
    const table=tables[target.table??-1],row=table?Array.from(table.children).filter(el=>el.localName==='tr')[target.row??-1]:undefined,cells=row?Array.from(row.children).filter(el=>el.localName==='tc'):[];
    if(target.kind==='cell'&&value&&cells[target.column??-1])setCell(cells[target.column!],value);
    if(target.kind==='checkbox-row')for(const [index,column] of (target.columns??[]).entries())if(cells[column])setCell(cells[column],value===field.choices?.[index]?'☒':'☐');
   }
   // Preserve tables and wording, prevent a single row splitting through its labels/signatures.
   for(const table of tables)for(const [index,row] of Array.from(table.children).filter(el=>el.localName==='tr').entries()){let properties=Array.from(row.children).find(el=>el.localName==='trPr');if(!properties){properties=doc.createElementNS(W,'w:trPr');row.insertBefore(properties,row.firstChild);}if(!properties.getElementsByTagNameNS(W,'cantSplit').length)properties.appendChild(doc.createElementNS(W,'w:cantSplit'));if(index===0&&!properties.getElementsByTagNameNS(W,'tblHeader').length)properties.appendChild(doc.createElementNS(W,'w:tblHeader'));}
   const body=doc.getElementsByTagNameNS(W,'body')[0];
   const range=template.bodyRanges[survey];
   if(template.id==='penerimaan'){
    if(!range)throw new Error('Bagian penerimaan untuk jenis survei ini tidak ditemukan dalam template sumber.');
    Array.from(body.children).forEach((child,i)=>{if(child.localName!=='sectPr'&&(i<range[0]||i>=range[1]))body.removeChild(child);});
   }
   if(template.id==='penerimaan'){
    let signing=false;const signatureParagraphs:Element[]=[];
    for(const paragraph of paragraphs(doc)){const text=paragraph.textContent??'';if(/^Dibuat di\s*:/i.test(text.trim()))signing=true;if(signing)signatureParagraphs.push(paragraph);}
    for(const paragraph of signatureParagraphs.slice(0,-1)){let properties=Array.from(paragraph.children).find(element=>element.localName==='pPr');if(!properties){properties=doc.createElementNS(W,'w:pPr');paragraph.insertBefore(properties,paragraph.firstChild);}if(!properties.getElementsByTagNameNS(W,'keepNext').length)properties.appendChild(doc.createElementNS(W,'w:keepNext'));}
   }
   // The original states 2025; a new local draft must reflect its actual data year.
   for(const paragraph of paragraphs(doc)){
    const nodes=Array.from(paragraph.getElementsByTagNameNS(W,'t'));
    const full=nodes.map(n=>n.textContent??'').join('');const original='Dua Ribu Dua Puluh Lima (2025)';const start=full.indexOf(original);
    if(start<0)continue;let offset=0;const end=start+original.length;
    for(const node of nodes){const text=node.textContent??'';const nodeEnd=offset+text.length;if(nodeEnd>start&&offset<end){const a=Math.max(0,start-offset),b=Math.min(text.length,end-offset);node.textContent=text.slice(0,a)+(offset<=start?(values.__year||'[TAHUN BELUM DIISI]'):'')+text.slice(b);}offset=nodeEnd;}
   }
   const banner=doc.createElementNS(W,'w:p'),run=doc.createElementNS(W,'w:r'),text=doc.createElementNS(W,'w:t');text.textContent='DRAFT LOKAL — BELUM DITANDATANGANI / DISAHKAN';run.appendChild(text);banner.appendChild(run);body.insertBefore(banner,body.firstChild);
  }
  parts[name]=strToU8(new XMLSerializer().serializeToString(doc));
 }
 return zipSync(parts,{level:6});
}
export async function loadTemplate(template:BaTemplate){const response=await fetch(`${import.meta.env.BASE_URL}ba-templates/${template.filename}`);if(!response.ok)throw new Error('Template sumber tidak dapat dimuat.');const bytes=new Uint8Array(await response.arrayBuffer());const digest=await crypto.subtle.digest('SHA-256',bytes);const hash=Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');if(hash!==template.sha256)throw new Error('Hash template berbeda dari dokumen sumber yang diaudit.');return bytes;}
