import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ClipboardList, CheckCheck, AlertTriangle } from 'lucide-react';
import { apiRequest } from '../auth/client';
import type { PageProps } from '../types';
import NotificationRow, { type RowTone } from './NotificationRow';
import './notifications.css';
import { daysLeft, dueText } from './serverNotificationTime';

export type ServerNotification = {
  paket_id: number; nama_paket: string; judul: string; pesan: string;
  nada: 'action' | 'warning' | 'danger' | 'success'; tautan: string; tenggat: string | null;
};

const CATEGORY: Record<ServerNotification['nada'], string> = { action: 'Perlu tindakan', warning: 'Segera', danger: 'Lewat tenggat', success: 'Selesai' };
const TONE: Record<ServerNotification['nada'], RowTone> = { action: 'action', warning: 'warning', danger: 'warning', success: 'success' };

/** Logged-in users: tasks derived live by the server (baca_notifikasi_saya), opened straight in the package workspace. */
export default function ServerNotificationsPage(p: PageProps) {
  const [rows, setRows] = useState<ServerNotification[] | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [query, setQuery] = useState('');
  const [pkg, setPkg] = useState('');
  const tasksOnly = p.activeTab === 'Tugas';

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    apiRequest<{ data: ServerNotification[] }>('/notifikasi', { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setRows(Array.isArray(result.data) ? result.data : []); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Notifikasi gagal dimuat.'); });
    return () => controller.abort();
  }, [revision]);

  const all = rows ?? [];
  const tasks = all.filter(row => row.nada !== 'success');
  const dueSoon = tasks.filter(row => row.tenggat && daysLeft(row.tenggat) >= 0 && daysLeft(row.tenggat) <= 7).length;
  const overdue = tasks.filter(row => row.nada === 'danger' || (row.tenggat && daysLeft(row.tenggat) < 0)).length;
  const packages = useMemo(() => [...new Map(all.map(row => [row.paket_id, row.nama_paket])).entries()], [all]);
  const list = (tasksOnly ? tasks : all).filter(row =>
    (!pkg || String(row.paket_id) === pkg) && `${row.judul} ${row.pesan} ${row.nama_paket}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="notif-page" data-testid="server-notifications">
      <div className="notif-intro"><div>
        <h1>{tasksOnly ? 'Perlu ditindaklanjuti' : 'Semua notifikasi'}</h1>
        <p>Tugas aktif dihitung langsung dari data server dan hilang sendiri setelah pekerjaannya selesai.</p>
      </div>
        <button type="button" className="notif-outline-btn" onClick={() => setRevision(value => value + 1)}>Muat ulang</button>
      </div>
      {error && <div role="alert" className="notif-warning">Ada kendala saat memuat notifikasi. {error}</div>}
      <div className="notif-summary" aria-label="Ringkasan notifikasi">
        <div className="notif-stat notif-stat-blue"><span className="notif-stat-icon"><ClipboardList size={20} /></span>
          <span><span className="notif-stat-number" data-testid="notif-count-action">{tasks.length}</span><span className="notif-stat-label">Perlu tindakan</span></span></div>
        <div className="notif-stat notif-stat-amber"><span className="notif-stat-icon"><CalendarClock size={20} /></span>
          <span><span className="notif-stat-number">{dueSoon}</span><span className="notif-stat-label">Tenggat ≤ 7 hari</span></span></div>
        <div className="notif-stat notif-stat-red"><span className="notif-stat-icon"><AlertTriangle size={20} /></span>
          <span><span className="notif-stat-number">{overdue}</span><span className="notif-stat-label">Lewat tenggat / ditahan</span></span></div>
        <div className="notif-stat notif-stat-blue"><span className="notif-stat-icon"><CheckCheck size={20} /></span>
          <span><span className="notif-stat-number">{all.length - tasks.length}</span><span className="notif-stat-label">Paket selesai</span></span></div>
      </div>
      <div className="wf-toolbar" style={{ margin: '12px 0' }}>
        <input aria-label="Cari notifikasi" placeholder="Cari judul atau paket…" value={query} onChange={e => setQuery(e.target.value)} />
        <select aria-label="Filter paket notifikasi" value={pkg} onChange={e => setPkg(e.target.value)}>
          <option value="">Semua paket</option>
          {packages.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </div>
      {rows === null && !error && <p role="status">Memuat notifikasi dari server…</p>}
      {rows !== null && list.length === 0 && <p className="wf-note">{tasksOnly ? 'Tidak ada pekerjaan yang menunggu Anda.' : 'Belum ada notifikasi.'}</p>}
      <div className="notif-list">
        {list.map((row, index) => (
          <NotificationRow
            key={`${row.paket_id}-${row.judul}-${index}`}
            title={row.judul}
            subtitle={row.pesan}
            meta={[row.nama_paket, dueText(row.tenggat)].filter(Boolean).join(' · ')}
            category={CATEGORY[row.nada]}
            tone={TONE[row.nada]}
            unread={row.nada !== 'success'}
            onView={() => p.openPackageReview(String(row.paket_id), row.tautan)}
            onAct={row.nada === 'success' ? undefined : () => p.openPackageReview(String(row.paket_id), row.tautan)}
            actionLabel="Kerjakan"
          />
        ))}
      </div>
    </div>
  );
}
