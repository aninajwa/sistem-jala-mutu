import "./stage5-redesign.css";
import {sourceInspectionStatus} from '../repository/sourceChecklistRepository';
import {usePersistedDraft} from '../../hooks/usePersistedDraft';
import {
  Activity,
  ClipboardList,
  FileCheck2,
  FileText,
  Plus,
  Save,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useCorrectionSelection } from "./useCorrectionSelection";

import { AuditReadOnlySummary } from "../AuditReadOnlySummary";
import { auditSampleIntegrity } from "../auditSampleIntegrity";
import { reviseAuditSampleUnit } from "../auditSampleRevisions";
import { auditReviewEligibility } from "../auditReviewEligibility";
import { resolveAuditRejectionRecords, hasOpenAuditRejectionCase } from "../auditRejectionCases";
import {applyAuditRejection,auditRejectionAction} from "../auditRejectionTransition";
import { buildAuditSamplePlan, buildDirectorateScopePlan } from "../auditSamplePlan";
import {buildAuditPopulation} from "../auditSampleUnits";
import { EvidenceAttachment } from "../EvidenceAttachment";
import { fieldReadiness } from "../flowRules";
import { auditChecksForScope, auditStatusForDisplay } from "../auditChecklistPolicy";
import {
  AuditLevel,
  AuditSampleUnit,
  evaluateLrsGate,
  OperationalWorkflowState,
  samplingRule,
  SUBMISSION_DOCUMENTS,
  WorkflowRole,
} from "../model";
import { SourceAlignmentChecklist } from "../SourceAlignmentChecklist";
import sourceCatalog from "../sourceChecklistCatalog.json";
import { GateSummary } from "../WorkflowComponents";
import { AUDIT_LEVEL_PRESENTATION } from "../workflowConfig";

import type { WorkflowStageProps } from "./stageSupport";
import {
  Badge,
  Button,
  CheckRow,
  Field,
  Panel,
  Select,
  testId,
} from "./stageSupport";
import { useWorkflowStage } from "./useWorkflowStage";

