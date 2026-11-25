import { z } from 'zod';

const id = z.number().int().positive().max(2147483647);
const version = z.number().int().min(0).max(2147483646);
const text = (max: number) => z.string().trim().max(max);

export const auditLevelSchema = z.string().regex(/^[1-3]$/).transform(Number);
export const terminNumberSchema = z.string().regex(/^[1-4]$/).transform(Number);

export const uploadSistemSchema = z.object({
  jenis_survei_id: id,
  sistem_id: id,
  status: z.enum(['VALID', 'ERROR']),
  semester: z.number().int().min(1).max(2).optional(),
  jumlah_record: z.number().int().nonnegative().max(2147483647).nullable().optional(),
  pesan: z.array(z.object({
    sta: z.number().finite().nullable().optional(),
    kode_error: text(50).optional(),
    pesan: text(1000).min(1),
  }).strict()).max(200).optional(),
}).strict();

const sampleSchema = z.object({
  sta_awal: z.number().finite().nonnegative(),
  sta_akhir: z.number().finite().nonnegative(),
  nilai_asli: z.number().finite(),
  nilai_verifikasi: z.number().finite(),
  status: z.enum(['Sesuai', 'Tidak Sesuai']).optional(),
}).strict();

export const auditSaveSchema = z.object({
  expected_version: version,
  checklist: z.record(z.string().max(120), z.boolean()).optional(),
  ba_number: text(100).optional(),
  catatan: text(2000).optional(),
  persen_sampel_realisasi: z.number().finite().min(0).max(100).optional(),
  sampel: z.array(sampleSchema).max(500).optional(),
}).strict();

export const auditDecisionSchema = z.object({
  expected_version: version,
  keputusan: z.enum(['Lulus', 'Ditolak']),
  catatan: text(2000),
}).strict().refine(value => value.keputusan !== 'Ditolak' || value.catatan.length > 0, {
  message: 'Alasan penolakan wajib diisi', path: ['catatan'],
});

export const penerimaanSchema = z.object({
  expected_version: version,
  jenis: z.enum(['PARSIAL', 'AKHIR']),
  nomor_ba: text(100).min(1),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  volume_diterima: z.number().finite().nonnegative().optional(),
}).strict();
