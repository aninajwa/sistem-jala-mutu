import { validCorrectionEvidenceDigests } from "./correctionSubmittedEvidence";
import { CORRECTION_VERIFICATION_STEPS, correctionVerificationAttempt, correctionVerificationEvidenceErrors } from "./correctionVerificationEvidence";
import { requiresLayeredCorrectionVerification } from "./correctionActionPolicy";
import type { CorrectionCase } from "./model";
import { requiresNewScenarioEvidence, specialCorrectionErrors, RULE_CHECKS, RULE_NUMBERS, visibleProposalScenarioChecks } from "./correctionRules";

/** Source-backed families; fields marked required are application traceability requirements,
 * not a claim that each original checklist contains an identically named mandatory column. */
export type CorrectionExecutionField = {
  id: string;
  label: string;
  required: boolean;
  help?: string;
  choices?: string[];
  fixedValue?: string;
  source: string;
};
export type CorrectionFormSpec = {
  family: string;
  fields: CorrectionExecutionField[];
  surveyContext: string;
  sourceContext: string;
};
const kak = "KAK 2026 §11.10.7; Draft PP bagian Tindakan Perbaikan";
const evidence = "KAK 2026 §koreksi pemrosesan/penyajian data";
const spec = (id: string, label: string, source = kak, required = true): CorrectionExecutionField => ({id,label,source,required});

// Keep existing payload IDs stable. Checklist-specific labels describe the
// affected scope, not an obligation to repeat unrelated source inspections.
const surveyScope: Partial<Record<CorrectionCase['surveyType'], string>> = {
  IRI: "Ruas dan segmen/STA yang diperbaiki",
  PCI: "Segmen sampel dan metode PCI (Manual/AI)",
  Lendutan: "Titik pengukuran dan metode (FWD/BB/LWD)",
  Jembatan: "Nomor/nama jembatan dan jenis pemeriksaan",
  Lereng: "Identitas lereng dan lokasi/koordinat",
  Drainase: "Segmen drainase dan jenis saluran",
  "Lalu Lintas": "Titik pengamatan dan periode pencacahan",
  RNI: "Ruas, segmen dan atribut inventarisasi terdampak",
};

export function resolveCorrectionForm(c: CorrectionCase, values: Record<string,string> = {}): CorrectionFormSpec {
  const a = (c.actionType || "").toLowerCase();
  let family = "Tindak lanjut umum";
  let fields: CorrectionExecutionField[] = [];
  if (a.includes("survei ulang")) {
    family = "Survei ulang";
    fields = [spec("coverage", surveyScope[c.surveyType] || "Cakupan lokasi/objek yang disurvei ulang"), spec("newRecord", "ID rekaman survei ulang")];
  } else if (a.includes("penilaian ulang")) {
    family = "Penilaian ulang";
    fields = [spec("evaluatedObject", surveyScope[c.surveyType] || "Objek/sampel penilaian ulang"), spec("comparison", "Referensi hasil awal dan hasil penilaian pembanding")];
  } else if (a.includes("foto") || a.includes("video")) {
    family = "Pengambilan ulang foto/video";
    fields = [spec("mediaObject", "Segmen/objek pengambilan ulang"), spec("mediaReference", "Referensi foto/video pengganti")];
  } else if (a.includes("pelatihan")) {
    family = "Pelatihan ulang";
    fields = [spec("participants", "Personel dan kegiatan pelatihan"), spec("trainingEvaluation", "Bukti hasil evaluasi pelatihan")];
  } else if (a.includes("kalibrasi")) {
    family = "Kalibrasi ulang";
    fields = [spec("instrumentId", "Jenis dan identitas alat"), spec("calibrationEvidence", "Referensi hasil kalibrasi/validasi alat")];
  } else if (a.includes("penggantian komponen")) {
    family = "Penggantian komponen alat";
    fields = [spec("instrumentId", "Identitas alat dan komponen lama/baru"), spec("postReplacement", "Referensi pemeriksaan setelah penggantian")];
  } else if (a.includes("penggantian personel")) {
    family = "Penggantian personel";
    fields = [spec("assignment", "Penugasan/personel yang diganti dan pengganti"), spec("competence", "Bukti evaluasi personel pengganti")];
  } else if (a.includes("pemrosesan")) {
    family = "Koreksi pemrosesan/penyajian";
    fields = [spec("rawReference", "ID dataset raw asli (tidak diubah)", evidence), spec("cleanedReference", "ID/versi dataset cleaned usulan", evidence), spec("processingMethod", "Metode koreksi dan log perubahan", evidence)];
  } else if (a.includes("investigasi")) {
    family = "Investigasi dan rencana tindak lanjut";
    fields = [spec("investigation", "Hasil investigasi dan rencana tindak lanjut")];
  }
  if (c.surveyType === "PCI" && (family === "Survei ulang" || family === "Penilaian ulang")) {
    const source = "Checklist verifikasi dan validasi internal PCI Manual/AI";
    const method = c.originPciMethod ?? values.pciMethod;
    fields.push({...spec("pciMethod", "Metode PCI", source), choices: c.originPciMethod ? [c.originPciMethod] : ["Manual", "AI"], fixedValue: c.originPciMethod});
    if (method === "Manual") {
      fields.push(spec("pciRaterReference", "Referensi penilai dan hasil pemeriksaan antarpenilai", source));
    } else if (method === "AI") {
      fields.push(spec("pciDetectionReference", "Referensi hasil validasi deteksi kerusakan AI", source));
    }
  }
  const surveyContext: Record<string,string> = {
    IRI: "Ruas, segmen/STA, rekaman raw IRI dan alat hanya sesuai butir IRI yang gagal.",
    PCI: "STA/segmen sampel dan metode PCI Manual/AI harus mengikuti checklist sumber; foto tidak menggantikan pengukuran fisik yang dipersyaratkan.",
    RNI: "Rujuk ruas dan segmen inventarisasi serta butir RNI sumber.",
    Lendutan: "Pastikan metode FWD/BB/LWD dan identitas alat/titik sesuai sumber; jangan pakai ambang alat lain.",
    Jembatan: "Rujuk nomor/nama jembatan dan jenis inspeksi; STA tidak diwajibkan bila bukan identitas objek.",
    Drainase: "Rujuk segmen/objek drainase serta InDrain/LRS bila memang terkait temuan.",
    Lereng: "Rujuk ID/koordinat objek lereng dan butir inspeksi asal.",
    "Lalu Lintas": "Rujuk titik TC, durasi dan rekaman sesuai pemeriksaan sumber; data hilang bukan volume nol.",
  };
  return {family,fields,surveyContext:surveyContext[c.surveyType] || "Gunakan identitas objek dan checklist tahap asal.",sourceContext:`${c.source} · ${c.blockedStage} · ${c.rejectionReason}`};
}

