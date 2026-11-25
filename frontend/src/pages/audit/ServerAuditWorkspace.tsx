import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { WorkflowRole } from '../../workflow/model';
import {
  AUDIT_LEVELS, auditErrorMessage, auditGate, decideAudit, getAudit, INTERNAL_AUDIT_CHECKLIST, sampleDeviation, saveAudit,
  type AuditLevelRow, type AuditSample, type AuditState,
} from './serverAuditData';

const tone = (status: AuditLevelRow['status']) => status === 'Lulus' ? 'ok' : status === 'Ditolak' ? 'bad' : status === 'Dalam Review' ? 'info' : '';
const emptySample = (): AuditSample => ({ sta_awal: 0, sta_akhir: 100, nilai_asli: 0, nilai_verifikasi: 0, status: 'Sesuai' });

function AuditLevelCard({ packageId, state, row, role, onState, onNavigate }: {
  packageId: string; state: AuditState; row: AuditLevelRow; role: WorkflowRole; onState: (next: AuditState) => void; onNavigate: (selection: string) => void;
}) {
  const level = row.tingkat;
  const meta = AUDIT_LEVELS[level];
  const gate = auditGate(state, level, role);
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => Object.fromEntries(INTERNAL_AUDIT_CHECKLIST.map(item => [item, row.detail.checklist?.[item] ?? false])));
  const [ba, setBa] = useState(row.detail.ba_number ?? '');
  const [note, setNote] = useState(row.detail.catatan ?? '');
  const [percent, setPercent] = useState(row.persen_sampel_realisasi == null ? '' : String(row.persen_sampel_realisasi));
  const [samples, setSamples] = useState<AuditSample[]>(row.sampel.length ? row.sampel : [emptySample()]);
  const [decisionNote, setDecisionNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function run(action: () => Promise<AuditState>, done: string) {
    setBusy(true); setError(''); setMessage('');
    try { onState(await action()); setMessage(done); setDecisionNote(''); } catch (reason) { setError(auditErrorMessage(reason)); } finally { setBusy(false); }
  }
  const save = () => run(() => saveAudit(packageId, level, level === 1
    ? { expected_version: row.versi, checklist, ba_number: ba.trim(), catatan: note.trim() }
    : { expected_version: row.versi, ba_number: ba.trim(), catatan: note.trim(), persen_sampel_realisasi: Number(percent), sampel: samples }), 'Pemeriksaan tersimpan di server. Lanjutkan dengan keputusan.');
  const decide = (keputusan: 'Lulus' | 'Ditolak') => run(() => decideAudit(packageId, level, row.versi, keputusan, decisionNote.trim()),
    keputusan === 'Lulus' ? `Audit tingkat ${level} Lulus. ${meta.ba} tercatat.` : level === 1 ? 'Audit internal ditolak. Perbaiki lalu simpan ulang.' : 'Audit ditolak. Kasus koreksi dibuka otomatis untuk Penyedia.');
  const setSample = (index: number, patch: Partial<AuditSample>) => setSamples(list => list.map((item, i) => i === index ? { ...item, ...patch } : item));
  const checklistDone = INTERNAL_AUDIT_CHECKLIST.every(item => checklist[item]);
  const percentNumber = Number(percent);
  const percentOk = level === 1 || (percent !== '' && (level === 2 ? percentNumber > 0 && percentNumber <= 5 : percentNumber >= 1));

  return <section className="wf-panel" data-testid={`audit-level-${level}`} aria-label={meta.title}>
    <div className="wf-panel-head"><div><h4>{meta.title}</h4><p className="wf-note">{meta.ownerLabel} · {meta.scope}</p></div>
      <span className={`wf-status ${tone(row.status)}`} data-testid={`audit-status-${level}`}>{row.status}</span></div>
    <div className="wf-body">
      {gate.locked && row.status !== 'Lulus' && <div className="wf-callout warn" role="status">{gate.locked}
        {row.koreksi_terbuka > 0 && <> <button type="button" className="wf-button" onClick={() => onNavigate('/actions:Koreksi berbukti')}>Buka Koreksi</button></>}</div>}
      {row.status === 'Ditolak' && row.alasan_penolakan && <div className="wf-callout danger"><strong>Alasan penolakan</strong><p>{row.alasan_penolakan}</p></div>}
      {row.status === 'Lulus' && <div className="wf-callout"><strong>{meta.ba}: {row.detail.ba_number}</strong>
        <p>{row.tanggal ? `Lulus ${new Date(row.tanggal).toLocaleDateString('id-ID', { dateStyle: 'medium' })}` : 'Lulus'}{row.persen_sampel_realisasi != null && level > 1 ? ` · sampel ${row.persen_sampel_realisasi}%` : ''}{row.detail.catatan_keputusan ? ` · ${row.detail.catatan_keputusan}` : ''}</p></div>}

      {gate.canEdit && <div className="wf-fields">
        {level === 1 ? <fieldset className="wf-field full"><legend>Checklist audit data internal</legend>
          {INTERNAL_AUDIT_CHECKLIST.map(item => <label key={item} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={checklist[item]} onChange={e => setChecklist({ ...checklist, [item]: e.target.checked })} /> {item}</label>)}
        </fieldset> : <>
          <label className="wf-field"><span>Realisasi sampel (% panjang)</span><input type="number" min="0" max="100" step="0.1" value={percent} onChange={e => setPercent(e.target.value)} aria-label="Realisasi sampel" /></label>
          <p className="wf-note wf-field">{level === 2 ? 'Penilaian ulang acak tanpa data awal, maks. 5% panjang jalan.' : 'Penilaian ulang acak min. 1% (jembatan: Penilaian Tingkat Kepercayaan Data).'}</p>
          <div className="wf-field full"><span>Sampel penilaian ulang</span>
            <div className="wf-table"><table className="balai-history-table"><thead><tr><th>STA awal</th><th>STA akhir</th><th>Nilai asli</th><th>Nilai verifikasi</th><th>Selisih</th><th>Hasil</th><th /></tr></thead>
              <tbody>{samples.map((sample, index) => <tr key={index}>
                {(['sta_awal', 'sta_akhir', 'nilai_asli', 'nilai_verifikasi'] as const).map(key => <td key={key}><input type="number" step="any" style={{ width: 90 }} aria-label={`${key} ${index + 1}`} value={sample[key]} onChange={e => setSample(index, { [key]: Number(e.target.value) })} /></td>)}
                <td>{sampleDeviation(sample) == null ? '—' : `${sampleDeviation(sample)}%`}</td>
                <td><select aria-label={`hasil ${index + 1}`} value={sample.status} onChange={e => setSample(index, { status: e.target.value as AuditSample['status'] })}><option>Sesuai</option><option>Tidak Sesuai</option></select></td>
                <td>{samples.length > 1 && <button type="button" className="wf-button" onClick={() => setSamples(list => list.filter((_, i) => i !== index))} aria-label={`hapus sampel ${index + 1}`}>×</button>}</td>
              </tr>)}</tbody></table></div>
            <button type="button" className="wf-button" onClick={() => setSamples(list => [...list, emptySample()])}>+ Tambah sampel</button>
          </div>
        </>}
        <label className="wf-field"><span>Nomor {meta.ba}</span><input value={ba} onChange={e => setBa(e.target.value)} maxLength={100} aria-label="Nomor BA audit" /></label>
        <label className="wf-field"><span>Catatan pemeriksaan</span><input value={note} onChange={e => setNote(e.target.value)} maxLength={2000} aria-label="Catatan pemeriksaan" /></label>
        <div className="wf-toolbar wf-field full">
          <button type="button" className="wf-button" data-testid={`audit-save-${level}`} disabled={busy || !ba.trim() || !percentOk} onClick={() => void save()}>{busy ? 'Menyimpan…' : row.status === 'Dalam Review' ? 'Perbarui pemeriksaan' : 'Simpan pemeriksaan'}</button>
          {!percentOk && <span className="wf-note">{level === 2 ? 'Isi realisasi sampel 0–5%.' : 'Isi realisasi sampel minimal 1%.'}</span>}
        </div>
      </div>}

      {gate.canDecide && <div className="wf-fields" style={{ marginTop: 12 }}>
        <label className="wf-field full"><span>Catatan keputusan (wajib bila menolak)</span><textarea value={decisionNote} onChange={e => setDecisionNote(e.target.value)} maxLength={2000} aria-label="Catatan keputusan" /></label>
        <div className="wf-toolbar wf-field full">
          <button type="button" className="wf-button" data-testid={`audit-reject-${level}`} disabled={busy || !decisionNote.trim()} onClick={() => void decide('Ditolak')}>Tolak{level > 1 ? ' & buka koreksi' : ''}</button>
          <button type="button" className="wf-button primary" data-testid={`audit-pass-${level}`} disabled={busy || (level === 1 && !checklistDone)} onClick={() => void decide('Lulus')}>Nyatakan Lulus</button>
          {level === 1 && !checklistDone && <span className="wf-note">Lengkapi checklist dan simpan sebelum menyatakan Lulus.</span>}
        </div>
      </div>}
      {!gate.canEdit && !gate.locked && row.status !== 'Lulus' && <p className="wf-note">Dikerjakan oleh {meta.ownerLabel}.</p>}
      {error && <div role="alert" className="wf-callout danger">{error}</div>}
      {message && <div role="status" className="wf-callout">{message}</div>}
    </div>
  </section>;
}

