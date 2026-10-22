import type {
  OperationalWorkflowState,
  VervalCycle,
  DailySurveyRecord,
} from "./model";

/** Records are retained when their supporting data changes. A new review is explicit. */
export const needsReview = (item: { requiresReview?: boolean }) =>
  item.requiresReview === true;
export function markCycleForReview(
  cycle: VervalCycle,
  reason: string,
): VervalCycle {
  return { ...cycle, requiresReview: true, reviewReason: reason };
}
export function markAuditsForReview(
  state: OperationalWorkflowState,
  reason: string,
): OperationalWorkflowState["audits"] {
  return state.audits.map((audit) =>
    audit.status === "Belum Dimulai"
      ? audit
      : { ...audit, requiresReview: true, reviewReason: reason },
  ) as OperationalWorkflowState["audits"];
}
export function periodForDate(
  state: OperationalWorkflowState,
  date: string,
): number | undefined {
  const start = state.project.surveyStartDate;
  if (
    !start ||
    !date ||
    date < start ||
    (state.project.surveyEndDate && date > state.project.surveyEndDate)
  )
    return undefined;
  const days = Math.floor(
    (Date.parse(date + "T00:00:00Z") - Date.parse(start + "T00:00:00Z")) /
      86400000,
  );
  return Number.isFinite(days) ? Math.floor(days / 14) + 1 : undefined;
}
export function recordDailyChange(
  state: OperationalWorkflowState,
  record: DailySurveyRecord,
): OperationalWorkflowState {
  const period = periodForDate(state, record.date);
  const active = state.activeCyclePeriod ?? 1;
  const reason = `Rekaman ${record.id} pada ${record.date} berubah; periksa ulang periode ${period ?? "terkait"}.`;
  const history = { ...state.cycleHistory };
  if (period && period !== active && history[String(period)])
    history[String(period)] = markCycleForReview(
      history[String(period)],
      reason,
    );
  return {
    ...state,
    dailyRecords: [
      record,
      ...state.dailyRecords.filter((row) => row.id !== record.id),
    ],
    cycle:
      period === active &&
      (state.cycle.certificateId || state.cycle.periodCompleted)
        ? markCycleForReview(state.cycle, reason)
        : state.cycle,
    cycleHistory: history,
    submission: {
      ...state.submission,
      validationStatus: "Draft",
      validationMessage: reason,
    },
    audits: markAuditsForReview(state, reason),
    acceptance: { ...state.acceptance, finalAcceptance: false },
  };
}
/** Preserve snapshots on deliberate re-review, including old decision, BA and samples. */
export function retainDecisionHistory(
  before: OperationalWorkflowState,
  after: OperationalWorkflowState,
): OperationalWorkflowState {
  const audits = after.audits.map((audit, index) => {
    const old = before.audits[index];
    if (JSON.stringify(old) === JSON.stringify(audit)) return audit;
    const history = old.history ?? [];
    if (old.status !== "Belum Dimulai") {
      const { history: _, ...snapshot } = old;
      if (audit.status === "Belum Dimulai")
        return {
          ...old,
          requiresReview: true,
          reviewReason: "Data pendukung berubah; keputusan lama disimpan.",
        };
      return { ...audit, history: [...history, snapshot] };
    }
    return audit;
  }) as OperationalWorkflowState["audits"];
  let cycle = after.cycle;
  if (before.cycle.certificateId && !cycle.certificateId) {
    cycle = {
      ...cycle,
      certificateId: before.cycle.certificateId,
      requiresReview: true,
      reviewReason: "Data pemeriksaan berubah; BA sebelumnya tetap diarsipkan.",
    };
  }
  const cycleRevisions = { ...before.cycleRevisions, ...after.cycleRevisions };
  if (
    before.cycle.certificateId &&
    !before.cycle.requiresReview &&
    JSON.stringify(before.cycle) !== JSON.stringify(cycle)
  ) {
    const period = String(before.activeCyclePeriod ?? 1);
    cycleRevisions[period] = [
      ...(cycleRevisions[period] ?? []),
      { ...before.cycle },
    ];
  }
  return { ...after, audits, cycle, cycleRevisions };
}

/** Read-only status reconciliation; never clears an historical decision. */
export function hasPendingRecheck(state:OperationalWorkflowState){return !!state.cycle.requiresReview||!!state.cycle.reviewPendingTypes?.length||Object.values(state.cycleHistory??{}).some(cycle=>cycle.requiresReview||cycle.reviewPendingTypes?.length)||state.audits.some(audit=>audit.requiresReview);}
