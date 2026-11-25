import assert from 'node:assert/strict';
import test from 'node:test';
import { attachServerCorrections, serverCaseToCorrection } from './serverCorrectionAdapter';
import type { ServerCorrectionCase } from './serverCorrectionData';
import type { OperationalWorkflowState } from '../../workflow/model';

const detail = {
  source: 'Validasi sistem', blocked_stage: 'Validasi produksi', road: 'Ruas A', stationing: '0+000',
  rejection_reason: 'Nilai IRI menyimpang', severity: 'Minor', owner: 'Penyedia Jasa', due_date: '2026-12-31',
  survey_type: 'IRI', root_cause: 'Alat', field_data_valid: 'Tidak', action_type: 'Kalibrasi ulang alat',
  evidence: 'Laporan', original_value: '', proposed_value: '', return_stage: '', approval: 'Diajukan', retest: 'Belum Diuji',
  verification_surveyor: true, verification_team_leader: true, verification_balai: false,
  review_note: null, execution_reference: null, retest_reference: null, rule_checks: { a: true },
};
const serverCase = (over: Partial<ServerCorrectionCase> = {}): ServerCorrectionCase => ({
  packageId: '3', correctionId: 7, caseId: 5, status: 'Menunggu Persetujuan', version: 4, severity: 'Minor',
  description: 'Nilai IRI menyimpang', source: 'Validasi sistem', road: 'Ruas A',
  data: { kasus_id: 5, status: 'Menunggu Persetujuan', detail }, ...over,
});

test('server case maps onto the Dirah CorrectionCase with status, verification and version from the server', () => {
  const c = serverCaseToCorrection(serverCase());
  assert.equal(c.id, '7');
  assert.equal(c.status, 'Menunggu Persetujuan');
  assert.equal(c.approval, 'Diajukan');
  assert.equal(c.surveyType, 'IRI');
  assert.equal(c.blockedStage, 'Validasi produksi');
  assert.equal(c.rejectionReason, 'Nilai IRI menyimpang');
  assert.equal(c.actionType, 'Kalibrasi ulang alat');
  assert.deepEqual(c.verification, { surveyor: true, teamLeader: true, balai: false });
  assert.deepEqual(c.ruleChecks, { a: true });
  assert.equal(c.executionReference, undefined);
  assert.equal(c.serverVersion, 4);
});

test('cases without a detail payload keep safe defaults instead of throwing', () => {
  const c = serverCaseToCorrection(serverCase({ data: { kasus_id: 5, status: 'Terbuka' }, status: 'Terbuka' }));
  assert.equal(c.status, 'Terbuka');
  assert.equal(c.approval, 'Draft');
  assert.equal(c.retest, 'Belum Diuji');
  assert.equal(c.severity, 'Minor');
  assert.deepEqual(c.verification, { surveyor: false, teamLeader: false, balai: false });
});

test('attachServerCorrections puts each case into its package and leaves other packages empty', () => {
  const pkg = (id: string) => ({ project: { id }, corrections: [{ id: 'demo' }] }) as unknown as OperationalWorkflowState;
  const out = attachServerCorrections({ '3': pkg('3'), '5': pkg('5') }, [serverCase(), serverCase({ correctionId: 8 })]);
  assert.deepEqual(out['3'].corrections.map(c => c.id), ['7', '8']);
  assert.deepEqual(out['5'].corrections, []);
});
