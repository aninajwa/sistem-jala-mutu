export type SurveyValues = {
  rawValue: string;
  cleanedValue: string;
  cleaningReason: string;
};

export function prepareSurveyValues(
  rawInput: string,
  cleanedInput: string,
  reasonInput: string,
): { values?: SurveyValues; error?: string } {
  const rawValue = rawInput.trim();
  if (!rawValue) return { error: 'Nilai raw wajib diisi sebelum mencatat survei.' };

  const cleanedValue = cleanedInput.trim() || rawValue;
  const cleaningReason = reasonInput.trim();
  if (cleanedValue !== rawValue && !cleaningReason) {
    return { error: 'Alasan koreksi wajib diisi bila nilai QA/QC berbeda dari nilai raw.' };
  }

  return {
    values: {
      rawValue,
      cleanedValue,
      cleaningReason: cleanedValue === rawValue ? '' : cleaningReason,
    },
  };
}
