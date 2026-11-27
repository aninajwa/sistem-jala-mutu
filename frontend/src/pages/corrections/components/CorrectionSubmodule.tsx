import {validDate} from "../../../workflow/operationalCalendar";

import { FileSearch } from "lucide-react";

import type { WorkflowRole } from "../../../workflow/model";
import { correctionNextStep } from "../../../workflow/checkpoint09Corrections";
import { correctionDisplayStatus, correctionOpenLabel, sortCorrectionQueue, isOverdue, dueInSevenDays,
  type CorrectionRow,
} from "../correctionViewModel";

type Props = {
  hasFilters: boolean;
  onReset: () => void;
  role: WorkflowRole;
  tab: string;
  rows: CorrectionRow[];
  query: string;
  onQuery: (query: string) => void;
  onOpen: (packageId: string, correctionId: string) => void;
};

const emptyByTab: Record<string, string> = {
  "Antrian Verifikasi": "Tidak ada usulan yang menunggu persetujuan pada pilihan ini.",
  "Verifikasi Ulang": "Tidak ada hasil yang perlu diperiksa pada pilihan ini.",
  "Riwayat": "Tidak ada kasus selesai pada pilihan ini.",
  "Pemantauan Tenggat": "Tidak ada kasus mendekati atau melewati tenggat pada pilihan ini.",
};

function formatDate(value: string) {
  if (!value) return "Belum ditetapkan";
  if (!validDate(value)) return "Tanggal tidak sah";
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
  hasFilters,
  onReset,
  role,
  tab,
  rows,
  query,
  onQuery,
  onOpen,
}: Props) {

  const filtered = sortCorrectionQueue(rows, tab);

  return (
    <section className="corr-panel corr-submodule">
      <div className="corr-sub-head">
        <div>
          <h3>Daftar kasus</h3>
          
        </div>
        <span className="corr-sub-count">{filtered.length} kasus</span>
      </div>

      <div className="corr-sub-filters">
        <label>
          Cari kasus
          <input
            type="search"
            value={query}
            onChange={event => onQuery(event.target.value)}
            placeholder="ID, paket, ruas, atau temuan"
          />
        </label>


      </div>

      <div className="corr-table-scroll">
        <table aria-label={`Daftar kasus ${tab}`}>
          <thead>
            <tr>
              <th scope="col">ID Kasus</th>
              <th scope="col">Paket / Balai</th>
              <th scope="col">Sumber Temuan / Survei</th>
              <th scope="col">Prioritas</th>
              <th scope="col">Status</th>
              <th scope="col">{tab === "Riwayat" ? "Hasil pemeriksaan" : "Tenggat"}</th>
              {tab !== "Riwayat" && <th scope="col">Langkah berikutnya</th>}
              <th scope="col">Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr
                key={row.key}
              >
                <td><strong>{row.id}</strong></td>
                <td>
                  <strong>{row.packageName}</strong>
                  <small>{row.balai}</small>
                </td>
                <td>
                  {row.source}
                  <small>{row.surveyType} · {row.road}</small>
                  <small>{row.rejectionReason}</small>
                </td>
                <td>{row.severity}</td>
                <td>
                  <span className="corr-status">
                    {correctionDisplayStatus(row)}
                  </span>
                </td>
                <td>{tab === "Riwayat" ? <>{row.approval}<small>{row.retest}</small></> : <><span className={isOverdue(row) ? "corr-late" : ""}>{formatDate(row.dueDate)}</span>{isOverdue(row) ? <small className="corr-late">Terlambat</small> : dueInSevenDays(row) ? <small>Mendekati tenggat</small> : null}</>}</td>
                {tab !== "Riwayat" && <td>{correctionNextStep(row).label}<small>{correctionNextStep(row).actor}</small></td>}
                <td>
                  <div className="corr-row-actions">
                    <button type="button" className="corr-preview-button" aria-label={`${correctionOpenLabel(row, role)} ${row.id} — ${row.packageName}`} onClick={() => onOpen(row.packageId, row.id)}>{correctionOpenLabel(row, role)}</button>
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
          <strong role="status">{hasFilters ? "Tidak ada kasus yang cocok dengan filter." : emptyByTab[tab] || "Tidak ada kasus pada pilihan ini."}</strong>
          {hasFilters && <button type="button" className="corr-preview-button" onClick={onReset}>Hapus filter</button>}
        </div>
      )}

    </section>
  );
}
