import { submissionInputChanged } from './submissionRevisions';
import { markAuditsForReview } from './workflowRevisions';
import type { OperationalWorkflowState, SubmissionState } from './model';

export function applySubmissionEdit(s: OperationalWorkflowState, patch: Partial<SubmissionState>): OperationalWorkflowState {
  if (Object.keys(patch).length===1 && 'stagedReviews' in patch) {
    return {...s,submission:{...s.submission,...patch,localReadinessConfirmed:false}};
  }
  // A local readiness acknowledgement is not a source-system validation
  // and must not invalidate an already recorded internal audit.
  if (patch.localReadinessConfirmed === true &&
      Object.keys(patch).every(key => ['localReadinessConfirmed','targetSystems','validationMessage'].includes(key))) {
    return {...s,submission:{...s.submission,...patch}};
  }
  const submission = { ...s.submission, ...patch, localReadinessConfirmed: false };
  if (!("validationStatus" in patch)) submission.validationStatus = "Draft";
  const confirmationOnly = patch.validationStatus === 'VALID' &&
    Object.keys(patch).every(key => ['validationStatus', 'validationMessage', 'targetSystems'].includes(key));
  const changedInput = !confirmationOnly && submissionInputChanged(s.submission,patch);
  const invalidatesDownstream =
    (changedInput || patch.validationStatus === "Draft") &&
    (s.submission.validationStatus === "VALID" ||
      s.audits.some((audit) => audit.status !== "Belum Dimulai"));
  if (!invalidatesDownstream) return { ...s, submission };
  submission.validationStatus = "Draft";
  submission.validationMessage =
    "Bukti penyerahan berubah; validasi dan audit perlu diulang.";
  return {
    ...s,
    submission,
    audits: Object.keys(patch).some((key) =>
      [
        "rawFileName",
        "cleanedFileName",
        "geometryFormat",
        "topologyErrors",
        "stationingConsistent",
        "coordinatesBoundToLrs",
        "routeChanged",
        "routeLengthDeviation",
      ].includes(key),
    )
      ? markAuditsForReview(
          s,
          "Data teknis Tahap 4 berubah; tinjau cakupan audit terkait.",
        )
      : s.audits,
    acceptance: {
      ...s.acceptance,
      terms: s.acceptance.terms.map((term) =>
        term.id === "T3" || term.id === "T4"
          ? { ...term, complete: false }
          : term,
      ),
      semesterTwoRevalidation: false,
      finalReport: false,
      finalAcceptance: false,
    },
  };
}
