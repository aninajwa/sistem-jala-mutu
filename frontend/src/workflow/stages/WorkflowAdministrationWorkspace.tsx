import {isRoleTestMode} from '../access/packageAccess';
import {usePersistedDraft} from '../../hooks/usePersistedDraft';
import {
  Activity,
  Archive,
  CalendarClock,
  HardDrive,
  LockKeyhole,
} from "lucide-react";
import { useState } from "react";

import { dueScheduledBackup } from "../flowRules";
import { BackupSnapshot, WorkflowRole } from "../model";

import type { WorkflowStageProps } from "./stageSupport";
import {
  Badge,
  Button,
  Field,
  idNow,
  Panel,
  roleOptions,
  roleScope,
  Select,
  testId,
} from "./stageSupport";
import { useWorkflowStage } from "./useWorkflowStage";

export function WorkflowAdministrationWorkspace(props: WorkflowStageProps) {
  const { selection, state, onUpdate, setNotice, onNavigate } = props;
  const { commit, heading } = useWorkflowStage(props);
  const [draft,setDraft]=usePersistedDraft<Record<string,string>>(`jala-ui-draft:${state.project.id}:${state.role}:WorkflowAdministrationWorkspace`,{});
  const [backupMedia, setBackupMedia] = useState<string[]>(["Perangkat kerja"]);
  const saveText = (key: string, value: string) =>
    setDraft((old) => ({ ...old, [key]: value }));

  const changeRole = (role: WorkflowRole) => {
    if (!isRoleTestMode()) { setNotice('Penggantian peran hanya tersedia dalam mode uji terisolasi.'); return; }
    commit(
      "Simulasikan peran aktif",
      role,
      (s) => ({ ...s, role }),
      "Peran demo berubah; tidak ada autentikasi atau hak akses nyata",
    );
  };
  const mediaOptions = [
    "Perangkat kerja",
    "Media eksternal",
    "Penyimpanan jaringan (simulasi)",
    "Arsip paket (simulasi)",
  ];
  const createBackup = () => {
    if (backupMedia.length < 2) {
      setNotice("Pilih minimal dua media untuk snapshot multi-media.");
      return;
    }
    const backup: BackupSnapshot = {
      id: idNow("BKP"),
      createdAt: `${state.simulationDate} 17:00`,
      media: backupMedia,
      includesRaw: true,
      includesProcessed: true,
      note: "Snapshot berkala simulasi · raw + terproses",
    };
    commit(
      "Catat snapshot multi-media simulasi",
      backup.id,
      (s) => ({ ...s, backups: [backup, ...s.backups] }),
      "Riwayat snapshot dicatat secara lokal dalam state demo; bukan backup nyata",
    );
  };
  return (
    <>
      {heading(
        "Governance demo · tanpa login",
        "Peran & backup",
        "Simulasikan cakupan peran dan riwayat snapshot multi-media. Ini bukan autentikasi, otorisasi, upload atau penyimpanan nyata.",
      )}
      <div className="wf-grid">
        <Panel
          title="Pemilih peran simulasi"
          icon={LockKeyhole}
          extra={<Badge tone="warn">Tidak terautentikasi</Badge>}
        >
          {isRoleTestMode() ? <Field label="Peran aktif">
            <Select
              id="select-simulated-role"
              value={state.role}
              options={roleOptions}
              onChange={(v) => changeRole(v as WorkflowRole)}
            />
          </Field> : <p>Peran sesi lokal: <strong>{state.role}</strong>. Penggantian peran tersedia hanya melalui mode pengujian.</p>}
          <div className="wf-callout warn" style={{ marginTop: 10 }}>
            Simulasi peran hanya mengubah aktor yang tercatat pada event demo.
            Tidak ada login, akun pengguna, sesi, kunci akun atau proteksi
            akses.
          </div>
          <div className="wf-stage">
            <span className="wf-stage-num">R</span>
            <div>
              <strong>Cakupan peran</strong>
              <small>{roleScope[state.role]}</small>
            </div>
          </div>
        </Panel>
        <Panel title="Pilihan media snapshot" icon={HardDrive}>
          <div className="wf-callout warn">
            Catatan ini tidak menyalin file dan tidak membuktikan backup
            sungguhan. Perangkat dan media adalah label simulasi.
          </div>
          <div className="wf-pill-list">
            {mediaOptions.map((m) => (
              <label className="wf-pill" key={m}>
                <input
                  type="checkbox"
                  data-testid={`check-role-backup-${testId(m)}`}
                  checked={backupMedia.includes(m)}
                  onChange={(e) =>
                    setBackupMedia((old) =>
                      e.target.checked
                        ? [...old, m]
                        : old.filter((x) => x !== m),
                    )
                  }
                />
                {m}
              </label>
            ))}
          </div>
          <div className="wf-toolbar" style={{ marginTop: 10 }}>
            <Button
              id="button-create-role-backup"
              kind="primary"
              onClick={createBackup}
            >
              <Archive size={13} />
              Catat snapshot demo
            </Button>
            <Badge tone="info">{state.backups.length} snapshot tercatat</Badge>
          </div>
        </Panel>
      </div>
      <Panel title="Jadwal snapshot lokal simulasi" icon={CalendarClock}>
        <div className="wf-callout warn">
          Simulator memproses jadwal saat aplikasi aktif atau tanggal simulasi
          berubah; bukan scheduler server dan bukan backup file sungguhan.
          Minimal dua media.
        </div>
        <div className="wf-fields">
          <Field label="Interval (hari)">
            <input
              data-testid="input-backup-interval"
              type="number"
              min="1"
              max="30"
              value={
                draft.backupInterval ??
                String(state.backupSchedule?.intervalDays ?? 7)
              }
              onChange={(e) => saveText("backupInterval", e.target.value)}
            />
          </Field>
          <Field label="Snapshot berikutnya">
            <input
              data-testid="input-backup-next-date"
              type="date"
              value={
                draft.backupNextDate ??
                state.backupSchedule?.nextDate ??
                state.simulationDate
              }
              onChange={(e) => saveText("backupNextDate", e.target.value)}
            />
          </Field>
        </div>
        <Button
          id="button-save-backup-schedule"
          onClick={() => {
            const interval = Number(
              draft.backupInterval ?? state.backupSchedule?.intervalDays ?? 7,
            );
            if (
              backupMedia.length < 2 ||
              !Number.isInteger(interval) ||
              interval < 1 ||
              interval > 30
            ) {
              setNotice("Pilih ≥2 media dan interval 1–30 hari.");
              return;
            }
            commit(
              "Aktifkan jadwal snapshot simulasi",
              state.project.packageName,
              (s) =>
                dueScheduledBackup({
                  ...s,
                  backupSchedule: {
                    enabled: true,
                    intervalDays: interval,
                    nextDate:
                      draft.backupNextDate ??
                      s.backupSchedule?.nextDate ??
                      s.simulationDate,
                    media: backupMedia,
                  },
                }),
            );
          }}
        >
          Aktifkan / perbarui jadwal
        </Button>
        {state.backupSchedule?.enabled && (
          <>
            <span className="wf-note">
              {" "}
              Aktif · berikutnya {state.backupSchedule.nextDate} ·{" "}
              {state.backupSchedule.media.join(", ")}
            </span>
            <Button
              id="button-stop-backup-schedule"
              onClick={() =>
                commit(
                  "Hentikan jadwal snapshot simulasi",
                  state.project.id,
                  (s) => ({
                    ...s,
                    backupSchedule: s.backupSchedule
                      ? { ...s.backupSchedule, enabled: false }
                      : undefined,
                  }),
                )
              }
            >
              Hentikan jadwal
            </Button>
          </>
        )}
      </Panel>
      <Panel title="Riwayat snapshot demo" icon={Archive}>
        {state.backups.length ? (
          <div className="wf-table">
            <table data-testid="table-backup-history">
              <thead>
                <tr>
                  <th>ID / waktu</th>
                  <th>Media simulasi</th>
                  <th>Isi</th>
                  <th>Catatan</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {state.backups.map((b) => (
                  <tr key={b.id} data-testid={`row-backup-${b.id}`}>
                    <td>
                      {b.id}
                      <div className="wf-note">{b.createdAt}</div>
                    </td>
                    <td>{b.media.join(", ") || "Tidak dipilih"}</td>
                    <td>
                      {[
                        b.includesRaw ? "Raw" : "",
                        b.includesProcessed ? "Terproses" : "",
                      ]
                        .filter(Boolean)
                        .join(" + ")}
                    </td>
                    <td>{b.note}</td>
                    <td>
                      <Badge tone="warn">Simulasi saja</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="wf-empty">
            Belum ada snapshot simulasi. Membuat snapshot hanya menambah riwayat
            lokal pada state aplikasi.
          </div>
        )}
      </Panel>
      <Panel title="Jejak event operasional" icon={Activity}>
        <div className="wf-table">
          <table data-testid="table-workflow-events">
            <thead>
              <tr>
                <th>Tanggal demo</th>
                <th>Aktor demo</th>
                <th>Perubahan</th>
                <th>Objek</th>
                <th>Nilai lama → nilai baru (ringkasan)</th>
              </tr>
            </thead>
            <tbody>
              {state.events.slice(0, 12).map((e) => (
                <tr key={e.id} data-testid={`row-event-${e.id}`}>
                  <td>{e.date}</td>
                  <td>{e.actor}</td>
                  <td>{e.action}</td>
                  <td>{e.object}</td>
                  <td>
                    <div className="wf-note">
                      Sebelum: {e.oldValue || "—"}
                    </div>
                    <div className="wf-note">
                      Sesudah: {e.newValue || "—"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!state.events.length && (
            <div className="wf-empty">Belum ada event workflow demo.</div>
          )}
        </div>
      </Panel>
    </>
  );
}
