import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, ClipboardList, RefreshCw, Send } from 'lucide-react';

import { ApiError, apiRequest } from '../auth/client';
import type { WorkflowRole } from '../workflow/model';
import { RoleWorkSection } from '../workflow/RoleWorkSection';
import { Badge, Panel } from '../workflow/stages/stageSupport';
import { createStage2Measurement, createStage2Section, createStage2Trial, eligibleStage2Equipment, getStage2Criteria, getStage2Equipment, getStage2Workspace, getStage2WorkspaceState, reviewStage2Trial, saveStage2Evaluation, submitStage2Trial, type Stage2Gate, type Stage2PackageCompletion } from './serverStage2Data';

type SurveyType = { jenis_survei_id: number; kode: string; nama: string };
type SurveyTeam = {
  tim_id: number;
  jenis_survei_id: number;
  nama_tim: string;
  jenis_survei?: { kode: string; nama: string };
};
type EquipmentAssignment = { alat_id: number; alat_survei?: { nama_alat?: string } };
type Trial = {
  uji_coba_id: number;
  paket_id: number;
  tim_id: number;
  jenis_survei_id: number;
  alat_id: number;
  ruas_id: number | null;
  tanggal: string;
  panjang_km: number;
  percobaan_ke: number;
  status: string;
  versi: number;
};
type Measurement = {
  pengukuran_id: number;
  ulangan_ke: number;
  kecepatan_kmh: number | null;
  nilai_alat: number;
  beban_kn: number | null;
  rater_personel_id: number | null;
};
type TrialSection = {
  seksi_id: number;
  nama_seksi: string;
  sta_awal: number;
  sta_akhir: number;
  nilai_referensi: number | null;
  kategori_kondisi: string | null;
  pengukuran: Measurement[];
};
type TrialDetail = { uji_coba: Trial; seksi: TrialSection[] };
type TrialCriteria = {
  jenis_survei?: { kode: string; nama: string };
  parameter?: Array<{ kode: string; nama: string; satuan: string | null; nilai_min: number | null; nilai_max: number | null; operator: string; status: string }>;
  lingkup?: { panjang_min_km?: number; jumlah_lokasi_min?: number; jumlah_ulangan?: number; rater_berbeda?: boolean; interval_hari?: number };
  aturan?: { mode?: string; sumber_nilai?: string; status_ambang?: string; boleh_mengunci_pengajuan?: boolean; keputusan_pic_tetap_manual?: boolean; catatan_lokasi_pci?: string | null };
};
type EvaluationItem = { kode: 'IRI_A' | 'IRI_B' | 'IRI_R2' | 'IRI_CV'; nilai: number };
type Evaluation = { hasil?: Array<{ kode: string; nilai: number; satuan?: string; operator?: string; nilai_min?: number | null; nilai_max?: number | null; lulus?: boolean }>; lengkap?: boolean; semua_lulus?: boolean | null; aturan?: { mode?: string; status_ambang?: string; boleh_mengunci_pengajuan?: boolean; keputusan_pic_tetap_manual?: boolean } };
type Submission = { status: string; versi: number; pengajuan?: { diajukan_oleh: number; diajukan_pada: string; snapshot: unknown } | null; review?: { pengguna_id: number; keputusan: string; catatan: string | null; waktu: string } | null; aturan?: { mode?: string; validasi_ambang_otomatis_aktif?: boolean; revisi_membuat_percobaan_baru?: boolean } };

const IRI_PARAMETERS: Array<{ kode: EvaluationItem['kode']; label: string; unit: string }> = [
  { kode: 'IRI_A', label: 'Koefisien A', unit: '' },
  { kode: 'IRI_B', label: 'Koefisien B', unit: 'm/km' },
  { kode: 'IRI_R2', label: 'R²', unit: '' },
  { kode: 'IRI_CV', label: 'CV', unit: '%' },
];

function message(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : 'Data Uji Coba belum dapat diproses.';
}

function numberOrNull(value: string): number | null {
  if (!value.trim()) return null;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error('Nilai angka tidak valid.');
  return number;
}

const today = () => new Date().toISOString().slice(0, 10);

