export const JALA_MUTU_SUPABASE_URL = 'https://vnvknmwcidberkjwtqjx.supabase.co';
export const SANDBOX_SUPABASE_URL = 'https://yehwlrlbtcxtlogenahw.supabase.co';
const ALLOWED_SUPABASE_URLS = [JALA_MUTU_SUPABASE_URL, SANDBOX_SUPABASE_URL];

export function authConfigurationIssue(url: string | undefined, key: string | undefined) {
  if (!url || !key) return 'Konfigurasi login belum lengkap. Isi URL dan publishable key proyek yang dibenarkan pada frontend/.env.';
  let parsed: URL;
  try { parsed = new URL(url); } catch { return 'Konfigurasi Supabase tidak valid.'; }
  if (!ALLOWED_SUPABASE_URLS.some(allowedUrl => parsed.href === `${allowedUrl}/`) || key.startsWith('sb_secret_') || /service_role|secret|replace|placeholder/i.test(key)) {
    return 'Konfigurasi login harus menggunakan URL Jala-Mutu atau Jala-Mutu-Admin-Sandbox dan publishable key.';
  }
  return '';
}

export function apiConfigurationIssue(value: string | undefined) {
  if (!value || value === '/api') return '';
  let parsed: URL;
  try { parsed = new URL(value); } catch { return 'API frontend harus menggunakan /api atau backend lokal port 5001.'; }
  if (parsed.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(parsed.hostname) || parsed.port !== '5001' || parsed.pathname !== '/api' || parsed.username || parsed.password || parsed.search || parsed.hash) {
    return 'API frontend hanya boleh mengarah ke backend lokal port 5001.';
  }
  return '';
}
