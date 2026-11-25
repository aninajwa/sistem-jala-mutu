import { logger } from '../lib/logger';
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function supabaseFetch(path: string, token: string, init: RequestInit = {}, timeout = 20000): Promise<Response> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new ApiError(503, 'Konfigurasi Supabase belum lengkap');
  const headers = new Headers(init.headers);
  headers.set('apikey', key);
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(`${url.replace(/\/$/, '')}${path}`, { ...init, headers, signal: AbortSignal.timeout(timeout) });
  } catch (error) {
    logger.warn({ path: path.split('?')[0], reason: error instanceof Error ? error.name : 'unknown' }, 'Supabase unreachable');
    throw new ApiError(503, 'Supabase tidak dapat dihubungi');
  }
  if (!response.ok) {
    const failure = await response.json().catch(() => null) as { code?: string; message?: string; error?: string } | null;
    // PostgREST retries SQLSTATE 40001 (serialization failure) until the client gives up, so
    // RPCs signal a stale version with PT409 instead. Treat it exactly like 40001 below.
    if (failure?.code === 'PT409') failure.code = '40001';
    if (path.startsWith('/rest/v1/rpc/admin_') && /(?:daftar_peran_dapat_ditugaskan|daftar_penugasan_peran|tambah_penugasan_peran|ubah_penugasan_peran|cabut_penugasan_peran)$/.test(path)) {
      if (failure?.code === '28000' || response.status === 401) throw new ApiError(401, 'Sesi tidak valid atau telah tamat');
      if (failure?.code === '42501' || response.status === 403) throw new ApiError(403, 'Akses tidak dibenarkan');
      if (failure?.code === 'P0002' || response.status === 404) throw new ApiError(404, 'Pengguna atau penugasan tidak ditemukan');
      if (['40001', '23505', '23514'].includes(failure?.code ?? '')) throw new ApiError(409, 'Penugasan atau cakupan telah berubah atau berkonflik. Baca semula');
      if (['22023', '22003'].includes(failure?.code ?? '')) throw new ApiError(400, 'Data penugasan peran tidak valid');
      if (failure?.code === 'PGRST202') throw new ApiError(503, 'RPC manajemen peran belum tersedia');
      throw new ApiError(500, 'Permintaan manajemen peran gagal');
    }
    if (path === '/auth/v1/user' || response.status === 401) throw new ApiError(401, 'Sesi tidak valid atau telah tamat');
    // PostgREST uses PGRST202 when a requested RPC is absent from its schema cache.
    // Surface this as a setup gap rather than a generic upstream failure.
    if (failure?.code === 'PGRST202' && path.startsWith('/rest/v1/rpc/')) {
      const rpcName = path.split('/').pop() ?? 'RPC';
      throw new ApiError(503, `Fungsi database ${rpcName} belum tersedia atau belum masuk schema cache Supabase`);
    }
    if (failure?.code === 'P0002' && /koreksi/.test(path)) throw new ApiError(404, failure.message ?? 'Kasus koreksi tidak ditemukan');
    if (failure?.code === 'P0002' && path.endsWith('/baca_sesi_survei')) throw new ApiError(404, failure.message ?? 'Sesi survei tidak ditemukan atau tidak boleh diakses');
    if (failure?.code === 'P0002' && path.includes('data_segmen')) throw new ApiError(404, failure.message ?? 'Sesi atau data segmen tidak ditemukan');
    if (failure?.code === 'P0002') throw new ApiError(404, 'Paket tidak ditemukan');
    if (failure?.code === '40001' && /checklist_kalibrasi_iri/.test(path)) throw new ApiError(409, 'Versi draf checklist IRI berubah. Muat ulang sebelum menggabungkan; perubahan lokal tidak disimpan.');
    if (failure?.code === '40001' && /konfirmasi_kalibrasi_tahap1/.test(path)) throw new ApiError(409, failure.message ?? 'Versi konfirmasi kalibrasi berubah. Muat ulang sebelum melanjutkan.');
    if (failure?.code === '40001' && /pindaan_scope_survei/.test(path)) throw new ApiError(409, failure.message ?? 'Pindaan atau skop rasmi telah berubah. Muat semula sebelum melanjutkan.');
    if (failure?.code === '40001' && /kalibrasi/.test(path)) throw new ApiError(409, 'Rekod kalibrasi telah berubah. Baca semula');
    if (failure?.code === '40001' && /validasi_lrs/.test(path)) throw new ApiError(409, failure.message ?? 'Workflow validasi LRS telah berubah. Muat ulang sebelum melanjutkan.');
    if (failure?.code === '40001' && /koreksi/.test(path)) throw new ApiError(409, failure.message ?? 'Kasus koreksi telah berubah. Baca semula');
    if (failure?.code === '40001' && /simpan_uji_konsistensi_verval/.test(path)) throw new ApiError(409, 'Versi siklus berubah. Muat ulang siklus sebelum menyimpan.');
    if (failure?.code === '40001' && /scope_survei_kontrak/.test(path)) throw new ApiError(409, failure.message ?? 'Scope survei telah berubah. Muat ulang sebelum menyimpan; pilihan lokal dipertahankan.');
    if (failure?.code === '40001' && /(ajukan_verval|review_verval|buat_siklus_verval)/.test(path)) throw new ApiError(409, failure.message ?? 'Siklus Verval telah berubah. Muat ulang sebelum melanjutkan.');
    if (failure?.code === '40001' && /(audit|penerimaan|upload_sistem)/.test(path)) throw new ApiError(409, failure.message ?? 'Data audit atau penerimaan telah berubah. Muat ulang sebelum melanjutkan.');
    if (failure?.code === '40001') throw new ApiError(409, path.endsWith('/tambah_versi_dokumen_persiapan') ? 'Versi dokumen telah berubah. Baca senarai dokumen semula' : 'Checklist telah berubah. Baca semula sebelum menyimpan');
    if (failure?.code === '55000' && /scope_survei_kontrak/.test(path)) {
      throw new ApiError(409, failure.message ?? 'Perubahan scope dikunci karena persiapan sedang ditinjau atau sudah disetujui.');
    }
    if (failure?.code === '55000') throw new ApiError(409, /koreksi/.test(path) ? (failure.message ?? 'Peralihan kasus koreksi tidak sah') : (failure.message ?? 'Rekod bukan berstatus DRAFT'));
    if (failure?.code === '23505' && /tambah_lokasi_ruas_paket/.test(path)) throw new ApiError(409, failure.message ?? 'Ruas sudah ditetapkan pada lingkup survei dan semester ini');
    if (failure?.code === '23514' && /scope_survei_kontrak/.test(path)) throw new ApiError(409, failure.message ?? 'Jenis survei tidak dapat dihapus karena sudah digunakan data kerja.');
    if (failure?.code === '23505') throw new ApiError(409, 'Rekod unik sudah digunakan');
    if (failure?.code === '22023') throw new ApiError(400, failure.message ?? 'Data tidak valid');
    if (failure?.code === '42501' || response.status === 403) throw new ApiError(403, 'Akses tidak dibenarkan');
    if (path.startsWith('/storage/')) {
      if (/bucket.*not found/i.test(`${failure?.message ?? ''} ${failure?.error ?? ''}`)) throw new ApiError(503, `Bucket private ${path.includes('dokumen-kualifikasi') ? 'dokumen-kualifikasi' : path.includes('dokumen-kalibrasi') ? 'dokumen-kalibrasi' : 'dokumen-persiapan'} belum dibuat`);
      if (response.status === 404) throw new ApiError(404, 'Fail tidak ditemukan atau tidak boleh diakses');
      if (response.status === 413) throw new ApiError(413, 'Fail melebihi had saiz Storage');
      if (response.status === 400) throw new ApiError(400, 'Storage menolak fail atau akses upload');
    }
    // Unmapped upstream failure: record status/code (never the token) for diagnosis.
    logger.warn({ upstreamStatus: response.status, code: failure?.code, path: path.split('?')[0] }, 'Supabase request failed');
    throw new ApiError(502, 'Permintaan Supabase gagal');
  }
  return response;
}

export async function supabaseRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await supabaseFetch(path, token, init);
  return await response.json() as T;
}
