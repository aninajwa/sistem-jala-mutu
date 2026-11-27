import { projectDecisionHistory } from "./biDecisionHistory";
import { VolumeProgressPanel } from "./VolumeProgressPanel";
import ProviderWorkHome from "./ProviderWorkHome";
import { projectBI } from "./biProjection";
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
import { derivePackageStage } from "../workflow/packageStore";
import { ACCOUNT_DRAFT_KEY, parseAccountDrafts } from "../admin/accountDrafts";
import { demoStoreSeed } from "../lib/demoData";
import { Feedback } from "../design/Feedback";
import { useState, type ReactNode } from "react";
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
  detail,
}: {
  rows: ChartRow[];
  unit?: string;
  detail?: (name: string) => ReactNode;
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
      {active && detail && <div className="bi-record-detail">{detail(active.name)}</div>}
      <p className="ds-chart-note">
        Pilih kolom untuk melihat rincian jumlah {unit}.
      </p>
    </div>
  );
}
function Bars({ rows, unit = "rekaman", detail }: { rows: ChartRow[]; unit?: string; detail?: (name: string) => ReactNode }) {
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
      {active && detail && <div className="bi-record-detail">{detail(active.name)}</div>}
      <p className="ds-chart-note">Pilih kategori untuk melihat rincian.</p>
    </div>
  );
}
function Trend({ rows, detail, label = "Rekaman survei" }: { rows: { label: string; records: number }[]; detail?: (month: string) => ReactNode; label?: string }) {
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
        aria-label={`${label} per bulan`}
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
            stroke="#438B96"
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
              fill={selected === r.label ? "#C49A59" : "#438B96"}
              stroke="white"
              strokeWidth="2"
            >
              <title>
                {r.label}: {r.records}
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
      {active && detail && <div className="bi-record-detail">{detail(active.label)}</div>}
      <p className="ds-chart-note">
        Rekaman tercatat per bulan. Pilih bulan
        untuk rincian.
      </p>
    </div>
  );
}
function Donut({ open, closed, detail }: { open: number; closed: number; detail?: (status: "Terbuka" | "Ditutup") => ReactNode }) {
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
          background: `conic-gradient(#398D85 0 ${pct}%,#C49A59 ${pct}% 100%)`,
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
            { name: "Terbuka", value: open, color: "#C49A59" },
            { name: "Ditutup", value: closed, color: "#398D85" },
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
          {detail && <div className="bi-record-detail">{detail(selected)}</div>}
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
  const palette = ["#C49A59", "#398D85", "#438B96", "#708C9C"];
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
                background: palette[rows.indexOf(r) % palette.length],
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
                                      ? `${r.evidenceReferences.length} referensi bukti`
                                      : "Belum ada referensi bukti"}
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

