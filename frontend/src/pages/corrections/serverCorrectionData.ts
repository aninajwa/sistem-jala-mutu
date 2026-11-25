import { apiRequest } from '../../auth/client';

export type CorrectionCapabilities = { read: boolean; write: boolean; reason: string | null };
export type ServerCorrectionCase = {
  packageId: string;
  correctionId: number;
  caseId: number;
  status: string;
  version: number | null;
  severity: string;
  description: string;
  source: string;
  road: string;
  data: Record<string, unknown>;
};
type Envelope<T> = { data: T };
const statuses = new Set(['Terbuka', 'Menunggu Persetujuan', 'Disetujui', 'Dilaksanakan', 'Verifikasi Ulang', 'Ditutup']);
const object = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
const id = (value: unknown) => Number.isSafeInteger(value) && Number(value) > 0;

function unwrapCase(raw: unknown, packageId: string): ServerCorrectionCase[] {
  const item = object(raw);
  const issue = object(item?.kasus_temuan);
  if (!issue || !id(issue.kasus_id) || typeof issue.status !== 'string' || !statuses.has(issue.status)) throw new Error('Bentuk kasus koreksi dari server tidak sesuai kontrak.');
  const caseStatus = issue.status;
  const correctionRows = Array.isArray(item?.koreksi_data) ? item!.koreksi_data : [];
  return correctionRows.flatMap(value => {
    const wrapper = object(value);
    const correction = object(wrapper?.koreksi_data);
    if (!correction || !id(correction.koreksi_id)) return [];
    return [{
      packageId, correctionId: Number(correction.koreksi_id), caseId: Number(issue.kasus_id),
      status: caseStatus, version: Number.isSafeInteger(correction.versi) ? Number(correction.versi) : null,
      severity: typeof issue.tingkat === 'string' ? issue.tingkat : 'Belum ditetapkan',
      description: typeof issue.uraian === 'string' ? issue.uraian : '',
      source: typeof issue.sumber === 'string' ? issue.sumber : 'Temuan koreksi',
      road: typeof correction.ruas === 'string' ? correction.ruas : 'Ruas belum ditetapkan',
      data: { ...issue, ...correction, verification: wrapper?.verifikasi_koreksi ?? [], actions: item?.tindakan_perbaikan ?? [], history: item?.riwayat_status_kasus ?? [] },
    }];
  });
}

export function normalizeCorrectionCases(value: unknown, packageId: string) {
  if (!Array.isArray(value)) throw new Error('Daftar Correction bukan array.');
  return value.flatMap(item => unwrapCase(item, packageId));
}

export async function getCorrectionCapabilities(packageId: string, signal?: AbortSignal) {
  const response = await apiRequest<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/koreksi-capabilities`, { signal });
  const value = object(response.data);
  if (!value || typeof value.read !== 'boolean' || typeof value.write !== 'boolean' || !(value.reason === null || typeof value.reason === 'string')) throw new Error('Respons kapabilitas Correction tidak sesuai kontrak.');
  return value as CorrectionCapabilities;
}

export async function listPackageCorrections(packageId: string, signal?: AbortSignal) {
  const response = await apiRequest<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/koreksi`, { signal });
  return normalizeCorrectionCases(response.data, packageId);
}

export async function getCorrectionDetail(packageId: string, correctionId: number, signal?: AbortSignal) {
  const response = await apiRequest<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/koreksi/${correctionId}`, { signal });
  const rows = unwrapCase(response.data, packageId);
  const selected = rows.find(row => row.correctionId === correctionId);
  if (!selected) throw new Error('Respons detail tidak memuat koreksi yang diminta.');
  return selected;
}

export async function submitCorrectionAction(packageId: string, correctionId: number, expectedVersion: number, patch: Record<string, unknown>) {
  return apiRequest<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/koreksi/${correctionId}`, {
    method: 'PATCH', body: JSON.stringify({ ...patch, expected_version: expectedVersion }),
  });
}

export async function submitCorrection(packageId: string, correctionId: number, expectedVersion: number) {
  return apiRequest<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/koreksi/${correctionId}/ajukan`, { method: 'POST', body: JSON.stringify({ expected_version: expectedVersion }) });
}

export async function reviewCorrection(packageId: string, correctionId: number, expectedVersion: number, keputusan: 'Disetujui' | 'Perlu Revisi', catatan: string) {
  return apiRequest<Envelope<unknown>>(`/paket/${encodeURIComponent(packageId)}/koreksi/${correctionId}/review`, { method: 'POST', body: JSON.stringify({ expected_version: expectedVersion, keputusan, catatan }) });
}

export async function submitCorrectionAndReadBack(packageId: string, correctionId: number, expectedVersion: number) {
  await submitCorrection(packageId, correctionId, expectedVersion);
  return getCorrectionDetail(packageId, correctionId);
}

export async function reviewCorrectionAndReadBack(packageId: string, correctionId: number, expectedVersion: number, keputusan: 'Disetujui' | 'Perlu Revisi', catatan: string) {
  await reviewCorrection(packageId, correctionId, expectedVersion, keputusan, catatan);
  return getCorrectionDetail(packageId, correctionId);
}

export function mapCorrectionRpcError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/40001|versi/i.test(message)) return 'Data berubah sejak dibaca. Muat ulang detail sebelum mencoba lagi.';
  if (/PGRST202|schema cache|function.*not found/i.test(message)) return 'Kontrak Correction belum tersedia pada database ini. Tidak ada perubahan yang disimpan.';
  if (/42501|403|tidak berwenang/i.test(message)) return 'Akun atau cakupan paket tidak berwenang untuk tindakan ini.';
  return message || 'Permintaan Correction gagal; periksa status server sebelum mengulangi.';
}
