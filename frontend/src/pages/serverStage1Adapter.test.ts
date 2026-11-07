import assert from 'node:assert/strict';
import test from 'node:test';
import { persistDraftValue } from '../hooks/usePersistedDraft';
import { mapServerSurveyType, mapStage1ServerData, type Stage1ServerData } from './serverStage1Adapter';
import { SERVER_STAGE1_MUTATION_POLICY } from '../workflow/stages/stageSupport';
import { INITIAL_WORKFLOW } from '../workflow/model';
import { evaluateStageGate } from '../workflow/workflowGate';

const fixture: Stage1ServerData = {
  surveyTypes: [
    { jenis_survei_id: 21, kode: 'IRI', nama: 'International Roughness Index' },
    { jenis_survei_id: 22, kode: 'LALU_LINTAS', nama: 'Lalu Lintas' },
    { jenis_survei_id: 99, kode: 'UNKNOWN', nama: 'Unknown survey' },
  ],
  teams: [
    { tim_id: 501, paket_id: 8, jenis_survei_id: 21, nama_tim: 'Tim IRI', jenis_survei: null },
    { tim_id: 502, paket_id: 8, jenis_survei_id: 22, nama_tim: 'Tim trafik', jenis_survei: null },
    { tim_id: 999, paket_id: 9, jenis_survei_id: 21, nama_tim: 'Paket lain', jenis_survei: null },
  ],
  assignments: [{ penugasan_id: 601, tim_id: 501, alat_id: 701, alat_survei: { alat_id: 701, jenis_survei_id: 21, nama_alat: 'Profilometer', nomor_seri: 'IRI-01', tahun_perolehan: 2025, kondisi: 'Baik' } }],
  members: [{ anggota_id: 801, tim_id: 501, personel_id: 901, peran: 'Ketua Tim', personel: { personel_id: 901, nama: 'Personel Server' } }],
  qualifications: [{ kualifikasi_id: 1001, personel_id: 901, berlaku_sd: '2030-01-01', jenis: 'Pelatihan', nomor: 'K-1' }],
  calibrations: [{ kalibrasi_id: 1101, paket_id: 8, alat_id: 701, jenis: 'REFERENSI', standar: 'SNI', komponen: 'Sensor', tgl_kalibrasi: '2026-01-01', berlaku_sd: '2027-01-01', pelaksana: 'Lab', dokumen_id: 1201, status: 'DRAFT', dokumen: { dokumen_id: 1201, judul: 'Sijil kalibrasi', versi_aktif: 2 } }],
};

test('maps server calibration data while preserving server IDs and package relationships', () => {
  const mapped = mapStage1ServerData(fixture, '8', '2026-06-01');
  assert.deepEqual(mapped.surveyTypes, ['IRI', 'Lalu Lintas']);
  assert.equal(mapped.calibrations.length, 1);
  assert.equal(mapped.calibrations[0].id, 'server-calibration-1101');
  assert.deepEqual(mapped.calibrations[0].serverIds, {
    calibrationId: 1101, equipmentId: 701, teamId: 501, personId: 901,
    qualificationIds: [1001], documentId: 1201,
  });
  assert.equal(mapped.calibrations[0].equipment, 'Profilometer');
  assert.equal(mapped.calibrations[0].personInCharge, 'Personel Server');
  assert.match(mapped.calibrations[0].certificateReference ?? '', /dokumen #1201, v2/);
  assert.deepEqual(mapped.assignments[0], { assignmentId: '601-901', teamId: 501, equipmentId: 701, personId: 901, qualificationIds: [1001], surveyType: 'IRI', teamName: 'Tim IRI', equipment: 'Profilometer', serialNumber: 'IRI-01', personName: 'Personel Server' });
});

test('server identifiers never become demo/local IDs and unknown survey values are excluded', () => {
  const mapped = mapStage1ServerData(fixture, '8');
  assert.ok(!mapped.calibrations.some(item => item.id.startsWith('CAL-')));
  assert.deepEqual(mapped.surveyTypes, ['IRI', 'Lalu Lintas']);
  assert.equal(mapServerSurveyType({ kode: 'LENDUTAN', nama: 'Deflection' }), 'Lendutan');
  assert.equal(mapServerSurveyType({ kode: 'UNMAPPED', nama: 'Unknown' }), null);
});

test('unimplemented authenticated stage actions remain disabled and do not claim approval', () => {
  assert.deepEqual(SERVER_STAGE1_MUTATION_POLICY, {
    calibrationWrite: false, checklistWrite: false, readinessNavigation: false,
    approval: false, localPersistence: false,
  });
  const [record] = mapStage1ServerData(fixture, '8').calibrations;
  assert.equal(record.qualificationValid, false);
  assert.equal(record.trainingVerified, false);
  const state = structuredClone(INITIAL_WORKFLOW);
  const mapped = mapStage1ServerData(fixture, '8');
  state.project.surveyTypes = mapped.surveyTypes;
  state.calibrations = mapped.calibrations;
  state.calibrationChecklist = Object.fromEntries(mapped.surveyTypes.map(type => [type, false])) as typeof state.calibrationChecklist;
  state.productionApproval = 'Draft';
  assert.equal(evaluateStageGate(state, 'Tahap 1').readyToComplete, false);
  assert.notEqual(state.productionApproval, 'Disetujui');
});

test('authenticated draft mode does not call localStorage persistence', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let writes = 0;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { setItem: () => { writes += 1; } } });
  try {
    persistDraftValue('server-package:stage1', { answer: 'x' }, false);
    assert.equal(writes, 0);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete (globalThis as { localStorage?: Storage }).localStorage;
  }
});
