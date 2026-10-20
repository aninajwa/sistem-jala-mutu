import { canRole } from '../workflow/workflowConfig';
import type { WorkflowRole } from '../workflow/model';

export const SURVEY_STATUSES = [
  'Draft',
  'Diserahkan',
  'Verifikasi',
  'Lulus',
  'Perlu Perbaikan',
] as const;

export type SurveyStatus = (typeof SURVEY_STATUSES)[number];

export type SurveyDecision = Extract<SurveyStatus, 'Lulus' | 'Perlu Perbaikan'>;

/** Daftar transisi yang ditampilkan pada matriks hak akses. */
export const SURVEY_TRANSITION_MATRIX: Array<{ from: SurveyStatus; to: SurveyStatus }> = [
  { from: 'Draft', to: 'Diserahkan' },
  { from: 'Diserahkan', to: 'Verifikasi' },
  { from: 'Perlu Perbaikan', to: 'Diserahkan' },
  { from: 'Verifikasi', to: 'Lulus' },
  { from: 'Verifikasi', to: 'Perlu Perbaikan' },
];

const OPERATIONAL_TRANSITIONS: Record<SurveyStatus, SurveyStatus[]> = {
  Draft: ['Diserahkan'],
  Diserahkan: ['Verifikasi'],
  Verifikasi: [],
  Lulus: [],
  'Perlu Perbaikan': ['Diserahkan'],
};

/**
 * Transisi yang boleh ditawarkan langsung dari tabel (bukan keputusan review).
 * Keputusan Lulus / Perlu Perbaikan hanya dibuat di layar Verifikasi.
 */
export function allowedSurveyStatusOptions(role: WorkflowRole, current: string): SurveyStatus[] {
  if (!SURVEY_STATUSES.includes(current as SurveyStatus)) return [];
  const from = current as SurveyStatus;
  // Gunakan guard yang sama dengan eksekusi aksi agar opsi pada tabel dan
  // matriks hak akses tidak pernah berbeda.
  return OPERATIONAL_TRANSITIONS[from].filter(next => canSetSurveyStatus(role, from, next));
}

/**
 * Validasi transisi untuk aksi UI mana pun, termasuk layar review legacy.
 * Bukan pengganti otorisasi server; ini guard frontend.
 */
export function canSetSurveyStatus(role: WorkflowRole, from: string, to: string): boolean {
  if (from === to) return false;
  if (to === 'Lulus' || to === 'Perlu Perbaikan') {
    return from === 'Verifikasi' && canRole(role, 'reviewValidation');
  }
  if (to === 'Diserahkan') {
    return ['Draft', 'Perlu Perbaikan'].includes(from) && canRole(role, 'enterSurvey');
  }
  if (to === 'Verifikasi') {
    return from === 'Diserahkan' && canRole(role, 'reviewValidation');
  }
  return false;
}

export function isSurveyDecision(status: string): status is SurveyDecision {
  return status === 'Lulus' || status === 'Perlu Perbaikan';
}
