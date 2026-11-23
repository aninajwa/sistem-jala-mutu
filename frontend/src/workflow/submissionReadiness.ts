import { fieldReadiness } from './flowRules';
import { evaluateLrsGate, SUBMISSION_DOCUMENTS, type OperationalWorkflowState, type SurveyType } from './model';
import { sourceInspectionStatus } from './repository/sourceChecklistRepository';
import { stagedFallbackReviewReady, stagedSurveyReviewMode } from './stagedReviewPolicy';

export const systemsByType: Record<SurveyType, string> = {
  IRI: "SMD Jalan",
  PCI: "SMD Jalan",
  Lendutan: "SMD Jalan",
  Jembatan: "INVI-J",
  Lereng: "InSlope",
  Drainase: "InDrain",
  "Lalu Lintas": "SMD Jalan",
  RNI: "SMD Jalan",
};
export const SYSTEM_TARGET_ORDER = [
  "SMD Jalan",
  "INVI-J",
  "InSlope",
  "InDrain",
] as const;

export function evaluateSubmissionReadiness(state: OperationalWorkflowState) {
  const { project, submission } = state;
  const requiredTargets = SYSTEM_TARGET_ORDER.filter(system =>
    project.surveyTypes.some(type => systemsByType[type] === system));
  const stagedReady = project.surveyTypes.length > 0 && project.surveyTypes.every(type =>
    stagedSurveyReviewMode(type, state.productionTests.PCI.pciManual !== false) === 'source-form'
      ? sourceInspectionStatus(project.id, type, 'staged', state.productionTests.PCI.pciManual !== false, project).complete
      : stagedFallbackReviewReady(state, type));
  const internalAudit = state.audits[0];
  const ready = stagedReady && requiredTargets.length > 0 &&
    SUBMISSION_DOCUMENTS.every(item => submission.requiredDocuments[item] === true) &&
    !!submission.rawFileName.trim() && !!submission.cleanedFileName.trim() &&
    evaluateLrsGate(submission, state.simulationDate).passed && fieldReadiness(state).length === 0 &&
    internalAudit?.status === 'Lulus' && !internalAudit.requiresReview;
  return { ready, requiredTargets };
}
