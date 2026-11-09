import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  RefreshCw,
  Users,
  Wrench,
} from 'lucide-react';

import { apiRequest } from '../auth/client';
import { usePersistedDraft } from '../hooks/usePersistedDraft';
import type { OperationalWorkflowState, WorkflowRole } from '../workflow/model';
import type { WorkflowStageProps } from '../workflow/stages/stageSupport';
import { Stage1CalibrationWorkspace } from '../workflow/stages/Stage1CalibrationWorkspace';
import {
  buildSurveyTeamPayload,
  calibrationSummary,
  canManageCalibration,
  type ServerCalibration,
  type ServerProvider,
  type ServerSurveyTeam,
  type ServerSurveyType,
  type SurveyTeamDraft,
} from './serverCalibration';
import { ServerCalibrationCertificatePanel } from './ServerCalibrationCertificatePanel';
import { ServerCalibrationRecordPanel } from './ServerCalibrationRecordPanel';
import { ServerEquipmentPanel } from './ServerEquipmentPanel';
import {
  mapStage1ServerData,
  type Stage1Assignment,
  type Stage1Calibration,
  type Stage1Member,
  type Stage1Qualification,
  type Stage1SurveyType,
  type Stage1Team,
} from './serverStage1Adapter';

type Props = {
  packageId: string;
  role: WorkflowRole;
  state: OperationalWorkflowState;
  onNavigate: (selection: string) => void;
  preparationStatus?: string | null;
};

function rows<T>(value: unknown, label: string): T[] {
  const result = value && typeof value === 'object' && 'data' in value ? (value as { data: unknown }).data : value;
  if (!Array.isArray(result)) throw new Error(`Respons ${label} dari server tidak sesuai.`);
  return result as T[];
}

function displayDate(value: string | null) {
  if (!value) return 'Belum ditetapkan';
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parsed);
}

const EMPTY_TEAM: SurveyTeamDraft = { penyedia_id: '', jenis_survei_id: '', nama_tim: '' };

