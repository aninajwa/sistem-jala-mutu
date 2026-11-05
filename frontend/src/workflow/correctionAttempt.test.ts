import test from 'node:test';
import assert from 'node:assert/strict';
import { resetCorrectionAttempt } from './correctionAttempt';

test('revised proposal cannot reuse old execution or retest references', () => {
  const prior = { status: 'Terbuka', retest: 'Gagal', executionReference: 'OLD-EXEC', retestReference: 'OLD-RETEST', retestFailureReason: 'Old failure' };
  const revised = { ...prior, ...resetCorrectionAttempt(), status: 'Menunggu Persetujuan' };
  assert.equal(revised.retest, 'Belum Diuji');
  assert.equal(revised.executionReference, undefined);
  assert.equal(revised.retestReference, undefined);
  assert.equal(revised.retestFailureReason, undefined);
});
