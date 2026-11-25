
import { useMemo, useState } from "react";
import type { PageProps } from "../../types";
import type { CorrectionCase } from "../../workflow/model";
import "./providerCorrections.css";

const STATUS_ORDER: CorrectionCase["status"][] = [
  "Terbuka",
  "Menunggu Persetujuan",
  "Disetujui",
  "Dilaksanakan",
  "Verifikasi Ulang",
  "Ditutup",
];

const STATUS_LABELS: Record<CorrectionCase["status"], string> = {
  Terbuka: "Perlu Ditindaklanjuti",
  "Menunggu Persetujuan": "Menunggu Balai",
  Disetujui: "Disetujui Balai",
  Dilaksanakan: "Dalam Pelaksanaan",
  "Verifikasi Ulang": "Verifikasi Ulang",
  Ditutup: "Selesai",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #d5e0e8",
  borderRadius: 8,
  background: "#fff",
  minWidth: 0,
  width: "100%",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid #dce5ec",
  borderRadius: 12,
  background: "#fff",
  padding: 16,
};

function formatDate(value: string) {
  if (!value) return "Belum ditentukan";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function isLate(item: CorrectionCase) {
  if (!item.dueDate || item.status === "Ditutup") return false;
  const today = new Date().toLocaleDateString("en-CA");
  return item.dueDate.slice(0, 10) < today;
}

function isDueSoon(item: CorrectionCase) {
  if (!item.dueDate || item.status === "Ditutup") return false;

  const due = new Date(`${item.dueDate.slice(0, 10)}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const days = Math.ceil(
    (due.getTime() - now.getTime()) / 86_400_000,
  );

  return days >= 0 && days <= 7;
}

export default function ProviderCorrectionsDashboard({
  packages,
  openPackage,
  activeTab,
}: PageProps) {
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");

  // Gunakan data koreksi operasional Paket Saya,
  // bukan store.findings milik dashboard lama.
  const cases = useMemo(
  () =>
    Object.entries(packages).flatMap(
      ([packageId, packageWorkflow]) =>
        (packageWorkflow.corrections ?? []).map((item) => ({
          ...item,
          packageId,
          packageName:
            packageWorkflow.project.packageName || packageId,
        })),
    ),
  [packages],
);


  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return cases.filter((item) => {
      const matchesTab =
        activeTab === "Tugas Saya" || activeTab === "Semua"
          ? ["Terbuka", "Disetujui", "Dilaksanakan"].includes(item.status)
          : activeTab === "Menunggu Verifikasi"
            ? ["Menunggu Persetujuan", "Verifikasi Ulang"].includes(item.status)
            : activeTab === "Riwayat"
              ? item.status === "Ditutup"
              : true;

      if (!matchesTab) return false;

      if (statusFilter !== "Semua" && item.status !== statusFilter) {
        return false;
      }

      return [
        item.id,
        item.packageId,
        item.packageName,
        item.road,
        item.surveyType,
        item.rejectionReason,
        item.actionType,
        item.source,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [cases, activeTab, search, statusFilter]);

  // Harus berada DI LUAR useMemo filtered.
  const selected =
    filtered.find(
      (item) => `${item.packageId}:${item.id}` === selectedId,
    ) ?? filtered[0];


  const active = cases.filter((item) => item.status !== "Ditutup").length;
  const pending = cases.filter(
    (item) =>
      item.status === "Menunggu Persetujuan" ||
      item.status === "Verifikasi Ulang",
  ).length;
  const completed = cases.filter(
    (item) => item.status === "Ditutup",
  ).length;
  const dueSoon = cases.filter(isDueSoon).length;
  const overdue = cases.filter(isLate).length;

  const actionCounts = cases.reduce<Record<string, number>>(
    (acc, item) => {
      const key = item.actionType || "Belum ditentukan";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const actionEntries = Object.entries(actionCounts).sort(
    (a, b) => b[1] - a[1],
  );
  const maxAction = Math.max(
    1,
    ...actionEntries.map(([, count]) => count),
  );

  const metrics = [
    { label: "Tugas Aktif", value: active, color: "#176bd7" },
    {
      label: "Mendekati Tenggat",
      value: dueSoon,
      color: "#cc8110",
    },
    {
      label: "Menunggu Balai / Verifikasi",
      value: pending,
      color: "#6950c5",
    },
    { label: "Selesai", value: completed, color: "#168763" },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="correction-provider-intro">
  <div>
    <span className="correction-provider-eyebrow">
      PENYEDIA JASA / KETUA TIM
    </span>
    <h2>Tugas tindak lanjut saya</h2>
    <p>
      Kelola temuan dari paket yang menjadi tanggung jawab Anda,
      lengkapi bukti, dan pantau hasil verifikasi.
    </p>
  </div>
</div>

      <div style={{
        background: "#edf5ff",
        borderLeft: "4px solid #176bd7",
        borderRadius: 8,
        padding: 12,
      }}>
        <strong>Pekerjaan Ketua Tim</strong>
        <div style={{ fontSize: 13, marginTop: 4 }}>
          Periksa temuan, lengkapi tindakan berbukti,
          ajukan persetujuan, dan pantau verifikasi ulang.
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(170px, 1fr))",
        gap: 12,
      }}>
        {metrics.map((metric) => (
          <div key={metric.label} style={cardStyle}>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {metric.label}
            </div>
            <div style={{
              fontSize: 28,
              fontWeight: 750,
              color: metric.color,
            }}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 12,
      }}>
        <section style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>
            Tahapan Tindakan Perbaikan
          </h3>

          {STATUS_ORDER.map((status) => {
            const count = cases.filter(
              (item) => item.status === status,
            ).length;

            return (
              <div key={status} style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "7px 0",
                borderBottom: "1px solid #eef2f6",
                fontSize: 13,
              }}>
                <span>{STATUS_LABELS[status]}</span>
                <strong>{count}</strong>
              </div>
            );
          })}
        </section>

        <section style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Jenis Tindakan</h3>

          {actionEntries.length === 0 ? (
            <p style={{ color: "#64748b", fontSize: 13 }}>
              Belum ada jenis tindakan tercatat dari paket
dalam kewenangan Anda.
            </p>
          ) : (
            actionEntries.map(([name, count]) => (
              <div key={name} style={{ marginBottom: 11 }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  gap: 12,
                  marginBottom: 5,
                }}>
                  <span>{name}</span>
                  <strong>{count}</strong>
                </div>

                <div style={{
                  height: 8,
                  background: "#e8eef4",
                  borderRadius: 8,
                  overflow: "hidden",
                }}>
                  <div style={{
                    background: "#2085df",
                    height: "100%",
                    width: `${(count / maxAction) * 100}%`,
                  }} />
                </div>
              </div>
            ))
          )}
        </section>
      </div>

      <section style={cardStyle}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 14,
        }}>
          <h3 style={{ margin: 0 }}>
            {activeTab === "Menunggu Verifikasi"
  ? "Menunggu Persetujuan & Verifikasi"
  : activeTab === "Riwayat"
    ? "Riwayat Penyelesaian"
    : "Daftar Tindak Lanjut Saya"} ({filtered.length})
          </h3>
          <span className="subtle">
  Pilih kasus untuk melihat paket dan tindak lanjutnya.
</span>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
          marginBottom: 14,
        }}>
          <input
            style={inputStyle}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari paket, temuan, ruas, atau jenis survei..."
            aria-label="Cari temuan"
          />

          <select
            style={inputStyle}
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            aria-label="Filter status"
          >
            <option value="Semua">Semua status</option>
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        {overdue > 0 && (
          <p style={{ color: "#b45309", fontSize: 13 }}>
            {overdue} kasus aktif telah melewati tenggat.
          </p>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}>
            <thead>
              <tr style={{
                background: "#f0f5f9",
                textAlign: "left",
              }}>
                {[
  "ID Temuan",
  "Paket",
  "Ruas",
  "Sumber",
  "Jenis Survei",
  "Tenggat",
  "Status",
  "Aksi",
].map((heading) => (
                  <th key={heading} style={{ padding: 10 }}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={`${item.packageId}:${item.id}`} style={{
                  borderBottom: "1px solid #e7edf2",
                  background:
                    selected?.packageId === item.packageId &&
selected?.id === item.id
                      ? "#f2f8ff"
                      : "#fff",
                }}>
                  <td style={{ padding: 10 }}>{item.id}</td>
                  <td style={{ padding: 10 }}>
  <strong>{item.packageName}</strong>
</td>
                  <td style={{ padding: 10 }}>{item.road}</td>
                  <td style={{ padding: 10 }}>{item.source}</td>
                  <td style={{ padding: 10 }}>{item.surveyType}</td>
                  <td style={{ padding: 10 }}>
                    {formatDate(item.dueDate)}
                  </td>
                  <td style={{ padding: 10 }}>
                    {STATUS_LABELS[item.status]}
                  </td>
                  <td style={{ padding: 10 }}>
                    <button
                      className="btn sm"
                      onClick={() =>
  setSelectedId(`${item.packageId}:${item.id}`)
}
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div style={{
              padding: 24,
              textAlign: "center",
              color: "#64748b",
            }}>
              {cases.length === 0
  ? "Belum ada temuan yang perlu ditindaklanjuti dari paket dalam kewenangan Anda."
  : "Tidak ada temuan yang sesuai dengan filter."}
            </div>
          )}
        </div>
      </section>

      {selected && (
        <section style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>
            Ringkasan Kasus — {selected.id}
          </h3>
          <p>
  <strong>Paket:</strong> {selected.packageName}
</p>
          <p><strong>Ruas:</strong> {selected.road}</p>
          <p><strong>Sumber:</strong> {selected.source}</p>
          <p>
            <strong>Temuan:</strong>{" "}
            {selected.rejectionReason || "Belum diuraikan"}
          </p>
          <p>
            <strong>Tindakan:</strong>{" "}
            {selected.actionType || "Belum ditentukan"}
          </p>
          <p>
            <strong>Penanggung jawab:</strong>{" "}
            {selected.owner || "Belum ditetapkan"}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            {STATUS_LABELS[selected.status]}
          </p>

          <button
  type="button"
  className="btn primary"
  onClick={() => openPackage(selected.packageId)}
>
  Buka Paket Terkait
</button>
        </section>
      )}
    </div>
  );
}
