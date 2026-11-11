import type {OperationalWorkflowState,WorkflowRole} from '../model';
import {canPerformAction} from '../workflowPermissions';
import {correctionMutationError} from '../checkpoint09Corrections';

/** Storage-boundary defense for core QA/QC decisions. Not a substitute for backend auth. */
const differs=(a:unknown,b:unknown)=>JSON.stringify(a)!==JSON.stringify(b);
const B:WorkflowRole='PIC Balai / Pengguna Jasa';
const D:WorkflowRole='Direktorat / Pusat';
/** A Balai preparation revision invalidates downstream evidence, but is not an
 * audit decision. Only the exact automatically-generated flag/history is allowed. */
function isPreparationInvalidation(before:OperationalWorkflowState,after:OperationalWorkflowState,role:WorkflowRole){
 const old=before.project.preparation, next=after.project.preparation;
 return role===B && old.reportApproval==='Diajukan' &&
   (next.reportApproval==='Perlu Revisi'||next.reportApproval==='Ditolak') &&
   Boolean(next.reviewerNote.trim());
}
function isOnlyPropagatedAuditFlag(old:OperationalWorkflowState['audits'][number],next:OperationalWorkflowState['audits'][number],reason:string){
 if(old.status==='Belum Dimulai')return !differs(old,next);
 const {requiresReview:_r1,reviewReason:_n1,history:_h1,...beforeRest}=old;
 const {requiresReview:_r2,reviewReason:_n2,history:_h2,...afterRest}=next;
 if(differs(beforeRest,afterRest)||next.requiresReview!==true||next.reviewReason!==reason)return false;
 const oldHistory=old.history??[];
 const nextHistory=next.history??[];
 const {history:_ignore,...snapshot}=old;
 return (!differs(oldHistory,nextHistory)) ||
    (nextHistory.length===oldHistory.length+1 && !differs(oldHistory,nextHistory.slice(0,-1)) && !differs(snapshot,nextHistory.at(-1)));
}

