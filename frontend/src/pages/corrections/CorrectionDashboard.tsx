import { FilterPanel } from "../../design/b/FilterPanel";
import {
  WorkspaceHeading,
  MetricTile,
} from "../../design/b/Patterns";
import { correctionNextStep } from "../../workflow/checkpoint09Corrections";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { CorrectionPageProps } from "../ActionsPage";
import type { CorrectionRow } from "./correctionViewModel";
import {
  correctionDisplayStatus,
  providerCorrectionAction,
  sortProviderCorrections,
  filterCorrectionRows,
  ROLE_TABS,
  collectCorrections,
  correctionMetrics,
  correctionTabRows,
  correctionFilterCount,
  isOverdue,
  dueInSevenDays,
} from "./correctionViewModel";
import "./corrections.css";
import CorrectionSubmodule from "./components/CorrectionSubmodule";

type Metric = ReturnType<typeof correctionMetrics>[number];

function SummaryCard({ item, index }: { item: Metric; index: number }) {
  const icons = [ClipboardList, Clock3, ShieldCheck, CheckCircle2];
  const Icon = icons[index] ?? ClipboardList;

  return (
    <MetricTile
      icon={Icon}
      label={item.label}
      value={item.value}
      tone={item.tone === "purple" ? "violet" : item.tone === "red" ? "amber" : item.tone === "green" ? "teal" : item.tone}
    />
  );
}

function ProviderCaseQueue({ rows, tab, onOpen, filtered, onReset }: {
  filtered: boolean;
  onReset: () => void;
  rows: CorrectionRow[];
  tab: string;
  onOpen: (packageId: string, correctionId: string) => void;
}) {
  if (!rows.length) {
    const empty = tab === "Menunggu Verifikasi"
      ? "Tidak ada pengajuan atau hasil tindakan yang sedang menunggu pemeriksaan."
      : tab === "Riwayat"
        ? "Belum ada kasus yang ditutup dalam pilihan ini."
        : "Tidak ada kasus yang memerlukan tindakan Anda pada pilihan ini.";
    return <div className="wf-empty"><p role="status">{filtered ? "Tidak ada kasus yang cocok dengan filter." : empty}</p>{filtered && <button type="button" className="wf-button" onClick={onReset}>Hapus filter</button>}</div>;
  }

  return <ul className="provider-case-queue" aria-label={`Kasus ${tab}`}>
    {sortProviderCorrections(rows, tab).map((item) => {
      const action = providerCorrectionAction(item);
      const next = correctionNextStep(item);
      return <li key={item.key}>
        <div className="provider-case-content">
          <div className="provider-case-topline">
            <strong>{item.id}</strong>
            <span className={`corr-severity sev-${item.severity}`}>{item.severity}</span>
            <span className="corr-status">{correctionDisplayStatus(item)}</span>
          </div>
          <h3>{item.packageName}</h3>
          <p className="provider-case-context">
            {item.surveyType} · {item.road} · {item.blockedStage}
            {item.cyclePeriod ? ` · Periode ${item.cyclePeriod}` : ""}
          </p>
          <p className="provider-case-finding">{item.rejectionReason || "Uraian temuan belum tersedia."}</p>
          <dl className="provider-case-facts">
            <div><dt>Asal temuan</dt><dd>{item.source}</dd></div>
            {tab === "Menunggu Verifikasi" ? <>
              <div><dt>Menunggu</dt><dd>{next.actor}</dd></div>
              <div><dt>Hasil/keputusan</dt><dd>{item.reviewNote || item.retestReference || "Belum tercatat"}</dd></div>
            </> : tab === "Riwayat" ? <>
              <div><dt>Keputusan usulan</dt><dd>{item.approval}</dd></div>
              <div><dt>Hasil uji ulang</dt><dd>{item.retest}</dd></div>
            </> : <>
              <div><dt>Tindakan berikutnya</dt><dd>{action.description}</dd></div>
              <div><dt>Penanggung jawab</dt><dd>{item.owner || "Belum ditetapkan"}</dd></div>
            </>}
          </dl>
        </div>
        <div className="provider-case-action">
          {item.dueDate && item.status !== "Ditutup" &&
            <time dateTime={item.dueDate} className={isOverdue(item) ? "corr-late" : ""}>
              Tenggat {item.dueDate}
            </time>}
          <button type="button" className="wf-button" aria-label={`${action.label} ${item.id} — ${item.packageName}`} onClick={() => onOpen(item.packageId, item.id)}>
            {action.label}
          </button>
        </div>
      </li>;
    })}
  </ul>;
}

