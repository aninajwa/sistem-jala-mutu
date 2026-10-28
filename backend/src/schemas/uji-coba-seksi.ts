
import { z } from 'zod';

export const ujiCobaSeksiCreateSchema = z.object({
    nama_seksi: z.string().trim().min(1, 'Nama seksi wajib diisi').max(255),

    sta_awal: z.number().finite().min(0),

    sta_akhir: z.number().finite().positive(),

    nilai_referensi: z.number().finite().nullable(),

    kategori_kondisi: z.string().trim().max(255).nullable(),
}).strict().refine(
    (data) => data.sta_akhir > data.sta_awal,
    {
        message: 'STA akhir mesti lebih besar daripada STA awal',
        path: ['sta_akhir'],
    }
);
