import type { ApprovalState, WorkflowRole } from './model';
import { stage2RoleOverview } from './stage2RoleOverviewModel';
import './stage2RoleOverview.css';

export function Stage2RoleOverview({ role, approval, blockerCount, selectedCount }: {
  role: WorkflowRole;
  approval: ApprovalState;
  blockerCount: number;
  selectedCount: number;
}) {
  const view = stage2RoleOverview(role, approval, blockerCount, selectedCount);
  const task = role === 'Penyedia Jasa / Ketua Tim' ? 'Siapkan hasil pengujian dan bukti'
    : role === 'PIC Balai / Pengguna Jasa' ? 'Periksa pengajuan dan tentukan hasilnya'
    : role === 'Direktorat / Pusat' ? 'Pantau hasil dan keputusan Balai'
    : 'Pantau kelengkapan dan status paket';
  return (
    <section className="stage2-role-overview stage2-role-overview--compact" aria-label="Ringkasan Tahap 2" data-testid="stage2-role-overview">
      <div className="stage2-role-overview__main">
        <span className="stage2-role-overview__eyebrow">TAHAP 2</span>
        <h2>Validasi produksi</h2>
        <p>{task}</p>
      </div>
      <div className={`stage2-role-overview__status stage2-role-overview__status--${view.tone}`} aria-label="Status validasi produksi">
        <span>STATUS PAKET</span>
        <strong>{view.status}</strong>
        {blockerCount > 0 && <small>{blockerCount} hal perlu diselesaikan</small>}
      </div>
    </section>
  );
}
