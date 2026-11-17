import {
  PREPARATION_COORDINATION,
  PREPARATION_DOCUMENTS,
  PREPARATION_FIELD_PLAN,
  PREPARATION_SOURCE_REVIEWS,
  type OperationalWorkflowState,
} from '../model';
import { invalidateDependentStages } from '../dependentStageInvalidation';
import { canEditPreparationChecklist } from '../preparationChecklistLock';
import { markCycleForReview, retainDecisionHistory } from '../workflowRevisions';

const checklist = {
  sourceReviews: PREPARATION_SOURCE_REVIEWS,
  fieldPlan: PREPARATION_FIELD_PLAN,
  coordination: PREPARATION_COORDINATION,
  documents: PREPARATION_DOCUMENTS,
};

type Group = keyof typeof checklist;
const groups = Object.keys(checklist) as Group[];
const reason = 'Checklist persiapan berubah; validasi dan audit harus diulang.';
export const PREPARATION_CHECKLIST_ACTION = 'Perbarui checklist persiapan';

export function applyPreparationCheck(
  state: OperationalWorkflowState, group: Group, key: string, value: boolean,
): OperationalWorkflowState {
  const preparation = state.project.preparation;
  if (!canEditPreparationChecklist(state.role, preparation.reportApproval) ||
      !checklist[group].includes(key) || typeof value !== 'boolean' ||
      Boolean(preparation[group][key]) === value) return state;

  const next = invalidateDependentStages(state, reason);
  const recheckCycle = (cycle: OperationalWorkflowState['cycle']) =>
    cycle.certificateId || cycle.periodCompleted || cycle.userReview === 'Sesuai'
      ? markCycleForReview(cycle, reason)
      : cycle;

  return {
    ...next,
    project: {
      ...state.project,
      preparation: {
        ...preparation,
        [group]: { ...preparation[group], [key]: value },
        reportApproval: 'Draft',
      },
    },
    cycle: recheckCycle(state.cycle),
    ...(state.cycleHistory && {
      cycleHistory: Object.fromEntries(
        Object.entries(state.cycleHistory).map(([period, cycle]) => [period, recheckCycle(cycle)]),
      ),
    }),
    acceptance: {
      ...next.acceptance,
      terms: next.acceptance.terms.map(term =>
        term.id === 'T2' ? { ...term, complete: false } : term),
      ...(state.acceptance.acceptanceDecision && { acceptanceDecision: 'Belum Diperiksa' }),
    },
  };
}

const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function preparationChecklistChanged(before: OperationalWorkflowState, after: OperationalWorkflowState) {
  return groups.some(group => !equal(before.project.preparation[group], after.project.preparation[group]));
}

/** Reconstruct the whole allowed transition, including the journal variant written by the workspace. */
export function isProviderChecklistCascade(before: OperationalWorkflowState, after: OperationalWorkflowState) {
  const previous = before.project.preparation;
  const proposed = after.project.preparation;
  const changes = groups.flatMap(group => checklist[group]
    .filter(key => previous[group][key] !== proposed[group][key])
    .map(key => ({ group, key, value: proposed[group][key] })));
  if (changes.length !== 1) return false;
  const [{ group, key, value }] = changes;
  const expected = applyPreparationCheck(before, group, key, value);
  if (expected === before) return false;
  return matchesJournaledTransition(before, expected, after, [PREPARATION_CHECKLIST_ACTION], key);
}

export function matchesJournaledTransition(
  before: OperationalWorkflowState, expected: OperationalWorkflowState,
  after: OperationalWorkflowState, actions: readonly string[], object?: string,
): boolean {
  if (equal(expected, after)) return true;
  const [event, ...previousEvents] = after.events;
  if (!event || event.actor !== before.role || event.date !== before.simulationDate ||
      !actions.includes(event.action) || (object !== undefined && event.object !== object) ||
      !event.id || before.events.some(old => old.id === event.id) ||
      !equal(previousEvents, before.events)) return false;
  const journalTime = after.balaiDecisionHistory?.[before.balaiDecisionHistory?.length ?? 0]?.recordedAt ??
    after.reviewActivityHistory?.[before.reviewActivityHistory?.length ?? 0]?.recordedAt;
  if (journalTime !== undefined && !Number.isFinite(Date.parse(journalTime))) return false;
  return equal({ ...retainDecisionHistory(before, expected, journalTime), events: after.events }, after);
}
