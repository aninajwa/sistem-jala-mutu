
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileSearch,
  FolderOpen,
  History,
  ShieldCheck,
} from "lucide-react";

import type { WorkflowRole } from "../../../workflow/model";
import {
  type CorrectionRow,
  STATUS_LABEL,
  dueInSevenDays,
  isOverdue,
} from "../correctionViewModel";

type Props = {
  role: WorkflowRole;
  tab: string;
  rows: CorrectionRow[];
  onSelect: (key: string) => void;
  selectedKey: string;
  onOpen: (packageId: string, correctionId: string) => void;
};

type SubmoduleConfig = {
  title: string;
  description: string;
  emptyText: string;
  action: string;
  filter: (row: CorrectionRow) => boolean;
};

const active = (row: CorrectionRow) => row.status !== "Ditutup";

function getConfig(role: WorkflowRole, tab: string): SubmoduleConfig {
  if (role === "Penyedia Jasa / Ketua Tim") {
    if (tab === "Menunggu Verifikasi") {
      return {
        title: "Menunggu Pemeriksaan",
        description: "Pantau usulan dan hasil uji ulang yang sedang diperiksa Balai.",
        emptyText: "Belum ada usulan atau hasil uji ulang yang menunggu pemeriksaan.",
        action: "Lihat status",
        filter: row =>
          row.status === "Menunggu Persetujuan" ||
          row.status === "Verifikasi Ulang",
      };
    }
    if (tab === "Riwayat") {
      return {
        title: "Riwayat Tindakan Saya",
        description: "Lihat kasus yang sudah ditutup beserta hasil pemeriksaannya.",
        emptyText: "Belum ada tindakan perbaikan yang selesai.",
        action: "Lihat riwayat",
        filter: row => row.status === "Ditutup",
      };
    }
    return {
      title: "Tugas Tindak Lanjut Saya",
      description: "Lengkapi temuan yang terbuka dan laksanakan tindakan yang disetujui.",
      emptyText: "Tidak ada kasus yang sedang membutuhkan tindakan Penyedia.",
      action: "Tindak lanjuti",
      filter: row =>
        ["Terbuka", "Disetujui", "Dilaksanakan"].includes(row.status),
    };
  }

  if (role === "PIC Balai / Pengguna Jasa") {
    if (tab === "Antrian Verifikasi") {
      return {
        title: "Antrian Persetujuan Balai",
        description: "Periksa usulan Penyedia, bukti, dan hasil pemeriksaan internal.",
        emptyText: "Belum ada usulan Penyedia yang menunggu persetujuan.",
        action: "Periksa usulan",
        filter: row => row.status === "Menunggu Persetujuan",
      };
    }
    if (tab === "Verifikasi Ulang") {
      return {
        title: "Pemeriksaan Hasil Uji Ulang",
        description: "Periksa hasil tindakan dan tentukan tindak lanjut berdasarkan hasil uji.",
        emptyText: "Belum ada kasus dalam tahap verifikasi ulang.",
        action: "Periksa hasil",
        filter: row => row.status === "Verifikasi Ulang",
      };
    }
    if (tab === "Riwayat") {
      return {
        title: "Riwayat Keputusan Balai",
        description: "Telusuri kasus yang sudah ditutup dan dasar keputusannya.",
        emptyText: "Belum ada kasus yang ditutup.",
        action: "Lihat riwayat",
        filter: row => row.status === "Ditutup",
      };
    }
    return {
      title: "Monitoring Tindak Lanjut Paket",
      description: "Pantau seluruh kasus aktif pada paket dalam kewenangan Balai.",
      emptyText: "Tidak ada kasus aktif pada paket dalam kewenangan Balai.",
      action: "Lihat tindak lanjut",
      filter: active,
    };
  }

  if (role === "Direktorat / Pusat") {
    if (tab === "Audit Tingkat 3") {
      return {
        title: "Temuan Terkait Audit Tingkat 3",
        description: "Telusuri kasus koreksi yang bersumber dari Audit Tingkat 3.",
        emptyText: "Belum ada kasus koreksi yang tercatat dari Audit Tingkat 3.",
        action: "Telusuri kasus",
        filter: row =>
          /audit tingkat 3|audit 3/i.test(
            `${row.source} ${row.blockedStage}`,
          ),
      };
    }
    if (tab === "Verifikasi Ulang") {
      return {
        title: "Pemantauan Verifikasi Ulang",
        description: "Pantau hasil uji ulang yang tercatat tanpa mengambil alih keputusan Balai.",
        emptyText: "Belum ada kasus dalam verifikasi ulang.",
        action: "Lihat hasil",
        filter: row => row.status === "Verifikasi Ulang",
      };
    }
    if (tab === "Riwayat") {
      return {
        title: "Riwayat Temuan Lintas Balai",
        description: "Telusuri kasus tertutup dan hasil tindak lanjut sebelumnya.",
        emptyText: "Belum ada kasus tertutup dalam cakupan.",
        action: "Lihat hasil",
        filter: row => row.status === "Ditutup",
      };
    }
    return {
      title: "Temuan Lintas Balai",
      description: "Pantau kasus dari seluruh Balai dalam cakupan kewenangan Direktorat.",
      emptyText: "Belum ada temuan dari Balai dalam cakupan.",
      action: "Telusuri",
      filter: () => true,
    };
  }

  if (tab === "Notifikasi & SLA") {
    return {
      title: "Pemantauan Tenggat Kasus",
      description: "Kasus terlambat atau akan mencapai tenggat dalam tujuh hari.",
      emptyText: "Tidak ada kasus yang terlambat atau mendekati tenggat.",
      action: "Lihat kasus",
      filter: row => isOverdue(row) || dueInSevenDays(row),
    };
  }

  return {
    title: "Monitoring Kasus",
    description: "Pantau status, penanggung jawab, dan penyelesaian tanpa mengubah keputusan teknis.",
    emptyText: "Belum ada kasus yang tercatat.",
    action: "Lihat kasus",
    filter: () => true,
  };
}

