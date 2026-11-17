export const ACCEPTANCE_CRITERIA = [
  'Format data sesuai dengan ketentuan',
  'Data lengkap untuk semua parameter yang disyaratkan',
  'Ketelitian data memenuhi standar',
  'Hasil verifikasi dan validasi menunjukkan kesesuaian',
  'Dokumentasi QA/QC lengkap dan sesuai',
] as const;

export type AcceptanceCriterion = (typeof ACCEPTANCE_CRITERIA)[number];

import type { OperationalWorkflowState } from './model';
import { semesterTwoApplies, termReadiness } from './flowRules';
import { workflowFormIssues } from './repository/workflowReconciliation';

export function finalAcceptanceBlockers(state: OperationalWorkflowState): string[] {
  const { acceptance, audits, corrections } = state;
  const blockers = workflowFormIssues(state).map(issue => issue.message);
  if (audits.length !== 3 || audits.some(audit => audit.status !== 'Lulus' || audit.requiresReview)) {
    blockers.push('Audit tingkat 1, 2, dan 3 harus lulus dan berlaku.');
  }
  if (state.submission.validationStatus !== 'VALID') blockers.push('Penyerahan data belum VALID.');
  if (corrections.some(item => item.status !== 'Ditutup')) blockers.push('Temuan mutu masih terbuka.');
  if (!ACCEPTANCE_CRITERIA.every(item => acceptance.acceptanceCriteria?.[item] === true)) {
    blockers.push('Kriteria penerimaan belum lengkap.');
  }
  for (const id of ['T1', 'T2', 'T3', 'T4']) {
    if (!acceptance.terms.find(term => term.id === id)?.complete ||
        !acceptance.partialReceipts.includes(`BA penerimaan ${id}`)) {
      blockers.push(`Termin ${id} atau BA parsial belum tercatat.`);
    }
    blockers.push(...termReadiness(state, id));
  }
  if (!acceptance.finalReport || !acceptance.semesterTwoEvidence?.finalReportReference?.trim()) {
    blockers.push('Laporan akhir dan referensinya wajib dicatat.');
  }
  if (semesterTwoApplies(state) && !acceptance.semesterTwoRevalidation) {
    blockers.push('Persetujuan revalidasi Semester II belum tercatat.');
  }
  return [...new Set(blockers)];
}
