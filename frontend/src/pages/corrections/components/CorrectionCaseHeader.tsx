import { correctionDisplayStatus, correctionHasPendingWork } from "../../../workflow/correctionPresentation";
import { correctionNextStep } from "../../../workflow/checkpoint09Corrections";

import {
  ArrowLeft,
} from "lucide-react";
import type {
  CorrectionCase,
  OperationalWorkflowState,
} from "../../../workflow/model";
import { localPersistence } from "../../../workflow/repository/localPersistence";
import "./correctionCaseHeader.css";

type Props = {
  workflow: OperationalWorkflowState;
  onBack: () => void;
};

export function findOpenedCorrection(
  workflow: OperationalWorkflowState,
): CorrectionCase | undefined {
  const key = `jala-correction-selection:${workflow.project.id}`;

  let id = "";
  try {
    id = localPersistence.getItem(key) ?? "";
  } catch {
    // Preferensi pilihan kasus tidak selalu tersedia.
  }

  return workflow.corrections.find((item) => item.id === id);
}

export default function CorrectionCaseHeader({ workflow, onBack }: Props) {
  const item = findOpenedCorrection(workflow);
  return (
    <header className="case-detail-header ui09-case-header">
      <button type="button" className="case-back" onClick={onBack}>
        <ArrowLeft size={15} /> Kembali ke Tindakan Perbaikan
      </button>
      <div className="case-heading">
        <div>
          <span className="case-eyebrow">{workflow.project.packageName}</span>
          <h2>{item?.id ?? "Detail Tindakan Perbaikan"}</h2>
          <p>
            {item?.source ?? "Belum ada kasus dipilih"} ·{" "}
            {item?.surveyType ?? "—"}
          </p>
        </div>
        <span className="case-status">{item ? correctionDisplayStatus(item) : "Belum dipilih"}</span>
      </div>
      {item && <div className="case-role-info" aria-label="Langkah berikutnya">
        <div><strong>{correctionHasPendingWork(item) ? `${workflow.role === correctionNextStep(item).actor ? "Tugas Anda" : "Penanggung jawab berikutnya"}: ${correctionNextStep(item).actor}` : "Kasus selesai"}</strong>
          <p>{correctionNextStep(item).label}</p></div>
      </div>}
      <details className="corr-mode-local"><summary>Mode lokal</summary><p>Data dan lampiran tersimpan di perangkat ini, belum dikirim ke server atau pemeriksa lain.</p></details>
      <details className="ui09-case-context">
        <summary>Asal temuan</summary>
        <p>
          <strong>Temuan:</strong>{" "}
          {item?.rejectionReason ??
            "Pilih kasus dari daftar Tindakan Perbaikan."}
        </p>
      </details>
    </header>
  );
}
