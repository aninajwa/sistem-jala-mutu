import {documentQuestions,type SourceDocument,type SourceQuestion} from './sourceDocumentModel';

/** Exact overall conclusion controls, audited against staged source catalog. */
const keys:Record<string,string>={IRI:'t14:r2:c2',Jembatan:'t16:r10:c2',Drainase:'t13:r9:c2',Lereng:'t24:selection','Lalu Lintas':'t20:r7:c4','PCI AI':'paragraph:p62',RNI:'paragraph:p36'};
/** These two original controls need a dedicated visible panel; PCI AI is in the
 * embedded BA after the attachment marker, RNI is in a nested recommendation group.
 * Use the same answer IDs as the source validation and BA projection. */
export function stagedDecisionPanelQuestion(document:SourceDocument,questions:SourceQuestion[]=documentQuestions(document)):SourceQuestion|undefined{
 if(document.phase!=='staged'||!['PCI AI','RNI'].includes(document.survey))return;
 return questions.find(q=>q.id===keys[document.survey]);
}
export type StagedConclusionStatus='Sesuai'|'Temuan'|'Diterima dengan catatan'|'Diterima bersyarat'|'Ditolak sebagian';
export function stagedConclusion(document:SourceDocument,answers:Record<string,string>):{raw:string;status:StagedConclusionStatus}|undefined{
 if(document.phase!=='staged')return;
 const id=keys[document.survey],q=documentQuestions(document).find(q=>q.id===id);
 const raw=answers[id];if(!q||!raw||!q.options.includes(raw))return;
 const text=raw.trim().toLowerCase();
 let status:StagedConclusionStatus|undefined;
 if(text==='ditolak sebagian')status='Ditolak sebagian';
 else if(text==='diterima bersyarat')status='Diterima bersyarat';
 else if(['diterima dengan catatan','diterima dengan catatan minor','disetujui dengan catatan (perbaikan minor)'].includes(text))status='Diterima dengan catatan';
 else if(['ditolak','ditolak seluruhnya','ditolak (memerlukan perbaikan mayor)','tidak diterima','perlu perbaikan','perlu perbaikan sebelum diterima','perbaiki','ulang'].includes(text))status='Temuan';
 else if(['diterima','diterima tanpa catatan','disetujui tanpa catatan','lanjut'].includes(text))status='Sesuai';
 if(document.survey==='Lalu Lintas'&&status==='Sesuai'){
  const aspects=[2,3,4,5,6].map(row=>answers[`t20:r${row}:c4`]);
  if(aspects.some(a=>a==='Perbaiki'||a==='Ulang'))status='Temuan';
  else if(aspects.some(a=>a!=='Lanjut'))return;
 }
 return status?{raw,status}:undefined;
}
