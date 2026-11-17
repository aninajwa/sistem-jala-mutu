import type {OperationalWorkflowState, WorkflowRole} from '../workflow/model';

export type QueuePriority = 'action' | 'waiting' | 'monitor' | 'complete';
export type DashboardQueueItem = {
  id: string;
  name: string;
  balai: string;
  priority: QueuePriority;
  label: string;
  description: string;
};

/** Derived exclusively from already-authorised packages. No fabricated approval, percentage or API status. */
export function dashboardWorkQueue(packages: Record<string, OperationalWorkflowState>, role: WorkflowRole): DashboardQueueItem[] {
  const result = Object.entries(packages).map(([id, state]): DashboardQueueItem => {
    const name = state.project.packageName || id;
    const balai = state.project.balai || 'Balai belum ditentukan';
    const open = (state.corrections || []).filter(item => item.status !== 'Ditutup').length;
    const preparation = state.project.preparation.reportApproval;
    const production = state.productionApproval;
    const cycle = state.cycle;
    const audits = state.audits || [];
    const accepted = Boolean(state.acceptance?.finalAcceptance);
    const item = (priority: QueuePriority, label: string, description: string): DashboardQueueItem => ({id, name, balai, priority, label, description});

    if (role === 'Admin') return item('monitor', 'Pantau paket', 'Lihat status dan referensi paket; keputusan teknis berada pada pemeriksa berwenang.');
    if (role === 'Penyedia Jasa / Ketua Tim') {
      if (open) return item('action', 'Tindak lanjuti koreksi', `${open} kasus belum ditutup. Periksa pemilik kasus, bukti, dan tahap verifikasi.`);
      if (preparation === 'Perlu Revisi' || preparation === 'Ditolak' || production === 'Perlu Revisi' || production === 'Ditolak')
        return item('action', 'Perlu perbaikan', 'Periksa catatan pemeriksa pada persiapan atau validasi produksi.');
      if (preparation === 'Diajukan' || production === 'Diajukan' || (cycle?.periodCompleted && cycle?.userReview !== 'Sesuai'))
        return item('waiting', 'Menunggu pemeriksaan', 'Pengajuan atau hasil periode menunggu keputusan pemeriksa berwenang.');
      if (accepted) return item('complete', 'Penerimaan tercatat', 'Lihat keputusan dan dokumen penerimaan pada paket.');
      return item('action', 'Lanjutkan pekerjaan paket', 'Buka paket untuk melihat tahapan, formulir, dan persyaratan yang belum lengkap.');
    }
    if (role === 'PIC Balai / Pengguna Jasa') {
      if (preparation === 'Diajukan' || production === 'Diajukan' || (cycle?.periodCompleted && cycle?.userReview !== 'Sesuai') || audits[1]?.status === 'Dalam Review' || audits[1]?.status === 'Klarifikasi')
        return item('action', 'Perlu pemeriksaan Balai', 'Periksa antrean dan bukti sebelum mencatat keputusan sesuai kewenangan.');
      if (open) return item('monitor', 'Pantau koreksi', `${open} kasus belum ditutup. Periksa tindak lanjut dan kewenangan verifikasi.`);
      if (audits[1]?.status === 'Lulus' && audits[2]?.status !== 'Lulus')
        return item('waiting', 'Menunggu audit pusat', 'Audit Balai tercatat lulus; pantau tindak lanjut audit Direktorat.');
      if (accepted) return item('complete', 'Penerimaan tercatat', 'Periksa dokumen dan catatan penerimaan akhir.');
      return item('monitor', 'Pantau paket', 'Tidak ada pengajuan pada indikator antrean ringkas ini.');
    }
    // Directorate can decide level 3 only, and this summary never grants that permission.
    if (audits[1]?.status === 'Lulus' && (audits[2]?.status === 'Dalam Review' || audits[2]?.status === 'Klarifikasi'))
      return item('action', 'Audit pusat dalam proses', 'Buka Audit & Assurance untuk memeriksa bukti dan tindak lanjut audit tingkat 3.');
    if (audits[1]?.status !== 'Lulus')
      return item('waiting', 'Menunggu audit Balai', 'Belum terdapat hasil lulus audit tingkat 2 untuk melanjutkan audit pusat.');
    if (open) return item('monitor', 'Pantau koreksi lintas paket', `${open} kasus belum ditutup.`);
    if (accepted) return item('complete', 'Penerimaan tercatat', 'Lihat status keputusan dan dokumen yang tersedia.');
    return item('monitor', 'Pantau audit pusat', 'Lihat hasil pemeriksaan dan status paket pada Audit & Assurance.');
  });
  const order: Record<QueuePriority, number> = {action: 0, waiting: 1, monitor: 2, complete: 3};
  return result.sort((a, b) => order[a.priority] - order[b.priority] || a.name.localeCompare(b.name, 'id'));
}
