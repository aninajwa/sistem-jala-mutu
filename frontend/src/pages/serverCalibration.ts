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
