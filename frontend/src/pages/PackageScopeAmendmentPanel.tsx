import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw, Send, XCircle } from 'lucide-react';
import { ApiError, apiRequest } from '../auth/client';
import type { WorkflowRole } from '../workflow/model';
import type { SurveyCatalogOption } from '../workflow/declaredPackageSurveyScope';
import {
  getPackageScopeAmendmentState,
  reviewPackageScopeAmendment,
  submitPackageScopeAmendment,
  type PackageScopeAmendment,
  type PackageScopeAmendmentState,
} from './packageScopeAmendmentData';

function message(error: unknown) {
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : 'Permohonan penambahan jenis survei belum dapat diproses.';
}

function surveyLabel(survey: SurveyCatalogOption) {
  return `${survey.kode || `Survei #${survey.jenis_survei_id}`}${survey.nama && survey.nama !== survey.kode ? ` · ${survey.nama}` : ''}`;
}

function statusLabel(status: PackageScopeAmendment['status']) {
  if (status === 'DISETUJUI') return 'Disetujui PIC';
  if (status === 'DITOLAK') return 'Ditolak PIC';
  return 'Menunggu keputusan PIC';
}

export function PackageScopeAmendmentPanel({
  packageId,
  role,
  preparationStatus,
  catalog,
}: {
  packageId: string;
  role: WorkflowRole;
  preparationStatus: string | undefined;
  catalog: SurveyCatalogOption[];
}) {
  const [state, setState] = useState<PackageScopeAmendmentState | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | 'submit' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);

  const isProvider = role === 'Penyedia Jasa / Ketua Tim';
  const isPic = role === 'PIC Balai / Pengguna Jasa';
  const pending = state?.pindaan.find(item => item.status === 'DIAJUKAN');
  const existingIds = new Set(state?.scope_efektif.surveys.map(item => item.jenis_survei_id) ?? []);
  const requestOptions = useMemo(() => catalog
    .filter(item => item.aktif === true && !existingIds.has(item.jenis_survei_id))
    .sort((a, b) => a.jenis_survei_id - b.jenis_survei_id), [catalog, state]);
  const pendingIsStale = !!pending && state?.scope_efektif.version !== pending.expected_scope_version;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getPackageScopeAmendmentState(packageId, apiRequest).then(value => {
      if (!active) return;
      setState(value);
      setSelectedIds([]);
    }).catch(cause => {
      if (active) setError(message(cause));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [packageId, revision]);

  async function refresh() {
    setError('');
    setNotice('');
    setRevision(value => value + 1);
  }

  async function submit() {
    if (!state || state.scope_efektif.version === null || !selectedIds.length || pending || busyId) return;
    setError('');
    setNotice('');
    setBusyId('submit');
    try {
      const next = await submitPackageScopeAmendment(
        packageId, state.scope_efektif.version, selectedIds, apiRequest,
      );
      setState(next);
      setSelectedIds([]);
      setNotice('Permohonan penambahan jenis survei telah direkod dan menunggu keputusan PIC. Scope rasmi belum berubah.');
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusyId(null);
    }
  }

  async function decide(amendment: PackageScopeAmendment, decision: 'DISETUJUI' | 'DITOLAK') {
    if (busyId || (decision === 'DITOLAK' && !note.trim())) return;
    setError('');
    setNotice('');
    setBusyId(amendment.pindaan_id);
    try {
      const next = await reviewPackageScopeAmendment(packageId, amendment, decision, note, apiRequest);
      setState(next);
      setNote('');
      setNotice(decision === 'DISETUJUI'
        ? 'Pindaan diluluskan. Scope rasmi telah dikemas kini; semakan kalibrasi Tahap 1 perlu disahkan semula.'
        : 'Pindaan ditolak. Scope rasmi dan rekod operasi tidak berubah.');
      window.dispatchEvent(new CustomEvent('jalamutu:package-stage-facts-refresh', {
        detail: { packageId },
      }));
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="wf-panel" aria-labelledby={`scope-amendment-title-${packageId}`}>
      <div className="wf-panel-head">
        <h3 id={`scope-amendment-title-${packageId}`}>Permohonan penambahan jenis survei</h3>
        <button type="button" className="wf-button" onClick={() => void refresh()} disabled={loading || busyId !== null}>
          <RefreshCw size={13} /> Muat ulang
        </button>
      </div>
      <div className="wf-body">
        <p className="wf-note">Jenis survei kontrak yang sudah disetujui tetap terkunci. Permohonan ini tidak mengubah scope rasmi, kalibrasi, atau hitungan Tahap 2 sebelum disetujui PIC.</p>

        {loading && <p role="status">Memuat status permohonan dari server…</p>}
        {error && <p role="alert" className="wf-callout danger">{error}</p>}
        {notice && <p role="status" className="wf-callout">{notice}</p>}

        {state && (
          <>
            <div className="wf-callout">
              <strong>Scope rasmi · versi {state.scope_efektif.version ?? 'belum ditetapkan'}</strong>
              <div>{state.scope_efektif.surveys.map(surveyLabel).join(', ') || 'Belum ada jenis survei rasmi.'}</div>
            </div>

            {isProvider && (
              <fieldset className="scope-editor" disabled={busyId !== null || loading || !!pending}>
                <legend>Jenis survei tambahan yang diminta</legend>
                {preparationStatus !== 'DISETUJUI' && (
                  <p className="wf-note">Permohonan tersedia selepas Tahap 0 disetujui PIC.</p>
                )}
                {preparationStatus === 'DISETUJUI' && !pending && state.scope_efektif.version === null && (
                  <p className="wf-note">Scope rasmi belum ditetapkan. Permohonan tambahan memerlukan scope awal yang tersimpan.</p>
                )}
                {pending && <p className="wf-note">Masih ada permohonan yang menunggu keputusan. Permohonan baru dibuka selepas PIC memutuskan permohonan ini.</p>}
                {!requestOptions.length && !pending && <p className="wf-note">Tidak ada jenis survei aktif lain dalam katalog.</p>}
                <div className="survey-selection-options">
                  {requestOptions.map(item => (
                    <label key={item.jenis_survei_id} className="survey-selection-option">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.jenis_survei_id)}
                        onChange={event => setSelectedIds(current => event.target.checked
                          ? [...new Set([...current, item.jenis_survei_id])].sort((a, b) => a - b)
                          : current.filter(id => id !== item.jenis_survei_id))}
                      />
                      <span><strong>{item.kode || `Survei #${item.jenis_survei_id}`}</strong>{item.nama && <small>{item.nama}</small>}</span>
                    </label>
                  ))}
                </div>
                <div className="wf-toolbar" style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    className="wf-button primary"
                    disabled={preparationStatus !== 'DISETUJUI' || state.scope_efektif.version === null ||
                      !selectedIds.length || !!pending || busyId !== null}
                    onClick={() => void submit()}
                  >
                    <Send size={13} /> {busyId === 'submit' ? 'Mengajukan…' : 'Ajukan kepada PIC'}
                  </button>
                </div>
              </fieldset>
            )}

            {isPic && pending && (
              <div className="wf-callout">
                <strong>Permohonan #{pending.pindaan_id} · {statusLabel(pending.status)}</strong>
                {pendingIsStale && <p role="alert">Versi scope berubah sejak permohonan dibuat. Permohonan ini tidak boleh disetujui; muat ulang dan tolak dengan catatan, kemudian Penyedia boleh mengajukan permohonan baru.</p>}
                <p>Scope asal versi {pending.expected_scope_version}: {pending.skop_asal.map(surveyLabel).join(', ')}</p>
                <p>Tambahan diminta: {pending.tambahan_diminta.map(surveyLabel).join(', ')}</p>
                <p className="wf-note">Diajukan {dateLabel(pending.diajukan_pada)} · Penyedia #{pending.diajukan_oleh}</p>
                <label className="wf-field">
                  <span>Catatan keputusan {note.length}/2000 {note.trim() ? '' : '(wajib jika ditolak)'}</span>
                  <textarea rows={3} maxLength={2000} value={note} disabled={busyId !== null}
                    onChange={event => setNote(event.target.value)} />
                </label>
                <div className="wf-toolbar" style={{ marginTop: 10 }}>
                  <button type="button" className="wf-button primary" disabled={busyId !== null || pendingIsStale}
                    onClick={() => void decide(pending, 'DISETUJUI')}>
                    <CheckCircle2 size={13} /> {busyId === pending.pindaan_id ? 'Memproses…' : pendingIsStale ? 'Scope berubah' : 'Setujui penambahan'}
                  </button>
                  <button type="button" className="wf-button" disabled={busyId !== null || !note.trim()}
                    onClick={() => void decide(pending, 'DITOLAK')}>
                    <XCircle size={13} /> Tolak permohonan
                  </button>
                </div>
              </div>
            )}

            <div aria-label="Riwayat permohonan scope">
              <h4>Riwayat permohonan</h4>
              {!state.pindaan.length && <p className="wf-note">Belum ada permohonan penambahan jenis survei.</p>}
              {state.pindaan.map(item => (
                <div className="wf-callout" key={item.pindaan_id}>
                  <strong>#{item.pindaan_id} · {statusLabel(item.status)}</strong>
                  <div>{item.tambahan_diminta.map(surveyLabel).join(', ')}</div>
                  <small>Diajukan {dateLabel(item.diajukan_pada)} · versi scope {item.expected_scope_version}</small>
                  {item.direview_pada && <small> · Diputuskan {dateLabel(item.direview_pada)}</small>}
                  {item.catatan_pic && <div>Catatan PIC: {item.catatan_pic}</div>}
                </div>
              ))}
            </div>
          </>
        )}

        {!state && !loading && (
          <p className="wf-note">Status pindaan tidak dapat dipaparkan. Scope yang tersedia dalam panel lain tidak menggantikan bacaan rasmi riwayat pindaan.</p>
        )}
      </div>
    </section>
  );
}

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}
