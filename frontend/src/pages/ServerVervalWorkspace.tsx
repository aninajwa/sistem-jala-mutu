import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, CalendarClock, Plus, RefreshCw } from 'lucide-react';
import { apiRequest } from '../auth/client';
import { getStage3BCapabilities, type Stage3BCapabilities } from './serverVervalData';
import {
  consistencyPreview, daysUntil, formatDate, getVervalPackage, latestTestsByType, openVervalCycle, recordConsistency,
  reviewVervalCycle, STATUS_LABEL, submitVervalCycle, vervalActions, vervalErrorMessage,
  type VervalCycleRow, type VervalPackage,
} from './verval/vervalRules';

const PROVIDER = 'Penyedia Jasa / Ketua Tim';
const emptyRepeat = () => ({ rater_personel_id: '', nilai: '' });

/** Tahap 3B: Penyedia's self-run verval every 14 days (flowchart 02), reviewed by the PIC Balai. */
export function ServerVervalWorkspace({ packageId, role, onNavigate }: { packageId: string; role: string; onNavigate?: (selection: string) => void }) {
  const navigate = (selection: string) => onNavigate ? onNavigate(selection) : window.dispatchEvent(new CustomEvent('jalamutu:navigate', { detail: selection }));
  const [capabilities, setCapabilities] = useState<Stage3BCapabilities | null>(null);
  const [pkg, setPkg] = useState<VervalPackage | null>(null);
  const [loadError, setLoadError] = useState('');
  const [revision, setRevision] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState({ jenis_survei_id: '', tim_id: '', ruas_id: '', sta_awal: '0', sta_akhir: '300' });
  const [repeats, setRepeats] = useState([emptyRepeat(), emptyRepeat(), emptyRepeat()]);
  const [baNumber, setBaNumber] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const openRequest = useRef<string | null>(null);
  const testRequest = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getStage3BCapabilities(packageId, apiRequest, controller.signal)
      .then(value => { if (!controller.signal.aborted) setCapabilities(value); })
      .catch(reason => { if (!controller.signal.aborted) setLoadError(vervalErrorMessage(reason)); });
    return () => controller.abort();
  }, [packageId]);

  useEffect(() => {
    if (!capabilities?.read) return;
    const controller = new AbortController();
    setLoadError('');
    getVervalPackage(packageId, controller.signal).then(data => {
      if (controller.signal.aborted) return;
      setPkg(data);
      setSelectedId(current => current !== null && data.siklus.some(row => row.siklus_id === current) ? current
        : (data.siklus.find(row => row.status !== 'DITERIMA') ?? data.siklus[data.siklus.length - 1])?.siklus_id ?? null);
      setDraft(current => ({
        ...current,
        jenis_survei_id: current.jenis_survei_id || String(data.opsi.jenis_survei[0]?.jenis_survei_id ?? ''),
        tim_id: current.tim_id || String(data.opsi.tim[0]?.tim_id ?? ''),
        ruas_id: current.ruas_id || String(data.opsi.ruas[0]?.ruas_id ?? ''),
      }));
      setRepeats(current => current.map(row => ({ ...row, rater_personel_id: row.rater_personel_id || String(data.opsi.personel[0]?.personel_id ?? '') })));
    }).catch(reason => { if (!controller.signal.aborted) setLoadError(vervalErrorMessage(reason)); });
    return () => controller.abort();
  }, [packageId, capabilities?.read, revision]);

  const cycle = pkg?.siklus.find(row => row.siklus_id === selectedId) ?? null;
  const actions = pkg ? vervalActions(pkg, cycle, role) : [];
  const selectedType = pkg?.opsi.jenis_survei.find(item => String(item.jenis_survei_id) === draft.jenis_survei_id);
  const preview = consistencyPreview(repeats.map(row => row.nilai === '' ? Number.NaN : Number(row.nilai)), selectedType?.kode ?? '');
  const accepted = pkg?.siklus.filter(row => row.status === 'DITERIMA').length ?? 0;
  const active = pkg?.siklus.find(row => row.status !== 'DITERIMA') ?? null;
  const dueDays = active ? daysUntil(active.jatuh_tempo) : null;
  const typeChecks = useMemo(() => pkg && cycle ? latestTestsByType(pkg, cycle) : [], [pkg, cycle]);

  async function run(action: () => Promise<unknown>, done: string) {
    setBusy(true); setError(''); setMessage('');
    try {
      await action();
      setMessage(done);
      setRevision(value => value + 1);
      window.dispatchEvent(new CustomEvent('jalamutu:package-stage-facts-refresh', { detail: { packageId } }));
    } catch (reason) { setError(vervalErrorMessage(reason)); } finally { setBusy(false); }
  }
  const openCycle = () => run(async () => {
    openRequest.current ??= crypto.randomUUID();
    const created = await openVervalCycle(packageId, openRequest.current);
    openRequest.current = null;
    setSelectedId(created.siklus_id);
  }, 'Siklus verval baru dibuka.');
  function saveTest(event: FormEvent) {
    event.preventDefault();
    if (!cycle) return;
    void run(async () => {
      testRequest.current ??= crypto.randomUUID();
      await recordConsistency(packageId, cycle.siklus_id, {
        request_id: testRequest.current, expected_version: cycle.versi ?? 0,
        jenis_survei_id: Number(draft.jenis_survei_id), tim_id: Number(draft.tim_id), ruas_id: Number(draft.ruas_id),
        sta_awal: Number(draft.sta_awal), sta_akhir: Number(draft.sta_akhir),
        ulangan: repeats.map((row, index) => ({ ulangan_ke: index + 1, rater_personel_id: Number(row.rater_personel_id), nilai: Number(row.nilai) })),
      });
      testRequest.current = null;
      setRepeats(current => current.map(row => ({ ...row, nilai: '' })));
    }, 'Uji konsistensi tersimpan di server.');
  }
  const submit = () => cycle && run(() => submitVervalCycle(packageId, cycle.siklus_id, cycle.versi, baNumber.trim()),
    'BA Verval diajukan. Bila ada uji tidak konsisten, siklus ditahan dan kasus koreksi dibuka otomatis.');
  const review = (keputusan: 'DITERIMA' | 'PERLU_PERBAIKAN') => cycle && run(async () => {
    await reviewVervalCycle(packageId, cycle.siklus_id, cycle.versi, keputusan, reviewNote.trim());
    setReviewNote('');
  }, keputusan === 'DITERIMA' ? 'Siklus diterima. BA Verval 2-Mingguan tercatat.' : 'Siklus dikembalikan ke Penyedia untuk perbaikan.');

  const personName = (id: number) => pkg?.opsi.personel.find(item => item.personel_id === id)?.nama ?? `Personel ${id}`;
  const roadName = (id: number) => { const road = pkg?.opsi.ruas.find(item => item.ruas_id === id); return road ? `${road.nomor_ruas ?? ''} ${road.nama_ruas ?? ''}`.trim() : `Ruas ${id}`; };

  return <div className="wf" data-testid="server-stage3b-workspace" aria-label={`Verval berkala paket ${packageId}`}>
    <section className="wf-panel">
      <div className="wf-panel-head"><div><h3>Tahap 3B · Verval berkala 14 hari</h3>
        <p className="wf-note">Penyedia menguji konsistensi alat/rater tiap 14 hari (IRI: KV ≤ 5%, PCI: SD ≤ 8), menerbitkan BA Verval 2-Mingguan, lalu PIC Balai memeriksa. Hasil tidak konsisten menahan data 14 hari terakhir dan membuka kasus koreksi.</p></div>
        <button type="button" className="wf-button" disabled={!capabilities?.read || busy} onClick={() => setRevision(value => value + 1)}><RefreshCw size={13} /> Muat ulang</button></div>
      <div className="wf-body">
        {capabilities && !capabilities.read && <div className="wf-callout warn" role="status"><strong>Verval Berkala belum tersedia</strong><p>Fitur ini belum diaktifkan di server. Sesi dan segmen tetap dapat dilihat di Survei Harian.</p></div>}
        {loadError && <div role="alert" className="wf-callout danger">{loadError} <button type="button" className="wf-button" onClick={() => setRevision(value => value + 1)}>Coba lagi</button></div>}
        {capabilities?.read && !pkg && !loadError && <p role="status" className="wf-note">Memuat siklus verval…</p>}
        {pkg && <>
          <div className="wf-kpis">
            <div className="wf-kpi"><div className="wf-kpi-label">Siklus diterima PIC</div><div className="wf-kpi-value" data-testid="verval-accepted">{accepted}</div></div>
            <div className="wf-kpi"><div className="wf-kpi-label">Siklus aktif</div><div className="wf-kpi-value">{active ? `Ke-${active.siklus_ke}` : '—'}</div>
              <div className="wf-note">{active ? STATUS_LABEL[active.status].label : 'Tidak ada siklus terbuka'}</div></div>
            <div className="wf-kpi"><div className="wf-kpi-label">Jatuh tempo</div>
              <div className="wf-kpi-value">{active ? (dueDays! < 0 ? 'Terlambat' : dueDays === 0 ? 'Hari ini' : `${dueDays} hari`) : '—'}</div>
              <div className="wf-note">{active ? formatDate(active.jatuh_tempo) : ''}</div></div>
          </div>
          {actions.includes('open') && <div className="wf-toolbar"><button type="button" className="wf-button primary" data-testid="verval-open" disabled={busy} onClick={() => void openCycle()}><Plus size={13} /> Buka siklus {pkg.siklus.length ? `ke-${pkg.siklus.length + 1}` : 'pertama'}</button></div>}
          {role === PROVIDER && !pkg.boleh_buka && pkg.alasan_tidak_boleh_buka && <p className="wf-note">{pkg.alasan_tidak_boleh_buka}</p>}
          {pkg.siklus.length === 0 && <p className="wf-note">Belum ada siklus verval. {role === PROVIDER ? 'Buka siklus pertama; periodenya dimulai dari tanggal sesi survei pertama.' : 'Menunggu Penyedia membuka siklus pertama.'}</p>}
          {pkg.siklus.length > 0 && <div className="wf-table"><table className="balai-history-table" data-testid="verval-cycles">
            <thead><tr><th>Siklus</th><th>Periode 14 hari</th><th>Survei</th><th>BA</th><th>Status</th></tr></thead>
            <tbody>{pkg.siklus.map(row => <tr key={row.siklus_id} aria-selected={row.siklus_id === selectedId} style={row.siklus_id === selectedId ? { background: '#f0f7f4' } : undefined}>
              <td><button type="button" className="wf-button" aria-pressed={row.siklus_id === selectedId} onClick={() => setSelectedId(row.siklus_id)}>Siklus ke-{row.siklus_ke}</button></td>
              <td>{formatDate(row.periode_mulai)} – {formatDate(row.periode_selesai)}{row.terlambat && <div><span className="wf-status bad">Terlambat</span></div>}</td>
              <td>{row.jumlah_sesi} sesi · {Number(row.panjang_km).toLocaleString('id-ID')} km</td>
              <td>{row.nomor_ba ?? '—'}</td>
              <td><span className={`wf-status ${STATUS_LABEL[row.status].tone}`} data-testid={`verval-status-${row.siklus_ke}`}>{STATUS_LABEL[row.status].label}</span></td>
            </tr>)}</tbody>
          </table></div>}
          {message && <div role="status" className="wf-callout">{message}</div>}
          {error && <div role="alert" className="wf-callout danger">{error}</div>}
        </>}
      </div>
    </section>

    {pkg && cycle && <section className="wf-panel" data-testid="verval-cycle-detail" aria-label={`Siklus ke-${cycle.siklus_ke}`}>
      <div className="wf-panel-head"><div><h4>Siklus ke-{cycle.siklus_ke} · {formatDate(cycle.periode_mulai)} – {formatDate(cycle.periode_selesai)}</h4>
        <p className="wf-note"><CalendarClock size={12} /> Jatuh tempo {formatDate(cycle.jatuh_tempo)}{cycle.nomor_ba ? ` · BA ${cycle.nomor_ba}` : ''}</p></div>
        <span className={`wf-status ${STATUS_LABEL[cycle.status].tone}`}>{STATUS_LABEL[cycle.status].label}</span></div>
      <div className="wf-body">
        {cycle.status === 'DITAHAN' && <div className="wf-callout danger" role="status"><strong>Data 14 hari terakhir ditahan</strong>
          <p>{cycle.koreksi_terbuka > 0 ? 'Selesaikan kasus koreksi Verval, lalu catat uji ulang dan ajukan kembali.' : 'Kasus koreksi sudah ditutup. Catat uji ulang lalu ajukan kembali.'}</p>
          {cycle.koreksi_terbuka > 0 && <button type="button" className="wf-button" onClick={() => navigate('/actions:Koreksi berbukti')}>Buka Koreksi</button>}</div>}
        {cycle.status === 'PERLU_PERBAIKAN' && <div className="wf-callout warn"><strong>Catatan PIC</strong><p>{cycle.catatan_review}</p></div>}
        {cycle.status === 'DIAJUKAN' && <div className="wf-callout warn" role="status">BA Verval {cycle.nomor_ba} menunggu pemeriksaan PIC Balai.</div>}
        {cycle.status === 'DITERIMA' && <div className="wf-callout" role="status"><strong>Data 14 hari diterima</strong><p>BA Verval 2-Mingguan {cycle.nomor_ba}{cycle.catatan_review ? ` · ${cycle.catatan_review}` : ''}</p></div>}

        <h4>Uji konsistensi</h4>
        {cycle.uji.length === 0 ? <p className="wf-note">Belum ada uji konsistensi pada siklus ini.</p>
          : <div className="wf-table"><table className="balai-history-table" data-testid="verval-tests">
            <thead><tr><th>Jenis</th><th>Lokasi</th><th>Ulangan</th><th>Rata-rata</th><th>SD</th><th>KV</th><th>Hasil</th></tr></thead>
            <tbody>{cycle.uji.map(test => <tr key={test.konsistensi_id}>
              <td>{test.jenis_kode}</td>
              <td>{roadName(test.ruas_id)}<div className="wf-note">STA {test.sta_awal}–{test.sta_akhir}</div></td>
              <td>{test.ulangan.map(item => item.nilai).join(' · ')}<div className="wf-note">{[...new Set(test.ulangan.map(item => personName(item.rater_personel_id)))].join(', ')}</div></td>
              <td>{test.rata_rata ?? '—'}</td><td>{test.simpangan_baku ?? '—'}</td><td>{test.kv_persen == null ? '—' : `${test.kv_persen}%`}</td>
              <td><span className={`wf-status ${test.status === 'Konsisten' ? 'ok' : 'bad'}`}>{test.status}</span></td>
            </tr>)}</tbody></table></div>}

        {actions.includes('record') && capabilities?.write && <form className="wf-fields" style={{ marginTop: 12 }} onSubmit={saveTest} aria-label="Catat uji konsistensi">
          <label className="wf-field"><span>Jenis survei</span><select value={draft.jenis_survei_id} onChange={e => setDraft({ ...draft, jenis_survei_id: e.target.value })}>
            {pkg.opsi.jenis_survei.map(item => <option key={item.jenis_survei_id} value={item.jenis_survei_id}>{item.kode} · {item.nama}</option>)}</select></label>
          <label className="wf-field"><span>Tim</span><select value={draft.tim_id} onChange={e => setDraft({ ...draft, tim_id: e.target.value })}>
            {pkg.opsi.tim.map(item => <option key={item.tim_id} value={item.tim_id}>{item.nama_tim}</option>)}</select></label>
          <label className="wf-field"><span>Ruas lokasi kontrol</span><select value={draft.ruas_id} onChange={e => setDraft({ ...draft, ruas_id: e.target.value })}>
            {pkg.opsi.ruas.map(item => <option key={item.ruas_id} value={item.ruas_id}>{roadName(item.ruas_id)}</option>)}</select></label>
          <div className="wf-field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label className="wf-field"><span>STA awal (m)</span><input type="number" min="0" step="any" value={draft.sta_awal} onChange={e => setDraft({ ...draft, sta_awal: e.target.value })} /></label>
            <label className="wf-field"><span>STA akhir (m)</span><input type="number" min="0" step="any" value={draft.sta_akhir} onChange={e => setDraft({ ...draft, sta_akhir: e.target.value })} /></label>
          </div>
          <div className="wf-field full"><span>Ulangan (lintasan / rater)</span>
            {repeats.map((row, index) => <div key={index} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 140px 32px', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <span className="wf-note">Ulangan {index + 1}</span>
              <select aria-label={`Rater ulangan ${index + 1}`} value={row.rater_personel_id} onChange={e => setRepeats(list => list.map((item, i) => i === index ? { ...item, rater_personel_id: e.target.value } : item))}>
                {pkg.opsi.personel.map(item => <option key={item.personel_id} value={item.personel_id}>{item.nama}</option>)}</select>
              <input aria-label={`Nilai ulangan ${index + 1}`} type="number" step="any" value={row.nilai} placeholder={selectedType?.kode === 'IRI' ? 'IRI m/km' : 'Nilai'} onChange={e => setRepeats(list => list.map((item, i) => i === index ? { ...item, nilai: e.target.value } : item))} />
              {repeats.length > 2 ? <button type="button" className="wf-button" aria-label={`Hapus ulangan ${index + 1}`} onClick={() => setRepeats(list => list.filter((_, i) => i !== index))}>×</button> : <span />}
            </div>)}
            <button type="button" className="wf-button" style={{ marginTop: 6 }} onClick={() => setRepeats(list => [...list, { ...emptyRepeat(), rater_personel_id: list[0]?.rater_personel_id ?? '' }])}>+ Tambah ulangan</button>
          </div>
          <div className={`wf-callout ${preview ? (preview.consistent ? '' : 'danger') : 'warn'} wf-field full`} data-testid="verval-preview">
            {preview ? <>Rata-rata {preview.mean} · SD {preview.sd} · KV {preview.kv ?? '—'}% → <strong>{preview.consistent ? 'Konsisten' : 'Tidak konsisten'}</strong> ({preview.rule})</>
              : 'Isi minimal 2 nilai ulangan untuk melihat hasil konsistensi.'}</div>
          <div className="wf-toolbar wf-field full"><button type="submit" className="wf-button" data-testid="verval-save-test" disabled={busy || !preview}>{busy ? 'Menyimpan…' : 'Simpan uji konsistensi'}</button></div>
        </form>}

        {role === PROVIDER && ['BERJALAN', 'DITAHAN', 'PERLU_PERBAIKAN'].includes(cycle.status) && <div className="wf-panel" style={{ marginTop: 12 }}>
          <div className="wf-panel-head"><h4>Ajukan BA Verval 2-Mingguan</h4></div>
          <div className="wf-body">
            <ul style={{ margin: '0 0 8px', paddingLeft: 18 }}>{typeChecks.map(item => <li key={item.jenis_survei_id}>{item.kode}: {item.latest
              ? <span className={`wf-status ${item.latest.status === 'Konsisten' ? 'ok' : 'bad'}`}>{item.latest.status}</span> : <span className="wf-status warn">Belum diuji</span>}</li>)}</ul>
            <div className="wf-fields">
              <label className="wf-field"><span>Nomor BA Verval</span><input aria-label="Nomor BA Verval" value={baNumber} maxLength={100} onChange={e => setBaNumber(e.target.value)} /></label>
              <div className="wf-toolbar wf-field" style={{ alignSelf: 'end' }}>
                <button type="button" className="wf-button primary" data-testid="verval-submit" disabled={busy || !actions.includes('submit') || !baNumber.trim()} onClick={() => void submit()}>Ajukan ke PIC Balai</button>
              </div>
            </div>
            {!actions.includes('submit') && <p className="wf-note">{cycle.koreksi_terbuka > 0 ? 'Tutup kasus koreksi Verval terlebih dahulu.' : 'Catat uji konsistensi untuk setiap jenis survei paket.'}</p>}
          </div>
        </div>}

        {actions.includes('review') && <div className="wf-fields" style={{ marginTop: 12 }}>
          <label className="wf-field full"><span>Catatan pemeriksaan (wajib bila meminta perbaikan)</span><textarea aria-label="Catatan pemeriksaan Verval" value={reviewNote} maxLength={2000} onChange={e => setReviewNote(e.target.value)} /></label>
          <div className="wf-toolbar wf-field full">
            <button type="button" className="wf-button" data-testid="verval-request-fix" disabled={busy || !reviewNote.trim()} onClick={() => void review('PERLU_PERBAIKAN')}>Minta perbaikan</button>
            <button type="button" className="wf-button primary" data-testid="verval-accept" disabled={busy} onClick={() => void review('DITERIMA')}>Terima data 14 hari</button>
          </div>
        </div>}
      </div>
    </section>}

    <div className="wf-toolbar" style={{ marginTop: 24, justifyContent: 'space-between' }}>
      <button type="button" className="wf-button" onClick={() => navigate('/entry:Survei harian')}><ArrowLeft size={13} /> Kembali ke Tahap 3A (Survei Harian)</button>
      <button type="button" className="wf-button primary" onClick={() => navigate('/entry:Gerbang RNI/LRS')}>Lanjut ke Tahap 4 (Gerbang RNI/LRS) <ArrowRight size={13} /></button>
    </div>
  </div>;
}
