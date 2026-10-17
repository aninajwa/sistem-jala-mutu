import type { AuditLevel, WorkflowRole } from './model';

type Props = {
  level: 1 | 2 | 3;
  actor: WorkflowRole;
  activeRole: WorkflowRole;
  audit: AuditLevel;
  checks: string[];
};

export function AuditReadOnlySummary({ level, actor, activeRole, audit, checks }: Props) {
  const completed = checks.filter((key) => audit.reviewChecks?.[key]).length;
  return (
    <div data-testid={`audit-readonly-summary-${level}`}>
      <div className="wf-callout">
        <strong>Read-only untuk {activeRole}.</strong>
        <div className="wf-note" style={{ marginTop: 4 }}>
          Audit Tingkat {level} dikerjakan oleh <strong>{actor}</strong>. Peran aktif hanya melihat hasil, catatan, dan status yang sudah tercatat.
        </div>
      </div>
      <div className="wf-row"><span>Status</span><strong>{audit.status}</strong></div>
      <div className="wf-row"><span>Cakupan / sampel</span><strong>{audit.sampleIds.length} rekaman</strong></div>
      <div className="wf-row"><span>Checklist pemeriksaan</span><strong>{completed}/{checks.length}</strong></div>
      <div className="wf-row"><span>Referensi / BA</span><strong>{audit.baNumber || 'Belum dicatat'}</strong></div>
      <div className="wf-row"><span>Catatan keputusan</span><strong>{audit.decisionNote || 'Belum ada catatan'}</strong></div>
      {level === 3 && (
        <>
          <div className="wf-row"><span>Referensi kepercayaan jembatan</span><strong>{audit.bridgeTrustReference || 'Belum dicatat'}</strong></div>
          <div className="wf-row"><span>Skor kepercayaan jembatan</span><strong>{Number.isFinite(audit.bridgeTrustScore) ? audit.bridgeTrustScore : 'Belum dicatat'}</strong></div>
        </>
      )}
    </div>
  );
}
