import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { WorkflowRole } from '../../workflow/model';
import { acceptedPercent, auditErrorMessage, getAcceptance, recordAcceptance, terminGate, type PenerimaanState, type TerminRow } from './serverAuditData';

const date = (value: string) => value ? new Date(value).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '—';
const BA_LABEL: Record<string, string> = {
  AUDIT_INTERNAL: 'BA Audit Internal', VERVAL_PENGGUNA_JASA: 'BA Verval Pengguna Jasa', VERVAL_DIREKTORAT: 'BA Verval Direktorat',
  PENERIMAAN_PARSIAL: 'BA Penerimaan parsial', PENERIMAAN_AKHIR: 'BA Penerimaan akhir',
};

function TerminRowView({ packageId, state, term, role, onState }: { packageId: string; state: PenerimaanState; term: TerminRow; role: WorkflowRole; onState: (next: PenerimaanState) => void }) {
  const gate = terminGate(state, term, role);
  const receipt = state.penerimaan.find(item => item.termin_id === term.termin_id);
  const [open, setOpen] = useState(false);
  const [ba, setBa] = useState('');
  const [final, setFinal] = useState(term.nomor === 4);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setBusy(true); setError('');
    try { onState(await recordAcceptance(packageId, term.nomor, { expected_version: term.versi, jenis: final && term.nomor === 4 ? 'AKHIR' : 'PARSIAL', nomor_ba: ba.trim() })); setOpen(false); }
    catch (reason) { setError(auditErrorMessage(reason)); } finally { setBusy(false); }
  }

  return <tr data-testid={`termin-${term.nomor}`}>
    <td><strong>T{term.nomor}</strong><div className="wf-note">{term.persen_bobot}%</div></td>
    <td>{term.output_wajib}<div className="wf-note">Batas {date(term.batas_waktu)}</div></td>
    <td>{term.status === 'Selesai'
      ? <><span className="wf-status ok">Diterima</span><div className="wf-note">{receipt?.ba ? `${BA_LABEL[receipt.ba.jenis] ?? receipt.ba.jenis} ${receipt.ba.nomor} · ${date(receipt.tanggal)}` : ''}</div></>
      : <span className="wf-status warn">Belum</span>}</td>
    <td style={{ minWidth: 220 }}>
      {gate.canRecord && !open && <button type="button" className="wf-button primary" data-testid={`termin-open-${term.nomor}`} onClick={() => setOpen(true)}>Catat penerimaan</button>}
      {gate.canRecord && open && <div className="wf-fields" style={{ gridTemplateColumns: '1fr' }}>
        <label className="wf-field"><span>Nomor BA Penerimaan</span><input value={ba} onChange={e => setBa(e.target.value)} maxLength={100} aria-label={`Nomor BA termin ${term.nomor}`} /></label>
        {term.nomor === 4 && <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={final} onChange={e => setFinal(e.target.checked)} /> Penerimaan akhir (paket SELESAI)</label>}
        <div className="wf-toolbar">
          <button type="button" className="wf-button" onClick={() => setOpen(false)} disabled={busy}>Batal</button>
          <button type="button" className="wf-button primary" data-testid={`termin-save-${term.nomor}`} onClick={() => void submit()} disabled={busy || !ba.trim()}>{busy ? 'Menyimpan…' : 'Simpan BA'}</button>
        </div>
      </div>}
      {!gate.canRecord && term.status !== 'Selesai' && <span className="wf-note">{gate.reason}</span>}
      {error && <div role="alert" className="wf-callout danger">{error}</div>}
    </td>
  </tr>;
}

/** Tahap 6: term schedule T1-T4 and BA Penerimaan, recorded by the PIC Balai. */
export function ServerAcceptanceWorkspace({ packageId, role, onNavigate }: { packageId: string; role: WorkflowRole; onNavigate: (selection: string) => void }) {
  const [state, setState] = useState<PenerimaanState | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    getAcceptance(packageId, controller.signal).then(data => { if (!controller.signal.aborted) setState(data); })
      .catch(reason => { if (!controller.signal.aborted) setError(auditErrorMessage(reason)); });
    return () => controller.abort();
  }, [packageId]);

  const update = (next: PenerimaanState) => { setState(next); window.dispatchEvent(new Event('jalamutu:package-stage-facts-refresh')); };
  const percent = state ? acceptedPercent(state) : 0;
  const finished = state?.penerimaan.some(item => item.jenis === 'AKHIR') ?? false;

  return <section className="wf" data-testid="server-acceptance-workspace" aria-label="Penerimaan data Tahap 6">
    <div className="wf-panel">
      <div className="wf-panel-head"><div><h3>Tahap 6 · Penerimaan data &amp; termin</h3><p className="wf-note">PIC Balai mencatat BA Penerimaan per termin secara berurutan. Termin 3–4 dan penerimaan akhir memerlukan Audit tingkat 3 Lulus.</p></div>
        <span className={`wf-status ${finished ? 'ok' : 'info'}`} data-testid="acceptance-status">{finished ? 'SELESAI' : `${percent}% diterima`}</span></div>
      <div className="wf-body">
        {error && <div role="alert" className="wf-callout danger">{error}</div>}
        {!state && !error && <p role="status" className="wf-note">Memuat termin dari server…</p>}
        {state && <>
          <div className="wf-kpis">
            <div className="wf-kpi"><div className="wf-kpi-label">Bobot diterima</div><div className="wf-kpi-value">{percent}%</div></div>
            <div className="wf-kpi"><div className="wf-kpi-label">Audit tingkat 3</div><div className="wf-kpi-value">{state.audit3_lulus ? 'Lulus' : 'Belum'}</div></div>
            <div className="wf-kpi"><div className="wf-kpi-label">Berita acara</div><div className="wf-kpi-value">{state.berita_acara.length}</div></div>
          </div>
          <div className="wf-meter" aria-label={`${percent}% bobot diterima`}><span style={{ display: 'block', height: '100%', width: `${percent}%`, background: '#2f7d62' }} /></div>
          {finished && <div className="wf-callout" role="status" style={{ marginTop: 12 }}><strong>Paket SELESAI</strong><p>BA Penerimaan akhir tercatat. Seluruh termin telah diterima.</p></div>}
          <div className="wf-table" style={{ marginTop: 12 }}><table className="balai-history-table">
            <thead><tr><th>Termin</th><th>Output wajib</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>{state.termin.map(term => <TerminRowView key={term.nomor} packageId={packageId} state={state} term={term} role={role} onState={update} />)}</tbody>
          </table></div>
          {state.berita_acara.length > 0 && <details style={{ marginTop: 12 }}><summary>Daftar Berita Acara ({state.berita_acara.length})</summary>
            <ul>{state.berita_acara.map(ba => <li key={ba.ba_id}>{BA_LABEL[ba.jenis] ?? ba.jenis} · {ba.nomor} · {date(ba.tanggal)}</li>)}</ul></details>}
        </>}
      </div>
    </div>
    <div className="wf-toolbar" style={{ marginTop: 24, justifyContent: 'space-between' }}>
      <button type="button" className="wf-button" onClick={() => onNavigate('/verification:Audit tingkat 1–3')}><ArrowLeft size={13} /> Kembali ke Tahap 5</button>
      <button type="button" className="wf-button primary" onClick={() => onNavigate('/packages:Ringkasan Paket')}>✓ Kembali ke Ringkasan Paket</button>
    </div>
  </section>;
}
