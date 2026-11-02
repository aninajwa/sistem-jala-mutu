import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, ClipboardList, RefreshCw, Send } from 'lucide-react';

import { ApiError, apiRequest } from '../auth/client';
import type { WorkflowRole } from '../workflow/model';

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
type Evaluation = { hasil?: Array<{ kode: string; nilai: number; satuan?: string; operator?: string; nilai_min?: number | null; nilai_max?: number | null; lulus?: boolean }>; lengkap?: boolean; semua_lulus?: boolean; aturan?: { mode?: string; status_ambang?: string; boleh_mengunci_pengajuan?: boolean; keputusan_pic_tetap_manual?: boolean } };
type Submission = { status: string; versi: number; pengajuan?: { diajukan_oleh: number; diajukan_pada: string; snapshot: unknown } | null; review?: { pengguna_id: number; keputusan: string; catatan: string | null; waktu: string } | null; aturan?: { mode?: string; validasi_ambang_otomatis_aktif?: boolean; revisi_membuat_percobaan_baru?: boolean } };

const IRI_PARAMETERS: Array<{ kode: EvaluationItem['kode']; label: string; unit: string }> = [
  { kode: 'IRI_A', label: 'Koefisien A', unit: '' },
  { kode: 'IRI_B', label: 'Koefisien B', unit: 'm/km' },
  { kode: 'IRI_R2', label: 'R²', unit: '' },
  { kode: 'IRI_CV', label: 'CV', unit: '%' },
];

function rows<T>(value: unknown, label: string): T[] {
  if (!Array.isArray(value)) throw new Error(`Respons ${label} tidak sesuai kontrak.`);
  return value as T[];
}

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

