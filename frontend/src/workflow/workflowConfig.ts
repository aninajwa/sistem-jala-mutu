import type { WorkflowRole } from './model';

export const WORKFLOW_ROLE_OPTIONS: WorkflowRole[] = [
  'Penyedia Jasa / Ketua Tim',
  'PIC Balai / Pengguna Jasa',
  'Direktorat / Pusat',
  'Admin',
];

export const WORKFLOW_ROLE_SCOPE: Record<WorkflowRole, string> = {
  'Penyedia Jasa / Ketua Tim': 'Melengkapi persiapan, bukti kegiatan, hasil sumber, pengajuan, dan tindak lanjut perbaikan.',
  'PIC Balai / Pengguna Jasa': 'Meninjau hasil system-check, memberi catatan/keputusan, memvalidasi sesuai kewenangan Balai, dan memantau paket.',
  'Direktorat / Pusat': 'Melakukan audit/review tingkat pusat dan memantau agregasi paket/Balai sesuai kewenangan.',
  Admin: 'Mengelola konfigurasi, referensi, pengguna/peran, dan pemantauan operasional sistem.',
};

export const WORKFLOW_STAGE_PRESENTATION = [
  { id: 0, short: 'Persiapan', title: 'Survei Pendahuluan & Laporan Pendahuluan' },
  { id: 1, short: 'Kalibrasi', title: 'Kalibrasi Alat & Personil' },
  { id: 2, short: 'Validasi Produksi', title: 'Validasi Produksi Data / Uji Coba' },
  { id: 3, short: 'Pengumpulan & Verval', title: 'Pengumpulan Data Harian & Verval Berkala' },
  { id: 4, short: 'Penyiapan Data', title: 'Penyiapan Data & Gerbang RNI/LRS' },
  { id: 5, short: 'Audit', title: 'Audit Berjenjang' },
  { id: 6, short: 'Penerimaan', title: 'Penerimaan Data' },
] as const;

export const ROLE_DEMO_USERS: Array<[string, WorkflowRole, string]> = [
  ['D. Prasetyo', 'Penyedia Jasa / Ketua Tim', 'Aktif'],
  ['N. Anggraini', 'PIC Balai / Pengguna Jasa', 'Aktif'],
  ['B. Santoso', 'Direktorat / Pusat', 'Aktif'],
  ['R. Hidayat', 'Admin', 'Aktif'],
];

export const VALIDATION_SOURCE_OPTIONS = ['Sinkronisasi sistem sumber', 'Lampiran / bukti kegiatan', 'Pencatatan manual'] as const;

export const STAGE3_SOURCE_MODE_PRESENTATION: Record<(typeof VALIDATION_SOURCE_OPTIONS)[number], { badge:string; detail:string; sourceReadOnly:boolean; evidenceLabel:string }> = {
  'Sinkronisasi sistem sumber': {
    badge: 'Dari sistem sumber',
    detail: 'Metadata dan hasil utama dibaca dari sistem sumber. Penyedia hanya melengkapi bukti, checklist, dan catatan yang belum tersedia.',
    sourceReadOnly: true,
    evidenceLabel: 'Referensi bukti pendukung',
  },
  'Lampiran / bukti kegiatan': {
    badge: 'Dari lampiran',
    detail: 'Gunakan dokumen, formulir, foto, atau berkas kegiatan sebagai referensi. Metadata yang belum terbaca dapat dilengkapi Penyedia.',
    sourceReadOnly: false,
    evidenceLabel: 'Referensi lampiran / bukti',
  },
  'Pencatatan manual': {
    badge: 'Manual fallback',
    detail: 'Dipakai hanya bila data belum tersedia dari sistem sumber maupun lampiran. Field wajib dilengkapi oleh Penyedia.',
    sourceReadOnly: false,
    evidenceLabel: 'Referensi pendukung (bila ada)',
  },
};
export const FRONTEND_DEPENDENCY_LABELS = { source:'Butuh API untuk data source nyata', persistence:'Butuh persistence backend', auth:'Butuh auth/permission backend' } as const;

export type FrontendCapability =
  | 'enterSurvey'
  | 'reviewValidation'
  | 'manageFindings'
  | 'manageMaster'
  | 'manageAccess'
  | 'viewNational';

export const ROLE_CAPABILITIES: Record<WorkflowRole, FrontendCapability[]> = {
  'Penyedia Jasa / Ketua Tim': ['enterSurvey', 'manageFindings'],
  'PIC Balai / Pengguna Jasa': ['reviewValidation', 'manageFindings'],
  'Direktorat / Pusat': ['reviewValidation', 'viewNational'],
  Admin: ['enterSurvey', 'reviewValidation', 'manageFindings', 'manageMaster', 'manageAccess', 'viewNational'],
};

