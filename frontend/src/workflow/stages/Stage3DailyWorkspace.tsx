import {RoleWorkSection} from '../RoleWorkSection';
import {DocumentAttachments} from '../DocumentAttachments';
import {usePersistedDraft} from '../../hooks/usePersistedDraft';
import {
  Activity,
  Archive,
  Eye,
  FileText,
  HardDrive,
  MapPinned,
  RotateCcw,
  Save,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { recordDailyChange } from "../workflowRevisions";

import {
  BackupSnapshot,
  DailySurveyRecord,
  daysBetween,
  evaluateProductionTest,
  SURVEY_TYPES,
  SurveyType,
} from "../model";
import {
  dailyChecks,
  dailyFields,
  evaluateDailySurvey,
} from "../surveyStandards";
import { GateSummary } from "../WorkflowComponents";
import {
  STAGE3_ROLE_GUIDANCE,
  STAGE3_SOURCE_MODE_PRESENTATION,
  VALIDATION_SOURCE_OPTIONS,
} from "../workflowConfig";

import { Stage3DailyRecordsTable } from "../stages/Stage3DailyRecordsTable";
import { Stage3DailySummary } from "../stages/Stage3DailySummary";
import type { WorkflowStageProps } from "./stageSupport";
import {
  Badge,
  Button,
  CheckRow,
  dailyEquipment,
  defaultDaily,
  Field,
  idNow,
  Panel,
  Select,
  testId,
} from "./stageSupport";
import { useWorkflowStage } from "./useWorkflowStage";

export function Stage3DailyWorkspace(props: WorkflowStageProps) {
  const { selection, state, onUpdate, setNotice, onNavigate } = props;
  const { commit, heading, toggleMap } = useWorkflowStage(props);
  const [entryOpen,setEntryOpen]=useState(false);
  const [prodType, setProdType] = useState<SurveyType>("IRI");
  const [daily, setDaily] = usePersistedDraft(`jala-ui-draft:${state.project.id}:${state.role}:daily`,() =>
    defaultDaily(
      state.simulationDate,
      state.project.routes[0] || "",
      state.project.surveyTypes[0] || "IRI",
    ),
  );
  const [dailySource, setDailySource] = useState<
    (typeof VALIDATION_SOURCE_OPTIONS)[number]
  >("Pencatatan manual");
  const [dailyTool, setDailyTool] = usePersistedDraft<Record<string, boolean>>(`jala-ui-draft:${state.project.id}:${state.role}:dailyTool`,{});
  const [backupMedia, setBackupMedia] = useState<string[]>(["Perangkat kerja"]);
  const test = state.productionTests[prodType];

  const toolChecks = dailyChecks(daily);
  const preparationReady =
    state.project.preparation.reportApproval === "Disetujui";
  const calibrationReady =
    state.calibrations.length > 0 &&
    state.calibrations.every(
      (c) =>
        daysBetween(state.simulationDate, c.dueDate) >= 0 &&
        c.qualificationValid &&
        c.trainingVerified &&
        c.condition === "Baik",
    ) &&
    state.project.surveyTypes.length > 0 &&
    state.project.surveyTypes.every((type) => state.calibrationChecklist[type]);
  const methodApproved =
    state.productionApproval === "Disetujui" &&
    state.project.surveyTypes.every(
      (type) =>
        evaluateProductionTest(type, state.productionTests[type]).passed,
    );
  const bridgePermitRequired = daily.surveyType === "Jembatan";
  const stageReady =
    preparationReady &&
    calibrationReady &&
    methodApproved &&
    (!bridgePermitRequired || state.bridgeInspectionPermit);
  const sourceMode = STAGE3_SOURCE_MODE_PRESENTATION[dailySource];
  const sourceReadOnly = sourceMode.sourceReadOnly;
  const sourceFieldHint = sourceReadOnly
    ? "Integrasi belum aktif. Belum ada data kegiatan yang dapat diambil otomatis."
    : "Lengkapi hanya informasi yang belum tersedia pada sumber yang dipilih.";
  const technicalErrors = sourceReadOnly
    ? []
    : evaluateDailySurvey(
        { ...daily, dailyToolCheck: dailyTool },
        state.dailyRecords,
      );
  const fieldQuality = !sourceReadOnly && technicalErrors.length === 0;
  const gate = stageReady && !sourceReadOnly && fieldQuality;
  const weeklyRecords = state.dailyRecords.filter((record) => {
    const age = daysBetween(record.date, state.simulationDate);
    return (
      state.project.surveyTypes.includes(record.surveyType) &&
      state.project.routes.includes(record.road) &&
      age >= 0 &&
      age < 7
    );
  });
  const weeklyKm = weeklyRecords
    .filter((record) => record.state === "Tercatat")
    .reduce((total, record) => total + record.lengthKm, 0);
  const weeklyByType = SURVEY_TYPES.map((type) => ({
    type,
    count: weeklyRecords.filter((record) => record.surveyType === type).length,
  }));
  const saveRecord = () => {
    if (state.role !== "Penyedia Jasa / Ketua Tim") {
      setNotice(
        "Peran Penyedia Jasa / Ketua Tim diperlukan untuk mencatat survei harian.",
      );
      return;
    }
    if (!daily.road || !daily.operator || !daily.rawValue) {
      setNotice("Isi ruas, operator dan nilai raw sebelum mencatat survei.");
      return;
    }
    if (
      !state.project.routes.includes(daily.road) ||
      !state.project.surveyTypes.includes(daily.surveyType)
    ) {
      setNotice(
        "Pilih ruas dan jenis survei yang termasuk dalam lingkup paket.",
      );
      return;
    }
    if (daily.surveyType === "Lereng" && !daily.slopeFailureType?.trim()) {
      setNotice(
        "Jenis keruntuhan lereng wajib untuk sampling 10% per jenis keruntuhan.",
      );
      return;
    }
    if (!stageReady) {
      setNotice(
        "Pengumpulan tertahan sampai laporan pendahuluan, kalibrasi, persetujuan metode dan izin jembatan (bila perlu) lulus.",
      );
      return;
    }
    if (sourceReadOnly) {
      setNotice(
        "Data kegiatan pada mode sinkronisasi menunggu data dari sistem sumber.",
      );
      return;
    }
    if (!fieldQuality && daily.state !== "Survei Ulang") {
      setNotice(technicalErrors.join(" "));
      return;
    }
    if (daily.state === "Survei Ulang" && !daily.eventNotes.trim()) {
      setNotice("Alasan survei ulang wajib dicatat pada kolom catatan event.");
      return;
    }
    if (
      !Number.isFinite(daily.lengthKm) ||
      daily.lengthKm < 0 ||
      !daily.date ||
      daily.date > state.simulationDate
    ) {
      setNotice(
        "Panjang tidak boleh negatif dan tanggal tidak boleh di masa depan.",
      );
      return;
    }
    const record: DailySurveyRecord = {
      ...daily,
      id: idNow("HARIAN"),
      dailyToolCheck: { ...dailyTool },
      cleanedValue: daily.rawValue,
      cleaningReason: "",
    };
    commit(
      "Catat survei harian",
      record.id,
      (s) => recordDailyChange(s, record),
      "Rekaman dicatat; histori BA dan audit tetap tersedia.",
    );
    setDaily(
      defaultDaily(
        state.simulationDate,
        state.project.routes[0] || "",
        state.project.surveyTypes[0] || "IRI",
      ),
    );
    setDailyTool({});
  };
  const makeBackup = () => {
    if (backupMedia.length < 2) {
      setNotice("Pilih minimal dua media pengamanan data.");
      return;
    }
    const backup: BackupSnapshot = {
      id: idNow("BKP"),
      createdAt: `${state.simulationDate} ${daily.time || "08:00"}`,
      media: backupMedia,
      includesRaw: true,
      includesProcessed: true,
      note: "Catatan pengamanan data rekaman lapangan",
    };
    commit(
      "Catat pengamanan data",
      backup.id,
      (s) => ({ ...s, backups: [backup, ...s.backups] }),
      "Catatan pengamanan data tersimpan",
    );
  };
  const dailyStageReady = state.dailyRecords.some(
    (record) => record.state === "Tercatat",
  );
  const stage3AHas14DayMaterial = state.dailyRecords.some((record) => {
    const age = daysBetween(record.date, state.simulationDate);

    return record.state === "Tercatat" && age >= 14;
  });
  const canEnterDaily = state.role === "Penyedia Jasa / Ketua Tim";
  const incompleteItems = technicalErrors.filter((error) =>
    /wajib diisi|belum lengkap|harus diisi|belum tersedia/i.test(error),
  );
  const checkItems = technicalErrors.filter(
    (error) => !incompleteItems.includes(error),
  );
  const weeklySummary = <Stage3DailySummary state={state} />;
  const stage3AGate = (
    <GateSummary
      title="Status Tahap 3A → verval berkala"
      items={[
        {
          label: "Ada rekaman kegiatan lapangan",
          ready: dailyStageReady,
          detail: dailyStageReady
            ? `${state.dailyRecords.filter((r) => r.state === "Tercatat").length} rekaman tercatat`
            : "Belum ada rekaman tercatat",
        },
        {
          label: "Ada data tercatat untuk bahan verval",
          ready: state.dailyRecords.some((r) => r.state === "Tercatat"),
          detail: "Verval menggunakan rekaman kegiatan yang tercatat",
        },
        {
          label: "Bukti/check harian tersedia",
          ready: state.dailyRecords.some((r) =>
            Object.values(r.dailyToolCheck).some(Boolean),
          ),
          detail: "Checklist mengikuti jenis/metode survei",
        },
        {
          label: "Bahan periode 14 hari tersedia",

          ready: stage3AHas14DayMaterial,

          detail: stage3AHas14DayMaterial
            ? "Rekaman periode siap masuk verifikasi berkala"
            : "Belum tersedia rentang rekaman 14 hari",
        },
      ]}
    />
  );
  return (
    <>
      {heading(
        "Tahap 3A · pengumpulan data",
        "Survei harian",
        "Pantau pelaksanaan survei harian, kelengkapan bukti QA/QC, kondisi alat, dan kesiapan menuju verifikasi berkala.",
      )}
      <p className="wf-note">Rekaman harian dicatat Penyedia. PIC Balai dan Direktorat memantau; pemeriksaan bersama dilakukan pada Tahap 3B sesuai periode, bukan menyetujui setiap rekaman.</p>
      <Stage3DailyRecordsTable state={state} />
      {canEnterDaily&&<button type="button" className="wf-button primary" onClick={()=>setEntryOpen(value=>!value)}>{entryOpen?'Tutup pengisian':'Catat atau lengkapi kegiatan'}</button>}
      <RoleWorkSection primary={canEnterDaily} title="Kegiatan, pemeriksaan harian dan bukti Penyedia"><div hidden={!entryOpen&&canEnterDaily}>
      <details><summary>Prasyarat pencatatan · {stageReady?'terpenuhi':'belum terpenuhi'}</summary>
      <div className="wf-grid">
        <Panel title="Data kegiatan & kewenangan" icon={Activity}>
          <div className="wf-fields">
            <Field label="Sumber data kegiatan">
              {canEnterDaily ? (
                <Select
                  id="select-daily-source"
                  value={dailySource}
                  options={[...VALIDATION_SOURCE_OPTIONS]}
                  onChange={(v) =>
                    setDailySource(
                      v as (typeof VALIDATION_SOURCE_OPTIONS)[number],
                    )
                  }
                />
              ) : (
                <input value={dailySource} readOnly />
              )}
            </Field>
            <Field label="Status sumber">
              <div>
                <Badge
                  tone={
                    sourceReadOnly
                      ? "good"
                      : dailySource === "Lampiran / bukti kegiatan"
                        ? "info"
                        : "warn"
                  }
                >
                  {sourceMode.badge}
                </Badge>
                <div className="wf-note" style={{ marginTop: 5 }}>
                  {sourceMode.detail}
                </div>
              </div>
            </Field>
          </div>

          <div className="wf-callout" style={{ marginTop: 10 }}>
            <strong>{state.role}:</strong> {STAGE3_ROLE_GUIDANCE[state.role]}
          </div>
        </Panel>
        <GateSummary
          title="Kesiapan masuk pengumpulan data"
          items={[
            {
              label: "Tahap 0 persiapan",
              ready: preparationReady,
              detail: preparationReady ? "Lengkap" : "Lengkapi persiapan",
            },
            {
              label: "Tahap 1 alat & personel",
              ready: calibrationReady,
              detail: calibrationReady ? "Siap" : "Belum siap",
            },
            {
              label: "Tahap 2 validasi produksi",
              ready: methodApproved,
              detail: methodApproved ? "Disetujui" : "Belum disetujui",
            },
          ]}
        />
      </div>
      </details>
      {canEnterDaily && (
        <div className="wf-stage3a-stack">
          <Panel
            title={
              sourceReadOnly
                ? "Data kegiatan dari sistem sumber"
                : dailySource === "Lampiran / bukti kegiatan"
                  ? "Kelengkapan data dari lampiran"
                  : "Pencatatan manual kegiatan"
            }
            icon={MapPinned}
            extra={
              <Badge tone={gate ? "good" : sourceReadOnly ? "info" : "bad"}>
                {gate
                  ? "Kondisi memenuhi"
                  : sourceReadOnly
                    ? "Menunggu data"
                    : "Kondisi tertahan"}
              </Badge>
            }
          >
            <div className="wf-callout" style={{ marginBottom: 10 }}>
              <strong>{sourceMode.badge}.</strong> {sourceFieldHint}
            </div>
            {sourceReadOnly ? (
              <div className="wf-callout">
                <strong>Belum ada rekaman tersinkron.</strong>
                <div className="wf-note" style={{ marginTop: 5 }}>
                  Saat data tersedia, metadata seperti ruas, waktu, koordinat,
                  alat, personel, dan hasil survei akan tampil sebagai data
                  sumber. Penyedia kemudian melengkapi checklist, bukti, atau
                  catatan yang memang belum tersedia.
                </div>
              </div>
            ) : (
              <div className="wf-fields">
                <Field label="Tanggal">
                  <input
                    type="date"
                    data-testid="input-daily-date"
                    value={daily.date}
                    readOnly={sourceReadOnly}
                    onChange={(e) =>
                      setDaily((d) => ({ ...d, date: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Waktu">
                  <input
                    type="time"
                    data-testid="input-daily-time"
                    value={daily.time}
                    readOnly={sourceReadOnly}
                    onChange={(e) =>
                      setDaily((d) => ({ ...d, time: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Jenis survei">
                  <Select
                    id="select-daily-survey-type"
                    value={daily.surveyType}
                    options={state.project.surveyTypes}
                    disabled={sourceReadOnly}
                    onChange={(v) => {
                      setDaily((d) => ({
                        ...d,
                        surveyType: v as SurveyType,
                        tool: dailyEquipment[v as SurveyType][0],
                        technicalData: {},
                        state: "Tercatat",
                      }));
                      setDailyTool({});
                    }}
                  />
                </Field>
                <Field label="Ruas">
                  <Select
                    id="select-daily-road"
                    value={daily.road}
                    options={state.project.routes}
                    disabled={sourceReadOnly}
                    onChange={(v) => setDaily((d) => ({ ...d, road: v }))}
                  />
                </Field>
                <Field label="Panjang cakupan (km; boleh 0 untuk objek/titik)">
                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    data-testid="input-daily-length"
                    value={daily.lengthKm}
                    readOnly={sourceReadOnly}
                    onChange={(e) =>
                      setDaily((d) => ({
                        ...d,
                        lengthKm: Number(e.target.value),
                      }))
                    }
                  />
                </Field>
                {daily.surveyType === "Lalu Lintas" && (
                  <Field label="Durasi data lalu lintas tersedia (menit)">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      data-testid="input-daily-traffic-duration"
                      value={daily.trafficDurationMinutes}
                      onChange={(e) =>
                        setDaily((d) => ({
                          ...d,
                          trafficDurationMinutes: Number(e.target.value),
                        }))
                      }
                    />
                  </Field>
                )}
                {daily.surveyType === "Lereng" && (
                  <Field label="Jenis keruntuhan lereng">
                    <input
                      data-testid="input-daily-slope-failure"
                      value={daily.slopeFailureType ?? ""}
                      onChange={(e) =>
                        setDaily((d) => ({
                          ...d,
                          slopeFailureType: e.target.value,
                        }))
                      }
                    />
                  </Field>
                )}
                <Field label="Lajur">
                  <input
                    data-testid="input-daily-lane"
                    value={daily.lane}
                    readOnly={sourceReadOnly}
                    onChange={(e) =>
                      setDaily((d) => ({ ...d, lane: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Arah">
                  <Select
                    id="select-daily-direction"
                    value={daily.direction}
                    options={["Normal", "Opposite"]}
                    disabled={sourceReadOnly}
                    onChange={(v) =>
                      setDaily((d) => ({
                        ...d,
                        direction: v as DailySurveyRecord["direction"],
                      }))
                    }
                  />
                </Field>
                <Field label="Cuaca">
                  <Select
                    id="select-daily-weather"
                    value={daily.weather}
                    options={["Cerah", "Berawan", "Hujan"]}
                    disabled={sourceReadOnly}
                    onChange={(v) =>
                      setDaily((d) => ({
                        ...d,
                        weather: v as DailySurveyRecord["weather"],
                      }))
                    }
                  />
                </Field>
                <Field label="Alat">
                  <Select
                    id="select-daily-tool"
                    value={daily.tool}
                    options={dailyEquipment[daily.surveyType]}
                    disabled={sourceReadOnly}
                    onChange={(v) =>
                      setDaily((d) => ({
                        ...d,
                        tool: v,
                        technicalData: {
                          ...d.technicalData,
                          ...(daily.surveyType === "IRI"
                            ? {
                                iriClass:
                                  v === "IRI Tipe Respon"
                                    ? "Kelas 3"
                                    : "Kelas 1",
                              }
                            : daily.surveyType === "Lendutan"
                              ? { method: v === "LWD" ? "LWD" : "FWD" }
                              : {}),
                        },
                      }))
                    }
                  />
                </Field>
                <Field label="Operator">
                  <input
                    data-testid="input-daily-operator"
                    value={daily.operator}
                    readOnly={sourceReadOnly}
                    onChange={(e) =>
                      setDaily((d) => ({ ...d, operator: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Pengemudi">
                  <input
                    data-testid="input-daily-driver"
                    value={daily.driver}
                    readOnly={sourceReadOnly}
                    onChange={(e) =>
                      setDaily((d) => ({ ...d, driver: e.target.value }))
                    }
                  />
                </Field>
                <Field label="POI">
                  <input
                    data-testid="input-daily-poi"
                    value={daily.poi}
                    readOnly={sourceReadOnly}
                    onChange={(e) =>
                      setDaily((d) => ({ ...d, poi: e.target.value }))
                    }
                  />
                </Field>
                {["IRI", "PCI"].includes(daily.surveyType) && (
                  <CheckRow
                    id="daily-surface-dry"
                    label="Permukaan kering"
                    checked={daily.surfaceDry}
                    onChange={(v) => setDaily((d) => ({ ...d, surfaceDry: v }))}
                  />
                )}
                {daily.surveyType === "PCI" && (
                  <CheckRow
                    id="daily-glare-free"
                    label="Tidak melawan silau matahari (citra)"
                    checked={daily.glareFree}
                    onChange={(v) => setDaily((d) => ({ ...d, glareFree: v }))}
                  />
                )}
                {daily.surveyType === "IRI" && (
                  <CheckRow
                    id="daily-speed-lane"
                    label="Kecepatan konstan & jejak roda sesuai"
                    checked={daily.speedAndLaneCompliant}
                    onChange={(v) =>
                      setDaily((d) => ({ ...d, speedAndLaneCompliant: v }))
                    }
                  />
                )}

                {dailyFields(daily).map((field) => (
                  <Field
                    key={field.key}
                    label={field.label.replace(" (simulasi)", "")}
                  >
                    {field.options ? (
                      <select
                        data-testid={`input-daily-technical-${field.key}`}
                        value={daily.technicalData?.[field.key] ?? ""}
                        disabled={sourceReadOnly}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDaily((d) => ({
                            ...d,
                            technicalData: {
                              ...d.technicalData,
                              [field.key]: value,
                            },
                            ...(field.key === "method"
                              ? {
                                  tool:
                                    value === "LWD" ? "LWD" : "FWD Dynatest",
                                }
                              : field.key === "iriClass"
                                ? {
                                    tool:
                                      value === "Kelas 3"
                                        ? "IRI Tipe Respon"
                                        : "Profilometer Laser",
                                  }
                                : {}),
                          }));
                          setDailyTool({});
                        }}
                      >
                        <option value="">Pilih…</option>
                        {field.options.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.numeric ? "number" : "text"}
                        step="any"
                        data-testid={`input-daily-technical-${field.key}`}
                        value={daily.technicalData?.[field.key] ?? ""}
                        readOnly={sourceReadOnly}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDaily((d) => ({
                            ...d,
                            technicalData: {
                              ...d.technicalData,
                              [field.key]: value,
                            },
                          }));
                        }}
                      />
                    )}
                  </Field>
                ))}
                <Field label="Faktor pengganggu">
                  <input
                    data-testid="input-daily-disturbances"
                    value={daily.disturbances}
                    onChange={(e) =>
                      setDaily((d) => ({ ...d, disturbances: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Catatan event">
                  <input
                    data-testid="input-daily-events"
                    value={daily.eventNotes}
                    onChange={(e) =>
                      setDaily((d) => ({ ...d, eventNotes: e.target.value }))
                    }
                  />
                </Field>
                <Field label="Ringkasan hasil / nilai referensi">
                  <input
                    data-testid="input-daily-raw"
                    value={daily.rawValue}
                    readOnly={sourceReadOnly}
                    onChange={(e) =>
                      setDaily((d) => ({ ...d, rawValue: e.target.value }))
                    }
                    placeholder={
                      sourceReadOnly
                        ? "Menunggu data dari sistem sumber"
                        : "Isi ringkasan dari sumber kegiatan"
                    }
                  />
                </Field>
                <Field label="Nilai yang ditampilkan di QA/QC">
                  <input
                    data-testid="input-daily-cleaned"
                    value={daily.rawValue}
                    readOnly
                  />
                </Field>
                <div className="wf-callout wf-field full">
                  Data sumber tetap menjadi referensi utama. Bila ada
                  ketidaksesuaian, catat temuan/tindak lanjut dan gunakan hasil
                  terbaru setelah perbaikan diverifikasi.
                </div>
              </div>
            )}
            <div
              className={`wf-callout ${gate ? "" : sourceReadOnly ? "" : "danger"}`}
              style={{ marginTop: 12 }}
            >
              {sourceReadOnly ? (
                "Status: menunggu data kegiatan dari sistem sumber."
              ) : (
                <>
                  Gerbang berantai <strong>{gate ? "LOLOS" : "TAHAN"}</strong>{" "}
                  · persiapan {preparationReady ? "lulus" : "tertahan"},
                  kalibrasi {calibrationReady ? "siap" : "tertahan"}, metode{" "}
                  {methodApproved ? "disetujui" : "belum disetujui"}, izin
                  jembatan{" "}
                  {!bridgePermitRequired || state.bridgeInspectionPermit
                    ? "siap"
                    : "tertahan"}
                  , kondisi lapangan{" "}
                  {fieldQuality ? "sesuai" : "perlu diperiksa"}.
                </>
              )}
            </div>
            {!!technicalErrors.length && (
              <div className="wf-callout warn" style={{ marginTop: 8 }}>
                <strong>Status kelengkapan:</strong>
                <div className="wf-pill-list" style={{ marginTop: 7 }}>
                  {incompleteItems.length > 0 && (
                    <span className="wf-pill">
                      {incompleteItems.length} data belum lengkap
                    </span>
                  )}
                  {checkItems.length > 0 && (
                    <span className="wf-pill">
                      {checkItems.length} hal perlu diperiksa
                    </span>
                  )}
                </div>
                <details style={{ marginTop: 7 }}>
                  <summary>Lihat rincian</summary>
                  <ul>
                    {technicalErrors.map((error, i) => (
                      <li key={`${i}-${error}`}>{error}</li>
                    ))}
                  </ul>
                </details>
              </div>
            )}
            <div className="wf-toolbar">
              <Button
                id="button-daily-resurvey"
                kind="danger"
                disabled={
                  sourceReadOnly ||
                  !stageReady ||
                  state.role !== "Penyedia Jasa / Ketua Tim"
                }
                onClick={() =>
                  setDaily((d) => ({ ...d, state: "Survei Ulang" }))
                }
              >
                <RotateCcw size={13} />
                Tandai survei ulang
              </Button>
              <Button
                id="button-daily-save"
                kind="primary"
                disabled={
                  sourceReadOnly ||
                  !stageReady ||
                  state.role !== "Penyedia Jasa / Ketua Tim" ||
                  (!fieldQuality && daily.state !== "Survei Ulang")
                }
                onClick={saveRecord}
              >
                <Save size={13} />
                {daily.state === "Survei Ulang"
                  ? "Catat kebutuhan survei ulang"
                  : "Catat lapangan"}
              </Button>
            </div>
          </Panel>
          <div>
            <Panel title="Pemeriksaan harian alat" icon={Wrench}>
              {sourceReadOnly ? (
                <div className="wf-callout">
                  Checklist harian akan mengikuti jenis alat/metode pada rekaman
                  yang diterima dari sistem sumber.
                </div>
              ) : (
                <>
                  {toolChecks.map((k) => (
                    <CheckRow
                      key={k}
                      id={`daily-tool-${testId(k)}`}
                      label={k}
                      checked={!!dailyTool[k]}
                      onChange={(v) => toggleMap(dailyTool, k, v, setDailyTool)}
                    />
                  ))}
                  <p className="wf-note">
                    Checklist tersimpan bersama rekaman saat dicatat.
                  </p>
                </>
              )}
            </Panel>
            <Panel title="Pengamanan data harian" icon={HardDrive}>
              <div className="wf-callout warn">
                Catat media pengamanan data yang digunakan untuk menjaga
                ketersediaan salinan kegiatan survei.
              </div>
              <div className="wf-pill-list">
                {[
                  "Perangkat kerja",
                  "Media eksternal",
                  "Penyimpanan jaringan",
                ].map((m) => (
                  <label className="wf-pill" key={m}>
                    <input
                      type="checkbox"
                      data-testid={`check-backup-media-${testId(m)}`}
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
                  id="button-create-daily-backup"
                  disabled={!state.dailyRecords.length}
                  onClick={makeBackup}
                >
                  <Archive size={13} />
                  Catat pengamanan
                </Button>
                <Badge tone="info">
                  {state.backups.length} catatan pengamanan
                </Badge>
              </div>
            </Panel>

          </div>
        </div>
      )}
      {!canEnterDaily && (
        <Panel title="Monitoring kegiatan lapangan" icon={Eye}>
          <div className="wf-callout">
            Pada peran ini, Survei Harian ditampilkan sebagai monitoring.
            Pencatatan kegiatan dan bukti dilakukan oleh Penyedia Jasa / Ketua
            Tim; Balai meninjau hasilnya pada proses verifikasi/validasi.
          </div>
          <div className="wf-kpis">
            <div className="wf-kpi">
              <div className="wf-kpi-label">Rekaman tercatat</div>
              <div className="wf-kpi-value">
                {
                  state.dailyRecords.filter((r) => r.state === "Tercatat")
                    .length
                }
              </div>
            </div>
            <div className="wf-kpi">
              <div className="wf-kpi-label">Data ditahan</div>
              <div className="wf-kpi-value">
                {state.dailyRecords.filter((r) => r.state === "Ditahan").length}
              </div>
            </div>
            <div className="wf-kpi">
              <div className="wf-kpi-label">Survei ulang</div>
              <div className="wf-kpi-value">
                {
                  state.dailyRecords.filter((r) => r.state === "Survei Ulang")
                    .length
                }
              </div>
            </div>
          </div>
        </Panel>
      )}
      <DocumentAttachments scope={`${state.project.id}:stage3a-${daily.surveyType}`} categories={[`Bukti kegiatan ${daily.surveyType}`, 'Checklist / catatan pemeriksaan harian', 'Pengamanan data harian']} editable={canEnterDaily}/>
      </div></RoleWorkSection>
      <details className="wf-panel"><summary className="wf-panel-head">Ringkasan monitoring</summary>{weeklySummary}{stage3AGate}</details>

    </>
  );
}