export function ServerStage2Workspace({ packageId, role }: { packageId: string; role: WorkflowRole }) {
  const provider = role === 'Penyedia Jasa / Ketua Tim';
  const pic = role === 'PIC Balai / Pengguna Jasa';
  const [teams, setTeams] = useState<SurveyTeam[]>([]);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [surveyTypes, setSurveyTypes] = useState<SurveyType[]>([]);
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [detail, setDetail] = useState<TrialDetail | null>(null);
  const [criteria, setCriteria] = useState<TrialCriteria | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [selectedTrialId, setSelectedTrialId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [equipmentId, setEquipmentId] = useState('');
  const [busy, setBusy] = useState(false);
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
  const criteriaSurveyId = selectedTrial?.jenis_survei_id ?? selectedTeam?.jenis_survei_id;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    Promise.all([
      apiRequest<{ data: unknown }>(`/paket/${encodeURIComponent(packageId)}/uji-coba`, { signal: controller.signal }),
      apiRequest<{ data: unknown }>(`/paket/${encodeURIComponent(packageId)}/tim`, { signal: controller.signal }),
      apiRequest<{ data: unknown }>('/jenis-survei', { signal: controller.signal }),
    ]).then(([trialResult, teamResult, surveyResult]) => {
      if (controller.signal.aborted) return;
      const nextTrials = rows<Trial>(trialResult.data, 'daftar Uji Coba');
      const nextTeams = rows<SurveyTeam>(teamResult.data, 'tim survei');
      setTrials(nextTrials);
      setTeams(nextTeams);
      setSurveyTypes(rows<SurveyType>(surveyResult.data, 'jenis survei'));
      setTeamId(current => nextTeams.some(item => String(item.tim_id) === current)
        ? current : nextTeams[0] ? String(nextTeams[0].tim_id) : '');
      setSelectedTrialId(current => nextTrials.some(item => String(item.uji_coba_id) === current)
        ? current : nextTrials[0] ? String(nextTrials[0].uji_coba_id) : '');
    }).catch(cause => {
      if (!controller.signal.aborted) setError(message(cause));
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [packageId, revision]);

  useEffect(() => {
    if (!teamId) { setAssignments([]); setEquipmentId(''); return; }
    const controller = new AbortController();
    apiRequest<{ data: unknown }>(`/paket/${encodeURIComponent(packageId)}/tim/${encodeURIComponent(teamId)}/alat`, { signal: controller.signal })
      .then(result => {
        if (controller.signal.aborted) return;
        const next = rows<EquipmentAssignment>(result.data, 'alat tim');
        setAssignments(next);
        setEquipmentId(current => next.some(item => String(item.alat_id) === current) ? current : next[0] ? String(next[0].alat_id) : '');
      })
      .catch(cause => { if (!controller.signal.aborted) setError(message(cause)); });
    return () => controller.abort();
  }, [packageId, teamId]);

  useEffect(() => {
    if (!selectedTrial) { setDetail(null); setEvaluation(null); setSubmission(null); return; }
    const controller = new AbortController();
    const base = `/paket/${encodeURIComponent(packageId)}/uji-coba/${selectedTrial.uji_coba_id}`;
    Promise.all([
      apiRequest<{ data: TrialDetail }>(base, { signal: controller.signal }),
      apiRequest<{ data: Evaluation }>(`${base}/evaluasi`, { signal: controller.signal }),
      apiRequest<{ data: Submission }>(`${base}/pengajuan`, { signal: controller.signal }),
    ]).then(([detailResult, evaluationResult, submissionResult]) => {
      if (controller.signal.aborted) return;
      setDetail(detailResult.data);
      setEvaluation(evaluationResult.data);
      setSubmission(submissionResult.data);
      const initial: Record<string, string> = { IRI_A: '', IRI_B: '', IRI_R2: '', IRI_CV: '' };
      for (const item of evaluationResult.data.hasil ?? []) if (item.kode in initial) initial[item.kode] = String(item.nilai);
      setEvaluationDraft(initial);
    }).catch(cause => { if (!controller.signal.aborted) setError(message(cause)); });
    return () => controller.abort();
  }, [packageId, selectedTrial?.uji_coba_id, revision]);

  useEffect(() => {
    if (!criteriaSurveyId) { setCriteria(null); return; }
    const controller = new AbortController();
    apiRequest<{ data: TrialCriteria }>(`/paket/${encodeURIComponent(packageId)}/uji-coba-kriteria/${criteriaSurveyId}`, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setCriteria(result.data); })
      .catch(cause => { if (!controller.signal.aborted) setError(message(cause)); });
    return () => controller.abort();
  }, [packageId, criteriaSurveyId]);

  const canMutateDraft = provider && selectedTrial?.status === 'DRAFT';
  const isIri = (selectedTrial && surveyTypes.find(type => type.jenis_survei_id === selectedTrial.jenis_survei_id)?.kode === 'IRI') ?? false;
  const evaluationRows = useMemo(() => evaluation?.hasil ?? [], [evaluation]);

  async function createTrial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!provider || busy || !selectedTeam || !equipmentId) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const created = await apiRequest<{ data: Trial }>(`/paket/${encodeURIComponent(packageId)}/uji-coba`, {
        method: 'POST',
        body: JSON.stringify({
          tim_id: selectedTeam.tim_id,
          jenis_survei_id: selectedTeam.jenis_survei_id,
          alat_id: Number(equipmentId),
          ruas_id: null,
          tanggal: newTrial.tanggal,
          panjang_km: Number(newTrial.panjang_km),
          percobaan_ke: Number(newTrial.percobaan_ke),
        }),
      });
      setNotice('Uji Coba tersimpan di server sebagai DRAFT.');
      if (created.data?.uji_coba_id) setSelectedTrialId(String(created.data.uji_coba_id));
      setNewTrial(current => ({ ...current, percobaan_ke: String(Number(current.percobaan_ke) + 1) }));
      setRevision(value => value + 1);
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  async function createSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTrial || !canMutateDraft || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await apiRequest(`/paket/${encodeURIComponent(packageId)}/uji-coba/${selectedTrial.uji_coba_id}/seksi`, {
        method: 'POST',
        body: JSON.stringify({
          nama_seksi: sectionDraft.nama_seksi,
          sta_awal: Number(sectionDraft.sta_awal),
          sta_akhir: Number(sectionDraft.sta_akhir),
          nilai_referensi: numberOrNull(sectionDraft.nilai_referensi),
          kategori_kondisi: sectionDraft.kategori_kondisi.trim() || null,
        }),
      });
      setSectionDraft({ nama_seksi: '', sta_awal: '', sta_akhir: '', nilai_referensi: '', kategori_kondisi: '' });
      setNotice('Seksi tersimpan di server.'); setRevision(value => value + 1);
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  async function createMeasurement(event: FormEvent<HTMLFormElement>, sectionId: number) {
    event.preventDefault();
    if (!selectedTrial || !canMutateDraft || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await apiRequest(`/paket/${encodeURIComponent(packageId)}/uji-coba/${selectedTrial.uji_coba_id}/seksi/${sectionId}/pengukuran`, {
        method: 'POST',
        body: JSON.stringify({
          ulangan_ke: Number(measurementDraft.ulangan_ke),
          kecepatan_kmh: numberOrNull(measurementDraft.kecepatan_kmh),
          nilai_alat: Number(measurementDraft.nilai_alat),
          beban_kn: numberOrNull(measurementDraft.beban_kn),
          rater_personel_id: measurementDraft.rater_personel_id.trim() ? Number(measurementDraft.rater_personel_id) : null,
        }),
      });
      setMeasurementDraft(current => ({ ...current, ulangan_ke: String(Number(current.ulangan_ke) + 1), nilai_alat: '' }));
      setNotice('Pengukuran tersimpan di server.'); setRevision(value => value + 1);
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  async function saveEvaluation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTrial || !canMutateDraft || !isIri || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const hasil = IRI_PARAMETERS.map(item => ({ kode: item.kode, nilai: Number(evaluationDraft[item.kode]) }));
      await apiRequest(`/paket/${encodeURIComponent(packageId)}/uji-coba/${selectedTrial.uji_coba_id}/evaluasi`, {
        method: 'POST', body: JSON.stringify({ expected_version: selectedTrial.versi, hasil }),
      });
      setNotice('Pratinjau evaluasi IRI tersimpan. Ini tidak menggantikan keputusan PIC.');
      setRevision(value => value + 1);
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  async function submitTrial() {
    if (!selectedTrial || !canMutateDraft || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await apiRequest(`/paket/${encodeURIComponent(packageId)}/uji-coba/${selectedTrial.uji_coba_id}/pengajuan`, {
        method: 'POST', body: JSON.stringify({ expected_version: selectedTrial.versi }),
      });
      setNotice('Uji Coba diajukan untuk review PIC Balai.'); setRevision(value => value + 1);
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  async function reviewTrial(decision: 'DISETUJUI' | 'PERLU_REVISI') {
    if (!selectedTrial || !submission || !pic || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      await apiRequest(`/paket/${encodeURIComponent(packageId)}/uji-coba/${selectedTrial.uji_coba_id}/pengajuan/review`, {
        method: 'POST', body: JSON.stringify({ expected_version: submission.versi, keputusan: decision, catatan: reviewNote }),
      });
      setReviewNote(''); setNotice(decision === 'DISETUJUI' ? 'Uji Coba disetujui PIC.' : 'Uji Coba dikembalikan untuk revisi.');
      setRevision(value => value + 1);
    } catch (cause) { setError(message(cause)); }
    finally { setBusy(false); }
  }

  return <div className="wf" data-testid="server-stage-2-workspace">
    <div className="wf-title"><h2>Tahap 2 · Validasi Produksi Data</h2><p>Uji Coba dibaca dan disimpan melalui API paket. Data pada halaman ini berasal dari server, bukan draft lokal.</p></div>
    {loading && <p role="status">Memuat Uji Coba dari server…</p>}
    {error && <div role="alert" className="wf-callout danger"><p>{error}</p><button type="button" className="wf-button" onClick={() => setRevision(value => value + 1)}><RefreshCw size={13} /> Coba lagi</button></div>}
    {notice && <div role="status" className="wf-callout">{notice}</div>}

    {!loading && !error && <>
      <section className="wf-panel">
        <div className="wf-panel-head"><h3><ClipboardList size={14} /> Uji Coba paket #{packageId}</h3><button type="button" className="wf-button" onClick={() => setRevision(value => value + 1)} disabled={busy}><RefreshCw size={13} /> Muat ulang</button></div>
        <div className="wf-body">
          {provider && <form onSubmit={createTrial}>
            <div className="wf-fields">
              <label className="wf-field">Tim survei<select required value={teamId} onChange={event => setTeamId(event.target.value)} disabled={busy}><option value="">Pilih tim</option>{teams.map(team => <option key={team.tim_id} value={team.tim_id}>Tim #{team.tim_id} · {team.nama_tim} · {team.jenis_survei?.kode ?? `Jenis #${team.jenis_survei_id}`}</option>)}</select></label>
              <label className="wf-field">Alat<select required value={equipmentId} onChange={event => setEquipmentId(event.target.value)} disabled={busy || !assignments.length}><option value="">Pilih alat</option>{assignments.map(item => <option key={item.alat_id} value={item.alat_id}>Alat #{item.alat_id}{item.alat_survei?.nama_alat ? ` · ${item.alat_survei.nama_alat}` : ''}</option>)}</select></label>
              <label className="wf-field">Tanggal<input type="date" required value={newTrial.tanggal} onChange={event => setNewTrial(current => ({ ...current, tanggal: event.target.value }))} disabled={busy} /></label>
              <label className="wf-field">Panjang (km)<input type="number" min="0.001" step="any" required value={newTrial.panjang_km} onChange={event => setNewTrial(current => ({ ...current, panjang_km: event.target.value }))} disabled={busy} /></label>
              <label className="wf-field">Nomor percobaan<input type="number" min="1" step="1" required value={newTrial.percobaan_ke} onChange={event => setNewTrial(current => ({ ...current, percobaan_ke: event.target.value }))} disabled={busy} /></label>
            </div>
            <p className="wf-note">Jenis survei mengikuti jenis tim. Ruas dibiarkan kosong karena backend mengizinkannya untuk DRAFT; tidak ada pilihan ruas yang disediakan kontrak halaman ini.</p>
            {!teams.length && <p className="wf-callout warn">Daftarkan tim pada Tahap 1 terlebih dahulu.</p>}
            {selectedTeam && !assignments.length && <p className="wf-callout warn">Tim ini belum mempunyai alat yang ditugaskan.</p>}
            <button type="submit" className="wf-button primary" disabled={busy || !selectedTeam || !equipmentId}>{busy ? 'Menyimpan…' : 'Buat Uji Coba DRAFT'}</button>
          </form>}
          {!provider && <p className="wf-note">Mode baca. Hanya Penyedia Jasa dapat membuat Uji Coba, seksi, pengukuran, evaluasi, atau pengajuan.</p>}
          <div className="package-flow-list" style={{ marginTop: 16 }}>
            {!trials.length ? <p>Belum ada Uji Coba tersimpan untuk paket ini.</p> : trials.map(trial => <button type="button" className="package-flow-row" key={trial.uji_coba_id} onClick={() => setSelectedTrialId(String(trial.uji_coba_id))} aria-pressed={selectedTrialId === String(trial.uji_coba_id)}>
              <div className="package-flow-icon"><ClipboardList size={15} /></div><div className="package-flow-copy"><small>Uji Coba #{trial.uji_coba_id} · Percobaan {trial.percobaan_ke} · Versi {trial.versi}</small><strong>{trial.status}</strong><span>{trial.tanggal} · {trial.panjang_km} km · Tim #{trial.tim_id}</span></div><div className="package-flow-status">{selectedTrialId === String(trial.uji_coba_id) ? 'Dipilih' : 'Buka detail'}</div>
            </button>)}
          </div>
        </div>
      </section>

      {selectedTrial && <>
        <section className="wf-panel"><div className="wf-panel-head"><h3>Ruang lingkup dan kriteria server</h3><span>{criteria?.jenis_survei?.kode ?? `Jenis survei #${selectedTrial.jenis_survei_id}`}</span></div><div className="wf-body">
          {criteria?.lingkup ? <div className="package-context-grid">{Object.entries(criteria.lingkup).map(([key, value]) => <div key={key}><small>{key.replaceAll('_', ' ')}</small><strong>{String(value)}</strong></div>)}</div> : <p>Kriteria lingkup belum tersedia dari API.</p>}
          {criteria?.parameter?.length ? <div className="package-flow-list" style={{ marginTop: 12 }}>{criteria.parameter.map(item => <div className="package-flow-row" key={item.kode}><div className="package-flow-copy"><strong>{item.nama} · {item.kode}</strong><span>{item.operator} {item.nilai_min ?? ''}{item.nilai_max === null ? '' : ` – ${item.nilai_max}`} {item.satuan ?? ''} · Ambang {item.status}</span></div></div>)}</div> : <p className="wf-note">Parameter evaluasi otomatis belum tersedia untuk jenis survei ini.</p>}
          <p className="wf-note">{criteria?.aturan?.mode || 'Mode evaluasi ditentukan server'} · Ambang {criteria?.aturan?.status_ambang || 'belum diketahui'} · Persetujuan PIC tetap manual.</p>
          {criteria?.aturan?.catatan_lokasi_pci && <p className="wf-callout">{criteria.aturan.catatan_lokasi_pci}</p>}
        </div></section>

        <section className="wf-panel"><div className="wf-panel-head"><h3><CheckCircle2 size={14} /> Seksi dan pengukuran · Uji Coba #{selectedTrial.uji_coba_id}</h3><span>{selectedTrial.status} · Versi {selectedTrial.versi}</span></div><div className="wf-body">
          {detail?.seksi?.length ? detail.seksi.map(section => <div className="wf-panel" key={section.seksi_id} style={{ marginBottom: 12 }}><div className="wf-panel-head"><h3>{section.nama_seksi} · Seksi #{section.seksi_id}</h3><span>STA {section.sta_awal}–{section.sta_akhir}</span></div><div className="wf-body">
            <p className="wf-note">{section.pengukuran?.length ?? 0} pengukuran tersimpan · Referensi {section.nilai_referensi ?? '—'} · {section.kategori_kondisi || 'Kategori belum diisi'}</p>
            {section.pengukuran?.map(reading => <div className="wf-row" key={reading.pengukuran_id}><span>Ulangan {reading.ulangan_ke} · nilai {reading.nilai_alat}</span><span>{reading.kecepatan_kmh ?? '—'} km/jam · beban {reading.beban_kn ?? '—'} kN</span></div>)}
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
        </div></section>

        {isIri && <section className="wf-panel"><div className="wf-panel-head"><h3>Pratinjau evaluasi IRI</h3><span>{evaluation?.semua_lulus === true ? 'Semua ambang lulus' : evaluation?.lengkap ? 'Ada ambang belum lulus' : 'Belum lengkap'}</span></div><div className="wf-body">
          {evaluationRows.map(row => <div className="wf-row" key={row.kode}><span>{row.kode} · {row.nilai} {row.satuan || ''}</span><span>{row.operator} {row.nilai_min ?? ''}{row.nilai_max === null ? '' : ` – ${row.nilai_max}`} · {row.lulus ? 'Lulus' : 'Belum lulus'}</span></div>)}
          {canMutateDraft && <form onSubmit={saveEvaluation}><p className="wf-note">Masukkan empat nilai IRI untuk dibandingkan dengan ambang DRAFT. Hasil ini tidak mengunci pengajuan dan bukan keputusan PIC.</p><div className="wf-fields">{IRI_PARAMETERS.map(item => <label className="wf-field" key={item.kode}>{item.label}{item.unit && ` (${item.unit})`}<input required type="number" step="any" value={evaluationDraft[item.kode] ?? ''} onChange={event => setEvaluationDraft(current => ({ ...current, [item.kode]: event.target.value }))} disabled={busy} /></label>)}</div><button type="submit" className="wf-button" disabled={busy}>Simpan pratinjau evaluasi</button></form>}
        </div></section>}

        <section className="wf-panel"><div className="wf-panel-head"><h3><Send size={14} /> Pengajuan dan review</h3><span>{submission?.status ?? selectedTrial.status}</span></div><div className="wf-body">
          {submission?.pengajuan && <p>Pengajuan dikirim {submission.pengajuan.diajukan_pada}; versi {submission.versi}.</p>}
          {submission?.review && <div className="wf-callout">Keputusan PIC: <strong>{submission.review.keputusan}</strong><div>{submission.review.catatan || 'Tidak ada catatan.'}</div></div>}
          {provider && selectedTrial.status === 'DRAFT' && <button type="button" className="wf-button primary" onClick={() => void submitTrial()} disabled={busy}><Send size={13} /> Ajukan Uji Coba</button>}
          {pic && submission?.status === 'DIAJUKAN' && <><label className="wf-field">Catatan PIC<textarea maxLength={2000} value={reviewNote} onChange={event => setReviewNote(event.target.value)} disabled={busy} /></label><div className="wf-toolbar"><button type="button" className="wf-button primary" onClick={() => void reviewTrial('DISETUJUI')} disabled={busy}>Setujui</button><button type="button" className="wf-button" onClick={() => void reviewTrial('PERLU_REVISI')} disabled={busy || !reviewNote.trim()}>Minta revisi</button></div></>}
          <p className="wf-note">Mode review dan status mengikuti API. Persetujuan manual PIC; revisi memerlukan percobaan baru.</p>
        </div></section>
      </>}
    </>}
  </div>;
}
