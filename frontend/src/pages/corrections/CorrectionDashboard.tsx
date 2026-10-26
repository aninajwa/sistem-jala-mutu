
import { useMemo, useState } from "react";
import {
  AlertTriangle, ArrowRight, CheckCircle2, ClipboardList,
  Clock3, FileText, FolderOpen, Search, ShieldCheck, Wrench,
} from "lucide-react";
import type { CorrectionPageProps } from "../ActionsPage";
import type { CorrectionRow } from "./correctionViewModel";
import {
  STATUS_LABEL, STATUS_ORDER, ROLE_TABS, collectCorrections,
  correctionMetrics, matchesRoleTab, isOverdue,
} from "./correctionViewModel";
import "./corrections.css";
import CorrectionSubmodule from "./components/CorrectionSubmodule";
import CorrectionSubmoduleCharts from "./components/CorrectionSubmoduleCharts";
import Audit3PackageSummary from "./components/Audit3PackageSummary";

type Metric = ReturnType<typeof correctionMetrics>[number];

function SummaryCard({ item, index }: { item: Metric; index: number }) {
  const icons = [ClipboardList, Clock3, ShieldCheck, CheckCircle2];
  const Icon = icons[index] ?? ClipboardList;

  return (
    <div className={`corr-metric corr-${item.tone}`}>
      <span className="corr-metric-icon"><Icon size={25} /></span>
      <span>
        <small>{item.label}</small>
        <strong>{item.value}</strong>
        <span className="corr-metric-foot">Kasus pada cakupan akses</span>
      </span>
    </div>
  );
}

