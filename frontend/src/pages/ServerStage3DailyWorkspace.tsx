import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { RefreshCw, Plus, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../auth/client';
import type { WorkflowRole } from '../workflow/model';
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

type TeamOption = { tim_id: number; nama_tim?: string; jenis_survei?: { nama?: string; kode?: string } };
type RoadOption = { ruas_id: number; nomor_ruas?: string; nama_ruas?: string };

export function ServerStage3DailyWorkspace({
  packageId,
  role,
  onNavigate,
}: {
  packageId: string;
  role?: WorkflowRole;
  onNavigate?: (selection: string) => void;
}) {
  const [sessions, setSessions] = useState<SurveySession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState('');
  const [sessionRevision, setSessionRevision] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [segments, setSegments] = useState<SurveySegment[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [segmentsError, setSegmentsError] = useState('');
  const [segmentsRevision, setSegmentsRevision] = useState(0);

  // New session creation state
  const [showNewForm, setShowNewForm] = useState(false);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [roads, setRoads] = useState<RoadOption[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [newSession, setNewSession] = useState({
    tim_id: '',
    ruas_id: '',
    alat_id: '',
    tanggal: new Date().toISOString().slice(0, 10),
    jam_mulai: '08:00',
    jam_selesai: '16:00',
    lajur: 'L1',
    arah: 'Normal',
    cuaca: 'Cerah',
    kondisi_permukaan: 'Kering',
    panjang_tercapai_km: '5.0',
  });

  const navigate = (to: string) => {
    if (onNavigate) onNavigate(to);
    else window.dispatchEvent(new CustomEvent('jalamutu:navigate', { detail: to }));
  };

  const selectedSession = sessions.find(session => session.sesi_id === selectedSessionId) ?? null;
  const segmentColumns = useMemo(() => returnedColumns(segments as Record<string, unknown>[]), [segments]);

  // Load teams and roads for session creation
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      apiRequest<{ data: unknown }>(`/paket/${encodeURIComponent(packageId)}/tim`, { signal: controller.signal })
        .catch(() => ({ data: [] })),
      apiRequest<{ data: unknown }>(`/paket/${encodeURIComponent(packageId)}/ruas-jalan`, { signal: controller.signal })
        .catch(() => ({ data: [] })),
    ]).then(([teamsRes, roadsRes]) => {
      if (controller.signal.aborted) return;
      const t = Array.isArray(teamsRes.data) ? (teamsRes.data as TeamOption[]) : [];
      const r = Array.isArray(roadsRes.data) ? (roadsRes.data as RoadOption[]) : [];
      setTeams(t);
      setRoads(r);
      if (t.length > 0 && !newSession.tim_id) {
        setNewSession(curr => ({ ...curr, tim_id: String(t[0].tim_id), alat_id: curr.alat_id || '1' }));
      }
      if (r.length > 0 && !newSession.ruas_id) {
        setNewSession(curr => ({ ...curr, ruas_id: String(r[0].ruas_id) }));
      }
    });
    return () => controller.abort();
  }, [packageId]);

  useEffect(() => {
    const controller = new AbortController();
    setSessionsLoading(true);
    setSessionsError('');
    getSurveySessions(packageId, apiRequest, controller.signal).then(rows => {
      if (controller.signal.aborted) return;
      setSessions(rows);
      setSelectedSessionId(current => current !== null && rows.some(row => row.sesi_id === current) ? current : rows[0]?.sesi_id ?? null);
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

  async function handleCreateSession(e: FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    setFormSuccess('');
    try {
      const timId = Number(newSession.tim_id);
      const ruasId = Number(newSession.ruas_id);
      const alatId = Number(newSession.alat_id);
      if (!timId || !ruasId || !alatId) {
        throw new Error('Pilih Tim, Ruas, dan Alat dengan benar.');
      }
      await apiRequest(`/paket/${encodeURIComponent(packageId)}/sesi-survei`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tim_id: timId,
          ruas_id: ruasId,
          alat_id: alatId,
          tanggal: newSession.tanggal,
          jam_mulai: newSession.jam_mulai || null,
          jam_selesai: newSession.jam_selesai || null,
          lajur: newSession.lajur || null,
          arah: newSession.arah || null,
          cuaca: newSession.cuaca || null,
          kondisi_permukaan: newSession.kondisi_permukaan || null,
          panjang_tercapai_km: newSession.panjang_tercapai_km ? Number(newSession.panjang_tercapai_km) : null,
        }),
      });
      setFormSuccess('Sesi survei baru berhasil dicatat di server!');
      setShowNewForm(false);
      setSessionRevision(r => r + 1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal mencatat sesi survei.');
    } finally {
      setFormLoading(false);
    }
  }

  return (
    <div className="server-stage3-data" data-testid="server-stage3-data">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0 }}>Tahap 3A · Pelaksanaan Survei Harian</h3>
          <span className="wf-note" style={{ display: 'block', marginTop: 2 }}>
            Sesi dan segmen survei tercatat di server. Verifikasi berkala dilakukan di Tahap 3B.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="wf-button"
            onClick={() => setShowNewForm(curr => !curr)}
          >
            <Plus size={13} /> {showNewForm ? 'Tutup Formulir' : 'Catat Sesi Baru'}
          </button>
          <button
            type="button"
            className="wf-button primary"
            onClick={() => navigate('/verification:Verval 14 hari')}
          >
            Lanjut ke Tahap 3B (Verval) →
          </button>
        </div>
      </div>

      {formSuccess && (
        <div className="wf-callout ok" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} color="#166534" />
          <span>{formSuccess}</span>
        </div>
      )}

      {showNewForm && (
        <section className="wf-panel" style={{ marginBottom: 20, border: '1px solid #bfdbfe' }}>
          <div className="wf-panel-head">
            <h4>Catat Sesi Survei Harian Baru</h4>
            <span className="wf-badge">FORMULIR PENYEDIA</span>
          </div>
          <div className="wf-body">
            {formError && <div role="alert" className="wf-callout danger" style={{ marginBottom: 12 }}>{formError}</div>}
            <form onSubmit={handleCreateSession}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <label className="wf-field">
                  <span>Tim Survei</span>
                  <select
                    value={newSession.tim_id}
                    onChange={e => setNewSession(curr => ({ ...curr, tim_id: e.target.value }))}
                    required
                  >
                    <option value="">Pilih Tim</option>
                    {teams.map(t => (
                      <option key={t.tim_id} value={t.tim_id}>
                        Tim #{t.tim_id} · {t.nama_tim || t.jenis_survei?.nama || 'Tim Survei'}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="wf-field">
                  <span>Ruas Jalan</span>
                  <select
                    value={newSession.ruas_id}
                    onChange={e => setNewSession(curr => ({ ...curr, ruas_id: e.target.value }))}
                    required
                  >
                    <option value="">Pilih Ruas</option>
                    {roads.map(r => (
                      <option key={r.ruas_id} value={r.ruas_id}>
                        {r.nomor_ruas ? `${r.nomor_ruas} - ` : `Ruas #${r.ruas_id} `}{r.nama_ruas || ''}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="wf-field">
                  <span>ID Alat Survei</span>
                  <input
                    type="number"
                    value={newSession.alat_id}
                    onChange={e => setNewSession(curr => ({ ...curr, alat_id: e.target.value }))}
                    placeholder="Contoh: 1"
                    required
                  />
                </label>

                <label className="wf-field">
                  <span>Tanggal Survei</span>
                  <input
                    type="date"
                    value={newSession.tanggal}
                    onChange={e => setNewSession(curr => ({ ...curr, tanggal: e.target.value }))}
                    required
                  />
                </label>

                <label className="wf-field">
                  <span>Jam Mulai</span>
                  <input
                    type="text"
                    value={newSession.jam_mulai}
                    onChange={e => setNewSession(curr => ({ ...curr, jam_mulai: e.target.value }))}
                    placeholder="08:00"
                  />
                </label>

                <label className="wf-field">
                  <span>Jam Selesai</span>
                  <input
                    type="text"
                    value={newSession.jam_selesai}
                    onChange={e => setNewSession(curr => ({ ...curr, jam_selesai: e.target.value }))}
                    placeholder="16:00"
                  />
                </label>

                <label className="wf-field">
                  <span>Lajur</span>
                  <select
                    value={newSession.lajur}
                    onChange={e => setNewSession(curr => ({ ...curr, lajur: e.target.value }))}
                  >
                    <option value="L1">L1 (Kiri 1)</option>
                    <option value="L2">L2 (Kiri 2)</option>
                    <option value="R1">R1 (Kanan 1)</option>
                    <option value="R2">R2 (Kanan 2)</option>
                  </select>
                </label>

                <label className="wf-field">
                  <span>Cuaca</span>
                  <select
                    value={newSession.cuaca}
                    onChange={e => setNewSession(curr => ({ ...curr, cuaca: e.target.value }))}
                  >
                    <option value="Cerah">Cerah</option>
                    <option value="Berawan">Berawan</option>
                    <option value="Hujan Ringan">Hujan Ringan</option>
                  </select>
                </label>

                <label className="wf-field">
                  <span>Panjang Tercapai (km)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={newSession.panjang_tercapai_km}
                    onChange={e => setNewSession(curr => ({ ...curr, panjang_tercapai_km: e.target.value }))}
                  />
                </label>
              </div>

              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                <button
                  type="submit"
                  className="wf-button primary"
                  disabled={formLoading}
                >
                  {formLoading ? 'Menyimpan…' : 'Simpan Sesi Survei'}
                </button>
                <button
                  type="button"
                  className="wf-button"
                  onClick={() => setShowNewForm(false)}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="wf-panel" aria-labelledby="server-stage3-sessions-title">
        <div className="wf-panel-head">
          <h3 id="server-stage3-sessions-title">Sesi survei sebenar · Paket #{packageId}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="wf-button"
              onClick={() => setShowNewForm(curr => !curr)}
            >
              <Plus size={13} /> Catat Sesi Baru
            </button>
            <button
              type="button"
              className="wf-button"
              onClick={() => setSessionRevision(value => value + 1)}
              disabled={sessionsLoading}
            >
              <RefreshCw size={13} /> {sessionsLoading ? 'Memuat…' : 'Muat semula sesi'}
            </button>
          </div>
        </div>
        <div className="wf-body">
          {sessionsLoading && <p role="status">Memuat sesi survei…</p>}
          {!sessionsLoading && sessionsError && (
            <div role="alert" className="wf-callout danger">
              {sessionsError}
              <div>
                <button className="wf-button" onClick={() => setSessionRevision(value => value + 1)}>
                  Coba lagi
                </button>
              </div>
            </div>
          )}
          {!sessionsLoading && !sessionsError && sessions.length === 0 && (
            <div>
              <p className="wf-note">Belum ada sesi survei untuk paket ini.</p>
              <button
                type="button"
                className="wf-button primary"
                onClick={() => setShowNewForm(true)}
                style={{ marginTop: 8 }}
              >
                <Plus size={13} /> Catat Sesi Survei Pertama
              </button>
            </div>
          )}
          {!sessionsLoading && !sessionsError && sessions.length > 0 && (
            <div className="wf-table-wrap">
              <table className="wf-table">
                <thead>
                  <tr>
                    <th>Sesi</th>
                    <th>Tanggal · ruas · tim</th>
                    <th>Alat</th>
                    <th>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(session => (
                    <tr key={session.sesi_id}>
                      <td>
                        <button
                          type="button"
                          className="wf-button"
                          aria-pressed={selectedSessionId === session.sesi_id}
                          onClick={() => setSelectedSessionId(session.sesi_id)}
                        >
                          Pilih sesi #{session.sesi_id}
                        </button>
                      </td>
                      <td>{sessionSummary(session)}</td>
                      <td>{session.alat_id == null ? '—' : `#${session.alat_id}`}</td>
                      <td>{[session.jam_mulai, session.jam_selesai].filter(Boolean).join('–') || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {selectedSession && (
        <section className="wf-panel" aria-labelledby="server-stage3-segments-title">
          <div className="wf-panel-head">
            <h3 id="server-stage3-segments-title">Data segmen · Sesi #{selectedSession.sesi_id}</h3>
            <button
              type="button"
              className="wf-button"
              onClick={() => setSegmentsRevision(value => value + 1)}
              disabled={segmentsLoading}
            >
              <RefreshCw size={13} /> {segmentsLoading ? 'Memuat…' : 'Muat semula segmen'}
            </button>
          </div>
          <div className="wf-body">
            {segmentsLoading && <p role="status">Memuat data segmen…</p>}
            {!segmentsLoading && segmentsError && (
              <div role="alert" className="wf-callout danger">
                {segmentsError}
                <div>
                  <button className="wf-button" onClick={() => setSegmentsRevision(value => value + 1)}>
                    Coba lagi
                  </button>
                </div>
              </div>
            )}
            {!segmentsLoading && !segmentsError && segments.length === 0 && (
              <p className="wf-note">Belum ada data segmen untuk sesi ini.</p>
            )}
            {!segmentsLoading && !segmentsError && segments.length > 0 && (
              <div className="wf-table-wrap">
                <table className="wf-table">
                  <thead>
                    <tr>
                      {segmentColumns.map(key => (
                        <th key={key}>{label(key)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {segments.map((segment, index) => (
                      <tr key={String(segment.data_id ?? index)}>
                        {segmentColumns.map(key => (
                          <td key={key}>{display((segment as Record<string, unknown>)[key])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="wf-toolbar" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          className="wf-button"
          onClick={() => navigate('/entry:Validasi produksi')}
        >
          <ArrowLeft size={13} /> Kembali ke Tahap 2 (Validasi Produksi)
        </button>
        <button
          type="button"
          className="wf-button primary"
          onClick={() => navigate('/verification:Verval 14 hari')}
        >
          Lanjut ke Tahap 3B (Verval 14 Hari) <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
