import { CreatePackageDialog } from "./CreatePackageDialog";
import {
  aggregateServerCorrections,
  filterServerPackages,
  serverCorrectionEmptyCopy,
  type ResourceState,
} from "./serverDashboard";
import { useServerDashboard } from "./useServerDashboard";
import { useServerDirahPackages } from "./useServerDirahPackages";
import { FilterPanel } from "../design/b/FilterPanel";
import { DirectorateMap } from "../design/b/geo/DirectorateMap";
import {
  WorkspaceHeading,
  MetricTile,
  WorkPanel,
  StatePill,
  WorkLink,
} from "../design/b/Patterns";
import { ArrowRight, Clock3, Users } from "lucide-react";
import { balaiReviewQueue } from "../workflow/balaiReviewQueue";
import { directorateAuditRows } from "../workflow/monitoringProjection";
import { dashboardWorkQueue } from "./dashboardWorkQueue";
import { derivePackageStage, packageStatus } from "../workflow/packageStore";
import { ACCOUNT_DRAFT_KEY, parseAccountDrafts } from "../admin/accountDrafts";
import { demoStoreSeed } from "../lib/demoData";
import { Feedback } from "../design/Feedback";
import { useState } from "react";
import { Link } from "wouter";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileText,
  MapPinned,
  Settings,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { BalaiOsmMap } from "../BalaiOsmMap";
import { KPI, PageHeading, Section } from "../components/app/AppComponents";
import type { PageProps } from "../types";
import { ROLE_HOME_LABELS } from "../workflow/workflowConfig";
import { aggregateDashboard } from "./dashboardMetrics";
import { ReviewEvidenceLocalStatus } from "./ReviewEvidenceLocalStatus";
import { isReviewPackageInScope } from "./reviewEvidenceAccess";
import "./dashboardSummary.css";
import { DashboardWorkQueue } from "./DashboardWorkQueuePanel";

