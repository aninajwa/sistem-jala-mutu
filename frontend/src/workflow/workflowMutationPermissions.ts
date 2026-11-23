import { submitPeriodicResults } from './periodicSubmission';
import {isBalaiVervalCascade,isBalaiPeriodDecision} from './access/balaiVervalCascade';
import {balaiDecisionError} from './balaiDecisionPolicy';
import {correctionMutationError} from './checkpoint09Corrections';
import type { OperationalWorkflowState } from "./model";
import { canPerformAction, type WorkflowAction } from "./workflowPermissions";
import { evaluateStageGate } from "./workflowGate";
import {isOnlyCalibrationResponseUpdate,validCalibrationReviewShape,changedSuitableCalibrationSectionIsInvalid} from './calibrationReview';
const changed = (a: unknown, b: unknown) =>
  JSON.stringify(a) !== JSON.stringify(b);
/** Frontend safeguards only; backend must independently authorize every mutation. */
export function workflowMutationError(
  before: OperationalWorkflowState,
  after: OperationalWorkflowState,
  selection: string,
): string | undefined {
  const decisionError = balaiDecisionError(before,after);
  if(decisionError)return decisionError;
  const role = before.role;
  const allow = (action: WorkflowAction) => canPerformAction(role, action);
  const denied = "Peran aktif tidak berwenang melakukan perubahan ini.";
  if (selection === "/audit:Peran & backup")
    return allow("administration.manage") ? undefined : denied;
  if (role === "Admin") return denied;
  if (selection === "/verification:Verval 14 hari") {
    const submission = submitPeriodicResults(before);
    if (submission !== before && !changed(submission, after)) return undefined;
    if (isBalaiVervalCascade(before, after) || isBalaiPeriodDecision(before, after)) return undefined;
  }
  if(changed(before.corrections,after.corrections)){const error=correctionMutationError(before,after);if(error)return error;}
  // Check decisions separately from supporting-data edits and automatic invalidation.
  if (changed(before.project, after.project)) {
    const approval = after.project.preparation.reportApproval;
    const noteOnly = before.project.preparation.reviewerNote !== after.project.preparation.reviewerNote &&
      JSON.stringify({...before.project,preparation:{...before.project.preparation,reviewerNote:after.project.preparation.reviewerNote}}) === JSON.stringify(after.project);
    const reviewing = noteOnly || (changed(before.project.preparation.reportApproval, approval) &&
      ["Disetujui", "Perlu Revisi", "Ditolak"].includes(approval));
    if (
      !allow(
        reviewing
          ? "preparation.review"
          : approval === "Diajukan"
            ? "preparation.submit"
            : "preparation.edit",
      )
    )
      return denied;
  }
  if (
    changed(before.calibrations, after.calibrations) ||
    changed(before.calibrationChecklist, after.calibrationChecklist)
  )
    if (!allow("calibration.edit")) return denied;
  if (changed(before.calibrationReviews, after.calibrationReviews)) {
    const isProviderInvalidation = allow('calibration.edit') && (changed(before.calibrations,after.calibrations) || changed(before.calibrationChecklist,after.calibrationChecklist)) &&
      Object.keys(after.calibrationReviews ?? {}).every(type =>
        JSON.stringify((after.calibrationReviews ?? {})[type as import('./model').SurveyType]) ===
        JSON.stringify((before.calibrationReviews ?? {})[type as import('./model').SurveyType]) ||
        (after.calibrationReviews ?? {})[type as import('./model').SurveyType] === undefined
      );
    const isProviderResponse = allow('calibration.edit') && isOnlyCalibrationResponseUpdate(before,after);
    if (!isProviderInvalidation && !isProviderResponse && !allow('calibration.review')) return denied;
    if (!validCalibrationReviewShape(after)) return 'Isi hasil pemeriksaan belum lengkap atau tidak sah.';
    if (allow('calibration.review')) {
      if (changedSuitableCalibrationSectionIsInvalid(before,after))return 'Bukti pada bagian ini belum memenuhi syarat untuk hasil Sesuai.';
      if (changed(before.calibrations, after.calibrations) || changed(before.calibrationChecklist, after.calibrationChecklist)) return denied;
      for (const [type, entry] of Object.entries(after.calibrationReviews ?? {})) {
        if (!before.project.surveyTypes.includes(type as import('./model').SurveyType)) return 'Jenis survei pemeriksaan di luar lingkup paket.';
        if (entry && (!entry.note.trim() || (entry.result === 'Ada ketidaksesuaian' && !entry.evidenceReference.trim())))
          return 'Catatan dan bukti temuan wajib dilengkapi.';
      }
    }
  }
  if (changed(before.productionTests, after.productionTests))
    if (!allow("production.edit")) return denied;
  if (changed(before.productionApprovalNote,after.productionApprovalNote) &&
      after.productionApproval !== 'Diajukan' && !allow('production.review')) return denied;
  if (changed(before.productionApproval,after.productionApproval) &&
      ['Perlu Revisi','Ditolak'].includes(after.productionApproval) && !allow('production.review')) return denied;
  if (
    after.productionApproval === "Disetujui" &&
    before.productionApproval !== "Disetujui"
  ) {
    if (!allow("production.review")) return denied;
    if (
      !evaluateStageGate(before, "Tahap 0").readyToComplete ||
      !evaluateStageGate(before, "Tahap 1").readyToComplete
    )
      return "Persiapan dan kalibrasi belum siap.";
  }
  if (
    after.productionApproval === "Diajukan" &&
    before.productionApproval !== "Diajukan" &&
    !allow("production.submit")
  )
    return denied;
  if (selection === "/entry:Survei harian") {
    if (!allow("daily.record")) return denied;
    if (!evaluateStageGate(before, "Tahap 2").readyToComplete)
      return "Persetujuan produksi belum tercatat.";
  }
  if (selection === "/verification:Verval 14 hari") {
    const {requiresReview: _oldReview, reviewReason: _oldReason, reviewPendingTypes:_oldPending, ...oldCycle} = before.cycle;
    const {requiresReview: _newReview, reviewReason: _newReason, reviewPendingTypes:_newPending, ...newCycle} = after.cycle;
    if (after.cycle.requiresReview === true && !changed(oldCycle,newCycle) &&
        (before.cycle.reviewPendingTypes??[]).every(type=>after.cycle.reviewPendingTypes?.includes(type)) &&
        (after.cycle.reviewPendingTypes??[]).every(type=>before.project.surveyTypes.includes(type)) &&
        (allow("periodic.internal") || allow("periodic.review"))) return undefined;
    const keys = [
      "userReview",
      "userReviewNote",
      "surveyReviews",
      "reviewPendingTypes",
      "bridgeFieldValidation",
      "bridgeValidatedPercent",
      "bridgeValidationReport",
      "finalPeriodValidation",
      "finalValidationLocation",
      "finalToolUnchanged",
      "certificateId",
    ];
    const technicalChanged = [
      "consistency",
      "heldRecordIds",
      "selectedTypes",
      "checkedProtocols",
      "iriCoefficientVariation",
      "pciAiStandardDeviation",
      "pciManualMaxDifferencePercent",
      "reRatingStatus",
    ].some((key) =>
      changed(
        before.cycle[key as keyof typeof before.cycle],
        after.cycle[key as keyof typeof after.cycle],
      ),
    );
    const review =
      (!technicalChanged || allow("periodic.review")) &&
      keys.some((key) =>
        changed(
          before.cycle[key as keyof typeof before.cycle],
          after.cycle[key as keyof typeof after.cycle],
        ),
      );
    if (!allow(review ? "periodic.review" : "periodic.internal")) return denied;
    if (!evaluateStageGate(before, "Tahap 2").readyToComplete)
      return "Persetujuan produksi belum tercatat.";
  }
  if (selection === '/entry:Gerbang RNI/LRS') {
    const {stagedReviews:oldReviews,...oldInput}=before.submission;
    const {stagedReviews:newReviews,...newInput}=after.submission;
    const reviewsChanged=changed(oldReviews,newReviews);
    if(reviewsChanged&&!allow('submission.review'))return denied;
    if(changed(oldInput,newInput)&&!allow('submission.prepare'))return denied;
    if(!reviewsChanged&&!changed(oldInput,newInput)&&!allow('submission.prepare'))return denied;
    if(reviewsChanged)for(const [type,review] of Object.entries(newReviews??{})){
      if(!before.project.surveyTypes.includes(type as import('./model').SurveyType))return 'Jenis survei review berada di luar lingkup paket.';
      if(review?.decision==='Temuan'&&oldReviews?.[type as import('./model').SurveyType]?.decision!=='Temuan'&&!review.note.trim())return 'Uraian temuan V&V bertahap wajib diisi.';
    }
  }
  if (selection === "/verification:Audit tingkat 1–3") {
    for (let i = 0; i < 3; i++) {
      if (!changed(before.audits[i], after.audits[i])) continue;
      // Only a review flag may propagate from an authorized earlier audit.
      // An unauthorized reset or change of BA, sample, checks or decision is rejected.
      const { requiresReview: _beforeReview, reviewReason: _beforeReason, ...oldDecision } = before.audits[i];
      const { requiresReview: _afterReview, reviewReason: _afterReason, ...newDecision } = after.audits[i];
      const authorizedEarlierChange = before.audits.some((audit, index) => index < i &&
        changed(audit, after.audits[index]) &&
        allow((["audit.internal", "audit.balai", "audit.directorate"] as const)[index]));
      if (authorizedEarlierChange && after.audits[i].requiresReview === true && !changed(oldDecision, newDecision)) continue;
      if (
        !allow(
          (["audit.internal", "audit.balai", "audit.directorate"] as const)[i],
        )
      )
        return denied;
    }
  }
  if (selection === "/reports:Penerimaan & termin") {
    if (
      after.acceptance.finalAcceptance &&
      !before.acceptance.finalAcceptance &&
      !allow("acceptance.review")
    )
      return denied;
    const reviewKeys = [
      "partialReceipts",
      "semesterTwoRevalidation",
      "acceptanceCriteria",
      "acceptanceDecision",
      "finalAcceptanceBa",
      "acceptanceRejectionReason",
      "acceptanceReviewNote",
    ];
    const review = reviewKeys.some((key) =>
      changed(
        before.acceptance[key as keyof typeof before.acceptance],
        after.acceptance[key as keyof typeof after.acceptance],
      ),
    );
    if (!allow(review ? "acceptance.review" : "submission.prepare"))
      return denied;
  }
  return undefined;
}
