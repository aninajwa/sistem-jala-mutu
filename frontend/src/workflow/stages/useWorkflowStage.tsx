import { applySubmissionEdit } from '../submissionEdit';
import { applyCycleEdit } from '../cycleEdit';
import { applyPreparationCheck, PREPARATION_CHECKLIST_ACTION } from '../access/providerChecklistCascade';
import {RoleWorkSection} from '../RoleWorkSection';
import {displayText} from '../displayText';
import { localPersistence } from '../repository/localPersistence';
import { FileText } from "lucide-react";
import { workflowMutationError } from "../workflowMutationPermissions";
import {
  retainDecisionHistory,
} from "../workflowRevisions";

import {
  OperationalWorkflowState,
  PreparationState,
  SubmissionState,
  VervalCycle,
  WorkflowEvent,
} from "../model";
import { ChecklistPanel } from "../WorkflowComponents";

import type { WorkflowStageProps } from "./stageSupport";
import {
  collectAuditChanges,
  idNow,
  invalidateDependentStages,
  testId,
  SERVER_STAGE1_MUTATION_POLICY,
} from "./stageSupport";
export function useWorkflowStage({
  selection,
  state,
  onUpdate,
  setNotice,
  onNavigate,
  serverReadOnly = false,
}: WorkflowStageProps) {
  const goToBA = (
    kind:
      | "kalibrasi"
      | "konsistensi"
      | "internal"
      | "duaMingguan"
      | "bertahap"
      | "audit"
      | "penerimaan",
    period = 0,
    context?: {survey?:string;auditLevel?:1|2|3},
  ) => {
    if (serverReadOnly && !SERVER_STAGE1_MUTATION_POLICY.approval) return;
    try {
      localPersistence.setItem(
        "jala-ba-navigation-v2",
        JSON.stringify({ packageId: state.project.id, kind, period, ...context }),
      );
    } catch {}
    try {
      localPersistence.setItem("jala-ba-return-to", selection);
    } catch {}
    onNavigate("/documents:BA & dokumen workflow");
  };
  const baAccess = (
    kind:
      | "kalibrasi"
      | "konsistensi"
      | "internal"
      | "duaMingguan"
      | "bertahap"
      | "audit"
      | "penerimaan",
    label: string,
    period = 0,
    context?: {survey?:string;auditLevel?:1|2|3},
  ) => (
    <button
      type="button"
      className="wf-button"
      disabled={serverReadOnly && !SERVER_STAGE1_MUTATION_POLICY.approval}
      onClick={() => goToBA(kind, period, context)}
    >
      <FileText size={14} />
      {label}
    </button>
  );
  const commit = (
    activity: string,
    object: string,
    updater: (current: OperationalWorkflowState) => OperationalWorkflowState,
    notice?: string,
  ) => {
    const eventId = idNow("EVT");
    onUpdate(
      (current) => {
        const proposed = updater(current);
        if (proposed === current) return current;
        const error = workflowMutationError(current, proposed, selection);
        if (error) {
          setNotice(error, "error");
          return current;
        }
        const next = retainDecisionHistory(current, proposed);
        const changes = collectAuditChanges(current, next);
        const event: WorkflowEvent = {
          id: eventId,
          date: current.simulationDate,
          actor: current.role,
          action: activity,
          object,
          oldValue:
            changes
              .map((change) => `${change.path}: ${change.before}`)
              .join(" · ")
              .slice(0, 600) || "Tidak ada perubahan nilai",
          newValue:
            changes
              .map((change) => `${change.path}: ${change.after}`)
              .join(" · ")
              .slice(0, 600) || "Tidak ada perubahan nilai",
        };
        if (notice) setNotice(notice);
        return { ...next, events: [event, ...next.events] };
      },
      activity,
      object,
    );
  };
  const setPreparation = (
    updater: (p: PreparationState) => PreparationState,
    activity: string,
    object: string,
    notice?: string,
  ) =>
    commit(
      activity,
      object,
      (s) => {
        const preparation = updater(s.project.preparation);
        const invalidateMethod =
          s.project.preparation.reportApproval !== preparation.reportApproval &&
          (preparation.reportApproval === "Perlu Revisi" || preparation.reportApproval === "Ditolak");
        const next = { ...s, project: { ...s.project, preparation } };
        return invalidateMethod
          ? invalidateDependentStages(
              next,
              "Laporan pendahuluan perlu revisi; validasi dan audit harus diulang.",
            )
          : next;
      },
      notice,
    );
  const updateCycle = (patch: Partial<VervalCycle>, activity: string) =>
    commit(activity, state.project.packageName, s => applyCycleEdit(s, patch));
  const updateSubmission = (
    patch: Partial<SubmissionState>,
    activity: string,
  ) =>
    commit(activity, state.project.packageName, s => applySubmissionEdit(s, patch));
  const setCheck = (
    group: "sourceReviews" | "fieldPlan" | "coordination" | "documents",
    key: string,
    value: boolean,
  ) =>
    commit(PREPARATION_CHECKLIST_ACTION, key, (s) =>
      applyPreparationCheck(s, group, key, value),
    );
  const heading = (
    eyebrow: string,
    title: string,
    detail: string,
    tag = "WORKSPACE PAKET",
  ) => (
    <div className="wf-head">
      <div><div className="wf-eyebrow">{displayText(eyebrow)}</div><h1 className="wf-title">{displayText(title)}</h1></div>
      <details className="stage-context-help"><summary>Panduan kegiatan</summary><p>{displayText(detail)}</p></details>
    </div>
  );

  const toggleMap = (
    map: Record<string, boolean>,
    key: string,
    on: boolean,
    fn: (next: Record<string, boolean>) => void,
  ) => fn({ ...map, [key]: on });
  const renderChecklist = (
    title: string,
    icon: any,
    items: string[],
    checked: Record<string, boolean>,
    onToggle: (key: string, on: boolean) => void,
    disabled = false,
    triState?: Record<string, { answer: 'Ya' | 'Tidak' | null; note?: string; disabled?: boolean }>,
    onAnswer?: (key: string, answer: 'Ya' | 'Tidak' | null) => void,
  ) => (
    <RoleWorkSection primary={triState ? true : !disabled} title={displayText(title)}><ChecklistPanel
      title={displayText(title)}
      icon={icon}
       items={items.map((item) => ({
         id: `${testId(title)}-${testId(item)}`,
         label: item,
         checked: triState ? triState[item]?.answer === 'Ya' : !!checked[item],
         ...(triState ? { answer: triState[item]?.answer ?? null, note: triState[item]?.note } : {}),
         disabled: disabled || !!triState?.[item]?.disabled,
       }))}
       answerLabel={triState ? 'Ya' : 'siap'}
       onAnswer={triState && onAnswer ? (id, answer) => {
         const item = items.find(candidate => `${testId(title)}-${testId(candidate)}` === id);
         if (item) onAnswer(item, answer);
       } : undefined}
      onChange={(id, value) => {
        const item = items.find(
          (candidate) => `${testId(title)}-${testId(candidate)}` === id,
        );
        if (item) onToggle(item, value);
      }}
    /></RoleWorkSection>
  );

  return {
    baAccess,
    goToBA,
    commit,
    setPreparation,
    updateCycle,
    updateSubmission,
    setCheck,
    heading,
    toggleMap,
    renderChecklist,
  };
}
