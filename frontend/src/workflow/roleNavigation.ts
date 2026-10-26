import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  Database,
  Gauge,
  Settings,
  ShieldCheck,
  TrendingUp,
  Wrench,
} from 'lucide-react';

import type { WorkflowRole } from './model';

export type PackageWorkflowItem = {
  code: 'Tahap 0' | 'Tahap 1' | 'Tahap 2' | 'Tahap 3A' | 'Tahap 3B' | 'Tahap 4' | 'Tahap 5' | 'Tahap 6';
  label: string;
  shortLabel: string;
  selection: string;
  actorHint: string;
};

export type RoleNavChild = {
  label: string;
  selection?: string;
  href?: string;
  tab?: string;
  locked?: boolean;
  hint?: string;
};

export type RoleNavItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  children: RoleNavChild[];
};

export const PACKAGE_WORKFLOW_ITEMS: readonly PackageWorkflowItem[] = [
  {
    code: 'Tahap 0',
    label: 'Survei Pendahuluan & Persiapan QA/QC',
    shortLabel: 'Persiapan QA/QC',
    selection: '/entry:Persiapan & SPMK',
    actorHint: 'Penyedia melengkapi persiapan; PIC Balai melakukan review.',
  },
  {
    code: 'Tahap 1',
    label: 'Kalibrasi & Validasi Awal',
    shortLabel: 'Kalibrasi & Validasi Awal',
    selection: '/documents:Kalibrasi & personel',
    actorHint: 'Kesiapan alat, personel, sertifikat, dan bukti kalibrasi.',
  },
  {
    code: 'Tahap 2',
    label: 'Validasi Produksi Data',
    shortLabel: 'Validasi Produksi',
    selection: '/entry:Validasi produksi',
    actorHint: 'Checklist sumber, hasil sumber, system-check, evidence, dan review Balai.',
  },
  {
    code: 'Tahap 3A',
    label: 'Pelaksanaan Survei',
    shortLabel: 'Pelaksanaan Survei',
    selection: '/entry:Survei harian',
    actorHint: 'Monitoring kegiatan dan bukti pelaksanaan survei.',
  },
  {
    code: 'Tahap 3B',
    label: 'Verifikasi & Validasi Berkala',
    shortLabel: 'Verval Berkala',
    selection: '/verification:Verval 14 hari',
    actorHint: 'Siklus berkala selama masa survei, termasuk pemeriksaan konsistensi.',
  },
  {
    code: 'Tahap 4',
    label: 'Pengolahan & Persiapan Data',
    shortLabel: 'Persiapan Data',
    selection: '/entry:Gerbang RNI/LRS',
    actorHint: 'Pemeriksaan kesiapan data sebelum audit dan penyerahan.',
  },
  {
    code: 'Tahap 5',
    label: 'Audit Data',
    shortLabel: 'Audit Data',
    selection: '/verification:Audit tingkat 1–3',
    actorHint: 'Audit internal Penyedia, audit Balai, dan audit Direktorat.',
  },
  {
    code: 'Tahap 6',
    label: 'Penerimaan Data',
    shortLabel: 'Penerimaan Data',
    selection: '/reports:Penerimaan & termin',
    actorHint: 'Kriteria penerimaan, keputusan, dan berita acara penerimaan.',
  },
] as const;

export function packageMenuLabel(role: WorkflowRole) {
  if (role === 'Penyedia Jasa / Ketua Tim') return 'Paket Saya';
  if (role === 'PIC Balai / Pengguna Jasa') return 'Paket dalam Kewenangan';
  if (role === 'Direktorat / Pusat') return 'Paket Monitoring';
  return 'Paket Kontrak';
}

export function stageIndexFromCode(stage: string) {
  if (stage === 'Selesai') return PACKAGE_WORKFLOW_ITEMS.length;

  const index = PACKAGE_WORKFLOW_ITEMS.findIndex(item => item.code === stage);
  return index < 0 ? 0 : index;
}

