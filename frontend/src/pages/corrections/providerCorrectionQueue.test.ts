import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import type { CorrectionCase } from '../../workflow/model';
import { providerCorrectionAction, sortProviderCorrections, type CorrectionRow } from './correctionViewModel';

const stub = (status: CorrectionCase['status'], extra: Partial<CorrectionCase> = {}): CorrectionCase => ({
  id: 'X', source: 'Validasi produksi', blockedStage: 'Validasi produksi', road: 'Ruas A',
  stationing: '', rejectionReason: 'Temuan', severity: 'Mayor', owner: '', dueDate: '',
  rootCause: '', fieldDataValid: '', surveyType: 'IRI', actionType: '', evidence: '',
  originalValue: '', proposedValue: '', approval: 'Draft', retest: 'Belum Diuji',
  status, returnStage: 'Validasi produksi', ...extra,
});

test('Penyedia mendapat aksi spesifik sesuai fase, bukan keputusan pemeriksa', () => {
  assert.equal(providerCorrectionAction(stub('Terbuka')).label, 'Lengkapi usulan');
  assert.equal(providerCorrectionAction(stub('Terbuka', { approval: 'Perlu Revisi' })).label, 'Revisi usulan');
  assert.equal(providerCorrectionAction(stub('Terbuka', { retest: 'Gagal' })).label, 'Perbaiki usulan');
  assert.equal(providerCorrectionAction(stub('Menunggu Persetujuan')).label, 'Lihat pengajuan');
  assert.equal(providerCorrectionAction(stub('Disetujui')).label, 'Catat pelaksanaan');
  assert.equal(providerCorrectionAction(stub('Dilaksanakan')).label, 'Lihat hasil tindakan');
  assert.equal(providerCorrectionAction(stub('Verifikasi Ulang')).label, 'Lihat hasil tindakan');
  assert.equal(providerCorrectionAction(stub('Ditutup')).label, 'Lihat riwayat');
});

test('Tugas disusun berdasarkan tenggat lalu severity tanpa mengubah array asli', () => {
  const rows = [
    { ...stub('Terbuka', { dueDate: '', severity: 'Kritis' }), key: 'a' },
    { ...stub('Terbuka', { dueDate: '2026-11-23', severity: 'Minor' }), key: 'b' },
    { ...stub('Terbuka', { dueDate: '2026-11-23', severity: 'Kritis' }), key: 'c' },
  ] as CorrectionRow[];
  assert.deepEqual(sortProviderCorrections(rows, 'Tugas Saya').map(r => r.key), ['c', 'b', 'a']);
  assert.equal(rows[0].key, 'a');
  assert.deepEqual(sortProviderCorrections(rows, 'Riwayat').map(r => r.key), ['a', 'b', 'c']);
});
