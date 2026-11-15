import { z } from 'zod';

const id = z.number().int().positive().max(2147483647);
const version = z.number().int().min(0).max(2147483646);

export const stage4LrsIdSchema = z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(id);

export const stage4LrsSaveSchema = z.object({
  expected_version: version,
  panjang_lapangan_m: z.number().finite().nonnegative(),
  panjang_acuan_m: z.number().finite().nonnegative(),
  jumlah_error_topologi: z.number().int().nonnegative().max(2147483647),
  format_sesuai_glossary: z.boolean(),
  sta_konsisten_iri_pci_ldt: z.boolean(),
}).strict();

export const stage4WorkflowVersionSchema = z.object({
  expected_version: version,
}).strict();

export const stage4WorkflowReviewSchema = z.object({
  expected_version: version,
  keputusan: z.enum(['PERLU_REVISI', 'DISETUJUI']),
  catatan: z.string().trim().max(2000),
}).strict().refine(value => value.keputusan !== 'PERLU_REVISI' || value.catatan.length > 0, {
  message: 'Catatan wajib diisi apabila meminta revisi', path: ['catatan'],
});

export type Stage4LrsSave = z.infer<typeof stage4LrsSaveSchema>;
