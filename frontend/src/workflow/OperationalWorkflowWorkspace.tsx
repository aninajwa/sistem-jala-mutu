import {StageActionContext} from './StageActionContext';
import type { ComponentType } from "react";
import "./workflow.css";
import type { WorkflowStageProps } from "./stages/stageSupport";
import { Stage0PreparationWorkspace } from "./stages/Stage0PreparationWorkspace";
import { Stage1CalibrationWorkspace } from "./stages/Stage1CalibrationWorkspace";
import { Stage2ProductionWorkspace } from "./stages/Stage2ProductionWorkspace";
import { Stage3DailyWorkspace } from "./stages/Stage3DailyWorkspace";
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
export type OperationalWorkflowWorkspaceProps = WorkflowStageProps;
const screens: Record<string, ComponentType<WorkflowStageProps>> = {
  "/entry:Persiapan & SPMK": Stage0PreparationWorkspace,
  "/documents:Kalibrasi & personel": Stage1CalibrationWorkspace,
  "/entry:Validasi produksi": Stage2ProductionWorkspace,
  "/entry:Survei harian": Stage3DailyWorkspace,
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
  const Screen =
    props.selection === "/documents:BA & dokumen workflow"
      ? DocumentsWorkspace
      : screens[props.selection];
  if (!Screen) return null;
  return (
    <div className="wf" data-testid="operational-workflow-workspace">
      <StageActionContext state={props.state} selection={props.selection} onNavigate={props.onNavigate}/>
      <Screen key={`${props.state.project.id}:${props.selection}`} {...props} />
    </div>
  );
}
