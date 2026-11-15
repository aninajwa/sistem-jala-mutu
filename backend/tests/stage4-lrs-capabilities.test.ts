import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stage4LrsCapabilities, stage4LrsRpcEnabled } from '../src/routes/stage4-lrs';

test('Stage 4 LRS feature flag is exact opt-in and remains disabled for unset/non-true values', () => {
  for (const value of [undefined, '', 'false', 'TRUE', '1']) {
    assert.equal(stage4LrsRpcEnabled(value), false);
    assert.deepEqual(stage4LrsCapabilities(false), {
      read: false, write: false,
      reason: 'Stage 4 LRS dinonaktifkan oleh feature gate; aktifkan hanya setelah readback berotorisasi diverifikasi di QA.',
    });
  }
  assert.equal(stage4LrsRpcEnabled('true'), true);
  assert.deepEqual(stage4LrsCapabilities(true), { read: true, write: true, reason: null });
});
