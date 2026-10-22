import {RoleWorkSection} from '../RoleWorkSection';
import {usePersistedDraft} from '../../hooks/usePersistedDraft';
import {
  ArrowRight,
  ClipboardCheck,
  FileText,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

import { EvidenceAttachment } from "../EvidenceAttachment";
import { CalibrationRecord, daysBetween, SurveyType } from "../model";
import { SourceAlignmentChecklist } from "../SourceAlignmentChecklist";

import type { WorkflowStageProps } from "./stageSupport";
import {
  Badge,
  Button,
  dailyEquipment,
  Field,
  idNow,
  invalidateDependentStages,
  Panel,
} from "./stageSupport";
import { useWorkflowStage } from "./useWorkflowStage";

export function Stage1CalibrationWorkspace(props: WorkflowStageProps) {
  const { selection, state, onUpdate, setNotice, onNavigate } = props;
  const { baAccess, commit, heading } = useWorkflowStage(props);
  const [draft,setDraft]=usePersistedDraft<Record<string,string>>(`jala-ui-draft:${state.project.id}:${state.role}:Stage1CalibrationWorkspace`,{});
  const [newCalibration, setNewCalibration] = usePersistedDraft<Partial<CalibrationRecord>>(`jala-ui-draft:${state.project.id}:${state.role}:newCalibration`,{});
  const [calEditId, setCalEditId] = useState("");
  const [calibrationSurvey, setCalibrationSurvey] = useState<SurveyType>(
    state.project.surveyTypes[0] || "IRI",
  );
  const [calFormOpen, setCalFormOpen] = useState(false);
  const [calFormRecordId, setCalFormRecordId] = useState("");

  /*
   * Tahap 1:
   * - Penyedia melengkapi penugasan alat/personel dan bukti.
   * - Checklist mengikuti lampiran Kalibrasi & Validasi.
   * - Kesiapan dihitung sistem.
   * - PIC Balai / Direktorat membaca secara read-only.
   *
   * Tidak ada approval Balai khusus di Tahap 1.
   */

  const canEditCalibration = state.role === "Penyedia Jasa / Ketua Tim";

  const scopedSurveyTypes = state.project.surveyTypes;

  const activeSurvey = scopedSurveyTypes.includes(calibrationSurvey)
    ? calibrationSurvey
    : scopedSurveyTypes[0] || "IRI";

  const equipmentForSurvey = dailyEquipment[activeSurvey] || [];

  const surveyRecords = state.calibrations.filter(
    (record) => record.surveyType === activeSurvey,
  );

  const isCalibrationRecordReady = (record: CalibrationRecord) =>
    record.condition === "Baik" &&
    daysBetween(state.simulationDate, record.dueDate) >= 0 &&
    record.qualificationValid &&
    record.trainingVerified;

  const [sourceCompletion,setSourceCompletion]=useState<Record<string,boolean>>({});
  const isSurveyReady = (type: SurveyType) => {
    const records = state.calibrations.filter(
      (record) => record.surveyType === type,
    );

    return (
      records.length > 0 &&
      records.every(isCalibrationRecordReady) &&
      !!state.calibrationChecklist[type]
    );
  };

  const readySurveyCount = scopedSurveyTypes.filter(isSurveyReady).length;

  const allSurveyReady =
    scopedSurveyTypes.length > 0 &&
    readySurveyCount === scopedSurveyTypes.length;

  const setTypeCheck = (type: SurveyType, value: boolean) => {
    if (!canEditCalibration||state.calibrationChecklist[type]===value) return;

    commit(`Checklist kalibrasi & validasi ${type}`, type, (s) => ({
      ...invalidateDependentStages(
        s,
        `Checklist kalibrasi ${type} berubah; validasi dan audit harus diperiksa kembali.`,
      ),
      calibrationChecklist: {
        ...s.calibrationChecklist,
        [type]: value,
      },
    }));
  };

  const beginAddCalibration = () => {
    if (!canEditCalibration) return;

    const id = idNow("CAL");

    setCalEditId("");
    setCalFormRecordId(id);

    setNewCalibration({
      id,
      surveyType: activeSurvey,
      equipment: equipmentForSurvey[0] || "",
      condition: "Baik",
      calibrationKind: "Referensi tahunan",
      lastCalibrated: state.simulationDate,
      dueDate: state.simulationDate,
      qualificationValid: false,
      trainingVerified: false,
    });

    setCalFormOpen(true);
  };

  const beginEditCalibration = (record: CalibrationRecord) => {
    if (!canEditCalibration) return;

    setCalibrationSurvey(record.surveyType || activeSurvey);

    setCalEditId(record.id);
    setCalFormRecordId(record.id);
    setNewCalibration({
      ...record,
    });

    setCalFormOpen(true);
  };

  const cancelCalibrationForm = () => {
    setCalFormOpen(false);
    setCalEditId("");
    setCalFormRecordId("");
    setNewCalibration({});
  };

  const addCalibration = () => {
    if (!canEditCalibration) {
      setNotice(
        "Hanya Penyedia Jasa / Ketua Tim yang dapat mengubah penugasan alat dan personel.",
      );
      return;
    }

    const surveyType = newCalibration.surveyType || activeSurvey;

    if (
      !newCalibration.equipment?.trim() ||
      !newCalibration.serialNumber?.trim() ||
      !newCalibration.personInCharge?.trim() ||
      !newCalibration.dueDate?.trim()
    ) {
      setNotice(
        "Jenis survei, alat, nomor seri, PIC/personel, dan masa berlaku wajib dilengkapi.",
      );
      return;
    }

    if (!newCalibration.standardReference?.trim()) {
      setNotice("Metode atau standar kalibrasi/validasi wajib dicatat.");
      return;
    }

    const lastCalibrated =
      newCalibration.lastCalibrated || state.simulationDate;

    const dueDate = newCalibration.dueDate || state.simulationDate;

    if (dueDate < lastCalibrated) {
      setNotice(
        "Tanggal berlaku tidak boleh lebih awal dari tanggal kalibrasi.",
      );
      return;
    }

    const recordId = calFormRecordId || calEditId || idNow("CAL");

    const rec: CalibrationRecord = {
      id: recordId,
      equipment: newCalibration.equipment,
      serialNumber: newCalibration.serialNumber,
      year:
        Number(newCalibration.year) ||
        new Date(state.simulationDate).getFullYear(),
      condition: newCalibration.condition || "Baik",
      calibrationKind: newCalibration.calibrationKind || "Referensi tahunan",
      lastCalibrated,
      dueDate,
      personInCharge: newCalibration.personInCharge,
      qualificationValid: !!newCalibration.qualificationValid,
      trainingVerified: !!newCalibration.trainingVerified,
      standardReference: newCalibration.standardReference || "",
      certificateReference: newCalibration.certificateReference || "",
      surveyType,
    };

    commit(
      calEditId
        ? "Perbarui penugasan alat & personel"
        : "Tambah penugasan alat & personel",
      `${surveyType} · ${rec.equipment}`,
      (s) => ({
        ...invalidateDependentStages(
          s,
          "Data alat/personel berubah; kesiapan dan validasi produksi perlu diperiksa kembali.",
        ),

        calibrations: calEditId
          ? s.calibrations.map((item) => (item.id === calEditId ? rec : item))
          : [...s.calibrations, rec],
      }),
      calEditId
        ? "Penugasan alat/personel diperbarui."
        : "Penugasan alat/personel ditambahkan.",
    );

    setCalibrationSurvey(surveyType);

    cancelCalibrationForm();
  };

  const changeSurvey = (type: SurveyType) => {
    setCalibrationSurvey(type);
    setCalFormOpen(false);
    setCalEditId("");
    setCalFormRecordId("");
    setNewCalibration({});
  };

  return (
    <>
      {heading(
        "Tahap 1 · kesiapan",
        "Kalibrasi & Validasi Awal",
        "Pastikan alat, personel, kalibrasi/validasi, kualifikasi dan bukti pendukung siap sebelum uji coba produksi.",
      )}
      <div className="workflow-data-origin">
        <span className="origin-badge provider">PENYEDIA</span>

        <div>
          <strong>Penugasan alat, personel dan bukti kesiapan</strong>

          <span>
            Penyedia melengkapi data yang digunakan pada paket. PIC Balai dan
            Direktorat membacanya secara read-only.
          </span>
        </div>
      </div>

      {/* ================================================
            JENIS SURVEI
            ================================================ */}

      <Panel title="Jenis Survei" icon={ClipboardCheck}>
        <div className="calibration-survey-tabs">
          {scopedSurveyTypes.map((type) => (
            <button
              type="button"
              key={type}
              className={`wf-button ${activeSurvey === type ? "primary" : ""}`}
              onClick={() => changeSurvey(type)}
            >
              {type}

              <span
                className={`calibration-tab-status ${
                  isSurveyReady(type) ? "ready" : ""
                }`}
              >
                {isSurveyReady(type) ? "Siap" : "Belum siap"}
              </span>
            </button>
          ))}
        </div>
      </Panel>

      {/* ================================================
            ALAT & PERSONEL TERSIMPAN
            ================================================ */}

      <Panel
        title={`Alat & Personel Paket · ${activeSurvey}`}
        icon={ShieldCheck}
      >
        <div className="calibration-panel-heading">
          <div>
            <strong>Penugasan yang sudah tersimpan</strong>

            <span>
              Alat yang ditampilkan mengikuti jenis survei yang dipilih.
            </span>
          </div>

          {canEditCalibration && !calFormOpen && (
            <Button
              id="button-open-calibration-form"
              kind="primary"
              onClick={beginAddCalibration}
            >
              <Plus size={13} />
              Tambah penugasan
            </Button>
          )}
        </div>

        {surveyRecords.length === 0 ? (
          <div className="wf-callout warn">
            Belum ada alat/personel yang ditugaskan untuk {activeSurvey}.
          </div>
        ) : (
          <div className="calibration-record-list">
            {surveyRecords.map((record) => {
              const ready = isCalibrationRecordReady(record);

              return (
                <details className="calibration-record-card" key={record.id}>
                  <summary>
                    <div className="calibration-record-summary">
                      <div>
                        <strong>{record.equipment}</strong>

                        <span>
                          {record.serialNumber}
                          {" · "}
                          {record.personInCharge}
                        </span>
                      </div>

                      <Badge tone={ready ? "good" : "warn"}>
                        {ready ? "Siap" : "Perlu dilengkapi"}
                      </Badge>
                    </div>
                  </summary>

                  <div className="calibration-record-detail">
                    <div className="package-readonly-grid">
                      <div>
                        <small>Jenis survei</small>
                        <strong>{record.surveyType}</strong>
                      </div>

                      <div>
                        <small>Kondisi</small>
                        <strong>{record.condition}</strong>
                      </div>

                      <div>
                        <small>Kalibrasi</small>
                        <strong>{record.calibrationKind}</strong>
                      </div>

                      <div>
                        <small>Kalibrasi terakhir</small>
                        <strong>{record.lastCalibrated}</strong>
                      </div>

                      <div>
                        <small>Berlaku sampai</small>
                        <strong>{record.dueDate}</strong>
                      </div>

                      <div>
                        <small>PIC / personel</small>
                        <strong>{record.personInCharge}</strong>
                      </div>
                    </div>

                    <div className="calibration-record-flags">
                      <Badge tone={record.qualificationValid ? "good" : "warn"}>
                        {record.qualificationValid
                          ? "Kualifikasi tercatat"
                          : "Kualifikasi belum tercatat"}
                      </Badge>

                      <Badge tone={record.trainingVerified ? "good" : "warn"}>
                        {record.trainingVerified
                          ? "Pelatihan tercatat"
                          : "Pelatihan belum tercatat"}
                      </Badge>
                    </div>

                    <div className="calibration-record-evidence">
                      <EvidenceAttachment
                        packageId={state.project.id}
                        evidenceId={`calibration-certificate-${record.id}`}
                        label="Sertifikat / bukti kalibrasi"
                        editable={false}
                        compact
                      />

                      <EvidenceAttachment
                        packageId={state.project.id}
                        evidenceId={`calibration-person-${record.id}`}
                        label="Bukti kualifikasi / pelatihan"
                        editable={false}
                        compact
                      />
                    </div>

                    {canEditCalibration && (
                      <div className="wf-toolbar">
                        <Button
                          id={`button-edit-calibration-${record.id}`}
                          onClick={() => beginEditCalibration(record)}
                        >
                          Edit penugasan
                        </Button>
                      </div>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </Panel>

      {/* ================================================
            FORM TAMBAH / EDIT
            hanya muncul ketika user meminta
            ================================================ */}

      {canEditCalibration && calFormOpen && (
        <Panel
          title={
            calEditId
              ? "Edit Penugasan Alat & Personel"
              : "Tambah Penugasan Alat & Personel"
          }
          icon={Plus}
        >
          <div className="workflow-data-origin">
            <span className="origin-badge provider">INPUT PENYEDIA</span>

            <div>
              <strong>
                {calEditId ? "Perbarui rekaman" : "Tambahkan rekaman baru"}
              </strong>

              <span>
                Isi berdasarkan alat dan personel yang benar-benar digunakan
                pada jenis survei ini.
              </span>
            </div>
          </div>

          <div className="wf-fields">
            <Field label="Jenis survei">
              <select
                value={newCalibration.surveyType || activeSurvey}
                onChange={(e) => {
                  const type = e.target.value as SurveyType;

                  setCalibrationSurvey(type);

                  setNewCalibration((previous) => ({
                    ...previous,
                    surveyType: type,
                    equipment: dailyEquipment[type]?.[0] || "",
                  }));
                }}
              >
                {scopedSurveyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Alat">
              <select
                value={newCalibration.equipment || ""}
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    equipment: e.target.value,
                  }))
                }
              >
                {(
                  dailyEquipment[
                    (newCalibration.surveyType || activeSurvey) as SurveyType
                  ] || []
                ).map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Nomor seri">
              <input
                value={newCalibration.serialNumber || ""}
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    serialNumber: e.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Tahun alat">
              <input
                type="number"
                value={newCalibration.year || ""}
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    year: Number(e.target.value),
                  }))
                }
              />
            </Field>

            <Field label="Kondisi">
              <select
                value={newCalibration.condition || "Baik"}
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    condition: e.target.value,
                  }))
                }
              >
                <option>Baik</option>
                <option>Perlu servis</option>
                <option>Tidak layak</option>
              </select>
            </Field>

            <Field label="Jenis kalibrasi">
              <select
                value={newCalibration.calibrationKind || "Referensi tahunan"}
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    calibrationKind: e.target
                      .value as CalibrationRecord["calibrationKind"],
                  }))
                }
              >
                <option>Referensi tahunan</option>
                <option>Relatif berkala</option>
              </select>
            </Field>

            <Field label="PIC / personel">
              <input
                value={newCalibration.personInCharge || ""}
                placeholder="Nama personel"
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    personInCharge: e.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Kalibrasi terakhir">
              <input
                type="date"
                value={newCalibration.lastCalibrated || state.simulationDate}
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    lastCalibrated: e.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Berlaku sampai">
              <input
                type="date"
                value={newCalibration.dueDate || state.simulationDate}
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    dueDate: e.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Metode / standar kalibrasi">
              <input
                value={newCalibration.standardReference || ""}
                placeholder="Nomor / nama metode atau standar"
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    standardReference: e.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Nomor / referensi sertifikat">
              <input
                value={newCalibration.certificateReference || ""}
                placeholder="Nomor sertifikat / dokumen"
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    certificateReference: e.target.value,
                  }))
                }
              />
            </Field>
          </div>

          <div className="calibration-form-checks">
            <label className="wf-pill">
              <input
                type="checkbox"
                checked={!!newCalibration.qualificationValid}
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    qualificationValid: e.target.checked,
                  }))
                }
              />
              Kualifikasi personel tercatat
            </label>

            <label className="wf-pill">
              <input
                type="checkbox"
                checked={!!newCalibration.trainingVerified}
                onChange={(e) =>
                  setNewCalibration((previous) => ({
                    ...previous,
                    trainingVerified: e.target.checked,
                  }))
                }
              />
              Pelatihan / kompetensi tercatat
            </label>
          </div>

          <div className="calibration-form-evidence">
            <EvidenceAttachment
              packageId={state.project.id}
              evidenceId={`calibration-certificate-${calFormRecordId}`}
              label="Sertifikat / bukti kalibrasi"
              description="Unggah dokumen bila tersedia, atau catat nomor/referensi sertifikat pada form."
              editable
              compact
            />

            <EvidenceAttachment
              packageId={state.project.id}
              evidenceId={`calibration-person-${calFormRecordId}`}
              label="Bukti kualifikasi / pelatihan"
              description="Dokumen kualifikasi, kompetensi atau pelatihan personel."
              editable
              compact
            />
          </div>

          <div className="wf-toolbar calibration-form-actions">
            <Button
              id="button-cancel-calibration"
              onClick={cancelCalibrationForm}
            >
              Batal
            </Button>

            <Button
              id="button-save-calibration"
              kind="primary"
              onClick={addCalibration}
            >
              {calEditId ? "Simpan Perubahan" : "Simpan Penugasan"}
            </Button>
          </div>
        </Panel>
      )}

      {/* ================================================
            CHECKLIST DRAFT PP
            ================================================ */}

      <RoleWorkSection primary={canEditCalibration} title="Formulir kalibrasi Penyedia"><SourceAlignmentChecklist pciManual={state.productionTests.PCI.pciManual!==false}
        projectInfo={state.project}
        packageId={state.project.id}
        phase="calibration"
        surveyTypes={[activeSurvey]}
        role={state.role}
        editableRoles={["Penyedia Jasa / Ketua Tim"]}
        title={`Checklist Kalibrasi & Validasi · ${activeSurvey}`}
        defaultSurvey={activeSurvey}
        hideSurveySelector
        onCompletionChange={(survey,complete)=>setSourceCompletion(old=>old[survey]===complete?old:{...old,[survey]:complete})}
        onAnswersChanged={()=>{if(state.calibrationChecklist[activeSurvey])setTypeCheck(activeSurvey,false);}}
      /></RoleWorkSection>

      {/* ================================================
            STATUS OTOMATIS
            ================================================ */}

      {canEditCalibration&&<div className="wf-toolbar"><button type="button" className="wf-button primary" data-testid="button-save-source-calibration" disabled={!sourceCompletion[activeSurvey]} onClick={()=>{if(canEditCalibration&&sourceCompletion[activeSurvey]){setTypeCheck(activeSurvey,true);setNotice('Hasil checklist kalibrasi disimpan.');}}}>Simpan hasil checklist {activeSurvey}</button><span className="wf-note">Membuka halaman tidak mengubah persetujuan. Perubahan jawaban harus diperiksa dan disimpan kembali.</span></div>}
      <Panel title="Kesiapan per Jenis Survei" icon={ShieldCheck}>
        <div className="calibration-readiness-list">
          {scopedSurveyTypes.map((type) => {
            const records = state.calibrations.filter(
              (record) => record.surveyType === type,
            );

            const recordsReady =
              records.length > 0 && records.every(isCalibrationRecordReady);

            const checklistReady = !!state.calibrationChecklist[type];

            const ready = recordsReady && checklistReady;

            return (
              <div className="wf-row" key={type}>
                <div>
                  <strong>{type}</strong>

                  <span
                    className="wf-note"
                    style={{
                      display: "block",
                    }}
                  >
                    {!records.length
                      ? "Belum ada penugasan alat/personel."
                      : !recordsReady
                        ? "Kesiapan alat/personel belum terpenuhi."
                        : !checklistReady
                          ? "Checklist Kalibrasi & Validasi belum lengkap."
                          : "Siap untuk masuk Validasi Produksi."}
                  </span>
                </div>

                <Badge tone={ready ? "good" : "warn"}>
                  {ready ? "Siap" : "Belum siap"}
                </Badge>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* ================================================
            CTA TAHAP BERIKUTNYA
            ================================================ */}

      <Panel title="Tahap Berikutnya" icon={ArrowRight}>
        <div className="stage-next-action">
          <div>
            <strong>
              {allSurveyReady
                ? "Kalibrasi & Validasi Awal siap"
                : `${readySurveyCount} dari ${scopedSurveyTypes.length} jenis survei siap`}
            </strong>

            <span>
              Tahap Validasi Produksi terbuka setelah seluruh jenis survei dalam
              lingkup memenuhi kesiapan.
            </span>
          </div>

          <Button
            id="button-stage1-next"
            kind="primary"
            disabled={!allSurveyReady}
            onClick={() => onNavigate("/entry:Validasi produksi")}
          >
            Lanjut ke Validasi Produksi
            <ArrowRight size={13} />
          </Button>
        </div>
      </Panel>

      <details className="stage-document-details"><summary>Dokumen hasil pemeriksaan · Berita Acara Kalibrasi dan Validasi</summary>
      <Panel title="Berita Acara Kalibrasi dan Validasi" icon={FileText}>
        <p className="wf-note">
          Setelah data alat, personel, dan hasil kalibrasi dicatat, susun satu
          draft BA untuk jenis survei terkait. Hasil validasi produksi dari
          Tahap 2 dapat ikut ditampilkan sebagai data pendukung.
        </p>
        {baAccess("kalibrasi", "Buka BA Kalibrasi & Validasi")}
      </Panel>
      </details>
    </>
  );
}
