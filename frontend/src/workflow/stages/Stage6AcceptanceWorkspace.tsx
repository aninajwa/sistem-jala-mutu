import { Stage6MonitoringOverview } from "./Stage6MonitoringOverview";
import { Stage6DirectorateNotes } from "./Stage6DirectorateNotes";
import { Stage6HandoverWorkspace } from "./Stage6HandoverWorkspace";
import { handoverLinkProblems, stage6HandoverKey, type HandoverRecord } from "../stage6Handover";
import { readLocal } from "../repository/localPersistence";
import { stage6TabsForRole, type Stage6Tab } from "../stage6Presentation";
import "./stage6-redesign.css";
import { finalAcceptanceBlockers } from '../acceptanceReadiness';
import {BalaiDecisionHistory} from '../BalaiDecisionHistory';
import {DocumentAttachments} from '../DocumentAttachments';
import {SourceDocumentChecklist} from '../SourceDocumentChecklist';
import {useWorkflowReconciliation} from '../../hooks/useWorkflowReconciliation';
import {workflowFormIssues} from '../repository/workflowReconciliation';
import {RoleWorkSection} from '../RoleWorkSection';
import {usePersistedDraft} from '../../hooks/usePersistedDraft';
import {
  BadgeCheck,
  ClipboardCheck,
  FileCheck2,
  FileText,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  ACCEPTANCE_CRITERIA,
  type AcceptanceCriterion,
} from "../AcceptanceCriteriaPanel";
import { EvidenceAttachment } from "../EvidenceAttachment";
import {
  canMarkFinalReport,
  semesterTwoReadiness,
  semesterTwoApplies,
  termReadiness,
} from "../flowRules";
import {
  AcceptanceTerm,
  daysBetween,
  DEFAULT_SEMESTER_TWO,
  evaluateProductionTest,
  SurveyType,
} from "../model";

import type { WorkflowStageProps } from "./stageSupport";
import {
  Badge,
  Button,
  CheckRow,
  defaultDaily,
  Field,
  Panel,
  Select,
  testId,
} from "./stageSupport";
import { useWorkflowStage } from "./useWorkflowStage";

