import { evaluateSubmissionReadiness } from '../submissionReadiness';
import {DocumentAttachments} from '../DocumentAttachments';
import {Stage3BSourceEvidenceIndex} from '../Stage3BSourceEvidenceIndex';
import {sourceInspectionStatus} from '../repository/sourceChecklistRepository';
import {RoleWorkSection} from '../RoleWorkSection';
import {stagedFallbackReviewReady,stagedSurveyReviewMode} from '../stagedReviewPolicy';
import {
  Archive,
  BookOpen,
  Check,
  ClipboardCheck,
  FileText,
  MapPinned,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useCorrectionSelection } from "./useCorrectionSelection";
import { useState } from "react";
import "./stage4-redesign.css";

import { fieldReadiness, workflowDocumentReferences } from "../flowRules";
import {
  evaluateLrsGate,
  SUBMISSION_DOCUMENTS,
  SubmissionState,
} from "../model";
import { SourceAlignmentChecklist } from "../SourceAlignmentChecklist";
import { GateSummary } from "../WorkflowComponents";

import type { WorkflowStageProps } from "./stageSupport";
import {
  Badge,
  Button,
  CheckRow,
  defaultCase,
  Field,
  Panel,
  Select,
  systemsByType,
  testId,
} from "./stageSupport";
import { useWorkflowStage } from "./useWorkflowStage";

