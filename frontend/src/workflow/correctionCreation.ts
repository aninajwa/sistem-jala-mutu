import { correctionSourceStage, isAdministrativeReminder } from './correctionSourcePolicy';
import type { CorrectionCase, OperationalWorkflowState } from './model';
import { periodForDate } from './workflowRevisions';
import { productionPciMethod } from './productionFailures';
import { correctionRecordLink, recordPciMethod } from './correctionRecordLink';

/** Shared UI/domain check for ordinary findings. Audit rejection has its own
 * source transaction; it must not be simulated by a manual finding. */
export function correctionCreationError(state: OperationalWorkflowState, n: CorrectionCase, cases = state.corrections): string | undefined {
  if (/audit tingkat [123]/i.test(`${n.source} ${n.blockedStage} ${n.returnStage}`)) return 'Buka temuan audit melalui keputusan audit pada tahap sumber.';
  if (typeof n.id !== 'string' || !n.id.trim() || typeof n.source !== 'string' || typeof n.blockedStage !== 'string' || n.returnStage !== n.blockedStage) return 'Identitas dan tahap asal kasus harus sesuai.';
  if (isAdministrativeReminder(n.source)) return 'Gunakan menu Notifikasi untuk pengingat administratif, bukan temuan mutu.';
  const sourceStage = correctionSourceStage(n.source);
  if (!sourceStage || sourceStage !== n.blockedStage) return 'Sumber temuan tidak sesuai tahap asal.';
  if (n.status !== 'Terbuka' || n.approval !== 'Draft' || n.retest !== 'Belum Diuji' || n.executionResult || n.executionReference || n.retestReference || n.retestFailureReason || n.reviewNote?.trim() || Object.keys(n.verificationEvidence ?? {}).length || n.verification?.surveyor || n.verification?.teamLeader || n.verification?.balai) return 'Temuan baru tidak boleh membawa keputusan, pengesahan atau hasil pelaksanaan.';
  if (n.source === 'Uji coba gagal' && n.surveyType === 'PCI') {
    const method = productionPciMethod(state);
    if (!method || n.originPciMethod !== method) return 'Metode PCI harus sesuai dengan uji produksi sumber.';
  }
  const record = correctionRecordLink(state.dailyRecords,n.road,n.surveyType,n.linkedRecordId);
  const recordMethod = recordPciMethod(record);
  if (n.source !== 'Uji coba gagal' && n.originPciMethod !== recordMethod) return 'Metode PCI harus sesuai rekaman sumber atau uji produksi terkait.';
  if (recordMethod && n.originPciMethod !== recordMethod) return 'Metode PCI tidak sesuai rekaman sumber.';
  if (n.linkedRecordId && !record) return 'Rekaman sumber tidak sesuai ruas atau jenis survei.';
  if (record && n.cyclePeriod !== undefined && periodForDate(state,record.date) !== n.cyclePeriod) return 'Periode kasus tidak sesuai rekaman sumber.';
  if (n.calibrationFinding && cases.some(c => c.id !== n.id && c.status !== 'Ditutup' && c.calibrationFinding?.surveyType === n.calibrationFinding?.surveyType && c.calibrationFinding?.subject === n.calibrationFinding?.subject)) return 'Sudah ada kasus perbaikan aktif untuk bagian kalibrasi ini.';
  const norm = (s?: string) => s?.trim().replace(/\s+/g,' ').toLowerCase() || '';
  const duplicate = cases.some(c => c.id !== n.id && c.status !== 'Ditutup' && c.source === n.source && c.blockedStage === n.blockedStage && c.road === n.road && c.surveyType === n.surveyType && c.cyclePeriod === n.cyclePeriod && (
    n.linkedRecordId ? c.linkedRecordId === n.linkedRecordId : !c.linkedRecordId && !!norm(n.originReference) && norm(c.originReference) === norm(n.originReference) && norm(c.stationing) === norm(n.stationing) && norm(c.rejectionReason) === norm(n.rejectionReason)
  ));
  if (duplicate) return 'Kasus aktif untuk temuan sumber tersebut sudah ada.';
  return undefined;
}
