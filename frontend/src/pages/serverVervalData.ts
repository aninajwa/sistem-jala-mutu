import type { ProtectedGet } from './serverStage3Data';

export type VervalCycle = {
  siklus_id: number;
  paket_id?: number;
  siklus_ke?: number | null;
  periode_mulai?: string | null;
  periode_selesai?: string | null;
  status?: string | null;
  versi?: number;
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
  versi?: number;
  ulangan?: unknown[];
  [key: string]: unknown;
};
export type Stage3BCapabilities = { read: boolean; write: boolean; reason: string | null };
export type ConsistencyInput = {
  request_id: string;
  expected_version: number;
  jenis_survei_id: number;
  tim_id: number;
  ruas_id: number;
  sta_awal: number;
  sta_akhir: number;
  ulangan: { ulangan_ke: number; rater_personel_id: number; nilai: number }[];
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

export async function getStage3BCapabilities(packageId: string, request: ProtectedGet, signal?: AbortSignal) {
  const response = await request<DataResponse<unknown>>(`/paket/${encodeURIComponent(packageId)}/siklus-verval/capabilities`, { signal });
  const value = response?.data as Stage3BCapabilities | null;
  if (!value || typeof value.read !== 'boolean' || typeof value.write !== 'boolean' || !(value.reason === null || typeof value.reason === 'string')) {
    throw new Error('Respons kesiapan Stage 3B tidak sesuai kontrak.');
  }
  return value;
}

export async function createVervalCycleAndConfirm(packageId: string, request: ProtectedGet, requestId: string = crypto.randomUUID()) {
  const response = await request<DataResponse<unknown>>(`/paket/${encodeURIComponent(packageId)}/siklus-verval`, {
    method: 'POST', body: JSON.stringify({ request_id: requestId }),
  });
  const created = response?.data as VervalCycle | null;
  if (!created || !Number.isSafeInteger(created.siklus_id) || created.siklus_id < 1) throw new Error('Respons pembukaan siklus tidak mempunyai ID sah.');
  const [detail, cycles] = await Promise.all([getVervalCycle(packageId, created.siklus_id, request), getVervalCycles(packageId, request)]);
  if (detail.siklus_id !== created.siklus_id || !cycles.some(row => row.siklus_id === created.siklus_id)) throw new Error('Siklus dibuat tetapi belum terkonfirmasi melalui GET. Muat ulang sebelum mencoba lagi.');
  return { cycle: detail, cycles };
}

export async function saveConsistencyAndConfirm(packageId: string, cycleId: number, input: ConsistencyInput, request: ProtectedGet) {
  const response = await request<DataResponse<unknown>>(`/paket/${encodeURIComponent(packageId)}/siklus-verval/${cycleId}/uji-konsistensi`, {
    method: 'POST', body: JSON.stringify(input),
  });
  const created = response?.data as ConsistencyCheck | null;
  if (!created || !Number.isSafeInteger(created.konsistensi_id) || created.konsistensi_id < 1) throw new Error('Respons simpan konsistensi tidak mempunyai ID sah.');
  const [cycles, checks] = await Promise.all([getVervalCycles(packageId, request), getVervalConsistency(packageId, cycleId, request)]);
  const persisted = checks.find(row => row.konsistensi_id === created.konsistensi_id);
  if (!persisted || !Array.isArray(persisted.ulangan) || persisted.ulangan.length !== input.ulangan.length) throw new Error('Konsistensi diterima tetapi nilai ulangan belum terkonfirmasi melalui GET. Muat ulang sebelum mencoba lagi.');
  if (cycles.find(row => row.siklus_id === cycleId)?.versi !== created.versi) throw new Error('Konsistensi diterima tetapi versi siklus belum terkonfirmasi. Muat ulang sebelum mencoba lagi.');
  return { consistency: persisted, cycles, checks };
}

export async function getVervalCycle(packageId: string, cycleId: number, request: ProtectedGet, signal?: AbortSignal) {
  const response = await request<DataResponse<unknown>>(
    `/paket/${encodeURIComponent(packageId)}/siklus-verval/${encodeURIComponent(String(cycleId))}`,
    { signal },
  );
  if (!response?.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
    throw new Error('Respons detail siklus Verval tidak sesuai kontrak.');
  }
  const cycle = response.data as VervalCycle;
  if (!Number.isSafeInteger(cycle.siklus_id) || cycle.siklus_id !== cycleId) throw new Error('Bacaan detail tidak mengesahkan ID siklus yang diminta.');
  return cycle;
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
  if (['periode_mulai', 'periode_selesai', 'jatuh_tempo'].includes(key) && typeof value === 'string') {
    // Parse SQL DATE as calendar components, not Date(string), which can shift
    // the displayed day when the browser timezone differs.
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (match) {
      const [, year, month, day] = match;
      const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
      if (date.getUTCFullYear() === Number(year) && date.getUTCMonth() === Number(month) - 1 && date.getUTCDate() === Number(day)) {
        return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
      }
    }
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