export function Stage6AcceptanceWorkspace(props: WorkflowStageProps) {
  const { selection, state, onUpdate, setNotice, onNavigate } = props;
  const { baAccess, commit, heading } = useWorkflowStage(props);
  const formIssues=useWorkflowReconciliation(state);
  const [draft,setDraft]=usePersistedDraft<Record<string,string>>(`jala-ui-draft:${state.project.id}:${state.role}:Stage6AcceptanceWorkspace`,{});
  const [prodType, setProdType] = useState<SurveyType>("IRI");
  const [daily, setDaily] = useState(() =>
    defaultDaily(
      state.simulationDate,
      state.project.routes[0] || "",
      state.project.surveyTypes[0] || "IRI",
    ),
  );
  const [acceptDraft, setAcceptDraft] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<Stage6Tab>("overview");
  const [surveyFocus,setSurveyFocus] = useState<SurveyType>(state.project.surveyTypes[0] || "IRI");
  // The same workspace instance can survive a demo-role change.
  useEffect(() => setActiveTab("overview"), [state.role]);
  useEffect(()=>setSurveyFocus(state.project.surveyTypes[0] || "IRI"),[state.project.id]);
  const isProvider = state.role === "Penyedia Jasa / Ketua Tim";
  const isBalai = state.role === "PIC Balai / Pengguna Jasa";
  const tabs = stage6TabsForRole(state.role, semesterTwoApplies(state));
  const saveText = (key: string, value: string) =>
    setDraft((old) => ({ ...old, [key]: value }));

  const allAuditsPassed = state.audits.every(
    (a) => a.status === "Lulus" && !a.requiresReview,
  );
  const semesterEvidence =
    state.acceptance.semesterTwoEvidence ?? DEFAULT_SEMESTER_TWO;
  const semesterErrors = semesterTwoReadiness(state);
  const updateSemesterEvidence = (patch: Partial<typeof semesterEvidence>) => {
    if (state.role !== "Penyedia Jasa / Ketua Tim") {
      setNotice("Penyedia Jasa mencatat bukti Semester II.");
      return;
    }
    commit(
      "Catat bukti siklus IRI Semester II",
      state.project.packageName,
      (s) => ({
        ...s,
        acceptance: {
          ...s.acceptance,
          semesterTwoEvidence: {
            ...DEFAULT_SEMESTER_TWO,
            ...s.acceptance.semesterTwoEvidence,
            ...patch,
          },
          semesterTwoRevalidation: false,
          finalAcceptance: false,
          finalReport: false,
          terms: s.acceptance.terms.map((t) =>
            t.id === "T4" ? { ...t, complete: false, progress: 0 } : t,
          ),
        },
      }),
    );
  };
  const calibrationReady =
    state.calibrations.length > 0 &&
    state.calibrations.every(
      (c) =>
        daysBetween(state.simulationDate, c.dueDate) >= 0 &&
        c.qualificationValid &&
        c.trainingVerified &&
        c.condition === "Baik",
    ) &&
    state.project.surveyTypes.length > 0 &&
    state.project.surveyTypes.every((type) => state.calibrationChecklist[type]);
  const productionTestsPassed =
    state.project.surveyTypes.length > 0 &&
    state.project.surveyTypes.every(
      (type) =>
        evaluateProductionTest(type, state.productionTests[type]).passed,
    );
  const updateTerm = (
    id: AcceptanceTerm["id"],
    patch: Partial<AcceptanceTerm>,
    activity: string,
  ) => {
    if (state.role !== "Penyedia Jasa / Ketua Tim") {
      setNotice("Peran Penyedia Jasa diperlukan untuk memperbarui termin.");
      return;
    }
    if (patch.complete) {
      if (!state.acceptance.partialReceipts.includes(`BA penerimaan ${id}`)) {
        setNotice(
          `BA penerimaan parsial ${id} wajib dicatat sebelum termin dinyatakan selesai.`,
        );
        return;
      }
      const errors = termReadiness(state, id);
      if (errors.length) {
        setNotice(errors.join(" · "));
        return;
      }
      if (
        id === "T1" &&
        (state.project.preparation.reportApproval !== "Disetujui" ||
          !calibrationReady ||
          state.productionApproval !== "Disetujui" ||
          !productionTestsPassed)
      ) {
        setNotice(
          "Termin T1 menunggu laporan pendahuluan, kalibrasi/personel, uji produksi, dan BA metode disetujui.",
        );
        return;
      }
      if (
        id === "T2" &&
        (!state.dailyRecords.some((record) => record.state === "Tercatat") ||
          !state.cycle.certificateId ||
          state.cycle.consistency !== "Konsisten" ||
          state.cycle.heldRecordIds.length > 0)
      ) {
        setNotice(
          "Termin T2 menunggu catatan lapangan yang lolos, BA verval konsisten, dan tidak ada data tertahan.",
        );
        return;
      }
      if (
        id === "T3" &&
        (state.submission.validationStatus !== "VALID" ||
          state.audits[1].status !== "Lulus" ||
          state.audits[2].status !== "Lulus")
      ) {
        setNotice(
          "Termin T3 menunggu status VALID serta audit Pengguna Jasa dan Direktorat lulus.",
        );
        return;
      }
      if (
        id === "T4" &&
        ((semesterTwoApplies(state)&&!state.acceptance.semesterTwoRevalidation) ||
          !state.acceptance.finalReport)
      ) {
        setNotice(
          "Termin T4 menunggu revalidasi Semester II dan laporan akhir.",
        );
        return;
      }
    }
    commit(activity, id, (s) => ({
      ...s,
      acceptance: {
        ...s.acceptance,
        finalAcceptance: false,
        terms: s.acceptance.terms.map((t) =>
          t.id === id ? { ...t, ...patch } : t,
        ),
      },
    }));
  };
  const toggleReceipt = (receipt: string, on: boolean) => {
    if (state.role !== "PIC Balai / Pengguna Jasa") {
      setNotice(
        "Peran PIC Balai / Pengguna Jasa diperlukan untuk mencatat penerimaan parsial.",
      );
      return;
    }
    const receiptId = receipt.replace("BA penerimaan ", "");
    if (on && termReadiness(state, receiptId).length) {
      setNotice(termReadiness(state, receiptId).join(" · "));
      return;
    }
    commit(
      on
        ? "Catat BA penerimaan parsial"
        : "Hapus BA penerimaan parsial simulasi",
      receipt,
      (s) => {
        const termId = (["T1", "T2", "T3", "T4"] as const).find(
          (id) => receipt === `BA penerimaan ${id}`,
        );
        return {
          ...s,
          acceptance: {
            ...s.acceptance,
            finalAcceptance: false,
            partialReceipts: on
              ? [...new Set([...s.acceptance.partialReceipts, receipt])]
              : s.acceptance.partialReceipts.filter((x) => x !== receipt),
            terms:
              !on && termId
                ? s.acceptance.terms.map((term) =>
                    term.id === termId ? { ...term, complete: false } : term,
                  )
                : s.acceptance.terms,
          },
        };
      },
    );
  };
  const acceptanceCriteria = state.acceptance.acceptanceCriteria ?? {};
  const acceptanceCriteriaReady = ACCEPTANCE_CRITERIA.every(
    (item) => !!acceptanceCriteria[item],
  );
  const finalReady = finalAcceptanceBlockers(state).length === 0;
  const updateAcceptanceCriterion = (
    criterion: AcceptanceCriterion,
    checked: boolean,
  ) => {
    if (state.role !== "PIC Balai / Pengguna Jasa") {
      setNotice("Kriteria penerimaan dinilai oleh PIC Balai / Pengguna Jasa.");
      return;
    }
    commit("Nilai kriteria penerimaan data", criterion, (s) => ({
      ...s,
      acceptance: {
        ...s.acceptance,
        acceptanceCriteria: {
          ...(s.acceptance.acceptanceCriteria ?? {}),
          [criterion]: checked,
        },
        acceptanceDecision: "Belum Diperiksa",
        finalAcceptance: false,
      },
    }));
  };
  const toggleSemesterTwo = (checked: boolean) => {
    if (state.role !== "PIC Balai / Pengguna Jasa") {
      setNotice("Peran Pengguna Jasa diperlukan untuk keputusan revalidasi.");
      return;
    }
    if (checked) {
      if (semesterErrors.length) {
        setNotice(semesterErrors.join(" · "));
        return;
      }
      if (state.role !== "PIC Balai / Pengguna Jasa") {
        setNotice(
          "Peran PIC Balai / Pengguna Jasa diperlukan untuk menandai revalidasi akhir.",
        );
        return;
      }
      if (
        !evaluateProductionTest("IRI", state.productionTests.IRI).passed ||
        !state.calibrations.length ||
        state.calibrations.some(
          (c) =>
            daysBetween(state.simulationDate, c.dueDate) < 0 ||
            !c.qualificationValid ||
            !c.trainingVerified ||
            c.condition !== "Baik",
        ) ||
        !state.calibrationChecklist.IRI
      ) {
        setNotice(
          "Revalidasi IRI Semester II tertahan oleh hasil uji IRI atau kesiapan kalibrasi/personel.",
        );
        return;
      }
    }
    commit("Ubah revalidasi Semester II", state.project.packageName, (s) => ({
      ...s,
      acceptance: {
        ...s.acceptance,
        semesterTwoRevalidation: checked,
        finalAcceptance: false,
        ...(!checked
          ? {
              terms: s.acceptance.terms.map((t) =>
                t.id === "T4" ? { ...t, complete: false } : t,
              ),
            }
          : {}),
      },
    }));
  };
  const toggleFinalReport = (checked: boolean) => {
    if (state.role !== "Penyedia Jasa / Ketua Tim") {
      setNotice("Penyedia Jasa menyerahkan laporan akhir.");
      return;
    }
    if (checked && !canMarkFinalReport(state)) {
      setNotice(
        "Laporan akhir membutuhkan T1–T3 selesai, audit lulus dan referensi laporan. Tidak perlu menunggu T4 (laporan adalah syarat T4).",
      );
      return;
    }
    commit("Ubah status laporan akhir", state.project.packageName, (s) => ({
      ...s,
      acceptance: {
        ...s.acceptance,
        finalReport: checked,
        finalAcceptance: false,
        ...(!checked
          ? {
              terms: s.acceptance.terms.map((t) =>
                t.id === "T4" ? { ...t, complete: false } : t,
              ),
            }
          : {}),
      },
    }));
  };
  const saveAcceptanceDecision = () => {
    if (state.role !== "PIC Balai / Pengguna Jasa") {
      setNotice(
        "Keputusan penerimaan data dilakukan oleh PIC Balai / Pengguna Jasa.",
      );
      return;
    }
    const decision = (draft.acceptanceDecision ??
      state.acceptance.acceptanceDecision ??
      "Belum Diperiksa") as "Belum Diperiksa" | "Diterima" | "Diterima dengan Catatan" | "Ditolak";
    const rejectionReason =
      draft.acceptanceRejectionReason ??
      state.acceptance.acceptanceRejectionReason ??
      "";
    if (decision === "Ditolak") {
      if (!rejectionReason.trim()) {
        setNotice("Alasan penolakan wajib diisi.");
        return;
      }
      commit(
        "Tolak penerimaan data",
        state.project.packageName,
        (s) => ({
          ...s,
          acceptance: {
            ...s.acceptance,
            acceptanceDecision: "Ditolak",
            acceptanceRejectionReason: rejectionReason,
            finalAcceptance: false,
          },
        }),
        "Penolakan dicatat; Penyedia perlu melakukan klarifikasi/tindakan perbaikan.",
      );
      return;
    }
    const reviewNote = (draft.acceptanceReviewNote ?? state.acceptance.acceptanceReviewNote ?? '').trim();
    if (decision === 'Diterima dengan Catatan' && !reviewNote) {setNotice('Catatan penerimaan wajib diisi untuk Diterima dengan Catatan.');return;}
    if (decision !== "Diterima" && decision !== 'Diterima dengan Catatan') {
      setNotice("Pilih keputusan Diterima atau Ditolak.");
      return;
    }
    const pendingForms=workflowFormIssues(state);if(pendingForms.length){setNotice(`Penerimaan tertahan: ${pendingForms.slice(0,3).map(issue=>issue.message).join(" ")}`);return;}
    // Local-prototype continuity gate: submitted data must be reviewed by Balai
    // before a FINAL acceptance is entered. Not a substitute for backend authorization.
    const linkedHandovers = readLocal<HandoverRecord[]>(stage6HandoverKey(state.project.id), []);
    const handoverProblems = handoverLinkProblems(state.project.id, state.project.surveyTypes, linkedHandovers);
    if (handoverProblems.length) {
      setNotice(`Penyerahan belum selesai diperiksa: ${handoverProblems.slice(0, 3).join(' · ')}`);
      return;
    }
    if (!(draft.finalAcceptanceBa ?? state.acceptance.finalAcceptanceBa ?? '').trim()) {
      setNotice('Referensi BA penerimaan nyata wajib diisi; sistem tidak membuat nomor BA otomatis.'); return;
    }
    if (!finalReady) {
      setNotice(
        finalAcceptanceBlockers(state).slice(0, 3).join(" · "), "error",
      );
      return;
    }
    commit(
      "Catat penerimaan akhir",
      state.project.packageName,
      (s) => ({
        ...s,
        acceptance: {
          ...s.acceptance,
          acceptanceDecision: decision,
          acceptanceReviewNote: reviewNote,
          acceptanceRejectionReason: "",
          finalAcceptance: true,
          finalAcceptanceBa:
            draft.finalAcceptanceBa ||
            s.acceptance.finalAcceptanceBa ||
            "",
        },
      }),
      "Penerimaan akhir dan referensi BA dicatat.",
    );
  };
  // Direktorat monitors this stage; Admin sees only the administrative trail.
  // Neither role can write acceptance decisions or provider term progress.
  if (state.role === "Direktorat / Pusat" || state.role === "Admin") {
    return <>
      <div className="stage6-heading">{heading("Tahap 6 · Penerimaan", state.role === "Admin" ? "Administrasi penerimaan" : "Pengawasan penerimaan", "Rincian pemeriksaan, dokumen, dan riwayat tersedia sesuai peran.")}</div>
      <Stage6MonitoringOverview state={state} onNavigate={onNavigate} principalId={props.principalId} />
    </>;
  }

  return (
    <>
      <div className="stage6-heading">{heading(
        "Tahap 6 · Penerimaan",
        isProvider ? "Siapkan penerimaan data" : "Periksa penerimaan data",
        isProvider ? "Tinjau data survei, laporan, dan dokumen yang perlu diserahkan." : "Tinjau hasil survei dan berikan keputusan penerimaan berdasarkan bukti.",
      )}</div>
      <nav className="stage6-tabs" aria-label="Bagian kerja Tahap 6">
        {tabs.map(tab => (
          <button key={tab.id} type="button" className={activeTab === tab.id ? "stage6-tab active" : "stage6-tab"}
            aria-current={activeTab === tab.id ? "page" : undefined}
            data-testid={`stage6-tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
        ))}
      </nav>

      {(isProvider ? activeTab === 'documents' : activeTab === 'criteria') && state.project.surveyTypes.includes('Lendutan')&&<RoleWorkSection primary={state.role==='PIC Balai / Pengguna Jasa'} title="Pemeriksaan penerimaan Lendutan"><SourceDocumentChecklist packageId={state.project.id} phase="acceptance" surveyTypes={['Lendutan']} role={state.role} editableRoles={['PIC Balai / Pengguna Jasa']} projectInfo={state.project} hideSurveySelector/></RoleWorkSection>}
      {activeTab === "documents" && isProvider && <Stage6HandoverWorkspace state={state} onNavigate={onNavigate} mode="provider"/>}
      {activeTab === "overview" && isBalai && <Stage6HandoverWorkspace state={state} onNavigate={onNavigate} mode="balai"/>}
      {activeTab === "documents" && <Panel title="Lampiran penerimaan" icon={FileText}>
        <div className="stage-evidence-grid">
          <DocumentAttachments title="Laporan akhir · Penyedia" scope={`${state.project.id}:stage6-report`} categories={['Laporan akhir']} legacyEvidenceIds={['stage6-final-report']} editable={state.role==='Penyedia Jasa / Ketua Tim'}/>
          <DocumentAttachments title="BA penerimaan · Balai" scope={`${state.project.id}:stage6-acceptance`} categories={['Berita Acara Penerimaan']} legacyEvidenceIds={['stage6-final-acceptance-ba']} editable={state.role==='PIC Balai / Pengguna Jasa'}/>
        </div>

      </Panel>}
      {activeTab === "overview" && <div className="stage6-summary" aria-label="Ringkasan status penerimaan">
        <div className="wf-kpi">
          <div className="wf-kpi-label">Termin selesai</div>
          <div className="wf-kpi-value">
            {state.acceptance.terms.filter((t) => t.complete).length}/4
          </div>
        </div>
        <div className="wf-kpi">
          <div className="wf-kpi-label">Penerimaan parsial</div>
          <div className="wf-kpi-value">
            {state.acceptance.partialReceipts.length}
          </div>
        </div>
        <div className="wf-kpi">
          <div className="wf-kpi-label">Gerbang akhir</div>
          <div className="wf-kpi-value" style={{ fontSize: 14 }}>
            {formIssues.length?"Perlu pemeriksaan":state.acceptance.finalAcceptance
              ? "Diterima"
              : finalReady
                ? "Siap"
                : "Tertahan"}
          </div>
        </div>
      </div>}
      {activeTab === "overview" && <section className="stage6-overview" aria-label="Status kesiapan penerimaan">
        <h2>Kesiapan penerimaan akhir</h2>
        <p className="stage6-help">{state.acceptance.finalAcceptance ? "Penerimaan telah dicatat oleh Balai." : finalReady ? "Syarat penerimaan telah lengkap; menunggu keputusan Balai." : "Masih ada persyaratan yang belum terpenuhi."}</p>
        {formIssues.length > 0 && <p className="stage6-note">Masih ada {formIssues.length} masalah formulir yang memerlukan pemeriksaan.</p>}
        {!finalReady && <details className="stage6-gate-details" data-testid="stage6-blockers">
          <summary>Lihat {finalAcceptanceBlockers(state).length} persyaratan penerimaan</summary>
          <ul>{finalAcceptanceBlockers(state).map((item,i)=><li key={i}>{item}</li>)}</ul>
        </details>}
        <div className="stage6-next-actions">
          {isProvider ? <>
            <button type="button" className="wf-button primary" onClick={() => {setSurveyFocus(state.project.surveyTypes[0]||'IRI');setActiveTab('surveys');}}>Periksa penyelesaian survei</button>
            <button type="button" className="wf-button" onClick={() => setActiveTab("terms")}>Buka progres termin</button>
          </> : <>
            <button type="button" className="wf-button" onClick={() => setActiveTab("criteria")}>Periksa kelengkapan</button>
            <button type="button" className="wf-button" onClick={() => setActiveTab("decision")}>Buka keputusan Balai</button>
          </>}
        </div>
      </section>}
      {isProvider && activeTab === "surveys" && <section className="stage6-survey-work" aria-label="Penyelesaian survei">
        <div className="stage6-section-heading"><h2>Hasil survei dalam paket</h2><span>{state.project.surveyTypes.length} jenis survei</span></div>
        <div className="stage6-survey-cards">{state.project.surveyTypes.map(type=>{
          const count=state.dailyRecords.filter(record=>record.surveyType===type&&record.state==='Tercatat').length;
          const hasAudit=allAuditsPassed;
          return <button type="button" key={type} className={surveyFocus===type?'stage6-survey-card selected':'stage6-survey-card'} onClick={()=>setSurveyFocus(type)}
            aria-pressed={surveyFocus===type} data-testid={`stage6-survey-${type}`}>
            <strong>{type}</strong><span>{count} rekaman tercatat</span><small>{hasAudit?'Audit paket lulus':'Audit paket belum lengkap'}</small>
          </button>;
        })}</div>
        {state.project.surveyTypes.length===0 && <p className="stage6-empty">Belum ada jenis survei dalam paket.</p>}
        {state.project.surveyTypes.length>0 && <div className="stage6-panel stage6-survey-detail">
          <div className="stage6-section-heading"><h3>{surveyFocus} · kesiapan penyerahan</h3><span>{state.submission.validationStatus==='VALID'?'Status VALID tercatat':'Belum VALID'}</span></div>
          <div className="stage6-details-grid">
            <div><span>Rekaman yang tercatat</span><strong>{state.dailyRecords.filter(record=>record.surveyType===surveyFocus&&record.state==='Tercatat').length}</strong></div>
            <div><span>Audit Tingkat 1–3</span><strong>{allAuditsPassed?'Lulus':'Belum lengkap'}</strong></div>
          </div>
          {surveyFocus==='PCI' && <p className="stage6-short-hint">Periksa hasil PCI dan data kerusakan yang belum tuntas pada Semester I, bila ada.</p>}
          <div className="stage6-actions"><button type="button" className="wf-button" onClick={()=>onNavigate('/entry:Survei harian')}>Buka data survei</button><button type="button" className="wf-button" onClick={()=>onNavigate('/verification:Audit tingkat 1–3')}>Lihat hasil audit</button></div>
        </div>}
      </section>}
      {isProvider && activeTab === "surveys" && semesterTwoApplies(state) && surveyFocus === 'IRI' && <Panel
        title="IRI Semester II · kalibrasi dan validasi ulang"
        icon={RotateCcw}
      >
        <details className="stage6-inline-help"><summary>Urutan pemeriksaan IRI Semester II</summary><p>Kalibrasi ulang → validasi ulang → survei IRI → upload data → penyelesaian sanggah. Bukti Semester I tetap terpisah.</p></details>
        <div className="wf-toolbar">
          <Button
            id="button-semester-calibration"
            onClick={() => onNavigate("/documents:Kalibrasi & personel")}
          >
            Buka kalibrasi ulang
          </Button>
          <Button
            id="button-semester-production"
            onClick={() => {
              setProdType("IRI");
              onNavigate("/entry:Validasi produksi");
            }}
          >
            Buka uji IRI
          </Button>
          <Button
            id="button-semester-daily"
            onClick={() => onNavigate("/entry:Survei harian")}
          >
            Catat survei Semester II
          </Button>
        </div>
        <div className="wf-fields">
          {(["calibrationDate", "validationDate", "uploadDate"] as const).map(
            (key) => (
              <Field
                key={key}
                label={
                  {
                    calibrationDate: "Tanggal kalibrasi ulang",
                    validationDate: "Tanggal validasi ulang",
                    uploadDate: "Tanggal upload Semester II",
                  }[key]
                }
              >
                <input
                  type="date"
                  data-testid={`input-semester-two-${key}`}
                  disabled={state.role !== "Penyedia Jasa / Ketua Tim"}
                  value={semesterEvidence[key]}
                  onChange={(e) =>
                    updateSemesterEvidence({ [key]: e.target.value })
                  }
                />
              </Field>
            ),
          )}
          {(
            [
              "calibrationReference",
              "validationReference",
            ] as const
          ).map((key) => (
            <Field
              key={key}
              label={
                {
                  calibrationReference: "Referensi kalibrasi Semester II",
                  validationReference: "BA validasi IRI Semester II",
                  finalReportReference: "Referensi laporan akhir",
                }[key]
              }
            >
              <input
                data-testid={`input-semester-two-${key}`}
                disabled={state.role !== "Penyedia Jasa / Ketua Tim"}
                value={semesterEvidence[key]}
                onChange={(e) =>
                  updateSemesterEvidence({ [key]: e.target.value })
                }
              />
            </Field>
          ))}
          <CheckRow
            id="semester-two-upload-valid"
            label="Upload IRI Semester II VALID (simulasi)"
            disabled={state.role !== "Penyedia Jasa / Ketua Tim"}
            checked={semesterEvidence.uploadValid}
            onChange={(v) => updateSemesterEvidence({ uploadValid: v })}
          />
          <CheckRow
            id="semester-two-objections"
            label="Sanggah Semester II sudah ditutup"
            disabled={state.role !== "Penyedia Jasa / Ketua Tim"}
            checked={semesterEvidence.objectionsClosed}
            onChange={(v) => updateSemesterEvidence({ objectionsClosed: v })}
          />
        </div>
        <details className={`stage6-gate-details ${semesterErrors.length ? 'pending' : ''}`} data-testid="semester-two-gate">
          <summary>{semesterErrors.length ? `${semesterErrors.length} persyaratan belum lengkap` : 'Bukti siap diperiksa Balai'}</summary>
          {semesterErrors.length>0 && <ul>{semesterErrors.map((message,i)=><li key={i}>{message}</li>)}</ul>}
        </details>
        {!!semesterEvidence.uploadDate && semesterEvidence.uploadDate.slice(5) > "11-21" && (
          <div className="wf-callout warn">
            Upload melewati minggu ke-3 November; keterlambatan tetap dicatat,
            bukan disembunyikan.
          </div>
        )}
      </Panel>}
      {isBalai && activeTab === "criteria" && <div className="stage6-panel">
        <div className="stage6-section-heading"><h3>Data survei untuk diperiksa</h3><span>{state.project.surveyTypes.length} jenis survei</span></div>
        <div className="stage6-audit-list">{state.project.surveyTypes.map(type=><div className="stage6-audit-row" key={type}>
          <div><strong>{type}</strong><span>{state.dailyRecords.filter(item=>item.surveyType===type&&item.state==='Tercatat').length} rekaman tercatat</span></div>
          <span>{allAuditsPassed?'Audit lengkap':'Audit belum lengkap'}</span>
        </div>)}</div>
        <div className="stage6-actions"><button type="button" className="wf-button" onClick={()=>onNavigate('/verification:Audit tingkat 1–3')}>Buka hasil audit</button></div>
      </div>}
      {isBalai && activeTab === "criteria" && semesterTwoApplies(state) && <Panel title="Revalidasi IRI Semester II · hasil Penyedia" icon={RotateCcw}>
        <dl className="v2-decision-facts">
          <dt>Kalibrasi ulang</dt><dd>{semesterEvidence.calibrationReference || "Belum tercatat"}</dd>
          <dt>BA validasi ulang</dt><dd>{semesterEvidence.validationReference || "Belum tercatat"}</dd>
          <dt>Upload Semester II</dt><dd>{semesterEvidence.uploadDate || "Belum tercatat"}</dd>
          <dt>Status upload</dt><dd>{semesterEvidence.uploadValid ? "VALID tercatat" : "Belum VALID"}</dd>
          <dt>Penutupan sanggah</dt><dd>{semesterEvidence.objectionsClosed ? "Tercatat" : "Belum tercatat"}</dd>
        </dl>
        {semesterErrors.length > 0 && <div className="wf-callout warn" data-testid="semester-two-gate">{semesterErrors.slice(0,4).join(" · ")}</div>}
      </Panel>}
      {(isProvider ? activeTab === "terms" : activeTab === "criteria") && (state.role === "Penyedia Jasa / Ketua Tim" ? <RoleWorkSection primary title="Laporan akhir Penyedia"><Panel title="Laporan akhir" icon={FileText}><Field label="Referensi laporan akhir"><input data-testid="input-semester-two-finalReportReference" value={semesterEvidence.finalReportReference} onChange={e=>updateSemesterEvidence({finalReportReference:e.target.value})}/></Field>            <CheckRow
              id="acceptance-final-report"
              label="Laporan akhir tersedia"
              disabled={state.role !== "Penyedia Jasa / Ketua Tim"}
              checked={state.acceptance.finalReport}
              onChange={toggleFinalReport}
            />
</Panel></RoleWorkSection> : <Panel title="Laporan akhir Penyedia" icon={FileText}>
        <dl className="v2-decision-facts"><dt>Referensi laporan</dt><dd>{semesterEvidence.finalReportReference || "Belum tercatat"}</dd>
        <dt>Ketersediaan</dt><dd>{state.acceptance.finalReport ? "Tercatat tersedia" : "Belum tercatat"}</dd></dl>
      </Panel>)}
      <div className="stage6-work-area">
        {(isProvider ? activeTab === "terms" : activeTab === "criteria") && (state.role === "Penyedia Jasa / Ketua Tim" ? <RoleWorkSection primary title="Termin dan progres Penyedia"><Panel title="Termin dan progres pekerjaan" icon={FileCheck2}>
          <div className="stage6-terms-grid" data-testid="table-acceptance-terms">
            {state.acceptance.terms.map(term => <article className="stage6-term-card" key={term.id} data-testid={`row-term-${term.id}`}>
              <div className="stage6-term-head"><strong>{term.id} · {term.percentage}%</strong>
                <Badge tone={term.complete ? "good" : "warn"}>{term.complete ? "Selesai" : "Berjalan"}</Badge>
              </div>
              <p>{term.milestone}</p>
              <div className="stage6-term-fields">
                <Field label="Catatan perkembangan">
                  <input data-testid={`input-term-note-${term.id}`}
                    value={acceptDraft[`${term.id}-note`] ?? term.note}
                    onChange={e => setAcceptDraft(d => ({...d, [`${term.id}-note`]: e.target.value}))} />
                </Field>
                <Field label="Tanggal target">
                  <input type="date" data-testid={`input-term-date-${term.id}`}
                    value={acceptDraft[`${term.id}-date`] ?? term.dueDate}
                    onChange={e => setAcceptDraft(d => ({...d, [`${term.id}-date`]: e.target.value}))} />
                </Field>
                <Field label="Progres pekerjaan (%)">
                  <input type="number" min="0" max="100" data-testid={`input-term-progress-${term.id}`}
                    value={acceptDraft[`${term.id}-progress`] ?? String(term.complete ? 100 : (term.progress ?? 0))}
                    onChange={e => setAcceptDraft(d => ({...d, [`${term.id}-progress`]: e.target.value}))} />
                </Field>
              </div>
              <div className="stage6-term-footer">
                <span className="stage6-inline-muted">{term.complete ? "Tercatat selesai" : "Penyelesaian memerlukan prasyarat dan BA penerimaan parsial."}</span>
                <button type="button" className="wf-button" data-testid={`button-save-term-${term.id}`}
                  onClick={() => {
                    const progress=Number(acceptDraft[`${term.id}-progress`] ?? (term.complete ? 100 : (term.progress ?? 0)));
                    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
                      setNotice("Progres termin harus antara 0% dan 100%.");return;
                    }
                    updateTerm(term.id, {
                      progress, complete: progress >= 100,
                      note: acceptDraft[`${term.id}-note`] ?? term.note,
                      dueDate: acceptDraft[`${term.id}-date`] ?? term.dueDate,
                    }, `Perbarui termin ${term.id}`);
                  }}>Simpan progres</button>
              </div>
            </article>)}
          </div>
          <p className="stage6-footnote">Progres bukan status pembayaran; penyelesaian mengikuti syarat dan BA penerimaan.</p>
          </Panel></RoleWorkSection> : <Panel title="Termin Penyedia · hasil tercatat" icon={FileCheck2}>
          <div className="wf-table"><table data-testid="table-acceptance-terms"><thead><tr>
            <th>Termin</th><th>Milestone</th><th>Bobot</th><th>Jatuh tempo</th><th>Progres</th><th>Status</th>
          </tr></thead><tbody>{state.acceptance.terms.map((term) => <tr key={term.id} data-testid={`row-term-${term.id}`}>
            <td>{term.id}</td><td>{term.milestone}{term.note && <small className="wf-note"> · {term.note}</small>}</td>
            <td>{term.percentage}%</td><td>{term.dueDate || "Belum ditetapkan"}</td>
            <td>{term.complete ? 100 : (term.progress ?? 0)}%</td><td>{term.complete ? "Selesai" : "Berjalan"}</td>
          </tr>)}</tbody></table></div>
        </Panel>)}
        {state.role === "PIC Balai / Pengguna Jasa" ? <section aria-label="Pemeriksaan penerimaan Balai">
          {activeTab === "criteria" && <Panel title="Kriteria penerimaan data" icon={ClipboardCheck}>
            <div className="stage6-criteria-progress">{ACCEPTANCE_CRITERIA.filter(item=>acceptanceCriteria[item]).length}/{ACCEPTANCE_CRITERIA.length} kriteria memenuhi</div>
            <div className="stage6-criteria-list">{ACCEPTANCE_CRITERIA.map(criterion=><label key={criterion} className="stage6-criteria-row">
              <input type="checkbox" checked={!!acceptanceCriteria[criterion]} onChange={event=>updateAcceptanceCriterion(criterion,event.target.checked)}/>
              <span>{criterion}</span><strong>{acceptanceCriteria[criterion]?'Memenuhi':'Belum memenuhi'}</strong>
            </label>)}</div>
          </Panel>}
          {activeTab === "decision" && <>
          <Panel title="Referensi penerimaan terkait termin" icon={ClipboardCheck}>
            <details className="stage6-inline-help"><summary>Prasyarat administrasi termin</summary>
              <p>Penandaan dokumen T1–T4 merupakan pencatatan prasyarat termin lokal, bukan bukti bahwa seluruh data survei sudah diterima. Gunakan penyerahan per jenis survei dan BA resmi pada tab BA & Riwayat.</p>
            </details>
            {[
              "BA penerimaan T1",
              "BA penerimaan T2",
              "BA penerimaan T3",
              "BA penerimaan T4",
            ].map((r) => (
              <CheckRow
                key={r}
                id={`receipt-${testId(r)}`}
                label={`Dokumen pendukung ${r.replace("BA penerimaan ", "Termin ")} tercatat (lokal)`}
                checked={state.acceptance.partialReceipts.includes(r)}
                onChange={(v) => toggleReceipt(r, v)}
              />
            ))}
          </Panel>
          <Panel title="Keputusan penerimaan akhir" icon={BadgeCheck}>

            {semesterTwoApplies(state)&&<CheckRow
              id="acceptance-semester-two"
              label="Revalidasi IRI Semester II selesai"
              checked={state.acceptance.semesterTwoRevalidation}
              onChange={toggleSemesterTwo}
            />}
            <Field label="Review PIC Balai">
              <Select
                id="select-acceptance-decision"
                value={
                  draft.acceptanceDecision ??
                  state.acceptance.acceptanceDecision ??
                  "Belum Diperiksa"
                }
                options={["Belum Diperiksa", "Diterima", "Diterima dengan Catatan", "Ditolak"]}
                onChange={(v) => saveText("acceptanceDecision", v)}
              />
            </Field>
            {(draft.acceptanceDecision ?? state.acceptance.acceptanceDecision) === 'Diterima dengan Catatan' && <Field label="Catatan penerimaan" full><textarea data-testid="input-acceptance-review-note" value={draft.acceptanceReviewNote??state.acceptance.acceptanceReviewNote??''} onChange={e=>saveText('acceptanceReviewNote',e.target.value)} placeholder="Tuliskan catatan yang harus ditindaklanjuti."/></Field>}
            {(draft.acceptanceDecision ?? state.acceptance.acceptanceDecision) === 'Ditolak' && <Field label="Alasan penolakan" full>
              <textarea
                data-testid="input-acceptance-rejection"
                value={
                  draft.acceptanceRejectionReason ??
                  state.acceptance.acceptanceRejectionReason ??
                  ""
                }
                onChange={(e) =>
                  saveText("acceptanceRejectionReason", e.target.value)
                }
                placeholder="Uraikan ketidaksesuaian dan tindak lanjut."
              />
            </Field>}
            <Field label="Nomor / referensi BA penerimaan akhir">
              <input
                data-testid="input-final-acceptance-ba"
                value={
                  draft.finalAcceptanceBa ??
                  state.acceptance.finalAcceptanceBa ??
                  ""
                }
                onChange={(e) => saveText("finalAcceptanceBa", e.target.value)}
              />
            </Field>
            <div className="stage6-decision-gates" aria-label="Kesiapan keputusan">
              <span>Kriteria: {acceptanceCriteriaReady?'Lengkap':'Belum lengkap'}</span>
              <span>Audit: {allAuditsPassed?'Lulus':'Belum lengkap'}</span>
              <span>Temuan: {state.corrections.filter(item=>item.status!=='Ditutup').length} terbuka</span>
              <span>Penyerahan: {handoverLinkProblems(state.project.id, state.project.surveyTypes, readLocal<HandoverRecord[]>(stage6HandoverKey(state.project.id), [])).length === 0 ? 'Sudah diperiksa' : 'Belum lengkap'}</span>
            </div>
            <Button
              id="button-final-acceptance"
              kind="primary"
              onClick={saveAcceptanceDecision}
            >
              {state.acceptance.finalAcceptance&&!formIssues.length
                ? "Penerimaan akhir tercatat"
                : "Simpan keputusan penerimaan"}
            </Button>
          </Panel></>}
        </section> : (activeTab === "overview" &&
          <Panel title="Hasil penerimaan Balai" icon={BadgeCheck}>
            <dl className="v2-decision-facts">
              <dt>Keputusan</dt>
              <dd>{state.acceptance.acceptanceDecision || "Belum diperiksa"}</dd>
              <dt>Referensi BA akhir</dt>
              <dd>{state.acceptance.finalAcceptanceBa || "Belum tercatat"}</dd>
              <dt>Referensi penerimaan yang tercatat</dt>
              <dd>{state.acceptance.partialReceipts.join(", ") || "Belum tercatat"}</dd>
              {semesterTwoApplies(state) && <>
                <dt>Revalidasi IRI Semester II</dt>
                <dd>{state.acceptance.semesterTwoRevalidation ? "Tercatat selesai" : "Belum selesai"}</dd>
              </>}
            </dl>
          </Panel>
        )}
      </div>
      {activeTab === "documents" && <Panel title="Berita Acara Penerimaan Data" icon={FileText}>
        <div className="stage6-ba-picker">
          <label>Jenis survei untuk BA
            <select value={surveyFocus} onChange={e=>setSurveyFocus(e.target.value as SurveyType)}>
              {state.project.surveyTypes.map(type=><option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <div>{baAccess('penerimaan', isBalai ? 'Buka BA penerimaan' : 'Lihat BA penerimaan', 0, {survey:surveyFocus})}</div>
        </div>
        {state.project.surveyTypes.length===0 && <p className="stage6-empty">Belum ada survei dalam paket.</p>}
      </Panel>}
      {activeTab === "overview" && state.acceptance.acceptanceReviewNote&&<div className="review-note"><strong>Catatan penerimaan tersimpan</strong><p>{state.acceptance.acceptanceReviewNote}</p></div>}
      {activeTab === "overview" && state.acceptance.acceptanceRejectionReason&&<div className="review-note important"><strong>Alasan / hasil review penerimaan tersimpan</strong><p>{state.acceptance.acceptanceRejectionReason}</p><button type="button" className="wf-button" onClick={()=>onNavigate('/actions:Koreksi berbukti')}>Lihat tindak lanjut</button></div>}
      {activeTab === "overview" && <BalaiDecisionHistory state={state} stage="Tahap 6"/>}
      {activeTab === 'overview' && <Stage6DirectorateNotes packageId={state.project.id} role={state.role} principalId={props.principalId}/>}
    </>
  );
}
