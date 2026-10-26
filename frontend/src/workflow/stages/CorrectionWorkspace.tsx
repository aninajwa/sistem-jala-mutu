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

import {
  RULE_CHECKS,
  RULE_NUMBERS,
  RULE_SCENARIOS,
  specialCorrectionErrors,
} from "../correctionRules";
import { applyClosedCorrection, correctionClosureErrors } from "../flowRules";
import {
  CORRECTION_ACTIONS,
  CORRECTION_GUIDANCE,
  CorrectionCase,
  SURVEY_TYPES,
  SurveyType,
} from "../model";

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

const [openDetails, setOpenDetails] = useState<
  Record<string, boolean>
>({});

const toggleDetail = (section: string) => {
  setOpenDetails((current) => ({
    ...current,
    [section]: !(current[section] ?? (
      section === "proposal" && selectedCase?.status === "Terbuka"
    )),
  }));
};

const detailOpen = (section: string, defaultOpen = false) =>
  openDetails[section] ?? defaultOpen;
  const [prodType, setProdType] = useState<SurveyType>("IRI");
  const [newCase, setNewCase] = useState<CorrectionCase>(() =>
    defaultCase(state),
  );
  const [caseId, setCaseId] = useCorrectionSelection(state.project.id);
  const test = state.productionTests[prodType];
  const selectedCase =
  state.corrections.find((c) => c.id === caseId) ??
  (!selection.startsWith("/actions:") ? state.corrections[0] : undefined);

const isDirektorat = state.role === "Direktorat / Pusat";

const correctionAuditLevel =
  selectedCase?.blockedStage.match(/^Audit tingkat ([123])$/i)?.[1];

const canVerifyCorrection =
  correctionAuditLevel === "3"
    ? isDirektorat
    : correctionAuditLevel === "2"
      ? isBalai
      : correctionAuditLevel === "1"
        ? isPenyedia
        : isBalai;

const openedFromActions = selection.startsWith("/actions:");

