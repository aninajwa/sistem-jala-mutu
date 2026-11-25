import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../auth/client';
import { PageHeading, Section } from '../components/app/AppComponents';
import { isPicBalaiMutationRole, validatePicScopeDraft, type AdminAccessUser, type AdminRoleAssignment, type AdminRoleCatalogEntry, type PicScopeDraft } from './adminAccessModel';
import { adminRoleMutationsEnabled, canMutateAssignment, mutationErrorMessage, revokePicAssignment, savePicAssignment } from './adminAccessMutations';
import './AdminUsersPage.css';

type Listing = { data: AdminAccessUser[]; page: number; page_size: number };
type LoadState = 'loading' | 'ready' | 'error';

export function AdminAccessResults({ state, users, error }: { state: LoadState; users: AdminAccessUser[]; error: string }) {
  if (state === 'loading') return <p role="status">Memuat penugasan peran…</p>;
  if (state === 'error') return <p role="alert">{error || 'Penugasan peran tidak dapat dimuat.'}</p>;
  if (!users.length) return <p role="status">Tidak ada pengguna yang cocok.</p>;

  return <>
    <div className="table-wrap"><table data-testid="table-admin-access">
      <thead><tr><th>ID pengguna</th><th>Username</th><th>Peran</th><th>Scope Balai (ID)</th><th>Scope paket (ID)</th><th>Status akun</th></tr></thead>
      <tbody>{users.flatMap(user => user.peran.length ? user.peran.map((role, index) => <tr key={`${user.pengguna_id}-${index}`}>
        <td>{user.pengguna_id}</td><td>{user.username}</td><td>{role.nama}</td>
        <td>{role.scope_balai_id ?? '—'}</td>
        <td>{role.scope_paket_id ?? '—'}</td>
        <td>{user.terkunci ? 'Terkunci' : 'Aktif'}</td>
      </tr>) : [<tr key={user.pengguna_id}>
        <td>{user.pengguna_id}</td><td>{user.username}</td><td>Belum ada peran</td>
        <td>—</td><td>—</td><td>{user.terkunci ? 'Terkunci' : 'Aktif'}</td>
      </tr>])}</tbody>
    </table></div>
    <p className="subtle" style={{ margin: '8px 0 0' }}>— menunjukkan nilai scope yang dikembalikan sebagai null untuk penugasan tersebut.</p>
  </>;
}

export function AdminAccessAssignments({ state, assignments, error, canRevoke = () => false, busy = false, onRevoke }: { state: LoadState; assignments: AdminRoleAssignment[]; error: string; canRevoke?: (assignment: AdminRoleAssignment) => boolean; busy?: boolean; onRevoke?: (assignment: AdminRoleAssignment) => void }) {
  if (state === 'loading') return <p role="status">Memuat penugasan tersimpan dari server…</p>;
  if (state === 'error') return <p role="alert">{error || 'Penugasan tersimpan tidak dapat dimuat.'}</p>;
  if (!assignments.length) return <p role="status">Pengguna ini belum memiliki penugasan peran.</p>;

  return <>
    <div className="table-wrap"><table data-testid="table-admin-selected-assignments">
      <thead><tr><th>Peran</th><th>Scope Balai (ID)</th><th>Scope paket (ID)</th><th>Aksi</th></tr></thead>
      <tbody>{assignments.map(assignment => <tr key={assignment.pp_id}>
        <td>{assignment.nama_peran}</td>
        <td>{assignment.scope_balai_id ?? '—'}</td>
        <td>{assignment.scope_paket_id ?? (assignment.scope_balai_id !== null ? 'Semua paket di Balai' : '—')}</td>
        <td>{canRevoke(assignment) ? <button type="button" className="admin-users-control" disabled={busy} onClick={() => onRevoke?.(assignment)}>Cabut peran</button> : '—'}</td>
      </tr>)}</tbody>
    </table></div>
    <p className="subtle" style={{ margin: '8px 0 0' }}>Scope berasal dari penugasan tersimpan. “Semua paket di Balai” berarti scope paket bernilai null pada penugasan PIC Balai.</p>
  </>;
}

