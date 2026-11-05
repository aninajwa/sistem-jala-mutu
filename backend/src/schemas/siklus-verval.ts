import { z } from 'zod';

const id = z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(
  z.number().safe().int().positive().max(2147483647),
);

export const siklusVervalIdSchema = id;

export const siklusVervalCreateBodySchema = z.object({}).strict();
