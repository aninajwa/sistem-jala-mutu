import { Activity, CalendarDays, MapPinned } from "lucide-react";

import type { OperationalWorkflowState } from "../model";

import { daysBetween } from "../model";

type Props = {
  state: OperationalWorkflowState;
};

export function Stage3DailySummary({ state }: Props) {
  const records = state.dailyRecords.filter((record) => {
    const age = daysBetween(record.date, state.simulationDate);

    return (
      age >= 0 &&
      age < 7 &&
      state.project.surveyTypes.includes(record.surveyType) &&
      state.project.routes.includes(record.road)
    );
  });

  const recorded = records.filter((record) => record.state === "Tercatat");

  const totalKm = recorded.reduce(
    (total, record) => total + record.lengthKm,
    0,
  );

  const resurveyCount = records.filter(
    (record) => record.state === "Survei Ulang",
  ).length;

  const byType = state.project.surveyTypes.map((type) => ({
    type,
    count: records.filter((record) => record.surveyType === type).length,
  }));

  return (
    <section className="wf-panel">
      <div className="wf-panel-head">
        <h3>
          <Activity size={14} />
          Monitoring Kegiatan Survei
        </h3>
      </div>

      <div className="wf-body">
        <p className="wf-note">
          Ringkasan kegiatan tujuh hari sampai {state.simulationDate},
          berdasarkan rekaman yang tersimpan pada paket ini.
        </p>

        <div className="wf-kpis">
          <div className="wf-kpi">
            <div className="wf-kpi-label">Kegiatan tercatat</div>
            <div className="wf-kpi-value">{recorded.length}</div>
          </div>

          <div className="wf-kpi">
            <div className="wf-kpi-label">Cakupan survei</div>
            <div className="wf-kpi-value">{totalKm.toFixed(1)} km</div>
          </div>

          <div className="wf-kpi">
            <div className="wf-kpi-label">Perlu survei ulang</div>
            <div className="wf-kpi-value">{resurveyCount}</div>
          </div>
        </div>

        <div className="wf-pill-list">
          {byType
            .filter((item) => item.count > 0)
            .map((item) => (
              <span className="wf-pill" key={item.type}>
                {item.type} · {item.count} kegiatan
              </span>
            ))}

          {records.length === 0 && (
            <span className="wf-note">
              Belum ada rekaman kegiatan dalam periode tujuh hari terakhir.
            </span>
          )}
        </div>

        <div className="wf-note">
          <CalendarDays size={13} /> Data mengikuti tanggal kegiatan.{" "}
          <MapPinned size={13} /> Cakupan hanya dari ruas dan jenis survei dalam
          paket.
        </div>
      </div>
    </section>
  );
}

export default Stage3DailySummary;
