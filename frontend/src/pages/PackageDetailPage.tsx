
import type {
  OperationalWorkflowState,
} from '../workflow/model';

import {
  PackageContextHeader,
  PackageOverview,
} from '../workflow/PackageHub';

import {
  OperationalWorkflowWorkspace,
} from '../workflow/OperationalWorkflowWorkspace';

type Props = {
  packageId: string;
  workflow: OperationalWorkflowState;
  selection: string;
  onBack: () => void;
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
  onNavigate,
  onUpdate,
  setNotice,
}: Props) {
  const showOverview =
    selection === '/packages:Ringkasan Paket';

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
