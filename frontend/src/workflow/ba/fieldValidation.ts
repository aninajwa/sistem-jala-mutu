import {BA_TEMPLATES,fieldsFor,type BaKind,type TemplateField} from './docxEngine';
import type {SurveyType} from '../model';
export function baValuePresent(value:string|undefined){const text=value?.trim()??'';return !!text&&!/^(?:\[?BELUM DIISI\]?|[._]{3,})$/i.test(text);}
const conditional=/\b(bila|jika|apabila)\b.*\b(ada|dilakukan|diperlukan|digunakan|berlaku)|\bopsional\b/i;
const noteLike=/\b(catatan|keterangan|uraikan|rekomendasi|temuan|tindak lanjut|mitigasi|risiko|foto|dokumentasi|lampiran|bukti)\b/i;
const officialOnly=/\b(tanda tangan|bertanda tangan|ditandatangani|paraf|nip\.?|kepala satuan kerja|dibuat di)\b/i;
/** Template fields needed for a frontend draft/review. Official number/signature/TTE data is deliberately deferred. */
export function baFieldRequiredForDraft(field:TemplateField,all:TemplateField[]){
 if(field.required===false)return false;
 if(officialOnly.test(`${field.section??''} ${field.label} ${field.context}`))return false;
 if(conditional.test(`${field.section??''} ${field.label} ${field.context}`))return false;
 if(field.required===true)return true;
 if(noteLike.test(field.label))return false;
 if(/^(diisi nomor dokumen|nomor ba|nomor:)$/i.test(field.label.trim()))return false;
 const duplicates=all.filter(item=>(item.section??'')===(field.section??'')&&item.label===field.label);
 if(duplicates.length>1&&duplicates[0].id!==field.id)return false;
 return true;
}
/** Required/applicability is evaluated from the original template fields; local draft rules never invent official identity. */
export function baFieldErrors(kind:BaKind,survey:SurveyType,fields:Record<string,string>){
 const template=BA_TEMPLATES.find(item=>item.id===kind);if(!template)return ['Format BA tidak tersedia.'];
 const applicable=fieldsFor(template,survey);
 return applicable.flatMap(field=>{
  const value=fields[field.id]?.trim()??'',required=baFieldRequiredForDraft(field,applicable);
  if(required&&(!baValuePresent(value)||value===field.placeholder))return [`Isian ${field.label} belum dilengkapi.`];
  if(value&&field.choices&&!field.choices.includes(value))return [`Pilihan ${field.label} tidak sesuai formulir.`];
  return [];
 });
}