export function ServerStage1DirahWorkspace({
  packageId,
  role,
  state,
  onNavigate,
  preparationStatus,
}: Props) {
  const [serverState, setServerState] = useState<OperationalWorkflowState | null>(null);
  const [serverAssignments, setServerAssignments] = useState<NonNullable<WorkflowStageProps['serverAssignments']>>([]);
  const [rawTeams, setRawTeams] = useState<ServerSurveyTeam[]>([]);
  const [rawCalibrations, setRawCalibrations] = useState<ServerCalibration[]>([]);
  const [surveyTypes, setSurveyTypes] = useState<ServerSurveyType[]>([]);
  const [providers, setProviders] = useState<ServerProvider[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'teams_equipment' | 'calibrations'>('overview');
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  // Form pendaftaran tim survei untuk Penyedia Jasa
  const [teamDraft, setTeamDraft] = usePersistedDraft<SurveyTeamDraft>(
    `server-team-draft:${packageId}`,
    EMPTY_TEAM,
  );
  const [teamBusy, setTeamBusy] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [teamMessage, setTeamMessage] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setServerState(null);
    setServerAssignments([]);
    setError('');
    const options = { signal: controller.signal };

    Promise.all([
      apiRequest<{ data: unknown }>('/jenis-survei', options),
      apiRequest<{ data: unknown }>(`/paket/${encodeURIComponent(packageId)}/tim`, options),
      apiRequest<{ data: unknown }>(`/paket/${encodeURIComponent(packageId)}/kalibrasi-alat`, options),
      apiRequest<{ data: unknown }>('/penyedia', options).catch(() => ({ data: [] })),
    ]).then(async ([typesResponse, teamsResponse, calibrationResponse, providerResponse]) => {
      const nextTypes = rows<Stage1SurveyType>(typesResponse.data, 'jenis survei');
      const nextTeams = rows<Stage1Team>(teamsResponse.data, 'tim survei');
      const nextCalibrations = rows<Stage1Calibration>(calibrationResponse.data, 'kalibrasi alat');
      const nextProviders = rows<ServerProvider>(providerResponse.data, 'penyedia jasa');

      const perTeam = await Promise.all(nextTeams.map(async team => {
        const [assignmentsResponse, membersResponse] = await Promise.all([
          apiRequest<{ data: unknown }>(`/paket/${encodeURIComponent(packageId)}/tim/${team.tim_id}/alat`, options),
          apiRequest<{ data: unknown }>(`/paket/${encodeURIComponent(packageId)}/tim/${team.tim_id}/personel`, options),
        ]);
        const assignments = rows<Stage1Assignment>(assignmentsResponse.data, 'penugasan alat');
        const members = rows<Stage1Member>(membersResponse.data, 'personel tim');
        const qualifications = (await Promise.all(members.map(async member => {
          const response = await apiRequest<{ data: unknown }>(`/paket/${encodeURIComponent(packageId)}/tim/${team.tim_id}/personel/${member.personel_id}/kualifikasi`, options);
          return rows<Stage1Qualification>(response.data, 'kualifikasi personel');
        }))).flat();
        return { assignments, members, qualifications };
      }));

      if (controller.signal.aborted) return;
      const mapped = mapStage1ServerData({
        surveyTypes: nextTypes,
        teams: nextTeams,
        assignments: perTeam.flatMap(item => item.assignments),
        members: perTeam.flatMap(item => item.members),
        qualifications: perTeam.flatMap(item => item.qualifications),
        calibrations: nextCalibrations,
      }, packageId);

      setRawTeams(nextTeams as unknown as ServerSurveyTeam[]);
      setRawCalibrations(nextCalibrations as unknown as ServerCalibration[]);
      setSurveyTypes(nextTypes);
      setProviders(nextProviders);
      setTeamDraft(current => ({
        ...current,
        penyedia_id: current.penyedia_id || (nextProviders[0] ? String(nextProviders[0].penyedia_id) : ''),
        jenis_survei_id: current.jenis_survei_id || (nextTypes[0]?.jenis_survei_id ? String(nextTypes[0].jenis_survei_id) : ''),
      }));

      setServerState({
        ...state,
        role,
        project: { ...state.project, surveyTypes: mapped.surveyTypes },
        calibrations: mapped.calibrations,
        // Checklist/readiness and stage approval are not persisted by these APIs.
        calibrationChecklist: Object.fromEntries(mapped.surveyTypes.map(type => [type, false])) as OperationalWorkflowState['calibrationChecklist'],
        productionApproval: 'Draft',
        productionApprovalBa: '',
      });
      setServerAssignments(mapped.assignments);
    }).catch(cause => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Data Tahap 1 belum dapat dimuat.');
    });
    return () => controller.abort();
  // `state` is a freshly derived view model in ServerPackageWorkspace; using it
  // as a dependency would refetch on every render. The package/role scope is stable.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId, role, revision]);

  const manageable = canManageCalibration(role, preparationStatus);
  const summary = calibrationSummary(rawTeams, rawCalibrations);
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
      setTeamError(cause instanceof Error ? cause.message : 'Data tim tidak valid.');
      return;
    }
    setTeamBusy(true);
    try {
      await apiRequest(`/paket/${encodeURIComponent(packageId)}/tim`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setTeamDraft(current => ({ ...current, nama_tim: '' }));
      setTeamMessage('Tim survei berhasil didaftarkan ke server.');
      setRevision(value => value + 1);
    } catch (cause) {
      setTeamError(cause instanceof Error ? cause.message : 'Gagal mendaftarkan tim survei.');
    } finally {
      setTeamBusy(false);
    }
  }

  if (error) {
    return (
      <div className="wf" data-testid="dirah-stage1-server-adapter">
        <div className="wf-title"><h2>Kalibrasi & Validasi Awal</h2></div>
        <div role="alert" className="wf-callout danger">
          {error}
          <div><button className="wf-button" onClick={() => setRevision(value => value + 1)}>Muat semula</button></div>
        </div>
      </div>
    );
  }

  if (!serverState) {
    return (
      <div className="wf" data-testid="dirah-stage1-server-adapter">
        <p role="status">Memuat data Tahap 1 dari server…</p>
      </div>
    );
  }

  return (
    <div data-testid="authenticated-dirah-stage1-workspace">
      {/* Sub-modul navigation bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`wf-button ${activeTab === 'overview' ? 'primary' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <ClipboardCheck size={14} /> Tinjauan Kesiapan
          </button>
          <button
            type="button"
            className={`wf-button ${activeTab === 'teams_equipment' ? 'primary' : ''}`}
            onClick={() => setActiveTab('teams_equipment')}
          >
            <Users size={14} /> Tim & Alat ({rawTeams.length})
          </button>
          <button
            type="button"
            className={`wf-button ${activeTab === 'calibrations' ? 'primary' : ''}`}
            onClick={() => setActiveTab('calibrations')}
          >
            <Wrench size={14} /> Rekod Kalibrasi & Sijil ({rawCalibrations.length})
          </button>
        </div>
        <button
          type="button"
          className="wf-button"
          onClick={() => setRevision(value => value + 1)}
          title="Sinkron ulang data server"
        >
          <RefreshCw size={13} /> Sinkron server
        </button>
      </div>

      {/* KPI metrics strip */}
      <div className="wf-kpis" style={{ marginBottom: 16 }}>
        <div className="wf-kpi">
          <div className="wf-kpi-label">Tim survei</div>
          <div className="wf-kpi-value">{summary.teams}</div>
        </div>
        <div className="wf-kpi">
          <div className="wf-kpi-label">Rekod kalibrasi</div>
          <div className="wf-kpi-value">{summary.calibrations}</div>
        </div>
        <div className="wf-kpi">
          <div className="wf-kpi-label">Sijil tersedia</div>
          <div className="wf-kpi-value">{summary.certificates}</div>
        </div>
        <div className="wf-kpi">
          <div className="wf-kpi-label">Status DRAFT</div>
          <div className="wf-kpi-value">{summary.drafts}</div>
        </div>
      </div>

      {/* TAB 1: OVERVIEW (Dirah Presentation) */}
      {activeTab === 'overview' && (
        <>
          {manageable ? (
            <div className="wf-panel" style={{ border: '1px solid #bbf7d0', background: '#f0fdf4', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <strong style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={16} /> Tahap Persiapan Telah Disetujui
                  </strong>
                  <span className="wf-note" style={{ color: '#15803d' }}>
                    Penyedia Jasa dapat mendaftarkan tim, mengalokasikan alat baru, mencatat kalibrasi, serta mengunggah sertifikat kalibrasi PDF.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="wf-button" onClick={() => setActiveTab('teams_equipment')}>
                    <Users size={13} /> Kelola Tim & Alat
                  </button>
                  <button type="button" className="wf-button primary" onClick={() => setActiveTab('calibrations')}>
                    <Wrench size={13} /> Catat Kalibrasi / Upload Sijil
                  </button>
                </div>
              </div>
            </div>
          ) : role === 'Penyedia Jasa / Ketua Tim' ? (
            <div className="wf-callout warn" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <AlertCircle size={15} style={{ marginTop: 2, flexShrink: 0 }} />
                <div>
                  <strong>Persiapan Belum Disetujui ({preparationStatus || 'Belum diajukan'})</strong>
                  <div>Pengelolaan alat, tim, dan sertifikat baru dapat diinput setelah Tahap Persiapan disetujui oleh PIC Balai. Data saat ini ditampilkan dalam mode baca.</div>
                </div>
              </div>
            </div>
          ) : null}

          <Stage1CalibrationWorkspace
            selection="/documents:Kalibrasi & personel"
            state={serverState}
            onUpdate={() => { /* READ-only adapter: no local workflow state writes. */ }}
            setNotice={() => { /* Unsupported WRITE actions must never report success. */ }}
            onNavigate={() => { /* Stage gate is unavailable; navigation is deliberately blocked. */ }}
            serverReadOnly
            serverAssignments={serverAssignments}
            serverStatusNote="Checklist kalibrasi, readiness gate dan navigasi tahap: Belum terhubung ke server."
          />
          <div className="wf-note">Data alat/personel, kalibrasi dan rujukan sertifikat dibaca dari server. Penilaian kelayakan belum disediakan.</div>
        </>
      )}

      {/* TAB 2: TEAMS & EQUIPMENT (Mutation Panels) */}
      {activeTab === 'teams_equipment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {manageable && (
            <section className="wf-panel">
              <div className="wf-panel-head">
                <h3><Users size={14} /> Daftarkan Tim Survei Baru</h3>
                <span>Tahap 1B</span>
              </div>
              <div className="wf-body">
                {!referencesReady && (
                  <div className="wf-callout warn">
                    Jenis survei atau Penyedia Jasa belum tersedia pada server.
                  </div>
                )}
                {teamError && <div role="alert" className="wf-callout danger">{teamError}</div>}
                {teamMessage && <div role="status" className="wf-callout">{teamMessage}</div>}
                <form onSubmit={createTeam}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <label className="wf-field">
                      Penyedia Jasa
                      <select
                        value={teamDraft.penyedia_id}
                        onChange={event => setTeamDraft(current => ({ ...current, penyedia_id: event.target.value }))}
                        disabled={teamBusy}
                      >
                        <option value="">Pilih penyedia</option>
                        {providers.map(item => (
                          <option key={item.penyedia_id} value={item.penyedia_id}>{item.nama}</option>
                        ))}
                      </select>
                    </label>
                    <label className="wf-field">
                      Jenis Survei
                      <select
                        value={teamDraft.jenis_survei_id}
                        onChange={event => setTeamDraft(current => ({ ...current, jenis_survei_id: event.target.value }))}
                        disabled={teamBusy}
                      >
                        <option value="">Pilih jenis survei</option>
                        {surveyTypes.filter(item => item.jenis_survei_id).map(item => (
                          <option key={item.jenis_survei_id} value={item.jenis_survei_id}>
                            {item.kode} · {item.nama}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="wf-field">
                      Nama Tim
                      <input
                        value={teamDraft.nama_tim}
                        maxLength={255}
                        placeholder="Contoh: Tim Survei IRI Balai"
                        onChange={event => setTeamDraft(current => ({ ...current, nama_tim: event.target.value }))}
                        disabled={teamBusy}
                      />
                    </label>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <button
                      type="submit"
                      className="wf-button primary"
                      disabled={teamBusy || !referencesReady}
                    >
                      {teamBusy ? 'Menyimpan…' : 'Daftar tim ke server'}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          <section className="wf-panel">
            <div className="wf-panel-head">
              <h3><Users size={14} /> Daftar Tim Survei Paket</h3>
              <span>{rawTeams.length} tim terdaftar</span>
            </div>
            <div className="wf-body">
              {!rawTeams.length ? (
                <p>Belum ada tim survei yang didaftarkan untuk paket ini.</p>
              ) : (
                <div className="package-flow-list">
                  {rawTeams.map(team => (
                    <div className="package-flow-row" key={team.tim_id}>
                      <div className="package-flow-icon"><Users size={15} /></div>
                      <div className="package-flow-copy">
                        <small>Tim #{team.tim_id}</small>
                        <strong>{team.nama_tim}</strong>
                        <span>
                          {team.jenis_survei
                            ? `${team.jenis_survei.kode} · ${team.jenis_survei.nama}`
                            : `Jenis survei #${team.jenis_survei_id}`}
                        </span>
                      </div>
                      <div className="package-flow-status">Tersimpan</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <ServerEquipmentPanel
            packageId={packageId}
            teams={rawTeams}
            manageable={manageable}
          />
        </div>
      )}

      {/* TAB 3: CALIBRATION & CERTIFICATES (Mutation Panels) */}
      {activeTab === 'calibrations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ServerCalibrationRecordPanel
            packageId={packageId}
            teams={rawTeams}
            manageable={manageable}
            onCreated={() => setRevision(value => value + 1)}
          />

          <ServerCalibrationCertificatePanel
            packageId={packageId}
            calibrations={rawCalibrations}
            manageable={manageable}
            onUploaded={() => setRevision(value => value + 1)}
          />

          <section className="wf-panel">
            <div className="wf-panel-head">
              <h3><Wrench size={14} /> Rekod Kalibrasi Alat</h3>
              <button
                type="button"
                className="wf-button"
                onClick={() => setRevision(value => value + 1)}
              >
                <RefreshCw size={13} /> Muat ulang
              </button>
            </div>
            <div className="wf-body">
              {!rawCalibrations.length ? (
                <p>Belum ada rekod kalibrasi alat untuk paket ini.</p>
              ) : (
                <div className="package-flow-list">
                  {rawCalibrations.map(item => (
                    <div className="package-flow-row" key={item.kalibrasi_id}>
                      <div className="package-flow-icon"><Wrench size={15} /></div>
                      <div className="package-flow-copy">
                        <small>Kalibrasi #{item.kalibrasi_id} · Alat #{item.alat_id} · Versi {item.versi}</small>
                        <strong>{item.komponen}</strong>
                        <span>{item.jenis} · {item.standar} · {item.pelaksana}</span>
                        <span>Kalibrasi {displayDate(item.tgl_kalibrasi)} · Berlaku hingga {displayDate(item.berlaku_sd)}</span>
                      </div>
                      <div className="package-flow-status">
                        {item.dokumen_id !== null ? (
                          <><FileCheck2 size={13} /> Sijil #{item.dokumen_id}</>
                        ) : (
                          <span className="wf-badge warn">{item.status}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
