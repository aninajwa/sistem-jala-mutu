import type { WorkflowRole } from '../model';

export type NoteContext = 'audit2' | 'stage0' | 'stage1' | 'stage3a' | 'stage3a-field' | 'stage3b' | 'stage4';

/** Local draft notes are coordination, never an approval or an audit decision. */
export function noteAuthoringPolicy(input: {
  context: NoteContext;
  role: WorkflowRole;
  eligible: boolean;
  recipientEligible: boolean;
  hasResult: boolean;
  hasDailyRecord: boolean;
}) {
  const { context, role, eligible, recipientEligible, hasResult, hasDailyRecord } = input;
  const authorAllowed = context === 'stage3a-field'
    ? role === 'PIC Balai / Pengguna Jasa'
    : role === 'Direktorat / Pusat';
  // Tahap 0/1/3A/3B permit an explicitly labelled preliminary observation.
  // Existing Tahap 4 and audit-2 result gates remain unchanged.
  const preliminaryAllowed = context === 'stage0' || context === 'stage1' ||
    context === 'stage3a' || context === 'stage3b';
  const canWrite = eligible && recipientEligible && authorAllowed &&
    (hasResult || preliminaryAllowed);
  const needsRecord = (context === 'stage3a' || context === 'stage3a-field') && hasDailyRecord;
  return {
    canWrite,
    preliminary: canWrite && !hasResult && preliminaryAllowed,
    needsRecord,
  };
}
