import type {
  OperationalWorkflowState,
  VervalCycle,
  DailySurveyRecord,
  ReviewActivity,
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
  const balaiDecisionHistory = [...(before.balaiDecisionHistory??[])];
  const decisions = [
    {stage:'Tahap 0' as const, previousDecision:before.project.preparation.reportApproval,decision:after.project.preparation.reportApproval,previousNote:before.project.preparation.reviewerNote,note:after.project.preparation.reviewerNote},
    {stage:'Tahap 2' as const,previousDecision:before.productionApproval,decision:after.productionApproval,previousNote:before.productionApprovalNote,note:after.productionApprovalNote},
    {stage:'Tahap 6' as const,previousDecision:before.acceptance.acceptanceDecision??'Belum Diperiksa',decision:after.acceptance.acceptanceDecision??'Belum Diperiksa',previousNote:before.acceptance.acceptanceRejectionReason||before.acceptance.acceptanceReviewNote||'',note:after.acceptance.acceptanceRejectionReason||after.acceptance.acceptanceReviewNote||''},
  ];
  for(const entry of decisions)if(entry.previousDecision!==entry.decision || (before.role==='PIC Balai / Pengguna Jasa'&&entry.previousNote!==entry.note)) {
    balaiDecisionHistory.push({...entry,actor:before.role,recordedAt:new Date().toISOString()});
  }
  // Journal only actual changes at the workflow mutation boundary. Never
  // synthesize historical events from legacy snapshots or view-only changes.
  const activity: ReviewActivity[] = [];
  const recordedAt = new Date().toISOString();
  const add = (stage: ReviewActivity['stage'], oldStatus: string, status: string,
    oldNote: string, note: string, period?: number, auditLevel?: 1|2|3) => {
    if (oldStatus === status && oldNote === note) return;
    const action: ReviewActivity['action'] = oldStatus !== status
      ? (status === 'Diajukan' || status === 'Dalam Review'
        ? (oldStatus === 'Perlu Revisi' || oldStatus === 'Ditolak' ? 'pengajuan-ulang' : 'pengajuan')
        : 'keputusan')
      : 'catatan';
    activity.push({id: `${recordedAt}:${stage}:${period??0}:${auditLevel??0}:${activity.length}`,
      recordedAt, actor: before.role, stage, period, auditLevel, action,
      previousStatus: oldStatus, status, previousNote: oldNote, note});
  };
  for (const d of decisions) add(d.stage, d.previousDecision, d.decision,
    d.previousNote ?? '', d.note ?? '');
  const periods = new Set([...Object.keys(before.cycleHistory??{}),
    ...Object.keys(after.cycleHistory??{}), String(before.activeCyclePeriod??1),
    String(after.activeCyclePeriod??1)]);
  const cycleAt = (s: OperationalWorkflowState, period: number) =>
    period === (s.activeCyclePeriod??1) ? s.cycle : s.cycleHistory?.[String(period)];
  for (const key of periods) {
    const period = Number(key);
    const old = cycleAt(before,period), now = cycleAt(after,period);
    if (!old || !now) continue;
    add('Tahap 3B', old.userReview??'Belum Diperiksa', now.userReview??'Belum Diperiksa',
      old.userReviewNote??'',now.userReviewNote??'',period);
    for (const survey of new Set([...Object.keys(old.surveyReviews??{}),...Object.keys(now.surveyReviews??{})])) {
      const a = old.surveyReviews?.[survey as keyof typeof old.surveyReviews];
      const b = now.surveyReviews?.[survey as keyof typeof now.surveyReviews];
      add('Tahap 3B', `${survey}: ${a?.decision??'Belum Diperiksa'}`,
        `${survey}: ${b?.decision??'Belum Diperiksa'}`,a?.note??'',b?.note??'',period);
    }
  }
  for (let i=0;i<3;i++) {
    const old=before.audits[i],now=after.audits[i];
    add('Tahap 5',old.status,now.status,old.decisionNote??'',now.decisionNote??'',undefined,old.level);
  }
  const reviewActivityHistory = [...(before.reviewActivityHistory??[]),...activity];
  return { ...after, audits, cycle, cycleRevisions, balaiDecisionHistory, reviewActivityHistory };
}

/** Read-only status reconciliation; never clears an historical decision. */
export function hasPendingRecheck(state:OperationalWorkflowState){return !!state.cycle.requiresReview||!!state.cycle.reviewPendingTypes?.length||Object.values(state.cycleHistory??{}).some(cycle=>cycle.requiresReview||cycle.reviewPendingTypes?.length)||state.audits.some(audit=>audit.requiresReview);}
