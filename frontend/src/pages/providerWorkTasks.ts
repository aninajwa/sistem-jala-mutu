import { validDate } from "../workflow/operationalCalendar";
import { correctionNextStep } from "../workflow/checkpoint09Corrections";
import { correctionDisplayStatus } from "./corrections/correctionViewModel";
import type { OperationalWorkflowState } from "../workflow/model";

export type ProviderCaseTask = {
  packageId: string;
  packageName: string;
  caseId: string;
  survey: string;
  stage: string;
  period?: number;
  status: string;
  dueDate?: string;
  nextAction: string;
  owner: "provider" | "reviewer";
};

/** Only uses the already-authorised packages passed to the Penyedia dashboard.
 * Does not infer a deadline, a review result, or an approval. */
export function providerCaseTasks(
  packages: Record<string, OperationalWorkflowState>,
): ProviderCaseTask[] {
  return Object.entries(packages).flatMap(([packageId, state]) =>
    state.corrections
      .filter((item) => item.status !== "Ditutup")
      .map((item) => {
        const next = correctionNextStep(item);
        return {
          packageId,
          packageName: state.project.packageName || packageId,
          caseId: item.id,
          survey: item.surveyType,
          stage: item.blockedStage,
          period: item.cyclePeriod,
          status: correctionDisplayStatus(item),
          dueDate: validDate(item.dueDate) ? item.dueDate : undefined,
          nextAction: next.label,
          owner: next.actor === "Penyedia Jasa / Ketua Tim" ? "provider" as const : "reviewer" as const,
        };
      }),
  ).sort((a, b) => {
    // Actionable first; known deadlines first, nearest before later. No invented date.
    if (a.owner !== b.owner) return a.owner === "provider" ? -1 : 1;
    const aDue = a.dueDate || "9999-12-31";
    const bDue = b.dueDate || "9999-12-31";
    return aDue.localeCompare(bDue) || a.packageName.localeCompare(b.packageName, "id") || a.caseId.localeCompare(b.caseId);
  });
}