export const ROLE_ROUTE_ACCESS: Record<WorkflowRole, string[]> = {
  'Penyedia Jasa / Ketua Tim': ['/', '/packages', '/entry', '/verification', '/actions', '/reports', '/documents', '/notifications'],
  'PIC Balai / Pengguna Jasa': ['/', '/packages', '/entry', '/verification', '/actions', '/compliance', '/reports', '/documents', '/notifications'],
  'Direktorat / Pusat': ['/', '/packages', '/entry', '/verification', '/actions', '/compliance', '/reports', '/documents', '/notifications'],
  Admin: ['/', '/data-master', '/packages', '/entry', '/verification', '/actions', '/compliance', '/reports', '/documents', '/notifications', '/audit'],
};

export const ROLE_HOME_LABELS: Record<WorkflowRole, string> = {
  'Penyedia Jasa / Ketua Tim': 'Workspace pelaksanaan & bukti QA/QC',
  'PIC Balai / Pengguna Jasa': 'Workspace review, validasi & monitoring Balai',
  'Direktorat / Pusat': 'Workspace audit & monitoring lintas Balai',
  Admin: 'Workspace administrasi & konfigurasi frontend',
};

export const ROLE_HOME_PRIORITIES: Record<WorkflowRole, string[]> = {
  'Penyedia Jasa / Ketua Tim': [
    'Lengkapi bukti dan dokumen Tahap 0–2 sebelum melanjutkan tahap berikutnya.',
    'Pantau hasil system-check dan tindak lanjuti catatan/perbaikan yang dikembalikan.',
    'Pastikan kegiatan survei dan bukti QA/QC paket tercatat sebelum pengajuan berikutnya.',
  ],
  'PIC Balai / Pengguna Jasa': [
    'Tinjau hasil system-check dan evidence dari Penyedia Jasa sebelum memberi keputusan Balai.',
    'Pantau verifikasi/validasi berkala 14 hari, catatan ketidaksesuaian, dan tindak lanjut paket.',
    'Pastikan keputusan dan catatan assurance Balai terdokumentasi sebelum eskalasi ke tingkat pusat.',
  ],
  'Direktorat / Pusat': [
    'Pantau status QA/QC lintas Balai dan paket untuk menemukan tahap yang tertahan atau belum dilakukan.',
    'Lakukan audit/review tingkat pusat terhadap hasil yang telah melalui assurance Balai.',
    'Berikan catatan atau penolakan bila hasil masih memerlukan klarifikasi/perbaikan.',
  ],
  Admin: [
    'Kelola data master, referensi, pengguna/peran, serta konfigurasi sistem.',
    'Pantau audit trail, status penyimpanan, dan kesiapan integrasi sistem.',
    'Jaga konfigurasi sistem tanpa mengambil alih keputusan QA/QC operasional.',
  ],
};

export const ROLE_HOME_QUICK_LINKS: Record<WorkflowRole, Array<{ label:string; href:string; detail:string }>> = {
  'Penyedia Jasa / Ketua Tim': [
    { label:'Buka Paket Saya', href:'/packages', detail:'Pilih paket kontrak lalu lanjutkan workflow Tahap 0–6.' },
    { label:'Tindak lanjut temuan', href:'/actions', detail:'Lihat kasus, catatan, dan bukti perbaikan.' },
    { label:'Dokumen QA/QC', href:'/documents', detail:'Bukti kalibrasi, validasi, dan dokumen workflow.' },
  ],
  'PIC Balai / Pengguna Jasa': [
    { label:'Paket dalam kewenangan', href:'/packages', detail:'Buka paket yang menunggu review atau keputusan Balai.' },
    { label:'Monitoring kepatuhan', href:'/compliance', detail:'Pantau konsistensi dan kepatuhan paket.' },
    { label:'Temuan & tindak lanjut', href:'/actions', detail:'Catatan assurance dan verifikasi perbaikan.' },
  ],
  'Direktorat / Pusat': [
    { label:'Paket monitoring', href:'/packages', detail:'Buka paket lintas Balai untuk audit/review tingkat pusat.' },
    { label:'Monitoring lintas Balai', href:'/compliance', detail:'Agregasi kepatuhan dan tren mutu.' },
    { label:'Dashboard & laporan', href:'/reports', detail:'Ringkasan kinerja dan pelaporan.' },
  ],
  Admin: [
    { label:'Paket kontrak', href:'/packages', detail:'Pantau paket dan konteks workflow operasional.' },
    { label:'Hak akses', href:'/audit', detail:'Pengguna, peran, audit trail, dan backup.' },
    { label:'Monitoring sistem', href:'/notifications', detail:'Notifikasi, pengingat, dan status operasional.' },
  ],
};

export function canRole(role: WorkflowRole, capability: FrontendCapability) {
  return ROLE_CAPABILITIES[role].includes(capability);
}

export function canAccessRoute(role: WorkflowRole, path: string) {
  return ROLE_ROUTE_ACCESS[role].includes(path);
}



