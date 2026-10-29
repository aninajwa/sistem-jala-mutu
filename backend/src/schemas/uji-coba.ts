
import { z } from 'zod';

export const ujiCobaCreateSchema = z.object({
    tim_id: z.number().int().positive().max(2147483647),
    jenis_survei_id: z.number().int().positive().max(2147483647),
    alat_id: z.number().int().positive().max(2147483647),

    // Ruas jalan belum tersedia dalam database.
    // Boleh null untuk rekod DRAFT.
    ruas_id: z.number().int().positive().max(2147483647).nullable(),

    tanggal: z.string().regex(
        /^\d{4}-\d{2}-\d{2}$/,
        'Tanggal mesti menggunakan format YYYY-MM-DD'
    ).refine(
        (value) => !Number.isNaN(Date.parse(value)) &&
            new Date(value).toISOString().slice(0, 10) === value,
        'Tanggal tidak valid'
    ),

    panjang_km: z.number().positive().finite(),

    percobaan_ke: z.number().int().positive(),
}).strict();

const workflowVersionSchema = z.number().int().min(0).max(2147483646);

const iriEvaluationCodeSchema = z.enum(['IRI_A', 'IRI_B', 'IRI_R2', 'IRI_CV']);

export const ujiCobaEvaluationSchema = z.object({
    expected_version: workflowVersionSchema,
    hasil: z.array(z.object({
        kode: iriEvaluationCodeSchema,
        nilai: z.number().finite(),
    }).strict()).length(4),
}).strict().superRefine((value, ctx) => {
    const codes = value.hasil.map(item => item.kode);
    const uniqueCodes = new Set(codes);
    if (uniqueCodes.size !== codes.length) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Setiap parameter evaluasi hanya boleh dihantar sekali',
            path: ['hasil'],
        });
    }

    for (const required of iriEvaluationCodeSchema.options) {
        if (!uniqueCodes.has(required)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Parameter ${required} wajib dihantar`,
                path: ['hasil'],
            });
        }
    }
});

export const ujiCobaSubmitSchema = z.object({
    expected_version: workflowVersionSchema,
}).strict();

export const ujiCobaReviewSchema = z.object({
    expected_version: workflowVersionSchema,
    keputusan: z.enum(['PERLU_REVISI', 'DISETUJUI']),
    catatan: z.string().trim().max(2000),
}).strict().refine(
    value => value.keputusan !== 'PERLU_REVISI' || value.catatan.length > 0,
    { message: 'Catatan wajib diisi apabila meminta revisi', path: ['catatan'] },
);
