import type { ProtectedGet } from './serverStage3Data';

export type VervalCycle = {
  siklus_id: number;
  paket_id?: number;
  siklus_ke?: number | null;
  periode_mulai?: string | null;
  periode_selesai?: string | null;
  status?: string | null;
  [key: string]: unknown;
};

export type ConsistencyCheck = {
  konsistensi_id: number;
  siklus_id?: number | null;
  jenis_survei_id?: number | null;
  tim_id?: number | null;
  ruas_id?: number | null;
  sta_awal?: number | null;
  sta_akhir?: number | null;
  jumlah_ulangan?: number | null;
  status?: string | null;
  ulangan?: unknown[];
  [key: string]: unknown;
};

type DataResponse<T> = { data: T };

function assertArray<T>(value: unknown, label: string): T[] {
  if (!Array.isArray(value)) throw new Error(`Respons ${label} tidak sesuai kontrak (senarai dijangka).`);
  return value as T[];
}

export async function getVervalCycles(packageId: string, request: ProtectedGet, signal?: AbortSignal) {
  const response = await request<DataResponse<unknown>>(`/paket/${encodeURIComponent(packageId)}/siklus-verval`, { signal });
  return assertArray<VervalCycle>(response?.data, 'siklus Verval');
}

export async function getVervalCycle(packageId: string, cycleId: number, request: ProtectedGet, signal?: AbortSignal) {
  const response = await request<DataResponse<unknown>>(
    `/paket/${encodeURIComponent(packageId)}/siklus-verval/${encodeURIComponent(String(cycleId))}`,
    { signal },
  );
  if (!response?.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
    throw new Error('Respons detail siklus Verval tidak sesuai kontrak.');
  }
  return response.data as VervalCycle;
}

export async function getVervalConsistency(packageId: string, cycleId: number, request: ProtectedGet, signal?: AbortSignal) {
  const response = await request<DataResponse<unknown>>(
    `/paket/${encodeURIComponent(packageId)}/siklus-verval/${encodeURIComponent(String(cycleId))}/uji-konsistensi`,
    { signal },
  );
  return assertArray<ConsistencyCheck>(response?.data, 'uji konsistensi');
}

export function displayVervalValue(key: string, value: unknown) {
  if (key === 'status' && (value === null || value === undefined || value === '')) return 'Belum ditetapkan';
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
