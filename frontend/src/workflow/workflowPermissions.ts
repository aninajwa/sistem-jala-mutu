
import type { WorkflowRole } from './model';

export type WorkflowAction =
  | 'preparation.edit'
  | 'preparation.submit'
  | 'preparation.review'
  | 'calibration.edit'
  | 'production.edit'
  | 'production.submit'
  | 'production.review'
  | 'daily.record'
  | 'periodic.internal'
  | 'periodic.review'
  | 'periodic.approve'
  | 'submission.prepare'
  | 'submission.review'
  | 'audit.internal'
  | 'audit.balai'
  | 'audit.directorate'
  | 'acceptance.review'
  | 'administration.manage';

const PROVIDER: WorkflowRole =
  'Penyedia Jasa / Ketua Tim';

const BALAI: WorkflowRole =
  'PIC Balai / Pengguna Jasa';

const DIRECTORATE: WorkflowRole =
  'Direktorat / Pusat';

const ADMIN: WorkflowRole = 'Admin';

const PERMISSIONS: Record<
  WorkflowAction,
  readonly WorkflowRole[]
> = {
  'preparation.edit': [PROVIDER],
  'preparation.submit': [PROVIDER],
  'preparation.review': [BALAI],

  'calibration.edit': [PROVIDER],

  'production.edit': [PROVIDER],
  'production.submit': [PROVIDER],
  'production.review': [BALAI],

  'daily.record': [PROVIDER],

  'periodic.internal': [PROVIDER],
  'periodic.review': [BALAI],
  'periodic.approve': [BALAI],

  'submission.prepare': [PROVIDER],
  'submission.review': [BALAI],

  'audit.internal': [PROVIDER],
  'audit.balai': [BALAI],
  'audit.directorate': [DIRECTORATE],

  'acceptance.review': [BALAI],

  'administration.manage': [ADMIN],
};

export function canPerformAction(
  role: WorkflowRole,
  action: WorkflowAction,
): boolean {
  return PERMISSIONS[action].includes(role);
}

export function requireWorkflowPermission(
  role: WorkflowRole,
  action: WorkflowAction,
): void {
  if (!canPerformAction(role, action)) {
    throw new Error(
      `Role ${role} tidak memiliki izin untuk ${action}.`,
    );
  }
}