export function validateCorrectionExecutionFields(specification: CorrectionFormSpec, values: Record<string,string>): string[] {
  return specification.fields.filter(f => f.required && (typeof values[f.id] !== "string" || !values[f.id].trim() || (f.choices && !f.choices.includes(values[f.id])))).map(f => `${f.label} wajib dilengkapi untuk ${specification.family}.`);
}

/** Local evidence references are not authenticated server-side attachments. */
export type CorrectionExecution = {
  date: string; summary: string; sourceReference: string; period: string;
  lane: string; equipment: string; verificationReference: string;
  scenarioChecks?: Record<string, boolean>; scenarioNumbers?: Record<string, number>;
  actionFields: Record<string, string>; evidenceKeys: string[]; evidenceNote: string; evidenceDigests?: Record<string, string>;
};
export function correctionExecutionContext(c: CorrectionCase) {
  const action = c.actionType.toLowerCase();
  const resurvey = action.includes("survei ulang");
  const stage = `${c.source} ${c.blockedStage}`.toLowerCase();
  return {
    // Lane and equipment requirements below are conservative application rules,
    // not a replacement for the source inspection checklist.
    lane: resurvey && c.surveyType === "IRI",
    equipment: resurvey && ["IRI", "Lendutan"].includes(c.surveyType),
    periodic: /14 hari|3b|berkala/.test(stage),
    consistency: /14 hari|3b|berkala/.test(stage) && (resurvey || action.includes("pemrosesan")),
    file: resurvey || /foto|video|kalibrasi|pemrosesan/.test(action),
  };
}
export function correctionExecutionErrors(c: CorrectionCase, result: CorrectionExecution | undefined, projectId: string, attempt = 0): string[] {
  if (!result || typeof result !== "object") return ["Lengkapi formulir hasil pelaksanaan."];
  const text = (v: unknown) => typeof v === "string" && !!v.trim();
  const context = correctionExecutionContext(c);
  const errors = validateCorrectionExecutionFields(resolveCorrectionForm(c, result.actionFields || {}), result.actionFields || {});
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result.date || "") || !Number.isFinite(Date.parse(result.date)) || new Date(result.date).toISOString().slice(0,10) !== result.date) errors.push("Tanggal pelaksanaan tidak valid.");
  if (!text(result.summary) || !text(result.sourceReference)) errors.push("Uraian dan referensi hasil wajib tersedia.");
  if (context.lane && !text(result.lane)) errors.push("Lajur dan arah IRI wajib tersedia.");
  if (context.equipment && !text(result.equipment)) errors.push("Identitas alat wajib tersedia.");
  if (context.periodic && (!text(result.period) || (c.cyclePeriod != null && result.period !== String(c.cyclePeriod)))) errors.push("Periode harus sesuai sumber temuan.");
  if (context.consistency && !text(result.verificationReference)) errors.push("Referensi pemeriksaan konsistensi wajib tersedia.");
  const prefix = `${projectId}::correction::${c.id}::execution${attempt > 1 ? `::submission-${attempt}` : ""}:documents:`;
  const keys = result.evidenceKeys;
  if (!Array.isArray(keys) || keys.some(k => typeof k !== "string" || !k.startsWith(prefix) || !k.slice(prefix.length).trim() || k !== k.trim())) errors.push("Referensi lampiran tidak sesuai kasus.");
  else if (new Set(keys).size !== keys.length) errors.push("Referensi lampiran tidak boleh berulang.");
  else if (!keys.length && (context.file || !text(result.evidenceNote))) errors.push("Lampiran atau alasan yang sesuai wajib tersedia.");
  if (result.evidenceDigests !== undefined && (!Array.isArray(keys) || !validCorrectionEvidenceDigests(keys, result.evidenceDigests))) errors.push("Identitas isi lampiran tidak lengkap atau tidak sesuai referensi.");
  if (requiresLayeredCorrectionVerification(c)) {
    errors.push(...correctionVerificationEvidenceErrors(c, correctionVerificationAttempt(c, attempt), CORRECTION_VERIFICATION_STEPS));
    const reviewedVersion = c.verificationEvidence?.balai?.dataVersionReference?.trim();
    if (!reviewedVersion || result.actionFields?.cleanedReference?.trim() !== reviewedVersion) errors.push("Versi hasil cleaned harus sama dengan versi data yang telah diperiksa.");
  }
  if (requiresNewScenarioEvidence(c)) errors.push(...specialCorrectionErrors({ ...c, ruleChecks: result.scenarioChecks || {}, ruleNumbers: result.scenarioNumbers || {} }));
  return errors;
}