function packageChildren(
  packageActive: boolean,
  currentStage: string,
  role: WorkflowRole,
): RoleNavChild[] {
  if (!packageActive) {
    return [
      {
        label: 'Daftar Paket',
        href: '/packages',
        hint: 'Pilih paket untuk membuka alur QA/QC.',
      },
    ];
  }

  return [
    {
      label: 'Ringkasan Paket',
      selection: '/packages:Ringkasan Paket',
      hint: 'Identitas, status, lingkup survei, dan progres paket.',
    },
    ...PACKAGE_WORKFLOW_ITEMS.map(item => ({
  label: item.shortLabel,
  selection: item.selection,
  locked: false,
  hint: `${item.actorHint} Akses halaman tidak berarti persyaratan tahap sudah terpenuhi.`,
})),
  ];
}

export function buildRoleNavigation(
  role: WorkflowRole,
  packageActive: boolean,
  currentStage: string,
): RoleNavItem[] {
  const packageNav: RoleNavItem = {
    path: '/packages',
    label: packageMenuLabel(role),
    icon: ClipboardList,
    children: packageChildren(packageActive, currentStage, role),
  };

  if (role === 'Penyedia Jasa / Ketua Tim') {
    return [
      {
        path: '/',
        label: 'Ringkasan QA/QC',
        icon: Gauge,
        children: [
          { label: 'Dashboard utama', href: '/', tab: 'Semua' },
          { label: 'Kepatuhan per survei', href: '/', tab: 'Kepatuhan' },
          { label: 'Tren mutu data', href: '/', tab: 'Tren' },
        ],
      },
      packageNav,
     {
  path: '/actions',
  label: 'Tindakan Perbaikan',
  icon: Wrench,
  children: [
    { label: 'Tugas Saya', href: '/actions', tab: 'Tugas Saya' },
    { label: 'Menunggu Verifikasi', href: '/actions', tab: 'Menunggu Verifikasi' },
    { label: 'Riwayat', href: '/actions', tab: 'Riwayat' },
  ],
},
      {
        path: '/reports',
        label: 'Dashboard & Laporan',
        icon: TrendingUp,
        children: [
          { label: 'Ringkasan kinerja', href: '/reports', tab: 'Semua' },
          { label: 'Laporan periodik', href: '/reports', tab: 'Laporan periodik' },
        ],
      },
      {
        path: '/documents',
        label: 'Dokumen Mutu',
        icon: BookOpen,
        children: [
          { label: 'Kalibrasi', href: '/documents', tab: 'Kalibrasi' },
          { label: 'Validasi', href: '/documents', tab: 'Validasi' },
          { label: 'Verifikasi berkala', href: '/documents', tab: 'Verifikasi berkala' },
          { label: 'Berita acara', href: '/documents', tab: 'Berita acara' },
        ],
      },
      {
        path: '/notifications',
        label: 'Notifikasi',
        icon: Bell,
        children: [
          { label: 'Belum dibaca', href: '/notifications', tab: 'Belum dibaca' },
          { label: 'Jatuh tempo', href: '/notifications', tab: 'Jatuh tempo' },
          { label: 'Peringatan mutu', href: '/notifications', tab: 'Mutu' },
        ],
      },
    ];
  }

  if (role === 'PIC Balai / Pengguna Jasa') {
    return [
      {
        path: '/',
        label: 'Ringkasan QA/QC',
        icon: Gauge,
        children: [
          { label: 'Dashboard utama', href: '/', tab: 'Semua' },
          { label: 'Kepatuhan per survei', href: '/', tab: 'Kepatuhan' },
          { label: 'Tren mutu data', href: '/', tab: 'Tren' },
        ],
      },
      packageNav,
      {
        path: '/verification',
        label: 'Verifikasi & Review',
        icon: ClipboardCheck,
        children: [
          { label: 'Perlu Direview', href: '/verification', tab: 'Perlu Direview' },
          { label: 'Menunggu Klarifikasi', href: '/verification', tab: 'Menunggu Klarifikasi' },
          { label: 'Hasil / Riwayat Review', href: '/verification', tab: 'Riwayat Review' },
        ],
      },
      {
  path: '/actions',
  label: 'Tindakan Perbaikan',
  icon: Wrench,
  children: [
    { label: 'Antrian Verifikasi', href: '/actions', tab: 'Antrian Verifikasi' },
    { label: 'Tindak Lanjut Paket', href: '/actions', tab: 'Tindak Lanjut Paket' },
    { label: 'Verifikasi Ulang', href: '/actions', tab: 'Verifikasi Ulang' },
    { label: 'Riwayat', href: '/actions', tab: 'Riwayat' },
  ],
},
      {
        path: '/compliance',
        label: 'Analisis & Kepatuhan',
        icon: BarChart3,
        children: [
          { label: 'Kepatuhan per survei', href: '/compliance', tab: 'Semua' },
          { label: 'Tren kepatuhan', href: '/compliance', tab: 'Tren' },
          { label: 'Peringkat Balai', href: '/compliance', tab: 'Peringkat' },
        ],
      },
      {
        path: '/reports',
        label: 'Dashboard & Laporan',
        icon: TrendingUp,
        children: [
          { label: 'Ringkasan kinerja', href: '/reports', tab: 'Semua' },
          { label: 'Laporan periodik', href: '/reports', tab: 'Laporan periodik' },
        ],
      },
      {
        path: '/documents',
        label: 'Dokumen Mutu',
        icon: BookOpen,
        children: [
          { label: 'Kalibrasi', href: '/documents', tab: 'Kalibrasi' },
          { label: 'Validasi', href: '/documents', tab: 'Validasi' },
          { label: 'Verifikasi berkala', href: '/documents', tab: 'Verifikasi berkala' },
          { label: 'Berita acara', href: '/documents', tab: 'Berita acara' },
        ],
      },
      {
        path: '/notifications',
        label: 'Notifikasi',
        icon: Bell,
        children: [
          { label: 'Belum dibaca', href: '/notifications', tab: 'Belum dibaca' },
          { label: 'Jatuh tempo', href: '/notifications', tab: 'Jatuh tempo' },
          { label: 'Peringatan mutu', href: '/notifications', tab: 'Mutu' },
        ],
      },
    ];
  }

  if (role === 'Direktorat / Pusat') {
    return [
      {
        path: '/',
        label: 'Ringkasan Nasional',
        icon: Gauge,
        children: [
          { label: 'Dashboard nasional', href: '/', tab: 'Semua' },
          { label: 'Paket perlu perhatian', href: '/', tab: 'Perlu perhatian' },
          { label: 'Tren mutu nasional', href: '/', tab: 'Tren' },
        ],
      },
      packageNav,
      {
        path: '/verification',
        label: 'Audit & Assurance',
        icon: ShieldCheck,
        children: [
          { label: 'Perlu Diaudit', href: '/verification', tab: 'Perlu Diaudit' },
          { label: 'Sedang Ditinjau', href: '/verification', tab: 'Sedang Ditinjau' },
          { label: 'Riwayat Audit', href: '/verification', tab: 'Riwayat Audit' },
        ],
      },
      {
  path: '/actions',
  label: 'Tindakan Perbaikan',
  icon: Wrench,
  children: [
    { label: 'Temuan Lintas Paket', href: '/actions', tab: 'Temuan Lintas Paket' },
    { label: 'Audit Tingkat 3', href: '/actions', tab: 'Audit Tingkat 3' },
    { label: 'Verifikasi Ulang', href: '/actions', tab: 'Verifikasi Ulang' },
    { label: 'Riwayat', href: '/actions', tab: 'Riwayat' },
  ],
},
      {
        path: '/compliance',
        label: 'Analisis & Kepatuhan',
        icon: BarChart3,
        children: [
          { label: 'Monitoring lintas Balai', href: '/compliance', tab: 'Semua' },
          { label: 'Tren kepatuhan', href: '/compliance', tab: 'Tren' },
          { label: 'Peringkat Balai', href: '/compliance', tab: 'Peringkat' },
        ],
      },
      {
        path: '/reports',
        label: 'Dashboard & Laporan',
        icon: TrendingUp,
        children: [
          { label: 'Ringkasan nasional', href: '/reports', tab: 'Semua' },
          { label: 'Laporan periodik', href: '/reports', tab: 'Laporan periodik' },
        ],
      },
      {
        path: '/documents',
        label: 'Dokumen Mutu',
        icon: BookOpen,
        children: [
          { label: 'Berita acara', href: '/documents', tab: 'Berita acara' },
          { label: 'Verifikasi berkala', href: '/documents', tab: 'Verifikasi berkala' },
        ],
      },
      {
        path: '/notifications',
        label: 'Notifikasi',
        icon: Bell,
        children: [
          { label: 'Belum dibaca', href: '/notifications', tab: 'Belum dibaca' },
          { label: 'Jatuh tempo', href: '/notifications', tab: 'Jatuh tempo' },
          { label: 'Peringatan mutu', href: '/notifications', tab: 'Mutu' },
        ],
      },
    ];
  }

  return [
    {
      path: '/',
      label: 'Ringkasan Sistem',
      icon: Gauge,
      children: [
        { label: 'Dashboard sistem', href: '/', tab: 'Semua' },
        { label: 'Status workflow', href: '/', tab: 'Workflow' },
      ],
    },
    {
      path: '/data-master',
      label: 'Data Master',
      icon: Database,
      children: [
        { label: 'Balai & Wilayah', href: '/data-master', tab: 'Balai & wilayah' },
        { label: 'Referensi Survei', href: '/data-master', tab: 'Jenis survei' },
        { label: 'Alat & Personel', href: '/data-master', tab: 'Alat & personel' },
      ],
    },
    packageNav,
    {
      path: '/verification',
      label: 'Monitoring Workflow',
      icon: ClipboardCheck,
      children: [
        { label: 'Status Review', href: '/verification', tab: 'Semua' },
        { label: 'Status Audit', href: '/verification', tab: 'Audit' },
      ],
    },
    {
  path: '/actions',
  label: 'Tindakan Perbaikan',
  icon: Wrench,
  children: [
    { label: 'Monitoring Kasus', href: '/actions', tab: 'Monitoring Kasus' },
    { label: 'Notifikasi & SLA', href: '/actions', tab: 'Notifikasi & SLA' },
    { label: 'Data Referensi', href: '/actions', tab: 'Data Referensi' },
  ],
},
    {
      path: '/compliance',
      label: 'Analisis & Kepatuhan',
      icon: BarChart3,
      children: [
        { label: 'Monitoring Kepatuhan', href: '/compliance', tab: 'Semua' },
        { label: 'Peringkat Balai', href: '/compliance', tab: 'Peringkat' },
      ],
    },
    {
      path: '/reports',
      label: 'Dashboard & Laporan',
      icon: TrendingUp,
      children: [
        { label: 'Ringkasan kinerja', href: '/reports', tab: 'Semua' },
        { label: 'Laporan periodik', href: '/reports', tab: 'Laporan periodik' },
      ],
    },
    {
      path: '/documents',
      label: 'Dokumen Mutu',
      icon: BookOpen,
      children: [
        { label: 'Kalibrasi', href: '/documents', tab: 'Kalibrasi' },
        { label: 'Validasi', href: '/documents', tab: 'Validasi' },
        { label: 'Berita acara', href: '/documents', tab: 'Berita acara' },
      ],
    },
    {
      path: '/notifications',
      label: 'Notifikasi',
      icon: Bell,
      children: [
        { label: 'Belum dibaca', href: '/notifications', tab: 'Belum dibaca' },
        { label: 'Jatuh tempo', href: '/notifications', tab: 'Jatuh tempo' },
      ],
    },
    {
      path: '/audit',
      label: 'Administrasi & Akses',
      icon: Settings,
      children: [
        { label: 'Pengguna & Peran', href: '/audit', tab: 'Pengguna' },
        { label: 'Hak Akses', href: '/audit', tab: 'Hak akses' },
        { label: 'Jejak Aktivitas', href: '/audit', tab: 'Jejak aktivitas' },
      ],
    },
  ];
}
