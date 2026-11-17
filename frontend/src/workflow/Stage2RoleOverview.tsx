import type { ApprovalState, WorkflowRole } from './model';
import { stage2RoleOverview } from './stage2RoleOverviewModel';
import './stage2RoleOverview.css';

export function Stage2RoleOverview({
  role, approval, blockerCount, selectedCount,
}: {
  role: WorkflowRole;
  approval: ApprovalState;
  blockerCount: number;
  selectedCount: number;
}) {
  const view = stage2RoleOverview(role, approval, blockerCount, selectedCount);
  return <section className="stage2-role-overview" aria-label="Panduan pekerjaan Tahap 2" data-testid="stage2-role-overview">
    <div className="stage2-role-overview__main">
      <span className="stage2-role-overview__eyebrow">{view.eyebrow}</span>
      <h2>{view.title}</h2>
      <p>{view.description}</p>
      <a className="stage2-role-overview__link" href={`#${view.actionTarget}`}>{view.actionLabel} <span aria-hidden="true">→</span></a>
    </div>
    <aside className={`stage2-role-overview__status stage2-role-overview__status--${view.tone}`} aria-label="Status validasi produksi">
      <span>Status Tahap 2</span>
      <strong>{view.status}</strong>
      <p>{view.helper}</p>
    </aside>
  </section>;
}
