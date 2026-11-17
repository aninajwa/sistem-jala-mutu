import { evaluateProductionTest, type OperationalWorkflowState, type SurveyType } from './model';

export function productionFailureKey(state: OperationalWorkflowState, type: SurveyType) {
  if (type !== 'PCI') return type;
  return state.productionTests.PCI.pciManual === false ? 'PCI AI' : 'PCI Manual';
}

export function recordProductionFailure(
  state: OperationalWorkflowState, type: SurveyType, evidence: string, methodReview: string,
) {
  const key = productionFailureKey(state, type);
  const history = state.productionFailures?.[key] ?? [];
  const reference = evidence.trim();
  const note = methodReview.trim();
  if (state.role !== 'Penyedia Jasa / Ketua Tim' ||
      !state.project.surveyTypes.includes(type) || !reference || !note ||
      evaluateProductionTest(type, state.productionTests[type]).passed ||
      history.some(attempt => attempt.reference.toLowerCase() === reference.toLowerCase())) return state;
  return {
    ...state,
    productionFailures: {
      ...state.productionFailures,
      [key]: [...history, { reference, methodReview: note, date: state.simulationDate }],
    },
  };
}

export function canOpenProductionCorrection(state: OperationalWorkflowState, type: SurveyType) {
  const key = productionFailureKey(state, type);
  return !evaluateProductionTest(type, state.productionTests[type]).passed &&
    (state.productionFailures?.[key]?.length ?? 0) >= 2 &&
    !state.corrections.some(item =>
      item.source === 'Uji coba gagal' && item.surveyType === type && item.status !== 'Ditutup');
}
