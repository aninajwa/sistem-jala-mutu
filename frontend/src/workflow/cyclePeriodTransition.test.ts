import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_WORKFLOW } from './model';
import { switchWorkflowCyclePeriod } from './cyclePeriodTransition';
import { workflowMutationError } from './access/workflowMutationGuard';

const P = 'Penyedia Jasa / Ketua Tim' as const;
const fixture = () => ({ ...structuredClone(INITIAL_WORKFLOW), role: P });

test('Penyedia dapat beralih periode tanpa menghapus review Balai', () => {
  const before = fixture();
  before.cycle.userReview = 'Sesuai';
  before.cycle.certificateId = 'BA-UJI-RNI-P1';
  before.cycle.surveyReviews = { RNI: { decision: 'Sesuai', note: 'Dicek Balai', reviewedAt: '2026-11-12' } };
  const period2 = switchWorkflowCyclePeriod(before, 2);
  assert.equal(workflowMutationError(before, period2, P), undefined);
  assert.equal(period2.activeCyclePeriod, 2);
  assert.equal(period2.cycleHistory?.['1'].certificateId, 'BA-UJI-RNI-P1');
  assert.equal(period2.cycleHistory?.['1'].userReview, 'Sesuai');
  assert.equal(period2.cycle.certificateId, '');
  assert.equal(period2.cycle.userReview, 'Belum Diperiksa');
  assert.deepEqual(period2.cycle.surveyReviews, {});

  period2.cycle.certificateId = 'BA-UJI-RNI-P2';
  const restored = switchWorkflowCyclePeriod(period2, 1);
  assert.equal(workflowMutationError(period2, restored, P), undefined);
  assert.equal(restored.cycle.certificateId, 'BA-UJI-RNI-P1');
  assert.equal(restored.cycleHistory?.['2'].certificateId, 'BA-UJI-RNI-P2');
});

test('Penyedia tidak dapat memalsukan keputusan Balai saat perpindahan periode', () => {
  const before = fixture();
  before.cycle.userReview = 'Sesuai';
  const valid = switchWorkflowCyclePeriod(before, 2);
  const forged = structuredClone(valid);
  forged.cycleHistory!['1'].userReview = 'Temuan';
  assert.ok(workflowMutationError(before, forged, P));
  const direct = structuredClone(before);
  direct.cycle.userReview = 'Temuan';
  assert.ok(workflowMutationError(before, direct, P));
});

test('Periode aktif mengikuti data paket, bukan pilihan UI yang belum tersimpan', () => {
  const before = fixture();
  assert.equal(before.activeCyclePeriod ?? 1, 1);
  assert.equal(switchWorkflowCyclePeriod(before, 1), before);
  assert.equal(switchWorkflowCyclePeriod(before, 0), before);
});
