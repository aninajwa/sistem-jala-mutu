import type { WorkflowRole } from './model';

export type JourneyCard = {
  eyebrow: string;
  title: string;
  description: string;
  steps: string[];
  action: string;
  tone: 'working' | 'waiting' | 'done' | 'neutral';
};

/** Presentation only: does not grant permissions or mutate QA/QC decisions. */
export function describeStageJourney(args: {
  stage: 0 | 1;
  role: WorkflowRole;
  approval?: string;
  complete?: number;
  total?: number;
  ready?: number;
  surveyTotal?: number;
}): JourneyCard {
  const { stage, role } = args;
  const provider = role === 'Penyedia Jasa / Ketua Tim';
  const balai = role === 'PIC Balai / Pengguna Jasa';
  const directorate = role === 'Direktorat / Pusat';
  if (stage === 0) {
    const status = args.approval || 'Draft';
    const left = Math.max(0, (args.total ?? 0) - (args.complete ?? 0));
    if (provider) {
      if (status === 'Disetujui') return { eyebrow: 'Pekerjaan Penyedia · selesai direview', title: 'Laporan pendahuluan telah disetujui Balai', description: 'Periksa kelengkapan bukti dan lanjutkan persiapan kalibrasi sesuai paket.', steps: ['Telaah dan dokumen persiapan tercatat', 'Keputusan Balai: disetujui', 'Lanjutkan Tahap 1'], action: 'Lihat data persiapan', tone: 'done' };
      if (status === 'Diajukan') return { eyebrow: 'Pekerjaan Penyedia · menunggu', title: 'Pengajuan sedang ditinjau Balai', description: 'Pantau catatan pemeriksa. Jangan menganggap pengajuan sudah disetujui.', steps: ['Pengajuan telah dikirim', 'Menunggu keputusan PIC Balai', 'Tindak lanjuti jika dikembalikan'], action: 'Lihat pengajuan', tone: 'waiting' };
      if (status === 'Perlu Revisi') return { eyebrow: 'Pekerjaan Penyedia · perlu tindakan', title: 'Perbaiki laporan sesuai catatan Balai', description: 'Baca alasan revisi, lengkapi persiapan atau bukti, kemudian ajukan kembali.', steps: ['Baca catatan hasil review', 'Perbaiki isian dan bukti', 'Ajukan ulang ke Balai'], action: 'Kerjakan revisi', tone: 'working' };
      return { eyebrow: 'Pekerjaan Penyedia · persiapan', title: left > 0 ? `${left} butir persiapan belum lengkap` : 'Persiapan siap untuk diajukan', description: left > 0 ? 'Isi telaah awal, rencana survei, koordinasi, dan dokumen sesuai paket.' : 'Periksa kembali lampiran sebelum mengajukan laporan ke PIC Balai.', steps: ['Lengkapi checklist sumber', 'Pastikan bukti pendukung tersedia', 'Ajukan laporan kepada Balai'], action: 'Lengkapi persiapan', tone: 'working' };
    }
    if (balai) {
      if (status === 'Diajukan') return { eyebrow: 'Pemeriksaan Balai · perlu tindakan', title: 'Laporan pendahuluan menunggu keputusan Anda', description: 'Tinjau checklist dan bukti Penyedia. Berikan keputusan sesuai hasil pemeriksaan.', steps: ['Periksa dokumen Penyedia', 'Catat hasil atau alasan revisi', 'Setujui atau kembalikan untuk revisi'], action: 'Buka review Balai', tone: 'working' };
      if (status === 'Disetujui') return { eyebrow: 'Pemeriksaan Balai · selesai', title: 'Laporan pendahuluan sudah disetujui', description: 'Keputusan tersimpan. Data tetap tersedia untuk ditinjau.', steps: ['Pengajuan diperiksa', 'Keputusan telah dicatat', 'Pantau kelanjutan tahap berikutnya'], action: 'Lihat hasil review', tone: 'done' };
      if (status === 'Perlu Revisi') return { eyebrow: 'Pemeriksaan Balai · menunggu', title: 'Revisi telah diminta kepada Penyedia', description: 'Tunggu perbaikan dan pengajuan ulang sebelum memberikan keputusan berikutnya.', steps: ['Alasan revisi tercatat', 'Menunggu Penyedia memperbaiki', 'Periksa ulang saat diajukan'], action: 'Lihat catatan review', tone: 'waiting' };
      return { eyebrow: 'Pemeriksaan Balai · menunggu', title: 'Belum ada laporan yang diajukan', description: 'Penyedia masih menyiapkan data. Balai tidak mengisi checklist atas nama Penyedia.', steps: ['Pantau status persiapan', 'Tunggu pengajuan Penyedia', 'Review setelah diajukan'], action: 'Lihat status paket', tone: 'waiting' };
    }
    return { eyebrow: directorate ? 'Monitoring Direktorat' : 'Pemantauan administrasi', title: status === 'Disetujui' ? 'Persiapan telah disetujui Balai' : status === 'Diajukan' ? 'Laporan sedang direview Balai' : status === 'Perlu Revisi' ? 'Perbaikan persiapan sedang diperlukan' : 'Persiapan masih berlangsung', description: directorate ? 'Pantau perkembangan dan keputusan Balai. Pemeriksaan Tahap 0 tetap menjadi kewenangan PIC Balai.' : 'Pantau kelengkapan administrasi. Admin tidak memberikan keputusan teknis QA/QC.', steps: ['Lihat status paket', 'Telusuri hasil/catatan yang tercatat', 'Pantau proses sesuai kewenangan'], action: 'Lihat perkembangan', tone: 'neutral' };
  }
  const ready = args.ready ?? 0;
  const total = args.surveyTotal ?? 0;
  const remaining = Math.max(0, total - ready);
  if (provider) return { eyebrow: 'Pekerjaan Penyedia · kalibrasi', title: total > 0 && remaining === 0 ? 'Semua jenis survei telah memenuhi kesiapan tercatat' : `${remaining} dari ${total} jenis survei masih perlu dilengkapi`, description: 'Pilih jenis survei, catat alat dan personel, lampirkan bukti, lalu selesaikan checklist Draft PP sesuai jenisnya.', steps: ['Pilih jenis survei yang ditugaskan', 'Lengkapi alat, personel, dan bukti', 'Simpan checklist kalibrasi dan periksa status'], action: 'Buka formulir kalibrasi', tone: remaining === 0 && total > 0 ? 'done' : 'working' };
  if (balai) return { eyebrow: 'Balai · peninjauan kesiapan', title: `${ready} dari ${total} jenis survei tercatat siap`, description: 'Tinjau data dan bukti secara baca-saja. Tahap kalibrasi ini tidak memiliki persetujuan Balai tersendiri.', steps: ['Lihat alat dan personel per jenis survei', 'Periksa kelengkapan sumber dan sertifikat', 'Gunakan hasilnya saat pemeriksaan tahap terkait'], action: 'Lihat data kalibrasi', tone: 'neutral' };
  if (directorate) return { eyebrow: 'Direktorat · monitoring', title: `${ready} dari ${total} jenis survei tercatat siap`, description: 'Kesiapan kalibrasi merupakan informasi pendukung pemantauan dan audit pusat; bukan tugas pengisian Direktorat.', steps: ['Pantau kesiapan per jenis survei', 'Lihat referensi bukti yang tersedia', 'Gunakan sebagai konteks audit sesuai kewenangan'], action: 'Pantau kalibrasi', tone: 'neutral' };
  return { eyebrow: 'Admin · pemantauan sistem', title: `${ready} dari ${total} jenis survei tercatat siap`, description: 'Pantau data alat dan personel tanpa mengubah isi teknis atau mengambil keputusan QA/QC.', steps: ['Lihat kelengkapan data yang tercatat', 'Pantau status pada paket', 'Kelola administrasi pada modul yang sesuai'], action: 'Lihat data kalibrasi', tone: 'neutral' };
}

