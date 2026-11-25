import type { Stage4LrsRow } from './serverStage4LrsData';

export const KAK2026_ROAD_LENGTH_TOLERANCE_M = 30;

export type Stage4LengthFinding = {
  category: 'WITHIN_TOLERANCE' | 'REMEASUREMENT_REQUIRED' | 'INCOMPLETE';
  measuredLengthM: number | null;
  referenceLengthM: number | null;
  absoluteDifferenceM: number | null;
  message: string;
};
export type Stage4ObservationFinding = { state: 'OBSERVED_OK' | 'ISSUE_RECORDED' | 'NOT_RECORDED'; label: string; detail: string };
export type Stage4KakAssessment = {
  length: Stage4LengthFinding;
  topology: Stage4ObservationFinding;
  glossary: Stage4ObservationFinding;
  sta: Stage4ObservationFinding;
  source: string;
  officialWorkflow: 'NOT_EVALUATED';
};

function decimal(value: number): { coefficient: bigint; scale: number } | null {
  if (!Number.isFinite(value) || value < 0) return null;
  const raw = String(value);
  const [mantissa, exponentText] = raw.toLowerCase().split('e');
  const exponent = exponentText ? Number(exponentText) : 0;
  const [whole, fraction = ''] = mantissa.split('.');
  let coefficient = BigInt(`${whole}${fraction}`);
  let scale = fraction.length - exponent;
  if (scale < 0) { coefficient *= 10n ** BigInt(-scale); scale = 0; }
  return { coefficient, scale };
}

function finding(label: string, value: boolean | number | null | undefined, kind: 'count' | 'boolean'): Stage4ObservationFinding {
  if (value === null || value === undefined || (kind === 'count' && (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)) ||
    (kind === 'boolean' && typeof value !== 'boolean')) {
    return { state: 'NOT_RECORDED', label, detail: 'Belum tercatat pada observasi LRS.' };
  }
  if (kind === 'count') {
    return value === 0
      ? { state: 'OBSERVED_OK', label, detail: 'Observasi mencatat 0 error; ini bukan verifikasi topologi/geometri menyeluruh.' }
      : { state: 'ISSUE_RECORDED', label, detail: `${value} error topologi tercatat; tindak lanjuti pemeriksaan geometri.` };
  }
  return value
    ? { state: 'OBSERVED_OK', label, detail: 'Observasi tercatat sesuai; bukan bukti verifikasi dokumen/SMD.' }
    : { state: 'ISSUE_RECORDED', label, detail: 'Observasi tercatat tidak sesuai; perlu ditinjau.' };
}

export function assessStage4Kak2026(row: Pick<Stage4LrsRow,
  'panjang_lapangan_m' | 'panjang_acuan_m' | 'jumlah_error_topologi' | 'format_sesuai_glossary' | 'sta_konsisten_iri_pci_ldt'>): Stage4KakAssessment {
  const measuredValue = row.panjang_lapangan_m;
  const referenceValue = row.panjang_acuan_m;
  const measured = measuredValue === null ? null : decimal(measuredValue);
  const reference = referenceValue === null ? null : decimal(referenceValue);
  let length: Stage4LengthFinding;
  if (!measured || !reference) {
    length = {
      category: 'INCOMPLETE', measuredLengthM: measured ? measuredValue : null,
      referenceLengthM: reference ? referenceValue : null, absoluteDifferenceM: null,
      message: 'Panjang lapangan dan acuan yang sah dalam meter diperlukan; selisih tidak dihitung.',
    };
  } else {
    const scale = Math.max(measured.scale, reference.scale);
    const measuredScaled = measured.coefficient * 10n ** BigInt(scale - measured.scale);
    const referenceScaled = reference.coefficient * 10n ** BigInt(scale - reference.scale);
    const delta = measuredScaled >= referenceScaled ? measuredScaled - referenceScaled : referenceScaled - measuredScaled;
    const difference = Number(`${delta}e-${scale}`);
    const within = delta <= BigInt(KAK2026_ROAD_LENGTH_TOLERANCE_M) * 10n ** BigInt(scale);
    length = {
      category: within ? 'WITHIN_TOLERANCE' : 'REMEASUREMENT_REQUIRED',
      measuredLengthM: measuredValue,
      referenceLengthM: referenceValue,
      absoluteDifferenceM: difference,
      message: within
        ? `Selisih ${difference} m berada dalam toleransi panjang ${KAK2026_ROAD_LENGTH_TOLERANCE_M} m per ruas. Ini hanya temuan panjang, bukan kelulusan RNI/LRS.`
        : `Selisih ${difference} m melebihi toleransi ${KAK2026_ROAD_LENGTH_TOLERANCE_M} m. Ukur ulang ruas; jika pengukuran kedua mengesahkan hasil pertama, maklumkan Pengguna Jasa. Jangan statuskan lulus.`,
    };
  }
  return {
    length,
    topology: finding('Topologi', row.jumlah_error_topologi, 'count'),
    glossary: finding('Glossary', row.format_sesuai_glossary, 'boolean'),
    sta: finding('Konsistensi STA', row.sta_konsisten_iri_pci_ldt, 'boolean'),
    source: 'KAK 2026 §11.9.2 Prosedur dan §11.9.7 Penerimaan; batas 30 m per ruas.',
    officialWorkflow: 'NOT_EVALUATED',
  };
}
