import {StageChecklistIndex} from './Checkpoint09Package';
import './checkpoint09.css';
import {StageActionContext} from './StageActionContext';
import type { ComponentType } from "react";
import "./workflow.css";
import type { WorkflowStageProps } from "./stages/stageSupport";
import { Stage0PreparationWorkspace } from "./stages/Stage0PreparationWorkspace";
import { Stage1CalibrationWorkspace } from "./stages/Stage1CalibrationWorkspace";
import { Stage2ProductionWorkspace } from "./stages/Stage2ProductionWorkspace";
import { LocalStage3DailyWorkspace } from "./stages/Stage3DailyWorkspace";
import { Stage3PeriodicWorkspace } from "./stages/Stage3PeriodicWorkspace";
import { Stage4DataPreparationWorkspace } from "./stages/Stage4DataPreparationWorkspace";
import { Stage5AuditWorkspace } from "./stages/Stage5AuditWorkspace";
import { Stage6AcceptanceWorkspace } from "./stages/Stage6AcceptanceWorkspace";
import { CorrectionWorkspace } from "./stages/CorrectionWorkspace";
import { NotificationsWorkspace } from "./stages/NotificationsWorkspace";
import { WorkflowAdministrationWorkspace } from "./stages/WorkflowAdministrationWorkspace";
import { WorkflowCoverageWorkspace } from "./stages/WorkflowCoverageWorkspace";
import { WorkflowDocuments } from "./WorkflowDocuments";
import { periodRange } from "./stages/periodSchedule";
import { useStage3BPeriod } from "./stages/useStage3BPeriod";
import { DraftPersistenceBoundary } from "../hooks/usePersistedDraft";
export type OperationalWorkflowWorkspaceProps = WorkflowStageProps;
const screens: Record<string, ComponentType<WorkflowStageProps>> = {
  "/entry:Persiapan & SPMK": Stage0PreparationWorkspace,
  "/documents:Kalibrasi & personel": Stage1CalibrationWorkspace,
  "/entry:Validasi produksi": Stage2ProductionWorkspace,
  "/entry:Survei harian": LocalStage3DailyWorkspace,
  "/verification:Verval 14 hari": Stage3PeriodicWorkspace,
  "/entry:Gerbang RNI/LRS": Stage4DataPreparationWorkspace,
  "/verification:Audit tingkat 1–3": Stage5AuditWorkspace,
  "/reports:Penerimaan & termin": Stage6AcceptanceWorkspace,
  "/actions:Koreksi berbukti": CorrectionWorkspace,
  "/notifications:Pengingat & eskalasi": NotificationsWorkspace,
  "/audit:Peran & backup": WorkflowAdministrationWorkspace,
  "/reports:Matriks cakupan diagram": WorkflowCoverageWorkspace,
};
function DocumentsWorkspace(props: WorkflowStageProps) {
  const { activeStage3BPeriod } = useStage3BPeriod(
    props.state.project.id,
    props.onUpdate,
    () => {},
    props.state.activeCyclePeriod,
  );
  const stage3bPeriodRange = periodRange(
    props.state.project.id,
    activeStage3BPeriod,
    props.state.project.surveyStartDate,
    props.state.project.surveyEndDate,
  );
  return (
    <WorkflowDocuments
      state={props.state}
      period={activeStage3BPeriod}
      periodRange={stage3bPeriodRange}
      onNavigate={props.onNavigate}
    />
  );
}
export function OperationalWorkflowWorkspace(
  props: OperationalWorkflowWorkspaceProps,
) {
  const Screen = dirahScreenForSelection(props.selection);
  if (!Screen) return null;
  const serverStage0 = props.serverReadOnly && props.serverPreparation && props.selection === "/entry:Persiapan & SPMK";
  const screen=<div className="wf" data-testid="operational-workflow-workspace">
    {!props.serverReadOnly&&<>
      <StageActionContext state={props.state} selection={props.selection} onNavigate={props.onNavigate}/>
      <StageChecklistIndex key={`${props.selection}:${props.state.role}`} state={props.state} selection={props.selection}/>
    </>}
    {props.serverReadOnly&&<p className="wf-note" role="status">{props.serverStatusNote||'Belum terhubung ke server. Perubahan, pengajuan, persetujuan dan upload dinyahaktifkan.'}</p>}
    <div inert={props.serverReadOnly&&!serverStage0} aria-disabled={props.serverReadOnly&&!serverStage0||undefined} data-testid={props.serverReadOnly?'server-readonly-dirah-stage':undefined}>
      <Screen key={`${props.state.project.id}:${props.selection}`} {...props} />
    </div>
  </div>;
  return props.serverReadOnly
    ? <DraftPersistenceBoundary enabled={false}>{screen}</DraftPersistenceBoundary>
    : screen;
}

/** Returns the original Dirah screen used for a package workflow selection. */
export function dirahScreenForSelection(selection:string):ComponentType<WorkflowStageProps>|undefined{
  return selection === "/documents:BA & dokumen workflow"
    ? DocumentsWorkspace
    : screens[selection];
}
