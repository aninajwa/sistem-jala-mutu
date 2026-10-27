import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildSurveyTeamPayload,
  calibrationSummary,
  canManageCalibration,
  serverRows,
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
