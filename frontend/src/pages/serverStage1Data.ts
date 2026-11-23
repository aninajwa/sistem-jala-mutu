import { apiRequest } from '../auth/client';
import type { CalibrationDraft, NewEquipmentDraft, ServerCalibration, ServerEquipmentAssignment, ServerSurveyTeam, SurveyTeamDraft } from './serverCalibration';
import { buildCalibrationPayload, buildNewEquipmentPayload, buildSurveyTeamPayload, validateCalibrationCertificate } from './serverCalibration';

export type Stage1Request = <T = unknown>(path: string, init?: RequestInit) => Promise<T>;
const defaultRequest: Stage1Request = async <T>(path: string, init?: RequestInit) => apiRequest<T>(path, init);

export type PersonnelDraft = {
  nama: string; nik_internal: string; pendidikan: string; pengalaman_tahun: string;
  peran: string; mulai: string; selesai: string;
};
export type QualificationDraft = { jenis: 'SKA' | 'SKK' | 'PELATIHAN_QA_QC_DJBM'; nomor: string; jenjang: string; berlaku_sd: string };
export type Stage1Person = { personel_id: number; penyedia_id: number; nama: string; nik_internal?: string | null; pendidikan?: string | null; pengalaman_tahun?: number | null };
export type Stage1Membership = { anggota_id: number; tim_id: number; personel_id: number; peran: string; mulai: string | null; selesai: string | null; personel?: Stage1Person | null };
export type Stage1Qualification = { kualifikasi_id: number; personel_id: number; jenis: string; nomor: string; jenjang: string | null; berlaku_sd: string | null; dokumen_id: number | null; versi: number };

function positiveId(value: unknown, label: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new Error(`Respons server tidak memulangkan ${label} yang sah.`);
  return id;
}

function rows<T>(response: unknown, label: string): T[] {
  const data = response && typeof response === 'object' && 'data' in response ? (response as { data: unknown }).data : null;
  if (!Array.isArray(data)) throw new Error(`Bacaan semula ${label} tidak sesuai.`);
  return data as T[];
}

function validDate(value: string, label: string): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label} tidak valid.`);
  const date = new Date(`${value}T00:00:00Z`);
  if (value.startsWith('0000') || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error(`${label} tidak valid.`);
  return value;
}

function text(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} wajib diisi.`);
  if (trimmed.length > 255) throw new Error(`${label} maksimum 255 aksara.`);
  return trimmed;
}

function optionalText(value: string) {
  const trimmed = value.trim();
  if (trimmed.length > 255) throw new Error('Medan teks maksimum 255 aksara.');
  return trimmed || null;
}

export function buildPersonnelPayload(draft: PersonnelDraft) {
  const mulai = validDate(draft.mulai, 'Tarikh mulai');
  const selesai = validDate(draft.selesai, 'Tarikh selesai');
  if (selesai && (!mulai || selesai < mulai)) throw new Error('Tarikh selesai memerlukan mulai dan tidak boleh lebih awal.');
  let pengalaman_tahun: number | null = null;
  if (draft.pengalaman_tahun.trim()) {
    if (!/^\d+$/.test(draft.pengalaman_tahun)) throw new Error('Pengalaman mesti bilangan tahun bulat bukan negatif.');
    pengalaman_tahun = Number(draft.pengalaman_tahun);
    if (!Number.isSafeInteger(pengalaman_tahun) || pengalaman_tahun > 2147483647) throw new Error('Pengalaman tidak valid.');
  }
  return {
    nama: text(draft.nama, 'Nama personel'),
    nik_internal: optionalText(draft.nik_internal),
    pendidikan: optionalText(draft.pendidikan),
    pengalaman_tahun,
    peran: text(draft.peran, 'Peran dalam tim'),
    mulai,
    selesai,
  };
}

export function buildQualificationPayload(draft: QualificationDraft) {
  if (!['SKA', 'SKK', 'PELATIHAN_QA_QC_DJBM'].includes(draft.jenis)) throw new Error('Jenis kualifikasi tidak valid.');
  return {
    jenis: draft.jenis,
    nomor: text(draft.nomor, 'Nomor kualifikasi'),
    jenjang: optionalText(draft.jenjang),
    berlaku_sd: validDate(draft.berlaku_sd, 'Tarikh berlaku hingga'),
  };
}

