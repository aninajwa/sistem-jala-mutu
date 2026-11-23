import { useEffect, useState } from 'react';
import { CheckCircle2, FileCheck2, RefreshCw, Send } from 'lucide-react';
import { ApiError, apiRequest } from '../auth/client';
import type { WorkflowRole } from '../workflow/model';
import {
  getStage1Confirmation,
  reviewStage1Confirmation,
  Stage1ConfirmationOutcomeUncertainError,
  stage1ConfirmationBlockers,
  stage1ConfirmationSurveyCount,
  submitStage1Confirmation,
  type Stage1Confirmation,
} from './stage1ConfirmationData';

function errorMessage(error: unknown) {
  return error instanceof ApiError || error instanceof Error
    ? error.message
    : 'Konfirmasi kalibrasi belum dapat diproses.';
}

function statusLabel(state: Stage1Confirmation) {
  if (!state.aktif) return 'Belum diaktifkan';
  if (state.status === 'BELUM_DIAJUKAN') return 'Belum diajukan';
  if (state.status === 'DIAJUKAN' && !state.snapshot_sesuai) return 'Snapshot berubah · perlu dikirim ulang';
  if (state.status === 'DISETUJUI' && !state.snapshot_sesuai) return 'Konfirmasi kedaluwarsa · rekod berubah';
  if (state.status === 'DISETUJUI') return 'Dikonfirmasi PIC · Tahap 2 diizinkan';
  if (state.status === 'PERLU_REVISI') return 'Perlu koreksi · menunggu pengajuan ulang';
  return 'Menunggu keputusan PIC';
}

