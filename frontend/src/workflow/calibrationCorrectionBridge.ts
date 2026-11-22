import type { CalibrationReviewSubject, CorrectionCase, OperationalWorkflowState, SurveyType } from './model';
import { calibrationReviewEntries, calibrationSourceSignature } from './calibrationReview';

export function calibrationFindingCases(state: OperationalWorkflowState, type: SurveyType, subject: CalibrationReviewSubject): CorrectionCase[] {
  return state.corrections.filter(c => c.calibrationFinding?.surveyType === type && c.calibrationFinding.subject === subject);
}
export function pendingCalibrationFinding(state: OperationalWorkflowState, type: SurveyType, subject: CalibrationReviewSubject): CorrectionCase | undefined {
  return calibrationFindingCases(state, type, subject).find(c => c.status !== 'Ditutup');
}
/** Only a Balai-confirmed, current, evidenced mismatch can initiate a formal case. */
export function calibrationFindingCreationError(state: OperationalWorkflowState, c: CorrectionCase): string | undefined {
  const link=c.calibrationFinding;
  if (!link || c.source !== 'Pemeriksaan kalibrasi' || c.blockedStage !== 'Kalibrasi' || c.returnStage !== 'Kalibrasi') return 'Asal temuan kalibrasi tidak sah.';
  if (state.role !== 'PIC Balai / Pengguna Jasa') return 'Hanya Balai dapat membuka temuan dari pemeriksaan kalibrasi.';
  if (!state.project.surveyTypes.includes(link.surveyType) || c.surveyType !== link.surveyType || !state.project.routes.includes(c.road)) return 'Lingkup paket atau jenis survei tidak cocok.';
  const entry=calibrationReviewEntries(state,link.surveyType)[link.subject];
  if (!entry || entry.result !== 'Ada ketidaksesuaian' || !entry.evidenceReference.trim() || !entry.note.trim()) return 'Temuan belum didukung hasil pemeriksaan dan bukti Balai.';
  if (entry.sourceSignature !== calibrationSourceSignature(state,link.surveyType) || link.sourceSignature !== entry.sourceSignature || link.reviewedAt !== entry.reviewedAt) return 'Pemeriksaan sudah berubah; tinjau ulang sebelum membuka temuan.';
  if (c.rejectionReason !== entry.note || c.evidence !== entry.evidenceReference) return 'Uraian dan bukti temuan harus mengikuti pemeriksaan asal.';
  if (pendingCalibrationFinding(state,link.surveyType,link.subject)) return 'Sudah ada kasus perbaikan aktif untuk bagian ini.';
  if (calibrationFindingCases(state,link.surveyType,link.subject).some(previous=>previous.status==='Ditutup'&&previous.calibrationFinding?.sourceSignature===link.sourceSignature&&previous.rejectionReason===c.rejectionReason&&previous.evidence===c.evidence)) return 'Temuan ini telah diselesaikan. Perbarui pemeriksaan bila ada temuan baru.';
  if (c.status !== 'Terbuka' || c.approval !== 'Draft' || c.retest !== 'Belum Diuji' || c.linkedRecordId) return 'Kasus baru harus dibuka sebagai temuan kalibrasi tanpa rekaman survei yang tidak relevan.';
  return undefined;
}
