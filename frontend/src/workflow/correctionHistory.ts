import type { WorkflowEvent } from './model';

const labels: Record<string, string> = {
  status: 'Status', approval: 'Keputusan usulan', reviewNote: 'Catatan pemeriksa',
  retest: 'Hasil pemeriksaan ulang', retestReference: 'Referensi pemeriksaan',
  retestFailureReason: 'Alasan gagal', actionType: 'Tindakan', owner: 'Penanggung jawab',
  dueDate: 'Tenggat', rootCause: 'Akar masalah', proposedPlan: 'Rencana tindakan',
  evidence: 'Catatan bukti', executionReference: 'Referensi pelaksanaan',
};
/** Keep the underlying immutable log unchanged. Only render allowlisted operational fields. */
export function correctionEventSummary(event: Pick<WorkflowEvent, 'action'|'object'|'newValue'>): {title: string; detail: string} {
  const title = event.action === 'Verifikasi bukti oleh surveyor' ? 'Pencatatan bukti pemeriksaan Surveyor'
    : event.action === 'Verifikasi bukti oleh teamLeader' ? 'Pencatatan pemeriksaan Ketua Tim'
    : event.action === 'Verifikasi bukti oleh balai' ? 'Pencatatan pemeriksaan Balai' : event.action;
  const prefix = `corrections[${event.object}].`;
  const value = event.newValue || '';
  const parts = value.split(/ · (?=[\w.[\]-]+: )/);
  const detail = parts.flatMap(part => {
    if (!part.startsWith(prefix)) return [];
    const i = part.indexOf(': ', prefix.length);
    if (i < 0) return [];
    const label = labels[part.slice(prefix.length, i)];
    const content = part.slice(i + 2).trim();
    return label && content && !/^(true|false|null|undefined|\{\}|\[\])$/.test(content) ? [`${label}: ${content}`] : [];
  }).join('\n');
  return {title, detail};
}
