
import type {
  CorrectionCase,
  OperationalWorkflowState,
  WorkflowRole,
} from "../../workflow/model";

export type CorrectionRow = CorrectionCase & {
  packageId: string;
  packageName: string;
  balai: string;
  key: string;
};

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
  Dilaksanakan: "Dalam Pelaksanaan",
  "Verifikasi Ulang": "Verifikasi Ulang",
  Ditutup: "Selesai",
};

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
    "Audit Tingkat 3",
    "Verifikasi Ulang",
    "Riwayat",
  ],
  Admin: [
    "Monitoring Kasus",
    "Notifikasi & SLA",
    "Data Referensi",
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

export function isOverdue(item: CorrectionRow): boolean {
  if (!item.dueDate || item.status === "Ditutup") return false;
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return item.dueDate.slice(0, 10) < `${year}-${month}-${day}`;
}

export function dueInSevenDays(item: CorrectionRow): boolean {
  if (!item.dueDate || item.status === "Ditutup") return false;
  const date = new Date(`${item.dueDate.slice(0, 10)}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.ceil((date.getTime() - now.getTime()) / 86400000);
  return Number.isFinite(days) && days >= 0 && days <= 7;
}

export function matchesRoleTab(
  item: CorrectionRow,
  role: WorkflowRole,
  tab: string,
): boolean {
  if (role === "Penyedia Jasa / Ketua Tim") {
    if (tab === "Menunggu Verifikasi") {
      return ["Menunggu Persetujuan", "Verifikasi Ulang"].includes(item.status);
    }
    if (tab === "Riwayat") return item.status === "Ditutup";
    return item.status !== "Ditutup" &&
      !["Menunggu Persetujuan", "Verifikasi Ulang"].includes(item.status);
  }

  if (role === "PIC Balai / Pengguna Jasa") {
    if (tab === "Antrian Verifikasi") {
      return item.status === "Menunggu Persetujuan";
    }
    if (tab === "Verifikasi Ulang") {
      return item.status === "Verifikasi Ulang";
    }
    if (tab === "Riwayat") return item.status === "Ditutup";
    return true;
  }

  if (role === "Direktorat / Pusat") {
    if (tab === "Audit Tingkat 3") {
      return /audit tingkat 3|audit 3/i.test(
        `${item.source} ${item.blockedStage} ${item.returnStage}`,
      );
    }
    if (tab === "Verifikasi Ulang") {
      return item.status === "Verifikasi Ulang";
    }
    if (tab === "Riwayat") return item.status === "Ditutup";
    return true;
  }

  if (tab === "Notifikasi & SLA") return isOverdue(item) || dueInSevenDays(item);
  return true;
}

export function correctionMetrics(rows: CorrectionRow[], role: WorkflowRole) {
  const count = (predicate: (r: CorrectionRow) => boolean) =>
    rows.filter(predicate).length;

  if (role === "Penyedia Jasa / Ketua Tim") {
    return [
      { label: "Tugas Aktif", value: count(r => r.status !== "Ditutup"), tone: "blue" },
      { label: "Mendekati Tenggat", value: count(dueInSevenDays), tone: "amber" },
      { label: "Menunggu Verifikasi", value: count(r =>
        ["Menunggu Persetujuan", "Verifikasi Ulang"].includes(r.status)), tone: "purple" },
      { label: "Selesai", value: count(r => r.status === "Ditutup"), tone: "green" },
    ];
  }

  if (role === "PIC Balai / Pengguna Jasa") {
    return [
      { label: "Menunggu Persetujuan", value: count(r => r.status === "Menunggu Persetujuan"), tone: "blue" },
      { label: "Verifikasi Ulang", value: count(r => r.status === "Verifikasi Ulang"), tone: "purple" },
      { label: "Terlambat", value: count(isOverdue), tone: "amber" },
      { label: "Selesai", value: count(r => r.status === "Ditutup"), tone: "green" },
    ];
  }

  if (role === "Direktorat / Pusat") {
    return [
      { label: "Temuan Kritis", value: count(r => r.severity === "Kritis" && r.status !== "Ditutup"), tone: "red" },
      { label: "Kasus Koreksi Audit 3", value: count(r => /audit tingkat 3|audit 3/i.test(`${r.source} ${r.blockedStage}`)), tone: "purple" },
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