/** Prefer the actual source reference over the legacy concatenated display text. */
export function correctionResultReference(c: CorrectionCase): string {
  return c.executionResult?.sourceReference?.trim() || (!c.executionResult ? c.executionReference?.trim() : '') || '';
}

/** Recorded proposal requirements, separate from results that only exist after execution. */
export function correctionProposalTechnicalSummary(c: CorrectionCase): {label: string; value: string}[] {
  const scenario = c.ruleScenario;
  if (!scenario || scenario === "Umum") return [];
  return [
    {label: "Skenario teknis", value: scenario},
    ...visibleProposalScenarioChecks(c).flatMap(label => typeof c.ruleChecks?.[label] === "boolean" ? [{label, value: c.ruleChecks[label] ? "Ya" : "Tidak"}] : []),
    ...(!requiresNewScenarioEvidence(c) ? (RULE_NUMBERS[scenario] || []).flatMap(label => Number.isFinite(c.ruleNumbers?.[label]) ? [{label, value: String(c.ruleNumbers?.[label])}] : []) : []),
    ...(scenario === "Pemutakhiran setelah verval Direktorat" && c.provinceUpdateBa?.trim() ? [{label:"BA Pemutakhiran Data Provinsi",value:c.provinceUpdateBa}] : []),
  ];
}

/** Only display known operational labels, never arbitrary payload keys or local storage paths. */
export function correctionExecutionSummary(c: CorrectionCase): {label: string; value: string}[] {
  const r = c.executionResult;
  if (!r) return [];
  const rows = [
    {label: "Tanggal pelaksanaan", value: r.date},
    {label: "Uraian hasil", value: r.summary},
    {label: "Referensi hasil", value: r.sourceReference},
    {label: "Periode", value: r.period},
    {label: "Lajur dan arah", value: r.lane},
    {label: "Identitas alat", value: r.equipment},
    {label: "Referensi pemeriksaan", value: r.verificationReference},
    ...resolveCorrectionForm(c, r.actionFields || {}).fields.map(f => ({label: f.label, value: r.actionFields?.[f.id]})),
    ...(requiresNewScenarioEvidence(c) ? (RULE_CHECKS[c.ruleScenario || ""] || []).flatMap(label => typeof r.scenarioChecks?.[label] === "boolean" ? [{label, value: r.scenarioChecks[label] ? "Ya" : "Tidak"}] : []) : []),
    ...(requiresNewScenarioEvidence(c) ? (RULE_NUMBERS[c.ruleScenario || ""] || []).flatMap(label => Number.isFinite(r.scenarioNumbers?.[label]) ? [{label, value: String(r.scenarioNumbers?.[label])}] : []) : []),
    {label: "Referensi lampiran tercatat", value: String(Array.isArray(r.evidenceKeys) ? r.evidenceKeys.length : 0)},
    {label: "Catatan bukti", value: r.evidenceNote},
  ];
  return rows.filter(row => typeof row.value === "string" && row.value.trim().length > 0);
}
