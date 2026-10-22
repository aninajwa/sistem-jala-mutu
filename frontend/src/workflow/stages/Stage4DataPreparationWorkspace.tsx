import {DocumentAttachments} from '../DocumentAttachments';
import {sourceInspectionStatus} from '../repository/sourceChecklistRepository';
import {RoleWorkSection} from '../RoleWorkSection';
import {stagedFallbackReviewReady,stagedSurveyReviewMode} from '../stagedReviewPolicy';
import {
  Archive,
  ArrowRight,
  BookOpen,
  Check,
  ClipboardCheck,
  FileText,
  MapPinned,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useCorrectionSelection } from "./useCorrectionSelection";

import { fieldReadiness } from "../flowRules";
import {
  evaluateLrsGate,
  SUBMISSION_DOCUMENTS,
  SubmissionState,
} from "../model";
import { SourceAlignmentChecklist } from "../SourceAlignmentChecklist";
import { GateSummary } from "../WorkflowComponents";
import { STAGE4_ROLE_GUIDANCE } from "../workflowConfig";

import type { WorkflowStageProps } from "./stageSupport";
import {
  Badge,
  Button,
  CheckRow,
  defaultCase,
  Field,
  Panel,
  Select,
  SYSTEM_TARGET_ORDER,
  systemsByType,
  testId,
} from "./stageSupport";
import { useWorkflowStage } from "./useWorkflowStage";

