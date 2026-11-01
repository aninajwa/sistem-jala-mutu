import { useState } from "react";
import type { PageProps } from "../../types";
import { documentRepository } from "../ba/documentRepository";
import { documentActors, DOCUMENT_STATUS_LABELS } from "../ba/documentWorkflow";
import { BA_TEMPLATES, type BaKind } from "../ba/docxEngine";
import {
  availablePeriods,
  documentStages,
  isPeriodicBa,
  documentPurposes,
  documentTitles,
} from "./documentCatalog";

type Props = {
  packages: PageProps["packages"];
  openPackageBA: PageProps["openPackageBA"];
  role: string;
};

export function DocumentPicker({ packages, openPackageBA, role }: Props) {
  const items = Object.values(packages);
  const [packageId, setPackage] = useState(items[0]?.project.id ?? "");
  const [chosenKind, setKind] = useState<BaKind>("kalibrasi");
  const [survey, setSurvey] = useState("");
  const [period, setPeriod] = useState(0);
  const [level, setLevel] = useState(1);

  const state = packages[packageId] ?? items[0];
  if (!state) return <p>Belum ada paket dalam cakupan akses Anda.</p>;
  const selectedSurvey = state.project.surveyTypes.includes(
    survey as (typeof state.project.surveyTypes)[number],
  ) ? survey : (state.project.surveyTypes[0] ?? "");
  const periods = availablePeriods(state);
  const effectivePeriod = periods.includes(period)
    ? period : (state.activeCyclePeriod ?? 1);

  // Daftar pekerjaan harus berasal dari pemilik tindakan dokumen,
  // bukan dari label sidebar atau asumsi bahwa semua BA milik Penyedia.
  const available = BA_TEMPLATES.flatMap((template) => {
    const kind = template.id;
    const levels = kind === "audit" ? [1, 2, 3] : [1];
    return levels.flatMap((auditLevel) => {
      const actors = documentActors({
        packageId: state.project.id,
        kind,
        survey: selectedSurvey,
        period: isPeriodicBa(kind) ? effectivePeriod : 0,
        auditLevel,
      });
      return actors.authors.includes(role as never)
        ? [{ kind, auditLevel, title: `${documentTitles[kind]}${kind === "audit" ? ` · Tingkat ${auditLevel}` : ""}` }]
        : [];
    });
  });

  const selected = available.find((option) =>
    option.kind === chosenKind && (chosenKind !== "audit" || option.auditLevel === level),
  ) ?? available[0];

  if (!selected) {
    return (
      <div className="document-picker">
        <p>Tidak ada format BA yang dapat Anda siapkan untuk paket ini.</p>
        <p className="wf-note">Dokumen yang di luar kewenangan tetap dapat ditelusuri melalui halaman monitoring atau arsip sesuai hak akses.</p>
      </div>
    );
  }

  const kind = selected.kind;
  const identity = {
    packageId: state.project.id,
    kind,
    survey: selectedSurvey,
    period: isPeriodicBa(kind) ? effectivePeriod : 0,
    auditLevel: selected.auditLevel,
  };
  const record = documentRepository.read(identity);
  const actors = documentActors(identity);
  const exists = Boolean(record.versions.length || Object.keys(record.draft).length);

  return (
    <div className="document-picker">
      <p>Dokumen dibuat untuk <strong>satu paket, jenis survei, dan kegiatan</strong> yang dipilih. Pilihan format di bawah hanya menampilkan pekerjaan yang menjadi kewenangan Anda.</p>
      <div className="document-filters">
        <label>
          Paket
          <select aria-label="Paket BA" value={state.project.id} onChange={(e) => {
            setPackage(e.target.value);
            setPeriod(0);
            setSurvey("");
            setKind("kalibrasi");
            setLevel(1);
          }}>
            {items.map((item) => <option key={item.project.id} value={item.project.id}>{item.project.packageName}</option>)}
          </select>
        </label>
        <label>
          Kegiatan / jenis dokumen
          <select
            aria-label="Jenis dokumen BA"
            value={`${selected.kind}:${selected.auditLevel}`}
            onChange={(e) => {
              const [nextKind, nextLevel] = e.target.value.split(":");
              setKind(nextKind as BaKind);
              setLevel(Number(nextLevel));
              setPeriod(0);
            }}
          >
            {available.map((option) =>
              <option key={`${option.kind}:${option.auditLevel}`} value={`${option.kind}:${option.auditLevel}`}>{option.title}</option>
            )}
          </select>
        </label>
        <label>
          Jenis survei dalam paket
          <select aria-label="Survei pilihan BA" value={selectedSurvey} onChange={(e) => setSurvey(e.target.value)}>
            {state.project.surveyTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        {isPeriodicBa(kind) && <label>
          Periode kegiatan
          <select aria-label="Periode pilihan BA" value={effectivePeriod} onChange={(e) => setPeriod(Number(e.target.value))}>
            {periods.map((n) => <option key={n} value={n}>Periode {n}{n === (state.activeCyclePeriod ?? 1) ? " · aktif" : ""}</option>)}
          </select>
        </label>}
      </div>
      <section aria-label="Ringkasan dokumen yang dipilih" className="wf-panel" style={{ marginTop: 12 }}>
        <div className="wf-body">
          <strong>{documentTitles[kind]}{kind === "audit" ? ` · Tingkat ${selected.auditLevel}` : ""}</strong>
          <p>{documentPurposes[kind]}</p>
          <p className="wf-note">Paket: {state.project.packageName} · Survei: {selectedSurvey} · {documentStages[kind].label}{isPeriodicBa(kind) ? ` · Periode ${effectivePeriod}` : " · Nonberkala"}</p>
          <p className="wf-note">Penanggung jawab: {actors.authors.join(" / ")} · Pemeriksa dokumen: {actors.reviewer}</p>
          <p role="status">{exists ? DOCUMENT_STATUS_LABELS[record.versions.at(-1)?.status ?? "local-draft"] : "Belum dibuat. Pemilihan format ini tidak membuat draft otomatis."}</p>
          <button
            type="button"
            className="btn primary"
            disabled={!selectedSurvey}
            onClick={() => openPackageBA(state.project.id, kind, {
              survey: selectedSurvey,
              period: isPeriodicBa(kind) ? effectivePeriod : 0,
              auditLevel: selected.auditLevel,
              returnTo: "/documents:Siapkan BA",
            })}
          >
            {exists ? "Buka / lengkapi BA" : "Mulai siapkan BA"}
          </button>
        </div>
      </section>
    </div>
  );
}
