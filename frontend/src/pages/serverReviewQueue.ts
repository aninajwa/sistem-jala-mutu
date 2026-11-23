import { useEffect, useState } from 'react';
import { apiRequest } from '../auth/client';
import type { BalaiReviewItem, ReviewStatus } from '../workflow/balaiReviewQueue';
import { PACKAGE_WORKFLOW_ITEMS } from '../workflow/roleNavigation';

export type ReviewQueueRow = {
  paket_id: number;
  nama_paket: string;
  balai_id: number | null;
  tahap: 'Tahap 0' | 'Tahap 1' | 'Tahap 2';
  jenis: string;
  status: string;
  uji_coba_id?: number;
};

const STAGES = new Set(['Tahap 0', 'Tahap 1', 'Tahap 2']);
const FORMAT_ERROR = 'Format antrean pemeriksaan tidak sesuai.';

function isRow(value: unknown): value is ReviewQueueRow {
  const row = value as Partial<ReviewQueueRow> | null;
  return !!row && typeof row === 'object'
    && Number.isSafeInteger(row.paket_id)
    && typeof row.nama_paket === 'string'
    && (row.balai_id === null || Number.isSafeInteger(row.balai_id))
    && STAGES.has(row.tahap as string)
    && typeof row.jenis === 'string'
    && typeof row.status === 'string'
    && (row.uji_coba_id === undefined || Number.isSafeInteger(row.uji_coba_id));
}

/** Validates the GET /review-queue body. */
export function parseReviewQueue(body: unknown): { rows: ReviewQueueRow[]; partial: boolean } {
  const value = body as { data?: unknown; partial?: unknown } | null;
  if (!value || !Array.isArray(value.data) || typeof value.partial !== 'boolean' || !value.data.every(isRow)) {
    throw new Error(FORMAT_ERROR);
  }
  return { rows: value.data, partial: value.partial };
}

const statusFor = (status: string): ReviewStatus =>
  status === 'DIAJUKAN' ? 'Perlu Review'
    : status === 'PERLU_REVISI' ? 'Perlu Perbaikan'
      : status === 'DISETUJUI' ? 'Selesai/Lulus'
        : 'Menunggu';

const reasonFor = (status: ReviewStatus) =>
  status === 'Perlu Review' ? 'Pengajuan Penyedia menunggu keputusan Balai.'
    : status === 'Perlu Perbaikan' ? 'Balai meminta perbaikan; menunggu pengajuan ulang Penyedia.'
      : status === 'Selesai/Lulus' ? 'Keputusan Balai tercatat di server.'
        : 'Belum diajukan oleh Penyedia.';

/** Server rows in the shape the Dirah queue screens already render. */
export function reviewQueueToBalaiItems(rows: ReviewQueueRow[], balaiName: (id: number | null) => string): BalaiReviewItem[] {
  return rows.map(row => {
    const status = statusFor(row.status);
    return {
      id: `${row.paket_id}:${row.tahap}:${row.uji_coba_id ?? row.jenis}`,
      packageId: String(row.paket_id),
      packageName: row.nama_paket,
      balai: balaiName(row.balai_id),
      stage: row.tahap,
      kind: row.jenis,
      status,
      reason: reasonFor(status),
      note: '',
      selection: PACKAGE_WORKFLOW_ITEMS.find(item => item.code === row.tahap)?.selection ?? '/packages:Ringkasan Paket',
    };
  });
}

/** Server mode never falls back to local projections: until rows arrive, the queue is empty. */
export function reviewQueueForRender(enabled: boolean, items: BalaiReviewItem[] | undefined): BalaiReviewItem[] | undefined {
  return enabled ? items ?? [] : undefined;
}

/** Loads the review queue once per session when enabled (authenticated reviewer roles). */
export function useServerReviewQueue(enabled: boolean) {
  const [items, setItems] = useState<BalaiReviewItem[] | undefined>(undefined);
  useEffect(() => {
    if (!enabled) { setItems(undefined); return; }
    const controller = new AbortController();
    const balais = apiRequest<{ data?: Array<{ balai_id: number; nama: string }> }>('/balai', { signal: controller.signal })
      .then(body => new Map((Array.isArray(body.data) ? body.data : []).map(row => [row.balai_id, row.nama])))
      .catch(() => new Map<number, string>());
    Promise.all([apiRequest<unknown>('/review-queue', { signal: controller.signal }), balais])
      .then(([body, names]) => {
        if (controller.signal.aborted) return;
        const balaiName = (id: number | null) => (id === null ? 'Balai belum tercatat' : names.get(id) ?? `Balai #${id}`);
        setItems(reviewQueueToBalaiItems(parseReviewQueue(body).rows, balaiName));
      })
      // On failure the screens show an empty server queue rather than local demo counts.
      .catch(() => { if (!controller.signal.aborted) setItems([]); });
    return () => controller.abort();
  }, [enabled]);
  return reviewQueueForRender(enabled, items);
}
