import type { OperationalWorkflowState } from './model';
/** Prasyarat memulai review, berbeda dari persyaratan VALID untuk penerimaan akhir. */
export function auditReviewEligibility(state: OperationalWorkflowState, level: 1 | 2 | 3, packagePrepared: boolean) {
  const previous = level === 1 ||
    (state.audits[level - 2].status === 'Lulus' && !state.audits[level - 2].requiresReview);
  const handover = level === 1 || state.submission.validationStatus === 'VALID' ||
    !!state.submission.reviewHandoverReference?.trim();
  return { previous, handover, canStart: packagePrepared && previous && handover };
}
