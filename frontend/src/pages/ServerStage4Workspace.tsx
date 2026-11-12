import { useEffect, useState, type FormEvent } from 'react';
import { RefreshCw, Save } from 'lucide-react';
import { apiRequest } from '../auth/client';
import type { WorkflowRole } from '../workflow/model';
import { getSurveySegments, getSurveySessions, type SurveySegment, type SurveySession } from './serverStage3Data';
import { getStage4LrsCapabilities, getStage4LrsRows, getStage4Roads, getStage4WorkflowCapabilities, getStage4WorkflowStatus, mutateStage4Workflow, saveStage4LrsAndConfirm, stage4LrsErrorMessage, type Stage4LrsCapabilities, type Stage4LrsRow, type Stage4Road, type Stage4WorkflowCapabilities, type Stage4WorkflowStatus } from './serverStage4LrsData';
import { assessStage4Kak2026 } from './stage4KakAssessment';

function value(item: unknown) {
  if (item === null || item === undefined || item === '') return 'Belum tercatat';
  return typeof item === 'object' ? JSON.stringify(item) : String(item);
}

export function ServerStage4Workspace({ packageId, role }: { packageId: string; role: WorkflowRole }) {
  const [sessions, setSessions] = useState<SurveySession[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [segments, setSegments] = useState<SurveySegment[]>([]);
  const [roads, setRoads] = useState<Stage4Road[]>([]);
  const [capabilities, setCapabilities] = useState<Stage4LrsCapabilities | null>(null);
  const [validations, setValidations] = useState<Stage4LrsRow[]>([]);
  const [selectedRoad, setSelectedRoad] = useState<number | null>(null);
  const [lrsLoading, setLrsLoading] = useState(false);
  const [lrsError, setLrsError] = useState('');
  const [lrsRevision, setLrsRevision] = useState(0);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [workflowCapabilities, setWorkflowCapabilities] = useState<Stage4WorkflowCapabilities | null>(null);
  const [workflowStatus, setWorkflowStatus] = useState<Stage4WorkflowStatus | null>(null);
  const [workflowError, setWorkflowError] = useState('');
  const [workflowBusy, setWorkflowBusy] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [lrsDraft, setLrsDraft] = useState({ panjang_lapangan_m: '', panjang_acuan_m: '', jumlah_error_topologi: '', format_sesuai_glossary: '', sta_konsisten_iri_pci_ldt: '' });
  const [loading, setLoading] = useState(true);
  const [segmentLoading, setSegmentLoading] = useState(false);
  const [error, setError] = useState('');
  const [segmentError, setSegmentError] = useState('');
  const [revision, setRevision] = useState(0);
  const [segmentRevision, setSegmentRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    Promise.all([getSurveySessions(packageId, apiRequest, controller.signal), getStage4Roads(packageId, apiRequest, controller.signal)]).then(([rows, roadRows]) => {
      if (controller.signal.aborted) return;
      setSessions(rows);
      setRoads(roadRows);
      setSelectedRoad(current => current !== null && roadRows.some(row => row.ruas_id === current) ? current : roadRows[0]?.ruas_id ?? null);
      setSelected(current => current !== null && rows.some(row => row.sesi_id === current) ? current : rows[0]?.sesi_id ?? null);
    }).catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'Sesi survei tidak dapat dimuat.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [packageId, revision]);

  useEffect(() => {
    const controller = new AbortController();
    setCapabilities(null);
    getStage4LrsCapabilities(packageId, apiRequest, controller.signal).then(value => {
      if (!controller.signal.aborted) setCapabilities(value);
    }).catch(reason => { if (!controller.signal.aborted) setLrsError(stage4LrsErrorMessage(reason)); });
    return () => controller.abort();
  }, [packageId]);

  useEffect(() => {
    const controller = new AbortController();
    setWorkflowCapabilities(null); setWorkflowStatus(null); setWorkflowError('');
    Promise.all([
      getStage4WorkflowCapabilities(packageId, apiRequest, controller.signal),
      getStage4WorkflowStatus(packageId, apiRequest, controller.signal),
    ]).then(([caps, status]) => {
      if (controller.signal.aborted) return;
      setWorkflowCapabilities(caps); setWorkflowStatus(status);
    }).catch(reason => { if (!controller.signal.aborted) setWorkflowError(stage4LrsErrorMessage(reason)); });
    return () => controller.abort();
  }, [packageId, lrsRevision]);

  useEffect(() => {
    if (!capabilities?.read) { setValidations([]); setLrsLoading(false); return; }
    const controller = new AbortController();
    setLrsLoading(true); setLrsError('');
    getStage4LrsRows(packageId, apiRequest, controller.signal).then(rows => {
      if (controller.signal.aborted) return;
      setValidations(rows);
      setSelectedRoad(current => current !== null && roads.some(road => road.ruas_id === current)
        ? current : rows[0]?.ruas_id ?? roads[0]?.ruas_id ?? null);
    }).catch(reason => { if (!controller.signal.aborted) setLrsError(stage4LrsErrorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLrsLoading(false); });
    return () => controller.abort();
  }, [packageId, capabilities?.read, lrsRevision, roads]);

  useEffect(() => {
    if (selected === null) { setSegments([]); setSegmentError(''); setSegmentLoading(false); return; }
    const controller = new AbortController();
    setSegmentLoading(true); setSegmentError(''); setSegments([]);
    getSurveySegments(packageId, selected, apiRequest, controller.signal).then(rows => {
      if (!controller.signal.aborted) setSegments(rows);
    }).catch(reason => { if (!controller.signal.aborted) setSegmentError(reason instanceof Error ? reason.message : 'Data segmen tidak dapat dimuat.'); })
      .finally(() => { if (!controller.signal.aborted) setSegmentLoading(false); });
    return () => controller.abort();
  }, [packageId, selected, segmentRevision]);

  const session = sessions.find(row => row.sesi_id === selected);
  const currentValidation = validations.find(row => row.ruas_id === selectedRoad) ?? null;
  const technicalAssessment = currentValidation ? assessStage4Kak2026(currentValidation) : null;

  useEffect(() => {
    if (!selectedRoad) return;
    const row = validations.find(value => value.ruas_id === selectedRoad);
    setLrsDraft(row ? {
      panjang_lapangan_m: row.panjang_lapangan_m == null ? '' : String(row.panjang_lapangan_m),
      panjang_acuan_m: row.panjang_acuan_m == null ? '' : String(row.panjang_acuan_m),
      jumlah_error_topologi: row.jumlah_error_topologi == null ? '' : String(row.jumlah_error_topologi),
      format_sesuai_glossary: row.format_sesuai_glossary == null ? '' : String(row.format_sesuai_glossary),
      sta_konsisten_iri_pci_ldt: row.sta_konsisten_iri_pci_ldt == null ? '' : String(row.sta_konsisten_iri_pci_ldt),
    } : { panjang_lapangan_m: '', panjang_acuan_m: '', jumlah_error_topologi: '', format_sesuai_glossary: '', sta_konsisten_iri_pci_ldt: '' });
  }, [selectedRoad, validations]);

  async function saveLrs(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!capabilities?.write || role !== 'Penyedia Jasa / Ketua Tim' || selectedRoad === null || saveBusy) return;
    setSaveError(''); setSaveMessage('');
    const fieldLength = Number(lrsDraft.panjang_lapangan_m);
    const referenceLength = Number(lrsDraft.panjang_acuan_m);
    const topology = Number(lrsDraft.jumlah_error_topologi);
    if (![fieldLength, referenceLength, topology].every(Number.isFinite) || fieldLength < 0 || referenceLength < 0 || !Number.isSafeInteger(topology) || topology < 0 ||
      !['true','false'].includes(lrsDraft.format_sesuai_glossary) || !['true','false'].includes(lrsDraft.sta_konsisten_iri_pci_ldt)) {
      setSaveError('Isi panjang dan jumlah error dengan angka valid serta pilih Ya/Tidak untuk kedua pemeriksaan.'); return;
    }
    setSaveBusy(true);
    try {
      const result = await saveStage4LrsAndConfirm(packageId, selectedRoad, currentValidation?.versi ?? 0, {
        panjang_lapangan_m: fieldLength, panjang_acuan_m: referenceLength, jumlah_error_topologi: topology,
        format_sesuai_glossary: lrsDraft.format_sesuai_glossary === 'true',
        sta_konsisten_iri_pci_ldt: lrsDraft.sta_konsisten_iri_pci_ldt === 'true',
      }, apiRequest);
      setValidations(result.rows);
      setSaveMessage(`Validasi LRS tersimpan dan dibaca ulang dari server (versi ${result.row.versi}).`);
    } catch (reason) { setSaveError(stage4LrsErrorMessage(reason)); }
    finally { setSaveBusy(false); }
  }
  async function runWorkflow(action: 'submit' | 'review', decision?: 'PERLU_REVISI' | 'DISETUJUI') {
    if (!workflowStatus || workflowBusy) return;
    setWorkflowBusy(true); setWorkflowError('');
    try {
      await mutateStage4Workflow(packageId, workflowStatus.workflow_version, apiRequest, action, decision, reviewNote);
      setLrsRevision(value => value + 1);
    } catch (reason) { setWorkflowError(stage4LrsErrorMessage(reason)); }
    finally { setWorkflowBusy(false); }
  }
  return <section className="wf-panel" data-testid="server-stage4-workspace" aria-label="Persiapan data Tahap 4">
    <div className="wf-panel-head"><div><h3>Tahap 4 · Penyiapan data &amp; gerbang RNI/LRS</h3><p>Data sumber dibaca dari sesi survei tersimpan dalam paket.</p></div><button type="button" className="wf-button" disabled={loading || segmentLoading || lrsLoading} onClick={() => { setRevision(value => value + 1); setSegmentRevision(value => value + 1); setLrsRevision(value => value + 1); }}><RefreshCw size={13} /> Muat ulang</button></div>
    <div className="wf-body">
      {capabilities && !capabilities.write && <div className="wf-callout" role="status"><strong>Simpan validasi LRS dinonaktifkan</strong><p>{capabilities.reason} Data yang diubah pada formulir demo tidak disimpan ke paket server.</p></div>}
      {!capabilities && <p role="status">Memeriksa kesiapan RPC validasi LRS…</p>}
      <p><strong>Peran:</strong> {role}. {role === 'Penyedia Jasa / Ketua Tim' ? 'Penyedia dapat mencatat data observasi jika kapabilitas RPC diaktifkan untuk environment ini.' : 'Peran ini dapat membaca konteks tersimpan; penyimpanan observasi hanya untuk Penyedia Jasa.'}</p>
      {loading && <p role="status">Memuat sesi survei paket…</p>}
      {error && <div role="alert" className="wf-callout danger">{error}</div>}
      {!loading && !error && sessions.length === 0 && <p className="wf-note">Belum ada sesi survei tersimpan dalam paket ini.</p>}
      {!loading && sessions.length > 0 && <label className="wf-field"><span>Pilih sesi survei</span><select value={selected ?? ''} onChange={event => setSelected(Number(event.target.value))}>{sessions.map(row => <option key={row.sesi_id} value={row.sesi_id}>Sesi #{row.sesi_id} · {value(row.tanggal)} · {value(row.lajur)}</option>)}</select></label>}
      {session && <div className="package-context-grid" aria-label="Ringkasan sesi tersimpan">
        {(['tanggal','tim_id','ruas_id','alat_id','jenis_survei_id','panjang_tercapai_km'] as const).map(key => <div key={key}><small>{key.replaceAll('_',' ')}</small><strong>{value(session[key])}</strong></div>)}
      </div>}
      {segmentLoading && <p role="status">Memuat record data segmen tersimpan…</p>}
      {segmentError && <div role="alert" className="wf-callout danger">{segmentError}</div>}
      {!segmentLoading && !segmentError && session && <section aria-label="Data segmen persisted"><h4>Data survei tersimpan ({segments.length})</h4>{segments.length ? <div className="table-scroll"><table><thead><tr><th>ID data</th><th>STA</th><th>Lajur</th><th>Nilai utama</th><th>Status QC</th><th>Versi aktif</th></tr></thead><tbody>{segments.map(row => <tr key={row.data_id}><td>{row.data_id}</td><td>{value(row.sta_awal)} – {value(row.sta_akhir)}</td><td>{value(row.lajur)}</td><td>{value(row.nilai_utama)}</td><td>{value(row.status_qc)}</td><td>{value(row.versi_aktif)}</td></tr>)}</tbody></table></div> : <p className="wf-note">Belum ada record segmen tersimpan untuk sesi ini.</p>}</section>}
      {capabilities?.read && <section className="wf-panel" aria-label="Validasi RNI/LRS tersimpan"><div className="wf-panel-head"><h4>Validasi RNI/LRS tersimpan</h4><span>{lrsLoading ? 'Memuat…' : `${validations.length} ruas`}</span></div><div className="wf-body">
        {lrsError && <div role="alert" className="wf-callout danger">{lrsError}</div>}
        {!lrsLoading && !lrsError && roads.length === 0 && <p className="wf-note">Belum ada ruas tersedia dalam paket.</p>}
        {roads.length > 0 && <label className="wf-field"><span>Ruas validasi</span><select value={selectedRoad ?? ''} onChange={event => setSelectedRoad(Number(event.target.value))}>{roads.map(road => <option key={road.ruas_id} value={road.ruas_id}>{road.nomor_ruas || `Ruas #${road.ruas_id}`} · {road.nama_ruas || 'Nama belum tersedia'}</option>)}</select></label>}
        {currentValidation && <div className="wf-callout"><strong>Versi tersimpan: {currentValidation.versi}</strong><div>Deviasi tersimpan: {value(currentValidation.deviasi_m)} · Status tersimpan: {value(currentValidation.status)} · Tanggal validasi: {value(currentValidation.tgl_valid)}</div><small>Temuan teknis di bawah dihitung baca-saja dari observasi; kolom resmi di atas tidak ditulis atau ditafsirkan.</small></div>}
        <section className="wf-callout" aria-label="Penilaian teknis KAK 2026 (baca-saja)" data-testid="stage4-kak-assessment">
          <strong>Penilaian teknis panjang ruas · KAK 2026 §11.9.2 / §11.9.7</strong>
          {!technicalAssessment ? <p role="status">INCOMPLETE · Belum ada observasi LRS tersimpan untuk ruas ini.</p> : <>
            <div className="package-context-grid" aria-label="Nilai sumber penilaian panjang">
              <div><small>Panjang lapangan (m)</small><strong>{value(technicalAssessment.length.measuredLengthM)}</strong></div>
              <div><small>Panjang acuan (m)</small><strong>{value(technicalAssessment.length.referenceLengthM)}</strong></div>
              <div><small>Selisih absolut (m)</small><strong>{value(technicalAssessment.length.absoluteDifferenceM)}</strong></div>
            </div>
            <p data-testid="stage4-length-category"><strong>{technicalAssessment.length.category}</strong> · {technicalAssessment.length.message}</p>
            <ul aria-label="Temuan observasi teknis terpisah">
              {[technicalAssessment.topology, technicalAssessment.glossary, technicalAssessment.sta].map(item => <li key={item.label} data-testid={`stage4-finding-${item.label.toLowerCase()}`}><strong>{item.label}: {item.state}</strong> · {item.detail}</li>)}
            </ul>
            <small>Sumber: {technicalAssessment.source}</small>
          </>}
          <p><strong>Ini penilaian teknis baca-saja, bukan PASS/FAIL workflow, status VALID SMD, persetujuan PIC, atau kelayakan Tahap 5.</strong> Perbandingan mengasumsikan kedua panjang adalah ruas yang sama dan bersatuan meter. Tidak mengoreksi data mentah atau menerapkan faktor skala. Jika selisih melebihi toleransi, ukur ulang ruas; bila pengukuran ulang mengesahkan hasil awal, maklumkan Pengguna Jasa.</p>
          {packageId === '11' && <small>TEST/QA synthetic record — bukan data survei rasmi.</small>}
        </section>
        <form onSubmit={saveLrs} aria-label="Simpan validasi RNI LRS"><fieldset disabled={!capabilities.write || role !== 'Penyedia Jasa / Ketua Tim' || saveBusy || selectedRoad === null}>
          <legend>Catat data observasi LRS {currentValidation ? `(versi ${currentValidation.versi})` : '(baru, versi 0)'}</legend>
          <label className="wf-field"><span>Panjang lapangan (m)</span><input required type="number" min="0" step="any" value={lrsDraft.panjang_lapangan_m} onChange={event => setLrsDraft(value => ({ ...value, panjang_lapangan_m: event.target.value }))} /></label>
          <label className="wf-field"><span>Panjang acuan (m)</span><input required type="number" min="0" step="any" value={lrsDraft.panjang_acuan_m} onChange={event => setLrsDraft(value => ({ ...value, panjang_acuan_m: event.target.value }))} /></label>
          <label className="wf-field"><span>Jumlah error topologi</span><input required type="number" min="0" step="1" value={lrsDraft.jumlah_error_topologi} onChange={event => setLrsDraft(value => ({ ...value, jumlah_error_topologi: event.target.value }))} /></label>
          {([['format_sesuai_glossary','Format sesuai glossary'],['sta_konsisten_iri_pci_ldt','STA konsisten IRI/PCI/LDT']] as const).map(([key,label]) => <label className="wf-field" key={key}><span>{label}</span><select required value={lrsDraft[key]} onChange={event => setLrsDraft(value => ({ ...value, [key]: event.target.value }))}><option value="">Pilih hasil pemeriksaan</option><option value="true">Ya</option><option value="false">Tidak</option></select></label>)}
          <button type="submit" className="wf-button primary" disabled={!capabilities.write || role !== 'Penyedia Jasa / Ketua Tim' || saveBusy || selectedRoad === null}><Save size={13} /> {saveBusy ? 'Menyimpan…' : 'Simpan validasi LRS'}</button>
        </fieldset></form>
        {role !== 'Penyedia Jasa / Ketua Tim' && <p className="wf-note">Hanya Penyedia Jasa dapat menyimpan data observasi. Aksi submit/review belum termasuk kontrak ini.</p>}
        {saveError && <div role="alert" className="wf-callout danger">{saveError}</div>}
        {saveMessage && <div role="status" className="wf-callout">{saveMessage}</div>}
      </div></section>}
      <section className="wf-panel" aria-label="Status submit dan review Stage 4" data-testid="stage4-workflow">
        <div className="wf-panel-head"><h4>Status validasi, submit &amp; review PIC</h4><span>{workflowStatus?.state ?? 'Memuat status'}</span></div>
        <div className="wf-body">
          {workflowError && <div role="alert" className="wf-callout danger">{workflowError}</div>}
          {!workflowStatus && !workflowError && <p role="status">Membaca status workflow dari server…</p>}
          {workflowStatus && <>
            <div className="wf-callout" role="status"><strong>Gerbang teknis: {workflowStatus.gate === 'PENDING' ? 'Menunggu aturan terkonfirmasi' : workflowStatus.gate}</strong>
              <p>{workflowStatus.progression_allowed ? 'Status server mengizinkan tahap berikutnya.' : 'Tahap 5 tetap terkunci; tidak ada hasil PASS/FAIL yang dihitung atau diasumsikan.'}</p>
              {workflowStatus.blockers.map(item => <div key={item.code} data-testid={`stage4-blocker-${item.code}`}>• {item.message}</div>)}
            </div>
            {workflowCapabilities?.reason && <p className="wf-note">{workflowCapabilities.reason}</p>}
            <div className="wf-toolbar">
              <button type="button" className="wf-button primary" onClick={() => void runWorkflow('submit')} disabled={!workflowCapabilities?.submit || role !== 'Penyedia Jasa / Ketua Tim' || workflowStatus.gate !== 'PASS' || workflowBusy || !['PENDING_RULES','DRAFT','PERLU_REVISI'].includes(workflowStatus.state)}>{workflowBusy ? 'Memproses…' : workflowStatus.state === 'PERLU_REVISI' ? 'Ajukan ulang ke pemeriksa' : 'Ajukan ke pemeriksa'}</button>
              {role === 'PIC Balai / Pengguna Jasa' && workflowStatus.state === 'DIAJUKAN' && <>
                <label className="wf-field"><span>Catatan pemeriksaan</span><textarea value={reviewNote} onChange={event => setReviewNote(event.target.value)} maxLength={2000} /></label>
                <button type="button" className="wf-button" onClick={() => void runWorkflow('review','PERLU_REVISI')} disabled={!workflowCapabilities?.review || workflowBusy || !reviewNote.trim()}>Minta revisi</button>
                <button type="button" className="wf-button primary" onClick={() => void runWorkflow('review','DISETUJUI')} disabled={!workflowCapabilities?.review || workflowBusy || workflowStatus.gate !== 'PASS'}>Setujui pengajuan</button>
              </>}
            </div>
            <p className="wf-note">Versi workflow: {workflowStatus.workflow_version}. Submit hanya untuk Penyedia; keputusan hanya untuk PIC Balai. Persetujuan dan Tahap 5 tetap diblokir selama blocker di atas ada. Status persisted `status`/`tgl_valid` tidak ditafsirkan sebagai kelulusan; review PIC bukan Berita Acara Penerimaan.</p>
          </>}
        </div>
      </section>
    </div>
  </section>;
}
