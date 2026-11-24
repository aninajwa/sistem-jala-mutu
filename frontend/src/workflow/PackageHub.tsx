import { StageNavigator } from "../design/b/StageNavigator";
import "./checkpoint09.css";
import { useWorkflowReconciliation } from "../hooks/useWorkflowReconciliation";
import { workflowFormIssues } from "./repository/workflowReconciliation";
import { serverStageFactFor, UNKNOWN_AGGREGATE_STATUS, type ServerStageFacts } from './serverPackageStatus';
import { declaredPackageSurveyScopeMessage } from './declaredPackageSurveyScope';
import type { PackageWorkflowItem } from './roleNavigation';

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  MapPinned,
  MessageSquareText,
} from "lucide-react";

import type { OperationalWorkflowState, WorkflowRole } from "./model";

import {
  derivePackageStage,
  packageStatus,
  packageWaitingFor,
} from "./packageStore";

import { PACKAGE_WORKFLOW_ITEMS, packageMenuLabel } from "./roleNavigation";

export { packageMenuLabel } from "./roleNavigation";

/* =====================================================
   INFORMASI TINDAKAN BERIKUTNYA
   ===================================================== */

function nextAction(state: OperationalWorkflowState) {
  const pendingCorrections = state.corrections.filter(
    (item) => item.status !== "Ditutup",
  );
  if (state.role === "Penyedia Jasa / Ketua Tim" && pendingCorrections.length) {
    return {
      label: `${pendingCorrections.length} temuan perlu tindak lanjut`,
      detail:
        "Buka daftar temuan, lengkapi tindakan dan bukti, lalu ajukan pemeriksaan ulang. Data survei sumber tidak diubah di sini.",
      button: "Tindak lanjuti temuan",
      selection: "/actions:Koreksi berbukti",
      passive: false,
    };
  }
  const issues = workflowFormIssues(state);
  if (issues.length) {
    const target = PACKAGE_WORKFLOW_ITEMS.find(
      (item) => item.code === issues[0].stage,
    );
    const issue = issues[0];
    const level = issue.message.match(/Audit Tingkat ([123])/i)?.[1];
    const actor = level
      ? [
          "Penyedia Jasa / Ketua Tim",
          "PIC Balai / Pengguna Jasa",
          "Direktorat / Pusat",
        ][Number(level) - 1]
      : issue.stage === "Tahap 6" ||
          /V&V Bersama|bertahap Balai/.test(issue.message)
        ? "PIC Balai / Pengguna Jasa"
        : "Penyedia Jasa / Ketua Tim";
    const canEdit = state.role === actor;
    return {
      label: canEdit
        ? "Lengkapi formulir yang tertahan"
        : "Formulir belum lengkap",
      detail: canEdit
        ? issues[0].message
        : "Persyaratan yang belum dilengkapi dapat dipantau di tahap terkait. Isian milik petugas lain tidak dapat Anda ubah.",
      button: canEdit ? "Buka pekerjaan" : "Lihat status",
      selection: target?.selection ?? "/packages:Ringkasan Paket",
      passive: !canEdit,
    };
  }

  const stage = derivePackageStage(state);
  const role = state.role;
  const waiting = packageWaitingFor(state);

  const stageItem =
    PACKAGE_WORKFLOW_ITEMS.find((item) => item.code === stage) ??
    PACKAGE_WORKFLOW_ITEMS[PACKAGE_WORKFLOW_ITEMS.length - 1];

  if (stage === "Selesai") {
    return {
      label: "Paket telah selesai",
      detail: "Seluruh rangkaian QA/QC dan penerimaan telah diselesaikan.",
      button: "Lihat Ringkasan",
      selection: "/packages:Ringkasan Paket",
      passive: true,
    };
  }

  if (waiting === "PIC Balai") {
    if (role === "PIC Balai / Pengguna Jasa") {
      return {
        label: "Pengajuan menunggu review Anda",
        detail: `${stageItem.label} telah diajukan dan siap diperiksa.`,
        button: "Buka Review",
        selection: stageItem.selection,
        passive: false,
      };
    }

    return {
      label: "Menunggu Review PIC Balai",
      detail:
        "Pengajuan telah dikirim. Data dapat dilihat sambil menunggu hasil review.",
      button: "Lihat Pengajuan",
      selection: stageItem.selection,
      passive: true,
    };
  }

  if (waiting === "Direktorat") {
    const selection =
      PACKAGE_WORKFLOW_ITEMS.find((item) => item.code === "Tahap 5")
        ?.selection ?? "/packages:Ringkasan Paket";

    if (role === "Direktorat / Pusat") {
      return {
        label: "Audit memerlukan pemeriksaan Direktorat",
        detail: "Paket memerlukan tindakan sesuai kewenangan Direktorat.",
        button: "Buka Audit",
        selection,
        passive: false,
      };
    }

    return {
      label: "Menunggu Pemeriksaan Direktorat",
      detail: "Paket sedang menunggu pemeriksaan tingkat pusat.",
      button: "Lihat Status",
      selection,
      passive: true,
    };
  }

  if (waiting === "Penyedia") {
    if (role === "Penyedia Jasa / Ketua Tim") {
      return {
        label: `Lanjutkan ${stageItem.shortLabel}`,
        detail:
          "Lengkapi pekerjaan, data, dan bukti yang menjadi tanggung jawab Penyedia.",
        button: "Lanjutkan Pekerjaan",
        selection: stageItem.selection,
        passive: false,
      };
    }

    return {
      label: "Menunggu Penyedia",
      detail: "Paket menunggu kelengkapan atau tindak lanjut dari Penyedia.",
      button: "Lihat Status",
      selection: stageItem.selection,
      passive: true,
    };
  }

  return {
    label: stageItem.label,
    detail: stageItem.actorHint,
    button: "Buka",
    selection: stageItem.selection,
    passive: false,
  };
}

