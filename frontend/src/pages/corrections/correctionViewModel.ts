import {validDate, days, jakartaDay} from "../../workflow/operationalCalendar";

import type {
  CorrectionCase,
  OperationalWorkflowState,
  WorkflowRole,
} from "../../workflow/model";

import { correctionReviewer, correctionNextStep } from "../../workflow/checkpoint09Corrections";

export type CorrectionRow = CorrectionCase & {
  packageId: string;
  packageName: string;
  balai: string;
  key: string;
};

import { correctionDisplayStatus } from "../../workflow/correctionPresentation";
export { STATUS_ORDER, STATUS_LABEL, correctionDisplayStatus } from "../../workflow/correctionPresentation";

export type CorrectionFilters = { packageId?: string; survey?: string; priority?: string; status?: string; balai?: string; query?: string };
/** Operational status labels, rather than raw enum, are shared by filters and charts. */
export function filterCorrectionRows(rows: CorrectionRow[], f: CorrectionFilters): CorrectionRow[] {
  return rows.filter(r => (!f.packageId || r.packageId === f.packageId) &&
    (!f.survey || r.surveyType === f.survey) && (!f.priority || r.severity === f.priority) &&
    (!f.status || correctionDisplayStatus(r) === f.status) && (!f.balai || r.balai === f.balai) &&
    [r.id,r.packageName,r.road,r.source,r.rejectionReason,r.actionType,r.owner].join(' ').toLowerCase().includes((f.query || '').trim().toLowerCase()));
}
export function correctionStatusCounts(rows: CorrectionRow[]) {
  const counts = new Map<string, number>();
  for (const r of rows) { const label = correctionDisplayStatus(r); counts.set(label,(counts.get(label) ?? 0)+1); }
  return [...counts].map(([label,value])=>({label,value}));
}

export const ROLE_TABS: Record<WorkflowRole, string[]> = {
  "Penyedia Jasa / Ketua Tim": [
    "Tugas Saya",
    "Menunggu Verifikasi",
    "Riwayat",
  ],
  "PIC Balai / Pengguna Jasa": [
    "Antrian Verifikasi",
    "Tindak Lanjut Paket",
    "Verifikasi Ulang",
    "Riwayat",
  ],
  "Direktorat / Pusat": [
    "Temuan Lintas Paket",
    "Tindak Lanjut Audit 3",
    "Verifikasi Ulang",
    "Riwayat",
  ],
  Admin: [
    "Monitoring Kasus",
    "Pemantauan Tenggat",
    "Riwayat",
  ],
};

export function collectCorrections(
  packages: Record<string, OperationalWorkflowState>,
): CorrectionRow[] {
  return Object.entries(packages).flatMap(([packageId, state]) =>
    (state.corrections ?? []).map((item) => ({
      ...item,
      packageId,
      packageName: state.project.packageName || packageId,
      balai: state.project.balai || "Belum ditentukan",
      key: `${packageId}:${item.id}`,
    })),
  );
}

export function isOverdue(item: Pick<CorrectionCase, "dueDate" | "status">, today = jakartaDay()): boolean {
  return item.status !== "Ditutup" && validDate(item.dueDate) && item.dueDate < today;
}

export function dueInSevenDays(item: Pick<CorrectionCase, "dueDate" | "status">, today = jakartaDay()): boolean {
  if (item.status === "Ditutup" || !validDate(item.dueDate)) return false;
  const remaining = days(today, item.dueDate);
  return remaining >= 0 && remaining <= 7;
}

