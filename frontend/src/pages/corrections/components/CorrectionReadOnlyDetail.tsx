import { CorrectionSubmittedEvidence } from "../../../workflow/CorrectionSubmittedEvidencePanel";
import { correctionDisplayStatus } from "../correctionViewModel";
import { CorrectionRevisionHistory } from "../../../workflow/CorrectionRevisionHistoryPanel";
import { correctionExecutionSummary, correctionResultReference, correctionProposalTechnicalSummary } from "../../../workflow/correctionFormEngine";
import { correctionEventSummary } from "../../../workflow/correctionHistory";
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
  return <div className="corr-readonly-layout">
    {isPusat ? <>
      <section className="corr-readonly-panel">
        <div className="corr-readonly-heading"><ShieldCheck size={19} /><div><h3>Pengawasan tindak lanjut teknis</h3><p>Pemantauan kasus dan keputusan pemeriksa.</p></div></div>
        <div className="corr-readonly-stat-row">
          <div><small>Status kasus</small><strong>{correctionDisplayStatus(item)}</strong></div>
          <div><small>Persetujuan Balai</small><strong>{item.approval}</strong></div>
          <div><small>Hasil uji ulang</small><strong>{item.retest}</strong></div>
        </div>
        <h4>Dasar pemeriksaan</h4>
        <dl className="corr-readonly-grid">
          <DataPoint label="Balai" value={workflow.project.balai}/>
          <DataPoint label="Sumber temuan" value={item.source}/>
          <DataPoint label="Tahap asal" value={item.blockedStage}/>
          <DataPoint label="Ruas / STA" value={[item.road, item.stationing].filter(value => value?.trim()).join(" · ")}/>
          <DataPoint label="Jenis survei" value={item.surveyType}/>
          <DataPoint label="Prioritas" value={item.severity}/>
        </dl>
      </section>
      <section className="corr-readonly-panel">
        <div className="corr-readonly-heading"><ClipboardCheck size={19}/><div><h3>Hasil tindakan dan catatan pemeriksa</h3></div></div>
        <dl className="corr-readonly-grid">
          <DataPoint label="Akar masalah" value={item.rootCause}/>
          <DataPoint label="Jenis tindakan" value={item.actionType}/><DataPoint label="Rencana tindakan" value={item.proposedPlan}/>
          <DataPoint label="Catatan pemeriksa Balai" value={item.reviewNote}/>
          <DataPoint label="Catatan bukti usulan" value={item.evidence}/>
          <DataPoint label="Uraian temuan" value={item.rejectionReason}/>
          <DataPoint label="Bukti pemeriksaan asal" value={item.originReference}/>
          {correctionProposalTechnicalSummary(item).map(row => <DataPoint key={row.label} label={row.label} value={row.value}/>)}
        </dl>
        <p className="corr-readonly-note"><AlertTriangle size={15}/> Referensi bukti tidak otomatis membuktikan bahwa lampiran fisik telah tersedia atau lolos pemeriksaan.</p>
      </section>
    </> : <>
      <section className="corr-readonly-panel">
        <div className="corr-readonly-heading"><CalendarClock size={19}/><div><h3>Monitoring administrasi kasus</h3></div></div>
        <div className="corr-readonly-stat-row">
          <div><small>Status kasus</small><strong>{correctionDisplayStatus(item)}</strong></div>
          <div><small>Penanggung jawab</small><strong>{item.owner || "Belum ditetapkan"}</strong></div>
          <div><small>Catatan bukti usulan</small><strong>{evidencePresent ? "Tercatat" : "Belum tercatat"}</strong></div>
        </div>
        <dl className="corr-readonly-grid">
          <DataPoint label="Paket" value={workflow.project.packageName}/>
          <DataPoint label="Balai" value={workflow.project.balai}/>
          <DataPoint label="Penanggung jawab" value={item.owner}/>
          <DataPoint label="Tenggat" value={item.dueDate || "Belum ditetapkan"}/>
          <DataPoint label="Prioritas" value={item.severity}/>
          <DataPoint label="Sumber temuan" value={item.source}/>
          <DataPoint label="Tahap terkait" value={item.blockedStage}/>
          <DataPoint label="Jenis tindakan" value={item.actionType}/><DataPoint label="Rencana tindakan" value={item.proposedPlan}/>
        </dl>
      </section>
      <section className="corr-readonly-panel">
        <div className="corr-readonly-heading"><FileText size={19}/><div><h3>Catatan dan referensi</h3></div></div>
        <dl className="corr-readonly-grid">
          <DataPoint label="Uraian temuan" value={item.rejectionReason}/>
          <DataPoint label="Bukti pemeriksaan asal" value={item.originReference}/>
          <DataPoint label="Catatan bukti usulan" value={item.evidence}/>
          <DataPoint label="Catatan pemeriksa" value={item.reviewNote}/>
          <DataPoint label="Hasil uji ulang" value={item.retest}/>
        </dl>
      </section>
    </>}
    {isPusat && item.executionResult && <section className="corr-readonly-panel"><h3>Rincian hasil pelaksanaan</h3><dl className="corr-readonly-grid">{correctionExecutionSummary(item).map(row => <DataPoint key={row.label} label={row.label} value={row.value}/>)}</dl></section>}
    {isPusat && item.executionResult && <CorrectionSubmittedEvidence projectId={workflow.project.id} caseId={item.id} keys={item.executionResult.evidenceKeys} digests={item.executionResult.evidenceDigests}/>}
    <section className="corr-readonly-panel">
      <h3>Referensi hasil dan pemeriksaan</h3>
      <dl className="corr-readonly-grid">
        {(!item.executionResult || !isPusat) && <DataPoint label="Referensi pelaksanaan" value={correctionResultReference(item)}/>}
        <DataPoint label="Referensi pemeriksaan ulang" value={item.retestReference}/>
        {item.retest === "Gagal" && <DataPoint label="Alasan uji ulang gagal" value={item.retestFailureReason}/>}
      </dl>
    </section>
    <section className="corr-readonly-panel">
      <h3>Riwayat kasus</h3>
      <CorrectionRevisionHistory state={workflow} caseId={item.id}/>
      {workflow.events.filter(event => event.object === item.id).length ? workflow.events.filter(event => event.object === item.id).map(event => {
        const summary = correctionEventSummary(event);
        return <article key={event.id}><strong>{summary.title}</strong><p>{event.actor} · {event.date}</p>{summary.detail && <p style={{whiteSpace:"pre-wrap"}}>{summary.detail}</p>}</article>;
      }) : <p>Belum ada aktivitas tercatat.</p>}
    </section>
  </div>;
}
