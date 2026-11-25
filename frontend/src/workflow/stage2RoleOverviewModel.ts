import type { ApprovalState, WorkflowRole } from './model';

export type Stage2RoleOverview = {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  actionTarget: string;
  status: string;
  tone: 'neutral' | 'warning' | 'success';
  helper: string;
};

export function stage2RoleOverview(
  role: WorkflowRole,
  approval: ApprovalState,
  blockerCount: number,
  selectedCount: number,
): Stage2RoleOverview {
  const hasBlockers = blockerCount > 0;
  const staleApproval = approval === 'Disetujui' && hasBlockers;
  const status = staleApproval
    ? 'Pernah disetujui · perlu pemeriksaan ulang'
    : approval === 'Disetujui' ? 'Telah disetujui Balai'
    : approval === 'Perlu Revisi' ? 'Perlu diperbaiki Penyedia'
    : approval === 'Diajukan' ? 'Menunggu keputusan Balai'
    : approval === 'Ditolak' ? 'Ditolak · perlu tindak lanjut'
    : 'Belum diajukan';
  const tone: Stage2RoleOverview['tone'] = approval === 'Disetujui' && !hasBlockers
    ? 'success' : approval === 'Diajukan' || approval === 'Draft' ? 'neutral' : 'warning';
  const suffix = `${selectedCount} jenis survei · ${blockerCount} persyaratan belum terpenuhi.`;

  if (role === 'Penyedia Jasa / Ketua Tim') return {
    eyebrow: 'PEKERJAAN PENYEDIA', title: 'Lengkapi hasil uji',
    description: 'Lengkapi data dan bukti untuk setiap jenis survei.',
    actionLabel: approval === 'Perlu Revisi' || approval === 'Ditolak' ? 'Periksa perbaikan dan pengajuan' : 'Buka pengajuan hasil uji',
    actionTarget: 'stage2-role-action', status, tone,
    helper: hasBlockers ? `Belum siap diajukan. ${suffix}` : `Periksa seluruh bukti sebelum mengajukan. ${suffix}`,
  };
  if (role === 'PIC Balai / Pengguna Jasa') return {
    eyebrow: 'PEMERIKSAAN PIC BALAI', title: 'Periksa hasil uji',
    description: 'Nilai hasil uji, bukti, dan kelayakan alat serta metode.',
    actionLabel: 'Buka area keputusan Balai', actionTarget: 'stage2-role-action', status, tone,
    helper: approval !== 'Diajukan'
      ? `Belum ada pengajuan aktif yang dapat diputuskan. ${suffix}`
      : hasBlockers ? `Persetujuan tertahan sampai persyaratan terpenuhi. ${suffix}`
      : `Hasil diajukan; periksa bukti dan isi referensi BA sebelum persetujuan. ${suffix}`,
  };
  if (role === 'Direktorat / Pusat') return {
    eyebrow: 'PEMANTAUAN DIREKTORAT', title: 'Pantau hasil validasi',
    description: 'Hasil uji, bukti, dan keputusan Balai.',
    actionLabel: 'Lihat status keputusan', actionTarget: 'stage2-role-action', status, tone,
    helper: `Tidak ada tindakan persetujuan Tahap 2 untuk Direktorat. ${suffix}`,
  };
  return {
    eyebrow: 'PEMANTAUAN ADMIN', title: 'Pantau status validasi',
    description: 'Kelengkapan data dan status pemeriksaan paket.',
    actionLabel: 'Lihat status pemeriksaan', actionTarget: 'stage2-role-action', status, tone,
    helper: `Admin tidak mengajukan maupun menyetujui hasil uji. ${suffix}`,
  };
}
