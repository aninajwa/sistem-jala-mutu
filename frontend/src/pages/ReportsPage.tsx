import ReportFilters from "../reports/ReportFilters";
import Dashboard from "../reports/Dashboard";
import PeriodicReports from "../reports/PeriodicReports";
import "../reports/reports-v2.css";
import { useState } from "react";
import { ArrowDownToLine, ClipboardList, FileText } from "lucide-react";
import { PageHeading, Section, Status } from "../components/app/AppComponents";
import type { PageProps } from "../types";
import type { Principal } from "../workflow/repository/contracts";
import { readLocalReports } from "../reports/adapter";
import {
  EMPTY_FILTER,
  REPORT_NAMES,
  type ReportFilter,
  type ReportKind,
} from "../reports/model";
import { filterError, filterReport, summarizeReport } from "../reports/query";
import { createReportCsv, downloadReport } from "../reports/export";

export default function ReportsPage(p: PageProps & { principal: Principal }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const dashboard =
    p.activeTab === "Semua" || p.activeTab === "Dashboard Operasional";
  const periodic = p.activeTab === "Laporan periodik";
  const [kind, setKind] = useState<ReportKind>("activities");
  const [filter, setFilter] = useState<ReportFilter>({ ...EMPTY_FILTER });
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState("");
  const snapshot = readLocalReports(p.packages, p.principal);
  const source = snapshot.rows[kind];
  const allRows = filterReport(source, filter);
  const rows = allRows.filter((r) =>
    Object.values(r)
      .join(" ")
      .toLocaleLowerCase("id-ID")
      .includes(search.toLocaleLowerCase("id-ID")),
  );
  const count = dashboard ? 4 : 10;
  const current = Math.min(page, Math.max(1, Math.ceil(rows.length / count)));
  const visible = rows.slice(
    (dashboard ? 0 : current - 1) * count,
    (dashboard ? 1 : current) * count,
  );
  const data = {
    activities: filterReport(snapshot.rows.activities, filter),
    reviews: filterReport(snapshot.rows.reviews, filter),
    corrections: filterReport(snapshot.rows.corrections, filter),
  };
  const open = (k: ReportKind, patch?: Partial<ReportFilter>) => {
    if (patch) setFilter((f) => ({ ...f, ...patch }));
    setSelected("");
    setKind(k);
    setPage(1);
    setSearch("");
    p.setActiveTab("Rekap & Ekspor");
  };
  const summary = summarizeReport(rows);
  const error = filterError(filter);
  const detail = rows.find((r) => r.key === selected);
  const change = (name: keyof ReportFilter, value: string) => {
    setFilter((f) => ({ ...f, [name]: value }));
    setPage(1);
    setSelected("");
    setMessage("");
  };
  const options = (name: "balai" | "survey" | "status") =>
    [
      ...new Set(
        (dashboard ? Object.values(snapshot.rows).flat() : source).map(
          (r) => r[name],
        ),
      ),
    ]
      .filter(Boolean)
      .sort();
  const roleHint =
    p.principal.role === "Penyedia Jasa / Ketua Tim"
      ? "Paket yang ditugaskan kepada Penyedia"
      : p.principal.role === "PIC Balai / Pengguna Jasa"
        ? "Paket dalam penugasan pemeriksaan Balai"
        : "Paket monitoring dalam penugasan Direktorat";
  if (snapshot.denied)
    return (
      <>
        <PageHeading
          label="Dashboard & Laporan"
          detail="Akses pelaporan teknis"
        />
        <div className="notice rv-admin-access" role="status">
          Laporan teknis dan ekspornya tidak tersedia untuk Admin. Gunakan modul
          administrasi untuk mengelola penugasan dan akses. Admin tidak memiliki
          kewenangan persetujuan teknis QA/QC.
        </div>
      </>
    );
  return (
    <div className="rv-workspace">
      <PageHeading
        label="Dashboard & Laporan"
        detail={`${roleHint}. ${p.principal.role.startsWith("Penyedia") ? "Pantau aktivitas dan siapkan laporan paket Anda." : p.principal.role.startsWith("PIC") ? "Pantau pemeriksaan dan tindak lanjut paket dalam kewenangan." : "Bandingkan aktivitas lintas Balai dalam cakupan monitoring."}`}
        action={
          !dashboard && !periodic ? (
            <button
              className="btn primary"
              disabled={!!error || !allRows.length}
              title={
                !allRows.length
                  ? "Tidak ada rekaman pada filter ini"
                  : "Unduh rekap informatif CSV"
              }
              onClick={() => {
                try {
                  const file = createReportCsv(
                    p.packages,
                    p.principal,
                    kind,
                    filter,
                  );
                  downloadReport(file);
                  setMessage(
                    `Unduhan CSV diminta: ${file.filename} (${file.count} rekaman).`,
                  );
                } catch (e) {
                  setMessage(e instanceof Error ? e.message : "Ekspor gagal.");
                }
              }}
              data-testid="button-export-report"
            >
              <ArrowDownToLine size={13} />
              Ekspor CSV
            </button>
          ) : undefined
        }
      />
      <div className="rv-nav">
        {["Dashboard Operasional", "Rekap & Ekspor", "Laporan periodik"].map(
          (label, i) => (
            <button
              key={label}
              className={`btn ${(i === 0 && dashboard) || (i === 1 && !dashboard && !periodic) || (i === 2 && periodic) ? "primary" : ""}`}
              onClick={() => p.setActiveTab(i === 0 ? "Semua" : label)}
            >
              {label}
            </button>
          ),
        )}
      </div>
      <p className="subtle">
        Sumber lokal frontend (termasuk data uji pengembangan) · API laporan/SMD belum terhubung · Rekap
        informatif, bukan pengesahan.
      </p>
      {periodic ? (
        <PeriodicReports {...p} />
      ) : (
        <>
          <ReportFilters
            dashboard={dashboard}
            kind={kind}
            filter={filter}
            packages={snapshot.packages}
            options={options}
            change={change}
            setKind={(k) => {
              setKind(k);
              setPage(1);
              setSelected("");
              setMessage("");
            }}
            reset={() => {
              setFilter({ ...EMPTY_FILTER });
              setPage(1);
              setSearch("");
              setSelected("");
              setMessage("");
            }}
            error={error}
          />
          {message && <p role="status">{message}</p>}
          {snapshot.warnings.length > 0 && (
            <p role="alert">{snapshot.warnings.join(" ")}</p>
          )}
          {dashboard && (
            <div className="rv-card" style={{ marginTop: 12 }}>
              <h3>
                {p.principal.role.startsWith("Penyedia")
                  ? "Siapkan laporan paket Anda"
                  : p.principal.role.startsWith("PIC")
                    ? "Tinjau pekerjaan dalam kewenangan"
                    : "Monitoring lintas Balai"}
              </h3>
              <p className="subtle">
                {p.principal.role.startsWith("Penyedia")
                  ? "Kelola draf, lampiran, dan versi laporan pada perangkat ini."
                  : p.principal.role.startsWith("PIC")
                    ? "Telusuri pemeriksaan terkini dan tindak lanjut. Antrean pengajuan laporan menunggu layanan backend."
                    : "Perbandingan aktivitas hanya mencakup paket yang ditugaskan; seluruh Balai tidak otomatis terbuka."}
              </p>
              <button
                className="btn"
                onClick={() => p.setActiveTab("Laporan periodik")}
              >
                {p.principal.role.startsWith("Penyedia")
                  ? "Kelola draf laporan"
                  : "Katalog dan kesiapan laporan"}
              </button>
            </div>
          )}
          {dashboard && (
            <Dashboard
              data={data}
              role={p.principal.role}
              packages={snapshot.packages}
              filter={filter}
              open={open}
            />
          )}
          {!dashboard && (
            <div className="field" style={{ margin: "12px 0" }}>
              <label htmlFor="report-search">Cari rekap</label>
              <input
                id="report-search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari tampilan (CSV mengikuti filter global)"
              />
            </div>
          )}
          <Section
            title={
              dashboard
                ? `Cuplikan · ${REPORT_NAMES[kind]}`
                : REPORT_NAMES[kind]
            }
            icon={ClipboardList}
          >
            <div className="panel-body" aria-live="polite">
              <strong data-testid="report-summary">
                {rows.length
                  ? `${summary.records} rekaman · ${summary.packages} paket · ${summary.undated} tanpa tanggal`
                  : "Belum ada rekaman yang dapat ditampilkan pada filter ini."}
              </strong>
              <p className="subtle">
                Jumlah dihitung dari baris unik yang ditampilkan. Tidak
                menunjukkan kelengkapan data API atau seluruh kewajiban paket.
              </p>
              <div className="toolbar" style={{ flexWrap: "wrap" }}>
                {summary.statuses.map((s) => (
                  <span className="status s-neutral" key={s.status}>
                    {s.status}: {s.count}
                  </span>
                ))}
              </div>
            </div>
            <p className="rv-table-hint">
              Geser tabel ke samping untuk melihat referensi dan tombol Rincian
              →
            </p>
            <div
              className="table-wrap rv-report-table"
              role="region"
              aria-label="Tabel rekap, dapat digeser horizontal"
              tabIndex={0}
            >
              <table data-testid="table-report-rows">
                <thead>
                  <tr>
                    <th>Paket / Balai</th>
                    <th>Jenis survei</th>
                    <th>Tanggal / dasar</th>
                    <th>Status sumber</th>
                    <th>Referensi / konteks</th>
                    <th>Rincian</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.key}>
                      <td>
                        <strong>{r.packageName}</strong>
                        <div>{r.balai}</div>
                      </td>
                      <td>{r.survey}</td>
                      <td>
                        {r.date || "Tanggal belum tersedia"}
                        <div className="subtle">{r.dateBasis}</div>
                      </td>
                      <td>
                        <Status value={r.status} />
                      </td>
                      <td>
                        {r.reference}
                        <div>{r.context}</div>
                      </td>
                      <td>
                        <button
                          className="btn sm"
                          onClick={() => setSelected(r.key)}
                          aria-label={`Rincian ${r.reference}`}
                        >
                          Rincian
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!rows.length && (
              <div className="empty" role="status">
                {!Object.keys(snapshot.packages).length
                  ? "Belum ada paket dalam penugasan Anda."
                  : source.length
                    ? "Tidak ada rekaman yang sesuai filter. Ubah atau reset filter."
                    : "Data rekap ini belum tercatat pada paket dalam penugasan. Data backend belum terhubung."}
              </div>
            )}
            <div className="panel-body">
              {dashboard ? (
                <button className="btn" onClick={() => open(kind)}>
                  Lihat Semua · Rekap lengkap
                </button>
              ) : (
                <div className="toolbar">
                  <button
                    className="btn"
                    disabled={current === 1}
                    onClick={() => setPage(current - 1)}
                  >
                    Sebelumnya
                  </button>
                  <span>
                    Halaman {current} /{" "}
                    {Math.max(1, Math.ceil(rows.length / 10))} · {rows.length}{" "}
                    hasil
                  </span>
                  <button
                    className="btn"
                    disabled={current * 10 >= rows.length}
                    onClick={() => setPage(current + 1)}
                  >
                    Berikutnya
                  </button>
                </div>
              )}
            </div>
          </Section>
          {detail && (
            <Section title="Rincian rekaman" icon={FileText}>
              <div className="panel-body" data-testid="report-detail">
                <p>
                  <strong>{detail.packageName}</strong> · {detail.packageId}
                </p>
                <p>
                  {detail.reference} · {detail.survey} · {detail.context}
                </p>
                <p>
                  {detail.dateBasis}: {detail.date || "Belum tersedia"} ·
                  Status: {detail.status}
                </p>
                <p className="subtle">
                  Buka paket untuk menelusuri rekaman dan bukti pada tahap
                  sumber. Akses diperiksa kembali oleh workspace paket.
                </p>
                <div className="toolbar">
                  <button
                    className="btn primary"
                    onClick={() => {
                      if (
                        p.principal.packageIds.includes(detail.packageId) &&
                        snapshot.packages[detail.packageId]
                      )
                        p.openPackage(detail.packageId);
                    }}
                  >
                    Buka paket sumber
                  </button>
                  <button className="btn" onClick={() => setSelected("")}>
                    Tutup rincian
                  </button>
                </div>
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
