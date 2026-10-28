import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCalibrationPayload,
  buildNewEquipmentPayload,
  buildSurveyTeamPayload,
  calibrationSummary,
  canManageCalibration,
  serverRows,
  validateCalibrationCertificate,
  type ServerCalibration,
  type ServerSurveyTeam,
} from './serverCalibration';

const teams: ServerSurveyTeam[] = [
  { tim_id: 1, paket_id: 8, jenis_survei_id: 2, nama_tim: 'Tim IRI', jenis_survei: { kode: 'IRI', nama: 'IRI' } },
];

const calibrations: ServerCalibration[] = [
  { kalibrasi_id: 1, paket_id: 8, alat_id: 10, jenis: 'REFERENSI', standar: 'Standar A', komponen: 'Sensor', tgl_kalibrasi: '2026-10-27', berlaku_sd: null, pelaksana: 'Makmal A', dokumen_id: 20, status: 'DRAFT', created_by: 3, versi: 1, updated_at: '2026-10-27T00:00:00Z', dokumen: { dokumen_id: 20, judul: 'Sijil', versi_aktif: 1 } },
  { kalibrasi_id: 2, paket_id: 8, alat_id: 11, jenis: 'RELATIF', standar: 'Standar B', komponen: 'Kamera', tgl_kalibrasi: '2026-10-27', berlaku_sd: '2027-10-27', pelaksana: 'Makmal B', dokumen_id: null, status: 'DRAFT', created_by: 3, versi: 1, updated_at: '2026-10-27T00:00:00Z', dokumen: null },
];

test('server rows only accepts an array response', () => {
  assert.deepEqual(serverRows<ServerSurveyTeam>(teams, 'tim survei'), teams);
  assert.throws(() => serverRows({}, 'tim survei'), /Respons tim survei tidak sesuai/);
});

test('calibration summary counts server records without inventing readiness', () => {
  assert.deepEqual(calibrationSummary(teams, calibrations), {
    teams: 1,
    calibrations: 2,
    certificates: 1,
    drafts: 2,
  });
});

test('only provider with approved preparation may manage calibration', () => {
  assert.equal(canManageCalibration('Penyedia Jasa / Ketua Tim', 'DISETUJUI'), true);
  assert.equal(canManageCalibration('Penyedia Jasa / Ketua Tim', 'DIAJUKAN'), false);
  assert.equal(canManageCalibration('PIC Balai / Pengguna Jasa', 'DISETUJUI'), false);
});

test('survey team payload uses numeric references and trims the team name', () => {
  assert.deepEqual(buildSurveyTeamPayload({
    penyedia_id: '3',
    jenis_survei_id: '2',
    nama_tim: '  Tim Survei Paket 8  ',
  }), {
    penyedia_id: 3,
    jenis_survei_id: 2,
    nama_tim: 'Tim Survei Paket 8',
  });
});

test('survey team payload rejects missing references and an empty name', () => {
  assert.throws(() => buildSurveyTeamPayload({ penyedia_id: '', jenis_survei_id: '2', nama_tim: 'Tim' }), /Penyedia Jasa wajib dipilih/);
  assert.throws(() => buildSurveyTeamPayload({ penyedia_id: '3', jenis_survei_id: '', nama_tim: 'Tim' }), /Jenis survei wajib dipilih/);
  assert.throws(() => buildSurveyTeamPayload({ penyedia_id: '3', jenis_survei_id: '2', nama_tim: '   ' }), /Nama tim wajib diisi/);
});

test('new equipment payload preserves server fields and normalizes optional values', () => {
  assert.deepEqual(buildNewEquipmentPayload({
    nama_alat: '  Profilometer Ujian  ',
    nomor_seri: ' IRI-TEST-001 ',
    kondisi: ' Baik ',
    merek_tipe: '',
    kelas: ' Kelas I ',
    tahun_perolehan: '2026',
    milik_djbm: false,
    kendaraan: ' B 1234 JM ',
    mulai: '2026-10-28',
    selesai: '',
  }), {
    nama_alat: 'Profilometer Ujian',
    nomor_seri: 'IRI-TEST-001',
    kondisi: 'Baik',
    merek_tipe: null,
    kelas: 'Kelas I',
    tahun_perolehan: 2026,
    milik_djbm: false,
    kendaraan: 'B 1234 JM',
    mulai: '2026-10-28',
    selesai: null,
  });
});

test('new equipment payload rejects missing identity and invalid assignment dates', () => {
  const base = { nama_alat: 'Alat', nomor_seri: 'S-1', kondisi: 'Baik', merek_tipe: '', kelas: '', tahun_perolehan: '', milik_djbm: false, kendaraan: '', mulai: '', selesai: '' };
  assert.throws(() => buildNewEquipmentPayload({ ...base, nama_alat: ' ' }), /Nama alat wajib diisi/);
  assert.throws(() => buildNewEquipmentPayload({ ...base, tahun_perolehan: '1899' }), /antara 1900 dan 2100/);
  assert.throws(() => buildNewEquipmentPayload({ ...base, selesai: '2026-10-29' }), /memerlukan tarikh mulai/);
  assert.throws(() => buildNewEquipmentPayload({ ...base, mulai: '2026-10-29', selesai: '2026-10-28' }), /tidak boleh lebih awal/);
});

test('calibration payload matches the backend create contract', () => {
  assert.deepEqual(buildCalibrationPayload({
    alat_id: '8',
    jenis: 'REFERENSI',
    standar: '  ASTM E950  ',
    komponen: '  Sensor profilometer  ',
    tgl_kalibrasi: '2026-10-28',
    berlaku_sd: '2027-10-28',
    pelaksana: '  Makmal Ujian Jala Mutu  ',
  }), {
    alat_id: 8,
    jenis: 'REFERENSI',
    standar: 'ASTM E950',
    komponen: 'Sensor profilometer',
    tgl_kalibrasi: '2026-10-28',
    berlaku_sd: '2027-10-28',
    pelaksana: 'Makmal Ujian Jala Mutu',
  });
});

test('calibration payload rejects incomplete fields and reversed dates', () => {
  const base = { alat_id: '8', jenis: 'RELATIF' as const, standar: 'Standar', komponen: 'Sensor', tgl_kalibrasi: '2026-10-28', berlaku_sd: '', pelaksana: 'Makmal' };
  assert.throws(() => buildCalibrationPayload({ ...base, alat_id: '' }), /Alat wajib dipilih/);
  assert.throws(() => buildCalibrationPayload({ ...base, standar: ' ' }), /Standar wajib diisi/);
  assert.throws(() => buildCalibrationPayload({ ...base, tgl_kalibrasi: '' }), /Tarikh kalibrasi wajib diisi/);
  assert.throws(() => buildCalibrationPayload({ ...base, berlaku_sd: '2026-10-27' }), /tidak boleh lebih awal/);
});

test('calibration certificate accepts only a non-empty PDF up to 10 MB', () => {
  const pdf = { name: 'sijil-kalibrasi.pdf', type: 'application/pdf', size: 1024 };
  assert.equal(validateCalibrationCertificate(pdf), pdf);
  assert.throws(() => validateCalibrationCertificate(null), /Pilih satu fail/);
  assert.throws(
    () => validateCalibrationCertificate({ ...pdf, name: 'sijil.txt', type: 'text/plain' }),
    /format PDF/,
  );
  assert.throws(() => validateCalibrationCertificate({ ...pdf, size: 0 }), /Pilih satu fail/);
  assert.throws(
    () => validateCalibrationCertificate({ ...pdf, size: 10 * 1024 * 1024 + 1 }),
    /maksimum 10 MB/,
  );
});
