import { apiRequest } from '../../auth/client';
import type { CorrectionCase, WorkflowRole } from '../../workflow/model';

export type CorrectionAction =
  | 'edit' | 'verify_surveyor' | 'unverify_surveyor' | 'verify_team_leader' | 'unverify_team_leader' | 'submit'
  | 'verify_balai' | 'approve' | 'revise' | 'execute' | 'retest' | 'close';

const PROVIDER = 'Penyedia Jasa / Ketua Tim';
const PIC = 'PIC Balai / Pengguna Jasa';
const DIRECTORATE = 'Direktorat / Pusat';

/** Who records the retest and closes the case, by blocked stage (same rule as the server RPCs). */
export function retestOwner(blockedStage: string): WorkflowRole {
  if (/^Audit tingkat 1$/i.test(blockedStage)) return PROVIDER;
  if (/^Audit tingkat 3$/i.test(blockedStage)) return DIRECTORATE;
  return PIC;
}

/** Actions the server will accept for this role and case state; the UI shows only these. */
export function availableCorrectionActions(c: CorrectionCase, role: WorkflowRole): CorrectionAction[] {
  const v = c.verification ?? { surveyor: false, teamLeader: false, balai: false };
  const actions: CorrectionAction[] = [];
  const failedRetest = c.status === 'Verifikasi Ulang' && c.retest === 'Gagal';
  if (role === PROVIDER) {
    if (c.status === 'Terbuka' || failedRetest) actions.push('edit');
    if (c.status === 'Terbuka') {
      if (!v.surveyor) actions.push('verify_surveyor');
      else if (!v.teamLeader) actions.push('unverify_surveyor', 'verify_team_leader');
      else actions.push('unverify_team_leader', 'submit');
    } else if (failedRetest && v.surveyor && v.teamLeader) {
      actions.push('submit');
    }
    if (c.status === 'Disetujui' && c.approval === 'Disetujui') actions.push('execute');
  }
  if (role === PIC && c.status === 'Menunggu Persetujuan' && c.approval === 'Diajukan') {
    actions.push(v.balai ? 'approve' : 'verify_balai', 'revise');
  }
  if (role === retestOwner(c.blockedStage) && ['Dilaksanakan', 'Verifikasi Ulang'].includes(c.status) && c.executionReference && !failedRetest) {
    actions.push('retest');
    if (c.status === 'Verifikasi Ulang' && c.retest === 'Lulus' && v.surveyor && v.teamLeader && v.balai && c.retestReference) actions.push('close');
  }
  return actions;
}

export type CorrectionActionInput = { note?: string; reference?: string; passed?: boolean; patch?: Record<string, unknown> };

/** Sends one action with the case's server version; the caller re-reads the case afterwards. */
export async function performCorrectionAction(packageId: string, c: CorrectionCase, action: CorrectionAction, input: CorrectionActionInput = {}) {
  const base = `/paket/${encodeURIComponent(packageId)}/koreksi/${encodeURIComponent(c.id)}`;
  const expected_version = c.serverVersion ?? 0;
  const post = (path: string, body: Record<string, unknown>) =>
    apiRequest<unknown>(`${base}${path}`, { method: 'POST', body: JSON.stringify({ expected_version, ...body }) });
  switch (action) {
    case 'edit': return apiRequest<unknown>(base, { method: 'PATCH', body: JSON.stringify({ expected_version, ...input.patch }) });
    case 'verify_surveyor': return post('/verifikasi', { tahap: 'surveyor', nilai: true });
    case 'unverify_surveyor': return post('/verifikasi', { tahap: 'surveyor', nilai: false });
    case 'verify_team_leader': return post('/verifikasi', { tahap: 'team_leader', nilai: true });
    case 'unverify_team_leader': return post('/verifikasi', { tahap: 'team_leader', nilai: false });
    case 'verify_balai': return post('/verifikasi', { tahap: 'balai', nilai: true });
    case 'submit': return post('/ajukan', {});
    case 'approve': return post('/review', { keputusan: 'Disetujui', catatan: input.note ?? '' });
    case 'revise': return post('/review', { keputusan: 'Perlu Revisi', catatan: input.note ?? '' });
    case 'execute': return post('/laksana', { execution_reference: input.reference ?? '' });
    case 'retest': return post('/uji-ulang', { hasil: input.passed ? 'Lulus' : 'Gagal', retest_reference: input.reference ?? '' });
    case 'close': return post('/tutup', {});
  }
}
