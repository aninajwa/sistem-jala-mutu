import type { Principal } from "../workflow/repository/contracts";
import { filterError } from "./query";
import { EMPTY_FILTER } from "./model";
export const CATALOG = [
  {
    id: "weekly",
    name: "Monitoring mingguan",
    period: "Rentang mingguan",
    sections: ["Kemajuan kegiatan", "Kendala", "Tindak lanjut", "Dokumentasi"],
    reviewers: ["Balai"],
  },
  {
    id: "monthly",
    name: "QA/QC bulanan",
    period: "Bulanan",
    sections: [
      "Kegiatan pemeriksaan",
      "Hasil verval",
      "Temuan dan tindakan",
      "Bukti",
    ],
    reviewers: ["Balai"],
  },
  {
    id: "semester",
    name: "QA/QC semesteran",
    period: "Semesteran",
    sections: [
      "Konsolidasi periode",
      "Perkembangan mutu",
      "Masalah berulang",
      "Evaluasi dan tindak lanjut",
    ],
    reviewers: ["Balai"],
  },
  {
    id: "final",
    name: "QA/QC akhir",
    period: "Keseluruhan kontrak",
    sections: [
      "Rangkuman kegiatan",
      "Hasil pemeriksaan",
      "Penyelesaian temuan",
      "Kesimpulan dan rekomendasi",
    ],
    reviewers: ["Balai"],
  },
];
export type Attachment = { name: string; type: string; data: string };
export type Draft = {
  id: string;
  owner: string;
  packageId: string;
  kind: string;
  start: string;
  end: string;
  content: string[];
  attachments: Attachment[];
  updated: string;
  version: number;
};
export const draftKey = (p: Principal) =>
  `jala-report-drafts-v2:${encodeURIComponent(p.id)}`;
export function canEdit(p: Principal, d: Draft) {
  return (
    p.role === "Penyedia Jasa / Ketua Tim" &&
    d.owner === p.id &&
    p.packageIds.includes(d.packageId)
  );
}
export function validateDraft(d: Draft) {
  return !CATALOG.some((c) => c.id === d.kind) ||
    !d.packageId ||
    !d.start ||
    !d.end ||
    !!filterError({ ...EMPTY_FILTER, start: d.start, end: d.end }) ||
    d.content.length !== 4 ||
    d.content.some((s) => !s.trim())
    ? "Lengkapi paket, periode yang valid, dan seluruh bagian laporan."
    : "";
}
export type SurveySessionLength = {
  packageId: string;
  sessionId: string;
  date: string;
  surveyType: string;
  length: number;
  unit: "km";
  sourceId: string;
  validation: "verified" | "unverified";
  aggregation: "session-distance";
};
/** Session distance only. Never represents unique network length. */
export function sumSessionDistance(
  rows: SurveySessionLength[],
  allowed: string[],
) {
  const ids = new Set<string>();
  let total = 0;
  for (const r of rows) {
    const key = JSON.stringify([r.packageId, r.sessionId]);
    if (
      !allowed.includes(r.packageId) ||
      r.validation !== "verified" ||
      r.unit !== "km" ||
      r.aggregation !== "session-distance" ||
      !r.sourceId ||
      !r.sessionId ||
      !Number.isFinite(r.length) ||
      r.length < 0 ||
      ids.has(key)
    )
      continue;
    ids.add(key);
    total += r.length;
  }
  return total;
}
