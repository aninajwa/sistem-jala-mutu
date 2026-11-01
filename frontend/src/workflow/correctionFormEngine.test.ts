import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { resolveCorrectionForm, validateCorrectionExecutionFields } from './correctionFormEngine';
import type { CorrectionCase } from './model';
const caseFor = (actionType: string, surveyType: CorrectionCase['surveyType'] = 'IRI'): CorrectionCase => ({
  id: 'CASE-TEST', actionType, surveyType, source: 'Verval 14 hari', blockedStage: 'Verval 14 hari',
  rejectionReason: 'Bukti belum memenuhi',
} as CorrectionCase);
const cases = [
  ['Survei ulang sebagian ruas', 'coverage'],
  ['Penilaian ulang (re-rating)', 'comparison'],
  ['Ambil ulang foto/video', 'mediaReference'],
  ['Pelatihan ulang personel', 'trainingEvaluation'],
  ['Kalibrasi ulang alat', 'calibrationEvidence'],
  ['Penggantian komponen alat', 'postReplacement'],
  ['Penggantian personel', 'competence'],
  ['Koreksi pemrosesan dengan bukti', 'rawReference'],
  ['Investigasi keterlambatan dan rencana tindak lanjut', 'investigation'],
];
for (const [action, field] of cases) {
  test(`resolver ${action}`, () => {
    const result = resolveCorrectionForm(caseFor(action));
    assert.ok(result.fields.some(f => f.id === field));
    assert.ok(validateCorrectionExecutionFields(result, {}).length > 0);
    assert.deepEqual(validateCorrectionExecutionFields(result, Object.fromEntries(result.fields.map(f => [f.id, 'Dokumen uji']))), []);
  });
}
test('Lendutan does not receive IRI context', () => {
  const result = resolveCorrectionForm(caseFor('Kalibrasi ulang alat', 'Lendutan'));
  assert.match(result.surveyContext, /FWD\/BB\/LWD/);
  assert.doesNotMatch(result.surveyContext, /raw IRI/);
});
