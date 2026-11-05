
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
        ? "Telaah temuan. Pemeriksaan ulang dan penutupan temuan Audit Tingkat 3 dilakukan oleh Direktorat; keputusan audit ulang tetap pada Tahap 5."
        : "Pantau status kasus dan riwayat. Tidak memiliki kewenangan persetujuan teknis.";

  return <header className="case-detail-header ui09-case-header"><button type="button" className="case-back" onClick={onBack}><ArrowLeft size={15}/> Kembali ke Tindakan Perbaikan</button><div className="case-heading"><div><span className="case-eyebrow">{workflow.project.packageName}</span><h2>{item?.id??'Detail Tindakan Perbaikan'}</h2><p>{item?.source??'Belum ada kasus dipilih'} · {item?.surveyType??'—'}</p></div><span className="case-status">{item?.status??'Belum dipilih'}</span></div><details className="ui09-case-context"><summary>Asal temuan & kewenangan</summary><p><strong>Temuan:</strong> {item?.rejectionReason??'Pilih kasus dari daftar Tindakan Perbaikan.'}</p><p>{duties}</p></details></header>;
}
