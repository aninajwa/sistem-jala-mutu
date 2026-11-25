import { useEffect, useRef, useState, type FormEvent } from 'react';
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
import { ServerPersonnelPanel } from './ServerPersonnelPanel';
import { Stage1PicConfirmationPanel } from './Stage1PicConfirmationPanel';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
import { iriSectionFromDeepLink, stage1SectionFromDeepLink, stage1TeamValidationField, type Stage1Section, type Stage1TeamField } from './stage1AccordionState';
import {
  mapStage1ServerData,
  type Stage1Assignment,
  type Stage1Calibration,
  type Stage1Member,
  type Stage1Qualification,
  type Stage1SurveyType,
  type Stage1Team,
} from './serverStage1Adapter';
import { createStage1Team } from './serverStage1Data';
import { parseDeclaredPackageSurveyScope } from '../workflow/declaredPackageSurveyScope';

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
const STAGE1_SECTION_LABEL: Record<Stage1Section, string> = {
  overview: 'Tinjauan Kesiapan',
  teams_equipment: 'Tim & Alat',
  calibrations: 'Kalibrasi & Sijil',
};

export function ServerStage1DirahWorkspace({
  packageId,
  role,
  state,
  onNavigate,
  preparationStatus,
}: Props) {
  const [serverState, setServerState] = useState<OperationalWorkflowState | null>(null);
  const [serverAssignments, setServerAssignments] = useState<NonNullable<WorkflowStageProps['serverAssignments']>>([]);
  const [scopeNotice, setScopeNotice] = useState('');
  const [rawTeams, setRawTeams] = useState<ServerSurveyTeam[]>([]);
  const [rawCalibrations, setRawCalibrations] = useState<ServerCalibration[]>([]);
  const [surveyTypes, setSurveyTypes] = useState<ServerSurveyType[]>([]);
  const [providers, setProviders] = useState<ServerProvider[]>([]);
  const [activeTab, setActiveTab] = useState<Stage1Section | ''>(() => stage1SectionFromDeepLink(window.location.search, window.location.hash));
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  // Form pendaftaran tim survei untuk Penyedia Jasa
  const [teamDraft, setTeamDraft] = useState<SurveyTeamDraft>(EMPTY_TEAM);
  const [teamBusy, setTeamBusy] = useState(false);
  const [teamError, setTeamError] = useState('');
  const [teamMessage, setTeamMessage] = useState('');
  const [teamErrorField, setTeamErrorField] = useState<Stage1TeamField | null>(null);
  const teamNameRef = useRef<HTMLInputElement>(null);
  const teamProviderRef = useRef<HTMLSelectElement>(null);
  const teamSurveyRef = useRef<HTMLSelectElement>(null);
  const teamAlertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveTab(current => current || 'overview');
  }, []);

  useEffect(() => {
    if (!teamError) return;
    const target = teamErrorField === 'nama_tim' ? teamNameRef.current
      : teamErrorField === 'penyedia_id' ? teamProviderRef.current
        : teamErrorField === 'jenis_survei_id' ? teamSurveyRef.current
          : teamAlertRef.current;
    target?.focus();
  }, [teamError, teamErrorField]);

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
      apiRequest<{ data: unknown }>(`/paket/${encodeURIComponent(packageId)}/declared-survey-scope`, options)
        .then(response => parseDeclaredPackageSurveyScope(response.data, Number(packageId)))
        .catch(() => null),
    ]).then(async ([typesResponse, teamsResponse, calibrationResponse, providerResponse, packageScope]) => {
      const nextTypes = rows<Stage1SurveyType>(typesResponse.data, 'jenis survei');
      const nextTeams = rows<Stage1Team>(teamsResponse.data, 'tim survei');
      const nextCalibrations = rows<Stage1Calibration>(calibrationResponse.data, 'kalibrasi alat');
      const nextProviders = rows<ServerProvider>(providerResponse.data, 'penyedia jasa');
      const declaredIds = new Set(packageScope?.surveys.map(survey => survey.jenis_survei_id) ?? []);
      const workOnlySurveys = [...new Set(nextTeams.map(team => team.jenis_survei_id))]
        .filter(id => !declaredIds.has(id))
        .map(id => nextTypes.find(type => type.jenis_survei_id === id)?.kode || `Survei #${id}`);
      setScopeNotice(packageScope?.state === 'unset'
        ? (nextTeams.length ? 'Scope kontrak belum ditetapkan. Tim, kalibrasi, dan checklist yang sudah ada tetap ditampilkan sebagai rekaman kerja; tidak dipakai untuk mengisi scope.' : 'Scope kontrak belum ditetapkan. Pilih jenis survei dari Edit Paket bila paket ini memang memerlukannya.')
        : workOnlySurveys.length
          ? `Ada rekaman kerja survei di luar scope kontrak (${workOnlySurveys.join(', ')}). Rekaman tetap dapat dibuka; tidak ada data yang dipindahkan atau dihapus.`
          : '');

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
        surveyTypes: [
          ...nextTypes,
          ...(packageScope?.surveys ?? [])
            .filter(scopeSurvey => !nextTypes.some(type => type.jenis_survei_id === scopeSurvey.jenis_survei_id))
            .map(scopeSurvey => ({
              jenis_survei_id: scopeSurvey.jenis_survei_id,
              kode: scopeSurvey.kode ?? '',
              nama: scopeSurvey.nama ?? '',
              aktif: scopeSurvey.aktif ?? undefined,
            })),
        ],
        teams: nextTeams,
        assignments: perTeam.flatMap(item => item.assignments),
        members: perTeam.flatMap(item => item.members),
        qualifications: perTeam.flatMap(item => item.qualifications),
        calibrations: nextCalibrations,
      }, packageId, packageScope?.surveys.map(item => item.jenis_survei_id) ?? null);

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
        project: {
          ...state.project,
          surveyTypes: mapped.surveyTypes,
          surveyScopeStatus: packageScope?.state === 'defined' ? 'defined' : packageScope?.state === 'unset' ? 'undefined' : 'error',
          surveyScopeSurveys: packageScope?.surveys ?? [],
          surveyScopeAssociationCount: undefined,
          surveyScopeUnresolvedAssociationCount: undefined,
          surveyScopeDeclaredStatus: packageScope?.state,
        },
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
      const message = cause instanceof Error ? cause.message : 'Data tim tidak valid.';
      setActiveTab('teams_equipment');
      setTeamErrorField(stage1TeamValidationField(message));
      setTeamError(message);
      return;
    }
    setTeamBusy(true);
    try {
      const confirmed = await createStage1Team(packageId, teamDraft, apiRequest);
      setRawTeams(current => current.some(item => item.tim_id === confirmed.tim_id) ? current : [...current, confirmed]);
      setTeamDraft(current => ({ ...current, nama_tim: '' }));
      setTeamMessage(`Tim #${confirmed.tim_id} disahkan melalui bacaan semula server.`);
      setRevision(value => value + 1);
    } catch (cause) {
      setActiveTab('teams_equipment');
      setTeamErrorField(null);
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
      {scopeNotice && (
        <p role="status" className="wf-callout warn" data-testid="stage1-survey-scope-unavailable">
          {scopeNotice}
        </p>
      )}
      <div className="ui09-stage1-sync">
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

      <Accordion type="single" collapsible value={activeTab} onValueChange={value => setActiveTab(value as Stage1Section | '')} className="ui09-stage1-accordion" data-testid="stage1-sections">
        <AccordionItem value="overview" className="ui09-stage1-section">
          <AccordionTrigger className="ui09-stage1-trigger" data-testid="stage1-section-overview">
            <span className="ui09-stage1-trigger-title"><ClipboardCheck size={17}/><span>{STAGE1_SECTION_LABEL.overview}</span></span>
          </AccordionTrigger>
          <AccordionContent forceMount className="ui09-stage1-content">
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
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="wf-button" onClick={() => setActiveTab('teams_equipment')}>
                    <Users size={13} /> Kelola Tim & Alat
                  </button>
                  <button type="button" className="wf-button" onClick={() => setActiveTab('calibrations')}>
                    <Wrench size={13} /> Catat Kalibrasi / Upload Sijil
                  </button>
                  <button type="button" className="wf-button primary" onClick={() => onNavigate('/entry:Validasi produksi')}>
                    Lanjut ke Tahap 2 →
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
            onNavigate={onNavigate}
            serverReadOnly
            serverAssignments={serverAssignments}
            serverStatusNote="Checklist IRI menyimpan draf pendukung; konfirmasi kesesuaian PIC dan izin Tahap 2 ditampilkan terpisah di bawah."
          />
          <Stage1PicConfirmationPanel
            packageId={packageId}
            role={role}
            onEditRecords={() => setActiveTab('calibrations')}
          />
          <section className="wf-panel ui09-stage1-guidance" data-testid="stage1-provider-pic-confirmation-flow">
            <div className="wf-panel-head">
              <h3>Alur Kalibrasi → Validasi Produksi → Persetujuan</h3>
            </div>
            <div className="wf-body">
              <ol>
                <li><strong>Tahap 1 · K1–K6:</strong> catat alat/sertifikat, personel/kualifikasi, jenis kalibrasi referensi atau relatif, dan checklist kalibrasi-validasi yang sesuai untuk setiap jenis survei.</li>
                <li><strong>Tahap 1 · K7–K8:</strong> nilai apakah alat dan personel sesuai standar. Jika tidak, lakukan kalibrasi ulang/servis/pergantian yang diperlukan dan nilai kembali. Hanya keputusan “Ya” pada K7 yang mengarah ke Tahap 2.</li>
                <li><strong>Tahap 2 · V0–V8, H1–H4, D:</strong> lakukan uji coba dengan lingkup per jenis survei dan bandingkan hasil dengan ambang pada diagram. Kegagalan pertama mengulang uji coba; kegagalan berulang membuka tindakan perbaikan. Untuk jembatan, ketidaksesuaian personel memerlukan penggantian dan uji ulang.</li>
                <li><strong>Sesudah lulus Tahap 2 · SUB–BA:</strong> Penyedia Jasa menyerahkan dokumen kalibrasi dan validasi produksi kepada Pengguna Jasa. PIC memeriksa dokumen serta penjelasan proses; klarifikasi kembali ke penyerahan. Setelah diterima, terbit BA Persetujuan Penggunaan Alat &amp; Metode Kerja dan, untuk jembatan, Surat Izin Pemeriksaan.</li>
              </ol>
              <div className="wf-callout warn">
                <strong>Checklist IRI adalah rekod pendukung per survei, bukan pengajuan atau persetujuan lengkap Tahap 1.</strong>
                <p>Draf checklist—termasuk semua jawaban “Ya”—tidak menetapkan keputusan K7 atau izin Tahap 2. Panel konfirmasi di atas mengajukan snapshot package-wide atas rekod Stage 1 yang tersimpan; hanya keputusan PIC pada snapshot terkini yang dapat membuka gate Tahap 2.</p>
              </div>
              <div className="wf-note">Rujukan: <code>docs/alur-qaqc/01_persiapan_kalibrasi_validasi_produksi_1791377623126.mermaid</code> (baris 21–78). Data alat/personel, kalibrasi dan rujukan sertifikat yang terlihat pada halaman ini adalah data paket dari server; halaman ini tidak menyimpulkan kelayakan.</div>
            </div>
          </section>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="teams_equipment" className="ui09-stage1-section">
          <AccordionTrigger className="ui09-stage1-trigger" data-testid="stage1-section-teams_equipment">
            <span className="ui09-stage1-trigger-title"><Users size={17}/><span>{STAGE1_SECTION_LABEL.teams_equipment}</span></span>
          </AccordionTrigger>
          <AccordionContent forceMount className="ui09-stage1-content">
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
                {teamError && <div ref={teamAlertRef} tabIndex={-1} role="alert" className="wf-callout danger">{teamError}</div>}
                {teamMessage && <div role="status" className="wf-callout">{teamMessage}</div>}
                <form onSubmit={createTeam}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                    <label className="wf-field">
                      Penyedia Jasa
                      <select
                        ref={teamProviderRef}
                        name="penyedia_id"
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
                        ref={teamSurveyRef}
                        name="jenis_survei_id"
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
                        ref={teamNameRef}
                        name="nama_tim"
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
          <ServerPersonnelPanel packageId={packageId} teams={rawTeams} manageable={manageable} />
        </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="calibrations" className="ui09-stage1-section">
          <AccordionTrigger className="ui09-stage1-trigger" data-testid="stage1-section-calibrations">
            <span className="ui09-stage1-trigger-title"><Wrench size={17}/><span>{STAGE1_SECTION_LABEL.calibrations}</span></span>
          </AccordionTrigger>
          <AccordionContent forceMount className="ui09-stage1-content">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="wf-toolbar" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          className="wf-button"
          onClick={() => onNavigate('/entry:Persiapan & SPMK')}
        >
          ← Kembali ke Tahap 0 (Persiapan)
        </button>
        <button
          type="button"
          className="wf-button primary"
          onClick={() => onNavigate('/entry:Validasi produksi')}
        >
          Lanjut ke Tahap 2 (Validasi Produksi) →
        </button>
      </div>
    </div>
  );
}