export function Stage5AuditWorkspace(props: WorkflowStageProps) {
  const { state, setNotice, onNavigate } = props;
  const { baAccess, commit } = useWorkflowStage(props);
  const [draft,setDraft]=usePersistedDraft<Record<string,string>>(`jala-ui-draft:${state.project.id}:${state.role}:Stage5AuditWorkspace`,{});
  const [, setCaseId] = useCorrectionSelection(state.project.id);
  type Stage5Tab = "ringkasan" | "sampel" | "formulir" | "keputusan" | "dokumen";
  const [activeTab, setActiveTab] = useState<Stage5Tab>("ringkasan");
  const [auditLevel, setAuditLevel] = useState<1 | 2 | 3>(()=>{const key=`jala-notification-audit:${state.project.id}`,level=Number(sessionStorage.getItem(key));sessionStorage.removeItem(key);return [1,2,3].includes(level)?level as 1|2|3:state.role==='PIC Balai / Pengguna Jasa'?2:state.role==='Direktorat / Pusat'?3:1;});
  const lrs = evaluateLrsGate(state.submission, state.simulationDate);
  const saveText = (key: string, value: string) =>
    setDraft((old) => ({ ...old, [key]: value }));

  const audit = state.audits[auditLevel - 1];
  const presentation = AUDIT_LEVEL_PRESENTATION[auditLevel];
  const requiredRole = presentation.actor as WorkflowRole;
  const canEditAudit = state.role === requiredRole;
  const ownAuditLevel = state.role === 'PIC Balai / Pengguna Jasa' ? 2 : state.role === 'Direktorat / Pusat' ? 3 : state.role === 'Penyedia Jasa / Ketua Tim' ? 1 : null;
  const isAdmin = state.role === 'Admin';
  const selectedLevelIsOwn = ownAuditLevel === auditLevel;
  const levelThreeScopeUnresolved = auditLevel === 3 && state.project.surveyTypes.some(type => type !== 'Jembatan');
  const directoratePopulation = levelThreeScopeUnresolved ? buildAuditPopulation(state.dailyRecords,state.project.surveyTypes,state.project.routes) : null;
  const scopedTypes = state.project.surveyTypes;
  const auditChecks = auditChecksForScope(auditLevel, scopedTypes);
  const sampleIssues = auditSampleIntegrity({
    audit,
    records: state.dailyRecords,
    surveyTypes: scopedTypes,
    routes: state.project.routes,
  });
  const sampleCount = audit.sampleUnits?.length ?? audit.sampleIds.length;
  const stage4Ready =
    fieldReadiness(state).length === 0 &&
    lrs.passed &&
    SUBMISSION_DOCUMENTS.every(
      (key) => state.submission.requiredDocuments[key],
    ) &&
    !!state.submission.rawFileName.trim() &&
    !!state.submission.cleanedFileName.trim();
  const eligibility = auditReviewEligibility(state, auditLevel, stage4Ready);
  const previousAuditPassed = eligibility.previous;
  const uploadReady = eligibility.handover;
  const canStart = eligibility.canStart;
  const startGateItems = [
    {
      label:
        auditLevel === 1
          ? "Tahap 4 siap diaudit"
          : `Audit Tingkat ${auditLevel - 1} lulus`,
      ready: auditLevel === 1 ? stage4Ready : previousAuditPassed,
      detail:
        auditLevel === 1
          ? stage4Ready
            ? "Paket siap masuk audit internal"
            : "Lengkapi penyiapan data/RNI-LRS"
          : previousAuditPassed
            ? "Lulus"
            : "Belum lulus",
    },
    ...(auditLevel > 1
      ? [
          {
            label: auditLevel === 3 ? "Status validasi sistem sumber" : "Referensi serah berkas untuk pemeriksaan",
            ready: uploadReady,
            detail:
              state.submission.validationStatus === "VALID"
                ? "VALID dari sistem sumber"
                : auditLevel === 2 && state.submission.reviewHandoverReference?.trim() ? "Referensi penyerahan tercatat (lokal)" : "Belum tercatat",
          },
        ]
      : []),
    ...(canEditAudit ? [{
      label: "Kewenangan pemeriksaan",
      ready: true,
      detail: requiredRole,
    }] : []),
  ];
  const makeSamples = () => {
    if (!canEditAudit) {
      setNotice(
        `Peran ${requiredRole} diperlukan untuk membuat/menetapkan sampel audit tingkat ${auditLevel}.`,
      );
      return;
    }
    if (!canStart) {
      setNotice(
        auditLevel === 1
          ? "Audit Tingkat 1 menunggu Tahap 4 lengkap dan gerbang RNI/LRS lulus."
          : auditLevel === 3 ? "Audit Tingkat 3 menunggu Audit Tingkat 2 lulus dan status VALID dari sistem sumber." : "Audit Tingkat 2 memerlukan audit internal lulus, paket siap, dan referensi penyerahan pemeriksaan atau status VALID dari sistem sumber.",
      );
      return;
    }
    const result = levelThreeScopeUnresolved
      ? buildDirectorateScopePlan({
          packageId:state.project.id,
          surveyTypes:scopedTypes,
          routes:state.project.routes,
          records:state.dailyRecords,
          basisReference:(draft['directorate-scope-reference']??audit.samplingBasisReference??'').trim(),
          counts:Object.fromEntries(scopedTypes.filter(t=>t!=='Jembatan').map(t=>[t, Number(draft[`directorate-scope-count-${t}`]??audit.samplingCoverage?.[t]?.sampledUnits??'')])) as Partial<Record<typeof scopedTypes[number],number>>,
        })
      : buildAuditSamplePlan({
          packageId: state.project.id,
          auditLevel,
          surveyTypes: scopedTypes,
          routes: state.project.routes,
          records: state.dailyRecords,
        });
    if (result.issues.length) {
      setNotice(result.issues.join(" "));
      return;
    }
    const samples = result.sampleIds;
    const next: AuditLevel = {
      ...audit,
      requiresReview: false,
      reviewReason: "",
      status: "Dalam Review",
      sampleIds: [...new Set(samples)],
      sampleUnits: result.sampleUnits,
      samplingBasisReference:levelThreeScopeUnresolved ? (draft['directorate-scope-reference']??audit.samplingBasisReference??'').trim() : audit.samplingBasisReference,
      samplingCoverage: Object.fromEntries(
        Object.entries(result.coverage).map(([type, item]) => [
          type,
          item
            ? {
                sourceRecords: item.sourceCount,
                sampledSourceRecords: item.sampleCount,
                populationUnits: item.sourceUnits,
                sampledUnits: item.sampleUnits,
                populationKm: item.sourceKm || undefined,
                sampledKm: item.sampleKm || undefined,
              }
            : undefined,
        ]),
      ) as AuditLevel["samplingCoverage"],
      reviewChecks: {},
      baNumber: "",
      decisionNote: "",
    };
    commit(
      `Siapkan sampel audit tingkat ${auditLevel}`,
      `Tingkat ${auditLevel}`,
      (s) => ({
        ...s,
        audits: s.audits.map((x) =>
          x.level === auditLevel
            ? next
            : x.level > auditLevel
              ? x.status === "Belum Dimulai" ? x : { ...x, requiresReview: true, reviewReason: `Audit tingkat ${auditLevel} berubah; periksa kembali keterkaitan keputusan.` }
              : x,
        ) as OperationalWorkflowState["audits"],
        acceptance: {
          ...s.acceptance,
          finalReport: false,
          finalAcceptance: false,
          terms: s.acceptance.terms.map((t) =>
            t.id === "T3" || t.id === "T4" ? { ...t, complete: false } : t,
          ),
        },
      }),
      result.sampleUnits.length
        ? `Sampel audit berhasil disiapkan: ${result.sampleUnits.length} unit dari ${samples.length} rekaman sumber.`
        : "Belum ada rekaman yang memenuhi cakupan sampel audit.",
    );
  };
  const patchSampleUnit = (unitId:string, patch:Partial<AuditSampleUnit>) => {
    if (!canEditAudit) {setNotice(`Peran ${requiredRole} diperlukan untuk memeriksa sampel audit tingkat ${auditLevel}.`);return;}
    commit('Periksa unit sampel audit', unitId,
      current => reviseAuditSampleUnit(current, auditLevel, unitId, patch),
      'Pemeriksaan unit sampel tersimpan.');
  };
  const patchAudit = (patch: Partial<AuditLevel>, activity: string) => {
    if (!canEditAudit) {
      setNotice(
        `Peran ${requiredRole} diperlukan untuk mengubah audit tingkat ${auditLevel}.`,
      );
      return;
    }
    if (patch.status === 'Klarifikasi' && !(draft[`audit-note-${auditLevel}`] ?? audit.decisionNote).trim()) {
      setNotice('Catatan klarifikasi wajib diisi. Klarifikasi belum menjadi temuan penolakan.'); return;
    }
    if (patch.status === 'Klarifikasi') patch={...patch,decisionNote:draft[`audit-note-${auditLevel}`]??audit.decisionNote};
    if (patch.status === "Lulus") {
      if(auditLevel===3 && scopedTypes.some(type=>type!=='Jembatan') && !audit.samplingBasisReference?.trim()) {setNotice('Referensi penetapan cakupan audit Direktorat wajib tersedia sebelum keputusan lulus.');return;}
      const inspections=scopedTypes.map(type=>sourceInspectionStatus(`${state.project.id}::audit-${auditLevel}`,type,'audit',state.productionTests.PCI.pciManual!==false,state.project));
      const incomplete=inspections.filter(item=>!item.complete);
      if(incomplete.length){setNotice(incomplete.map(item=>item.reason).join(' '));return;}
      const concerns=inspections.flatMap(item=>item.concerns);
      if(concerns.length&&!(draft[`audit-note-${auditLevel}`]??audit.decisionNote).trim()){setNotice('Catat hasil penelaahan butir yang memerlukan pemeriksaan. Jawaban tidak diputuskan gagal/lulus hanya dari kata Tidak.');return;}
      const ba = draft[`audit-ba-${auditLevel}`] ?? audit.baNumber;
      if (!sampleCount || !ba.trim()) {
        setNotice(
          auditLevel === 1
            ? "Bukti audit internal memerlukan cakupan rekaman dan referensi dokumen/BA."
            : "Audit memerlukan sampel dan nomor BA sebelum dinyatakan lulus.",
        );
        return;
      }
      if (!canStart) {
        setNotice("Gerbang audit sebelumnya belum terpenuhi.");
        return;
      }
      if (
        state.corrections.some(
          (item) =>
            item.status !== "Ditutup" &&
            item.blockedStage === `Audit tingkat ${auditLevel}`,
        )
      ) {
        setNotice(
          `Audit tingkat ${auditLevel} belum dapat lulus: ada tindak lanjut audit yang masih terbuka.`,
        );
        return;
      }
      if (sampleIssues.length) {
        setNotice(`Sampel audit tidak valid: ${sampleIssues.join(" ")}`);
        return;
      }
      if (!auditChecks.every((key) => audit.reviewChecks?.[key])) {
        setNotice(
          "Selesaikan checklist pemeriksaan tingkat ini sebelum lulus.",
        );
        return;
      }
      const missing = scopedTypes.filter((type) =>
        audit.sampleUnits?.length
          ? !audit.sampleUnits.some((unit) => unit.surveyType === type)
          : !audit.sampleIds.some((id) => state.dailyRecords.find((r) => r.id === id)?.surveyType === type),
      );
      if (missing.length) {
        setNotice(`Cakupan sampel belum mencakup: ${missing.join(", ")}.`);
        return;
      }
      if (
        auditLevel === 3 &&
        scopedTypes.includes("Jembatan") &&
        (!audit.bridgeTrustReference?.trim() ||
          !Number.isFinite(audit.bridgeTrustScore) ||
          audit.bridgeTrustScore < 0 ||
          audit.bridgeTrustScore > 100)
      ) {
        setNotice(
          "Catat skor 0–100 dan referensi formulir tingkat kepercayaan jembatan FRM-01.",
        );
        return;
      }
      patch = {
        ...patch,
        requiresReview: false,
        reviewReason: "",
        baNumber: ba,
        decisionNote: draft[`audit-note-${auditLevel}`] ?? audit.decisionNote,
      };
    }
    if (
      patch.status === "Ditolak" &&
      !(draft[`audit-rejection-${auditLevel}`] ?? "").trim()
    ) {
      setNotice("Alasan penolakan wajib diisi sebelum audit ditolak.");
      return;
    }
    const rejectionType = draft[`audit-rejection-type-${auditLevel}`];
    if (patch.status === "Ditolak" && !scopedTypes.includes(rejectionType as typeof scopedTypes[number])) {
      setNotice("Pilih jenis survei temuan agar tindak lanjut ditujukan dengan benar.");
      return;
    }
    const rejectionSource = `Penolakan audit tingkat ${auditLevel}`;
    const rejectionResolution = resolveAuditRejectionRecords({
      units: audit.sampleUnits ?? [],
      surveyType: rejectionType as typeof scopedTypes[number],
      records: state.dailyRecords,
    });
    if (patch.status === "Ditolak" && rejectionResolution.error) {
      setNotice(rejectionResolution.error);
      return;
    }
    if (patch.status === "Ditolak") {
      const surveyType = rejectionType as typeof scopedTypes[number];
      const recordIds = rejectionResolution.recordIds.filter(recordId => !hasOpenAuditRejectionCase({cases:state.corrections,source:rejectionSource,surveyType,recordId}));
      const input = {level:auditLevel,surveyType,note:(draft[`audit-rejection-${auditLevel}`]??"").trim(),baNumber:patch.baNumber,caseIds:recordIds.map((_,i)=>`KOR-AUD${auditLevel}-${Date.now()}-${i}`)};
      const result=applyAuditRejection(state,input);
      if (!result.next) {setNotice(result.error||"Penolakan audit tidak dapat dicatat.");return;}
      commit(auditRejectionAction(auditLevel),`Audit tingkat ${auditLevel}`,current=>applyAuditRejection(current,input).next??current);
      if(result.caseId)setCaseId(result.caseId);
      return;
    }
    const invalidates =
      audit.status === "Lulus" &&
      ((patch.status !== undefined && patch.status !== "Lulus") ||
        patch.reviewChecks !== undefined ||
        patch.bridgeTrustReference !== undefined ||
        patch.bridgeTrustScore !== undefined);
    commit(activity, `Audit tingkat ${auditLevel}`, (s) => ({
      ...s,
      audits: s.audits.map((x) =>
        x.level === auditLevel
          ? {
              ...x,
              ...patch,
              ...(invalidates && patch.status === undefined
                ? { status: "Dalam Review" as const }
                : {}),
            }
          : invalidates && x.level > auditLevel
            ? x.status === "Belum Dimulai" ? x : { ...x, requiresReview: true, reviewReason: `Audit tingkat ${auditLevel} berubah; periksa kembali keterkaitan keputusan.` }
            : x,
      ) as OperationalWorkflowState["audits"],
      acceptance:
        invalidates
          ? {
              ...s.acceptance,
              finalReport: false,
              finalAcceptance: false,
              terms: s.acceptance.terms.map((t) =>
                t.id === "T3" || t.id === "T4" ? { ...t, complete: false } : t,
              ),
            }
          : s.acceptance,
    }));

  };
  const levelLabels = ([1, 2, 3] as const).map(
    (level) => AUDIT_LEVEL_PRESENTATION[level].label,
  );
  const decisionTitle =
    auditLevel === 1
      ? "Bukti audit internal / kesiapan Penyedia"
      : "Keputusan audit & berita acara";
  const statusLabel =
    auditLevel === 1 ? "Status kesiapan internal" : "Status audit";
  const baLabel =
    auditLevel === 1 ? "Referensi audit internal / BA" : "Nomor berita acara";
  return (
    <>
      <header className="stage5-header">
        <div>
          <div className="stage5-kicker">Tahap 5 · Audit Mutu</div>
          <h2>Audit Mutu Data</h2>
        </div>
        <Badge tone={!audit.requiresReview && audit.status === "Lulus" ? "good" : audit.status === "Ditolak" ? "bad" : "warn"}>
          {auditStatusForDisplay(audit)}
        </Badge>
      </header>
      <div className="stage5-levels" aria-label="Tingkat audit">
        {([1, 2, 3] as const).map(level => (
          <button key={level} type="button" data-testid={`button-audit-level-${level}`}
            className={`stage5-level ${auditLevel === level ? "active" : ""} ${ownAuditLevel === level ? "own" : "readonly"}`}
            aria-pressed={auditLevel === level}
            aria-label={`Audit tingkat ${level}, ${level === 1 ? "Penyedia" : level === 2 ? "Balai" : "Direktorat"}, ${ownAuditLevel === level ? 'pekerjaan saya' : 'lihat saja'}`}
            onClick={() => {setAuditLevel(level);setActiveTab("ringkasan");}}>
            <span className="stage5-level-main"><strong>Tingkat {level} · {level === 1 ? "Penyedia" : level === 2 ? "Balai" : "Direktorat"}</strong><small>{ownAuditLevel === level ? "Pekerjaan saya" : isAdmin ? "Pemantauan" : "Lihat saja"}</small></span>
            <span className="stage5-level-status">{auditStatusForDisplay(state.audits[level - 1])}</span>
          </button>
        ))}
      </div>
      <div className="stage5-scope" data-testid="stage5-role-scope">
        <span><strong>{isAdmin ? 'Pemantauan administratif' : selectedLevelIsOwn ? 'Pekerjaan saya' : 'Mode lihat saja'}</strong> · Audit Tingkat {auditLevel}</span>
        {!isAdmin && !selectedLevelIsOwn && ownAuditLevel && (
          <button type="button" className="stage5-return" onClick={() => {setAuditLevel(ownAuditLevel);setActiveTab('ringkasan');}}>Kembali ke audit saya</button>
        )}
      </div>
      <div className="stage5-tabs" role="group" aria-label="Bagian pekerjaan audit">
        {([
          ["ringkasan", isAdmin ? "Status Audit" : "Ringkasan"],
          ...(!isAdmin ? [["sampel", auditLevel === 1 ? "Cakupan Data" : "Sampel"], ["formulir", "Formulir Audit"], ["keputusan", canEditAudit ? "Keputusan & Temuan" : "Hasil Audit"]] : []),
          ["dokumen", "BA & Dokumen"],
        ] as [Stage5Tab, string][]).map(([tab, label]) => (
          <button key={tab} type="button" data-testid={`stage5-tab-${tab}`} className={`stage5-tab ${activeTab === tab ? "active" : ""}`}
            aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)}>{label}</button>
        ))}
      </div>
      {state.corrections.some(
        (item) =>
          item.blockedStage === `Audit tingkat ${auditLevel}` &&
          item.status !== "Ditutup",
      ) && (
        <div className="wf-callout warn">
          Ada tindak lanjut audit terbuka.{" "}
          <button
            type="button"
            className="wf-button"
            onClick={() => onNavigate("/actions:Koreksi berbukti")}
          >
            Buka tindak lanjut
          </button>
        </div>
      )}
      {audit.requiresReview && (
        <div className="wf-callout warn">
          {audit.reviewReason} BA sebelumnya:{" "}
          {audit.baNumber || "Belum tercatat"}. Siapkan ulang sampel untuk
          meninjau revisi.
        </div>
      )}
      {activeTab === "formulir" && (
        <section className="stage5-section" aria-label={`Formulir audit tingkat ${auditLevel}`}>
      {state.project.surveyTypes.includes('Lendutan') && (()=>{
        const reference=sourceCatalog.find(document=>document.id==='ba-audit-lendutan');
        return reference ? <div className="wf-toolbar stage5-audit-reference">
          <a className="wf-button" data-source-reference-id={reference.id} href={`${import.meta.env.BASE_URL}${reference.asset}`} download>
            <FileText size={16} aria-hidden="true"/> Acuan checklist audit umum Lendutan (DOCX)
          </a>
        </div> : null;
      })()}
      <SourceAlignmentChecklist pciManual={state.productionTests.PCI.pciManual!==false}
        projectInfo={state.project}
        key={`${state.project.id}:audit-${auditLevel}`}
        packageId={`${state.project.id}::audit-${auditLevel}`}
        phase="audit"
        additionalAttachmentCategories={[`Bukti Audit Tingkat ${auditLevel}`,auditLevel===1?'Dokumen audit internal':`Berita Acara Audit Tingkat ${auditLevel}`]}
        legacyEvidenceIds={[`stage5-audit-${auditLevel}-evidence`,`stage5-audit-${auditLevel}-ba`]}
        surveyTypes={state.project.surveyTypes}
        role={state.role}
        editableRoles={[
          AUDIT_LEVEL_PRESENTATION[auditLevel].actor as WorkflowRole,
        ]}
        title={`Checklist ${AUDIT_LEVEL_PRESENTATION[auditLevel].label}`}
        onAnswersChanged={()=>{
          if(!canEditAudit||audit.status!=='Lulus')return;
          commit('Ubah jawaban sumber audit',`Audit ${auditLevel}`,current=>({...current,audits:current.audits.map(item=>item.level===auditLevel?{...item,requiresReview:true,reviewReason:'Jawaban checklist sumber audit berubah; periksa kembali.'}:item) as OperationalWorkflowState['audits']}));
        }}
      />
        </section>
      )}
      {activeTab === "ringkasan" && (
        <section className="stage5-section">
          {!isAdmin && <Panel title={`Status Audit Tingkat ${auditLevel}`} icon={ShieldCheck}>
            <div className="stage5-summary-line"><span>Pelaksana</span><strong>{requiredRole}</strong></div>
            <div className="stage5-summary-line"><span>Status</span><strong>{auditStatusForDisplay(audit)}</strong></div>
            <div className="stage5-summary-line"><span>Sampel</span><strong>{sampleCount} unit</strong></div>
            <div className="stage5-summary-line"><span>BA / Referensi</span><strong>{audit.baNumber || "Belum tercatat"}</strong></div>
            {canEditAudit && <div className="stage5-next-work">
              <Button id="stage5-open-next-work" kind="primary" onClick={() => setActiveTab(sampleCount > 0 ? 'formulir' : 'sampel')}>
                {sampleCount > 0 ? 'Buka formulir audit' : auditLevel === 1 ? 'Periksa cakupan data' : 'Periksa sampel'}
              </Button>
            </div>}
          </Panel>}
      {!isAdmin && <Panel title="Kesiapan Pemeriksaan" icon={ClipboardList}>
        <GateSummary title={`Syarat Tingkat ${auditLevel}`} items={startGateItems}/>
      </Panel>}
        </section>
      )}
      {activeTab === "dokumen" && (
        <section className="stage5-section">
      <Panel
        title={`Dokumen hasil audit · Tingkat ${auditLevel}`}
        icon={FileText}
      >
        <div className="wf-toolbar">
          {baAccess(
            "audit",
            isAdmin ? `Lihat dokumen audit tingkat ${auditLevel}` : `Lihat / susun dokumen audit tingkat ${auditLevel}`,
            0,
            {auditLevel},
          )}
          <Badge
            tone={
              !audit.requiresReview && audit.status === "Lulus"
                ? "good"
                : audit.status === "Ditolak"
                  ? "bad"
                  : "warn"
            }
          >
            {auditStatusForDisplay(audit)}
          </Badge>
        </div>
      </Panel>
        </section>
      )}
      <div className="stage5-layout">
        <div className="stage5-flow-group">
          {activeTab === "sampel" && (
            <section className="stage5-section">
          <Panel
            title={`Cakupan & sampling · tingkat ${auditLevel}`}
            icon={ClipboardList}
            extra={
              <Badge
                tone={
                  !audit.requiresReview && audit.status === "Lulus"
                    ? "good"
                    : audit.status === "Ditolak"
                      ? "bad"
                      : "warn"
                }
              >
                {auditStatusForDisplay(audit)}
              </Badge>
            }
          >
            {sampleIssues.length > 0 && sampleCount > 0 && (
              <div
                className="wf-callout warn"
                data-testid="audit-sample-integrity"
                style={{ marginBottom: 10 }}
              >
                Sampel perlu diperiksa ulang sebelum keputusan lulus:{" "}
                {sampleIssues.join(" ")}
              </div>
            )}
            <details className="stage5-source-rules">
              <summary>Ketentuan cakupan per jenis survei</summary>
            <div className="wf-table">
              <table data-testid={`table-sampling-level-${auditLevel}`}>
                <thead>
                  <tr>
                    <th>Jenis survei</th>
                    <th>Protokol cakupan</th>
                    <th>Cakupan konfigurasi</th>
                    <th>Satuan</th>
                  </tr>
                </thead>
                <tbody>
                  {scopedTypes.map((t) => {
                    const rule = samplingRule(t, auditLevel);
                    return (
                      <tr key={t}>
                        <td>
                          <strong>{t}</strong>
                        </td>
                        <td>{rule.label}</td>
                        <td>{auditLevel === 3 && t !== "Jembatan" ? "Perlu penetapan" : `${rule.rate}%`}</td>
                        <td>{auditLevel === 3 && t !== "Jembatan" ? "Jenis dan cakupan ditetapkan sesuai kebutuhan audit" : rule.unit}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </details>
            {levelThreeScopeUnresolved && (
              <div className="stage5-directorate-scope" data-testid="stage5-level3-manual-scope">
                <strong>Penetapan cakupan audit Direktorat</strong>
                <p>Jumlah unit ditetapkan dari kebutuhan audit. Jembatan tetap minimum 1% dan unit dipilih acak dari data yang tersedia.</p>
                <label htmlFor="directorate-scope-reference">Referensi penetapan cakupan</label>
                {canEditAudit ? <input id="directorate-scope-reference" aria-label="Referensi penetapan cakupan" value={draft['directorate-scope-reference']??audit.samplingBasisReference??''} placeholder="Nomor surat / dokumen dasar pemeriksaan" onChange={e=>saveText('directorate-scope-reference',e.target.value)} />
                  : <span>{audit.samplingBasisReference||'Belum tercatat'}</span>}
                {scopedTypes.filter(type=>type!=='Jembatan').map(type=>{
                  const eligible=directoratePopulation?.units.filter(unit=>unit.surveyType===type).length??0;
                  return <div className="stage5-directorate-scope-row" key={type}>
                    <label htmlFor={`directorate-count-${type}`}>{type} · {eligible} unit tersedia</label>
                    {canEditAudit ? <input id={`directorate-count-${type}`} type="number" min={1} max={eligible} step={1} aria-label={`Jumlah sampel ${type}`} value={draft[`directorate-scope-count-${type}`]??audit.samplingCoverage?.[type]?.sampledUnits??''} onChange={e=>saveText(`directorate-scope-count-${type}`,e.target.value)} placeholder="Jumlah unit" />
                      : <span>{audit.samplingCoverage?.[type]?.sampledUnits??'Belum ditetapkan'} unit</span>}
                  </div>;
                })}
                {directoratePopulation?.issues.length ? <p className="wf-callout warn">{directoratePopulation.issues.join(' ')}</p> : null}
              </div>
            )}
            <div className="wf-toolbar" style={{ marginTop: 10 }}>
              <Button
                id={`button-create-samples-${auditLevel}`}
                kind="primary"
                onClick={makeSamples}
                disabled={!canEditAudit || !canStart}
              >
                <Plus size={13} />
                {auditLevel === 1
                  ? "Catat cakupan audit internal"
                  : levelThreeScopeUnresolved ? "Tetapkan dan acak sampel" : "Siapkan sampel audit"}
              </Button>
              <Badge tone="info">{sampleCount} unit · {audit.sampleIds.length} rekaman sumber</Badge>
            </div>

            {!canStart && (
              <div className="wf-callout warn" style={{ marginTop: 9 }}>
                {auditLevel === 1
                  ? "Tertahan: Tahap 4 belum lengkap."
                  : "Tertahan: cek kesiapan paket, keputusan audit sebelumnya, dan referensi serah berkas."}
              </div>
            )}
            {audit.sampleUnits?.length ? (
              <div className="wf-table-wrap" style={{marginTop:9}}>
                <table className="wf-table" data-testid={`table-sample-units-${auditLevel}`}>
                  <thead><tr><th>Unit sampel</th><th>Sumber</th><th>Hasil pemeriksaan</th><th>Bukti pemeriksaan</th></tr></thead>
                  <tbody>{audit.sampleUnits.map(unit=><tr key={unit.id} data-testid={`sample-unit-${unit.id}`}>
                    <td><strong>{unit.unitKey}</strong><small>{unit.surveyType} · {unit.road} · {unit.unitType}{unit.lengthKm!==undefined?` · ${unit.lengthKm} km`:''}</small></td>
                    <td>{unit.sourceRecordId}<small>{unit.sourceReference||'Referensi sumber belum dicatat'}</small></td>
                    <td>{canEditAudit && auditLevel !== 1 ? <select aria-label={`Hasil sampel ${unit.unitKey}`} value={unit.reviewStatus??'Belum Diperiksa'} onChange={e=>patchSampleUnit(unit.id,{reviewStatus:e.target.value as AuditSampleUnit['reviewStatus']})}><option>Belum Diperiksa</option><option>Valid</option><option>Tidak Valid</option></select> : <span>{auditLevel === 1 ? "Cakupan audit internal" : unit.reviewStatus ?? "Belum diperiksa"}</span>}</td>
                    <td>{auditLevel===1 || !canEditAudit?<span>{unit.evidenceReference||unit.sourceReference||'Belum tercatat'}</span>:<input aria-label={`Bukti sampel ${unit.unitKey}`} value={unit.evidenceReference??''} placeholder="Nomor dokumen / foto / referensi" onChange={e=>patchSampleUnit(unit.id,{evidenceReference:e.target.value})}/>}</td>
                  </tr>)}</tbody>
                </table>
              </div>
            ) : audit.sampleIds.length > 0 ? (
              <div className="wf-callout warn" style={{marginTop:9}}>Sampel historis masih berbasis rekaman ({audit.sampleIds.length}). Riwayat dipertahankan; buat ulang sampel saat keputusan audit perlu diperbarui agar memakai unit titik/segmen/objek.</div>
            ) : <div className="wf-empty">Belum ada unit sampel audit tercatat.</div>}
          </Panel>

            </section>
          )}
          {activeTab === "ringkasan" && (
            <section className="stage5-section">
          <Panel title="Riwayat audit" icon={Activity}>
            {state.audits.map((a, i) => (
              <div
                className="wf-stage"
                key={a.level}
                data-testid={`audit-stage-${a.level}`}
              >
                <span className="wf-stage-num">{a.level}</span>
                <div>
                  <strong>{levelLabels[i]}</strong>
                  <small>
                    {a.sampleUnits?.length ?? a.sampleIds.length} unit · referensi{" "}
                    {a.baNumber || "belum dicatat"}
                  </small>
                </div>
                <Badge
                  tone={
                    !a.requiresReview && a.status === "Lulus"
                      ? "good"
                      : a.status === "Ditolak"
                        ? "bad"
                        : "warn"
                  }
                >
                  {auditStatusForDisplay(a)}
                </Badge>
              </div>
            ))}
          </Panel>
            </section>
          )}
        </div>

        <div className="stage5-flow-group">
          {activeTab === "keputusan" && (
            <section className="stage5-section">
          <Panel
            title={
              canEditAudit
                ? decisionTitle
                : `Ringkasan Audit Tingkat ${auditLevel}`
            }
            icon={FileCheck2}
          >
            {canEditAudit ? (
              <>
                {auditChecks.map((key) => (
                  <CheckRow
                    key={key}
                    id={`audit-review-${auditLevel}-${testId(key)}`}
                    label={key}
                    checked={!!audit.reviewChecks?.[key]}
                    onChange={(v) =>
                      patchAudit(
                        { reviewChecks: { ...audit.reviewChecks, [key]: v } },
                        "Catat checklist pemeriksaan audit",
                      )
                    }
                  />
                ))}
                {auditLevel === 3 && scopedTypes.includes("Jembatan") && (
                  <Field label="Referensi Form Tingkat Kepercayaan Jembatan FRM-01">
                    <input
                      data-testid="input-audit-bridge-trust-reference"
                      value={audit.bridgeTrustReference ?? ""}
                      onChange={(e) =>
                        patchAudit(
                          { bridgeTrustReference: e.target.value },
                          "Catat formulir kepercayaan jembatan",
                        )
                      }
                    />
                  </Field>
                )}
                <Field label={statusLabel}>
                  <Select
                    id={`select-audit-status-${auditLevel}`}
                    value={draft[`audit-status-${auditLevel}`] ?? audit.status}
                    options={[
                      "Belum Dimulai",
                      "Dalam Review",
                      "Klarifikasi",
                      "Lulus",
                      "Ditolak",
                    ]}
                    onChange={(v) => saveText(`audit-status-${auditLevel}`, v)}
                  />
                </Field>
                <Field label="Catatan pemeriksaan" full>
                  <textarea
                    data-testid={`input-audit-note-${auditLevel}`}
                    value={
                      draft[`audit-note-${auditLevel}`] ?? audit.decisionNote
                    }
                    onChange={(e) =>
                      saveText(`audit-note-${auditLevel}`, e.target.value)
                    }
                    placeholder="Catatan audit, temuan atau klarifikasi"
                  />
                </Field>
                {(draft[`audit-status-${auditLevel}`] ?? audit.status) === "Ditolak" && <>
                  <Field label="Jenis survei temuan penolakan">
                    <select data-testid={`select-audit-rejection-type-${auditLevel}`}
                      value={draft[`audit-rejection-type-${auditLevel}`] ?? ""}
                      onChange={(e) => saveText(`audit-rejection-type-${auditLevel}`, e.target.value)}>
                      <option value="">Pilih jenis survei</option>
                      {scopedTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </Field>
                  <Field label="Alasan penolakan" full>
                    <textarea
                      data-testid={`input-audit-rejection-${auditLevel}`}
                      value={draft[`audit-rejection-${auditLevel}`] ?? ""}
                      onChange={(e) => saveText(`audit-rejection-${auditLevel}`, e.target.value)}
                      placeholder="Ketidaksesuaian yang perlu ditindaklanjuti"
                    />
                  </Field>
                </>}
                <Field label={baLabel} full>
                  <input
                    data-testid={`input-audit-ba-${auditLevel}`}
                    value={draft[`audit-ba-${auditLevel}`] ?? audit.baNumber}
                    onChange={(e) =>
                      saveText(`audit-ba-${auditLevel}`, e.target.value)
                    }
                  />
                </Field>
                {auditLevel === 3 && scopedTypes.includes("Jembatan") && (
                  <Field label="Skor kepercayaan jembatan">
                    <input
                      type="number"
                      data-testid="input-audit-bridge-score"
                      value={audit.bridgeTrustScore}
                      onChange={(e) =>
                        patchAudit(
                          { bridgeTrustScore: Number(e.target.value) },
                          "Ubah skor kepercayaan jembatan",
                        )
                      }
                    />
                  </Field>
                )}
                <div className="wf-toolbar" style={{ marginTop: 10 }}>
                  <Button
                    id={`button-save-audit-${auditLevel}`}
                    kind="primary"
                    onClick={() => {
                      if (
                        (draft[`audit-status-${auditLevel}`] ?? audit.status) === "Ditolak" &&
                        !draft[`audit-rejection-${auditLevel}`]?.trim()
                      ) {
                        setNotice(
                          "Alasan penolakan wajib diisi sebelum audit ditolak.",
                        );
                        return;
                      }
                      patchAudit(
                        {
                          status: (draft[`audit-status-${auditLevel}`] ?? audit.status) as AuditLevel["status"],
                          decisionNote: draft[`audit-note-${auditLevel}`] ?? audit.decisionNote,
                          baNumber: draft[`audit-ba-${auditLevel}`] ?? audit.baNumber,
                        },
                        `Simpan keputusan audit tingkat ${auditLevel}`,
                      );
                      // Do not announce success here. patchAudit can reject a
                      // change, and storage authorization runs afterwards.
                      // The persisted status and visible error are the source
                      // of truth; a success toast here was misleading.
                    }}
                  >
                    <Save size={13} />
                    {auditLevel === 1
                      ? "Simpan bukti kesiapan"
                      : "Simpan keputusan / BA"}
                  </Button>
                </div>
              </>
            ) : (
              <AuditReadOnlySummary
                level={auditLevel}
                actor={requiredRole}
                activeRole={state.role}
                audit={audit}
                checks={auditChecks}
                showBridgeTrust={scopedTypes.includes("Jembatan")}
              />
            )}
          </Panel>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
