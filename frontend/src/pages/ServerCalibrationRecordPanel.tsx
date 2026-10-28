import { useEffect, useState, type FormEvent } from 'react';
import { RefreshCw, Wrench } from 'lucide-react';

import { ApiError, apiRequest } from '../auth/client';
import {
  buildCalibrationPayload,
  serverRows,
  type CalibrationDraft,
  type ServerEquipmentAssignment,
  type ServerSurveyTeam,
} from './serverCalibration';

const EMPTY_DRAFT: CalibrationDraft = {
  alat_id: '',
  jenis: 'REFERENSI',
  standar: '',
  komponen: '',
  tgl_kalibrasi: '',
  berlaku_sd: '',
  pelaksana: '',
};

function message(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : 'Rekod kalibrasi belum dapat diproses.';
}

export function ServerCalibrationRecordPanel({
  packageId,
  teams,
  manageable,
  onCreated,
}: {
  packageId: string;
  teams: ServerSurveyTeam[];
  manageable: boolean;
  onCreated: () => void;
}) {
  const [teamId, setTeamId] = useState('');
  const [assignments, setAssignments] = useState<ServerEquipmentAssignment[]>([]);
  const [draft, setDraft] = useState<CalibrationDraft>(EMPTY_DRAFT);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    setTeamId(current => teams.some(team => String(team.tim_id) === current)
      ? current
      : teams[0] ? String(teams[0].tim_id) : '');
  }, [teams]);

  useEffect(() => {
    if (!teamId) {
      setAssignments([]);
      setDraft(current => ({ ...current, alat_id: '' }));
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    apiRequest<{ data: unknown }>(
      `/paket/${encodeURIComponent(packageId)}/tim/${encodeURIComponent(teamId)}/alat`,
      { signal: controller.signal },
    )
      .then(result => {
        if (controller.signal.aborted) return;
        const rows = serverRows<ServerEquipmentAssignment>(result.data, 'alat tim');
        setAssignments(rows);
        setDraft(current => ({
          ...current,
          alat_id: rows.some(item => String(item.alat_id) === current.alat_id)
            ? current.alat_id
            : rows[0] ? String(rows[0].alat_id) : '',
        }));
      })
      .catch(cause => {
        if (!controller.signal.aborted) setError(message(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [packageId, teamId, revision]);

  async function createCalibration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manageable || busy) return;
    setError('');
    setSuccess('');
    let payload: ReturnType<typeof buildCalibrationPayload>;
    try {
      payload = buildCalibrationPayload(draft);
    } catch (cause) {
      setError(message(cause));
      return;
    }
    setBusy(true);
    try {
      await apiRequest(`/paket/${encodeURIComponent(packageId)}/kalibrasi-alat`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setDraft(current => ({ ...EMPTY_DRAFT, alat_id: current.alat_id }));
      setSuccess('Rekod kalibrasi berjaya disimpan ke server sebagai DRAFT.');
      onCreated();
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }

  return <section className="wf-panel">
    <div className="wf-panel-head">
      <h3><Wrench size={14} /> Daftar rekod kalibrasi</h3>
      <span>Tahap 1D</span>
    </div>
    <div className="wf-body">
      {!teams.length ? <p>Daftarkan tim dan alat sebelum membuat rekod kalibrasi.</p> : <>
        <div style={{ display: 'flex', gap: 12, alignItems: 'end' }}>
          <label className="wf-field" style={{ flex: 1 }}>Tim survei
            <select value={teamId} onChange={event => setTeamId(event.target.value)} disabled={busy}>
              {teams.map(team => <option key={team.tim_id} value={team.tim_id}>Tim #{team.tim_id} · {team.nama_tim}</option>)}
            </select>
          </label>
          <button type="button" className="wf-button" disabled={!teamId || loading} onClick={() => setRevision(value => value + 1)}>
            <RefreshCw size={13} /> Muat ulang alat
          </button>
        </div>

        {loading && <p role="status">Memuat alat tim dari server…</p>}
        {error && <div role="alert" className="wf-callout danger">{error}</div>}
        {success && <div role="status" className="wf-callout">{success}</div>}
        {!loading && !assignments.length && <div className="wf-callout danger">Tim ini belum mempunyai alat. Daftar dan tugaskan alat terlebih dahulu.</div>}

        {manageable && assignments.length > 0 && <form onSubmit={createCalibration} style={{ marginTop: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <label className="wf-field">Alat yang dikalibrasi
              <select value={draft.alat_id} onChange={event => setDraft(current => ({ ...current, alat_id: event.target.value }))} disabled={busy}>
                <option value="">Pilih alat</option>
                {assignments.map(item => <option key={item.penugasan_id} value={item.alat_id}>
                  Alat #{item.alat_id} · {item.alat_survei?.nama_alat || 'Nama tidak tersedia'}
                </option>)}
              </select>
            </label>
            <label className="wf-field">Jenis kalibrasi
              <select value={draft.jenis} onChange={event => setDraft(current => ({ ...current, jenis: event.target.value as CalibrationDraft['jenis'] }))} disabled={busy}>
                <option value="REFERENSI">REFERENSI</option>
                <option value="RELATIF">RELATIF</option>
              </select>
            </label>
            <label className="wf-field">Tarikh kalibrasi
              <input type="date" value={draft.tgl_kalibrasi} onChange={event => setDraft(current => ({ ...current, tgl_kalibrasi: event.target.value }))} disabled={busy} />
            </label>
            <label className="wf-field">Standar
              <input value={draft.standar} maxLength={255} placeholder="Contoh: ASTM E950" onChange={event => setDraft(current => ({ ...current, standar: event.target.value }))} disabled={busy} />
            </label>
            <label className="wf-field">Komponen
              <input value={draft.komponen} maxLength={255} placeholder="Contoh: Sensor profilometer" onChange={event => setDraft(current => ({ ...current, komponen: event.target.value }))} disabled={busy} />
            </label>
            <label className="wf-field">Pelaksana
              <input value={draft.pelaksana} maxLength={255} placeholder="Nama makmal atau petugas" onChange={event => setDraft(current => ({ ...current, pelaksana: event.target.value }))} disabled={busy} />
            </label>
            <label className="wf-field">Berlaku hingga (opsional)
              <input type="date" value={draft.berlaku_sd} onChange={event => setDraft(current => ({ ...current, berlaku_sd: event.target.value }))} disabled={busy} />
            </label>
          </div>
          <button type="submit" className="wf-button primary" disabled={busy || !draft.alat_id} style={{ marginTop: 12 }}>
            {busy ? 'Menyimpan…' : 'Simpan rekod kalibrasi'}
          </button>
        </form>}

        {!manageable && <div className="wf-callout">Mode baca sahaja. Hanya Penyedia Jasa dengan persiapan DISETUJUI boleh membuat rekod kalibrasi.</div>}
      </>}
    </div>
  </section>;
}
