import {documentSourceSnapshot} from './documentSourceSnapshot';
import type {OperationalWorkflowState, WorkflowRole} from '../model';
import {baOwner,baDecisionErrors} from './baRules';
import type {BaIdentity,BaVersion} from './documentRepository';
export type DocumentAction='submit'|'revise'|'reject'|'approve'|'reopen';
const PROVIDER:WorkflowRole='Penyedia Jasa / Ketua Tim',BALAI:WorkflowRole='PIC Balai / Pengguna Jasa';
export const DOCUMENT_STATUS_LABELS:Record<string,string>={
 'local-draft':'Draft','submitted-local':'Menunggu pemeriksaan','revision-requested-local':'Perlu revisi',
 'rejected-local':'Ditolak','reviewed-local':'Pemeriksaan selesai','decision-recorded-local':'Referensi keputusan lama',
};
/** Draft PP B.1/B.2, C.5/C.6/C.7/E. A local document review is never an official signature. */
export function documentActors(identity:BaIdentity){
 const owner=baOwner(identity.kind,identity.auditLevel as 1|2|3);
 const joint=identity.kind==='duaMingguan'||identity.kind==='bertahap';
 return {authors:joint?[PROVIDER,BALAI]:[owner],reviewer:joint?BALAI:owner};
}
export function documentFingerprint(state:OperationalWorkflowState,identity:BaIdentity){
 const cycle=identity.period===(state.activeCyclePeriod??1)?state.cycle:state.cycleHistory?.[String(identity.period)];
 const data={linkedChecklist:documentSourceSnapshot(state,identity),project:state.project,calibrations:state.calibrations.filter(x=>x.surveyType===identity.survey),
  production:state.productionTests[identity.survey as keyof typeof state.productionTests],productionApproval:state.productionApproval,
  cycle:identity.period?cycle:undefined,submission:['bertahap','audit','penerimaan'].includes(identity.kind)?state.submission:undefined,
  audit:identity.kind==='audit'?state.audits[identity.auditLevel-1]:identity.kind==='penerimaan'?state.audits:undefined,
  acceptance:identity.kind==='penerimaan'?state.acceptance:undefined};
 const text=JSON.stringify(data);let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);
 return (hash>>>0).toString(16);
}
export function documentActionErrors(state:OperationalWorkflowState,identity:BaIdentity,action:DocumentAction,latest:BaVersion|undefined,missing:number,note:string){
 const actors=documentActors(identity),author=actors.authors.includes(state.role),reviewer=actors.reviewer===state.role;
 if(state.role==='Admin'||!(action==='submit'||action==='reopen'?author:reviewer))return ['Tindakan dokumen ini di luar kewenangan peran Anda.'];
 if(action==='reopen')return latest?.status==='submitted-local'?['Dokumen sedang diperiksa; tunggu keputusan pemeriksa.']:[];
 if(action==='submit'){
  if(latest?.status==='submitted-local')return ['Revisi ini sudah diajukan.'];
  if(latest?.status==='reviewed-local')return ['Buka revisi baru sebelum mengajukan kembali.'];
  return missing?['Masih ada isian template yang belum dilengkapi. Periksa bagian dokumen.']:[];
 }
 if(latest?.status!=='submitted-local')return ['Hanya revisi yang telah diajukan yang dapat diperiksa.'];
 if((action==='revise'||action==='reject')&&!note.trim())return ['Catatan perbaikan atau alasan penolakan wajib diisi.'];
 if(action==='approve'){
  const errors=baDecisionErrors(state,identity.kind,identity.auditLevel as 1|2|3);
  if(latest.sourceFingerprint!==documentFingerprint(state,identity))errors.push('Data pemeriksaan berubah setelah pengajuan; minta revisi dan ajukan ulang.');
  if(missing)errors.push('Masih ada isian template yang belum dilengkapi.');
  return errors;
 }
 return [];
}
