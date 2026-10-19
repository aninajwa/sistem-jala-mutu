import { z } from 'zod';
const id = z.number().int().positive().max(2147483647);
const text = z.string().trim().min(1).max(255);
const optionalText = z.string().trim().max(255).nullable().optional();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !value.startsWith('0000') && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Tarikh tidak valid').nullable().optional();
const membership = z.object({ peran: text, mulai: date, selesai: date });
export const personnelSchema = z.union([
  membership.extend({ personel_id: id }).strict(),
  membership.extend({ nama: text, nik_internal: optionalText, pendidikan: optionalText, pengalaman_tahun: z.number().int().min(0).max(2147483647).nullable().optional() }).strict(),
]).refine(d => !d.selesai || (!!d.mulai && d.selesai >= d.mulai), 'Tarikh selesai memerlukan mulai dan tidak boleh lebih awal');
export const qualificationSchema = z.object({ jenis: z.enum(['SKA','SKK','PELATIHAN_QA_QC_DJBM']), nomor: text, jenjang: optionalText, berlaku_sd: date }).strict();

export const qualificationEvidenceUploadSchema = z.object({ expected_version: z.string().regex(/^[1-9]\d*$/).transform(Number).refine(n => Number.isSafeInteger(n) && n <= 2147483646) }).strict();
