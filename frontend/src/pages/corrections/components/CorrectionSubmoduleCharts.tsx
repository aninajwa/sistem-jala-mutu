
import type { CSSProperties } from "react";
import type { WorkflowRole } from "../../../workflow/model";
import type { CorrectionRow } from "../correctionViewModel";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  isOverdue,
  dueInSevenDays,
} from "../correctionViewModel";
import "./CorrectionSubmoduleCharts.css";

type Datum = { label: string; value: number };
type ChartSpec = {
  donutTitle: string;
  barTitle: string;
  donut: Datum[];
  bars: Datum[];
};

function countBy(
  rows: CorrectionRow[],
  getLabel: (row: CorrectionRow) => string,
): Datum[] {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const label = getLabel(row)?.trim() || "Belum ditentukan";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function statusData(rows: CorrectionRow[]): Datum[] {
  return STATUS_ORDER
    .map((status) => ({
      label: STATUS_LABEL[status],
      value: rows.filter((row) => row.status === status).length,
    }))
    .filter((item) => item.value > 0);
}

function getSpec(
  role: WorkflowRole,
  tab: string,
  rows: CorrectionRow[],
): ChartSpec | null {
  const byAction = () => countBy(rows, (row) => row.actionType);
  const byPriority = () => countBy(rows, (row) => row.severity);
  const byBalai = () => countBy(rows, (row) => row.balai);

  if (role === "Penyedia Jasa / Ketua Tim") {
    if (tab === "Menunggu Verifikasi") {
      return {
        donutTitle: "Status pemeriksaan",
        barTitle: "Prioritas usulan",
        donut: countBy(rows, (row) =>
          row.status === "Menunggu Persetujuan"
            ? "Menunggu persetujuan"
            : "Menunggu verifikasi ulang",
        ),
        bars: byPriority(),
      };
    }

    if (tab === "Riwayat") {
      return {
        donutTitle: "Prioritas kasus selesai",
        barTitle: "Jenis tindakan selesai",
        donut: byPriority(),
        bars: byAction(),
      };
    }

    return {
      donutTitle: "Status tugas saya",
      barTitle: "Jenis tindakan",
      donut: statusData(rows),
      bars: byAction(),
    };
  }

  if (role === "PIC Balai / Pengguna Jasa") {
    if (tab === "Antrian Verifikasi") {
      return {
        donutTitle: "Distribusi prioritas",
        barTitle: "Jenis tindakan yang diajukan",
        donut: byPriority(),
        bars: byAction(),
      };
    }

    if (tab === "Tindak Lanjut Paket") {
      return {
        donutTitle: "Progres status kasus",
        barTitle: "Prioritas kasus aktif",
        donut: statusData(rows),
        bars: byPriority(),
      };
    }

    if (tab === "Verifikasi Ulang") {
      return {
        donutTitle: "Prioritas pemeriksaan ulang",
        barTitle: "Jenis tindakan yang diperiksa",
        donut: byPriority(),
        bars: byAction(),
      };
    }

    return {
      donutTitle: "Prioritas kasus selesai",
      barTitle: "Jenis tindakan selesai",
      donut: byPriority(),
      bars: byAction(),
    };
  }

  if (role === "Direktorat / Pusat") {
    if (tab === "Audit Tingkat 3") {
      return {
        donutTitle: "Status kasus terkait audit",
        barTitle: "Prioritas kasus audit",
        donut: statusData(rows),
        bars: byPriority(),
      };
    }

    if (tab === "Verifikasi Ulang") {
      return {
        donutTitle: "Prioritas tindak lanjut",
        barTitle: "Sebaran kasus menurut Balai",
        donut: byPriority(),
        bars: byBalai(),
      };
    }

    if (tab === "Riwayat") {
      return {
        donutTitle: "Prioritas kasus selesai",
        barTitle: "Sebaran riwayat menurut Balai",
        donut: byPriority(),
        bars: byBalai(),
      };
    }

    return {
      donutTitle: "Status temuan lintas Balai",
      barTitle: "Jumlah kasus menurut Balai",
      donut: statusData(rows),
      bars: byBalai(),
    };
  }

  if (tab === "Data Referensi") return null;

  if (tab === "Notifikasi & SLA") {
    return {
      donutTitle: "Kategori tenggat",
      barTitle: "Status kasus yang perlu perhatian",
      donut: [
        {
          label: "Terlambat",
          value: rows.filter(isOverdue).length,
        },
        {
          label: "Jatuh tempo ≤ 7 hari",
          value: rows.filter(
            (row) => !isOverdue(row) && dueInSevenDays(row),
          ).length,
        },
      ].filter((item) => item.value > 0),
      bars: statusData(rows),
    };
  }

  return {
    donutTitle: "Status seluruh kasus",
    barTitle: "Prioritas kasus",
    donut: statusData(rows),
    bars: byPriority(),
  };
}

function DonutChart({ data }: { data: Datum[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = [
    "#2563eb",
    "#0d9488",
    "#d97706",
    "#7c3aed",
    "#dc2626",
    "#64748b",
  ];

  let current = 0;
  const segments = data.map((item, index) => {
    const start = current;
    current += total ? (item.value / total) * 100 : 0;
    return `${colors[index % colors.length]} ${start}% ${current}%`;
  });

  const style: CSSProperties = {
    background:
      total > 0
        ? `conic-gradient(${segments.join(", ")})`
        : "#e5e7eb",
  };

  return (
    <div className="corr-chart-content">
      <div className="corr-donut" style={style}>
        <div className="corr-donut-center">
          <strong>{total}</strong>
          <span>Kasus</span>
        </div>
      </div>

      <div className="corr-chart-legend">
        {data.map((item, index) => (
          <div className="corr-legend-item" key={item.label}>
            <span
              className="corr-legend-dot"
              style={{ background: colors[index % colors.length] }}
            />
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarChart({ data }: { data: Datum[] }) {
  const max = Math.max(1, ...data.map((item) => item.value));

  return (
    <div className="corr-chart-bars">
      {data.map((item) => (
        <div className="corr-chart-bar-row" key={item.label}>
          <div className="corr-chart-bar-label" title={item.label}>
            {item.label}
          </div>
          <div
            className="corr-chart-bar-track"
            role="img"
            aria-label={`${item.label}: ${item.value} kasus`}
          >
            <span
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default function CorrectionSubmoduleCharts({
  role,
  tab,
  rows,
}: {
  role: WorkflowRole;
  tab: string;
  rows: CorrectionRow[];
}) {
  const spec = getSpec(role, tab, rows);

  if (!spec) return null;

  return (
    <section className="corr-sub-charts" aria-label="Statistik tindakan perbaikan">
      <article className="corr-sub-chart-card">
        <h4>{spec.donutTitle}</h4>
        {spec.donut.length ? (
          <DonutChart data={spec.donut} />
        ) : (
          <p className="corr-sub-chart-empty">
            Belum ada data untuk ditampilkan.
          </p>
        )}
      </article>

      <article className="corr-sub-chart-card">
        <h4>{spec.barTitle}</h4>
        {spec.bars.length ? (
          <BarChart data={spec.bars} />
        ) : (
          <p className="corr-sub-chart-empty">
            Belum ada data untuk ditampilkan.
          </p>
        )}
      </article>
    </section>
  );
}
