import { correctionSourceStage, manualCorrectionSources } from "../correctionSourcePolicy";
import { CorrectionSubmittedEvidence } from "../CorrectionSubmittedEvidencePanel";
import { correctionDisplayStatus } from "../correctionPresentation";
import { periodForDate } from "../workflowRevisions";
import { CorrectionRevisionHistory } from "../CorrectionRevisionHistoryPanel";
import { CORRECTION_VERIFICATION_STEPS, CORRECTION_VERIFICATION_LABELS, correctionVerificationAttempt, correctionProposalRevision, correctionVerificationEvidenceErrors, correctionVerificationMetadataFor, type CorrectionVerificationEvidence, type CorrectionVerificationStep } from "../correctionVerificationEvidence";
import { Fragment } from "react";
import { correctionExecutionSummary, correctionResultReference, correctionProposalTechnicalSummary } from "../correctionFormEngine";
import { correctionCreationError } from "../correctionCreation";
import { requiresLayeredCorrectionVerification } from "../correctionActionPolicy";
import type { CorrectionExecution } from "../correctionFormEngine";
import {correctionActionChange, correctionActionErrors, correctionAllowsNotApplicable, correctionCompatibleActions} from "../correctionActionPolicy";
import {correctionReviewer} from '../checkpoint09Corrections';
import {usePersistedDraft} from '../../hooks/usePersistedDraft';
import {
  ArrowRight,
  ClipboardCheck,
  Plus,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useCorrectionSelection } from "./useCorrectionSelection";
import { CorrectionEvidenceField } from "../CorrectionEvidenceField";
import { CorrectionExecutionForm } from "./CorrectionExecutionForm";
import { correctionCanOpenCase, correctionDefaultView, correctionVisibleViews, correctionViewLabel, correctionProposalEditable } from "./correctionJourney";

import {
  visibleProposalScenarioChecks,
  updateProposalScenarioCheck,
  RULE_NUMBERS,
  RULE_SCENARIOS,
  correctionProposalScenarioErrors,
  requiresNewScenarioEvidence,
  suggestedScenario,
} from "../correctionRules";
import { applyClosedCorrection, correctionClosureErrors } from "../flowRules";
import {
  CORRECTION_GUIDANCE,
  CorrectionCase,
  SURVEY_TYPES,
  SurveyType,
} from "../model";

import { matchingCorrectionRecords, correctionRecordLink, correctionWithSourceMethod, eligibleCorrectionRecords } from "../correctionRecordLink";
import { correctionAttemptNumber, resetCorrectionAttempt } from "../correctionAttempt";
import { correctionEventSummary } from "../correctionHistory";
import type { WorkflowStageProps } from "./stageSupport";
import {
  Badge,
  Button,
  CheckRow,
  defaultCase,
  Field,
  Panel,
  Select,
  testId,
} from "./stageSupport";
import { useWorkflowStage } from "./useWorkflowStage";

