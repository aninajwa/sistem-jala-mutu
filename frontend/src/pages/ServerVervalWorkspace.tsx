import { useEffect, useRef, useState, type FormEvent } from 'react';
import { RefreshCw, ArrowLeft, ArrowRight } from 'lucide-react';
import { apiRequest } from '../auth/client';
import { createVervalCycleAndConfirm, displayVervalValue, getStage3BCapabilities, getVervalConsistency, getVervalCycle, getVervalCycles, saveConsistencyAndConfirm, type ConsistencyCheck, type Stage3BCapabilities, type VervalCycle } from './serverVervalData';

function attributes(record: Record<string, unknown>) {
  return Object.entries(record).map(([key, value]) => <div className="package-context-grid" key={key}>
    <small>{key.replaceAll('_', ' ')}</small><strong>{displayVervalValue(key, value)}</strong>
  </div>);
}

export function ServerVervalWorkspace({
  packageId,
  role,
  onNavigate,
}: {
  packageId: string;
  role: string;
  onNavigate?: (selection: string) => void;
}) {
  const [capabilities, setCapabilities] = useState<Stage3BCapabilities | null>(null);
  const [capabilityError, setCapabilityError] = useState('');
  const [mutationBusy, setMutationBusy] = useState(false);
  const [mutationError, setMutationError] = useState('');
  const [consistencyDraft, setConsistencyDraft] = useState({ jenis_survei_id: '', tim_id: '', ruas_id: '', sta_awal: '', sta_akhir: '' });
  const [repeatDraft, setRepeatDraft] = useState([{ rater_personel_id: '', nilai: '' }]);
  const [cycles, setCycles] = useState<VervalCycle[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [listRevision, setListRevision] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cycle, setCycle] = useState<VervalCycle | null>(null);
  const [cycleLoading, setCycleLoading] = useState(false);
  const [cycleError, setCycleError] = useState('');
  const [consistency, setConsistency] = useState<ConsistencyCheck[]>([]);
  const [consistencyLoading, setConsistencyLoading] = useState(false);
  const [consistencyError, setConsistencyError] = useState('');
  const [detailRevision, setDetailRevision] = useState(0);
  const cycleRequestId = useRef<string | null>(null);
  const consistencyRequestId = useRef<string | null>(null);

  const navigate = (to: string) => {
    if (onNavigate) onNavigate(to);
    else window.dispatchEvent(new CustomEvent('jalamutu:navigate', { detail: to }));
  };

  useEffect(() => {
    const controller = new AbortController();
    setCapabilities(null); setCapabilityError('');
    getStage3BCapabilities(packageId, apiRequest, controller.signal).then(setCapabilities).catch(error => {
      if (!controller.signal.aborted) setCapabilityError(error instanceof Error ? error.message : 'Kesiapan Stage 3B tidak dapat dibaca.');
    });
    return () => controller.abort();
  }, [packageId]);

  useEffect(() => {
    const controller = new AbortController();
    if (!capabilities?.read) {
      setCycles([]); setListLoading(false); setListError(''); setSelectedId(null);
      return () => controller.abort();
    }
    setListLoading(true);
    setListError('');
    getVervalCycles(packageId, apiRequest, controller.signal).then(rows => {
      if (controller.signal.aborted) return;
      setCycles(rows);
      setSelectedId(current => current !== null && rows.some(row => row.siklus_id === current) ? current : null);
    }).catch(error => {
      if (!controller.signal.aborted) setListError(error instanceof Error ? error.message : 'Gagal memuat siklus Verval.');
    }).finally(() => {
      if (!controller.signal.aborted) setListLoading(false);
    });
    return () => controller.abort();
  }, [packageId, listRevision, capabilities?.read]);

  useEffect(() => {
    if (selectedId === null) {
      setCycle(null);
      setCycleError('');
      setCycleLoading(false);
      setConsistency([]);
      setConsistencyError('');
      setConsistencyLoading(false);
      return;
    }
    const controller = new AbortController();
    setCycleLoading(true);
    setCycleError('');
    setCycle(null);
    getVervalCycle(packageId, selectedId, apiRequest, controller.signal).then(value => {
      if (!controller.signal.aborted) setCycle(value);
    }).catch(error => {
      if (!controller.signal.aborted) setCycleError(error instanceof Error ? error.message : 'Gagal memuat detail siklus.');
    }).finally(() => {
      if (!controller.signal.aborted) setCycleLoading(false);
    });

    setConsistencyLoading(true);
    setConsistencyError('');
    setConsistency([]);
    getVervalConsistency(packageId, selectedId, apiRequest, controller.signal).then(rows => {
      if (!controller.signal.aborted) setConsistency(rows);
    }).catch(error => {
      if (!controller.signal.aborted) setConsistencyError(error instanceof Error ? error.message : 'Gagal memuat uji konsistensi.');
    }).finally(() => {
      if (!controller.signal.aborted) setConsistencyLoading(false);
    });
    return () => controller.abort();
  }, [packageId, selectedId, detailRevision, capabilities?.read]);

  async function openCycle() {
    setMutationBusy(true); setMutationError('');
    try { cycleRequestId.current ??= crypto.randomUUID(); const result = await createVervalCycleAndConfirm(packageId, apiRequest, cycleRequestId.current); cycleRequestId.current = null; setCycles(result.cycles); setSelectedId(result.cycle.siklus_id); setListRevision(value => value + 1); }
    catch (error) { setMutationError(error instanceof Error ? error.message : 'Gagal membuka siklus.'); }
    finally { setMutationBusy(false); }
  }

  async function saveConsistency(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cycle || selectedId === null) return;
    const ids = [consistencyDraft.jenis_survei_id, consistencyDraft.tim_id, consistencyDraft.ruas_id].map(Number);
    const raters = repeatDraft.map(row => Number(row.rater_personel_id));
    const values = [consistencyDraft.sta_awal, consistencyDraft.sta_akhir, ...repeatDraft.map(row => row.nilai)].map(Number);
    if (ids.some(value => !Number.isSafeInteger(value) || value < 1) || raters.some(value => !Number.isSafeInteger(value) || value < 1) || values.some(value => !Number.isFinite(value))) { setMutationError('Isi semua ID dan nilai numerik dengan benar.'); return; }
    setMutationBusy(true); setMutationError('');
    try {
      const result = await saveConsistencyAndConfirm(packageId, selectedId, {
        request_id: consistencyRequestId.current ??= crypto.randomUUID(), expected_version: cycle.versi ?? 0,
        jenis_survei_id: ids[0], tim_id: ids[1], ruas_id: ids[2], sta_awal: values[0], sta_akhir: values[1],
        ulangan: repeatDraft.map((row, index) => ({ ulangan_ke: index + 1, rater_personel_id: raters[index], nilai: Number(row.nilai) })),
      }, apiRequest);
      consistencyRequestId.current = null;
      setCycles(result.cycles); setConsistency(result.checks); setDetailRevision(value => value + 1);
      setConsistencyDraft({ jenis_survei_id: '', tim_id: '', ruas_id: '', sta_awal: '', sta_akhir: '' });
      setRepeatDraft([{ rater_personel_id: '', nilai: '' }]);
    } catch (error) { setMutationError(error instanceof Error ? error.message : 'Gagal menyimpan uji konsistensi.'); }
    finally { setMutationBusy(false); }
  }

  return <div data-testid="server-stage3b-workspace" aria-label={`Verval berkala paket ${packageId}`}>
    <section className="wf-panel" aria-labelledby="server-verval-list-title">
      <div className="wf-panel-head"><h3 id="server-verval-list-title">Siklus Verval · Paket #{packageId}</h3>
        <button type="button" className="wf-button" disabled={!capabilities?.read || listLoading} onClick={() => setListRevision(value => value + 1)}><RefreshCw size={13} /> {listLoading ? 'Memuat…' : 'Muat semula siklus'}</button>
      </div>
      <div className="wf-body">
        {capabilityError && <div role="alert" className="wf-callout danger">{capabilityError}</div>}
        {!capabilityError && !capabilities && <p role="status">Memeriksa kesiapan RPC Stage 3B…</p>}
        {capabilities && !capabilities.read && <div className="wf-callout warn" role="status"><strong>Verval Berkala belum tersedia</strong><p>Anda masih dapat melihat sesi dan segmen yang sudah tercatat di Survei Harian.</p></div>}
        {capabilities?.write && <div className="wf-toolbar"><button type="button" className="wf-button" disabled={mutationBusy || role !== 'Penyedia Jasa / Ketua Tim'} onClick={openCycle}>Buka siklus berikutnya</button></div>}
        {mutationError && <div role="alert" className="wf-callout danger">{mutationError}</div>}
        {capabilities?.read && listLoading && <p role="status">Memuat daftar siklus Verval…</p>}
        {!listLoading && capabilities?.read && listError && <div role="alert" className="wf-callout danger">{listError}<button type="button" className="wf-button" onClick={() => setListRevision(value => value + 1)}>Coba lagi</button></div>}
        {!listLoading && capabilities?.read && !listError && cycles.length === 0 && <p className="wf-note">Belum ada siklus Verval untuk paket ini.</p>}
        {!listLoading && !listError && cycles.length > 0 && <div className="wf-table-wrap"><table className="wf-table">
          <thead><tr><th>Siklus</th><th>Periode</th><th>Status</th><th>Maklumat</th></tr></thead>
          <tbody>{cycles.map(item => <tr key={item.siklus_id}>
            <td><button type="button" className="wf-button" aria-pressed={selectedId === item.siklus_id} onClick={() => setSelectedId(item.siklus_id)}>Pilih siklus #{item.siklus_id}{item.siklus_ke == null ? '' : ` · Ke-${item.siklus_ke}`}</button></td>
            <td>{displayVervalValue('periode_mulai', item.periode_mulai)} – {displayVervalValue('periode_selesai', item.periode_selesai)}</td>
            <td>{displayVervalValue('status', item.status)}</td>
            <td>{Object.keys(item).length} atribut dari API</td>
          </tr>)}</tbody>
        </table></div>}
      </div>
    </section>

    {selectedId !== null && <>
      <section className="wf-panel" aria-labelledby="server-verval-detail-title">
        <div className="wf-panel-head"><h3 id="server-verval-detail-title">Detail siklus #{selectedId}</h3>
          <button type="button" className="wf-button" disabled={cycleLoading || consistencyLoading} onClick={() => setDetailRevision(value => value + 1)}><RefreshCw size={13} /> {cycleLoading || consistencyLoading ? 'Memuat…' : 'Muat semula detail & konsistensi'}</button>
        </div>
        <div className="wf-body">
          {cycleLoading && <p role="status">Memuat detail siklus…</p>}
          {!cycleLoading && cycleError && <div role="alert" className="wf-callout danger">{cycleError}<button type="button" className="wf-button" onClick={() => setDetailRevision(value => value + 1)}>Coba lagi</button></div>}
          {!cycleLoading && cycle && <div className="package-context-grid verval-cycle-attributes" data-testid="verval-cycle-attributes">{attributes(cycle as Record<string, unknown>)}</div>}
        </div>
      </section>

      <section className="wf-panel" aria-labelledby="server-verval-consistency-title">
        <div className="wf-panel-head"><h3 id="server-verval-consistency-title">Uji konsistensi · Siklus #{selectedId}</h3></div>
        <div className="wf-body">
          {consistencyLoading && <p role="status">Memuat uji konsistensi…</p>}
          {!consistencyLoading && consistencyError && <div role="alert" className="wf-callout danger">{consistencyError}<button type="button" className="wf-button" onClick={() => setDetailRevision(value => value + 1)}>Coba lagi</button></div>}
          {!consistencyLoading && !consistencyError && consistency.length === 0 && <p className="wf-note">Belum ada rekod uji konsistensi yang dipulangkan untuk siklus ini.</p>}
          {!consistencyLoading && !consistencyError && consistency.map(row => <article className="wf-panel" key={row.konsistensi_id}>
            <div className="wf-panel-head"><h4>Konsistensi #{row.konsistensi_id}</h4></div>
            <div className="wf-body"><div className="package-context-grid">{attributes(row as Record<string, unknown>)}</div></div>
          </article>)}
          {capabilities?.write && role === 'Penyedia Jasa / Ketua Tim' && cycle && <form className="wf-body" onSubmit={saveConsistency} aria-label="Tambah uji konsistensi">
            <p className="wf-note">Entri ditolak server bila relasi paket/tim/ruas/personel tidak sesuai. Semua ulangan disimpan dalam satu transaksi.</p>
            <div className="wf-fields">
              {([['jenis_survei_id','ID jenis survei'],['tim_id','ID tim'],['ruas_id','ID ruas'],['sta_awal','STA awal'],['sta_akhir','STA akhir']] as const).map(([key,label]) => <label className="wf-field" key={key}><span>{label}</span><input required type="number" step={key.startsWith('sta_') ? 'any' : '1'} min={key.startsWith('sta_') ? undefined : '1'} value={consistencyDraft[key]} onChange={event => setConsistencyDraft(current => ({ ...current, [key]: event.target.value }))} /></label>)}
              <label className="wf-field"><span>Jumlah ulangan (1–20)</span><input type="number" min="1" max="20" step="1" value={repeatDraft.length} onChange={event => { const count = Math.max(1, Math.min(20, Number(event.target.value) || 1)); setRepeatDraft(current => Array.from({ length: count }, (_, index) => current[index] ?? { rater_personel_id: '', nilai: '' })); }} /></label>
              {repeatDraft.map((repeat, index) => <div className="wf-fields" key={index}>
                <label className="wf-field"><span>Ulangan #{index + 1} · ID rater/personel</span><input required type="number" min="1" step="1" value={repeat.rater_personel_id} onChange={event => setRepeatDraft(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, rater_personel_id: event.target.value } : row))} /></label>
                <label className="wf-field"><span>Ulangan #{index + 1} · Nilai</span><input required type="number" step="any" value={repeat.nilai} onChange={event => setRepeatDraft(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, nilai: event.target.value } : row))} /></label>
              </div>)}
            </div>
            <button type="submit" className="wf-button" disabled={mutationBusy || cycle.versi === undefined}>{mutationBusy ? 'Menyimpan…' : `Simpan pada versi ${cycle.versi ?? 'tidak tersedia'}`}</button>
          </form>}
        </div>
      </section>
    </>}

    <div className="wf-toolbar" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <button
        type="button"
        className="wf-button"
        onClick={() => navigate('/entry:Survei harian')}
      >
        <ArrowLeft size={13} /> Kembali ke Tahap 3A (Survei Harian)
      </button>
      <button
        type="button"
        className="wf-button primary"
        onClick={() => navigate('/entry:Gerbang RNI/LRS')}
      >
        Lanjut ke Tahap 4 (Validasi LRS / Gerbang RNI) <ArrowRight size={13} />
      </button>
    </div>
  </div>;
}
