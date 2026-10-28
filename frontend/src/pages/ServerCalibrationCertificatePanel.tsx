import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { FileCheck2, Upload } from 'lucide-react';

import { ApiError, apiRequest } from '../auth/client';
import {
  validateCalibrationCertificate,
  type ServerCalibration,
} from './serverCalibration';

function message(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : 'Sijil kalibrasi belum dapat diupload.';
}

export function ServerCalibrationCertificatePanel({
  packageId,
  calibrations,
  manageable,
  onUploaded,
}: {
  packageId: string;
  calibrations: ServerCalibration[];
  manageable: boolean;
  onUploaded: () => void;
}) {
  const drafts = useMemo(
    () => calibrations.filter(item => item.status === 'DRAFT'),
    [calibrations],
  );
  const [calibrationId, setCalibrationId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCalibrationId(current => drafts.some(item => String(item.kalibrasi_id) === current)
      ? current
      : drafts[0] ? String(drafts[0].kalibrasi_id) : '');
  }, [drafts]);

  const selected = drafts.find(item => String(item.kalibrasi_id) === calibrationId) ?? null;

  async function uploadCertificate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manageable || busy) return;
    setError('');
    setSuccess('');
    if (!selected) {
      setError('Pilih rekod kalibrasi DRAFT.');
      return;
    }
    try {
      validateCalibrationCertificate(file);
    } catch (cause) {
      setError(message(cause));
      return;
    }

    const form = new FormData();
    form.append('expected_version', String(selected.versi));
    form.append('file', file!);
    setBusy(true);
    try {
      await apiRequest(
        `/paket/${encodeURIComponent(packageId)}/kalibrasi-alat/${selected.kalibrasi_id}/sertifikat`,
        { method: 'POST', body: form },
      );
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setSuccess(`Sijil PDF untuk Kalibrasi #${selected.kalibrasi_id} berjaya disimpan ke server.`);
      onUploaded();
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }

  return <section className="wf-panel">
    <div className="wf-panel-head">
      <h3><FileCheck2 size={14} /> Sijil kalibrasi</h3>
      <span>Tahap 1E</span>
    </div>
    <div className="wf-body">
      <p>Upload sijil PDF untuk rekod kalibrasi DRAFT. Backend akan menyimpan fail, hash, versi dokumen, dan pautannya kepada rekod kalibrasi.</p>
      {error && <div role="alert" className="wf-callout danger">{error}</div>}
      {success && <div role="status" className="wf-callout">{success}</div>}

      {!drafts.length ? <div className="wf-callout">
        Tiada rekod kalibrasi DRAFT yang tersedia untuk upload sijil.
      </div> : manageable ? <form onSubmit={uploadCertificate}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 12 }}>
          <label className="wf-field">Rekod kalibrasi
            <select
              value={calibrationId}
              onChange={event => {
                setCalibrationId(event.target.value);
                setError('');
                setSuccess('');
              }}
              disabled={busy}
            >
              {drafts.map(item => <option key={item.kalibrasi_id} value={item.kalibrasi_id}>
                Kalibrasi #{item.kalibrasi_id} · Alat #{item.alat_id} · Versi {item.versi}
              </option>)}
            </select>
          </label>
          <label className="wf-field">Fail sijil PDF
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              disabled={busy}
              onChange={event => {
                setFile(event.target.files?.[0] ?? null);
                setError('');
                setSuccess('');
              }}
            />
          </label>
        </div>
        <div className="wf-callout" style={{ marginTop: 12 }}>
          Maksimum 10 MB. Rekod akan dihantar dengan versi semasa agar perubahan serentak tidak tertindih.
        </div>
        <button type="submit" className="wf-button primary" disabled={busy || !selected || !file}>
          <Upload size={13} /> {busy ? 'Mengupload…' : 'Upload sijil ke server'}
        </button>
      </form> : <div className="wf-callout">
        Mode baca sahaja. Hanya Penyedia Jasa dengan persiapan DISETUJUI boleh mengupload sijil.
      </div>}
    </div>
  </section>;
}
