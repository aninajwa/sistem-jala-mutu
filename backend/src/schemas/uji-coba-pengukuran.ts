
import { z } from 'zod';

export const ujiCobaPengukuranCreateSchema = z.object({
    ulangan_ke: z.number().int().positive(),

    kecepatan_kmh: z.number().finite().nonnegative().nullable(),

    nilai_alat: z.number().finite(),

    beban_kn: z.number().finite().nonnegative().nullable(),

    rater_personel_id: z.number().int().positive().nullable(),
}).strict();
