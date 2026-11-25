import type { AuditSampleUnit, CorrectionCase, DailySurveyRecord, SurveyType } from './model';

/** Resolve only proven record identities. Never turn a broken sample link into an unlinked case. */
export function resolveAuditRejectionRecords(input: {
  units: AuditSampleUnit[];
  surveyType: SurveyType;
  records: DailySurveyRecord[];
}): { recordIds: (string | undefined)[]; error?: string } {
  const invalid = input.units.filter(unit => unit.reviewStatus === 'Tidak Valid');
  const relevant = invalid.filter(unit => unit.surveyType === input.surveyType);
  if (invalid.length && !relevant.length) {
    return { recordIds: [], error: 'Jenis survei penolakan tidak memiliki sampel berstatus Tidak Valid. Pilih jenis survei yang sesuai dengan temuan.' };
  }
  const ids = [...new Set(relevant.map(unit => unit.sourceRecordId))];
  if (ids.some(id => !id || !input.records.some(record => record.id === id && record.surveyType === input.surveyType))) {
    return { recordIds: [], error: 'Sampel tidak valid tidak memiliki rekaman sumber yang cocok. Periksa kembali sampel sebelum membuat kasus.' };
  }
  // A rejection from a checklist may have no invalid sample unit. Keep it explicitly unlinked.
  return { recordIds: ids.length ? ids : [undefined] };
}

export function hasOpenAuditRejectionCase(input: {
  cases: CorrectionCase[];
  source: string;
  surveyType: SurveyType;
  recordId: string | undefined;
}): boolean {
  return input.cases.some(item =>
    item.source === input.source &&
    item.surveyType === input.surveyType &&
    item.status !== 'Ditutup' &&
    item.linkedRecordId === input.recordId,
  );
}
