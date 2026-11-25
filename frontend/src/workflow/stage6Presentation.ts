import type { WorkflowRole } from './model';

/** UI routing only. No permissions or decision rules are granted by tabs. */
export type Stage6Tab = 'overview' | 'surveys' | 'terms' | 'criteria' | 'decision' | 'documents';
export type Stage6TabLink = { id: Stage6Tab; label: string };

export function stage6TabsForRole(role: WorkflowRole, _hasIri: boolean): Stage6TabLink[] {
  if (role === 'Penyedia Jasa / Ketua Tim') return [
    { id: 'overview', label: 'Ringkasan' },
    { id: 'surveys', label: 'Penyelesaian Survei' },
    { id: 'terms', label: 'Termin & Laporan' },
    { id: 'documents', label: 'Penyerahan & Dokumen' },
  ];
  if (role === 'PIC Balai / Pengguna Jasa') return [
    { id: 'overview', label: 'Antrean Penerimaan' },
    { id: 'criteria', label: 'Pemeriksaan Data' },
    { id: 'decision', label: 'Keputusan Penerimaan' },
    { id: 'documents', label: 'BA & Riwayat' },
  ];
  return [];
}

export type Stage6MonitorTab = 'overview' | 'audit' | 'notes' | 'documents' | 'terms' | 'history';
export function stage6MonitorTabsForRole(role: WorkflowRole): Array<{id: Stage6MonitorTab; label: string}> {
  if (role === 'Direktorat / Pusat') return [
    {id:'overview', label:'Ringkasan Pengawasan'},
    {id:'audit', label:'Hasil Audit & Data'},
    {id:'notes', label:'Catatan Pengawasan'},
    {id:'documents', label:'Dokumen & Tindak Lanjut'},
  ];
  if (role === 'Admin') return [
    {id:'overview', label:'Ringkasan Administrasi'},
    {id:'terms', label:'Status Termin'},
    {id:'documents', label:'Dokumen & BA'},
    {id:'history', label:'Riwayat'},
  ];
  return [];
}

/** Catatan koordinasi Tahap 6 tidak memberikan kewenangan keputusan Balai. */
export const canAuthorStage6Note=(role:WorkflowRole)=>role==='Direktorat / Pusat';
