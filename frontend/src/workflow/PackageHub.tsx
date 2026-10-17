import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  LockKeyhole,
  MapPinned,
  MessageSquareText,
  ShieldCheck,
} from 'lucide-react';

import type {
  OperationalWorkflowState,
  WorkflowRole,
} from './model';

import {
  derivePackageStage,
  packageStatus,
  packageWaitingFor,
} from './packageStore';

import {
  PACKAGE_WORKFLOW_ITEMS,
  packageMenuLabel,
  stageIndexFromCode,
} from './roleNavigation';

export { packageMenuLabel } from './roleNavigation';

function lockReason(index: number) {
  if (index <= 0) return '';

  return `Menunggu ${PACKAGE_WORKFLOW_ITEMS[index - 1].shortLabel} selesai dan memenuhi gerbang QA/QC.`;
}

function nextAction(state: OperationalWorkflowState) {
  const stage = derivePackageStage(state);
  const role = state.role;
  const waiting = packageWaitingFor(state);

  const stageItem =
    PACKAGE_WORKFLOW_ITEMS.find(item => item.code === stage) ??
    PACKAGE_WORKFLOW_ITEMS[PACKAGE_WORKFLOW_ITEMS.length - 1];

  if (stage === 'Selesai') {
    return {
      label: 'Paket telah selesai',
      detail: 'Seluruh rangkaian QA/QC dan penerimaan telah diselesaikan.',
      button: 'Lihat Ringkasan',
      selection: '/packages:Ringkasan Paket',
      passive: true,
    };
  }

  if (waiting === 'PIC Balai') {
    if (role === 'PIC Balai / Pengguna Jasa') {
      return {
        label: 'Pengajuan menunggu review Anda',
        detail: `${stageItem.label} telah diajukan dan siap diperiksa.`,
        button: 'Buka Review',
        selection: stageItem.selection,
        passive: false,
      };
    }

    return {
      label: 'Menunggu Review PIC Balai',
      detail:
        'Pengajuan telah dikirim. Data tetap dapat dilihat, tetapi perubahan menunggu hasil review.',
      button: 'Lihat Pengajuan',
      selection: stageItem.selection,
      passive: true,
    };
  }

  if (waiting === 'Direktorat') {
    if (role === 'Direktorat / Pusat') {
      return {
        label: 'Audit memerlukan tindak lanjut Direktorat',
        detail: 'Paket telah mencapai pemeriksaan yang menjadi kewenangan Direktorat.',
        button: 'Buka Audit',
        selection: '/verification:Audit tingkat 1â€“3',
        passive: false,
      };
    }

    return {
      label: 'Menunggu Pemeriksaan Direktorat',
      detail: 'Tahap audit sedang menunggu assurance Direktorat.',
      button: 'Lihat Status',
      selection: '/verification:Audit tingkat 1â€“3',
      passive: true,
    };
  }

  if (waiting === 'Penyedia') {
    if (role === 'Penyedia Jasa / Ketua Tim') {
      return {
        label: `Lanjutkan ${stageItem.shortLabel}`,
        detail: 'Lengkapi data, bukti, dan checklist yang menjadi tanggung jawab Penyedia.',
        button: 'Lanjutkan Pekerjaan',
        selection: stageItem.selection,
        passive: false,
      };
    }

    return {
      label: 'Menunggu Penyedia',
      detail:
        'Paket sedang menunggu kelengkapan atau tindakan perbaikan dari Penyedia.',
      button: 'Lihat Status',
      selection: stageItem.selection,
      passive: true,
    };
  }

  return {
    label: stageItem.label,
    detail: stageItem.actorHint,
    button: 'Buka',
    selection: stageItem.selection,
    passive: false,
  };
}

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
        {rows.map(state => {
          const stage = derivePackageStage(state);

          const findings = state.corrections.filter(
            item => item.status !== 'Ditutup',
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
                    {state.project.routes.join(', ')}
                  </span>
                </div>

                <div className="package-scope">
                  {state.project.surveyTypes.map(type => (
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
                  <strong>{packageStatus(state)}</strong>
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

export function PackageContextHeader({
  state,
  onBack,
  onNavigate,
}: {
  state: OperationalWorkflowState;
  onBack: () => void;
  onNavigate: (selection: string) => void;
}) {
  const stage = derivePackageStage(state);
  const currentIndex = stageIndexFromCode(stage);
  const completed = stage === 'Selesai';

  return (
    <section className="package-context">
      <div className="package-context-top">
        <button className="wf-button" onClick={onBack}>
          <ArrowLeft size={13} />
          Daftar Paket
        </button>

        <div className="package-context-title">
          <span>{state.project.id}</span>
          <strong>{state.project.packageName}</strong>
        </div>

        <div className="package-context-status">
          <span>{stage}</span>
          <span>{packageStatus(state)}</span>
          <span>Menunggu {packageWaitingFor(state)}</span>
        </div>
      </div>

      <div className="package-context-grid">
        <div>
          <small>Balai</small>
          <strong>{state.project.balai}</strong>
        </div>

        <div>
          <small>Satker</small>
          <strong>{state.project.satker}</strong>
        </div>

        <div>
          <small>PPK</small>
          <strong>{state.project.ppk}</strong>
        </div>

        <div>
          <small>Ruas</small>
          <strong>{state.project.routes.join(', ')}</strong>
        </div>

        <div className="wide">
          <small>Lingkup survei</small>

          <div className="package-scope">
            {state.project.surveyTypes.map(type => (
              <span key={type}>{type}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="package-progress-rail">
        {PACKAGE_WORKFLOW_ITEMS.map((item, index) => {
          const locked = !completed && index > currentIndex;
          const current = !completed && index === currentIndex;
          const done = completed || index < currentIndex;

          return (
            <button
              key={item.code}
              type="button"
              disabled={locked}
              className={[
                'package-progress-step',
                current ? 'current' : '',
                done ? 'done' : '',
                locked ? 'locked' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              title={locked ? lockReason(index) : item.label}
              onClick={() => !locked && onNavigate(item.selection)}
            >
              <span className="package-progress-number">
                {done ? (
                  <CheckCircle2 size={13} />
                ) : locked ? (
                  <LockKeyhole size={12} />
                ) : (
                  index + 1
                )}
              </span>

              <span className="package-progress-copy">
                <small>{item.code}</small>
                <strong>{item.shortLabel}</strong>
              </span>
            </button>
          );
        })}
      </div>

      <div className="package-context-actions">
        <button
          className="wf-button"
          onClick={() => onNavigate('/documents:BA & dokumen workflow')}
        >
          <FileText size={13} />
          Dokumen
        </button>

        <button
          className="wf-button"
          onClick={() => onNavigate('/actions:Koreksi berbukti')}
        >
          <ShieldCheck size={13} />
          Temuan & Perbaikan
        </button>
      </div>
    </section>
  );
}

export function PackageOverview({
  state,
  onNavigate,
}: {
  state: OperationalWorkflowState;
  onNavigate: (selection: string) => void;
}) {
  const stage = derivePackageStage(state);
  const currentIndex = stageIndexFromCode(stage);
  const completed = stage === 'Selesai';
  const action = nextAction(state);

  const openFindings = state.corrections.filter(
    item => item.status !== 'Ditutup',
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
          className={`wf-button ${action.passive ? '' : 'primary'}`}
          onClick={() => onNavigate(action.selection)}
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
            {packageStatus(state)}
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

      <section className="wf-panel">
        <div className="wf-panel-head">
          <h3>
            <ClipboardList size={14} />
            Progres QA/QC Paket
          </h3>
        </div>

        <div className="wf-body">
          <div className="package-flow-list">
            {PACKAGE_WORKFLOW_ITEMS.map((item, index) => {
              const locked = !completed && index > currentIndex;
              const current = !completed && index === currentIndex;
              const done = completed || index < currentIndex;

              return (
                <button
                  key={item.code}
                  type="button"
                  disabled={locked}
                  className={[
                    'package-flow-row',
                    current ? 'current' : '',
                    done ? 'done' : '',
                    locked ? 'locked' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => !locked && onNavigate(item.selection)}
                >
                  <div className="package-flow-icon">
                    {done ? (
                      <CheckCircle2 size={16} />
                    ) : locked ? (
                      <LockKeyhole size={15} />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  <div className="package-flow-copy">
                    <small>{item.code}</small>
                    <strong>{item.label}</strong>

                    <span>
                      {locked
                        ? lockReason(index)
                        : current
                          ? 'Sedang berjalan'
                          : done
                            ? 'Selesai'
                            : ''}
                    </span>
                  </div>

                  <div className="package-flow-status">
                    {locked
                      ? 'Terkunci'
                      : current
                        ? 'Sedang berjalan'
                        : done
                          ? 'Selesai'
                          : 'Buka'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {openFindings.length > 0 && (
        <section className="wf-panel">
          <div className="wf-panel-head">
            <h3>
              <MessageSquareText size={14} />
              Catatan & Temuan yang Perlu Ditindaklanjuti
            </h3>
          </div>

          <div className="wf-body">
            {openFindings.map(item => (
              <div className="package-finding-card" key={item.id}>
                <div>
                  <small>PERLU TINDAK LANJUT</small>

                  <strong>
                    {item.id} Â· {item.surveyType}
                  </strong>

                  <span>
                    {item.road} Â· {item.stationing}
                  </span>

                  {item.rejectionReason && (
                    <p>{item.rejectionReason}</p>
                  )}
                </div>

                <button
                  className="wf-button"
                  onClick={() => onNavigate('/actions:Koreksi berbukti')}
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
