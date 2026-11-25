import { test } from 'node:test';
import assert from 'node:assert/strict';
import { acceptedPercent, auditGate, latestUploadBySurvey, sampleDeviation, terminGate, DIRECTORATE, PIC, PROVIDER, type AuditLevelRow, type AuditState, type PenerimaanState, type TerminRow } from './serverAuditData';

const level = (tingkat: 1 | 2 | 3, status: AuditLevelRow['status'], extra: Partial<AuditLevelRow> = {}): AuditLevelRow => ({
  audit_id: tingkat, tingkat, status, versi: 0, tanggal: null, persen_sampel_rencana: null, persen_sampel_realisasi: null,
  alasan_penolakan: null, detail: {}, sampel: [], koreksi_terbuka: 0, ...extra,
});
const audit = (rows: AuditLevelRow[], tahap4 = true): AuditState => ({ paket_id: 3, tahap4_disetujui: tahap4, tingkat: rows });

test('audit level 1 waits for Tahap 4 and belongs to the Penyedia', () => {
  const state = audit([level(1, 'Belum Dimulai'), level(2, 'Belum Dimulai'), level(3, 'Belum Dimulai')], false);
  assert.deepEqual(auditGate(state, 1, PROVIDER), { canEdit: false, canDecide: false, locked: 'Menunggu Tahap 4 disetujui PIC Balai.' });
  const ready = audit(state.tingkat);
  assert.equal(auditGate(ready, 1, PROVIDER).canEdit, true);
  assert.equal(auditGate(ready, 1, PIC).canEdit, false);
  assert.equal(auditGate(ready, 1, PROVIDER).canDecide, false);
});

test('higher audit levels wait for the previous level and for open corrections', () => {
  const state = audit([level(1, 'Lulus'), level(2, 'Ditolak', { koreksi_terbuka: 1 }), level(3, 'Belum Dimulai')]);
  assert.match(auditGate(state, 2, PIC).locked ?? '', /kasus koreksi terbuka/);
  assert.equal(auditGate(state, 2, PIC).canEdit, false);
  assert.equal(auditGate(state, 3, DIRECTORATE).locked, 'Menunggu Audit tingkat 2 Lulus.');
  const review = audit([level(1, 'Lulus'), level(2, 'Lulus'), level(3, 'Dalam Review')]);
  assert.deepEqual(auditGate(review, 3, DIRECTORATE), { canEdit: true, canDecide: true, locked: null });
  assert.equal(auditGate(review, 2, PIC).canEdit, false);
});

test('sample deviation is the absolute percentage difference', () => {
  assert.equal(sampleDeviation({ nilai_asli: 4, nilai_verifikasi: 4.5 }), 12.5);
  assert.equal(sampleDeviation({ nilai_asli: 0, nilai_verifikasi: 1 }), null);
});

test('latest upload per survey type wins', () => {
  const rows = latestUploadBySurvey({ sistem: [], jenis_survei: [{ jenis_survei_id: 1, nama: 'IRI' }, { jenis_survei_id: 2, nama: 'PCI' }], upload: [
    { upload_id: 1, jenis_survei_id: 1, sistem_id: 1, semester: 1, waktu_upload: '', jumlah_record: 1, status: 'ERROR', pesan: [] },
    { upload_id: 2, jenis_survei_id: 1, sistem_id: 1, semester: 1, waktu_upload: '', jumlah_record: 1, status: 'VALID', pesan: [] },
  ] });
  assert.equal(rows[0].latest?.status, 'VALID');
  assert.equal(rows[1].latest, null);
});

test('terms are accepted in order by the PIC, terms 3-4 after Audit 3', () => {
  const term = (nomor: 1 | 2 | 3 | 4, status: TerminRow['status'] = 'Belum'): TerminRow => ({ termin_id: nomor, nomor, persen_bobot: nomor <= 2 ? 30 : 20, batas_waktu: '', output_wajib: '', status, versi: 0 });
  const state: PenerimaanState = { paket_id: 3, audit3_lulus: false, termin: [term(1, 'Selesai'), term(2, 'Selesai'), term(3), term(4)], penerimaan: [], berita_acara: [] };
  assert.equal(acceptedPercent(state), 60);
  assert.deepEqual(terminGate(state, state.termin[2], PIC), { canRecord: false, reason: 'Menunggu Audit tingkat 3 Lulus.' });
  assert.equal(terminGate(state, state.termin[3], PIC).reason, 'Menunggu termin 3 diterima.');
  const passed = { ...state, audit3_lulus: true };
  assert.deepEqual(terminGate(passed, state.termin[2], PIC), { canRecord: true, reason: null });
  assert.equal(terminGate(passed, state.termin[2], PROVIDER).canRecord, false);
});
