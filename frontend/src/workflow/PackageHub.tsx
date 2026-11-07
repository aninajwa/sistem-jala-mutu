import {PackageStageNavigator} from './Checkpoint09Package';
import {packageStageStatus} from './Checkpoint09Package';
import './checkpoint09.css';
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
  const issues=workflowFormIssues(state);if(issues.length){const target=PACKAGE_WORKFLOW_ITEMS.find(item=>item.code===issues[0].stage);const issue=issues[0];const level=issue.message.match(/Audit Tingkat ([123])/i)?.[1];const actor=level?(['Penyedia Jasa / Ketua Tim','PIC Balai / Pengguna Jasa','Direktorat / Pusat'][Number(level)-1]):issue.stage==='Tahap 6'||/V&V Bersama|bertahap Balai/.test(issue.message)?'PIC Balai / Pengguna Jasa':'Penyedia Jasa / Ketua Tim';const canEdit=state.role===actor;return {label:canEdit?'Lengkapi formulir yang tertahan':'Formulir belum lengkap',detail:canEdit?issues[0].message:'Persyaratan yang belum dilengkapi dapat dipantau di tahap terkait. Isian milik petugas lain tidak dapat Anda ubah.',button:canEdit?'Buka pekerjaan':'Lihat status',selection:target?.selection??'/packages:Ringkasan Paket',passive:!canEdit};}

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

export function PackageContextHeader({state,selection,onBack,onNavigate,onCorrections,serverReadOnly=false}:{state:OperationalWorkflowState;selection?:string;onBack:()=>void;onNavigate:(selection:string)=>void;onCorrections:()=>void;serverReadOnly?:boolean}){
 const issues=useWorkflowReconciliation(state);
 return <header className="package-context ui09-package-header">
  <div className="ui09-package-title"><button type="button" className="wf-button" onClick={onBack}><ArrowLeft size={15}/> Daftar paket</button><div><span className="ui09-meta">{state.project.contractNumber||state.project.id}</span><h1>{state.project.packageName}</h1></div><span className="wf-status info">{serverReadOnly?'Status workflow belum terhubung':issues.length?'Perlu pemeriksaan':packageStatus(state)}</span></div>
  <div className="ui09-package-tools"><details className="ui09-package-info"><summary>Identitas & status paket</summary><div className="package-context-grid">{[['Balai',state.project.balai],['Penyedia',state.project.contractor],['Satker',state.project.satker],['PPK',state.project.ppk],['Ruas',state.project.routes.join(', ')],['Jenis survei',state.project.surveyTypes.join(', ')],['Jadwal',`${state.project.surveyStartDate||'Belum diisi'} — ${state.project.surveyEndDate||'Belum diisi'}`]].map(([label,value])=><div key={label}><small>{label}</small><strong>{value||'Belum diisi'}</strong></div>)}</div>{issues.length>0&&<details className="ui09-source-issues"><summary>{issues.length} kelengkapan perlu ditinjau</summary><ul>{issues.map((issue,index)=><li key={index}>{issue.stage} · {issue.message}</li>)}</ul></details>}</details><div className="package-context-actions"><button type="button" className="wf-button" aria-current={selection==='/packages:Ringkasan Paket'?'page':undefined} onClick={()=>onNavigate('/packages:Ringkasan Paket')}>Ringkasan</button><button type="button" className="wf-button" onClick={()=>onNavigate('/documents:Semua')}><FileText size={14}/> Dokumen & BA</button><button type="button" className="wf-button" onClick={onCorrections}><ShieldCheck size={14}/> Tindak lanjut</button></div></div>
  <PackageStageNavigator state={state} selection={selection} onNavigate={onNavigate} serverReadOnly={serverReadOnly}/>
 </header>;
}

/* =====================================================
   RINGKASAN PAKET
   ===================================================== */

export function PackageOverview({
  state,
  onNavigate,
  onCorrections,
  serverReadOnly = false,
}: {
  state: OperationalWorkflowState;
  onNavigate: (selection: string) => void;
  onCorrections: () => void;
  serverReadOnly?: boolean;
}) {
  const stage = derivePackageStage(state);
  const sourceIssues=useWorkflowReconciliation(state);
  const action = serverReadOnly
    ? { label:'Workflow belum terhubung ke server', detail:'Ringkasan tahap, temuan dan tindakan berikutnya hanya akan dipaparkan setelah data server dipetakan.', button:'Buka Tahap 0', selection:'/entry:Persiapan & SPMK', passive:true }
    : nextAction(state);

  const openFindings = serverReadOnly ? [] : state.corrections.filter(
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
          onClick={() => action.selection==='/actions:Koreksi berbukti'?onCorrections():onNavigate(action.selection)}
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
            {serverReadOnly?'Belum terhubung ke server':stage}
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
            {serverReadOnly?'Belum terhubung ke server':workflowFormIssues(state).length?'Perlu pemeriksaan formulir':packageStatus(state)}
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
            {serverReadOnly?'Belum terhubung ke server':packageWaitingFor(state)}
          </div>
        </div>

        <div className="wf-kpi">
          <div className="wf-kpi-label">
            Temuan aktif
          </div>
          <div className="wf-kpi-value">
            {serverReadOnly?'—':openFindings.length}
          </div>
        </div>
      </div>

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
