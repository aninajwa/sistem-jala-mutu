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

export const checklistEvidenceSchema = z.object({
  expected_version: z.number().int().min(0).max(2147483646),
  item_id: z.number().int().positive().max(2147483647),
  bukti_dokumen_id: z.number().int().positive().max(2147483647).nullable(),
}).strict();
