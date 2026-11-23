export const SANDBOX_SUPABASE_URL = 'https://yehwlrlbtcxtlogenahw.supabase.co';

export function authConfigurationIssue(url: string | undefined, key: string | undefined) {
  if (!url || !key) return 'Konfigurasi login belum lengkap. Isi URL dan publishable key sandbox pada frontend/.env.';
  let parsed: URL;
  try { parsed = new URL(url); } catch { return 'Konfigurasi Supabase tidak valid.'; }
  if (parsed.href !== `${SANDBOX_SUPABASE_URL}/` || key.startsWith('sb_secret_') || /service_role|secret|replace|placeholder/i.test(key)) {
    return 'Konfigurasi login harus menggunakan URL dan publishable key Jala-Mutu-Admin-Sandbox.';
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
