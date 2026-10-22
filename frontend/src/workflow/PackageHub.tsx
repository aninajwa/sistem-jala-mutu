import {useWorkflowReconciliation} from '../hooks/useWorkflowReconciliation';
import {workflowFormIssues} from './repository/workflowReconciliation';

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
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
} from './roleNavigation';

import {
  getStageDisplayStatus,
  getStageDisplayLabel,
} from './stagePresentation';

export { packageMenuLabel } from './roleNavigation';

/* =====================================================
   INFORMASI TINDAKAN BERIKUTNYA
   ===================================================== */

function nextAction(state: OperationalWorkflowState) {
  const pendingCorrections=state.corrections.filter(item=>item.status!=='Ditutup');
  if(state.role==='Penyedia Jasa / Ketua Tim'&&pendingCorrections.length){return {label:`${pendingCorrections.length} temuan perlu tindak lanjut`,detail:'Buka daftar temuan, lengkapi tindakan dan bukti, lalu ajukan pemeriksaan ulang. Data survei sumber tidak diubah di sini.',button:'Tindak lanjuti temuan',selection:'/actions:Koreksi berbukti',passive:false};}
  const issues=workflowFormIssues(state);if(issues.length){const target=PACKAGE_WORKFLOW_ITEMS.find(item=>item.code===issues[0].stage);const canEdit=state.role==='Penyedia Jasa / Ketua Tim';return {label:canEdit?'Lengkapi formulir yang tertahan':'Formulir belum lengkap',detail:canEdit?issues[0].message:'Persyaratan yang belum dilengkapi dapat dipantau di tahap terkait. Isian milik petugas lain tidak dapat Anda ubah.',button:canEdit?'Buka pekerjaan':'Lihat status',selection:target?.selection??'/packages:Ringkasan Paket',passive:!canEdit};}

  const stage = derivePackageStage(state);
  const role = state.role;
  const waiting = packageWaitingFor(state);

  const stageItem =
    PACKAGE_WORKFLOW_ITEMS.find(
      item => item.code === stage,
    ) ?? PACKAGE_WORKFLOW_ITEMS[
      PACKAGE_WORKFLOW_ITEMS.length - 1
    ];

  if (stage === 'Selesai') {
    return {
      label: 'Paket telah selesai',
      detail:
        'Seluruh rangkaian QA/QC dan penerimaan telah diselesaikan.',
      button: 'Lihat Ringkasan',
      selection: '/packages:Ringkasan Paket',
      passive: true,
    };
  }

  if (waiting === 'PIC Balai') {
    if (role === 'PIC Balai / Pengguna Jasa') {
      return {
        label: 'Pengajuan menunggu review Anda',
        detail:
          `${stageItem.label} telah diajukan dan siap diperiksa.`,
        button: 'Buka Review',
        selection: stageItem.selection,
        passive: false,
      };
    }

    return {
      label: 'Menunggu Review PIC Balai',
      detail:
        'Pengajuan telah dikirim. Data dapat dilihat sambil menunggu hasil review.',
      button: 'Lihat Pengajuan',
      selection: stageItem.selection,
      passive: true,
    };
  }

  if (waiting === 'Direktorat') {
    const selection =
      PACKAGE_WORKFLOW_ITEMS.find(
        item => item.code === 'Tahap 5',
      )?.selection ?? '/packages:Ringkasan Paket';

    if (role === 'Direktorat / Pusat') {
      return {
        label: 'Audit memerlukan pemeriksaan Direktorat',
        detail:
          'Paket memerlukan tindakan sesuai kewenangan Direktorat.',
        button: 'Buka Audit',
        selection,
        passive: false,
      };
    }

    return {
      label: 'Menunggu Pemeriksaan Direktorat',
      detail:
        'Paket sedang menunggu pemeriksaan tingkat pusat.',
      button: 'Lihat Status',
      selection,
      passive: true,
    };
  }

  if (waiting === 'Penyedia') {
    if (role === 'Penyedia Jasa / Ketua Tim') {
      return {
        label: `Lanjutkan ${stageItem.shortLabel}`,
        detail:
          'Lengkapi pekerjaan, data, dan bukti yang menjadi tanggung jawab Penyedia.',
        button: 'Lanjutkan Pekerjaan',
        selection: stageItem.selection,
        passive: false,
      };
    }

    return {
      label: 'Menunggu Penyedia',
      detail:
        'Paket menunggu kelengkapan atau tindak lanjut dari Penyedia.',
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
          <div className="eyebrow">
            PAKET KONTRAK QA/QC
          </div>

          <h2>{packageMenuLabel(role)}</h2>

          <p>
            Pilih paket untuk melihat proses QA/QC
            dari persiapan sampai penerimaan data.
          </p>
        </div>

        <span className="package-count">
          {rows.length} paket
        </span>
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
                <div className="package-id">
                  {state.project.id}
                </div>

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
                  <strong>{workflowFormIssues(state).length?'Perlu pemeriksaan formulir':packageStatus(state)}</strong>
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

export function PackageContextHeader({state,selection,onBack,onNavigate}:{state:OperationalWorkflowState;selection?:string;onBack:()=>void;onNavigate:(selection:string)=>void}){
 const stage=derivePackageStage(state);const formIssues=useWorkflowReconciliation(state);
 return <section className="package-context compact-context">
 <div className="package-context-top"><button className="wf-button" onClick={onBack}><ArrowLeft size={14}/> Daftar paket</button><span className="wf-status info">{formIssues.length?'Perlu pemeriksaan formulir':packageStatus(state)}</span><span className="wf-note">{formIssues.length?'Kelengkapan formulir perlu ditinjau':`Menunggu ${packageWaitingFor(state)}`}</span></div>
 {formIssues.length>0&&<details className="wf-note"><summary>{formIssues.length} kelengkapan formulir perlu ditinjau · keputusan lama tetap diarsipkan</summary><ul>{formIssues.map((issue,index)=><li key={index}>{issue.stage} · {issue.message}</li>)}</ul></details>}
 <div className="package-identity"><div><div className="eyebrow">{state.project.contractNumber||state.project.id}</div><h1>{state.project.packageName}</h1><p>{state.project.balai} · {state.project.semester} · {state.project.surveyStartDate||'Jadwal belum diisi'} — {state.project.surveyEndDate||'Belum diisi'}</p></div><div className="package-context-actions"><button className="wf-button" onClick={()=>onNavigate('/packages:Ringkasan Paket')}>Ringkasan</button><button className="wf-button" onClick={()=>onNavigate('/documents:BA & dokumen workflow')}><FileText size={14}/> Dokumen & BA</button><button className="wf-button" onClick={()=>onNavigate('/actions:Koreksi berbukti')}><ShieldCheck size={14}/> Tindak lanjut</button></div></div>
 <details className="package-identity-detail"><summary>Identitas kontrak dan lingkup</summary><div className="package-context-grid">{[['Penyedia',state.project.contractor],['Satker',state.project.satker],['PPK',state.project.ppk],['Ruas',state.project.routes.join(', ')],['Jenis survei',state.project.surveyTypes.join(', ')]].map(([label,value])=><div key={label}><small>{label}</small><strong>{value||'Belum diisi'}</strong></div>)}</div></details>
 <label className="package-stage-picker">Tahap yang dibuka<select aria-label="Tahap paket yang dibuka" value={PACKAGE_WORKFLOW_ITEMS.some(item=>item.selection===selection)?selection:''} onChange={event=>{if(event.target.value)onNavigate(event.target.value);}}><option value="">{selection==='/packages:Ringkasan Paket'?'Ringkasan paket':'Dokumen dan kegiatan pendukung'}</option>{PACKAGE_WORKFLOW_ITEMS.map(item=><option key={item.code} value={item.selection}>{item.code} · {item.shortLabel} · {(formIssues.some(issue=>issue.stage===item.code)||item.code==='Tahap 6'&&formIssues.length>0)?'Perlu pemeriksaan formulir':getStageDisplayStatus(state,item.code)==='completed'?'Selesai':stage===item.code?'Dalam proses':'Lihat tahap'}</option>)}</select></label>
 </section>;
}

/* =====================================================
   RINGKASAN PAKET
   ===================================================== */

export function PackageOverview({
  state,
  onNavigate,
}: {
  state: OperationalWorkflowState;
  onNavigate: (selection: string) => void;
}) {
  const stage = derivePackageStage(state);
  const sourceIssues=useWorkflowReconciliation(state);
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
          <small>
            YANG PERLU DILAKUKAN SEKARANG
          </small>
          <strong>{action.label}</strong>
          <span>{action.detail}</span>
        </div>

        <button
          type="button"
          className={`wf-button ${
            action.passive ? '' : 'primary'
          }`}
          onClick={() => onNavigate(action.selection)}
        >
          {action.button}
          <ArrowRight size={13} />
        </button>
      </section>

      <div className="wf-kpis">
        <div className="wf-kpi">
          <div className="wf-kpi-label">
            Posisi saat ini
          </div>
          <div className="wf-kpi-value">
            {stage}
          </div>
        </div>

        <div className="wf-kpi">
          <div className="wf-kpi-label">
            Status paket
          </div>
          <div
            className="wf-kpi-value"
            style={{ fontSize: 14 }}
          >
            {workflowFormIssues(state).length?'Perlu pemeriksaan formulir':packageStatus(state)}
          </div>
        </div>

        <div className="wf-kpi">
          <div className="wf-kpi-label">
            Menunggu
          </div>
          <div
            className="wf-kpi-value"
            style={{ fontSize: 14 }}
          >
            {packageWaitingFor(state)}
          </div>
        </div>

        <div className="wf-kpi">
          <div className="wf-kpi-label">
            Temuan aktif
          </div>
          <div className="wf-kpi-value">
            {openFindings.length}
          </div>
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
            {PACKAGE_WORKFLOW_ITEMS.map(item => {
              const displayStatus =
                getStageDisplayStatus(
                  state,
                  item.code,
                );

              const held=sourceIssues.some(issue=>issue.stage===item.code)||item.code==='Tahap 6'&&sourceIssues.length>0;
              const current =
                displayStatus === 'current';

              const done =
                displayStatus === 'completed'&&!held;

              const upcoming =
                displayStatus === 'upcoming';

              return (
                <button
                  key={item.code}
                  type="button"
                  aria-label={`${item.label}. ${held?'Perlu pemeriksaan formulir':getStageDisplayLabel(displayStatus)}`}
                  className={[
                    'package-flow-row',
                    current ? 'current' : '',
                    done ? 'done' : '',
                    upcoming ? 'upcoming' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() =>
                    onNavigate(item.selection)
                  }
                >
                  <div className="package-flow-icon">
                    {done ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <span>
                        {item.code.replace('Tahap ', '')}
                      </span>
                    )}
                  </div>

                  <div className="package-flow-copy">
                    <small>{item.code}</small>
                    <strong>{item.label}</strong>

                    <span>
                      {held?'Perlu pemeriksaan formulir':current
                        ? 'Posisi proses saat ini'
                        : getStageDisplayLabel(
                            displayStatus,
                          )}
                    </span>
                  </div>

                  <div className="package-flow-status">
                    {held?'Perlu pemeriksaan':current
                      ? 'Sedang berjalan'
                      : done
                        ? 'Tahap sebelumnya'
                        : 'Belum aktif'}
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
              Catatan & Temuan yang Perlu
              Ditindaklanjuti
            </h3>
          </div>

          <div className="wf-body">
            {openFindings.map(item => (
              <div
                className="package-finding-card"
                key={item.id}
              >
                <div>
                  <small>
                    PERLU TINDAK LANJUT
                  </small>

                  <strong>
                    {item.id} · {item.surveyType}
                  </strong>

                  <span>
                    {item.road} · {item.stationing}
                  </span>

                  {item.rejectionReason && (
                    <p>{item.rejectionReason}</p>
                  )}
                </div>

                <button
                  type="button"
                  className="wf-button"
                  onClick={() =>
                    onNavigate(
                      '/actions:Koreksi berbukti',
                    )
                  }
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
