
import { useState } from "react";
import { usePersistedDraft } from "../../hooks/usePersistedDraft";
import type { CorrectionCase } from "../model";
import { CorrectionEvidenceField } from "../CorrectionEvidenceField";
import { attachmentRepository } from "../repository/attachmentRepository";
import { readEvidenceLinks } from "../repository/evidenceLinks";

type Props = {
  correction: CorrectionCase;
  projectId: string;
  editable: boolean;
  onSubmit: (reference: string) => void;
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
};

export function CorrectionExecutionForm({
  correction,
  projectId,
  editable,
  onSubmit,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [draft, setDraft] = usePersistedDraft<ExecutionDraft>(
    `jala-correction-execution:${projectId}:${correction.id}`,
    {
      ...emptyDraft,
      location: correction.stationing || "",
      sourceReference: correction.executionReference || "",
      period: String(correction.cyclePeriod ?? ""),
    }
  );

  const setValue = <K extends keyof ExecutionDraft>(
    key: K,
    value: ExecutionDraft[K]
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const action = (correction.actionType || "").toLowerCase();
  const stage = `${correction.source} ${correction.blockedStage}`.toLowerCase();

  const isResurvey = action.includes("survei ulang");
  const isPhoto = action.includes("foto") || action.includes("video");
  const isCalibration =
    action.includes("kalibrasi") ||
    action.includes("validasi ulang alat");
  const isProcessing = action.includes("pemrosesan");
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
    `${projectId}::correction::${correction.id}::execution`;

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

    if (!draft.date || !draft.sourceReference.trim() ||
        !draft.summary.trim()) {
      setError(
        "Lengkapi tanggal, referensi hasil terbaru, dan uraian pelaksanaan."
      );
      return;
    }

    if ((isResurvey || isPhoto) && !draft.location.trim()) {
      setError("Lokasi atau segmen pekerjaan wajib diisi.");
      return;
    }

    if (isResurvey &&
        (!draft.lane.trim() || !draft.equipment.trim())) {
      setError(
        "Survei ulang memerlukan lajur/arah dan identitas alat."
      );
      return;
    }

    if (isCalibration && !draft.equipment.trim()) {
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
          return Boolean(record);
        })
      );

      const hasFile = availableFiles.some(Boolean);

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
        draft.location.trim()
          ? `Lokasi/segmen: ${draft.location.trim()}`
          : "",
        draft.lane.trim()
          ? `Lajur dan arah: ${draft.lane.trim()}`
          : "",
        draft.equipment.trim()
          ? `Identitas alat: ${draft.equipment.trim()}`
          : "",
        `Referensi hasil sumber: ${draft.sourceReference.trim()}`,
        draft.verificationReference.trim()
          ? `Referensi pemeriksaan teknis terbaru: ${draft.verificationReference.trim()}`
          : "",
        `Uraian pelaksanaan: ${draft.summary.trim()}`,
        `Lampiran lokal: ${hasFile ? "Ada" : "Tidak ada"}`,
        draft.evidenceNote.trim()
          ? `Catatan bukti: ${draft.evidenceNote.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      // Mencatat referensi pelaksanaan, bukan mengedit raw/cleaned SMD.
      onSubmit(reference);
    } catch {
      setError("Pemeriksaan lampiran gagal. Periksa kembali bukti.");
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
        <h3>3. Pelaksanaan perbaikan</h3>
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
              Pelaksanaan dicatat sebagai tindak lanjut QA/QC.
              Hasil survei pada sistem sumber tidak diubah di sini.
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
    <small>Masalah yang harus diperbaiki</small>
    <p>{correction.rejectionReason || "Belum dicatat"}</p>
  </div>

  <div className="full">
    <small>Tindakan yang telah disetujui</small>
    <p>{correction.actionType || "Belum ada tindakan"}</p>
  </div>
</div>

          <div className="wf-fields">
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

            {(isResurvey || isPhoto || isProcessing ||
              isDataPreparation) &&
              field(
                isProcessing || isDataPreparation
                  ? "Dataset, ruas, atau bagian data terkait"
                  : "Ruas, lokasi, dan segmen pekerjaan",
                "location",
                isResurvey || isPhoto
              )}

            {isResurvey &&
              field(
                "Lajur dan arah pengukuran",
                "lane",
                true,
                "Lajur dan arah survei ulang"
              )}

            {(isResurvey || isCalibration) &&
              field(
                "Identitas alat",
                "equipment",
                true,
                "Nama atau ID alat yang digunakan"
              )}

            {field(
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
              {requiresFile && (
                <p className="wf-note">
                  Lampiran hasil wajib tersedia untuk tindakan ini.
                  Pilihan tanpa file tidak berlaku saat pengiriman.
                </p>
              )}
            </div>

            {error && (
              <div className="wf-field full">
                <p role="alert" className="wf-note">
                  {error}
                </p>
              </div>
            )}

            {editable && (
              <div className="wf-field full">
                <button
                  type="button"
                  className="wf-button"
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
