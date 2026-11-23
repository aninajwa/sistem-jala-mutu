import type { PageProps } from "../types";
import CorrectionDashboard from "./corrections/CorrectionDashboard";
import { ServerCorrectionDashboard } from './corrections/ServerCorrectionDashboard';

export type CorrectionPageProps = PageProps & {
  authenticatedRole?: import('../workflow/model').WorkflowRole;
  onOpenCorrection: (
    packageId: string,
    correctionId: string
  ) => void;
};

export default function ActionsPage(props: CorrectionPageProps) {
  if (props.authenticatedRole) return <ServerCorrectionDashboard role={props.authenticatedRole} />;
  return <CorrectionDashboard {...props} />;
}
