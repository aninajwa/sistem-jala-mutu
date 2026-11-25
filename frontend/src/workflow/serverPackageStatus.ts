import type { PackageWorkflowItem } from './roleNavigation';

export type ServerStageState = 'complete' | 'pending' | 'blocked' | 'loading' | 'error' | 'unknown';
export type ServerStageFact = { state: ServerStageState; label: string };
export type ServerStageFacts = Partial<Record<PackageWorkflowItem['code'], ServerStageFact>>;
export type StageTilePresentation = {
  state: ServerStageState;
  ariaCurrent: 'step' | undefined;
  showCompletionIcon: boolean;
  accessibleLabel: string;
};

export const UNKNOWN_SERVER_STAGE: ServerStageFact = {
  state: 'unknown',
  label: 'Belum diverifikasi',
};

export const UNKNOWN_AGGREGATE_STATUS = 'Status keseluruhan belum tersedia';

/** Only authoritative server facts may change a server stage's presentation. */
export function preparationStageFact(input: {
  submissionStatus?: string | null;
  checklistStatus?: string | null;
  loading?: boolean;
  error?: boolean;
}): ServerStageFact {
  if (input.submissionStatus === 'DISETUJUI') {
    return { state: 'complete', label: 'Persiapan disetujui' };
  }
  if (input.submissionStatus === 'DIAJUKAN') {
    return { state: 'pending', label: 'Menunggu review PIC' };
  }
  if (input.submissionStatus === 'PERLU_REVISI') {
    return { state: 'blocked', label: 'Perlu revisi' };
  }
  if (input.checklistStatus === 'DRAFT') {
    return { state: 'pending', label: 'Persiapan berupa draf' };
  }
  if (input.error) return { state: 'error', label: 'Gagal memuat status' };
  if (input.loading) return { state: 'loading', label: 'Memuat status' };
  return UNKNOWN_SERVER_STAGE;
}

/** Tahap 1 is complete only when the server confirms the current PIC-approved snapshot and opens Tahap 2. */
export function stage1ConfirmationFact(input: {
  active?: boolean;
  status?: string | null;
  snapshotMatches?: boolean;
  stage2Allowed?: boolean;
  loading?: boolean;
  error?: boolean;
}): ServerStageFact {
  if (input.active && input.status === 'DISETUJUI' && input.snapshotMatches === true && input.stage2Allowed === true) {
    return { state: 'complete', label: 'Dikonfirmasi PIC · Tahap 2 diizinkan' };
  }
  if (input.error) return { state: 'error', label: 'Gagal memuat status konfirmasi PIC' };
  if (input.loading) return { state: 'loading', label: 'Memuat status konfirmasi PIC' };
  if (input.status === 'DISETUJUI' && input.snapshotMatches === false) {
    return { state: 'blocked', label: 'Konfirmasi kedaluwarsa · rekod berubah' };
  }
  if (input.status === 'PERLU_REVISI') return { state: 'blocked', label: 'Perlu koreksi PIC' };
  if (input.status === 'DIAJUKAN') return { state: 'pending', label: 'Menunggu keputusan PIC' };
  return UNKNOWN_SERVER_STAGE;
}

/** The installed Tahap 2 API exposes per-trial decisions, not package completion. */
export function stage2PackageFact(input: {
  completion?: {
    state: 'complete' | 'partial' | 'unavailable';
    approved_count: number | null;
    total_count: number | null;
    label: string;
  } | null;
  loading?: boolean;
  error?: boolean;
}): ServerStageFact {
  if (input.error) return { state: 'error', label: 'Status Tahap 2 belum tersedia dari server' };
  if (input.loading) return { state: 'loading', label: 'Memuat status Tahap 2 dari server' };
  if (!input.completion) return { state: 'unknown', label: 'Status Tahap 2 belum tersedia dari server' };
  if (input.completion.state === 'complete' && input.completion.total_count &&
    input.completion.approved_count === input.completion.total_count) {
    return { state: 'complete', label: input.completion.label };
  }
  if (input.completion.state === 'partial') return { state: 'pending', label: input.completion.label };
  return { state: 'unknown', label: input.completion.label };
}

