import assert from 'node:assert/strict';
import test from 'node:test';
import { parseReviewQueue, reviewQueueToBalaiItems, type ReviewQueueRow } from './serverReviewQueue';

const row = (over: Partial<ReviewQueueRow>): ReviewQueueRow => ({
  paket_id: 3, nama_paket: 'Paket Ujian', balai_id: 1, tahap: 'Tahap 0', jenis: 'Review persiapan', status: 'DIAJUKAN', ...over,
});
const balaiName = (id: number | null) => (id === 1 ? 'Balai DKI-Jabar' : 'Balai belum tercatat');

test('server statuses map onto the Dirah review vocabulary', () => {
  const items = reviewQueueToBalaiItems([
    row({ status: 'DIAJUKAN' }),
    row({ tahap: 'Tahap 1', jenis: 'Konfirmasi kalibrasi', status: 'PERLU_REVISI' }),
    row({ tahap: 'Tahap 2', jenis: 'Uji coba #7', status: 'DISETUJUI', uji_coba_id: 7 }),
    row({ tahap: 'Tahap 2', jenis: 'Uji coba #8', status: 'DRAFT', uji_coba_id: 8 }),
    row({ tahap: 'Tahap 1', jenis: 'Konfirmasi kalibrasi', status: 'BELUM_DIAJUKAN', paket_id: 5 }),
  ], balaiName);
  assert.deepEqual(items.map(item => item.status), ['Perlu Review', 'Perlu Perbaikan', 'Selesai/Lulus', 'Menunggu', 'Menunggu']);
});

test('review items carry package identity, Balai name and the stage selection', () => {
  const [item] = reviewQueueToBalaiItems([row({ tahap: 'Tahap 2', jenis: 'Uji coba #7', uji_coba_id: 7 })], balaiName);
  assert.equal(item.packageId, '3');
  assert.equal(item.packageName, 'Paket Ujian');
  assert.equal(item.balai, 'Balai DKI-Jabar');
  assert.equal(item.stage, 'Tahap 2');
  assert.equal(item.kind, 'Uji coba #7');
  assert.equal(item.selection, '/entry:Validasi produksi');
});

test('review item ids are unique per package, stage and trial', () => {
  const items = reviewQueueToBalaiItems([
    row({ tahap: 'Tahap 2', jenis: 'Uji coba #7', uji_coba_id: 7 }),
    row({ tahap: 'Tahap 2', jenis: 'Uji coba #8', uji_coba_id: 8 }),
    row({ paket_id: 5, tahap: 'Tahap 2', jenis: 'Uji coba #7', uji_coba_id: 7 }),
    row({}),
  ], balaiName);
  assert.equal(new Set(items.map(item => item.id)).size, 4);
});

test('parseReviewQueue accepts the server body and rejects malformed ones', () => {
  assert.deepEqual(parseReviewQueue({ data: [row({})], partial: true }), { rows: [row({})], partial: true });
  for (const body of [null, {}, { data: {} , partial: false }, { data: [{ paket_id: '3' }], partial: false }, { data: [row({ tahap: 'Tahap 9' as never })], partial: false }, { data: [], partial: 'no' }]) {
    assert.throws(() => parseReviewQueue(body), /Format antrean pemeriksaan tidak sesuai\./);
  }
});
