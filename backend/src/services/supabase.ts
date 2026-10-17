export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function supabaseFetch(path: string, token: string, init: RequestInit = {}, timeout = 10000): Promise<Response> {
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
  } catch { throw new ApiError(503, 'Supabase tidak dapat dihubungi'); }
  if (!response.ok) {
    const failure = await response.json().catch(() => null) as { code?: string; message?: string; error?: string } | null;
    if (path === '/auth/v1/user') throw new ApiError(401, 'Sesi tidak valid atau telah tamat');
    if (failure?.code === 'P0002') throw new ApiError(404, 'Paket tidak ditemukan');
    if (failure?.code === '40001' && /kalibrasi/.test(path)) throw new ApiError(409, 'Rekod kalibrasi telah berubah. Baca semula');
    if (failure?.code === '40001') throw new ApiError(409, path.endsWith('/tambah_versi_dokumen_persiapan') ? 'Versi dokumen telah berubah. Baca senarai dokumen semula' : 'Checklist telah berubah. Baca semula sebelum menyimpan');
    if (failure?.code === '55000') throw new ApiError(409, failure.message ?? 'Rekod bukan berstatus DRAFT');
    if (failure?.code === '23505') throw new ApiError(409, 'Rekod unik sudah digunakan');
    if (failure?.code === '22023') throw new ApiError(400, failure.message ?? 'Data tidak valid');
    if (failure?.code === '42501' || response.status === 403) throw new ApiError(403, 'Akses tidak dibenarkan');
    if (path.startsWith('/storage/')) {
      if (/bucket.*not found/i.test(`${failure?.message ?? ''} ${failure?.error ?? ''}`)) throw new ApiError(503, `Bucket private ${path.includes('dokumen-kalibrasi') ? 'dokumen-kalibrasi' : 'dokumen-persiapan'} belum dibuat`);
      if (response.status === 404) throw new ApiError(404, 'Fail tidak ditemukan atau tidak boleh diakses');
      if (response.status === 413) throw new ApiError(413, 'Fail melebihi had saiz Storage');
      if (response.status === 400) throw new ApiError(400, 'Storage menolak fail atau akses upload');
    }
    throw new ApiError(502, 'Permintaan Supabase gagal');
  }
  return response;
}

export async function supabaseRequest<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await supabaseFetch(path, token, init);
  return await response.json() as T;
}
