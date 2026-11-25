import test from 'node:test';
import assert from 'node:assert/strict';
import { serverAdminReviewRows } from './serverAdminMonitoring';

const pkg = (id: string) => ({ project: { id, packageName: `Paket ${id}`, balai: 'Balai A' } });
const status = (rows: ReturnType<typeof serverAdminReviewRows>, id: string, stage: string) => rows.find(r => r.packageId === id && r.stage === stage)?.status;

test('finished package shows every operational stage as Selesai/Lulus', () => {
  const rows = serverAdminReviewRows({ '3': pkg('3') }, { '3': { paket_id: 3, status_paket: 'SELESAI', tahap: 'Selesai', keterangan: 'Penerimaan akhir tercatat', tahap4: 'DISETUJUI' } });
  assert.deepEqual(['Tahap 0', 'Tahap 2', 'Tahap 3B', 'Tahap 4'].map(s => status(rows, '3', s)), ['Selesai/Lulus', 'Selesai/Lulus', 'Selesai/Lulus', 'Selesai/Lulus']);
});

test('current stage is in progress, earlier stages done, later stages wait', () => {
  const rows = serverAdminReviewRows({ '5': pkg('5') }, { '5': { paket_id: 5, status_paket: 'AKTIF', tahap: 'Tahap 2', keterangan: 'Validasi produksi' } });
  assert.equal(status(rows, '5', 'Tahap 0'), 'Selesai/Lulus');
  assert.equal(status(rows, '5', 'Tahap 2'), 'Menunggu');
  assert.match(rows.find(r => r.stage === 'Tahap 2')!.reason, /Validasi produksi/);
  assert.equal(status(rows, '5', 'Tahap 4'), 'Menunggu');
  assert.match(rows.find(r => r.stage === 'Tahap 4')!.reason, /tahap sebelumnya/);
});

test('Tahap 4 submission status maps to review and correction states', () => {
  const at4 = (tahap4: string) => serverAdminReviewRows({ '7': pkg('7') }, { '7': { paket_id: 7, status_paket: 'AKTIF', tahap: 'Tahap 4', keterangan: 'Gerbang RNI/LRS', tahap4 } });
  assert.equal(status(at4('DIAJUKAN'), '7', 'Tahap 4'), 'Perlu Review');
  assert.equal(status(at4('DITOLAK'), '7', 'Tahap 4'), 'Perlu Perbaikan');
  assert.equal(status(at4('DRAFT'), '7', 'Tahap 4'), 'Menunggu');
  assert.equal(status(at4('DRAFT'), '7', 'Tahap 3B'), 'Selesai/Lulus');
});

test('package without server stage facts produces no rows', () => {
  assert.equal(serverAdminReviewRows({ '9': pkg('9') }, {}).length, 0);
});
