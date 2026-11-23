import { applyCycleEdit } from './cycleEdit';
import { CYCLE_PROTOCOLS, CYCLE_SHARED_PROTOCOLS, type OperationalWorkflowState } from './model';
import { periodSourceReady } from './periodicDecision';
import { periodicCorrections, periodicCoverage, periodicHandoverTypes, periodicRecords, submittedPeriodicRecords } from './periodicRecords';
import { evaluateStageGate } from './workflowGate';

export { periodicRecords } from './periodicRecords';

export const PERIOD_SUBMISSION_ACTION = 'Serahkan hasil periode kepada Balai';

export function periodicSubmissionBlockers(state: OperationalWorkflowState) {
  const coverage = periodicCoverage(state);
  const types = coverage.filter(entry => entry.recorded > 0).map(entry => entry.type);
  const { cycle } = state;
  const errors = [...evaluateStageGate(state, 'Tahap 2').blockers];
  if (!coverage.some(entry => entry.eligible > 0)) errors.push('Belum ada rekaman Tahap 3A yang dapat diserahkan pada periode ini.');
  for (const entry of coverage) {
    if (entry.recorded && !entry.eligible) errors.push(`${entry.type}: ada rekaman periode, tetapi belum ada yang layak diserahkan.`);
  }
  for (const type of types) {
    if (!periodSourceReady(state, type, 'consistency')) errors.push(`${type}: lengkapi Konsistensi.`);
    if (!periodSourceReady(state, type, 'internal')) errors.push(`${type}: lengkapi V&V Internal.`);
  }
  const protocols = [...types.flatMap(type => CYCLE_PROTOCOLS[type].map(label => `${type} · ${label}`)), ...CYCLE_SHARED_PROTOCOLS];
  if (protocols.some(label => !cycle.checkedProtocols[label])) errors.push('Lengkapi pemeriksaan pelaksanaan periode.');
  const pciAi = state.productionTests.PCI.pciManual === false;
  const pci = pciAi ? cycle.pciAiStandardDeviation : cycle.pciManualMaxDifferencePercent;
  if (cycle.reRatingStatus !== 'Sesuai' ||
      types.includes('IRI') && !withinLimit(cycle.iriCoefficientVariation, 5) ||
      types.includes('PCI') && !withinLimit(pci, pciAi ? 8 : 10)) {
    errors.push('Tuntaskan pemeriksaan konsistensi.');
  }
  if (periodicCorrections(state).some(item => item.status !== 'Ditutup')) {
    errors.push('Selesaikan tindak lanjut temuan periode.');
  }
  return errors;
}

function withinLimit(value: number | null | undefined, limit: number) {
  return value != null && Number.isFinite(value) && value >= 0 && value <= limit;
}

export function canSubmitPeriodicResults(state: OperationalWorkflowState) {
  const { cycle } = state;
  return !cycle.periodCompleted || cycle.providerResubmissionRequired ||
    (!cycle.certificateId && !submittedPeriodicRecords(state).confirmed);
}

export function submitPeriodicResults(state: OperationalWorkflowState) {
  if (state.role !== 'Penyedia Jasa / Ketua Tim' ||
      !canSubmitPeriodicResults(state) ||
      periodicSubmissionBlockers(state).length) return state;
  const { eligible } = periodicRecords(state, periodicHandoverTypes(state));
  const selectedTypes = periodicCoverage(state).filter(entry => entry.eligible > 0).map(entry => entry.type);
  const pending = state.cycle.periodCompleted
    ? selectedTypes.filter(type => !submittedPeriodicRecords(state).confirmed || state.cycle.reviewPendingTypes?.includes(type) ||
        state.cycle.surveyReviews?.[type]?.decision === 'Temuan')
    : [];
  return applyCycleEdit(state, {
    periodCompleted: true,
    selectedTypes,
    providerResubmissionRequired: false,
    submittedRecordIds: eligible.map(record => record.id),
    userReview: 'Belum Diperiksa',
    reviewPendingTypes: pending,
  });
}