const empty = (
  <div className="panel-body subtle">
    Belum ada data tercatat pada cakupan dan filter ini.
  </div>
);
type ChartRow = { name: string; value: number };
function ChartDetail({
  name,
  value,
  unit,
  onClose,
}: {
  name: string;
  value: number;
  unit: string;
  onClose: () => void;
}) {
  return (
    <div className="ds-chart-detail" role="status">
      <div>
        <strong>{name}</strong>
        <span>
          {value.toLocaleString("id-ID")} {unit} dalam cakupan pilihan.
        </span>
      </div>
      <button type="button" onClick={onClose} aria-label="Tutup rincian grafik">
        Tutup
      </button>
    </div>
  );
}
function Columns({
  rows,
  unit = "rekaman",
}: {
  rows: ChartRow[];
  unit?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  if (!rows.length) return empty;
  const max = Math.max(1, ...rows.map((r) => r.value));
  const active = rows.find((r) => r.name === selected);
  return (
    <div className="panel-body ds-columns">
      <div className="ds-column-plot" aria-label={`Grafik kolom ${unit}`}>
        {rows.map((r) => (
          <button
            type="button"
            className={`ds-column-item ds-chart-control ${selected === r.name ? "is-selected" : ""}`}
            key={r.name}
            onClick={() => setSelected(selected === r.name ? null : r.name)}
            title={`${r.name}: ${r.value} ${unit}. Klik untuk rincian`}
            aria-pressed={selected === r.name}
            aria-label={`${r.name}, ${r.value} ${unit}; tampilkan rincian`}
          >
            <strong>{r.value.toLocaleString("id-ID")}</strong>
            <span className="ds-column-track">
              <span
                className="ds-column-fill"
                style={{ height: `${(r.value / max) * 100}%` }}
              />
            </span>
            <span className="ds-column-name">{r.name}</span>
          </button>
        ))}
      </div>
      {active && (
        <ChartDetail
          name={active.name}
          value={active.value}
          unit={unit}
          onClose={() => setSelected(null)}
        />
      )}
      <p className="ds-chart-note">
        Pilih kolom untuk melihat rincian jumlah {unit}.
      </p>
    </div>
  );
}
function Bars({ rows, unit = "rekaman" }: { rows: ChartRow[]; unit?: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  if (!rows.length) return empty;
  const max = Math.max(1, ...rows.map((r) => r.value));
  const active = rows.find((r) => r.name === selected);
  return (
    <div className="panel-body ds-bars">
      {rows.map((r) => (
        <button
          type="button"
          key={r.name}
          className={`ds-bar ds-chart-control ${selected === r.name ? "is-selected" : ""}`}
          onClick={() => setSelected(selected === r.name ? null : r.name)}
          title={`${r.name}: ${r.value} ${unit}`}
          aria-pressed={selected === r.name}
        >
          <span className="ds-bar-label">{r.name}</span>
          <span className="ds-bar-track">
            <span
              className="ds-bar-fill"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </span>
          <strong className="ds-bar-value">
            {r.value.toLocaleString("id-ID")}
          </strong>
        </button>
      ))}
      {active && (
        <ChartDetail
          name={active.name}
          value={active.value}
          unit={unit}
          onClose={() => setSelected(null)}
        />
      )}
      <p className="ds-chart-note">Pilih kategori untuk melihat rincian.</p>
    </div>
  );
}
function Trend({ rows }: { rows: { label: string; records: number }[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  if (!rows.length) return empty;
  const max = Math.max(1, ...rows.map((r) => r.records));
  const width = 640,
    height = 180,
    left = 43,
    right = 22,
    top = 20,
    bottom = 39;
  const x = (i: number) =>
    left +
    (rows.length === 1
      ? (width - left - right) / 2
      : (i * (width - left - right)) / (rows.length - 1));
  const y = (v: number) =>
    height - bottom - (v / max) * (height - top - bottom);
  const points = rows.map((r, i) => `${x(i)},${y(r.records)}`).join(" ");
  const active = rows.find((r) => r.label === selected);
  return (
    <div className="panel-body ds-trend">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Tren rekaman survei per bulan"
      >
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1={left}
              x2={width - right}
              y1={y(max * t)}
              y2={y(max * t)}
              stroke="#e1e9f0"
              strokeDasharray="4 5"
            />
            <text
              x={left - 9}
              y={y(max * t) + 4}
              textAnchor="end"
              fill="#60768a"
              fontSize="11"
            >
              {Math.round(max * t)}
            </text>
          </g>
        ))}
        {rows.length > 1 && (
          <polyline
            points={points}
            fill="none"
            stroke="#1686c6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {rows.map((r, i) => (
          <g key={r.label}>
            <circle
              cx={x(i)}
              cy={y(r.records)}
              r="5"
              fill={selected === r.label ? "#ef9b42" : "#1686c6"}
              stroke="white"
              strokeWidth="2"
            >
              <title>
                {r.label}: {r.records} rekaman
              </title>
            </circle>
            <text
              x={x(i)}
              y={Math.max(12, y(r.records) - 12)}
              textAnchor="middle"
              fontSize="11"
              fill="#164b70"
            >
              {r.records}
            </text>
            <text
              x={x(i)}
              y={height - 12}
              textAnchor="middle"
              fontSize="10"
              fill="#60768a"
            >
              {r.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="ds-trend-points" aria-label="Pilih bulan untuk rincian">
        {rows.map((r) => (
          <button
            type="button"
            key={r.label}
            aria-pressed={selected === r.label}
            className={selected === r.label ? "is-selected" : ""}
            onClick={() => setSelected(selected === r.label ? null : r.label)}
          >
            {r.label}
          </button>
        ))}
      </div>
      {active && (
        <ChartDetail
          name={`Bulan ${active.label}`}
          value={active.records}
          unit="rekaman"
          onClose={() => setSelected(null)}
        />
      )}
      <p className="ds-chart-note">
        Rekaman tercatat per bulan, bukan tren tingkat kelulusan. Pilih bulan
        untuk rincian.
      </p>
    </div>
  );
}
function Donut({ open, closed }: { open: number; closed: number }) {
  const [selected, setSelected] = useState<"Terbuka" | "Ditutup" | null>(null);
  const total = open + closed;
  if (!total) return empty;
  const pct = (closed / total) * 100;
  return (
    <div className="panel-body ds-donut-layout">
      <div
        className="ds-donut"
        role="img"
        aria-label={`${closed} ditutup dari ${total} kasus`}
        style={{
          background: `conic-gradient(#159c90 0 ${pct}%,#ef9b42 ${pct}% 100%)`,
        }}
      >
        <div className="ds-donut-hole">
          <strong>{total}</strong>
          <span>Total kasus</span>
        </div>
      </div>
      <div className="ds-donut-legend">
        {(
          [
            { name: "Terbuka", value: open, color: "#ef9b42" },
            { name: "Ditutup", value: closed, color: "#159c90" },
          ] as const
        ).map((r) => (
          <button
            key={r.name}
            type="button"
            className={`ds-legend-choice ds-chart-control ${selected === r.name ? "is-selected" : ""}`}
            onClick={() => setSelected(selected === r.name ? null : r.name)}
            aria-pressed={selected === r.name}
          >
            <i style={{ background: r.color }} />
            {r.name}
            <strong>{r.value}</strong>
          </button>
        ))}
        <p className="ds-chart-note">
          Pilih status untuk melihat jumlah dan proporsinya.
        </p>
      </div>
      {selected && (
        <div className="ds-donut-detail">
          <ChartDetail
            name={`${selected} (${Math.round(((selected === "Terbuka" ? open : closed) / total) * 100)}%)`}
            value={selected === "Terbuka" ? open : closed}
            unit="kasus"
            onClose={() => setSelected(null)}
          />
        </div>
      )}
    </div>
  );
}
function StatusStack({
  rows,
  unit = "kasus",
}: {
  rows: ChartRow[];
  unit?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const total = rows.reduce((n, r) => n + r.value, 0);
  if (!total) return empty;
  const palette = ["#ef9b42", "#139f96", "#1686c6", "#a785c8"];
  const active = rows.find((r) => r.name === selected);
  return (
    <div className="panel-body ds-stack">
      <div
        className="ds-stack-track"
        role="group"
        aria-label={`Komposisi ${unit}`}
      >
        {rows
          .filter((r) => r.value > 0)
          .map((r, i) => (
            <button
              key={r.name}
              type="button"
              title={`${r.name}: ${r.value} ${unit}`}
              aria-pressed={selected === r.name}
              aria-label={`${r.name}: ${r.value} ${unit}, ${Math.round((r.value / total) * 100)} persen`}
              onClick={() => setSelected(selected === r.name ? null : r.name)}
              style={{
                width: `${(r.value / total) * 100}%`,
                background: palette[i % palette.length],
              }}
              className="ds-stack-segment"
            />
          ))}
      </div>
      <div className="ds-stack-legend">
        {rows.map((r, i) => (
          <button
            key={r.name}
            type="button"
            aria-pressed={selected === r.name}
            onClick={() => setSelected(selected === r.name ? null : r.name)}
          >
            <i style={{ background: palette[i % palette.length] }} />
            <span>{r.name}</span>
            <strong>{r.value}</strong>
            <small>{total ? Math.round((r.value / total) * 100) : 0}%</small>
          </button>
        ))}
      </div>
      {active && (
        <ChartDetail
          name={`${active.name} · ${Math.round((active.value / total) * 100)}%`}
          value={active.value}
          unit={unit}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
function BalaiRanking({
  rows,
  limit,
  onLimitChange,
}: {
  rows: { name: string; packages: number }[];
  limit: string;
  onLimitChange: (v: string) => void;
}) {
  const visible = limit === "Semua" ? rows : rows.slice(0, Number(limit));
  return (
    <div className="ds-ranking">
      <div className="ds-ranking-toolbar">
        <label>
          Jumlah Balai{" "}
          <select value={limit} onChange={(e) => onLimitChange(e.target.value)}>
            <option value="5">Top 5</option>
            <option value="10">Top 10</option>
            <option value="Semua">Semua</option>
          </select>
        </label>
        <small>
          Diurutkan berdasarkan jumlah paket · {visible.length} dari{" "}
          {rows.length} Balai
        </small>
      </div>
      <Bars
        rows={visible.map((x) => ({ name: x.name, value: x.packages }))}
        unit="paket"
      />
    </div>
  );
}
function ProgressSummary({
  metrics,
  role,
}: {
  metrics: ReturnType<typeof aggregateDashboard>;
  role: string;
}) {
  const total = metrics.correctionsOpen + metrics.correctionsClosed;
  const closureRate = total
    ? Math.round((metrics.correctionsClosed / total) * 100)
    : null;
  const acceptanceRate = metrics.packages
    ? Math.round((metrics.accepted / metrics.packages) * 100)
    : null;
  return (
    <div className="panel-body ds-progress-summary">
      <div className="ds-progress-top">
        <div>
          <span>Paket dalam cakupan</span>
          <strong>{metrics.packages}</strong>
        </div>
        <div>
          <span>Audit perlu review</span>
          <strong>{metrics.auditPending}</strong>
        </div>
        <div>
          <span>Penerimaan akhir</span>
          <strong>{metrics.accepted}</strong>
        </div>
      </div>
      <div className="ds-progress-meter">
        <div>
          <span>Kasus koreksi ditutup</span>
          <strong>{closureRate === null ? "—" : `${closureRate}%`}</strong>
        </div>
        <div className="ds-progress-track">
          <span style={{ width: `${closureRate ?? 0}%` }} />
        </div>
        <small>
          {metrics.correctionsClosed} dari {total} kasus
        </small>
      </div>
      <div className="ds-progress-meter">
        <div>
          <span>Paket dengan penerimaan akhir</span>
          <strong>
            {acceptanceRate === null ? "—" : `${acceptanceRate}%`}
          </strong>
        </div>
        <div className="ds-progress-track is-green">
          <span style={{ width: `${acceptanceRate ?? 0}%` }} />
        </div>
        <small>
          {metrics.accepted} dari {metrics.packages} paket
        </small>
      </div>
      <Link
        href={role === "Penyedia Jasa / Ketua Tim" ? "/packages" : "/packages"}
        className="btn sm"
      >
        Lihat paket
      </Link>
    </div>
  );
}
function SurveyInspectionPanel({
  surveyTypes,
  records,
  role,
  surveyFilter,
  reviews,
  onOpenReview,
  allowedPackageIds,
}: {
  surveyTypes: string[];
  records: { name: string; records: number }[];
  role: string;
  surveyFilter: string;
  reviews: ReturnType<typeof aggregateDashboard>["surveyReviews"];
  onOpenReview: PageProps["openPackageReview"];
  allowedPackageIds: ReadonlySet<string>;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const names = [
    ...new Set([
      ...surveyTypes,
      ...records.map((r) => r.name),
      ...reviews.map((r) => r.surveyType),
    ]),
  ].sort();
  const shown = names.filter(
    (n) =>
      (surveyFilter === "Semua" || n === surveyFilter),
  );
  return (
    <div className="panel-body ds-inspection">
      {shown.length === 0 ? (
        <div className="ds-inspection-empty">
          Belum ada jenis survei dalam cakupan akses.
        </div>
      ) : (
        <div className="ds-inspection-table-wrap">
          <table className="ds-inspection-table">
            <thead>
              <tr>
                <th>Jenis survei</th>
                <th>Rekaman</th>
                <th>Keputusan review</th>
                <th>Rincian pemeriksaan</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((n) => {
                const items = reviews.filter(
                  (r) =>
                    r.surveyType === n &&
                    isReviewPackageInScope(r.packageId, allowedPackageIds),
                );
                const sesuai = items.filter(
                  (r) => r.decision === "Sesuai",
                ).length;
                const temuan = items.filter(
                  (r) => r.decision === "Temuan",
                ).length;
                return (
                  <tr key={n}>
                    <th scope="row">{n}</th>
                    <td>
                      {records.find((r) => r.name === n)?.records ?? 0}
                      <small>aktivitas tercatat</small>
                    </td>
                    <td>
                      {items.length ? (
                        <>
                          <strong>
                            {sesuai} sesuai · {temuan} temuan
                          </strong>
                          <small>
                            {items.length} keputusan, bukan paket lulus
                          </small>
                        </>
                      ) : (
                        <span className="ds-pending">Belum ada keputusan</span>
                      )}
                    </td>
                    <td>
                      {items.length ? (
                        <>
                          <button
                            type="button"
                            className="btn sm"
                            aria-expanded={expanded === n}
                            onClick={() =>
                              setExpanded(expanded === n ? null : n)
                            }
                          >
                            {expanded === n
                              ? "Tutup rincian"
                              : `Lihat ${items.length} keputusan`}
                          </button>
                          {expanded === n && (
                            <div className="ds-review-details">
                              {items.map((r, i) => (
                                <div
                                  className="ds-review-item"
                                  key={`${r.packageId}-${r.stage}-${i}`}
                                >
                                  <strong>
                                    {r.decision} · {r.packageName}
                                  </strong>
                                  <small>
                                    {r.stage}{r.period ? ` · Periode ${r.period}` : ""} · {r.reviewedAt}
                                  </small>
                                  <small>
                                    {r.note || "Catatan tidak diisi"}
                                  </small>
                                  <small>
                                    {r.evidenceReferences.length
                                      ? `Referensi bukti tercatat (${r.evidenceReferences.length}) · status lokal ditampilkan di bawah; keabsahan dan server belum diverifikasi`
                                      : "Status bukti: belum ada referensi eksplisit pada keputusan review"}
                                  </small>
                                  {r.evidenceReferences.map((ref) => (
                                    <ReviewEvidenceLocalStatus
                                      key={ref}
                                      packageId={r.packageId}
                                      reference={ref}
                                    />
                                  ))}
                                  <button
                                    type="button"
                                    className="btn sm"
                                    onClick={() => onOpenReview(r.packageId,
                                      r.stage === "Review berkala" ? "/verification:Verval 14 hari" : "/entry:Gerbang RNI/LRS",
                                      { period: r.period })}
                                    aria-label={`Buka paket ${r.packageName} untuk memeriksa bukti`}
                                  >
                                    Buka tahap pemeriksaan
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="ds-pending">Belum tersedia</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="ds-inspection-foot">
        <span>
          <strong>
            {reviews.filter((r) => shown.includes(r.surveyType)).length}{" "}
            keputusan review
          </strong>{" "}
          tercatat. Belum dapat dinyatakan sebagai persentase kepatuhan atau
          penerimaan akhir.
        </span>
        <Link
          className="btn sm"
          href={
            role === "Penyedia Jasa / Ketua Tim" ? "/packages" : "/verification"
          }
        >
          Buka pemeriksaan
        </Link>
      </div>
    </div>
  );
}
function TrendQualityNotice({
  reviews,
}: {
  reviews: ReturnType<typeof aggregateDashboard>["surveyReviews"];
}) {
  const monthly = new Map<string, { sesuai: number; temuan: number }>();
  for (const r of reviews) {
    const month = r.reviewedAt.slice(0, 7);
    const v = monthly.get(month) ?? { sesuai: 0, temuan: 0 };
    v[r.decision === "Sesuai" ? "sesuai" : "temuan"]++;
    monthly.set(month, v);
  }
  return (
    <div className="panel-body ds-quality-notice">
      <div className="ds-quality-icon">
        <ShieldCheck size={24} />
      </div>
      <div>
        <strong>Riwayat keputusan review yang tercatat</strong>
        {monthly.size ? (
          <div className="ds-review-months">
            {[...monthly]
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([month, v]) => (
                <div key={month}>
                  <strong>{month}</strong>
                  <span>
                    {v.sesuai} sesuai · {v.temuan} temuan
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <p>Belum ada keputusan review bertanggal dalam cakupan akses.</p>
        )}
        <p className="ds-chart-note">
          Ini tren jumlah keputusan review, bukan tren persentase kepatuhan,
          bukan hasil audit final. Review berkala dan V&amp;V bertahap dihitung
          sebagai peristiwa berbeda.
        </p>
      </div>
    </div>
  );
}
function AttentionList({
  items,
  onOpen,
}: {
  items: ReturnType<typeof aggregateDashboard>["attention"];
  onOpen: (id: string) => void;
}) {
  if (!items.length) return empty;
  return (
    <div className="panel-body ds-attention-list">
      {items.map((item) => (
        <div key={item.id} className="ds-attention-row">
          <div>
            <strong>{item.name}</strong>
            <span>{item.balai}</span>
            <small>
              {item.open} koreksi terbuka · {item.pending} dalam proses tindak
              lanjut/review
            </small>
          </div>
          <button
            type="button"
            className="btn sm"
            onClick={() => onOpen(item.id)}
          >
            Lihat paket
          </button>
        </div>
      ))}
    </div>
  );
}

function DashboardPageContent(p: DashboardProps) {
  const role = p.workflow.role,
    provider = role === "Penyedia Jasa / Ketua Tim",
    balai = role === "PIC Balai / Pengguna Jasa",
    admin = role === "Admin";
  const [showAll, setShowAll] = useState(false),
    [attention, setAttention] = useState("Semua kondisi"),
    [balaiLimit, setBalaiLimit] = useState("10");
  const [region, setRegion] = useState("Semua Balai"),
    [survey, setSurvey] = useState("Semua"),
    [period, setPeriod] = useState("Semua periode"),
    [packageId, setPackageId] = useState("Semua paket"),
    [category, setCategory] = useState("Semua");
  const packages = Object.fromEntries(
    Object.entries(p.packages).filter(
      ([id, s]) =>
        (packageId === "Semua paket" || id === packageId) &&
        (region === "Semua Balai" || s.project.balai === region),
    ),
  );
  const allMetrics = aggregateDashboard(p.packages, role);
  const metrics = aggregateDashboard(
      packages,
      role,
      "Semua Balai",
      survey,
      period,
    ),
    queue = dashboardWorkQueue(packages, role),
    reviews = balaiReviewQueue(packages),
    audits = directorateAuditRows(packages);
  const entries = Object.values(packages),
    all = Object.values(p.packages),
    currentTab = p.activeTab;
  const regions = [...new Set(all.map((s) => s.project.balai))],
    types = [...new Set(all.flatMap((s) => s.project.surveyTypes))];
  const activityMonths = all.flatMap((state) => state.dailyRecords
    .filter((record) => record.state === "Tercatat" && /^\d{4}-\d{2}-\d{2}$/.test(record.date))
    .map((record) => record.date.slice(0, 7)));
  const reviewMonths = allMetrics.surveyReviews.map((review) => review.reviewedAt.slice(0, 7));
  const months = [...new Set(currentTab === "Kepatuhan" ? reviewMonths : [...activityMonths, ...reviewMonths])]
    .sort().reverse();
  const drafts = (() => {
    try {
      return parseAccountDrafts(sessionStorage.getItem(ACCOUNT_DRAFT_KEY));
    } catch {
      return [];
    }
  })();
  const exampleIds = new Set(demoStoreSeed.logs.map((r) => r.id)),
    logs = p.store.logs.filter((r) => !exampleIds.has(r.id));
  const titles = provider
    ? [
        "PELAKSANAAN SURVEI",
        "Pekerjaan survei saya",
        "Kelola bukti, pengajuan, dan tindak lanjut pada paket penugasan.",
      ]
    : balai
      ? [
          "PEMERIKSAAN BALAI",
          "Antrean pemeriksaan",
          "Tinjau pengajuan, periksa bukti, lalu catat hasil sesuai kewenangan.",
        ]
      : admin
        ? [
            "ADMINISTRASI",
            "Administrasi sistem",
            "Siapkan akun dan penugasan, kelola referensi, telusuri aktivitas.",
          ]
        : [
            "PENGAWASAN LINTAS BALAI",
            "Pengawasan mutu survei",
            "Pantau data dalam cakupan akses dan prioritas Audit Tingkat 3.",
          ];
  const empty = (
    <Feedback
      kind="empty"
      title="Belum ada data pada cakupan ini"
      description="Sesuaikan filter atau periksa penugasan paket."
    />
  );
  const activeFilters =
    Number(region !== "Semua Balai") +
    Number(survey !== "Semua") +
    Number(period !== "Semua periode") +
    Number(packageId !== "Semua paket") +
    Number(attention !== "Semua kondisi");
  const reset = () => {
    setAttention("Semua kondisi");
    setRegion("Semua Balai");
    setSurvey("Semua");
    setPeriod("Semua periode");
    setPackageId("Semua paket");
    setCategory("Semua");
  };
  const packageRow = (item: (typeof queue)[number]) => {
    const state = packages[item.id];
    return (
      <article className="b-package-row" key={item.id}>
        <span className="b-row-icon">
          <FileText size={22} />
        </span>
        <div>
          <small>{state.project.contractNumber || item.id}</small>
          <h3>{item.name}</h3>
          <span>{item.balai}</span>
          <StatePill
            tone={
              item.priority === "action"
                ? "amber"
                : item.priority === "complete"
                  ? "teal"
                  : "neutral"
            }
          >
            {item.label}
          </StatePill>
          <details>
            <summary>Konteks pekerjaan</summary>
            <p>{item.description}</p>
          </details>
        </div>
        <div className="b-row-end">
          <strong>{derivePackageStage(state)}</strong>
          <WorkLink onClick={() => p.openPackage(item.id)}>Buka paket</WorkLink>
        </div>
      </article>
    );
  };
  return (
    <div
      className={`b-dashboard b-dashboard-${admin ? "admin" : provider ? "provider" : balai ? "balai" : "directorate"}`}
      data-testid="dashboard-work-queue"
    >
      <WorkspaceHeading
        eyebrow={titles[0]}
        title={provider && currentTab === "Kepatuhan" ? "Hasil per survei" : provider && currentTab === "Tren" ? "Tren pencatatan" : titles[1]}
        description={titles[2]}
        art
        action={p.canCreatePackage ? (
          <button type="button" className="btn primary" onClick={p.onCreatePackage} data-testid="button-create-package-dashboard">
            Buat Paket <ArrowRight size={16} />
          </button>
        ) : (
          <Link
            className="btn primary"
            href={admin ? "/audit" : provider ? "/packages" : "/verification"}
          >
            {admin
              ? "Kelola akun & akses"
              : provider
                ? "Pilih paket"
                : "Buka antrean"}
            <ArrowRight size={16} />
          </Link>
        )}
      />
      {!admin && (
        <FilterPanel
          title="Filter ringkasan"
          initiallyOpen={false}
          activeCount={activeFilters}
          onReset={reset}
        >
          <div className="b-filter-strip" aria-label="Filter ringkasan QA/QC">
            {!provider && (
              <label>
                Wilayah Balai
                <select
                  aria-label="Wilayah Balai"
                  value={region}
                  onChange={(e) => {
                    setRegion(e.target.value);
                    setPackageId("Semua paket");
                  }}
                >
                  <option>Semua Balai</option>
                  {regions.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>
            )}
            {(provider || balai) && (
              <label>
                Paket
                <select
                  aria-label="Paket"
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                >
                  <option>Semua paket</option>
                  {all
                    .filter(
                      (s) =>
                        region === "Semua Balai" || s.project.balai === region,
                    )
                    .map((s) => (
                      <option key={s.project.id} value={s.project.id}>
                        {s.project.packageName}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <label>
              Jenis survei
              <select
                aria-label="Jenis survei"
                value={survey}
                onChange={(e) => setSurvey(e.target.value)}
              >
                <option>Semua</option>
                {types.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Periode
              <select
                aria-label="Periode rekaman survei"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option>Semua periode</option>
                {[...new Set(months.map((m) => m.slice(0, 4)))].map((y) => (
                  <option key={y} value={"Tahun " + y}>
                    Tahun {y}
                  </option>
                ))}
                {months.map((m) => (
                  <option key={m} value={"Bulan " + m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            {currentTab === "Perlu perhatian" && (
              <label>
                Prioritas
                <select
                  aria-label="Prioritas"
                  value={attention}
                  onChange={(e) => setAttention(e.target.value)}
                >
                  <option>Semua kondisi</option>
                  <option>Ada koreksi terbuka</option>
                  <option>Menunggu tindak lanjut</option>
                </select>
              </label>
            )}
          </div>
        </FilterPanel>
      )}
      {currentTab === "Kepatuhan" && !admin ? (
        <WorkPanel title="Hasil pemeriksaan per jenis survei">
          <SurveyInspectionPanel
            surveyTypes={types}
            records={metrics.bySurvey}
            role={role}
            surveyFilter={survey}
            reviews={metrics.surveyReviews}
            onOpenReview={p.openPackageReview}
            allowedPackageIds={new Set(Object.keys(packages))}
          />
        </WorkPanel>
      ) : currentTab === "Tren" && !admin ? (
        <div className="b-grid">
          <WorkPanel title="Tren aktivitas pencatatan">
            <Trend rows={metrics.trend} />
          </WorkPanel>
          <WorkPanel title="Riwayat keputusan review">
            <TrendQualityNotice reviews={metrics.surveyReviews} />
          </WorkPanel>
        </div>
      ) : admin ? (
        <>
          <div className="b-metrics" aria-label="Empat KPI administrasi">
            <MetricTile
              icon={Database}
              label="Paket tercatat"
              value={metrics.packages}
              note="Dalam cakupan tersedia"
            />
            <MetricTile
              icon={Building2}
              label="Balai tercatat"
              value={metrics.balai}
              note="Dari referensi paket"
              tone="blue"
            />
            <MetricTile
              icon={ShieldCheck}
              label="Log aktivitas lokal"
              value={p.store.logs.length}
              note="Catatan pada perangkat ini"
              tone="amber"
            />
            <MetricTile
              icon={Settings}
              label="Integrasi backend"
              value="Belum aktif"
              note="Belum ada autentikasi server"
              tone="violet"
            />
          </div>
          <div className="b-admin-tools">
            {[
              [
                Users,
                "Akun & penugasan",
                "/audit",
                "Siapkan usulan dan cakupan akses.",
              ],
              [
                Database,
                "Data Master",
                "/data-master",
                "Kelola referensi survei dan wilayah.",
              ],
              [
                ShieldCheck,
                "Jejak aktivitas",
                "/audit",
                "Telusuri catatan administratif.",
              ],
            ].map(([Icon, label, href, detail]) => {
              const I = Icon as typeof Users;
              return (
                <Link href={String(href)} key={String(label)}>
                  <I size={26} />
                  <h2>{String(label)}</h2>
                  <p>{String(detail)}</p>
                  <ArrowRight size={18} />
                </Link>
              );
            })}
          </div>
          <div className="b-grid">
            <WorkPanel
              title="Usulan akun"
              action={
                <Link className="b-text-action" href="/audit">
                  Buka administrasi <ArrowRight size={16} />
                </Link>
              }
            >
              <div className="b-admin-proposal-summary">
                <span>
                  Usulan akun sesi ini <b>{drafts.length}</b>
                </span>
                <span>
                  Penugasan yang diusulkan{" "}
                  <b>{drafts.reduce((n, d) => n + d.assignments.length, 0)}</b>
                </span>
              </div>
              {drafts.length ? (
                drafts.map((d) => (
                  <div className="b-data-line" key={d.id}>
                    <span>
                      <strong>{d.username}</strong>
                      <small>{d.organization}</small>
                    </span>
                    <StatePill>{d.assignments.length} penugasan</StatePill>
                  </div>
                ))
              ) : (
                <Feedback
                  kind="empty"
                  title="Belum ada usulan akun"
                  description="Buat usulan melalui Administrasi & Akses. Usulan tidak mengaktifkan hak pengguna."
                />
              )}
            </WorkPanel>
            <WorkPanel title="Aktivitas administratif terbaru">
              {logs.length ? (
                logs.slice(0, 6).map((l) => (
                  <div className="b-timeline-item" key={l.id}>
                    <span />
                    <div>
                      <strong>{l.aktivitas}</strong>
                      <small>
                        {l.waktu} · {l.pengguna}
                      </small>
                      <p>{l.objek}</p>
                    </div>
                  </div>
                ))
              ) : (
                <Feedback
                  kind="empty"
                  title="Belum ada aktivitas tercatat"
                  description="Aktivitas contoh tidak ditampilkan sebagai audit trail nyata."
                />
              )}
              <details className="b-note">
                <summary>Status integrasi</summary>
                <p>
                  Identitas, audit trail server dan telemetri belum terhubung.
                  Tidak ada klaim uptime atau akun aktif.
                </p>
              </details>
            </WorkPanel>
          </div>
        </>
      ) : provider ? (
        <>
          <div className="b-metrics" aria-label="Empat KPI Penyedia">
            <MetricTile
              icon={FileText}
              label="Paket saya"
              value={metrics.packages}
              note="Paket dalam cakupan akses"
            />
            <MetricTile
              icon={BarChart3}
              label="Rekaman survei"
              value={metrics.dailyRecords}
              note="Rekaman tercatat"
              tone="blue"
            />
            <MetricTile
              icon={AlertTriangle}
              label="Koreksi terbuka"
              value={metrics.correctionsOpen}
              note="Belum ditutup"
              tone="amber"
            />
            <MetricTile
              icon={CheckCircle2}
              label="Penerimaan akhir"
              value={metrics.accepted}
              note="Penerimaan final tercatat"
            />
          </div>
          <div className="b-grid b-provider-layout">
            <WorkPanel
              title="Paket & pekerjaan berikutnya"
              kicker="PILIH PAKET UNTUK MELANJUTKAN"
            >
              <div className="b-segmented">
                {["Semua", "Perlu tindakan", "Menunggu"].map((t) => (
                  <button
                    key={t}
                    aria-pressed={category === t}
                    onClick={() => setCategory(t)}
                  >
                    {t}
                    {t === "Perlu tindakan"
                      ? ` (${queue.filter((r) => r.priority === "action").length})`
                      : t === "Menunggu"
                        ? ` (${queue.filter((r) => r.priority === "waiting").length})`
                        : ""}
                  </button>
                ))}
              </div>
              {queue
                .filter(
                  (r) =>
                    category === "Semua" ||
                    r.priority ===
                      (category === "Perlu tindakan" ? "action" : "waiting"),
                )
                .slice(0, showAll ? undefined : 3)
                .map(packageRow)}
              {!queue.filter(
                (r) =>
                  category === "Semua" ||
                  r.priority ===
                    (category === "Perlu tindakan" ? "action" : "waiting"),
              ).length && empty}
              {queue.length > 3 && (
                <button
                  className="b-text-action"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll
                    ? "Tampilkan prioritas"
                    : `Lihat semua ${queue.length} paket`}
                </button>
              )}
            </WorkPanel>
            <div className="b-stack">
              <Link href="/actions" className="c-work-shortcut">
                <AlertTriangle size={22} />
                <span>
                  <strong>Tindakan Perbaikan</strong>
                  <small>Tanggapi temuan dan lengkapi bukti.</small>
                </span>
                <ArrowRight size={17} />
              </Link>
              <Link href="/documents" className="c-work-shortcut">
                <FileText size={22} />
                <span>
                  <strong>Dokumen Mutu</strong>
                  <small>Siapkan dokumen atau tanggapi revisi.</small>
                </span>
                <ArrowRight size={17} />
              </Link>
              <details className="b-note">
                <summary>Aktivitas survei tercatat</summary>
                <Columns
                  rows={metrics.bySurvey.map((s) => ({
                    name: s.name,
                    value: s.records,
                  }))}
                />
              </details>
            </div>
          </div>
        </>
      ) : balai ? (
        <>
          <div className="b-metrics" aria-label="Empat KPI Balai">
            <MetricTile
              icon={Building2}
              label="Paket kewenangan"
              value={metrics.packages}
              note="Sesuai cakupan akses"
            />
            <MetricTile
              icon={ClipboardCheck}
              label="Audit dalam review"
              value={metrics.auditPending}
              note="Dalam review / klarifikasi"
              tone="blue"
            />
            <MetricTile
              icon={AlertTriangle}
              label="Koreksi terbuka"
              value={metrics.correctionsOpen}
              note="Perlu pemantauan"
              tone="amber"
            />
            <MetricTile
              icon={BarChart3}
              label="Rekaman tercatat"
              value={metrics.dailyRecords}
              note="Paket dalam cakupan"
            />
          </div>
          <div className="b-grid b-review-layout">
            <WorkPanel
              title="Antrean pemeriksaan"
              kicker="PENGAJUAN DALAM KEWENANGAN BALAI"
              action={
                <Link className="b-text-action" href="/verification">
                  Semua pemeriksaan
                  <ArrowRight size={16} />
                </Link>
              }
            >
              {reviews
                .filter((r) => r.status === "Perlu Review")
                .slice(0, showAll ? undefined : 3)
                .map((r) => (
                  <article className="b-review-row" key={r.id}>
                    <span className="b-row-icon">
                      <ClipboardCheck size={21} />
                    </span>
                    <div>
                      <h3>{r.packageName}</h3>
                      <small>
                        {r.kind} · {r.stage}
                        {r.period ? " · Periode " + r.period : ""}
                      </small>
                      <p>{r.reason}</p>
                    </div>
                    <button
                      className="btn"
                      onClick={() =>
                        p.openPackageReview(r.packageId, r.selection, {
                          period: r.period,
                          auditLevel: r.auditLevel,
                        })
                      }
                    >
                      Buka pemeriksaan
                      <ArrowRight size={15} />
                    </button>
                  </article>
                ))}
              {reviews.filter((r) => r.status === "Perlu Review").length >
                3 && (
                <button
                  className="b-text-action"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll
                    ? "Tampilkan prioritas"
                    : `Lihat semua ${reviews.filter((r) => r.status === "Perlu Review").length} pemeriksaan`}
                </button>
              )}
              {!reviews.some((r) => r.status === "Perlu Review") && (
                <Feedback
                  kind="empty"
                  title="Belum ada pengajuan siap diperiksa"
                  description="Pantau kategori Monitoring untuk melihat prasyarat yang belum terpenuhi."
                />
              )}
            </WorkPanel>
            <WorkPanel title="Status pemeriksaan" kicker="SUMBER ANTREAN">
              {[
                "Perlu Review",
                "Menunggu",
                "Perlu Perbaikan",
                "Selesai/Lulus",
              ].map((status) => (
                <div className="b-status-bar" key={status}>
                  <div>
                    <span>{status}</span>
                    <strong>
                      {reviews.filter((r) => r.status === status).length}
                    </strong>
                  </div>
                  <meter
                    min="0"
                    max={Math.max(1, reviews.length)}
                    value={reviews.filter((r) => r.status === status).length}
                  />
                </div>
              ))}
              <details className="b-note">
                <summary>Temuan dan verifikasi ulang</summary>
                <p>
                  {metrics.correctionsOpen} kasus terbuka dalam paket yang dapat
                  diakses. Pemeriksaan kasus mengikuti sumber temuan.
                </p>
                <Link href="/actions">Buka Tindakan Perbaikan</Link>
              </details>
            </WorkPanel>
          </div>
        </>
      ) : (
        <>
          <div className="b-metrics" aria-label="Empat KPI Direktorat">
            <MetricTile
              icon={Building2}
              label="Balai tercatat"
              value={metrics.balai}
              note="Dalam cakupan akses"
            />
            <MetricTile
              icon={FileText}
              label="Paket monitoring"
              value={metrics.packages}
              note="Paket yang dapat diakses"
              tone="blue"
            />
            <MetricTile
              icon={AlertTriangle}
              label="Koreksi terbuka"
              value={metrics.correctionsOpen}
              note="Belum ditutup"
              tone="amber"
            />
            <MetricTile
              icon={ClipboardCheck}
              label="Audit dalam review"
              value={metrics.auditPending}
              note="Dalam review / klarifikasi"
              tone="violet"
            />
          </div>
          <div className="b-grid b-national-layout">
            <WorkPanel
              title="Peta pengawasan lintas Balai"
              kicker="PETA DASAR INDONESIA · CAKUPAN PAKET"
            >
              <DirectorateMap
                balais={allMetrics.byBalai}
                selected={region}
                onSelect={(value) => {
                  setRegion(value);
                  setPackageId("Semua paket");
                }}
              />
              <details className="b-note b-region-distribution">
                <summary>Sebaran paket lintas Balai</summary>
                <BalaiRanking
                  rows={metrics.byBalai}
                  limit={balaiLimit}
                  onLimitChange={setBalaiLimit}
                />
              </details>
            </WorkPanel>
            <WorkPanel
              className="b-priority-panel"
              title="Prioritas pengawasan"
              action={
                <Link className="b-text-action" href="/verification">
                  Audit Tingkat 3<ArrowRight size={16} />
                </Link>
              }
            >
              {audits
                .filter((a) => a.status !== "riwayat")
                .slice(0, showAll ? undefined : 3)
                .map((a) => (
                  <article
                    className="b-audit-priority"
                    key={a.state.project.id}
                  >
                    <StatePill
                      tone={a.status === "tertahan" ? "amber" : "teal"}
                    >
                      {a.status === "tertahan"
                        ? "Tertahan"
                        : a.status === "siap"
                          ? "Siap diaudit"
                          : "Dalam review"}
                    </StatePill>
                    <h3>{a.state.project.packageName}</h3>
                    <small>{a.state.project.balai}</small>
                    <p>{a.reason}</p>
                    <Link
                      href={
                        "/verification?tab=" +
                        encodeURIComponent(
                          a.status === "tertahan"
                            ? "Tertahan & Tindak Lanjut"
                            : a.status === "berjalan"
                              ? "Sedang Diaudit"
                              : "Perlu Diaudit",
                        )
                      }
                      className="b-text-action"
                    >
                      {a.status === "tertahan"
                        ? "Lihat hambatan"
                        : "Buka antrean audit"}
                      <ArrowRight size={15} />
                    </Link>
                  </article>
                ))}
              {!audits.filter((a) => a.status !== "riwayat").length && empty}
              {audits.filter((a) => a.status !== "riwayat").length > 3 && (
                <button
                  className="b-text-action"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? "Tampilkan prioritas" : "Lihat semua prioritas"}
                </button>
              )}
            </WorkPanel>
          </div>
          <details className="c-review-analysis">
            <summary>Analisis review dan tindak lanjut</summary>
            <div className="b-grid">
              <WorkPanel title="Riwayat keputusan review">
                <TrendQualityNotice reviews={metrics.surveyReviews} />
              </WorkPanel>
              <WorkPanel title="Komposisi tindak lanjut">
                <Donut
                  open={metrics.correctionsOpen}
                  closed={metrics.correctionsClosed}
                />
              </WorkPanel>
            </div>
          </details>
        </>
      )}

      <details className="b-analysis-details">
        <summary>
          {admin
            ? "Monitoring data workflow"
            : "Grafik aktivitas & tindak lanjut"}
        </summary>
        <div className="b-grid">
          <WorkPanel title="Aktivitas survei menurut jenis">
            <Columns
              rows={metrics.bySurvey.map((x) => ({
                name: x.name,
                value: x.records,
              }))}
            />
          </WorkPanel>
          <WorkPanel title="Tren pencatatan per bulan">
            <Trend rows={metrics.trend} />
          </WorkPanel>
          {admin ? (
            <>
              <WorkPanel title="Paket menurut Balai">
                <Columns
                  rows={metrics.byBalai.map((x) => ({
                    name: x.name,
                    value: x.packages,
                  }))}
                  unit="paket"
                />
              </WorkPanel>
              <WorkPanel title="Kesiapan aliran data">
                <div className="quality-check">
                  <span>Data paket yang dapat dibaca</span>
                  <strong>{metrics.packages}</strong>
                </div>
                <div className="quality-check">
                  <span>Catatan aktivitas lokal</span>
                  <strong>{p.store.logs.length}</strong>
                </div>
                <div className="quality-check">
                  <span>API dan autentikasi</span>
                  <strong>Belum diverifikasi</strong>
                </div>
              </WorkPanel>
            </>
          ) : (
            <>
              <WorkPanel title="Komposisi kasus koreksi">
                <Donut
                  open={metrics.correctionsOpen}
                  closed={metrics.correctionsClosed}
                />
              </WorkPanel>
              <WorkPanel title="Koreksi terbuka menurut paket">
                <Bars
                  rows={metrics.attention
                    .filter((x) => x.open > 0)
                    .map((x) => ({ name: x.name, value: x.open }))}
                  unit="koreksi terbuka"
                />
              </WorkPanel>
              <WorkPanel title="Progres tindak lanjut">
                <ProgressSummary metrics={metrics} role={role} />
              </WorkPanel>
              <WorkPanel title="Paket perlu perhatian">
                <AttentionList
                  items={metrics.attention.filter(
                    (item) =>
                      attention === "Semua kondisi" ||
                      (attention === "Ada koreksi terbuka"
                        ? item.open > 0
                        : item.pending > 0),
                  )}
                  onOpen={p.openPackage}
                />
              </WorkPanel>
            </>
          )}
        </div>
      </details>
    </div>
  );
}

function ResourceMessage({state}:{state:ResourceState<unknown>}) {
 if(state.status==='loading')return <div className="panel-body subtle" role="status">Memuat data dari server…</div>;
 if(state.status==='error')return <div className="panel-body subtle" role="alert">Gagal memuat data: {state.message}</div>;
 if(state.status==='unavailable')return <div className="panel-body subtle" role="status">Belum tersedia dari server. {state.message}</div>;
 return <div className="panel-body subtle">Belum tersedia dari server.</div>;
}

function DashboardEmpty({title,detail}:{title:string;detail:string}) {
 return <div className="panel-body ds-empty-state" role="status"><span className="ds-empty-icon"><CheckCircle2 size={19}/></span><div><strong>{title}</strong><p>{detail}</p></div></div>;
}

function AuthenticatedDashboard({p}:{p:DashboardProps}) {
 const role=p.workflow.role;
 const {data,reload}=useServerDashboard(true,role);
 const [balaiFilter,setBalaiFilter]=useState('Semua Balai');
 const [packageFilter,setPackageFilter]=useState('Semua paket');
 const [balaiLimit,setBalaiLimit]=useState('10');
 const packages=data.packages.status==='ready'?data.packages.data:[];
 const balaiOptions=[...new Set(packages.map(x=>x.balaiId).filter((x):x is number=>x!==null))].sort((a,b)=>a-b);
 const packageOptions=filterServerPackages(packages,balaiFilter,'Semua paket').sort((a,b)=>a.name.localeCompare(b.name));
 const filtered=filterServerPackages(packages,balaiFilter,packageFilter);
 const corrections=data.corrections.status==='ready'?data.corrections.data:{};
 const correctionMetrics=aggregateServerCorrections(filtered,corrections);
 const correctionEmptyCopy=serverCorrectionEmptyCopy(filtered.length,correctionMetrics.total,correctionMetrics.open);
 const rows=filtered.flatMap(pkg=>(corrections[pkg.id]??[]).map(item=>({packageId:pkg.id,packageName:pkg.name,...item})));
 const open=rows.filter(x=>x.status!=='Ditutup');
 const closed=rows.filter(x=>x.status==='Ditutup');
 const correctionReady=data.corrections.status==='ready';
 const filteredIds=new Set(filtered.map(pkg=>pkg.id));
 const errorForFiltered=Object.entries(data.correctionErrors).filter(([id])=>filteredIds.has(id));
 const correctionPartial=errorForFiltered.length>0;
 const packageLabel=role==='Penyedia Jasa / Ketua Tim'?'Paket saya':role==='PIC Balai / Pengguna Jasa'?'Paket kewenangan':'Paket monitoring';
 const chartUnavailable={status:'unavailable',message:'Sumber rekaman harian yang tepat belum disediakan.'} as const;
 const kpis:[[typeof FileText,string,ResourceState<unknown>],[typeof BarChart3,string,ResourceState<unknown>],[typeof AlertTriangle,string,ResourceState<unknown>],[typeof CheckCircle2,string,ResourceState<unknown>]]=[
   [FileText,packageLabel,data.packages],
   [BarChart3,'Rekaman survei',chartUnavailable],
   [AlertTriangle,'Koreksi terbuka',data.corrections],
   [CheckCircle2,'Penerimaan akhir',{status:'unavailable',message:'Belum tersedia dari server.'}],
 ];
 const valueFor=(label:string,resource:ResourceState<unknown>)=> {
   if(resource.status==='loading')return 'Memuat…';
   if(resource.status==='error')return 'Gagal';
   if(resource.status==='unavailable')return 'Tidak tersedia';
   if(label===packageLabel)return String(filtered.length);
   if(label==='Koreksi terbuka')return correctionReady?`${open.length}${correctionPartial?'*':''}`:'—';
   return 'Belum tersedia';
 };
 const correctionUnavailable:ResourceState<unknown>=data.corrections;
 const balaiCounts=[...new Set(filtered.map(x=>x.balaiId).filter((x):x is number=>x!==null))].map(id=>({name:`Balai #${id}`,value:filtered.filter(x=>x.balaiId===id).length})).sort((a,b)=>b.value-a.value);
 const visibleBalai=balaiLimit==='Semua'?balaiCounts:balaiCounts.slice(0,Number(balaiLimit));
 return <>
  <PageHeading id="dashboard-main" label={ROLE_HOME_LABELS[role]} detail={`${role} · Data dashboard melalui API server berautentikasi`} action={<Link href={role==='Penyedia Jasa / Ketua Tim'?'/packages':role==='PIC Balai / Pengguna Jasa'?'/verification':'/packages'} className="btn primary">{role==='Penyedia Jasa / Ketua Tim'?'Buka paket saya':role==='PIC Balai / Pengguna Jasa'?'Buka review':'Buka monitoring'}</Link>}/>
  <div className="ds-filter-panel" aria-label="Filter ringkasan QA/QC"><div className="ds-filter-title"><strong>Cakupan ringkasan</strong><span>Statistik hanya merangkumi paket yang dibenarkan untuk peranan anda.</span></div><div className="ds-filter-fields">
   <label>Paket<select value={packageFilter} onChange={e=>setPackageFilter(e.target.value)}><option>Semua paket</option>{packageOptions.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
   <label>Wilayah Balai<select value={balaiFilter} onChange={e=>{setBalaiFilter(e.target.value);setPackageFilter('Semua paket')}}><option>Semua Balai</option>{balaiOptions.map(id=><option key={id} value={String(id)}>Balai #{id}</option>)}</select></label>
   <button className="btn sm" type="button" onClick={()=>{setPackageFilter('Semua paket');setBalaiFilter('Semua Balai')}}>Atur ulang</button>
   <button className="btn sm" type="button" onClick={reload}>Muat ulang</button>
  </div></div>
  <div className="kpi-grid ds-kpi-grid">{kpis.map(([Icon,label,resourceState])=>{const note=resourceState.status==='ready'&&label===packageLabel?'Hasil daftar paket server':resourceState.status==='ready'&&label==='Koreksi terbuka'?(correctionPartial?'Sebagian paket gagal dibaca':'Kasus server; selain Ditutup'):resourceState.status==='unavailable'?'Belum tersedia dari server':resourceState.status==='error'?'Gagal dimuat':'Sedang dimuat';return <KPI key={label} icon={Icon} label={label} value={valueFor(label,resourceState)} note={note} tone={label.includes('Koreksi')?'amber':'blue'} testId={`kpi-dashboard-${label.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`}/>;})}</div>
  <div className="grid-two"><Section id="dashboard-compliance" title="Aktivitas survei menurut jenis" icon={BarChart3}><ResourceMessage state={chartUnavailable}/></Section><Section title="Komposisi kasus koreksi" icon={AlertTriangle}>{correctionReady?(correctionPartial?<DashboardEmpty title="Komposisi belum lengkap" detail="Sebahagian paket gagal dibaca. Carta tidak dipaparkan supaya jumlah separa tidak disalah anggap sebagai jumlah keseluruhan."/>:rows.length?<Donut open={open.length} closed={closed.length}/>:<DashboardEmpty {...correctionEmptyCopy.composition!}/>):<ResourceMessage state={correctionUnavailable}/>}</Section></div>
  <div className="grid-two"><Section id="dashboard-trend" title="Tren pencatatan per bulan" icon={TrendingUp}><ResourceMessage state={chartUnavailable}/></Section><Section title="Koreksi terbuka menurut paket" icon={AlertTriangle}>{correctionReady?(correctionPartial?<DashboardEmpty title="Agihan belum lengkap" detail="Sebahagian paket gagal dibaca; agihan paket tidak dipaparkan sehingga semua respons tersedia."/>:open.length?<Bars rows={correctionMetrics.byPackage.filter(x=>x.open>0).map(x=>({name:x.name,value:x.open}))} unit="koreksi terbuka"/>:<DashboardEmpty {...correctionEmptyCopy.openByPackage!}/>):<ResourceMessage state={correctionUnavailable}/>}</Section></div>
  <div className="grid-two ds-overview-secondary"><Section title="Progres penyelesaian" icon={ShieldCheck}>{correctionReady&&!correctionPartial?<div className="panel-body ds-progress-summary"><div className="ds-progress-top"><div><span>Paket dalam cakupan</span><strong>{filtered.length}</strong></div><div><span>Audit</span><strong>Belum tersedia</strong></div><div><span>Penerimaan akhir</span><strong>Belum tersedia</strong></div></div><div className="ds-progress-meter"><div><span>Kasus koreksi ditutup</span><strong>{rows.length?`${Math.round(closed.length/rows.length*100)}%`:'—'}</strong></div><div className="ds-progress-track"><span style={{width:`${rows.length?closed.length/rows.length*100:0}%`}}/></div><small>{closed.length} dari {rows.length} kasus</small></div><p className="ds-chart-note">Audit dan penerimaan akhir belum tersedia dari server.</p></div>:<ResourceMessage state={correctionReady?{status:'unavailable',message:'Peratus penutupan tidak dipaparkan kerana sebahagian paket gagal dimuat.'}:correctionUnavailable}/>}</Section>
   <Section title="Langkah selanjutnya" icon={ClipboardCheck}><div className="panel-body ds-action-panel"><strong>Belum tersedia dari server</strong><p>Data status workflow/next action belum mempunyai sumber dashboard yang disahkan.</p><Link className="btn sm" href="/packages">Buka paket</Link></div></Section></div>
  {errorForFiltered.length>0&&<p className="panel-body ds-partial-warning" role="alert"><AlertTriangle size={17}/>Data koreksi belum lengkap: {errorForFiltered.length} daripada {filtered.length} paket gagal dibaca. KPI bertanda * ialah jumlah separa; carta jumlah disembunyikan.</p>}
  {data.packages.status==='ready'&&balaiCounts.length>0&&<Section title="Sebaran paket lintas Balai" icon={Building2}><div className="ds-ranking"><div className="ds-ranking-toolbar"><label>Jumlah Balai <select value={balaiLimit} onChange={e=>setBalaiLimit(e.target.value)}><option value="5">Top 5</option><option value="10">Top 10</option><option value="Semua">Semua</option></select></label><small>Data paket daripada server</small></div><Columns rows={visibleBalai} unit="paket"/></div></Section>}
  {data.packages.status!=='ready'&&<Section title="Data paket" icon={Database}><ResourceMessage state={data.packages}/></Section>}
  </>;
}

type DashboardProps = PageProps & {
  canCreatePackage?: boolean;
  dashboardAuthenticated?: boolean;
  onCreatePackage?: () => void;
};

/** Logged-in users: Dirah dashboard over server packages, with the server sync view one click away. */
function AuthenticatedDirahDashboard({ p }: { p: DashboardProps }) {
  const { state, reload } = useServerDirahPackages(true, p.workflow.role);
  const [viewMode, setViewMode] = useState<"dirah" | "server">("dirah");
  const [createPackageOpen, setCreatePackageOpen] = useState(false);
  if (viewMode === "server") {
    return (
      <>
        <div className="ds-view-toggle">
          <button type="button" className="btn sm" onClick={() => setViewMode("dirah")}>Kembali ke ringkasan</button>
        </div>
        <AuthenticatedDashboard p={p} />
      </>
    );
  }
  return (
    <>
      <div className="ds-view-toggle" role="status">
        <span>
          {state.status === "loading"
            ? "Memuat paket dari server…"
            : state.status === "error"
              ? `Gagal memuat paket: ${state.message}`
              : `${Object.keys(state.packages).length} paket dari server${state.truncated ? " (sebagian)" : ""}. Status tahap per paket dibaca di workspace paket.`}
        </span>
        {state.status === "error" && <button type="button" className="btn sm" onClick={reload}>Coba lagi</button>}
        <button type="button" className="btn sm" onClick={() => setViewMode("server")}>Status koreksi server</button>
      </div>
      <DashboardPageContent
        {...p}
        packages={state.packages}
        onCreatePackage={() => setCreatePackageOpen(true)}
      />
      {createPackageOpen && p.canCreatePackage && (
        <CreatePackageDialog
          onClose={() => setCreatePackageOpen(false)}
          onCreated={item => {
            setCreatePackageOpen(false);
            p.setNotice(`Paket DRAFT #${item.paket_id} berhasil dibuat.`);
            reload();
          }}
        />
      )}
    </>
  );
}

export default function DashboardPage(p: DashboardProps) {
  if (p.dashboardAuthenticated) return <AuthenticatedDirahDashboard p={p} />;
  return <DashboardPageContent {...p} canCreatePackage={false} />;
}
