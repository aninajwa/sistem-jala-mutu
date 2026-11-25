import test from 'node:test';
import assert from 'node:assert/strict';
import { stage1ConfirmationReviewSchema, stage1ConfirmationSubmitSchema } from './stage1-confirmation';

test('confirmation submission requires only the current version token', () => {
  assert.equal(stage1ConfirmationSubmitSchema.safeParse({ expected_version: 0 }).success, true);
  assert.equal(stage1ConfirmationSubmitSchema.safeParse({ expected_version: 2, snapshot: {} }).success, false);
  assert.equal(stage1ConfirmationSubmitSchema.safeParse({ expected_version: -1 }).success, false);
});

test('PIC decision accepts only approved decisions and requires a note for correction', () => {
  assert.equal(stage1ConfirmationReviewSchema.safeParse({ expected_version: 1, keputusan: 'DISETUJUI' }).success, true);
  assert.equal(stage1ConfirmationReviewSchema.safeParse({ expected_version: 1, keputusan: 'PERLU_REVISI', catatan: 'Lengkapi catatan kalibrasi' }).success, true);
  assert.equal(stage1ConfirmationReviewSchema.safeParse({ expected_version: 1, keputusan: 'PERLU_REVISI', catatan: ' ' }).success, false);
  assert.equal(stage1ConfirmationReviewSchema.safeParse({ expected_version: 1, keputusan: 'YA' }).success, false);
});
