import type { OperationalWorkflowState, SurveyType } from './model';
import { periodicSurveyTypes } from './reviewReadiness';
import { evaluateDailySurvey } from './surveyStandards';
import { periodRange } from './stages/periodSchedule';

function recordsInScope(state: OperationalWorkflowState, types = periodicSurveyTypes(state)) {
  const { start, end } = periodRange(state.project.id, state.activeCyclePeriod ?? 1,
    state.project.surveyStartDate, state.project.surveyEndDate);
  return state.dailyRecords.filter(record => start && end && record.date >= start && record.date <= end &&
    types.includes(record.surveyType) && state.project.routes.includes(record.road));
}

export function periodicRecords(state: OperationalWorkflowState, types = periodicSurveyTypes(state)) {
  const records = recordsInScope(state, types);
  const heldIds = new Set(state.cycle.heldRecordIds);
  const held = records.filter(record => record.state === 'Ditahan' || heldIds.has(record.id));
  const eligible = [];
  const incomplete = [];
  for (const record of records) {
    if (record.state !== 'Tercatat' || heldIds.has(record.id)) continue;
    const errors = evaluateDailySurvey({
      ...record,
      dailyToolCheck: record.dailyToolCheck ?? {},
      operator: record.operator ?? '',
      rawValue: record.rawValue ?? '',
      lane: record.lane ?? '',
      driver: record.driver ?? '',
    });
    const wrongPciMethod = record.surveyType === 'PCI' &&
      record.technicalData?.pciMethod !== (state.productionTests.PCI.pciManual === false ? 'AI' : 'Manual');
    if (errors.length || wrongPciMethod) incomplete.push(record);
    else eligible.push(record);
  }
  return { records, held, eligible, incomplete };
}

export function periodicHandoverTypes(state: OperationalWorkflowState) {
  const types = periodicSurveyTypes(state);
  if (!state.cycle.providerResubmissionRequired) return types;
  return [...new Set([...types, ...(state.cycle.reviewPendingTypes ?? []).filter(type => state.project.surveyTypes.includes(type))])];
}

export function periodicCoverage(state: OperationalWorkflowState) {
  const types = periodicHandoverTypes(state);
  const { records, eligible } = periodicRecords(state, types);
  return types.map(type => ({
    type,
    recorded: records.filter(record => record.surveyType === type).length,
    eligible: eligible.filter(record => record.surveyType === type).length,
  }));
}

export function submittedPeriodicRecords(state: OperationalWorkflowState) {
  const ids = state.cycle.submittedRecordIds;
  if (!state.cycle.periodCompleted || !ids?.length) return { confirmed: false, records: [] };
  const membership = new Set(ids);
  const submitted = recordsInScope(state).filter(record => membership.has(record.id));
  const types = new Set(submitted.map(record => record.surveyType));
  const confirmed = membership.size === ids.length && new Set(submitted.map(record => record.id)).size === ids.length &&
    submitted.length === ids.length &&
    periodicSurveyTypes(state).every(type => types.has(type));
  return { confirmed, records: confirmed ? submitted : [] };
}

export function periodicCorrections(state: OperationalWorkflowState) {
  return state.corrections.filter(item =>
    (item.blockedStage === 'Verval 14 hari' || ['Konsistensi gagal', 'Temuan proses verval'].includes(item.source)) &&
    (item.cyclePeriod === undefined || item.cyclePeriod === (state.activeCyclePeriod ?? 1)));
}

export function canEditPeriodicProvider(state: OperationalWorkflowState, type?: SurveyType) {
  if (state.role !== 'Penyedia Jasa / Ketua Tim' || type && !state.project.surveyTypes.includes(type)) return false;
  if (!state.cycle.periodCompleted) return true;
  const cases = periodicCorrections(state).filter(item => !type || item.surveyType === type);
  const approvedForExecution = (item: typeof cases[number]) => item.cyclePeriod !== undefined &&
    item.status === 'Disetujui' && item.approval === 'Disetujui';
  if (cases.some(item => item.status !== 'Ditutup' && !approvedForExecution(item))) return false;
  if (cases.some(approvedForExecution)) return true;
  if (!state.cycle.certificateId && !submittedPeriodicRecords(state).confirmed) return true;
  return !!state.cycle.providerResubmissionRequired &&
    (!type || !!state.cycle.reviewPendingTypes?.includes(type));
}
