import type { CorrectionCase } from "./model";

export const STATUS_ORDER: CorrectionCase["status"][] = [
  "Terbuka",
  "Menunggu Persetujuan",
  "Disetujui",
  "Dilaksanakan",
  "Verifikasi Ulang",
  "Ditutup",
];

export const STATUS_LABEL: Record<CorrectionCase["status"], string> = {
  Terbuka: "Perlu Ditindaklanjuti",
  "Menunggu Persetujuan": "Menunggu Balai",
  Disetujui: "Disetujui",
  Dilaksanakan: "Menunggu Pemeriksaan Hasil",
  "Verifikasi Ulang": "Verifikasi Ulang",
  Ditutup: "Selesai",
};

export function correctionDisplayStatus(item: CorrectionCase): string {
  if (["Terbuka", "Verifikasi Ulang"].includes(item.status) && item.retest === "Gagal") return "Uji Ulang Gagal";
  if (item.status === "Terbuka" && item.approval === "Perlu Revisi") return "Perlu Revisi";
  if (item.status === "Verifikasi Ulang" && item.retest === "Lulus") return "Menunggu Penutupan";
  return STATUS_LABEL[item.status];
}

/** Display next step only for an active case; a closed case has no pending actor. */
export function correctionHasPendingWork(item: Pick<CorrectionCase, "status">): boolean { return item.status !== "Ditutup"; }
