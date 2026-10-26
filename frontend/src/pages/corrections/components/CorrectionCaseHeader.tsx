
import { ArrowLeft, AlertCircle, ClipboardCheck, ShieldCheck } from "lucide-react";
import type { CorrectionCase, OperationalWorkflowState } from "../../../workflow/model";
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

  return workflow.corrections.find(item => item.id === id);
}

export default function CorrectionCaseHeader({
  workflow,
  onBack,
}: Props) {
  const item = findOpenedCorrection(workflow);
  const role = workflow.role;

  const duties = role === "Penyedia Jasa / Ketua Tim"
    ? "Identifikasi masalah, lengkapi bukti, verifikasi internal, dan ajukan usulan."
    : role === "PIC Balai / Pengguna Jasa"
      ? "Periksa bukti Penyedia, catat keputusan, dan verifikasi ulang sesuai kewenangan."
      : role === "Direktorat / Pusat"
        ? "Telaah temuan dan hasil pemeriksaan sebelumnya. Audit Tingkat 3 tetap berada pada Tahap 5."
        : "Pantau status kasus dan riwayat. Tidak memiliki kewenangan persetujuan teknis.";

  return (
    <header className="case-detail-header">
      <button
        type="button"
        className="case-back"
        onClick={onBack}
      >
        <ArrowLeft size={15} />
        Kembali ke Tindakan Perbaikan
      </button>

      <div className="case-heading">
        <div>
          <span className="case-eyebrow">
            TINDAKAN PERBAIKAN / DETAIL KASUS
          </span>
          <h2>{item?.id ?? "Detail Tindakan Perbaikan"}</h2>
          <p>
            {workflow.project.packageName} ·{" "}
            {item?.source ?? "Belum ada kasus dipilih"} ·{" "}
            {item?.surveyType ?? "—"}
          </p>
        </div>

        <span className="case-status">
          {item?.status ?? "Belum dipilih"}
        </span>
      </div>

      <div className="case-problem">
        <AlertCircle size={19} />
        <div>
          <strong>Temuan yang harus ditindaklanjuti</strong>
          <p>
            {item?.rejectionReason ??
              "Pilih kasus dari daftar Tindakan Perbaikan."}
          </p>
        </div>
      </div>

      <div className="case-role-info">
        {role === "Admin" || role === "Direktorat / Pusat"
          ? <ShieldCheck size={17} />
          : <ClipboardCheck size={17} />}

        <div>
          <strong>Pekerjaan {role}</strong>
          <p>{duties}</p>
        </div>
      </div>
    </header>
  );
}
