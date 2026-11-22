import {isCorrectionClosureCascade} from './correctionClosureCascade';
import {isBalaiVervalCascade,isBalaiPeriodDecision} from './balaiVervalCascade';
import { balaiDecisionError } from '../balaiDecisionPolicy';
import { productionReviewBlockers } from '../reviewReadiness';
import { canOpenProductionCorrection } from '../productionFailures';
import { evaluateSubmissionReadiness } from '../submissionReadiness';
import { isProviderUpstreamTransition } from './providerUpstreamTransition';
import { finalAcceptanceBlockers } from '../acceptanceReadiness';
import { isProviderChecklistCascade, preparationChecklistChanged } from './providerChecklistCascade';
import type {OperationalWorkflowState,WorkflowRole} from '../model';
import {canPerformAction} from '../workflowPermissions';
import {isOnlyCalibrationResponseUpdate,validCalibrationReviewShape,changedSuitableCalibrationSectionIsInvalid} from '../calibrationReview';
import {correctionMutationError} from '../checkpoint09Corrections';
import {isExactCyclePeriodSwitch} from '../cyclePeriodTransition';

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

export function workflowMutationError(before:OperationalWorkflowState,after:OperationalWorkflowState,role:WorkflowRole):string|undefined {
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
 if (preparationChecklistChanged(before, after)) {
   return isProviderChecklistCascade(before, after)
     ? undefined
     : 'Checklist persiapan dikunci atau perubahan memuat data di luar satu butir checklist dan invalidasi sistem.';
 }
 if (isProviderUpstreamTransition(before, after)) return;
 if (isCorrectionClosureCascade(before,after)) return;
 if (isBalaiVervalCascade(before, after)||isBalaiPeriodDecision(before,after)) return;
 const decisionError = balaiDecisionError(before, after);
 if (decisionError) return decisionError;
 if (before.productionApproval !== after.productionApproval &&
     (after.productionApproval === 'Diajukan' || after.productionApproval === 'Disetujui')) {
   const requiredRole = after.productionApproval === 'Diajukan' ? 'Penyedia Jasa / Ketua Tim' : B;
   if (role !== requiredRole) return forbidden;
   const blockers = productionReviewBlockers(before);
   if (blockers.length) return blockers[0];
 }
 if (differs(before.productionFailures, after.productionFailures)) return 'Riwayat uji gagal hanya dapat ditambah melalui pencatatan percobaan baru yang sah.';
 // Audit authority is bound to audit level, regardless of navigation selection.
 const preparationInvalidation=isPreparationInvalidation(before,after,role);
 const invalidationReason='Laporan pendahuluan perlu revisi; validasi dan audit harus diulang.';
 for(const [index,action] of (['audit.internal','audit.balai','audit.directorate'] as const).entries()) {
   const prior=before.audits[index],next=after.audits[index];
   if(!differs(prior,next))continue;
   if(preparationInvalidation && isOnlyPropagatedAuditFlag(prior,next,invalidationReason))continue;
   // retainDecisionHistory automatically appends a snapshot to a later audit
   // when an authorized earlier audit is changed. The snapshot is NOT a new
   // decision by the earlier auditor; validate its exact contents instead.
   const propagated=before.audits.slice(0,index).some((earlier,i)=>
      differs(earlier,after.audits[i]) &&
      canPerformAction(role,(['audit.internal','audit.balai','audit.directorate'] as const)[i]) &&
      isOnlyPropagatedAuditFlag(prior,next,`Audit tingkat ${i+1} berubah; periksa kembali keterkaitan keputusan.`)
   );
   if(!canPerformAction(role,action)&&!propagated)return `Audit tingkat ${index+1} bukan kewenangan ${role}.`;
   if(index>0 && !propagated && (before.audits[index-1].status!=='Lulus'||before.audits[index-1].requiresReview))return `Audit tingkat ${index+1} menunggu hasil sesuai dari audit sebelumnya.`;
   if(index===2 && !propagated && before.submission.validationStatus!=='VALID')return 'Audit tingkat 3 menunggu validasi penyerahan data.';
 }
 // Corrections retain their own status-specific transition checks, even on direct mutation calls.
 if(differs(before.corrections,after.corrections)){
   if (after.corrections.some(item => item.source === 'Uji coba gagal' &&
     !before.corrections.some(old => old.id === item.id) &&
     (role !== 'Penyedia Jasa / Ketua Tim' || !canOpenProductionCorrection(before, item.surveyType)))) {
     return 'Kasus uji produksi memerlukan kegagalan berulang setelah pemeriksaan metode atau personel.';
   }
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
 if (before.submission.validationStatus !== 'VALID' && after.submission.validationStatus === 'VALID') {
   const { ready, requiredTargets } = evaluateSubmissionReadiness(after);
   if (role !== 'Penyedia Jasa / Ketua Tim' || !ready || differs(requiredTargets, after.submission.targetSystems) ||
       before.audits[0].status !== 'Lulus' || before.audits[0].requiresReview) {
     return 'Penyerahan tertahan. Pemeriksaan data, dokumen mutu, audit internal, atau tujuan sistem belum sesuai.';
   }
 }
 // A lower level cannot enter an acceptance decision or change its documentation.
 const {terms:oldTerms,finalReport:oldReport,semesterTwoEvidence:oldEvidence,...oldDecision}=before.acceptance;
 const {terms:newTerms,finalReport:newReport,semesterTwoEvidence:newEvidence,...newDecision}=after.acceptance;
 if(differs(oldDecision,newDecision)&&role!==B)return forbidden;
 // Preconditions must already hold before the decision and remain valid afterward.
 const accepted = after.acceptance.acceptanceDecision === 'Diterima' ||
   after.acceptance.acceptanceDecision === 'Diterima dengan Catatan';
 if ((!before.acceptance.finalAcceptance && after.acceptance.finalAcceptance) ||
     (accepted && before.acceptance.acceptanceDecision !== after.acceptance.acceptanceDecision)) {
   if (role !== B || !accepted || !after.acceptance.finalAcceptance || !after.acceptance.finalAcceptanceBa?.trim()) {
     return 'Keputusan penerimaan akhir dan referensi BA yang sah wajib dicatat oleh PIC Balai.';
   }
   if (after.acceptance.acceptanceDecision === 'Diterima dengan Catatan' && !after.acceptance.acceptanceReviewNote?.trim()) {
     return 'Catatan penerimaan wajib diisi.';
   }
   const blockers = [...finalAcceptanceBlockers(before), ...finalAcceptanceBlockers(after)];
   if (blockers.length) return `Penerimaan akhir tertahan. ${blockers[0]}`;
 }
 // Calibration evidence review is a Balai action, not a new approval gate.
 if(differs(before.calibrationReviews,after.calibrationReviews)){
   if(!validCalibrationReviewShape(after))return 'Hasil pemeriksaan atau bukti tidak lengkap.';
   if(role===B){
     if(changedSuitableCalibrationSectionIsInvalid(before,after))return 'Bukti pada bagian ini belum lengkap untuk hasil Sesuai.';
     for(const [type,review] of Object.entries(after.calibrationReviews??{})){
       if(!before.project.surveyTypes.includes(type as import('../model').SurveyType))return forbidden;
       if(review&&(!review.note.trim()||(review.result==='Ada ketidaksesuaian'&&!review.evidenceReference.trim())))return 'Catatan dan referensi temuan wajib dilengkapi.';
     }
   }else if(role==='Penyedia Jasa / Ketua Tim'){
     const dataChanged=differs(before.calibrations,after.calibrations)||differs(before.calibrationChecklist,after.calibrationChecklist);
     const old=before.calibrationReviews??{},now=after.calibrationReviews??{};
     const onlyClear=Object.keys(now).every(type=>!differs(now[type as import('../model').SurveyType],old[type as import('../model').SurveyType])||now[type as import('../model').SurveyType]===undefined);
     if((!dataChanged||!onlyClear)&&!isOnlyCalibrationResponseUpdate(before,after))return forbidden;
   }else return forbidden;
 }
 // Limit Directorate to audit-level-3 and its own correction processing; no Balai/source writes.
 if(role===D){
   const excluded=['audits','corrections','events','reviewActivityHistory'];
   const changedOther=(Object.keys(before) as (keyof OperationalWorkflowState)[]).some(k=>!excluded.includes(k)&&differs(before[k],after[k]));
   if(changedOther)return forbidden;
 }
 if(role===B){
   const safePeriodSwitch=isExactCyclePeriodSwitch(before,after);
   const providerCycleKeys=['selectedTypes','periodCompleted','checkedProtocols','iriCoefficientVariation','pciAiStandardDeviation','pciManualMaxDifferencePercent','reRatingStatus','consistency','affectedTool'] as const;
   if(!safePeriodSwitch&&providerCycleKeys.some(key=>differs(before.cycle[key],after.cycle[key])))return forbidden;
   if(differs(before.calibrations,after.calibrations)||differs(before.calibrationChecklist,after.calibrationChecklist)||differs(before.dailyRecords,after.dailyRecords)||differs(before.productionTests,after.productionTests))return forbidden;
 }
 if(role==='Penyedia Jasa / Ketua Tim'){
    const safePeriodSwitch=isExactCyclePeriodSwitch(before,after);
    if(before.activeCyclePeriod!==after.activeCyclePeriod && !safePeriodSwitch) return forbidden;
    const balaiCycleKeys=['certificateId','lastCompletedDate','bridgeFieldValidation','finalPeriodValidation','bridgeValidatedPercent','bridgeValidationReport','finalValidationLocation','finalToolUnchanged'] as const;
    if(!safePeriodSwitch&&balaiCycleKeys.some(key=>differs(before.cycle[key],after.cycle[key])))return forbidden;
   const oldApproval=before.project.preparation.reportApproval,newApproval=after.project.preparation.reportApproval;
   if(oldApproval!==newApproval && !['Draft','Diajukan'].includes(newApproval))return forbidden;
   if(before.project.preparation.reviewerNote!==after.project.preparation.reviewerNote)return forbidden;
   if(differs(before.productionApprovalNote,after.productionApprovalNote)&&after.productionApproval!=='Diajukan')return forbidden;
   if(before.productionApproval!==after.productionApproval&&!['Draft','Diajukan'].includes(after.productionApproval))return forbidden;
   if(differs(before.submission.stagedReviews,after.submission.stagedReviews))return forbidden;
   if(!safePeriodSwitch&&(before.cycle.userReview!==after.cycle.userReview||differs(before.cycle.surveyReviews,after.cycle.surveyReviews)))return forbidden;
 }
 if(role===B){
   if(differs(before.project.surveyTypes,after.project.surveyTypes)||differs(before.project.routes,after.project.routes)||differs(before.submission.rawFileName,after.submission.rawFileName)||differs(before.submission.cleanedFileName,after.submission.cleanedFileName))return forbidden;
 }
 return;
}
