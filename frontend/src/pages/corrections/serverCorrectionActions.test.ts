import assert from 'node:assert/strict';
import test from 'node:test';
import { availableCorrectionActions } from './serverCorrectionActions';
import type { CorrectionCase } from '../../workflow/model';

const P = 'Penyedia Jasa / Ketua Tim', B = 'PIC Balai / Pengguna Jasa', D = 'Direktorat / Pusat', A = 'Admin';
const base: CorrectionCase = {
  id: '1', source: 'x', blockedStage: 'Validasi produksi', road: 'r', stationing: '', rejectionReason: 'x', severity: 'Minor',
  owner: '', dueDate: '', rootCause: '', fieldDataValid: '', surveyType: 'IRI', actionType: '', evidence: '', originalValue: '',
  proposedValue: '', approval: 'Draft', retest: 'Belum Diuji', status: 'Terbuka', returnStage: '',
  verification: { surveyor: false, teamLeader: false, balai: false }, serverVersion: 1,
};
const at = (over: Partial<CorrectionCase>) => ({ ...base, ...over });

test('Penyedia edits and verifies in order while the case is open, then submits', () => {
  assert.deepEqual(availableCorrectionActions(base, P), ['edit', 'verify_surveyor']);
  const surveyed = at({ verification: { surveyor: true, teamLeader: false, balai: false } });
  assert.deepEqual(availableCorrectionActions(surveyed, P), ['edit', 'unverify_surveyor', 'verify_team_leader']);
  const ready = at({ verification: { surveyor: true, teamLeader: true, balai: false } });
  assert.deepEqual(availableCorrectionActions(ready, P), ['edit', 'unverify_team_leader', 'submit']);
  assert.deepEqual(availableCorrectionActions(base, B), []);
});

test('PIC verifies then decides a submitted proposal; nobody else can', () => {
  const submitted = at({ status: 'Menunggu Persetujuan', approval: 'Diajukan', verification: { surveyor: true, teamLeader: true, balai: false } });
  assert.deepEqual(availableCorrectionActions(submitted, B), ['verify_balai', 'revise']);
  const verified = at({ ...submitted, verification: { surveyor: true, teamLeader: true, balai: true } });
  assert.deepEqual(availableCorrectionActions(verified, B), ['approve', 'revise']);
  assert.deepEqual(availableCorrectionActions(verified, P), []);
  assert.deepEqual(availableCorrectionActions(verified, D), []);
});

test('execution is Penyedia only; retest and close follow the blocked stage owner', () => {
  assert.deepEqual(availableCorrectionActions(at({ status: 'Disetujui', approval: 'Disetujui' }), P), ['execute']);
  const executed = at({ status: 'Dilaksanakan', approval: 'Disetujui', executionReference: 'BA' });
  assert.deepEqual(availableCorrectionActions(executed, B), ['retest']);
  assert.deepEqual(availableCorrectionActions(executed, P), []);
  assert.deepEqual(availableCorrectionActions(at({ ...executed, blockedStage: 'Audit tingkat 1' }), P), ['retest']);
  assert.deepEqual(availableCorrectionActions(at({ ...executed, blockedStage: 'Audit tingkat 3' }), D), ['retest']);
  const passed = at({ ...executed, status: 'Verifikasi Ulang', retest: 'Lulus', retestReference: 'R', verification: { surveyor: true, teamLeader: true, balai: true } });
  assert.deepEqual(availableCorrectionActions(passed, B), ['retest', 'close']);
});

test('a failed retest returns editing to the Penyedia; closed cases and Admin have no actions', () => {
  const failed = at({ status: 'Verifikasi Ulang', retest: 'Gagal', approval: 'Disetujui', verification: { surveyor: true, teamLeader: true, balai: true } });
  assert.deepEqual(availableCorrectionActions(failed, P), ['edit', 'submit']);
  assert.deepEqual(availableCorrectionActions(at({ status: 'Ditutup' }), B), []);
  assert.deepEqual(availableCorrectionActions(base, A), []);
});
