import { CalendarClock, Clock3, Timer, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { notificationsFor } from "../model";

import type { WorkflowStageProps } from "./stageSupport";
import { Badge, defaultCase, defaultDaily, Field, Panel } from "./stageSupport";
import { useWorkflowStage } from "./useWorkflowStage";

export function NotificationsWorkspace(props: WorkflowStageProps) {
  const { selection, state, onUpdate, setNotice, onNavigate } = props;
  const { commit, heading } = useWorkflowStage(props);
  const [daily, setDaily] = useState(() =>
    defaultDaily(
      state.simulationDate,
      state.project.routes[0] || "",
      state.project.surveyTypes[0] || "IRI",
    ),
  );
  const deadlineRows = notificationsFor(state);

  const updateDate = (date: string) => {
    commit(
      "Ubah tanggal simulasi",
      date,
      (s) => ({ ...s, simulationDate: date }),
      "Tanggal simulasi diperbarui; tenggat dihitung ulang",
    );
    setDaily((current) => ({ ...current, date }));
  };
  const simulateMissed = (row: {
    id: string;
    title: string;
    object: string;
  }) => {
    if (row.id.startsWith("correction-") || row.id === "scheduled-backup") {
      setNotice(
        "Tindak lanjuti kasus / jadwal yang ada; tidak membuat kasus eskalasi berulang.",
      );
      return;
    }
    const due =
      deadlineRows.find((item) => item.id === row.id)?.due ||
      state.simulationDate;
    const source = `Notifikasi H+0 · ${row.id} · ${due}`;
    if (state.corrections.some((item) => item.source === source)) {
      setNotice("Kasus untuk tenggat ini sudah dibuat.");
      return;
    }
    const c = defaultCase(state);
    c.source = source;
    c.blockedStage =
      row.id === "cycle-14d"
        ? "Verval 14 hari"
        : row.id.startsWith("calibration-")
          ? "Kalibrasi"
          : "Penerimaan & termin";
    c.returnStage = c.blockedStage;
    c.rejectionReason = `Tenggat terlewat: ${row.title}`;
    c.dueDate = state.simulationDate;
    c.severity = "Mayor";
    commit(
      "Simulasikan respons tenggat terlewat",
      row.id,
      (s) => ({ ...s, corrections: [c, ...s.corrections] }),
      "Respons H+0 simulasi membuka kasus koreksi untuk tindak lanjut",
    );
  };
  return (
    <>
      {heading(
        "Monitoring · tenggat",
        "Pengingat & eskalasi",
        "Tenggat dihitung dari tanggal simulasi, siklus verval dan termin terbuka. H-30/H-7/H+0 memetakan eskalasi peran; respons H+0 hanya membuat kasus demo.",
      )}
      <div className="wf-grid">
        <Panel title="Tanggal simulasi operasional" icon={CalendarClock}>
          <div className="wf-fields">
            <Field label="Hari ini (simulasi)">
              <input
                type="date"
                data-testid="input-simulation-date"
                value={state.simulationDate}
                onChange={(e) => updateDate(e.target.value)}
              />
            </Field>
            <div className="wf-field">
              <label>Jalur eskalasi</label>
              <div className="wf-pill-list">
                <span className="wf-pill">PIC Balai</span>
                <span className="wf-pill">Atasan langsung</span>
                <span className="wf-pill">Direktorat / Pusat</span>
              </div>
            </div>
          </div>
          <p className="wf-note">
            Tidak ada pesan, email, atau notifikasi eksternal yang dikirim.
          </p>
        </Panel>
        <Panel title="Ambang pengingat" icon={Timer}>
          <div className="wf-stage">
            <span className="wf-stage-num">30</span>
            <div>
              <strong>H-30</strong>
              <small>PIC Balai → atasan → pusat</small>
            </div>
            <Badge tone="info">Pengingat</Badge>
          </div>
          <div className="wf-stage">
            <span className="wf-stage-num">7</span>
            <div>
              <strong>H-7</strong>
              <small>Eskalasi tenggat segera</small>
            </div>
            <Badge tone="warn">Peringatan</Badge>
          </div>
          <div className="wf-stage">
            <span className="wf-stage-num">0</span>
            <div>
              <strong>H+0</strong>
              <small>Lewat / jatuh tempo hari ini; siapkan tindak lanjut</small>
            </div>
            <Badge tone="bad">Respons simulasi</Badge>
          </div>
        </Panel>
      </div>
      <Panel
        title="Antrean tenggat dinamis"
        icon={Clock3}
        extra={
          <Badge tone={deadlineRows.length ? "warn" : "good"}>
            {deadlineRows.length} butir dalam rentang pengingat
          </Badge>
        }
      >
        {deadlineRows.length ? (
          <div className="wf-table">
            <table data-testid="table-deadlines">
              <thead>
                <tr>
                  <th>Tenggat</th>
                  <th>Objek</th>
                  <th>Tanggal batas</th>
                  <th>Sisa hari</th>
                  <th>Tahap</th>
                  <th>Rantai peran</th>
                  <th>Respons lokal</th>
                </tr>
              </thead>
              <tbody>
                {deadlineRows.map((row) => (
                  <tr key={row.id} data-testid={`row-deadline-${row.id}`}>
                    <td>
                      <strong>{row.title}</strong>
                    </td>
                    <td>{row.object}</td>
                    <td>{row.due}</td>
                    <td>{row.remaining}</td>
                    <td>
                      <Badge
                        tone={
                          row.stage === "H+0"
                            ? "bad"
                            : row.stage === "H-7"
                              ? "warn"
                              : "info"
                        }
                      >
                        {row.stage}
                      </Badge>
                    </td>
                    <td>PIC Balai → Atasan → Pusat</td>
                    <td>
                      {row.stage === "H+0" ? (
                        <button
                          className="wf-button danger"
                          data-testid={`button-escalate-${row.id}`}
                          onClick={() => simulateMissed(row)}
                        >
                          Simulasikan eskalasi & kasus
                        </button>
                      ) : (
                        <Badge tone="info">Pengingat lokal</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="wf-empty">
            Tidak ada tenggat dalam jendela H-30/H-7/H+0 untuk tanggal simulasi
            ini.
          </div>
        )}
      </Panel>
      <Panel title="Respons H+0 sebelumnya" icon={TriangleAlert}>
        {state.corrections.filter(
          (c) =>
            c.source.startsWith("Notifikasi H+0") ||
            c.source === "Pengingat H+0 terlewat",
        ).length ? (
          <div className="wf-pill-list">
            {state.corrections
              .filter(
                (c) =>
                  c.source.startsWith("Notifikasi H+0") ||
                  c.source === "Pengingat H+0 terlewat",
              )
              .map((c) => (
                <span
                  className="wf-pill"
                  data-testid={`escalation-case-${c.id}`}
                  key={c.id}
                >
                  {c.id} · {c.blockedStage} · {c.status}
                </span>
              ))}
          </div>
        ) : (
          <div className="wf-empty">
            Tidak ada kasus eskalasi simulasi yang dibuka.
          </div>
        )}
      </Panel>
    </>
  );
}
