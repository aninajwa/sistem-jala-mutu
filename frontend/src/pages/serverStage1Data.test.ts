import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildPersonnelPayload,
  buildQualificationPayload,
  createStage1Calibration,
  createStage1Equipment,
  createStage1Personnel,
  createStage1Qualification,
  createStage1Team,
  uploadStage1Certificate,
  uploadStage1QualificationEvidence,
  type Stage1Request,
} from './serverStage1Data';

function mockRequest(handler: (path: string, init?: RequestInit) => unknown) {
  const calls: Array<{ path: string; method: string; body?: unknown }> = [];
  const request: Stage1Request = async <T>(path: string, init?: RequestInit) => {
    calls.push({ path, method: init?.method ?? 'GET', body: init?.body });
    return handler(path, init) as T;
  };
  return { request, calls };
}

test('team create requires the posted team ID and scoped GET readback', async () => {
  const { request, calls } = mockRequest((_path, init) => init?.method === 'POST'
    ? { data: { tim_id: 12 } }
    : { data: [{ tim_id: 12, paket_id: 8, jenis_survei_id: 2, nama_tim: 'Tim IRI' }] });
  const row = await createStage1Team('8', { penyedia_id: '3', jenis_survei_id: '2', nama_tim: 'Tim IRI' }, request);
  assert.equal(row.tim_id, 12);
  assert.deepEqual(calls.map(item => item.method), ['POST', 'GET']);
  assert.equal(calls[0].path, '/paket/8/tim');
});

test('team creation rejects absent or mismatched readback instead of claiming success', async () => {
  const { request } = mockRequest((_path, init) => init?.method === 'POST'
    ? { data: { tim_id: 12 } }
    : { data: [{ tim_id: 12, paket_id: 9, jenis_survei_id: 2, nama_tim: 'Tim IRI' }] });
  await assert.rejects(createStage1Team('8', { penyedia_id: '3', jenis_survei_id: '2', nama_tim: 'Tim IRI' }, request), /belum disahkan/);
});

test('equipment, calibration and certificate mutations are only confirmed by matching scoped GET rows', async () => {
  const equipment = mockRequest((_path, init) => init?.method === 'POST'
    ? { data: { alat: { alat_id: 31 }, penugasan: { penugasan_id: 41 } } }
    : { data: [{ penugasan_id: 41, tim_id: 12, alat_id: 31, kendaraan: null, mulai: null, selesai: null, alat_survei: { alat_id: 31, nomor_seri: 'SN-31' } }] });
  const equipmentRow = await createStage1Equipment('8', 12, { nama_alat: 'Profilometer', nomor_seri: 'SN-31', kondisi: 'Baik', merek_tipe: '', kelas: '', tahun_perolehan: '', milik_djbm: false, kendaraan: '', mulai: '', selesai: '' }, equipment.request);
  assert.equal(equipmentRow.penugasan_id, 41);
  assert.deepEqual(equipment.calls.map(item => item.method), ['POST', 'GET']);

  const calibration = mockRequest((_path, init) => init?.method === 'POST'
    ? { data: { kalibrasi_id: 51 } }
    : { data: [{ kalibrasi_id: 51, paket_id: 8, alat_id: 31, status: 'DRAFT', dokumen_id: null, standar: 'SNI', komponen: 'Sensor' }] });
  const calibrationRow = await createStage1Calibration('8', { alat_id: '31', jenis: 'REFERENSI', standar: 'SNI', komponen: 'Sensor', tgl_kalibrasi: '2026-11-09', berlaku_sd: '', pelaksana: 'Lab' }, calibration.request);
  assert.equal(calibrationRow.kalibrasi_id, 51);
  assert.deepEqual(calibration.calls.map(item => item.method), ['POST', 'GET']);

  const certificate = mockRequest((_path, init) => init?.method === 'POST'
    ? { data: { dokumen: { dokumen_id: 61 } } }
    : { data: [{ kalibrasi_id: 51, status: 'DRAFT', dokumen_id: 61, dokumen: { dokumen_id: 61 } }] });
  const cert = await uploadStage1Certificate('8', { kalibrasi_id: 51, paket_id: 8, alat_id: 31, jenis: 'REFERENSI', standar: 'SNI', komponen: 'Sensor', tgl_kalibrasi: '2026-11-09', berlaku_sd: null, pelaksana: 'Lab', dokumen_id: null, status: 'DRAFT', created_by: 3, versi: 1, updated_at: '', dokumen: null }, new File(['pdf'], 'cert.pdf', { type: 'application/pdf' }), certificate.request);
  assert.equal(cert.dokumen_id, 61);
  assert.ok((certificate.calls[0].body as FormData).get('expected_version') === '1');
  assert.deepEqual(certificate.calls.map(item => item.method), ['POST', 'GET']);
});

