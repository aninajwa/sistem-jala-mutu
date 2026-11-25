import test from 'node:test';
import assert from 'node:assert/strict';
import { preparationDeadlineFromSpmk } from './preparationDeadline';

test('SPMK + 30 hari kalender, bukan 30 hari kerja', () => {
  assert.equal(preparationDeadlineFromSpmk('2026-11-12'), '2026-12-12');
});
test('melewati akhir bulan dan tahun', () => {
  assert.equal(preparationDeadlineFromSpmk('2026-12-15'), '2027-01-14');
});
test('tahun kabisat', () => {
  assert.equal(preparationDeadlineFromSpmk('2024-02-01'), '2024-03-02');
});
test('tanggal SPMK belum tersedia atau tidak valid tidak mengarang tenggat', () => {
  for (const input of ['', undefined, '2026-02-30', '2026/11/12', 'salah']) {
    assert.equal(preparationDeadlineFromSpmk(input), null);
  }
});
