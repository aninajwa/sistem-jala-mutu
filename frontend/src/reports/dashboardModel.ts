import type {
  ReportRow,
  ReportKind,
  ReportFilter,
  ReportSnapshot,
} from "./model";
export type ChartPoint = {
  name: string;
  count: number;
  [key: string]: string | number;
};
export type ChartSpec = {
  id: string;
  title: string;
  note: string;
  kind: ReportKind;
  type: "area" | "line" | "horizontal" | "donut" | "stack";
  values: ChartPoint[];
  series?: string[];
};
export const ACTIVE_CORRECTIONS = new Set([
  "Terbuka",
  "Menunggu Persetujuan",
  "Disetujui",
  "Dilaksanakan",
  "Verifikasi Ulang",
]);
export function uniqueRows(rows: ReportRow[]) {
  const found = new Set<string>();
  return rows.filter((r) => {
    if (!r.key) return true;
    if (found.has(r.key)) return false;
    found.add(r.key);
    return true;
  });
}
export function groupRows(
  rows: ReportRow[],
  field: keyof ReportRow,
): ChartPoint[] {
  const groups = new Map<string, number>();
  for (const r of uniqueRows(rows)) {
    const key =
      field === "packageName"
        ? `${r.packageName} · ${r.packageId}`
        : r[field] || "Belum tersedia";
    groups.set(key, (groups.get(key) || 0) + 1);
  }
  return [...groups]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, count]) => ({ name, count }));
}
export function splitRows(
  rows: ReportRow[],
  dimension: "packageName" | "balai" | "month",
  seriesField: "status" | "balai",
) {
  const unique = uniqueRows(rows).filter(
    (r) => dimension !== "month" || !!r.date,
  );
  const series = [...new Set(unique.map((r) => r[seriesField]))].sort();
  const groups = new Map<string, ChartPoint>();
  for (const r of unique) {
    const name =
      dimension === "month"
        ? r.date.slice(0, 7)
        : dimension === "packageName"
          ? `${r.packageName} · ${r.packageId}`
          : r[dimension];
    const point = groups.get(name) || { name, count: 0 };
    const index = `s${series.indexOf(r[seriesField])}`;
    point[index] = Number(point[index] || 0) + 1;
    point.count++;
    groups.set(name, point);
  }
  for (const p of groups.values())
    series.forEach((_, i) => {
      p[`s${i}`] ??= 0;
    });
  return {
    values: [...groups.values()].sort((a, b) => a.name.localeCompare(b.name)),
    series,
  };
}
export function dashboardModel(
  role: string,
  source: Record<ReportKind, ReportRow[]>,
  packages: ReportSnapshot["packages"],
  filter: ReportFilter,
) {
  const data = {
    activities: uniqueRows(source.activities),
    reviews: uniqueRows(source.reviews),
    corrections: uniqueRows(source.corrections),
  };
  const eventFiltered = !!(filter.start || filter.end || filter.status);
  const activePackageIds = new Set(
    Object.values(data)
      .flat()
      .map((r) => r.packageId),
  );
  const scoped = Object.entries(packages).filter(
    ([id, p]) =>
      (!filter.packageId || id === filter.packageId) &&
      (!filter.balai || p.project.balai === filter.balai) &&
      (!filter.survey ||
        p.project.surveyTypes.some((s) => s === filter.survey)) &&
      (!eventFiltered || activePackageIds.has(id)),
  );
  const packageCount = scoped.length,
    balaiCount = new Set(scoped.map(([, p]) => p.project.balai).filter(Boolean))
      .size;
  const active = data.corrections.filter((r) =>
      ACTIVE_CORRECTIONS.has(r.status),
    ).length,
    closed = data.corrections.filter((r) => r.status === "Ditutup").length;
  const trend = groupRows(
    data.activities
      .filter((r) => r.date)
      .map((r) => ({ ...r, date: r.date.slice(0, 7) })),
    "date",
  );
  const trends = splitRows(data.activities, "month", "balai");
  const byPackage: ChartSpec = {
    id: "packages",
    title: "Aktivitas antar-paket",
    note: "Rekaman unik dalam cakupan; bukan peringkat kualitas paket.",
    kind: "activities",
    type: "horizontal",
    values: groupRows(data.activities, "packageName"),
  };
  const actions = splitRows(
    data.corrections,
    role.startsWith("Direktorat") ? "balai" : "packageName",
    "status",
  );
  const actionChart: ChartSpec = {
    id: "actions",
    title: "Tindakan menurut status",
    note: "Jumlah kasus per status terkini. Periode menggunakan tenggat, bukan tanggal penutupan.",
    kind: "corrections",
    type: "stack",
    ...actions,
  };
  const activityTrend: ChartSpec = {
    id: "trend",
    title: "Aktivitas tercatat per bulan",
    note: "Tanggal kegiatan; rekaman tanpa tanggal tidak masuk tren.",
    kind: "activities",
    type: role.startsWith("Penyedia") ? "area" : "line",
    values: trend,
  };
  const reviewChart: ChartSpec = {
    id: "reviews",
    title: "Status pemeriksaan tercatat",
    note: "Review berkala aktif dan V&V bertahap; tidak menciptakan antrean review baru.",
    kind: "reviews",
    type: "horizontal",
    values: groupRows(data.reviews, "status"),
  };
  let charts: ChartSpec[];
  if (role.startsWith("Penyedia")) {
    const values = groupRows(data.activities, "survey");
    charts = [
      activityTrend,
      {
        id: "types",
        title: "Distribusi jenis kegiatan",
        note: "Komposisi rekaman survei; bukan ukuran kelulusan.",
        kind: "activities",
        type: values.length <= 6 ? "donut" : "horizontal",
        values,
      },
      actionChart,
      byPackage,
    ];
  } else if (role.startsWith("PIC")) {
    charts = [byPackage, reviewChart, actionChart, activityTrend];
  } else {
    const reviews = splitRows(data.reviews, "balai", "status");
    charts = [
      {
        id: "regions",
        title: "Aktivitas menurut Balai",
        note: `${balaiCount} Balai dalam cakupan. Hitungan aktivitas, bukan peringkat kualitas.`,
        kind: "activities",
        type: "horizontal",
        values: groupRows(data.activities, "balai"),
      },
      {
        ...activityTrend,
        note: "Tren kegiatan per Balai dalam penugasan. Tanpa tanggal tidak dihitung.",
        ...trends,
      },
      actionChart,
      {
        ...reviewChart,
        title: "Pemeriksaan lintas Balai",
        type: "stack",
        ...reviews,
      },
    ];
  }
  return {
    data,
    charts,
    packageCount,
    balaiCount,
    active,
    closed,
    eventFiltered,
  };
}
