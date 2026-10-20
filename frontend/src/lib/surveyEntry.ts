import type { Survey } from '../types';

const REQUIRED_SUBMISSION_FIELDS: Array<[string, string]> = [
  ['balai', 'Balai'],
  ['jenis', 'Jenis survei'],
  ['ruas', 'Nama ruas'],
  ['tanggal', 'Tanggal survei'],
  ['alat', 'Alat survei'],
  ['hasil', 'Hasil awal'],
  ['km', 'Panjang ruas'],
];

export function prepareSurveyEntry(
  id: string,
  form: Record<string, string>,
  existing?: Survey,
): { survey?: Survey; error?: string } {
  const status = existing?.status ?? (form.status === 'Diserahkan' ? 'Diserahkan' : 'Draft');
  const kmInput = form.km?.trim() ?? '';
  const km = kmInput ? Number(kmInput) : 0;

  if (status === 'Diserahkan') {
    const missing = REQUIRED_SUBMISSION_FIELDS
      .filter(([key]) => !form[key]?.trim())
      .map(([, label]) => label);
    if (kmInput && (!Number.isFinite(km) || km < 0)) missing.push('Panjang ruas yang valid');
    if (missing.length) return { error: `Lengkapi data sebelum diserahkan: ${missing.join(', ')}.` };
  }

  return {
    survey: {
      id,
      balai: form.balai || existing?.balai || '',
      ruas: form.ruas?.trim() ?? '',
      jenis: form.jenis || existing?.jenis || '',
      tanggal: form.tanggal || existing?.tanggal || '',
      alat: form.alat || existing?.alat || '',
      status,
      hasil: form.hasil?.trim() ?? '',
      km: Number.isFinite(km) && km >= 0 ? km : existing?.km ?? 0,
      reviewNote: existing?.reviewNote,
      verificationNoteDraft: existing?.verificationNoteDraft,
    },
  };
}