/** Assign work by the same reviewer used by the mutation guard and notifications. */
export function awaitsResultReview(item: CorrectionCase): boolean {
  return ["Dilaksanakan", "Verifikasi Ulang"].includes(item.status) && item.retest !== "Gagal";
}
export function providerNeedsAction(item: CorrectionCase): boolean {
  return item.status !== "Ditutup" && correctionNextStep(item).actor === "Penyedia Jasa / Ketua Tim";
}
export function matchesRoleTab(item: CorrectionRow, role: WorkflowRole, tab: string): boolean {
  if (!ROLE_TABS[role].includes(tab)) return false;
  if (role === "Penyedia Jasa / Ketua Tim") {
    if (tab === "Riwayat") return item.status === "Ditutup";
    if (tab === "Tugas Saya") return providerNeedsAction(item);
    return item.status !== "Ditutup" && !providerNeedsAction(item);
  }
  if (role === "PIC Balai / Pengguna Jasa") {
    if (tab === "Antrian Verifikasi") return item.status === "Menunggu Persetujuan";
    if (tab === "Verifikasi Ulang") return awaitsResultReview(item) && correctionReviewer(item) === role;
    if (tab === "Riwayat") return item.status === "Ditutup";
    return item.status !== "Ditutup" && item.status !== "Menunggu Persetujuan" && !(awaitsResultReview(item) && correctionReviewer(item) === role);
  }
  if (role === "Direktorat / Pusat") {
    if (tab === "Tindak Lanjut Audit 3") return correctionReviewer(item) === role && item.status !== "Ditutup" && !awaitsResultReview(item);
    if (tab === "Verifikasi Ulang") return awaitsResultReview(item) && correctionReviewer(item) === role;
    if (tab === "Riwayat") return item.status === "Ditutup";
    return item.status !== "Ditutup";
  }
  if (tab === "Pemantauan Tenggat") return isOverdue(item) || dueInSevenDays(item);
  if (tab === "Riwayat") return item.status === "Ditutup";
  return item.status !== "Ditutup";
}

/** Return to the original queue if the case still belongs there; otherwise follow its current status. */
export function correctionReturnTab(role: WorkflowRole, preferred: string, item?: CorrectionRow): string {
  const tabs = ROLE_TABS[role];
  if (!item) return tabs.includes(preferred) ? preferred : tabs[0];
  if (tabs.includes(preferred) && matchesRoleTab(item, role, preferred)) return preferred;
  const ordered = role === "Direktorat / Pusat"
    ? ["Riwayat", "Verifikasi Ulang", "Tindak Lanjut Audit 3", "Temuan Lintas Paket"]
    : tabs;
  return ordered.find(tab => matchesRoleTab(item, role, tab)) ?? tabs[0];
}

export function correctionMetrics(rows: CorrectionRow[], role: WorkflowRole) {
  const count = (predicate: (r: CorrectionRow) => boolean) =>
    rows.filter(row => predicate(row)).length;

  if (role === "Penyedia Jasa / Ketua Tim") {
    return [
      { label: "Tugas Aktif", value: count(providerNeedsAction), tone: "blue" },
      { label: "Mendekati Tenggat", value: count(dueInSevenDays), tone: "amber" },
      { label: "Menunggu Verifikasi", value: count(r =>
        matchesRoleTab(r, role, "Menunggu Verifikasi")), tone: "purple" },
      { label: "Selesai", value: count(r => r.status === "Ditutup"), tone: "green" },
    ];
  }

  if (role === "PIC Balai / Pengguna Jasa") {
    return [
      { label: "Menunggu Persetujuan", value: count(r => r.status === "Menunggu Persetujuan"), tone: "blue" },
      { label: "Verifikasi Ulang", value: count(r => awaitsResultReview(r) && correctionReviewer(r) === role), tone: "purple" },
      { label: "Terlambat", value: count(isOverdue), tone: "amber" },
      { label: "Selesai", value: count(r => r.status === "Ditutup"), tone: "green" },
    ];
  }

  if (role === "Direktorat / Pusat") {
    return [
      { label: "Temuan Kritis", value: count(r => r.severity === "Kritis" && r.status !== "Ditutup"), tone: "red" },
      { label: "Kasus Koreksi Audit 3", value: count(r => correctionReviewer(r) === role && r.status !== "Ditutup"), tone: "purple" },
      { label: "Terlambat", value: count(isOverdue), tone: "amber" },
      { label: "Selesai", value: count(r => r.status === "Ditutup"), tone: "green" },
    ];
  }

  return [
    { label: "Total Kasus", value: rows.length, tone: "blue" },
    { label: "Terlambat", value: count(isOverdue), tone: "amber" },
    { label: "Kasus Aktif", value: count(r => r.status !== "Ditutup"), tone: "purple" },
    { label: "Selesai", value: count(r => r.status === "Ditutup"), tone: "green" },
  ];
}

