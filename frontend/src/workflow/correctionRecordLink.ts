import type { DailySurveyRecord, SurveyType } from "./model";

/** Only exact route/type matches are eligible; never pick a record implicitly. */
export function matchingCorrectionRecords(records: DailySurveyRecord[], road: string, surveyType: SurveyType): DailySurveyRecord[] {
  return records.filter(record => record.road === road && record.surveyType === surveyType);
}

export function correctionRecordLink(records: DailySurveyRecord[], road: string, surveyType: SurveyType, recordId?: string): DailySurveyRecord | undefined {
  if (!recordId) return undefined;
  return matchingCorrectionRecords(records, road, surveyType).find(record => record.id === recordId);
}
