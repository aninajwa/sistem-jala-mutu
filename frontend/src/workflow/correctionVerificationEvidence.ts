import type { CorrectionCase, WorkflowRole } from './model';
import { requiresLayeredCorrectionVerification } from './correctionActionPolicy';

export const CORRECTION_VERIFICATION_STEPS = ['surveyor', 'teamLeader', 'balai'] as const;
export type CorrectionVerificationStep = typeof CORRECTION_VERIFICATION_STEPS[number];
export const CORRECTION_VERIFICATION_LABELS: Record<CorrectionVerificationStep, string> = {
  surveyor: 'Surveyor', teamLeader: 'Ketua Tim', balai: 'Balai',
};
/** Metadata of an independently obtained examination document. This is NOT a
 * server-authenticated account decision, digital signature or identity proof. */
export type CorrectionVerificationEvidence = {
  reviewerIdentity: string;
  reviewedAt: string;
  dataVersionReference: string;
  evidenceReference: string;
  caseId: string;
  attempt: number;
  proposalRevision: string;
  recordedByRole: WorkflowRole;
  source: 'Referensi dokumen pemeriksaan';
};
export type CorrectionVerificationEvidenceMap = Partial<Record<CorrectionVerificationStep, CorrectionVerificationEvidence>>;

// Exact content binding for the local proposal. Never treat as a cryptographic signature.
export function correctionProposalRevision(c: CorrectionCase): string {
  const ordered = (v?: Record<string, boolean | number>) => Object.entries(v ?? {}).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify([c.id,c.source,c.blockedStage,c.road,c.stationing,c.surveyType,c.cyclePeriod ?? null,c.originReference ?? '',
    c.rejectionReason,c.owner,c.dueDate,c.rootCause,c.fieldDataValid,c.actionType,c.proposedPlan ?? '',c.evidence,
    c.originalValue,c.proposedValue,c.linkedRecordId ?? '',c.ruleScenario ?? '',ordered(c.ruleChecks),ordered(c.ruleNumbers),c.provinceUpdateBa ?? '']);
}
export function correctionVerificationAttempt(c: CorrectionCase, submittedCount: number): number {
  return c.status === 'Terbuka' || (c.status === 'Verifikasi Ulang' && c.retest === 'Gagal')
    ? submittedCount + 1 : Math.max(1, submittedCount);
}
export const correctionVerificationRecordRole = (step: CorrectionVerificationStep): WorkflowRole => step === 'balai' ? 'PIC Balai / Pengguna Jasa' : 'Penyedia Jasa / Ketua Tim';
const text = (v: unknown): v is string => typeof v === 'string' && !!v.trim();
const norm = (v: string) => v.trim().replace(/\s+/g, ' ').toLowerCase();
export function correctionVerificationEvidenceErrors(c: CorrectionCase, attempt: number, required: readonly CorrectionVerificationStep[] = []): string[] {
  const records = c.verificationEvidence ?? {};
  if (!requiresLayeredCorrectionVerification(c)) return Object.keys(records).length ? ['Bukti berlapis hanya untuk koreksi pemrosesan data.'] : [];
  const errors: string[] = [];
  const revision = correctionProposalRevision(c);
  let previous: CorrectionVerificationEvidence | undefined;
  const identities = new Set<string>();
  for (const [index, step] of CORRECTION_VERIFICATION_STEPS.entries()) {
    const record = records[step], label = CORRECTION_VERIFICATION_LABELS[step];
    if (!record) {
      if (required.includes(step) || c.verification?.[step]) errors.push(`Referensi pemeriksaan ${label} belum lengkap.`);
      continue;
    }
    if (!c.verification?.[step]) errors.push(`Pencatatan pemeriksaan ${label} belum dikonfirmasi.`);
    if (!text(record.reviewerIdentity) || !text(record.dataVersionReference) || !text(record.evidenceReference) ||
      !text(record.reviewedAt) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(record.reviewedAt) || !Number.isFinite(Date.parse(record.reviewedAt)) ||
      record.caseId !== c.id || record.attempt !== attempt || record.proposalRevision !== revision ||
      record.recordedByRole !== correctionVerificationRecordRole(step) || record.source !== 'Referensi dokumen pemeriksaan') {
      errors.push(`Referensi pemeriksaan ${label} tidak lengkap atau bukan versi usulan saat ini.`);
      continue;
    }
    if (index > 0 && !records[CORRECTION_VERIFICATION_STEPS[index - 1]]) errors.push(`Catat bukti pemeriksa sebelumnya sebelum ${label}.`);
    if (previous && (norm(previous.dataVersionReference) !== norm(record.dataVersionReference) || Date.parse(previous.reviewedAt) > Date.parse(record.reviewedAt))) errors.push(`Pemeriksaan ${label} harus merujuk versi data yang sama dan mengikuti urutan pemeriksaan.`);
    if (identities.has(norm(record.reviewerIdentity))) errors.push('Surveyor, Ketua Tim, dan Balai harus memiliki identitas pemeriksa yang berbeda.');
    identities.add(norm(record.reviewerIdentity));
    previous = record;
  }
  if (Object.keys(records).some(key => !CORRECTION_VERIFICATION_STEPS.includes(key as CorrectionVerificationStep))) errors.push('Jenis pemeriksaan tidak dikenal.');
  return errors;
}
export function correctionVerificationMetadataFor(c: CorrectionCase, step: CorrectionVerificationStep, attempt: number, input: Pick<CorrectionVerificationEvidence,'reviewerIdentity'|'reviewedAt'|'dataVersionReference'|'evidenceReference'>): CorrectionVerificationEvidence {
  return {...input, reviewerIdentity: input.reviewerIdentity.trim(), dataVersionReference: input.dataVersionReference.trim(), evidenceReference: input.evidenceReference.trim(), caseId:c.id,attempt,proposalRevision:correctionProposalRevision(c),recordedByRole:correctionVerificationRecordRole(step),source:'Referensi dokumen pemeriksaan'};
}
