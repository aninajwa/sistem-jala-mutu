import type { CorrectionCase } from "./model";

/** Source-backed families; fields marked required are application traceability requirements,
 * not a claim that each original checklist contains an identically named mandatory column. */
export type CorrectionExecutionField = {
  id: string;
  label: string;
  required: boolean;
  help?: string;
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

export function resolveCorrectionForm(c: CorrectionCase): CorrectionFormSpec {
  const a = (c.actionType || "").toLowerCase();
  let family = "Tindak lanjut umum";
  let fields: CorrectionExecutionField[] = [];
  if (a.includes("survei ulang")) {
    family = "Survei ulang";
    fields = [spec("coverage", "Cakupan ruas/segmen yang disurvei ulang"), spec("newRecord", "ID rekaman survei ulang")];
  } else if (a.includes("penilaian ulang")) {
    family = "Penilaian ulang";
    fields = [spec("evaluatedObject", "Objek/sampel penilaian ulang"), spec("comparison", "Referensi hasil awal dan hasil penilaian pembanding")];
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
  return specification.fields.filter(f => f.required && !String(values[f.id] || "").trim()).map(f => `${f.label} wajib dilengkapi untuk ${specification.family}.`);
}
