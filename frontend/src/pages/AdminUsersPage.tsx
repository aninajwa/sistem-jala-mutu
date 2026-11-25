import { useEffect, useState } from 'react';
import { Search, ShieldCheck, Users } from 'lucide-react';
import { apiRequest } from '../auth/client';
import { PageHeading, Section } from '../components/app/AppComponents';
import './AdminUsersPage.css';

type CurrentIdentity = { pengguna_id: number; username: string; peran: Array<{ peran_id: number; nama: string }>; penugasan: Array<{ peran_id: number; scope_balai_id: number | null; scope_paket_id: number | null }> };
type ListedUser = { pengguna_id: number; username: string; terkunci: boolean | null; peran: Array<{ nama: string; scope_balai_id: number | null; scope_paket_id: number | null }> };
type Listing = { data: ListedUser[]; page: number; page_size: number };

export default function AdminUsersPage() {
  const [identity, setIdentity] = useState<CurrentIdentity | null>(null);
  const [identityError, setIdentityError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [listing, setListing] = useState<Listing | null>(null);
  const [listingState, setListingState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [listingError, setListingError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ data: CurrentIdentity }>('/me', { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setIdentity(result.data); })
      .catch(error => { if (!controller.signal.aborted) setIdentityError(error instanceof Error ? error.message : 'Profil tidak dapat dimuat.'); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setListingState('loading'); setListingError('');
    const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (query) params.set('q', query);
    apiRequest<Listing>(`/admin/users?${params}`, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) { setListing(result); setListingState('ready'); } })
      .catch(error => { if (!controller.signal.aborted) { setListingError(error instanceof Error ? error.message : 'Daftar pengguna tidak dapat dimuat.'); setListingState('error'); } });
    return () => controller.abort();
  }, [page, pageSize, query]);

  return <div className="admin-users-page">
    <PageHeading label="Pengguna & Peran" detail="Informasi akun Anda mengikuti penugasan yang dikembalikan server." />
    <Section title="Akun saat ini" icon={ShieldCheck}>
      {identityError ? <div className="panel-body" role="alert">{identityError}</div> : !identity ? <div className="panel-body" role="status">Memuat identitas dan peran akun…</div> : <div className="table-wrap">
        <table data-testid="table-admin-current-user"><thead><tr><th>ID pengguna</th><th>Username</th><th>Peran</th><th>Scope Balai (ID)</th><th>Scope paket (ID)</th></tr></thead>
          <tbody>{identity.peran.flatMap(role => identity.penugasan.filter(item => item.peran_id === role.peran_id).map((assignment, index) => <tr key={`${role.peran_id}-${index}`}><td>{identity.pengguna_id}</td><td>{identity.username}</td><td>{role.nama}</td><td>{assignment.scope_balai_id ?? '—'}</td><td>{assignment.scope_paket_id ?? '—'}</td></tr>))}</tbody>
        </table>
      </div>}
    </Section>
    <Section title="Daftar pengguna" icon={Users}>
      <div className="panel-body admin-users-body">
        <form className="admin-users-filters" onSubmit={event => { event.preventDefault(); setPage(1); setQuery(search.trim()); }}>
          <label className="admin-users-field">Cari username<input value={search} maxLength={100} onChange={event => setSearch(event.target.value)} className="admin-users-control" /></label>
          <button type="submit" className="admin-users-control admin-users-search"><Search size={16}/>Cari</button>
          <label className="admin-users-field">Baris per halaman<select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }} className="admin-users-control"><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></label>
        </form>
        {listingState === 'loading' ? <p role="status">Memuat daftar pengguna…</p> : listingState === 'error' ? <p role="alert">{listingError}</p> : !listing?.data.length ? <p role="status">Tidak ada pengguna yang cocok.</p> : <div className="mt-4 table-wrap"><table data-testid="table-admin-users"><thead><tr><th>ID pengguna</th><th>Username</th><th>Peran</th><th>Scope Balai (ID)</th><th>Scope paket (ID)</th><th>Status</th></tr></thead><tbody>{listing.data.flatMap(user => user.peran.length ? user.peran.map((role, index) => <tr key={`${user.pengguna_id}-${index}`}><td>{user.pengguna_id}</td><td>{user.username}</td><td>{role.nama}</td><td>{role.scope_balai_id ?? '—'}</td><td>{role.scope_paket_id ?? '—'}</td><td>{user.terkunci ? 'Terkunci' : 'Aktif'}</td></tr>) : [<tr key={user.pengguna_id}><td>{user.pengguna_id}</td><td>{user.username}</td><td>—</td><td>—</td><td>—</td><td>{user.terkunci ? 'Terkunci' : 'Aktif'}</td></tr>])}</tbody></table></div>}
        {listingState === 'ready' && listing?.data.length ? <div className="admin-users-pagination"><span>Halaman {page}</span><div><button className="admin-users-control" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Sebelumnya</button><button className="admin-users-control" disabled={listing.data.length < pageSize} onClick={() => setPage(value => value + 1)}>Berikutnya</button></div></div> : null}
      </div>
    </Section>
  </div>;
}
