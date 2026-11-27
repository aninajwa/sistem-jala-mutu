import type { DailySurveyRecord, SurveyType, CorrectionCase } from "./model";

/** Only exact route/type matches are eligible; never pick a record implicitly. */
export function matchingCorrectionRecords(records: DailySurveyRecord[], road: string, surveyType: SurveyType): DailySurveyRecord[] {
  return records.filter(record => record.road === road && record.surveyType === surveyType);
}

export function correctionRecordLink(records: DailySurveyRecord[], road: string, surveyType: SurveyType, recordId?: string): DailySurveyRecord | undefined {
  if (!recordId) return undefined;
  return matchingCorrectionRecords(records, road, surveyType).find(record => record.id === recordId);
}

/** Only an explicit method on the linked record is authoritative. */
export function recordPciMethod(record?: DailySurveyRecord): CorrectionCase['originPciMethod'] {
  const method = record?.surveyType === 'PCI' ? record.technicalData?.pciMethod : undefined;
  return method === 'Manual' || method === 'AI' ? method : undefined;
}
export function correctionWithSourceMethod(c: CorrectionCase, records: DailySurveyRecord[]): CorrectionCase {
  const method = recordPciMethod(correctionRecordLink(records,c.road,c.surveyType,c.linkedRecordId));
  return c.originPciMethod || !method ? c : {...c,originPciMethod:method};
}

/** Do not offer a replacement which the transaction will reject. Unknown
 * historical methods remain unknown; do not infer from current configuration. */
export function eligibleCorrectionRecords(c: CorrectionCase, records: DailySurveyRecord[]): DailySurveyRecord[] {
  const method = correctionWithSourceMethod(c, records).originPciMethod;
  return matchingCorrectionRecords(records, c.road, c.surveyType).filter(record => !method || recordPciMethod(record) === method || record.id === c.linkedRecordId);
}