test('personnel and qualification payloads follow the Express schemas and are confirmed by GET', async () => {
  assert.deepEqual(buildPersonnelPayload({ nama: '  Operator  ', nik_internal: '', pendidikan: ' SMA ', pengalaman_tahun: '0', peran: '  Operator IRI ', mulai: '2026-11-09', selesai: '' }), {
    nama: 'Operator', nik_internal: null, pendidikan: 'SMA', pengalaman_tahun: 0, peran: 'Operator IRI', mulai: '2026-11-09', selesai: null,
  });
  assert.deepEqual(buildQualificationPayload({ jenis: 'SKK', nomor: ' SKK-1 ', jenjang: '', berlaku_sd: '' }), { jenis: 'SKK', nomor: 'SKK-1', jenjang: null, berlaku_sd: null });
  assert.throws(() => buildPersonnelPayload({ nama: '', nik_internal: '', pendidikan: '', pengalaman_tahun: '', peran: 'Operator', mulai: '', selesai: '' }), /Nama personel wajib/);
  assert.throws(() => buildPersonnelPayload({ nama: 'Person', nik_internal: '', pendidikan: '', pengalaman_tahun: '1.5', peran: 'Operator', mulai: '', selesai: '' }), /bilangan tahun bulat/);
  assert.throws(() => buildQualificationPayload({ jenis: 'SKK', nomor: ' ', jenjang: '', berlaku_sd: '' }), /Nomor kualifikasi wajib/);

  const personnel = mockRequest((_path, init) => init?.method === 'POST'
    ? { data: { personel: { personel_id: 71 }, anggota: { anggota_id: 81 } } }
    : { data: [{ anggota_id: 81, tim_id: 12, personel_id: 71, peran: 'Operator', personel: { nama: 'Operator' } }] });
  const member = await createStage1Personnel('8', 12, { nama: 'Operator', nik_internal: '', pendidikan: '', pengalaman_tahun: '', peran: 'Operator', mulai: '', selesai: '' }, personnel.request);
  assert.equal(member.personel_id, 71);
  assert.deepEqual(personnel.calls.map(item => item.method), ['POST', 'GET']);

  const qualification = mockRequest((_path, init) => init?.method === 'POST'
    ? { data: { kualifikasi: { kualifikasi_id: 91 } } }
    : { data: [{ kualifikasi_id: 91, personel_id: 71, jenis: 'SKK', nomor: 'SKK-1' }] });
  const qualificationRow = await createStage1Qualification('8', 12, 71, { jenis: 'SKK', nomor: 'SKK-1', jenjang: '', berlaku_sd: '' }, qualification.request);
  assert.equal(qualificationRow.kualifikasi_id, 91);
  assert.deepEqual(qualification.calls.map(item => item.method), ['POST', 'GET']);
});

