import {usePersistedDraft} from '../../hooks/usePersistedDraft';
import {
  ArrowRight,
  ClipboardCheck,
  LockKeyhole,
  Plus,
  TriangleAlert,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { useCorrectionSelection } from "./useCorrectionSelection";

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
  const { commit, heading } = useWorkflowStage(props);
  const [draft,setDraft]=usePersistedDraft<Record<string,string>>(`jala-ui-draft:${state.project.id}:${state.role}:CorrectionWorkspace`,{});
  const [prodType, setProdType] = useState<SurveyType>("IRI");
  const [newCase, setNewCase] = useState<CorrectionCase>(() =>
    defaultCase(state),
  );
  const [caseId, setCaseId] = useCorrectionSelection(state.project.id);
  const test = state.productionTests[prodType];
  const selectedCase =
    state.corrections.find((c) => c.id === caseId) || state.corrections[0];
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
  const changeCaseType = (surveyType: SurveyType) => {
    if (!selectedCase) return;
    const raw =
      state.dailyRecords.find(
        (record) =>
          record.surveyType === surveyType && record.road === selectedCase.road,
      )?.rawValue || "Belum ada nilai raw tertaut";
    updateCurrent(
      {
        surveyType,
        originalValue: raw,
        linkedRecordId: state.dailyRecords.find(
          (record) =>
            record.surveyType === surveyType &&
            record.road === selectedCase.road,
        )?.id,
      },
      "Ubah jenis survei dan tautan raw koreksi",
    );
  };
  const updateCurrent = (patch: Partial<CorrectionCase>, activity: string) => {
    if (!selectedCase) return;
    if (
      state.role !== "Penyedia Jasa / Ketua Tim" &&
      state.role !== "PIC Balai / Pengguna Jasa"
    ) {
      setNotice("Peran aktif ini tidak dapat mengubah kasus koreksi.");
      return;
    }
    if (selectedCase.status === "Ditutup") {
      setNotice("Kasus yang sudah ditutup tidak dapat diubah.");
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
  const executeAction = () => {
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
    updateCurrent(
      { status: "Dilaksanakan" },
      "Tandai tindakan telah dilaksanakan",
    );
  };
  const runRetest = () => {
    if (!selectedCase) return;
    if (
      state.role !== "Penyedia Jasa / Ketua Tim" &&
      state.role !== "PIC Balai / Pengguna Jasa"
    ) {
      setNotice("Penyedia atau PIC Balai mencatat/verifikasi hasil uji ulang.");
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
    updateCurrent(
      { status: "Verifikasi Ulang", retest: result },
      "Catat / verifikasi hasil uji ulang",
    );
  };
  const closeCase = () => {
    if (!selectedCase) return;
    if (state.role !== "PIC Balai / Pengguna Jasa") {
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
      "Tutup kasus dan terapkan cleaned tanpa menimpa raw",
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
      "Kasus ditutup; cleaned diterapkan bila tertaut, raw tetap utuh. Validasi dan audit terkait wajib diulang.",
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
      {heading(
        "Lintas tahap · koreksi",
        "Koreksi berbukti",
        "Telusuri tahap tertahan, akar masalah dan cabang validitas lapangan. Raw asli tidak dapat diubah; setiap koreksi membutuhkan bukti, persetujuan dan uji ulang.",
      )}
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
        <Panel title="Buka kasus baru" icon={Plus}>
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
      </div>
      {selectedCase && (
        <div className="wf-grid">
          <Panel
            title={`Rencana tindakan · ${selectedCase.id}`}
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
            <div className="wf-callout danger">
              Tahap tertahan: <strong>{selectedCase.blockedStage}</strong> ·{" "}
              {selectedCase.road} · {selectedCase.stationing} ·{" "}
              {selectedCase.rejectionReason}
            </div>
            <div className="wf-immutable">
              <LockKeyhole size={14} />
              Raw asli bersifat immutable. Perubahan hanya pada proposed value
              dengan alasan dan bukti verifikasi.
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
                <Select
                  id={`select-case-type-${selectedCase.id}`}
                  value={selectedCase.surveyType}
                  options={[...SURVEY_TYPES]}
                  onChange={(v) => changeCaseType(v as SurveyType)}
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
              <Field label="Nilai raw asli (terkunci)">
                <input
                  data-testid={`input-case-original-${selectedCase.id}`}
                  value={selectedCase.originalValue}
                  readOnly
                  aria-readonly="true"
                />
              </Field>
              <Field label="Rekaman lapangan tertaut">
                <select
                  data-testid="select-correction-record"
                  value={selectedCase.linkedRecordId ?? ""}
                  onChange={(e) => {
                    const r = state.dailyRecords.find(
                      (r) => r.id === e.target.value,
                    );
                    updateCurrent(
                      {
                        linkedRecordId: r?.id,
                        originalValue:
                          r?.rawValue || "Belum ada nilai raw tertaut",
                      },
                      "Tautkan rekaman koreksi",
                    );
                  }}
                >
                  <option value="">Pilih rekaman</option>
                  {state.dailyRecords
                    .filter(
                      (r) =>
                        r.road === selectedCase.road &&
                        r.surveyType === selectedCase.surveyType,
                    )
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id} · {r.date} · raw {r.rawValue}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Usulan nilai cleaned">
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
              <Field label="Bukti foto/video / referensi posisi" full>
                <textarea
                  data-testid={`input-case-evidence-${selectedCase.id}`}
                  value={
                    draft[`evidence-${selectedCase.id}`] ??
                    selectedCase.evidence
                  }
                  onChange={(e) =>
                    saveText(`evidence-${selectedCase.id}`, e.target.value)
                  }
                  placeholder="Deskripsikan bukti dan lokasi. Jangan unggah file nyata."
                />
              </Field>
              <div className="wf-field full">
                <Button
                  id={`button-save-case-evidence-${selectedCase.id}`}
                  onClick={() =>
                    updateCurrent(
                      {
                        proposedValue:
                          draft[`proposed-${selectedCase.id}`] ??
                          selectedCase.proposedValue,
                        evidence:
                          draft[`evidence-${selectedCase.id}`] ??
                          selectedCase.evidence,
                      },
                      "Simpan usulan nilai dan bukti",
                    )
                  }
                >
                  Simpan usulan & bukti
                </Button>
              </div>
            </div>
            <div className="wf-callout" style={{ marginTop: 11 }}>
              {selectedCase.fieldDataValid === "Ya"
                ? "Cabang koreksi penyajian/pemrosesan: raw tetap utuh dan penyesuaian wajib berbasis bukti."
                : selectedCase.fieldDataValid === "Tidak"
                  ? "Cabang tindakan lapangan: pilih survei ulang, re-rating, pelatihan, kalibrasi atau penggantian."
                  : "Tentukan validitas data lapangan untuk mengaktifkan cabang tindakan."}
            </div>
            <div className="wf-callout warn" style={{ marginTop: 9 }}>
              <strong>Panduan khusus {selectedCase.surveyType}</strong>
              <ul>
                {CORRECTION_GUIDANCE[selectedCase.surveyType].map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>
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
          </Panel>
          <Panel
            title="Persetujuan, pelaksanaan & retest"
            icon={ClipboardCheck}
          >
            <div className="wf-callout">
              Verifikasi berlapis merupakan langkah yang dicatat, bukan hanya
              panduan. Mengubah bukti mengembalikan seluruh verifikasi dan
              persetujuan.
            </div>
            {(["surveyor", "teamLeader", "balai"] as const).map((key) => (
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
            <Button
              id="button-case-request-revision"
              kind="danger"
              disabled={selectedCase.status !== "Menunggu Persetujuan"}
              onClick={requestCaseRevision}
            >
              Kembalikan untuk revisi
            </Button>
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
                {selectedCase.evidence ? "Bukti tercatat" : "Menunggu bukti"}
              </Badge>
            </div>
            <div className="wf-stage">
              <span className="wf-stage-num">2</span>
              <div>
                <strong>Persetujuan Pengguna Jasa</strong>
                <small>Peran aktif saat ini: {state.role}</small>
              </div>
              <Badge
                tone={selectedCase.approval === "Disetujui" ? "good" : "warn"}
              >
                {selectedCase.approval}
              </Badge>
            </div>
            <div className="wf-toolbar" style={{ margin: "10px 0" }}>
              <Button
                id={`button-submit-case-${selectedCase.id}`}
                kind="primary"
                onClick={submitAction}
                disabled={
                  selectedCase.status === "Ditutup" ||
                  selectedCase.status === "Menunggu Persetujuan" ||
                  selectedCase.status === "Disetujui" ||
                  selectedCase.status === "Dilaksanakan"
                }
              >
                <ArrowRight size={13} />
                Ajukan usulan
              </Button>
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
              <Button
                id={`button-execute-case-${selectedCase.id}`}
                onClick={executeAction}
                disabled={
                  selectedCase.status !== "Disetujui" ||
                  selectedCase.approval !== "Disetujui"
                }
              >
                Tandai dilaksanakan
              </Button>
            </div>
            <Field label="Hasil uji ulang">
              <Select
                id={`select-retest-${selectedCase.id}`}
                value={
                  draft[`retest-${selectedCase.id}`] ?? selectedCase.retest
                }
                options={["Belum Diuji", "Lulus", "Gagal"]}
                onChange={(v) => saveText(`retest-${selectedCase.id}`, v)}
              />
            </Field>
            <div className="wf-toolbar" style={{ marginTop: 9 }}>
              <Button
                id={`button-retest-case-${selectedCase.id}`}
                onClick={runRetest}
                disabled={
                  selectedCase.status !== "Dilaksanakan" &&
                  selectedCase.status !== "Verifikasi Ulang"
                }
              >
                Catat retest
              </Button>
              <Button
                id={`button-close-case-${selectedCase.id}`}
                kind="primary"
                onClick={closeCase}
                disabled={
                  selectedCase.status !== "Verifikasi Ulang" ||
                  selectedCase.retest !== "Lulus"
                }
              >
                Tutup kasus & kembali ke tahap
              </Button>
            </div>
            <Field label="Kembali ke tahap" full>
              <Select
                id={`select-return-stage-${selectedCase.id}`}
                value={selectedCase.returnStage}
                options={[
                  "Kalibrasi",
                  "Validasi produksi",
                  "Verval 14 hari",
                  "Gerbang RNI/LRS",
                  "Audit tingkat 1",
                  "Audit tingkat 2",
                  "Audit tingkat 3",
                  "Penerimaan & termin",
                ]}
                onChange={(v) =>
                  updateCurrent({ returnStage: v }, "Tentukan tahap kembali")
                }
              />
            </Field>
            <div className="wf-callout warn" style={{ marginTop: 10 }}>
              Rantai: surveyor → team leader → Balai. Kasus ditutup hanya
              setelah uji ulang lulus; objek raw tidak pernah ditimpa.
            </div>
          </Panel>
        </div>
      )}
    </>
  );
}
