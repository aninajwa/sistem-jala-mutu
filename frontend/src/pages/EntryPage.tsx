import {
  ClipboardList,
  FileText,
  Plus,
  Search,
  Clock3,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { WorkspaceHeading, MetricTile, WorkPanel } from "../design/b/Patterns";
import { SurveyTable } from "../components/app/AppComponents";
import type { PageProps } from "../types";
import { canRole } from "../workflow/workflowConfig";
export default function EntryPage(p: PageProps) {
  const editable = canRole(p.workflow.role, "enterSurvey"),
    [view, setView] = useState(p.activeTab);
  const count = (status: string) =>
    p.scoped.filter((s) => s.status === status).length;
  const rows = p.scoped.filter(
    (s) =>
      (view === "Semua" || s.status === view) &&
      (!p.search ||
        `${s.id} ${s.ruas} ${s.jenis} ${s.status}`
          .toLowerCase()
          .includes(p.search.toLowerCase())),
  );
  return (
    <div className="b-entry-register">
      <WorkspaceHeading
        eyebrow="REGISTER SURVEI LOKAL"
        title="Entri survei dan hasil awal"
        description={
          editable
            ? "Kelola rekaman survei pada cakupan dan periode pilihan."
            : "Lihat rekaman survei. Entri mengikuti kewenangan Penyedia."
        }
        action={
          editable ? (
            <button
              className="btn primary"
              onClick={() => p.openNew("survey")}
              data-testid="button-new-entry"
            >
              <Plus size={16} />
              Entri survei baru
            </button>
          ) : undefined
        }
      />
      <div className="b-metrics">
        <MetricTile
          icon={FileText}
          label="Rekaman dalam cakupan"
          value={p.scoped.length}
        />
        <MetricTile
          icon={Clock3}
          label="Draft"
          value={count("Draft")}
          tone="blue"
        />
        <MetricTile
          icon={ClipboardList}
          label="Perlu perbaikan"
          value={count("Perlu Perbaikan")}
          tone="amber"
        />
        <MetricTile
          icon={CheckCircle2}
          label="Lulus tercatat"
          value={count("Lulus")}
        />
      </div>
      <WorkPanel title="Daftar pengajuan survei">
        <div className="b-register-controls">
          <label>
            <Search size={16} />
            <input
              aria-label="Cari pengajuan survei"
              placeholder="Nomor, ruas, jenis survei…"
              value={p.search}
              onChange={(e) => p.setSearch(e.target.value)}
            />
          </label>
          <button
            className="btn"
            onClick={() => p.setSearch("")}
            data-testid="button-clear-entry-search"
          >
            Reset
          </button>
        </div>
        <div className="b-segmented">
          {["Semua", "Draft", "Verifikasi", "Lulus", "Perlu Perbaikan"].map(
            (t) => (
              <button
                key={t}
                aria-pressed={view === t}
                data-testid={`tab-entry-${t.toLowerCase().replaceAll(" ", "-")}`}
                onClick={() => {
                  setView(t);
                  p.setActiveTab(t);
                }}
              >
                {t}
              </button>
            ),
          )}
        </div>
        <SurveyTable
          surveys={rows}
          onEdit={p.beginEdit}
          onStatus={p.updateStatus}
          canEdit={editable}
        />
        <details className="b-note">
          <summary>Konteks hasil uji</summary>
          <p>
            Hasil teknis dan perhitungan diperiksa pada formulir sumber di tahap
            paket. Register ini tidak menyimpulkan koefisien atau kelulusan dari
            data yang belum tersedia.
          </p>
        </details>
      </WorkPanel>
    </div>
  );
}
