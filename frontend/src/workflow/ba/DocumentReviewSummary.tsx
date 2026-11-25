import type {TemplateField} from './docxEngine';
import {baFieldComplete,baFieldRequiredForDraft} from './fieldValidation';
import {fieldLabel} from './fieldPresentation';
/** Reading/review uses semantic values, never a disabled author form. */
export function DocumentReviewSummary({fields,values,automatic}:{fields:TemplateField[];values:Record<string,string>;automatic:Record<string,string>}){
 const groups=new Map<string,TemplateField[]>();
 for(const field of fields){const section=field.section||'Identitas dokumen';groups.set(section,[...(groups.get(section)??[]),field]);}
 const renderGroup=([section,items]:[string,TemplateField[]],index:number)=><details className="document-review-section" key={section} open={index===0}><summary>{section} · {items.filter(f=>baFieldRequiredForDraft(f,fields)&&!baFieldComplete(f,values[f.id])).length} wajib belum lengkap</summary><div className="document-summary-grid">{items.map(field=><dl key={field.id}><dt>{fieldLabel(field)}{field.tableRow?` · baris ${field.tableRow}`:''}</dt><dd>{baFieldComplete(field,values[field.id])?values[field.id]:'Belum diisi'}<small>{automatic[field.id]?'Sumber: data tahap paket':'Isian penyiap dokumen'}</small></dd></dl>)}</div></details>;
 return <div data-testid="document-review-summary">{[...groups].slice(0,1).map(renderGroup)}<details className="document-review-section"><summary>Rincian hasil dan isian dokumen ({Math.max(0,groups.size-1)} bagian)</summary>{[...groups].slice(1).map((group,index)=>renderGroup(group,index+1))}</details></div>;

}
