import { apiRequest, supabase } from '../auth/client';
import type { ServerChecklist, ServerPreparationDocument } from './serverPreparation';
type DocumentRequester = <T = unknown>(path: string, init?: RequestInit) => Promise<T>;
const defaultRequest: DocumentRequester = async <T>(path: string, init?: RequestInit) => {
  return apiRequest<T>(path, init);
};

export const DIRAH_DOCUMENT_CATEGORIES = [
  'Laporan Pendahuluan',
  'Program Mutu / Quality Management Plan',
  'RMPK',
  'RKK',
  'RMLLP',
  'Bukti Koordinasi',
] as const;

const categoryContract: Record<string, { kind: string; checklistCode: string } | undefined> = {
  'Laporan Pendahuluan': { kind: 'LAPORAN_PENDAHULUAN', checklistCode: 'DOK-01' },
  'Program Mutu / Quality Management Plan': { kind: 'PROGRAM_MUTU', checklistCode: 'DOK-09' },
};

export function mapServerDocumentCategory(document: ServerPreparationDocument): string | null {
  const kind = document.jenis_dokumen?.kode;
  if (kind === 'LAPORAN_PENDAHULUAN') return 'Laporan Pendahuluan';
  if (kind === 'PROGRAM_MUTU') return 'Program Mutu / Quality Management Plan';
  return null;
}

export function documentsForCategory(documents: ServerPreparationDocument[], category: string) {
  const contract = categoryContract[category];
  return contract ? documents.filter(document => document.jenis_dokumen?.kode === contract.kind) : [];
}

export function checklistItemForDocumentCategory(checklist: ServerChecklist, category: string) {
  const contract = categoryContract[category];
  return contract ? checklist.items.find(item => item.kode === contract.checklistCode) : undefined;
}

export function canUseServerDocumentCategory(category: string): boolean {
  return !!categoryContract[category];
}

export async function linkPreparationDocument(packageId: string, checklist: ServerChecklist, documentId: number, category: string, request: DocumentRequester = defaultRequest) {
  const item = checklistItemForDocumentCategory(checklist, category);
  if (!item) throw new Error('Kategori dokumen tidak mempunyai item bukti checklist yang disahkan.');
  const document = await request<{ data: ServerPreparationDocument[] }>(`/paket/${encodeURIComponent(packageId)}/dokumen`);
  const selected = document.data.find(row => row.dokumen_id === documentId);
  if (!selected || selected.paket_id !== checklist.paket_id || selected.jenis_dokumen?.kode !== categoryContract[category]?.kind) {
    throw new Error('Dokumen bukan milik paket ini atau jenisnya tidak sepadan dengan kategori.');
  }
  await request(`/paket/${encodeURIComponent(packageId)}/checklist-persiapan/bukti`, {
    method: 'PATCH',
    body: JSON.stringify({ expected_version: checklist.pengisian.versi, item_id: item.item_id, bukti_dokumen_id: documentId }),
  });
}

export async function uploadPreparationDocument(packageId: string, checklist: ServerChecklist, category: string, file: File, title = file.name.replace(/\.pdf$/i, ''), request: DocumentRequester = defaultRequest) {
  const contract = categoryContract[category];
  if (!contract) throw new Error('Upload belum disokong untuk kategori ini.');
  if (file.type !== 'application/pdf' || !/\.pdf$/i.test(file.name) || file.size < 1 || file.size > 10 * 1024 * 1024) {
    throw new Error('Pilih fail PDF yang sah, maksimum 10 MB.');
  }
  const form = new FormData();
  form.append('judul', title.trim() || file.name);
  form.append('jenis_dokumen', contract.kind);
  form.append('file', file);
  const result = await request<{ data: { dokumen?: { dokumen_id?: number } } }>(`/paket/${encodeURIComponent(packageId)}/dokumen`, { method: 'POST', body: form });
  const documentId = Number(result.data?.dokumen?.dokumen_id);
  if (!Number.isSafeInteger(documentId) || documentId < 1) throw new Error('Upload tidak memulangkan ID dokumen yang sah.');
  await linkPreparationDocument(packageId, checklist, documentId, category, request);
  return documentId;
}

export async function addPreparationDocumentVersion(packageId: string, document: ServerPreparationDocument, file: File, expectedVersion = document.versi_aktif, request: DocumentRequester = defaultRequest) {
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1) throw new Error('Versi dokumen tidak sah. Muat semula senarai.');
  if (file.type !== 'application/pdf' || !/\.pdf$/i.test(file.name) || file.size < 1 || file.size > 10 * 1024 * 1024) {
    throw new Error('Pilih fail PDF yang sah, maksimum 10 MB.');
  }
  const form = new FormData();
  form.append('expected_version', String(expectedVersion));
  form.append('file', file);
  await request(`/paket/${encodeURIComponent(packageId)}/dokumen/${document.dokumen_id}/versi`, { method: 'POST', body: form });
}

export type ServerDocumentDetail = {
  dokumen: ServerPreparationDocument;
  versi_aktif: { versi_ke: number; nama_file: string; ukuran_byte: number };
  riwayat_versi: Array<{ versi_ke: number; nama_file: string; ukuran_byte: number; aktif: boolean }>;
  pagination: { page: number; total_pages: number; has_next: boolean };
};

export function getPreparationDocumentDetail(packageId: string, documentId: number, page = 1) {
  return defaultRequest<{ data: ServerDocumentDetail }>(`/paket/${encodeURIComponent(packageId)}/dokumen/${documentId}?page=${page}`);
}

export async function downloadPreparationDocument(packageId: string, documentId: number, version?: number) {
  if (!supabase) throw new Error('Konfigurasi login tidak tersedia.');
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error('Sesi telah berakhir. Silakan masuk kembali.');
  const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
  const response = await fetchPreparationDocument(packageId, documentId, data.session.access_token, version, fetch, base);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || `Gagal mengunduh dokumen (${response.status}).`);
  }
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const fileName = /filename="?([^";]+)"?/i.exec(disposition)?.[1] || `dokumen-${documentId}.pdf`;
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function fetchPreparationDocument(packageId: string, documentId: number, accessToken: string, version?: number, fetcher: typeof fetch = fetch, base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')) {
  const suffix = version === undefined ? 'download' : `versi/${version}/download`;
  return fetcher(`${base}/paket/${encodeURIComponent(packageId)}/dokumen/${documentId}/${suffix}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15000),
  });
}
