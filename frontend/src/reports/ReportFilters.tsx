import { SlidersHorizontal, RotateCcw } from "lucide-react";
import type { ReportFilter, ReportKind, ReportSnapshot } from "./model";
import { REPORT_NAMES, EMPTY_FILTER } from "./model";
export default function ReportFilters({
  filter,
  kind,
  dashboard,
  packages,
  options,
  change,
  setKind,
  reset,
  error,
}: {
  filter: ReportFilter;
  kind: ReportKind;
  dashboard: boolean;
  packages: ReportSnapshot["packages"];
  options: (name: "balai" | "survey" | "status") => string[];
  change: (name: keyof ReportFilter, value: string) => void;
  setKind: (kind: ReportKind) => void;
  reset: () => void;
  error: string;
}) {
  const labels: Record<keyof ReportFilter, string> = {
    packageId: "Paket",
    start: "Dari",
    end: "Sampai",
    balai: "Balai",
    survey: "Jenis survei",
    status: "Status sumber",
  };
  const entries = Object.entries(filter).filter(([, v]) => v) as [
    keyof ReportFilter,
    string,
  ][];
  return (
    <section className="rv-filters" aria-label="Filter laporan">
      <div className="rv-filter-heading">
        <h3>
          <SlidersHorizontal size={16} />
          Cakupan laporan
        </h3>
        <span>
          {entries.length
            ? `${entries.length} filter aktif`
            : "Semua dalam penugasan"}
        </span>
        <button className="btn sm" onClick={reset}>
          <RotateCcw size={13} />
          Reset filter
        </button>
      </div>
      <div className={`rv-filter-grid ${dashboard ? "" : "rv-filter-recap"}`}>
        {!dashboard && (
          <div className="field rv-kind">
            <label htmlFor="report-kind">Jenis rekap</label>
            <select
              id="report-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as ReportKind)}
            >
              {Object.entries(REPORT_NAMES).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="field rv-package">
          <label htmlFor="report-package">Paket</label>
          <select
            id="report-package"
            value={filter.packageId}
            onChange={(e) => change("packageId", e.target.value)}
          >
            <option value="">Semua paket dalam penugasan</option>
            {Object.entries(packages).map(([id, p]) => (
              <option key={id} value={id}>
                {p.project.packageName || id}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="report-start">Tanggal awal</label>
          <input
            id="report-start"
            type="date"
            value={filter.start}
            onChange={(e) => change("start", e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="report-end">Tanggal akhir</label>
          <input
            id="report-end"
            type="date"
            value={filter.end}
            onChange={(e) => change("end", e.target.value)}
          />
        </div>
      </div>
      <details className="rv-filter-more">
        <summary>
          Filter lainnya{" "}
          <span>
            {[filter.balai, filter.survey, filter.status].filter(Boolean)
              .length || ""}
          </span>
        </summary>
        <div className="rv-advanced-grid">
          {(["balai", "survey", "status"] as const).map((name) => (
            <div className="field" key={name}>
              <label htmlFor={`report-${name}`}>{labels[name]}</label>
              <select
                id={`report-${name}`}
                value={filter[name]}
                onChange={(e) => change(name, e.target.value)}
              >
                <option value="">Semua</option>
                {options(name).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </details>
      {entries.length > 0 && (
        <div className="rv-filter-chips" aria-label="Filter aktif">
          {entries.map(([key, value]) => (
            <button
              key={key}
              onClick={() => change(key, "")}
              title={`Hapus filter ${labels[key]}`}
            >
              {labels[key]}:{" "}
              {key === "packageId"
                ? packages[value]?.project.packageName || value
                : value}{" "}
              ×
            </button>
          ))}
        </div>
      )}
      <details className="rv-date-help">
        <summary>Dasar tanggal dan cakupan</summary>
        <p className="subtle">
          {dashboard
            ? "Aktivitas: tanggal kegiatan. Pemeriksaan: tanggal keputusan terkini. Tindakan: tenggat, bukan tanggal pembukaan/penutupan."
            : kind === "activities"
              ? "Periode berdasarkan tanggal kegiatan; status sumber bukan keputusan kelulusan."
              : kind === "reviews"
                ? "Periode berdasarkan tanggal keputusan terkini; bukan seluruh histori audit. Review lama yang menunggu ulang tidak memakai tanggal keputusan lama."
                : "Periode berdasarkan tenggat tindakan, bukan tanggal pembukaan atau penutupan."}{" "}
          Batas tanggal inklusif; tanpa tanggal dikeluarkan saat filter tanggal
          aktif. CSV mengikuti filter global; pencarian hanya tampilan.
        </p>
      </details>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
