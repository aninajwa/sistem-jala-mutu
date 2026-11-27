import { correctionDisplayStatus } from "./correctionPresentation";
import type { OperationalWorkflowState } from './model';
import { CORRECTION_VERIFICATION_STEPS, CORRECTION_VERIFICATION_LABELS } from './correctionVerificationEvidence';
import { correctionExecutionSummary, correctionResultReference, correctionProposalTechnicalSummary } from './correctionFormEngine';

export function CorrectionRevisionHistory({ state, caseId }: {state: OperationalWorkflowState; caseId: string}) {
  const entries = (state.correctionRevisionHistory ?? []).filter(e => e.caseId === caseId).slice().reverse();
  if (!entries.length) return null;
  return <section aria-label="Rekaman siklus tindakan">
    <h4>Rekaman siklus tindakan</h4>
    {entries.map(entry => <details key={entry.sequence} className="wf-panel">
      <summary>{entry.attempt ? `Siklus ${entry.attempt}` : 'Persiapan'} · {correctionDisplayStatus(entry.after)} · {entry.recordedOn}</summary>
      <div className="wf-body">
        <p>{entry.actor}</p>
        {[entry.before, entry.after].map((snapshot, index) => snapshot && <div key={index}>
          <h5>{index === 0 ? 'Sebelum perubahan' : 'Setelah perubahan'}</h5>
          <dl className="corr-readonly-grid">
            {[
              ['Tindakan', snapshot.actionType], ['Rencana', snapshot.proposedPlan], ['Penanggung jawab', snapshot.owner], ['Tenggat', snapshot.dueDate], ['Keputusan usulan', snapshot.approval], ['Catatan pemeriksa', snapshot.reviewNote], ['Hasil uji ulang', snapshot.retest], ['Referensi uji ulang', snapshot.retestReference], ['Alasan gagal', snapshot.retest === 'Gagal' ? snapshot.retestFailureReason : undefined], ['Bukti usulan', snapshot.evidence], ...(!snapshot.executionResult ? [['Referensi pelaksanaan', correctionResultReference(snapshot)]] : []),
              ...correctionProposalTechnicalSummary(snapshot).map(row => [`Usulan: ${row.label}`, row.value]),
              ...correctionExecutionSummary(snapshot).map(row => [row.label, row.value]),
              ...CORRECTION_VERIFICATION_STEPS.flatMap(step => { const record = snapshot.verificationEvidence?.[step]; return record ? [[`Dokumen pemeriksaan ${CORRECTION_VERIFICATION_LABELS[step]}`, `${record.reviewerIdentity} · ${record.reviewedAt} · ${record.dataVersionReference} · ${record.evidenceReference}`]] : []; }),
            ].filter(row => row[1]).map(([label, value], i) => <div className="corr-readonly-item" key={i}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </div>)}
      </div>
    </details>)}
  </section>;
}
