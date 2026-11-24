import { useWorkflowReconciliation } from "../hooks/useWorkflowReconciliation";
import type { OperationalWorkflowState } from "./model";
import { PACKAGE_WORKFLOW_ITEMS } from "./roleNavigation";
import { mayOperate } from "./access/operationalPolicy";
import { evaluateStageGate } from "./workflowGate";

/** One small, conditional readiness strip shared by stages 0–6.
 * The domain gate is the sole source of its blockers; the strip never grants access. */
export function StageActionContext({
  state,
  selection,
}: {
  state: OperationalWorkflowState;
  selection: string;
  onNavigate?: (selection: string) => void;
}) {
  const sourceIssues = useWorkflowReconciliation(state);
  const stage = PACKAGE_WORKFLOW_ITEMS.find(item => item.selection === selection)?.code;
  if (!stage) return null;

  const gate = evaluateStageGate(state, stage);
  const blockers = [...new Set([
    ...gate.blockers,
    ...sourceIssues.filter(issue => stage === "Tahap 6" || issue.stage === stage).map(issue => issue.message),
  ].filter(Boolean))];
  // No idle/success banner. Content and its own status controls remain visible.
  if (blockers.length === 0) return null;

  const level = state.role === "Direktorat / Pusat" ? 3 : state.role === "PIC Balai / Pengguna Jasa" ? 2 : 1;
  const editable = mayOperate(state.role, stage, "draft", level);
  const review = mayOperate(state.role, stage, "approve", level);
  const isAdmin = state.role === "Admin";
  const isAuditWorker = stage === "Tahap 5" && !isAdmin && editable && review;
  const label = isAdmin || (!editable && !review)
    ? `Pantau ${stage}`
    : isAuditWorker
      ? `Audit Tingkat ${level}`
      : `Kesiapan ${stage}`;

  return (
    <section className="stage-action-context rc2-task-line c-stage-context stage-readiness-compact"
      data-stage={stage} data-mode={isAdmin || (!editable && !review) ? "monitor" : "work"}
      aria-label={`Persyaratan ${stage}`}>
      <div className="stage-task-summary">
        <strong>{label}</strong>
        <span className="wf-status warn">{blockers.length} persyaratan perlu dilengkapi</span>
      </div>
      <details className="stage-task-blockers">
        <summary>Lihat persyaratan ({blockers.length})</summary>
        <ul>{blockers.map((reason, index) => <li key={index}>{reason}</li>)}</ul>
      </details>
    </section>
  );
}
