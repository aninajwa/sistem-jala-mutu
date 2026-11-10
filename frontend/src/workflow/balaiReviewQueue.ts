import type {OperationalWorkflowState, ApprovalState} from './model';
import {evaluateStageGate} from './workflowGate';
import {productionReviewBlockers} from './reviewReadiness';
import {sourceInspectionStatus} from './repository/sourceChecklistRepository';
import {stagedSurveyReviewMode} from './stagedReviewPolicy';
import {PACKAGE_WORKFLOW_ITEMS} from './roleNavigation';

export const REVIEW_STATUSES = ['Perlu Review','Menunggu','Perlu Perbaikan','Selesai/Lulus'] as const;
export type ReviewStatus = typeof REVIEW_STATUSES[number];
export type BalaiReviewItem = {
 id:string; packageId:string; packageName:string; balai:string; stage:string; kind:string;
 status:ReviewStatus; reason:string; note:string; selection:string; period?:number; auditLevel?:number;
};
const approvalStatus=(value:ApprovalState):ReviewStatus => value==='Diajukan'?'Perlu Review':value==='Disetujui'?'Selesai/Lulus':['Perlu Revisi','Ditolak'].includes(value)?'Perlu Perbaikan':'Menunggu';
/** Read-only projection: opening the queue never decides or updates a survey. */
export function balaiReviewQueue(packages:Record<string,OperationalWorkflowState>):BalaiReviewItem[]{
 return Object.values(packages).flatMap(state=>{
  const rows:BalaiReviewItem[]=[];
  const add=(stage:string,kind:string,status:ReviewStatus,reason:string,note='',context:Partial<Pick<BalaiReviewItem,'period'|'auditLevel'>>={})=>rows.push({
   id:`${state.project.id}:${stage}:${context.period??context.auditLevel??kind}`,packageId:state.project.id,packageName:state.project.packageName,balai:state.project.balai,
   stage,kind,status,reason,note,selection:PACKAGE_WORKFLOW_ITEMS.find(item=>item.code===stage)!.selection,...context,
  });
  const prep=state.project.preparation;
  add('Tahap 0','Review persiapan',approvalStatus(prep.reportApproval),prep.reportApproval==='Diajukan'?'Laporan pendahuluan diajukan kepada Balai.':prep.reportApproval==='Disetujui'?'Persiapan disetujui Balai.':prep.reportApproval==='Perlu Revisi'||prep.reportApproval==='Ditolak'?'Penyedia perlu memperbaiki dan mengajukan ulang.':'Menunggu kelengkapan dan pengajuan Penyedia.',prep.reviewerNote);
  const productionBlockers=productionReviewBlockers(state);
  if(state.productionApproval==='Disetujui'&&!state.productionApprovalBa.trim())productionBlockers.push('Referensi BA persetujuan alat dan metode belum dicatat.');
  const prod=approvalStatus(state.productionApproval);
  add('Tahap 2','Review produksi',prod,productionBlockers.length?productionBlockers.join(' '):prod==='Perlu Review'?'Hasil uji diajukan; periksa bukti sebelum memutuskan.':prod==='Perlu Perbaikan'?'Menunggu perbaikan dan pengajuan ulang Penyedia.':prod==='Selesai/Lulus'?'Alat dan metode telah disetujui.':'Menunggu pengajuan hasil uji Penyedia.',state.productionApprovalNote);
  const periods={...state.cycleHistory,[String(state.activeCyclePeriod??1)]:state.cycle};
  for(const [number,cycle] of Object.entries(periods)){
   const period=Number(number);if(!Number.isSafeInteger(period)||period<1)continue;
   const open=state.corrections.filter(c=>c.cyclePeriod===period&&c.status!=='Ditutup');
   const resubmitted=open.some(c=>c.status==='Verifikasi Ulang'||c.status==='Menunggu Persetujuan');
   const finding=cycle.userReview==='Temuan'||Object.values(cycle.surveyReviews??{}).some(r=>r?.decision==='Temuan');
   const status:ReviewStatus=resubmitted?'Perlu Review':open.length||finding?'Perlu Perbaikan':cycle.requiresReview||cycle.reviewPendingTypes?.length?'Perlu Review':cycle.certificateId&&cycle.userReview==='Sesuai'?'Selesai/Lulus':cycle.periodCompleted?'Perlu Review':'Menunggu';
   const notes=[cycle.userReviewNote,...Object.entries(cycle.surveyReviews??{}).map(([type,r])=>r?.note?`${type}: ${r.note}`:'')].filter(Boolean).join(' · ');
   add('Tahap 3B',`V&V berkala · periode ${period}`,status,cycle.reviewReason|| (resubmitted?'Perbaikan diajukan; buka tindak lanjut dan pemeriksaan ulang.':open.length?`${open.length} temuan belum ditutup.`:finding?'Ada temuan pemeriksaan.':status==='Selesai/Lulus'?'Keputusan sesuai dan referensi BA tercatat.':cycle.periodCompleted?'Pemeriksaan internal periode selesai; review dan BA Balai diperlukan.':'Menunggu pemeriksaan internal Penyedia.'),notes,{period});
  }
  const stagedReady=state.project.surveyTypes.length>0&&state.project.surveyTypes.every(type=>stagedSurveyReviewMode(type,state.productionTests.PCI.pciManual!==false)==='generic-review'?state.submission.stagedReviews?.[type]?.decision==='Sesuai':sourceInspectionStatus(state.project.id,type,'staged',state.productionTests.PCI.pciManual!==false,state.project).complete);
  const stagedFinding=Object.values(state.submission.stagedReviews??{}).some(review=>review?.decision==='Temuan');
  const prepared=!!state.submission.rawFileName.trim()&&!!state.submission.cleanedFileName.trim();
  add('Tahap 4','V&V bertahap sebelum audit',stagedFinding?'Perlu Perbaikan':stagedReady?'Selesai/Lulus':prepared?'Perlu Review':'Menunggu',stagedFinding?'Ada temuan review bertahap yang perlu diperbaiki.':stagedReady?'Pemeriksaan bertahap tercatat; penyerahan tetap mengikuti gerbang RNI/LRS dan Audit Tingkat 1.':prepared?'Data telah disiapkan; pemeriksaan bertahap Balai diperlukan.':'Menunggu data dan bukti penyerahan Penyedia.',Object.entries(state.submission.stagedReviews??{}).map(([type,review])=>`${type}: ${review?.note??''}`).join(' · '));
  const a=state.audits[1], previous=state.audits[0];
  const ready=previous.status==='Lulus'&&!previous.requiresReview&&state.submission.validationStatus==='VALID';
  const auditResubmitted=state.corrections.some(c=>c.source==='Penolakan audit tingkat 2'&&['Menunggu Persetujuan','Verifikasi Ulang'].includes(c.status));
  const status:ReviewStatus=auditResubmitted?'Perlu Review':a.status==='Ditolak'?'Perlu Perbaikan':a.requiresReview?'Perlu Review':a.status==='Lulus'&&ready?'Selesai/Lulus':a.status==='Klarifikasi'?'Menunggu':ready?'Perlu Review':'Menunggu';
  add('Tahap 5','Audit tingkat 2',status,a.reviewReason||(auditResubmitted?'Tindak lanjut audit diajukan kepada Balai; periksa usulan atau hasil uji ulang.':a.status==='Ditolak'?'Temuan audit memerlukan perbaikan dan pemeriksaan ulang.':a.status==='Klarifikasi'?'Menunggu klarifikasi; catatan bukan otomatis temuan.':!ready?'Menunggu Audit Tingkat 1 lulus dan penyerahan VALID.':a.status==='Lulus'?'Audit Balai lulus.':'Audit Balai siap diperiksa.'),a.decisionNote,{auditLevel:2});
  const acceptance=state.acceptance;
  const auditsReady=state.audits.every(a=>a.status==='Lulus'&&!a.requiresReview);
  const criteriaReady=evaluateStageGate(state,'Tahap 6').blockers;
  const acceptanceStatus:ReviewStatus=acceptance.acceptanceDecision==='Ditolak'?'Perlu Perbaikan':acceptance.finalAcceptance&&auditsReady&&criteriaReady.length===0?'Selesai/Lulus':auditsReady&&criteriaReady.length===0?'Perlu Review':'Menunggu';
  add('Tahap 6','Penerimaan data',acceptanceStatus,acceptanceStatus==='Perlu Perbaikan'?'Penerimaan ditolak; Penyedia perlu melengkapi perbaikan.':criteriaReady.join(' ')||'Periksa kriteria dan dokumen penerimaan.',acceptance.acceptanceRejectionReason||acceptance.acceptanceReviewNote||'');
  // Missing source forms must not silently revoke a previously recorded decision.
  // Such discrepancies remain visible in monitoring and the stage detail.
  return rows;
 });
}
export function filterBalaiReviews(rows:BalaiReviewItem[],query:string,stage:string,status:string):BalaiReviewItem[]{
 const needle=query.trim().toLocaleLowerCase('id');
 return rows.filter(row=>(!stage||row.stage===stage)&&(!status||row.status===status)&&(!needle||[row.packageName,row.packageId,row.balai,row.kind,row.reason,row.note].join(' ').toLocaleLowerCase('id').includes(needle)));
}
