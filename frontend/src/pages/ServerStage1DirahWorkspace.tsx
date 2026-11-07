import { useEffect, useState } from 'react';
import { apiRequest } from '../auth/client';
import type { OperationalWorkflowState, WorkflowRole } from '../workflow/model';
import type { WorkflowStageProps } from '../workflow/stages/stageSupport';
import { Stage1CalibrationWorkspace } from '../workflow/stages/Stage1CalibrationWorkspace';
import { mapStage1ServerData, type Stage1Assignment, type Stage1Calibration, type Stage1Member, type Stage1Qualification, type Stage1SurveyType, type Stage1Team } from './serverStage1Adapter';

type Props = { packageId: string; role: WorkflowRole; state: OperationalWorkflowState; onNavigate: (selection: string) => void };
function rows<T>(value: unknown, label: string): T[] {
  const result = value && typeof value === 'object' && 'data' in value ? (value as { data: unknown }).data : value;
  if (!Array.isArray(result)) throw new Error(`Respons ${label} dari server tidak sesuai.`);
  return result as T[];
}

export function ServerStage1DirahWorkspace({ packageId, role, state, onNavigate }: Props) {
  const [serverState, setServerState] = useState<OperationalWorkflowState | null>(null);
  const [serverAssignments, setServerAssignments] = useState<NonNullable<WorkflowStageProps['serverAssignments']>>([]);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
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
    ]).then(async ([typesResponse, teamsResponse, calibrationResponse]) => {
      const surveyTypes = rows<Stage1SurveyType>(typesResponse.data, 'jenis survei');
      const teams = rows<Stage1Team>(teamsResponse.data, 'tim survei');
      const calibrations = rows<Stage1Calibration>(calibrationResponse.data, 'kalibrasi alat');
      const perTeam = await Promise.all(teams.map(async team => {
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
        surveyTypes,
        teams,
        assignments: perTeam.flatMap(item => item.assignments),
        members: perTeam.flatMap(item => item.members),
        qualifications: perTeam.flatMap(item => item.qualifications),
        calibrations,
      }, packageId);
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

  if (error) return <div className="wf" data-testid="dirah-stage1-server-adapter"><div className="wf-title"><h2>Kalibrasi & Validasi Awal</h2></div><div role="alert" className="wf-callout danger">{error}<div><button className="wf-button" onClick={() => setRevision(value => value + 1)}>Muat semula</button></div></div></div>;
  if (!serverState) return <div className="wf" data-testid="dirah-stage1-server-adapter"><p role="status">Memuat data Tahap 1 dari server…</p></div>;

  return <div data-testid="authenticated-dirah-stage1-workspace">
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
  </div>;
}
