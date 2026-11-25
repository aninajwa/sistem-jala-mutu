import { ApiError } from './supabase';

export type ChecklistIdentity = { roles: Array<{ nama: string }> };
export type Stage1IriActivation = {
  enabled?: string;
  projectDraftAccepted?: string;
  authorizationInstalled?: string;
};

export function assertStage1IriChecklistEnabled(config: Stage1IriActivation = {
  enabled: process.env.STAGE1_IRI_CHECKLIST_ENABLED,
  projectDraftAccepted: process.env.STAGE1_IRI_PROJECT_DRAFT_ACCEPTED,
  authorizationInstalled: process.env.STAGE1_IRI_AUTHORIZATION_CONTRACT_INSTALLED,
}) {
  if (config.enabled !== 'true' || config.projectDraftAccepted !== 'true' || config.authorizationInstalled !== 'true') throw new ApiError(503, 'Checklist IRI Tahap 1 belum diaktifkan: internal project draft dan kontrak database terpasang diperlukan.');
}

export function assertStage1IriChecklistEditor(identity: ChecklistIdentity) {
  if (!identity.roles.some(role => role.nama === 'penyedia_jasa')) throw new ApiError(403, 'Hanya Penyedia Jasa boleh mengubah draf checklist IRI.');
}
