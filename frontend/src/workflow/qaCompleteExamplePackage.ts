/**
 * Satu paket DEMO end-to-end. Data sintetis saja; seluruh navigasi,
 * tahapan, pemeriksaan, dan role memakai engine workflow operasional.
 * File ini tidak dipakai sebagai sumber persetujuan resmi / API.
 */
import { createDemoWorkflow } from './demoScenario';
import type { OperationalWorkflowState } from './model';

export const QA_EXAMPLE_PACKAGE_ID = 'PAKET-QA-45-LOKAL';

export function buildCompleteExamplePackage(): OperationalWorkflowState {
  const state = createDemoWorkflow('complete');
  state.project = {
    ...state.project,
    id: QA_EXAMPLE_PACKAGE_ID,
    packageName: 'Paket Contoh QA/QC — Alur Lengkap Tahap 0–6',
  };

  // Rekaman dummy kalibrasi yang mencakup semua jenis survei paket.
  const reference = state.calibrations[0];
  for (const surveyType of state.project.surveyTypes) {
    if (reference && !state.calibrations.some(row => row.surveyType === surveyType)) {
      state.calibrations.push({
        ...reference,
        id: `QA-CAL-${surveyType.replace(/[^a-z0-9]/gi, '-')}`,
        surveyType,
        equipment: `Peralatan contoh ${surveyType}`,
        serialNumber: `QA-${surveyType.replace(/[^a-z0-9]/gi, '-')}-001`,
        certificateReference: `QA-CERT-${surveyType.replace(/[^a-z0-9]/gi, '-')}`,
      });
    }
    state.calibrationChecklist[surveyType] = true;
  }
  for (const record of state.calibrations) {
    record.condition = 'Baik';
    record.qualificationValid = true;
    record.trainingVerified = true;
    record.dueDate = '2028-12-31';
  }

  // Referensi contoh mengikuti relasi termin dalam generator penerimaan.
  state.acceptance.partialReceipts = ['T1', 'T2', 'T3', 'T4']
    .map(id => `BA penerimaan ${id}`);
  state.acceptance.terms = state.acceptance.terms.map(term => ({
    ...term,
    complete: true,
    progress: 100,
  }));
  state.events = [];
  return state;
}