export function ServerStage2Workspace({ packageId, role, onNavigate }: { packageId: string; role: WorkflowRole; onNavigate?: (selection: string) => void }) {
  const provider = role === 'Penyedia Jasa / Ketua Tim';
  const pic = role === 'PIC Balai / Pengguna Jasa';
  const [teams, setTeams] = useState<SurveyTeam[]>([]);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [surveyTypes, setSurveyTypes] = useState<SurveyType[]>([]);
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [roads, setRoads] = useState<Array<{ ruas_id: number; nomor_ruas?: string | null; nama_ruas?: string | null }>>([]);
  const [detail, setDetail] = useState<TrialDetail | null>(null);
  const [criteria, setCriteria] = useState<TrialCriteria | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [stage1Gate, setStage1Gate] = useState<Stage2Gate | null>(null);
  const [packageCompletion, setPackageCompletion] = useState<Stage2PackageCompletion | null>(null);
  const [selectedTrialId, setSelectedTrialId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [roadId, setRoadId] = useState('');
  const [activeSurveyTypeId, setActiveSurveyTypeId] = useState('');
  const [busy, setBusy] = useState(false);
  const [refreshRequired, setRefreshRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [newTrial, setNewTrial] = useState({ tanggal: today(), panjang_km: '', percobaan_ke: '1' });
  const [sectionDraft, setSectionDraft] = useState({ nama_seksi: '', sta_awal: '', sta_akhir: '', nilai_referensi: '', kategori_kondisi: '' });
  const [measurementDraft, setMeasurementDraft] = useState({ ulangan_ke: '1', kecepatan_kmh: '', nilai_alat: '', beban_kn: '', rater_personel_id: '' });
  const [evaluationDraft, setEvaluationDraft] = useState<Record<string, string>>({ IRI_A: '', IRI_B: '', IRI_R2: '', IRI_CV: '' });
  const [reviewNote, setReviewNote] = useState('');

  const selectedTeam = teams.find(item => String(item.tim_id) === teamId);
  const selectedTrial = trials.find(item => String(item.uji_coba_id) === selectedTrialId);
  const scopedSurveyTypes = useMemo(() => {
    const ids = new Set(teams.map(item => item.jenis_survei_id));
    return surveyTypes.filter(item => ids.has(item.jenis_survei_id));
  }, [teams, surveyTypes]);
  const visibleTrials = useMemo(() => trials.filter(item => String(item.jenis_survei_id) === activeSurveyTypeId), [trials, activeSurveyTypeId]);
  const criteriaSurveyId = selectedTrial?.jenis_survei_id ?? selectedTeam?.jenis_survei_id ?? (activeSurveyTypeId ? Number(activeSurveyTypeId) : undefined);
  const eligibleEquipment = useMemo(() => eligibleStage2Equipment(selectedTeam, assignments, newTrial.tanggal), [selectedTeam, assignments, newTrial.tanggal]);

  useEffect(() => {
    setEquipmentId(current => eligibleEquipment.some(item => String(item.alat_id) === current)
      ? current : eligibleEquipment[0] ? String(eligibleEquipment[0].alat_id) : '');
  }, [eligibleEquipment]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getStage2Workspace(packageId, apiRequest, controller.signal).then(result => {
      if (controller.signal.aborted) return;
       setTrials(result.trials); setTeams(result.teams); setSurveyTypes(result.surveyTypes); setRoads(result.roads); setStage1Gate(result.gate); setPackageCompletion(result.completion);
      setTeamId(current => result.teams.some(item => String(item.tim_id) === current) ? current : result.teams[0] ? String(result.teams[0].tim_id) : '');
      setSelectedTrialId(current => result.trials.some(item => String(item.uji_coba_id) === current) ? current : result.trials[0] ? String(result.trials[0].uji_coba_id) : '');
      setActiveSurveyTypeId(current => result.surveyTypes.some(item => String(item.jenis_survei_id) === current && result.teams.some(team => team.jenis_survei_id === item.jenis_survei_id)) ? current : result.trials[0] ? String(result.trials[0].jenis_survei_id) : result.teams[0] ? String(result.teams[0].jenis_survei_id) : '');
      if (!result.trials.length) setRefreshRequired(false);
    }).catch(cause => {
      if (!controller.signal.aborted) setError(message(cause));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [packageId, revision]);

  useEffect(() => {
    const refresh = (event: Event) => {
      const detail = (event as CustomEvent<{ packageId?: string }>).detail;
      if (detail?.packageId === packageId) setRevision(value => value + 1);
    };
    window.addEventListener('jalamutu:package-stage-facts-refresh', refresh);
    return () => window.removeEventListener('jalamutu:package-stage-facts-refresh', refresh);
  }, [packageId]);

  useEffect(() => {
    if (!teamId) { setAssignments([]); setEquipmentId(''); return; }
    const controller = new AbortController();
    getStage2Equipment(packageId, Number(teamId), apiRequest, controller.signal)
      .then(next => {
        if (controller.signal.aborted) return;
        setAssignments(next);
        const filtered = eligibleStage2Equipment(selectedTeam, next, newTrial.tanggal);
        setEquipmentId(current => filtered.some(item => String(item.alat_id) === current) ? current : filtered[0] ? String(filtered[0].alat_id) : '');
      })
      .catch(cause => { if (!controller.signal.aborted) setError(message(cause)); });
    return () => controller.abort();
  }, [packageId, teamId]);

  useEffect(() => {
    if (!selectedTrial) { setDetail(null); setEvaluation(null); setSubmission(null); return; }
    const controller = new AbortController();
    getStage2WorkspaceState(packageId, selectedTrial.uji_coba_id, apiRequest).then(state => {
      if (controller.signal.aborted) return;
      setTrials(state.trials); setDetail(state.detail); setEvaluation(state.evaluation); setSubmission(state.submission);
      setRefreshRequired(false);
      const initial: Record<string, string> = { IRI_A: '', IRI_B: '', IRI_R2: '', IRI_CV: '' };
      for (const item of state.evaluation.hasil ?? []) if (item.kode in initial) initial[item.kode] = String(item.nilai);
      setEvaluationDraft(initial);
    }).catch(cause => { if (!controller.signal.aborted) setError(message(cause)); });
    return () => controller.abort();
  }, [packageId, selectedTrial?.uji_coba_id, revision]);

  useEffect(() => {
    if (!criteriaSurveyId) { setCriteria(null); return; }
    const controller = new AbortController();
    getStage2Criteria(packageId, criteriaSurveyId, apiRequest, controller.signal)
      .then(result => { if (!controller.signal.aborted) setCriteria(result); })
      .catch(cause => { if (!controller.signal.aborted) setError(message(cause)); });
    return () => controller.abort();
  }, [packageId, criteriaSurveyId]);

  const stage2Allowed = stage1Gate?.aktif === true && stage1Gate.stage2_allowed === true &&
    stage1Gate.status === 'DISETUJUI' && stage1Gate.snapshot_sesuai === true;
  const canMutateDraft = provider && stage2Allowed && selectedTrial?.status === 'DRAFT' && !refreshRequired;
  const isIri = (selectedTrial && surveyTypes.find(type => type.jenis_survei_id === selectedTrial.jenis_survei_id)?.kode === 'IRI') ?? false;
  const evaluationRows = useMemo(() => evaluation?.hasil ?? [], [evaluation]);
  function selectSurveyType(typeId: string) {
    setActiveSurveyTypeId(typeId);
    const team = teams.find(item => String(item.jenis_survei_id) === typeId);
    if (team) setTeamId(String(team.tim_id));
    const trial = trials.find(item => String(item.jenis_survei_id) === typeId);
    setSelectedTrialId(trial ? String(trial.uji_coba_id) : '');
  }
  function mutationError(cause: unknown) {
    const text = message(cause);
    setError(text);
    if (text.startsWith('Server menerima')) setRefreshRequired(true);
  }

  async function createTrial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!provider || !stage2Allowed || busy || refreshRequired || !selectedTeam || !equipmentId) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await createStage2Trial(packageId, {
          tim_id: selectedTeam.tim_id,
          jenis_survei_id: selectedTeam.jenis_survei_id,
          alat_id: Number(equipmentId),
          ruas_id: Number(roadId),
          tanggal: newTrial.tanggal,
          panjang_km: Number(newTrial.panjang_km),
          percobaan_ke: Number(newTrial.percobaan_ke),
        }, apiRequest);
      setTrials(result.state.trials); setDetail(result.state.detail); setEvaluation(result.state.evaluation); setSubmission(result.state.submission);
      setRefreshRequired(false);
      setSelectedTrialId(String(result.trialId)); setNotice('Uji Coba DRAFT disahkan melalui bacaan semula server.');
      setNewTrial(current => ({ ...current, percobaan_ke: String(Number(current.percobaan_ke) + 1) }));
      setRevision(value => value + 1);
    } catch (cause) { mutationError(cause); }
    finally { setBusy(false); }
  }

  async function createSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTrial || !canMutateDraft || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await createStage2Section(packageId, selectedTrial.uji_coba_id, {
          nama_seksi: sectionDraft.nama_seksi,
          sta_awal: Number(sectionDraft.sta_awal),
          sta_akhir: Number(sectionDraft.sta_akhir),
          nilai_referensi: numberOrNull(sectionDraft.nilai_referensi),
          kategori_kondisi: sectionDraft.kategori_kondisi.trim() || null,
        }, apiRequest);
      setTrials(result.state.trials); setDetail(result.state.detail); setEvaluation(result.state.evaluation); setSubmission(result.state.submission);
      setRefreshRequired(false);
      setSectionDraft({ nama_seksi: '', sta_awal: '', sta_akhir: '', nilai_referensi: '', kategori_kondisi: '' });
      setNotice('Seksi tersimpan di server.'); setRevision(value => value + 1);
    } catch (cause) { mutationError(cause); }
    finally { setBusy(false); }
  }

  async function createMeasurement(event: FormEvent<HTMLFormElement>, sectionId: number) {
    event.preventDefault();
    if (!selectedTrial || !canMutateDraft || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await createStage2Measurement(packageId, selectedTrial.uji_coba_id, sectionId, {
          ulangan_ke: Number(measurementDraft.ulangan_ke),
          kecepatan_kmh: numberOrNull(measurementDraft.kecepatan_kmh),
          nilai_alat: Number(measurementDraft.nilai_alat),
          beban_kn: numberOrNull(measurementDraft.beban_kn),
          rater_personel_id: measurementDraft.rater_personel_id.trim() ? Number(measurementDraft.rater_personel_id) : null,
        }, apiRequest);
      setTrials(result.state.trials); setDetail(result.state.detail); setEvaluation(result.state.evaluation); setSubmission(result.state.submission);
      setRefreshRequired(false);
      setMeasurementDraft(current => ({ ...current, ulangan_ke: String(Number(current.ulangan_ke) + 1), nilai_alat: '' }));
      setNotice('Pengukuran tersimpan di server.'); setRevision(value => value + 1);
    } catch (cause) { mutationError(cause); }
    finally { setBusy(false); }
  }

  async function saveEvaluation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTrial || !canMutateDraft || !isIri || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const hasil = IRI_PARAMETERS.map(item => ({ kode: item.kode, nilai: Number(evaluationDraft[item.kode]) }));
      const result = await saveStage2Evaluation(packageId, selectedTrial.uji_coba_id, { expected_version: selectedTrial.versi, hasil }, apiRequest);
      setTrials(result.state.trials); setDetail(result.state.detail); setEvaluation(result.state.evaluation); setSubmission(result.state.submission);
      setRefreshRequired(false);
      setNotice('Pratinjau evaluasi IRI tersimpan. Ini tidak menggantikan keputusan PIC.');
      setRevision(value => value + 1);
    } catch (cause) { mutationError(cause); }
    finally { setBusy(false); }
  }

  async function submitTrial() {
    if (!selectedTrial || !canMutateDraft || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await submitStage2Trial(packageId, selectedTrial.uji_coba_id, selectedTrial.versi, apiRequest);
      setTrials(result.state.trials); setDetail(result.state.detail); setEvaluation(result.state.evaluation); setSubmission(result.state.submission);
      setRefreshRequired(false);
      setNotice('Uji Coba diajukan untuk review PIC Balai.'); setRevision(value => value + 1);
    } catch (cause) { mutationError(cause); }
    finally { setBusy(false); }
  }

  async function reviewTrial(decision: 'DISETUJUI' | 'PERLU_REVISI') {
    if (!selectedTrial || !submission || !pic || !stage2Allowed || busy || refreshRequired) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await reviewStage2Trial(packageId, selectedTrial.uji_coba_id, { expected_version: submission.versi, keputusan: decision, catatan: reviewNote }, apiRequest);
      setTrials(result.state.trials); setDetail(result.state.detail); setEvaluation(result.state.evaluation); setSubmission(result.state.submission);
      setRefreshRequired(false);
      setReviewNote(''); setNotice(decision === 'DISETUJUI' ? 'Uji Coba disetujui PIC.' : 'Uji Coba dikembalikan untuk revisi.');
      setRevision(value => value + 1);
      window.dispatchEvent(new CustomEvent('jalamutu:package-stage-facts-refresh', {
        detail: { packageId },
      }));
      if (decision === 'DISETUJUI' && onNavigate) onNavigate('/entry:Survei harian');
    } catch (cause) { mutationError(cause); }
    finally { setBusy(false); }
  }

  return <div className="wf" data-testid="server-stage-2-workspace">
    <header className="wf-head"><div><div className="wf-eyebrow">TAHAP 2</div><h2 className="wf-title">Validasi Produksi Data</h2><p className="wf-subtitle">Pencatatan Uji Coba, pemeriksaan kriteria dan persetujuan mengikuti data serta status dari server.</p></div><Badge tone={selectedTrial?.status === 'DISETUJUI' ? 'good' : selectedTrial?.status === 'PERLU_REVISI' ? 'warn' : 'info'}>{selectedTrial?.status ?? 'Belum ada Uji Coba'}</Badge></header>
    <div className={`wf-callout ${packageCompletion?.state === 'complete' ? 'ok' : 'warn'}`} data-testid="stage2-package-completion">
      <strong>{packageCompletion?.label ?? 'Status Tahap 2 belum tersedia dari server'}</strong>
      {packageCompletion?.state !== 'complete' && <p>Kelulusan dikira backend daripada skop survei rasmi dan keputusan PIC per jenis survei.</p>}
    </div>
    <Panel title="Dokumen Hasil Uji & Persetujuan" icon={ClipboardList}>
      <p className="wf-note">Status dan keputusan di bawah ini bersumber daripada endpoint Tahap 2. Lampiran BA terpisah belum tersedia daripada server.</p>
      {selectedTrial ? <div className="wf-row"><span>Uji Coba #{selectedTrial.uji_coba_id} · {selectedTrial.tanggal} · {selectedTrial.panjang_km} km</span><Badge tone={submission?.status === 'DISETUJUI' ? 'good' : submission?.status === 'DIAJUKAN' ? 'warn' : 'info'}>{submission?.status ?? selectedTrial.status}</Badge></div> : <div className="wf-empty">Belum ada hasil uji untuk ditampilkan.</div>}
    </Panel>
    <Panel title="Jenis Survei yang Diperiksa" icon={CheckCircle2}>
      {scopedSurveyTypes.length ? <div className="calibration-survey-tabs" role="tablist" aria-label="Jenis survei paket">
        {scopedSurveyTypes.map(type => <button type="button" role="tab" aria-selected={activeSurveyTypeId === String(type.jenis_survei_id)} className={`wf-button ${activeSurveyTypeId === String(type.jenis_survei_id) ? 'primary' : ''}`} key={type.jenis_survei_id} onClick={() => selectSurveyType(String(type.jenis_survei_id))}>{type.nama || type.kode}</button>)}
      </div> : <p className="wf-empty">Jenis survei akan muncul setelah tim terdaftar pada Tahap 1.</p>}
    </Panel>
    {loading && <p role="status">Memuat Uji Coba dari server…</p>}
    {error && <div role="alert" className="wf-callout danger"><p>{error}</p><button type="button" className="wf-button" onClick={() => setRevision(value => value + 1)}><RefreshCw size={13} /> Coba lagi</button></div>}
    {notice && <div role="status" className="wf-callout">{notice}</div>}
    {!stage2Allowed && <div className="wf-callout warn" data-testid="stage2-blocked-by-stage1">
      <strong>Tahap 2 terkunci oleh konfirmasi Tahap 1.</strong>
      <p>{stage1Gate?.alasan || 'Hanya status DISETUJUI dari PIC Balai untuk snapshot Stage 1 yang masih sesuai dapat mengizinkan Tahap 2. Gate dinilai server-side; UI tidak menyimpulkan kesiapan.'}</p>
    </div>}

    {!loading && !error && <>
      {onNavigate && stage2Allowed && (selectedTrial?.status === 'DISETUJUI' || submission?.status === 'DISETUJUI' || submission?.review?.keputusan === 'DISETUJUI') && (
        <div className="wf-callout ok" role="status">
          <strong>Uji Coba disetujui server.</strong> Tahap 3A dapat dibuka berdasarkan status review server.
          <button type="button" className="wf-button primary" onClick={() => onNavigate('/entry:Survei harian')}>Lanjut ke Tahap 3A</button>
        </div>
      )}
      <Panel title={`Uji Coba Paket #${packageId}`} icon={ClipboardList} extra={<button type="button" className="wf-button" onClick={() => setRevision(value => value + 1)} disabled={busy}><RefreshCw size={13} /> Muat ulang</button>}>
          <RoleWorkSection primary={provider} title="Formulir dan pemeriksaan Penyedia">
           {provider && <form onSubmit={createTrial}>
            <div className="wf-fields">
              <label className="wf-field">Tim survei<select required value={teamId} onChange={event => { const nextTeam = teams.find(item => String(item.tim_id) === event.target.value); setTeamId(event.target.value); if (nextTeam) setActiveSurveyTypeId(String(nextTeam.jenis_survei_id)); }} disabled={busy}><option value="">Pilih tim</option>{teams.filter(team => !activeSurveyTypeId || String(team.jenis_survei_id) === activeSurveyTypeId).map(team => <option key={team.tim_id} value={team.tim_id}>Tim #{team.tim_id} · {team.nama_tim} · {team.jenis_survei?.kode ?? `Jenis #${team.jenis_survei_id}`}</option>)}</select></label>
              <label className="wf-field">Jenis survei<input readOnly value={selectedTeam?.jenis_survei?.nama ?? selectedTeam?.jenis_survei?.kode ?? (selectedTeam ? `Jenis #${selectedTeam.jenis_survei_id}` : '')} /></label>
              <label className="wf-field">Alat<select required value={equipmentId} onChange={event => setEquipmentId(event.target.value)} disabled={busy || !eligibleEquipment.length}><option value="">Pilih alat</option>{eligibleEquipment.map(item => <option key={item.alat_id} value={item.alat_id}>Alat #{item.alat_id}{item.alat_survei?.nama_alat ? ` · ${item.alat_survei.nama_alat}` : ''}</option>)}</select></label>
              <label className="wf-field">Ruas jalan<select required value={roadId} onChange={event => setRoadId(event.target.value)} disabled={busy || !roads.length}><option value="">Pilih ruas</option>{roads.map(road => <option key={road.ruas_id} value={road.ruas_id}>{road.nomor_ruas ? `${road.nomor_ruas} · ` : ''}{road.nama_ruas || `Ruas #${road.ruas_id}`}</option>)}</select></label>
              <label className="wf-field">Tanggal<input type="date" required value={newTrial.tanggal} onChange={event => setNewTrial(current => ({ ...current, tanggal: event.target.value }))} disabled={busy} /></label>
              <label className="wf-field">Panjang (km)<input type="number" min="0.001" step="any" required value={newTrial.panjang_km} onChange={event => setNewTrial(current => ({ ...current, panjang_km: event.target.value }))} disabled={busy} /></label>
              <label className="wf-field">Nomor percobaan untuk draf baru<input type="number" min="1" step="1" required value={newTrial.percobaan_ke} onChange={event => setNewTrial(current => ({ ...current, percobaan_ke: event.target.value }))} disabled={busy} /></label>
            </div>
            <p className="wf-note">Jenis survei mengikuti jenis tim. Pilihan alat dan ruas dimuat daripada penugasan serta skop paket di server.</p>
            {!teams.length && <p className="wf-callout warn">Daftarkan tim pada Tahap 1 terlebih dahulu.</p>}
            {selectedTeam && !eligibleEquipment.length && <p className="wf-callout warn">Tiada alat untuk jenis survei ini yang sah pada tarikh dipilih.</p>}
            {!roads.length && <p className="wf-callout warn">Tiada ruas tersedia untuk paket ini.</p>}
             <button type="submit" className="wf-button primary" disabled={!stage2Allowed || busy || refreshRequired || !selectedTeam || !eligibleEquipment.some(item => String(item.alat_id) === equipmentId) || !roads.some(item => String(item.ruas_id) === roadId)}>{busy ? 'Menyimpan…' : 'Buat Uji Coba DRAFT'}</button>
          </form>}
          {!provider && <p className="wf-note">Mode baca. Hanya Penyedia Jasa dapat membuat Uji Coba, seksi, pengukuran, evaluasi, atau pengajuan.</p>}
          </RoleWorkSection>
          <div className="package-flow-list" style={{ marginTop: 16 }}>
            {!visibleTrials.length ? <p className="wf-empty">Belum ada Uji Coba tersimpan untuk jenis survei ini.</p> : visibleTrials.map(trial => <button type="button" className="package-flow-row" key={trial.uji_coba_id} onClick={() => setSelectedTrialId(String(trial.uji_coba_id))} aria-pressed={selectedTrialId === String(trial.uji_coba_id)}>
              <div className="package-flow-icon"><ClipboardList size={15} /></div><div className="package-flow-copy"><small>ID Uji Coba #{trial.uji_coba_id} · Versi {trial.versi}</small><strong>Percobaan {trial.percobaan_ke}</strong><span>{trial.status} · {trial.tanggal} · {trial.panjang_km} km · Tim #{trial.tim_id}</span></div><div className="package-flow-status">{selectedTrialId === String(trial.uji_coba_id) ? 'Dipilih' : 'Buka detail'}</div>
            </button>)}
          </div>
      </Panel>

      {selectedTrial && <>
        <div className="production-workspace-columns"><div className="production-column">
        <Panel title="Ruang lingkup dan kriteria server" icon={CheckCircle2} extra={<Badge>{criteria?.jenis_survei?.kode ?? `Jenis #${selectedTrial.jenis_survei_id}`}</Badge>}>
          {criteria?.lingkup ? <div className="package-context-grid">{Object.entries(criteria.lingkup).map(([key, value]) => <div key={key}><small>{key.replaceAll('_', ' ')}</small><strong>{String(value)}</strong></div>)}</div> : <p>Kriteria lingkup belum tersedia dari API.</p>}
          {criteria?.parameter?.length ? <div className="package-flow-list" style={{ marginTop: 12 }}>{criteria.parameter.map(item => <div className="package-flow-row" key={item.kode}><div className="package-flow-copy"><strong>{item.nama} · {item.kode}</strong><span>{item.operator} {item.nilai_min ?? ''}{item.nilai_max === null ? '' : ` – ${item.nilai_max}`} {item.satuan ?? ''} · Ambang {item.status}</span></div></div>)}</div> : <p className="wf-note">Parameter evaluasi otomatis belum tersedia untuk jenis survei ini.</p>}
          <p className="wf-note">{criteria?.aturan?.mode || 'Mode evaluasi ditentukan server'} · Ambang {criteria?.aturan?.status_ambang || 'belum diketahui'} · Persetujuan PIC tetap manual.</p>
          {criteria?.aturan?.catatan_lokasi_pci && <p className="wf-callout">{criteria.aturan.catatan_lokasi_pci}</p>}
        </Panel>

        <Panel title={`Data Hasil Uji · Uji Coba #${selectedTrial.uji_coba_id}`} icon={ClipboardList} extra={<Badge>{selectedTrial.status} · Versi {selectedTrial.versi}</Badge>}>
          {detail?.seksi?.length ? detail.seksi.map(section => <div className="wf-panel" key={section.seksi_id} style={{ marginBottom: 12 }}><div className="wf-panel-head"><h3>{section.nama_seksi} · Seksi #{section.seksi_id}</h3><span>STA {section.sta_awal}–{section.sta_akhir}</span></div><div className="wf-body">
            <p className="wf-note">{section.pengukuran?.length ?? 0} pengukuran tersimpan · Referensi {section.nilai_referensi ?? '—'} · {section.kategori_kondisi || 'Kategori belum diisi'}</p>
            {section.pengukuran?.length ? <div className="wf-table"><table><thead><tr><th>Ulangan</th><th>Nilai alat</th><th>Kecepatan</th><th>Beban</th></tr></thead><tbody>{section.pengukuran.map(reading => <tr key={reading.pengukuran_id}><td>{reading.ulangan_ke}</td><td>{reading.nilai_alat}</td><td>{reading.kecepatan_kmh ?? '—'} km/jam</td><td>{reading.beban_kn ?? '—'} kN</td></tr>)}</tbody></table></div> : <div className="wf-empty">Belum ada pengukuran tersimpan pada seksi ini.</div>}
            {canMutateDraft && <form onSubmit={event => void createMeasurement(event, section.seksi_id)}><div className="wf-fields">
              <label className="wf-field">Ulangan ke<input required type="number" min="1" step="1" value={measurementDraft.ulangan_ke} onChange={event => setMeasurementDraft(current => ({ ...current, ulangan_ke: event.target.value }))} disabled={busy} /></label>
              <label className="wf-field">Nilai alat<input required type="number" step="any" value={measurementDraft.nilai_alat} onChange={event => setMeasurementDraft(current => ({ ...current, nilai_alat: event.target.value }))} disabled={busy} /></label>
              <label className="wf-field">Kecepatan km/jam<input type="number" min="0" step="any" value={measurementDraft.kecepatan_kmh} onChange={event => setMeasurementDraft(current => ({ ...current, kecepatan_kmh: event.target.value }))} disabled={busy} /></label>
              <label className="wf-field">Beban kN<input type="number" min="0" step="any" value={measurementDraft.beban_kn} onChange={event => setMeasurementDraft(current => ({ ...current, beban_kn: event.target.value }))} disabled={busy} /></label>
              <label className="wf-field">ID personel rater (opsional)<input type="number" min="1" step="1" value={measurementDraft.rater_personel_id} onChange={event => setMeasurementDraft(current => ({ ...current, rater_personel_id: event.target.value }))} disabled={busy} /></label>
            </div><button className="wf-button" type="submit" disabled={busy}>Simpan pengukuran</button></form>}
          </div></div>) : <p>Belum ada seksi dalam Uji Coba ini.</p>}
          {canMutateDraft && <form onSubmit={createSection}><h4>Tambah seksi</h4><div className="wf-fields">
            <label className="wf-field">Nama seksi<input required maxLength={255} value={sectionDraft.nama_seksi} onChange={event => setSectionDraft(current => ({ ...current, nama_seksi: event.target.value }))} disabled={busy} /></label>
            <label className="wf-field">STA awal<input required type="number" min="0" step="any" value={sectionDraft.sta_awal} onChange={event => setSectionDraft(current => ({ ...current, sta_awal: event.target.value }))} disabled={busy} /></label>
            <label className="wf-field">STA akhir<input required type="number" min="0" step="any" value={sectionDraft.sta_akhir} onChange={event => setSectionDraft(current => ({ ...current, sta_akhir: event.target.value }))} disabled={busy} /></label>
            <label className="wf-field">Nilai referensi<input type="number" step="any" value={sectionDraft.nilai_referensi} onChange={event => setSectionDraft(current => ({ ...current, nilai_referensi: event.target.value }))} disabled={busy} /></label>
            <label className="wf-field">Kategori kondisi<input maxLength={255} value={sectionDraft.kategori_kondisi} onChange={event => setSectionDraft(current => ({ ...current, kategori_kondisi: event.target.value }))} disabled={busy} /></label>
          </div><button className="wf-button" type="submit" disabled={busy}>Simpan seksi</button></form>}
        </Panel></div><div className="production-column">

        {isIri && <Panel title="Pratinjau evaluasi IRI" icon={CheckCircle2} extra={<Badge tone={evaluation?.semua_lulus === true ? 'good' : evaluation?.lengkap ? 'warn' : 'info'}>{evaluation?.semua_lulus === true ? 'Semua ambang lulus' : evaluation?.lengkap ? 'Ada ambang belum lulus' : 'Belum lengkap'}</Badge>}>
          {evaluationRows.map(row => <div className="wf-row" key={row.kode}><span>{row.kode} · {row.nilai} {row.satuan || ''}</span><span>{row.operator} {row.nilai_min ?? ''}{row.nilai_max === null ? '' : ` – ${row.nilai_max}`} · {row.lulus ? 'Lulus' : 'Belum lulus'}</span></div>)}
          {canMutateDraft && <form onSubmit={saveEvaluation}><p className="wf-note">Masukkan empat nilai IRI untuk dibandingkan dengan ambang DRAFT. Hasil ini tidak mengunci pengajuan dan bukan keputusan PIC.</p><div className="wf-fields">{IRI_PARAMETERS.map(item => <label className="wf-field" key={item.kode}>{item.label}{item.unit && ` (${item.unit})`}<input required type="number" step="any" value={evaluationDraft[item.kode] ?? ''} onChange={event => setEvaluationDraft(current => ({ ...current, [item.kode]: event.target.value }))} disabled={busy} /></label>)}</div><button type="submit" className="wf-button" disabled={busy}>Simpan pratinjau evaluasi</button></form>}
        </Panel>}

        <Panel title="Pengajuan dan persetujuan" icon={Send} extra={<Badge tone={submission?.status === 'DISETUJUI' ? 'good' : submission?.status === 'DIAJUKAN' ? 'warn' : 'info'}>{submission?.status ?? selectedTrial.status}</Badge>}>
          {submission?.pengajuan && <p>Pengajuan dikirim {submission.pengajuan.diajukan_pada}; versi {submission.versi}.</p>}
          {submission?.review && <div className="wf-callout">Keputusan PIC: <strong>{submission.review.keputusan}</strong><div>{submission.review.catatan || 'Tidak ada catatan.'}</div></div>}
           {provider && selectedTrial.status === 'DRAFT' && <button type="button" className="wf-button primary" onClick={() => void submitTrial()} disabled={!stage2Allowed || busy || refreshRequired || !detail?.seksi.some(section => section.pengukuran?.length)}><Send size={13} /> Ajukan Uji Coba</button>}
           {provider && selectedTrial.status === 'DRAFT' && !detail?.seksi.some(section => section.pengukuran?.length) && <p className="wf-note">Simpan sekurang-kurangnya satu seksi dan satu pengukuran sebelum mengajukan.</p>}
           {pic && submission?.status === 'DIAJUKAN' && <><label className="wf-field">Catatan PIC<textarea maxLength={2000} value={reviewNote} onChange={event => setReviewNote(event.target.value)} disabled={!stage2Allowed || busy || refreshRequired} /></label><div className="wf-toolbar"><button type="button" className="wf-button primary" onClick={() => void reviewTrial('DISETUJUI')} disabled={!stage2Allowed || busy || refreshRequired}>Setujui</button><button type="button" className="wf-button" onClick={() => void reviewTrial('PERLU_REVISI')} disabled={!stage2Allowed || busy || refreshRequired || !reviewNote.trim()}>Minta revisi</button></div></>}
          <p className="wf-note">Mode review dan status mengikuti API. Persetujuan manual PIC; revisi memerlukan percobaan baru.</p>
        </Panel></div></div>
      </>}
    </>}
  </div>;
}