export function AdminAccessPreview({ users }: { users: AdminAccessUser[] }) {
  const [selectedId, setSelectedId] = useState(() => users[0] ? String(users[0].pengguna_id) : '');
  const [role, setRole] = useState('pic_balai');
  const [draft, setDraft] = useState<PicScopeDraft>({ scope_balai_id: '', scope_paket_id: '' });
  const [preview, setPreview] = useState<ReturnType<typeof validatePicScopeDraft> | null>(null);
  const [catalog, setCatalog] = useState<AdminRoleCatalogEntry[]>([]);
  const [catalogState, setCatalogState] = useState<LoadState>('loading');
  const [catalogError, setCatalogError] = useState('');
  const [assignments, setAssignments] = useState<AdminRoleAssignment[]>([]);
  const [assignmentsFor, setAssignmentsFor] = useState('');
  const [assignmentsState, setAssignmentsState] = useState<LoadState>('loading');
  const [assignmentsError, setAssignmentsError] = useState('');
  const [actorId, setActorId] = useState<number | null>(null);
  const [mutationBusy, setMutationBusy] = useState(false);
  const [mutationMessage, setMutationMessage] = useState('');
  const [mutationError, setMutationError] = useState(false);
  const mutationsEnabled = adminRoleMutationsEnabled(import.meta.env.VITE_ADMIN_ROLE_MUTATIONS_ENABLED);
  const selected = useMemo(() => users.find(user => String(user.pengguna_id) === selectedId), [users, selectedId]);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ data: { pengguna_id: number } }>('/me', { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setActorId(result.data.pengguna_id); })
      .catch(() => { if (!controller.signal.aborted) setActorId(null); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setCatalogState('loading'); setCatalogError('');
    apiRequest<{ data: AdminRoleCatalogEntry[] }>('/admin/roles', { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) { setCatalog(result.data); setCatalogState('ready'); } })
      .catch(reason => { if (!controller.signal.aborted) { setCatalogError(reason instanceof Error ? reason.message : 'Katalog peran tidak dapat dimuat.'); setCatalogState('error'); } });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selected) { setAssignments([]); setAssignmentsFor(''); setAssignmentsState('ready'); setAssignmentsError(''); return; }
    const controller = new AbortController();
    const targetId = String(selected.pengguna_id);
    setAssignments([]); setAssignmentsFor(''); setAssignmentsState('loading'); setAssignmentsError('');
    apiRequest<{ data: AdminRoleAssignment[] }>(`/admin/users/${targetId}/roles`, { signal: controller.signal })
      .then(result => {
        if (!controller.signal.aborted) {
          setAssignments(result.data);
          setAssignmentsFor(targetId);
          setAssignmentsState('ready');
        }
      })
      .catch(reason => {
        if (!controller.signal.aborted) {
          setAssignmentsError(reason instanceof Error ? reason.message : 'Penugasan tersimpan tidak dapat dimuat.');
          setAssignmentsFor(targetId);
          setAssignmentsState('error');
        }
      });
    return () => controller.abort();
  }, [selected?.pengguna_id]);

  useEffect(() => {
    if (!selectedId && users.length) setSelectedId(String(users[0].pengguna_id));
    if (selectedId && !users.some(user => String(user.pengguna_id) === selectedId)) setSelectedId(users[0] ? String(users[0].pengguna_id) : '');
  }, [users, selectedId]);

  const onPreview = (event: FormEvent) => {
    event.preventDefault();
    if (!selected || catalogState !== 'ready' || assignmentsFor !== String(selected.pengguna_id) || assignmentsState !== 'ready') return;
    if (!catalog.some(entry => entry.nama_peran === role) || !isPicBalaiMutationRole(role)) {
      setPreview({ valid: false, message: 'V1 hanya mengizinkan penugasan pic_balai.' });
      return;
    }
    setPreview(validatePicScopeDraft(draft));
  };

  const refreshAssignments = async () => {
    if (!selected) return;
    const id = String(selected.pengguna_id);
    setAssignmentsState('loading'); setAssignmentsError('');
    try {
      const result = await apiRequest<{ data: AdminRoleAssignment[] }>(`/admin/users/${id}/roles`);
      setAssignments(result.data); setAssignmentsFor(id); setAssignmentsState('ready');
    } catch (reason) {
      setAssignmentsError(reason instanceof Error ? reason.message : 'Penugasan tersimpan tidak dapat dimuat.');
      setAssignmentsFor(id); setAssignmentsState('error');
    }
  };

  const performSave = async () => {
    if (!mutationsEnabled || !selected || actorId === null || actorId === selected.pengguna_id || !preview?.valid || mutationBusy) return;
    const picRoleId = catalog.find(item => item.nama_peran === 'pic_balai')?.peran_id;
    if (picRoleId === undefined) { setMutationMessage('Katalog server tidak menyediakan ID role pic_balai.'); setMutationError(true); return; }
    const existing = assignments.find(item => item.nama_peran === 'pic_balai');
    if (existing && !canMutateAssignment(existing, actorId, selected.pengguna_id, picRoleId)) return;
    if (!window.confirm(`${existing ? 'Simpan perubahan scope' : 'Simpan penugasan'} pic_balai untuk ${selected.username} (ID ${selected.pengguna_id})?`)) return;
    setMutationBusy(true); setMutationMessage(''); setMutationError(false);
    try {
      await savePicAssignment(selected.pengguna_id, existing, preview, undefined, picRoleId);
      setMutationMessage(existing ? 'Perubahan scope pic_balai berhasil disimpan.' : 'Penugasan pic_balai berhasil disimpan.');
      setPreview(null); await refreshAssignments();
    } catch (reason) { setMutationMessage(mutationErrorMessage(reason)); setMutationError(true); }
    finally { setMutationBusy(false); }
  };

  const performRevoke = async (assignment: AdminRoleAssignment) => {
    const picRoleId = catalog.find(item => item.nama_peran === 'pic_balai')?.peran_id;
    if (!mutationsEnabled || !selected || picRoleId === undefined || !canMutateAssignment(assignment, actorId, selected.pengguna_id, picRoleId) || mutationBusy) return;
    if (!window.confirm(`Cabut penugasan pic_balai dari ${selected.username} (ID ${selected.pengguna_id})? Tindakan ini tidak dapat dibatalkan.`)) return;
    setMutationBusy(true); setMutationMessage(''); setMutationError(false);
    try {
      await revokePicAssignment(selected.pengguna_id, assignment, undefined, picRoleId);
      setMutationMessage('Penugasan pic_balai berhasil dicabut.'); setPreview(null); await refreshAssignments();
    } catch (reason) { setMutationMessage(mutationErrorMessage(reason)); setMutationError(true); }
    finally { setMutationBusy(false); }
  };

  return <div className="admin-access-manage">
    <div className="admin-access-picker-grid">
      <label className="admin-users-field">Pilih pengguna dari data Admin
        <select className="admin-users-control" value={selectedId} onChange={event => { setSelectedId(event.target.value); setPreview(null); }} disabled={!users.length}>
          {users.length ? users.map(user => <option key={user.pengguna_id} value={user.pengguna_id}>{user.username} · ID {user.pengguna_id}</option>) : <option value="">Tidak ada pengguna tersedia</option>}
        </select>
      </label>
      <label className="admin-users-field">Peran yang direncanakan
        <select className="admin-users-control" value={role} disabled={catalogState !== 'ready' || !catalog.length} onChange={event => { setRole(event.target.value); setPreview(null); }}>
          {catalog.map(entry => <option key={entry.peran_id} value={entry.nama_peran}>{entry.nama_peran} (ID {entry.peran_id}) — katalog server</option>)}
          <option value="admin" disabled>Admin — tidak diizinkan di V1</option>
          <option value="direktorat" disabled>Direktorat — tidak diizinkan di V1</option>
          <option value="penyedia_jasa" disabled>Penyedia Jasa — tidak diizinkan di V1</option>
        </select>
      </label>
    </div>
    {catalogState === 'loading' ? <p role="status">Memuat katalog peran yang dapat ditugaskan…</p> : null}
    {catalogState === 'error' ? <p role="alert">{catalogError || 'Katalog peran tidak dapat dimuat.'}</p> : null}
    {catalogState === 'ready' && !catalog.length ? <p role="status">Katalog tidak mengembalikan peran yang dapat ditugaskan.</p> : null}
    {selected ? <>
      <div className="admin-access-current" aria-label="Penugasan tersimpan saat ini">
        <strong>Penugasan tersimpan · data langsung dari API</strong>
        <p>Pengguna: {selected.username} · ID {selected.pengguna_id}</p>
        <AdminAccessAssignments state={assignmentsFor === String(selected.pengguna_id) ? assignmentsState : 'loading'} assignments={assignmentsFor === String(selected.pengguna_id) ? assignments : []} error={assignmentsError}
          canRevoke={assignment => mutationsEnabled && canMutateAssignment(assignment, actorId, selected.pengguna_id, catalog.find(item => item.nama_peran === 'pic_balai')?.peran_id)} busy={mutationBusy} onRevoke={performRevoke} />
      </div>
      <form className="admin-access-draft" onSubmit={onPreview}>
        <strong>Perubahan lokal · belum disimpan</strong>
        <p className="subtle">Pratinjau ini tidak mengubah data. Isi ID scope yang diusulkan; pemeriksaan keberadaan/keaktifan tetap harus dilakukan server/database.</p>
        <div className="admin-access-picker-grid">
          <label className="admin-users-field">ID Balai (wajib)
            <input className="admin-users-control" inputMode="numeric" value={draft.scope_balai_id} onChange={event => { setDraft(value => ({ ...value, scope_balai_id: event.target.value })); setPreview(null); }} />
          </label>
          <label className="admin-users-field">ID paket (opsional)
            <input className="admin-users-control" inputMode="numeric" value={draft.scope_paket_id} onChange={event => { setDraft(value => ({ ...value, scope_paket_id: event.target.value })); setPreview(null); }} />
          </label>
        </div>
        <button type="submit" className="admin-users-control admin-users-search" disabled={catalogState !== 'ready' || !catalog.length || assignmentsFor !== String(selected.pengguna_id) || assignmentsState !== 'ready'}>Pratinjau saja</button>
      </form>
      {preview ? <div className={`admin-access-preview ${preview.valid ? 'is-valid' : 'is-invalid'}`} role={preview.valid ? 'status' : 'alert'}>
        {!preview.valid ? preview.message : <>
          <strong>Usulan · Belum disimpan</strong>
          <p>Pengguna: {selected.username} (ID {selected.pengguna_id})</p>
          <p>Operasi: {assignments.some(item => item.nama_peran === 'pic_balai') ? 'Perubahan scope pic_balai' : 'Pratinjau penambahan pic_balai'}</p>
          <p>Role: pic_balai · Balai ID: {preview.scope_balai_id} · Paket ID: {preview.scope_paket_id ?? 'Semua paket di Balai'}</p>
            <small>{mutationsEnabled ? 'Usulan ini belum disimpan.' : 'Ini pratinjau lokal, bukan perubahan Supabase. Fitur mutasi frontend dinonaktifkan.'}</small>
          </>}
          {preview.valid ? <button type="button" className="admin-users-control admin-users-search" disabled={!mutationsEnabled || mutationBusy || actorId === null || actorId === selected.pengguna_id || assignmentsState !== 'ready'} onClick={() => void performSave()}>{mutationBusy ? 'Menyimpan…' : assignments.some(item => item.nama_peran === 'pic_balai') ? 'Simpan perubahan scope' : 'Simpan penugasan'}</button> : null}
        </div> : null}
      {mutationMessage ? <p role={mutationError ? 'alert' : 'status'}>{mutationMessage}</p> : null}
      {!mutationsEnabled ? <p role="note">Penyimpanan dan pencabutan dinonaktifkan oleh feature gate frontend.</p> : actorId === null ? <p role="alert">Identitas Admin tidak dapat diverifikasi; mutasi dinonaktifkan.</p> : null}
    </> : <p role="status">Pilih pengguna setelah data tersedia.</p>}
  </div>;
}

