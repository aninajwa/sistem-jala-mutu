import type {OperationalWorkflowState} from './model';
/** Decisions require an actual submission and a reason for returning work. Notes alone are not findings. */
export function balaiDecisionError(before:OperationalWorkflowState,after:OperationalWorkflowState):string|undefined{
 const prep=before.project.preparation,next=after.project.preparation;
 if(prep.reportApproval!==next.reportApproval&&['Disetujui','Perlu Revisi','Ditolak'].includes(next.reportApproval)){
  if(prep.reportApproval!=='Diajukan')return 'Laporan harus diajukan Penyedia sebelum keputusan Balai.';
  if(next.reportApproval!=='Disetujui'&&!next.reviewerNote.trim())return 'Alasan perbaikan persiapan wajib diisi.';
 }
 if(before.productionApproval!==after.productionApproval&&['Disetujui','Perlu Revisi','Ditolak'].includes(after.productionApproval)){
  if(before.productionApproval!=='Diajukan')return 'Hasil produksi harus diajukan ulang Penyedia sebelum keputusan Balai.';
  if(after.productionApproval==='Disetujui'&&!after.productionApprovalBa.trim())return 'Referensi BA persetujuan alat dan metode wajib diisi.';
  if(after.productionApproval!=='Disetujui'&&!after.productionApprovalNote.trim())return 'Alasan perbaikan produksi wajib diisi.';
 }
 if(before.cycle!==after.cycle){
  for(const [type,review] of Object.entries(after.cycle.surveyReviews??{})){
   if(review?.decision==='Temuan'&&before.cycle.surveyReviews?.[type as import('./model').SurveyType]?.decision!=='Temuan'&&!review.note.trim())return 'Uraian temuan V&V wajib diisi; catatan biasa dapat disimpan tanpa membuat temuan.';
  }
 }
 if(before.acceptance.acceptanceDecision!==after.acceptance.acceptanceDecision){
  if(after.acceptance.acceptanceDecision==='Ditolak'&&!after.acceptance.acceptanceRejectionReason?.trim())return 'Alasan penolakan penerimaan wajib diisi.';
  if(after.acceptance.acceptanceDecision==='Diterima dengan Catatan'&&!after.acceptance.acceptanceReviewNote?.trim())return 'Catatan penerimaan wajib diisi.';
 }
 if(after.acceptance.finalAcceptance&&!before.acceptance.finalAcceptance&&!after.acceptance.finalAcceptanceBa?.trim())return 'Referensi BA penerimaan wajib diisi.';
 return undefined;
}