export function phase1MutationError(before:OperationalWorkflowState,after:OperationalWorkflowState,role:WorkflowRole):string|undefined {
 const forbidden='Perubahan ditolak: tindakan tidak sesuai kewenangan peran aktif.';
 if(before.project.id!==after.project.id||before.role!==after.role||after.role!==role)return 'Identitas paket atau peran berubah dalam tindakan QA/QC.';
 // Administrative monitoring must never write operational QA/QC, including history.
 if(role==='Admin') {
   const {role:_a,backups:_oldBackups,backupSchedule:_oldSchedule,events:_oldEvents,...oldState}=before;
   const {role:_b,backups:_newBackups,backupSchedule:_newSchedule,events:_newEvents,...newState}=after;
   if(differs(oldState,newState))return 'Monitoring Admin hanya baca; keputusan dan data mutu tidak dapat diubah.';
   if(after.events.length<before.events.length || (before.events.length>0&&differs(after.events.slice(-before.events.length),before.events)))return 'Riwayat aktivitas tidak boleh diubah.';
   return;
 }
 // Never rewrite historical audit decisions or recorded events through UI mutations.
 if(after.events.length<before.events.length || (before.events.length>0&&differs(after.events.slice(-before.events.length),before.events)))return 'Jejak aktivitas lama tidak boleh dihapus atau diubah.';
 if((before.balaiDecisionHistory??[]).length>(after.balaiDecisionHistory??[]).length || (before.balaiDecisionHistory??[]).some((event,i)=>differs(event,(after.balaiDecisionHistory??[])[i])))return 'Riwayat keputusan Balai tidak boleh diubah.';
 if((before.reviewActivityHistory??[]).length>(after.reviewActivityHistory??[]).length || (before.reviewActivityHistory??[]).some((event,i)=>differs(event,(after.reviewActivityHistory??[])[i])))return 'Riwayat pemeriksaan tidak boleh diubah.';
 // Audit authority is bound to audit level, regardless of navigation selection.
 const preparationInvalidation=isPreparationInvalidation(before,after,role);
 const invalidationReason='Laporan pendahuluan perlu revisi; validasi dan audit harus diulang.';
 for(const [index,action] of (['audit.internal','audit.balai','audit.directorate'] as const).entries()) {
   const prior=before.audits[index],next=after.audits[index];
   if(!differs(prior,next))continue;
   if(preparationInvalidation && isOnlyPropagatedAuditFlag(prior,next,invalidationReason))continue;
   const {requiresReview:_oldReview,reviewReason:_oldReason,...oldDecision}=prior;
   const {requiresReview:_newReview,reviewReason:_newReason,...newDecision}=next;
   const propagated=next.requiresReview===true&&!differs(oldDecision,newDecision) &&
      before.audits.slice(0,index).some((a,i)=>differs(a,after.audits[i]) && canPerformAction(role,(['audit.internal','audit.balai','audit.directorate'] as const)[i]));
   if(!canPerformAction(role,action)&&!propagated)return `Audit tingkat ${index+1} bukan kewenangan ${role}.`;
   if(index>0 && !propagated && (before.audits[index-1].status!=='Lulus'||before.audits[index-1].requiresReview))return `Audit tingkat ${index+1} menunggu hasil sesuai dari audit sebelumnya.`;
   if(index===2 && !propagated && before.submission.validationStatus!=='VALID')return 'Audit tingkat 3 menunggu validasi penyerahan data.';
 }
 // Corrections retain their own status-specific transition checks, even on direct mutation calls.
 if(differs(before.corrections,after.corrections)){
   const error=correctionMutationError(before,after);if(error)return error;
 }
 // A preparation rejection legitimately invalidates downstream approvals and
 // acceptance readiness. Never turn that automatic rollback into an audit permission.
 if(preparationInvalidation){
   if(after.productionApproval!=='Draft'||after.productionApprovalBa!==''||
      after.bridgeInspectionPermit!==false||after.submission.validationStatus!=='Draft'||
      after.submission.validationMessage!==invalidationReason||
      after.acceptance.finalAcceptance!==false||after.acceptance.finalReport!==false||
      after.acceptance.semesterTwoRevalidation!==false)return forbidden;
 }
 // A lower level cannot enter an acceptance decision or change its documentation.
 const {terms:oldTerms,finalReport:oldReport,semesterTwoEvidence:oldEvidence,...oldDecision}=before.acceptance;
 const {terms:newTerms,finalReport:newReport,semesterTwoEvidence:newEvidence,...newDecision}=after.acceptance;
 if(differs(oldDecision,newDecision)&&role!==B)return forbidden;
 // Never allow an acceptance outcome to bypass two distinct completed audit levels.
 if((!before.acceptance.finalAcceptance&&after.acceptance.finalAcceptance)||
   (before.acceptance.acceptanceDecision!==after.acceptance.acceptanceDecision&&['Diterima','Diterima dengan Catatan'].includes(after.acceptance.acceptanceDecision??''))){
   if(role!==B||!before.audits.slice(1).every(a=>a.status==='Lulus'&&!a.requiresReview))return 'Penerimaan akhir membutuhkan audit tingkat 2 dan tingkat 3 yang sesuai.';
 }
 // Limit Directorate to audit-level-3 and its own correction processing; no Balai/source writes.
 if(role===D){
   const excluded=['audits','corrections','events','reviewActivityHistory'];
   const changedOther=(Object.keys(before) as (keyof OperationalWorkflowState)[]).some(k=>!excluded.includes(k)&&differs(before[k],after[k]));
   if(changedOther)return forbidden;
 }
 if(role===B){
   if(differs(before.calibrations,after.calibrations)||differs(before.calibrationChecklist,after.calibrationChecklist)||differs(before.dailyRecords,after.dailyRecords)||differs(before.productionTests,after.productionTests))return forbidden;
 }
 if(role==='Penyedia Jasa / Ketua Tim'){
   const oldApproval=before.project.preparation.reportApproval,newApproval=after.project.preparation.reportApproval;
   if(oldApproval!==newApproval && !['Draft','Diajukan'].includes(newApproval))return forbidden;
   if(before.project.preparation.reviewerNote!==after.project.preparation.reviewerNote)return forbidden;
   if(differs(before.productionApprovalNote,after.productionApprovalNote)&&after.productionApproval!=='Diajukan')return forbidden;
   if(before.productionApproval!==after.productionApproval&&!['Draft','Diajukan'].includes(after.productionApproval))return forbidden;
   if(differs(before.submission.stagedReviews,after.submission.stagedReviews))return forbidden;
   if(before.cycle.userReview!==after.cycle.userReview||differs(before.cycle.surveyReviews,after.cycle.surveyReviews))return forbidden;
 }
 if(role===B){
   if(differs(before.project.surveyTypes,after.project.surveyTypes)||differs(before.project.routes,after.project.routes)||differs(before.submission.rawFileName,after.submission.rawFileName)||differs(before.submission.cleanedFileName,after.submission.cleanedFileName))return forbidden;
 }
 return;
}
