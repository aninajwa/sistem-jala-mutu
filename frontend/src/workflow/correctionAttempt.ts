/** A revised correction must not inherit execution/retest evidence from a failed attempt.
 * Historical decisions remain in workflow events; these are only the current-attempt fields. */
export function resetCorrectionAttempt() {
  return {
    retest: "Belum Diuji" as const,
    executionReference: undefined,
    retestReference: undefined,
    retestFailureReason: undefined,
  };
}
