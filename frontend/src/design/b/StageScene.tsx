import type { ReactNode } from "react";
import { StagePresentationContext, stagePresentation } from "../c/stagePresentation";
import type { WorkflowRole } from "../../workflow/model";
import type { WorkflowStage } from "../../workflow/workflowGate";

/** Consistent stage presentation without a duplicate automatic section navigator. */
export function StageScene({ children, role, stage }: {
  children: ReactNode;
  role: WorkflowRole;
  stage?: WorkflowStage;
}) {
  const presentation = stage
    ? stagePresentation(role, stage)
    : { mode: "monitor" as const, level: 1 as const };

  return (
    <StagePresentationContext.Provider value={presentation}>
      <div className="v2-stage-scene" data-mode={presentation.mode}>
        <div className="v2-stage-body">{children}</div>
      </div>
    </StagePresentationContext.Provider>
  );
}
