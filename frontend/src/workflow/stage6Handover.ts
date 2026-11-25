import type { SurveyType, WorkflowRole } from './model';

export type HandoverStatus = 'Diajukan' | 'Perlu Perbaikan' | 'Diperiksa';
export type HandoverEvent = {
  id: string;
  at: string;
  actor: 'Penyedia' | 'Balai';
  action: 'Ajukan' | 'Kembalikan' | 'Periksa';
  note: string;
};
export type HandoverRecord = {
  id: string;
  packageId: string;
  survey: SurveyType;
  scope: string;
  evidence: string;
  submittedAt: string;
  status: HandoverStatus;
  version: number;
  events: HandoverEvent[];
};
export const stage6HandoverKey = (packageId: string) => `jala-stage6-handover-v1:${encodeURIComponent(packageId)}`;
export function submissionProblems(survey: SurveyType, scope: string, evidence: string, recordCount: number, auditsValid: boolean): string[] {
  return [
    !survey ? 'Pilih jenis survei.' : '',
    !scope.trim() ? 'Tentukan ruas/segmen atau cakupan data yang diserahkan.' : '',
    !evidence.trim() ? 'Cantumkan referensi berkas dan dokumen QA/QC.' : '',
    recordCount < 1 ? 'Belum ada rekaman survei tercatat pada jenis ini.' : '',
    !auditsValid ? 'Audit 1–3 belum lulus dan berlaku.' : '',
  ].filter(Boolean);
}
export function canSubmitHandover(role: WorkflowRole, problems: string[], current?: HandoverRecord): boolean {
  return role === 'Penyedia Jasa / Ketua Tim' && problems.length === 0 && (!current || current.status === 'Perlu Perbaikan');
}
export function canReviewHandover(role: WorkflowRole, current?: HandoverRecord): boolean {
  return role === 'PIC Balai / Pengguna Jasa' && !!current && current.status === 'Diajukan';
}
export function makeHandoverEvent(actor: 'Penyedia' | 'Balai', action: HandoverEvent['action'], note: string): HandoverEvent {
  return {id: crypto.randomUUID(), at: new Date().toISOString(), actor, action, note};
}


/** Prototype handover lifecycle, kept separate from official BA / SMD decisions. */
export function applyHandoverSubmission(input: {
  role: WorkflowRole;
  packageId: string;
  survey: SurveyType;
  scope: string;
  evidence: string;
  problems: string[];
  previous?: HandoverRecord;
  at: string;
  eventId: string;
  recordId: string;
}): HandoverRecord {
  if (!canSubmitHandover(input.role, input.problems, input.previous)) {
    throw new Error('Pengajuan tidak diizinkan atau belum memenuhi persyaratan.');
  }
  if (input.previous && (input.previous.packageId !== input.packageId || input.previous.survey !== input.survey)) {
    throw new Error('Riwayat pengajuan tidak cocok dengan paket dan jenis survei.');
  }
  const event: HandoverEvent = {
    id: input.eventId, at: input.at, actor: 'Penyedia', action: 'Ajukan',
    note: `Cakupan: ${input.scope.trim()}; bukti: ${input.evidence.trim()}`,
  };
  return {
    id: input.previous?.id ?? input.recordId,
    packageId: input.packageId,
    survey: input.survey,
    scope: input.scope.trim(),
    evidence: input.evidence.trim(),
    submittedAt: input.at,
    status: 'Diajukan',
    version: (input.previous?.version ?? 0) + 1,
    events: [...(input.previous?.events ?? []), event],
  };
}

export function applyHandoverReview(input: {
  role: WorkflowRole;
  record: HandoverRecord;
  action: 'Periksa' | 'Kembalikan';
  reason: string;
  at: string;
  eventId: string;
}): HandoverRecord {
  if (!canReviewHandover(input.role, input.record)) {
    throw new Error('Pengajuan ini tidak dapat diperiksa oleh peran tersebut.');
  }
  if (input.action === 'Kembalikan' && input.reason.trim().length < 5) {
    throw new Error('Alasan pengembalian wajib diisi secara jelas.');
  }
  const event: HandoverEvent = {
    id: input.eventId, at: input.at, actor: 'Balai', action: input.action,
    note: input.action === 'Kembalikan' ? input.reason.trim() :
      'Bukti penyerahan ditinjau; keputusan penerimaan ditetapkan secara terpisah.',
  };
  return {
    ...input.record,
    status: input.action === 'Kembalikan' ? 'Perlu Perbaikan' : 'Diperiksa',
    events: [...input.record.events, event],
  };
}

/** Readiness for the FINAL decision in this local prototype, not an official SMD rule. */
export function handoverLinkProblems(
  packageId: string,
  surveys: readonly SurveyType[],
  records: readonly HandoverRecord[],
): string[] {
  const messages: string[] = [];
  for (const survey of surveys) {
    const matches = records.filter(record => record.packageId === packageId && record.survey === survey);
    const latest = matches.at(-1);
    if (!latest) {
      messages.push(`Belum ada penyerahan ${survey} yang tercatat.`);
      continue;
    }
    if (latest.status !== 'Diperiksa') {
      messages.push(`Penyerahan ${survey} masih ${latest.status.toLowerCase()}.`);
      continue;
    }
    const lastSubmission = latest.events.findLastIndex(event => event.action === 'Ajukan');
    const lastReview = latest.events.findLastIndex(event => event.actor === 'Balai' && event.action === 'Periksa');
    if (lastSubmission < 0 || lastReview <= lastSubmission || !latest.scope.trim() || !latest.evidence.trim()) {
      messages.push(`Riwayat pemeriksaan penyerahan ${survey} tidak lengkap.`);
    }
  }
  return messages;
}
