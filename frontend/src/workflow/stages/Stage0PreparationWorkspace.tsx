import {DocumentAttachments} from '../DocumentAttachments';
import {usePersistedDraft} from '../../hooks/usePersistedDraft';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Check,
  ClipboardCheck,
  FileCheck2,
  FileText,
  MapPinned,
} from "lucide-react";
import { useState } from "react";

import {
  ApprovalState,
  CYCLE_PROTOCOLS,
  CYCLE_SHARED_PROTOCOLS,
  PREPARATION_COORDINATION,
  PREPARATION_DOCUMENTS,
  PREPARATION_FIELD_PLAN,
  PREPARATION_SOURCE_REVIEWS,
  SurveyType,
} from "../model";
import { GateSummary } from "../WorkflowComponents";

import type { WorkflowStageProps } from "./stageSupport";
import { Badge, Button, Field, Panel, resetAuditLevels } from "./stageSupport";
import { useWorkflowStage } from "./useWorkflowStage";

export function Stage0PreparationWorkspace(props: WorkflowStageProps) {
  const { selection, state, onUpdate, setNotice, onNavigate } = props;
  const { commit, setPreparation, setCheck, heading, renderChecklist } =
    useWorkflowStage(props);
  const [draft,setDraft]=usePersistedDraft<Record<string,string>>(`jala-ui-draft:${state.project.id}:${state.role}:Stage0PreparationWorkspace`,{});
  const server = props.serverPreparation;
  if(props.serverReadOnly && !server){
    return <section className="wf-panel" data-testid="dirah-stage0-server-readonly"><div className="wf-panel-head"><h2>Survei Pendahuluan & Persiapan QA/QC</h2></div><div className="wf-body"><p className="wf-note">{props.serverStatusNote||'Belum terhubung ke server. Checklist dan tindakan persiapan dinyahaktifkan.'}</p></div></section>;
  }
  const saveText = (key: string, value: string) =>
    setDraft((old) => ({ ...old, [key]: value }));

  const prep = state.project.preparation;
  const canPrepareInput = state.role === "Penyedia Jasa / Ketua Tim";
  const canReviewPreparation = state.role === "PIC Balai / Pengguna Jasa";
  const serverChecklistStatus = server?.checklist?.pengisian.status;
  const serverSubmissionStatus = server?.submission?.status;
  const officialServerGateActive = server?.checklist?.ringkasan.syarat_submit_aktif === true || server?.submission?.aturan.validasi_kelengkapan_resmi_aktif === true;
  const officialServerReady = serverSubmissionStatus === 'DISETUJUI' && officialServerGateActive;
  const serverYesCount = server?.mappedItems.filter(item => server.answers[item.itemId]?.jawaban === 'Ya').length ?? 0;
  const triStateForSection = (section: string) => server ? Object.fromEntries(
    (section === 'Telaah data awal' ? PREPARATION_SOURCE_REVIEWS : section === 'Rencana lapangan' ? PREPARATION_FIELD_PLAN : section === 'Koordinasi' ? PREPARATION_COORDINATION : PREPARATION_DOCUMENTS)
      .map(label => {
        const mapped = server.mappedItems.find(item => item.section === section && item.label === label);
        return [label, mapped
          ? { answer: server.answers[mapped.itemId]?.jawaban ?? null, note: server.answers[mapped.itemId]?.keterangan ?? '' }
          : { answer: null, disabled: true, note: 'Item ini tidak mempunyai padanan server yang disahkan.' }];
      }),
  ) : undefined;
  const onServerAnswer = (section: string, label: string, answer: 'Ya' | 'Tidak' | null) => {
    const mapped = server?.mappedItems.find(item => item.section === section && item.label === label);
    if (mapped && server) server.onAnswer(mapped.itemId, answer, server.answers[mapped.itemId]?.keterangan ?? '');
  };
  const allItems = [
    ...PREPARATION_SOURCE_REVIEWS.map((x) => prep.sourceReviews[x]),
    ...PREPARATION_FIELD_PLAN.map((x) => prep.fieldPlan[x]),
    ...PREPARATION_COORDINATION.map((x) => prep.coordination[x]),
    ...PREPARATION_DOCUMENTS.map((x) => prep.documents[x]),
  ];
  const complete = allItems.filter(Boolean).length;
  const approve = (status: ApprovalState) => {
    if (status === "Diajukan" && state.role !== "Penyedia Jasa / Ketua Tim") {
      setNotice(
        "Peran Penyedia Jasa / Ketua Tim diperlukan untuk mengajukan laporan.",
      );
      return;
    }
    if (status !== "Diajukan" && state.role !== "PIC Balai / Pengguna Jasa") {
      setNotice(
        "Peran PIC Balai / Pengguna Jasa diperlukan untuk meninjau laporan.",
      );
      return;
    }
    if (status !== "Diajukan" && prep.reportApproval !== "Diajukan") {
      setNotice(
        "Ajukan laporan terlebih dahulu sebelum revisi atau persetujuan.",
      );
      return;
    }
    if (status === "Diajukan" && complete !== allItems.length) {
      setNotice("Checklist persiapan belum lengkap.");
      return;
    }
    setPreparation(
      (p) => ({
        ...p,
        reportApproval: status,
        reviewerNote: draft.reviewerNote ?? p.reviewerNote,
      }),
      `Status laporan pendahuluan: ${status}`,
      state.project.packageName,
      `Status persiapan menjadi ${status}`,
    );
  };
  const savePackage = () => {
    if (state.role !== "Penyedia Jasa / Ketua Tim") {
      setNotice(
        "Peran Penyedia Jasa diperlukan untuk mengubah ruang lingkup paket.",
      );
      return;
    }
    const packageName = draft.packageName ?? state.project.packageName;
    const spmkDate = draft.spmkDate ?? state.project.spmkDate;
    const contractor = draft.contractor ?? state.project.contractor;
    const satker = draft.satker ?? state.project.satker;
    const ppk = draft.ppk ?? state.project.ppk;
    const balai = draft.balai ?? state.project.balai;
    const semester =
      (draft.semester as "Semester I" | "Semester II") ??
      state.project.semester;
    const surveyTypes = (draft.types ?? state.project.surveyTypes.join("|"))
      .split("|")
      .filter(Boolean) as SurveyType[];
    const routes = (draft.routes ?? state.project.routes.join(", "))
      .split(",")
      .map((route) => route.trim())
      .filter(Boolean);
    if (!surveyTypes.length || !routes.length) {
      setNotice("Paket memerlukan minimal satu jenis survei dan satu ruas.");
      return;
    }
    const packageChanged =
      packageName !== state.project.packageName ||
      spmkDate !== state.project.spmkDate ||
      contractor !== state.project.contractor ||
      satker !== state.project.satker ||
      ppk !== state.project.ppk ||
      balai !== state.project.balai ||
      semester !== state.project.semester ||
      routes.join("|") !== state.project.routes.join("|") ||
      surveyTypes.join("|") !== state.project.surveyTypes.join("|");
    const scopeChanged =
      routes.join("|") !== state.project.routes.join("|") ||
      surveyTypes.join("|") !== state.project.surveyTypes.join("|");
    // Perubahan administratif tidak membatalkan pemeriksaan teknis. Perubahan lingkup harus ditinjau ulang.
    commit(
      "Simpan konfigurasi paket",
      state.project.id,
      (s) => {
        const allowedProtocolKeys = new Set(
          surveyTypes.flatMap((type) =>
            CYCLE_PROTOCOLS[type].map((protocol) => `${type} · ${protocol}`),
          ),
        );
        const checkedProtocols = Object.fromEntries(
          Object.entries(s.cycle.checkedProtocols).filter(
            ([key]) =>
              CYCLE_SHARED_PROTOCOLS.includes(key) ||
              allowedProtocolKeys.has(key),
          ),
        );
        const cycle = scopeChanged
          ? {
              ...s.cycle,
              selectedTypes: s.cycle.selectedTypes.filter((type) =>
                surveyTypes.includes(type),
              ),
              checkedProtocols: Object.fromEntries([
                ...surveyTypes.flatMap((type) =>
                  CYCLE_PROTOCOLS[type].map((protocol) => [
                    `${type} · ${protocol}`,
                    false,
                  ]),
                ),
                ...CYCLE_SHARED_PROTOCOLS.map((protocol) => [protocol, false]),
              ]),
              iriCoefficientVariation: null,
              pciAiStandardDeviation: null,
              reRatingStatus: "Belum Diperiksa" as const,
              consistency: "Belum Diperiksa" as const,
              bridgeFieldValidation: false,
              finalPeriodValidation: false,
              certificateId: "",
            }
          : {
              ...s.cycle,
              selectedTypes: s.cycle.selectedTypes.filter((type) =>
                surveyTypes.includes(type),
              ),
              checkedProtocols,
            };
        return {
          ...s,
          project: {
            ...s.project,
            packageName,
            spmkDate,
            contractor,
            satker,
            ppk,
            balai,
            semester,
            routes,
            surveyTypes,
            preparation: {
              ...s.project.preparation,
              reportApproval: scopeChanged
                ? "Draft"
                : s.project.preparation.reportApproval,
            },
          },
          cycle,
          calibrationChecklist: scopeChanged
            ? ({
                ...s.calibrationChecklist,
                ...Object.fromEntries(surveyTypes.map((type) => [type, false])),
              } as Record<SurveyType, boolean>)
            : s.calibrationChecklist,
          productionApproval: scopeChanged ? "Draft" : s.productionApproval,
          productionApprovalBa: scopeChanged ? "" : s.productionApprovalBa,
          bridgeInspectionPermit: scopeChanged
            ? false
            : s.bridgeInspectionPermit,
          submission: scopeChanged
            ? {
                ...s.submission,
                validationStatus: "Draft",
                validationMessage:
                  "Ruang lingkup paket berubah; jalankan ulang validasi dan audit.",
              }
            : s.submission,
          audits: scopeChanged ? resetAuditLevels() : s.audits,
          acceptance: scopeChanged
            ? {
                ...s.acceptance,
                terms: s.acceptance.terms.map((term) => ({
                  ...term,
                  complete: false,
                })),
                semesterTwoRevalidation: false,
                finalReport: false,
                finalAcceptance: false,
              }
            : s.acceptance,
        };
      },
      scopeChanged
        ? "Lingkup teknis berubah; pemeriksaan dan keputusan terkait perlu diulang."
        : packageChanged
          ? "Identitas paket diperbarui tanpa menghapus persetujuan teknis."
          : "Ruang lingkup paket tersimpan tanpa perubahan",
    );
  };
  return (
    <>
      {heading(
        "Tahap 0 · persiapan",
        "Survei pendahuluan & persiapan QA/QC",
        "Lengkapi telaah awal, rencana survei, koordinasi, dan dokumen pendahuluan sebelum paket masuk ke kalibrasi dan validasi awal.",
      )}
      <div className="workflow-data-origin">
        <span className="origin-badge contract">DATA PAKET</span>
        <div>
          <strong>Informasi paket kontrak</strong>
          <span>
            Identitas, ruas, dan lingkup survei mengikuti data paket. Penyedia
            tidak mengubah ruang lingkup kontrak dari halaman ini.
          </span>
        </div>
      </div>

      <GateSummary
        title="Kesiapan menuju Kalibrasi & Validasi Awal"
        items={[
          {
            label: "Checklist survei pendahuluan lengkap",
            ready: server ? officialServerReady : complete === allItems.length,
            detail: server
              ? `${server.checklist?.ringkasan.jumlah_terjawab ?? '—'}/${server.checklist?.ringkasan.jumlah_item ?? '—'} dijawab · gate rasmi ${officialServerGateActive ? 'aktif' : 'belum aktif'}`
              : `${complete}/${allItems.length} item`,
          },
          {
            label: "Review PIC Balai selesai",
            ready: server ? officialServerReady : prep.reportApproval === "Disetujui",
            detail: server ? (serverSubmissionStatus ?? 'Status server belum tersedia') : prep.reportApproval,
          },
        ]}
      />

      {server && <div className="wf-note" role={server.error ? 'alert' : 'status'}>
        {server.error || (server.loading ? 'Memuat status persiapan server…' : `Checklist server ${serverChecklistStatus ?? 'belum tersedia'} · pengajuan ${serverSubmissionStatus ?? 'belum tersedia'} · versi ${server.checklist?.pengisian.versi ?? '—'}.`)}
        {server.message && <span> {server.message}</span>}
        {server.error && <button type="button" className="wf-button" onClick={server.onReload}>Coba muat ulang</button>}
        {server.mappingGaps.length > 0 && <span> Item tanpa mapping: {server.mappingGaps.join(' ')}</span>}
      </div>}

      {state.role === "Penyedia Jasa / Ketua Tim" ? (
        <div className="workflow-role-block provider">
          <div className="workflow-data-origin">
            <span className="origin-badge provider">INPUT PENYEDIA</span>
            <div>
              <strong>Kelengkapan persiapan</strong>
              <span>
                Lengkapi kegiatan dan dokumen yang menjadi tanggung jawab
                Penyedia sebelum diajukan ke PIC Balai.
              </span>
            </div>
          </div>



          <div className="wf-grid equal">
            {renderChecklist(
              "Telaah data awal",
              BookOpen,
              PREPARATION_SOURCE_REVIEWS,
              prep.sourceReviews,
              (k, v) => setCheck("sourceReviews", k, v),
              server ? !server.editable || server.saving : !canPrepareInput,
              triStateForSection('Telaah data awal'),
              (label, answer) => onServerAnswer('Telaah data awal', label, answer),
            )}

            {renderChecklist(
              "Rencana survei lapangan",
              MapPinned,
              PREPARATION_FIELD_PLAN,
              prep.fieldPlan,
              (k, v) => setCheck("fieldPlan", k, v),
              server ? !server.editable || server.saving : !canPrepareInput,
              triStateForSection('Rencana lapangan'),
              (label, answer) => onServerAnswer('Rencana lapangan', label, answer),
            )}

            {renderChecklist(
              "Koordinasi & uji kesiapan",
              Activity,
              PREPARATION_COORDINATION,
              prep.coordination,
              (k, v) => setCheck("coordination", k, v),
              server ? !server.editable || server.saving : !canPrepareInput,
              triStateForSection('Koordinasi'),
              (label, answer) => onServerAnswer('Koordinasi', label, answer),
            )}

            {renderChecklist(
              "Dokumen pendahuluan",
              FileCheck2,
              PREPARATION_DOCUMENTS,
              prep.documents,
              (k, v) => setCheck("documents", k, v),
              server ? !server.editable || server.saving : !canPrepareInput,
              triStateForSection('Dokumen persiapan'),
              (label, answer) => onServerAnswer('Dokumen persiapan', label, answer),
            )}
          </div>

          {server && <div className="wf-toolbar" style={{ marginTop: 12 }}>
            <Button id="button-prep-save-server" kind="primary" disabled={!server.editable || server.saving || !server.mappedItems.length} onClick={server.onSave}>
              {server.saving ? 'Menyimpan…' : 'Simpan checklist'}
            </Button>
          </div>}

          <DocumentAttachments scope={`${state.project.id}:stage0`} categories={['Laporan Pendahuluan','Program Mutu / Quality Management Plan','RMPK','RKK','RMLLP','Bukti Koordinasi']} legacyEvidenceIds={['stage0-laporan-pendahuluan','stage0-program-mutu','stage0-rmpk','stage0-rkk','stage0-koordinasi']} editable={server ? server.editable : canPrepareInput} server={server ? {packageId:String(server.checklist?.paket_id ?? state.project.id),checklist:server.checklist,documents:server.documents,loading:server.documentLoading,error:server.documentError,busy:server.documentBusy,editable:server.editable,onUpload:server.onDocumentUpload,onReuse:server.onDocumentReuse,onChanged:server.onDocumentsChanged} : undefined}/>

          <Panel title="Pengajuan ke PIC Balai" icon={ArrowRight}>
            <div className="workflow-action-copy">
              <strong>
                {(server ? false : complete === allItems.length)
                  ? "Persiapan lengkap dan siap diajukan"
                  : server ? `Status server: ${serverSubmissionStatus ?? 'belum tersedia'}` : "Persiapan belum lengkap"}
              </strong>
              <span>
                {(server ? false : complete === allItems.length)
                  ? "Setelah diajukan, isian Penyedia menjadi bahan review PIC Balai."
                  : server ? 'Pengajuan rasmi dinonaktifkan kerana syarat submit server belum aktif.' : `Masih ada ${allItems.length - complete} item yang perlu dilengkapi.`}
              </span>
            </div>

            {(server ? serverSubmissionStatus === 'PERLU_REVISI' && !!server.submission?.review?.catatan : prep.reportApproval === "Perlu Revisi" && !!prep.reviewerNote) && (
              <div className="review-note important">
                <small>CATATAN PIC BALAI</small>
                <strong>Perlu perbaikan</strong>
                <p>{server ? server.submission?.review?.catatan : prep.reviewerNote}</p>
              </div>
            )}

            <div className="wf-toolbar" style={{ marginTop: 12 }}>
              <Button
                id="button-prep-submit"
                kind="primary"
                disabled={
                  !!server || complete !== allItems.length || prep.reportApproval === "Diajukan"
                }
                onClick={() => server ? undefined : approve("Diajukan")}
              >
                <ArrowRight size={13} />
                {(server ? serverSubmissionStatus === 'DIAJUKAN' : prep.reportApproval === "Diajukan")
                  ? "Menunggu Review"
                  : "Ajukan untuk Review"}
              </Button>
            </div>
          </Panel>
        </div>
      ) : (
        <div className="workflow-role-block reviewer">
          <div className="workflow-data-origin">
            <span className="origin-badge reviewer">{canReviewPreparation?"REVIEW PIC BALAI":"MONITORING PERSIAPAN"}</span>
            <div>
              <strong>Pemeriksaan pengajuan Penyedia</strong>
              <span>
                Data dan checklist Penyedia ditampilkan read-only. PIC Balai
                memberi catatan dan keputusan review.
              </span>
            </div>
          </div>

          <Panel
            title="Review Persiapan"
            icon={ClipboardCheck}
            extra={
              <Badge
                tone={
                  (server ? officialServerReady : prep.reportApproval === "Disetujui")
                    ? "good"
                    : (server ? serverSubmissionStatus === 'PERLU_REVISI' : prep.reportApproval === "Perlu Revisi")
                      ? "bad"
                      : "warn"
                }
              >
                {server ? (serverSubmissionStatus ?? 'Belum tersedia') : prep.reportApproval}
              </Badge>
            }
          >
            <div className="wf-kpis">
              <div className="wf-kpi">
                <div className="wf-kpi-label">Kelengkapan Penyedia</div>
                <div className="wf-kpi-value">
                  {server ? `${serverYesCount}/${server.checklist?.ringkasan.jumlah_item ?? '—'} Ya` : `${complete}/${allItems.length}`}
                </div>
              </div>
              <div className="wf-kpi">
                <div className="wf-kpi-label">Status</div>
                <div className="wf-kpi-value" style={{ fontSize: 13 }}>
                  {server ? (serverSubmissionStatus ?? 'Belum tersedia') : prep.reportApproval}
                </div>
              </div>
            </div>

            {canReviewPreparation?<Field label="Catatan PIC Balai" full>
              <textarea
                data-testid="input-prep-review-note"
                disabled={server ? serverSubmissionStatus !== 'DIAJUKAN' || server.saving : !canReviewPreparation}
                value={server ? server.reviewNote : draft.reviewerNote ?? prep.reviewerNote}
                onChange={(e) => server ? server.onReviewNote(e.target.value) : saveText("reviewerNote", e.target.value)}
                placeholder="Tuliskan catatan, klarifikasi, atau alasan perbaikan."
              />
            </Field>:<p className="stage-readonly-note">Catatan Balai: {(server ? server.submission?.review?.catatan : prep.reviewerNote)||"Belum ada catatan"}. Peran Anda memantau hasil; keputusan dilakukan PIC Balai.</p>}

            {(server ? server.submission?.review?.catatan : prep.reviewerNote) && (
              <div className="review-note">
                <small>CATATAN REVIEW</small>
                <p>{server ? server.submission?.review?.catatan : prep.reviewerNote}</p>
              </div>
            )}

            {canReviewPreparation&&<div className="wf-toolbar" style={{ marginTop: 12 }}>
              <Button
                id="button-prep-revise"
                kind="danger"
                disabled={server ? serverSubmissionStatus !== 'DIAJUKAN' || server.saving || !server.reviewNote.trim() : prep.reportApproval !== "Diajukan"}
                onClick={() => server ? server.onReview('PERLU_REVISI') : approve("Perlu Revisi")}
              >
                Minta Perbaikan
              </Button>

              <Button
                id="button-prep-approve"
                disabled={
                  server ? serverSubmissionStatus !== 'DIAJUKAN' || server.saving : complete !== allItems.length || prep.reportApproval !== "Diajukan"
                }
                onClick={() => server ? server.onReview('DISETUJUI') : approve("Disetujui")}
              >
                <Check size={13} />
                Setujui Persiapan
              </Button>
            </div>}
          </Panel>

          <DocumentAttachments scope={`${state.project.id}:stage0`} categories={['Laporan Pendahuluan','Program Mutu / Quality Management Plan','RMPK','RKK','RMLLP','Bukti Koordinasi']} legacyEvidenceIds={['stage0-laporan-pendahuluan','stage0-program-mutu','stage0-rmpk','stage0-rkk','stage0-koordinasi']} editable={server ? server.editable : canPrepareInput} server={server ? {packageId:String(server.checklist?.paket_id ?? state.project.id),checklist:server.checklist,documents:server.documents,loading:server.documentLoading,error:server.documentError,busy:server.documentBusy,editable:false,onUpload:server.onDocumentUpload,onReuse:server.onDocumentReuse,onChanged:server.onDocumentsChanged} : undefined}/>

          <div className="wf-grid equal">
            {renderChecklist(
              "Telaah data awal",
              BookOpen,
              PREPARATION_SOURCE_REVIEWS,
              prep.sourceReviews,
              () => {},
              true,
              triStateForSection('Telaah data awal'),
              (label, answer) => onServerAnswer('Telaah data awal', label, answer),
            )}

            {renderChecklist(
              "Rencana survei lapangan",
              MapPinned,
              PREPARATION_FIELD_PLAN,
              prep.fieldPlan,
              () => {},
              true,
              triStateForSection('Rencana lapangan'),
              (label, answer) => onServerAnswer('Rencana lapangan', label, answer),
            )}

            {renderChecklist(
              "Koordinasi & uji kesiapan",
              Activity,
              PREPARATION_COORDINATION,
              prep.coordination,
              () => {},
              true,
              triStateForSection('Koordinasi'),
              (label, answer) => onServerAnswer('Koordinasi', label, answer),
            )}

            {renderChecklist(
              "Dokumen pendahuluan",
              FileCheck2,
              PREPARATION_DOCUMENTS,
              prep.documents,
              () => {},
              true,
              triStateForSection('Dokumen persiapan'),
              (label, answer) => onServerAnswer('Dokumen persiapan', label, answer),
            )}
          </div>
        </div>
      )}
    </>
  );
}
