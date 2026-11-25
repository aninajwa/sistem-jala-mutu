import type {OperationalWorkflowState} from './model';
import {balaiReviewQueue} from './balaiReviewQueue';

export type AuditBucket = 'siap' | 'berjalan' | 'tertahan' | 'riwayat';
export type DirectorateAuditRow = {
 state: OperationalWorkflowState;
 status: AuditBucket;
 ready: boolean;
 reason: string;
};

/** Pure read-only projections. Never modify workflow state or synthesize decisions. */
export function directorateAuditRows(packages:Record<string,OperationalWorkflowState>):DirectorateAuditRow[]{
 return Object.values(packages).map(state=>{
  const internal=state.audits[0], balai=state.audits[1], central=state.audits[2];
  const ready=internal.status==='Lulus'&&!internal.requiresReview&&balai.status==='Lulus'&&!balai.requiresReview&&state.submission.validationStatus==='VALID';
  const complete=central.status==='Lulus'&&!central.requiresReview;
  const rejected=central.status==='Ditolak'||Boolean(central.requiresReview)||central.status==='Klarifikasi';
  const ongoing=central.status==='Dalam Review';
  const status:AuditBucket=complete?'riwayat':rejected?'tertahan':ongoing?'berjalan':ready?'siap':'tertahan';
  const blockers:string[]=[];
  if(internal.status!=='Lulus'||internal.requiresReview)blockers.push('Audit tingkat 1 belum sesuai');
  if(balai.status!=='Lulus'||balai.requiresReview)blockers.push('Audit tingkat 2 Balai belum sesuai');
  if(state.submission.validationStatus!=='VALID')blockers.push('Penyerahan belum VALID');
  const reason=central.reviewReason||central.decisionNote||(
   rejected?'Ada temuan atau klarifikasi audit tingkat 3 yang perlu ditindaklanjuti.':
   blockers.length?blockers.join(' · '):ongoing?'Pemeriksaan tingkat 3 sedang berlangsung.':complete?'Hasil audit tingkat 3 tercatat.':'Prasyarat audit tingkat 3 terpenuhi.'
  );
  return {state,status,ready,reason};
 });
}

export const DIRECTORATE_TABS:{label:string;bucket:AuditBucket}[]=[
 {label:'Perlu Diaudit',bucket:'siap'},
 {label:'Sedang Diaudit',bucket:'berjalan'},
 {label:'Tertahan & Tindak Lanjut',bucket:'tertahan'},
 {label:'Hasil & Riwayat',bucket:'riwayat'},
];

/** Operational review excludes audit (stage 5) and acceptance (stage 6). */
export function adminReviewRows(packages:Record<string,OperationalWorkflowState>){
 return balaiReviewQueue(packages).filter(r=>['Tahap 0','Tahap 2','Tahap 3B','Tahap 4'].includes(r.stage));
}

export function adminAuditRows(packages:Record<string,OperationalWorkflowState>){
 return Object.values(packages).flatMap(state=>state.audits.map((audit,index)=>({state,level:index+1,audit})));
}

/** Recorded states only. An audit snapshot is not automatically a signed decision or a BA. */
export type DirectorateHistoryEntry = {
 source: 'current' | 'snapshot';
 status: OperationalWorkflowState['audits'][2]['status'];
 note: string;
 reason: string;
 requiresReview: boolean;
 baNumber: string;
};
export function directorateAuditHistory(state:OperationalWorkflowState):DirectorateHistoryEntry[]{
 const current=state.audits[2];
 const convert=(record:typeof current,source:'current'|'snapshot'):DirectorateHistoryEntry=>({
  source,status:record.status,note:record.decisionNote||'',reason:record.reviewReason||'',
  requiresReview:!!record.requiresReview,baNumber:record.baNumber||''
 });
 return [
  ...(current.status!=='Belum Dimulai'||current.requiresReview?[convert(current,'current')]:[]),
  ...(current.history??[]).filter(h=>h.status!=='Belum Dimulai'||h.requiresReview).map(h=>convert(h,'snapshot'))
 ];
}