export type FinalStagesProgress = {
  status_paket: string | null;
  tahap4: 'DRAFT' | 'DIAJUKAN' | 'PERLU_REVISI' | 'DISETUJUI';
  audit: Partial<Record<'1' | '2' | '3', string>>;
  koreksi_audit_terbuka: number;
  termin_selesai: number;
  termin_total: number;
  penerimaan_akhir: boolean;
  jumlah_sesi_survei?: number;
  jumlah_siklus_verval?: number;
};

/** Tahap 4-6 rail facts from baca_progres_tahap_akhir; only server states mark a stage complete. */
export function finalStagesFacts(progress: FinalStagesProgress | null, loading = false, error = false): ServerStageFacts {
  if (error) {
    const failed: ServerStageFact = { state: 'error', label: 'Gagal memuat status' };
    return { 'Tahap 4': failed, 'Tahap 5': failed, 'Tahap 6': failed };
  }
  if (loading || !progress) {
    const pending: ServerStageFact = { state: loading ? 'loading' : 'unknown', label: loading ? 'Memuat status' : 'Belum diverifikasi' };
    return { 'Tahap 4': pending, 'Tahap 5': pending, 'Tahap 6': pending };
  }
  const tahap4: ServerStageFact = progress.tahap4 === 'DISETUJUI' ? { state: 'complete', label: 'Disetujui PIC Balai' }
    : progress.tahap4 === 'DIAJUKAN' ? { state: 'pending', label: 'Menunggu review PIC' }
      : progress.tahap4 === 'PERLU_REVISI' ? { state: 'blocked', label: 'Perlu revisi' }
        : { state: 'unknown', label: 'Belum diajukan' };
  const passed = (['1', '2', '3'] as const).filter(level => progress.audit[level] === 'Lulus').length;
  const rejected = (['1', '2', '3'] as const).some(level => progress.audit[level] === 'Ditolak');
  const tahap5: ServerStageFact = passed === 3 ? { state: 'complete', label: 'Audit tingkat 1–3 Lulus' }
    : rejected || progress.koreksi_audit_terbuka > 0 ? { state: 'blocked', label: 'Audit ditolak · koreksi berjalan' }
      : passed > 0 || Object.values(progress.audit).includes('Dalam Review') ? { state: 'pending', label: `${passed}/3 tingkat Lulus` }
        : { state: 'unknown', label: 'Audit belum dimulai' };
  const tahap6: ServerStageFact = progress.penerimaan_akhir ? { state: 'complete', label: 'Penerimaan akhir · paket SELESAI' }
    : progress.termin_selesai > 0 ? { state: 'pending', label: `${progress.termin_selesai}/${progress.termin_total} termin diterima` }
      : { state: 'unknown', label: 'Belum ada penerimaan' };
  // Rule approved 2026-11-25: the survey period (3A daily survey, 3B 14-day verval) ends when the PIC approves Tahap 4.
  const surveyClosed = progress.tahap4 === 'DISETUJUI';
  const tahap3b: ServerStageFact = surveyClosed ? { state: 'complete', label: 'Periode verval ditutup · Tahap 4 disetujui' }
    : (progress.jumlah_siklus_verval ?? 0) > 0 ? { state: 'pending', label: `${progress.jumlah_siklus_verval} siklus verval berjalan` }
      : { state: 'unknown', label: 'Belum ada siklus verval' };
  return {
    ...(surveyClosed ? { 'Tahap 3A': { state: 'complete', label: 'Periode survei ditutup · Tahap 4 disetujui' } as ServerStageFact } : {}),
    'Tahap 3B': tahap3b, 'Tahap 4': tahap4, 'Tahap 5': tahap5, 'Tahap 6': tahap6,
  };
}

/** Selection is navigation only; it never implies a stage passed. */
export function serverStageFactFor(
  code: PackageWorkflowItem['code'],
  facts: ServerStageFacts = {},
): ServerStageFact {
  return facts[code] ?? UNKNOWN_SERVER_STAGE;
}

/** Selection is exposed separately from the server state so it cannot mask completion. */
export function stageTilePresentation(
  code: PackageWorkflowItem['code'],
  label: string,
  fact: ServerStageFact,
  selected: boolean,
): StageTilePresentation {
  return {
    state: fact.state,
    ariaCurrent: selected ? 'step' : undefined,
    showCompletionIcon: fact.state === 'complete',
    accessibleLabel: `${code} · ${label} · ${selected ? 'halaman dibuka · ' : ''}${fact.label}`,
  };
}
