import { useEffect, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import App from '../App';
import { isRoleTestMode } from '../workflow/access/packageAccess';
import { setPersistenceNamespace } from '../workflow/repository/localPersistence';
import { apiRequest, authConfigurationError, supabase } from './client';
import { assignedRoles, type Identity } from './identity';
import type { WorkflowRole } from '../workflow/model';
import './auth.css';

export default function AuthGate() {
  if (isRoleTestMode()) return <App />;
  return <AuthenticatedApp />;
}
function AuthenticatedApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [roles, setRoles] = useState<Array<WorkflowRole | 'Pimpinan'>>([]);
  const [role, setRole] = useState<WorkflowRole | 'Pimpinan' | null>(null);
  const [loading, setLoading] = useState(!!supabase);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    const invalid = () => { setIdentity(null); setSession(null); setError('Sesi telah berakhir. Silakan masuk kembali.'); void supabase!.auth.signOut({ scope: 'local' }); };
    window.addEventListener('jala-session-invalid', invalid);
    return () => { data.subscription.unsubscribe(); window.removeEventListener('jala-session-invalid', invalid); };
  }, []);
  useEffect(() => {
    if (!session) { setIdentity(null); setRole(null); setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    apiRequest<{ data: Identity }>('/me', { signal: controller.signal }, session.access_token)
      .then(({ data }) => {
        if (controller.signal.aborted) return;
        const allowed = assignedRoles(data, session.user.id);
        setPersistenceNamespace(`user:${data.auth_user_id}:`);
        setIdentity(data); setRoles(allowed);
        setRole(current => current && allowed.includes(current) ? current : allowed.length === 1 ? allowed[0] : null);
      })
      .catch(e => { if (!controller.signal.aborted) { setIdentity(null); setError(e.message); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [session, retry]);
  async function signOut() {
    setIdentity(null); setRole(null); setSession(null); setError('');
    const result = await supabase?.auth.signOut({ scope: 'local' });
    if (result?.error) setError('Gagal mengakhiri sesi. Coba keluar sekali lagi.');
  }
  if (loading) return <Frame><p role="status">Memeriksa sesi dan peran akun…</p></Frame>;
  if (!session) return <LoginForm message={error} />;
  if (!identity) return <Frame><p role="alert">{error || 'Profil belum dapat dimuat.'}</p><button onClick={() => setRetry(x => x + 1)}>Coba lagi</button><button onClick={() => void signOut()}>Keluar</button></Frame>;
  if (!role) return <Frame><h1>Pilih peran akun</h1><p>{identity.email}</p>{roles.map(value => <button key={value} onClick={() => setRole(value)}>{value}</button>)}<button onClick={() => void signOut()}>Keluar</button></Frame>;
  if (role === 'Pimpinan') return <LeadershipHome name={identity.username} onSignOut={signOut} />;
  return <App key={`${identity.auth_user_id}:${role}`} authenticatedRole={role} userLabel={identity.username || identity.email} onSignOut={() => void signOut()} />;
}
function Frame({ children }: { children: React.ReactNode }) {
  return <main className="auth-screen"><section className="auth-card"><div className="auth-brand">JALA <b>MUTU</b></div>{children}</section></main>;
}
function LoginForm({ message }: { message: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true); setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setError(error.code === 'invalid_credentials' ? 'Email atau password salah.' : error.code === 'email_not_confirmed' ? 'Email akun belum dikonfirmasi.' : 'Login gagal. Periksa koneksi dan data akun, lalu coba lagi.');
    } catch { setError('Layanan login tidak dapat dihubungi. Coba lagi.'); }
    finally { setPassword(''); setBusy(false); }
  }
  return <Frame><h1>Masuk ke Jala Mutu</h1><p>Gunakan email akun yang terdaftar. Peran mengikuti penugasan akun.</p>
    <form onSubmit={submit}>
      <label htmlFor="login-email">Email</label><input id="login-email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} disabled={busy} />
      <label htmlFor="login-password">Password</label><input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} disabled={busy} />
      {(authConfigurationError || error || message) && <p role="alert" className="auth-error">{authConfigurationError || error || message}</p>}
      <button type="submit" disabled={busy || !!authConfigurationError}>{busy ? 'Sedang masuk…' : 'Masuk'}</button>
    </form>
  </Frame>;
}
// Pimpinan has no editing role in the existing workflow UI. Use a read-only server list.
function LeadershipHome({ name, onSignOut }: { name: string; onSignOut: () => Promise<void> }) {
  const [packages, setPackages] = useState<Array<{ paket_id: number; nama_paket: string; status: string }>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ data: typeof packages }>('/paket?page=1&page_size=50', { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setPackages(result.data); })
      .catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  return <Frame><h1>Pimpinan · {name}</h1><p>Daftar paket server (maksimal 50 paket pertama). Akses baca saja.</p>
    {loading ? <p role="status">Memuat paket…</p> : error ? <p role="alert">{error}</p> : packages.length ? <ul>{packages.map(item => <li key={item.paket_id}>{item.nama_paket} — {item.status}</li>)}</ul> : <p>Belum ada paket yang dapat diakses.</p>}
    <button onClick={() => void onSignOut()}>Keluar</button></Frame>;
}