export default function AdminAccessPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [listing, setListing] = useState<Listing | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [error, setError] = useState('');
  const pageSize = 25;

  useEffect(() => {
    const controller = new AbortController();
    setState('loading'); setError('');
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (query) params.set('q', query);
    apiRequest<Listing>(`/admin/users?${params}`, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) { setListing(result); setState('ready'); } })
      .catch(reason => { if (!controller.signal.aborted) { setError(reason instanceof Error ? reason.message : 'Penugasan peran tidak dapat dimuat.'); setState('error'); } });
    return () => controller.abort();
  }, [page, query]);

  return <div className="admin-users-page admin-access-page">
    <PageHeading label="Hak Akses" detail="Kelola penugasan PIC Balai dengan konfirmasi; role lain tetap immutable." />
    <Section title="Penugasan peran saat ini" icon={ShieldCheck}>
      <div className="panel-body admin-users-body">
        <p className="notice admin-access-readonly" role="note">Data tersimpan berasal dari API Admin. Pratinjau lokal terpisah dari server. Mutasi hanya ditujukan untuk penugasan pic_balai pengguna lain; role admin, direktorat, dan penyedia_jasa tidak dapat diubah.</p>
        <form className="admin-users-filters" onSubmit={event => { event.preventDefault(); setPage(1); setQuery(search.trim()); }}>
          <label className="admin-users-field">Cari username<input value={search} maxLength={100} onChange={event => setSearch(event.target.value)} className="admin-users-control" /></label>
          <button type="submit" className="admin-users-control admin-users-search"><Search size={16}/>Cari</button>
        </form>
        <AdminAccessResults state={state} users={listing?.data ?? []} error={error} />
        {state === 'ready' ? <AdminAccessPreview users={listing?.data ?? []} /> : null}
        {state === 'ready' && listing?.data.length ? <div className="admin-users-pagination"><span>Halaman {page}</span><div>
          <button className="admin-users-control" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Sebelumnya</button>
          <button className="admin-users-control" disabled={listing.data.length < pageSize} onClick={() => setPage(value => value + 1)}>Berikutnya</button>
        </div></div> : null}
      </div>
    </Section>
  </div>;
}
