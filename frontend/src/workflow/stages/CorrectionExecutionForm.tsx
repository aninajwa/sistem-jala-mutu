import { correctionEvidenceDigest } from "../correctionSubmittedEvidence";

import { RULE_CHECKS, RULE_NUMBERS, requiresNewScenarioEvidence } from "../correctionRules";
import { useState } from "react";
import { usePersistedDraft } from "../../hooks/usePersistedDraft";
import type { CorrectionCase } from "../model";
import { CorrectionEvidenceField } from "../CorrectionEvidenceField";
import { attachmentRepository } from "../repository/attachmentRepository";
import { readEvidenceLinks } from "../repository/evidenceLinks";
import { resolveCorrectionForm, validateCorrectionExecutionFields, correctionExecutionContext, correctionExecutionErrors, type CorrectionExecution } from "../correctionFormEngine";

type Props = {
  correction: CorrectionCase;
  projectId: string;
  attempt?: number;
  editable: boolean;
  onSubmit: (reference: string, result: CorrectionExecution) => void;
};

type ExecutionDraft = {
  date: string;
  location: string;
  lane: string;
  equipment: string;
  sourceReference: string;
  summary: string;
  evidenceNote: string;
  noFile: boolean;
  period: string;
  verificationReference: string;
  changeDetail: string;
  resultEvaluation: string;
  actionFields?: Record<string, string>;
  scenarioChecks?: Record<string, boolean>;
  scenarioNumbers?: Record<string, number>;
};

const emptyDraft: ExecutionDraft = {
  date: "",
  location: "",
  lane: "",
  equipment: "",
  sourceReference: "",
  summary: "",
  evidenceNote: "",
  noFile: false,
  period: "",
  verificationReference: "",
  changeDetail: "",
  resultEvaluation: "",
  actionFields: {},
};

