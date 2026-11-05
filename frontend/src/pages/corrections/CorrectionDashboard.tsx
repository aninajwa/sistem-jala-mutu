
import { useMemo, useState } from "react";
import {
  CheckCircle2, ClipboardList,
  Clock3, FileText, FolderOpen, Search, ShieldCheck,
} from "lucide-react";
import type { CorrectionPageProps } from "../ActionsPage";
import type { CorrectionRow } from "./correctionViewModel";
import { correctionDisplayStatus,
  STATUS_LABEL, STATUS_ORDER, ROLE_TABS, collectCorrections,
  correctionMetrics, matchesRoleTab, isOverdue, dueInSevenDays,
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
        <span className="corr-status">{correctionDisplayStatus(item)}</span>
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

  const overviewTab = ['Tugas Saya', 'Temuan Lintas Paket', 'Monitoring Kasus', 'Tindak Lanjut Paket'].includes(currentTab);
  const hasCaseMetrics = currentTab !== "Data Referensi";
  const selected = filtered.find(r => r.key === selectedKey);
  const metrics = useMemo(
  () => correctionMetrics(filtered, role),
  [filtered, role],
);

  const compactMetrics = overviewTab ? metrics : [
    {label: "Kasus pada halaman", value: filtered.length, tone: "blue"},
    currentTab === "Riwayat"
      ? {label: "Prioritas mayor/kritis", value: filtered.filter(r => r.severity === "Mayor" || r.severity === "Kritis").length, tone: "amber"}
      : {label: "Mendekati tenggat", value: filtered.filter(dueInSevenDays).length, tone: "amber"},
    currentTab === "Riwayat"
      ? {label: "Selesai", value: filtered.filter(r => r.status === "Ditutup").length, tone: "green"}
      : {label: "Melewati tenggat", value: filtered.filter(isOverdue).length, tone: "purple"},
  ];

  const headingByRole: Record<string, string> = {
    "Penyedia Jasa / Ketua Tim": "Kelola tindak lanjut dan bukti perbaikan dari seluruh paket Anda.",
    "PIC Balai / Pengguna Jasa": "Periksa usulan Penyedia dan pantau verifikasi ulang pada paket kewenangan.",
    "Direktorat / Pusat": "Pantau temuan lintas Balai dan evaluasi hasil pemeriksaan berjenjang.",
    Admin: "Monitoring kasus, status tindak lanjut, dan ketepatan penyelesaian.",
  };

  const tableTitle = currentTab === "Tugas Saya"
    ? "Daftar Tindak Lanjut Saya"
    : currentTab;
  const tabDescriptions: Record<string, string> = {
    "Tugas Saya": "Kerjakan temuan terbuka dan lengkapi bukti pada paket Anda.",
    "Menunggu Verifikasi": "Pantau pengajuan yang menunggu keputusan, tanpa mengubah isian terkunci.",
    "Riwayat": "Telusuri hasil, keputusan, dan rekaman kasus yang selesai.",
    "Antrian Verifikasi": "Periksa usulan Penyedia yang benar-benar menunggu persetujuan Balai.",
    "Tindak Lanjut Paket": "Pantau status dan prioritas tindak lanjut per paket dalam kewenangan Balai.",
    "Verifikasi Ulang": role === "Direktorat / Pusat"
      ? "Pantau pemeriksaan ulang lintas Balai tanpa mengambil keputusan Balai."
      : "Periksa hasil dan bukti uji ulang yang diajukan Penyedia.",
    "Temuan Lintas Paket": "Lihat sebaran temuan lintas Balai dan paket yang memerlukan perhatian.",
    "Audit Tingkat 3": "Telusuri temuan yang terkait audit pusat pada Tahap 5.",
    "Monitoring Kasus": "Pantau status kasus, tanggung jawab, dan tenggat tanpa mengubah keputusan.",
    "Notifikasi & SLA": "Fokus kasus terlambat dan mendekati tenggat.",
    "Data Referensi": "Lihat kategori tindakan dan sumber temuan yang benar-benar tercatat.",
  };

  return (
    <div className="corr-dashboard">
      <header className="corr-heading">
        <div>
          <h2>{currentTab}</h2>
          <p>{tabDescriptions[currentTab] ?? headingByRole[role]}</p>
        </div>
        <div className="corr-role">
          <ShieldCheck size={21} />
          <span><small>Peran aktif</small><strong>{role}</strong></span>
        </div>
      </header>

      {currentTab !== "Data Referensi" && <details className="ui09-case-filters"><summary>Filter kasus</summary><div className="corr-filters">
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
      </div></details>}

      {hasCaseMetrics && <div className="corr-metrics">
        {compactMetrics.map((item, index) =>
          <SummaryCard key={item.label} item={item} index={index} />)}
      </div>}

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

      <details className="ui09-case-charts"><summary>Grafik temuan & tindak lanjut</summary><CorrectionSubmoduleCharts role={role} tab={currentTab} rows={filtered} /></details>

{!overviewTab ? (
  <>
    <div
      className={currentTab === "Data Referensi" ? "corr-reference-layout" : "corr-main-grid"}
      style={currentTab === "Data Referensi" ? { display: "block", width: "100%" } : undefined}
    >
      <CorrectionSubmodule
        role={role}
        tab={currentTab}
        rows={filtered}
        selectedKey={selectedKey}
        onSelect={setSelectedKey}
        onOpen={p.onOpenCorrection}
      />

      {currentTab !== "Data Referensi" && (
        <CaseDetail
          item={selected}
          role={role}
          onOpenCorrection={p.onOpenCorrection}
        />
      )}
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
    <td data-label="ID temuan">
      <strong>{item.id}</strong>
    </td>

    <td data-label="Paket / ruas">
      <strong>{item.packageName}</strong>
      <small>{item.road}</small>
    </td>

    <td data-label="Sumber">
      <span className="corr-source-tag">{item.source}</span>
    </td>

    <td data-label="Jenis temuan">{item.rejectionReason}</td>

    <td data-label="Prioritas">
      <span className={`corr-severity sev-${item.severity}`}>
        {item.severity}
      </span>
    </td>

    <td data-label="Status">
      <span className="corr-status">
        {correctionDisplayStatus(item)}
      </span>
      {isOverdue(item) && (
        <small className="corr-late">Melewati tenggat</small>
      )}
    </td>

    <td data-label="Aksi">
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
