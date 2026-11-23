import type { OperationalWorkflowState } from "./model";
import { markAuditsForReview } from "./workflowRevisions";

export const invalidateDependentStages = (
  state: OperationalWorkflowState,
  reason: string,
): OperationalWorkflowState => ({
  ...state,
  productionApproval: "Draft",
  productionApprovalBa: "",
  bridgeInspectionPermit: false,
  submission: {
    ...state.submission,
    validationStatus: "Draft",
    validationMessage: reason,
  },
  audits: markAuditsForReview(state, reason),
  acceptance: {
    ...state.acceptance,
    terms: state.acceptance.terms.map((term) =>
      term.id === "T1" || term.id === "T3" || term.id === "T4"
        ? { ...term, complete: false }
        : term,
    ),
    semesterTwoRevalidation: false,
    finalReport: false,
    finalAcceptance: false,
  },
});
export const invalidateVervalStages = (
  state: OperationalWorkflowState,
  reason: string,
): OperationalWorkflowState => ({
  ...state,
  submission: {
    ...state.submission,
    validationStatus: "Draft",
    validationMessage: reason,
  },
  audits: markAuditsForReview(state, reason),
  acceptance: {
    ...state.acceptance,
    terms: state.acceptance.terms.map((term) =>
      term.id === "T2" || term.id === "T3" || term.id === "T4"
        ? { ...term, complete: false }
        : term,
    ),
    semesterTwoRevalidation: false,
    finalReport: false,
    finalAcceptance: false,
  },
});