useEffect(() => {
  setEditingDraft(true);
  setOpenDetails({});
}, [selectedCase?.id]);
  const saveText = (key: string, value: string) =>
    setDraft((old) => ({ ...old, [key]: value }));

  const patchNew = (patch: Partial<CorrectionCase>) =>
    setNewCase((current) => {
      const next = { ...current, ...patch };
      if ("road" in patch || "surveyType" in patch) {
        const record = state.dailyRecords.find(
          (record) =>
            record.surveyType === next.surveyType && record.road === next.road,
        );
        next.originalValue = record?.rawValue || "Belum ada nilai raw tertaut";
        next.linkedRecordId = record?.id;
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

    if (changesRetest && !canVerifyCorrection) {
      setNotice("Pemeriksaan ulang bukan kewenangan peran ini.");
      return;
    }

    if (isDirektorat) {
      const allowed = new Set([
        "status", "retest", "retestReference"
      ]);

      if (
        correctionAuditLevel !== "3" ||
        !["Dilaksanakan", "Verifikasi Ulang"].includes(
          selectedCase.status
        ) ||
        !changesRetest ||
        Object.keys(patch).some(key => !allowed.has(key))
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
    "approval",
    "status",
    "retest",
    "retestReference",
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
    if (isBalai && selectedCase.status !== "Menunggu Persetujuan" &&
        ("approval" in patch || "reviewNote" in patch || "verification" in patch && patch.verification?.balai === true)) {
      setNotice("Pemeriksaan Balai hanya dilakukan pada usulan yang sedang menunggu persetujuan.");
      return;
    }
    const changesProposal = [
      "rootCause",
      "fieldDataValid",
      "surveyType",
      "actionType",
      "evidence",
      "originalValue",
      "proposedValue",
      "returnStage",
      "linkedRecordId",
      "ruleScenario",
      "ruleChecks",
      "ruleNumbers",
      "provinceUpdateBa",
    ].some((key) => key in patch);
    const safePatch = changesProposal
      ? {
          ...patch,
          verification: { surveyor: false, teamLeader: false, balai: false },
          approval: "Draft" as const,
          status: "Terbuka" as const,
          retest: "Belum Diuji" as const,
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
    if (
      state.role !== "Penyedia Jasa / Ketua Tim" &&
      state.role !== "PIC Balai / Pengguna Jasa"
    ) {
      setNotice(
        "Pilih peran Penyedia Jasa atau Pengguna Jasa untuk membuka kasus.",
      );
      return;
    }
    if (!newCase.rejectionReason.trim() || !newCase.road.trim()) {
      setNotice("Ruas dan alasan temuan diperlukan untuk membuka kasus.");
      return;
    }
    commit(
      "Buka kasus koreksi berbukti",
      newCase.id,
      (s) => ({ ...s, corrections: [{ ...newCase }, ...s.corrections] }),
      "Kasus baru tercatat dan menahan tahap asal",
    );
    setCaseId(newCase.id);
    setNewCase(defaultCase(state));
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
      selectedCase.status !== "Terbuka" &&
      selectedCase.status !== "Verifikasi Ulang"
    ) {
      setNotice(
        "Tindakan hanya dapat diajukan dari kasus terbuka atau hasil uji ulang yang gagal.",
      );
      return;
    }
    if (
      !selectedCase.rootCause ||
      !selectedCase.fieldDataValid ||
      !selectedCase.actionType ||
      !selectedCase.evidence.trim()
    ) {
      setNotice(
        "Lengkapi akar masalah, validitas data lapangan, tindakan dan bukti terlebih dahulu.",
      );
      return;
    }
    if (
      selectedCase.fieldDataValid === "Ya" &&
      selectedCase.actionType !== "Koreksi pemrosesan dengan bukti"
    ) {
      setNotice(
        "Jika data lapangan valid, pilih hanya koreksi pemrosesan berbasis bukti.",
      );
      return;
    }
    if (
      selectedCase.fieldDataValid === "Tidak" &&
      selectedCase.actionType === "Koreksi pemrosesan dengan bukti"
    ) {
      setNotice(
        "Jika data lapangan tidak valid, pilih tindakan lapangan atau penggantian.",
      );
      return;
    }
    if (
      selectedCase.fieldDataValid === "Tidak Berlaku" &&
      !selectedCase.source.startsWith("Notifikasi H+0")
    ) {
      setNotice(
        "Tidak Berlaku hanya digunakan untuk tindak lanjut tenggat, bukan koreksi data.",
      );
      return;
    }
    if (
      selectedCase.fieldDataValid === "Ya" &&
      (!selectedCase.proposedValue.trim() ||
        !selectedCase.originalValue.trim() ||
        selectedCase.originalValue === "Belum ada nilai raw tertaut")
    ) {
      setNotice(
        "Koreksi data memerlukan nilai raw tertaut dan nilai usulan cleaned.",
      );
      return;
    }
    if (
      !selectedCase.verification?.surveyor ||
      !selectedCase.verification?.teamLeader
    ) {
      setNotice(
        "Surveyor dan Team Leader harus memverifikasi bukti sebelum usulan dikirim.",
      );
      return;
    }
    const ruleErrors = specialCorrectionErrors(selectedCase);
    if (ruleErrors.length) {
      setNotice(ruleErrors.join(" · "));
      return;
    }
    const caseContext =
      `${selectedCase.rejectionReason} ${selectedCase.rootCause} ${selectedCase.evidence}`.toLowerCase();
    if (
      selectedCase.surveyType === "PCI" &&
      /(hujan|genangan)/.test(caseContext) &&
      selectedCase.actionType === "Koreksi pemrosesan dengan bukti"
    ) {
      setNotice(
        "PCI saat hujan atau genangan tidak boleh dikoreksi; jadwalkan ulang setelah permukaan kering.",
      );
      return;
    }
    if (
      selectedCase.surveyType === "PCI" &&
      /(alur|amblas)/.test(caseContext) &&
      selectedCase.actionType === "Koreksi pemrosesan dengan bukti" &&
      !/(straight.?edge|laser|ukur fisik)/.test(
        selectedCase.evidence.toLowerCase(),
      )
    ) {
      setNotice(
        "Koreksi alur/amblas PCI memerlukan bukti pengukuran fisik dengan straight edge atau laser.",
      );
      return;
    }
    if (
      selectedCase.surveyType === "PCI" &&
      /(foto|defect|gambar)/.test(caseContext) &&
      /(tidak sesuai|buruk|kurang)/.test(caseContext) &&
      selectedCase.actionType !== "Ambil ulang foto/video"
    ) {
      setNotice(
        "Foto defect yang tidak sesuai spesifikasi harus diambil ulang.",
      );
      return;
    }
    if (
      selectedCase.surveyType === "IRI" &&
      /(kehilangan data|underspeed|macet|parkir)/.test(caseContext) &&
      selectedCase.fieldDataValid === "Tidak" &&
      !["Survei ulang sebagian ruas", "Survei ulang seluruh ruas"].includes(
        selectedCase.actionType,
      )
    ) {
      setNotice(
        "Kehilangan data atau underspeed karena lalu lintas mewajibkan survei ulang pada kondisi normal.",
      );
      return;
    }
    updateCurrent(
      { status: "Menunggu Persetujuan", approval: "Diajukan" },
      "Ajukan tindakan koreksi untuk persetujuan",
    );
    setNotice(
      "Usulan terkirim pada alur tindak lanjut; menunggu persetujuan Pengguna Jasa.",
    );
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
    if (!selectedCase.verification?.balai || !selectedCase.reviewNote?.trim()) {
      setNotice(
        "Balai harus memverifikasi bukti dan mencatat dasar keputusan.",
      );
      return;
    }
    updateCurrent(
      { approval: "Disetujui", status: "Disetujui" },
      "Setujui tindakan koreksi",
    );
  };
  const executeAction = (submittedReference?: string) => {
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
    const executionReference = (submittedReference ?? draft[`execution-${selectedCase.id}`] ?? selectedCase.executionReference ?? '').trim();
    if (!executionReference) {
      setNotice('Catat referensi hasil tindakan nyata (ID rekaman baru / dokumen hasil survei ulang, kalibrasi, atau pemrosesan) sebelum menandai dilaksanakan.');
      return;
    }
    updateCurrent(
      { status: "Dilaksanakan", executionReference },
      "Catat pelaksanaan tindakan dan referensi hasil",
    );
  };
  const runRetest = () => {
    if (!selectedCase) return;
    if (!canVerifyCorrection) {
      setNotice("Keputusan uji ulang kasus ini dicatat PIC Balai setelah memeriksa hasil di tahap sumber.");
      return;
    }
    if (
      selectedCase.status !== "Dilaksanakan" &&
      selectedCase.status !== "Verifikasi Ulang"
    ) {
      setNotice("Laksanakan tindakan terlebih dahulu sebelum uji ulang.");
      return;
    }
    const result = draft[`retest-${selectedCase.id}`] ?? selectedCase.retest;
    if (result !== "Lulus" && result !== "Gagal") {
      setNotice("Pilih hasil uji ulang Lulus atau Gagal terlebih dahulu.");
      return;
    }
    const retestReference = (draft[`retest-reference-${selectedCase.id}`] ?? selectedCase.retestReference ?? '').trim();
    if (!selectedCase.executionReference || !retestReference) {
      setNotice('Hasil pelaksanaan dan referensi pemeriksaan ulang tahap asal harus tersedia.');
      return;
    }
    updateCurrent(
      { status: "Verifikasi Ulang", retest: result, retestReference },
      "Balai catat hasil pemeriksaan ulang dengan referensi",
    );
  };
  const closeCase = () => {
    if (!selectedCase) return;
    if (!canVerifyCorrection) {
      setNotice(
        "PIC Balai / Pengguna Jasa menutup kasus setelah pemeriksaan uji ulang.",
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
    setNotice(
      "Kasus ditutup tanpa mengubah hasil survei. Pemeriksaan tahap terkait dan gate harus ditinjau ulang.",
    );
  };
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
      (value && key === "balai" && !selectedCase.verification?.teamLeader)
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
    updateCurrent(
      {
        verification,
        ...(!value
          ? { approval: "Draft" as const, status: "Terbuka" as const }
          : {}),
      },
      `Verifikasi bukti oleh ${key}`,
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
    if (!selectedCase.reviewNote?.trim()) {
      setNotice("Catatan revisi wajib diisi.");
      return;
    }
    updateCurrent(
      {
        approval: "Perlu Revisi",
        status: "Terbuka",
        retest: "Belum Diuji",
        verification: { surveyor: false, teamLeader: false, balai: false },
      },
      "Kembalikan usulan ke akar masalah",
    );
  };
  const compatibleActions =
    selectedCase?.fieldDataValid === "Ya"
      ? ["Koreksi pemrosesan dengan bukti"]
      : selectedCase?.fieldDataValid === "Tidak"
        ? CORRECTION_ACTIONS.filter(
            (action) => action !== "Koreksi pemrosesan dengan bukti",
          )
        : selectedCase?.fieldDataValid === "Tidak Berlaku"
          ? ["Investigasi keterlambatan dan rencana tindak lanjut"]
          : CORRECTION_ACTIONS;
  return (
    <>
      {!openedFromActions && heading(
        "Tindak lanjut kasus",
        "Tindakan Perbaikan",
        "Pilih temuan untuk melihat dan menindaklanjuti kasus.",
      )}
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
                        <div className="wf-note">{c.source}</div>
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
        <details className="correction-new-case">
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
                options={[
                  "Validasi produksi",
                  "Verval 14 hari",
                  "Validasi sistem LRS",
                  "Penolakan audit tingkat 2",
                  "Penolakan audit tingkat 3",
                  "Pengingat H+0 terlewat",
                ]}
                onChange={(v) => patchNew({ source: v })}
              />
            </Field>
            <Field label="Tahap tertahan">
              <Select
                id="select-case-stage"
                value={newCase.blockedStage}
                options={[
                  "Kalibrasi",
                  "Validasi produksi",
                  "Verval 14 hari",
                  "Gerbang RNI/LRS",
                  "Audit tingkat 1",
                  "Audit tingkat 2",
                  "Audit tingkat 3",
                ]}
                onChange={(v) => patchNew({ blockedStage: v, returnStage: v })}
              />
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
        </details>
      </div>
      )}
      {!selectedCase && openedFromActions && (
        <div className="wf-callout warn">Kasus yang dipilih tidak ditemukan. Kembali ke Tindakan Perbaikan dan pilih kasus kembali.</div>
      )}
      {selectedCase && (
  <div className="wf-grid correction-case-work">
          {isPenyedia && !editingDraft && selectedCase.status === "Terbuka" && (
            <section className="wf-panel correction-draft-summary">
              <div className="wf-panel-head"><h3>Draft rencana tindakan</h3><Badge tone="info">Tersimpan</Badge></div>
              <div className="wf-body">
                <div className="correction-summary-grid">
                  <div><small>Akar masalah</small><strong>{selectedCase.rootCause || "Belum diisi"}</strong></div>
                  <div><small>Tindakan</small><strong>{selectedCase.actionType || "Belum dipilih"}</strong></div>
                  <div className="full"><small>Catatan bukti</small><p>{selectedCase.evidence || "Belum ada catatan"}</p></div>
                </div>
                <div className="wf-toolbar"><button type="button" className="wf-button" onClick={() => {
  setEditingDraft(true);
  setOpenDetails((current) => ({
    ...current,
    proposal: true,
  }));
}}>Edit draft</button></div>
              </div>
            </section>
          )}

{isPenyedia && (
  <div className="wf-toolbar">
    <button
      type="button"
      className="wf-button"
      onClick={() => {
  if (selectedCase.status === "Terbuka" && !editingDraft) {
    setEditingDraft(true);
    setOpenDetails((current) => ({
      ...current,
      proposal: true,
    }));
  } else {
    toggleDetail("proposal");
  }
}}
    >
      {detailOpen("proposal", selectedCase.status === "Terbuka")
        ? "Tutup detail rencana tindakan"
        : "Lihat rencana tindakan & bukti usulan"}
    </button>
  </div>
)}

{isPenyedia &&
  (selectedCase.status !== "Terbuka"
    ? detailOpen("proposal", false)
    : editingDraft && detailOpen("proposal", true)) && (
          <fieldset className="correction-proposal" disabled={selectedCase.status !== "Terbuka"}>
          <Panel
            title={`1. Rencana tindakan & bukti · ${selectedCase.id}`}
            icon={Wrench}
            extra={
              <Badge
                tone={
                  selectedCase.status === "Ditutup"
                    ? "good"
                    : selectedCase.status === "Terbuka"
                      ? "warn"
                      : "info"
                }
              >
                {selectedCase.status}
              </Badge>
            }
          >
            <div className="wf-callout" style={{marginBottom:10}}>
              {selectedCase.blockedStage} · {selectedCase.road} · {selectedCase.stationing}
            </div>
            <div className="wf-fields" style={{ marginTop: 11 }}>
              <Field label="Akar masalah">
                <Select
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
              <Field label="Data lapangan valid?">
                <Select
                  id={`select-case-valid-${selectedCase.id}`}
                  value={selectedCase.fieldDataValid}
                  options={[
                    "",
                    "Ya",
                    "Tidak",
                    ...(selectedCase.source.startsWith("Notifikasi H+0")
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
              <Field label="Jenis survei">
                <input
                  value={selectedCase.surveyType}
                  readOnly
                  aria-readonly="true"
                  title="Jenis survei ditentukan pada pemeriksaan asal"
                />
              </Field>
              <Field label="Tindakan">
                <Select
                  id={`select-case-action-${selectedCase.id}`}
                  value={selectedCase.actionType}
                  options={["", ...compatibleActions]}
                  onChange={(v) =>
                    updateCurrent({ actionType: v }, "Pilih tindakan perbaikan")
                  }
                />
              </Field>
              <Field label="Nilai raw asli">
                <input
                  data-testid={`input-case-original-${selectedCase.id}`}
                  value={selectedCase.originalValue}
                  readOnly
                  aria-readonly="true"
                />
              </Field>
              <Field label="Rekaman lapangan">
                <input
                  data-testid="input-correction-linked-record"
                  readOnly
                  value={(() => {
                    const linked = state.dailyRecords.find(r => r.id === selectedCase.linkedRecordId);
                    return linked
                      ? `${linked.id} · ${linked.date} · raw ${linked.rawValue}`
                      : selectedCase.linkedRecordId || "Belum ada rekaman terkait";
                  })()}
                />
              </Field>
              {selectedCase.fieldDataValid === "Ya" && (
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
              )}
              <div className="wf-field full">
                <CorrectionEvidenceField
  key={`${state.project.id}:${selectedCase.id}`}
  scope={`${state.project.id}::correction::${selectedCase.id}`}
  editable={selectedCase.status === "Terbuka"}
  note={draft[`evidence-${selectedCase.id}`] ?? selectedCase.evidence}
  onNoteChange={(value) =>
    saveText(`evidence-${selectedCase.id}`, value)
  }
  noFile={false}
  allowNoFile={false}
  onChanged={() => {
    if (selectedCase.status === "Terbuka") {
      updateCurrent(
        { evidence: selectedCase.evidence },
        "Perbarui lampiran bukti kasus"
      );
    }
  }}
/>
              </div>
              <div className="wf-field full">
                <Button
                  id={`button-save-case-evidence-${selectedCase.id}`}
                  onClick={() => {
                    updateCurrent(
                      {
                        proposedValue: draft[`proposed-${selectedCase.id}`] ?? selectedCase.proposedValue,
                        evidence: draft[`evidence-${selectedCase.id}`] ?? selectedCase.evidence,
                      },
                      "Simpan draft rencana tindakan",
                    );
                    setEditingDraft(false);
setOpenDetails((current) => ({
  ...current,
  proposal: false,
  approval: true,
}));
setNotice("Draft tersimpan. Periksa verifikasi internal, lalu ajukan usulan.");
                  }}
                >
                  Simpan draft
                </Button>
              </div>
            </div>
            <details className="correction-technical-guide">
              <summary>Panduan teknis {selectedCase.surveyType}</summary>
            <div className="wf-callout warn" style={{ marginTop: 9 }}>
              <strong>Ketentuan pemeriksaan</strong>
              <ul>
                {CORRECTION_GUIDANCE[selectedCase.surveyType].map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>
            </details>
            <details className="correction-technical-guide">
              <summary>Pemeriksaan teknis tambahan (bila diperlukan)</summary>
            <Field label="Skenario aturan koreksi">
              <Select
                id="select-correction-scenario"
                value={selectedCase.ruleScenario || "Umum"}
                options={[
                  "Umum",
                  ...(RULE_SCENARIOS[selectedCase.surveyType] || []),
                ]}
                onChange={(v) =>
                  updateCurrent(
                    {
                      ruleScenario: v,
                      ruleChecks: {},
                      ruleNumbers: {},
                      provinceUpdateBa: "",
                    },
                    "Pilih aturan koreksi khusus",
                  )
                }
              />
            </Field>
            {(RULE_NUMBERS[selectedCase.ruleScenario || ""] || []).map(
              (key) => (
                <Field key={key} label={key}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    data-testid={`input-correction-rule-${testId(key)}`}
                    value={selectedCase.ruleNumbers?.[key] ?? ""}
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
            {(RULE_CHECKS[selectedCase.ruleScenario || ""] || []).map((key) => (
              <CheckRow
                key={key}
                id={`correction-rule-${testId(key)}`}
                label={key}
                checked={!!selectedCase.ruleChecks?.[key]}
                onChange={(v) =>
                  updateCurrent(
                    { ruleChecks: { ...selectedCase.ruleChecks, [key]: v } },
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
          </Panel>
          </fieldset>
)}


{isBalai && (
  <Panel title="1. Usulan & pemeriksaan bukti" icon={ClipboardCheck}>
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
      <div>
        <small>Rekaman sumber</small>
        <strong>{selectedCase.linkedRecordId || "Belum tertaut"}</strong>
      </div>
      <div className="full">
        <small>Hasil pemeriksaan internal</small>
        <p>
          Surveyor: {selectedCase.verification?.surveyor ? "Sudah" : "Belum"}
          {" · "}
          Ketua Tim: {selectedCase.verification?.teamLeader ? "Sudah" : "Belum"}
        </p>
      </div>
    </div>
  </Panel>
)}
          <div className="wf-toolbar" style={{ marginBottom: 8 }}>
  <button
    type="button"
    className="wf-button"
    id="button-toggle-case-approval"
    aria-expanded={detailOpen(
      "approval",
      selectedCase.status === "Terbuka" ||
        selectedCase.status === "Menunggu Persetujuan"
    )}
    onClick={() =>
      setOpenDetails((current) => ({
        ...current,
        approval: !(
          current.approval ??
          (selectedCase.status === "Terbuka" ||
            selectedCase.status === "Menunggu Persetujuan")
        ),
      }))
    }
  >
    {detailOpen(
      "approval",
      selectedCase.status === "Terbuka" ||
        selectedCase.status === "Menunggu Persetujuan"
    )
      ? "Tutup detail persetujuan"
      : "Lihat keputusan dan persetujuan"}
  </button>
</div>

{detailOpen(
  "approval",
  selectedCase.status === "Terbuka" ||
    selectedCase.status === "Menunggu Persetujuan"
) && (
<Panel
            title={isBalai ? "2. Keputusan pemeriksaan Balai" : "2. Verifikasi internal & pengajuan"}
            icon={ClipboardCheck}
          >
            <p className="correction-guidance-short">{isBalai ? "Periksa kesesuaian usulan dan bukti sumber sebelum memberi keputusan." : "Lengkapi bukti, lalu lakukan pemeriksaan internal sebelum mengajukan usulan."}</p>
            {(
  isPenyedia && selectedCase.status === "Terbuka"
    ? (["surveyor", "teamLeader"] as const)
    : isBalai && selectedCase.status === "Menunggu Persetujuan"
      ? (["balai"] as const)
      : ([] as const)
).map((key) => (
              <CheckRow
                key={key}
                id={`correction-verify-${key}`}
                label={
                  {
                    surveyor:
                      "Surveyor memeriksa foto/video, posisi alat dan peta",
                    teamLeader: "Team Leader memeriksa nilai dan dasar koreksi",
                    balai: "Balai memverifikasi bukti dan keputusan",
                  }[key]
                }
                checked={!!selectedCase.verification?.[key]}
                onChange={(v) => verifyStep(key, v)}
              />
            ))}
            {isBalai && selectedCase.status === "Menunggu Persetujuan" && (
            <Field label="Catatan persetujuan / alasan revisi">
              <textarea
                data-testid="input-case-review-note"
                value={selectedCase.reviewNote ?? ""}
                onChange={(e) =>
                  updateCurrent(
                    { reviewNote: e.target.value },
                    "Catat keputusan Balai",
                  )
                }
              />
            </Field>
            )}
            {isBalai && selectedCase.status === "Menunggu Persetujuan" && (
            <Button
              id="button-case-request-revision"
              kind="danger"
              disabled={selectedCase.status !== "Menunggu Persetujuan"}
              onClick={requestCaseRevision}
            >
              Kembalikan untuk revisi
            </Button>
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
              {isPenyedia && (selectedCase.status === "Terbuka" || selectedCase.status === "Verifikasi Ulang") && (
              <Button
                id={`button-submit-case-${selectedCase.id}`}
                kind="primary"
                onClick={submitAction}
              >
                <ArrowRight size={13} />
                Ajukan usulan
              </Button>
              )}
              {isBalai && selectedCase.status === "Menunggu Persetujuan" && (
              <Button
                id={`button-approve-case-${selectedCase.id}`}
                onClick={approve}
                disabled={
                  selectedCase.status !== "Menunggu Persetujuan" ||
                  selectedCase.approval !== "Diajukan"
                }
              >
                Setujui usulan
              </Button>
              )}

            </div>
</Panel>
)}
{(
  selectedCase.status === "Disetujui" ||
  selectedCase.status === "Dilaksanakan" ||
  selectedCase.status === "Verifikasi Ulang" ||
  selectedCase.status === "Ditutup"
) && (
  <CorrectionExecutionForm
    key={selectedCase.id}
    correction={selectedCase}
    projectId={state.project.id}
    editable={isPenyedia && selectedCase.status === "Disetujui"}
    onSubmit={(reference) => executeAction(reference)}
  />
)}

<Panel title="4. Verifikasi ulang hasil perbaikan" icon={ClipboardCheck}>
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
          Referensi hasil: {selectedCase.executionReference || "Belum tersedia"}
        </div>
      </div>

      {canVerifyCorrection && selectedCase.status !== "Ditutup" ? (
        <>
          <Field label="Referensi pemeriksaan ulang" full>
            <textarea
              rows={3}
              style={{ width: "100%", boxSizing: "border-box" }}
              value={
                draft[`retest-reference-${selectedCase.id}`] ??
                selectedCase.retestReference ??
                ""
              }
              onChange={(e) =>
                saveText(`retest-reference-${selectedCase.id}`, e.target.value)
              }
              placeholder="Nomor BA atau referensi pemeriksaan tahap asal"
            />
          </Field>

          <Field label="Hasil pemeriksaan ulang">
            <Select
              id={`select-retest-${selectedCase.id}`}
              value={
                draft[`retest-${selectedCase.id}`] ??
                selectedCase.retest
              }
              options={["Belum Diuji", "Lulus", "Gagal"]}
              onChange={(v) => saveText(`retest-${selectedCase.id}`, v)}
            />
          </Field>

          <div className="wf-toolbar">
            <Button
              id={`button-retest-case-${selectedCase.id}`}
              onClick={runRetest}
            >
              Simpan hasil pemeriksaan
            </Button>

            {selectedCase.status === "Verifikasi Ulang" &&
              selectedCase.retest === "Lulus" && (
                <Button
                  id={`button-close-case-${selectedCase.id}`}
                  kind="primary"
                  onClick={closeCase}
                >
                  Tutup kasus
                </Button>
              )}
          </div>
        </>
      ) : (
        <div className="wf-note">
          Hasil pemeriksaan: {selectedCase.retest}
          <p>
            Referensi: {selectedCase.retestReference || "Belum tersedia"}
          </p>
        </div>
      )}
    </div>
  )}
</Panel>
<section className="wf-panel">
  <div className="wf-panel-head">
    <h3>5. Riwayat dan tindak lanjut</h3>
    <button
      type="button"
      className="wf-button"
      aria-expanded={detailOpen("history", false)}
      onClick={() => toggleDetail("history")}
    >
      {detailOpen("history", false) ? "Tutup detail" : "Lihat detail"}
    </button>
  </div>

  {detailOpen("history", false) && (
    <div className="wf-body">
      <p className="wf-note">
        Ringkasan status dan referensi kasus yang tersimpan.
      </p>

      <div className="correction-review-summary">
        <div>
          <small>Nomor kasus</small>
          <strong>{selectedCase.id}</strong>
        </div>
        <div>
          <small>Status terakhir</small>
          <strong>{selectedCase.status}</strong>
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
            {selectedCase.executionReference || "Belum diserahkan"}
          </p>
        </div>
        <div className="full">
          <small>Referensi pemeriksaan ulang</small>
          <p>{selectedCase.retestReference || "Belum tersedia"}</p>
        </div>
      </div>

      <p className="wf-note">
        Ringkasan ini bukan pengganti log aktivitas dan
        arsip keputusan historis.
      </p>
    </div>
  )}
</section>
        </div>
      )}
    </>
  );
}
