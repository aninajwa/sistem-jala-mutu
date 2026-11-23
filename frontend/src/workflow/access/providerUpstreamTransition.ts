import { applyCycleEdit } from '../cycleEdit';
import { applySubmissionEdit } from '../submissionEdit';
import { productionFailureKey, recordProductionFailure } from '../productionFailures';
import type { OperationalWorkflowState } from '../model';
import { invalidateDependentStages } from '../dependentStageInvalidation';
import { evaluateStageGate } from '../workflowGate';
import { switchPciMethod } from '../pciMethods';
import { recordDailyChange } from '../workflowRevisions';
import { matchesJournaledTransition } from './providerChecklistCascade';

const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function isProviderUpstreamTransition(before: OperationalWorkflowState, after: OperationalWorkflowState) {
  if (before.role !== 'Penyedia Jasa / Ketua Tim') return false;

  if (!equal(before.cycle, after.cycle) && evaluateStageGate(before, 'Tahap 2').readyToComplete) {
    const cycleKeys = [
      'selectedTypes', 'periodCompleted', 'checkedProtocols', 'iriCoefficientVariation',
      'pciAiStandardDeviation', 'pciManualMaxDifferencePercent', 'reRatingStatus', 'consistency', 'affectedTool',
    ] as const;
    const patch = Object.fromEntries(cycleKeys.filter(key => !equal(before.cycle[key], after.cycle[key]))
      .map(key => [key, after.cycle[key]]));
    const expected = applyCycleEdit(before, patch);
    if (expected !== before && matchesJournaledTransition(before, expected, after, [
      'Catat IRI CV verval', 'Catat Selisih PCI Manual (%) verval', 'Catat SD PCI AI verval',
      'Catat kesesuaian penilaian ulang', 'Checklist protokol verval',
      'Tandai akhir pemeriksaan periode', 'Identifikasi alat terkait HOLD',
    ], before.project.packageName)) return true;
  }

  if (!equal(before.submission, after.submission) && after.submission.validationStatus === 'Draft') {
    const inputKeys = [
      'routeChanged', 'routeLengthDeviation', 'geometryFormat', 'topologyErrors', 'rniValidatedDate',
      'stationingConsistent', 'coordinatesBoundToLrs', 'formatGlossaryCompliant', 'rawSeparated',
      'cleanedSeparated', 'rawFileName', 'cleanedFileName', 'videoLink', 'requiredDocuments',
    ] as const;
    const patch = Object.fromEntries(inputKeys.filter(key => !equal(before.submission[key], after.submission[key]))
      .map(key => [key, after.submission[key]]));
    if (Object.keys(patch).length) {
      const expected = applySubmissionEdit(before, patch);
      if (matchesJournaledTransition(before, expected, after, [
        'Catat perubahan trase', 'Ubah deviasi panjang', 'Pilih format geometri', 'Ubah hasil topologi',
        'Ubah tanggal validasi RNI', 'Validasi STA semua survei', 'Periksa koordinat dan ikatan LRS',
        'Periksa format kode & glossary', 'Konfirmasi pemisahan data sumber',
        'Konfirmasi pemisahan data tervalidasi', 'Catat referensi data sumber',
        'Catat referensi data tervalidasi', 'Catat referensi bukti visual', 'Periksa dokumen mutu',
      ], before.project.packageName)) return true;
    }
  }

  const daily = after.dailyRecords[0];
  if (daily && !equal(before.dailyRecords, after.dailyRecords) &&
      before.project.surveyTypes.includes(daily.surveyType) &&
      before.project.routes.includes(daily.road) &&
      daily.date && daily.date <= before.simulationDate &&
      evaluateStageGate(before, 'Tahap 2').readyToComplete) {
    const expected = recordDailyChange(before, daily);
    if (matchesJournaledTransition(before, expected, after, ['Catat survei harian'], daily.id)) return true;
  }

  for (const type of before.project.surveyTypes) {
    const key = productionFailureKey(before, type);
    const failure = after.productionFailures?.[key]?.at(-1);
    if (failure && !equal(before.productionFailures, after.productionFailures)) {
      const expected = recordProductionFailure(before, type, failure.reference, failure.methodReview);
      if (expected !== before && matchesJournaledTransition(before, expected, after, ['Catat kegagalan uji produksi'], key)) return true;
    }

    const checked = after.calibrationChecklist[type];
    if (typeof checked === 'boolean' && before.calibrationChecklist[type] !== checked) {
      const expected = {
        ...invalidateDependentStages(before, `Checklist kalibrasi ${type} berubah; validasi dan audit harus diperiksa kembali.`),
        calibrationChecklist: { ...before.calibrationChecklist, [type]: checked },
      };
      if (matchesJournaledTransition(before, expected, after, [`Checklist kalibrasi & validasi ${type}`], type)) return true;
    }

    const result = after.productionTests[type];
    if (!equal(before.productionTests[type], result)) {
      if (type === 'PCI' && (result.pciManual !== false) !== (before.productionTests.PCI.pciManual !== false)) {
        const manual = result.pciManual !== false;
        const expected = switchPciMethod(before, manual);
        if (matchesJournaledTransition(before, expected, after, ['Pilih metode PCI'], manual ? 'PCI Manual' : 'PCI AI')) return true;
        continue;
      }
      for (const [reason, action] of [
        [`Hasil uji ${type} berubah; validasi dan audit harus diulang.`, `Ubah uji produksi ${type}`],
        ['Hasil pencatatan berubah; validasi berikutnya perlu diperiksa ulang.', `Preview kalkulasi lokal ${type}`],
      ]) {
        const expected = {
          ...invalidateDependentStages(before, reason),
          productionTestDates: { ...before.productionTestDates, [type]: before.simulationDate },
          productionTests: { ...before.productionTests, [type]: result },
        };
        if (matchesJournaledTransition(before, expected, after, [action])) return true;
      }
    }
  }

  if (!equal(before.calibrations, after.calibrations)) {
    const changed = after.calibrations.filter(record =>
      !equal(before.calibrations.find(old => old.id === record.id), record));
    if (changed.length !== 1) return false;
    const [record] = changed;
    if (!record.surveyType || !before.project.surveyTypes.includes(record.surveyType)) return false;
    const existing = before.calibrations.some(old => old.id === record.id);
    const expected = {
      ...invalidateDependentStages(before, 'Data alat/personel berubah; kesiapan dan validasi produksi perlu diperiksa kembali.'),
      calibrations: existing ? before.calibrations.map(old => old.id === record.id ? record : old) : [...before.calibrations, record],
    };
    return matchesJournaledTransition(before, expected, after, [existing ? 'Perbarui penugasan alat & personel' : 'Tambah penugasan alat & personel']);
  }
  return false;
}
