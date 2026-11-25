import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_WORKFLOW } from '../model';
import { canOpenProductionCorrection, recordProductionFailure } from '../productionFailures';
import { applySubmissionEdit } from '../submissionEdit';
import { workflowMutationError } from './workflowMutationGuard';

test('first trial failure calls for a retest; two distinct attempts unlock one linked case', () => {
  const initial = structuredClone(INITIAL_WORKFLOW);
  initial.role = 'Penyedia Jasa / Ketua Tim';
  initial.productionTests.PCI.pciManual = false;
  const first = recordProductionFailure(initial, 'PCI', 'Uji-AI-01', 'Tinjau kamera dan pencahayaan');
  assert.notEqual(first, initial);
  assert.equal(workflowMutationError(initial, first, initial.role), undefined);
  assert.equal(canOpenProductionCorrection(first, 'PCI'), false);
  assert.equal(recordProductionFailure(first, 'PCI', 'uji-ai-01', 'Duplikat'), first);
  const second = recordProductionFailure(first, 'PCI', 'Uji-AI-02', 'Ulangi setelah koreksi orientasi kamera');
  assert.equal(canOpenProductionCorrection(second, 'PCI'), true);
  assert.equal(workflowMutationError(first, second, first.role), undefined);
  assert.ok(workflowMutationError(second, first, first.role));
  second.productionTests.PCI.pciManual = true;
  assert.equal(canOpenProductionCorrection(second, 'PCI'), false);
});

test('destination assignment at confirmation preserves internal audit; invalid submission is rejected', () => {
  const before = structuredClone(INITIAL_WORKFLOW);
  before.role = 'Penyedia Jasa / Ketua Tim';
  before.submission.targetSystems = [];
  before.submission.validationStatus = 'Draft';
  before.audits[0].status = 'Lulus';
  const after = applySubmissionEdit(before, {
    targetSystems: ['SMD Jalan'], validationStatus: 'VALID', validationMessage: 'Konfirmasi',
  });
  assert.equal(after.submission.validationStatus, 'VALID');
  assert.deepEqual(after.audits, before.audits);
  assert.match(workflowMutationError(before, after, before.role) ?? '', /Penyerahan tertahan/);
});

test('spatial input edit retains historical audit and blocks acceptance', () => {
  const before = structuredClone(INITIAL_WORKFLOW);
  before.role = 'Penyedia Jasa / Ketua Tim';
  before.audits[1].status = before.audits[2].status = 'Lulus';
  before.acceptance.finalAcceptance = true;
  before.submission.validationStatus = 'VALID';
  const after = applySubmissionEdit(before, { topologyErrors: 1 });
  assert.equal(after.submission.validationStatus, 'Draft');
  assert.equal(after.acceptance.finalAcceptance, false);
  assert.equal(after.audits[2].status, 'Lulus');
  assert.equal(after.audits[2].requiresReview, true);
  assert.equal(workflowMutationError(before, after, before.role), undefined);
  after.audits[2].decisionNote = 'Keputusan tidak sah';
  assert.ok(workflowMutationError(before, after, before.role));
});
