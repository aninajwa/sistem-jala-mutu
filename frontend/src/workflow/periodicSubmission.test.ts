import { defaultCase } from './correctionDefaults';
import { canEditPeriodicProvider, periodicCoverage, submittedPeriodicRecords } from './periodicRecords';
import assert from 'node:assert/strict';
import test from 'node:test';
import { workflowMutationError } from './access/workflowMutationGuard';
import { CALIBRATION_REVIEW_SUBJECTS, calibrationSourceSignature } from './calibrationReview';
import { switchWorkflowCyclePeriod } from './cyclePeriodTransition';
import { createDemoWorkflow } from './demoScenario';
import { applyClosedCorrection } from './flowRules';
import { applyPeriodicFinding } from './periodicFinding';
import { canSubmitPeriodicResults, periodicRecords, periodicSubmissionBlockers, submitPeriodicResults } from './periodicSubmission';
import { sourceDocument, sourceDocumentKey } from './sourceDocumentModel';
import { recordDailyChange } from './workflowRevisions';
import { withCompleteDailyRecord } from './testing/dailyRecordFixture';
import { withProductionReferences } from './testing/productionFixture';
import { sourceFormFixture } from './testing/sourceFormFixture';

function fixture() {
  const state = withProductionReferences(createDemoWorkflow('complete'));
  state.role = 'Penyedia Jasa / Ketua Tim';
  state.project.surveyTypes = ['IRI', 'RNI'];
  state.project.surveyStartDate = '2027-05-01';
  state.project.surveyEndDate = '2027-05-23';
  state.activeCyclePeriod = 1;
  state.cycle.selectedTypes = [];
  state.cycle.periodCompleted = false;
  state.cycle.certificateId = '';
  state.cycle.surveyReviews = {};
  state.cycle.userReview = 'Belum Diperiksa';
  state.cycle.reviewPendingTypes = [];
  state.cycle.heldRecordIds = [];
  state.corrections = [];
  state.dailyRecords = state.dailyRecords.filter(record => record.surveyType === 'IRI').map(record => withCompleteDailyRecord({
    ...record, date: '2027-05-05',
  }));
  state.calibrations = state.project.surveyTypes.map(type => ({
    ...state.calibrations[0], id: `CAL-${type}`, surveyType: type,
    condition: 'Baik', qualificationValid: true, trainingVerified: true, dueDate: '2099-01-01',
  }));
  for (const type of state.project.surveyTypes) state.calibrationChecklist[type] = true;
  const answers = new Map<string, string>();
  for (const type of state.project.surveyTypes) {
    for (const phase of ['consistency', 'internal']) {
      const doc = sourceDocument(type, phase)!;
      answers.set(sourceDocumentKey(state.project.id, doc.id), JSON.stringify(sourceFormFixture(doc, state.project)));
    }
    const review = {
      result: 'Sesuai' as const,
      note: 'Kalibrasi diperiksa.',
      evidenceReference: 'BA-ALAT',
      reviewedAt: state.simulationDate,
      reviewer: 'PIC Balai / Pengguna Jasa' as const,
      sourceSignature: calibrationSourceSignature(state, type),
    };
    state.calibrationReviews = { ...state.calibrationReviews, [type]: {
      ...review, subject: 'Hasil kalibrasi',
      sections: Object.fromEntries(CALIBRATION_REVIEW_SUBJECTS.map(subject => [subject, review])),
    } };
  }
  return { state, answers };
}

