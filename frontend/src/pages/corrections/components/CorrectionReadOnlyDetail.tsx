import { AlertTriangle, CalendarClock, ClipboardCheck, FileText, ShieldCheck } from "lucide-react";
import type { OperationalWorkflowState } from "../../../workflow/model";
import { findOpenedCorrection } from "./CorrectionCaseHeader";

type Props = { workflow: OperationalWorkflowState };

function DataPoint({ label, value }: { label: string; value: string | undefined }) {
  return <div className="corr-readonly-item"><dt>{label}</dt><dd>{value?.trim() || "Belum tercatat"}</dd></div>;
}

export default function CorrectionReadOnlyDetail({ workflow }: Props) {
  const item = findOpenedCorrection(workflow);
  const isPusat = workflow.role === "Direktorat / Pusat";
  if (!item) return (
    <section className="corr-readonly-panel">
      <FileText size={24} />
      <h3>Kasus belum dipilih</h3>
      <p>Kembali ke Tindakan Perbaikan, lalu pilih kasus yang ingin ditinjau.</p>
    </section>
  );
  const evidencePresent = Boolean(item.evidence?.trim());
  const total = [item.rootCause, item.actionType, item.evidence, item.owner, item.dueDate].filter(Boolean).length;
  return <div className="corr-readonly-layout">
    {isPusat ? <>
      <section className="corr-readonly-panel">
        <div className="corr-readonly-heading"><ShieldCheck size={19} /><div><h3>Pengawasan tindak lanjut Balai</h3><p>Ringkasan kasus untuk penelaahan tingkat pusat. Keputusan Audit Tingkat 3 tetap melalui Tahap 5.</p></div></div>
        <div className="corr-readonly-stat-row">
          <div><small>Status kasus</small><strong>{item.status}</strong></div>
          <div><small>Persetujuan Balai</small><strong>{item.approval}</strong></div>
          <div><small>Hasil uji ulang</small><strong>{item.retest}</strong></div>
        </div>
        <h4>Dasar pemeriksaan</h4>
        <dl className="corr-readonly-grid">
          <DataPoint label="Balai" value={workflow.project.balai}/>
          <DataPoint label="Sumber temuan" value={item.source}/>
          <DataPoint label="Tahap tertahan" value={item.blockedStage}/>
          <DataPoint label="Ruas / STA" value={`${item.road} · ${item.stationing}`}/>
          <DataPoint label="Jenis survei" value={item.surveyType}/>
          <DataPoint label="Prioritas" value={item.severity}/>
        </dl>
      </section>
      <section className="corr-readonly-panel">
        <div className="corr-readonly-heading"><ClipboardCheck size={19}/><div><h3>Hasil tindakan dan catatan pemeriksa</h3><p>Telusuri tindak lanjut tanpa mengubah keputusan Balai.</p></div></div>
        <dl className="corr-readonly-grid">
          <DataPoint label="Akar masalah" value={item.rootCause}/>
          <DataPoint label="Jenis tindakan" value={item.actionType}/>
          <DataPoint label="Catatan pemeriksa Balai" value={item.reviewNote}/>
          <DataPoint label="Referensi bukti" value={item.evidence}/>
        </dl>
        <p className="corr-readonly-note"><AlertTriangle size={15}/> Referensi bukti tidak otomatis membuktikan bahwa lampiran fisik telah tersedia atau lolos pemeriksaan.</p>
      </section>
    </> : <>
      <section className="corr-readonly-panel">
        <div className="corr-readonly-heading"><CalendarClock size={19}/><div><h3>Monitoring administrasi kasus</h3><p>Pantau tanggung jawab, tenggat, dan kelengkapan pencatatan tanpa tindakan teknis.</p></div></div>
        <div className="corr-readonly-stat-row">
          <div><small>Status kasus</small><strong>{item.status}</strong></div>
          <div><small>Data terisi</small><strong>{total} dari 5 indikator</strong></div>
          <div><small>Referensi bukti</small><strong>{evidencePresent ? "Tercatat" : "Belum tercatat"}</strong></div>
        </div>
        <dl className="corr-readonly-grid">
          <DataPoint label="Paket" value={workflow.project.packageName}/>
          <DataPoint label="Balai" value={workflow.project.balai}/>
          <DataPoint label="Penanggung jawab" value={item.owner}/>
          <DataPoint label="Tenggat" value={item.dueDate}/>
          <DataPoint label="Prioritas" value={item.severity}/>
          <DataPoint label="Sumber temuan" value={item.source}/>
          <DataPoint label="Tahap terkait" value={item.blockedStage}/>
          <DataPoint label="Jenis tindakan" value={item.actionType}/>
        </dl>
      </section>
      <section className="corr-readonly-panel">
        <div className="corr-readonly-heading"><FileText size={19}/><div><h3>Catatan dan referensi</h3><p>Ringkasan informasi yang telah dicatat oleh pihak teknis.</p></div></div>
        <dl className="corr-readonly-grid">
          <DataPoint label="Uraian temuan" value={item.rejectionReason}/>
          <DataPoint label="Referensi bukti" value={item.evidence}/>
          <DataPoint label="Catatan pemeriksa" value={item.reviewNote}/>
          <DataPoint label="Hasil uji ulang" value={item.retest}/>
        </dl>
      </section>
    </>}
  </div>;
}
