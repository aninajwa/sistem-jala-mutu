import { z } from 'zod';

export const packageRoadAssignmentSchema = z.object({
  ruas_id: z.number().int().positive().max(2147483647),
  jenis_survei_id: z.number().int().positive().max(2147483647),
  // The installed column is nullable; non-null choices must exist in the
  // package's persisted semester catalog, which the RPC validates.
  semester: z.number().int().min(-2147483648).max(2147483647).nullable(),
}).strict();
