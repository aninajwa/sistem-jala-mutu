import {automaticFields,fieldsFor} from '../ba/docxEngine';
import {technicalFields} from '../ba/technicalMapping';
import {baFieldErrors} from '../ba/fieldValidation';
import {periodRange} from '../stages/periodSchedule';
import {INITIAL_WORKFLOW,type SurveyType} from '../model';
import sourceCatalog from "../sourceChecklistCatalog.json";
import {
  readEvidenceLinks,
  evidenceCategories,
} from "../repository/evidenceLinks";
import type { OperationalWorkflowState } from "../model";
import { localPersistence } from "../repository/localPersistence";
import { BA_TEMPLATES, type BaKind } from "../ba/docxEngine";
import {
  baKey,
  documentRepository,
  type BaIdentity,
} from "../ba/documentRepository";
import {
  DOCUMENT_STATUS_LABELS,
  documentActors,
  documentFingerprint,
} from "../ba/documentWorkflow";
export const documentStages: Record<
  BaKind,
  { label: string; selection: string; category: string }
> = {
  kalibrasi: {
    label: "Tahap 1–2",
    selection: "/entry:Validasi produksi",
    category: "Kalibrasi",
  },
  konsistensi: {
    label: "Tahap 3B",
    selection: "/verification:Verval 14 hari",
    category: "Verifikasi berkala",
  },
  internal: {
    label: "Tahap 3B",
    selection: "/verification:Verval 14 hari",
    category: "Verifikasi berkala",
  },
  duaMingguan: {
    label: "Tahap 3B",
    selection: "/verification:Verval 14 hari",
    category: "Verifikasi berkala",
  },
  bertahap: {
    label: "Tahap 4",
    selection: "/entry:Gerbang RNI/LRS",
    category: "Validasi",
  },
  audit: {
    label: "Tahap 5",
    selection: "/verification:Audit tingkat 1–3",
    category: "Audit & penerimaan",
  },
  penerimaan: {
    label: "Tahap 6",
    selection: "/reports:Penerimaan & termin",
    category: "Audit & penerimaan",
  },
};
export const isPeriodicBa = (kind: BaKind) =>
  ["konsistensi", "internal", "duaMingguan"].includes(kind);