export async function createStage1Team(packageId: string, draft: SurveyTeamDraft, request: Stage1Request = defaultRequest) {
  const payload = buildSurveyTeamPayload(draft);
  const created = await request<{ data: ServerSurveyTeam }>(`/paket/${encodeURIComponent(packageId)}/tim`, { method: 'POST', body: JSON.stringify(payload) });
  const id = positiveId(created.data?.tim_id, 'ID tim');
  const listed = rows<ServerSurveyTeam>(await request(`/paket/${encodeURIComponent(packageId)}/tim`), 'tim survei');
  const confirmed = listed.find(item => item.tim_id === id && String(item.paket_id) === packageId && item.jenis_survei_id === payload.jenis_survei_id && item.nama_tim === payload.nama_tim);
  if (!confirmed) throw new Error('Tim belum disahkan melalui bacaan semula server. Muat ulang daftar tim.');
  return confirmed;
}

export async function createStage1Equipment(packageId: string, teamId: number, draft: NewEquipmentDraft, request: Stage1Request = defaultRequest) {
  const payload = buildNewEquipmentPayload(draft);
  const created = await request<{ data: { alat?: { alat_id?: number }; penugasan?: { penugasan_id?: number; tim_id?: number; alat_id?: number } } }>(
    `/paket/${encodeURIComponent(packageId)}/tim/${teamId}/alat`, { method: 'POST', body: JSON.stringify(payload) },
  );
  const assignmentId = positiveId(created.data?.penugasan?.penugasan_id, 'ID penugasan alat');
  const equipmentId = positiveId(created.data?.alat?.alat_id, 'ID alat');
  const listed = rows<ServerEquipmentAssignment>(await request(`/paket/${encodeURIComponent(packageId)}/tim/${teamId}/alat`), 'penugasan alat');
  const confirmed = listed.find(item => item.penugasan_id === assignmentId && item.tim_id === teamId && item.alat_id === equipmentId && item.alat_survei?.alat_id === equipmentId && item.alat_survei?.nomor_seri === payload.nomor_seri);
  if (!confirmed) throw new Error('Alat dan penugasannya belum disahkan melalui bacaan semula server. Muat ulang daftar alat.');
  return confirmed;
}

export async function createStage1Calibration(packageId: string, draft: CalibrationDraft, request: Stage1Request = defaultRequest) {
  const payload = buildCalibrationPayload(draft);
  const created = await request<{ data: ServerCalibration }>(`/paket/${encodeURIComponent(packageId)}/kalibrasi-alat`, { method: 'POST', body: JSON.stringify(payload) });
  const id = positiveId(created.data?.kalibrasi_id, 'ID kalibrasi');
  const listed = rows<ServerCalibration>(await request(`/paket/${encodeURIComponent(packageId)}/kalibrasi-alat`), 'rekod kalibrasi');
  const confirmed = listed.find(item => item.kalibrasi_id === id && String(item.paket_id) === packageId && item.alat_id === payload.alat_id && item.status === 'DRAFT' && item.dokumen_id === null && item.standar === payload.standar && item.komponen === payload.komponen);
  if (!confirmed) throw new Error('Rekod kalibrasi belum disahkan melalui bacaan semula server. Muat ulang daftar kalibrasi.');
  return confirmed;
}

export async function uploadStage1Certificate(packageId: string, calibration: ServerCalibration, file: File, request: Stage1Request = defaultRequest) {
  const body = new FormData();
  body.append('expected_version', String(calibration.versi));
  body.append('file', file);
  const result = await request<{ data: { kalibrasi?: { kalibrasi_id?: number }; dokumen?: { dokumen_id?: number } } }>(
    `/paket/${encodeURIComponent(packageId)}/kalibrasi-alat/${calibration.kalibrasi_id}/sertifikat`, { method: 'POST', body },
  );
  const documentId = positiveId(result.data?.dokumen?.dokumen_id, 'ID dokumen sijil');
  const listed = rows<ServerCalibration>(await request(`/paket/${encodeURIComponent(packageId)}/kalibrasi-alat`), 'rekod kalibrasi');
  const confirmed = listed.find(item => item.kalibrasi_id === calibration.kalibrasi_id && item.status === 'DRAFT' && item.dokumen_id === documentId && item.dokumen?.dokumen_id === documentId);
  if (!confirmed) throw new Error('Sijil belum disahkan pada rekod kalibrasi melalui bacaan semula server. Muat ulang.');
  return confirmed;
}

