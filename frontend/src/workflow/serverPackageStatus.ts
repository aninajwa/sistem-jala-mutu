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
