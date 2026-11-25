import type { ApprovalState, WorkflowRole } from './model';

/** Isian checklist hanya boleh diubah oleh Penyedia sebelum atau sesudah revisi. */
export function canEditPreparationChecklist(role: WorkflowRole, status: ApprovalState): boolean {
  return role === 'Penyedia Jasa / Ketua Tim' && (status === 'Draft' || status === 'Perlu Revisi' || status === 'Ditolak');
}
