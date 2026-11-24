import type { AuditSampleUnit, OperationalWorkflowState } from './model';

/**
 * Changing examined evidence must never leave an earlier Lulus decision current.
 * Preserve the prior decision/BA in history; mark later audits for review.
 * Caller is responsible for role authorization before this pure update.
 */
export function reviseAuditSampleUnit(
  state: OperationalWorkflowState,
  level: 1 | 2 | 3,
  unitId: string,
  patch: Partial<Pick<AuditSampleUnit, 'reviewStatus' | 'evidenceReference' | 'reviewNote'>>,
): OperationalWorkflowState {
  const selected = state.audits[level - 1];
  const currentUnit = selected.sampleUnits?.find(unit => unit.id === unitId);
  if (!currentUnit) return state;
  const changed = Object.entries(patch).some(([key, value]) =>
    currentUnit[key as keyof AuditSampleUnit] !== value,
  );
  if (!changed) return state;

  const wasApproved = selected.status === 'Lulus';
  const reason = `Bukti atau hasil sampel Audit Tingkat ${level} berubah; keputusan perlu diperiksa ulang.`;
  const audits = state.audits.map(item => {
    if (item.level === level) {
      return {
        ...item,
        status: wasApproved ? 'Dalam Review' as const : item.status === 'Belum Dimulai' ? 'Dalam Review' as const : item.status,
        requiresReview: wasApproved ? true : item.requiresReview,
        reviewReason: wasApproved ? reason : item.reviewReason,
        history: wasApproved
          ? [...(item.history ?? []), (({ history: _history, ...entry }) => entry)(item)]
          : item.history,
        sampleUnits: (item.sampleUnits ?? []).map(unit => unit.id === unitId ? { ...unit, ...patch } : unit),
      };
    }
    if (wasApproved && item.level > level && item.status !== 'Belum Dimulai') {
      return { ...item, requiresReview: true, reviewReason: reason };
    }
    return item;
  }) as OperationalWorkflowState['audits'];
  return {
    ...state,
    audits,
    acceptance: wasApproved ? {
      ...state.acceptance,
      finalReport: false,
      finalAcceptance: false,
      terms: state.acceptance.terms.map(term =>
        term.id === 'T3' || term.id === 'T4' ? { ...term, complete: false } : term,
      ),
    } : state.acceptance,
  };
}