export default function DashboardPage(p: PageProps & { onOpenCorrection?: (packageId: string, correctionId: string) => void }) {
  const role = p.workflow.role,
    provider = role === "Penyedia Jasa / Ketua Tim",
    balai = role === "PIC Balai / Pengguna Jasa",
    admin = role === "Admin";
  const [recordLimit, setRecordLimit] = useState(8);
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
  const bi = projectBI(packages, survey, period);
  const currentCases = projectBI(packages, currentCaseSurvey()).cases;
  function currentCaseSurvey(){ return p.activeTab === "Perlu perhatian" || admin ? "Semua" : survey; }
  const sessionDetail = (name: string, byDate = false) => bi.sessions.filter(r => byDate ? r.date === name && Number.isFinite(r.lengthKm) && r.lengthKm > 0 : r.surveyType === name).map(r => <div className="b-data-line" key={`${r.packageId}:${r.id}`}><span>{r.date} · {r.road}<small>{r.packageName} · {r.id}{byDate ? ` · ${r.lengthKm} km sesi` : ''}</small></span><WorkLink onClick={() => p.openPackageReview(r.packageId, "/entry:Survei harian")}>Buka survei</WorkLink></div>);
  const biSurveyRows = Array.from(new Set(bi.sessions.map(r=>r.surveyType))).sort().map(name=>({name,value:bi.sessions.filter(r=>r.surveyType===name).length}));
  const biTrendRows = Array.from(new Set(bi.sessions.map(r=>r.date.slice(0,7)).filter(d=>/^\d{4}-\d{2}$/.test(d)))).sort().map(label=>({label,records:bi.sessions.filter(r=>r.date.slice(0,7)===label).length}));
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
    audits = directorateAuditRows(packages).filter(a => {
      const stage = derivePackageStage(a.state);
      const central = a.state.audits.find(x => x.level === 3);
      return stage === "Tahap 5" || stage === "Tahap 6" || stage === "Selesai" || Boolean(central && (central.status !== "Belum Dimulai" || central.requiresReview)) || currentCases.some(c => c.packageId === a.state.project.id && c.status !== "Ditutup");
    }).map(a => {
      const stage = derivePackageStage(a.state);
      return ["Tahap 5", "Tahap 6", "Selesai"].includes(stage) ? a : {...a, reason: `${stage} · Tindak lanjut temuan atau pemeriksaan yang tercatat`};
    });
  const entries = Object.values(packages),
    all = Object.values(p.packages),
    currentTab = p.activeTab;
  const regions = [...new Set(all.map((s) => s.project.balai))],
    types = [...new Set(all.flatMap((s) => s.project.surveyTypes))];
  const activityMonths = all.flatMap((state) => state.dailyRecords
    .filter((record) => record.state === "Tercatat" && /^\d{4}-\d{2}-\d{2}$/.test(record.date))
    .map((record) => record.date.slice(0, 7)));
  const reviewMonths = [...allMetrics.surveyReviews.map((review) => review.reviewedAt.slice(0, 7)), ...projectDecisionHistory(p.packages).map(e=>e.month)];
  const months = [...new Set(currentTab === "Kepatuhan" ? (provider ? activityMonths : reviewMonths) : [...activityMonths, ...reviewMonths])]
    .sort().reverse();
  const decisionGroups = (groupBy: (r: (typeof metrics.surveyReviews)[number]) => string) => Array.from(new Set(metrics.surveyReviews.map(groupBy))).sort().map(name=>({name, sesuai:metrics.surveyReviews.filter(r=>groupBy(r)===name&&r.decision==="Sesuai").length, temuan:metrics.surveyReviews.filter(r=>groupBy(r)===name&&r.decision==="Temuan").length}));
  const decisionMatrix = (byRegion: boolean) => decisionGroups(r=>byRegion?(packages[r.packageId]?.project.balai||"Belum ditentukan"):r.packageName);
  const decisionMonths = decisionGroups(r=>r.reviewedAt.slice(0,7));
  const packageDetail = (matches: (state: typeof entries[number]) => boolean) => entries.filter(matches).map(state => <div className="b-data-line" key={state.project.id}><span>{state.project.packageName}<small>{state.project.balai}</small></span><WorkLink onClick={()=>p.openPackage(state.project.id)}>Buka paket</WorkLink></div>);
  const caseDetail = (matches: (item: typeof currentCases[number]) => boolean) => currentCases.filter(matches).map(c => <div className="b-data-line" key={`${c.packageId}:${c.id}`}><span>{c.id} · {c.surveyType}<small>{c.packageName} · {c.status} · {c.severity}</small></span><WorkLink onClick={()=>p.onOpenCorrection ? p.onOpenCorrection(c.packageId,c.id) : p.openPackage(c.packageId)}>Lihat kasus</WorkLink></div>);
  const monthDetail = (month: string) => bi.sessions.filter(r=>r.date.slice(0,7)===month).map(r=><div className="b-data-line" key={`${r.packageId}:${r.id}`}><span>{r.date} · {r.surveyType}<small>{r.packageName} · {r.id}</small></span><WorkLink onClick={()=>p.openPackageReview(r.packageId,"/entry:Survei harian")}>Buka survei</WorkLink></div>);
  const reviewDetail = (decision: string) => metrics.surveyReviews.filter(r=>r.decision===decision).map(r=><div className="b-data-line" key={`${r.packageId}:${r.surveyType}:${r.stage}:${r.period ?? ''}`}><span>{r.packageName} · {r.surveyType}<small>{r.stage} · {r.reviewedAt}</small></span><WorkLink onClick={()=>p.openPackage(r.packageId)}>Buka paket</WorkLink></div>);
  const decisionPanel = (rows: {name:string;sesuai:number;temuan:number}[], groupBy: (r: (typeof metrics.surveyReviews)[number])=>string) => rows.length ? <div className="bi-decision-list"><div className="bi-decision-legend"><span><i className="bi-ok"/>Sesuai</span><span><i className="bi-finding"/>Temuan</span></div>{rows.map(r=><div key={r.name}><strong>{r.name}</strong><div className="bi-decision-bar" aria-label={`${r.name}: ${r.sesuai} sesuai, ${r.temuan} temuan`}><span className="bi-ok" style={{flex:r.sesuai}}/><span className="bi-finding" style={{flex:r.temuan}}/></div><small>{r.sesuai} sesuai · {r.temuan} temuan</small><details><summary>Lihat keputusan</summary><div className="bi-record-detail">{metrics.surveyReviews.filter(x=>groupBy(x)===r.name).map((x,i)=><div className="b-data-line" key={i}><span>{x.packageName} · {x.surveyType}<small>{x.stage} · {x.decision} · {x.reviewedAt}</small></span><WorkLink onClick={()=>p.openPackage(x.packageId)}>Buka paket</WorkLink></div>)}</div></details></div>)}</div> : empty;

  const historicalDecisions = projectDecisionHistory(packages,period).filter(e=>balai ? e.actor === "PIC Balai / Pengguna Jasa" : !provider && !admin);
  const historyRows = Array.from(new Set(historicalDecisions.map(e=>e.month))).sort().map(label=>({label,records:historicalDecisions.filter(e=>e.month===label).length}));
  const historyPanel = survey === "Semua" ? <><Trend label="Keputusan paket" rows={historyRows} detail={month=>historicalDecisions.filter(e=>e.month===month).map(e=><div className="b-data-line" key={`${e.packageId}:${e.id}`}><span>{e.packageName}<small>{e.stage} · {e.status} · {e.recordedAt.slice(0,10)}</small></span><WorkLink onClick={()=>p.openPackage(e.packageId)}>Buka paket</WorkLink></div>)}/><p className="ds-chart-note">Jumlah keputusan paket yang tercatat, bukan persentase kelulusan.</p></> : <p className="ds-chart-note">Pilih semua jenis survei untuk melihat keputusan tingkat paket.</p>;
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
        "Dashboard Pekerjaan",
        "Kelola bukti, pengajuan, dan tindak lanjut pada paket penugasan.",
      ]
    : balai
      ? [
          "PEMERIKSAAN BALAI",
          "Dashboard Pengawasan",
          "Tinjau pengajuan, periksa bukti, lalu catat hasil sesuai kewenangan.",
        ]
      : admin
        ? [
            "ADMINISTRASI",
            "Dashboard Sistem",
            "Siapkan akun dan penugasan, kelola referensi, telusuri aktivitas.",
          ]
        : [
            "PENGAWASAN LINTAS BALAI",
            "Dashboard Nasional",
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
        title={currentTab === "Kepatuhan" ? (provider ? "Progres Survei" : "Ringkasan Pemeriksaan") : currentTab === "Perlu perhatian" ? "Paket Perlu Perhatian" : currentTab === "Tren" ? "Tren Pencatatan" : titles[1]}
        description={titles[2]}
        art
        action={
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
        }
      />
      {!admin && (
        <div className="bi-filter-toolbar">
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
            {(provider || balai || !admin) && (
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
            {currentTab !== "Perlu perhatian" && <><label>
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
            </>}
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
          <button className="btn sm" onClick={reset}>Reset filter{activeFilters ? ` (${activeFilters})` : ""}</button>
        </div>
      )}
      {!admin && currentTab !== "Perlu perhatian" && <p className="bi-scope-note">Periode memfilter aktivitas dan keputusan pemeriksaan; status paket, audit dan kasus ditampilkan terkini.</p>}
      {currentTab === "Perlu perhatian" && !provider && !balai && !admin ? (
        <WorkPanel title="Paket yang membutuhkan tindak lanjut"><div className="panel-body ds-attention-list">{audits.filter(a=>{
          const open=currentCases.some(c=>c.packageId===a.state.project.id && c.status!=="Ditutup");
          return attention==="Ada koreksi terbuka" ? open : attention==="Menunggu tindak lanjut" ? a.status!=="riwayat" : open || a.status!=="riwayat";
        }).map(a=><div className="ds-attention-row" key={a.state.project.id}><div><strong>{a.state.project.packageName}</strong><span>{a.state.project.balai}</span><small>{a.reason}</small><small>{currentCases.filter(c=>c.packageId===a.state.project.id && c.status!=="Ditutup").length} kasus belum ditutup</small></div><button className="btn sm" onClick={()=>p.openPackage(a.state.project.id)}>Lihat paket</button></div>)}{!audits.some(a=>{const open=currentCases.some(c=>c.packageId===a.state.project.id&&c.status!=="Ditutup");return attention==="Ada koreksi terbuka"?open:attention==="Menunggu tindak lanjut"?a.status!=="riwayat":open||a.status!=="riwayat";}) && empty}</div></WorkPanel>
      ) : currentTab === "Kepatuhan" && provider ? (
        <div className="b-grid"><WorkPanel title="Aktivitas survei menurut jenis"><Columns rows={biSurveyRows} detail={sessionDetail} /></WorkPanel><WorkPanel title="Volume sesi survei harian (km)">{survey === "Semua" ? <p className="panel-body subtle">Pilih satu jenis survei untuk melihat jarak sesi.</p> : <Columns rows={bi.distance} unit="km sesi" detail={name=>sessionDetail(name,true)} />}</WorkPanel><WorkPanel title="Tren aktivitas survei"><Trend rows={biTrendRows} detail={monthDetail}/></WorkPanel><WorkPanel title="Rekaman pelaksanaan" className="bi-full-panel"><div className="bi-table-scroll"><table className="ds-inspection-table"><thead><tr><th>Tanggal</th><th>Jenis survei</th><th>Paket / ruas</th><th>Rincian</th></tr></thead><tbody>{bi.sessions.slice(0,recordLimit).map(r=><tr key={`${r.packageId}:${r.id}`}><td>{r.date}</td><td>{r.surveyType}</td><td>{r.packageName}<small>{r.road}</small></td><td><WorkLink onClick={()=>p.openPackageReview(r.packageId,"/entry:Survei harian")}>Buka survei</WorkLink></td></tr>)}</tbody></table></div>{!bi.sessions.length && empty}{bi.sessions.length>recordLimit && <button className="btn sm bi-more" onClick={()=>setRecordLimit(n=>n+8)}>Tampilkan lainnya ({bi.sessions.length-recordLimit})</button>}</WorkPanel></div>
      ) : currentTab === "Kepatuhan" && !admin ? (
        <WorkPanel title="Hasil pemeriksaan per jenis survei">
          <SurveyInspectionPanel
            surveyTypes={types}
            records={biSurveyRows.map(x=>({name:x.name,records:x.value}))}
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
              label="Aktivitas tercatat"
              value={logs.length}
              note="Catatan administratif"
              tone="amber"
            />
            <MetricTile
              icon={Settings}
              label="Usulan penugasan"
              value={drafts.reduce((n,d)=>n+d.assignments.length,0)}
              note="Penugasan yang diusulkan"
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
                  description=""
                />
              )}

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
              value={bi.sessions.length}
              note="Rekaman tercatat"
              tone="blue"
            />
            <MetricTile
              icon={AlertTriangle}
              label="Koreksi terbuka"
              value={currentCases.filter(c=>c.status!=="Ditutup").length}
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
              label="Pengajuan siap diperiksa"
              value={reviews.filter(r=>r.status==="Perlu Review").length}
              note="Dalam kewenangan Balai"
              tone="blue"
            />
            <MetricTile
              icon={AlertTriangle}
              label="Koreksi terbuka"
              value={currentCases.filter(c=>c.status!=="Ditutup").length}
              note="Perlu pemantauan"
              tone="amber"
            />
            <MetricTile
              icon={BarChart3}
              label="Rekaman tercatat"
              value={bi.sessions.length}
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
              value={currentCases.filter(c=>c.status!=="Ditutup").length}
              note="Belum ditutup"
              tone="amber"
            />
            <MetricTile
              icon={ClipboardCheck}
              label="Audit Tingkat 3 dalam review"
              value={entries.filter(s=>s.audits.some(a=>a.level===3 && (a.requiresReview || a.status==="Dalam Review" || a.status==="Klarifikasi"))).length}
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
                adapter={p.biGeography}
                statusByBalai={Object.fromEntries(allMetrics.byBalai.map(b=>[b.name,{active:projectBI(p.packages).cases.filter(c=>c.status!=="Ditutup"&&p.packages[c.packageId]?.project.balai===b.name).length,passed:Object.values(p.packages).filter(s=>s.project.balai===b.name&&s.audits.some(a=>a.level===3&&a.status==="Lulus"&&!a.requiresReview)).length,packages:b.packages}]))}
                selected={region}
                onSelect={(value) => {
                  setRegion(value);
                  setPackageId("Semua paket");
                }}
              />
              <div className="bi-region-status" aria-label="Status QA/QC per Balai">
                {metrics.byBalai.map(b=>{const scoped=entries.filter(s=>s.project.balai===b.name);const findings=currentCases.filter(c=>c.status!=="Ditutup"&&packages[c.packageId]?.project.balai===b.name).length;const passed=scoped.filter(s=>s.audits.some(a=>a.level===3&&a.status==="Lulus"&&!a.requiresReview)).length;return <button type="button" key={b.name} aria-pressed={region===b.name} onClick={()=>{setRegion(region===b.name?"Semua Balai":b.name);setPackageId("Semua paket");}}><strong>{b.name}</strong><span>{b.packages} paket · {findings} kasus aktif · {passed} audit 3 lulus</span></button>})}
              </div>
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

        </>
      )}

      {!admin && (currentTab === "Semua" || (provider && currentTab === "Kepatuhan")) && <VolumeProgressPanel rows={p.biVolumes ?? []} packages={Object.fromEntries(entries.map(s=>[s.project.id,s.project.packageName]))} survey={survey} onOpen={p.openPackage}/> }
      {currentTab === "Semua" && <div className="b-grid bi-visuals">
        {admin ? <>
          <WorkPanel title="Distribusi paket menurut Balai"><Columns rows={metrics.byBalai.map(x=>({name:x.name,value:x.packages}))} unit="paket" detail={name=>packageDetail(s=>s.project.balai===name)}/></WorkPanel>
          <WorkPanel title="Usulan penugasan per organisasi"><Bars rows={Array.from(new Set(drafts.map(d=>d.organization))).map(name=>({name,value:drafts.filter(d=>d.organization===name).reduce((n,d)=>n+d.assignments.length,0)}))} unit="penugasan"/></WorkPanel>
        </> : provider ? <>
          <WorkPanel title="Aktivitas survei menurut jenis"><Columns rows={biSurveyRows} detail={sessionDetail}/></WorkPanel>
          <WorkPanel title="Tren pelaksanaan survei"><Trend rows={biTrendRows} detail={monthDetail}/></WorkPanel>
          <WorkPanel title="Tahapan pekerjaan saat ini"><Bars rows={Array.from(new Set(entries.map(derivePackageStage))).map(name=>({name,value:entries.filter(s=>derivePackageStage(s)===name).length}))} unit="paket" detail={name=>packageDetail(s=>derivePackageStage(s)===name)}/></WorkPanel>
          <WorkPanel title="Status tindakan perbaikan"><Donut open={currentCases.filter(c=>c.status!=="Ditutup").length} closed={currentCases.filter(c=>c.status==="Ditutup").length} detail={status=>caseDetail(c=>status==="Ditutup"?c.status==="Ditutup":c.status!=="Ditutup")}/></WorkPanel>
        </> : balai ? <>
          <WorkPanel title="Keputusan pemeriksaan tercatat"><Columns rows={["Sesuai","Temuan"].map(name=>({name,value:metrics.surveyReviews.filter(r=>r.decision===name).length}))} unit="keputusan" detail={reviewDetail}/></WorkPanel>
          <WorkPanel title="Temuan aktif menurut tingkat"><Bars rows={["Kritis","Mayor","Minor"].map(name=>({name,value:currentCases.filter(c=>c.status!=="Ditutup" && c.severity===name).length}))} unit="kasus" detail={name=>caseDetail(c=>c.status!=="Ditutup"&&c.severity===name)}/></WorkPanel>
          <WorkPanel title="Hasil pemeriksaan antar-paket">{decisionPanel(decisionMatrix(false),r=>r.packageName)}</WorkPanel><WorkPanel title="Keputusan terkini menurut bulan">{decisionPanel(decisionMonths,r=>r.reviewedAt.slice(0,7))}</WorkPanel><WorkPanel title="Riwayat keputusan paket">{historyPanel}</WorkPanel>
        </> : <>
          <WorkPanel title="Temuan aktif menurut Balai"><Bars rows={metrics.byBalai.map(x=>({name:x.name,value:currentCases.filter(c=>c.status!=="Ditutup" && packages[c.packageId]?.project.balai===x.name).length}))} unit="kasus" detail={name=>caseDetail(c=>c.status!=="Ditutup"&&packages[c.packageId]?.project.balai===name)}/></WorkPanel>
          <WorkPanel title="Status Audit Tingkat 3"><Columns rows={["Belum Dimulai","Dalam Review","Klarifikasi","Lulus","Ditolak"].map(name=>({name,value:entries.filter(s=>s.audits.some(a=>a.level===3 && (a.requiresReview ? "Klarifikasi" : a.status)===name)).length}))} unit="paket" detail={name=>packageDetail(s=>s.audits.some(a=>a.level===3&&(a.requiresReview?"Klarifikasi":a.status)===name))}/></WorkPanel>
          <WorkPanel title="Komposisi tindak lanjut"><Donut open={currentCases.filter(c=>c.status!=="Ditutup").length} closed={currentCases.filter(c=>c.status==="Ditutup").length} detail={status=>caseDetail(c=>status==="Ditutup"?c.status==="Ditutup":c.status!=="Ditutup")}/></WorkPanel>
          <WorkPanel title="Hasil pemeriksaan lintas Balai">{decisionPanel(decisionMatrix(true),r=>packages[r.packageId]?.project.balai||"Belum ditentukan")}</WorkPanel><WorkPanel title="Keputusan terkini menurut bulan">{decisionPanel(decisionMonths,r=>r.reviewedAt.slice(0,7))}</WorkPanel><WorkPanel title="Riwayat keputusan paket">{historyPanel}</WorkPanel><WorkPanel title="Keputusan pemeriksaan per jenis survei" className="bi-full-panel"><SurveyInspectionPanel surveyTypes={types} records={biSurveyRows.map(x=>({name:x.name,records:x.value}))} role={role} surveyFilter={survey} reviews={metrics.surveyReviews} onOpenReview={p.openPackageReview} allowedPackageIds={new Set(Object.keys(packages))}/></WorkPanel>
        </>}
      </div>}
      {provider && currentTab === "Semua" && <ProviderWorkHome {...p} packages={packages} embedded onOpenCorrection={p.onOpenCorrection ?? ((id) => p.openPackage(id))} />}
    </div>
  );
}
