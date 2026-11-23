import { z } from 'zod';

const surveyIds = z.array(z.number().int().positive().max(2147483647))
  .min(1).max(50)
  .transform(ids => [...new Set(ids)].sort((a, b) => a - b));

export const packageScopeAmendmentSubmitSchema = z.object({
  expected_scope_version: z.number().int().positive().max(2147483647),
  jenis_survei_ids: surveyIds,
}).strict();

export const packageScopeAmendmentReviewSchema = z.object({
  expected_version: z.number().int().positive().max(2147483647),
  keputusan: z.enum(['DISETUJUI', 'DITOLAK']),
  catatan: z.string().trim().max(2000).nullable().optional(),
}).strict().superRefine((value, context) => {
  if (value.keputusan === 'DITOLAK' && !value.catatan) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['catatan'],
      message: 'Catatan wajib diisi jika pindaan ditolak.',
    });
  }
});

export const packageScopeAmendmentIdSchema = z.string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .refine(value => Number.isSafeInteger(value) && value <= 2147483647);
