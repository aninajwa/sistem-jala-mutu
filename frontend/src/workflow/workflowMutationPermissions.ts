import type { OperationalWorkflowState } from "./model";
import { canPerformAction, type WorkflowAction } from "./workflowPermissions";
import { evaluateStageGate } from "./workflowGate";
const changed = (a: unknown, b: unknown) =>
  JSON.stringify(a) !== JSON.stringify(b);
/** Frontend safeguards only; backend must independently authorize every mutation. */
export function workflowMutationError(
  before: OperationalWorkflowState,
  after: OperationalWorkflowState,
  selection: string,
): string | undefined {
  const role = before.role;
  const allow = (action: WorkflowAction) => canPerformAction(role, action);
  const denied = "Peran aktif tidak berwenang melakukan perubahan ini.";
  if (selection === "/audit:Peran & backup")
    return allow("administration.manage") ? undefined : denied;
  if (role === "Admin") return denied;
  // Check decisions separately from supporting-data edits and automatic invalidation.
  if (changed(before.project, after.project)) {
    const approval = after.project.preparation.reportApproval;
    const reviewing =
      changed(before.project.preparation.reportApproval, approval) &&
      ["Disetujui", "Perlu Revisi", "Ditolak"].includes(approval);
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
  if (changed(before.productionTests, after.productionTests))
    if (!allow("production.edit")) return denied;
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
  if (selection === "/entry:Gerbang RNI/LRS" && !allow("submission.prepare"))
    return denied;
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
