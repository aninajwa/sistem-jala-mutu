import {readLocal} from './localPersistence';
import {STAGE3B_DOCX_CANDIDATES} from '../stage3bChecklistData.docx-candidate';
import {attachmentRepository} from './attachmentRepository';
/** Read only: no automatic conversion of technical answers between different source forms. */
export function legacyPeriodAnswers(scope:string){
 const values=readLocal<Record<string,string>>(`jala-mutu-stage3b-docx-${scope}-v1`,{});
 return Object.entries(values).map(([key,stored])=>{const value=typeof stored==='string'?stored:typeof stored==='number'||typeof stored==='boolean'?String(stored):'Catatan tabel terdahulu tersimpan';for(const template of STAGE3B_DOCX_CANDIDATES)for(const item of template.items){if(key.startsWith(`${scope}::${template.id}::${item.code}`))return {key,label:`${template.survey} · ${item.label}`,value};}return {key,label:'Catatan pemeriksaan terdahulu',value};});
}
export function legacyPeriodFileKeys(scope:string,survey:string,phase:string){
 const ids=STAGE3B_DOCX_CANDIDATES.filter(template=>template.survey===survey&&template.phase===phase).map(template=>`${scope}:${template.id}:`);
 return Object.keys(attachmentRepository.metadata()).filter(key=>ids.some(prefix=>key.startsWith(prefix)));
}