export async function createStage1Personnel(packageId: string, teamId: number, draft: PersonnelDraft, request: Stage1Request = defaultRequest) {
  const payload = buildPersonnelPayload(draft);
  const created = await request<{ data: { personel?: { personel_id?: number }; anggota?: { anggota_id?: number; tim_id?: number } } }>(
    `/paket/${encodeURIComponent(packageId)}/tim/${teamId}/personel`, { method: 'POST', body: JSON.stringify(payload) },
  );
  const personId = positiveId(created.data?.personel?.personel_id, 'ID personel');
  const memberId = positiveId(created.data?.anggota?.anggota_id, 'ID keanggotaan tim');
  const listed = rows<Stage1Membership>(await request(`/paket/${encodeURIComponent(packageId)}/tim/${teamId}/personel`), 'personel tim');
  const confirmed = listed.find(item => item.anggota_id === memberId && item.tim_id === teamId && item.personel_id === personId && item.peran === payload.peran && item.personel?.nama === payload.nama);
  if (!confirmed) throw new Error('Personel belum disahkan sebagai anggota tim melalui bacaan semula server.');
  return confirmed;
}

export async function createStage1Qualification(packageId: string, teamId: number, personId: number, draft: QualificationDraft, request: Stage1Request = defaultRequest) {
  const payload = buildQualificationPayload(draft);
  const created = await request<{ data: { kualifikasi?: { kualifikasi_id?: number } } }>(
    `/paket/${encodeURIComponent(packageId)}/tim/${teamId}/personel/${personId}/kualifikasi`, { method: 'POST', body: JSON.stringify(payload) },
  );
  const id = positiveId(created.data?.kualifikasi?.kualifikasi_id, 'ID kualifikasi');
  const listed = rows<Stage1Qualification>(await request(`/paket/${encodeURIComponent(packageId)}/tim/${teamId}/personel/${personId}/kualifikasi`), 'kualifikasi personel');
  const confirmed = listed.find(item => item.kualifikasi_id === id && item.personel_id === personId && item.jenis === payload.jenis && item.nomor === payload.nomor);
  if (!confirmed) throw new Error('Kualifikasi belum disahkan melalui bacaan semula server.');
  return confirmed;
}

export async function uploadStage1QualificationEvidence(packageId: string, teamId: number, personId: number, qualification: Stage1Qualification, file: File, request: Stage1Request = defaultRequest) {
  validateCalibrationCertificate(file);
  if (!Number.isSafeInteger(qualification.versi) || qualification.versi < 1 || qualification.versi >= 2147483647) throw new Error('Versi kualifikasi tidak valid. Muat semula dahulu.');
  const path = `/paket/${encodeURIComponent(packageId)}/tim/${teamId}/personel/${personId}/kualifikasi/${qualification.kualifikasi_id}/bukti`;
  const body = new FormData();
  body.append('expected_version', String(qualification.versi));
  body.append('file', file);
  const result = await request<{ data: { kualifikasi?: { kualifikasi_id?: number; versi?: number; dokumen_id?: number | null }; dokumen?: { dokumen_id?: number } } }>(path, { method: 'POST', body });
  const documentId = positiveId(result.data?.dokumen?.dokumen_id, 'ID bukti kualifikasi');
  const detail = await request<{ data: { kualifikasi?: Stage1Qualification; dokumen?: { dokumen_id?: number } | null; versi_aktif?: { versi_ke?: number } | null } }>(path);
  if (detail.data?.kualifikasi?.kualifikasi_id !== qualification.kualifikasi_id ||
      detail.data.kualifikasi.versi !== qualification.versi + 1 || detail.data.kualifikasi.dokumen_id !== documentId ||
      detail.data.dokumen?.dokumen_id !== documentId || !Number.isSafeInteger(Number(detail.data.versi_aktif?.versi_ke)) || Number(detail.data.versi_aktif?.versi_ke) < 1) {
    throw new Error('Bukti kualifikasi belum disahkan melalui bacaan semula server. Muat ulang rekod.');
  }
  return { qualification: detail.data.kualifikasi, documentId };
}
