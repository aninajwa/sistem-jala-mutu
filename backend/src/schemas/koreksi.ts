import { z } from 'zod';

const workflowVersionSchema = z.number().int().min(0).max(2147483646);

const validDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarikh mesti menggunakan format YYYY-MM-DD').refine(value => {
    if (value.startsWith('0000')) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Tarikh tidak sah');

const correctionActions = new Set([
    'Survei ulang sebagian ruas',
    'Survei ulang seluruh ruas',
    'Penilaian ulang (re-rating)',
    'Ambil ulang foto/video',
    'Pelatihan ulang personel',
    'Kalibrasi ulang alat',
    'Penggantian komponen alat',
    'Penggantian personel',
    'Koreksi pemrosesan dengan bukti',
    'Investigasi keterlambatan dan rencana tindak lanjut',
]);

const actionTypeSchema = z.string().trim().max(200).refine(
    value => value === '' || correctionActions.has(value),
    'Jenis tindakan tidak sah'
);

const surveyTypeSchema = z.enum(['IRI', 'PCI', 'Lendutan', 'Jembatan', 'Lereng', 'Drainase', 'Lalu Lintas', 'RNI']);
const rootCauseSchema = z.enum(['', 'Alat', 'Personel', 'Metode', 'Kondisi lapangan', 'Pemrosesan']);
const fieldDataValidSchema = z.enum(['', 'Ya', 'Tidak', 'Tidak Berlaku']);

const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();

export const koreksiCreateSchema = z.object({
    cycle_period: z.number().int().positive().max(2147483647).optional(),
    source: z.string().trim().min(1).max(120),
    blocked_stage: z.string().trim().min(1).max(120),
    road: z.string().trim().min(1).max(255),
    stationing: z.string().trim().max(120).default(''),
    rejection_reason: z.string().trim().min(1).max(2000),
    severity: z.enum(['Kritis', 'Mayor', 'Minor']),
    owner: z.string().trim().min(1).max(255),
    due_date: validDate,
    survey_type: surveyTypeSchema,
    return_stage: z.string().trim().max(120).default(''),
    root_cause: rootCauseSchema.default(''),
    field_data_valid: fieldDataValidSchema.default(''),
    action_type: actionTypeSchema.default(''),
    evidence: z.string().trim().max(4000).default(''),
    original_value: z.string().trim().max(1000).default(''),
    proposed_value: z.string().trim().max(1000).default(''),
    linked_record_id: nullableText(120),
    rule_scenario: nullableText(120),
    rule_checks: z.record(z.boolean()).default({}),
    rule_numbers: z.record(z.number().finite()).default({}),
    province_update_ba: nullableText(200),
}).strict();

export const koreksiPatchSchema = z.object({
    expected_version: workflowVersionSchema,
    root_cause: rootCauseSchema.optional(),
    field_data_valid: fieldDataValidSchema.optional(),
    action_type: actionTypeSchema.optional(),
    evidence: z.string().trim().max(4000).optional(),
    original_value: z.string().trim().max(1000).optional(),
    proposed_value: z.string().trim().max(1000).optional(),
    return_stage: z.string().trim().max(120).optional(),
    linked_record_id: nullableText(120),
    rule_scenario: nullableText(120),
    rule_checks: z.record(z.boolean()).optional(),
    rule_numbers: z.record(z.number().finite()).optional(),
    province_update_ba: nullableText(200),
}).strict().refine(
    value => Object.keys(value).length > 1,
    'Sekurang-kurangnya satu medan usulan diperlukan'
);

export const koreksiSubmitSchema = z.object({
    expected_version: workflowVersionSchema,
}).strict();

export const koreksiVerifySchema = z.object({
    expected_version: workflowVersionSchema,
    tahap: z.enum(['surveyor', 'team_leader', 'balai']),
    nilai: z.boolean(),
}).strict();

export const koreksiReviewSchema = z.object({
    expected_version: workflowVersionSchema,
    keputusan: z.enum(['Perlu Revisi', 'Disetujui']),
    catatan: z.string().trim().max(2000),
}).strict().refine(
    value => value.keputusan !== 'Perlu Revisi' || value.catatan.length > 0,
    { message: 'Catatan wajib diisi apabila meminta revisi', path: ['catatan'] }
);

export const koreksiExecuteSchema = z.object({
    expected_version: workflowVersionSchema,
    execution_reference: z.string().trim().min(1).max(2000),
}).strict();

export const koreksiRetestSchema = z.object({
    expected_version: workflowVersionSchema,
    hasil: z.enum(['Lulus', 'Gagal']),
    retest_reference: z.string().trim().min(1).max(2000),
}).strict();

export const koreksiCloseSchema = z.object({
    expected_version: workflowVersionSchema,
}).strict();
