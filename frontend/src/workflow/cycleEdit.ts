import { affectedReviewTypes, periodicNoteOnly } from './periodicReview';
import { periodicSurveyTypes } from './reviewReadiness';
import { invalidateVervalStages } from './dependentStageInvalidation';
import type { OperationalWorkflowState, VervalCycle } from './model';

export function applyCycleEdit(s: OperationalWorkflowState, patch: Partial<VervalCycle>): OperationalWorkflowState {
  const changed = Object.entries(patch).some(
    ([key, value]) => !Object.is(s.cycle[key as keyof VervalCycle], value),
  );
  if (!changed) return s;
  if(periodicNoteOnly(s.cycle,patch))return {...s,cycle:{...s.cycle,...patch}};
  const next = invalidateVervalStages(
    s,
    "Data atau protokol verval berubah; validasi dan audit perlu diulang.",
  );
  const changesTest = [
    "selectedTypes",
    "checkedProtocols",
    "iriCoefficientVariation",
    "pciAiStandardDeviation",
    "pciManualMaxDifferencePercent",
    "reRatingStatus",
  ].some((key) => key in patch && JSON.stringify(s.cycle[key as keyof VervalCycle])!==JSON.stringify(patch[key as keyof VervalCycle]));
  return {
    ...next,
    cycle: {
      ...s.cycle,
      ...patch,
      ...(changesTest
        ? {
            userReview: "Belum Diperiksa" as const,
            reviewPendingTypes: patch.reviewPendingTypes ?? [...new Set([...(s.cycle.reviewPendingTypes??[]),...affectedReviewTypes(periodicSurveyTypes(s),s.cycle,patch)])],
            bridgeFieldValidation: false,
            finalPeriodValidation: false,
          }
        : {}),
      ...(!("certificateId" in patch) && changesTest
        ? { certificateId: "" }
        : {}),
    },
  };
}
