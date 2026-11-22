import { useWorkflowReconciliation } from "../hooks/useWorkflowReconciliation";
import type { OperationalWorkflowState } from "./model";
import { PACKAGE_WORKFLOW_ITEMS } from "./roleNavigation";
import { mayOperate } from "./access/operationalPolicy";
import { evaluateStageGate } from "./workflowGate";
import { getNextWorkflowAction } from "./WorkflowNextAction";
export function StageActionContext({
  state,
  selection,
  onNavigate,
}: {
  state: OperationalWorkflowState;
  selection: string;
  onNavigate?: (selection: string) => void;
}) {
  const sourceIssues = useWorkflowReconciliation(state);
  const stage = PACKAGE_WORKFLOW_ITEMS.find(
    (item) => item.selection === selection,
  )?.code;
  if (!stage) return null;
  const gate = evaluateStageGate(state, stage),
    next = getNextWorkflowAction(state);
  const blockers = [
    ...gate.blockers,
    ...sourceIssues
      .filter((issue) => stage === "Tahap 6" || issue.stage === stage)
      .map((issue) => issue.message),
  ];
  const ready = gate.readyToComplete && blockers.length === 0;
  const level =
    state.role === "Direktorat / Pusat"
      ? 3
      : state.role === "PIC Balai / Pengguna Jasa"
        ? 2
        : 1;
  const editable = mayOperate(state.role, stage, "draft", level),
    review = mayOperate(state.role, stage, "approve", level);
  const isAdmin = state.role === "Admin";
  const heading = isAdmin
    ? "Pemantauan administratif"
    : editable && review
      ? `Audit Tingkat ${level} · pemeriksaan Anda`
      : editable
        ? "Siapkan pekerjaan dan bukti"
        : review
          ? "Periksa pengajuan Penyedia"
          : "Pantau hasil pekerjaan";
  return (
    <section
      className="stage-action-context rc2-task-line c-stage-context"
      data-mode={
        isAdmin
          ? "monitor"
          : editable && review
            ? "audit"
            : editable
              ? "prepare"
              : review
                ? "review"
                : "monitor"
      }
      aria-label="Panduan pekerjaan tahap"
    >
      <div className="stage-task-summary">
        <div>
          <strong>{heading}</strong>
        </div>
        <span className={ready ? "wf-status ok" : "wf-status warn"}>
          {ready
            ? "Prasyarat dasar terpenuhi"
            : `${blockers.length} prasyarat belum terpenuhi`}
        </span>
      </div>
      {!ready && blockers.length > 0 && (
        <details className="stage-task-blockers">
          <summary>Mengapa tahap tertahan? ({blockers.length})</summary>
          <ul>
            {blockers.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </details>
      )}
      {ready &&
        next.stage !== "Selesai" &&
        next.selection !== selection &&
        (!PACKAGE_WORKFLOW_ITEMS.find(
          (item) => item.selection === next.selection,
        ) ||
          PACKAGE_WORKFLOW_ITEMS.findIndex(
            (item) => item.selection === next.selection,
          ) >
            PACKAGE_WORKFLOW_ITEMS.findIndex(
              (item) => item.selection === selection,
            )) &&
        onNavigate && (
          <button
            type="button"
            className="wf-button"
            title={next.title}
            onClick={() => onNavigate(next.selection)}
          >
            Lihat {next.stage}
          </button>
        )}
    </section>
  );
}
