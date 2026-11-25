import assert from 'node:assert/strict';
import test from 'node:test';
import {
  packageScopeAmendmentReviewSchema,
  packageScopeAmendmentSubmitSchema,
} from './package-scope-amendment';

test('scope amendment request accepts several unique active-catalog IDs as one submission payload', () => {
  assert.deepEqual(packageScopeAmendmentSubmitSchema.parse({
    expected_scope_version: 4,
    jenis_survei_ids: [4, 2, 4],
  }), {
    expected_scope_version: 4,
    jenis_survei_ids: [2, 4],
  });
});

test('scope amendment schemas reject empty, protected, unknown, and invalid decisions', () => {
  for (const input of [
    { expected_scope_version: 0, jenis_survei_ids: [2] },
    { expected_scope_version: 1, jenis_survei_ids: [] },
    { expected_scope_version: 1, jenis_survei_ids: [0] },
    { expected_scope_version: 1, jenis_survei_ids: [2], status: 'DISETUJUI' },
  ]) assert.equal(packageScopeAmendmentSubmitSchema.safeParse(input).success, false);

  assert.equal(packageScopeAmendmentReviewSchema.safeParse({
    expected_version: 1, keputusan: 'DITOLAK', catatan: '   ',
  }).success, false);
  assert.equal(packageScopeAmendmentReviewSchema.safeParse({
    expected_version: 1, keputusan: 'DISETUJUI', catatan: null,
  }).success, true);
  assert.equal(packageScopeAmendmentReviewSchema.safeParse({
    expected_version: 1, keputusan: 'PERLU_REVISI', catatan: 'alasan',
  }).success, false);
});
