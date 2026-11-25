import { useEffect, useState, type FormEvent } from 'react';
import AdminWorkflowMonitoringPage from './AdminWorkflowMonitoringPage';
import { apiRequest } from '../auth/client';
import { Database, MapPinned } from 'lucide-react';
import { KPI, PageHeading, Section } from '../components/app/AppComponents';
import type { PageProps } from '../types';
import { useServerEnrichedPackages } from './useServerEnrichedPackages';

/** Admin "Monitoring Workflow" on server packages filled with server facts (read-only, Dirah UI unchanged). */
export function ServerAdminMonitoringPage(p: PageProps) {
  const { packages, loading, error } = useServerEnrichedPackages(p.workflow.role);
  return <>
    <div className="ds-view-toggle" role="status" data-testid="admin-monitoring-server-status">
      <span>{error ? `Gagal memuat paket: ${error}` : loading ? 'Memuat paket dan status dari server…' : `${Object.keys(packages).length} paket dari server.`}</span>
    </div>
    <AdminWorkflowMonitoringPage {...p} packages={packages} />
  </>;
}

type Row = Record<string, string | number | boolean | null>;
const TABS = [
  { key: 'jenis-survei', label: 'Jenis survei', path: '/jenis-survei', cols: [['kode', 'Kode'], ['nama', 'Nama'], ['aktif', 'Aktif']] },
  { key: 'balai', label: 'Balai', path: '/balai', cols: [['kode', 'Kode'], ['nama', 'Nama'], ['aktif', 'Aktif']] },
  { key: 'penyedia', label: 'Penyedia jasa', path: '/penyedia', cols: [['penyedia_id', 'ID'], ['nama', 'Nama']] },
  { key: 'jenis-dokumen', label: 'Jenis dokumen', path: '/jenis-dokumen', cols: [['kode', 'Kode'], ['nama', 'Nama']] },
] as const;
const show = (value: Row[string]) => value === true ? 'Ya' : value === false ? 'Tidak' : value ?? '—';

/** Admin "Data Master" from the server (read), plus road registration through the existing RPC. */
export function ServerMasterPage() {
  const [data, setData] = useState<Record<string, Row[]>>({});
  const [error, setError] = useState('');
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('jenis-survei');
  const [road, setRoad] = useState({ balai_id: '', nomor_ruas: '', nama_ruas: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    Promise.all(TABS.map(item => apiRequest<{ data: Row[] }>(item.path, { signal: controller.signal })
      .then(result => [item.key, Array.isArray(result.data) ? result.data : []] as const)))
      .then(entries => { if (!controller.signal.aborted) setData(Object.fromEntries(entries)); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Data master gagal dimuat.'); });
    return () => controller.abort();
  }, []);

  async function addRoad(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage(''); setError('');
    try {
      await apiRequest(`/balai/${encodeURIComponent(road.balai_id)}/ruas-jalan`, { method: 'POST', body: JSON.stringify({ nomor_ruas: road.nomor_ruas.trim(), nama_ruas: road.nama_ruas.trim() }) });
      setMessage(`Ruas ${road.nomor_ruas} terdaftar di server.`);
      setRoad({ ...road, nomor_ruas: '', nama_ruas: '' });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Ruas gagal didaftarkan.'); } finally { setBusy(false); }
  }

  const active = TABS.find(item => item.key === tab)!;
  const rows = data[tab] ?? [];
  return (
    <main className="wf" data-testid="server-master-page">
      <PageHeading label="Data Master" detail="Referensi resmi dibaca dari database Supabase. Perubahan referensi dilakukan melalui migrasi yang disetujui; ruas jalan dapat didaftarkan di sini." />
      {error && <div role="alert" className="wf-callout danger">{error}</div>}
      <div className="wf-kpis">
        {TABS.map(item => <KPI key={item.key} icon={Database} label={item.label} value={String(data[item.key]?.length ?? '…')} note="baris dari server" testId={`master-kpi-${item.key}`} />)}
      </div>
      <nav className="b-view-tabs" aria-label="Kategori data master">
        {TABS.map(item => <button key={item.key} type="button" aria-pressed={tab === item.key} onClick={() => setTab(item.key)}>{item.label}</button>)}
      </nav>
      <Section title={active.label} icon={Database}>
        <div className="wf-table"><table className="balai-history-table" data-testid={`master-${tab}`}>
          <thead><tr>{active.cols.map(([, label]) => <th key={label}>{label}</th>)}</tr></thead>
          <tbody>{rows.map((row, index) => <tr key={index}>{active.cols.map(([key]) => <td key={key}>{String(show(row[key]))}</td>)}</tr>)}</tbody>
        </table></div>
        {!rows.length && !error && <p className="wf-note">{data[tab] ? 'Belum ada data.' : 'Memuat…'}</p>}
      </Section>
      <Section title="Daftarkan ruas jalan" icon={MapPinned}>
        <form className="wf-fields" onSubmit={addRoad} aria-label="Daftarkan ruas jalan">
          <label className="wf-field"><span>Balai</span><select required value={road.balai_id} onChange={e => setRoad({ ...road, balai_id: e.target.value })}>
            <option value="">Pilih Balai</option>{(data.balai ?? []).map(row => <option key={String(row.balai_id)} value={String(row.balai_id)}>{String(row.nama)}</option>)}</select></label>
          <label className="wf-field"><span>Nomor ruas</span><input required value={road.nomor_ruas} onChange={e => setRoad({ ...road, nomor_ruas: e.target.value })} /></label>
          <label className="wf-field full"><span>Nama ruas</span><input required value={road.nama_ruas} onChange={e => setRoad({ ...road, nama_ruas: e.target.value })} /></label>
          <div className="wf-toolbar wf-field full"><button type="submit" className="wf-button primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Daftarkan ruas'}</button></div>
        </form>
        {message && <div role="status" className="wf-callout">{message}</div>}
      </Section>
    </main>
  );
}
