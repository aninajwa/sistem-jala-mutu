import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react';
import { apiRequest } from '../../auth/client';
import { SURVEY_TYPES, type CorrectionCase, type WorkflowRole } from '../../workflow/model';
import { getCorrectionDetail, mapCorrectionRpcError } from './serverCorrectionData';
import { serverCaseToCorrection } from './serverCorrectionAdapter';
import { availableCorrectionActions, performCorrectionAction, retestOwner, type CorrectionAction } from './serverCorrectionActions';

const ACTION_TYPES = ['Survei ulang sebagian ruas', 'Survei ulang seluruh ruas', 'Penilaian ulang (re-rating)', 'Ambil ulang foto/video',
  'Pelatihan ulang personel', 'Kalibrasi ulang alat', 'Penggantian komponen alat', 'Penggantian personel',
  'Koreksi pemrosesan dengan bukti', 'Investigasi keterlambatan dan rencana tindak lanjut'];
const ROOT_CAUSES = ['Alat', 'Personel', 'Metode', 'Kondisi lapangan', 'Pemrosesan'];
const LABEL: Record<CorrectionAction, string> = {
  edit: 'Simpan usulan', verify_surveyor: 'Verifikasi Surveyor', unverify_surveyor: 'Batalkan verifikasi Surveyor',
  verify_team_leader: 'Verifikasi Team Leader', unverify_team_leader: 'Batalkan verifikasi Team Leader', submit: 'Ajukan ke PIC Balai',
  verify_balai: 'Verifikasi bukti (Balai)', approve: 'Setujui tindakan', revise: 'Minta revisi', execute: 'Catat pelaksanaan',
  retest: 'Catat uji ulang', close: 'Tutup kasus',
};
const today = () => new Date().toISOString().slice(0, 10);

