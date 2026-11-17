import assert from 'node:assert/strict';
import test from 'node:test';
import { INITIAL_WORKFLOW, PREPARATION_SOURCE_REVIEWS, type WorkflowRole } from '../model';
import { derivePackageStage } from '../packageStore';
import { retainDecisionHistory } from '../workflowRevisions';
import { applyPreparationCheck, PREPARATION_CHECKLIST_ACTION } from './providerChecklistCascade';
import { workflowMutationError } from './workflowMutationGuard';

const key = PREPARATION_SOURCE_REVIEWS[0];
const provider = 'Penyedia Jasa / Ketua Tim';
function fixture(role: WorkflowRole = provider) {
  const state = structuredClone(INITIAL_WORKFLOW);
  state.role = role;
  state.project.preparation.sourceReviews[key] = false;
  state.project.preparation.reportApproval = 'Draft';
  state.audits.forEach(audit => { audit.status = 'Lulus'; });
  state.acceptance.finalAcceptance = true;
  state.acceptance.acceptanceDecision = 'Diterima';
  return state;
}

for (const status of ['Draft', 'Perlu Revisi', 'Ditolak'] as const) {
  test(`Satu butir ${status} menghasilkan invalidasi dan jurnal yang persis`, () => {
    const before = fixture();
    before.project.preparation.reportApproval = status;
    const updated = applyPreparationCheck(before, 'sourceReviews', key, true);
    const after = retainDecisionHistory(before, updated);
    after.events = [{ id: 'uji', date: before.simulationDate, actor: provider,
      action: PREPARATION_CHECKLIST_ACTION, object: key }, ...before.events];
    assert.equal(workflowMutationError(before, after, provider), undefined);
    for (const level of [1, 2]) {
      assert.equal(after.audits[level].status, 'Lulus');
      assert.equal(after.audits[level].requiresReview, true);
      assert.equal(after.audits[level].history?.at(-1)?.status, 'Lulus');
    }
    assert.equal(after.acceptance.finalAcceptance, false);
    assert.equal(after.acceptance.acceptanceDecision, 'Belum Diperiksa');
    assert.equal(after.balaiDecisionHistory?.at(-1)?.previousDecision, 'Diterima');
    assert.equal(after.acceptance.finalAcceptanceBa, before.acceptance.finalAcceptanceBa);
    assert.ok(after.acceptance.terms.every(term => !term.complete));
    assert.equal(derivePackageStage(after), 'Tahap 0');
  });
}

test('Tolak perubahan ekstra, edit terkunci, dan invalidasi tanpa perubahan butir', () => {
  const before = fixture();
  const legitimate = applyPreparationCheck(before, 'sourceReviews', key, true);
  for (const mutate of [
    (s: typeof before) => { s.audits[2].decisionNote = 'Keputusan dipalsukan'; },
    (s: typeof before) => { s.acceptance.terms[0].complete = true; },
    (s: typeof before) => { s.submission.rawFileName = 'disisipkan'; },
    (s: typeof before) => { s.project.preparation.sourceReviews.unknown = true; },
    (s: typeof before) => { s.project.preparation.sourceReviews[PREPARATION_SOURCE_REVIEWS[1]] = false; },
    (s: typeof before) => { s.project.preparation.sourceReviews[key] = false; },
  ]) {
    const after = structuredClone(legitimate);
    mutate(after);
    assert.ok(workflowMutationError(before, after, provider));
  }
  for (const status of ['Diajukan', 'Disetujui'] as const) {
    const locked = fixture();
    locked.project.preparation.reportApproval = status;
    assert.equal(applyPreparationCheck(locked, 'sourceReviews', key, true), locked);
    const after = structuredClone(locked);
    after.project.preparation.sourceReviews[key] = true;
    assert.ok(workflowMutationError(locked, after, provider));
  }
  for (const role of ['PIC Balai / Pengguna Jasa', 'Direktorat / Pusat', 'Admin'] as const) {
    const locked = fixture(role);
    const after = structuredClone(locked);
    after.project.preparation.sourceReviews[key] = true;
    assert.ok(workflowMutationError(locked, after, role));
  }
});
