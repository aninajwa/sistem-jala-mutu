import { supabaseRequest } from './supabase';
import { stage1ConfirmationEnabled } from './stage1-confirmation-policy';

export type ReviewQueueRow = {
  paket_id: number;
  nama_paket: string;
  balai_id: number | null;
  tahap: 'Tahap 0' | 'Tahap 1' | 'Tahap 2';
  jenis: string;
  status: string;
  uji_coba_id?: number;
};

type PackageRow = { paket_id: number; nama_paket: string; balai_id: number | null };
type Request = <T>(path: string, token: string, init?: RequestInit) => Promise<T>;

const PAGE_SIZE = 50;
const MAX_PAGES = 20;
const CONCURRENCY = 4;

const rpc = <T>(request: Request, token: string, name: string, packageId: number) =>
  request<T>(`/rest/v1/rpc/${name}`, token, { method: 'POST', body: JSON.stringify({ p_paket_id: packageId }) });

async function listPackages(token: string, request: Request): Promise<PackageRow[]> {
  const rows: PackageRow[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const batch = await request<PackageRow[]>(
      `/rest/v1/paket_kontrak?select=paket_id,nama_paket,balai_id&order=paket_id.desc&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`,
      token,
    );
    if (!Array.isArray(batch)) break;
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }
  return rows;
}

async function packageRows(pkg: PackageRow, token: string, request: Request): Promise<ReviewQueueRow[]> {
  const base = { paket_id: pkg.paket_id, nama_paket: pkg.nama_paket, balai_id: pkg.balai_id ?? null };
  const [preparation, confirmation, trials] = await Promise.all([
    rpc<{ status?: string }>(request, token, 'baca_pengajuan_persiapan', pkg.paket_id),
    stage1ConfirmationEnabled()
      ? rpc<{ status?: string }>(request, token, 'baca_konfirmasi_kalibrasi_tahap1', pkg.paket_id)
      : Promise.resolve(null),
    rpc<Array<{ uji_coba_id: number; status: string }>>(request, token, 'ambil_senarai_uji_coba', pkg.paket_id),
  ]);
  const rows: ReviewQueueRow[] = [];
  if (preparation?.status) rows.push({ ...base, tahap: 'Tahap 0', jenis: 'Review persiapan', status: preparation.status });
  if (confirmation?.status) rows.push({ ...base, tahap: 'Tahap 1', jenis: 'Konfirmasi kalibrasi', status: confirmation.status });
  for (const trial of Array.isArray(trials) ? trials : []) {
    rows.push({ ...base, tahap: 'Tahap 2', jenis: `Uji coba #${trial.uji_coba_id}`, status: trial.status, uji_coba_id: trial.uji_coba_id });
  }
  return rows;
}

/**
 * Server submission states for every package the caller can read, using the caller's
 * token so database scope rules apply. A package whose reads fail is skipped and
 * reported through `partial` rather than failing the whole queue.
 */
export async function buildReviewQueue(token: string, request: Request = supabaseRequest) {
  const packages = await listPackages(token, request);
  const rows: ReviewQueueRow[] = [];
  let partial = false;
  for (let i = 0; i < packages.length; i += CONCURRENCY) {
    const results = await Promise.allSettled(packages.slice(i, i + CONCURRENCY).map(pkg => packageRows(pkg, token, request)));
    for (const result of results) {
      if (result.status === 'fulfilled') rows.push(...result.value);
      else partial = true;
    }
  }
  return { rows, partial };
}