export function CorrectionWorkspace(props: WorkflowStageProps) {
  const { selection, state, onUpdate, setNotice, onNavigate } = props;
  const isPenyedia = state.role === "Penyedia Jasa / Ketua Tim";
  const isBalai = state.role === "PIC Balai / Pengguna Jasa";
  const { commit, heading } = useWorkflowStage(props);
  const [draft,setDraft]=usePersistedDraft<Record<string,string>>(`jala-ui-draft:${state.project.id}:${state.role}:CorrectionWorkspace`,{});
  const [editingDraft, setEditingDraft] = useState(true);
  const [reviewDraft, setReviewDraft] = usePersistedDraft<Record<string, string>>(`jala-correction-review:${state.project.id}:${state.role}`, {});

  const [view, setView] = useState<"finding" | "proposal" | "approval" | "execution" | "verification" | "history">();
  const [prodType, setProdType] = useState<SurveyType>("IRI");
  const [newCase, setNewCase] = useState<CorrectionCase>(() =>
    ({...defaultCase(state),dueDate:"",stationing:"",owner:"",surveyType:state.project.surveyTypes[0]??"IRI",linkedRecordId:undefined,originalValue:"Belum ada nilai raw tertaut"}),
  );
  const [caseId, setCaseId] = useCorrectionSelection(state.project.id);
  const test = state.productionTests[prodType];
  const selectedCase =
  state.corrections.find((c) => c.id === caseId) ??
  (!selection.startsWith("/actions:") ? state.corrections[0] : undefined);

const isDirektorat = state.role === "Direktorat / Pusat";

const correctionAuditLevel =
  selectedCase?.blockedStage.match(/^Audit tingkat ([123])$/i)?.[1];

const canVerifyCorrection = !!selectedCase && state.role===correctionReviewer(selectedCase);
// Bind reviewer input to the current submission attempt, never reuse a previous
// approval/rejection draft after the Penyedia resubmits a revised proposal.
const attempt = selectedCase ? correctionAttemptNumber(state.events, selectedCase.id) : 0;
const reviewDraftKey = selectedCase ? `${selectedCase.id}:submission-${attempt}` : "";
const retestDraftKey = reviewDraftKey;
const proposalEditable = !!selectedCase && correctionProposalEditable(selectedCase);

const openedFromActions = selection.startsWith("/actions:");

useEffect(() => {
  setEditingDraft(selectedCase?.retest !== "Gagal");
  setView(undefined);
}, [selectedCase?.id, selectedCase?.retest]);
useEffect(() => setView(undefined), [selectedCase?.status]);
  const saveText = (key: string, value: string) =>
    setDraft((old) => ({ ...old, [key]: value }));

  const patchNew = (patch: Partial<CorrectionCase>) =>
    setNewCase((current) => {
      const next = { ...current, ...patch };
      if ("source" in patch) {
        const stage = correctionSourceStage(next.source);
        if (stage) { next.blockedStage = stage; next.returnStage = stage; }
      }
      if ("road" in patch || "surveyType" in patch || "source" in patch) {
        // Never silently bind the first record: several records may share a route/type.
        next.linkedRecordId = undefined;
        next.originalValue = "Belum ada nilai raw tertaut";
      }
      if ("linkedRecordId" in patch) {
        const link = correctionRecordLink(state.dailyRecords, next.road, next.surveyType, patch.linkedRecordId);
        next.linkedRecordId = link?.id;
        next.originalValue = link?.rawValue || "Belum ada nilai raw tertaut";
      }
      return next;
    });
  const updateCurrent = (patch: Partial<CorrectionCase>, activity: string) => {
    if (!selectedCase) return;
    if (!isPenyedia && !isBalai &&
        !(isDirektorat && correctionAuditLevel === "3")) {
      setNotice("Peran tidak berwenang mengubah kasus.");
      return;
    }

    const changesRetest =
      "retest" in patch || "retestReference" in patch;

    // Clearing an old attempt during proposal submission/revision is not a retest decision.
    // Actual Lulus/Gagal remains restricted to the source reviewer and the central transaction guard.
    const resetsProposalAttempt = patch.retest === "Belum Diuji" &&
      patch.retestReference === undefined && patch.retestFailureReason === undefined && patch.executionReference === undefined &&
      ((isPenyedia && (selectedCase.status === "Terbuka" || selectedCase.status === "Verifikasi Ulang" && selectedCase.retest === "Gagal") && patch.status === "Menunggu Persetujuan" && patch.approval === "Diajukan") ||
       (isBalai && selectedCase.status === "Menunggu Persetujuan" && patch.status === "Terbuka" && patch.approval === "Perlu Revisi"));
    if (changesRetest && !canVerifyCorrection && !resetsProposalAttempt) {
      setNotice("Pemeriksaan ulang bukan kewenangan peran ini.");
      return;
    }

    if (isDirektorat) {
      const allowed = new Set([
        "status", "retest", "retestReference", "retestFailureReason",
        "approval", "verification", "verificationEvidence",
      ]);

      if (
        correctionAuditLevel !== "3" ||
        !["Dilaksanakan", "Verifikasi Ulang"].includes(
          selectedCase.status
        ) ||
        !changesRetest ||
        Object.keys(patch).some(key => !allowed.has(key)) ||
        (patch.status === "Terbuka" && !(
          patch.retest === "Gagal" &&
          patch.approval === "Perlu Revisi" &&
          !!patch.retestReference?.trim() &&
          !!patch.retestFailureReason?.trim() &&
          patch.verification?.surveyor === false &&
          patch.verification?.teamLeader === false &&
          patch.verification?.balai === false
        )) ||
        (patch.status === "Verifikasi Ulang" && patch.retest !== "Lulus")
      ) {
        setNotice(
          "Direktorat hanya dapat memeriksa ulang Audit Tingkat 3."
        );
        return;
      }
    }
    if (selectedCase.status === "Ditutup") {
      setNotice("Kasus yang sudah ditutup tidak dapat diubah.");
      return;
    }
    // Identitas temuan ditetapkan oleh pemeriksaan asal, bukan form tindak lanjut.
    const immutableFields = ["id", "source", "blockedStage", "road", "stationing", "surveyType", "severity", "rejectionReason"];
    if (immutableFields.some(field => field in patch)) {
      setNotice("Identitas temuan berasal dari pemeriksaan dan tidak dapat diganti dalam rencana tindakan.");
      return;
    }
    if (isBalai) {
  const allowedFields = new Set([
    "reviewNote",
    "verification",
    "verificationEvidence",
    "approval",
    "status",
    "retest",
    "retestReference",
    "retestFailureReason",
  ]);

  if (Object.keys(patch).some(key => !allowedFields.has(key))) {
    setNotice(
      "Rencana tindakan dan bukti hanya dapat diperbarui oleh Penyedia Jasa.",
    );
    return;
  }
}

if (isPenyedia && "reviewNote" in patch) {
  setNotice("Catatan keputusan merupakan kewenangan PIC Balai.");
  return;
}
    // Field checks alone are insufficient: gate modifications by action status.

const failedRetestReturn =
  canVerifyCorrection &&
  ["Dilaksanakan", "Verifikasi Ulang"].includes(selectedCase.status) &&
  patch.status === "Terbuka" &&
  patch.approval === "Perlu Revisi" &&
  patch.retest === "Gagal" &&
  typeof patch.retestReference === "string" &&
  !!patch.retestReference.trim() &&
  typeof patch.retestFailureReason === "string" &&
  !!patch.retestFailureReason.trim();

if (
  isBalai &&
  selectedCase.status !== "Menunggu Persetujuan" &&
  !failedRetestReturn &&
  (
    "approval" in patch ||
    "reviewNote" in patch ||
    ("verification" in patch && patch.verification?.balai === true)
  )
) {
      setNotice("Pemeriksaan Balai hanya dilakukan pada usulan yang sedang menunggu persetujuan.");
      return;
    }
    const changesProposal = [
      "rootCause",
      "fieldDataValid",
      "surveyType",
      "actionType",
      "proposedPlan",
      "evidence",
      "originalValue",
      "proposedValue",
      "returnStage",
      "linkedRecordId",
      "ruleScenario",
      "ruleChecks",
      "ruleNumbers",
      "provinceUpdateBa",
      "owner", "dueDate",
    ].some((key) => key in patch);
    const safePatch = changesProposal
      ? {
          ...patch,
          verification: { surveyor: false, teamLeader: false, balai: false },
          verificationEvidence: undefined,
          approval: "Draft" as const,
          status: "Terbuka" as const,
          ...resetCorrectionAttempt(),
        }
      : patch;
    commit(activity, selectedCase.id, (s) => ({
      ...s,
      corrections: s.corrections.map((c) =>
        c.id === selectedCase.id ? { ...c, ...safePatch } : c,
      ),
    }));
  };
  const create = () => {
    if (!correctionCanOpenCase(state.role)) {
      setNotice(
        "Pilih peran Penyedia Jasa atau Pengguna Jasa untuk membuka kasus.",
      );
      return;
    }
    if (!newCase.rejectionReason.trim() || !newCase.road.trim()) {
      setNotice("Ruas dan alasan temuan diperlukan untuk membuka kasus.");
      return;
    }
    const linked = correctionRecordLink(state.dailyRecords,newCase.road,newCase.surveyType,newCase.linkedRecordId);
    const caseToOpen = correctionWithSourceMethod(newCase.blockedStage === "Verval 14 hari" ? { ...newCase, cyclePeriod: linked ? periodForDate(state,linked.date) : (state.activeCyclePeriod ?? 1) } : newCase,state.dailyRecords);
    if (newCase.blockedStage === "Verval 14 hari" && caseToOpen.cyclePeriod === undefined) { setNotice("Rekaman tidak berada dalam periode survei paket."); return; }
    const creationError = correctionCreationError(state, caseToOpen);
    if (creationError) { setNotice(creationError); return; }
    commit(
      "Buka kasus koreksi berbukti",
      newCase.id,
      (s) => ({ ...s, corrections: [{ ...caseToOpen }, ...s.corrections] }),
      "Kasus baru tercatat dan menahan tahap asal",
    );
    setCaseId(newCase.id);
    setNewCase({...defaultCase(state),dueDate:"",stationing:"",owner:"",surveyType:state.project.surveyTypes[0]??"IRI",linkedRecordId:undefined,originalValue:"Belum ada nilai raw tertaut"});
  };
  const submitAction = () => {
    if (!selectedCase) return;
    if (state.role !== "Penyedia Jasa / Ketua Tim") {
      setNotice(
        "Peran Penyedia Jasa / Ketua Tim diperlukan untuk mengajukan tindakan.",
      );
      return;
    }
    if (
      !proposalEditable
    ) {
      setNotice(
        "Tindakan hanya dapat diajukan dari kasus terbuka atau hasil uji ulang yang gagal.",
      );
      return;
    }
    if (
      !selectedCase.owner.trim() ||
      !selectedCase.rootCause.trim() ||
      !selectedCase.fieldDataValid ||
      !selectedCase.actionType ||
      !selectedCase.proposedPlan?.trim() ||
      !selectedCase.evidence.trim()
    ) {
      setNotice(
        "Lengkapi penanggung jawab, akar masalah, validitas data, jenis tindakan, rencana kerja, dan bukti terlebih dahulu.",
      );
      return;
    }
    const actionErrors = correctionActionErrors(selectedCase);
    if (actionErrors.length) { setNotice(actionErrors[0]); return; }
    if (
      selectedCase.actionType === "Koreksi pemrosesan dengan bukti" &&
      (!selectedCase.proposedValue.trim() ||
        !selectedCase.originalValue.trim() ||
        !correctionRecordLink(state.dailyRecords, selectedCase.road, selectedCase.surveyType, selectedCase.linkedRecordId) ||
        correctionRecordLink(state.dailyRecords, selectedCase.road, selectedCase.surveyType, selectedCase.linkedRecordId)?.rawValue !== selectedCase.originalValue)
    ) {
      setNotice(
        "Koreksi data memerlukan nilai raw tertaut dan nilai usulan cleaned.",
      );
      return;
    }
    if (
      requiresLayeredCorrectionVerification(selectedCase) && (!selectedCase.verification?.surveyor ||
      !selectedCase.verification?.teamLeader)
    ) {
      setNotice(
        "Catat bukti pemeriksaan Surveyor dan Ketua Tim sebelum usulan dikirim.",
      );
      return;
    }
    const verificationErrors = requiresLayeredCorrectionVerification(selectedCase) ? correctionVerificationEvidenceErrors(selectedCase, correctionVerificationAttempt(selectedCase, attempt), ["surveyor", "teamLeader"]) : [];
    if (verificationErrors.length) { setNotice(verificationErrors.join(" · ")); return; }
    const ruleErrors = correctionProposalScenarioErrors(selectedCase);
    if (ruleErrors.length) {
      setNotice(ruleErrors.join(" · "));
      return;
    }
    updateCurrent(
      { ...resetCorrectionAttempt(), status: "Menunggu Persetujuan", approval: "Diajukan" },
      "Ajukan tindakan koreksi untuk persetujuan",
    );
    // The persisted status/next actor confirms submission; never mask a rejected transaction with a success notice.
  };
  const approve = () => {
    if (!selectedCase) return;
    if (state.role !== "PIC Balai / Pengguna Jasa") {
      setNotice(
        "Peran aktif saat ini tidak menyetujui tindakan. Pilih PIC Balai / Pengguna Jasa.",
      );
      return;
    }
    if (
      selectedCase.status !== "Menunggu Persetujuan" ||
      selectedCase.approval !== "Diajukan"
    ) {
      setNotice(
        "Usulan harus berstatus menunggu persetujuan sebelum disetujui.",
      );
      return;
    }
    const decisionNote = (reviewDraft[reviewDraftKey] ?? "").trim();
    if (!selectedCase.verification?.balai || !decisionNote) {
      setNotice(
        "Balai harus memverifikasi bukti dan mencatat dasar keputusan.",
      );
      return;
    }
    const verificationErrors = requiresLayeredCorrectionVerification(selectedCase) ? correctionVerificationEvidenceErrors(selectedCase, correctionVerificationAttempt(selectedCase, attempt), CORRECTION_VERIFICATION_STEPS) : [];
    if (verificationErrors.length) { setNotice(verificationErrors.join(" · ")); return; }
    updateCurrent(
      { reviewNote: decisionNote, approval: "Disetujui", status: "Disetujui" },
      "Setujui tindakan koreksi",
    );
  };
  const executeAction = (submittedReference: string, executionResult: CorrectionExecution) => {
    if (!selectedCase) return;
    if (state.role !== "Penyedia Jasa / Ketua Tim") {
      setNotice("Peran Penyedia Jasa diperlukan untuk melaksanakan tindakan.");
      return;
    }
    if (
      selectedCase.status !== "Disetujui" ||
      selectedCase.approval !== "Disetujui"
    ) {
      setNotice("Tindakan belum memperoleh persetujuan Pengguna Jasa.");
      return;
    }
    const executionReference = (submittedReference ?? "").trim();
    if (!executionReference) {
      setNotice('Catat referensi hasil tindakan nyata (ID rekaman baru / dokumen hasil survei ulang, kalibrasi, atau pemrosesan) sebelum menandai dilaksanakan.');
      return;
    }
    updateCurrent(
      { status: "Dilaksanakan", executionReference, executionResult },
      "Catat pelaksanaan tindakan dan referensi hasil",
    );
  };
  const runRetest = () => {
    if (!selectedCase) return;
    if (!canVerifyCorrection) {
      setNotice(`Pemeriksaan ulang kasus ini menjadi kewenangan ${selectedCase?correctionReviewer(selectedCase):'pemeriksa tahap sumber'}.`);
      return;
    }
    if (
      selectedCase.status !== "Dilaksanakan"
    ) {
      setNotice("Hasil pemeriksaan hanya dapat dicatat setelah pelaksanaan dan sebelum keputusan disimpan.");
      return;
    }
    const result = draft[`retest-${retestDraftKey}`] ?? selectedCase.retest;
    if (result !== "Lulus" && result !== "Gagal") {
      setNotice("Pilih hasil uji ulang Lulus atau Gagal terlebih dahulu.");
      return;
    }
    const retestReference = (draft[`retest-reference-${retestDraftKey}`] ?? selectedCase.retestReference ?? '').trim();
    if (!selectedCase.executionReference || !retestReference) {
      setNotice('Hasil pelaksanaan dan referensi pemeriksaan ulang tahap asal harus tersedia.');
      return;
    }
    const failureReason = (draft[`retest-failure-reason-${retestDraftKey}`] ?? "").trim();
    if (result === "Gagal" && !failureReason) {
      setNotice("Jelaskan alasan teknis hasil Gagal. Referensi pemeriksaan saja belum cukup.");
      return;
    }

if (result === "Gagal") {
  updateCurrent(
    {
      status: "Terbuka",
      approval: "Perlu Revisi",
      retest: "Gagal",
      retestReference,
      retestFailureReason: failureReason,
      verificationEvidence: undefined,
      verification: {
        surveyor: false,
        teamLeader: false,
        balai: false,
      },
    },
    `Uji ulang gagal; ${failureReason}. Referensi: ${retestReference}`,
  );

  return;
}

updateCurrent(
  {
    status: "Verifikasi Ulang",
    retest: result,
    retestReference,
  },
  "Catat hasil pemeriksaan ulang lulus dengan referensi",
);
  };
  const closeCase = () => {
    if (!selectedCase) return;
    if (!canVerifyCorrection) {
      setNotice(
        "Penutupan hanya oleh pemeriksa tahap asal.",
      );
      return;
    }
    if (selectedCase.status !== "Verifikasi Ulang") {
      setNotice("Catat hasil uji ulang terlebih dahulu sebelum menutup kasus.");
      return;
    }
    if (selectedCase.retest !== "Lulus") {
      setNotice("Kasus tidak dapat ditutup sebelum hasil uji ulang lulus.");
      return;
    }
    const errors = correctionClosureErrors(state, selectedCase);
    if (errors.length) {
      setNotice(errors.join(" · "));
      return;
    }
    commit(
      "Tutup kasus setelah verifikasi hasil pada sistem sumber",
      selectedCase.id,
      (s) => applyClosedCorrection(s, selectedCase),
    );
    const destinations: Record<string, string> = {
      Kalibrasi: "/documents:Kalibrasi & personel",
      "Validasi produksi": "/entry:Validasi produksi",
      "Verval 14 hari": "/verification:Verval 14 hari",
      "Gerbang RNI/LRS": "/entry:Gerbang RNI/LRS",
      "Audit tingkat 1": "/verification:Audit tingkat 1–3",
      "Audit tingkat 2": "/verification:Audit tingkat 1–3",
      "Audit tingkat 3": "/verification:Audit tingkat 1–3",
      "Penerimaan & termin": "/reports:Penerimaan & termin",
    };
    if (destinations[selectedCase.returnStage])
      onNavigate(destinations[selectedCase.returnStage]);

  };
  const verificationDraftKey = (step: CorrectionVerificationStep, field: string) => `${selectedCase?.id}:verification-${correctionVerificationAttempt(selectedCase!, attempt)}:${correctionProposalRevision(selectedCase!)}:${step}:${field}`;
  const verificationInput = (step: CorrectionVerificationStep, field: keyof Pick<CorrectionVerificationEvidence, "reviewerIdentity" | "reviewedAt" | "dataVersionReference" | "evidenceReference">) => draft[verificationDraftKey(step, field)] ?? selectedCase?.verificationEvidence?.[step]?.[field] ?? "";
  const verifyStep = (
    key: "surveyor" | "teamLeader" | "balai",
    value: boolean,
  ) => {
    if (!selectedCase) return;
    const expected =
      key === "balai"
        ? "PIC Balai / Pengguna Jasa"
        : "Penyedia Jasa / Ketua Tim";
    if (state.role !== expected) {
      setNotice(`Langkah ini memerlukan peran ${expected}.`);
      return;
    }
    if (key === "balai" && selectedCase.status !== "Menunggu Persetujuan") {
      setNotice("Verifikasi Balai hanya tersedia untuk usulan yang telah diajukan.");
      return;
    }
    if (
      (value && key === "teamLeader" && !selectedCase.verification?.surveyor) ||
      (value && key === "balai" && requiresLayeredCorrectionVerification(selectedCase) && !selectedCase.verification?.teamLeader)
    ) {
      setNotice("Ikuti urutan Surveyor → Team Leader → Balai.");
      return;
    }
    const verification = {
      surveyor: false,
      teamLeader: false,
      balai: false,
      ...selectedCase.verification,
      [key]: value,
    };
    if (!value) {
      verification.balai = false;
      if (key === "surveyor") verification.teamLeader = false;
    }
    const layered = requiresLayeredCorrectionVerification(selectedCase);
    const verificationEvidence = { ...selectedCase.verificationEvidence };
    if (layered) {
      if (value) {
        verificationEvidence[key] = correctionVerificationMetadataFor(selectedCase, key, correctionVerificationAttempt(selectedCase, attempt), {
          reviewerIdentity: verificationInput(key, "reviewerIdentity"),
          reviewedAt: verificationInput(key, "reviewedAt"),
          dataVersionReference: verificationInput(key, "dataVersionReference"),
          evidenceReference: verificationInput(key, "evidenceReference"),
        });
        if (key === "surveyor") { delete verificationEvidence.teamLeader; delete verificationEvidence.balai; verification.teamLeader = false; verification.balai = false; }
        if (key === "teamLeader") { delete verificationEvidence.balai; verification.balai = false; }
      } else {
        delete verificationEvidence[key];
        if (key === "surveyor") delete verificationEvidence.teamLeader;
        if (key !== "balai") delete verificationEvidence.balai;
      }
      const errors = correctionVerificationEvidenceErrors({ ...selectedCase, verification, verificationEvidence }, correctionVerificationAttempt(selectedCase, attempt), value ? (key === "balai" ? CORRECTION_VERIFICATION_STEPS : key === "teamLeader" ? ["surveyor", "teamLeader"] : ["surveyor"]) : []);
      if (errors.length) { setNotice(errors.join(" · ")); return; }
    }
    updateCurrent(
      {
        verification,
        ...(layered ? { verificationEvidence } : {}),
        ...(!value && key!=="balai"
          ? { approval: "Draft" as const, status: "Terbuka" as const }
          : {}),
      },
      key === "surveyor" ? "Ketua Tim mencatat bukti pemeriksaan Surveyor" : key === "teamLeader" ? "Ketua Tim mencatat hasil pemeriksaan internal" : "Balai mencatat pemeriksaan bukti",
    );
  };
  const requestCaseRevision = () => {
    if (!selectedCase) return;
    if (state.role !== "PIC Balai / Pengguna Jasa") {
      setNotice("Pengguna Jasa mengembalikan usulan.");
      return;
    }
    if (selectedCase.status !== "Menunggu Persetujuan") {
      setNotice("Hanya usulan yang menunggu pemeriksaan dapat dikembalikan untuk revisi.");
      return;
    }
    const decisionNote = (reviewDraft[reviewDraftKey] ?? "").trim();
    if (!decisionNote) {
      setNotice("Alasan pengembalian wajib diisi.");
      return;
    }
    updateCurrent(
      {
        reviewNote: decisionNote,
        approval: "Perlu Revisi",
        status: "Terbuka",
        retest: "Belum Diuji",
        verificationEvidence: undefined,
        verification: { surveyor: false, teamLeader: false, balai: false },
      },
      "Kembalikan usulan ke akar masalah",
    );
  };
  const compatibleActions = selectedCase ? correctionCompatibleActions(selectedCase) : [];
  const availableViews = selectedCase ? correctionVisibleViews(state.role, selectedCase) : [];
  const queueTab = new URLSearchParams(window.location.search).get("tab");
  const defaultView = openedFromActions && isBalai && ["Antrian Verifikasi", "Tindak Lanjut Paket"].includes(queueTab ?? "") ? "finding" : selectedCase ? correctionDefaultView(state.role, selectedCase) : "finding";
  const activeView = view && availableViews.includes(view) ? view : defaultView;
  const sections = availableViews.map((key) => [key, correctionViewLabel(state.role, selectedCase!, key)] as const);
  return (
    <>
      {!openedFromActions && heading("Kasus perbaikan", "Tindakan Perbaikan", "")}
      {!openedFromActions && (
  <div className="wf-grid">
    <Panel
      title="Kasus koreksi terbuka"
          icon={TriangleAlert}
          extra={
            <Badge tone="warn">
              {state.corrections.filter((c) => c.status !== "Ditutup").length}{" "}
              aktif
            </Badge>
          }
        >
          {state.corrections.length ? (
            <div className="wf-table">
              <table data-testid="table-correction-cases">
                <thead>
                  <tr>
                    <th>ID / asal</th>
                    <th>Ruas · tahap tertahan</th>
                    <th>Severity</th>
                    <th>Status / uji</th>
                    <th>Buka</th>
                  </tr>
                </thead>
                <tbody>
                  {state.corrections.map((c) => (
                    <tr key={c.id} data-testid={`row-correction-${c.id}`}>
                      <td>
                        <strong>{c.id}</strong>
                        <div className="wf-note">{c.source}{c.calibrationFinding ? ` · ${c.calibrationFinding.surveyType} / ${c.calibrationFinding.subject}` : ""}</div>
                      </td>
                      <td>
                        {c.road}
                        <div className="wf-note">{c.blockedStage}</div>
                      </td>
                      <td>
                        <Badge
                          tone={
                            c.severity === "Kritis"
                              ? "bad"
                              : c.severity === "Mayor"
                                ? "warn"
                                : "info"
                          }
                        >
                          {c.severity}
                        </Badge>
                      </td>
                      <td>
                        {c.status}
                        <div className="wf-note">Uji: {c.retest}</div>
                      </td>
                      <td>
                        <button
                          className="wf-button"
                          data-testid={`button-open-correction-${c.id}`}
                          onClick={() => setCaseId(c.id)}
                        >
                          Pilih kasus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="wf-empty">
              Belum ada kasus. Form berikut membuka kasus dengan bukti dan tahap
              asal yang jelas.
            </div>
          )}
        </Panel>
        {correctionCanOpenCase(state.role) && <details className="correction-new-case">
  <summary>
    <Plus size={15} />
    Buka temuan baru
  </summary>
  <Panel title="Identitas temuan baru" icon={Plus}>
          <div className="wf-fields">
            <Field label="Sumber kasus">
              <Select
                id="select-case-source"
                value={newCase.source}
                options={[...manualCorrectionSources]}
                onChange={(v) => patchNew({ source: v })}
              />
            </Field>
            <Field label="Tahap tertahan">
              <div id="select-case-stage">{newCase.blockedStage}</div>
            </Field>
            <Field label="Ruas">
              <Select
                id="select-case-road"
                value={newCase.road}
                options={[
                  ...new Set(
                    [newCase.road, ...state.project.routes].filter(Boolean),
                  ),
                ]}
                onChange={(v) => patchNew({ road: v })}
              />
            </Field>
            <Field label="Jenis survei">
              <Select
                id="select-new-case-type"
                value={newCase.surveyType}
                options={[...SURVEY_TYPES]}
                onChange={(v) => patchNew({ surveyType: v as SurveyType })}
              />
            </Field>
            <Field label="Rekaman sumber (opsional)">
              <select
                className="wf-input"
                data-testid="select-new-case-record"
                value={newCase.linkedRecordId ?? ""}
                onChange={(e) => patchNew({ linkedRecordId: e.target.value || undefined })}
              >
                <option value="">Tanpa tautan rekaman — temuan administratif/checklist</option>
                {matchingCorrectionRecords(state.dailyRecords, newCase.road, newCase.surveyType).map(record => (
                  <option key={record.id} value={record.id}>
                    {record.id} · {record.date} · {record.rawValue || "Nilai raw kosong"}
                  </option>
                ))}
              </select>
              <small>Jika temuan berasal dari hasil survei, pilih ID rekaman yang benar; jangan menebak dari ruas.</small>
            </Field>
            <Field label="STA">
              <input
                data-testid="input-case-stationing"
                value={newCase.stationing}
                onChange={(e) => patchNew({ stationing: e.target.value })}
              />
            </Field>
            <Field label="Alasan penolakan / tahan" full>
              <textarea
                data-testid="input-case-reason"
                value={newCase.rejectionReason}
                onChange={(e) => patchNew({ rejectionReason: e.target.value })}
              />
            </Field>
            <Field label="Severity">
              <Select
                id="select-case-severity"
                value={newCase.severity}
                options={["Kritis", "Mayor", "Minor"]}
                onChange={(v) =>
                  patchNew({ severity: v as CorrectionCase["severity"] })
                }
              />
            </Field>
            <Field label="PIC">
              <input
                data-testid="input-case-owner"
                value={newCase.owner}
                onChange={(e) => patchNew({ owner: e.target.value })}
              />
            </Field>
            <Field label="Jatuh tempo">
              <input
                type="date"
                data-testid="input-case-due"
                value={newCase.dueDate}
                onChange={(e) => patchNew({ dueDate: e.target.value })}
              />
            </Field>
            <div className="wf-field full">
              <Button
                id="button-create-correction"
                kind="primary"
                onClick={create}
              >
                <Plus size={13} />
                Buka kasus tertahan
              </Button>
            </div>
          </div>
        </Panel>
        </details>}
      </div>
      )}
      {!selectedCase && openedFromActions && (
        <div className="wf-callout warn">Kasus yang dipilih tidak ditemukan. Kembali ke Tindakan Perbaikan dan pilih kasus kembali.</div>
      )}
      {selectedCase && (
  <div className="wf-grid correction-case-work">
    {!openedFromActions && <header className="correction-case-identity" aria-label="Konteks kasus aktif">
      <div className="correction-case-identity-main">
        <span className="correction-case-id">{selectedCase.id}</span>
        <strong>{selectedCase.surveyType} · {selectedCase.road}</strong>
        <span>{selectedCase.blockedStage}</span>
      </div>
      <div className="correction-case-identity-status">
        <Badge tone={selectedCase.status === "Ditutup" ? "good" : selectedCase.retest === "Gagal" ? "bad" : "warn"}>
          {correctionDisplayStatus(selectedCase)}
        </Badge>
        {selectedCase.dueDate && <span>Tenggat: {selectedCase.dueDate}</span>}
      </div>
    </header>}
    <nav className="correction-work-nav b-view-tabs" aria-label="Bagian kasus">
      {sections.map(([key, label]) => (
        <button type="button" key={key} className="wf-button" aria-current={activeView === key ? "step" : undefined}
          onClick={() => setView(key)}>{label}</button>
      ))}
    </nav>
    {activeView === "finding" && (
      <Panel title="Temuan dan bukti sumber" icon={TriangleAlert}>
        <dl className="v2-decision-facts">
          <dt>Sumber temuan</dt><dd>{selectedCase.source} · {selectedCase.blockedStage}</dd>
          <dt>Lingkup</dt><dd>{selectedCase.surveyType} · {selectedCase.road || "Paket / objek belum dirinci"}{selectedCase.stationing ? ` · ${selectedCase.stationing}` : ""}</dd>
          {selectedCase.originReference && <><dt>Bukti pemeriksaan asal</dt><dd>{selectedCase.originReference}</dd></>}
          {selectedCase.cyclePeriod && <><dt>Periode data</dt><dd>{selectedCase.cyclePeriod}</dd></>}
          <dt>Uraian temuan</dt><dd>{selectedCase.rejectionReason || "Belum tercatat"}</dd>
          <dt>Rekaman sumber</dt><dd>{selectedCase.linkedRecordId || "Belum tertaut"}</dd>
          <dt>Penanggung jawab</dt><dd>{selectedCase.owner || "Belum ditetapkan"}</dd>
          {selectedCase.dueDate && <><dt>Tenggat</dt><dd>{selectedCase.dueDate}</dd></>}
        </dl>
        {isBalai && queueTab === "Antrian Verifikasi" && availableViews.includes("proposal") && <div className="wf-toolbar"><button type="button" className="wf-button" onClick={()=>setView("proposal")}>Lanjut ke usulan <ArrowRight size={16}/></button></div>}
      </Panel>
    )}
    {activeView === "proposal" && (
      <>
{isPenyedia && proposalEditable && selectedCase.approval === "Perlu Revisi" && selectedCase.reviewNote && (
  <div className="wf-callout warn" role="note"><strong>Usulan dikembalikan oleh Balai</strong><p className="wf-note">{selectedCase.reviewNote}</p></div>
)}
{isPenyedia && proposalEditable && selectedCase.retest === "Gagal" && (
  <section className="wf-panel" aria-label="Keputusan pemeriksaan terakhir">
    <div className="wf-panel-head"><h3>Hasil pemeriksaan: Gagal</h3><Badge tone="bad">Gagal</Badge></div>
    <div className="wf-body">
      <div className="correction-review-summary">
        <div className="full"><small>Alasan pemeriksa</small><strong>{selectedCase.retestFailureReason || "Keputusan lama: alasan belum dicatat; periksa dokumen sumber"}</strong></div>
        <div className="full"><small>Referensi hasil pemeriksaan</small><strong>{selectedCase.retestReference || "Belum tersedia"}</strong></div>
      </div>
      {!editingDraft ? (
        <button type="button" className="wf-button" onClick={() => {
          setEditingDraft(true);
          setView("proposal");
        }}>Mulai perbaikan</button>
      ) : null}
    </div>
  </section>
)}


{isPenyedia&&editingDraft&&proposalEditable&&<div className="wf-fields"><label className="wf-field">Penanggung jawab pelaksanaan<input aria-label="Penanggung jawab pelaksanaan" value={selectedCase.owner} onChange={e=>updateCurrent({owner:e.target.value},'Tetapkan penanggung jawab tindakan')}/></label><label className="wf-field">Tenggat rencana · opsional sesuai penugasan<input type="date" aria-label="Tenggat rencana tindakan" value={selectedCase.dueDate} onChange={e=>updateCurrent({dueDate:e.target.value},'Catat tenggat sesuai penugasan')}/></label></div>}
    {(isPenyedia || isBalai || (isDirektorat && correctionAuditLevel === "3")) && !(isPenyedia && proposalEditable && selectedCase.retest === "Gagal" && !editingDraft) && (<>
          {isPenyedia && !editingDraft && proposalEditable && (
            <section className="wf-panel correction-draft-summary">
              <div className="wf-panel-head"><h3>Draft rencana tindakan</h3><Badge tone="info">Tersimpan</Badge></div>
              <div className="wf-body">
                <div className="correction-summary-grid">
                  <div><small>Akar masalah</small><strong>{selectedCase.rootCause || "Belum diisi"}</strong></div>
                  <div><small>Tindakan</small><strong>{selectedCase.actionType || "Belum dipilih"}</strong></div>
                  <div className="full"><small>Rencana kerja</small><p>{selectedCase.proposedPlan || "Belum diisi"}</p></div>
                  <div className="full"><small>Catatan bukti</small><p>{selectedCase.evidence || "Belum ada catatan"}</p></div>
                </div>
                <div className="wf-toolbar"><button type="button" className="wf-button" onClick={() => setEditingDraft(true)}>Edit draft</button></div>
              </div>
            </section>
          )}

{isPenyedia && proposalEditable && editingDraft && (
          <fieldset className="correction-proposal">
          <Panel
            title="Rencana tindakan dan bukti"
            icon={Wrench}
          >
            <div className="wf-callout" style={{marginBottom:10}}>
              {selectedCase.blockedStage} · {selectedCase.road}{selectedCase.calibrationFinding ? ` · ${selectedCase.calibrationFinding.surveyType} / ${selectedCase.calibrationFinding.subject}` : ` · ${selectedCase.stationing}`}
            </div>
            <div className="wf-fields" style={{ marginTop: 11 }}>
              <Field label="Akar masalah">
                <Select
                  placeholder="Pilih akar masalah"
                  id={`select-case-root-${selectedCase.id}`}
                  value={selectedCase.rootCause}
                  options={[
                    "",
                    "Alat",
                    "Personel",
                    "Metode",
                    "Kondisi lapangan",
                    "Pemrosesan",
                  ]}
                  onChange={(v) =>
                    updateCurrent(
                      { rootCause: v as CorrectionCase["rootCause"] },
                      "Ubah akar masalah",
                    )
                  }
                />
              </Field>
              <Field label={selectedCase.calibrationFinding ? "Validitas data terkait kalibrasi" : "Validitas data yang terdampak"}>
                <Select
                  placeholder="Pilih validitas data"
                  id={`select-case-valid-${selectedCase.id}`}
                  value={selectedCase.fieldDataValid}
                  options={[
                    "",
                    ...(selectedCase.calibrationFinding ? ["Tidak"] : ["Ya", "Tidak"]),
                    ...(correctionAllowsNotApplicable(selectedCase)
                      ? ["Tidak Berlaku"]
                      : []),
                  ]}
                  onChange={(v) =>
                    updateCurrent(
                      { fieldDataValid: v as CorrectionCase["fieldDataValid"] },
                      "Tentukan cabang validitas lapangan",
                    )
                  }
                />
              </Field>
              <Field label="Tindakan">
                <Select
                  placeholder="Pilih tindakan"
                  id={`select-case-action-${selectedCase.id}`}
                  value={selectedCase.actionType}
                  options={["", ...compatibleActions]}
                  onChange={(v) => {
                    if (v === selectedCase.actionType) return;
                    saveText(`proposed-${selectedCase.id}`, "");
                    updateCurrent(correctionActionChange(selectedCase, v), "Pilih tindakan perbaikan");
                  }}
                />
              </Field>
              <Field label="Rencana tindakan dan cara pembuktian *" full>
                <textarea
                  rows={3}
                  data-testid={`input-case-proposed-plan-${selectedCase.id}`}
                  value={selectedCase.proposedPlan ?? ""}
                  onChange={(event) => updateCurrent({ proposedPlan: event.target.value }, "Catat rencana tindakan")}
                  placeholder="Uraikan tindakan yang akan dilakukan, cakupan objek, dan bukti yang akan dihasilkan"
                />
              </Field>
              {selectedCase.actionType === "Koreksi pemrosesan dengan bukti" && <>
              <Field label="Nilai raw asli">
                <input
                  data-testid={`input-case-original-${selectedCase.id}`}
                  value={selectedCase.originalValue}
                  readOnly
                  aria-readonly="true"
                />
              </Field>
              <Field label="Rekaman lapangan">
                <select data-testid="input-correction-linked-record" value={correctionRecordLink(state.dailyRecords, selectedCase.road, selectedCase.surveyType, selectedCase.linkedRecordId)?.id ?? ""}
                  onChange={e => { saveText(`proposed-${selectedCase.id}`, ""); const linked = correctionRecordLink(state.dailyRecords, selectedCase.road, selectedCase.surveyType, e.target.value); updateCurrent({ linkedRecordId: linked?.id, originalValue: linked?.rawValue || "Belum ada nilai raw tertaut", ruleChecks: {}, ruleNumbers: {}, provinceUpdateBa: "", proposedValue: "" }, "Tautkan rekaman sumber"); }}>
                  <option value="" disabled={!!selectedCase.linkedRecordId && !!correctionWithSourceMethod(selectedCase,state.dailyRecords).originPciMethod}>Pilih rekaman pada ruas dan survei ini</option>
                  {eligibleCorrectionRecords(selectedCase,state.dailyRecords).filter(r => selectedCase.cyclePeriod === undefined || periodForDate(state,r.date) === selectedCase.cyclePeriod).map(r => <option key={r.id} value={r.id}>{r.id} · {r.date} · {r.rawValue}</option>)}
                </select>
              </Field>
              <Field label="Usulan nilai hasil pemrosesan">
                <input
                  data-testid={`input-case-proposed-${selectedCase.id}`}
                  value={
                    draft[`proposed-${selectedCase.id}`] ??
                    selectedCase.proposedValue
                  }
                  onChange={(e) =>
                    saveText(`proposed-${selectedCase.id}`, e.target.value)
                  }
                />
              </Field>
              </>}
              <div className="wf-field full">
                <CorrectionEvidenceField
  key={`${state.project.id}:${selectedCase.id}`}
  scope={`${state.project.id}::correction::${selectedCase.id}`}
  editable={proposalEditable}
  note={draft[`evidence-${selectedCase.id}`] ?? selectedCase.evidence}
  onNoteChange={(value) =>
    saveText(`evidence-${selectedCase.id}`, value)
  }
  noFile={false}
  allowNoFile={false}
  onChanged={() => {
    if (proposalEditable) {
      updateCurrent(
        { evidence: selectedCase.evidence },
        "Perbarui lampiran bukti kasus"
      );
    }
  }}
/>
              </div>
            </div>
            <details className="correction-technical-guide">
              <summary>Acuan teknis {selectedCase.surveyType}</summary>
            <div className="wf-callout warn" style={{ marginTop: 9 }}>
              <strong>Ketentuan pemeriksaan</strong>
              <ul>
                {CORRECTION_GUIDANCE[selectedCase.surveyType].map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>
            </details>
            <details key={`${selectedCase.id}:${selectedCase.ruleScenario || "Umum"}`} className="correction-technical-guide" open={suggestedScenario(selectedCase.surveyType, selectedCase.rejectionReason) !== "Umum" || (selectedCase.ruleScenario || "Umum") !== "Umum"}>
              <summary>{suggestedScenario(selectedCase.surveyType, selectedCase.rejectionReason) !== "Umum" ? "Pemeriksaan teknis temuan — perlu dilengkapi" : "Pemeriksaan khusus temuan (jika diperlukan)"}</summary>
            <p className="wf-note">Pilih jenis pemeriksaan sesuai temuan asal.</p>
            <Field label="Jenis pemeriksaan khusus">
              <Select
                id="select-correction-scenario"
                value={selectedCase.ruleScenario || "Umum"}
                options={[
                  "Umum",
                  ...(RULE_SCENARIOS[selectedCase.surveyType] || []),
                ]}
                onChange={(v) => {
                  if (v === (selectedCase.ruleScenario || "Umum")) return;
                  saveText(`proposed-${selectedCase.id}`, "");
                  updateCurrent(
                    {
                      ruleScenario: v,
                      ruleChecks: {},
                      ruleNumbers: {},
                      provinceUpdateBa: "",
                      proposedValue: "",
                    },
                    "Pilih aturan koreksi khusus",
                  );
                }}
              />
            </Field>
            {(!requiresNewScenarioEvidence(selectedCase) ? RULE_NUMBERS[selectedCase.ruleScenario || ""] || [] : []).map(
              (key) => (
                <Field key={key} label={key}>
                  <input
                    type="number"
                    min="0"
                    step={key.startsWith("Jumlah ") ? "1" : "any"}
                    data-testid={`input-correction-rule-${testId(key)}`}
                    value={Number.isFinite(selectedCase.ruleNumbers?.[key]) ? selectedCase.ruleNumbers?.[key] : ""}
                    onChange={(e) =>
                      updateCurrent(
                        {
                          ruleNumbers: {
                            ...selectedCase.ruleNumbers,
                            [key]:
                              e.target.value === ""
                                ? NaN
                                : Number(e.target.value),
                          },
                        },
                        "Catat ukuran bukti koreksi",
                      )
                    }
                  />
                </Field>
              ),
            )}
            {visibleProposalScenarioChecks(selectedCase).map((key) => (
              <CheckRow
                key={key}
                id={`correction-rule-${testId(key)}`}
                label={key}
                checked={!!selectedCase.ruleChecks?.[key]}
                onChange={(v) =>
                  updateCurrent(
                    { ruleChecks: updateProposalScenarioCheck(selectedCase, key, v) },
                    "Periksa bukti aturan koreksi",
                  )
                }
              />
            ))}
            {selectedCase.ruleScenario ===
              "Pemutakhiran setelah verval Direktorat" && (
              <Field label="BA Pemutakhiran Data Provinsi">
                <input
                  data-testid="input-correction-province-ba"
                  value={selectedCase.provinceUpdateBa ?? ""}
                  onChange={(e) =>
                    updateCurrent(
                      { provinceUpdateBa: e.target.value },
                      "Catat BA pemutakhiran jembatan",
                    )
                  }
                />
              </Field>
            )}
            </details>
              <div className="wf-field full">
                <Button
                  id={`button-save-case-evidence-${selectedCase.id}`}
                  kind="primary"
                  onClick={() => {
                    updateCurrent(
                      {
                        proposedValue: draft[`proposed-${selectedCase.id}`] ?? selectedCase.proposedValue,
                        evidence: draft[`evidence-${selectedCase.id}`] ?? selectedCase.evidence,
                      },
                      "Simpan draf rencana tindakan",
                    );
                    setEditingDraft(false);
                    setView("approval");
                  }}
                >
                  Simpan draf & lanjut
                </Button>
              </div>
          </Panel>
          </fieldset>
)}


{(!isPenyedia || !proposalEditable) && (
  <Panel title="Rencana dan bukti usulan" icon={ClipboardCheck}>
    <CorrectionEvidenceField
      key={`balai:${state.project.id}:${selectedCase.id}`}
      scope={`${state.project.id}::correction::${selectedCase.id}`}
      editable={false}
      note={selectedCase.evidence}
    />
    <div className="correction-review-summary">
      <div>
        <small>Akar masalah</small>
        <strong>{selectedCase.rootCause || "Belum dilengkapi"}</strong>
      </div>
      <div>
        <small>Validitas data lapangan</small>
        <strong>{selectedCase.fieldDataValid || "Belum ditentukan"}</strong>
      </div>
      <div>
        <small>Jenis tindakan</small>
        <strong>{selectedCase.actionType || "Belum dipilih"}</strong>
      </div>
      <div className="full">
        <small>Rencana tindakan</small>
        <p>{selectedCase.proposedPlan || "Belum dicatat"}</p>
      </div>
      <div>
        <small>Rekaman sumber</small>
        <strong>{selectedCase.linkedRecordId || "Belum tertaut"}</strong>
      </div>
      {requiresLayeredCorrectionVerification(selectedCase) && <div className="full">
        <small>Catatan pemeriksaan internal</small>
        <p>
          Bukti Surveyor: {selectedCase.verification?.surveyor ? "Ditinjau" : "Belum ditinjau"}
          {" · "}
          Pemeriksaan Ketua Tim: {selectedCase.verification?.teamLeader ? "Dicatat" : "Belum dicatat"}
        </p>
        <small>Catatan bukti, bukan tanda tangan individual.</small>
      </div>}
    </div>
    {isBalai && queueTab === "Antrian Verifikasi" && availableViews.includes("approval") && <div className="wf-toolbar"><button type="button" className="wf-button" onClick={()=>setView("approval")}>Lanjut ke keputusan <ArrowRight size={16}/></button></div>}
  </Panel>
)}
</>)}
      </>
    )}
    {activeView === "approval" && (
<Panel
            title={isBalai ? "Keputusan pemeriksaan Balai" : proposalEditable && isPenyedia ? "Verifikasi internal dan pengajuan" : "Status pemeriksaan usulan"}
            icon={ClipboardCheck}
          >

            {(
  isPenyedia && proposalEditable
    ? (requiresLayeredCorrectionVerification(selectedCase) ? (["surveyor", "teamLeader"] as const) : ([] as const))
    : isBalai && selectedCase.status === "Menunggu Persetujuan"
      ? (["balai"] as const)
      : ([] as const)
).map((key) => {
              const layered = requiresLayeredCorrectionVerification(selectedCase);
              const record = selectedCase.verificationEvidence?.[key];
              if (!layered) return <CheckRow key={key} id={`correction-verify-${key}`} label="Balai telah memeriksa bukti usulan" checked={!!selectedCase.verification?.[key]} onChange={v=>verifyStep(key,v)}/>;
              return <div key={key} className="wf-callout" style={{marginBottom:12}}>
                <strong>Pemeriksaan {CORRECTION_VERIFICATION_LABELS[key]}</strong>
                {record ? <dl className="v2-decision-facts">
                  <dt>Identitas pemeriksa</dt><dd>{record.reviewerIdentity}</dd>
                  <dt>Waktu pemeriksaan</dt><dd>{record.reviewedAt.replace("T", " ")}</dd>
                  <dt>Versi data</dt><dd>{record.dataVersionReference}</dd>
                  <dt>Referensi dokumen</dt><dd>{record.evidenceReference}</dd>
                </dl> : <div className="wf-fields">
                  {([{key:"reviewerIdentity", label:"Nama / identitas pemeriksa", type:"text"}, {key:"reviewedAt",label:"Waktu pemeriksaan",type:"datetime-local"}, {key:"dataVersionReference",label:"Versi data yang diperiksa",type:"text"}, {key:"evidenceReference",label:"Nomor / referensi dokumen pemeriksaan",type:"text"}] as const).map(field => <Field key={field.key} label={field.label+" *"}><input type={field.type} value={verificationInput(key, field.key)} onChange={e=>saveText(verificationDraftKey(key, field.key),e.target.value)}/></Field>)}
                </div>}
                <CheckRow id={`correction-verify-${key}`} label={record ? "Referensi pemeriksaan tercatat" : "Catat referensi pemeriksaan"} checked={!!record && !!selectedCase.verification?.[key]} onChange={v=>verifyStep(key,v)}/>
              </div>;
            })}
            {requiresLayeredCorrectionVerification(selectedCase) && <>
              <p className="wf-note">Referensi dokumen pemeriksaan dicatat di sini. Pencatatan ini bukan tanda tangan elektronik.</p>
              {!proposalEditable && <dl className="v2-decision-facts">{CORRECTION_VERIFICATION_STEPS.filter(step=>step!=="balai" || selectedCase.status!=="Menunggu Persetujuan").map(step => {const record=selectedCase.verificationEvidence?.[step];return <Fragment key={step}><dt>{CORRECTION_VERIFICATION_LABELS[step]}</dt><dd>{record ? `${record.reviewerIdentity} · ${record.reviewedAt.replace("T", " ")} · ${record.dataVersionReference} · ${record.evidenceReference}` : "Referensi belum tercatat"}</dd></Fragment>;})}</dl>}
            </>}
            {isBalai && selectedCase.status === "Menunggu Persetujuan" && <div className="wf-callout">
              <strong>Ringkasan usulan</strong>
              <dl className="v2-decision-facts">
                <dt>Rencana tindakan</dt><dd>{selectedCase.proposedPlan || "Belum dicatat"}</dd>
                <dt>Penanggung jawab</dt><dd>{selectedCase.owner || "Belum ditetapkan"}</dd>
                <dt>Tenggat</dt><dd>{selectedCase.dueDate || "Belum ditetapkan"}</dd>
                {correctionProposalTechnicalSummary(selectedCase).map(row => <Fragment key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></Fragment>)}
              </dl>
            </div>}
            {isBalai && selectedCase.status === "Menunggu Persetujuan" && (
            <Field label={selectedCase.ruleScenario === "Macet / kendaraan parkir" ? "Keputusan Pengguna Jasa atas kondisi lokasi PCI / alasan pengembalian *" : "Dasar keputusan atau alasan pengembalian *"}>
              <textarea
                data-testid="input-case-review-note"
                value={reviewDraft[reviewDraftKey] ?? ""}
                onChange={(e) => setReviewDraft((old) => ({ ...old, [reviewDraftKey]: e.target.value }))}
              />
            </Field>
            )}
            {isPenyedia && selectedCase.reviewNote && (
              <div className="wf-callout" data-testid="correction-provider-review-result">
                <strong>{selectedCase.approval === "Perlu Revisi" ? "Alasan pengembalian" : selectedCase.status === "Menunggu Persetujuan" ? "Catatan keputusan sebelumnya" : "Catatan pemeriksa"}</strong>
                <p className="wf-note">{selectedCase.reviewNote}</p>
              </div>
            )}
            <div className="wf-stage">
              <span className="wf-stage-num">1</span>
              <div>
                <strong>Usulan & bukti</strong>
                <small>
                  {selectedCase.rootCause || "Akar masalah belum diisi"} ·{" "}
                  {selectedCase.actionType || "Tindakan belum dipilih"}
                </small>
              </div>
              <Badge tone={selectedCase.evidence ? "good" : "warn"}>
                {selectedCase.evidence ? "Catatan tercatat" : "Catatan belum ada"}
              </Badge>
            </div>
            <div className="wf-stage">
              <span className="wf-stage-num">2</span>
              <div>
                <strong>Persetujuan Pengguna Jasa</strong>
                <small>{selectedCase.reviewNote || "Belum ada catatan keputusan"}</small>
              </div>
              <Badge
                tone={selectedCase.approval === "Disetujui" ? "good" : "warn"}
              >
                {selectedCase.approval}
              </Badge>
            </div>
            <div className="wf-toolbar" style={{ margin: "10px 0" }}>
              {isPenyedia && proposalEditable && (
              <Button
                id={`button-submit-case-${selectedCase.id}`}
                kind="primary"
                onClick={submitAction}
              >
                <ArrowRight size={13} />
                Catat pengajuan
              </Button>
              )}
              {isBalai && selectedCase.status === "Menunggu Persetujuan" && <>
              <Button id="button-case-request-revision" kind="danger" onClick={requestCaseRevision}>
                Kembalikan untuk revisi
              </Button>
              <Button
                kind="primary"
                id={`button-approve-case-${selectedCase.id}`}
                onClick={approve}
                disabled={
                  selectedCase.status !== "Menunggu Persetujuan" ||
                  selectedCase.approval !== "Diajukan"
                }
              >
                Setujui usulan
              </Button>
              </>}

            </div>
</Panel>
    )}
{activeView === "execution" && (
  selectedCase.status === "Disetujui" ||
  selectedCase.status === "Dilaksanakan" ||
  selectedCase.status === "Verifikasi Ulang" ||
  selectedCase.status === "Ditutup"
) && (isPenyedia && selectedCase.status === "Disetujui" ? (
  <CorrectionExecutionForm
    key={`${selectedCase.id}:${attempt}`}
    attempt={attempt}
    correction={correctionWithSourceMethod(selectedCase,state.dailyRecords)}
    projectId={state.project.id}
    editable
    onSubmit={executeAction}
  />
) : (
  <Panel title="Hasil pelaksanaan" icon={Wrench}>
    <dl className="v2-decision-facts" data-testid="correction-execution-summary">
      <dt>Jenis tindakan</dt><dd>{selectedCase.actionType || "Belum ditetapkan"}</dd>
      <dt>Pelaksana</dt><dd>{selectedCase.owner || "Belum ditetapkan"}</dd>
      <dt>Status</dt><dd>{correctionDisplayStatus(selectedCase)}</dd>
      {selectedCase.executionResult ? correctionExecutionSummary(selectedCase).map(row => <Fragment key={row.label}><dt>{row.label}</dt><dd style={{whiteSpace: "pre-wrap", overflowWrap: "anywhere"}}>{row.value}</dd></Fragment>) : <><dt>Referensi hasil</dt><dd style={{whiteSpace: "pre-wrap", overflowWrap: "anywhere"}}>{correctionResultReference(selectedCase) || "Belum diserahkan"}</dd></>}
    </dl>
    {selectedCase.executionResult && <CorrectionSubmittedEvidence projectId={state.project.id} caseId={selectedCase.id} keys={selectedCase.executionResult.evidenceKeys} digests={selectedCase.executionResult.evidenceDigests}/>}
  </Panel>
))}

{activeView === "verification" && <Panel title="Pemeriksaan ulang hasil perbaikan" icon={ClipboardCheck}>
  {selectedCase.status === "Terbuka" ||
   selectedCase.status === "Menunggu Persetujuan" ||
   selectedCase.status === "Disetujui" ? (
    <div className="wf-note">
      Menunggu Penyedia Jasa menyelesaikan dan menyerahkan hasil perbaikan.
    </div>
  ) : (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="wf-callout">
        <strong>Tahap pemeriksaan: </strong>
        {selectedCase.returnStage}
        <div className="wf-note">
          Referensi hasil: {correctionResultReference(selectedCase) || "Belum tersedia"}
        </div>
      </div>

      {selectedCase.executionResult && <details className="correction-technical-guide" open={canVerifyCorrection && selectedCase.status === "Dilaksanakan"}>
        <summary>Hasil teknis pelaksanaan</summary>
        <dl className="v2-decision-facts">{correctionExecutionSummary(selectedCase).map(row => <Fragment key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></Fragment>)}</dl>
      </details>}
      {selectedCase.executionResult && <CorrectionSubmittedEvidence projectId={state.project.id} caseId={selectedCase.id} keys={selectedCase.executionResult.evidenceKeys} digests={selectedCase.executionResult.evidenceDigests}/>}

      {canVerifyCorrection && selectedCase.status === "Dilaksanakan" ? (
        <>
          <Field label="Referensi pemeriksaan ulang *" full>
            <textarea
              rows={3}
              style={{ width: "100%", boxSizing: "border-box" }}
              value={
                draft[`retest-reference-${retestDraftKey}`] ??
                selectedCase.retestReference ??
                ""
              }
              onChange={(e) =>
                saveText(`retest-reference-${retestDraftKey}`, e.target.value)
              }
              placeholder="Nomor BA atau referensi pemeriksaan tahap asal"
            />
          </Field>

          <Field label="Hasil pemeriksaan ulang *">
            <Select
              id={`select-retest-${selectedCase.id}`}
              value={
                draft[`retest-${retestDraftKey}`] ??
                selectedCase.retest
              }
              options={["Belum Diuji", "Lulus", "Gagal"]}
              onChange={(v) => saveText(`retest-${retestDraftKey}`, v)}
            />
          </Field>

          {(draft[`retest-${retestDraftKey}`] ?? selectedCase.retest) === "Gagal" && (
            <Field label="Alasan teknis hasil Gagal (wajib)" full>
              <textarea
                data-testid={`input-retest-failure-reason-${selectedCase.id}`}
                rows={3}
                style={{ width: "100%", boxSizing: "border-box" }}
                value={draft[`retest-failure-reason-${retestDraftKey}`] ?? ""}
                onChange={event => saveText(`retest-failure-reason-${retestDraftKey}`, event.target.value)}
                placeholder="Butir pemeriksaan yang tidak memenuhi dan tindakan yang perlu diperbaiki"
              />
            </Field>
          )}
          <p className="wf-note">{(draft[`retest-${retestDraftKey}`] ?? selectedCase.retest) === "Gagal" ? "Kasus dikembalikan kepada Penyedia untuk diperbaiki." : (draft[`retest-${retestDraftKey}`] ?? selectedCase.retest) === "Lulus" ? "Hasil lulus dicatat terlebih dahulu. Penutupan kasus dilakukan terpisah." : "Pilih hasil pemeriksaan sebelum menyimpan."}</p>
          <div className="wf-toolbar">
            <Button
              id={`button-retest-case-${selectedCase.id}`}
              kind="primary"
              onClick={runRetest}
            >
              Simpan hasil pemeriksaan
            </Button>


          </div>
        </>
      ) : (
        <div className="wf-note">
          Hasil pemeriksaan: {selectedCase.retest}
          {selectedCase.retest === "Gagal" && <p>Alasan: {selectedCase.retestFailureReason || "Belum tercatat"}</p>}
          <p>
            Referensi: {selectedCase.retestReference || "Belum tersedia"}
          </p>
          {canVerifyCorrection && selectedCase.status === "Verifikasi Ulang" && selectedCase.retest === "Lulus" && (
            <div className="wf-toolbar"><span>Penutupan kasus tidak otomatis meluluskan audit atau penerimaan paket.</span><Button id={`button-close-case-${selectedCase.id}`} kind="primary" onClick={closeCase}>Tutup kasus</Button></div>
          )}
        </div>
      )}
    </div>
  )}
</Panel>}
{activeView === "history" && <section className="wf-panel corr-case-history">
  <div className="wf-panel-head">
    <h3>Riwayat kasus</h3>
  </div>
    <div className="wf-body">
      <CorrectionRevisionHistory state={state} caseId={selectedCase.id}/>
      <p className="wf-note">Aktivitas terbaru lebih dahulu.</p>
      <div className="correction-review-summary">
        {state.events.filter(event => event.object === selectedCase.id).length === 0 ? (
          <div className="full"><small>Belum ada aktivitas kasus yang tercatat.</small></div>
        ) : state.events.filter(event => event.object === selectedCase.id).map(event => (
          <div className="full" key={event.id}>
            <small>{event.date} · {event.actor}</small>
            <strong>{correctionEventSummary(event).title}</strong>
            {correctionEventSummary(event).detail && <p className="wf-note">{correctionEventSummary(event).detail}</p>}
          </div>
        ))}
      </div>

      <div className="correction-review-summary">
        <div>
          <small>Nomor kasus</small>
          <strong>{selectedCase.id}</strong>
        </div>
        <div>
          <small>Status terakhir</small>
          <strong>{correctionDisplayStatus(selectedCase)}</strong>
        </div>
        <div>
          <small>Tahap asal</small>
          <strong>{selectedCase.blockedStage}</strong>
        </div>
        <div>
          <small>Jenis survei</small>
          <strong>{selectedCase.surveyType}</strong>
        </div>
        <div>
          <small>Keputusan usulan</small>
          <strong>{selectedCase.approval}</strong>
        </div>
        <div>
          <small>Hasil pemeriksaan ulang</small>
          <strong>{selectedCase.retest}</strong>
        </div>
        <div className="full">
          <small>Alasan temuan</small>
          <p>{selectedCase.rejectionReason || "Belum tersedia"}</p>
        </div>
        <div className="full">
          <small>Catatan keputusan</small>
          <p>{selectedCase.reviewNote || "Belum tersedia"}</p>
        </div>
        <div className="full">
          <small>Referensi hasil pelaksanaan</small>
          <p style={{ whiteSpace: "pre-wrap" }}>
            {correctionResultReference(selectedCase) || "Belum diserahkan"}
          </p>
        </div>
        <div className="full">
          <small>Referensi pemeriksaan ulang</small>
          <p>{selectedCase.retestReference || "Belum tersedia"}</p>
        </div>
      </div>

    </div>
</section>}
        </div>
      )}
    </>
  );
}
