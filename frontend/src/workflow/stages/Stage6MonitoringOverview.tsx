import type { OperationalWorkflowState } from "../model";
import { BalaiDecisionHistory } from "../BalaiDecisionHistory";

type Props = {
  state: OperationalWorkflowState;
  onNavigate: (selection: string) => void;
};

/** Informational stage-6 view: no technical approval or provider editing. */
export function Stage6MonitoringOverview({ state, onNavigate }: Props) {
  const directorate = state.role === "Direktorat / Pusat";
  const { acceptance, project } = state;
  const openCorrections = state.corrections.filter((item) => item.status !== "Ditutup");
  const auditReady = state.audits.every((item) => item.status === "Lulus" && !item.requiresReview);

  return (
    <section className="wf-monitoring-overview" aria-label="Monitoring penerimaan data">
      <header className="wf-monitoring-header">
        <p className="wf-eyebrow">{directorate ? "Monitoring mutu" : "Jejak administrasi"} · Tahap 6</p>
        <h1 className="wf-title">{directorate ? "Status penerimaan data" : "Administrasi penerimaan"}</h1>
        <p>{project.packageName} · {project.balai}</p>
      </header>
      <div className="wf-kpis" aria-label="Ringkasan penerimaan">
        <div className="wf-kpi"><div className="wf-kpi-label">Keputusan Balai</div><div className="wf-kpi-value">{acceptance.acceptanceDecision || "Belum diperiksa"}</div></div>
        <div className="wf-kpi"><div className="wf-kpi-label">Termin selesai</div><div className="wf-kpi-value">{acceptance.terms.filter((term) => term.complete).length}/{acceptance.terms.length}</div></div>
        <div className="wf-kpi"><div className="wf-kpi-label">Audit berjenjang</div><div className="wf-kpi-value">{auditReady ? "Lulus" : "Belum lengkap"}</div></div>
        <div className="wf-kpi"><div className="wf-kpi-label">Kasus terbuka</div><div className="wf-kpi-value">{openCorrections.length}</div></div>
      </div>
      <section className="wf-monitoring-section" aria-label="Dokumen dan status">
        <h3>Dokumen & hasil tercatat</h3>
        <dl className="v2-decision-facts">
          <dt>BA penerimaan akhir</dt><dd>{acceptance.finalAcceptanceBa || "Belum tercatat"}</dd>
          <dt>Referensi parsial</dt><dd>{acceptance.partialReceipts.join(", ") || "Belum tercatat"}</dd>
          <dt>Laporan akhir</dt><dd>{acceptance.finalReport ? "Tercatat tersedia" : "Belum tercatat"}</dd>
          <dt>Penerimaan akhir</dt><dd>{acceptance.finalAcceptance ? "Tercatat" : "Belum tercatat"}</dd>
          {acceptance.acceptanceReviewNote && <><dt>Catatan Balai</dt><dd>{acceptance.acceptanceReviewNote}</dd></>}
          {acceptance.acceptanceRejectionReason && <><dt>Alasan penolakan</dt><dd>{acceptance.acceptanceRejectionReason}</dd></>}
        </dl>
        <div className="wf-toolbar">
          <button type="button" className="wf-button" onClick={() => onNavigate("/documents:BA & dokumen workflow")}>Lihat dokumen mutu</button>
          {directorate && <button type="button" className="wf-button" onClick={() => onNavigate("/verification:Audit tingkat 1–3")}>Lihat audit berjenjang</button>}
          {openCorrections.length > 0 && <button type="button" className="wf-button" onClick={() => onNavigate("/actions:Koreksi berbukti")}>Lihat tindak lanjut</button>}
        </div>
      </section>
      <BalaiDecisionHistory state={state} stage="Tahap 6" />
    </section>
  );
}
