import { ClipboardList } from "lucide-react";

import type { OperationalWorkflowState } from "../model";
import { dailyChecks, dailyFields } from "../surveyStandards";

type Props = {
  state: OperationalWorkflowState;
};

export function Stage3DailyRecordsTable({ state }: Props) {
  const records = state.dailyRecords.filter(
    (record) =>
      state.project.surveyTypes.includes(record.surveyType) &&
      state.project.routes.includes(record.road),
  );

  return (
    <section className="wf-panel">
      <div className="wf-panel-head">
        <h3>
          <ClipboardList size={14} />
          Rekaman Kegiatan Lapangan
        </h3>

        <span className="wf-note">{records.length} rekaman</span>
      </div>

      <div className="wf-body">
        {records.length === 0 ? (
          <div className="wf-empty">
            Belum ada rekaman survei harian untuk lingkup paket ini.
          </div>
        ) : (
          <div className="wf-table">
            <table data-testid="table-daily-records">
              <thead>
                <tr>
                  <th>ID / Waktu</th>
                  <th>Jenis Survei / Ruas</th>
                  <th>Lajur / Arah</th>
                  <th>Cuaca / Alat</th>
                  <th>Hasil Referensi</th>
                  <th>Status / Pemeriksaan</th>
                </tr>
              </thead>

              <tbody>
                {records.map((record) => {
                  const checks = dailyChecks(record);
                  const completedChecks = checks.filter(
                    (key) => record.dailyToolCheck?.[key],
                  ).length;

                  return (
                    <tr key={record.id} data-testid={`row-daily-${record.id}`}>
                      <td>
                        <strong>{record.id}</strong>
                        <div className="wf-note">
                          {record.date} {record.time}
                        </div>
                      </td>

                      <td>
                        <strong>{record.surveyType}</strong>
                        <div className="wf-note">{record.road}</div>
                        <div className="wf-note">
                          {record.lengthKm} km
                          {record.surveyType === "Lalu Lintas"
                            ? ` · ${record.trafficDurationMinutes} menit`
                            : ""}
                        </div>
                        <div className="wf-note">POI: {record.poi || "—"}</div>

                        <details>
                          <summary>Metadata teknis</summary>

                          {record.technicalData ? (
                            dailyFields(record).map((field) => (
                              <div className="wf-note" key={field.key}>
                                {field.label}:{" "}
                                {record.technicalData?.[field.key] || "—"}
                              </div>
                            ))
                          ) : (
                            <span className="wf-note">
                              Metadata teknis belum tersedia.
                            </span>
                          )}
                        </details>
                      </td>

                      <td>
                        {record.lane} · {record.direction}
                      </td>

                      <td>
                        {record.weather}
                        <div className="wf-note">{record.tool}</div>
                        <div className="wf-note">
                          {record.operator} / {record.driver}
                        </div>
                      </td>

                      <td>
                        <div>{record.rawValue || "—"}</div>

                        <div className="wf-note">
                          Hasil tercatat: {record.cleanedValue || "—"}
                        </div>

                        {record.cleaningReason && (
                          <div className="wf-note">
                            Catatan: {record.cleaningReason}
                          </div>
                        )}
                      </td>

                      <td>
                        <span
                          className={`wf-status ${
                            record.state === "Tercatat" ? "good" : "warn"
                          }`}
                        >
                          {record.state}
                        </span>

                        <div className="wf-note">
                          {completedChecks}/{checks.length} pemeriksaan alat
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default Stage3DailyRecordsTable;
