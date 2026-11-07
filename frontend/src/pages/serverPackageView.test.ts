import test from 'node:test';
import assert from 'node:assert/strict';

import {
  balaiLabel,
  mapServerPackagesToDirahPackages,
  neutralCalibrationChecklist,
  neutralProductionTests,
  serverDetailToDirahState,
  serverPackageId,
  serverPackageToDirahState,
  SERVER_STAGE_NOT_CONNECTED,
  type ServerBalaiRow,
  type ServerPackageRow,
} from './serverPackageView';
import { derivePackageStage, packageStatus, packageWaitingFor } from '../workflow/packageStore';
import { isLegacyExample } from '../workflow/access/packageAccess';
import { SURVEY_TYPES } from '../workflow/model';

const balais: ServerBalaiRow[] = [
  { balai_id: 1, nama: 'Balai Jawa Barat', kode: 'BJB' },
  { balai_id: 2, nama: '', kode: 'BJT' },
];

const paket: ServerPackageRow = {
  paket_id: 12,
  nama_paket: 'Paket QA/QC Tol Cikampek 2027',
  nomor_kontrak: 'CN.1234.01',
  tahun_anggaran: 2027,
  balai_id: 1,
  status: 'DRAFT',
};

test('ID server dipertahankan sebagai string numerik untuk navigasi App.openPackage', () => {
  assert.equal(serverPackageId(12), '12');
  // App hanya membuka paket server bila ID cocok /^[1-9]\d*$/.
  assert.match(serverPackageId(12), /^[1-9]\d*$/);
  const view = mapServerPackagesToDirahPackages([paket], balais, 'Penyedia Jasa / Ketua Tim');
  assert.equal(view['12'].project.id, '12');
});

test('Field paket backend dipetakan ke slot kartu UI Dirah', () => {
  const state = serverPackageToDirahState(paket, balais, 'Penyedia Jasa / Ketua Tim');
  assert.equal(state.project.packageName, 'Paket QA/QC Tol Cikampek 2027');
  assert.equal(state.project.contractNumber, 'CN.1234.01');
  assert.equal(state.project.balai, 'Balai Jawa Barat');
  // Slot semester menampilkan tahun anggaran server.
  assert.equal(state.project.semester, 'TA 2027');
  assert.equal(state.role, 'Penyedia Jasa / Ketua Tim');
});

test('Nama balai memakai /balai, fallback kode, ID, dan null', () => {
  assert.equal(balaiLabel(balais, 1), 'Balai Jawa Barat');
  assert.equal(balaiLabel(balais, 2), 'BJT');
  assert.equal(balaiLabel([], 7), 'Balai #7');
  assert.equal(balaiLabel([], null), 'Balai belum ditetapkan');
});

test('Field workflow yang belum tersedia di backend tetap netral, tanpa data demo', () => {
  const state = serverPackageToDirahState(paket, balais, 'PIC Balai / Pengguna Jasa');
  assert.deepEqual(state.project.surveyTypes, []);
  assert.deepEqual(state.project.routes, []);
  assert.equal(state.project.contractor, '');
  assert.deepEqual(state.calibrations, []);
  assert.deepEqual(state.dailyRecords, []);
  assert.deepEqual(state.corrections, []);
  assert.equal(state.productionApproval, 'Draft');
  assert.equal(isLegacyExample(state), false);
});

test('Struktur teknis netral mengisi semua jenis survei dengan nilai nol (bukan demo)', () => {
  const tests = neutralProductionTests();
  const checklist = neutralCalibrationChecklist();
  for (const type of SURVEY_TYPES) {
    assert.ok(tests[type], `productionTests[${type}] ada`);
    assert.equal(tests[type].trialKm, 0);
    assert.equal(checklist[type], false);
  }
  assert.equal(Object.keys(tests).length, SURVEY_TYPES.length);
});

test('Label triji kartu Dirah dihitung fungsi Dirah di atas state netral', () => {
  const state = serverPackageToDirahState(paket, balais, 'Penyedia Jasa / Ketua Tim');
  assert.equal(derivePackageStage(state), 'Tahap 0');
  assert.equal(packageStatus(state), 'Berjalan');
  assert.equal(packageWaitingFor(state), 'Penyedia');
});

test('Detail kontrak /paket/:id memperkaya header Dirah (PPK, SPMK, jadwal)', () => {
  const contract = {
    paket_id: 12,
    nama_paket: 'Paket QA/QC Tol Cikampek 2027',
    nomor_kontrak: 'CN.1234.01',
    tahun_anggaran: 2027,
    balai_id: 2,
    status: 'DIAJUKAN',
    nama_ppk: 'PPK 2.2',
    penyedia_id: 4,
    tgl_spmk: '2026-10-17',
    tgl_selesai: '2027-05-30',
    nilai_kontrak: 1250000000,
    batas_lap_pendahuluan: '2026-11-30',
  };
  const state = serverDetailToDirahState(contract, balais, 'PIC Balai / Pengguna Jasa');
  assert.equal(state.project.ppk, 'PPK 2.2');
  assert.equal(state.project.spmkDate, '2026-10-17');
  assert.equal(state.project.surveyStartDate, '2026-10-17');
  assert.equal(state.project.surveyEndDate, '2027-05-30');
  assert.equal(state.project.balai, 'BJT');
  assert.equal(serverDetailToDirahState({ ...contract, tgl_selesai: null }, balais, 'Admin').project.surveyEndDate, undefined);
  // Nilai kontrak dan penyedia_id belum mempunyai slot pada model Dirah.
  assert.equal(state.project.contractor, '');
});

test('Akses yang belum terhubung dinonaktifkan lewat pesan eksplisit, bukan penyimpanan semu', () => {
  assert.match(SERVER_STAGE_NOT_CONNECTED, /Belum terhubung/);
  assert.match(SERVER_STAGE_NOT_CONNECTED, /dinonaktifkan/);
});

test('Banyak paket dipetakan tanpa saling menimpa', () => {
  const second: ServerPackageRow = { ...paket, paket_id: 15, nama_paket: 'Paket Lalulintas 2027', nomor_kontrak: null, tahun_anggaran: null, balai_id: null };
  const view = mapServerPackagesToDirahPackages([paket, second, { ...paket, paket_id: 12 }], balais, 'Admin');
  assert.deepEqual(Object.keys(view).sort(), ['12', '15']);
  // Kartu Dirah menampilkan `contractNumber || id`, jadi card berisi '15'.
  assert.equal(view['15'].project.contractNumber, '');
  assert.equal(view['15'].project.contractNumber || view['15'].project.id, '15');
  assert.equal(view['15'].project.balai, 'Balai belum ditetapkan');
  assert.equal(view['12'].project.packageName, 'Paket QA/QC Tol Cikampek 2027');
});
