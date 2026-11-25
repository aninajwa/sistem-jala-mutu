import { test } from 'node:test';
import assert from 'node:assert/strict';
import { consistencyPreview, daysUntil, latestTestsByType, vervalActions, type VervalCycleRow, type VervalPackage, type VervalTest } from './vervalRules';

const PROVIDER = 'Penyedia Jasa / Ketua Tim';
const PIC = 'PIC Balai / Pengguna Jasa';
const testRow = (id: number, status: VervalTest['status']): VervalTest => ({
  konsistensi_id: id, jenis_survei_id: 1, jenis_kode: 'IRI', tim_id: 10, ruas_id: 2, sta_awal: 0, sta_akhir: 300,
  jumlah_ulangan: 3, status, rata_rata: 3, simpangan_baku: 0.1, kv_persen: 3, ulangan: [],
});
const cycle = (status: VervalCycleRow['status'], uji: VervalTest[] = [], extra: Partial<VervalCycleRow> = {}): VervalCycleRow => ({
  siklus_id: 1, siklus_ke: 1, periode_mulai: '2026-11-19', periode_selesai: '2026-12-02', jatuh_tempo: '2026-12-02', status, versi: 0,
  nomor_ba: null, catatan_review: null, panjang_km: 0.5, jumlah_sesi: 1, terlambat: false, koreksi_terbuka: 0, uji, ...extra,
});
const pkg = (siklus: VervalCycleRow[], boleh_buka = false): VervalPackage => ({
  paket_id: 3, tahap4: 'DRAFT', boleh_buka, alasan_tidak_boleh_buka: null, siklus,
  opsi: { jenis_survei: [{ jenis_survei_id: 1, kode: 'IRI', nama: 'IRI' }], tim: [], ruas: [], personel: [] },
});

test('consistency preview mirrors the server thresholds', () => {
  const iri = consistencyPreview([3.2, 3.25, 3.3], 'IRI');
  assert.equal(iri?.consistent, true);
  assert.equal(iri?.kv, 1.54);
  assert.equal(consistencyPreview([3, 4.5], 'IRI')?.consistent, false);
  assert.equal(consistencyPreview([70, 75, 78], 'PCI')?.consistent, true);
  assert.equal(consistencyPreview([3], 'IRI'), null);
});

test('the Penyedia opens, records and submits only when every survey type has a test', () => {
  const open = cycle('BERJALAN');
  assert.deepEqual(vervalActions(pkg([open], false), open, PROVIDER), ['record']);
  const tested = cycle('BERJALAN', [testRow(1, 'Konsisten')]);
  assert.deepEqual(vervalActions(pkg([tested]), tested, PROVIDER), ['record', 'submit']);
  assert.deepEqual(vervalActions(pkg([], true), null, PROVIDER), ['open']);
  const held = cycle('DITAHAN', [testRow(1, 'Tidak Konsisten')], { koreksi_terbuka: 1 });
  assert.deepEqual(vervalActions(pkg([held]), held, PROVIDER), ['record']);
});

test('the PIC only reviews submitted cycles', () => {
  const submitted = cycle('DIAJUKAN', [testRow(1, 'Konsisten')]);
  assert.deepEqual(vervalActions(pkg([submitted]), submitted, PIC), ['review']);
  assert.deepEqual(vervalActions(pkg([submitted]), submitted, PROVIDER), []);
  assert.deepEqual(vervalActions(pkg([cycle('BERJALAN')]), cycle('BERJALAN'), PIC), []);
});

test('the latest test per type decides and due dates count calendar days', () => {
  const row = cycle('BERJALAN', [testRow(1, 'Tidak Konsisten'), testRow(2, 'Konsisten')]);
  assert.equal(latestTestsByType(pkg([row]), row)[0].latest?.status, 'Konsisten');
  assert.equal(daysUntil('2026-12-02', new Date(2026, 10, 25)), 7);
  assert.equal(daysUntil('2026-11-20', new Date(2026, 10, 25)), -5);
});
