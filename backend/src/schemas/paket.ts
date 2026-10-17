import { z } from 'zod';
export const paketDraftSchema = z.object({
  nama_paket: z.string().trim().min(1).max(255),
  nomor_kontrak: z.string().trim().min(1).max(100),
  tahun_anggaran: z.number().int().min(2000).max(2100),
  balai_id: z.number().int().positive(),
}).strict();

const validDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  if (value.startsWith('0000')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Tarikh mesti sah dan menggunakan YYYY-MM-DD');

export const paketPatchSchema = z.object({
  nama_paket: z.string().trim().min(1).max(255).optional(),
  nomor_kontrak: z.string().trim().min(1).max(100).optional(),
  tahun_anggaran: z.number().int().min(2000).max(2100).optional(),
  nama_ppk: z.string().trim().max(255).transform(value => value || null).nullable().optional(),
  tgl_spmk: validDate.nullable().optional(),
}).strict().refine(value => Object.keys(value).length > 0, 'Isi sekurang-kurangnya satu perubahan');

export const paketIdSchema = z.string().regex(/^[1-9]\d*$/).transform(Number).refine(
  value => Number.isSafeInteger(value) && value <= 2147483647, 'ID paket tidak valid',
);
