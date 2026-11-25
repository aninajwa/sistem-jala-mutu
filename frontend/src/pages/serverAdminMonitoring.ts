import type { BalaiReviewItem, ReviewStatus } from '../workflow/balaiReviewQueue';
import type { ServerPackageStage } from './useServerPackageStages';
import { PACKAGE_WORKFLOW_ITEMS } from '../workflow/roleNavigation';

type PackageInfo = { project: { id: string; packageName: string; balai: string } };

const ORDER = ['Tahap 0', 'Tahap 1', 'Tahap 2', 'Tahap 3A', 'Tahap 3B', 'Tahap 4', 'Tahap 5', 'Tahap 6', 'Selesai'];
const ROWS = [
  { stage: 'Tahap 0', kind: 'Review persiapan' },
  { stage: 'Tahap 2', kind: 'Review produksi' },
  { stage: 'Tahap 3B', kind: 'V&V berkala 14 hari' },
  { stage: 'Tahap 4', kind: 'Pengajuan RNI/LRS sebelum audit' },
];

/**
 * Admin "Status Review" rows from server stage facts (GET /paket-tahap), not from local demo fields.
 * Read-only projection: a stage before the package's active stage is done, the active one is in progress,
 * later ones wait. Tahap 4 uses the recorded submission status.
 */
export function serverAdminReviewRows(packages: Record<string, PackageInfo>, stages: Record<string, ServerPackageStage>): BalaiReviewItem[] {
  return Object.values(packages).flatMap(({ project }) => {
    const fact = stages[project.id];
    if (!fact) return [];
    const current = ORDER.indexOf(fact.tahap);
    return ROWS.map(({ stage, kind }) => {
      const selection = PACKAGE_WORKFLOW_ITEMS.find(item => item.code === stage)?.selection ?? '';
      const index = ORDER.indexOf(stage);
      let status: ReviewStatus = 'Menunggu';
      let reason = 'Menunggu tahap sebelumnya selesai.';
      if (current > index) { status = 'Selesai/Lulus'; reason = 'Tahap ini tercatat selesai di server.'; }
      else if (current === index || (stage === 'Tahap 3B' && fact.tahap === 'Tahap 3A')) {
        reason = current === index ? `Sedang berjalan: ${fact.keterangan}.` : 'Survei harian berjalan; siklus verval mengikuti.';
        if (stage === 'Tahap 4' && fact.tahap4 === 'DIAJUKAN') { status = 'Perlu Review'; reason = 'Pengajuan Tahap 4 menunggu review PIC Balai.'; }
        if (stage === 'Tahap 4' && fact.tahap4 === 'DITOLAK') { status = 'Perlu Perbaikan'; reason = 'Pengajuan Tahap 4 ditolak; Penyedia perlu memperbaiki.'; }
      }
      const note = fact.koreksi_terbuka ? `${fact.koreksi_terbuka} kasus koreksi terbuka pada paket ini.` : '';
      return { id: `${project.id}:${stage}`, packageId: project.id, packageName: project.packageName, balai: project.balai, stage, kind, status, reason, note, selection };
    });
  });
}
