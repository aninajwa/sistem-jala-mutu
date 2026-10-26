import type { PageProps } from "../types";
import CorrectionDashboard from "./corrections/CorrectionDashboard";

export type CorrectionPageProps = PageProps & {
  onOpenCorrection: (
    packageId: string,
    correctionId: string
  ) => void;
};

export default function ActionsPage(props: CorrectionPageProps) {
  return <CorrectionDashboard {...props} />;
}