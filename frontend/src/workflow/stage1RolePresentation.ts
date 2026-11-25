import type { WorkflowRole } from './model';

export type Stage1RolePresentation = {
  badge: string;
  tone: 'provider' | 'reviewer' | 'contract';
  heading: string;
  description: string;
  checklistHeading: string;
};

/** Only presentation text: authorization remains in the workflow policy. */
export function stage1RolePresentation(role: WorkflowRole): Stage1RolePresentation {
  switch (role) {
    case 'Penyedia Jasa / Ketua Tim':
      return {
        badge: 'PENYEDIA', tone: 'provider',
        heading: 'Lengkapi alat, personel, dan bukti kesiapan',
        description: 'Catat alat dan personel yang digunakan. Isi checklist kalibrasi berdasarkan jenis survei dan lampiran sumber.',
        checklistHeading: 'Isi checklist kalibrasi dan validasi',
      };
    case 'PIC Balai / Pengguna Jasa':
      return {
        badge: 'PIC BALAI', tone: 'reviewer',
        heading: 'Periksa kesiapan alat dan personel',
        description: 'Tinjau catatan, sertifikat, dan checklist Penyedia. Pengisian Tahap 1 dilakukan Penyedia; keputusan review Balai mengikuti tahap pemeriksaan yang berwenang.',
        checklistHeading: 'Lihat checklist kalibrasi Penyedia',
      };
    case 'Direktorat / Pusat':
      return {
        badge: 'DIREKTORAT', tone: 'contract',
        heading: 'Pantau kesiapan kalibrasi paket',
        description: 'Lihat kelengkapan alat, kompetensi personel, dan status checklist. Halaman ini bukan formulir pengisian atau persetujuan audit pusat.',
        checklistHeading: 'Pantau checklist kalibrasi paket',
      };
    case 'Admin':
      return {
        badge: 'ADMIN', tone: 'contract',
        heading: 'Pantau data alat dan personel',
        description: 'Periksa ketersediaan data dan bukti sebagai informasi administrasi. Admin tidak mengubah checklist atau mengambil keputusan teknis QA/QC.',
        checklistHeading: 'Lihat data checklist kalibrasi',
      };
  }
}