export const STAGE3_SOURCE_NOTE = 'Pilih cara data kegiatan tersedia: disinkronkan dari sistem sumber, dilengkapi dari lampiran/bukti, atau dicatat manual bila data sumber belum tersedia.';

export const STAGE3_ROLE_GUIDANCE: Record<WorkflowRole, string> = {
  'Penyedia Jasa / Ketua Tim': 'Melengkapi evidence kegiatan, metadata yang belum tersedia dari source, checklist pelaksanaan, dan tindak lanjut bila ada ketidaksesuaian.',
  'PIC Balai / Pengguna Jasa': 'Meninjau hasil checking dan evidence, memberi catatan/keputusan assurance pertama, serta mencatat BA verval berkala setelah sesuai.',
  'Direktorat / Pusat': 'Memantau hasil yang telah melalui assurance Balai dan menggunakan hasil Tahap 3 sebagai input review/audit tingkat pusat.',
  Admin: 'Dapat meninjau seluruh modul dan konfigurasi untuk kebutuhan administrasi sistem.',
};


export const STAGE4_ROLE_GUIDANCE: Record<WorkflowRole, string> = {
  'Penyedia Jasa / Ketua Tim': 'Menyiapkan paket data, memastikan kelengkapan dokumen mutu, memeriksa keterikatan RNI/LRS, lalu meneruskan paket ke Audit Tingkat 1.',
  'PIC Balai / Pengguna Jasa': 'Memantau kesiapan paket dan hasil gerbang RNI/LRS. Pemeriksaan/keputusan Balai dilakukan pada tahap review dan audit sesuai kewenangan.',
  'Direktorat / Pusat': 'Memantau status kesiapan penyerahan sebagai konteks sebelum audit/review tingkat pusat.',
  Admin: 'Dapat meninjau dan membantu konfigurasi data Tahap 4 tanpa menggantikan keputusan QA/QC operasional.',
};


export const STAGE5_ROLE_GUIDANCE: Record<WorkflowRole, string> = {
  'Penyedia Jasa / Ketua Tim': 'Menyiapkan bukti audit internal/kesiapan Tingkat 1 dan menindaklanjuti klarifikasi. Assurance formal berikutnya dilakukan oleh PIC Balai dan Direktorat sesuai tingkat audit.',
  'PIC Balai / Pengguna Jasa': 'Melakukan audit/review Tingkat 2 atas paket yang telah siap dan berstatus valid, termasuk sampling, klarifikasi, keputusan, dan referensi BA sesuai kewenangan.',
  'Direktorat / Pusat': 'Melakukan audit/review Tingkat 3 terhadap hasil yang telah melalui Balai, memberi catatan/penolakan bila perlu, dan menjadi gerbang menuju penerimaan data.',
  Admin: 'Dapat meninjau seluruh tingkat untuk kebutuhan administrasi/prototipe tanpa menggantikan actor QA/QC operasional.',
};

export const AUDIT_LEVEL_PRESENTATION = {
  1: {
    label: 'Tingkat 1 · Kesiapan internal Penyedia',
    actor: 'Penyedia Jasa / Ketua Tim',
    purpose: 'Mencatat bukti audit internal/kesiapan sebelum paket diteruskan dan status upload/penyerahan diperiksa. Ini bukan assurance formal Balai.',
  },
  2: {
    label: 'Tingkat 2 · PIC Balai / Pengguna Jasa',
    actor: 'PIC Balai / Pengguna Jasa',
    purpose: 'Audit/review assurance pertama di sistem: sampling, pemeriksaan bukti, klarifikasi, keputusan, dan BA Balai.',
  },
  3: {
    label: 'Tingkat 3 · Direktorat / Pusat',
    actor: 'Direktorat / Pusat',
    purpose: 'Audit/review tingkat pusat atas hasil yang telah melalui Balai sebelum masuk penerimaan data.',
  },
} as const;


export const STAGE6_ROLE_GUIDANCE: Record<WorkflowRole, string> = {
  'Penyedia Jasa / Ketua Tim': 'Melengkapi bukti siklus Semester II, progres termin, laporan akhir, dan klarifikasi bila ada ketidaksesuaian. Keputusan penerimaan dan BA berada pada PIC Balai / Pengguna Jasa.',
  'PIC Balai / Pengguna Jasa': 'Menilai kriteria penerimaan, mencatat penerimaan parsial/bertahap, menilai revalidasi Semester II, dan menerbitkan BA penerimaan akhir bila seluruh persyaratan terpenuhi.',
  'Direktorat / Pusat': 'Meninjau hasil Audit Tingkat 3 dan status penerimaan sebagai monitoring tingkat pusat. BA penerimaan data diterbitkan oleh PIC Balai / Pengguna Jasa sesuai hasil pemeriksaan.',
  Admin: 'Dapat meninjau dan membantu konfigurasi seluruh status Tahap 6 tanpa menggantikan actor keputusan QA/QC operasional.',
};
