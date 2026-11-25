import type { PageProps } from "../types";
import CorrectionDashboard from "./corrections/CorrectionDashboard";
import { ServerCorrectionsPage } from './corrections/ServerCorrectionsPage';

export type CorrectionPageProps = PageProps & {
  authenticatedRole?: import('../workflow/model').WorkflowRole;
  onOpenCorrection: (
    packageId: string,
    correctionId: string
  ) => void;
};

export default function ActionsPage(props: CorrectionPageProps) {
  if (props.authenticatedRole) return <ServerCorrectionsPage {...props} authenticatedRole={props.authenticatedRole} />;
  return <CorrectionDashboard {...props} />;
}
