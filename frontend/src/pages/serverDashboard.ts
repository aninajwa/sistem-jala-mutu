import type { WorkflowRole } from '../workflow/model';
import { apiRequest } from '../auth/client';

export type ServerPackageRow = {
  paket_id: number;
  nama_paket: string;
  nomor_kontrak?: string | null;
  tahun_anggaran?: number | null;
  balai_id?: number | null;
  status?: string;
  created_by?: number;
  created_at?: string;
};
export type ServerDashboardPackage = { id: string; name: string; balaiId: number | null; createdBy?: number };
export type ServerCorrection = { id: number; status: string };
export type ResourceState<T> =
  | { status: 'loading' }
  | { status: 'ready'; data: T }
  | { status: 'error'; message: string }
  | { status: 'unavailable'; message: string };
export type ServerDashboardData = {
  packages: ResourceState<ServerDashboardPackage[]>;
  corrections: ResourceState<Record<string, ServerCorrection[]>>;
  correctionErrors: Record<string, string>;
};

export type PackagePage = { data: ServerPackageRow[]; page: number; page_size: number };
type ServerIdentity = {
  pengguna_id: number;
  peran: Array<{ peran_id: number; nama: string }>;
  penugasan: Array<{ peran_id: number; scope_balai_id: number | null; scope_paket_id: number | null }>;
};
type CorrectionCase = { kasus_temuan: { kasus_id: number; status: string } };
type CorrectionResponse = { data: unknown };

const CORRECTION_STATUSES = new Set([
  'Terbuka', 'Menunggu Persetujuan', 'Disetujui', 'Dilaksanakan',
  'Verifikasi Ulang', 'Ditutup',
]);

function parsePackages(payload: PackagePage, expectedPage: number): ServerPackageRow[] {
  if (!payload || !Array.isArray(payload.data) || payload.page !== expectedPage ||
      !Number.isInteger(payload.page_size) || payload.page_size < 1 || payload.page_size > 50) {
    throw new Error('Respons daftar paket dari server tidak sesuai kontrak.');
  }
  for (const row of payload.data) {
    if (!Number.isSafeInteger(row?.paket_id) || row.paket_id < 1 || typeof row.nama_paket !== 'string') {
      throw new Error('Identitas paket dari server tidak valid.');
    }
  }
  return payload.data;
}

export function normalizeCorrectionResponse(value: unknown): ServerCorrection[] {
  if (!Array.isArray(value)) throw new Error('Respons daftar koreksi tidak berbentuk array.');
  const byId = new Map<number, ServerCorrection>();
  for (const raw of value) {
    const item = raw as Partial<CorrectionCase> | null;
    const issue = item?.kasus_temuan;
    if (!issue || !Number.isSafeInteger(issue.kasus_id) || issue.kasus_id < 1 ||
        typeof issue.status !== 'string' || !CORRECTION_STATUSES.has(issue.status)) {
      throw new Error('Skema kasus/status koreksi belum sepadan dengan kontrak dashboard.');
    }
    byId.set(issue.kasus_id, { id: issue.kasus_id, status: issue.status });
  }
  return [...byId.values()];
}

export async function loadServerPackages(signal: AbortSignal, role: WorkflowRole): Promise<ServerDashboardPackage[]> {
  const { data: identity } = await apiRequest<{ data: ServerIdentity }>('/me', { signal });
  if (!Number.isSafeInteger(identity.pengguna_id) || identity.pengguna_id < 1) throw new Error('Identitas pengguna server tidak valid.');
  const rows = await collectServerPackages(async page => {
    return apiRequest<PackagePage>(`/paket?page=${page}`, { signal });
  }, signal);
  return scopePackagesToIdentity(rows, role, identity);
}

