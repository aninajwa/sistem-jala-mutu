import { ApiError } from '../auth/client';

export type Stage1ConfirmationStatus = 'NONAKTIF' | 'BELUM_DIAJUKAN' | 'DIAJUKAN' | 'PERLU_REVISI' | 'DISETUJUI';
export type Stage1Confirmation = {
  aktif: boolean;
  paket_id: number;
  status: Stage1ConfirmationStatus;
  versi: number;
  snapshot_saat_ini: unknown;
  pengajuan: { audit_id?: string; versi: number; diajukan_oleh?: number; diajukan_pada?: string; snapshot: unknown } | null;
  review: { audit_id?: string; pengguna_id?: number; keputusan: string; catatan: string | null; waktu?: string } | null;
  snapshot_sesuai: boolean;
  stage2_allowed: boolean;
  alasan?: string;
};

export type Stage1ConfirmationRequest = <T>(path: string, init?: RequestInit) => Promise<T>;
type Envelope<T> = { data: T };
const statuses: Stage1ConfirmationStatus[] = ['NONAKTIF', 'BELUM_DIAJUKAN', 'DIAJUKAN', 'PERLU_REVISI', 'DISETUJUI'];

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function stage1ConfirmationBlockers(state: Stage1Confirmation): string[] {
  if (!state.aktif) return [state.alasan || 'Kontrak konfirmasi PIC Tahap 1 belum diaktifkan.'];
  const snapshot = record(state.snapshot_saat_ini);
  if (!snapshot || !Array.isArray(snapshot.applicable_surveys)) {
    return ['Snapshot server belum memuat scope survei kontrak.'];
  }
  const blockers = Array.isArray(snapshot.blockers)
    ? snapshot.blockers.filter((item): item is string => typeof item === 'string')
    : [];
  if (!snapshot.applicable_surveys.length && !blockers.includes('DECLARED_SCOPE_UNSET')) {
    blockers.push('DECLARED_SCOPE_UNSET');
  }
  return blockers;
}

export function stage1ConfirmationSurveyCount(state: Stage1Confirmation): number | null {
  const snapshot = record(state.snapshot_saat_ini);
  return Array.isArray(snapshot?.applicable_surveys) ? snapshot.applicable_surveys.length : null;
}

function parseConfirmation(value: unknown, packageId: string): Stage1Confirmation {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Respons konfirmasi kalibrasi bukan objek.');
  const row = value as Partial<Stage1Confirmation>;
  if (row.paket_id !== Number(packageId) || !statuses.includes(row.status as Stage1ConfirmationStatus) ||
    typeof row.aktif !== 'boolean' || !Number.isSafeInteger(row.versi) ||
    typeof row.snapshot_sesuai !== 'boolean' || typeof row.stage2_allowed !== 'boolean' ||
    !(row.pengajuan === null || (typeof row.pengajuan === 'object' && row.pengajuan !== null && !Array.isArray(row.pengajuan) && 'snapshot' in row.pengajuan)) ||
    !(row.review === null || (typeof row.review === 'object' && row.review !== null && !Array.isArray(row.review) &&
      typeof row.review.keputusan === 'string' && (row.review.catatan === null || typeof row.review.catatan === 'string')))) {
    throw new Error('Respons konfirmasi kalibrasi tidak lengkap atau tidak sesuai paket.');
  }
  if (!row.aktif && row.stage2_allowed) throw new Error('Server memberi izin Tahap 2 ketika kontrak konfirmasi tidak aktif.');
  if (row.stage2_allowed && (row.status !== 'DISETUJUI' || !row.snapshot_sesuai)) {
    throw new Error('Status Tahap 2 tidak cocok dengan keputusan dan snapshot konfirmasi.');
  }
  const normalizeAuditId = (item: unknown): string | undefined => {
    if (item === undefined) return undefined;
    if (typeof item === 'string' && /^\d+$/.test(item)) return item;
    if (typeof item === 'number' && Number.isSafeInteger(item) && item >= 0) return String(item);
    throw new Error('ID audit konfirmasi kalibrasi tidak valid.');
  };
  const pengajuan = row.pengajuan === null ? null : {
    ...row.pengajuan,
    ...(row.pengajuan.audit_id === undefined ? {} : { audit_id: normalizeAuditId(row.pengajuan.audit_id) }),
  };
  const review = row.review === null ? null : {
    ...row.review,
    ...(row.review.audit_id === undefined ? {} : { audit_id: normalizeAuditId(row.review.audit_id) }),
  };
  return { ...row, pengajuan, review } as Stage1Confirmation;
}

export class Stage1ConfirmationOutcomeUncertainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Stage1ConfirmationOutcomeUncertainError';
  }
}

export async function getStage1Confirmation(packageId: string, request: Stage1ConfirmationRequest, signal?: AbortSignal) {
  const result = await request<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/konfirmasi-kalibrasi`, { signal });
  return parseConfirmation(result?.data, packageId);
}

function sameSnapshot(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export async function submitStage1Confirmation(
  packageId: string,
  expectedVersion: number,
  request: Stage1ConfirmationRequest,
) {
  let submitted: Stage1Confirmation | null = null;
  try {
    const response = await request<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/konfirmasi-kalibrasi/pengajuan`, {
      method: 'POST',
      body: JSON.stringify({ expected_version: expectedVersion }),
    });
    try { submitted = parseConfirmation(response?.data, packageId); } catch { /* Recover only through the authoritative GET below. */ }
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) throw error;
    // A transport/5xx failure may happen after the server committed the submission.
  }
  let refreshed: Stage1Confirmation;
  try {
    refreshed = await getStage1Confirmation(packageId, request);
  } catch (error) {
    throw new Stage1ConfirmationOutcomeUncertainError(`Pengajuan mungkin sudah tersimpan. Status server belum dapat dibaca; muat ulang status dan jangan hantar semula dahulu. ${error instanceof Error ? error.message : ''}`.trim());
  }
  if (refreshed.status !== 'DIAJUKAN' || refreshed.versi !== expectedVersion + 1 ||
    !refreshed.pengajuan ||
    (submitted?.pengajuan && !sameSnapshot(submitted.pengajuan.snapshot, refreshed.pengajuan.snapshot)) ||
    !sameSnapshot(refreshed.pengajuan.snapshot, refreshed.snapshot_saat_ini)) {
    throw new Stage1ConfirmationOutcomeUncertainError('Pengajuan mungkin sudah tersimpan, tetapi bacaan server belum mengesahkan status dan snapshot yang dijangka. Muat ulang status dan jangan hantar semula dahulu.');
  }
  return refreshed;
}

export async function reviewStage1Confirmation(
  packageId: string,
  input: { expected_version: number; keputusan: 'DISETUJUI' | 'PERLU_REVISI'; catatan: string },
  request: Stage1ConfirmationRequest,
) {
  let decided: Stage1Confirmation | null = null;
  try {
    const response = await request<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/konfirmasi-kalibrasi/review`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    try { decided = parseConfirmation(response?.data, packageId); } catch { /* Recover only through the authoritative GET below. */ }
  } catch (error) {
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) throw error;
    // A transport/5xx failure may happen after the PIC decision committed.
  }

  let refreshed: Stage1Confirmation;
  try {
    refreshed = await getStage1Confirmation(packageId, request);
  } catch (error) {
    throw new Stage1ConfirmationOutcomeUncertainError(
      `Server mungkin menerima keputusan PIC, tetapi bacaan ulang gagal. Muat ulang status sebelum mencuba lagi. ${error instanceof Error ? error.message : ''}`.trim(),
    );
  }
  if (refreshed.status !== input.keputusan || refreshed.review?.keputusan !== input.keputusan ||
    refreshed.versi !== input.expected_version + 1 || !refreshed.pengajuan ||
    (decided?.pengajuan && !sameSnapshot(decided.pengajuan.snapshot, refreshed.pengajuan.snapshot)) ||
    (input.keputusan === 'DISETUJUI' && (!refreshed.stage2_allowed || !refreshed.snapshot_sesuai)) ||
    (input.keputusan === 'PERLU_REVISI' && refreshed.stage2_allowed)) {
    throw new Stage1ConfirmationOutcomeUncertainError(
      'Bacaan ulang belum mengesahkan keputusan PIC pada versi dan snapshot yang dijangka. Muat ulang status sebelum mencuba lagi.',
    );
  }
  return refreshed;
}
