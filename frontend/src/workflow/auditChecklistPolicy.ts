import { AUDIT_REVIEW_CHECKS } from './flowRules';
import type { SurveyType, AuditLevel } from './model';

/** KAK 2026, 11.10.5: visual evidence applies to visual observation surveys.
 * Keep exact persisted review-check keys for applicable existing checks.
 * The source-document checklist itself is selected by survey and audit level
 * through sourceDocument(...); this is only the SHORT decision checklist. */
const visuallyObserved = new Set<SurveyType>(['PCI', 'Jembatan', 'Drainase', 'Lereng', 'RNI']);

export function auditChecksForScope(level: 1 | 2 | 3, surveyTypes: readonly SurveyType[]): string[] {
  const checks = AUDIT_REVIEW_CHECKS[level];
  if (level === 1) {
    return checks.filter((check, index) => index !== 2 || surveyTypes.some(type => visuallyObserved.has(type)));
  }
  if (level === 2) {
    return checks.filter((check, index) => index !== 2 || surveyTypes.some(type => visuallyObserved.has(type)));
  }
  return surveyTypes.includes('Jembatan')
    ? checks
    : [checks[0], 'Penilaian ulang acak sesuai cakupan audit yang ditetapkan selesai'];
}

/** Historical Lulus must not be shown as a current approval after source/evidence changes. */
export function auditStatusForDisplay(audit: Pick<AuditLevel, 'status' | 'requiresReview'>): string {
  return audit.requiresReview ? 'Perlu Review Ulang' : audit.status;
}
