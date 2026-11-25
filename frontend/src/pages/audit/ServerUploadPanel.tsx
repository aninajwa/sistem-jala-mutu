import { useEffect, useState, type FormEvent } from 'react';
import type { WorkflowRole } from '../../workflow/model';
import { auditErrorMessage, getUploads, latestUploadBySurvey, PROVIDER, recordUpload, type UploadState } from './serverAuditData';

const when = (value: string) => value ? new Date(value).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

/** Tahap 4: Penyedia records each upload to SMD Jalan / INVI-J / InSlope / InDrain (no API integration yet). */
export function ServerUploadPanel({ packageId, role, locked, onChanged }: { packageId: string; role: WorkflowRole; locked: boolean; onChanged: () => void }) {
  const [state, setState] = useState<UploadState | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState({ jenis_survei_id: '', sistem_id: '', status: 'VALID' as 'VALID' | 'ERROR', jumlah_record: '', pesan: '' });

  useEffect(() => {
    const controller = new AbortController();
    getUploads(packageId, controller.signal).then(data => {
      if (controller.signal.aborted) return;
      setState(data);
      setDraft(current => ({ ...current, jenis_survei_id: current.jenis_survei_id || String(data.jenis_survei[0]?.jenis_survei_id ?? ''), sistem_id: current.sistem_id || String((data.sistem.find(item => item.nama === 'SMD Jalan') ?? data.sistem[0])?.sistem_id ?? '') }));
    }).catch(reason => { if (!controller.signal.aborted) setError(auditErrorMessage(reason)); });
    return () => controller.abort();
  }, [packageId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const data = await recordUpload(packageId, {
        jenis_survei_id: Number(draft.jenis_survei_id), sistem_id: Number(draft.sistem_id), status: draft.status,
        jumlah_record: draft.jumlah_record === '' ? null : Number(draft.jumlah_record),
        pesan: draft.status === 'ERROR' && draft.pesan.trim() ? draft.pesan.split('\n').map(line => line.trim()).filter(Boolean).map(pesan => ({ pesan })) : [],
      });
      setState(data);
      setDraft(current => ({ ...current, jumlah_record: '', pesan: '' }));
      setMessage(draft.status === 'VALID' ? 'Upload VALID tercatat di server.' : 'Upload ERROR tercatat. Perbaiki data lalu catat upload ulang.');
      onChanged();
    } catch (reason) { setError(auditErrorMessage(reason)); } finally { setBusy(false); }
  }

  const systemName = (id: number) => state?.sistem.find(item => item.sistem_id === id)?.nama ?? `Sistem ${id}`;
  const surveys = state ? latestUploadBySurvey(state) : [];
  const allValid = surveys.length > 0 && surveys.every(item => item.latest?.status === 'VALID');
  const canWrite = role === PROVIDER && !locked;

  return <section className="wf-panel" data-testid="server-upload-panel" aria-label="Upload ke sistem">
    <div className="wf-panel-head"><h4>Upload data ke sistem</h4>
      {state && <span className={`wf-status ${allValid ? 'ok' : 'warn'}`}>{allValid ? 'Semua jenis survei VALID' : 'Belum semua VALID'}</span>}</div>
    <div className="wf-body">
      <p className="wf-note">Integrasi API SMD Jalan / INVI-J / InSlope / InDrain belum tersedia. Penyedia mencatat hasil validasi sistem secara manual; upload terakhir tiap jenis survei harus VALID sebelum Tahap 4 diajukan.</p>
      {error && <div role="alert" className="wf-callout danger">{error}</div>}
      {!state && !error && <p role="status" className="wf-note">Memuat catatan upload…</p>}
      {state && <>
        <div className="wf-kpis">
          {surveys.map(item => <div className="wf-kpi" key={item.jenis_survei_id} data-testid={`upload-survey-${item.nama}`}>
            <div className="wf-kpi-label">{item.nama}</div>
            <div className="wf-kpi-value">{item.latest?.status ?? '—'}</div>
            <div className="wf-note">{item.latest ? `${systemName(item.latest.sistem_id)} · ${when(item.latest.waktu_upload)}` : 'Belum ada upload'}</div>
          </div>)}
        </div>
        {canWrite && <form className="wf-fields" onSubmit={submit} aria-label="Catat upload">
          <label className="wf-field"><span>Jenis survei</span><select value={draft.jenis_survei_id} onChange={e => setDraft({ ...draft, jenis_survei_id: e.target.value })} required>
            {state.jenis_survei.map(item => <option key={item.jenis_survei_id} value={item.jenis_survei_id}>{item.nama}</option>)}</select></label>
          <label className="wf-field"><span>Sistem tujuan</span><select value={draft.sistem_id} onChange={e => setDraft({ ...draft, sistem_id: e.target.value })} required>
            {state.sistem.map(item => <option key={item.sistem_id} value={item.sistem_id}>{item.nama}</option>)}</select></label>
          <label className="wf-field"><span>Status validasi sistem</span><select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as 'VALID' | 'ERROR' })}>
            <option value="VALID">VALID</option><option value="ERROR">ERROR</option></select></label>
          <label className="wf-field"><span>Jumlah record</span><input type="number" min="0" step="1" value={draft.jumlah_record} onChange={e => setDraft({ ...draft, jumlah_record: e.target.value })} /></label>
          {draft.status === 'ERROR' && <label className="wf-field full"><span>Pesan error sistem (satu per baris)</span><textarea value={draft.pesan} onChange={e => setDraft({ ...draft, pesan: e.target.value })} maxLength={4000} /></label>}
          <div className="wf-toolbar wf-field full"><button type="submit" className="wf-button primary" disabled={busy || !draft.jenis_survei_id || !draft.sistem_id}>{busy ? 'Menyimpan…' : 'Catat upload'}</button></div>
        </form>}
        {role === PROVIDER && locked && <p className="wf-note">Catatan upload dikunci selama Tahap 4 ditinjau atau sudah disetujui.</p>}
        {message && <div role="status" className="wf-callout">{message}</div>}
        {state.upload.length > 0 && <details>
          <summary>Riwayat upload ({state.upload.length})</summary>
          <div className="wf-table"><table className="balai-history-table">
            <thead><tr><th>Waktu</th><th>Jenis</th><th>Sistem</th><th>Record</th><th>Status</th><th>Pesan</th></tr></thead>
            <tbody>{state.upload.map(row => <tr key={row.upload_id}>
              <td>{when(row.waktu_upload)}</td>
              <td>{state.jenis_survei.find(item => item.jenis_survei_id === row.jenis_survei_id)?.nama ?? row.jenis_survei_id}</td>
              <td>{systemName(row.sistem_id)}</td><td>{row.jumlah_record ?? '—'}</td>
              <td><span className={`wf-status ${row.status === 'VALID' ? 'ok' : 'bad'}`}>{row.status}</span></td>
              <td>{row.pesan.map(item => item.pesan).join('; ') || '—'}</td>
            </tr>)}</tbody>
          </table></div>
        </details>}
      </>}
    </div>
  </section>;
}
