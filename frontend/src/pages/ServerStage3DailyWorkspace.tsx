import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { apiRequest } from '../auth/client';
import { getSurveySegments, getSurveySessions, sessionSummary, type SurveySegment, type SurveySession } from './serverStage3Data';

function display(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function label(key: string) {
  return key.replaceAll('_', ' ');
}

function returnedColumns(rows: Record<string, unknown>[]) {
  const preferred = ['data_id', 'sta_awal', 'sta_akhir', 'lajur', 'nilai_utama', 'atribut_detail', 'lat', 'lon', 'status_qc', 'versi_aktif'];
  const keys = new Set(rows.flatMap(row => Object.keys(row)));
  return [...preferred.filter(key => keys.has(key)), ...[...keys].filter(key => !preferred.includes(key))];
}

export function ServerStage3DailyWorkspace({ packageId }: { packageId: string }) {
  const [sessions, setSessions] = useState<SurveySession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState('');
  const [sessionRevision, setSessionRevision] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [segments, setSegments] = useState<SurveySegment[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [segmentsError, setSegmentsError] = useState('');
  const [segmentsRevision, setSegmentsRevision] = useState(0);

  const selectedSession = sessions.find(session => session.sesi_id === selectedSessionId) ?? null;
  const segmentColumns = useMemo(() => returnedColumns(segments as Record<string, unknown>[]), [segments]);

  useEffect(() => {
    const controller = new AbortController();
    setSessionsLoading(true);
    setSessionsError('');
    getSurveySessions(packageId, apiRequest, controller.signal).then(rows => {
      if (controller.signal.aborted) return;
      setSessions(rows);
      setSelectedSessionId(current => current !== null && rows.some(row => row.sesi_id === current) ? current : null);
    }).catch(error => {
      if (!controller.signal.aborted) setSessionsError(error instanceof Error ? error.message : 'Gagal memuat sesi survei.');
    }).finally(() => {
      if (!controller.signal.aborted) setSessionsLoading(false);
    });
    return () => controller.abort();
  }, [packageId, sessionRevision]);

  useEffect(() => {
    if (!selectedSessionId) {
      setSegments([]);
      setSegmentsError('');
      setSegmentsLoading(false);
      return;
    }
    const controller = new AbortController();
    setSegmentsLoading(true);
    setSegmentsError('');
    setSegments([]);
    getSurveySegments(packageId, selectedSessionId, apiRequest, controller.signal).then(rows => {
      if (!controller.signal.aborted) setSegments(rows);
    }).catch(error => {
      if (!controller.signal.aborted) setSegmentsError(error instanceof Error ? error.message : 'Gagal memuat data segmen.');
    }).finally(() => {
      if (!controller.signal.aborted) setSegmentsLoading(false);
    });
    return () => controller.abort();
  }, [packageId, selectedSessionId, segmentsRevision]);

  return <div className="server-stage3-data" data-testid="server-stage3-data">
    <section className="wf-panel" aria-labelledby="server-stage3-sessions-title">
      <div className="wf-panel-head">
        <h3 id="server-stage3-sessions-title">Sesi survei sebenar · Paket #{packageId}</h3>
        <button type="button" className="wf-button" onClick={() => setSessionRevision(value => value + 1)} disabled={sessionsLoading}>
          <RefreshCw size={13} /> {sessionsLoading ? 'Memuat…' : 'Muat semula sesi'}
        </button>
      </div>
      <div className="wf-body">
        {sessionsLoading && <p role="status">Memuat sesi survei…</p>}
        {!sessionsLoading && sessionsError && <div role="alert" className="wf-callout danger">{sessionsError}<div><button className="wf-button" onClick={() => setSessionRevision(value => value + 1)}>Coba lagi</button></div></div>}
        {!sessionsLoading && !sessionsError && sessions.length === 0 && <p className="wf-note">Belum ada sesi survei untuk paket ini.</p>}
        {!sessionsLoading && !sessionsError && sessions.length > 0 && <div className="wf-table-wrap"><table className="wf-table">
          <thead><tr><th>Sesi</th><th>Tanggal · ruas · tim</th><th>Alat</th><th>Waktu</th></tr></thead>
          <tbody>{sessions.map(session => <tr key={session.sesi_id}>
            <td><button type="button" className="wf-button" aria-pressed={selectedSessionId === session.sesi_id} onClick={() => setSelectedSessionId(session.sesi_id)}>Pilih sesi #{session.sesi_id}</button></td>
            <td>{sessionSummary(session)}</td>
            <td>{session.alat_id == null ? '—' : `#${session.alat_id}`}</td>
            <td>{[session.jam_mulai, session.jam_selesai].filter(Boolean).join('–') || '—'}</td>
          </tr>)}</tbody>
        </table></div>}
      </div>
    </section>

    {selectedSession && <section className="wf-panel" aria-labelledby="server-stage3-segments-title">
      <div className="wf-panel-head">
        <h3 id="server-stage3-segments-title">Data segmen · Sesi #{selectedSession.sesi_id}</h3>
        <button type="button" className="wf-button" onClick={() => setSegmentsRevision(value => value + 1)} disabled={segmentsLoading}><RefreshCw size={13} /> {segmentsLoading ? 'Memuat…' : 'Muat semula segmen'}</button>
      </div>
      <div className="wf-body">
        {segmentsLoading && <p role="status">Memuat data segmen…</p>}
        {!segmentsLoading && segmentsError && <div role="alert" className="wf-callout danger">{segmentsError}<div><button className="wf-button" onClick={() => setSegmentsRevision(value => value + 1)}>Coba lagi</button></div></div>}
        {!segmentsLoading && !segmentsError && segments.length === 0 && <p className="wf-note">Belum ada data segmen untuk sesi ini.</p>}
        {!segmentsLoading && !segmentsError && segments.length > 0 && <div className="wf-table-wrap"><table className="wf-table">
          <thead><tr>{segmentColumns.map(key => <th key={key}>{label(key)}</th>)}</tr></thead>
          <tbody>{segments.map((segment, index) => <tr key={String(segment.data_id ?? index)}>{segmentColumns.map(key => <td key={key}>{display((segment as Record<string, unknown>)[key])}</td>)}</tr>)}</tbody>
        </table></div>}
      </div>
    </section>}
  </div>;
}
