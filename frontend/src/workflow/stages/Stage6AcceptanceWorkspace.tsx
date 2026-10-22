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
import { useState } from "react";

import {
  ACCEPTANCE_CRITERIA,
  AcceptanceCriteriaPanel,
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
import { STAGE6_ROLE_GUIDANCE } from "../workflowConfig";

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
  const finalReady = !formIssues.length &&
    state.acceptance.terms.every(
      (t) =>
        t.complete &&
        state.acceptance.partialReceipts.includes(`BA penerimaan ${t.id}`),
    ) &&
    !semesterErrors.length &&
    (!semesterTwoApplies(state)||state.acceptance.semesterTwoRevalidation) &&
    state.acceptance.finalReport &&
    allAuditsPassed &&
    !state.corrections.some((item) => item.status !== "Ditutup") &&
    acceptanceCriteriaReady;
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
      "Belum Diperiksa") as "Belum Diperiksa" | "Diterima" | "Ditolak";
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
    if (decision !== "Diterima") {
      setNotice("Pilih keputusan Diterima atau Ditolak.");
      return;
    }
    const pendingForms=workflowFormIssues(state);if(pendingForms.length){setNotice(`Penerimaan tertahan: ${pendingForms.slice(0,3).map(issue=>issue.message).join(" ")}`);return;}
    if (!finalReady) {
      setNotice(
        "Penerimaan akhir tertahan oleh kriteria penerimaan, termin, BA, audit, revalidasi, laporan akhir, atau kasus koreksi terbuka.",
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
          acceptanceDecision: "Diterima",
          acceptanceRejectionReason: "",
          finalAcceptance: true,
          finalAcceptanceBa:
            draft.finalAcceptanceBa ||
            s.acceptance.finalAcceptanceBa ||
            `BA-AKHIR-${s.simulationDate}`,
        },
      }),
      "Penerimaan akhir dan referensi BA dicatat.",
    );
  };
  return (
    <>
      {heading(
        "Tahap 6 · penerimaan",
        "Penerimaan data & termin",
        "Catat penerimaan parsial dan progres T1–T4. Penerimaan akhir menunggu seluruh termin, audit berjenjang, revalidasi Semester II dan laporan akhir.",
      )}

      <div className="wf-callout" style={{ marginBottom: 12 }}>
        <strong>{state.role}:</strong> {STAGE6_ROLE_GUIDANCE[state.role]}
      </div>

      {state.project.surveyTypes.includes('Lendutan')&&<RoleWorkSection primary={state.role==='PIC Balai / Pengguna Jasa'} title="Pemeriksaan penerimaan Lendutan"><SourceDocumentChecklist packageId={state.project.id} phase="acceptance" surveyTypes={['Lendutan']} role={state.role} editableRoles={['PIC Balai / Pengguna Jasa']} projectInfo={state.project} hideSurveySelector/></RoleWorkSection>}
      <Panel title="Dokumen & Lampiran Penerimaan" icon={FileText}>
        <div className="stage-evidence-grid">
          <DocumentAttachments title="Laporan akhir · Penyedia" scope={`${state.project.id}:stage6-report`} categories={['Laporan akhir']} legacyEvidenceIds={['stage6-final-report']} editable={state.role==='Penyedia Jasa / Ketua Tim'}/>
          <DocumentAttachments title="BA penerimaan · Balai" scope={`${state.project.id}:stage6-acceptance`} categories={['Berita Acara Penerimaan']} legacyEvidenceIds={['stage6-final-acceptance-ba']} editable={state.role==='PIC Balai / Pengguna Jasa'}/>
        </div>

        {state.role === "Direktorat / Pusat" && (
          <div className="wf-note" style={{ marginTop: 8 }}>
            Direktorat / Pusat memonitor hasil audit dan penerimaan secara
            read-only.
          </div>
        )}
      </Panel>
      <div className="wf-kpis">
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
      </div>
      {semesterTwoApplies(state)&&<Panel
        title="Siklus ulang IRI Semester II — bukti terpisah"
        icon={RotateCcw}
      >
        <div className="wf-callout">
          Kalibrasi ulang → validasi ulang → survei IRI → upload VALID
          (minggu ke-3 November) → sanggah (minggu ke-4 November). Bukti
          Semester I tidak dianggap bukti Semester II.{" "}
        </div>
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
            label="Upload IRI Semester II VALID"
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
        <div
          className={`wf-callout ${semesterErrors.length ? "warn" : ""}`}
          data-testid="semester-two-gate"
        >
          {semesterErrors.join(" · ") ||
            "Bukti siklus Semester II lengkap; Pengguna Jasa dapat menyetujui revalidasi."}
        </div>
        {semesterEvidence.uploadDate > "2027-11-21" && (
          <div className="wf-callout warn">
            Upload melewati minggu ke-3 November; keterlambatan tetap dicatat,
            bukan disembunyikan.
          </div>
        )}
      </Panel>}
      <RoleWorkSection primary={state.role==="Penyedia Jasa / Ketua Tim"} title="Laporan akhir Penyedia"><Panel title="Laporan akhir" icon={FileText}><Field label="Referensi laporan akhir"><input data-testid="input-semester-two-finalReportReference" disabled={state.role!=="Penyedia Jasa / Ketua Tim"} value={semesterEvidence.finalReportReference} onChange={e=>updateSemesterEvidence({finalReportReference:e.target.value})}/></Field>            <CheckRow
              id="acceptance-final-report"
              label="Laporan akhir tersedia"
              disabled={state.role !== "Penyedia Jasa / Ketua Tim"}
              checked={state.acceptance.finalReport}
              onChange={toggleFinalReport}
            />
</Panel></RoleWorkSection>
      <div className={`wf-grid ${state.role==="PIC Balai / Pengguna Jasa"?'acceptance-review-first':''}`}>
        <RoleWorkSection primary={state.role==="Penyedia Jasa / Ketua Tim"} title="Termin dan progres Penyedia"><Panel title="Termin kontrak TA 2027" icon={FileCheck2}>
          <div className="wf-table">
            <table data-testid="table-acceptance-terms">
              <thead>
                <tr>
                  <th>Termin</th>
                  <th>Milestone</th>
                  <th>Bobot</th>
                  <th>Jatuh tempo</th>
                  <th>Progres</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {state.acceptance.terms.map((term) => (
                  <tr key={term.id} data-testid={`row-term-${term.id}`}>
                    <td>
                      <strong>{term.id}</strong>
                    </td>
                    <td>
                      {term.milestone}
                      <Field label="Catatan">
                        <input
                          data-testid={`input-term-note-${term.id}`}
                          disabled={state.role !== "Penyedia Jasa / Ketua Tim"}
                          value={acceptDraft[`${term.id}-note`] ?? term.note}
                          onChange={(e) =>
                            setAcceptDraft((d) => ({
                              ...d,
                              [`${term.id}-note`]: e.target.value,
                            }))
                          }
                        />
                      </Field>
                    </td>
                    <td>{term.percentage}%</td>
                    <td>
                      <input
                        type="date"
                        data-testid={`input-term-date-${term.id}`}
                        disabled={state.role !== "Penyedia Jasa / Ketua Tim"}
                        value={acceptDraft[`${term.id}-date`] ?? term.dueDate}
                        onChange={(e) =>
                          setAcceptDraft((d) => ({
                            ...d,
                            [`${term.id}-date`]: e.target.value,
                          }))
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        data-testid={`input-term-progress-${term.id}`}
                        disabled={state.role !== "Penyedia Jasa / Ketua Tim"}
                        value={
                          acceptDraft[`${term.id}-progress`] ??
                          String(term.complete ? 100 : (term.progress ?? 0))
                        }
                        onChange={(e) =>
                          setAcceptDraft((d) => ({
                            ...d,
                            [`${term.id}-progress`]: e.target.value,
                          }))
                        }
                      />
                      %
                    </td>
                    <td>
                      <div className="wf-toolbar">
                        <Badge tone={term.complete ? "good" : "warn"}>
                          {term.complete ? "Selesai" : "Berjalan"}
                        </Badge>
                        <button
                          className="wf-button"
                          data-testid={`button-save-term-${term.id}`}
                          disabled={state.role !== "Penyedia Jasa / Ketua Tim"}
                          onClick={() => {
                            const progress = Number(
                              acceptDraft[`${term.id}-progress`] ??
                                (term.complete ? 100 : (term.progress ?? 0)),
                            );
                            if (
                              !Number.isFinite(progress) ||
                              progress < 0 ||
                              progress > 100
                            ) {
                              setNotice(
                                "Progres termin harus antara 0% dan 100%.",
                              );
                              return;
                            }
                            updateTerm(
                              term.id,
                              {
                                progress,
                                complete: progress >= 100,
                                note:
                                  acceptDraft[`${term.id}-note`] ?? term.note,
                                dueDate:
                                  acceptDraft[`${term.id}-date`] ??
                                  term.dueDate,
                              },
                              `Perbarui termin ${term.id}`,
                            );
                          }}
                        >
                          Simpan
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel></RoleWorkSection>
        <RoleWorkSection primary={state.role==="PIC Balai / Pengguna Jasa"} title="Pemeriksaan dan keputusan penerimaan Balai"><div>
          <Panel title="Kriteria penerimaan data" icon={ClipboardCheck}>
            <AcceptanceCriteriaPanel
              values={acceptanceCriteria}
              readOnly={state.role !== "PIC Balai / Pengguna Jasa"}
              onChange={updateAcceptanceCriterion}
            />
          </Panel>
          <Panel title="BA penerimaan parsial / bertahap" icon={ClipboardCheck}>
            <div className="wf-callout">
              PIC Balai / Pengguna Jasa mencatat BA penerimaan secara
              parsial/bertahap sesuai data yang telah selesai diperiksa dan
              diterima.
            </div>
            {[
              "BA penerimaan T1",
              "BA penerimaan T2",
              "BA penerimaan T3",
              "BA penerimaan T4",
            ].map((r) => (
              <CheckRow
                key={r}
                id={`receipt-${testId(r)}`}
                label={r}
                disabled={state.role !== "PIC Balai / Pengguna Jasa"}
                checked={state.acceptance.partialReceipts.includes(r)}
                onChange={(v) => toggleReceipt(r, v)}
              />
            ))}
          </Panel>
          <Panel title="Laporan & keputusan penerimaan" icon={BadgeCheck}>

            {semesterTwoApplies(state)&&<CheckRow
              id="acceptance-semester-two"
              label="Revalidasi IRI Semester II selesai"
              disabled={state.role !== "PIC Balai / Pengguna Jasa"}
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
                options={["Belum Diperiksa", "Diterima", "Ditolak"]}
                disabled={state.role !== "PIC Balai / Pengguna Jasa"}
                onChange={(v) => saveText("acceptanceDecision", v)}
              />
            </Field>
            <Field label="Alasan penolakan (wajib bila Ditolak)" full>
              <textarea
                data-testid="input-acceptance-rejection"
                disabled={state.role !== "PIC Balai / Pengguna Jasa"}
                value={
                  draft.acceptanceRejectionReason ??
                  state.acceptance.acceptanceRejectionReason ??
                  ""
                }
                onChange={(e) =>
                  saveText("acceptanceRejectionReason", e.target.value)
                }
                placeholder="Uraikan ketidaksesuaian dan tindak lanjut yang diperlukan."
              />
            </Field>
            <Field label="Nomor / referensi BA penerimaan akhir">
              <input
                data-testid="input-final-acceptance-ba"
                disabled={state.role !== "PIC Balai / Pengguna Jasa"}
                value={
                  draft.finalAcceptanceBa ??
                  state.acceptance.finalAcceptanceBa ??
                  ""
                }
                onChange={(e) => saveText("finalAcceptanceBa", e.target.value)}
              />
            </Field>
            <div className="wf-callout" style={{ marginTop: 8 }}>
              Kriteria penerimaan:{" "}
              {acceptanceCriteriaReady ? "Lengkap" : "Belum lengkap"} · Audit
              seluruh tingkat:{" "}
              {allAuditsPassed ? "Lulus" : "Belum seluruhnya lulus"} · kasus
              koreksi terbuka:{" "}
              {
                state.corrections.filter((item) => item.status !== "Ditutup")
                  .length
              }{" "}
              · penerbit BA: PIC Balai / Pengguna Jasa
            </div>
            {state.role === "Direktorat / Pusat" && (
              <div className="wf-callout" style={{ marginTop: 8 }}>
                Direktorat / Pusat memonitor hasil Audit Tingkat 3 dan status
                penerimaan. Keputusan penerimaan/BA dicatat oleh PIC Balai /
                Pengguna Jasa.
              </div>
            )}
            <Button
              id="button-final-acceptance"
              kind="primary"
              disabled={state.role !== "PIC Balai / Pengguna Jasa"}
              onClick={saveAcceptanceDecision}
            >
              {state.acceptance.finalAcceptance&&!formIssues.length
                ? "Penerimaan akhir tercatat"
                : "Simpan keputusan penerimaan"}
            </Button>
          </Panel>
        </div></RoleWorkSection>
      </div>
      <details className="stage-document-details"><summary>Dokumen hasil pemeriksaan · Berita Acara Penerimaan Data</summary>
      <Panel title="Berita Acara Penerimaan Data" icon={FileText}>
        <p className="wf-note">
          BA mengikuti keputusan dan data yang sudah diperiksa, dengan para
          pihak sesuai format sumber.
        </p>
        {baAccess("penerimaan", "Susun BA Penerimaan")}
      </Panel>
      </details>
    </>
  );
}
