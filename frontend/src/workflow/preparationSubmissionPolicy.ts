/** Guard pengajuan ulang Tahap 0: keputusan yang sudah disetujui tidak boleh tertimpa. */
export type PreparationApprovalStatus = 'Draft' | 'Diajukan' | 'Perlu Revisi' | 'Disetujui' | 'Ditolak';
export function preparationSubmissionEligibility(status: PreparationApprovalStatus, complete: number, total: number) {
  if (status === 'Disetujui') return { allowed: false, reason: 'Laporan pendahuluan sudah disetujui Balai. Tidak perlu diajukan ulang.' };
  if (status === 'Diajukan') return { allowed: false, reason: 'Pengajuan sedang menunggu pemeriksaan PIC Balai.' };
  if (complete !== total || total <= 0) return { allowed: false, reason: 'Lengkapi seluruh checklist persiapan sebelum mengajukan laporan.' };
  return { allowed: true, reason: '' };
}