export function Stage4DataPreparationWorkspace(props: WorkflowStageProps) {
  const { selection, state, onUpdate, setNotice, onNavigate } = props;
  const { baAccess, commit, updateSubmission, heading } =
    useWorkflowStage(props);
  const [caseId, setCaseId] = useCorrectionSelection(state.project.id);
  const lrs = evaluateLrsGate(state.submission, state.simulationDate);

  const canPrepare = state.role === "Penyedia Jasa / Ketua Tim";
  const documentItems = [...SUBMISSION_DOCUMENTS];
  const docsPassed = documentItems.every(
    (x) => state.submission.requiredDocuments[x],
  );
  const requiredTargets = SYSTEM_TARGET_ORDER.filter((system) =>
    state.project.surveyTypes.some((type) => systemsByType[type] === system),
  );
  const targetAssignments = requiredTargets.map((system) => ({
    system,
    types: state.project.surveyTypes.filter(
      (type) => systemsByType[type] === system,
    ),
  }));
  const targetsPassed = requiredTargets.length > 0;
  const packageReferenced =
    !!state.submission.rawFileName.trim() &&
    !!state.submission.cleanedFileName.trim();
  const fieldErrors = fieldReadiness(state);
  const preAuditReady =
    !fieldErrors.length && lrs.passed && docsPassed && packageReferenced;
  const pciManual=state.productionTests.PCI.pciManual!==false;
  const stagedHasSource=(type:(typeof state.project.surveyTypes)[number])=>stagedSurveyReviewMode(type,pciManual)==='source-form';
  const stagedSourceTypes=state.project.surveyTypes.filter(stagedHasSource);
  const stagedFallbackTypes=state.project.surveyTypes.filter(type=>!stagedHasSource(type));
  const stagedTypeReady=(type:(typeof state.project.surveyTypes)[number])=>stagedHasSource(type)
    ?sourceInspectionStatus(state.project.id,type,'staged',pciManual,state.project).complete
    :stagedFallbackReviewReady(state,type);
  const stagedFormsReady=state.project.surveyTypes.length>0&&state.project.surveyTypes.every(stagedTypeReady);
  const readyToSubmit =
    stagedFormsReady && preAuditReady &&
    state.audits[0].status === "Lulus" &&
    !state.audits[0].requiresReview &&
    targetsPassed;
  const updateReq = (key: string, value: boolean) =>
    updateSubmission(
      {
        requiredDocuments: {
          ...state.submission.requiredDocuments,
          [key]: value,
        },
      },
      "Periksa dokumen mutu",
    );
  const validate = () => {
    if (!canPrepare) {
      setNotice(
        "Penyiapan dan penyerahan paket data dilakukan oleh Penyedia Jasa / Ketua Tim.",
      );
      return;
    }
    if (!state.project.surveyTypes.every(stagedTypeReady)) {setNotice("Pemeriksaan V&V bertahap oleh PIC Balai belum lengkap.");return;}
    if (!readyToSubmit) {
      setNotice(
        "Penyerahan masih tertahan. Pastikan Tahap 3 selesai, dokumen mutu lengkap, gerbang RNI/LRS lulus, paket data tersedia, Audit Tingkat 1 lulus, dan tujuan sistem sesuai jenis survei.",
      );
      return;
    }
    const result = evaluateLrsGate(state.submission, state.simulationDate);
    if (!result.passed) {
      setNotice(
        "Gerbang RNI/LRS belum lulus. Tindak lanjuti ketidaksesuaian sebelum penyerahan.",
      );
      return;
    }
    const destination = requiredTargets.join(", ");
    updateSubmission(
      {
        targetSystems: requiredTargets,
        validationStatus: "VALID",
        validationMessage: `Paket data siap diteruskan ke ${destination}.`,
      },
      "Konfirmasi kesiapan penyerahan",
    );
    setNotice(`Paket data ditandai siap diteruskan ke ${destination}.`);
  };
  const openLrsCase = () => {
    if (
      state.role !== "Penyedia Jasa / Ketua Tim" &&
      state.role !== "PIC Balai / Pengguna Jasa"
    ) {
      setNotice("Peran ini hanya dapat memantau hasil gerbang RNI/LRS.");
      return;
    }
    const existing = state.corrections.find(
      (item) =>
        item.source === "Validasi sistem LRS" && item.status !== "Ditutup",
    );
    if (existing) {
      setCaseId(existing.id);
      setNotice(
        "Kasus RNI/LRS terbuka sudah ada. Lanjutkan pada Tindakan Perbaikan.",
      );
      return;
    }
    const surveyType = state.project.surveyTypes.includes("RNI")
      ? "RNI"
      : state.project.surveyTypes[0] || "IRI";
    const c = defaultCase(state);
    c.source = "Validasi sistem LRS";
    c.blockedStage = "Gerbang RNI/LRS";
    c.returnStage = "Gerbang RNI/LRS";
    c.surveyType = surveyType;
    c.originalValue =
      state.dailyRecords.find((record) => record.surveyType === surveyType)
        ?.rawValue || "Belum ada nilai sumber tertaut";
    c.rejectionReason =
      lrs.checks
        .filter((check) => !check.pass)
        .map((check) => `${check.label}: ${check.actual}`)
        .join(" · ") || "Gerbang RNI/LRS belum memenuhi kriteria";
    commit(
      "Buka kasus koreksi gerbang RNI/LRS",
      c.id,
      (s) => ({ ...s, corrections: [c, ...s.corrections] }),
      "Kasus RNI/LRS dibuka; tindak lanjuti lalu lakukan pemeriksaan ulang",
    );
    setCaseId(c.id);
  };
  const qualityChecks = [
    {
      label: "Format kode & struktur data",
      ready: !!state.submission.formatGlossaryCompliant,
      detail: state.submission.formatGlossaryCompliant
        ? "Sesuai"
        : "Belum dikonfirmasi",
    },
    {
      label: "Koordinat dan ikatan LRS",
      ready: !!state.submission.coordinatesBoundToLrs,
      detail: state.submission.coordinatesBoundToLrs
        ? "Terikat LRS"
        : "Belum lengkap",
    },
    {
      label: "Konsistensi STA antar data",
      ready: state.submission.stationingConsistent,
      detail: state.submission.stationingConsistent
        ? "Konsisten"
        : "Perlu diperiksa",
    },
    {
      label: "Pemisahan data sumber dan data tervalidasi",
      ready: state.submission.rawSeparated && state.submission.cleanedSeparated,
      detail:
        state.submission.rawSeparated && state.submission.cleanedSeparated
          ? "Terpisah"
          : "Belum lengkap",
    },
    {
      label: "Topologi/geometri",
      ready:
        state.submission.topologyErrors === 0 &&
        !!state.submission.geometryFormat,
      detail: state.submission.geometryFormat
        ? `${state.submission.geometryFormat} · ${state.submission.topologyErrors} kesalahan`
        : "Format belum dipilih",
    },
  ];
  const isBalaiReview = state.role === "PIC Balai / Pengguna Jasa";
  const stage4Title = canPrepare
    ? "Penyiapan data & gerbang RNI/LRS"
    : isBalaiReview
      ? "Review kesiapan data & gerbang RNI/LRS"
      : "Monitoring kesiapan data & gerbang RNI/LRS";
  const stage4Detail = canPrepare
    ? "Siapkan paket data, lengkapi dokumen mutu, periksa keterikatan RNI/LRS, lalu teruskan paket ke audit."
    : isBalaiReview
      ? "Tinjau ringkasan kesiapan paket yang disiapkan Penyedia. Perubahan data tetap dilakukan oleh Penyedia sebelum masuk audit."
      : "Pantau status kesiapan paket sebagai konteks sebelum audit/review tingkat pusat.";
  const readinessItems = [
    {
      label: "Tahap 3 selesai",
      ready: fieldErrors.length === 0,
      detail: fieldErrors.length
        ? `${fieldErrors.length} item tahap sebelumnya belum terpenuhi`
        : "Verval dan pemeriksaan tahap sebelumnya lengkap",
    },
    {
      label: "Dokumen mutu lengkap",
      ready: docsPassed,
      detail: `${documentItems.filter((x) => state.submission.requiredDocuments[x]).length}/${documentItems.length} dokumen`,
    },
    {
      label: "Gerbang RNI/LRS",
      ready: lrs.passed,
      detail: lrs.passed ? "Lulus" : "Ada kriteria yang belum terpenuhi",
    },
    {
      label: "Paket data tersedia",
      ready: packageReferenced,
      detail: packageReferenced
        ? "Data sumber & tervalidasi tercatat"
        : "Referensi paket data belum lengkap",
    },
  ];
  const auditGateItems = [
    {
      label: "Penyiapan data lengkap",
      ready: preAuditReady,
      detail: preAuditReady
        ? "Siap diaudit"
        : "Lengkapi gerbang dan paket data",
    },
    {
      label: "Audit Tingkat 1",
      ready:
        state.audits[0].status === "Lulus" && !state.audits[0].requiresReview,
      detail: state.audits[0].status,
    },
    {
      label: "Tujuan sistem sesuai",
      ready: targetsPassed,
      detail: targetsPassed
        ? `${requiredTargets.length} sistem ditetapkan otomatis`
        : "Belum ada jenis survei pada paket",
    },
  ];
  const readOnlyDocRows = documentItems.map((x, i) => (
    <div className="wf-row" key={x} data-testid={`stage4-review-doc-${i}`}>
      <span>{x}</span>
      <Badge tone={state.submission.requiredDocuments[x] ? "good" : "warn"}>
        {state.submission.requiredDocuments[x] ? "Tercatat" : "Belum"}
      </Badge>
    </div>
  ));
  return (
    <>
      {heading("Tahap 4 · penyiapan data", stage4Title, stage4Detail)}

      <div className="wf-callout" style={{ marginBottom: 12 }}>
        <strong>{state.role}:</strong> {STAGE4_ROLE_GUIDANCE[state.role]}
      </div>
      <GateSummary
        title={canPrepare ? "Kesiapan Tahap 4" : "Ringkasan kesiapan paket"}
        items={readinessItems}
      />

      <DocumentAttachments scope={`${state.project.id}:stage4`} categories={['Paket / referensi data sumber','Paket / referensi data tervalidasi','Dokumen mutu pendukung']} legacyEvidenceIds={['stage4-raw-package','stage4-validated-package','stage4-quality-document']} editable={canPrepare}/>
      <div
        className="wf-callout"
        data-testid="stage4-process-guide"
        style={{ marginBottom: 12 }}
      >
        <strong>Urutan kerja:</strong> Penyedia menyiapkan data sumber dan data
        tervalidasi terpisah, melengkapi dokumen mutu, lalu memeriksa gerbang
        RNI/LRS. Setelah audit internal Tingkat 1 dan kesiapan paket terpenuhi,
        status penyerahan dapat dikonfirmasi. Status VALID di sini adalah
        catatan workflow, bukan bukti berhasil unggah ke sistem eksternal.
      </div>
      <RoleWorkSection primary={state.role==="PIC Balai / Pengguna Jasa"} title="Pemeriksaan V&V bertahap Balai">
        {stagedSourceTypes.length>0&&<SourceAlignmentChecklist pciManual={pciManual}
          projectInfo={state.project}
          packageId={state.project.id}
          phase="staged"
          surveyTypes={stagedSourceTypes}
          role={state.role}
          editableRoles={["PIC Balai / Pengguna Jasa"]}
          title="Checklist Verifikasi Data"
        />}
        {stagedFallbackTypes.map(type=>{const review=state.submission.stagedReviews?.[type]??{decision:'Belum Diperiksa' as const,note:'',reviewedAt:''};const editable=state.role==='PIC Balai / Pengguna Jasa';return <div className="wf-callout" key={type} style={{marginTop:10}}>
          <strong>{type} · review bertahap</strong>
          <p className="wf-note">Tidak ada checklist staged khusus {type} pada katalog sumber. Review ini mencatat keputusan V&V bertahap dari kesiapan data dan bukti Tahap 4; tidak membuat checklist metode baru.</p>
          <div className="wf-fields">
            <Field label="Hasil review">
              <Select id={`stage4-staged-review-${testId(type)}`} disabled={!editable} value={review.decision} options={['Belum Diperiksa','Sesuai','Temuan']} onChange={(decision)=>updateSubmission({stagedReviews:{...(state.submission.stagedReviews??{}),[type]:{...review,decision:decision as 'Belum Diperiksa'|'Sesuai'|'Temuan',reviewedAt:decision==='Belum Diperiksa'?'':state.simulationDate}}},`Review V&V bertahap ${type}`)}/></Field>
            <Field label="Catatan review" full><textarea disabled={!editable} rows={2} value={review.note} onChange={(e)=>updateSubmission({stagedReviews:{...(state.submission.stagedReviews??{}),[type]:{...review,note:e.target.value}}},`Catatan V&V bertahap ${type}`)} placeholder="Isi catatan bila ada temuan atau klarifikasi"/></Field>
          </div>
          <Badge tone={review.decision==='Sesuai'?'good':review.decision==='Temuan'?'bad':'warn'}>{review.decision}</Badge>
        </div>;})}
      </RoleWorkSection>

      {canPrepare&&!stagedFormsReady&&<p className="wf-callout warn">Penyerahan menunggu pemeriksaan V&V bertahap PIC Balai. Data dan audit internal tetap dapat disiapkan.</p>}
      {canPrepare ? (
        <div className="wf-grid" style={{ marginTop: 12, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <Panel
              title="Pemeriksaan mutu paket data"
              icon={ClipboardCheck}
              extra={
                <Badge
                  tone={qualityChecks.every((x) => x.ready) ? "good" : "warn"}
                >
                  {qualityChecks.filter((x) => x.ready).length}/
                  {qualityChecks.length}
                </Badge>
              }
            >
              {qualityChecks.map((item, i) => (
                <div
                  className="wf-row"
                  key={item.label}
                  data-testid={`stage4-quality-${i}`}
                >
                  <span>
                    {item.label}
                    <span className="wf-note" style={{ display: "block" }}>
                      {item.detail}
                    </span>
                  </span>
                  <Badge tone={item.ready ? "good" : "warn"}>
                    {item.ready ? "Siap" : "Periksa"}
                  </Badge>
                </div>
              ))}
              <div className="wf-note" style={{ marginTop: 10 }}>
                Pemeriksaan mencakup format, kelengkapan, keterikatan spasial,
                konsistensi antar data, dan kewajaran sebelum paket masuk audit.
              </div>
            </Panel>
            <Panel
              title="Dokumen mutu Tahap 0–3"
              icon={BookOpen}
              extra={
                <Badge tone={docsPassed ? "good" : "warn"}>
                  {
                    documentItems.filter(
                      (x) => state.submission.requiredDocuments[x],
                    ).length
                  }
                  /{documentItems.length}
                </Badge>
              }
            >
              <div className="wf-note" style={{ marginBottom: 8 }}>
                Pastikan bukti kalibrasi/validasi, verval berkala, temuan, dan
                tindak lanjut yang diwajibkan sudah tercatat.
              </div>
              {documentItems.map((x) => (
                <CheckRow
                  key={x}
                  id={`submission-doc-${testId(x)}`}
                  label={x}
                  checked={!!state.submission.requiredDocuments[x]}
                  disabled={!canPrepare}
                  onChange={(v) => updateReq(x, v)}
                />
              ))}
            </Panel>
            <Panel
              title="Kesiapan integrasi data"
              icon={ArrowRight}
              extra={
                <Badge tone={targetsPassed ? "good" : "warn"}>
                  {targetsPassed ? "Otomatis" : "Belum tersedia"}
                </Badge>
              }
            >
              <div className="wf-note" style={{ marginBottom: 8 }}>
                Tujuan integrasi mengikuti konfigurasi paket dan tidak dipilih
                manual oleh pengguna.
              </div>
              {targetAssignments.length ? (
                targetAssignments.map(({ system, types }) => (
                  <div
                    className="wf-row"
                    key={system}
                    data-testid={`target-system-${testId(system)}`}
                  >
                    <span>
                      <strong>{system}</strong>
                      <span className="wf-note" style={{ display: "block" }}>
                        {types.join(" · ")}
                      </span>
                    </span>
                    <Badge tone="good">Terkonfigurasi</Badge>
                  </div>
                ))
              ) : (
                <div className="wf-callout warn">
                  Belum ada jenis survei pada paket sehingga sistem tujuan belum
                  dapat ditentukan.
                </div>
              )}
            </Panel>
            <Panel title="Lanjut ke audit & penyerahan" icon={ShieldCheck}>
              <GateSummary
                title="Gerbang Tahap 4 → Tahap 5"
                items={auditGateItems}
              />
              <div className="wf-callout" style={{ marginTop: 10 }}>
                {state.submission.validationMessage ||
                  "Belum ada konfirmasi kesiapan penyerahan."}
              </div>
              <div className="wf-toolbar" style={{ marginTop: 10 }}>
                <Button
                  id="button-go-audit-one"
                  disabled={!preAuditReady}
                  onClick={() =>
                    onNavigate("/verification:Audit tingkat 1–3")
                  }
                >
                  <ClipboardCheck size={13} />
                  Lanjut Audit Tingkat 1
                </Button>
                <Button
                  id="button-submission-validate"
                  kind="primary"
                  disabled={!readyToSubmit || !canPrepare}
                  onClick={validate}
                >
                  <Check size={13} />
                  Konfirmasi siap diserahkan
                </Button>
              </div>
            </Panel>
          </div>
          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <Panel
              title="Gerbang RNI / LRS"
              icon={MapPinned}
              extra={
                <Badge tone={lrs.passed ? "good" : "bad"}>
                  {lrs.passed ? "Lulus" : "Tertahan"}
                </Badge>
              }
            >
              {lrs.checks.map((c, i) => (
                <div
                  className="wf-row"
                  key={c.label}
                  data-testid={`lrs-gate-check-${i}`}
                >
                  <span>
                    {c.label}
                    <span className="wf-note" style={{ display: "block" }}>
                      {c.actual}
                    </span>
                  </span>
                  <Badge tone={c.pass ? "good" : "bad"}>
                    {c.pass ? "Lulus" : "Tertahan"}
                  </Badge>
                </div>
              ))}
              {!lrs.passed && (
                <div className="wf-toolbar" style={{ marginTop: 10 }}>
                  <Button
                    id="button-open-lrs-correction"
                    kind="danger"
                    onClick={openLrsCase}
                  >
                    <Wrench size={13} />
                    Buka tindak lanjut
                  </Button>
                </div>
              )}
              <div className="wf-fields" style={{ marginTop: 12 }}>
                <CheckRow
                  id="submission-route-changed"
                  label="Ada perubahan trase / panjang"
                  checked={state.submission.routeChanged}
                  disabled={!canPrepare}
                  onChange={(v) =>
                    updateSubmission(
                      { routeChanged: v },
                      "Catat perubahan trase",
                    )
                  }
                />
                <Field label="Deviasi panjang (m)">
                  <input
                    type="number"
                    disabled={!canPrepare}
                    data-testid="input-submission-deviation"
                    value={state.submission.routeLengthDeviation}
                    onChange={(e) =>
                      updateSubmission(
                        { routeLengthDeviation: Number(e.target.value) },
                        "Ubah deviasi panjang",
                      )
                    }
                  />
                </Field>
                <Field label="Format geometri">
                  <Select
                    id="select-submission-geometry"
                    disabled={!canPrepare}
                    value={state.submission.geometryFormat || ""}
                    options={["", "SHP", "GeoJSON"]}
                    onChange={(v) =>
                      updateSubmission(
                        {
                          geometryFormat:
                            v as SubmissionState["geometryFormat"],
                        },
                        "Pilih format geometri",
                      )
                    }
                  />
                </Field>
                <Field label="Kesalahan topologi">
                  <input
                    type="number"
                    disabled={!canPrepare}
                    data-testid="input-submission-topology"
                    value={state.submission.topologyErrors}
                    onChange={(e) =>
                      updateSubmission(
                        { topologyErrors: Number(e.target.value) },
                        "Ubah hasil topologi",
                      )
                    }
                  />
                </Field>
                <Field label="Tanggal validasi RNI">
                  <input
                    type="date"
                    disabled={!canPrepare}
                    data-testid="input-submission-rni-date"
                    value={state.submission.rniValidatedDate}
                    onChange={(e) =>
                      updateSubmission(
                        { rniValidatedDate: e.target.value },
                        "Ubah tanggal validasi RNI",
                      )
                    }
                  />
                </Field>
                <CheckRow
                  id="submission-stationing"
                  label="STA konsisten antar data"
                  checked={state.submission.stationingConsistent}
                  disabled={!canPrepare}
                  onChange={(v) =>
                    updateSubmission(
                      { stationingConsistent: v },
                      "Validasi STA semua survei",
                    )
                  }
                />
                <CheckRow
                  id="submission-coordinates"
                  label="Seluruh data berkoordinat dan terikat LRS"
                  checked={!!state.submission.coordinatesBoundToLrs}
                  disabled={!canPrepare}
                  onChange={(v) =>
                    updateSubmission(
                      { coordinatesBoundToLrs: v },
                      "Periksa koordinat dan ikatan LRS",
                    )
                  }
                />
                <CheckRow
                  id="submission-glossary"
                  label="Format kode & glossary sesuai"
                  checked={!!state.submission.formatGlossaryCompliant}
                  disabled={!canPrepare}
                  onChange={(v) =>
                    updateSubmission(
                      { formatGlossaryCompliant: v },
                      "Periksa format kode & glossary",
                    )
                  }
                />
                <CheckRow
                  id="submission-raw-separated"
                  label="Data sumber dipisahkan"
                  checked={state.submission.rawSeparated}
                  disabled={!canPrepare}
                  onChange={(v) =>
                    updateSubmission(
                      { rawSeparated: v },
                      "Konfirmasi pemisahan data sumber",
                    )
                  }
                />
                <CheckRow
                  id="submission-cleaned-separated"
                  label="Data tervalidasi dipisahkan"
                  checked={state.submission.cleanedSeparated}
                  disabled={!canPrepare}
                  onChange={(v) =>
                    updateSubmission(
                      { cleanedSeparated: v },
                      "Konfirmasi pemisahan data tervalidasi",
                    )
                  }
                />
              </div>
            </Panel>
            <Panel title="Paket data yang disiapkan" icon={Archive}>
              <Field label="Referensi data sumber / raw" full>
                <input
                  disabled={!canPrepare}
                  data-testid="input-submission-raw-file"
                  value={state.submission.rawFileName}
                  onChange={(e) =>
                    updateSubmission(
                      { rawFileName: e.target.value },
                      "Catat referensi data sumber",
                    )
                  }
                />
              </Field>
              <Field label="Referensi data tervalidasi" full>
                <input
                  disabled={!canPrepare}
                  data-testid="input-submission-clean-file"
                  value={state.submission.cleanedFileName}
                  onChange={(e) =>
                    updateSubmission(
                      { cleanedFileName: e.target.value },
                      "Catat referensi data tervalidasi",
                    )
                  }
                />
              </Field>
              <Field label="Referensi bukti visual (bila berlaku)" full>
                <input
                  disabled={!canPrepare}
                  data-testid="input-submission-video"
                  value={state.submission.videoLink}
                  onChange={(e) =>
                    updateSubmission(
                      { videoLink: e.target.value },
                      "Catat referensi bukti visual",
                    )
                  }
                />
              </Field>
              <div className="wf-note">
                Referensi paket nantinya dapat berasal dari sistem
                sumber/storage; halaman ini tetap menjadi ringkasan kesiapan
                QA/QC.
              </div>
            </Panel>
          </div>
        </div>
      ) : (
        <div className="wf-grid" style={{ marginTop: 12, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <Panel
              title={
                isBalaiReview
                  ? "Ringkasan pemeriksaan Penyedia"
                  : "Ringkasan mutu paket"
              }
              icon={ClipboardCheck}
              extra={
                <Badge
                  tone={qualityChecks.every((x) => x.ready) ? "good" : "warn"}
                >
                  {qualityChecks.filter((x) => x.ready).length}/
                  {qualityChecks.length}
                </Badge>
              }
            >
              {qualityChecks.map((item, i) => (
                <div
                  className="wf-row"
                  key={item.label}
                  data-testid={`stage4-review-quality-${i}`}
                >
                  <span>
                    {item.label}
                    <span className="wf-note" style={{ display: "block" }}>
                      {item.detail}
                    </span>
                  </span>
                  <Badge tone={item.ready ? "good" : "warn"}>
                    {item.ready ? "Siap" : "Perlu tindak lanjut"}
                  </Badge>
                </div>
              ))}
              <div className="wf-callout" style={{ marginTop: 10 }}>
                {isBalaiReview
                  ? "Balai meninjau hasil kesiapan yang disiapkan Penyedia; bila belum sesuai, tindak lanjut dikembalikan ke Penyedia sebelum audit."
                  : "Ringkasan ini menjadi konteks monitoring sebelum audit tingkat pusat."}
              </div>
            </Panel>
            <Panel
              title="Dokumen mutu yang tersedia"
              icon={BookOpen}
              extra={
                <Badge tone={docsPassed ? "good" : "warn"}>
                  {
                    documentItems.filter(
                      (x) => state.submission.requiredDocuments[x],
                    ).length
                  }
                  /{documentItems.length}
                </Badge>
              }
            >
              {readOnlyDocRows}
            </Panel>
            <Panel
              title="Kesiapan integrasi data"
              icon={ArrowRight}
              extra={
                <Badge tone={targetsPassed ? "good" : "warn"}>
                  {targetsPassed ? "Otomatis" : "Belum tersedia"}
                </Badge>
              }
            >
              <div className="wf-note" style={{ marginBottom: 8 }}>
                Tujuan integrasi ditampilkan read-only dan mengikuti konfigurasi
                paket.
              </div>
              {targetAssignments.length ? (
                targetAssignments.map(({ system, types }) => (
                  <div
                    className="wf-row"
                    key={system}
                    data-testid={`review-target-system-${testId(system)}`}
                  >
                    <span>
                      <strong>{system}</strong>
                      <span className="wf-note" style={{ display: "block" }}>
                        {types.join(" · ")}
                      </span>
                    </span>
                    <Badge tone="good">Terkonfigurasi</Badge>
                  </div>
                ))
              ) : (
                <div className="wf-callout warn">
                  Belum ada jenis survei pada paket sehingga sistem tujuan belum
                  dapat ditentukan.
                </div>
              )}
            </Panel>
            <Panel
              title={
                isBalaiReview
                  ? "Status menuju Audit Tingkat 1"
                  : "Status menuju audit"
              }
              icon={ShieldCheck}
            >
              <GateSummary
                title="Gerbang Tahap 4 → Tahap 5"
                items={auditGateItems}
              />
              <div className="wf-callout" style={{ marginTop: 10 }}>
                {state.submission.validationMessage ||
                  "Belum ada konfirmasi kesiapan penyerahan dari Penyedia."}
              </div>
              {isBalaiReview && (
                <div className="wf-note" style={{ marginTop: 10 }}>
                  Tahap ini menampilkan kesiapan paket. Keputusan assurance
                  Balai dilakukan pada proses review/audit sesuai kewenangan,
                  bukan dengan mengubah data penyiapan Penyedia di halaman ini.
                </div>
              )}
            </Panel>
          </div>
          <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
            <Panel
              title="Hasil gerbang RNI / LRS"
              icon={MapPinned}
              extra={
                <Badge tone={lrs.passed ? "good" : "bad"}>
                  {lrs.passed ? "Lulus" : "Tertahan"}
                </Badge>
              }
            >
              {lrs.checks.map((c, i) => (
                <div
                  className="wf-row"
                  key={c.label}
                  data-testid={`stage4-review-lrs-${i}`}
                >
                  <span>
                    {c.label}
                    <span className="wf-note" style={{ display: "block" }}>
                      {c.actual}
                    </span>
                  </span>
                  <Badge tone={c.pass ? "good" : "bad"}>
                    {c.pass ? "Lulus" : "Tertahan"}
                  </Badge>
                </div>
              ))}
              {!lrs.passed && isBalaiReview && (
                <div className="wf-callout warn" style={{ marginTop: 10 }}>
                  Ada kriteria RNI/LRS yang belum terpenuhi. Paket belum siap
                  diteruskan; tindak lanjut perlu dilakukan Penyedia pada
                  data/sumber terkait.
                </div>
              )}
            </Panel>
            <Panel title="Referensi paket data" icon={Archive}>
              <div className="wf-row">
                <span>Data sumber / raw</span>
                <strong>
                  {state.submission.rawFileName || "Belum tercatat"}
                </strong>
              </div>
              <div className="wf-row">
                <span>Data tervalidasi</span>
                <strong>
                  {state.submission.cleanedFileName || "Belum tercatat"}
                </strong>
              </div>
              <div className="wf-row">
                <span>Bukti visual</span>
                <strong>
                  {state.submission.videoLink || "Tidak/belum tercatat"}
                </strong>
              </div>
              <div className="wf-note" style={{ marginTop: 10 }}>
                Referensi bersifat read-only pada peran ini. Perubahan paket
                dilakukan oleh Penyedia Jasa / Ketua Tim.
              </div>
            </Panel>
          </div>
        </div>
      )}
      <details className="stage-document-details"><summary>Dokumen hasil pemeriksaan · Berita Acara V&V Bertahap</summary>
      <Panel title="Berita Acara V&V Bertahap" icon={FileText}>
        <p className="wf-note">
          Draft dibuat dari hasil pemeriksaan bertahap, bukan otomatis disahkan.
        </p>
        {baAccess("bertahap", "Susun BA V&V Bertahap")}
      </Panel>
      </details>
    </>
  );
}