export function scopePackagesToIdentity(rows: ServerDashboardPackage[], role: WorkflowRole, identity: ServerIdentity) {
  const roleKey: Record<WorkflowRole, string> = {
    'Penyedia Jasa / Ketua Tim': 'penyedia_jasa',
    'PIC Balai / Pengguna Jasa': 'pic_balai',
    'Direktorat / Pusat': 'direktorat',
    Admin: 'admin',
  };
  const assignedIds = new Set(identity.peran.filter(item => item.nama.toLowerCase() === roleKey[role]).map(item => item.peran_id));
  const assignments = identity.penugasan.filter(item => assignedIds.has(item.peran_id));
  if (!assignments.length) throw Object.assign(new Error('Peran/cakupan paket tidak tersedia pada identitas server.'), { status: 403 });
  if (role === 'Penyedia Jasa / Ketua Tim') return rows.filter(row => row.createdBy === identity.pengguna_id);
  if (role === 'PIC Balai / Pengguna Jasa') return rows.filter(row => assignments.some(scope =>
    scope.scope_balai_id !== null && scope.scope_balai_id === row.balaiId &&
    (scope.scope_paket_id === null || scope.scope_paket_id === Number(row.id)),
  ));
  return rows;
}

export async function collectServerPackages(
  fetchPage: (page: number) => Promise<PackagePage>, signal: AbortSignal,
): Promise<ServerDashboardPackage[]> {
  const unique = new Map<number, ServerPackageRow>();
  for (let page = 1; page <= 1_000_000; page++) {
    if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const response = await fetchPage(page);
    const rows = parsePackages(response, page);
    for (const row of rows) unique.set(row.paket_id, row);
    if (rows.length < response.page_size) {
      return [...unique.values()].map(row => ({
        id: String(row.paket_id), name: row.nama_paket || `Paket #${row.paket_id}`, balaiId: row.balai_id ?? null, createdBy: row.created_by,
      }));
    }
  }
  throw new Error('Pagination paket melebihi batas aman.');
}

async function mapLimit<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index]);
    }
  }));
  return results;
}

export async function loadServerCorrections(
  packages: ServerDashboardPackage[], signal: AbortSignal,
  fetchCorrection: (packageId: string, requestSignal: AbortSignal) => Promise<unknown> = async (packageId, requestSignal) => {
    return (await apiRequest<CorrectionResponse>(`/paket/${encodeURIComponent(packageId)}/koreksi`, { signal: requestSignal })).data;
  },
): Promise<{ data: Record<string, ServerCorrection[]>; errors: Record<string, string> }> {
  const data: Record<string, ServerCorrection[]> = {};
  const errors: Record<string, string> = {};
  await mapLimit(packages, 4, async pkg => {
    try {
      const value = await fetchCorrection(pkg.id, signal);
      // The available RPC response contract is documented in a proposal, not an applied migration.
      // Require its explicit shape; never guess a count from nested correction/action rows.
      data[pkg.id] = normalizeCorrectionResponse(value);
    } catch (error) {
      if (signal.aborted) throw error;
      errors[pkg.id] = error instanceof Error ? error.message : 'Koreksi gagal dimuat.';
    }
  });
  return { data, errors };
}

export function filterServerPackages(
  packages: ServerDashboardPackage[], balaiFilter: string, packageFilter: string,
): ServerDashboardPackage[] {
  return packages.filter(pkg =>
    (packageFilter === 'Semua paket' || pkg.id === packageFilter) &&
    (balaiFilter === 'Semua Balai' || String(pkg.balaiId ?? '') === balaiFilter),
  );
}

export function isForbidden(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error &&
    ((error as { status?: unknown }).status === 401 || (error as { status?: unknown }).status === 403);
}

export function packageFailureState(error: unknown): ResourceState<ServerDashboardPackage[]> {
  return isForbidden(error)
    ? { status: 'unavailable', message: 'Daftar paket tidak tersedia untuk peran/cakupan ini.' }
    : { status: 'error', message: error instanceof Error ? error.message : 'Paket gagal dimuat.' };
}
