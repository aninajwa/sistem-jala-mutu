import { z } from 'zod';

const id = z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(
  z.number().safe().int().positive().max(2147483647),
);

export const siklusVervalIdSchema = id;

export const siklusVervalCreateBodySchema = z.object({ request_id: z.string().uuid() }).strict();

const positiveId = z.number().int().positive().max(2147483647);
const expectedVersion = z.number().int().min(0).max(2147483646);
const finiteNumber = z.number().finite();

export const siklusVervalConsistencyBodySchema = z.object({
  request_id: z.string().uuid(),
  expected_version: expectedVersion,
  jenis_survei_id: positiveId,
  tim_id: positiveId,
  ruas_id: positiveId,
  sta_awal: finiteNumber.nonnegative(),
  sta_akhir: finiteNumber.positive(),
  ulangan: z.array(z.object({
    ulangan_ke: z.number().int().positive().max(20),
    rater_personel_id: positiveId,
    nilai: finiteNumber,
  }).strict()).min(1).max(20),
}).strict().superRefine((payload, ctx) => {
  if (payload.sta_akhir <= payload.sta_awal) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sta_akhir'], message: 'STA akhir mesti lebih besar daripada STA awal' });
  const nums = payload.ulangan.map(item => item.ulangan_ke);
  if (new Set(nums).size !== nums.length || nums.some((value, index) => value !== index + 1)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['ulangan'], message: 'Nomor ulangan mesti unik dan berurutan mulai dari 1' });
  }
});
