import type { CorrectionCase, OperationalWorkflowState, WorkflowRole } from './model';
import { correctionAttemptNumber } from './correctionAttempt';

export type CorrectionRevisionEntry = {
  caseId: string;
  sequence: number;
  attempt: number;
  recordedOn: string;
  actor: WorkflowRole;
  activity: string;
  before?: CorrectionCase;
  after: CorrectionCase;
};
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value));
/** Called only after the storage boundary accepts a transaction. Never trust a journal supplied by the caller. */
export function retainCorrectionRevisionHistory(before: OperationalWorkflowState, after: OperationalWorkflowState, activity: string): OperationalWorkflowState {
  const history = before.correctionRevisionHistory ?? [];
  const additions: CorrectionRevisionEntry[] = [];
  for (const next of after.corrections) {
    const prior = before.corrections.find(c => c.id === next.id);
    if (prior && prior.status === next.status && prior.approval === next.approval && prior.retest === next.retest && JSON.stringify(prior.verificationEvidence) === JSON.stringify(next.verificationEvidence)) continue;
    const sequence = Math.max(0, ...history.filter(e => e.caseId === next.id).map(e => e.sequence)) + 1;
    const attempt = correctionAttemptNumber(before.events, next.id) + (next.status === 'Menunggu Persetujuan' && prior?.status !== next.status ? 1 : 0);
    additions.push({ caseId: next.id, sequence, attempt, recordedOn: before.simulationDate, actor: before.role, activity, before: prior && copy(prior), after: copy(next) });
  }
  if (!additions.length && !before.correctionRevisionHistory && !after.correctionRevisionHistory) return after;
  return { ...after, correctionRevisionHistory: [...history, ...additions] };
}
