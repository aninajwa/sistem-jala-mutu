import {evaluateStageGate} from '../workflowGate';
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
  FileText,
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
  Select,
  testId,
} from "./stageSupport";
import { useWorkflowStage } from "./useWorkflowStage";

export function Stage2ProductionWorkspace(props: WorkflowStageProps) {
  const { selection, state, onUpdate, setNotice, onNavigate } = props;
  const { baAccess, commit, heading } = useWorkflowStage(props);
  const [draft,setDraft]=usePersistedDraft<Record<string,string>>(`jala-ui-draft:${state.project.id}:${state.role}:Stage2ProductionWorkspace`,{});
  const [prodType, setProdType] = useState<SurveyType>(state.project.surveyTypes[0]??"IRI");
  const [caseId, setCaseId] = useCorrectionSelection(state.project.id);
  const test = state.productionTests[prodType];
  const evaluation = evaluateProductionTest(prodType, test);
  const saveText = (key: string, value: string) =>
    setDraft((old) => ({ ...old, [key]: value }));

  const canEnterProduction = state.role === "Penyedia Jasa / Ketua Tim";
  const canReviewProduction = state.role === "PIC Balai / Pengguna Jasa";

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
        (type !== "PCI" || state.productionTests.PCI.pciManual !== false) &&
        evaluateProductionTest(type, state.productionTests[type]).passed,
    );
  const calibrationReady=evaluateStageGate(state,'Tahap 1').readyToComplete;
  const reviewBlockers=productionReviewBlockers(state);
  const reviewReady=reviewBlockers.length===0;
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
      state.productionApproval !== "Diajukan" &&
      state.productionApproval !== "Perlu Revisi"
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
    const ba =
      decision === "Disetujui"
        ? draft.methodBa || state.productionApprovalBa || ""
        : state.productionApprovalBa;
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
  return (
    <>
      {heading(
        "Tahap 2 · validasi produksi",
        "Validasi Produksi Data / Uji Coba",
        "Data hasil uji diperiksa otomatis terhadap ketentuan QA/QC. Penyedia melengkapi bukti yang belum tersedia, kemudian PIC Balai melakukan review.",
      )}
      <Panel title="Dokumen Hasil Uji & Persetujuan" icon={FileText}>
        <p className="wf-note">
          BA Kalibrasi dan Validasi disusun dari hasil Tahap 1–2. Persetujuan
          alat/metode diterbitkan setelah hasil uji ditinjau dan disetujui
          Pengguna Jasa.
        </p>
        <div className="wf-toolbar">
          {baAccess("kalibrasi", "Lihat BA Kalibrasi (dokumen Tahap 1)")}
        </div>
        <div className="wf-callout" style={{ marginTop: 10 }}>
          <strong>Persetujuan Alat & Metode: {state.productionApproval==='Disetujui'&&!reviewReady?'Keputusan terdahulu · perlu pemeriksaan ulang':state.productionApproval}</strong>
          <div>
            {state.productionApproval === "Disetujui"
              ? `Referensi: ${state.productionApprovalBa || "Belum dicatat"}`
              : "Belum ada persetujuan. Dokumen persetujuan tidak boleh diterbitkan sebelum review lulus."}
          </div>
        </div>
      </Panel>
      <Panel
        title="Jenis Survei yang Diperiksa"
        icon={Gauge}
        extra={
          <Badge tone={evaluation.passed ? "good" : "warn"}>
            {evaluation.passed ? "Sesuai" : "Perlu pemeriksaan"}
          </Badge>
        }
      >
        <div className="wf-toolbar">
          {scopedTypes.map((type) => (
            <button
              key={type}
              data-testid={`button-production-type-${testId(type)}`}
              className={`wf-button ${prodType === type ? "primary" : ""}`}
              onClick={() => setProdType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="wf-note" style={{ marginTop: 8 }}>
          Jenis survei aktif: <strong>{prodType}</strong>
        </div>
      </Panel>

      {reviewBlockers.length>0&&<details className="wf-callout warn"><summary>Pengajuan / persetujuan tertahan · {reviewBlockers.length} persyaratan</summary><ul>{reviewBlockers.map(reason=><li key={reason}>{reason}</li>)}</ul><div className="wf-toolbar"><button className="wf-button" onClick={()=>onNavigate('/entry:Persiapan & SPMK')}>Buka persiapan</button><button className="wf-button" onClick={()=>onNavigate('/documents:Kalibrasi & personel')}>Buka kalibrasi</button></div></details>}
      {prodType === "PCI" && test.pciManual === false && <div className="wf-callout warn">PCI AI tersedia untuk pencatatan dan evaluasi KAK. Keputusan operasional AI belum terverifikasi terhadap arahan mentor terbaru; pengajuan/persetujuan metode tetap tertahan.</div>}
      <RoleWorkSection primary={canEnterProduction} title="Formulir dan pemeriksaan Penyedia">
      <ProductionValidationChecklist
        type={prodType}
        test={test}
        editable={canEnterProduction && !sourceIsSynced}
        onUpdate={updateField}
      />

      </RoleWorkSection>
      <div className={`production-workspace-columns ${canEnterProduction?'':'review-first'}`}>
        <div className="production-column"><RoleWorkSection primary={canEnterProduction} title="Data dan bukti uji Penyedia">
          <Panel title="Data Hasil Uji" icon={Archive}>
            <div className="workflow-data-origin">
              <div><strong>{sourceModeLabel}</strong><span>{origin.detail}</span></div>
            </div>
            <div className="wf-fields">
              <Field label="Sumber data hasil uji">
                {canEnterProduction?<select data-testid="select-production-source-mode" value={sourceIsImport?'Lampiran / bukti kegiatan':sourceIsManual&&['Pencatatan manual','Input manual fallback'].includes(test.sourceMode??'')?'Pencatatan manual':'Lokal tersimpan'} onChange={event=>updateField('sourceMode',event.target.value as ProductionTest['sourceMode'])}>
                  <option value="Lokal tersimpan" disabled>Data lokal tersimpan</option><option>Lampiran / bukti kegiatan</option><option>Pencatatan manual</option>
                </select>:<output>{sourceModeLabel}</output>}
              </Field>
              <EvidenceField label="Referensi hasil uji" value={test.evidenceReference??''} onChange={value=>updateField('evidenceReference',value)} disabled={!canEnterProduction} helper="Nomor atau referensi dokumen; keberadaan berkas diperiksa pada Dokumen & Lampiran."/>
            </div>
            {sourceIsManual && (
              <Field label="Alasan pencatatan manual" full>
                <textarea
                  value={String(test.productionDetails?.fallbackReason ?? "")}
                  onChange={(event) =>
                    updateField("productionDetails", {
                      ...test.productionDetails,
                      fallbackReason: event.target.value,
                    })
                  }
                  placeholder="Contoh: integrasi sistem sumber belum tersedia / data uji belum dapat disinkronkan."
                />
              </Field>
            )}

            <DocumentAttachments scope={`${state.project.id}:production-${prodType}`} categories={['Bukti pendukung uji coba']} legacyEvidenceIds={[`production-trial-${prodType}`]} editable={canEnterProduction}/>
          </Panel>

          <Panel
            title="Status Jenis Survei dalam Paket"
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
                    {result.passed ? "Sesuai" : "Tertahan"}
                  </Badge>
                </div>
              );
            })}

            <GateSummary
              title="Kesiapan menuju Pelaksanaan Survei"
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
                  label: "Review PIC Balai selesai",
                  ready: state.productionApproval === "Disetujui" && reviewReady,
                  detail: state.productionApproval,
                },
              ]}
            />
          </Panel>

          {sourceIsManual && prodType === "IRI" && (
            <details
              className="wf-panel production-helper"
              data-testid="production-calculator-optional"
            >
              <summary className="wf-panel-head" style={{ cursor: "pointer" }}>
                <h3>
                  <Gauge size={14} />
                  Alat bantu manual
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
          <Panel title="Hasil Pemeriksaan Otomatis" icon={CheckCircle2}>
            <div className="workflow-data-origin">
              <span className="origin-badge system">HASIL SISTEM</span>

              <div>
                <strong>Pemeriksaan otomatis JALA MUTU</strong>
                <span>
                  Data hasil uji dibandingkan dengan ketentuan QA/QC. Hasil
                  sistem bukan pengganti keputusan reviewer.
                </span>
              </div>
            </div>

            <ValidationResultTable
              rows={evaluation.checks.map((check) => ({
                label: check.label,
                actual: check.actual,
                requirement: "Ketentuan QA/QC",
                pass: check.pass,
                source: test.sourceMode ?? "Import/evidence",
              }))}
            />

            <div className="wf-toolbar" style={{ marginTop: 12 }}>
              <Badge tone={evaluation.passed ? "good" : "bad"}>
                {evaluation.passed ? "Sesuai" : "Ditemukan ketidaksesuaian"}
              </Badge>

              {!evaluation.passed && (
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
                <small>CATATAN REVIEW</small>
                <strong>
                  {state.productionApproval === "Perlu Revisi"
                    ? "Perlu perbaikan"
                    : "Catatan PIC Balai"}
                </strong>
                <p>{state.productionApprovalNote}</p>
              </div>
            )}

          {state.role === "Penyedia Jasa / Ketua Tim" ? (
            <Panel
              title="Pengajuan ke PIC Balai"
              icon={FileCheck2}
              extra={
                <Badge
                  tone={
                    state.productionApproval === "Disetujui"
                      ? "good"
                      : state.productionApproval === "Perlu Revisi"
                        ? "bad"
                        : "warn"
                  }
                >
                  {state.productionApproval}
                </Badge>
              }
            >
              <div className="workflow-data-origin">
                <span className="origin-badge provider">INPUT PENYEDIA</span>
                <div>
                  <strong>Ajukan hasil validasi produksi</strong>

                  <span>
                    Pengajuan dapat dikirim setelah seluruh jenis survei dalam
                    lingkup memenuhi pemeriksaan Tahap 2. PIC Balai kemudian
                    meninjau data, bukti, dan hasil pemeriksaan sistem.
                  </span>
                </div>
              </div>

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
                  placeholder="Contoh: uji coba seluruh jenis survei telah dilaksanakan dan bukti pendukung telah dilengkapi."
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
                    ? "Menunggu Review"
                    : "Ajukan untuk Review"}
                </Button>
              </div>
            </Panel>
          ) : state.role === "PIC Balai / Pengguna Jasa" ? (
            <Panel
              title="Review PIC Balai"
              icon={FileCheck2}
              extra={
                <Badge
                  tone={
                    state.productionApproval === "Disetujui"
                      ? "good"
                      : state.productionApproval === "Perlu Revisi"
                        ? "bad"
                        : "warn"
                  }
                >
                  {state.productionApproval}
                </Badge>
              }
            >
              <div className="workflow-data-origin">
                <span className="origin-badge reviewer">REVIEW BALAI</span>

                <div>
                  <strong>Keputusan reviewer</strong>
                  <span>
                    Checklist, data hasil uji, dan hasil pemeriksaan sistem
                    dibaca sebagai bahan review.
                  </span>
                </div>
              </div>

              <Field label="Jenis survei yang diperiksa"><Select id="select-production-review-survey" value={prodType} options={scopedTypes} onChange={value=>setProdType(value as SurveyType)}/></Field>
              <p className="wf-note">Keputusan metode berlaku untuk lingkup paket. Pemilih jenis survei membuka hasil yang diperiksa.</p>
              {state.productionApproval!=='Diajukan'&&state.productionApproval!=='Perlu Revisi'&&<p role="status">{state.productionApproval==='Disetujui'?'Keputusan sebelumnya sudah tercatat. Perubahan hasil harus diajukan kembali.':'Menunggu pengajuan hasil oleh Penyedia.'}</p>}
              <div className="wf-fields">
                <Field label="Referensi BA">
                  <input
                    data-testid="input-production-approval-ba"
                    value={draft.methodBa ?? state.productionApprovalBa}
                    onChange={(e) => saveText("methodBa", e.target.value)}
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
                    onChange={(event) =>
                      saveText("reviewerProductionNote", event.target.value)
                    }
                    placeholder="Tuliskan hasil review, klarifikasi, atau alasan perbaikan."
                  />
                </Field>
              </div>

              <div className="wf-toolbar" style={{ marginTop: 10 }}>
                <Button
                  id="button-production-request-revision"
                  kind="danger"
                  disabled={
                    state.productionApproval !== "Diajukan" &&
                    state.productionApproval !== "Perlu Revisi"
                  }
                  onClick={() => decideReview("Perlu Revisi")}
                >
                  Minta Perbaikan
                </Button>

                <Button
                  id="button-production-approve-method"
                  disabled={
                    !reviewReady || !['Diajukan','Perlu Revisi'].includes(state.productionApproval)
                  }
                  onClick={() => decideReview("Disetujui")}
                >
                  <Check size={13} />
                  Setujui
                </Button>
              </div>

              {state.productionApprovalBa && (
                <div className="wf-callout" style={{ marginTop: 9 }}>
                  Referensi BA: <strong>{state.productionApprovalBa}</strong>
                </div>
              )}
            </Panel>
          ) : (
            <Panel title="Status Review" icon={ShieldCheck}>
              <div className="workflow-data-origin">
                <span className="origin-badge monitoring">MONITORING</span>
                <div>
                  <strong>Read-only</strong>
                  <span>
                    Peran ini dapat melihat hasil sistem dan keputusan PIC Balai
                    tanpa mengubah pengajuan.
                  </span>
                </div>
              </div>

              <div className="wf-row">
                <span>Status review</span>
                <Badge
                  tone={
                    state.productionApproval === "Disetujui"
                      ? "good"
                      : state.productionApproval === "Perlu Revisi"
                        ? "bad"
                        : "warn"
                  }
                >
                  {state.productionApproval}
                </Badge>
              </div>

              {state.productionApprovalBa && (
                <div className="wf-row">
                  <span>Referensi BA</span>
                  <strong>{state.productionApprovalBa}</strong>
                </div>
              )}
            </Panel>
          )}

          {scopedTypes.includes("Jembatan") && (
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
      </div>
    </>
  );
}
