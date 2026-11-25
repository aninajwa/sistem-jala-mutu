import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDemoWorkflow } from '../../workflow/demoScenario';
import { directorateAuditRows } from '../../workflow/monitoringProjection';
import { attachServerAuditFacts, attachVervalReviews } from './serverDirectorateAudit';

const base = (id: string) => { const state = createDemoWorkflow('start'); state.project.id = id; return state; };
const stage = (paket_id: number, audit: Record<string, string>, tahap4 = 'DISETUJUI', alasan: string | null = null) =>
  ({ paket_id, status_paket: 'DRAFT', tahap: 'Tahap 5', keterangan: '', tahap4, audit, alasan_audit3: alasan, koreksi_terbuka: 0 });

test('server audit facts drive the Direktorat queue buckets', () => {
  const packages = { 3: base('3'), 4: base('4'), 5: base('5'), 6: base('6') };
  const rows = directorateAuditRows(attachServerAuditFacts(packages, {
    3: stage(3, { 1: 'Lulus', 2: 'Lulus', 3: 'Belum Dimulai' }),
    4: stage(4, { 1: 'Lulus', 2: 'Lulus', 3: 'Lulus' }),
    5: stage(5, { 1: 'Lulus', 2: 'Lulus', 3: 'Ditolak' }, 'DISETUJUI', 'Selisih IRI > 10%'),
    6: stage(6, { 1: 'Lulus' }, 'DISETUJUI'),
  }));
  const bucket = (id: string) => rows.find(row => row.state.project.id === id)!;
  assert.equal(bucket('3').status, 'siap');
  assert.equal(bucket('4').status, 'riwayat');
  assert.equal(bucket('5').status, 'tertahan');
  assert.equal(bucket('5').reason, 'Selisih IRI > 10%');
  assert.equal(bucket('6').status, 'tertahan');
});

test('without server facts the packages are returned unchanged', () => {
  const packages = { 3: base('3') };
  assert.equal(attachServerAuditFacts(packages, null), packages);
});

test('server sessions become recorded daily records and a finished package counts as accepted', () => {
  const packages = { 3: base('3') };
  const out = attachServerAuditFacts(packages, { 3: { ...stage(3, { 1: 'Lulus', 2: 'Lulus', 3: 'Lulus' }), tahap: 'Selesai',
    sesi: [{ sesi_id: 2, tanggal: '2026-11-19', jam_mulai: '08:00:00', jenis_kode: 'IRI', ruas: '001 Ruas Uji', panjang_km: 0.5, lajur: 'L1', arah: 'Normal', cuaca: 'Cerah' }] } });
  assert.equal(out[3].dailyRecords.length, 1);
  assert.equal(out[3].dailyRecords[0].date, '2026-11-19');
  assert.equal(out[3].dailyRecords[0].state, 'Tercatat');
  assert.equal(out[3].acceptance.finalAcceptance, true);
});

test('the latest PIC verval decision becomes the per-survey review result', () => {
  const pkg = base('3'); pkg.project.surveyTypes = [];
  const out = attachVervalReviews({ 3: pkg }, { 3: [
    { siklus_ke: 1, status: 'DITERIMA', catatan_review: null, direview_pada: '2026-11-25T03:00:00Z', nomor_ba: 'BA-1', uji: [{ jenis_kode: 'IRI' }] },
    { siklus_ke: 2, status: 'PERLU_PERBAIKAN', catatan_review: 'Ulangi uji', direview_pada: '2026-11-26T03:00:00Z', nomor_ba: 'BA-2', uji: [{ jenis_kode: 'IRI' }] },
    { siklus_ke: 3, status: 'BERJALAN', catatan_review: null, direview_pada: null, nomor_ba: null, uji: [] },
  ] });
  assert.deepEqual(out[3].cycle.surveyReviews?.IRI, { decision: 'Temuan', reviewedAt: '2026-11-26', note: 'Ulangi uji' });
  assert.equal(out[3].activeCyclePeriod, 2);
  assert.deepEqual(out[3].project.surveyTypes, ['IRI']);
});
