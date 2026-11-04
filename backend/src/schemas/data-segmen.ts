import { z } from 'zod';

const id = z.number().int().positive().max(2147483647);
const measurement = z.number().finite().nullable().optional();

export const dataSegmenCreateSchema = z.object({
  jenis_survei_id: id,
  sta_awal: measurement,
  sta_akhir: measurement,
  lajur: z.string().nullable().optional(),
  nilai_utama: measurement,
  atribut_detail: z.unknown().nullable().optional(),
  lat: measurement,
  lon: measurement,
}).strict().refine(data =>
  Object.entries(data).some(([key, value]) => key !== 'jenis_survei_id' && value !== undefined && value !== null),
  'Sekurang-kurangnya satu atribut data segmen mesti diisi',
);

export const dataSegmenIdSchema = z.string().regex(/^[1-9]\d*$/).transform(Number)
  .pipe(z.number().safe().int().positive().max(Number.MAX_SAFE_INTEGER));
