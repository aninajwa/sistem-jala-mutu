import { useEffect, useState, type FormEvent } from 'react';
import { FileCheck2, RefreshCw, Users, Wrench } from 'lucide-react';

import { ApiError, apiRequest } from '../auth/client';
import type { WorkflowRole } from '../workflow/model';
import {
  buildSurveyTeamPayload,
  calibrationSummary,
  canManageCalibration,
  serverRows,
  type ServerCalibration,
  type ServerProvider,
  type ServerSurveyTeam,
  type ServerSurveyType,
  type SurveyTeamDraft,
} from './serverCalibration';
import { ServerEquipmentPanel } from './ServerEquipmentPanel';

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : 'Data Tahap 1 belum dapat dimuat.';
}

function displayDate(value: string | null) {
  if (!value) return 'Belum ditetapkan';
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parsed);
}

const EMPTY_TEAM: SurveyTeamDraft = { penyedia_id: '', jenis_survei_id: '', nama_tim: '' };

export function ServerCalibrationWorkspace({
  packageId,
  role,
  preparationStatus,
}: {
  packageId: string;
  role: WorkflowRole;
  preparationStatus?: string | null;
}) {
  const [teams, setTeams] = useState<ServerSurveyTeam[]>([]);
  const [calibrations, setCalibrations] = useState<ServerCalibration[]>([]);
  const [surveyTypes, setSurveyTypes] = useState<ServerSurveyType[]>([]);
  const [providers, setProviders] = useState<ServerProvider[]>([]);
  const [teamDraft, setTeamDraft] = useState<SurveyTeamDraft>(EMPTY_TEAM);
  const [teamBusy, setTeamBusy] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [teamMessage, setTeamMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    Promise.all([
      apiRequest<{ data: unknown }>(`/paket/${encodeURIComponent(packageId)}/tim`, { signal: controller.signal }),
      apiRequest<{ data: unknown }>(`/paket/${encodeURIComponent(packageId)}/kalibrasi-alat`, { signal: controller.signal }),
      apiRequest<{ data: unknown }>('/jenis-survei', { signal: controller.signal }),
      apiRequest<{ data: unknown }>('/penyedia', { signal: controller.signal }),
    ])
      .then(([teamResult, calibrationResult, surveyTypeResult, providerResult]) => {
        if (controller.signal.aborted) return;
        const nextTypes = serverRows<ServerSurveyType>(surveyTypeResult.data, 'jenis survei');
        const nextProviders = serverRows<ServerProvider>(providerResult.data, 'penyedia jasa');
        setTeams(serverRows<ServerSurveyTeam>(teamResult.data, 'tim survei'));
        setCalibrations(serverRows<ServerCalibration>(calibrationResult.data, 'kalibrasi alat'));
        setSurveyTypes(nextTypes);
        setProviders(nextProviders);
        setTeamDraft(current => ({
          ...current,
          penyedia_id: current.penyedia_id || (nextProviders[0] ? String(nextProviders[0].penyedia_id) : ''),
          jenis_survei_id: current.jenis_survei_id || (nextTypes[0]?.jenis_survei_id ? String(nextTypes[0].jenis_survei_id) : ''),
        }));
      })
      .catch(cause => {
        if (!controller.signal.aborted) setError(errorMessage(cause));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [packageId, revision]);

  const summary = calibrationSummary(teams, calibrations);
  const manageable = canManageCalibration(role, preparationStatus);
  const referencesReady = providers.length > 0 && surveyTypes.some(item => item.jenis_survei_id);

  async function createTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!manageable || teamBusy) return;
    setTeamError('');
    setTeamMessage('');
    let payload: ReturnType<typeof buildSurveyTeamPayload>;
    try {
      payload = buildSurveyTeamPayload(teamDraft);
    } catch (cause) {
      setTeamError(errorMessage(cause));
      return;
    }
    setTeamBusy(true);
    try {
      await apiRequest(`/paket/${encodeURIComponent(packageId)}/tim`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setTeamDraft(current => ({ ...current, nama_tim: '' }));
      setTeamMessage('Tim survei berjaya didaftarkan ke server.');
      setRevision(value => value + 1);
    } catch (cause) {
      setTeamError(errorMessage(cause));
    } finally {
      setTeamBusy(false);
    }
  }

  return <div className="wf" data-testid="server-calibration-workspace">
    <div className="wf-title">
      <h2>Kalibrasi & Validasi Awal</h2>
      <p>Tim survei, alat, rekod kalibrasi, dan sijil yang tersimpan pada server.</p>
    </div>

    <div className={`wf-callout ${preparationStatus !== 'DISETUJUI' ? 'danger' : ''}`}>
      <strong>Status persiapan: {preparationStatus || 'Sedang dimuat'}</strong>
      <div>{preparationStatus === 'DISETUJUI'
        ? manageable
          ? 'Persiapan sudah disetujui. Penyedia Jasa boleh meneruskan pengisian Tahap 1.'
          : 'Persiapan sudah disetujui. Paparan ini tersedia dalam mode baca untuk peran semasa.'
        : 'Pengurusan Tahap 1 hanya dibuka selepas persiapan disetujui. Data sedia ada masih boleh dibaca jika backend mengizinkan.'}</div>
    </div>

    {loading && <p role="status">Memuat data kalibrasi dari server…</p>}
    {error && <div role="alert" className="wf-callout danger">
      <p>{error}</p>
      <button type="button" className="wf-button" onClick={() => setRevision(value => value + 1)}><RefreshCw size={13} /> Coba lagi</button>
    </div>}

    {!loading && !error && <>
      <div className="wf-kpis">
        {[
          ['Tim survei', String(summary.teams)],
          ['Rekod kalibrasi', String(summary.calibrations)],
          ['Sijil tersedia', String(summary.certificates)],
          ['Masih DRAFT', String(summary.drafts)],
        ].map(([label, value]) => <div className="wf-kpi" key={label}>
          <div className="wf-kpi-label">{label}</div>
          <div className="wf-kpi-value">{value}</div>
        </div>)}
      </div>

      {manageable && <section className="wf-panel">
        <div className="wf-panel-head"><h3><Users size={14} /> Daftar tim survei</h3><span>Tahap 1B</span></div>
        <div className="wf-body">
          {!referencesReady && <div className="wf-callout danger">Jenis survei atau Penyedia Jasa belum tersedia pada server. Borang belum boleh dihantar.</div>}
          {teamError && <div role="alert" className="wf-callout danger">{teamError}</div>}
          {teamMessage && <div role="status" className="wf-callout">{teamMessage}</div>}
          <form onSubmit={createTeam}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              <label className="wf-field">Penyedia Jasa
                <select value={teamDraft.penyedia_id} onChange={event => setTeamDraft(current => ({ ...current, penyedia_id: event.target.value }))} disabled={teamBusy}>
                  <option value="">Pilih penyedia</option>
                  {providers.map(item => <option key={item.penyedia_id} value={item.penyedia_id}>{item.nama}</option>)}
                </select>
              </label>
              <label className="wf-field">Jenis survei
                <select value={teamDraft.jenis_survei_id} onChange={event => setTeamDraft(current => ({ ...current, jenis_survei_id: event.target.value }))} disabled={teamBusy}>
                  <option value="">Pilih jenis survei</option>
                  {surveyTypes.filter(item => item.jenis_survei_id).map(item => <option key={item.jenis_survei_id} value={item.jenis_survei_id}>{item.kode} · {item.nama}</option>)}
                </select>
              </label>
              <label className="wf-field">Nama tim
                <input value={teamDraft.nama_tim} maxLength={255} placeholder="Contoh: Tim Survei Paket 8" onChange={event => setTeamDraft(current => ({ ...current, nama_tim: event.target.value }))} disabled={teamBusy} />
              </label>
            </div>
            <div style={{ marginTop: 12 }}>
              <button type="submit" className="wf-button primary" disabled={teamBusy || !referencesReady}>{teamBusy ? 'Menyimpan…' : 'Daftar tim ke server'}</button>
            </div>
          </form>
        </div>
      </section>}

      <section className="wf-panel">
        <div className="wf-panel-head">
          <h3><Users size={14} /> Tim survei</h3>
          <span>{teams.length} rekod server</span>
        </div>
        <div className="wf-body">
          {!teams.length ? <p>Belum ada tim survei yang didaftarkan untuk paket ini.</p> : <div className="package-flow-list">
            {teams.map(team => <div className="package-flow-row" key={team.tim_id}>
              <div className="package-flow-icon"><Users size={15} /></div>
              <div className="package-flow-copy">
                <small>Tim #{team.tim_id}</small>
                <strong>{team.nama_tim}</strong>
                <span>{team.jenis_survei ? `${team.jenis_survei.kode} · ${team.jenis_survei.nama}` : `Jenis survei #${team.jenis_survei_id}`}</span>
              </div>
              <div className="package-flow-status">Tersimpan</div>
            </div>)}
          </div>}
        </div>
      </section>

      <ServerEquipmentPanel
        packageId={packageId}
        teams={teams}
        manageable={manageable}
      />

      <section className="wf-panel">
        <div className="wf-panel-head">
          <h3><Wrench size={14} /> Rekod kalibrasi alat</h3>
          <button type="button" className="wf-button" onClick={() => setRevision(value => value + 1)}><RefreshCw size={13} /> Muat ulang</button>
        </div>
        <div className="wf-body">
          {!calibrations.length ? <p>Belum ada rekod kalibrasi alat untuk paket ini.</p> : <div className="package-flow-list">
            {calibrations.map(item => <div className="package-flow-row" key={item.kalibrasi_id}>
              <div className="package-flow-icon"><Wrench size={15} /></div>
              <div className="package-flow-copy">
                <small>Kalibrasi #{item.kalibrasi_id} · Alat #{item.alat_id} · Versi {item.versi}</small>
                <strong>{item.komponen}</strong>
                <span>{item.jenis} · {item.standar} · {item.pelaksana}</span>
                <span>Kalibrasi {displayDate(item.tgl_kalibrasi)} · Berlaku hingga {displayDate(item.berlaku_sd)}</span>
              </div>
              <div className="package-flow-status">
                {item.dokumen_id !== null ? <><FileCheck2 size={13} /> Sijil #{item.dokumen_id}</> : item.status}
              </div>
            </div>)}
          </div>}
        </div>
      </section>

      {manageable && <div className="wf-callout">
        <strong>Pendaftaran tim dan alat sudah tersambung ke server</strong>
        <div>Pendaftaran personel dan rekod kalibrasi akan disambungkan selepas satu alat ujian berjaya disimpan.</div>
      </div>}
    </>}
  </div>;
}