function StatusChart({ rows }: { rows: CorrectionRow[] }) {
  return (
    <section className="corr-panel">
      <h3>Tahapan Tindakan Perbaikan</h3>
      {rows.length === 0 ? (
        <div className="corr-empty-chart">
          <ClipboardList size={24} />
          <strong>Belum ada temuan</strong>
          <span>Status akan muncul ketika temuan tercatat.</span>
        </div>
      ) : (
        <div className="corr-steps">
          {STATUS_ORDER.map((status, index) => {
            const count = rows.filter(r => r.status === status).length;
            return (
              <div className="corr-step" key={status}>
                <span className={`corr-step-number ${status === "Ditutup" ? "done" : ""}`}>
                  {count}
                </span>
                <small>{STATUS_LABEL[status]}</small>
                {index < STATUS_ORDER.length - 1 && <ArrowRight className="corr-step-arrow" size={15} />}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ActionChart({ rows }: { rows: CorrectionRow[] }) {
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    const action = row.actionType?.trim() || "Belum ditetapkan";
    acc[action] = (acc[action] ?? 0) + 1;
    return acc;
  }, {});
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, value]) => value));

  return (
    <section className="corr-panel">
      <h3>Jenis Tindakan</h3>
      {entries.length === 0 ? (
        <div className="corr-empty-chart">
          <Wrench size={24} />
          <strong>Belum ada jenis tindakan</strong>
          <span>Grafik akan dihitung dari kasus yang tercatat.</span>
        </div>
      ) : (
        <div className="corr-bars">
          {entries.slice(0, 7).map(([name, count]) => (
            <div className="corr-bar" key={name}>
              <span title={name}>{name}</span>
              <div className="corr-bar-track">
                <i style={{ width: `${count / max * 100}%` }} />
              </div>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CaseDetail({
  item,
  role,
  onOpenCorrection,
}: {
  item: CorrectionRow | undefined;
  role: CorrectionPageProps["workflow"]["role"];
  onOpenCorrection: (packageId: string, correctionId: string) => void;
}) {
  if (!item) {
    return (
      <aside className="corr-panel corr-detail">
        <h3>Ringkasan Kasus Terpilih</h3>
        <div className="corr-empty-detail">
          <FolderOpen size={28} />
          <strong>Belum ada kasus dipilih</strong>
          <p>Pilih temuan untuk melihat tindakan dan paket terkait.</p>
        </div>
      </aside>
    );
  }

  const actionLabel =
    role === "Penyedia Jasa / Ketua Tim"
      ? item.status === "Ditutup"
        ? "Lihat Riwayat Koreksi"
        : item.status === "Menunggu Persetujuan"
          ? "Lihat Status Usulan"
          : "Lengkapi Tindak Lanjut"
      : role === "PIC Balai / Pengguna Jasa"
        ? "Periksa Kasus & Bukti"
        : role === "Direktorat / Pusat"
          ? "Lihat Kasus & Riwayat"
          : "Lihat Detail Kasus";

  return (
    <aside className="corr-panel corr-detail">
      <h3>Ringkasan Kasus Terpilih</h3>

      <div className="corr-detail-id">
        <strong>{item.id}</strong>
        <span className="corr-status">{STATUS_LABEL[item.status]}</span>
      </div>

      <div className="corr-source">
        <FileText size={17} />
        <span>
          <strong>{item.source || "Sumber belum tercatat"}</strong>
          <small>{item.packageName}</small>
        </span>
      </div>

      <div className="corr-case-summary">
        <small>{item.surveyType} · {item.road}</small>
        <p>{item.rejectionReason || "Uraian temuan belum tersedia."}</p>
      </div>

      <dl className="corr-detail-fields">
        <dt>Prioritas</dt>
        <dd>
          <span className={`corr-severity sev-${item.severity}`}>
            {item.severity}
          </span>
        </dd>

        <dt>PIC</dt>
        <dd>{item.owner || "Belum ditentukan"}</dd>

        <dt>Jenis tindakan</dt>
        <dd>{item.actionType || "Belum ditetapkan"}</dd>

        <dt>Tenggat</dt>
        <dd>{item.dueDate || "Belum ditentukan"}</dd>

        <dt>Bukti</dt>
        <dd>{item.evidence ? "Referensi tercatat" : "Belum tersedia"}</dd>
      </dl>

      <button
        type="button"
        className="corr-primary"
        onClick={() => onOpenCorrection(item.packageId, item.id)}
      >
        <FolderOpen size={16} />
        {actionLabel}
      </button>
    </aside>
  );
}

export default function CorrectionDashboard(p: CorrectionPageProps) {
  const role = p.workflow.role;
  const tabs = ROLE_TABS[role];
  const currentTab = tabs.includes(p.activeTab) ? p.activeTab : tabs[0];

  const rows = useMemo(
  () => collectCorrections(p.packages),
  [p.packages],
);

  const [query, setQuery] = useState("");
  const [packageFilter, setPackageFilter] = useState("");
  const [surveyFilter, setSurveyFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedKey, setSelectedKey] = useState("");

  const packageOptions = [...new Map(rows.map(r => [r.packageId, r.packageName])).entries()];
  const surveyOptions = [
  "IRI",
  "PCI",
  "RNI",
  "Lendutan",
  "Jembatan",
  "Drainase",
  "Lereng",
  "Lalu Lintas",
];

  const filtered = rows.filter(item => {
    if (!matchesRoleTab(item, role, currentTab)) return false;
    if (packageFilter && item.packageId !== packageFilter) return false;
    if (surveyFilter && item.surveyType !== surveyFilter) return false;
    if (priorityFilter && item.severity !== priorityFilter) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    return [
      item.id, item.packageName, item.road, item.source,
      item.rejectionReason, item.actionType, item.owner,
    ].join(" ").toLowerCase().includes(query.toLowerCase());
  });

  const selected = filtered.find(r => r.key === selectedKey);
  const metrics = useMemo(
  () => correctionMetrics(filtered, role),
  [filtered, role],
);

  const headingByRole: Record<string, string> = {
    "Penyedia Jasa / Ketua Tim": "Kelola tindak lanjut dan bukti perbaikan dari seluruh paket Anda.",
    "PIC Balai / Pengguna Jasa": "Periksa usulan Penyedia dan pantau verifikasi ulang pada paket kewenangan.",
    "Direktorat / Pusat": "Pantau temuan lintas Balai dan evaluasi hasil pemeriksaan berjenjang.",
    Admin: "Monitoring kasus, status tindak lanjut, dan ketepatan penyelesaian.",
  };

  const tableTitle = currentTab === "Tugas Saya"
    ? "Daftar Tindak Lanjut Saya"
    : currentTab;

  return (
    <div className="corr-dashboard">
      <header className="corr-heading">
        <div>
          <h2>Temuan & Tindakan Perbaikan</h2>
          <p>{headingByRole[role]}</p>
        </div>
        <div className="corr-role">
          <ShieldCheck size={21} />
          <span><small>Peran aktif</small><strong>{role}</strong></span>
        </div>
      </header>

      <div className="corr-filters">
        <label>Paket
          <select value={packageFilter} onChange={e => setPackageFilter(e.target.value)}>
            <option value="">Semua paket dalam kewenangan</option>
            {packageOptions.map(([id, name]) =>
              <option value={id} key={id}>{name}</option>)}
          </select>
        </label>
        <label>Jenis survei
          <select value={surveyFilter} onChange={e => setSurveyFilter(e.target.value)}>
            <option value="">Semua jenis survei</option>
            {surveyOptions.map(s =>
              <option value={s} key={s}>{s}</option>)}
          </select>
        </label>
        <label>Prioritas
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="">Semua prioritas</option>
            <option>Kritis</option><option>Mayor</option><option>Minor</option>
          </select>
        </label>
        <label>Status
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Semua status</option>
            {STATUS_ORDER.map(s => <option value={s} key={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </label>
      </div>

      <div className="corr-metrics">
        {metrics.map((item, index) =>
          <SummaryCard key={item.label} item={item} index={index} />)}
      </div>

{role === "Direktorat / Pusat" &&
  currentTab === "Audit Tingkat 3" && (
    <Audit3PackageSummary
  packages={Object.fromEntries(
    Object.entries(p.packages).filter(
      ([id]) => !packageFilter || id === packageFilter
    )
  )}
/>
  )}

      {["Tugas Saya", "Temuan Lintas Paket", "Monitoring Kasus"].includes(currentTab) && (
  <div className="corr-chart-grid">
  <StatusChart rows={filtered} />
  <ActionChart rows={filtered} />
</div>
)}

{currentTab !== "Tugas Saya" &&
 currentTab !== "Temuan Lintas Paket" &&
 currentTab !== "Monitoring Kasus" ? (
  <>
    {(currentTab !== "Audit Tingkat 3" || filtered.length > 0) && (
  <CorrectionSubmoduleCharts
    role={role}
    tab={currentTab}
    rows={filtered}
  />
)}

    <div className="corr-main-grid">
      <CorrectionSubmodule
        role={role}
        tab={currentTab}
        rows={rows}
        selectedKey={selectedKey}
        onSelect={setSelectedKey}
        onOpen={p.onOpenCorrection}
      />

      <CaseDetail
        item={rows.find(item => item.key === selectedKey)}
        role={role}
        onOpenCorrection={p.onOpenCorrection}
      />
    </div>
  </>
) : (

      <div className="corr-main-grid">
        <section className="corr-panel corr-list">
          <div className="corr-list-header">
            <h3>{tableTitle} ({filtered.length})</h3>
            <div className="corr-search">
              <Search size={15} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Cari temuan, paket, atau ruas..."
              />
            </div>
          </div>

          <div className="corr-table-scroll">
            <table>
              <thead><tr>
                <th>ID Temuan</th>
                <th>Paket / Ruas</th>
                <th>Sumber</th>
                <th>Jenis Temuan</th>
                <th>Prioritas</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr></thead>
              <tbody>

{filtered.map((item) => (
  <tr
    key={item.key}
    className={selected?.key === item.key ? "selected" : ""}
    onClick={() =>
  setSelectedKey(current =>
    current === item.key ? "" : item.key
  )
}
    style={{ cursor: "pointer" }}
    aria-selected={selected?.key === item.key}
  >
    <td>
      <strong>{item.id}</strong>
    </td>

    <td>
      <strong>{item.packageName}</strong>
      <small>{item.road}</small>
    </td>

    <td>
      <span className="corr-source-tag">{item.source}</span>
    </td>

    <td>{item.rejectionReason}</td>

    <td>
      <span className={`corr-severity sev-${item.severity}`}>
        {item.severity}
      </span>
    </td>

    <td>
      <span className="corr-status">
        {STATUS_LABEL[item.status]}
      </span>
      {isOverdue(item) && (
        <small className="corr-late">Melewati tenggat</small>
      )}
    </td>

    <td>
      <div className="corr-row-actions">
        <button
          type="button"
          className="corr-preview-button"
          onClick={(event) => {
            event.stopPropagation();
            setSelectedKey(old => old === item.key ? "" : item.key);
          }}
        >
          {selectedKey === item.key ? "Batal pilih" : "Pilih"}
        </button>
      </div>
    </td>
  </tr>
))}
              </tbody>
            </table>
            {filtered.length === 0 &&
              <div className="corr-table-empty">
                <CheckCircle2 size={25} />
                <strong>{rows.length === 0 ? "Belum ada kasus koreksi tercatat" : "Tidak ada kasus pada filter ini"}</strong>
                <span>{rows.length === 0
                  ? "Kasus akan muncul dari workflow paket yang menjadi kewenangan Anda."
                  : "Ubah filter untuk melihat kasus lain."}</span>
              </div>}
          </div>
        </section>

        <CaseDetail
  item={selected}
  role={role}
  onOpenCorrection={p.onOpenCorrection}
/>
      </div>
)}
      {role === "Direktorat / Pusat" &&
        <p className="corr-footnote">
          Pemeriksaan Audit Tingkat 3 dan keputusan resminya tetap dilakukan
          melalui Tahap 5 pada paket terkait.
        </p>}
      {role === "Admin" &&
        <p className="corr-footnote">
          Admin hanya memantau. Persetujuan, verifikasi, dan penutupan teknis
          dilakukan oleh peran yang berwenang.
        </p>}
      {role === "Penyedia Jasa / Ketua Tim" &&
        <p className="corr-footnote">
          Pengajuan tindakan, pelaksanaan, dan pencatatan bukti tetap
          menggunakan formulir koreksi workflow paket.
        </p>}
      {role === "PIC Balai / Pengguna Jasa" &&
        <p className="corr-footnote">
          Persetujuan usulan dan penutupan kasus memerlukan pemeriksaan
          serta bukti yang memenuhi ketentuan workflow.
        </p>}
    </div>
  );
}
