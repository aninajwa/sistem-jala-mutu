import {workflowFormIssues} from './repository/workflowReconciliation';
import {PACKAGE_WORKFLOW_ITEMS} from './roleNavigation';

import { ArrowRight, Route } from 'lucide-react';

import type {
  OperationalWorkflowState,
} from './model';

import {
  derivePackageStage,
} from './packageStore';

export type NextWorkflowAction = {
  title: string;
  detail: string;
  selection: string;
  stage: string;
};

const PROVIDER_ACTIONS: Record<
  string,
  NextWorkflowAction
> = {
  'Tahap 0': {
    stage: 'Tahap 0',
    title: 'Lengkapi persiapan dan Laporan Pendahuluan',
    detail:
      'Lengkapi dokumen persiapan dan ajukan hasil kepada PIC Balai untuk ditinjau.',
    selection: '/entry:Persiapan & SPMK',
  },
  'Tahap 1': {
    stage: 'Tahap 1',
    title: 'Lengkapi kalibrasi dan validasi awal',
    detail:
      'Periksa kesiapan alat, personel, sertifikat, dan checklist berdasarkan jenis survei.',
    selection: '/documents:Kalibrasi & personel',
  },
  'Tahap 2': {
    stage: 'Tahap 2',
    title: 'Lengkapi validasi produksi data',
    detail:
      'Siapkan hasil uji, data pendukung, dan permintaan review kepada PIC Balai.',
    selection: '/entry:Validasi produksi',
  },
  'Tahap 3A': {
    stage: 'Tahap 3A',
    title: 'Catat kegiatan survei harian',
    detail:
      'Catat kegiatan lapangan, pemeriksaan peralatan, dan bukti pelaksanaan.',
    selection: '/entry:Survei harian',
  },
  'Tahap 3B': {
    stage: 'Tahap 3B',
    title: 'Lengkapi pemeriksaan berkala',
    detail:
      'Periksa konsistensi, validasi internal, V&V berkala, dan tindak lanjut temuan.',
    selection: '/verification:Verval 14 hari',
  },
  'Tahap 4': {
    stage: 'Tahap 4',
    title: 'Siapkan data dan pemeriksaan bertahap',
    detail:
      'Periksa kelengkapan data, kesesuaian referensi, dan hasil validasi sistem sumber.',
    selection: '/entry:Gerbang RNI/LRS',
  },
  'Tahap 5': {
    stage: 'Tahap 5',
    title: 'Lanjutkan audit data',
    detail:
      'Laksanakan pemeriksaan dan review audit berdasarkan kewenangan masing-masing pihak.',
    selection: '/verification:Audit tingkat 1–3',
  },
  'Tahap 6': {
    stage: 'Tahap 6',
    title: 'Lengkapi proses penerimaan data',
    detail:
      'Periksa persyaratan penerimaan, hasil audit, serta berita acara terkait.',
    selection: '/reports:Penerimaan & termin',
  },
  Selesai: {
    stage: 'Selesai',
    title: 'Pantau dokumen dan hasil penerimaan',
    detail:
      'Seluruh status tahapan yang tercatat telah mencapai kondisi selesai.',
    selection: '/reports:Penerimaan & termin',
  },
};

export function getNextWorkflowAction(
  state: OperationalWorkflowState,
): NextWorkflowAction {
  const role = state.role;
  const stage = derivePackageStage(state);
  const missing=workflowFormIssues(state).sort((a,b)=>PACKAGE_WORKFLOW_ITEMS.findIndex(item=>item.code===a.stage)-PACKAGE_WORKFLOW_ITEMS.findIndex(item=>item.code===b.stage))[0];
  if(missing&&role!=='Admin'){const item=PACKAGE_WORKFLOW_ITEMS.find(item=>item.code===missing.stage);if(item)return {stage:item.code,selection:item.selection,title:'Periksa ulang kelengkapan formulir',detail:missing.message};}

  if (role === 'Penyedia Jasa / Ketua Tim') {
    return PROVIDER_ACTIONS[stage] ??
      PROVIDER_ACTIONS['Tahap 0'];
  }

  if (role === 'PIC Balai / Pengguna Jasa') {
    if (state.project.preparation.reportApproval === 'Diajukan') {
      return {
        stage: 'Tahap 0',
        title: 'Review Laporan Pendahuluan',
        detail: 'Tinjau hasil persiapan dan catat keputusan review.',
        selection: '/entry:Persiapan & SPMK',
      };
    }

    if (
      state.productionApproval === 'Diajukan' ||
      state.productionApproval === 'Perlu Revisi'
    ) {
      return {
        stage: 'Tahap 2',
        title: 'Review validasi produksi',
        detail: 'Periksa hasil uji dan bukti sebelum memberikan keputusan.',
        selection: '/entry:Validasi produksi',
      };
    }

    if (
      stage === 'Tahap 3B' &&
      state.cycle.userReview !== 'Sesuai'
    ) {
      return {
        stage: 'Tahap 3B',
        title: 'Review pemeriksaan berkala',
        detail: 'Periksa konsistensi, temuan, dan bukti kegiatan.',
        selection: '/verification:Verval 14 hari',
      };
    }

    if (stage === 'Tahap 5') {
      return {
        stage: 'Tahap 5',
        title: 'Tinjau audit dalam kewenangan Balai',
        detail: 'Periksa hasil audit dan tindak lanjut yang membutuhkan review.',
        selection: '/verification:Audit tingkat 1–3',
      };
    }

    if (stage === 'Tahap 6') {
      return {
        stage: 'Tahap 6',
        title: 'Periksa penerimaan data',
        detail: 'Tinjau kriteria penerimaan, catatan, dan berita acara.',
        selection: '/reports:Penerimaan & termin',
      };
    }

    return {
      stage,
      title: 'Pantau paket dan pemeriksaan yang menunggu review',
      detail: 'Buka tahap yang relevan untuk melihat progres serta hasil pemeriksaan.',
      selection:
        PROVIDER_ACTIONS[stage]?.selection ??
        '/packages:Ringkasan Paket',
    };
  }

  if (role === 'Direktorat / Pusat') {
    return {
      stage,
      title: 'Monitoring dan audit tingkat pusat',
      detail: 'Tinjau hasil audit, data pendukung, dan status penerimaan.',
      selection: '/verification:Audit tingkat 1–3',
    };
  }

  return {
    stage: 'Administrasi',
    title: 'Pantau konfigurasi dan integritas sistem',
    detail:
      'Kelola referensi dan konfigurasi tanpa mengambil alih keputusan teknis.',
    selection: '/audit:Peran & backup',
  };
}

export function WorkflowNextAction({
  state,
  onNavigate,
}: {
  state: OperationalWorkflowState;
  onNavigate: (selection: string) => void;
}) {
  const next = getNextWorkflowAction(state);

  return (
    <div
      className="wf-next-action"
      data-testid="workflow-next-action"
    >
      <div className="wf-next-icon">
        <Route size={17} />
      </div>

      <div className="wf-next-copy">
        <span>{next.stage} · Langkah berikutnya</span>
        <strong>{next.title}</strong>
        <small>{next.detail}</small>
      </div>

      <button
        type="button"
        className="wf-button primary"
        onClick={() => onNavigate(next.selection)}
      >
        Buka <ArrowRight size={13} />
      </button>
    </div>
  );
}
