import {RoleWorkSection} from '../RoleWorkSection';
import {sourceInspectionStatus} from '../repository/sourceChecklistRepository';
import {usePersistedDraft} from '../../hooks/usePersistedDraft';
import {
  Activity,
  BadgeCheck,
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
import { buildAuditSamplePlan } from "../auditSamplePlan";
import { EvidenceAttachment } from "../EvidenceAttachment";
import { AUDIT_REVIEW_CHECKS, fieldReadiness } from "../flowRules";
import {
  AuditLevel,
  AuditSampleUnit,
  CorrectionCase,
  evaluateLrsGate,
  OperationalWorkflowState,
  samplingRule,
  SUBMISSION_DOCUMENTS,
  WorkflowRole,
} from "../model";
import { SourceAlignmentChecklist } from "../SourceAlignmentChecklist";
import { GateSummary } from "../WorkflowComponents";
import {
  AUDIT_LEVEL_PRESENTATION,
  STAGE5_ROLE_GUIDANCE,
} from "../workflowConfig";

import type { WorkflowStageProps } from "./stageSupport";
import {
  Badge,
  Button,
  CheckRow,
  defaultCase,
  Field,
  Panel,
  Select,
  testId,
} from "./stageSupport";
import { useWorkflowStage } from "./useWorkflowStage";

export function Stage5AuditWorkspace(props: WorkflowStageProps) {
  const { selection, state, onUpdate, setNotice, onNavigate } = props;
  const { baAccess, commit, heading } = useWorkflowStage(props);
  const [draft,setDraft]=usePersistedDraft<Record<string,string>>(`jala-ui-draft:${state.project.id}:${state.role}:Stage5AuditWorkspace`,{});
  const [caseId, setCaseId] = useCorrectionSelection(state.project.id);
  const [auditLevel, setAuditLevel] = useState<1 | 2 | 3>(state.role==='PIC Balai / Pengguna Jasa'?2:state.role==='Direktorat / Pusat'?3:1);
  const lrs = evaluateLrsGate(state.submission, state.simulationDate);
  const saveText = (key: string, value: string) =>
    setDraft((old) => ({ ...old, [key]: value }));

  const audit = state.audits[auditLevel - 1];
  const presentation = AUDIT_LEVEL_PRESENTATION[auditLevel];
  const requiredRole = presentation.actor as WorkflowRole;
  const canEditAudit = state.role === requiredRole;
  const scopedTypes = state.project.surveyTypes;
  const auditChecks = AUDIT_REVIEW_CHECKS[auditLevel];
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
  const previousAuditPassed =
    auditLevel === 1 ||
    (state.audits[auditLevel - 2].status === "Lulus" &&
      !state.audits[auditLevel - 2].requiresReview);
  const uploadReady =
    auditLevel === 1 || state.submission.validationStatus === "VALID";
  const canStart =
    auditLevel === 1 ? stage4Ready : previousAuditPassed && uploadReady;
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
            label: "Status paket/upload siap",
            ready: uploadReady,
            detail:
              state.submission.validationStatus === "VALID"
                ? "VALID"
                : "Belum VALID",
          },
        ]
      : []),
    {
      label: "Actor audit sesuai",
      ready: canEditAudit,
      detail: canEditAudit
        ? "Peran aktif dapat melakukan aksi"
        : `Aksi dilakukan oleh ${requiredRole}`,
    },
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
          : "Audit tingkat ini menunggu status paket VALID dan audit sebelumnya lulus.",
      );
      return;
    }
    const result = buildAuditSamplePlan({
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
    commit('Periksa unit sampel audit', unitId, (current)=>({
      ...current,
      audits: current.audits.map(item=>item.level===auditLevel?{...item,status:item.status==='Belum Dimulai'?'Dalam Review':item.status,sampleUnits:(item.sampleUnits??[]).map(unit=>unit.id===unitId?{...unit,...patch}:unit)}:item) as OperationalWorkflowState['audits'],
    }), 'Pemeriksaan unit sampel tersimpan.');
  };
  const patchAudit = (patch: Partial<AuditLevel>, activity: string) => {
    if (!canEditAudit) {
      setNotice(
        `Peran ${requiredRole} diperlukan untuk mengubah audit tingkat ${auditLevel}.`,
      );
      return;
    }
    if (patch.status === "Lulus") {
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
    const existingCase =
      patch.status === "Ditolak"
        ? state.corrections.find(
            (item) =>
              item.source === rejectionSource && item.surveyType === rejectionType && item.status !== "Ditutup",
          )
        : undefined;
    let rejectionCase: CorrectionCase | undefined;
    if (patch.status === "Ditolak" && !existingCase) {
      rejectionCase = defaultCase(state);
      rejectionCase.source = rejectionSource;
      rejectionCase.blockedStage = `Audit tingkat ${auditLevel}`;
      rejectionCase.returnStage = `Audit tingkat ${auditLevel}`;
      rejectionCase.owner =
        auditLevel === 3
          ? "PIC Balai / Pengguna Jasa"
          : "Penyedia Jasa / Ketua Tim";
      rejectionCase.surveyType = rejectionType as typeof scopedTypes[number];
      rejectionCase.originalValue =
        state.dailyRecords.find(
          (record) => record.surveyType === rejectionCase?.surveyType,
        )?.rawValue || "Belum ada nilai raw tertaut";
      rejectionCase.rejectionReason = (
        draft[`audit-rejection-${auditLevel}`] ?? ""
      ).trim();
      rejectionCase.linkedRecordId = state.dailyRecords.find(
        (record) => record.surveyType === rejectionCase?.surveyType,
      )?.id;
      rejectionCase.severity = auditLevel === 3 ? "Kritis" : "Mayor";
    }
    if (patch.status === "Ditolak") patch = { ...patch, decisionNote: (draft[`audit-rejection-${auditLevel}`] ?? "").trim() };
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
      corrections: rejectionCase
        ? [rejectionCase, ...s.corrections]
        : existingCase ? s.corrections.map(item => item.id === existingCase.id ? { ...item, rejectionReason: patch.decisionNote ?? item.rejectionReason } : item) : s.corrections,
      acceptance:
        invalidates || patch.status === "Ditolak"
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
    if (rejectionCase) setCaseId(rejectionCase.id);
    else if (existingCase) setCaseId(existingCase.id);
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
      {heading(
        "Tahap 5 · audit berjenjang",
        "Audit tingkat 1–3",
        "Pemeriksaan dilakukan berurutan. Tingkat 1 mencatat bukti kesiapan internal Penyedia; assurance formal berikutnya dilakukan PIC Balai dan Direktorat sesuai kewenangan.",
      )}
      <div
        className="wf-callout"
        data-testid="stage5-process-guide"
        style={{ marginBottom: 12 }}
      >
        <strong>Urutan audit:</strong> Tingkat 1 oleh Penyedia, Tingkat 2 oleh
        PIC Balai, dan Tingkat 3 oleh Direktorat. Catat cakupan serta bukti
        sebelum keputusan. Sampel dihitung secara konsisten dari rekaman yang
        tersedia; perubahan rekaman atau aturan sampling membutuhkan pemeriksaan
        ulang. Nomor BA yang dicatat bukan tanda tangan/pengesahan otomatis.
      </div>
      <RoleWorkSection primary={canEditAudit} title={`Hasil Audit Tingkat ${auditLevel}`}><SourceAlignmentChecklist pciManual={state.productionTests.PCI.pciManual!==false}
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
      /></RoleWorkSection>
      <div className="wf-callout" style={{ marginBottom: 12 }}>
        <strong>{state.role}:</strong> {STAGE5_ROLE_GUIDANCE[state.role]}
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
      <Panel title="Pilih tingkat pemeriksaan" icon={ShieldCheck}>
        <div className="wf-toolbar">
          {([1, 2, 3] as const).map((n) => (
            <button
              key={n}
              data-testid={`button-audit-level-${n}`}
              className={`wf-button ${auditLevel === n ? "primary" : ""}`}
              onClick={() => setAuditLevel(n)}
            >
              {levelLabels[n - 1]}
            </button>
          ))}
        </div>
        <div className="wf-callout" style={{ marginTop: 10 }}>
          <strong>{presentation.label}</strong>
          <div className="wf-note" style={{ marginTop: 4 }}>
            {presentation.purpose}
          </div>
        </div>
        <GateSummary
          title={`Kesiapan Audit Tingkat ${auditLevel}`}
          items={startGateItems}
        />

        <div className="stage-audit-role">
          <div>
            <small>Pelaksana</small>
            <strong>{requiredRole}</strong>
          </div>

          <div>
            <small>Peran aktif</small>
            <strong>{state.role}</strong>
          </div>

          <div>
            <small>Akses</small>
            <strong>
              {canEditAudit ? "Pemeriksaan & keputusan" : "Read-only"}
            </strong>
          </div>
        </div>

      </Panel>

      <Panel
        title={`Dokumen hasil audit · Tingkat ${auditLevel}`}
        icon={FileText}
      >
        <p className="wf-note">
          Ringkasan mengikuti sampel, checklist, temuan, dan keputusan audit
          yang sudah tercatat. Dokumen ini bukan BA Audit resmi sampai format
          dan pengesahannya ditetapkan.
        </p>
        <div className="wf-toolbar">
          {baAccess(
            "audit",
            `Lihat / susun dokumen audit tingkat ${auditLevel}`,
          )}
          <Badge
            tone={
              audit.status === "Lulus"
                ? "good"
                : audit.status === "Ditolak"
                  ? "bad"
                  : "warn"
            }
          >
            {audit.status}
          </Badge>
        </div>
      </Panel>
      <div className="wf-grid" style={{ marginTop: 12, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <Panel
            title={`Cakupan & sampling · tingkat ${auditLevel}`}
            icon={ClipboardList}
            extra={
              <Badge
                tone={
                  audit.status === "Lulus"
                    ? "good"
                    : audit.status === "Ditolak"
                      ? "bad"
                      : "warn"
                }
              >
                {audit.status}
              </Badge>
            }
          >
            <div className="wf-note" style={{ marginBottom: 8 }}>
              Cakupan mengikuti jenis survei dan tingkat audit. Aturan sampling
              ditampilkan dari konfigurasi yang berlaku.
            </div>
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
            <div className="wf-table">
              <table data-testid={`table-sampling-level-${auditLevel}`}>
                <thead>
                  <tr>
                    <th>Jenis survei</th>
                    <th>Protokol cakupan</th>
                    <th>Rate</th>
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
                        <td>{rule.rate}%</td>
                        <td>{rule.unit}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
                  : "Siapkan sampel audit"}
              </Button>
              <Badge tone="info">{sampleCount} unit · {audit.sampleIds.length} rekaman sumber</Badge>
            </div>
            {!canEditAudit && (
              <div className="wf-callout" style={{ marginTop: 9 }}>
                Read-only pada peran ini. Aksi Tingkat {auditLevel} dilakukan
                oleh <strong>{requiredRole}</strong>.
              </div>
            )}
            {!canStart && (
              <div className="wf-callout warn" style={{ marginTop: 9 }}>
                {auditLevel === 1
                  ? "Tertahan: Tahap 4 belum lengkap."
                  : "Tertahan: paket belum VALID atau audit sebelumnya belum lulus."}
              </div>
            )}
            {audit.sampleUnits?.length ? (
              <div className="wf-table-wrap" style={{marginTop:9}}>
                <table className="wf-table" data-testid={`table-sample-units-${auditLevel}`}>
                  <thead><tr><th>Unit sampel</th><th>Sumber</th><th>Hasil pemeriksaan</th><th>Bukti pemeriksaan</th></tr></thead>
                  <tbody>{audit.sampleUnits.map(unit=><tr key={unit.id} data-testid={`sample-unit-${unit.id}`}>
                    <td><strong>{unit.unitKey}</strong><small>{unit.surveyType} · {unit.road} · {unit.unitType}{unit.lengthKm!==undefined?` · ${unit.lengthKm} km`:''}</small></td>
                    <td>{unit.sourceRecordId}<small>{unit.sourceReference||'Referensi sumber belum dicatat'}</small></td>
                    <td><select aria-label={`Hasil sampel ${unit.unitKey}`} disabled={!canEditAudit||auditLevel===1} value={unit.reviewStatus??'Belum Diperiksa'} onChange={e=>patchSampleUnit(unit.id,{reviewStatus:e.target.value as AuditSampleUnit['reviewStatus']})}><option>Belum Diperiksa</option><option>Valid</option><option>Tidak Valid</option></select>{auditLevel===1&&<small>Audit internal mencakup seluruh unit.</small>}</td>
                    <td>{auditLevel===1?<span>{unit.evidenceReference||unit.sourceReference||'Mengikuti bukti sumber'}</span>:<input aria-label={`Bukti sampel ${unit.unitKey}`} disabled={!canEditAudit} value={unit.evidenceReference??''} placeholder="Nomor dokumen / foto / referensi" onChange={e=>patchSampleUnit(unit.id,{evidenceReference:e.target.value})}/>}</td>
                  </tr>)}</tbody>
                </table>
              </div>
            ) : audit.sampleIds.length > 0 ? (
              <div className="wf-callout warn" style={{marginTop:9}}>Sampel historis masih berbasis rekaman ({audit.sampleIds.length}). Riwayat dipertahankan; buat ulang sampel saat keputusan audit perlu diperbarui agar memakai unit titik/segmen/objek.</div>
            ) : <div className="wf-empty">Belum ada unit sampel audit tercatat.</div>}
          </Panel>

          <Panel title="Jejak audit berjenjang" icon={Activity}>
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
                    a.status === "Lulus"
                      ? "good"
                      : a.status === "Ditolak"
                        ? "bad"
                        : "warn"
                  }
                >
                  {a.status}
                </Badge>
              </div>
            ))}
          </Panel>
        </div>

        <div style={{ display: "grid", gap: 12, alignContent: "start" }}>
          <Panel title="Peran & kewenangan" icon={BadgeCheck}>
            <div className="wf-row">
              <span>Pelaksana tingkat ini</span>
              <strong>{requiredRole}</strong>
            </div>
            <div className="wf-row">
              <span>Peran aktif</span>
              <Badge tone={canEditAudit ? "good" : "info"}>{state.role}</Badge>
            </div>
            <div className="wf-callout" style={{ marginTop: 10 }}>
              {presentation.purpose}
            </div>
            {auditLevel === 1 && (
              <div className="wf-note" style={{ marginTop: 8 }}>
                Audit Tingkat 1 merupakan pemeriksaan internal Penyedia. Audit
                Tingkat 2 dilakukan PIC Balai / Pengguna Jasa, dan Audit Tingkat
                3 dilakukan Direktorat / Pusat.
              </div>
            )}
          </Panel>

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
                    value={audit.status}
                    options={[
                      "Belum Dimulai",
                      "Dalam Review",
                      "Klarifikasi",
                      "Lulus",
                      "Ditolak",
                    ]}
                    onChange={(v) =>
                      patchAudit(
                        { status: v as AuditLevel["status"] },
                        `Ubah status audit tingkat ${auditLevel}`,
                      )
                    }
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
                <Field label="Jenis survei temuan penolakan">
                  <select data-testid={`select-audit-rejection-type-${auditLevel}`}
                    value={draft[`audit-rejection-type-${auditLevel}`] ?? ""}
                    onChange={(e) => saveText(`audit-rejection-type-${auditLevel}`, e.target.value)}>
                    <option value="">Pilih jenis survei</option>
                    {scopedTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </Field>
                <Field
                  label="Alasan penolakan (wajib bila status Ditolak)"
                  full
                >
                  <textarea
                    data-testid={`input-audit-rejection-${auditLevel}`}
                    value={draft[`audit-rejection-${auditLevel}`] ?? ""}
                    onChange={(e) =>
                      saveText(`audit-rejection-${auditLevel}`, e.target.value)
                    }
                    placeholder="Uraikan ketidaksesuaian yang memicu tindak lanjut."
                  />
                </Field>
                <Field label={baLabel} full>
                  <input
                    data-testid={`input-audit-ba-${auditLevel}`}
                    value={draft[`audit-ba-${auditLevel}`] ?? audit.baNumber}
                    onChange={(e) =>
                      saveText(`audit-ba-${auditLevel}`, e.target.value)
                    }
                  />
                </Field>
                {auditLevel === 3 && (
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
                        audit.status === "Ditolak" &&
                        !draft[`audit-rejection-${auditLevel}`]?.trim()
                      ) {
                        setNotice(
                          "Alasan penolakan wajib diisi sebelum audit ditolak.",
                        );
                        return;
                      }
                      patchAudit(
                        {
                          decisionNote: [
                            draft[`audit-note-${auditLevel}`] || "",
                            audit.status === "Ditolak"
                              ? `Alasan: ${draft[`audit-rejection-${auditLevel}`]}`
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" · "),
                          baNumber:
                            draft[`audit-ba-${auditLevel}`] ?? audit.baNumber,
                        },
                        `Simpan keputusan audit tingkat ${auditLevel}`,
                      );
                      setNotice(
                        auditLevel === 1
                          ? "Bukti audit internal/kesiapan dicatat."
                          : "Keputusan audit dan referensi BA dicatat.",
                      );
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
              />
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
