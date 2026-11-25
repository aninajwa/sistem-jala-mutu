import type { OperationalWorkflowState, VervalCycle } from './model';

/** Pindah periode tanpa mengubah keputusan/BA periode lain. */
export function switchWorkflowCyclePeriod(
  state: OperationalWorkflowState,
  targetPeriod: number,
): OperationalWorkflowState {
  const currentPeriod = state.activeCyclePeriod ?? 1;
  if (!Number.isSafeInteger(targetPeriod) || targetPeriod < 1 || targetPeriod === currentPeriod) return state;

  const cycleHistory = {
    ...(state.cycleHistory ?? {}),
    [String(currentPeriod)]: { ...state.cycle },
  };
  const archivedTarget = cycleHistory[String(targetPeriod)];
  const freshCycle: VervalCycle = {
    ...state.cycle,
    lastCompletedDate: '',
    periodCompleted: false,
    heldRecordIds: [],
    checkedProtocols: {},
    iriCoefficientVariation: null,
    pciAiStandardDeviation: null,
    pciManualMaxDifferencePercent: null,
    reRatingStatus: 'Belum Diperiksa',
    consistency: 'Belum Diperiksa',
    bridgeFieldValidation: false,
    finalPeriodValidation: false,
    certificateId: '',
    userReview: 'Belum Diperiksa',
    userReviewNote: '',
    surveyReviews: {},
    reviewPendingTypes: [],
    affectedTool: '',
    requiresReview: false,
    reviewReason: '',
    bridgeValidatedPercent: 0,
    bridgeValidationReport: '',
    finalValidationLocation: '',
    finalToolUnchanged: false,
  };
  return {
    ...state,
    cycleHistory,
    activeCyclePeriod: targetPeriod,
    cycle: archivedTarget ? { ...archivedTarget } : freshCycle,
  };
}

/** Hanya transisi periode persis yang diizinkan; tidak dapat memalsukan review Balai. */
export function isExactCyclePeriodSwitch(
  before: OperationalWorkflowState,
  after: OperationalWorkflowState,
): boolean {
  if (after.activeCyclePeriod === undefined ||
      after.activeCyclePeriod === (before.activeCyclePeriod ?? 1)) return false;
  const expected = switchWorkflowCyclePeriod(before, after.activeCyclePeriod);
  return JSON.stringify(expected) === JSON.stringify(after);
}
