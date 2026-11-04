import { z } from 'zod';

const id = z.number().int().positive().max(2147483647);
const validDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00Z`);
  return !value.startsWith('0000') && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Tanggal tidak valid');
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Waktu tidak valid');
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const sesiSurveiCreateSchema = z.object({
  tim_id: id,
  ruas_id: id,
  alat_id: id,
  operator_id: id.nullable().optional(),
  pengemudi_id: id.nullable().optional(),
  tanggal: validDate,
  jam_mulai: time.nullable().optional(),
  jam_selesai: time.nullable().optional(),
  lajur: optionalText(255),
  arah: optionalText(255),
  cuaca: optionalText(255),
  kondisi_permukaan: optionalText(255),
  panjang_tercapai_km: z.number().finite().nonnegative().nullable().optional(),
  link_video: optionalText(2000),
}).strict();
