import { z } from 'zod';

const expectedVersion = z.number().int().min(0).max(2147483646);

export const stage1ConfirmationSubmitSchema = z.object({
  expected_version: expectedVersion,
}).strict();

export const stage1ConfirmationReviewSchema = z.object({
  expected_version: expectedVersion,
  keputusan: z.enum(['DISETUJUI', 'PERLU_REVISI']),
  catatan: z.string().trim().max(2000).default(''),
}).strict().refine(
  value => value.keputusan !== 'PERLU_REVISI' || value.catatan.length > 0,
  'Catatan koreksi diperlukan',
);
