import type { WorkflowRole } from '../workflow/model';

export type ServerSurveyType = {
  kode: string;
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

export function serverRows<T>(value: unknown, label: string): T[] {
  if (!Array.isArray(value)) throw new Error(`Respons ${label} tidak sesuai.`);
  return value as T[];
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
