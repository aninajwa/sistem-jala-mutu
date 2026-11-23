import { ContextNotes } from "../workflow/comments/ContextNotes";
import type { Principal } from "../workflow/repository/contracts";
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
  principal: Principal;
  notesRecipient: Principal;
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
  setNotice: (message: string, tone?: "error") => void;
};

export default function PackageDetailPage({
  packageId,
  principal,
  notesRecipient,
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
          principalId={principal.id}
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
          principalId={principal.id}
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

      {selection === "/entry:Persiapan & SPMK" && (
        <ContextNotes key={`${packageId}:stage0`} context="stage0" state={workflow} principal={principal} recipient={notesRecipient} />
      )}
      {selection === "/documents:Kalibrasi & personel" && (
        <ContextNotes key={`${packageId}:stage1`} context="stage1" state={workflow} principal={principal} recipient={notesRecipient} />
      )}
      {selection === "/entry:Survei harian" && (
        <div className="stage3a-note-toolbar">
          <ContextNotes key={`${packageId}:stage3a`} context="stage3a" state={workflow} principal={principal} recipient={notesRecipient} />
          <ContextNotes key={`${packageId}:stage3a-field`} context="stage3a-field" state={workflow} principal={principal} recipient={notesRecipient} />
        </div>
      )}
      {selection === "/verification:Audit tingkat 1–3" && (
        <ContextNotes key={packageId} state={workflow} principal={principal} recipient={notesRecipient} />
      )}
      {showOverview ? (
        <PackageOverview
          state={workflow}
          onNavigate={onNavigate}
          onCorrections={onReturnToCorrections}
        />
      ) : (
        <OperationalWorkflowWorkspace
          principalId={principal.id}
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
