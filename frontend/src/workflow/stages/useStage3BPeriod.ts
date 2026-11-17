import { localPersistence } from '../repository/localPersistence';
import { useCallback, useEffect, useState } from "react";
import type { OperationalWorkflowState } from "../model";
import { switchWorkflowCyclePeriod } from "../cyclePeriodTransition";

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
  // Sumber kebenaran periode adalah state paket, bukan localStorage/UI.
  const activeStage3BPeriod = Number.isSafeInteger(currentPeriod) && Number(currentPeriod) >= 1
    ? Number(currentPeriod) : 1;
  useEffect(() => {
    try {
      localPersistence.setItem(storageKey, String(activeStage3BPeriod));
    } catch {
      // Periode tetap mengikuti state paket meskipun penyimpanan UI gagal.
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
      (current) => switchWorkflowCyclePeriod(current, number),
      "Pilih periode verval",
      `Periode ${number}`,
    );


    clearBaDraft();
    setStage3BCompletion(emptyCompletion());
    setStage3BStatus({});
    setStage3BPeriodRange({ start: "", end: "" });
  };

  useEffect(()=>{
    const key=`jala-notification-period:${packageId}`,value=Number(sessionStorage.getItem(key));
    if(Number.isSafeInteger(value)&&value>0){sessionStorage.removeItem(key);switchStage3BPeriod(value);}
  },[packageId]);

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
