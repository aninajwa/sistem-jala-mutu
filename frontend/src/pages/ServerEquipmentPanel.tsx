import { useEffect, useState, type FormEvent } from 'react';
import { RefreshCw, Wrench } from 'lucide-react';

import { ApiError, apiRequest } from '../auth/client';
import {
  buildNewEquipmentPayload,
  serverRows,
  type NewEquipmentDraft,
  type ServerEquipmentAssignment,
  type ServerSurveyTeam,
} from './serverCalibration';

const EMPTY_EQUIPMENT: NewEquipmentDraft = {
  nama_alat: '', nomor_seri: '', kondisi: 'Baik', merek_tipe: '', kelas: '',
  tahun_perolehan: '', milik_djbm: false, kendaraan: '', mulai: '', selesai: '',
};

function message(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : 'Data alat belum dapat diproses.';
}

export function ServerEquipmentPanel({
  packageId,
  teams,
  manageable,
}: {
  packageId: string;
  teams: ServerSurveyTeam[];
  manageable: boolean;
}) {
  const [teamId, setTeamId] = useState('');
  const [assignments, setAssignments] = useState<ServerEquipmentAssignment[]>([]);
  const [draft, setDraft] = useState<NewEquipmentDraft>(EMPTY_EQUIPMENT);
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
        if (!controller.signal.aborted) setAssignments(serverRows<ServerEquipmentAssignment>(result.data, 'alat tim'));
      })
      .catch(cause => {
        if (!controller.signal.aborted) setError(message(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [packageId, teamId, revision]);

  async function createEquipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manageable || !teamId || busy) return;
    setError('');
    setSuccess('');
    let payload: ReturnType<typeof buildNewEquipmentPayload>;
    try {
      payload = buildNewEquipmentPayload(draft);
    } catch (cause) {
      setError(message(cause));
      return;
    }
    setBusy(true);
    try {
      await apiRequest(`/paket/${encodeURIComponent(packageId)}/tim/${encodeURIComponent(teamId)}/alat`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setDraft(EMPTY_EQUIPMENT);
      setSuccess('Alat baharu berjaya didaftarkan dan ditugaskan kepada tim.');
      setRevision(value => value + 1);
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  }

  return <section className="wf-panel">
    <div className="wf-panel-head">
      <h3><Wrench size={14} /> Alat tim survei</h3>
      <button type="button" className="wf-button" disabled={!teamId || loading} onClick={() => setRevision(value => value + 1)}>
        <RefreshCw size={13} /> Muat ulang
      </button>
    </div>
    <div className="wf-body">
      {!teams.length ? <p>Daftarkan tim survei sebelum menambah alat.</p> : <>
        <label className="wf-field">Tim yang diurus
          <select value={teamId} onChange={event => setTeamId(event.target.value)} disabled={busy}>
            {teams.map(team => <option key={team.tim_id} value={team.tim_id}>Tim #{team.tim_id} · {team.nama_tim}</option>)}
          </select>
        </label>

        {loading && <p role="status">Memuat alat tim dari server…</p>}
        {error && <div role="alert" className="wf-callout danger">{error}</div>}
        {success && <div role="status" className="wf-callout">{success}</div>}

        {!loading && !assignments.length && <p>Belum ada alat yang ditugaskan kepada tim ini.</p>}
        {!!assignments.length && <div className="package-flow-list">
          {assignments.map(item => <div className="package-flow-row" key={item.penugasan_id}>
            <div className="package-flow-icon"><Wrench size={15} /></div>
            <div className="package-flow-copy">
              <small>Penugasan #{item.penugasan_id} · Alat #{item.alat_id}</small>
              <strong>{item.alat_survei?.nama_alat || `Alat #${item.alat_id}`}</strong>
              <span>{item.alat_survei?.nomor_seri || 'Nombor siri tidak tersedia'} · {item.alat_survei?.kondisi || 'Kondisi belum tersedia'}</span>
              <span>{item.kendaraan || 'Tanpa kendaraan'} · {item.mulai || 'Mulai belum ditetapkan'} hingga {item.selesai || 'Selesai belum ditetapkan'}</span>
            </div>
            <div className="package-flow-status">Tersimpan</div>
          </div>)}
        </div>}

        {manageable && <form onSubmit={createEquipment} style={{ marginTop: 16 }}>
          <h4>Daftar alat baharu</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <label className="wf-field">Nama alat
              <input value={draft.nama_alat} maxLength={255} onChange={event => setDraft(current => ({ ...current, nama_alat: event.target.value }))} disabled={busy} />
            </label>
            <label className="wf-field">Nombor siri
              <input value={draft.nomor_seri} maxLength={255} onChange={event => setDraft(current => ({ ...current, nomor_seri: event.target.value }))} disabled={busy} />
            </label>
            <label className="wf-field">Kondisi
              <input value={draft.kondisi} maxLength={255} onChange={event => setDraft(current => ({ ...current, kondisi: event.target.value }))} disabled={busy} />
            </label>
            <label className="wf-field">Merek / tipe (opsional)
              <input value={draft.merek_tipe} maxLength={255} onChange={event => setDraft(current => ({ ...current, merek_tipe: event.target.value }))} disabled={busy} />
            </label>
            <label className="wf-field">Kelas (opsional)
              <input value={draft.kelas} maxLength={255} onChange={event => setDraft(current => ({ ...current, kelas: event.target.value }))} disabled={busy} />
            </label>
            <label className="wf-field">Tahun perolehan (opsional)
              <input type="number" min="1900" max="2100" value={draft.tahun_perolehan} onChange={event => setDraft(current => ({ ...current, tahun_perolehan: event.target.value }))} disabled={busy} />
            </label>
            <label className="wf-field">Kendaraan (opsional)
              <input value={draft.kendaraan} maxLength={255} onChange={event => setDraft(current => ({ ...current, kendaraan: event.target.value }))} disabled={busy} />
            </label>
            <label className="wf-field">Mulai penugasan (opsional)
              <input type="date" value={draft.mulai} onChange={event => setDraft(current => ({ ...current, mulai: event.target.value }))} disabled={busy} />
            </label>
            <label className="wf-field">Selesai penugasan (opsional)
              <input type="date" value={draft.selesai} onChange={event => setDraft(current => ({ ...current, selesai: event.target.value }))} disabled={busy} />
            </label>
          </div>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
            <input type="checkbox" checked={draft.milik_djbm} onChange={event => setDraft(current => ({ ...current, milik_djbm: event.target.checked }))} disabled={busy} />
            Alat milik DJBM
          </label>
          <button type="submit" className="wf-button primary" disabled={busy} style={{ marginTop: 12 }}>
            {busy ? 'Menyimpan…' : 'Daftar dan tugaskan alat'}
          </button>
        </form>}
      </>}
    </div>
  </section>;
}