function formatDate(value: string) {
  if (!value) return "Belum ditetapkan";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export default function CorrectionSubmodule({
  role,
  tab,
  rows,
  onSelect,
  selectedKey,
  onOpen: _onOpen,
}: Props) {
  const [query, setQuery] = useState("");
  const [balai, setBalai] = useState("");

  const config = getConfig(role, tab);

  const balaiOptions = useMemo(
    () => [...new Set(rows.map(row => row.balai).filter(Boolean))].sort(),
    [rows],
  );

  const filtered = rows.filter(row => {
    if (!config.filter(row)) return false;
    if (balai && row.balai !== balai) return false;

    return [
      row.id,
      row.packageName,
      row.road,
      row.source,
      row.rejectionReason,
      row.owner,
    ]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase());
  });

  const count = (predicate: (row: CorrectionRow) => boolean) =>
    filtered.filter(predicate).length;

  // Data Referensi bukan tabel temuan.
  if (role === "Admin" && tab === "Data Referensi") {
    const types = [...new Set(rows.map(r => r.actionType).filter(Boolean))];
    const sources = [...new Set(rows.map(r => r.source).filter(Boolean))];

    return (
      <section className="corr-panel corr-submodule">
        <h3>Referensi Tindakan Perbaikan</h3>
        <p className="corr-sub-desc">
          Ringkasan kategori yang digunakan pada kasus dalam cakupan.
          Ini bukan editor master data.
        </p>

        <div className="corr-reference-grid">
          <article>
            <h4>Jenis tindakan yang tercatat</h4>
            {types.length
              ? types.map(type => <p key={type}>{type}</p>)
              : <p>Belum ada jenis tindakan tercatat.</p>}
          </article>

          <article>
            <h4>Sumber temuan yang tercatat</h4>
            {sources.length
              ? sources.map(source => <p key={source}>{source}</p>)
              : <p>Belum ada sumber temuan.</p>}
          </article>

          <article>
            <h4>Tingkat prioritas</h4>
            <p>Kritis</p>
            <p>Mayor</p>
            <p>Minor</p>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="corr-panel corr-submodule">
      <div className="corr-sub-head">
        <div>
          <h3>{config.title}</h3>
          <p>{config.description}</p>
        </div>
        <span className="corr-sub-count">{filtered.length} kasus</span>
      </div>

      <div className="corr-sub-filters">
        <label>
          Cari kasus
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="ID, paket, ruas, atau temuan"
          />
        </label>

        {(role === "Direktorat / Pusat" || role === "Admin") && (
          <label>
            Balai
            <select
              value={balai}
              onChange={event => setBalai(event.target.value)}
            >
              <option value="">Semua Balai</option>
              {balaiOptions.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="corr-table-scroll">
        <table>
          <thead>
            <tr>
              <th>ID Kasus</th>
              <th>Paket / Balai</th>
              <th>Sumber Temuan</th>
              <th>Prioritas</th>
              <th>Status</th>
              <th>Tenggat</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr
                key={row.key}
                className={selectedKey === row.key ? "selected" : ""}
              >
                <td><strong>{row.id}</strong></td>
                <td>
                  <strong>{row.packageName}</strong>
                  <small>{row.balai}</small>
                </td>
                <td>
                  {row.source}
                  <small>{row.rejectionReason}</small>
                </td>
                <td>{row.severity}</td>
                <td>
                  <span className="corr-status">
                    {STATUS_LABEL[row.status]}
                  </span>
                </td>
                <td>{formatDate(row.dueDate)}</td>
                <td>
                  <div className="corr-row-actions">
                    <button
                      type="button"
                      className="corr-preview-button"
                      onClick={() =>
                        onSelect(
                          selectedKey === row.key ? "" : row.key
                        )
                      }
                    >
                      {selectedKey === row.key ? "Batal pilih" : "Pilih"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="corr-table-empty">
          <FileSearch size={24} />
          <strong>{config.emptyText}</strong>
        </div>
      )}

      {tab === "Riwayat" && (
        <p className="corr-sub-desc">
          <History size={14} style={{ verticalAlign: "middle" }} />{" "}
          Perubahan dan keputusan sebelumnya ditelusuri dari catatan workflow paket.
        </p>
      )}

      {role === "Direktorat / Pusat" && tab === "Audit Tingkat 3" && (
        <p className="corr-sub-desc">
          <ShieldCheck size={14} style={{ verticalAlign: "middle" }} />{" "}
          Keputusan Audit Tingkat 3 tetap dicatat dalam Tahap 5 paket,
          bukan melalui tombol persetujuan Balai.
        </p>
      )}

      {role === "Admin" && (
        <p className="corr-sub-desc">
          <CheckCircle2 size={14} style={{ verticalAlign: "middle" }} />{" "}
          Monitoring bersifat hanya baca; keputusan teknis dilakukan pemeriksa berwenang.
        </p>
      )}
    </section>
  );
}