export function Stage1PicConfirmationPanel({
  packageId,
  role,
  onEditRecords,
}: {
  packageId: string;
  role: WorkflowRole;
  onEditRecords: () => void;
}) {
  const provider = role === 'Penyedia Jasa / Ketua Tim';
  const pic = role === 'PIC Balai / Pengguna Jasa';
  const [state, setState] = useState<Stage1Confirmation | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshRequired, setRefreshRequired] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const blockers = state ? stage1ConfirmationBlockers(state) : [];
  const surveyCount = state?.aktif ? stage1ConfirmationSurveyCount(state) : null;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getStage1Confirmation(packageId, apiRequest, controller.signal).then(next => {
      if (controller.signal.aborted) return;
      setState(next);
      setRefreshRequired(false);
    }).catch(cause => {
      if (!controller.signal.aborted) setError(errorMessage(cause));
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

  async function submit() {
    if (!provider || !state?.aktif || blockers.length > 0 || busy || refreshRequired) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const next = await submitStage1Confirmation(packageId, state.versi, apiRequest);
      setState(next);
      setNotice('Permintaan konfirmasi tersimpan. PIC akan menilai snapshot rekod yang dikirim.');
    } catch (cause) {
      const text = errorMessage(cause);
      setError(text);
      if (cause instanceof ApiError && cause.status === 409) setRefreshRequired(true);
      if (cause instanceof Stage1ConfirmationOutcomeUncertainError) setRefreshRequired(true);
    } finally {
      setBusy(false);
    }
  }

  async function decide(decision: 'DISETUJUI' | 'PERLU_REVISI') {
    if (!pic || !state?.aktif || state.status !== 'DIAJUKAN' || !state.snapshot_sesuai || busy || refreshRequired) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const next = await reviewStage1Confirmation(packageId, {
        expected_version: state.versi,
        keputusan: decision,
        catatan: reviewNote,
      }, apiRequest);
      setState(next);
      window.dispatchEvent(new CustomEvent('jalamutu:package-stage-facts-refresh', {
        detail: { packageId },
      }));
      setReviewNote('');
      setNotice(decision === 'DISETUJUI'
        ? 'Kesesuaian kalibrasi dikonfirmasi PIC. Gate Tahap 2 mengikuti status server.'
        : 'Koreksi diminta. Provider harus memperbarui rekod dan mengirim ulang.');
    } catch (cause) {
      const text = errorMessage(cause);
      setError(text);
      if (cause instanceof ApiError && cause.status === 409) setRefreshRequired(true);
      if (cause instanceof Stage1ConfirmationOutcomeUncertainError) setRefreshRequired(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="wf-panel" data-testid="stage1-pic-confirmation">
      <div className="wf-panel-head">
        <h3><FileCheck2 size={15} /> Konfirmasi Kesesuaian Kalibrasi · Provider → PIC Balai</h3>
        <button type="button" className="wf-button" onClick={() => setRevision(value => value + 1)} disabled={loading || busy}>
          <RefreshCw size={13} /> Muat ulang status
        </button>
      </div>
      <div className="wf-body">
        <div className="wf-callout" data-testid="stage1-confirmation-preparation">
          <strong>Persiapan yang ditinjau PIC · K1–K6</strong>
          <ul>
            <li>Scope survei kontrak yang dinyatakan dan lokasi/tim paket terkait.</li>
            <li>Data alat, personel, sertifikat dan bukti pelatihan yang tersimpan.</li>
            <li>Jenis kalibrasi alat, catatan kalibrasi alat dan kalibrasi rater.</li>
            <li>Anggota tim, kualifikasi, serta checklist kalibrasi per survei yang sudah tersimpan.</li>
          </ul>
          <p>
            Daftar ini menjelaskan bahan snapshot, bukan manifest kelengkapan resmi. Tidak ada PASS otomatis dari jumlah jawaban;
            K7 tetap keputusan PIC Balai berdasarkan rekod dan standar yang berlaku.
          </p>
        </div>
        {loading && <p role="status">Membaca status konfirmasi paket dari server…</p>}
        {error && <div role="alert" className="wf-callout danger">{error}</div>}
        {notice && <div role="status" className="wf-callout">{notice}</div>}
        {refreshRequired && (
          <div className="wf-callout warn">
            Versi berubah atau hasil belum dapat dibuktikan. Muat ulang status dan periksa rekod server. Jangan hantar semula sehingga status server jelas.
          </div>
        )}
        {state && (
          <>
            {state.aktif && (
              <div className={blockers.length ? 'wf-callout warn' : 'wf-callout'} data-testid="stage1-confirmation-blockers">
                <strong>{blockers.length ? 'Pengajuan tertahan' : 'Scope paket terbaca'}</strong>
                {blockers.length
                  ? <ul>{blockers.map((item, index) => <li key={`${item}-${index}`}>
                    {item === 'DECLARED_SCOPE_UNSET'
                      ? 'Scope survei kontrak belum ditetapkan.'
                      : item === 'DECLARED_SURVEY_INACTIVE'
                        ? 'Scope kontrak memuat jenis survei nonaktif.'
                        : item === 'Snapshot server belum memuat scope survei kontrak.'
                          ? item
                          : `Blocker server: ${item}`}
                  </li>)}</ul>
                  : <p>{surveyCount} jenis survei kontrak masuk dalam snapshot terkini.</p>}
              </div>
            )}
            <div className={state.stage2_allowed ? 'wf-callout' : 'wf-callout warn'} aria-live="polite">
              <strong>{statusLabel(state)}</strong>
              <p>
                {state.stage2_allowed
                  ? 'PIC Balai telah mengonfirmasi snapshot paket yang masih sesuai dengan rekod terkini.'
                  : state.aktif
                    ? 'Tahap 2 terkunci sampai server mengembalikan izin eksplisit dari konfirmasi PIC untuk snapshot rekod terkini.'
                    : state.alasan}
              </p>
              {state.review?.catatan && <p><strong>Catatan PIC:</strong> {state.review.catatan}</p>}
              {state.aktif && <small>Versi workflow: {state.versi}{state.pengajuan ? ` · Snapshot dikirim ${state.pengajuan.diajukan_pada ?? ''}` : ''}</small>}
            </div>

            {provider && state.aktif && (
              <div className="wf-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                <button type="button" className="wf-button" onClick={onEditRecords} disabled={busy}>
                  <FileCheck2 size={13} /> Periksa / simpan rekod Tahap 1
                </button>
                <button
                  type="button"
                  className="wf-button primary"
                  onClick={submit}
                  disabled={busy || loading || refreshRequired ||
                    blockers.length > 0 ||
                    (state.status === 'DIAJUKAN' && state.snapshot_sesuai) ||
                    (state.status === 'DISETUJUI' && state.snapshot_sesuai)}
                >
                  <Send size={13} /> {busy ? 'Mengirim…' : 'Minta konfirmasi PIC'}
                </button>
              </div>
            )}

            {pic && state.aktif && state.status === 'DIAJUKAN' && (
              <div className="wf-panel" style={{ marginTop: 14 }}>
                <div className="wf-panel-head"><h4>Snapshot Provider untuk ditinjau</h4><span>Versi {state.pengajuan?.versi}</span></div>
                <div className="wf-body">
                  {!state.snapshot_sesuai && (
                    <div className="wf-callout warn">Rekod paket berubah setelah dikirim. Keputusan ditahan; minta Provider mengirim ulang snapshot terbaru.</div>
                  )}
                  <details>
                    <summary>Periksa rekod dan lingkup survei yang dikirim</summary>
                    <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 420, overflow: 'auto' }}>
                      {JSON.stringify(state.pengajuan?.snapshot, null, 2)}
                    </pre>
                  </details>
                  <label className="wf-field" style={{ display: 'block', marginTop: 12 }}>
                    Catatan koreksi (wajib jika meminta revisi)
                    <textarea value={reviewNote} maxLength={2000} onChange={event => setReviewNote(event.target.value)} disabled={busy || !state.snapshot_sesuai} />
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    <button type="button" className="wf-button" onClick={() => decide('PERLU_REVISI')} disabled={busy || !state.snapshot_sesuai || !reviewNote.trim()}>
                      Minta koreksi
                    </button>
                    <button type="button" className="wf-button primary" onClick={() => decide('DISETUJUI')} disabled={busy || !state.snapshot_sesuai}>
                      <CheckCircle2 size={13} /> Konfirmasi sesuai · izinkan Tahap 2
                    </button>
                  </div>
                </div>
              </div>
            )}

            {state.pengajuan && (!pic || state.status !== 'DIAJUKAN') && (
              <details style={{ marginTop: 12 }}>
                <summary>Snapshot pengajuan terakhir · versi {state.pengajuan.versi}</summary>
                <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 360, overflow: 'auto' }}>
                  {JSON.stringify(state.pengajuan.snapshot, null, 2)}
                </pre>
              </details>
            )}
            {!state.aktif && (
              <details className="ui09-server-diagnostics">
                <summary>Rincian ketersediaan workflow</summary>
                <p className="wf-note">Konfirmasi Tahap 1 belum tersedia. Data draf alat, personel, kalibrasi, dan checklist yang sudah ada tidak berubah.</p>
                <small>Catatan teknis: kontrak server belum tersedia; aktivasi memerlukan persetujuan instalasi dan pemeriksaan kewenangan.</small>
              </details>
            )}
          </>
        )}
      </div>
    </section>
  );
}
