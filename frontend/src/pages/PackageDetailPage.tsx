import {useEffect} from 'react';
import '../workflow/ui09.css';

import type { OperationalWorkflowState } from "../workflow/model";

import {
  PackageContextHeader,
  PackageOverview,
} from "../workflow/PackageHub";

import {
  OperationalWorkflowWorkspace,
} from "../workflow/OperationalWorkflowWorkspace";

import CorrectionCaseHeader, {findOpenedCorrection} from "./corrections/components/CorrectionCaseHeader";
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
  useEffect(()=>{window.scrollTo(0,0);const heading=document.querySelector<HTMLElement>('.ui09-workspace h1,.ui09-workspace h2');if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}},[packageId,selection]);
  const showOverview =
    selection === "/packages:Ringkasan Paket";

  const isCorrection =
    selection === "/actions:Koreksi berbukti";

  const readOnlyCorrection =
    (workflow.role === "Direktorat / Pusat" && !/^Audit tingkat 3$/i.test(findOpenedCorrection(workflow)?.blockedStage??"")) ||
    workflow.role === "Admin";

  // BA dari Dokumen Mutu tidak memakai header navigasi Paket Saya.
  // BaGenerator memiliki konteks paket, tahap sumber,
  // dan navigasi kembali ke asal pembukaan dokumen.
  if (selection === "/documents:BA & dokumen workflow") {
    return (
      <div className="package-detail-page ui09-workspace">
        <OperationalWorkflowWorkspace
          key={packageId}
          selection={selection}
          state={workflow}
          onUpdate={onUpdate}
          setNotice={setNotice}
          onNavigate={onNavigate}
        />
      </div>
    );
  }

  if (isCorrection) {
    return (
      <div className="package-detail-page ui09-workspace">
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
    <div className="package-detail-page ui09-workspace">
      <PackageContextHeader
        state={workflow}
        selection={selection}
        onBack={onBack}
        onNavigate={onNavigate}
        onCorrections={onReturnToCorrections}
      />

      {showOverview ? (
        <PackageOverview
          state={workflow}
          onNavigate={onNavigate}
          onCorrections={onReturnToCorrections}
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