/** Server-backed correction case workspace (Dirah styling); every action is validated again by the server. */
export function ServerCorrectionWorkspace({ packageId, role, correctionId, onBack }: {
  packageId: string; role: WorkflowRole; correctionId: string | null; onBack: () => void;
}) {
  const [item, setItem] = useState<CorrectionCase | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [form, setForm] = useState<Record<string, string>>({});
  const [passed, setPassed] = useState(true);
  const set = (key: string) => (event: { target: { value: string } }) => setForm(current => ({ ...current, [key]: event.target.value }));

  useEffect(() => {
    if (!correctionId) { setItem(null); return; }
    const controller = new AbortController();
    setError('');
    getCorrectionDetail(packageId, Number(correctionId), controller.signal)
      .then(row => { if (!controller.signal.aborted) setItem(serverCaseToCorrection(row)); })
      .catch(cause => { if (!controller.signal.aborted) setError(mapCorrectionRpcError(cause)); });
    return () => controller.abort();
  }, [packageId, correctionId, revision]);

  useEffect(() => {
    if (!item) return;
    setForm({ root_cause: item.rootCause, field_data_valid: item.fieldDataValid, action_type: item.actionType, evidence: item.evidence,
      original_value: item.originalValue, proposed_value: item.proposedValue, note: '', reference: '' });
  }, [item?.id, item?.serverVersion]);

  async function run(action: CorrectionAction) {
    if (!item || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const patch = action === 'edit' ? Object.fromEntries(['root_cause', 'field_data_valid', 'action_type', 'evidence', 'original_value', 'proposed_value']
        .map(key => [key, form[key] ?? ''])) : undefined;
      await performCorrectionAction(packageId, item, action, { patch, note: form.note, reference: form.reference, passed });
      setNotice(`${LABEL[action]}: tersimpan di server.`);
      setRevision(value => value + 1);
    } catch (cause) {
      setError(mapCorrectionRpcError(cause));
      setRevision(value => value + 1);
    } finally { setBusy(false); }
  }

  async function create(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try {
      const body = { source: form.source || 'Temuan pemeriksaan', blocked_stage: form.blocked_stage || 'Validasi produksi', road: form.road || '',
        stationing: form.stationing || '', rejection_reason: form.rejection_reason || '', severity: form.severity || 'Minor',
        owner: 'Penyedia Jasa', due_date: form.due_date || today(), survey_type: form.survey_type || 'IRI' };
      const created = await apiRequest<{ data: { koreksi_data: Array<{ koreksi_data: { koreksi_id: number } }> } }>(
        `/paket/${encodeURIComponent(packageId)}/koreksi`, { method: 'POST', body: JSON.stringify(body) });
      const id = created.data.koreksi_data[0]?.koreksi_data.koreksi_id;
      const url = new URL(window.location.href); url.searchParams.set('koreksi', String(id));
      window.history.replaceState(window.history.state, '', url);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (cause) { setError(mapCorrectionRpcError(cause)); } finally { setBusy(false); }
  }

  const header = (
    <div className="wf-panel-head">
      <h3>{item ? `Kasus koreksi #${item.id}` : 'Buka kasus koreksi'}</h3>
      <div className="wf-toolbar">
        <button type="button" className="wf-button" onClick={onBack}><ArrowLeft size={14} /> Daftar koreksi</button>
        {item && <button type="button" className="wf-button" onClick={() => setRevision(value => value + 1)} disabled={busy}><RefreshCw size={14} /> Muat ulang</button>}
      </div>
    </div>
  );

  if (!correctionId) {
    if (role !== 'Penyedia Jasa / Ketua Tim') {
      return <section className="wf-panel">{header}<div className="wf-body"><p className="wf-note">Pilih kasus dari daftar Tindakan Perbaikan.</p></div></section>;
    }
    return (
      <section className="wf-panel" data-testid="server-correction-create">{header}
        <form className="wf-body" onSubmit={create}>
          <label>Jenis survei<select value={form.survey_type ?? 'IRI'} onChange={set('survey_type')}>{SURVEY_TYPES.map(type => <option key={type}>{type}</option>)}</select></label>
          <label>Tahap tertahan<input required value={form.blocked_stage ?? 'Validasi produksi'} onChange={set('blocked_stage')} /></label>
          <label>Sumber temuan<input required value={form.source ?? 'Temuan pemeriksaan'} onChange={set('source')} /></label>
          <label>Ruas<input required value={form.road ?? ''} onChange={set('road')} /></label>
          <label>STA<input value={form.stationing ?? ''} onChange={set('stationing')} /></label>
          <label>Alasan penolakan / temuan<textarea required value={form.rejection_reason ?? ''} onChange={set('rejection_reason')} /></label>
          <label>Tingkat<select value={form.severity ?? 'Minor'} onChange={set('severity')}><option>Minor</option><option>Mayor</option><option>Kritis</option></select></label>
          <label>Tenggat<input type="date" required value={form.due_date ?? today()} onChange={set('due_date')} /></label>
          {error && <p role="alert" className="wf-callout danger">{error}</p>}
          <button type="submit" className="wf-button primary" disabled={busy}>{busy ? 'Menyimpan…' : 'Buka kasus'}</button>
        </form>
      </section>
    );
  }

  const actions = item ? availableCorrectionActions(item, role) : [];
  const v = item?.verification ?? { surveyor: false, teamLeader: false, balai: false };
  return (
    <section className="wf-panel" data-testid="server-correction-workspace">{header}
      <div className="wf-body">
        {!item && !error && <p role="status">Memuat kasus dari server…</p>}
        {item && <>
          <div className="package-readonly-grid">
            {[['Status', item.status], ['Persetujuan', item.approval], ['Uji ulang', item.retest], ['Jenis survei', item.surveyType],
              ['Tahap tertahan', item.blockedStage], ['Ruas', `${item.road}${item.stationing ? ` · ${item.stationing}` : ''}`], ['Tingkat', item.severity],
              ['Tenggat', item.dueDate || 'Belum diisi'], ['Uji ulang & penutupan', retestOwner(item.blockedStage)]]
              .map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}
          </div>
          <p><strong>Temuan:</strong> {item.rejectionReason}</p>
          <p className="wf-note">Verifikasi: {[['Surveyor', v.surveyor], ['Team Leader', v.teamLeader], ['Balai', v.balai]]
            .map(([label, ok]) => `${label} ${ok ? '✓' : '—'}`).join(' · ')}</p>
          {item.reviewNote && <div className="review-note"><small>CATATAN PIC</small><p>{item.reviewNote}</p></div>}
          {item.executionReference && <p className="wf-note">Pelaksanaan: {item.executionReference}</p>}
          {item.retestReference && <p className="wf-note">Uji ulang: {item.retestReference}</p>}

          {actions.includes('edit') && (
            <fieldset className="wf-panel" disabled={busy}><legend>Usulan tindakan</legend>
              <label>Akar masalah<select value={form.root_cause ?? ''} onChange={set('root_cause')}><option value="">Pilih</option>{ROOT_CAUSES.map(x => <option key={x}>{x}</option>)}</select></label>
              <label>Data lapangan valid?<select value={form.field_data_valid ?? ''} onChange={set('field_data_valid')}><option value="">Pilih</option><option>Ya</option><option>Tidak</option><option>Tidak Berlaku</option></select></label>
              <label>Jenis tindakan<select value={form.action_type ?? ''} onChange={set('action_type')}><option value="">Pilih</option>{ACTION_TYPES.map(x => <option key={x}>{x}</option>)}</select></label>
              <label>Bukti / rencana<textarea value={form.evidence ?? ''} onChange={set('evidence')} /></label>
              {form.field_data_valid === 'Ya' && <>
                <label>Nilai asli<input value={form.original_value ?? ''} onChange={set('original_value')} /></label>
                <label>Nilai usulan<input value={form.proposed_value ?? ''} onChange={set('proposed_value')} /></label>
              </>}
              <p className="wf-note">Menyimpan usulan mengembalikan kasus ke Terbuka dan mengulang verifikasi.</p>
            </fieldset>
          )}
          {(actions.includes('revise') || actions.includes('approve')) && <label>Catatan PIC<textarea value={form.note ?? ''} onChange={set('note')} placeholder="Wajib untuk minta revisi" /></label>}
          {(actions.includes('execute') || actions.includes('retest')) && <label>Referensi {actions.includes('execute') ? 'pelaksanaan' : 'uji ulang'}<input value={form.reference ?? ''} onChange={set('reference')} /></label>}
          {actions.includes('retest') && <label><input type="checkbox" checked={passed} onChange={event => setPassed(event.target.checked)} /> Hasil uji ulang Lulus</label>}

          <div className="wf-toolbar" style={{ marginTop: 12, flexWrap: 'wrap' }}>
            {actions.map(action => (
              <button key={action} type="button" data-testid={`correction-action-${action}`}
                className={['submit', 'approve', 'execute', 'close'].includes(action) ? 'wf-button primary' : 'wf-button'}
                disabled={busy} onClick={() => void run(action)}>{LABEL[action]}</button>
            ))}
            {!actions.length && <p className="wf-note">{item.status === 'Ditutup' ? 'Kasus sudah ditutup.' : 'Tidak ada tindakan untuk peran Anda pada status ini.'}</p>}
          </div>
        </>}
        {notice && <p role="status" className="wf-note"><CheckCircle2 size={14} /> {notice}</p>}
        {error && <p role="alert" className="wf-callout danger">{error}</p>}
      </div>
    </section>
  );
}
