/** A revised correction must not inherit execution/retest evidence from a failed attempt.
 * Historical decisions remain in workflow events; these are only the current-attempt fields. */
export function resetCorrectionAttempt() {
  return {
    retest: "Belum Diuji" as const,
    executionReference: undefined,
    executionResult: undefined,
    retestReference: undefined,
    retestFailureReason: undefined,
  };
}

/** Stable scope of the submitted version, independent of the current case phase. */
export function correctionAttemptNumber(events: readonly {object: string; action: string}[], caseId: string): number {
  return events.filter(e => e.object === caseId && e.action === "Ajukan tindakan koreksi untuk persetujuan").length;
}
