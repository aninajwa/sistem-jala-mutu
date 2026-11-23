import {Stage0StepForm} from '../Stage0StepForm';
import '../stage0Workspace.css';
import { canEditPreparationChecklist } from '../preparationChecklistLock';
import {BalaiDecisionHistory} from '../BalaiDecisionHistory';
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

import type { WorkflowStageProps } from "./stageSupport";
import { Badge, Button, Field, Panel, resetAuditLevels } from "./stageSupport";
import { useWorkflowStage } from "./useWorkflowStage";

import { preparationSubmissionEligibility } from '../preparationSubmissionPolicy';
export function Stage0PreparationWorkspace(props: WorkflowStageProps) {
  const { selection, state, onUpdate, setNotice, onNavigate } = props;
  const { commit, setPreparation, setCheck, heading, renderChecklist } =
    useWorkflowStage(props);
  const [draft,setDraft]=usePersistedDraft<Record<string,string>>(`jala-ui-draft:${state.project.id}:${state.role}:Stage0PreparationWorkspace`,{});
  const server = props.serverPreparation;
  if (props.serverReadOnly && !server) {
    return <section className="wf-panel" data-testid="dirah-stage0-server-readonly"><div className="wf-panel-head"><h2>Survei Pendahuluan & Persiapan QA/QC</h2></div><div className="wf-body"><p className="wf-note">{props.serverStatusNote || 'Belum terhubung ke server. Checklist dan tindakan persiapan dinyahaktifkan.'}</p></div></section>;
  }
  const saveText = (key: string, value: string) =>
    setDraft((old) => ({ ...old, [key]: value }));

  const prep = state.project.preparation;
  const canPrepareInput = state.role === "Penyedia Jasa / Ketua Tim";
  const canReviewPreparation = state.role === "PIC Balai / Pengguna Jasa";
  // Server mode maps server status/answers into the vocabulary the Dirah screen already renders.
  const serverChecklistStatus = server?.checklist?.pengisian.status;
  const serverSubmissionStatus = server?.submission?.status;
  const approval: ApprovalState = server ? serverApprovalState(serverSubmissionStatus) : prep.reportApproval;
  const reviewerNote = server ? (server.submission?.review?.catatan ?? '') : prep.reviewerNote;
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
  const sectionAnswers = (section: string, local: Record<string, boolean>): Record<string, boolean> => {
    const tri = triStateForSection(section);
    return tri ? Object.fromEntries(Object.entries(tri).map(([label, value]) => [label, value.answer === 'Ya'])) : local;
  };
  const sourceAnswers = sectionAnswers('Telaah data awal', prep.sourceReviews);
  const planAnswers = sectionAnswers('Rencana lapangan', prep.fieldPlan);
  const coordinationAnswers = sectionAnswers('Koordinasi', prep.coordination);
  const documentAnswers = sectionAnswers('Dokumen persiapan', prep.documents);
  const canEditChecklist = server ? server.editable && !server.saving : canEditPreparationChecklist(state.role, prep.reportApproval);
  const allItems = [
    ...PREPARATION_SOURCE_REVIEWS.map((x) => prep.sourceReviews[x]),
    ...PREPARATION_FIELD_PLAN.map((x) => prep.fieldPlan[x]),
    ...PREPARATION_COORDINATION.map((x) => prep.coordination[x]),
    ...PREPARATION_DOCUMENTS.map((x) => prep.documents[x]),
  ];
  const complete = server
    ? server.mappedItems.filter(item => server.answers[item.itemId]?.jawaban === 'Ya').length
    : allItems.filter(Boolean).length;
  const totalItems = server ? server.mappedItems.length : allItems.length;
  const approve = (status: ApprovalState) => {
    if (server) {
      if (status === 'Diajukan') server.onSubmit?.();
      else if (status === 'Perlu Revisi') server.onReview('PERLU_REVISI');
      else if (status === 'Disetujui') server.onReview('DISETUJUI');
      return;
    }
    if (status === "Diajukan" && state.role !== "Penyedia Jasa / Ketua Tim") {
      setNotice(
        "Peran Penyedia Jasa / Ketua Tim diperlukan untuk mengajukan laporan.", "error",
      );
      return;
    }
    if (status !== "Diajukan" && state.role !== "PIC Balai / Pengguna Jasa") {
      setNotice(
        "Peran PIC Balai / Pengguna Jasa diperlukan untuk meninjau laporan.", "error",
      );
      return;
    }
    if (status !== "Diajukan" && prep.reportApproval !== "Diajukan") {
      setNotice(
        "Ajukan laporan terlebih dahulu sebelum revisi atau persetujuan.", "error",
      );
      return;
    }
    if (status === "Diajukan") {
      const eligibility = preparationSubmissionEligibility(prep.reportApproval, complete, allItems.length);
      if (!eligibility.allowed) { setNotice(eligibility.reason, "error"); return; }
    }
    if (status === 'Perlu Revisi' && !(draft.reviewerNote ?? prep.reviewerNote).trim()) {
      setNotice('Alasan perbaikan persiapan wajib diisi.', 'error'); return;
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
        "",
      )}
      <div className="stage0-compact-status" role="status">
        <span><strong>Status</strong> {approval}</span>
        <span><strong>Persiapan</strong> {complete}/{totalItems}</span>

      </div>
      {server && <details className="ui09-server-diagnostics">
        <summary>Rincian status persiapan</summary>
        <div role={server.error ? 'alert' : 'status'}>
          {server.error || (server.loading ? 'Memuat status persiapan…' : `Checklist: ${serverChecklistStatus ?? 'belum tersedia'} · pengajuan: ${serverSubmissionStatus ?? 'belum tersedia'} · versi ${server.checklist?.pengisian.versi ?? '—'}.`)}
          {server.message && <span> {server.message}</span>}
          {server.error && <button type="button" className="wf-button" onClick={server.onReload}>Coba muat ulang</button>}
          {server.mappingGaps.length > 0 && <span> Item belum dipetakan: {server.mappingGaps.join(' ')}</span>}
        </div>
      </details>}
      <div id="stage0-role-work" />
      {state.role === "Penyedia Jasa / Ketua Tim" ? (
        <div className="workflow-role-block provider">




          {!canEditChecklist && <div className="stage0-status-message" role="status">{approval === 'Diajukan' ? 'Menunggu pemeriksaan Balai.' : 'Persiapan telah disetujui.'}</div>}
          <Stage0StepForm locked={!canEditChecklist} status={approval} steps={[
              {id:'source',title:'Telaah data awal',complete:PREPARATION_SOURCE_REVIEWS.filter(item=>!!sourceAnswers[item]).length,total:PREPARATION_SOURCE_REVIEWS.length,content:renderChecklist(
              "Telaah data awal",
              BookOpen,
              PREPARATION_SOURCE_REVIEWS,
              sourceAnswers,
              (k, v) => setCheck("sourceReviews", k, v),
              !canEditChecklist,
              triStateForSection('Telaah data awal'),
              (label, answer) => onServerAnswer('Telaah data awal', label, answer),
            )},
              {id:'plan',title:'Rencana survei lapangan',complete:PREPARATION_FIELD_PLAN.filter(item=>!!planAnswers[item]).length,total:PREPARATION_FIELD_PLAN.length,content:renderChecklist(
              "Rencana survei lapangan",
              MapPinned,
              PREPARATION_FIELD_PLAN,
              planAnswers,
              (k, v) => setCheck("fieldPlan", k, v),
              !canEditChecklist,
              triStateForSection('Rencana lapangan'),
              (label, answer) => onServerAnswer('Rencana lapangan', label, answer),
            )},
              {id:'coordination',title:'Koordinasi & uji kesiapan',complete:PREPARATION_COORDINATION.filter(item=>!!coordinationAnswers[item]).length,total:PREPARATION_COORDINATION.length,content:renderChecklist(
              "Koordinasi & uji kesiapan",
              Activity,
              PREPARATION_COORDINATION,
              coordinationAnswers,
              (k, v) => setCheck("coordination", k, v),
              !canEditChecklist,
              triStateForSection('Koordinasi'),
              (label, answer) => onServerAnswer('Koordinasi', label, answer),
            )},
              {id:'documents',title:'Dokumen pendahuluan',complete:PREPARATION_DOCUMENTS.filter(item=>!!documentAnswers[item]).length,total:PREPARATION_DOCUMENTS.length,content:renderChecklist(
              "Dokumen pendahuluan",
              FileCheck2,
              PREPARATION_DOCUMENTS,
              documentAnswers,
              (k, v) => setCheck("documents", k, v),
              !canEditChecklist,
              triStateForSection('Dokumen persiapan'),
              (label, answer) => onServerAnswer('Dokumen persiapan', label, answer),
            )}
            ]} />
          {server && <div className="wf-toolbar" style={{ marginTop: 12 }}>
            <Button id="button-prep-save-server" kind="primary" disabled={!server.editable || server.saving || !server.mappedItems.length} onClick={server.onSave}>
              {server.saving ? 'Menyimpan…' : 'Simpan checklist'}
            </Button>
          </div>}

          <section id="stage0-attachments" className="stage0-section-anchor"><h3>Dokumen pendukung</h3>

          <DocumentAttachments scope={`${state.project.id}:stage0`} categories={['Laporan Pendahuluan','Program Mutu / Quality Management Plan','RMPK','RKK','RMLLP','Bukti Koordinasi']} legacyEvidenceIds={['stage0-laporan-pendahuluan','stage0-program-mutu','stage0-rmpk','stage0-rkk','stage0-rmllp','stage0-koordinasi']} editable={canEditChecklist} server={server ? {packageId:String(server.checklist?.paket_id ?? state.project.id),checklist:server.checklist,documents:server.documents,loading:server.documentLoading,error:server.documentError,busy:server.documentBusy,editable:server.editable,onUpload:server.onDocumentUpload,onReuse:server.onDocumentReuse,onChanged:server.onDocumentsChanged} : undefined}/>

          </section>
          <div id="stage0-decision" className="stage0-section-anchor" />
          <Panel title="Pengajuan ke PIC Balai" icon={ArrowRight}>
            <div className="workflow-action-copy">
              <strong>{complete === totalItems ? 'Checklist lengkap' : `${totalItems - complete} butir belum lengkap`}</strong>
            </div>

            {reviewerNote && (
              <div className="review-note important">
                <small>CATATAN PIC BALAI</small>
                <strong>Hasil review: {approval}</strong>
                <p>{reviewerNote}</p>
              </div>
            )}

            <div className="wf-toolbar" style={{ marginTop: 12 }}>
              <Button
                id="button-prep-submit"
                kind="primary"
                disabled={server ? !server.canSubmit || server.saving : !preparationSubmissionEligibility(approval, complete, totalItems).allowed}
                onClick={() => approve("Diajukan")}
              >
                <ArrowRight size={13} />
                {approval === "Disetujui"
                   ? "Sudah Disetujui Balai"
                   : approval === "Diajukan"
                     ? "Menunggu Review"
                     : "Ajukan untuk Review"}
              </Button>
            </div>
          </Panel>
        </div>
      ) : (
        <div className="workflow-role-block reviewer" data-stage0-view={canReviewPreparation ? 'balai' : state.role === 'Direktorat / Pusat' ? 'direktorat' : 'admin'}>
          <div id="stage0-decision" className="stage0-section-anchor" />
          {canReviewPreparation ? (
            <Panel title="Pemeriksaan persiapan" icon={ClipboardCheck}>
              {approval !== 'Diajukan' ? (
                <div className="stage0-status-message" role="status">
                  {approval === 'Draft' ? 'Belum ada pengajuan Penyedia.' : `Status terakhir: ${approval}.`}
                </div>
              ) : (
                <div className="stage0-review-summary">
                  <strong>Pengajuan siap diperiksa</strong>
                  <span>{complete}/{totalItems} butir persiapan tercatat</span>
                </div>
              )}
              {approval === 'Diajukan' && (
                <Field label="Hasil pemeriksaan" full>
                  <textarea
                    data-testid="input-prep-review-note"
                    value={server ? server.reviewNote : draft.reviewerNote ?? reviewerNote}
                    disabled={!!server?.saving}
                    onChange={(e) => server ? server.onReviewNote(e.target.value) : saveText('reviewerNote', e.target.value)}
                    placeholder="Catatan keputusan atau alasan perbaikan"
                  />
                </Field>
              )}
              {approval !== 'Diajukan' && reviewerNote && (
                <div className="review-note"><strong>Hasil terakhir</strong><p>{reviewerNote}</p></div>
              )}
              <div className="wf-toolbar stage0-review-actions">
                {!server && approval === 'Diajukan' && (
                  <Button id="button-prep-save-note" onClick={() => setPreparation(p => ({...p, reviewerNote: draft.reviewerNote ?? p.reviewerNote}), 'Simpan catatan persiapan', state.project.id, 'Catatan tersimpan tanpa mengubah keputusan.')}>Simpan Catatan</Button>
                )}
                <Button id="button-prep-revise" kind="danger" disabled={approval !== 'Diajukan' || (!!server && (server.saving || !server.reviewNote.trim()))} onClick={() => approve('Perlu Revisi')}>Minta Perbaikan</Button>
                <Button id="button-prep-approve" disabled={server ? approval !== 'Diajukan' || server.saving : complete !== totalItems || approval !== 'Diajukan'} onClick={() => approve('Disetujui')}><Check size={13} /> Setujui Persiapan</Button>
              </div>
            </Panel>
          ) : state.role === 'Direktorat / Pusat' ? (
            <section className="stage0-monitor" aria-label="Pemantauan persiapan">
              <h3>Hasil persiapan</h3>
              <dl>
                <div><dt>Paket</dt><dd>{state.project.packageName}</dd></div>
                <div><dt>Hasil Balai</dt><dd>{approval}</dd></div>
                <div><dt>Checklist tercatat</dt><dd>{complete}/{totalItems}</dd></div>
              </dl>
              {reviewerNote && <p className="stage0-review-result"><strong>Catatan Balai</strong> {reviewerNote}</p>}
            </section>
          ) : (
            <section className="stage0-monitor" aria-label="Administrasi persiapan">
              <h3>Administrasi paket</h3>
              <dl>
                <div><dt>Paket</dt><dd>{state.project.packageName}</dd></div>
                <div><dt>Balai</dt><dd>{state.project.balai || 'Belum tercatat'}</dd></div>
                <div><dt>SPMK</dt><dd>{state.project.spmkDate || 'Belum tercatat'}</dd></div>
                <div><dt>Status persiapan</dt><dd>{approval}</dd></div>
              </dl>
            </section>
          )}
          {canReviewPreparation || state.role === 'Direktorat / Pusat' ? (
            <section id="stage0-attachments" className="stage0-section-anchor">
              <h3>Bukti persiapan</h3>
              <DocumentAttachments scope={`${state.project.id}:stage0`} categories={['Laporan Pendahuluan','Program Mutu / Quality Management Plan','RMPK','RKK','RMLLP','Bukti Koordinasi']} legacyEvidenceIds={['stage0-laporan-pendahuluan','stage0-program-mutu','stage0-rmpk','stage0-rkk','stage0-rmllp','stage0-koordinasi']} editable={false} server={server ? {packageId:String(server.checklist?.paket_id ?? state.project.id),checklist:server.checklist,documents:server.documents,loading:server.documentLoading,error:server.documentError,busy:server.documentBusy,editable:false,onUpload:server.onDocumentUpload,onReuse:server.onDocumentReuse,onChanged:server.onDocumentsChanged} : undefined}/>
            </section>
          ) : null}
          <details className="stage0-readonly-checklists">
            <summary>Rincian persiapan ({complete}/{totalItems})</summary>
            <div className="stage0-review-groups" aria-label="Rincian isian Penyedia">
              {([
                ['Telaah data awal', PREPARATION_SOURCE_REVIEWS, sourceAnswers],
                ['Rencana survei lapangan', PREPARATION_FIELD_PLAN, planAnswers],
                ['Koordinasi dan uji kesiapan', PREPARATION_COORDINATION, coordinationAnswers],
                ['Dokumen pendahuluan', PREPARATION_DOCUMENTS, documentAnswers],
              ] as const).map(([title, items, answers]) => (
                <section key={title} className="stage0-review-group">
                  <details className="stage0-review-group-detail">
                    <summary><span>{title}</span><span className="stage0-group-count">{items.filter((item) => answers[item]).length}/{items.length} terisi</span></summary>
                    <ul className="v2-checklist-results stage0-compact-results">
                      {items.map((item) => <li key={item}><span>{item}</span><strong className={answers[item] ? 'is-complete' : 'is-pending'}>{answers[item] ? 'Terisi' : 'Belum'}</strong></li>)}
                    </ul>
                  </details>
                </section>
              ))}
            </div>
          </details>
        </div>
      )}
      <BalaiDecisionHistory state={state} stage="Tahap 0"/>
    </>
  );
}

/** Maps the server preparation submission status into the Dirah approval vocabulary. */
function serverApprovalState(status: string | undefined): ApprovalState {
  if (status === 'DIAJUKAN') return 'Diajukan';
  if (status === 'PERLU_REVISI') return 'Perlu Revisi';
  if (status === 'DISETUJUI') return 'Disetujui';
  return 'Draft';
}
