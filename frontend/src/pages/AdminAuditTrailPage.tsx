import { useEffect, useState } from 'react';
import { Activity, Search } from 'lucide-react';
import { apiRequest } from '../auth/client';
import { PageHeading, Section } from '../components/app/AppComponents';
import './AdminUsersPage.css';

export type AdminAuditEvent = {
  trail_id: string;
  waktu: string | null;
  pengguna_id: number | null;
  tabel: string;
  aksi: string;
  ringkasan: string;
};

type Listing = { data: AdminAuditEvent[]; page: number; page_size: number };
type LoadState = 'loading' | 'ready' | 'error';

export function AdminAuditTrailResults({ state, events, error }: { state: LoadState; events: AdminAuditEvent[]; error: string }) {
  if (state === 'loading') return <p role="status">Memuat jejak aktivitas…</p>;
  if (state === 'error') return <p role="alert">{error || 'Jejak aktivitas belum dapat dimuat.'}</p>;
  if (!events.length) return <p role="status">Tidak ada aktivitas yang cocok.</p>;
  return <div className="table-wrap">
    <table data-testid="table-admin-audit-trail">
      <thead><tr><th>Waktu</th><th>ID aktor</th><th>Tabel terdampak</th><th>Aksi</th><th>Ringkasan aman</th></tr></thead>
      <tbody>{events.map(event => <tr key={event.trail_id}>
        <td>{formatEventTime(event.waktu)}</td><td>{event.pengguna_id ?? '—'}</td><td>{event.tabel}</td><td>{event.aksi}</td><td>{event.ringkasan}</td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function formatEventTime(value: string | null) {
  // `waktu` is timestamp without time zone: present its wall-clock text unchanged,
  // and do not silently reinterpret it as UTC or the browser's timezone.
  return value ? value.replace('T', ' ') : '—';
}

export default function AdminAuditTrailPage() {
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
    apiRequest<Listing>(`/admin/audit-trail?${params}`, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) { setListing(result); setState('ready'); } })
      .catch(reason => { if (!controller.signal.aborted) { setError(reason instanceof Error ? reason.message : 'Jejak aktivitas belum dapat dimuat.'); setState('error'); } });
    return () => controller.abort();
  }, [page, query]);

  return <div className="admin-users-page admin-audit-page">
    <PageHeading label="Jejak Aktivitas" detail="Riwayat audit baca saja. Rincian sebelum/sesudah dan payload sensitif tidak ditampilkan." />
    <Section title="Aktivitas pengguna" icon={Activity}>
      <div className="panel-body admin-users-body">
        <form className="admin-users-filters" onSubmit={event => { event.preventDefault(); setPage(1); setQuery(search.trim()); }}>
          <label className="admin-users-field">Cari ID aktor atau kategori<input value={search} maxLength={100} onChange={event => setSearch(event.target.value)} className="admin-users-control" /></label>
          <button type="submit" className="admin-users-control admin-users-search"><Search size={16}/>Cari</button>
        </form>
        <AdminAuditTrailResults state={state} events={listing?.data ?? []} error={error} />
        {state === 'ready' && listing?.data.length ? <div className="admin-users-pagination"><span>Halaman {page}</span><div>
          <button className="admin-users-control" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Sebelumnya</button>
          <button className="admin-users-control" disabled={listing.data.length < pageSize} onClick={() => setPage(value => value + 1)}>Berikutnya</button>
        </div></div> : null}
      </div>
    </Section>
  </div>;
}