test('penyerahan mengikat hanya rekaman layak di ruas, lingkup, dan periode paket', () => {
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null,
  } });
  try {
    const { state, answers } = fixture();
    for (const [key, value] of answers) storage.set(key, value);
    const valid = state.dailyRecords[0];
    state.dailyRecords.push(
      { ...valid, id: 'held', state: 'Ditahan' },
      { ...valid, id: 'retest', state: 'Survei Ulang' },
      { ...valid, id: 'stored-incomplete', dailyToolCheck: {} },
      { ...valid, id: 'next', date: '2027-05-23' },
      { ...valid, id: 'late', date: '2027-05-24' },
      { ...valid, id: 'other-road', road: 'Ruas di luar paket' },
      { ...valid, id: 'other-type', surveyType: 'PCI' },
    );
    assert.deepEqual(periodicRecords(state).eligible.map(record => record.id), [valid.id]);
    assert.deepEqual(periodicRecords(state).held.map(record => record.id), ['held']);
    assert.deepEqual(periodicRecords(state).incomplete.map(record => record.id), ['stored-incomplete']);
    assert.deepEqual(periodicSubmissionBlockers(state), []);
    const submitted = submitPeriodicResults(state);
    assert.equal(submitted.cycle.periodCompleted, true);
    assert.deepEqual(submitted.cycle.submittedRecordIds, [valid.id]);
    assert.deepEqual(submitted.cycle.selectedTypes, ['IRI']);
    assert.deepEqual(submitted.dailyRecords, state.dailyRecords);
    const legacy = { ...submitted, cycle: { ...submitted.cycle, submittedRecordIds: undefined } };
    assert.equal(canSubmitPeriodicResults(legacy), true);
    assert.deepEqual(submitPeriodicResults(legacy).cycle.submittedRecordIds, [valid.id]);
    assert.deepEqual(submitPeriodicResults(legacy).cycle.reviewPendingTypes, ['IRI']);
    const archived = { ...legacy, cycle: { ...legacy.cycle, certificateId: 'BA-ARSIP' } };
    assert.equal(canSubmitPeriodicResults(archived), false);
    assert.equal(submitPeriodicResults(archived), archived);
    const revisedArchive = recordDailyChange(archived, { ...valid, technicalData: { ...valid.technicalData, evidence: 'BUKTI-ARSIP-V2' } });
    assert.equal(revisedArchive.cycle.providerResubmissionRequired, true);
    assert.equal(revisedArchive.cycle.certificateId, 'BA-ARSIP');
    assert.deepEqual(submitPeriodicResults(revisedArchive).cycle.submittedRecordIds, [valid.id]);
    assert.equal(workflowMutationError(state, submitted, state.role), undefined);
    assert.ok(workflowMutationError(state, {
      ...submitted, cycle: { ...submitted.cycle, submittedRecordIds: ['held'] },
    }, state.role));
    const amended = recordDailyChange(submitted, { ...valid, technicalData: { ...valid.technicalData, evidence: 'BUKTI-BARU' } });
    assert.equal(amended.cycle.providerResubmissionRequired, true);
    assert.deepEqual(amended.cycle.reviewPendingTypes, ['IRI']);
    const resubmitted = submitPeriodicResults(amended);
    assert.equal(resubmitted.cycle.providerResubmissionRequired, false);
    assert.deepEqual(resubmitted.cycle.reviewPendingTypes, ['IRI']);
    assert.equal(workflowMutationError(amended, resubmitted, state.role), undefined);
    const balai = {
      ...submitted,
      role: 'PIC Balai / Pengguna Jasa' as const,
      cycle: { ...submitted.cycle, surveyReviews: {
        IRI: { decision: 'Belum Diperiksa' as const, note: 'Bukti perlu diperbaiki.', reviewedAt: '' },
      } },
    };
    const finding = applyPeriodicFinding(balai, 'IRI', 'KASUS-3B-P1');
    assert.equal(finding.corrections[0].cyclePeriod, 1);
    const verifiedCase = {
      ...finding.corrections[0],
      status: 'Verifikasi Ulang' as const, retest: 'Lulus' as const,
      evidence: 'BUKTI-KOREKSI', executionReference: 'SUMBER-V2', retestReference: 'UJI-ULANG',
      fieldDataValid: 'Tidak' as const,
      verification: { surveyor: true, teamLeader: true, balai: true },
    };
    const elsewhere = switchWorkflowCyclePeriod({ ...finding, corrections: [verifiedCase] }, 2);
    const closed = applyClosedCorrection(elsewhere, verifiedCase);
    assert.deepEqual(closed.cycle, elsewhere.cycle);
    assert.equal(closed.cycleHistory?.['1'].providerResubmissionRequired, true);
    const corrected = submitPeriodicResults({
      ...switchWorkflowCyclePeriod(closed, 1), role: 'Penyedia Jasa / Ketua Tim',
    });
    assert.equal(corrected.corrections.length, 1);
    assert.equal(corrected.corrections[0].id, 'KASUS-3B-P1');
    assert.equal(corrected.corrections[0].status, 'Ditutup');
    assert.equal(corrected.cycle.providerResubmissionRequired, false);
    const nextPeriod = switchWorkflowCyclePeriod(submitted, 2);
    assert.deepEqual(nextPeriod.cycleHistory?.['1'].submittedRecordIds, [valid.id]);
    assert.equal(nextPeriod.cycle.submittedRecordIds, undefined);
    assert.deepEqual(periodicRecords(nextPeriod).eligible.map(record => record.id), ['next']);
    assert.equal(submitPeriodicResults(nextPeriod), nextPeriod);
    const noRecords = { ...state, dailyRecords: state.dailyRecords.filter(record => record.id !== valid.id) };
    assert.equal(submitPeriodicResults(noRecords), noRecords);
    const balaiBeforeSubmission = { ...state, role: 'PIC Balai / Pengguna Jasa' as const };
    assert.equal(applyPeriodicFinding(balaiBeforeSubmission, 'IRI', 'finding'), balaiBeforeSubmission);
  } finally {
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

test('cakupan membedakan survei tanpa rekaman dan rekaman survei yang tidak layak', () => {
  const { state } = fixture();
  assert.deepEqual(periodicCoverage(state), [
    { type: 'IRI', recorded: 1, eligible: 1 },
    { type: 'RNI', recorded: 0, eligible: 0 },
  ]);
  state.dailyRecords.push({ ...state.dailyRecords[0], id: 'rni-held', surveyType: 'RNI', state: 'Ditahan' });
  assert.ok(periodicSubmissionBlockers(state).some(reason => reason.startsWith('RNI: ada rekaman')));
  assert.equal(submitPeriodicResults(state), state);
});

test('arsip kosong, parsial, atau campuran tidak membuat daftar rekaman dalam penyerahan', () => {
  const { state } = fixture();
  state.cycle.periodCompleted = true;
  const original = state.dailyRecords[0];
  state.dailyRecords.push({ ...original, id: 'rni', surveyType: 'RNI' });
  for (const ids of [undefined, [], [original.id], [original.id, 'rni', 'asing'], [original.id, original.id]]) {
    state.cycle.submittedRecordIds = ids;
    assert.deepEqual(submittedPeriodicRecords(state), { confirmed: false, records: [] });
  }
  state.cycle.submittedRecordIds = [original.id, 'rni'];
  state.dailyRecords.push({ ...original, id: 'baru' });
  assert.deepEqual(submittedPeriodicRecords(state).records.map(record => record.id), state.cycle.submittedRecordIds);
});

test('hak koreksi mengikuti persetujuan, revisi dan lingkup kasus', () => {
  const { state } = fixture();
  state.cycle.periodCompleted = true;
  state.cycle.submittedRecordIds = [state.dailyRecords[0].id];
  state.cycle.selectedTypes = ['IRI'];
  const correction = { ...defaultCase(state, 'kasus'), blockedStage: 'Verval 14 hari' as const, cyclePeriod: 1, surveyType: 'IRI' as const };
  const phases = [
    ['Terbuka', 'Draft', false],
    ['Menunggu Persetujuan', 'Diajukan', false],
    ['Terbuka', 'Perlu Revisi', false],
    ['Disetujui', 'Disetujui', true],
    ['Dilaksanakan', 'Disetujui', false],
    ['Verifikasi Ulang', 'Disetujui', false],
    ['Ditutup', 'Disetujui', false],
  ] as const;
  for (const [status, approval, editable] of phases) {
    state.corrections = [{ ...correction, status, approval }];
    assert.equal(canEditPeriodicProvider(state, 'IRI'), editable, status);
    assert.equal(canEditPeriodicProvider(state), editable, status);
    assert.equal(canEditPeriodicProvider(state, 'RNI'), false, status);
    assert.equal(canSubmitPeriodicResults(state), false, status);
  }
  state.corrections = [{ ...correction, status: 'Disetujui', approval: 'Disetujui', cyclePeriod: undefined }];
  assert.equal(canEditPeriodicProvider(state, 'IRI'), false, 'kasus lama tidak mengizinkan lintas periode');
  state.corrections = [{ ...correction, status: 'Terbuka', approval: 'Draft' }];
  state.cycle.providerResubmissionRequired = true;
  assert.ok(periodicSubmissionBlockers(state).some(reason => reason.includes('tindak lanjut')));
  assert.equal(submitPeriodicResults(state), state);
  state.corrections = [{ ...correction, status: 'Ditutup', approval: 'Disetujui' }];
  state.cycle.reviewPendingTypes = ['IRI'];
  assert.equal(canEditPeriodicProvider(state, 'IRI'), true);
  assert.equal(canEditPeriodicProvider(state, 'RNI'), false);
  assert.equal(canSubmitPeriodicResults(state), true);
});