/** Tahap 5: tiered audit on the server (Penyedia → PIC Balai → Direktorat). */
export function ServerAuditWorkspace({ packageId, role, onNavigate }: { packageId: string; role: WorkflowRole; onNavigate: (selection: string) => void }) {
  const [state, setState] = useState<AuditState | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    getAudit(packageId, controller.signal).then(data => { if (!controller.signal.aborted) setState(data); })
      .catch(reason => { if (!controller.signal.aborted) setError(auditErrorMessage(reason)); });
    return () => controller.abort();
  }, [packageId, revision]);

  const update = (next: AuditState) => { setState(next); window.dispatchEvent(new CustomEvent('jalamutu:package-stage-facts-refresh', { detail: { packageId } })); };
  const passed = state?.tingkat.filter(row => row.status === 'Lulus').length ?? 0;

  return <section className="wf" data-testid="server-audit-workspace" aria-label="Audit berjenjang Tahap 5">
    <div className="wf-panel">
      <div className="wf-panel-head"><div><h3>Tahap 5 · Audit berjenjang</h3><p className="wf-note">Tingkat 1 Penyedia (100% data) → Tingkat 2 Pengguna Jasa (maks. 5%) → Tingkat 3 Direktorat (min. 1%). Penolakan tingkat 2–3 membuka kasus koreksi.</p></div>
        <span className={`wf-status ${passed === 3 ? 'ok' : 'info'}`}>{passed}/3 Lulus</span></div>
      <div className="wf-body">
        <div className="wf-meter" aria-label={`${passed} dari 3 tingkat audit Lulus`}><span style={{ display: 'block', height: '100%', width: `${passed * 100 / 3}%`, background: '#2f7d62' }} /></div>
        {error && <div role="alert" className="wf-callout danger">{error} <button type="button" className="wf-button" onClick={() => setRevision(v => v + 1)}>Coba lagi</button></div>}
        {!state && !error && <p role="status" className="wf-note">Memuat audit dari server…</p>}
      </div>
    </div>
    {state?.tingkat.map(row => <AuditLevelCard key={row.tingkat} packageId={packageId} state={state} row={row} role={role} onState={update} onNavigate={onNavigate} />)}
    <div className="wf-toolbar" style={{ marginTop: 24, justifyContent: 'space-between' }}>
      <button type="button" className="wf-button" onClick={() => onNavigate('/entry:Gerbang RNI/LRS')}><ArrowLeft size={13} /> Kembali ke Tahap 4</button>
      <button type="button" className="wf-button primary" onClick={() => onNavigate('/reports:Penerimaan & termin')}>Lanjut ke Tahap 6 (Penerimaan) <ArrowRight size={13} /></button>
    </div>
  </section>;
}