export function Stage4DataPreparationWorkspace(props: WorkflowStageProps) {
  const { selection, state, onUpdate, setNotice, onNavigate } = props;
  const { baAccess, commit, updateSubmission, heading } =
    useWorkflowStage(props);
  const [caseId, setCaseId] = useCorrectionSelection(state.project.id);
  type Stage4Tab = 'paket' | 'mutu' | 'penyerahan' | 'dokumen' | 'hasil' | 'bertahap' | 'keputusan' | 'ba' | 'monitor' | 'administrasi';
  const [currentTab, setCurrentTab] = useState<Stage4Tab | null>(null);

  const lrs = evaluateLrsGate(state.submission, state.simulationDate);

  const canPrepare = state.role === "Penyedia Jasa / Ketua Tim";
  const documentItems = [...SUBMISSION_DOCUMENTS];
  const docsPassed = documentItems.every(
    (x) => state.submission.requiredDocuments[x],
  );
  const { ready: readyToSubmit, requiredTargets } = evaluateSubmissionReadiness(state);
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
        localReadinessConfirmed: true,
        validationMessage: `Kesiapan lokal telah dicatat untuk ${destination}; menunggu validasi sistem sumber.`,
      },
      "Konfirmasi kesiapan lokal Tahap 4",
    );
    setNotice(`Kesiapan lokal dicatat. Status VALID menunggu bukti dari sistem sumber (${destination}).`);
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
        {state.submission.requiredDocuments[x] ? "Dikonfirmasi" : "Belum dikonfirmasi"}
      </Badge>
    </div>
  ));
  const tabs: {id: Stage4Tab; label: string}[] = canPrepare
    ? [{id:'paket',label:'Paket Data'},{id:'mutu',label:'Pemeriksaan Mutu'},{id:'dokumen',label:'Dokumen & Bukti'},{id:'penyerahan',label:'Kesiapan & Status Data'}]
    : isBalaiReview
      ? [{id:'hasil',label:'Hasil Penyedia'},{id:'bertahap',label:'V&V Bertahap'},{id:'keputusan',label:'Hasil Pemeriksaan'},{id:'ba',label:'BA'}]
      : state.role === 'Direktorat / Pusat'
        ? [{id:'monitor',label:'Hasil Pemeriksaan'},{id:'dokumen',label:'Dokumen'}]
        : [{id:'administrasi',label:'Status Administrasi'},{id:'dokumen',label:'Dokumen'}];
  const tab = tabs.some(item=>item.id===currentTab) ? currentTab : tabs[0].id;
  const summary = (title:string, items:typeof readinessItems) => (
    <div className="stage4-summary" aria-label={title}>
      {items.map(item=><div key={item.label} className="stage4-summary-row">
        <span>{item.label}</span><Badge tone={item.ready?'good':'warn'}>{item.ready?'Siap':'Perlu diperiksa'}</Badge>
      </div>)}
    </div>
  );
  const documentReview = (
    <>
      <Panel title="Pemeriksaan dokumen sebelumnya" icon={BookOpen}>
        <div className="stage4-document-source" aria-label="Referensi dokumen dari tahap sebelumnya">
          {workflowDocumentReferences(state).filter(item =>
            /Kalibrasi|Alat|Verval|Koreksi|Validasi|Persetujuan|tindakan perbaikan/.test(item.name)
          ).map((item,index)=><div className="stage4-summary-row" key={`${item.name}-${index}`}>
            <span>{item.name}<small>{item.reference}</small></span>
            <Badge tone={["Disetujui","Lulus","Konsisten","Terverifikasi","Tercatat"].includes(item.status)?"good":"warn"}>{item.status}</Badge>
          </div>)}
        </div>
        <details className="stage4-document-verification">
          <summary>Konfirmasi kelengkapan dokumen ({documentItems.filter(x=>state.submission.requiredDocuments[x]).length}/{documentItems.length})</summary>
          {canPrepare && <p className="wf-note">Periksa bukti terlebih dahulu. Konfirmasi ini bukan bukti unggahan server.</p>}
          {canPrepare ? documentItems.map(x=><CheckRow key={x} id={`submission-doc-${testId(x)}`} label={x} checked={!!state.submission.requiredDocuments[x]} onChange={v=>updateReq(x,v)}/>) : readOnlyDocRows}
        </details>
      </Panel>
    </>
  );
  const stagedReview = (
    <>
      {stagedSourceTypes.length>0&&<SourceAlignmentChecklist
        pciManual={pciManual} projectInfo={state.project} packageId={state.project.id}
        phase="staged" surveyTypes={stagedSourceTypes} role={state.role}
        editableRoles={["PIC Balai / Pengguna Jasa"]} title="Checklist Verifikasi Data"
      />}
      {stagedFallbackTypes.map(type=>{
        const review=state.submission.stagedReviews?.[type]??{decision:'Belum Diperiksa' as const,note:'',reviewedAt:''};
        return <Panel key={type} title={`V&V ${type}`} icon={ClipboardCheck}>
          {isBalaiReview ? <div className="wf-fields">
            <Field label="Hasil review"><Select id={`stage4-staged-review-${testId(type)}`} value={review.decision} options={['Belum Diperiksa','Sesuai','Temuan']} onChange={decision=>updateSubmission({stagedReviews:{...(state.submission.stagedReviews??{}),[type]:{...review,decision:decision as 'Belum Diperiksa'|'Sesuai'|'Temuan',reviewedAt:decision==='Belum Diperiksa'?'':state.simulationDate}}},`Review V&V bertahap ${type}`)}/></Field>
            <Field label="Catatan review" full><textarea rows={2} value={review.note} onChange={e=>updateSubmission({stagedReviews:{...(state.submission.stagedReviews??{}),[type]:{...review,note:e.target.value}}},`Catatan V&V bertahap ${type}`)} placeholder="Isi catatan bila ada temuan atau klarifikasi"/></Field>
          </div> : <div className="stage4-summary-row"><span>{review.note||type}</span><Badge tone={review.decision==='Sesuai'?'good':review.decision==='Temuan'?'bad':'warn'}>{review.decision}</Badge></div>}
        </Panel>;
      })}
    </>
  );
  const stagedResultsSummary = (
    <Panel title="Hasil V&V Bertahap per Survei" icon={ClipboardCheck}>
      {state.project.surveyTypes.map(type => {
        const hasSource = stagedHasSource(type);
        const complete = stagedTypeReady(type);
        const fallbackDecision = state.submission.stagedReviews?.[type]?.decision;
        return <div className="stage4-summary-row" key={type}>
          <span>{type}<small>{hasSource ? "Formulir pemeriksaan sumber" : "Pemeriksaan Balai tercatat"}</small></span>
          <Badge tone={complete ? 'good' : 'warn'}>{hasSource ? (complete ? 'Formulir lengkap' : 'Belum lengkap') : (fallbackDecision ?? 'Belum diperiksa')}</Badge>
        </div>;
      })}
      {state.project.surveyTypes.length===0&&<p className="stage4-feedback">Belum ada jenis survei pada paket.</p>}
      <p className="stage4-feedback">Kelengkapan formulir bukan persetujuan BA. Keputusan dan temuan mengikuti catatan pemeriksaan.</p>
    </Panel>
  );
  const lrsResults = (
    <Panel title="Hasil RNI / LRS" icon={MapPinned}>
      {lrs.checks.map((check,i)=><div key={`${check.label}-${i}`} className="stage4-summary-row" data-testid={`stage4-review-lrs-${i}`}>
        <span>{check.label}<small>{check.actual}</small></span>
        <Badge tone={check.pass?'good':'bad'}>{check.pass?'Lulus':'Tertahan'}</Badge>
      </div>)}
    </Panel>
  );
  const packageReferences = (
    <Panel title="Referensi Paket Data" icon={Archive}>
      <div className="stage4-summary-row"><span>Data sumber</span><strong>{state.submission.rawFileName||'Belum tercatat'}</strong></div>
      <div className="stage4-summary-row"><span>Data tervalidasi</span><strong>{state.submission.cleanedFileName||'Belum tercatat'}</strong></div>
      <div className="stage4-summary-row"><span>Bukti visual</span><strong>{state.submission.videoLink||'Belum tercatat'}</strong></div>
    </Panel>
  );
  const sourceStatus = (
    <Panel title="Status Data Sistem Sumber" icon={Archive}>
      {targetAssignments.length ? targetAssignments.map(({system,types})=><div className="stage4-summary-row" key={system}><span>{system}<small>{types.join(' · ')}</small></span></div>) : <p>Belum ada jenis survei pada paket.</p>}
      <div className="stage4-summary-row"><span>Status validasi tercatat (paket)</span><Badge tone={state.submission.validationStatus==='VALID'?'good':'warn'}>{state.submission.validationStatus==='Draft'?'Belum tersedia':state.submission.validationStatus}</Badge></div>
      <div className="stage4-summary-row"><span>Kesiapan lokal</span><span>{state.submission.localReadinessConfirmed?'Tercatat':'Belum tercatat'}</span></div>
      <div className="stage4-summary-row"><span>Referensi serah untuk pemeriksaan Balai</span><span>{state.submission.reviewHandoverReference?.trim()||'Belum tercatat'}</span></div>
      <p className="stage4-feedback">Unggahan dan validasi berlangsung pada sistem terkait. Catatan lokal bukan status validasi sumber.</p>
    </Panel>
  );
  return (
    <section className="stage4-workspace" data-testid="stage4-workspace">
      <div className="stage4-header">
        <div className="stage4-heading">
          <p className="wf-eyebrow">Tahap 4 · penyiapan data</p>
          <h1 className="wf-title stage4-title">Penyiapan dan Pemeriksaan Data</h1>
        </div>
        <div className="stage4-header-actions">
          {props.stage4Notes?.(state)}
          <Badge tone={fieldErrors.length===0?'good':'warn'}>{fieldErrors.length===0?'Tahap sebelumnya siap':'Menunggu prasyarat'}</Badge>
        </div>
      </div>
      <nav className="stage4-tabs" aria-label="Pekerjaan Tahap 4">
        {tabs.map(item=><button key={item.id} type="button" className={`stage4-tab${tab===item.id?' active':''}`} data-testid={`stage4-tab-${item.id}`} aria-current={tab===item.id?'page':undefined} onClick={()=>setCurrentTab(item.id)}>{item.label}</button>)}
      </nav>
      <div className="stage4-content" key={tab}>
        {canPrepare && tab==='paket' && <>
          <Panel title="Paket yang disiapkan" icon={Archive}>
            <div className="wf-fields">
              <Field label="Referensi data sumber / raw" full><input data-testid="input-submission-raw-file" value={state.submission.rawFileName} onChange={e=>updateSubmission({rawFileName:e.target.value},'Catat referensi data sumber')}/></Field>
              <Field label="Referensi data tervalidasi" full><input data-testid="input-submission-clean-file" value={state.submission.cleanedFileName} onChange={e=>updateSubmission({cleanedFileName:e.target.value},'Catat referensi data tervalidasi')}/></Field>
              <Field label="Referensi bukti visual (bila berlaku)" full><input data-testid="input-submission-video" value={state.submission.videoLink} onChange={e=>updateSubmission({videoLink:e.target.value},'Catat referensi bukti visual')}/></Field>
            </div>
          </Panel>
          <Panel title="Referensi lokasi RNI / LRS" icon={MapPinned}>
            <div className="stage4-summary">{lrs.checks.map((check,i)=><div className="stage4-summary-row" key={check.label} data-testid={`lrs-gate-check-${i}`}><span>{check.label}</span><Badge tone={check.pass?'good':'warn'}>{check.pass?'Lulus':'Periksa'}</Badge></div>)}</div>
            <div className="wf-fields stage4-form-spaced">
              <CheckRow id="submission-route-changed" label="Ada perubahan trase / panjang" checked={state.submission.routeChanged} onChange={v=>updateSubmission({routeChanged:v},'Catat perubahan trase')}/>
              <Field label="Deviasi panjang (m)"><input type="number" data-testid="input-submission-deviation" value={state.submission.routeLengthDeviation} onChange={e=>updateSubmission({routeLengthDeviation:Number(e.target.value)},'Ubah deviasi panjang')}/></Field>
              <Field label="Format geometri"><Select id="select-submission-geometry" value={state.submission.geometryFormat||''} options={['','SHP','GeoJSON']} onChange={v=>updateSubmission({geometryFormat:v as SubmissionState['geometryFormat']},'Pilih format geometri')}/></Field>
              <Field label="Kesalahan topologi"><input type="number" data-testid="input-submission-topology" value={state.submission.topologyErrors} onChange={e=>updateSubmission({topologyErrors:Number(e.target.value)},'Ubah hasil topologi')}/></Field>
              <Field label="Tanggal validasi RNI"><input type="date" data-testid="input-submission-rni-date" value={state.submission.rniValidatedDate} onChange={e=>updateSubmission({rniValidatedDate:e.target.value},'Ubah tanggal validasi RNI')}/></Field>
              <CheckRow id="submission-stationing" label="STA konsisten antar data" checked={state.submission.stationingConsistent} onChange={v=>updateSubmission({stationingConsistent:v},'Validasi STA semua survei')}/>
              <CheckRow id="submission-coordinates" label="Seluruh data berkoordinat dan terikat LRS" checked={!!state.submission.coordinatesBoundToLrs} onChange={v=>updateSubmission({coordinatesBoundToLrs:v},'Periksa koordinat dan ikatan LRS')}/>
              <CheckRow id="submission-glossary" label="Format kode & glossary sesuai" checked={!!state.submission.formatGlossaryCompliant} onChange={v=>updateSubmission({formatGlossaryCompliant:v},'Periksa format kode & glossary')}/>
              <CheckRow id="submission-raw-separated" label="Data sumber dipisahkan" checked={state.submission.rawSeparated} onChange={v=>updateSubmission({rawSeparated:v},'Konfirmasi pemisahan data sumber')}/>
              <CheckRow id="submission-cleaned-separated" label="Data tervalidasi dipisahkan" checked={state.submission.cleanedSeparated} onChange={v=>updateSubmission({cleanedSeparated:v},'Konfirmasi pemisahan data tervalidasi')}/>
            </div>
            {!lrs.passed&&<Button id="button-open-lrs-correction" kind="danger" onClick={openLrsCase}><Wrench size={13}/>Buka tindak lanjut</Button>}
          </Panel>
        </>}
        {canPrepare && tab==='mutu' && <>
          <Panel title="Pemeriksaan mutu paket" icon={ClipboardCheck}>
            {qualityChecks.map((item,i)=><div className="stage4-summary-row" key={item.label} data-testid={`stage4-quality-${i}`}><span>{item.label}<small>{item.detail}</small></span><Badge tone={item.ready?'good':'warn'}>{item.ready?'Siap':'Periksa'}</Badge></div>)}
          </Panel>
          {documentReview}
        </>}
        {canPrepare && tab==='penyerahan' && <>
          {sourceStatus}
          <Panel title="Kesiapan penyerahan" icon={ShieldCheck}>
            {summary('Kesiapan penyerahan',readinessItems)}
            <div className="stage4-steps">
              <span>1 · Siapkan data & bukti</span><span>2 · V&V bertahap Balai</span><span>3 · Audit Tingkat 1</span><span>4 · Kesiapan akhir</span>
            </div>
            {summary('Prasyarat audit',auditGateItems)}
            <p className="stage4-feedback">Konfirmasi lokal bukan penyerahan atau validasi SMD. Status VALID hanya dari hasil sistem sumber.</p>
            {state.submission.validationMessage && (state.submission.localReadinessConfirmed || state.submission.validationStatus === 'VALID') && <p className="stage4-feedback">{state.submission.validationMessage}</p>}
            {!stagedFormsReady&&<p className="stage4-feedback">Menunggu pemeriksaan V&V bertahap Balai.</p>}
            <div className="stage4-actions">
              <Button id="button-go-audit-one" disabled={!preAuditReady} onClick={()=>onNavigate('/verification:Audit tingkat 1–3')}><ClipboardCheck size={13}/>Buka Audit Tingkat 1 (Tahap 5)</Button>
              <Button id="button-submission-validate" kind="primary" disabled={!readyToSubmit || state.submission.localReadinessConfirmed === true} onClick={validate}><Check size={13}/>{state.submission.localReadinessConfirmed ? "Kesiapan lokal tercatat" : "Catat kesiapan lokal"}</Button>
            </div>
            {state.audits[0].status === 'Lulus' && !state.audits[0].requiresReview && (
              <div className="wf-fields stage4-form-spaced">
                <Field label="Referensi penyerahan untuk pemeriksaan Balai" full>
                  <input data-testid="input-stage4-review-handover" value={state.submission.reviewHandoverReference ?? ''}
                    placeholder="Nomor surat, berita acara, atau tanda terima"
                    onChange={e => updateSubmission({reviewHandoverReference:e.target.value},'Catat referensi penyerahan pemeriksaan')} />
                </Field>
                <p className="stage4-feedback">Catatan lokal serah untuk pemeriksaan; bukan unggahan atau status VALID SMD.</p>
              </div>
            )}
          </Panel>
        </>}
        {isBalaiReview && tab==='hasil' && <>
          {sourceStatus}
          <Panel title="Hasil Penyiapan Penyedia" icon={ClipboardCheck}>
            {summary('Kesiapan',readinessItems)}
            {qualityChecks.map((item,i)=><div className="stage4-summary-row" key={item.label} data-testid={`stage4-review-quality-${i}`}><span>{item.label}</span><Badge tone={item.ready?'good':'warn'}>{item.ready?'Siap':'Perlu tindak lanjut'}</Badge></div>)}
          </Panel>
          {packageReferences}
          <details className="stage4-prior-evidence"><summary>Bukti paket dan pemeriksaan periode</summary>
            <DocumentAttachments title="Lampiran paket data" scope={`${state.project.id}:stage4`} categories={['Paket / referensi data sumber','Paket / referensi data tervalidasi','Dokumen mutu pendukung']} legacyEvidenceIds={['stage4-raw-package','stage4-validated-package','stage4-quality-document']} editable={false}/>
            <Panel title="Bukti formulir Konsistensi & Internal" icon={FileText}><Stage3BSourceEvidenceIndex packageId={state.project.id} period={state.activeCyclePeriod ?? 1} surveys={state.project.surveyTypes} pciManual={pciManual}/></Panel>
            <DocumentAttachments title="Bukti pemeriksaan 3B" compactPeriodic scope={`${state.project.id}:stage3b-${state.activeCyclePeriod ?? 1}`} categories={['Bukti repeatability / hasil pemeriksaan berkala','Bukti pendukung periode']} legacyEvidenceIds={[`stage3b-repeatability-${state.activeCyclePeriod ?? 1}`,`stage3b-supporting-evidence-${state.activeCyclePeriod ?? 1}`]} editable={false}/>
          </details>
        </>}
        {isBalaiReview && tab==='bertahap' && stagedReview}
        {isBalaiReview && tab==='keputusan' && <>
          {stagedResultsSummary}
          <details className="stage4-prior-evidence"><summary>Hasil RNI/LRS dan prasyarat audit</summary>
            {lrsResults}
            <Panel title="Status Pemeriksaan" icon={ShieldCheck}>{summary('Status',auditGateItems)}</Panel>
          </details>
        </>}
        {isBalaiReview && tab==='ba' && <Panel title="Berita Acara V&V Bertahap" icon={FileText}>{baAccess('bertahap','Susun BA V&V Bertahap')}</Panel>}
        {state.role==='Direktorat / Pusat' && tab==='monitor' && <>
          {sourceStatus}
          {stagedResultsSummary}
          <details className="stage4-prior-evidence"><summary>Detail formulir V&V bertahap</summary>
            {stagedSourceTypes.length > 0 && <SourceAlignmentChecklist pciManual={pciManual} projectInfo={state.project} packageId={state.project.id} phase="staged" surveyTypes={stagedSourceTypes} role={state.role} editableRoles={["PIC Balai / Pengguna Jasa"]} title="Hasil pemeriksaan Balai" />}
            {stagedFallbackTypes.map(type=><div key={type} className="stage4-summary-row"><span>{type}</span><Badge tone={stagedFallbackReviewReady(state,type)?'good':'warn'}>{stagedFallbackReviewReady(state,type)?'Sesuai':'Belum diperiksa'}</Badge></div>)}
          </details>
          <details className="stage4-prior-evidence"><summary>Kesiapan paket dan hasil RNI/LRS</summary>
            <Panel title="Kesiapan Paket" icon={ShieldCheck}>{summary('Kesiapan',readinessItems)}{summary('Audit',auditGateItems)}</Panel>
            {packageReferences}{lrsResults}
          </details>
        </>}
        {state.role==='Admin' && tab==='administrasi' && <>
          <Panel title="Status Paket" icon={ClipboardCheck}>{summary('Kelengkapan',readinessItems)}{summary('Audit',auditGateItems)}</Panel>
          {sourceStatus}
        </>}
        {tab==='dokumen' && <>
          {documentReview}
          <DocumentAttachments title="Lampiran paket Tahap 4" scope={`${state.project.id}:stage4`} categories={['Paket / referensi data sumber','Paket / referensi data tervalidasi','Dokumen mutu pendukung']} legacyEvidenceIds={['stage4-raw-package','stage4-validated-package','stage4-quality-document']} editable={canPrepare}/>
          <details className="stage4-prior-evidence"><summary>Bukti periode Tahap 3B</summary>
            <Panel title="Lampiran formulir Konsistensi & Internal" icon={FileText}><Stage3BSourceEvidenceIndex packageId={state.project.id} period={state.activeCyclePeriod ?? 1} surveys={state.project.surveyTypes} pciManual={pciManual}/></Panel>
            <DocumentAttachments title="Bukti pemeriksaan berkala" compactPeriodic scope={`${state.project.id}:stage3b-${state.activeCyclePeriod ?? 1}`} categories={['Bukti repeatability / hasil pemeriksaan berkala','Bukti pendukung periode']} legacyEvidenceIds={[`stage3b-repeatability-${state.activeCyclePeriod ?? 1}`,`stage3b-supporting-evidence-${state.activeCyclePeriod ?? 1}`]} editable={false}/>
          </details>

        </>}
      </div>
    </section>
  );
}
