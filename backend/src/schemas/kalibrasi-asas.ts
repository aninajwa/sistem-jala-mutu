import { z } from 'zod';
const id = z.number().int().positive().max(2147483647);
const name = z.string().trim().min(1).max(255);
const optionalText = z.string().trim().max(255).nullable().optional();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !value.startsWith('0000') && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Tarikh tidak valid').nullable().optional();
export const providerSchema = z.object({ nama: name }).strict();
export const teamSchema = z.object({ penyedia_id: id, jenis_survei_id: id, nama_tim: name }).strict();
const assignment = z.object({ kendaraan: optionalText, mulai: date, selesai: date });
export const teamEquipmentSchema = z.union([
  assignment.extend({ alat_id: id }).strict(),
  assignment.extend({ nama_alat: name, nomor_seri: name, kondisi: name, merek_tipe: optionalText, kelas: optionalText, tahun_perolehan: z.number().int().min(1900).max(2100).nullable().optional(), milik_djbm: z.boolean() }).strict(),
]).refine(value => !value.selesai || (!!value.mulai && value.selesai >= value.mulai), 'Tarikh selesai memerlukan mulai dan tidak boleh lebih awal');
