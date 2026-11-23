import test from 'node:test';
import assert from 'node:assert/strict';
import { stage1IriDraftSchema } from './checklist';

test('Stage 1 draft schema accepts partial binary answers and 2000-character note limit', () => {
  assert.equal(stage1IriDraftSchema.safeParse({ template_id: 4, expected_version: 0, answers: [{ key: 'IRI-CAL-2.1', value: 'Ya', note: 'x'.repeat(2000) }] }).success, true);
});

test('Stage 1 draft schema rejects duplicate/foreign keys, evidence, protected fields and oversized notes', () => {
  const base = { template_id: 4, expected_version: 0, answers: [{ key: 'IRI-CAL-2.1', value: 'Ya', note: null }] };
  assert.equal(stage1IriDraftSchema.safeParse({ ...base, answers: [...base.answers, ...base.answers] }).success, false);
  assert.equal(stage1IriDraftSchema.safeParse({ ...base, answers: [{ key: 'IRI-VAL-6.1', value: 'Ya' }] }).success, false);
  assert.equal(stage1IriDraftSchema.safeParse({ ...base, answers: [{ ...base.answers[0], evidence_id: 3 }] }).success, false);
  assert.equal(stage1IriDraftSchema.safeParse({ ...base, status: 'DISETUJUI' }).success, false);
  assert.equal(stage1IriDraftSchema.safeParse({ ...base, answers: [{ key: 'IRI-CAL-2.1', value: 'Ya', note: 'x'.repeat(2001) }] }).success, false);
});