export default function CorrectionDashboard(p: CorrectionPageProps) {
  return <CorrectionDashboardContent key={`${p.workflow.role}:${p.activeTab}`} {...p} />;
}

function CorrectionDashboardContent(p: CorrectionPageProps) {
  const role = p.workflow.role;
  const tabs = ROLE_TABS[role];
  const currentTab = tabs.includes(p.activeTab) ? p.activeTab : tabs[0];

  const rows = useMemo(() => collectCorrections(p.packages), [p.packages]);

  const [query, setQuery] = useState("");
  const [packageFilter, setPackageFilter] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get("package");
    return requested && Object.hasOwn(p.packages, requested) ? requested : "";
  });
  const [surveyFilter, setSurveyFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [balaiFilter, setBalaiFilter] = useState("");

  const { available, visible: filtered } = correctionTabRows(rows, role, currentTab, { packageId: packageFilter, survey: surveyFilter, priority: priorityFilter, status: statusFilter, balai: balaiFilter, query });
  const activeCount = correctionFilterCount({ packageId: packageFilter, survey: surveyFilter, priority: priorityFilter, status: statusFilter, balai: balaiFilter, query });
  const resetFilters = () => {
    setPackageFilter(""); setSurveyFilter(""); setPriorityFilter("");
    setStatusFilter(""); setBalaiFilter(""); setQuery("");
  };
  const packageOptions = Object.entries(p.packages).map(([id, state]) => [id, state.project.packageName || id]);
  const surveyOptions = [...new Set(available.map(r => r.surveyType))].sort();

  const statusOptions = [...new Set(available.map(correctionDisplayStatus))];
  const scopedRows = filterCorrectionRows(rows, { packageId: packageFilter, survey: surveyFilter,
    priority: priorityFilter, status: statusFilter, balai: balaiFilter, query });


  const overviewTab = [
    "Tugas Saya",
    "Temuan Lintas Paket",
    "Monitoring Kasus",
    "Tindak Lanjut Paket",
  ].includes(currentTab);

  const metrics = correctionMetrics(scopedRows, role);

  const compactMetrics = overviewTab
    ? metrics
    : [
        { label: "Kasus pada halaman", value: filtered.length, tone: "blue" },
        currentTab === "Riwayat"
          ? {
              label: "Prioritas mayor/kritis",
              value: filtered.filter(
                (r) => r.severity === "Mayor" || r.severity === "Kritis",
              ).length,
              tone: "amber",
            }
          : {
              label: "Mendekati tenggat",
              value: filtered.filter(item => dueInSevenDays(item)).length,
              tone: "amber",
            },
        currentTab === "Riwayat"
          ? {
              label: "Selesai",
              value: filtered.filter((r) => r.status === "Ditutup").length,
              tone: "green",
            }
          : {
              label: "Melewati tenggat",
              value: filtered.filter(item => isOverdue(item)).length,
              tone: "purple",
            },
      ];

  const headingByRole: Record<string, string> = {
    "Penyedia Jasa / Ketua Tim":
      "Kelola tindak lanjut dan bukti perbaikan dari seluruh paket Anda.",
    "PIC Balai / Pengguna Jasa":
      "Periksa usulan Penyedia dan pantau verifikasi ulang pada paket kewenangan.",
    "Direktorat / Pusat":
      "Pantau temuan lintas Balai dan evaluasi hasil pemeriksaan berjenjang.",
    Admin:
      "Monitoring kasus, status tindak lanjut, dan ketepatan penyelesaian.",
  };

  const tabDescriptions: Record<string, string> = {
    "Tugas Saya": "Kerjakan temuan terbuka dan lengkapi bukti pada paket Anda.",
    "Menunggu Verifikasi":
      "Pantau pengajuan yang menunggu keputusan, tanpa mengubah isian terkunci.",
    Riwayat: "Telusuri hasil, keputusan, dan rekaman kasus yang selesai.",
    "Antrian Verifikasi":
      "Periksa usulan Penyedia yang benar-benar menunggu persetujuan Balai.",
    "Tindak Lanjut Paket":
      "Pantau status dan prioritas tindak lanjut per paket dalam kewenangan Balai.",
    "Verifikasi Ulang":
      role === "Direktorat / Pusat"
        ? "Periksa hasil tindak lanjut Audit Tingkat 3."
        : "Periksa hasil dan bukti uji ulang yang diajukan Penyedia.",
    "Temuan Lintas Paket":
      "Lihat sebaran temuan lintas Balai dan paket yang memerlukan perhatian.",
    "Tindak Lanjut Audit 3": "Pantau tindak lanjut Audit Tingkat 3 sebelum pemeriksaan hasil.",
    "Monitoring Kasus":
      "Pantau status kasus, tanggung jawab, dan tenggat tanpa mengubah keputusan.",
    "Pemantauan Tenggat": "Fokus kasus terlambat dan mendekati tenggat.",
    
  };

  return (
    <div className="corr-dashboard">
      <WorkspaceHeading
        eyebrow="TINDAKAN PERBAIKAN"
        title={currentTab}
        description={tabDescriptions[currentTab] ?? headingByRole[role]}
      />

      {(
        <FilterPanel
          title="Filter kasus"
          initiallyOpen={false}
          activeCount={activeCount}
          onReset={resetFilters}
        >
          <div className="corr-filters">
            <label>
              Paket
              <select
                value={packageFilter}
                onChange={(e) => setPackageFilter(e.target.value)}
              >
                <option value="">Semua paket dalam kewenangan</option>
                {packageOptions.map(([id, name]) => (
                  <option value={id} key={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Jenis survei
              <select
                value={surveyFilter}
                onChange={(e) => setSurveyFilter(e.target.value)}
              >
                <option value="">Semua jenis survei</option>
                {surveyOptions.map((s) => (
                  <option value={s} key={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Prioritas
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="">Semua prioritas</option>
                <option>Kritis</option>
                <option>Mayor</option>
                <option>Minor</option>
              </select>
            </label>
            <label>
              Status
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Semua status</option>
                {statusOptions.map((s) => (
                  <option value={s} key={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            {(role === "Direktorat / Pusat" || role === "Admin") && <label>Balai
              <select value={balaiFilter} onChange={e=>setBalaiFilter(e.target.value)}>
                <option value="">Semua Balai</option>
                {[...new Set(Object.values(p.packages).map(state=>state.project.balai || "Belum ditentukan"))].sort().map(b=><option key={b}>{b}</option>)}
              </select>
            </label>}
          </div>
        </FilterPanel>
      )}

      {role === "Penyedia Jasa / Ketua Tim" ? (
        <section aria-label="Daftar kasus" className="provider-correction-worklist">
          <div className="corr-metrics">{(currentTab === "Tugas Saya" ? [
            { label: "Tugas pada halaman", value: filtered.length, tone: "teal" },
            { label: "Perlu revisi", value: filtered.filter(r => r.approval === "Perlu Revisi" || r.retest === "Gagal").length, tone: "amber" },
            { label: "Siap dilaksanakan", value: filtered.filter(r => r.status === "Disetujui").length, tone: "teal" },
            { label: "Melewati tenggat", value: filtered.filter(item => isOverdue(item)).length, tone: "amber" },
          ] : compactMetrics).map((item,index) => <SummaryCard key={item.label} item={item} index={index} />)}</div>
          <label className="corr-search provider-case-search"><Search size={16}/><span className="sr-only">Cari kasus</span><input aria-label="Cari kasus" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ID, ruas, paket atau temuan" /></label>
          <ProviderCaseQueue rows={filtered} tab={currentTab} onOpen={p.onOpenCorrection} filtered={activeCount > 0} onReset={resetFilters} />
        </section>
      ) : <>
      {overviewTab && <h2 className="corr-metric-scope">Ringkasan seluruh kasus sesuai filter</h2>}
      {(
        <div className="corr-metrics">
          {compactMetrics.map((item, index) => (
            <SummaryCard key={item.label} item={item} index={index} />
          ))}
        </div>
      )}

      <div className="corr-main-grid corr-main-grid-full">
        <CorrectionSubmodule
          role={role} tab={currentTab} rows={filtered} query={query}
          onQuery={setQuery}
          hasFilters={activeCount > 0} onReset={resetFilters}
          onOpen={p.onOpenCorrection}
        />
      </div>
      </>}
    </div>
  );
}
