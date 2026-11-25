import { z } from 'zod';
const answer = z.object({
  item_id: z.number().int().positive().max(2147483647),
  jawaban: z.enum(['Ya', 'Tidak']).nullable(),
  keterangan: z.string().trim().max(2000).optional(),
}).strict();
export const checklistDraftSchema = z.object({
  expected_version: z.number().int().min(0).max(2147483646),
  jawaban: z.array(answer).min(1).max(25).refine(
    rows => new Set(rows.map(row => row.item_id)).size === rows.length,
    'Satu item hanya boleh dihantar sekali',
  ),
}).strict();

const iriItemNumbers = [
  ...Array.from({ length: 10 }, (_, index) => `IRI-CAL-2.${index + 1}`),
  ...Array.from({ length: 10 }, (_, index) => `IRI-VAL-3.${index + 1}`),
  ...Array.from({ length: 5 }, (_, index) => `IRI-GPS-4.${index + 1}`),
  ...Array.from({ length: 5 }, (_, index) => `IRI-DOC-5.${index + 1}`),
] as const;
export const stage1IriAnswerSchema = z.object({
  key: z.enum([...iriItemNumbers] as [string, ...string[]]),
  value: z.enum(['Ya', 'Tidak']).nullable(),
  note: z.string().trim().max(2000).nullable().optional(),
}).strict();
export const stage1IriDraftSchema = z.object({
  template_id: z.number().int().positive().max(2147483647),
  expected_version: z.number().int().min(0).max(2147483646),
  answers: z.array(stage1IriAnswerSchema).min(1).max(30).refine(rows => new Set(rows.map(row => row.key)).size === rows.length, 'Satu item hanya boleh dihantar sekali'),
}).strict();

export const checklistEvidenceSchema = z.object({
  expected_version: z.number().int().min(0).max(2147483646),
  item_id: z.number().int().positive().max(2147483647),
  bukti_dokumen_id: z.number().int().positive().max(2147483647).nullable(),
}).strict();

export const preparationSubmitSchema = z.object({
  expected_version: z.number().int().min(0).max(2147483646),
}).strict();

export const preparationReviewSchema = preparationSubmitSchema.extend({
  keputusan: z.enum(['PERLU_REVISI', 'DISETUJUI']),
  catatan: z.string().trim().max(2000).default(''),
}).strict().refine(value => value.keputusan !== 'PERLU_REVISI' || value.catatan.length > 0, 'Catatan diperlukan untuk meminta revisi');
