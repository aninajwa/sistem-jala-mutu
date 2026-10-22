import { localPersistence } from '../repository/localPersistence';
import { useCallback, useEffect, useState } from "react";
import type { OperationalWorkflowState, VervalCycle } from "../model";

type UpdateWorkflow = (
  updater: (current: OperationalWorkflowState) => OperationalWorkflowState,
  activity: string,
  object: string,
) => void;

type Phase = "consistency" | "internal" | "periodic14";
type Completion = Record<Phase, boolean>;

const emptyCompletion = (): Completion => ({
  consistency: false,
  internal: false,
  periodic14: false,
});

/**
 * Manages the active 3B period and its local UI state.
 * The cycle data itself remains in the package's workflow state.
 * This does not approve, sign, or complete a period.
 */
export function useStage3BPeriod(
  packageId: string,
  onUpdate: UpdateWorkflow,
  clearBaDraft: () => void,
  currentPeriod?: number,
) {
  const [stage3BCompletion, setStage3BCompletion] =
    useState<Completion>(emptyCompletion);
  const storageKey = `jala-stage3b-active-period:${packageId}`;
  const [activeStage3BPeriod, setActiveStage3BPeriod] = useState(() => {
    try {
      const stored = currentPeriod ?? Number(localPersistence.getItem(storageKey));
      return Number.isInteger(stored) && stored >= 1 ? stored : 1;
    } catch {
      return 1;
    }
  });
  useEffect(() => {
    try {
      localPersistence.setItem(storageKey, String(activeStage3BPeriod));
    } catch {
      // Navigating periods still works without local persistence.
    }
  }, [storageKey, activeStage3BPeriod]);
  const [stage3bPeriodRange, setStage3BPeriodRange] = useState<{
    start: string;
    end: string;
  }>({ start: "", end: "" });
  const [stage3BStatus, setStage3BStatus] = useState<Record<string, boolean>>(
    {},
  );

  const onStage3BCompletion = useCallback((phase: Phase, complete: boolean) => {
    setStage3BCompletion((current) =>
      current[phase] === complete ? current : { ...current, [phase]: complete },
    );
  }, []);

  const switchStage3BPeriod = (number: number) => {
    if (number === activeStage3BPeriod) return;
    if (!Number.isInteger(number) || number < 1) return;

    onUpdate(
      (current) => {
        const history = {
          ...(current.cycleHistory || {}),
          [String(current.activeCyclePeriod ?? activeStage3BPeriod)]: {
            ...current.cycle,
          },
        };
        const target = history[String(number)];
        const fresh: VervalCycle = {
          ...current.cycle,
          lastCompletedDate: "",
          periodCompleted: false,
          heldRecordIds: [],
          checkedProtocols: {},
          iriCoefficientVariation: null,
          pciAiStandardDeviation: null,
          pciManualMaxDifferencePercent: null,
          reRatingStatus: "Belum Diperiksa",
          consistency: "Belum Diperiksa",
          bridgeFieldValidation: false,
          finalPeriodValidation: false,
          certificateId: "",
          userReview: "Belum Diperiksa",
          userReviewNote: "",
          surveyReviews: {},
          reviewPendingTypes: [],
          affectedTool: "",
          requiresReview: false,
          reviewReason: "",
          bridgeValidatedPercent: 0,
          bridgeValidationReport: "",
          finalValidationLocation: "",
          finalToolUnchanged: false,
        };
        return {
          ...current,
          cycleHistory: history,
          activeCyclePeriod: number,
          cycle: target ? { ...target } : fresh,
        };
      },
      "Pilih periode verval",
      `Periode ${number}`,
    );

    setActiveStage3BPeriod(number);
    clearBaDraft();
    setStage3BCompletion(emptyCompletion());
    setStage3BStatus({});
    setStage3BPeriodRange({ start: "", end: "" });
  };

  return {
    stage3BCompletion,
    activeStage3BPeriod,
    stage3bPeriodRange,
    setStage3BPeriodRange,
    stage3BStatus,
    setStage3BStatus,
    onStage3BCompletion,
    switchStage3BPeriod,
  };
}
