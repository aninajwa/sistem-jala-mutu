import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Plus, RefreshCw, Save } from 'lucide-react';
import { apiRequest } from '../auth/client';
import type { WorkflowRole } from '../workflow/model';
import {
  createSurveySegmentAndConfirm,
  createSurveySessionAndConfirm,
  eligibleApprovedTrials,
  getApprovedSurveyTrials,
  getSurveyRoads,
  getSurveySegments,
  getSurveySessions,
  getSurveyTeams,
  getSurveyToolAssignments,
  sessionSummary,
  type ApprovedSurveyTrial,
  type SurveyRoad,
  type SurveySegment,
  type SurveySegmentInput,
  type SurveySession,
  type SurveySessionInput,
  type SurveyTeam,
  type SurveyToolAssignment,
} from './serverStage3Data';

function display(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function label(key: string) { return key.replaceAll('_', ' '); }

function returnedColumns(rows: Record<string, unknown>[]) {
  const preferred = ['data_id', 'sta_awal', 'sta_akhir', 'lajur', 'nilai_utama', 'atribut_detail', 'lat', 'lon', 'status_qc', 'versi_aktif'];
  const keys = new Set(rows.flatMap(row => Object.keys(row)));
  return [...preferred.filter(key => keys.has(key)), ...[...keys].filter(key => !preferred.includes(key))];
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Permintaan ke server gagal.';
}

const today = () => new Date().toISOString().slice(0, 10);
const emptySession = () => ({ tanggal: today(), jam_mulai: '', jam_selesai: '', lajur: '', arah: '', cuaca: '', kondisi_permukaan: '', panjang_tercapai_km: '', link_video: '' });
const emptySegment = () => ({ sta_awal: '', sta_akhir: '', lajur: '', nilai_utama: '', lat: '', lon: '' });

function parseOptionalNumber(value: string, label: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} mesti angka yang sah.`);
  return parsed;
}

export function ServerStage3DailyWorkspace({ packageId, role, onNavigate }: { packageId: string; role: WorkflowRole; onNavigate?: (selection: string) => void }) {
  const provider = role === 'Penyedia Jasa / Ketua Tim';
  const navigate = (selection: string) => onNavigate?.(selection);
  const [sessions, setSessions] = useState<SurveySession[]>([]);
  const [teams, setTeams] = useState<SurveyTeam[]>([]);
  const [roads, setRoads] = useState<SurveyRoad[]>([]);
  const [trials, setTrials] = useState<ApprovedSurveyTrial[]>([]);
  const [supportLoading, setSupportLoading] = useState(true);
  const [supportError, setSupportError] = useState('');
  const [sessionRevision, setSessionRevision] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [segments, setSegments] = useState<SurveySegment[]>([]);
  const [segmentsLoading, setSegmentsLoading] = useState(false);
  const [segmentsError, setSegmentsError] = useState('');
  const [segmentsRevision, setSegmentsRevision] = useState(0);
  const [teamId, setTeamId] = useState('');
  const [assignments, setAssignments] = useState<SurveyToolAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState('');
  const [sessionForm, setSessionForm] = useState(emptySession);
  const [approvedTrialId, setApprovedTrialId] = useState('');
  const [segmentForm, setSegmentForm] = useState(emptySegment);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const selectedSession = sessions.find(session => session.sesi_id === selectedSessionId) ?? null;
  const selectedTeam = teams.find(team => String(team.tim_id) === teamId);
  const segmentColumns = useMemo(() => returnedColumns(segments as Record<string, unknown>[]), [segments]);
  const eligibleTrials = useMemo(() => selectedTeam
    ? eligibleApprovedTrials(trials, assignments, roads, selectedTeam.tim_id, selectedTeam.jenis_survei_id, sessionForm.tanggal)
    : [], [trials, assignments, roads, selectedTeam, sessionForm.tanggal]);

  useEffect(() => {
    const controller = new AbortController();
    setSupportLoading(true);
    setSupportError('');
    Promise.all([
      getSurveySessions(packageId, apiRequest, controller.signal),
      getSurveyTeams(packageId, apiRequest, controller.signal),
      getSurveyRoads(packageId, apiRequest, controller.signal),
      getApprovedSurveyTrials(packageId, apiRequest, controller.signal),
    ]).then(([nextSessions, nextTeams, nextRoads, nextTrials]) => {
      if (controller.signal.aborted) return;
      setSessions(nextSessions);
      setTeams(nextTeams);
      setRoads(nextRoads);
      setTrials(nextTrials);
      setSelectedSessionId(current => current !== null && nextSessions.some(row => row.sesi_id === current) ? current : null);
      setTeamId(current => nextTeams.some(team => String(team.tim_id) === current) ? current : nextTeams[0] ? String(nextTeams[0].tim_id) : '');
    }).catch(error => {
      if (!controller.signal.aborted) setSupportError(errorMessage(error));
    }).finally(() => {
      if (!controller.signal.aborted) setSupportLoading(false);
    });
    return () => controller.abort();
  }, [packageId, sessionRevision]);

  useEffect(() => {
    if (!teamId) { setAssignments([]); setAssignmentsError(''); setAssignmentsLoading(false); return; }
    const controller = new AbortController();
    setAssignmentsLoading(true);
    setAssignmentsError('');
    getSurveyToolAssignments(packageId, Number(teamId), apiRequest, controller.signal).then(rows => {
      if (!controller.signal.aborted) setAssignments(rows);
    }).catch(error => {
      if (!controller.signal.aborted) setAssignmentsError(errorMessage(error));
    }).finally(() => {
      if (!controller.signal.aborted) setAssignmentsLoading(false);
    });
    return () => controller.abort();
  }, [packageId, teamId]);

  useEffect(() => {
    if (!selectedSessionId) {
      setSegments([]); setSegmentsError(''); setSegmentsLoading(false); return;
    }
    const controller = new AbortController();
    setSegmentsLoading(true);
    setSegmentsError('');
    setSegments([]);
    getSurveySegments(packageId, selectedSessionId, apiRequest, controller.signal).then(rows => {
      if (!controller.signal.aborted) setSegments(rows);
    }).catch(error => {
      if (!controller.signal.aborted) setSegmentsError(errorMessage(error));
    }).finally(() => {
      if (!controller.signal.aborted) setSegmentsLoading(false);
    });
    return () => controller.abort();
  }, [packageId, selectedSessionId, segmentsRevision]);

  function updateSession<K extends keyof ReturnType<typeof emptySession>>(key: K, value: ReturnType<typeof emptySession>[K]) {
    setSessionForm(current => ({ ...current, [key]: value }));
  }

  async function submitSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!provider || busy || !selectedTeam) return;
    setFormError(''); setNotice('');
    const approvedTrial = eligibleTrials.find(trial => String(trial.uji_coba_id) === approvedTrialId);
    if (!approvedTrial) { setFormError('Pilih kombinasi uji coba yang sudah DISETUJUI, dengan alat aktif pada tanggal sesi.'); return; }
    const road = roads.find(item => item.ruas_id === approvedTrial.ruas_id);
    if (!road) { setFormError('Ruas untuk uji coba disetujui tidak tersedia dalam skop paket.'); return; }
    let panjang: number | undefined;
    try { panjang = parseOptionalNumber(sessionForm.panjang_tercapai_km, 'Panjang tercapai'); }
    catch (error) { setFormError(errorMessage(error)); return; }
    if (panjang !== undefined && panjang < 0) { setFormError('Panjang tercapai tidak boleh negatif.'); return; }
    const payload: SurveySessionInput = {
      tim_id: selectedTeam.tim_id,
      ruas_id: road.ruas_id,
      alat_id: approvedTrial.alat_id,
      tanggal: sessionForm.tanggal,
      jam_mulai: sessionForm.jam_mulai || undefined,
      jam_selesai: sessionForm.jam_selesai || undefined,
      lajur: sessionForm.lajur || undefined,
      arah: sessionForm.arah || undefined,
      cuaca: sessionForm.cuaca || undefined,
      kondisi_permukaan: sessionForm.kondisi_permukaan || undefined,
      panjang_tercapai_km: panjang,
      link_video: sessionForm.link_video || undefined,
    };
    setBusy(true);
    try {
      const confirmed = await createSurveySessionAndConfirm(packageId, payload, apiRequest);
      setSessions(confirmed.sessions);
      setSelectedSessionId(confirmed.session.sesi_id);
      setSessionForm(emptySession());
      setApprovedTrialId('');
      setNotice(`Sesi #${confirmed.session.sesi_id} disimpan dan disahkan melalui bacaan semula server.`);
      window.dispatchEvent(new CustomEvent('jalamutu:package-stage-facts-refresh', { detail: { packageId } }));
    } catch (error) { setFormError(errorMessage(error)); }
    finally { setBusy(false); }
  }

  async function submitSegment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!provider || busy || !selectedSession || !selectedTeam || !selectedSession.tim_id || selectedSession.tim_id !== selectedTeam.tim_id) return;
    setFormError(''); setNotice('');
    let payload: SurveySegmentInput;
    try {
      payload = {
        jenis_survei_id: selectedTeam.jenis_survei_id,
        sta_awal: parseOptionalNumber(segmentForm.sta_awal, 'STA awal'),
        sta_akhir: parseOptionalNumber(segmentForm.sta_akhir, 'STA akhir'),
        nilai_utama: parseOptionalNumber(segmentForm.nilai_utama, 'Nilai utama'),
        lat: parseOptionalNumber(segmentForm.lat, 'Latitud'),
        lon: parseOptionalNumber(segmentForm.lon, 'Longitud'),
        lajur: segmentForm.lajur.trim() || undefined,
      };
    } catch (error) { setFormError(errorMessage(error)); return; }
    const hasSegmentValue = Object.entries(payload).some(([key, value]) => key !== 'jenis_survei_id' && value !== undefined && value !== null);
    if (!hasSegmentValue) { setFormError('Isi sekurang-kurangnya satu nilai segmen sebelum menyimpan.'); return; }
    setBusy(true);
    try {
      const confirmed = await createSurveySegmentAndConfirm(packageId, selectedSession.sesi_id, payload, apiRequest);
      setSegments(confirmed.segments);
      setSegmentForm(emptySegment());
      setNotice(`Data segmen #${confirmed.segment.data_id} disimpan dan disahkan melalui bacaan semula server.`);
      window.dispatchEvent(new CustomEvent('jalamutu:package-stage-facts-refresh', { detail: { packageId } }));
    } catch (error) { setFormError(errorMessage(error)); }
    finally { setBusy(false); }
  }

  const selectedSessionTeam = selectedSession ? teams.find(team => team.tim_id === selectedSession.tim_id) : undefined;

  return <div className="server-stage3-data" data-testid="server-stage3-data">
    <header className="wf-head"><div><div className="wf-eyebrow">TAHAP 3A</div><h2 className="wf-title">Pelaksanaan Survei Harian</h2><p className="wf-subtitle">Sesi dan segmen dibaca dari server; formulir Penyedia menggunakan prasyarat uji coba, alat, tim dan ruas yang tersedia dari server.</p></div><div className="wf-toolbar"><button type="button" className="wf-button" onClick={() => navigate('/entry:Validasi produksi')}><ArrowLeft size={13} /> Tahap 2</button><button type="button" className="wf-button primary" onClick={() => navigate('/verification:Verval 14 hari')}><ArrowRight size={13} /> Tahap 3B</button></div></header>
    {notice && <p role="status" className="wf-callout">{notice}</p>}
    {formError && <p role="alert" className="wf-callout danger">{formError}</p>}
    <section className="wf-panel" aria-labelledby="server-stage3-sessions-title">
      <div className="wf-panel-head">
        <h3 id="server-stage3-sessions-title">Sesi survei · Paket #{packageId}</h3>
        <button type="button" className="wf-button" onClick={() => setSessionRevision(value => value + 1)} disabled={supportLoading}>
          <RefreshCw size={13} /> {supportLoading ? 'Memuat…' : 'Muat semula data server'}
        </button>
      </div>
      <div className="wf-body">
        {supportLoading && <p role="status">Memuat sesi dan prasyarat daripada server…</p>}
        {!supportLoading && supportError && <div role="alert" className="wf-callout danger">{supportError}<div><button type="button" className="wf-button" onClick={() => setSessionRevision(value => value + 1)}>Coba lagi</button></div></div>}
        {!supportLoading && !supportError && sessions.length === 0 && <p className="wf-note">Belum ada sesi survei untuk paket ini.</p>}
        {!supportLoading && !supportError && sessions.length > 0 && <div className="wf-table-wrap"><table className="wf-table">
          <thead><tr><th>Sesi</th><th>Tanggal · ruas · tim</th><th>Alat</th><th>Waktu</th></tr></thead>
          <tbody>{sessions.map(session => <tr key={session.sesi_id}>
            <td><button type="button" className="wf-button" aria-pressed={selectedSessionId === session.sesi_id} onClick={() => setSelectedSessionId(session.sesi_id)}>Pilih sesi #{session.sesi_id}</button></td>
            <td>{sessionSummary(session)}</td><td>{session.alat_id == null ? '—' : `#${session.alat_id}`}</td>
            <td>{[session.jam_mulai, session.jam_selesai].filter(Boolean).join('–') || '—'}</td>
          </tr>)}</tbody>
        </table></div>}

        {provider && !supportLoading && !supportError && <form className="server-stage3-entry" onSubmit={event => void submitSession(event)} aria-label="Cipta sesi survei">
          <h4><Plus size={15} /> Catat sesi survei</h4>
          <p className="wf-note">Sesi hanya boleh dibuat untuk paket ini menggunakan tim, alat, ruas dan uji coba DISETUJUI yang tersedia daripada server.</p>
          {!teams.length && <p role="status" className="wf-note">Belum ada tim survei server untuk paket ini. Tambah tim melalui Tahap 1 dahulu.</p>}
          {!!teams.length && <div className="wf-fields">
            <label className="wf-field">Tim survei<select required value={teamId} onChange={event => { setTeamId(event.target.value); setApprovedTrialId(''); }} disabled={busy}><option value="">Pilih tim</option>{teams.map(team => <option key={team.tim_id} value={team.tim_id}>#{team.tim_id} · {team.nama_tim} · {team.jenis_survei?.kode ?? `Jenis #${team.jenis_survei_id}`}</option>)}</select></label>
            <label className="wf-field">Tanggal sesi<input type="date" required value={sessionForm.tanggal} onChange={event => updateSession('tanggal', event.target.value)} disabled={busy} /></label>
            <label className="wf-field">Uji coba disetujui<select required value={approvedTrialId} onChange={event => setApprovedTrialId(event.target.value)} disabled={busy || assignmentsLoading || !eligibleTrials.length}><option value="">{assignmentsLoading ? 'Memuat alat…' : 'Pilih uji coba disetujui'}</option>{eligibleTrials.map(trial => {
              const road = roads.find(item => item.ruas_id === trial.ruas_id);
              const tool = assignments.find(item => item.alat_id === trial.alat_id);
              return <option key={trial.uji_coba_id} value={trial.uji_coba_id}>Uji coba #{trial.uji_coba_id} · alat {tool?.alat_survei?.nama_alat ?? `#${trial.alat_id}`} · ruas {road?.nomor_ruas ?? road?.nama_ruas ?? `#${trial.ruas_id}`}</option>;
            })}</select></label>
            <label className="wf-field">Jam mula<input type="time" value={sessionForm.jam_mulai} onChange={event => updateSession('jam_mulai', event.target.value)} disabled={busy} /></label>
            <label className="wf-field">Jam selesai<input type="time" value={sessionForm.jam_selesai} onChange={event => updateSession('jam_selesai', event.target.value)} disabled={busy} /></label>
            <label className="wf-field">Lajur<input maxLength={255} value={sessionForm.lajur} onChange={event => updateSession('lajur', event.target.value)} disabled={busy} /></label>
            <label className="wf-field">Arah<input maxLength={255} value={sessionForm.arah} onChange={event => updateSession('arah', event.target.value)} disabled={busy} /></label>
            <label className="wf-field">Cuaca<input maxLength={255} value={sessionForm.cuaca} onChange={event => updateSession('cuaca', event.target.value)} disabled={busy} /></label>
            <label className="wf-field">Kondisi permukaan<input maxLength={255} value={sessionForm.kondisi_permukaan} onChange={event => updateSession('kondisi_permukaan', event.target.value)} disabled={busy} /></label>
            <label className="wf-field">Panjang tercapai (km)<input type="number" min="0" step="any" value={sessionForm.panjang_tercapai_km} onChange={event => updateSession('panjang_tercapai_km', event.target.value)} disabled={busy} /></label>
            <label className="wf-field">Link video<input type="url" maxLength={2000} value={sessionForm.link_video} onChange={event => updateSession('link_video', event.target.value)} disabled={busy} /></label>
          </div>}
          {assignmentsError && <p role="alert" className="wf-note">Gagal memuat alat tim: {assignmentsError}</p>}
          {!!teams.length && !assignmentsLoading && !assignmentsError && !eligibleTrials.length && <p role="status" className="wf-callout warn">Tiada uji coba DISETUJUI yang sepadan dengan tim dan alat aktif pada tarikh ini. Lengkapkan approval Uji Coba Tahap 2 dan penugasan alat dahulu.</p>}
          <div className="wf-toolbar"><button type="submit" className="wf-button primary" disabled={busy || supportLoading || !selectedTeam || !eligibleTrials.some(trial => String(trial.uji_coba_id) === approvedTrialId) || !!assignmentsError}><Save size={14} /> {busy ? 'Menyimpan dan mengesahkan…' : 'Simpan sesi'}</button></div>
        </form>}
      </div>
    </section>

    {selectedSession && <section className="wf-panel" aria-labelledby="server-stage3-segments-title">
      <div className="wf-panel-head"><h3 id="server-stage3-segments-title">Data segmen · Sesi #{selectedSession.sesi_id}</h3>
        <button type="button" className="wf-button" onClick={() => setSegmentsRevision(value => value + 1)} disabled={segmentsLoading}><RefreshCw size={13} /> {segmentsLoading ? 'Memuat…' : 'Muat semula segmen'}</button>
      </div>
      <div className="wf-body">
        {segmentsLoading && <p role="status">Memuat data segmen…</p>}
        {!segmentsLoading && segmentsError && <div role="alert" className="wf-callout danger">{segmentsError}<div><button type="button" className="wf-button" onClick={() => setSegmentsRevision(value => value + 1)}>Coba lagi</button></div></div>}
        {!segmentsLoading && !segmentsError && segments.length === 0 && <p className="wf-note">Belum ada data segmen untuk sesi ini.</p>}
        {!segmentsLoading && !segmentsError && segments.length > 0 && <div className="wf-table-wrap"><table className="wf-table"><thead><tr>{segmentColumns.map(key => <th key={key}>{label(key)}</th>)}</tr></thead>
          <tbody>{segments.map((segment, index) => <tr key={String(segment.data_id ?? index)}>{segmentColumns.map(key => <td key={key}>{display((segment as Record<string, unknown>)[key])}</td>)}</tr>)}</tbody>
        </table></div>}
        {provider && selectedTeam && selectedSessionTeam?.tim_id === selectedSession.tim_id && <form className="server-stage3-entry" onSubmit={event => void submitSegment(event)} aria-label="Tambah data segmen">
          <h4><Plus size={15} /> Tambah data segmen</h4>
          <p className="wf-note">Jenis survei #{selectedTeam.jenis_survei_id} diambil daripada tim sesi. Isi hanya atribut yang benar-benar tersedia daripada sumber pengukuran.</p>
          <div className="wf-fields">
            <label className="wf-field">STA awal<input type="number" step="any" value={segmentForm.sta_awal} onChange={event => setSegmentForm(current => ({ ...current, sta_awal: event.target.value }))} disabled={busy} /></label>
            <label className="wf-field">STA akhir<input type="number" step="any" value={segmentForm.sta_akhir} onChange={event => setSegmentForm(current => ({ ...current, sta_akhir: event.target.value }))} disabled={busy} /></label>
            <label className="wf-field">Lajur<input maxLength={255} value={segmentForm.lajur} onChange={event => setSegmentForm(current => ({ ...current, lajur: event.target.value }))} disabled={busy} /></label>
            <label className="wf-field">Nilai utama (nilai_utama server)<input type="number" step="any" value={segmentForm.nilai_utama} onChange={event => setSegmentForm(current => ({ ...current, nilai_utama: event.target.value }))} disabled={busy} /></label>
            <label className="wf-field">Latitud<input type="number" step="any" value={segmentForm.lat} onChange={event => setSegmentForm(current => ({ ...current, lat: event.target.value }))} disabled={busy} /></label>
            <label className="wf-field">Longitud<input type="number" step="any" value={segmentForm.lon} onChange={event => setSegmentForm(current => ({ ...current, lon: event.target.value }))} disabled={busy} /></label>
          </div>
          <p className="wf-note">Struktur atribut_detail berbeza mengikut sumber dan belum mempunyai skema input khusus di API; medan itu tidak dipaparkan di sini.</p>
          <div className="wf-toolbar"><button type="submit" className="wf-button primary" disabled={busy || segmentsLoading}><Save size={14} /> {busy ? 'Menyimpan dan mengesahkan…' : 'Simpan data segmen'}</button></div>
        </form>}
        {provider && selectedSessionTeam?.tim_id !== selectedSession.tim_id && <p role="status" className="wf-note">Tim/jenis survei sesi tidak dapat dipastikan daripada data server; input segmen dinyahaktifkan.</p>}
      </div>
    </section>}
  </div>;
}
