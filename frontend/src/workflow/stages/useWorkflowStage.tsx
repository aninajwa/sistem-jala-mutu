import {affectedReviewTypes} from '../periodicReview';
import {periodicSurveyTypes} from '../reviewReadiness';
import {RoleWorkSection} from '../RoleWorkSection';
import {submissionInputChanged} from '../submissionRevisions';
import {displayText} from '../displayText';
import { localPersistence } from '../repository/localPersistence';
import { FileText } from "lucide-react";
import { workflowMutationError } from "../workflowMutationPermissions";
import {
  markAuditsForReview,
  retainDecisionHistory,
} from "../workflowRevisions";

import {
  OperationalWorkflowState,
  PreparationState,
  SubmissionState,
  VervalCycle,
  WorkflowEvent,
} from "../model";
import { ChecklistPanel } from "../WorkflowComponents";

import type { WorkflowStageProps } from "./stageSupport";
import {
  collectAuditChanges,
  idNow,
  invalidateDependentStages,
  invalidateVervalStages,
  testId,
} from "./stageSupport";
export function useWorkflowStage({
  selection,
  state,
  onUpdate,
  setNotice,
  onNavigate,
}: WorkflowStageProps) {
  const goToBA = (
    kind:
      | "kalibrasi"
      | "konsistensi"
      | "internal"
      | "duaMingguan"
      | "bertahap"
      | "audit"
      | "penerimaan",
    period = 0,
  ) => {
    try {
      localPersistence.setItem(
        "jala-ba-navigation-v2",
        JSON.stringify({ packageId: state.project.id, kind, period }),
      );
    } catch {}
    try {
      localPersistence.setItem("jala-ba-return-to", selection);
    } catch {}
    onNavigate("/documents:BA & dokumen workflow");
  };
  const baAccess = (
    kind:
      | "kalibrasi"
      | "konsistensi"
      | "internal"
      | "duaMingguan"
      | "bertahap"
      | "audit"
      | "penerimaan",
    label: string,
    period = 0,
  ) => (
    <button
      type="button"
      className="wf-button"
      onClick={() => goToBA(kind, period)}
    >
      <FileText size={14} />
      {label}
    </button>
  );
  const commit = (
    activity: string,
    object: string,
    updater: (current: OperationalWorkflowState) => OperationalWorkflowState,
    notice?: string,
  ) => {
    const eventId = idNow("EVT");
    onUpdate(
      (current) => {
        const proposed = updater(current);
        const error = workflowMutationError(current, proposed, selection);
        if (error) {
          setNotice(error);
          return current;
        }
        const next = retainDecisionHistory(current, proposed);
        const changes = collectAuditChanges(current, next);
        const event: WorkflowEvent = {
          id: eventId,
          date: current.simulationDate,
          actor: current.role,
          action: activity,
          object,
          oldValue:
            changes
              .map((change) => `${change.path}: ${change.before}`)
              .join(" · ")
              .slice(0, 600) || "Tidak ada perubahan nilai",
          newValue:
            changes
              .map((change) => `${change.path}: ${change.after}`)
              .join(" · ")
              .slice(0, 600) || "Tidak ada perubahan nilai",
        };
        return { ...next, events: [event, ...next.events] };
      },
      activity,
      object,
    );
    if (notice) setNotice(notice);
  };
  const setPreparation = (
    updater: (p: PreparationState) => PreparationState,
    activity: string,
    object: string,
    notice?: string,
  ) =>
    commit(
      activity,
      object,
      (s) => {
        const preparation = updater(s.project.preparation);
        const invalidateMethod =
          preparation.reportApproval === "Perlu Revisi" ||
          preparation.reportApproval === "Ditolak";
        const next = { ...s, project: { ...s.project, preparation } };
        return invalidateMethod
          ? invalidateDependentStages(
              next,
              "Laporan pendahuluan perlu revisi; validasi dan audit harus diulang.",
            )
          : next;
      },
      notice,
    );
  const updateCycle = (patch: Partial<VervalCycle>, activity: string) =>
    commit(activity, state.project.packageName, (s) => {
      const changed = Object.entries(patch).some(
        ([key, value]) => !Object.is(s.cycle[key as keyof VervalCycle], value),
      );
      if (!changed) return s;
      const next = invalidateVervalStages(
        s,
        "Data atau protokol verval berubah; validasi dan audit perlu diulang.",
      );
      const changesTest = [
        "selectedTypes",
        "checkedProtocols",
        "iriCoefficientVariation",
        "pciAiStandardDeviation",
        "pciManualMaxDifferencePercent",
        "reRatingStatus",
      ].some((key) => key in patch && JSON.stringify(s.cycle[key as keyof VervalCycle])!==JSON.stringify(patch[key as keyof VervalCycle]));
      return {
        ...next,
        cycle: {
          ...s.cycle,
          ...patch,
          ...(changesTest
            ? {
                userReview: "Belum Diperiksa" as const,
                reviewPendingTypes:[...new Set([...(s.cycle.reviewPendingTypes??[]),...affectedReviewTypes(periodicSurveyTypes(s),s.cycle,patch)])],
                bridgeFieldValidation: false,
                finalPeriodValidation: false,
              }
            : {}),
          ...(!("certificateId" in patch) && changesTest
            ? { certificateId: "" }
            : {}),
        },
      };
    });
  const updateSubmission = (
    patch: Partial<SubmissionState>,
    activity: string,
  ) =>
    commit(activity, state.project.packageName, (s) => {
      const submission = { ...s.submission, ...patch };
      if (!("validationStatus" in patch)) submission.validationStatus = "Draft";
      const changedInput = submissionInputChanged(s.submission,patch);
      const invalidatesDownstream =
        (changedInput || patch.validationStatus === "Draft") &&
        (s.submission.validationStatus === "VALID" ||
          s.audits.some((audit) => audit.status !== "Belum Dimulai"));
      if (!invalidatesDownstream) return { ...s, submission };
      submission.validationStatus = "Draft";
      submission.validationMessage =
        "Bukti penyerahan berubah; validasi dan audit perlu diulang.";
      return {
        ...s,
        submission,
        audits: Object.keys(patch).some((key) =>
          [
            "rawFileName",
            "cleanedFileName",
            "geometryFormat",
            "topologyErrors",
            "stationingConsistent",
            "coordinatesBoundToLrs",
            "routeChanged",
            "routeLengthDeviation",
          ].includes(key),
        )
          ? markAuditsForReview(
              s,
              "Data teknis Tahap 4 berubah; tinjau cakupan audit terkait.",
            )
          : s.audits,
        acceptance: {
          ...s.acceptance,
          terms: s.acceptance.terms.map((term) =>
            term.id === "T3" || term.id === "T4"
              ? { ...term, complete: false }
              : term,
          ),
          semesterTwoRevalidation: false,
          finalReport: false,
          finalAcceptance: false,
        },
      };
    });
  const setCheck = (
    group: "sourceReviews" | "fieldPlan" | "coordination" | "documents",
    key: string,
    value: boolean,
  ) =>
    commit("Perbarui checklist persiapan", key, (s) => {
      const invalidated = invalidateDependentStages(
        s,
        "Checklist persiapan berubah; validasi dan audit harus diulang.",
      );
      return {
        ...invalidated,
        project: {
          ...invalidated.project,
          preparation: {
            ...s.project.preparation,
            [group]: { ...s.project.preparation[group], [key]: value },
            reportApproval: "Draft",
          },
        },
      };
    });
  const heading = (
    eyebrow: string,
    title: string,
    detail: string,
    tag = "WORKSPACE PAKET",
  ) => (
    <div className="wf-head">
      <div><div className="wf-eyebrow">{displayText(eyebrow)}</div><h1 className="wf-title">{displayText(title)}</h1></div>
      <details className="stage-context-help"><summary>Panduan kegiatan</summary><p>{displayText(detail)}</p></details>
    </div>
  );

  const toggleMap = (
    map: Record<string, boolean>,
    key: string,
    on: boolean,
    fn: (next: Record<string, boolean>) => void,
  ) => fn({ ...map, [key]: on });
  const renderChecklist = (
    title: string,
    icon: any,
    items: string[],
    checked: Record<string, boolean>,
    onToggle: (key: string, on: boolean) => void,
    disabled = false,
  ) => (
    <RoleWorkSection primary={!disabled} title={displayText(title)}><ChecklistPanel
      title={displayText(title)}
      icon={icon}
      items={items.map((item) => ({
        id: `${testId(title)}-${testId(item)}`,
        label: item,
        checked: !!checked[item],
        disabled,
      }))}
      onChange={(id, value) => {
        const item = items.find(
          (candidate) => `${testId(title)}-${testId(candidate)}` === id,
        );
        if (item) onToggle(item, value);
      }}
    /></RoleWorkSection>
  );

  return {
    baAccess,
    goToBA,
    commit,
    setPreparation,
    updateCycle,
    updateSubmission,
    setCheck,
    heading,
    toggleMap,
    renderChecklist,
  };
}
