import type { WorkflowRole } from '../workflow/model';

export type ServerSurveyType = {
  jenis_survei_id?: number;
  kode: string;
  nama: string;
  aktif?: boolean;
};

export type ServerProvider = {
  penyedia_id: number;
  nama: string;
};

export type ServerSurveyTeam = {
  tim_id: number;
  paket_id: number;
  jenis_survei_id: number;
  nama_tim: string;
  jenis_survei: ServerSurveyType | null;
};

export type ServerCalibrationDocument = {
  dokumen_id: number;
  judul: string;
  versi_aktif: number;
};

export type ServerCalibration = {
  kalibrasi_id: number;
  paket_id: number;
  alat_id: number;
  jenis: 'REFERENSI' | 'RELATIF';
  standar: string;
  komponen: string;
  tgl_kalibrasi: string;
  berlaku_sd: string | null;
  pelaksana: string;
  dokumen_id: number | null;
  status: string;
  created_by: number;
  versi: number;
  updated_at: string;
  dokumen: ServerCalibrationDocument | null;
};

export type SurveyTeamDraft = {
  penyedia_id: string;
  jenis_survei_id: string;
  nama_tim: string;
};

export type ServerEquipment = {
  alat_id: number;
  penyedia_id: number;
  jenis_survei_id: number;
  nama_alat: string;
  merek_tipe: string | null;
  nomor_seri: string;
  kelas: string | null;
  tahun_perolehan: number | null;
  kondisi: string;
  milik_djbm: boolean;
};

export type ServerEquipmentAssignment = {
  penugasan_id: number;
  tim_id: number;
  alat_id: number;
  kendaraan: string | null;
  mulai: string | null;
  selesai: string | null;
  alat_survei: ServerEquipment | null;
};

export type NewEquipmentDraft = {
  nama_alat: string;
  nomor_seri: string;
  kondisi: string;
  merek_tipe: string;
  kelas: string;
  tahun_perolehan: string;
  milik_djbm: boolean;
  kendaraan: string;
  mulai: string;
  selesai: string;
};

export function serverRows<T>(value: unknown, label: string): T[] {
  if (!Array.isArray(value)) throw new Error(`Respons ${label} tidak sesuai.`);
  return value as T[];
}

function positiveId(value: string, label: string) {
  if (!/^[1-9]\d*$/.test(value)) throw new Error(`${label} wajib dipilih.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > 2147483647) throw new Error(`${label} tidak valid.`);
  return parsed;
}

function requiredText(value: string, label: string) {
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

function optionalDate(value: string, label: string) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label} tidak valid.`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (value.startsWith('0000') || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} tidak valid.`);
  }
  return value;
}

export function buildSurveyTeamPayload(draft: SurveyTeamDraft) {
  const namaTim = draft.nama_tim.trim();
  if (!namaTim) throw new Error('Nama tim wajib diisi.');
  if (namaTim.length > 255) throw new Error('Nama tim maksimum 255 aksara.');
  return {
    penyedia_id: positiveId(draft.penyedia_id, 'Penyedia Jasa'),
    jenis_survei_id: positiveId(draft.jenis_survei_id, 'Jenis survei'),
    nama_tim: namaTim,
  };
}

export function buildNewEquipmentPayload(draft: NewEquipmentDraft) {
  const mulai = optionalDate(draft.mulai, 'Tarikh mulai');
  const selesai = optionalDate(draft.selesai, 'Tarikh selesai');
  if (selesai && !mulai) throw new Error('Tarikh selesai memerlukan tarikh mulai.');
  if (mulai && selesai && selesai < mulai) throw new Error('Tarikh selesai tidak boleh lebih awal daripada tarikh mulai.');

  let tahunPerolehan: number | null = null;
  if (draft.tahun_perolehan) {
    if (!/^\d{4}$/.test(draft.tahun_perolehan)) throw new Error('Tahun perolehan tidak valid.');
    tahunPerolehan = Number(draft.tahun_perolehan);
    if (tahunPerolehan < 1900 || tahunPerolehan > 2100) throw new Error('Tahun perolehan mesti antara 1900 dan 2100.');
  }

  return {
    nama_alat: requiredText(draft.nama_alat, 'Nama alat'),
    nomor_seri: requiredText(draft.nomor_seri, 'Nombor siri'),
    kondisi: requiredText(draft.kondisi, 'Kondisi alat'),
    merek_tipe: optionalText(draft.merek_tipe),
    kelas: optionalText(draft.kelas),
    tahun_perolehan: tahunPerolehan,
    milik_djbm: draft.milik_djbm,
    kendaraan: optionalText(draft.kendaraan),
    mulai,
    selesai,
  };
}

export function calibrationSummary(teams: ServerSurveyTeam[], calibrations: ServerCalibration[]) {
  return {
    teams: teams.length,
    calibrations: calibrations.length,
    certificates: calibrations.filter(item => item.dokumen_id !== null).length,
    drafts: calibrations.filter(item => item.status === 'DRAFT').length,
  };
}

export function canManageCalibration(role: WorkflowRole, preparationStatus?: string | null) {
  return role === 'Penyedia Jasa / Ketua Tim' && preparationStatus === 'DISETUJUI';
}
