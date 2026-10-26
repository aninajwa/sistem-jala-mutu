
import type { OperationalWorkflowState } from "../workflow/model";

import {
  PackageContextHeader,
  PackageOverview,
} from "../workflow/PackageHub";

import {
  OperationalWorkflowWorkspace,
} from "../workflow/OperationalWorkflowWorkspace";

import CorrectionCaseHeader from "./corrections/components/CorrectionCaseHeader";
import CorrectionReadOnlyDetail from "./corrections/components/CorrectionReadOnlyDetail";

import "./corrections/corrections.css";

type Props = {
  packageId: string;
  workflow: OperationalWorkflowState;
  selection: string;
  onBack: () => void;
  onReturnToCorrections: () => void;
  onNavigate: (selection: string) => void;
  onUpdate: (
    update: (
      current: OperationalWorkflowState,
    ) => OperationalWorkflowState,
    activity: string,
    object: string,
  ) => void;
  setNotice: (message: string) => void;
};

export default function PackageDetailPage({
  packageId,
  workflow,
  selection,
  onBack,
  onReturnToCorrections,
  onNavigate,
  onUpdate,
  setNotice,
}: Props) {
  const showOverview =
    selection === "/packages:Ringkasan Paket";

  const isCorrection =
    selection === "/actions:Koreksi berbukti";

  const readOnlyCorrection =
    workflow.role === "Direktorat / Pusat" ||
    workflow.role === "Admin";

  if (isCorrection) {
    return (
      <div className="package-detail-page">
        <CorrectionCaseHeader
          workflow={workflow}
          onBack={onReturnToCorrections}
        />

        {readOnlyCorrection ? (
          <CorrectionReadOnlyDetail workflow={workflow} />
        ) : (
          <OperationalWorkflowWorkspace
            key={packageId}
            selection={selection}
            state={workflow}
            onUpdate={onUpdate}
            setNotice={setNotice}
            onNavigate={onNavigate}
          />
        )}
      </div>
    );
  }

  return (
    <div className="package-detail-page">
      <PackageContextHeader
        state={workflow}
        selection={selection}
        onBack={onBack}
        onNavigate={onNavigate}
      />

      {showOverview ? (
        <PackageOverview
          state={workflow}
          onNavigate={onNavigate}
        />
      ) : (
        <OperationalWorkflowWorkspace
          key={packageId}
          selection={selection}
          state={workflow}
          onUpdate={onUpdate}
          setNotice={setNotice}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

export { ServerPackageWorkspace } from './ServerPackageWorkspace';