/* =====================================================
   HALAMAN DAFTAR PAKET
   ===================================================== */

export function PackagesPage({
  packages,
  role,
  onOpen,
}: {
  packages: Record<string, OperationalWorkflowState>;
  role: WorkflowRole;
  onOpen: (id: string) => void;
}) {
  const rows = Object.values(packages);

  return (
    <div className="package-page">
      <div className="package-page-head">
        <div>
          <div className="eyebrow">PAKET KONTRAK QA/QC</div>

          <h2>{packageMenuLabel(role)}</h2>

          <p>
            Pilih paket untuk melihat proses QA/QC dari persiapan sampai
            penerimaan data.
          </p>
        </div>

        <span className="package-count">{rows.length} paket</span>
      </div>

      <div className="package-list">
        {rows.map((state) => {
          const stage = derivePackageStage(state);

          const findings = state.corrections.filter(
            (item) => item.status !== "Ditutup",
          ).length;

          return (
            <article
              className="package-card"
              key={state.project.id}
              data-testid={`package-card-${state.project.id}`}
            >
              <div className="package-card-main">
                <div className="package-id">{state.project.id}</div>

                <h3>{state.project.packageName}</h3>

                <div className="package-meta">
                  <span>
                    <Building2 size={13} />
                    {state.project.balai}
                  </span>

                  <span>
                    <MapPinned size={13} />
                    {state.project.routes.length ? state.project.routes.join(", ") : "Lintas Koridor Balai"}
                  </span>
                </div>

                <div className="package-scope">
                  {state.project.surveyTypes.map((type) => (
                    <span key={type}>{type}</span>
                  ))}
                </div>
              </div>

              <div className="package-card-status">
                <div>
                  <small>Posisi proses</small>
                  <strong>{stage}</strong>
                </div>

                <div>
                  <small>Status</small>
                  <strong>
                    {workflowFormIssues(state).length
                      ? "Perlu pemeriksaan formulir"
                      : packageStatus(state)}
                  </strong>
                </div>

                <div>
                  <small>Menunggu</small>
                  <strong>{packageWaitingFor(state)}</strong>
                </div>

                <div>
                  <small>Temuan aktif</small>
                  <strong>{findings}</strong>
                </div>

                <button
                  type="button"
                  className="wf-button primary"
                  onClick={() => onOpen(state.project.id)}
                >
                  Buka Paket
                  <ArrowRight size={13} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* =====================================================
   HEADER DETAIL PAKET
   ===================================================== */

export function PackageContextHeader({
  state,
  selection,
  onBack,
  onNavigate,
  serverReadOnly = false,
  serverStageStatuses,
}: {
  state: OperationalWorkflowState;
  selection?: string;
  onBack: () => void;
  onNavigate?: (selection: string) => void;
  onCorrections?: () => void;
  serverReadOnly?: boolean;
  serverStageStatuses?: ServerStageFacts;
}) {
  const issues = useWorkflowReconciliation(state);
  const current = PACKAGE_WORKFLOW_ITEMS.find(
    (item) => item.selection === selection,
  );
  // Server mode: position follows server stage facts, never the local demo derivation.
  const process = serverReadOnly ? serverProcessStage(serverStageStatuses) : derivePackageStage(state);
  const identity: Array<[string, string]> = [
    ["Balai", state.project.balai],
    ["Penyedia", state.project.contractor],
    ["Satker", state.project.satker],
    ["PPK", state.project.ppk],
    ["Ruas", state.project.routes.join(", ")],
    ["Jenis survei", state.project.surveyTypes.join(", ")],
    [
      "Jadwal",
      `${state.project.surveyStartDate || "Belum diisi"} — ${state.project.surveyEndDate || "Belum diisi"}`,
    ],
  ];
  return (
    <header
      className="package-context ui09-package-header"
      aria-label="Konteks paket aktif"
    >
      <div className="ui09-package-title">
        <button type="button" className="wf-button" onClick={onBack}>
          <ArrowLeft size={15} /> Daftar paket
        </button>
        <div>
          <span className="ui09-meta">
            {state.project.contractNumber || state.project.id}
          </span>
          <h1>{state.project.packageName}</h1>
        </div>
        <span className={`wf-status ${serverReadOnly && serverStageStatuses?.["Tahap 6"]?.state === "complete" ? "ok" : "info"}`} data-testid="package-header-status">
          {serverReadOnly && serverStageStatuses?.["Tahap 6"]?.state === "complete" ? "Paket SELESAI" : serverReadOnly ? serverStageFactFor(process as PackageWorkflowItem["code"], serverStageStatuses).label : issues.length ? "Perlu pemeriksaan" : packageStatus(state)}
        </span>
      </div>
      <StageNavigator
        selection={selection}
        process={process}
        onNavigate={onNavigate}
        completedStages={serverReadOnly ? serverCompletedStages(serverStageStatuses) : undefined}
      />
      <div className="ui09-package-compact">
        <span className="ui09-package-position">
          {current
            ? `${current.code} · ${current.shortLabel}`
            : selection === "/packages:Ringkasan Paket"
              ? `Ringkasan · Posisi ${process}`
              : `Posisi ${process}`}
        </span>
        <details className="ui09-package-info">
          <summary>Informasi paket</summary>
          <div className="package-context-grid">
            {identity.map(([label, value]) => (
              <div key={label}>
                <small>{label}</small>
                <strong>{value || "Belum diisi"}</strong>
              </div>
            ))}
          </div>
          {serverReadOnly && (
            <p className="ui09-aggregate-detail" role="note">
              {UNKNOWN_AGGREGATE_STATUS}. Status dan persetujuan per tahap hanya ditampilkan jika tersedia dari sumber server.
            </p>
          )}
          {!serverReadOnly && issues.length > 0 && (
            <details className="ui09-source-issues">
              <summary>{issues.length} kelengkapan perlu ditinjau</summary>
              <ul>
                {issues.map((issue, index) => (
                  <li key={index}>
                    {issue.stage} · {issue.message}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </details>
      </div>
    </header>
  );
}

/* =====================================================
   RINGKASAN PAKET
   ===================================================== */

export function PackageOverview({
  state,
  onNavigate,
  onCorrections,
  serverReadOnly = false,
  serverStageStatuses,
}: {
  state: OperationalWorkflowState;
  onNavigate: (selection: string) => void;
  onCorrections: () => void;
  serverReadOnly?: boolean;
  serverStageStatuses?: ServerStageFacts;
}) {
  const stage = derivePackageStage(state);
  const sourceIssues=useWorkflowReconciliation(state);
  if (serverReadOnly) {
    const preparation = serverStageFactFor('Tahap 0', serverStageStatuses);
    const approved = preparation.state === 'complete';
    return <div className="package-overview ui09-server-overview">
      <section className="wf-panel" data-testid="package-survey-scope">
        <div className="wf-panel-head"><h3>Jenis survei dalam paket</h3></div>
        <div className="wf-body package-scope">
          {(state.project.surveyScopeSurveys ?? []).length
            ? state.project.surveyScopeSurveys!.map(type => <span key={type.jenis_survei_id}>{type.nama || type.kode || `Survei #${type.jenis_survei_id}`}{type.aktif === false ? ' · nonaktif' : ''}</span>)
            : <span className="package-scope-unavailable">{declaredPackageSurveyScopeMessage(
              state.project.surveyScopeDeclaredStatus,
              state.project.surveyScopeStatus === 'loading' || state.project.surveyScopeStatus === 'error'
                ? state.project.surveyScopeStatus
                : undefined,
            )}</span>}
          {state.project.surveyScopeStatus !== 'loading' && state.project.surveyScopeStatus !== 'error' && (
            <p className="wf-note">Asosiasi lokasi adalah pengamatan paket di lokasi_pekerjaan; tabel kontrak tidak menyimpan deklarasi scope survei. Tim/kalibrasi adalah rekod kerja terpisah.</p>
          )}
        </div>
      </section>
      <section className="package-next-action" aria-label="Status server paket">
        <div className="package-next-copy">
          <small>FAKTA TAHAP DARI SERVER</small>
          <strong>{preparation.label}</strong>
          <span>{approved
            ? 'Persetujuan persiapan tercatat. Buka tahap berikutnya untuk melihat data dan persyaratannya; memilih halaman tidak mengubah status workflow.'
            : 'Ringkasan status keseluruhan belum tersedia. Periksa persiapan untuk melihat status dan tindakan yang memang diizinkan.'}</span>
        </div>
        <button type="button" className="wf-button primary" onClick={() => onNavigate(approved ? '/documents:Kalibrasi & personel' : '/entry:Persiapan & SPMK')}>
          {approved ? 'Lihat Tahap 1' : 'Lihat Persiapan'} <ArrowRight size={13}/>
        </button>
      </section>
    </div>;
  }
  const action = nextAction(state);

  const openFindings = state.corrections.filter(
    (item) => item.status !== "Ditutup",
  );

  return (
    <div className="package-overview">
      <section className="package-next-action">
        <div className="package-next-icon">
          <ArrowRight size={18} />
        </div>

        <div className="package-next-copy">
          <small>YANG PERLU DILAKUKAN SEKARANG</small>
          <strong>{action.label}</strong>
          <span>{action.detail}</span>
        </div>

        <button
          type="button"
          className={`wf-button ${action.passive ? "" : "primary"}`}
          onClick={() =>
            action.selection === "/actions:Koreksi berbukti"
              ? onCorrections()
              : onNavigate(action.selection)
          }
        >
          {action.button}
          <ArrowRight size={13} />
        </button>
      </section>

      <div className="wf-kpis">
        <div className="wf-kpi">
          <div className="wf-kpi-label">Posisi saat ini</div>
          <div className="wf-kpi-value">{stage}</div>
        </div>

        <div className="wf-kpi">
          <div className="wf-kpi-label">Status paket</div>
          <div className="wf-kpi-value" style={{ fontSize: 14 }}>
            {workflowFormIssues(state).length
              ? "Perlu pemeriksaan formulir"
              : packageStatus(state)}
          </div>
        </div>

        <div className="wf-kpi">
          <div className="wf-kpi-label">Menunggu</div>
          <div className="wf-kpi-value" style={{ fontSize: 14 }}>
            {packageWaitingFor(state)}
          </div>
        </div>

        <div className="wf-kpi">
          <div className="wf-kpi-label">Temuan aktif</div>
          <div className="wf-kpi-value">{openFindings.length}</div>
        </div>
      </div>

      {openFindings.length > 0 && (
        <section className="wf-panel">
          <div className="wf-panel-head">
            <h3>
              <MessageSquareText size={14} />
              Catatan & Temuan yang Perlu Ditindaklanjuti
            </h3>
          </div>

          <div className="wf-body">
            {openFindings.map((item) => (
              <div className="package-finding-card" key={item.id}>
                <div>
                  <small>PERLU TINDAK LANJUT</small>

                  <strong>
                    {item.id} · {item.surveyType}
                  </strong>

                  <span>
                    {item.road} · {item.stationing}
                  </span>

                  {item.rejectionReason && <p>{item.rejectionReason}</p>}
                </div>

                <button
                  type="button"
                  className="wf-button"
                  onClick={onCorrections}
                >
                  Buka Tindakan Perbaikan
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Stages the server reports complete; drives the done marks on the stage rail. */
function serverCompletedStages(facts?: ServerStageFacts): ReadonlySet<string> {
  return new Set(PACKAGE_WORKFLOW_ITEMS.filter(item => serverStageFactFor(item.code, facts).state === "complete").map(item => item.code));
}

/** First workflow stage that the server has not reported complete. */
function serverProcessStage(facts?: ServerStageFacts): string {
  for (const item of PACKAGE_WORKFLOW_ITEMS) {
    if (serverStageFactFor(item.code, facts).state !== "complete") return item.code;
  }
  return "Selesai";
}