export function CorrectionExecutionForm({
  correction,
  projectId,
  attempt = 0,
  editable,
  onSubmit,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [storedDraft, setDraft] = usePersistedDraft<ExecutionDraft>(
    `jala-correction-execution:${projectId}:${correction.id}${attempt > 1 ? `:submission-${attempt}` : ""}`,
    {
      ...emptyDraft,
      location: correction.stationing || "",
      sourceReference: correction.executionReference || "",
      period: String(correction.cyclePeriod ?? ""),
    }
  );

  // Draft lama dari localStorage dapat tidak memiliki field yang ditambahkan
  // pada patch berikutnya. Normalisasi setiap render, tanpa menghapus isian lama.
  const draft: ExecutionDraft = {
    ...emptyDraft,
    ...storedDraft,
    actionFields: storedDraft?.actionFields ?? {},
  };

  const setValue = <K extends keyof ExecutionDraft>(
    key: K,
    value: ExecutionDraft[K]
  ) => {
    setDraft((current) => ({ ...emptyDraft, ...current, [key]: value }));
    setError("");
  };

  const actionValues = {...(draft.actionFields || {})};
  if (correction.originPciMethod && correction.surveyType === "PCI") {
    if (actionValues.pciMethod !== correction.originPciMethod) {
      delete actionValues.pciRaterReference;
      delete actionValues.pciDetectionReference;
    }
    actionValues.pciMethod = correction.originPciMethod;
  }
  const actionSpec = resolveCorrectionForm(correction, actionValues);
  // Reuse the action-specific evidence reference; avoid asking twice for the same ID.
  const actionReferenceKeys = ["newRecord", "comparison", "mediaReference", "trainingEvaluation", "calibrationEvidence", "postReplacement", "competence", "cleanedReference", "investigation"];
  const actionReference = actionReferenceKeys.map(key => actionValues[key]?.trim()).find(Boolean) || "";
  const effectiveSourceReference = actionSpec.fields.length ? actionReference : draft.sourceReference.trim();
  const action = (correction.actionType || "").toLowerCase();
  const stage = `${correction.source} ${correction.blockedStage}`.toLowerCase();

  const context = correctionExecutionContext(correction);
  const isResurvey = action.includes("survei ulang");
  const isPhoto = action.includes("foto") || action.includes("video");
  const isCalibration =
    action.includes("kalibrasi") ||
    action.includes("validasi ulang alat");
  const isProcessing = action.includes("pemrosesan");
  const isTraining = action.includes("pelatihan");
  const isPersonnel = action.includes("penggantian personel");
  const isComponent = action.includes("penggantian komponen");
  const isRating = action.includes("penilaian ulang");
  const isPeriodic =
    stage.includes("14 hari") ||
    stage.includes("3b") ||
    stage.includes("berkala");
  const isAudit = stage.includes("audit");
  const isDataPreparation =
    stage.includes("lrs") ||
    stage.includes("rni") ||
    stage.includes("persiapan data");

  // Bukti diperlukan untuk kegiatan pengukuran/pemrosesan ulang.
  // Untuk tindakan administratif, pengecualian dapat diberi alasan.
  const requiresFile =
    isResurvey || isPhoto || isCalibration || isProcessing;

  const evidenceScope =
    `${projectId}::correction::${correction.id}::execution${attempt > 1 ? `::submission-${attempt}` : ""}`;

  const evidencePrefix = `${evidenceScope}:documents:`;

  const field = (
    label: string,
    key: keyof ExecutionDraft,
    required = false,
    placeholder = ""
  ) => (
    <div className="wf-field" key={key}>
      <label htmlFor={`execution-${correction.id}-${key}`}>
        {label}{required ? " *" : ""}
      </label>
      <input
        id={`execution-${correction.id}-${key}`}
        value={String(draft[key] ?? "")}
        disabled={!editable}
        placeholder={placeholder}
        onChange={(event) =>
          setValue(key, event.target.value)
        }
      />
    </div>
  );

  async function submit() {
    if (!editable || submitting) return;

    const actionErrors = validateCorrectionExecutionFields(actionSpec, actionValues);
    if (actionErrors.length) { setError(actionErrors[0]); return; }

    if (!draft.date || !effectiveSourceReference ||
        !draft.summary.trim()) {
      setError(
        "Lengkapi tanggal, referensi hasil terbaru, dan uraian pelaksanaan."
      );
      return;
    }

    if ((isResurvey || isPhoto) && !(draft.location.trim() || actionValues.coverage?.trim() || actionValues.mediaObject?.trim())) {
      setError("Lokasi atau segmen pekerjaan wajib diisi.");
      return;
    }

    if ((context.lane && !draft.lane.trim()) || (context.equipment && !draft.equipment.trim())) {
      setError(
        "Lengkapi lajur/arah atau identitas alat sesuai jenis survei."
      );
      return;
    }

    if (isCalibration && !actionValues.instrumentId?.trim() && !draft.equipment.trim()) {
      setError("Identitas alat wajib diisi.");
      return;
    }

    if (isPeriodic &&
        (isResurvey || isProcessing) &&
        !draft.verificationReference.trim()) {
      setError(
        "Isi referensi hasil pemeriksaan konsistensi atau repeatability terbaru."
      );
      return;
    }

    if (isPeriodic && !draft.period.trim()) {
      setError("Periode pemeriksaan berkala harus tersedia.");
      return;
    }

    if (!actionSpec.fields.length && (isTraining || isPersonnel || isComponent || isRating || isProcessing) && !(draft.changeDetail ?? "").trim()) {
      setError("Jelaskan objek, metode, atau bagian yang diperbaiki sesuai jenis tindakan.");
      return;
    }
    if (!actionSpec.fields.length && (isRating || isTraining || isCalibration || isComponent || isPersonnel) && !(draft.resultEvaluation ?? "").trim()) {
      setError("Catat hasil pemeriksaan atau evaluasi setelah tindakan.");
      return;
    }

    setSubmitting(true);

    try {
      const metadata = attachmentRepository.metadata();
      const links = readEvidenceLinks(evidenceScope);

      const keys = [
        ...new Set([
          ...Object.keys(metadata).filter((key) =>
            key.startsWith(evidencePrefix)
          ),
          ...Object.keys(links).filter((key) =>
            key.startsWith(evidencePrefix)
          ),
        ]),
      ].filter((key) => !links[key]?.detached);

      const availableFiles = await Promise.all(
        keys.map(async (key) => {
          const actualKey = links[key]?.fileKey ?? key;
          const record = await attachmentRepository
            .get(actualKey)
            .catch(() => null);
          return record ? await correctionEvidenceDigest(record.file) : null;
        })
      );

      const hasFile = availableFiles.some(Boolean);
      if (availableFiles.some(digest => !digest)) { setError("Ada lampiran yang tidak dapat dibuka. Lepaskan atau unggah ulang sebelum mengajukan hasil."); return; }

      if (requiresFile && !hasFile) {
        setError(
          "Tindakan ini memerlukan lampiran hasil pelaksanaan yang dapat dibuka."
        );
        return;
      }

      if (!requiresFile && !hasFile &&
          (!draft.noFile || !draft.evidenceNote.trim())) {
        setError(
          "Unggah lampiran atau centang tanpa file dan tuliskan alasan yang jelas."
        );
        return;
      }

      const reference = [
        `Tindakan: ${correction.actionType}`,
        `Tahap asal: ${correction.blockedStage}`,
        `Sumber temuan: ${correction.source}`,
        `Jenis survei: ${correction.surveyType}`,
        `Tanggal pelaksanaan: ${draft.date}`,
        draft.period.trim()
          ? `Periode: ${draft.period.trim()}`
          : "",
        (draft.location.trim() || actionValues.coverage?.trim() || actionValues.mediaObject?.trim())
          ? `Lokasi/segmen: ${draft.location.trim() || actionValues.coverage?.trim() || actionValues.mediaObject?.trim()}`
          : "",
        draft.lane.trim()
          ? `Lajur dan arah: ${draft.lane.trim()}`
          : "",
        (draft.equipment.trim() || actionValues.instrumentId?.trim())
          ? `Identitas alat: ${draft.equipment.trim() || actionValues.instrumentId?.trim()}`
          : "",
        `Referensi hasil sumber: ${effectiveSourceReference}`,
        draft.verificationReference.trim()
          ? `Referensi pemeriksaan teknis terbaru: ${draft.verificationReference.trim()}`
          : "",
        `Uraian pelaksanaan: ${draft.summary.trim()}`,
        ...actionSpec.fields.map(f => `${f.label}: ${actionValues[f.id] || ""}`),
        ...(requiresNewScenarioEvidence(correction) ? (RULE_CHECKS[correction.ruleScenario || ""] || []).map(k => `${k}: ${draft.scenarioChecks?.[k] ? "Ya" : "Tidak"}`) : []),
        ...(requiresNewScenarioEvidence(correction) ? (RULE_NUMBERS[correction.ruleScenario || ""] || []).map(k => `${k}: ${draft.scenarioNumbers?.[k] ?? ""}`) : []),
        draft.changeDetail.trim() ? `Lingkup atau rincian tindakan: ${draft.changeDetail.trim()}` : "",
        draft.resultEvaluation.trim() ? `Hasil evaluasi tindakan: ${draft.resultEvaluation.trim()}` : "",
        `Lampiran tersedia pada perangkat ini: ${hasFile ? "Ada" : "Tidak ada"}`,
        
        draft.evidenceNote.trim()
          ? `Catatan bukti: ${draft.evidenceNote.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      // Mencatat referensi pelaksanaan, bukan mengedit raw/cleaned SMD.
      const result: CorrectionExecution = {
        date: draft.date, summary: draft.summary, sourceReference: effectiveSourceReference,
        period: draft.period, lane: context.lane ? draft.lane : "", equipment: context.equipment ? draft.equipment : "",
        verificationReference: draft.verificationReference, actionFields: {...actionValues},
        scenarioChecks: draft.scenarioChecks, scenarioNumbers: draft.scenarioNumbers,
        evidenceKeys: keys.filter((_, i) => availableFiles[i]), evidenceDigests: Object.fromEntries(keys.flatMap((key, i): [string, string][] => { const digest = availableFiles[i]; return digest ? [[key, digest]] : []; })), evidenceNote: draft.evidenceNote,
      };
      const errors = correctionExecutionErrors(correction, result, projectId, attempt);
      if (errors.length) { setError(errors.join(" · ")); return; }
      onSubmit(reference, result);
    } catch (cause) {
      console.error("Gagal mencatat hasil pelaksanaan perbaikan", cause);
      setError("Hasil pelaksanaan belum tercatat. Periksa lampiran lokal dan coba kembali.");
    } finally {
      setSubmitting(false);
    }
  }

  const actionLabel = isResurvey
    ? "Referensi rekaman hasil survei ulang"
    : isPhoto
      ? "Referensi foto/video pengganti"
      : isCalibration
        ? "Referensi kalibrasi atau validasi ulang"
        : isProcessing
          ? "Referensi dataset atau hasil pemrosesan terbaru"
          : "Referensi dokumen hasil perbaikan";

  return (
    <section className="wf-panel">
      <div className="wf-panel-head">
        <h3>Pelaksanaan perbaikan</h3>
        <button
          type="button"
          className="wf-button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          {expanded ? "Tutup detail" : "Lihat detail"}
        </button>
      </div>

      {expanded && (
        <div className="wf-body">
          <div className="wf-callout">
            <strong>{correction.actionType}</strong>
            <p className="wf-note">
              {correction.source} · {correction.surveyType} ·{" "}
              {correction.road}
            </p>
            <p className="wf-note">
              Catat hasil aktual dan bukti pelaksanaan.
            </p>
          </div>


<div className="correction-review-summary" style={{ margin: "14px 0" }}>
  <div>
    <small>Tahap asal temuan</small>
    <strong>{correction.blockedStage}</strong>
  </div>

  <div>
    <small>Jenis survei</small>
    <strong>{correction.surveyType}</strong>
  </div>

  <div>
    <small>Ruas</small>
    <strong>{correction.road || "Belum tersedia"}</strong>
  </div>

  <div>
    <small>STA / lokasi terdampak</small>
    <strong>{correction.stationing || "Belum tersedia"}</strong>
  </div>

  {correction.cyclePeriod != null && (
    <div>
      <small>Periode pemeriksaan</small>
      <strong>Periode {correction.cyclePeriod}</strong>
    </div>
  )}

  <div>
    <small>Rekaman sumber terkait</small>
    <strong>{correction.linkedRecordId || "Belum tertaut"}</strong>
  </div>

  <div className="full">
    <small>Rencana yang disetujui</small>
    <p>{correction.proposedPlan || "Rincian rencana belum tercatat pada kasus lama."}</p>
  </div>
  <div className="full">
    <small>Masalah yang harus diperbaiki</small>
    <p>{correction.rejectionReason || "Belum dicatat"}</p>
  </div>

  <div className="full">
    <small>Tindakan yang telah disetujui</small>
    <p>{correction.actionType || "Belum ada tindakan"}</p>
  </div>
</div>

          <div className="wf-fields">
            <div className="wf-field full">
              <strong>{actionSpec.family} — rincian bukti tindakan</strong>

            </div>
            {actionSpec.fields.map((item) => (
              <div className="wf-field" key={item.id}>
                <label htmlFor={`correction-action-${correction.id}-${item.id}`}>
                  {item.label}{item.required ? " *" : ""}
                </label>
                {item.choices ? <select
                  id={`correction-action-${correction.id}-${item.id}`}
                  value={actionValues[item.id] || ""}
                  disabled={!editable || !!item.fixedValue}
                  onChange={event => {
                    const next = {...actionValues, [item.id]: event.target.value};
                    delete next.pciRaterReference;
                    delete next.pciDetectionReference;
                    setValue("actionFields", next);
                  }}>
                  <option value="">Pilih metode</option>
                  {item.choices.map(choice => <option key={choice} value={choice}>{choice}</option>)}
                </select> : <input
                  id={`correction-action-${correction.id}-${item.id}`}
                  value={actionValues[item.id] || ""}
                  disabled={!editable}
                  onChange={event => setValue("actionFields", {...actionValues, [item.id]: event.target.value})}
                  placeholder={item.label}
                />}
              </div>
            ))}
            {requiresNewScenarioEvidence(correction) && <div className="wf-field full">
              <strong>Hasil pemeriksaan teknis</strong>
              {(RULE_NUMBERS[correction.ruleScenario || ""] || []).map(k => <div className="wf-field" key={k}>
                <label>{k}<input type="number" min="0" step={k.startsWith("Jumlah ") ? "1" : "any"} disabled={!editable} value={draft.scenarioNumbers?.[k] ?? ""} onChange={e => { const next = {...draft.scenarioNumbers}; if (e.target.value === "") delete next[k]; else next[k] = Number(e.target.value); setValue("scenarioNumbers", next); }}/></label>
              </div>)}
              {(RULE_CHECKS[correction.ruleScenario || ""] || []).map(k => <label key={k} className="wf-field"><span><input type="checkbox" disabled={!editable} checked={!!draft.scenarioChecks?.[k]} onChange={e => setValue("scenarioChecks", {...draft.scenarioChecks, [k]: e.target.checked})}/> {k}</span></label>)}
            </div>}
            <div className="wf-field">
              <label htmlFor={`execution-date-${correction.id}`}>
                Tanggal pelaksanaan *
              </label>
              <input
                id={`execution-date-${correction.id}`}
                type="date"
                value={draft.date}
                disabled={!editable}
                onChange={(event) =>
                  setValue("date", event.target.value)
                }
              />
            </div>

            {isPeriodic &&
              field(
                "Periode pemeriksaan berkala",
                "period",
                true,
                "Periode asal temuan"
              )}

            {(!actionSpec.fields.length || isDataPreparation) && (isResurvey || isPhoto || isProcessing ||
              isDataPreparation) &&
              field(
                isProcessing || isDataPreparation
                  ? "Dataset, ruas, atau bagian data terkait"
                  : "Ruas, lokasi, dan segmen pekerjaan",
                "location",
                isResurvey || isPhoto
              )}

            {context.lane &&
              field(
                "Lajur dan arah pengukuran",
                "lane",
                true,
                "Lajur dan arah survei ulang"
              )}

            {(context.equipment || (isCalibration && !actionSpec.fields.length)) &&
              field(
                "Identitas alat",
                "equipment",
                true,
                "Nama atau ID alat yang digunakan"
              )}

            {!actionSpec.fields.length && field(
              actionLabel,
              "sourceReference",
              true,
              "ID rekaman, versi dataset, atau nomor dokumen sumber"
            )}

            {isPeriodic && (isResurvey || isProcessing) &&
              field(
                `Referensi hasil konsistensi/repeatability ${correction.surveyType}`,
                "verificationReference",
                true,
                "ID laporan atau hasil uji terbaru"
              )}

            {isAudit && (
              <div className="wf-field full">
                <p className="wf-note">
                  Temuan berasal dari audit. Pelaksanaan harus
                  mengacu pada sampel atau item audit asal.
                  Keputusan audit ulang tetap dilakukan oleh
                  pemeriksa pada tingkat audit yang berwenang.
                </p>
              </div>
            )}

            {!actionSpec.fields.length && (isRating || isTraining || isPersonnel || isComponent || isProcessing) && (
              <div className="wf-field full">
                <label htmlFor={`execution-change-${correction.id}`}>
                  {isRating ? "Objek/sampel dan metode penilaian ulang" :
                   isTraining ? "Peserta dan kegiatan pelatihan ulang" :
                   isPersonnel ? "Personel atau penugasan yang diganti" :
                   isComponent ? "Identitas komponen dan alat terkait" :
                   "Dataset, versi raw–cleaned, dan metode koreksi"} *
                </label>
                <textarea id={`execution-change-${correction.id}`} rows={3} value={draft.changeDetail}
                  disabled={!editable} onChange={(e) => setValue("changeDetail", e.target.value)}
                  placeholder="Cantumkan identitas atau referensi yang tersedia pada dokumen sumber; jangan mengubah rekaman raw." />
              </div>
            )}
            {!actionSpec.fields.length && (isRating || isTraining || isCalibration || isComponent || isPersonnel) && (
              <div className="wf-field full">
                <label htmlFor={`execution-evaluation-${correction.id}`}>Hasil pemeriksaan/evaluasi setelah tindakan *</label>
                <textarea id={`execution-evaluation-${correction.id}`} rows={3} value={draft.resultEvaluation}
                  disabled={!editable} onChange={(e) => setValue("resultEvaluation", e.target.value)}
                  placeholder="Tuliskan hasil dan rujukan bukti, bukan keputusan Lulus/Gagal yang menjadi kewenangan pemeriksa." />
              </div>
            )}
            <div className="wf-field full">
              <label htmlFor={`execution-summary-${correction.id}`}>
                Uraian pekerjaan dan hasil *
              </label>
              <textarea
                id={`execution-summary-${correction.id}`}
                rows={4}
                value={draft.summary}
                disabled={!editable}
                placeholder="Jelaskan tindakan yang dilakukan, lokasi, hasil, dan keterkaitan dengan temuan asal."
                onChange={(event) =>
                  setValue("summary", event.target.value)
                }
              />
            </div>

            <div className="wf-field full">
              <CorrectionEvidenceField
  scope={evidenceScope}
  editable={editable}
  note={draft.evidenceNote}
  onNoteChange={(value) =>
    setValue("evidenceNote", value)
  }
  noFile={requiresFile ? false : draft.noFile}
  onNoFileChange={
    requiresFile
      ? undefined
      : (checked) => setValue("noFile", checked)
  }
  allowNoFile={!requiresFile}
/>

            </div>

            {error && (
              <div className="wf-field full">
                <div role="alert" className="wf-callout danger">
                  <strong>Hasil belum dapat dikirim</strong>
                  <div>{error}</div>
                </div>
              </div>
            )}

            {editable && (
              <div className="wf-field full">
                <button
                  type="button"
                  className="wf-button primary"
                  disabled={submitting}
                  onClick={() => { void submit(); }}
                >
                  {submitting
                    ? "Memeriksa bukti..."
                    : "Kirim hasil pelaksanaan"}
                </button>
              </div>
            )}
          </div>

          {!editable && correction.executionReference && (
            <p className="wf-note">
              Hasil telah diserahkan untuk pemeriksaan ulang.
              Form pelaksanaan hanya dapat dibaca.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

