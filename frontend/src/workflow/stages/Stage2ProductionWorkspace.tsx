import { canOpenProductionCorrection, productionFailureKey, recordProductionFailure } from '../productionFailures';
import {BalaiDecisionHistory} from '../BalaiDecisionHistory';
import { readLocal, writeLocal } from '../repository/localPersistence';
import { Stage2RoleOverview } from '../Stage2RoleOverview';
import {effectiveProductionApproval, evaluateStageGate} from '../workflowGate';
import {productionReviewBlockers} from '../reviewReadiness';
import {dataOrigin} from '../dataOrigin';
import {DocumentAttachments} from '../DocumentAttachments';
import {RoleWorkSection} from '../RoleWorkSection';
import {switchPciMethod} from '../pciMethods';
import {usePersistedDraft} from '../../hooks/usePersistedDraft';
import {
  Archive,
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import { useState,useEffect } from "react";
import { useCorrectionSelection } from "./useCorrectionSelection";

import { EvidenceAttachment } from "../EvidenceAttachment";
import {
  daysBetween,
  evaluateProductionTest,
  ProductionTest,
  SurveyType,
} from "../model";
import { ProductionCalculator } from "../ProductionCalculator";
import { ProductionValidationChecklist } from "../ProductionValidationChecklist";
import {
  EvidenceField,
  GateSummary,
  ValidationResultTable,
} from "../WorkflowComponents";
import { VALIDATION_SOURCE_OPTIONS } from "../workflowConfig";

import type { WorkflowStageProps } from "./stageSupport";
import {
  Badge,
  Button,
  defaultCase,
  Field,
  invalidateDependentStages,
  labels,
  Panel,
  testId,
} from "./stageSupport";
import { useWorkflowStage } from "./useWorkflowStage";

type Stage2DirectorateNote = {
  id: string;
  surveyType: string;
  text: string;
  recordedAt: string;
  author: "Direktorat / Pusat";
  authorId?: string;
  editedAt?: string;
  withdrawnAt?: string;
  withdrawnReason?: string;
  history?: Array<{ action: "edit" | "withdraw"; at: string; priorText: string; reason?: string }>;
};

/** Catatan koordinasi Tahap 2: tidak menggantikan pemeriksaan/keputusan Balai. */
function Stage2DirectorateNotes({ packageId, surveyType, role, principalId }: {
  packageId: string;
  surveyType: SurveyType;
  role: WorkflowStageProps["state"]["role"];
  principalId?: string;
}) {
  const storageKey = `jala-stage2-directorate-notes-v1:${encodeURIComponent(packageId)}`;
  const [notes, setNotes] = useState<Stage2DirectorateNote[]>([]);
  const [draftNote, setDraftNote] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const canWrite = role === "Direktorat / Pusat";

  useEffect(() => {
    const refresh = () => {
      const saved = readLocal<Stage2DirectorateNote[]>(storageKey, []);
      setNotes(Array.isArray(saved) ? saved.filter((entry) =>
        entry && typeof entry.id === "string" && typeof entry.text === "string" && typeof entry.surveyType === "string"
      ) : []);
    };
    refresh();
    const changed = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) refresh();
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, [storageKey]);

  const applicable = notes.filter((note) => note.surveyType === surveyType || note.surveyType === "Semua survei");
  const add = () => {
    const text = draftNote.trim();
    if (!canWrite || text.length < 3 || text.length > 2000) {
      setError("Tulis catatan minimal 3 karakter dan maksimal 2.000 karakter.");
      return;
    }
    const entry: Stage2DirectorateNote = {
      id: crypto.randomUUID(),
      surveyType,
      text,
      recordedAt: new Date().toISOString(),
      author: "Direktorat / Pusat",
      ...(principalId ? {authorId: principalId} : {}),
    };
    try {
      const previous = readLocal<Stage2DirectorateNote[]>(storageKey, []);
      const next = [...(Array.isArray(previous) ? previous : []), entry];
      writeLocal(storageKey, next);
      setNotes(next);
      setDraftNote("");
      setError("");
      setOpen(false);
    } catch {
      setError("Catatan belum tersimpan. Silakan coba lagi.");
    }
  };

  const canManage = (note: Stage2DirectorateNote) => !!principalId && canWrite &&
    note.authorId === principalId && !note.withdrawnAt;
  function saveRevision(note: Stage2DirectorateNote, withdrawn = false) {
    if (!canManage(note)) return;
    const value = editingText.trim();
    if (!withdrawn && (value.length < 3 || value.length > 2000)) {
      setError("Isi catatan 3–2.000 karakter."); return;
    }
    const reason = withdrawn ? window.prompt("Alasan menarik catatan:") : null;
    if (withdrawn && (reason === null || !reason.trim() || !window.confirm("Tarik catatan? Riwayat tetap tersimpan."))) return;
    try {
      const current = readLocal<Stage2DirectorateNote[]>(storageKey, []);
      const now = new Date().toISOString();
      const next = current.map(entry => entry.id === note.id && entry.authorId === principalId && !entry.withdrawnAt
        ? withdrawn
          ? { ...entry, withdrawnAt: now, withdrawnReason: reason!.trim(), history: [...(entry.history ?? []), { action: "withdraw" as const, at: now, priorText: entry.text, reason: reason!.trim() }] }
          : { ...entry, text: value, editedAt: now, history: [...(entry.history ?? []), { action: "edit" as const, at: now, priorText: entry.text }] }
        : entry);
      writeLocal(storageKey, next);
      setNotes(next);
      setEditingId(null);
      setError("");
    } catch { setError("Perubahan catatan belum tersimpan."); }
  }

  return <section className="wf-panel stage2-directorate-notes" aria-label="Catatan tambahan Direktorat">
    <div className="wf-panel-head"><h3>Catatan Direktorat · {surveyType}</h3><span>{applicable.length ? `${applicable.length} catatan` : "Belum ada catatan"}</span></div>
    <div className="wf-panel-body" style={{display: "grid", gap: 12}}>
      {applicable.length > 0 ? <ul style={{paddingLeft: 18, margin: 0, display: "grid", gap: 12}}>
        {applicable.map((note) => <li key={note.id}>
          <strong>{note.surveyType}</strong> · <time dateTime={note.recordedAt}>{new Date(note.recordedAt).toLocaleString("id-ID")}</time>
          {note.withdrawnAt ? <p>Catatan ditarik oleh penulis.</p> : editingId === note.id ? <div>
            <label>Ubah catatan<textarea rows={3} maxLength={2000} value={editingText} onChange={event => setEditingText(event.target.value)} /></label>
            <button type="button" className="wf-button primary" onClick={() => saveRevision(note)}>Simpan perubahan</button>
            <button type="button" className="wf-button" onClick={() => setEditingId(null)}>Batal</button>
          </div> : <p style={{whiteSpace: "pre-wrap", overflowWrap: "anywhere", margin: "6px 0 0"}}>{note.text}{note.editedAt ? " · Diedit" : ""}</p>}
          {canManage(note) && editingId !== note.id && <div className="wf-toolbar">
            <button type="button" className="wf-button" onClick={() => {setEditingId(note.id); setEditingText(note.text);}}>Edit</button>
            <button type="button" className="wf-button" onClick={() => saveRevision(note, true)}>Tarik catatan</button>
          </div>}
          {note.authorId === principalId && !!note.history?.length && <details><summary>Riwayat perubahan ({note.history.length})</summary>
            {note.history.map((item, i) => <p key={i}>{item.action === "edit" ? "Sebelum diedit" : "Penarikan"}: {item.priorText}</p>)}
          </details>}
        </li>)}
      </ul> : null}
      {canWrite && <div>
        {!open ? <button type="button" className="wf-button" onClick={() => setOpen(true)}>Tambah catatan</button> : <div style={{display: "grid", gap: 8}}>
          <label htmlFor="stage2-directorate-note-text">Catatan untuk {surveyType}</label>
          <textarea id="stage2-directorate-note-text" rows={3} maxLength={2000} value={draftNote}
            onChange={(event) => {setDraftNote(event.target.value); setError("");}}
            placeholder="Tuliskan catatan terkait hasil validasi produksi" />
          {error && <p role="alert" style={{margin: 0}}>{error}</p>}
          <div className="wf-toolbar">
            <button type="button" className="wf-button primary" disabled={draftNote.trim().length < 3} onClick={add}>Simpan catatan</button>
            <button type="button" className="wf-button" onClick={() => {setOpen(false);setError("");}}>Batal</button>
          </div>
        </div>}
      </div>}
    </div>
  </section>;
}

export function Stage2ProductionWorkspace(props: WorkflowStageProps) {
  const { selection, state, onUpdate, setNotice, onNavigate } = props;
  const { baAccess, commit, heading } = useWorkflowStage(props);
  const [draft,setDraft]=usePersistedDraft<Record<string,string>>(`jala-ui-draft:${state.project.id}:${state.role}:Stage2ProductionWorkspace`,{});
  const [prodType, setProdType] = useState<SurveyType>(state.project.surveyTypes[0]??"IRI");
  const [caseId, setCaseId] = useCorrectionSelection(state.project.id);
  const [decisionError, setDecisionError] = useState('');
  const [showFailedTrial, setShowFailedTrial] = useState(false);
  const test = state.productionTests[prodType];
  const evaluation = evaluateProductionTest(prodType, test);
  const failureKey = productionFailureKey(state, prodType);
  const failures = state.productionFailures?.[failureKey] ?? [];
  const failureEvidence = draft[`failure-evidence:${failureKey}`] ?? '';
  const methodReview = draft[`failure-method:${failureKey}`] ?? '';
  const saveText = (key: string, value: string) =>
    setDraft((old) => ({ ...old, [key]: value }));

  const canEnterProduction = state.role === "Penyedia Jasa / Ketua Tim";
  const canReviewProduction = state.role === "PIC Balai / Pengguna Jasa";
  const hasOfficialSubmission = ['Diajukan', 'Perlu Revisi', 'Disetujui', 'Ditolak'].includes(state.productionApproval);

  useEffect(()=>{if(!state.project.surveyTypes.includes(prodType)&&state.project.surveyTypes[0])setProdType(state.project.surveyTypes[0]);},[state.project.id,state.project.surveyTypes,prodType]);
  const origin=dataOrigin(test.sourceMode);
  const sourceIsSynced=origin.readOnly;
  const sourceIsImport=['Lampiran / bukti kegiatan','Import/evidence'].includes(test.sourceMode??'');
  const sourceIsManual=!sourceIsImport&&!sourceIsSynced;
  const sourceModeLabel=origin.label;
  const updateField = <K extends keyof ProductionTest>(
    key: K,
    value: ProductionTest[K],
  ) => {
    if (state.role !== "Penyedia Jasa / Ketua Tim") {
      setNotice("Penyedia Jasa mengisi uji produksi.");
      return;
    }

    if (prodType === "PCI" && key === "pciManual") {
      commit("Pilih metode PCI", value ? "PCI Manual" : "PCI AI", current => switchPciMethod(current, value !== false));
      return;
    }
    commit(
      `Ubah uji produksi ${prodType}`,
      `${prodType} · ${String(labels[key] ?? key)}`,
      (s) => ({
        ...invalidateDependentStages(
          s,
          `Hasil uji ${prodType} berubah; validasi dan audit harus diulang.`,
        ),

        productionTestDates: {
          ...s.productionTestDates,
          [prodType]: s.simulationDate,
        },

        productionTests: {
          ...s.productionTests,

          [prodType]: {
            ...s.productionTests[prodType],

            [key]: value,
          },
        },
      }),
    );
  };
  const boolFields: Array<
    | "deflectionBowlOrdered"
    | "bridgePersonnelPassed"
    | "ratersAgree"
    | "stationingConsistent"
    | "pciManual"
    | "pciBenchmarkBalanced"
    | "bridgeTrialReportComplete"
  > =
    prodType === "PCI"
      ? test.pciManual
        ? ["pciManual", "ratersAgree", "stationingConsistent"]
        : ["pciManual", "pciBenchmarkBalanced"]
      : prodType === "Jembatan"
        ? [
            "bridgePersonnelPassed",
            "bridgeTrialReportComplete",
            "ratersAgree",
            "stationingConsistent",
          ]
        : prodType === "Lendutan"
          ? test.deflectionMethod === "LWD"
            ? []
            : ["deflectionBowlOrdered"]
          : prodType === "Lalu Lintas" || prodType === "IRI"
            ? []
            : prodType === "RNI"
              ? ["stationingConsistent"]
              : ["ratersAgree", "stationingConsistent"];
  const scopedTypes = state.project.surveyTypes;
  const allSelectedPassed =
    scopedTypes.length > 0 &&
    scopedTypes.every(
      (type) =>
        evaluateProductionTest(type, state.productionTests[type]).passed,
    );
  const calibrationReady=evaluateStageGate(state,'Tahap 1').readyToComplete;
  const activeProductionCases = state.corrections.filter(item =>
    item.status !== 'Ditutup' && scopedTypes.includes(item.surveyType) &&
    (item.source === 'Uji coba gagal' || item.blockedStage === 'Validasi produksi')
  );
  const reviewBlockers=productionReviewBlockers(state);
  const reviewReady=reviewBlockers.length===0;
  // Keputusan lama tetap dalam riwayat, tetapi tidak dipresentasikan sebagai izin yang masih berlaku.
  const approvalNeedsReview = state.productionApproval === 'Disetujui' && !effectiveProductionApproval(state);
  const approvalDisplay = approvalNeedsReview ? 'Perlu pemeriksaan ulang' : state.productionApproval;

  const submitForReview = () => {
    if (state.role !== "Penyedia Jasa / Ketua Tim") {
      setNotice(
        "Peran Penyedia Jasa / Ketua Tim diperlukan untuk mengajukan hasil validasi produksi.",
      );
      return;
    }

    if (!reviewReady) {
      setNotice(
        "Pengajuan tertahan sampai persiapan, kalibrasi/personel, dan seluruh uji produksi dalam lingkup memenuhi pemeriksaan.",
      );
      return;
    }

    commit(
      "Ajukan hasil validasi produksi",
      state.project.packageName,
      (s) => ({
        ...s,

        productionApproval: "Diajukan",

        productionSubmissionNote:
          draft.providerSubmissionNote ?? s.productionSubmissionNote ?? "",

        productionApprovalNote: "",
      }),
      "Hasil validasi produksi diajukan ke PIC Balai",
    );

    setDraft((current) => ({
      ...current,
      providerSubmissionNote: "",
    }));
  };
  const decideReview = (decision: "Perlu Revisi" | "Disetujui") => {
    if (state.role !== "PIC Balai / Pengguna Jasa") {
      setNotice(
        "Peran PIC Balai / Pengguna Jasa diperlukan untuk meninjau metode.",
      );
      return;
    }
    if (
      state.productionApproval !== "Diajukan"
    ) {
      setNotice(
        "Ajukan metode terlebih dahulu sebelum keputusan Pengguna Jasa.",
      );
      return;
    }
    if (decision === "Disetujui" && !reviewReady) {
      setNotice(
        "Persetujuan tertahan sampai seluruh gerbang persiapan, kalibrasi dan uji produksi lulus.",
      );
      return;
    }
    if (decision === 'Perlu Revisi' && !(draft.reviewerProductionNote ?? state.productionApprovalNote).trim()) {
      setDecisionError('Tuliskan alasan perbaikan sebelum mengembalikan pengajuan.'); return;
    }
    const ba =
      decision === "Disetujui"
        ? draft.methodBa || state.productionApprovalBa || ""
        : state.productionApprovalBa;
    if (decision==='Disetujui'&&!ba.trim()) {setDecisionError('Isi nomor atau referensi BA sebelum menyetujui alat dan metode.');return;}
    setDecisionError('');
    commit(
      `Keputusan metode: ${decision}`,
      state.project.packageName,
      (s) => ({
        ...s,
        productionApproval: decision,
        productionApprovalBa: ba,
        productionApprovalNote:
          draft.reviewerProductionNote ?? s.productionApprovalNote,
        bridgeInspectionPermit:
          decision === "Disetujui" && scopedTypes.includes("Jembatan")
            ? true
            : s.bridgeInspectionPermit,
      }),
      decision === "Disetujui"
        ? "Referensi BA persetujuan metode dicatat pada simulasi"
        : "Metode dikembalikan untuk revisi",
    );
  };
  const roleAction = <>
          <div id="stage2-role-action" />
           {state.role === "Penyedia Jasa / Ketua Tim" ? (
            <Panel
              title="Ajukan hasil uji"
              icon={FileCheck2}
              extra={
                <Badge
                  tone={
                    approvalNeedsReview ? "warn" : state.productionApproval === "Disetujui"
                      ? "good"
                      : state.productionApproval === "Perlu Revisi"
                        ? "bad"
                        : "warn"
                  }
                >
                  {approvalDisplay}
                </Badge>
              }
            >
              <Field label="Catatan / keterangan Penyedia" full>
                <textarea
                  data-testid="input-production-submission-note"
                  value={
                    draft.providerSubmissionNote ??
                    state.productionSubmissionNote ??
                    ""
                  }
                  onChange={(event) =>
                    saveText("providerSubmissionNote", event.target.value)
                  }
                />
              </Field>

              <div className="wf-toolbar" style={{ marginTop: 10 }}>
                <Button
                  id="button-production-submit-review"
                  kind="primary"
                  disabled={
                    !reviewReady || state.productionApproval === "Diajukan"
                  }
                  onClick={submitForReview}
                >
                  <ArrowRight size={13} />
                  {state.productionApproval === "Diajukan"
                    ? "Menunggu pemeriksaan Balai"
                    : "Ajukan hasil uji"}
                </Button>
              </div>
            </Panel>
          ) : state.role === "PIC Balai / Pengguna Jasa" && state.productionApproval !== 'Diajukan' ? (
            <Panel title="Pemeriksaan Balai" icon={FileCheck2} extra={<Badge tone="warn">Menunggu pengajuan</Badge>}>
              <p className="stage2-evaluation-caption" role="status" style={{margin:0}}>
                {approvalNeedsReview ? 'Hasil berubah. Menunggu pengajuan ulang Penyedia.'
                  : state.productionApproval === 'Perlu Revisi' ? 'Menunggu perbaikan dan pengajuan ulang Penyedia.'
                  : state.productionApproval === 'Disetujui' ? 'Keputusan sebelumnya tercatat. Lihat riwayat dan dokumen.'
                  : 'Penyedia belum mengajukan hasil uji. Pemeriksaan dapat dimulai setelah pengajuan diterima.'}
              </p>
            </Panel>
          ) : state.role === "PIC Balai / Pengguna Jasa" ? (
            <Panel
              title="Pemeriksaan Balai"
              icon={FileCheck2}
              extra={
                <Badge
                  tone={
                    approvalNeedsReview ? "warn" : state.productionApproval === "Disetujui"
                      ? "good"
                      : state.productionApproval === "Perlu Revisi"
                        ? "bad"
                        : "warn"
                  }
                >
                  {approvalDisplay}
                </Badge>
              }
            >
              <p className="stage2-evaluation-caption" style={{margin:'0 0 12px'}}>
                Periksa data, bukti, dan kalibrasi seluruh survei sebelum memutuskan pengajuan paket.
              </p>
              <div className="wf-fields">
                <Field label="Referensi BA">
                  <input
                    data-testid="input-production-approval-ba"
                    value={draft.methodBa ?? state.productionApprovalBa}
                    onChange={(e) => { setDecisionError(''); saveText("methodBa", e.target.value); }}
                    placeholder="Nomor atau referensi BA"
                  />
                </Field>

                <Field label="Catatan PIC Balai">
                  <textarea
                    data-testid="input-production-review-note"
                    value={
                      draft.reviewerProductionNote ??
                      state.productionApprovalNote ??
                      ""
                    }
                    onChange={(event) => { setDecisionError(''); saveText("reviewerProductionNote", event.target.value); }}
                    placeholder="Tuliskan alasan keputusan atau perbaikan yang diperlukan."
                  />
                </Field>
              </div>

              <div className="stage2-note-actions">
              <button type="button" className="wf-button" data-testid="button-production-save-note" onClick={()=>commit('Simpan catatan produksi',state.project.id,s=>({...s,productionApprovalNote:draft.reviewerProductionNote??s.productionApprovalNote}),'Catatan tersimpan tanpa mengubah keputusan.')}>Simpan catatan</button>
              </div>
              {decisionError && <p role="alert" className="stage2-decision-error" style={{color:'#a83a2a',fontWeight:600,fontSize:13}}>{decisionError}</p>}
              <div className="wf-toolbar" style={{ marginTop: 10 }}>
                <Button
                  id="button-production-request-revision"
                  kind="danger"
                  disabled={
                    state.productionApproval !== "Diajukan"
                  }
                  onClick={() => decideReview("Perlu Revisi")}
                >
                  Minta Perbaikan
                </Button>

                <Button
                  id="button-production-approve-method"
                  disabled={
                    !reviewReady || state.productionApproval !== 'Diajukan'
                  }
                  onClick={() => decideReview("Disetujui")}
                >
                  <Check size={13} />
                  Setujui alat dan metode
                </Button>
              </div>

              {state.productionApprovalBa && (
                <div className="wf-callout" style={{ marginTop: 9 }}>
                  Referensi BA: <strong>{state.productionApprovalBa}</strong>
                </div>
              )}
            </Panel>
          ) : (
            <Panel title="Hasil pemeriksaan Balai" icon={ShieldCheck}>
              <div className="wf-row">
                <span>Status keputusan</span>
                <Badge tone={state.productionApproval === 'Disetujui' && !approvalNeedsReview ? 'good' : 'warn'}>
                  {!hasOfficialSubmission ? 'Belum ada keputusan' : approvalNeedsReview ? 'Perlu pemeriksaan ulang' : state.productionApproval === 'Diajukan' ? 'Menunggu keputusan Balai' : approvalDisplay}
                </Badge>
              </div>
              {state.productionApprovalNote?.trim() && (
                <div className="stage2-decision-note"><strong>Catatan Balai</strong><p>{state.productionApprovalNote}</p></div>
              )}
              {state.productionApprovalBa && (
                <div className="wf-row"><span>Referensi BA</span><strong>{state.productionApprovalBa}</strong></div>
              )}
            </Panel>
          )}

  </>;
  return (
    <div className="stage2-clean">
      {heading(
        "Tahap 2 · validasi produksi",
        "Validasi Produksi Data / Uji Coba",
        "Hasil uji coba, pemeriksaan, dan persetujuan penggunaan alat serta metode.",
      )}
      <Stage2RoleOverview role={state.role} approval={state.productionApproval} blockerCount={reviewBlockers.length} selectedCount={scopedTypes.length}/>
      <nav className="stage2-survey-picker" aria-label="Jenis survei untuk validasi produksi">
        <div className="stage2-survey-picker__heading">
          <strong>Jenis survei</strong>
          <span>{scopedTypes.filter(type => evaluateProductionTest(type, state.productionTests[type]).passed).length} dari {scopedTypes.length} memenuhi persyaratan uji</span>
        </div>
        <div className="stage2-survey-picker__items">
          {scopedTypes.map(type => (
            <button
              key={type}
              type="button"
              data-testid={`button-production-type-${testId(type)}`}
              className={`stage2-survey-picker__button ${prodType === type ? 'is-active' : ''}`}
              aria-current={prodType === type ? 'true' : undefined}
              onClick={() => setProdType(type)}
            >
              <span>{type}</span>
              <span className={`stage2-survey-picker__indicator ${evaluateProductionTest(type, state.productionTests[type]).passed ? 'is-complete' : ''}`} aria-hidden="true" />
            </button>
          ))}
        </div>
      </nav>
      <div className="stage2-selection-status" role="status">
        <div><span className="stage2-selection-status__label">SURVEI TERPILIH</span><strong>{prodType}</strong></div>
        <div className="stage2-selection-status__progress"><span>{evaluation.checks.filter(check => check.pass).length} dari {evaluation.checks.length} persyaratan sesuai</span><div className="stage2-mini-track"><div style={{width:`${evaluation.checks.length ? 100 * evaluation.checks.filter(check => check.pass).length/evaluation.checks.length : 0}%`}}/></div></div>
        <Badge tone={evaluation.passed ? 'good' : 'warn'}>{!canEnterProduction && !hasOfficialSubmission ? 'Draf Penyedia' : evaluation.passed ? 'Memenuhi' : canEnterProduction ? 'Perlu dilengkapi' : 'Perlu pemeriksaan'}</Badge>
      </div>
      {approvalNeedsReview && canEnterProduction && <div className="wf-callout warn" role="status"><strong>Perlu pengajuan ulang</strong><p>Data berubah setelah persetujuan. Ajukan ulang untuk diperiksa Balai.</p></div>}
      {canEnterProduction && (reviewBlockers.length > 0 || activeProductionCases.length > 0) && (
        <details className="wf-callout warn stage2-blockers">
          <summary>{`${reviewBlockers.length} persyaratan perlu ditindaklanjuti${activeProductionCases.length ? ` · ${activeProductionCases.length} tindakan perbaikan aktif` : ''}`}</summary>
          {reviewBlockers.length > 0 && <ul>{reviewBlockers.map(reason=><li key={reason}>{reason}</li>)}</ul>}
          <div className="wf-toolbar"><button className="wf-button" onClick={()=>onNavigate('/entry:Persiapan & SPMK')}>Buka persiapan</button><button className="wf-button" onClick={()=>onNavigate('/documents:Kalibrasi & personel')}>Buka kalibrasi</button></div>
        </details>
      )}
      {!canEnterProduction && <div role="status" className="wf-callout" style={{padding:'10px 14px'}}>
        <strong>{state.productionApproval === 'Diajukan'
          ? canReviewProduction ? 'Pengajuan diterima · menunggu pemeriksaan' : state.role === 'Direktorat / Pusat' ? 'Pengajuan dalam pengawasan' : 'Pengajuan tercatat'
          : approvalNeedsReview ? 'Menunggu pengajuan ulang Penyedia'
          : state.productionApproval === 'Perlu Revisi' ? 'Menunggu perbaikan Penyedia'
          : state.productionApproval === 'Disetujui' ? 'Persetujuan tercatat'
          : state.role === 'PIC Balai / Pengguna Jasa' ? 'Menunggu pengajuan Penyedia'
          : state.role === 'Direktorat / Pusat' ? 'Validasi produksi sedang disiapkan' : 'Draf Penyedia'}</strong>
        {state.productionApproval === 'Diajukan' && canReviewProduction && <span> · Tinjau seluruh jenis survei dan bukti.</span>}
        {state.productionApproval === 'Diajukan' && !canReviewProduction && <span> · Menunggu keputusan Balai.</span>}
      </div>}

      {!canEnterProduction && <section className="stage2-priority-action" aria-label={canReviewProduction ? "Keputusan Balai" : "Hasil pemeriksaan"}>
          {roleAction}
      </section>}
      {!canEnterProduction && hasOfficialSubmission && (
        <details className="stage2-review-data" data-testid="stage2-review-submitted-data">
          <summary>{`Lihat rincian data uji ${prodType}`}</summary>
          {state.productionApproval === 'Diajukan' || state.productionApproval === 'Perlu Revisi' || state.productionApproval === 'Disetujui' || state.productionApproval === 'Ditolak' ? (
            <div className="stage2-review-data__body">
              <p>{`Data uji ${prodType} dari Penyedia (baca saja). Nilai yang terlihat adalah data terkini; periksa status pengajuan dan riwayat keputusan.`}</p>
              <ProductionValidationChecklist type={prodType} test={test} editable={false} onUpdate={updateField} />
            </div>
          ) : <p className="stage2-review-data__empty">Belum ada pengajuan resmi dari Penyedia. Data uji akan tersedia setelah diajukan.</p>}
        </details>
      )}
      {(canEnterProduction || hasOfficialSubmission) && <div className={`production-workspace-columns ${canEnterProduction ? 'stage2-provider-layout' : 'review-first'}`}>
        {canEnterProduction && <div className="production-column stage2-data-column">
          <details className="stage2-test-form" open>
            <summary>Data Uji Coba {prodType}<span>Isi hasil pengukuran untuk survei ini</span></summary>
            <div className="stage2-test-form__body">
              <ProductionValidationChecklist
        type={prodType}
        test={test}
        editable={canEnterProduction && !sourceIsSynced}
        onUpdate={updateField}
      />
            </div>
          </details>
        </div>}
        <div className="production-column"><RoleWorkSection primary={canEnterProduction} title={canEnterProduction ? "Bukti hasil uji" : "Bukti dan dokumen"}>
          <Panel title={canEnterProduction ? "Bukti dan referensi uji" : "Bukti hasil uji"} icon={Archive}>

            <div className="wf-fields">
              <Field label="Sumber data hasil uji">
                {canEnterProduction?<select data-testid="select-production-source-mode" value={sourceIsImport?'Lampiran / bukti kegiatan':sourceIsManual&&['Pencatatan manual','Input manual fallback'].includes(test.sourceMode??'')?'Pencatatan manual':'Lokal tersimpan'} onChange={event=>updateField('sourceMode',event.target.value as ProductionTest['sourceMode'])}>
                  <option value="Lokal tersimpan" disabled>Data lokal tersimpan</option><option>Lampiran / bukti kegiatan</option><option>Pencatatan manual</option>
                </select>:<output>{sourceModeLabel}</output>}
              </Field>
              {canEnterProduction ? (
              <EvidenceField label="Referensi hasil uji" value={test.evidenceReference??''} onChange={value=>updateField('evidenceReference',value)} disabled={!canEnterProduction} />
              ) : <Field label="Referensi hasil uji"><output>{test.evidenceReference || "Belum tercatat"}</output></Field>}

            </div>
            {sourceIsManual && (canEnterProduction ? (
              <Field label="Alasan pencatatan manual" full>
                <textarea
                  value={String(test.productionDetails?.fallbackReason ?? "")}
                  onChange={(event) =>
                    updateField("productionDetails", {
                      ...test.productionDetails,
                      fallbackReason: event.target.value,
                    })
                  }
                  placeholder="Alasan penggunaan pencatatan manual"
                />
              </Field>
            ) : <p>Alasan pencatatan manual: {String(test.productionDetails?.fallbackReason || "Belum tercatat")}</p>)}
            <DocumentAttachments scope={`${state.project.id}:production-${prodType}`} categories={['Bukti pendukung uji coba']} legacyEvidenceIds={[`production-trial-${prodType}`]} editable={canEnterProduction}/>
          </Panel>

          <details className="stage2-survey-progress">
          <summary>Lihat kemajuan semua survei</summary>
          <Panel
            title="Kemajuan uji coba"
            icon={ClipboardCheck}
            extra={
              <Badge tone={allSelectedPassed ? "good" : "warn"}>
                {
                  scopedTypes.filter(
                    (type) =>
                      evaluateProductionTest(type, state.productionTests[type])
                        .passed,
                  ).length
                }{" "}
                dari {scopedTypes.length} jenis selesai
              </Badge>
            }
          >
            {scopedTypes.map((type) => {
              const result = evaluateProductionTest(
                type,
                state.productionTests[type],
              );

              return (
                <div
                  className="wf-row"
                  key={type}
                  data-testid={`production-scope-${testId(type)}`}
                >
                  <span>
                    <strong>{type}</strong>
                    <span className="wf-note" style={{ display: "block" }}>
                      {result.passed
                        ? "Seluruh pemeriksaan terpenuhi"
                        : `${result.checks.filter((check) => check.pass).length} dari ${result.checks.length} pemeriksaan sesuai`}
                    </span>
                  </span>

                  <Badge tone={result.passed ? "good" : "bad"}>
                    {result.passed ? "Memenuhi" : "Belum memenuhi"}
                  </Badge>
                </div>
              );
            })}

            <details className="stage2-history"><summary>Rincian kesiapan persetujuan</summary><GateSummary
              title="Kesiapan persetujuan"
              items={[
                {
                  label: "Persiapan telah disetujui",
                  ready:
                    state.project.preparation.reportApproval === "Disetujui",
                },
                {
                  label: "Kalibrasi dan personel siap",
                  ready: calibrationReady,
                },
                {
                  label: "Seluruh jenis survei memenuhi pemeriksaan otomatis",
                  ready: allSelectedPassed,
                  detail: `${
                    scopedTypes.filter(
                      (type) =>
                        evaluateProductionTest(
                          type,
                          state.productionTests[type],
                        ).passed,
                    ).length
                  }/${scopedTypes.length} jenis`,
                },
                {
                  label: "Pemeriksaan Balai selesai",
                  ready: state.productionApproval === "Disetujui" && !approvalNeedsReview,
                  detail: approvalDisplay,
                },
              ]}
            /></details>
          </Panel>
          </details>

          {canEnterProduction && sourceIsManual && prodType === "IRI" && (
            <details
              className="wf-panel production-helper"
              data-testid="production-calculator-optional"
            >
              <summary className="wf-panel-head" style={{ cursor: "pointer" }}>
                <h3>
                  <Gauge size={14} />
                  Hitung hasil IRI
                </h3>

                <Badge tone="info">Opsional</Badge>
              </summary>

              <ProductionCalculator
                key={`${prodType}-${!!test.pciManual}`}
                type={prodType}
                pciManual={test.pciManual}
                onApply={(patch) => {
                  if (state.role !== "Penyedia Jasa / Ketua Tim") {
                    setNotice(
                      "Hanya Penyedia yang dapat mencatat hasil uji manual.",
                    );
                    return;
                  }

                  commit(
                    `Preview kalkulasi lokal ${prodType}`,
                    prodType,
                    (s) => ({
                      ...invalidateDependentStages(
                        s,
                        "Hasil pencatatan berubah; validasi berikutnya perlu diperiksa ulang.",
                      ),

                      productionTestDates: {
                        ...s.productionTestDates,
                        [prodType]: s.simulationDate,
                      },

                      productionTests: {
                        ...s.productionTests,

                        [prodType]: {
                          ...s.productionTests[prodType],
                          ...patch,
                          sourceMode: "Pencatatan manual",
                        },
                      },
                    }),
                  );
                }}
              />
            </details>
          )}
        </RoleWorkSection></div>

        <div className="production-column">
          <Panel title={canEnterProduction ? "Hasil pemeriksaan otomatis" : "Hasil evaluasi"} icon={CheckCircle2}>
            <div className="stage2-evaluation-count">
              <strong>{evaluation.checks.filter(check => check.pass).length} dari {evaluation.checks.length} sesuai</strong>
              <span>{evaluation.passed ? 'Seluruh persyaratan terpenuhi.' : 'Periksa bagian yang belum memenuhi persyaratan.'}</span>
            </div>
            {evaluation.checks.some(check => !check.pass) && <div className="stage2-issues" aria-label="Persyaratan yang perlu diperiksa">
              {evaluation.checks.filter(check => !check.pass).map((check, index) => <div className="stage2-issue" key={`${check.label}-${index}`}><span className="stage2-issue__dot"/><span>{check.label}</span></div>)}
            </div>}
            <details className="stage2-evaluation-detail"><summary>Lihat seluruh {evaluation.checks.length} hasil pemeriksaan</summary>
              <div className="stage2-checklist-detail">
                {evaluation.checks.map((check, index) => <div key={`${check.label}-${index}`} className="stage2-checklist-row">
                  <span>{check.label}{check.actual && <small>{check.actual}</small>}</span>
                  <Badge tone={check.pass ? 'good' : 'bad'}>{check.pass ? 'Sesuai' : 'Perlu dilengkapi'}</Badge>
                </div>)}
              </div>
            </details>

            <div className="wf-toolbar" style={{ marginTop: 12 }}>
              <Badge tone={evaluation.passed ? "good" : "warn"}>
                {evaluation.passed ? 'Sesuai' : canEnterProduction ? 'Perlu dilengkapi' : 'Perlu pemeriksaan'}
              </Badge>

              {!evaluation.passed && canEnterProduction && (
                <details className="stage2-failed-trial" open={showFailedTrial} onToggle={event=>setShowFailedTrial(event.currentTarget.open)}>
                  <summary>Catat uji coba yang benar-benar gagal</summary>
                  <div className="stage2-failed-trial__body">
                  <p>Gunakan hanya jika hasil pengukuran atau metode uji tidak memenuhi syarat. Jika yang kurang hanya berkas atau referensi, lengkapi di bagian bukti.</p>
                  {failures.length > 0 && <p>{failures.length} percobaan gagal sudah dicatat untuk {prodType}.</p>}
                  <label>Referensi hasil uji gagal <input value={failureEvidence} onChange={event => saveText(`failure-evidence:${failureKey}`, event.target.value)} /></label>
                  <label>Hasil pemeriksaan metode atau personel <input value={methodReview} onChange={event => saveText(`failure-method:${failureKey}`, event.target.value)} /></label>
                  <Button id="button-production-record-failure" onClick={() => {
                    if (recordProductionFailure(state, prodType, failureEvidence, methodReview) === state) {
                      setNotice('Isi catatan pemeriksaan dan referensi hasil untuk percobaan yang berbeda.', 'error');
                      return;
                    }
                    commit('Catat kegagalan uji produksi', failureKey,
                      current => recordProductionFailure(current, prodType, failureEvidence, methodReview));
                  }}>Catat uji gagal</Button>
                  </div>
                </details>
              )}
              {canEnterProduction && canOpenProductionCorrection(state, prodType) && (
                <Button
                  id="button-production-create-correction"
                  kind="danger"
                  onClick={() => {
                    const c = defaultCase(state);
                    c.source = "Uji coba gagal";
                    c.blockedStage = "Validasi produksi";
                    c.surveyType = prodType;
                    c.rejectionReason = `Belum memenuhi hasil evaluasi ${prodType}`;

                    commit(
                      "Buka kasus dari uji produksi",
                      c.id,
                      (s) => ({ ...s, corrections: [c, ...s.corrections] }),
                      "Kasus koreksi dibuat; data menunggu uji ulang",
                    );

                    setCaseId(c.id);
                  }}
                >
                  Buka Tindakan Perbaikan
                </Button>
              )}
            </div>
          </Panel>

          {(state.productionApproval === "Perlu Revisi" ||
            state.productionApproval === "Disetujui" ||
            state.productionApproval === "Ditolak") &&
            state.productionApprovalNote?.trim() && (
              <div className="review-note important">
                <small>CATATAN BALAI</small>
                <strong>
                  {state.productionApproval === "Perlu Revisi"
                    ? "Perlu perbaikan"
                    : "Catatan PIC Balai"}
                </strong>
                <p>{state.productionApprovalNote}</p>
              </div>
            )}

          {prodType === "Jembatan" && scopedTypes.includes("Jembatan") && (
            <Panel title="Izin Pemeriksaan Jembatan" icon={ShieldCheck}>
              <div className="wf-row">
                <span>Status izin</span>
                <Badge tone={state.bridgeInspectionPermit ? "good" : "warn"}>
                  {state.bridgeInspectionPermit ? "Terbit" : "Belum terbit"}
                </Badge>
              </div>
            </Panel>
          )}
        </div>
      </div>}
      {canEnterProduction && <section className="stage2-priority-action" aria-label="Pengajuan hasil uji">
          {roleAction}
      </section>}
      <Stage2DirectorateNotes packageId={state.project.id} surveyType={prodType} role={state.role} principalId={props.principalId} />
      <details className="stage2-history stage2-documents">
        <summary>Dokumen kalibrasi dan persetujuan</summary>
        <div className="stage2-documents__body">
          <section className="stage2-document-entry">
            <strong>BA Kalibrasi dan Validasi</strong>
            <span>Bukti proses kalibrasi dan hasil validasi awal.</span>
            <div className="wf-toolbar">{baAccess("kalibrasi", "Buka BA Kalibrasi dan Validasi")}</div>
          </section>
          <section className="stage2-document-entry">
            <strong>Persetujuan penggunaan alat dan metode</strong>
            <span>Keputusan Balai setelah memeriksa kalibrasi dan uji produksi.</span>
            <div className="wf-row"><span>Status</span><strong>{approvalDisplay}</strong></div>
            <div className="wf-row"><span>Nomor / referensi BA</span><strong>{state.productionApprovalBa || 'Belum tercatat'}</strong></div>
            {state.productionApprovalBa && <p className="stage2-document-caveat">Nomor BA sudah dicatat. Lampiran persetujuan harus diperiksa sebelum digunakan sebagai bukti penerbitan.</p>}
            <DocumentAttachments
              title="Lampiran persetujuan Balai"
              scope={`${state.project.id}:stage2-approval`}
              categories={['BA persetujuan alat dan metode', 'Sertifikat persetujuan alat dan metode']}
              editable={state.role === 'PIC Balai / Pengguna Jasa'}
            />
          </section>
        </div>
      </details>
      <details className="stage2-history"><summary>Riwayat keputusan</summary><BalaiDecisionHistory state={state} stage="Tahap 2"/></details>
    </div>
  );
}
