import type {OperationalWorkflowState, SurveyType} from './model';
import {sourceDocument} from './sourceDocumentModel';

/**
 * Some survey types are covered by a dedicated V&V Bertahap source form, while
 * others (currently Lendutan) have no staged checklist in the retained source catalog.
 * A missing source document must never be fabricated merely to satisfy a gate.
 */
export function stagedSurveyReviewMode(type:SurveyType,pciManual=true):'source-form'|'generic-review' {
  return sourceDocument(type,'staged',pciManual)?'source-form':'generic-review';
}

export function stagedFallbackReviewReady(state:OperationalWorkflowState,type:SurveyType):boolean {
  return state.submission.stagedReviews?.[type]?.decision==='Sesuai';
}