export function availablePeriods(state: OperationalWorkflowState) {
  return [
    ...new Set([
      ...listPackageDocuments(state).filter(row=>isPeriodicBa(row.identity.kind)).map(row=>row.identity.period),
      state.activeCyclePeriod ?? 1,
      ...Object.keys(state.cycleHistory ?? {}).map(Number),
    ]),
  ]
    .filter((n) => Number.isSafeInteger(n) && n > 0)
    .sort((a, b) => a - b);
}
/** Read existing identities without a migration, destructive index, or Cartesian product of empty drafts. */
export function listPackageDocuments(state: OperationalWorkflowState) {
  const rows = [];
  for (const key of localPersistence.keys?.() ?? []) {
    const prefix = `jala-ba-source-v1:${state.project.id}:`;
    if (!key.startsWith(prefix)) continue;
    const suffix = key.slice(prefix.length),
      match = /^([^:]+):(\d+):(.+):(\d+)$/.exec(suffix);
    if (!match) continue;
    const template = BA_TEMPLATES.find((t) => t.id === match[1]);
    if (!template) continue;
    const identity: BaIdentity = {
      packageId: state.project.id,
      kind: template.id,
      period: Number(match[2]),
      survey: match[3],
      auditLevel: Number(match[4]),
    };
    if (identity.auditLevel < 1 || identity.auditLevel > 3) continue;
    const record = documentRepository.read(identity);
    if (!record || !record.draft || !Array.isArray(record.versions)) continue;
    const latest = record.versions.at(-1);
    if (!latest && !Object.keys(record.draft).length) continue;
    const actors = documentActors(identity),
      stale =
        !!latest?.sourceFingerprint &&
        latest.sourceFingerprint !== documentFingerprint(state, identity);
    const cycle=identity.period===(state.activeCyclePeriod??1)?state.cycle:state.cycleHistory?.[String(identity.period)]??{...INITIAL_WORKFLOW.cycle,selectedTypes:state.project.surveyTypes,certificateId:'',periodCompleted:false};
    const context=identity.period?{...state,cycle}:state;
    const range=identity.period?periodRange(state.project.id,identity.period,state.project.surveyStartDate,state.project.surveyEndDate):{start:state.project.surveyStartDate??'',end:state.project.surveyEndDate??''};
    const locked=latest?.status==='submitted-local'||latest?.status==='reviewed-local';
    const values=locked?latest.fields:{...record.draft,...automaticFields(template,context,identity.survey as SurveyType,range,identity.auditLevel as 1|2|3),...technicalFields(template,context,identity.survey as SurveyType,range,identity.auditLevel)};
    const missing=baFieldErrors(identity.kind,identity.survey as SurveyType,values).length;
    rows.push({
      missing,
      localStatus:latest?.status??'local-draft',
      id: baKey(identity),
      identity,
      title: documentTitles[template.id],
      stage: documentStages[template.id],
      status:
        DOCUMENT_STATUS_LABELS[latest?.status ?? "local-draft"] ??
        "Status lama",
      version: latest?.version ?? 0,
      stale,
      updatedAt: latest?.createdAt,
      authors: actors.authors,
      reviewer: actors.reviewer,
    });
  }
  return rows.sort((a, b) =>
    (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""),
  );
}
export function attachmentLocation(
  key: string,
  packages: Record<string, OperationalWorkflowState>,
) {
  const state = Object.values(packages).find((item) =>
    key.startsWith(item.project.id + ":"),
  );
  if (!state) return undefined;
  const suffix = key.slice(state.project.id.length);
  const match = /^:ba-([^:]+)-p(\d+)-(.+)-audit([123]):documents:/.exec(suffix);
  const template = match
    ? BA_TEMPLATES.find((item) => item.id === match[1])
    : undefined;
  const identity: BaIdentity | undefined =
    match && template
      ? {
          packageId: state.project.id,
          kind: template.id,
          period: Number(match[2]),
          survey: match[3],
          auditLevel: Number(match[4]),
        }
      : undefined;
  const scope = key.includes(":documents:")
    ? key.slice(0, key.indexOf(":documents:"))
    : undefined;
  const link = scope ? readEvidenceLinks(scope)[key] : undefined;
  const categories = link && !link.detached ? evidenceCategories(link) : [];
  const source = (
    sourceCatalog as { id: string; survey: string; phase: string }[]
  ).find((item) => suffix.includes(":form-" + item.id + ":"));
  const phaseStages: Record<string, string> = {
    calibration: "Tahap 1",
    consistency: "Tahap 3B",
    internal: "Tahap 3B",
    periodic14: "Tahap 3B",
    staged: "Tahap 4",
    audit: "Tahap 5",
    acceptance: "Tahap 6",
  };
  const stageMatch = /:stage([0-6])([ab])?/i.exec(suffix);
  const stage = identity
    ? documentStages[identity.kind].label
    : source
      ? (phaseStages[source.phase] ?? "Tahap belum terpetakan")
      : stageMatch
        ? `Tahap ${stageMatch[1]}${stageMatch[2]?.toUpperCase() ?? ""}`
        : "Tahap belum terpetakan";
  const period = /::period-(\d+):/.exec(suffix)?.[1];
  const label = identity
    ? `${template!.title} · ${documentStages[identity.kind].label} · ${identity.survey}${identity.period ? ` · Periode ${identity.period}` : ""}${identity.kind === "audit" ? ` · Audit ${identity.auditLevel}` : ""}`
    : [
        stage,
        source?.survey,
        period ? `Periode ${period}` : undefined,
        categories.length ? categories.join(", ") : "Lampiran kegiatan paket",
      ]
        .filter(Boolean)
        .join(" · ");
  return {
    packageId: state.project.id,
    packageName: state.project.packageName,
    identity,
    label,
  };
}

export const documentPurposes: Record<BaKind,string> = {
 kalibrasi:'Mencatat kalibrasi peralatan dan validasi awal sebelum produksi data.',
 konsistensi:'Mencatat konsistensi alat dan metode pada periode pemeriksaan.',
 internal:'Mendokumentasikan pemeriksaan internal Penyedia sebelum penyerahan data.',
 duaMingguan:'Mencatat verifikasi bersama atas data periode dua mingguan.',
 bertahap:'Mencatat verifikasi pada tahapan progres sebelum audit data.',
 audit:'Mencatat checklist, temuan, dan tindak lanjut audit sesuai tingkatnya.',
 penerimaan:'Mencatat rincian dan keputusan penerimaan setelah pemeriksaan sumber.'
};
export function documentRoleFocus(role:string){
 return role==='Admin'?'Monitoring administratif: telusuri status, sumber, lampiran, dan riwayat.':
 role==='Direktorat / Pusat'?'Monitoring lintas Balai dan audit tingkat 3 pada paket dalam cakupan akses.':
 role==='PIC Balai / Pengguna Jasa'?'Periksa dokumen yang diajukan; siapkan audit tingkat 2 dan penerimaan sesuai kewenangan.':
 'Siapkan dokumen internal, lengkapi draft, dan tindak lanjuti permintaan revisi.';
}

export const documentTitles:Record<BaKind,string>={kalibrasi:'Kalibrasi dan Validasi',konsistensi:'Konsistensi',internal:'Verifikasi dan Validasi Internal',duaMingguan:'Verifikasi dan Validasi 2-Mingguan',bertahap:'Verifikasi dan Validasi Bertahap',audit:'Checklist Audit Data Survei Kondisi Jalan',penerimaan:'Penerimaan Data'};
