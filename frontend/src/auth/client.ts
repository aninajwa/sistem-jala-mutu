import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
export const authConfigurationError = !url || !key
  ? 'Konfigurasi login belum lengkap. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY pada frontend/.env, lalu jalankan ulang frontend.'
  : !/^https?:\/\//.test(url) || key.startsWith('sb_secret_')
    ? 'Konfigurasi login tidak valid. Gunakan URL proyek dan publishable key, bukan secret key.' : '';
export const supabase = authConfigurationError ? null : createClient(url!, key!, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  if (!token) {
    if (!supabase) throw new Error(authConfigurationError);
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) throw new ApiError(401, 'Sesi telah berakhir. Silakan masuk kembali.');
    token = data.session.access_token;
  }
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
  let response: Response;
  try { response = await fetch(base + path, { ...init, headers, signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) }); }
  catch (error) {
    if (init.signal?.aborted) throw error;
    throw new Error('Backend tidak dapat dihubungi. Pastikan backend berjalan dan alamat API benar.');
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) window.dispatchEvent(new Event('jala-session-invalid'));
    throw new ApiError(response.status, body?.error || `Permintaan gagal (${response.status}).`);
  }
  if (!body) throw new Error('Respons backend bukan JSON. Periksa alamat API/proxy frontend.');
  return body as T;
}