test('personnel and certificate mismatched readback fail without returning a success record', async () => {
  const person = mockRequest((_path, init) => init?.method === 'POST'
    ? { data: { personel: { personel_id: 71 }, anggota: { anggota_id: 81 } } }
    : { data: [] });
  await assert.rejects(createStage1Personnel('8', 12, { nama: 'Operator', nik_internal: '', pendidikan: '', pengalaman_tahun: '', peran: 'Operator', mulai: '', selesai: '' }, person.request), /belum disahkan/);

  const certificate = mockRequest((_path, init) => init?.method === 'POST'
    ? { data: { dokumen: { dokumen_id: 61 } } }
    : { data: [{ kalibrasi_id: 51, status: 'DRAFT', dokumen_id: null, dokumen: null }] });
  await assert.rejects(uploadStage1Certificate('8', { kalibrasi_id: 51, paket_id: 8, alat_id: 31, jenis: 'REFERENSI', standar: 'SNI', komponen: 'Sensor', tgl_kalibrasi: '2026-11-09', berlaku_sd: null, pelaksana: 'Lab', dokumen_id: null, status: 'DRAFT', created_by: 3, versi: 1, updated_at: '', dokumen: null }, new File(['pdf'], 'cert.pdf', { type: 'application/pdf' }), certificate.request), /belum disahkan/);
});

test('qualification evidence upload uses expected_version and only succeeds after matching server readback', async () => {
  const qualification = { kualifikasi_id: 91, personel_id: 71, jenis: 'SKK', nomor: 'SKK-1', jenjang: null, berlaku_sd: null, dokumen_id: null, versi: 3 };
  const { request, calls } = mockRequest((_path, init) => init?.method === 'POST'
    ? { data: { kualifikasi: { kualifikasi_id: 91, versi: 4, dokumen_id: 101 }, dokumen: { dokumen_id: 101 } } }
    : { data: { kualifikasi: { ...qualification, versi: 4, dokumen_id: 101 }, dokumen: { dokumen_id: 101 }, versi_aktif: { versi_ke: 1 } } });
  const result = await uploadStage1QualificationEvidence('8', 12, 71, qualification, new File(['pdf'], 'ska.pdf', { type: 'application/pdf' }), request);
  assert.equal(result.documentId, 101);
  assert.equal(result.qualification.versi, 4);
  assert.equal((calls[0].body as FormData).get('expected_version'), '3');
  assert.deepEqual(calls.map(call => call.method), ['POST', 'GET']);
  assert.equal(calls[0].path, '/paket/8/tim/12/personel/71/kualifikasi/91/bukti');

  const mismatch = mockRequest((_path, init) => init?.method === 'POST'
    ? { data: { dokumen: { dokumen_id: 101 } } }
    : { data: { kualifikasi: { ...qualification, versi: 4, dokumen_id: 102 }, dokumen: { dokumen_id: 102 }, versi_aktif: { versi_ke: 2 } } });
  await assert.rejects(uploadStage1QualificationEvidence('8', 12, 71, qualification, new File(['pdf'], 'ska.pdf', { type: 'application/pdf' }), mismatch.request), /belum disahkan/);
});

test('authenticated Tahap 1 forms use server readback and do not persist drafts in browser storage', async () => {
  const files = await Promise.all([
    'ServerStage1DirahWorkspace.tsx', 'ServerEquipmentPanel.tsx', 'ServerCalibrationRecordPanel.tsx',
    'ServerCalibrationCertificatePanel.tsx', 'ServerPersonnelPanel.tsx',
  ].map(name => readFile(new URL(`./${name}`, import.meta.url), 'utf8')));
  assert.match(files[0], /createStage1Team\(packageId, teamDraft, apiRequest\)/);
  assert.match(files[0], /<ServerPersonnelPanel packageId=\{packageId\} teams=\{rawTeams\} manageable=\{manageable\}/);
  assert.match(files[1], /createStage1Equipment\(packageId, Number\(teamId\), draft, apiRequest\)/);
  assert.match(files[2], /createStage1Calibration\(packageId, draft, apiRequest\)/);
  assert.match(files[3], /uploadStage1Certificate\(packageId, selected, file!, apiRequest\)/);
  assert.match(files[4], /createStage1Personnel\(packageId, Number\(teamId\), personDraft, apiRequest\)/);
  assert.match(files[4], /createStage1Qualification\(packageId, Number\(teamId\), selectedMember\.personel_id, qualificationDraft, apiRequest\)/);
  assert.match(files[4], /uploadStage1QualificationEvidence\(packageId, Number\(teamId\), selectedMember\.personel_id, qualification, evidenceFile, apiRequest\)/);
  assert.doesNotMatch(files.join('\n'), /usePersistedDraft|localStorage|sessionStorage/);
});
