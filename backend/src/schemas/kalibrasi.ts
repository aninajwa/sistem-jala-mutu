import { z } from 'zod';
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !value.startsWith('0000') && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Tarikh tidak valid');
const fields = z.object({ jenis: z.enum(['REFERENSI','RELATIF']), standar: z.string().trim().min(1).max(255), komponen: z.string().trim().min(1).max(255), tgl_kalibrasi: date, berlaku_sd: date.nullable().optional(), pelaksana: z.string().trim().min(1).max(255) });
export const calibrationCreateSchema = fields.extend({ alat_id: z.number().int().positive().max(2147483647) }).strict().refine(d=>!d.berlaku_sd || d.berlaku_sd>=d.tgl_kalibrasi,'Tarikh tamat tidak boleh lebih awal daripada kalibrasi');
export const calibrationPatchSchema = fields.partial().extend({ expected_version: z.number().int().min(1).max(2147483646) }).strict().refine(d=>Object.keys(d).some(k=>k!=='expected_version'),'Isi sekurang-kurangnya satu perubahan');
export const certificateUploadSchema = z.object({ expected_version: z.string().regex(/^[1-9]\d*$/).transform(Number).refine(n=>Number.isSafeInteger(n)&&n<=2147483646) }).strict();