/** One canonical next action per case; no review actions are exposed to Penyedia. */
export function providerCorrectionAction(item: CorrectionCase): { label: string; description: string } {
  if (item.status === "Ditutup") return { label: "Lihat riwayat", description: "Kasus selesai" };
  if (item.status === "Menunggu Persetujuan") return { label: "Lihat pengajuan", description: "Menunggu keputusan pemeriksa" };
  if (item.status === "Verifikasi Ulang" && item.retest === "Gagal") return { label: "Perbaiki usulan", description: "Perbaiki berdasarkan hasil pemeriksaan ulang" };
  if (awaitsResultReview(item) && correctionReviewer(item) === "Penyedia Jasa / Ketua Tim") return { label: item.retest === "Lulus" ? "Periksa penutupan" : "Periksa hasil internal", description: "Tindak lanjut Audit Tingkat 1" };
  if (item.status === "Dilaksanakan" || item.status === "Verifikasi Ulang") {
    return { label: "Lihat hasil tindakan", description: "Menunggu pemeriksaan ulang oleh pemeriksa tahap asal" };
  }
  if (item.status === "Disetujui") return { label: "Catat pelaksanaan", description: "Laksanakan tindakan yang telah disetujui" };
  if (item.retest === "Gagal") return { label: "Perbaiki usulan", description: "Perbaiki berdasarkan hasil pemeriksaan ulang" };
  if (item.approval === "Perlu Revisi") return { label: "Revisi usulan", description: "Lengkapi usulan sesuai alasan pemeriksa" };
  return { label: "Lengkapi usulan", description: "Susun dan ajukan rencana tindakan berbukti" };
}

/** Tugas dengan tenggat sah diprioritaskan; urutan stabil untuk entri tanpa tenggat. */
export function sortProviderCorrections(rows: CorrectionRow[], tab: string): CorrectionRow[] {
  if (tab !== "Tugas Saya") return [...rows];
  return [...rows].sort((a, b) => {
    const aDate = validDate(a.dueDate) ? a.dueDate : "9999-12-31";
    const bDate = validDate(b.dueDate) ? b.dueDate : "9999-12-31";
    const byDate = aDate.localeCompare(bDate);
    if (byDate) return byDate;
    const priority: Record<CorrectionCase["severity"], number> = { Kritis: 0, Mayor: 1, Minor: 2 };
    return priority[a.severity] - priority[b.severity];
  });
}

/** Labels describe available work; the workspace guard still owns authorization. */
export function correctionOpenLabel(item: CorrectionCase, role: WorkflowRole): string {
  if (item.status === "Ditutup") return "Lihat riwayat";
  if (role === "Penyedia Jasa / Ketua Tim") return providerCorrectionAction(item).label;
  if (role === "Admin" || correctionNextStep(item).actor !== role) return "Lihat detail";
  if (item.status === "Menunggu Persetujuan") return "Periksa usulan";
  if (awaitsResultReview(item)) return item.retest === "Lulus" ? "Periksa penutupan" : "Periksa hasil";
  return "Lihat detail";
}

/** Queue filters only offer values present in the current role's submenu. */
export function correctionTabRows(rows: CorrectionRow[], role: WorkflowRole, tab: string, filters: CorrectionFilters = {}) {
  const available = rows.filter(row => matchesRoleTab(row, role, tab));
  return { available, visible: filterCorrectionRows(available, filters) };
}

/** Keep historical ordering; prioritize deadlines in actionable and monitoring queues. */
export function sortCorrectionQueue(rows: CorrectionRow[], tab: string): CorrectionRow[] {
  return tab === "Riwayat" ? [...rows] : sortProviderCorrections(rows, "Tugas Saya");
}

/** Count meaningful filters, including search, for both queue layouts. */
export function correctionFilterCount(filters: CorrectionFilters): number {
  return [filters.packageId, filters.survey, filters.priority, filters.status, filters.balai, filters.query?.trim()].filter(Boolean).length;
}
