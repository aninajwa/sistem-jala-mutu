import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BriefcaseBusiness,
  Activity,
  ClipboardCheck,
  CircleAlert,
  CircleCheck,
  MapPinned,
  Route,
} from "lucide-react";
import type {
  ReportRow,
  ReportKind,
  ReportFilter,
  ReportSnapshot,
} from "./model";
import { dashboardModel, type ChartSpec } from "./dashboardModel";
export { groupRows } from "./dashboardModel";
const colors = [
  "#1687bb",
  "#20a69a",
  "#e89a35",
  "#8276b5",
  "#536e92",
  "#cf6474",
  "#66a3a1",
  "#a88056",
];
const statusColors: Record<string, string> = {
  Ditutup: "#168f7e",
  Terbuka: "#d99a35",
  "Menunggu Persetujuan": "#c57e38",
  Disetujui: "#1687bb",
  Dilaksanakan: "#8276b5",
  "Verifikasi Ulang": "#47a4ba",
  Sesuai: "#168f7e",
  Temuan: "#d99a35",
  "Dalam pemeriksaan": "#1687bb",
  "Belum Diperiksa": "#8394a5",
};
function chartColor(c: ChartSpec, name: string, index: number) {
  if ((c.kind === "reviews" || c.kind === "corrections") && statusColors[name])
    return statusColors[name];
  return colors[c.series || c.type === "donut" ? index % colors.length : 0];
}
function Chart({ chart: c }: { chart: ChartSpec }) {
  const tooltipTrigger =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches
      ? ("click" as const)
      : ("hover" as const);
  const height =
    c.type === "horizontal" || c.type === "stack"
      ? Math.max(220, c.values.length * 36 + 40)
      : 240;
  const axis = {
    tick: { fontSize: 11, fill: "#526b80" },
    tickLine: false,
    axisLine: false,
  };
  return (
    <>
      <div
        className="rv-chart-scroll"
        tabIndex={c.values.length > 8 ? 0 : undefined}
        aria-label={c.title}
      >
        <div className="rv-chart-plot" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {c.type === "area" ? (
              <AreaChart
                data={c.values}
                margin={{ left: -15, right: 10, top: 12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="name" {...axis} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip trigger={tooltipTrigger} />
                <Area
                  isAnimationActive={false}
                  type="linear"
                  dataKey="count"
                  name="Aktivitas"
                  stroke={colors[0]}
                  fill="#e0f1f8"
                  strokeWidth={2.5}
                />
              </AreaChart>
            ) : c.type === "line" ? (
              <LineChart
                data={c.values}
                margin={{ left: -15, right: 12, top: 12 }}
              >
                <CartesianGrid strokeDasharray="3 4" vertical={false} />
                <XAxis dataKey="name" {...axis} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip trigger={tooltipTrigger} />
                {(c.series || ["Aktivitas"]).map((s, i) => (
                  <Line
                    key={s}
                    isAnimationActive={false}
                    dataKey={c.series ? `s${i}` : "count"}
                    name={s}
                    stroke={colors[i % colors.length]}
                    strokeWidth={2.5}
                    connectNulls={false}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            ) : c.type === "donut" ? (
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={c.values}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={64}
                  outerRadius={92}
                  paddingAngle={2}
                >
                  {c.values.map((v, i) => (
                    <Cell key={v.name} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip trigger={tooltipTrigger} />
              </PieChart>
            ) : (
              <BarChart
                data={c.values}
                layout="vertical"
                margin={{ left: 0, right: 18, top: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 4" horizontal={false} />
                <XAxis type="number" allowDecimals={false} {...axis} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  {...axis}
                  tickFormatter={(s: string) =>
                    s.length > 19 ? s.slice(0, 17) + "…" : s
                  }
                />
                <Tooltip
                  trigger={tooltipTrigger}
                  cursor={{ fill: "#f1f6fa" }}
                />
                {(c.series || ["Rekaman"]).map((s, i) => (
                  <Bar
                    key={s}
                    isAnimationActive={false}
                    name={s}
                    dataKey={c.series ? `s${i}` : "count"}
                    stackId="total"
                    fill={chartColor(c, s, i)}
                    barSize={19}
                    radius={c.series ? undefined : [0, 4, 4, 0]}
                  >
                    {!c.series &&
                      c.values.map((v, j) => (
                        <Cell key={v.name} fill={chartColor(c, v.name, j)} />
                      ))}
                  </Bar>
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rv-legend">
        {(c.series || c.values.map((v) => v.name)).map((s, i) => (
          <span key={s}>
            <i style={{ background: chartColor(c, s, i) }} />
            {s}
            {!c.series && (
              <>
                : <b>{c.values[i].count}</b>
              </>
            )}
          </span>
        ))}
      </div>
    </>
  );
}
export default function Dashboard({
  data,
  role,
  packages,
  filter,
  open,
}: {
  data: Record<ReportKind, ReportRow[]>;
  role: string;
  packages: ReportSnapshot["packages"];
  filter: ReportFilter;
  open: (kind: ReportKind, patch?: Partial<ReportFilter>) => void;
}) {
  const m = dashboardModel(role, data, packages, filter),
    provider = role.startsWith("Penyedia"),
    central = role.startsWith("Direktorat");
  const packageMetric = {
    label: provider
      ? "Paket penugasan"
      : central
        ? "Paket terpantau"
        : "Paket dalam kewenangan",
    value: m.packageCount,
    icon: BriefcaseBusiness,
    tone: "blue",
    note: m.eventFiltered
      ? "Paket dengan rekaman terfilter"
      : "Penugasan sesuai paket/Balai/jenis",
  };
  const activities = {
    label: "Aktivitas survei",
    value: m.data.activities.length,
    icon: Activity,
    tone: "blue",
    note: "Rekaman unik • filter aktif",
    kind: "activities" as ReportKind,
  };
  const active = {
    label: "Tindakan aktif",
    value: m.active,
    icon: CircleAlert,
    tone: "amber",
    note: "Kasus berstatus belum ditutup",
  };
  type Metric = {
    label: string;
    value: number;
    icon: typeof Activity;
    tone: string;
    note: string;
    kind?: ReportKind;
    patch?: Partial<ReportFilter>;
  };
  const metrics: Metric[] = provider
    ? [
        packageMetric,
        activities,
        active,
        {
          label: "Tindakan ditutup",
          value: m.closed,
          icon: CircleCheck,
          tone: "teal",
          note: "Status terkini • bukan tren selesai",
          ...(filter.status && filter.status !== "Ditutup"
            ? {}
            : {
                kind: "corrections" as ReportKind,
                patch: { status: "Ditutup" },
              }),
        },
      ]
    : central
      ? [
          {
            label: "Balai terpantau",
            value: m.balaiCount,
            icon: MapPinned,
            tone: "blue",
            note: "Balai bernama dalam cakupan",
          },
          packageMetric,
          activities,
          active,
        ]
      : [
          packageMetric,
          {
            label: "Pemeriksaan tercatat",
            value: m.data.reviews.length,
            icon: ClipboardCheck,
            tone: "teal",
            note: "Review aktif yang benar-benar tersimpan",
            kind: "reviews" as ReportKind,
          },
          activities,
          active,
        ];
  return (
    <>
      <div className="rv-kpis">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const content = (
            <>
              <span className={`rv-kpi-icon rv-${metric.tone}`}>
                <Icon size={20} />
              </span>
              <span className="rv-kpi-copy">
                <span className="rv-kpi-label">{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>
                  {metric.note}
                  {!!metric.kind ? " →" : ""}
                </small>
              </span>
            </>
          );
          return !!metric.kind ? (
            <button
              className="rv-kpi"
              key={metric.label}
              onClick={() => open(metric.kind!, metric.patch)}
            >
              {content}
            </button>
          ) : (
            <div className="rv-kpi" key={metric.label}>
              {content}
            </div>
          );
        })}
        <div className="rv-kpi rv-kpi-unavailable">
          <span className="rv-kpi-icon rv-neutral">
            <Route size={20} />
          </span>
          <span className="rv-kpi-copy">
            <span className="rv-kpi-label">Panjang survei</span>
            <strong>—</strong>
            <small>Data kilometer belum tersedia</small>
          </span>
        </div>
      </div>
      <div className="rv-charts">
        {m.charts.map((c) => (
          <section
            className={`rv-card rv-chart-card ${c.values.length ? "" : "rv-chart-empty"}`}
            data-chart={c.id}
            key={c.id}
          >
            <div className="rv-chart-heading">
              <h3>{c.title}</h3>
              <span className="rv-chart-total">
                {c.values.reduce((n, v) => n + v.count, 0)} rekaman
              </span>
            </div>
            <p className="subtle">{c.note}</p>
            {c.values.length ? (
              <Chart chart={c} />
            ) : (
              <div className="rv-empty">Belum ada data pada cakupan ini.</div>
            )}
            <button className="btn sm" onClick={() => open(c.kind)}>
              Lihat Semua ·{" "}
              {c.kind === "activities"
                ? "Aktivitas"
                : c.kind === "reviews"
                  ? "Pemeriksaan"
                  : "Tindakan"}
            </button>
          </section>
        ))}
      </div>
    </>
  );
}
