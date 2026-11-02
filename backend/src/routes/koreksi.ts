import { Router } from 'express';
import { ApiError, supabaseRequest } from '../services/supabase';
import { paketIdSchema } from '../schemas/paket';
import {
    koreksiCloseSchema,
    koreksiCreateSchema,
    koreksiExecuteSchema,
    koreksiPatchSchema,
    koreksiRetestSchema,
    koreksiReviewSchema,
    koreksiSubmitSchema,
    koreksiVerifySchema,
} from '../schemas/koreksi';

const router = Router();

function routeId(value: unknown, label: string) {
    const parsed = paketIdSchema.safeParse(value);
    if (!parsed.success) throw new ApiError(400, `${label} tidak valid`);
    return parsed.data;
}

function requireRole(identity: { roles: Array<{ nama: string }> }, roles: string[], message: string) {
    if (!identity.roles.some(role => roles.includes(role.nama))) throw new ApiError(403, message);
}

function invalidBody(res: { status: (code: number) => { json: (body: unknown) => void } }, error: unknown) {
    res.status(400).json({ error: 'Data koreksi tidak valid', details: error });
}

router.get('/paket/:id/koreksi', async (req, res) => {
    const { identity } = res.locals;
    const packageId = routeId(req.params.id, 'ID paket');
    const data = await supabaseRequest('/rest/v1/rpc/baca_senarai_koreksi', identity.token, {
        method: 'POST',
        body: JSON.stringify({ p_paket_id: packageId }),
    });
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ data });
});

router.post('/paket/:id/koreksi', async (req, res) => {
    const { identity } = res.locals;
    requireRole(identity, ['penyedia_jasa'], 'Hanya Penyedia Jasa boleh membuka kasus koreksi');
    const packageId = routeId(req.params.id, 'ID paket');
    const parsed = koreksiCreateSchema.safeParse(req.body);
    if (!parsed.success) { invalidBody(res, parsed.error.flatten()); return; }

    const data = await supabaseRequest('/rest/v1/rpc/buat_koreksi', identity.token, {
        method: 'POST',
        body: JSON.stringify({ p_paket_id: packageId, p_data: parsed.data }),
    });
    res.setHeader('Cache-Control', 'private, no-store');
    res.status(201).json({ data });
});

router.get('/paket/:id/koreksi/:koreksiId', async (req, res) => {
    const { identity } = res.locals;
    const packageId = routeId(req.params.id, 'ID paket');
    const koreksiId = routeId(req.params.koreksiId, 'ID koreksi');
    const data = await supabaseRequest('/rest/v1/rpc/baca_koreksi', identity.token, {
        method: 'POST',
        body: JSON.stringify({ p_paket_id: packageId, p_koreksi_id: koreksiId }),
    });
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ data });
});

router.patch('/paket/:id/koreksi/:koreksiId', async (req, res) => {
    const { identity } = res.locals;
    requireRole(identity, ['penyedia_jasa'], 'Hanya Penyedia Jasa boleh mengubah usulan koreksi');
    const packageId = routeId(req.params.id, 'ID paket');
    const koreksiId = routeId(req.params.koreksiId, 'ID koreksi');
    const parsed = koreksiPatchSchema.safeParse(req.body);
    if (!parsed.success) { invalidBody(res, parsed.error.flatten()); return; }
    const { expected_version, ...patch } = parsed.data;

    const data = await supabaseRequest('/rest/v1/rpc/ubah_koreksi', identity.token, {
        method: 'POST',
        body: JSON.stringify({
            p_paket_id: packageId,
            p_koreksi_id: koreksiId,
            p_expected_version: expected_version,
            p_data: patch,
        }),
    });
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ data });
});

router.post('/paket/:id/koreksi/:koreksiId/verifikasi', async (req, res) => {
    const { identity } = res.locals;
    requireRole(
        identity,
        ['penyedia_jasa', 'pic_balai', 'direktorat'],
        'Peran ini tidak boleh memverifikasi bukti koreksi'
    );
    const packageId = routeId(req.params.id, 'ID paket');
    const koreksiId = routeId(req.params.koreksiId, 'ID koreksi');
    const parsed = koreksiVerifySchema.safeParse(req.body);
    if (!parsed.success) { invalidBody(res, parsed.error.flatten()); return; }

    const data = await supabaseRequest('/rest/v1/rpc/verifikasi_koreksi', identity.token, {
        method: 'POST',
        body: JSON.stringify({
            p_paket_id: packageId,
            p_koreksi_id: koreksiId,
            p_expected_version: parsed.data.expected_version,
            p_tahap: parsed.data.tahap,
            p_nilai: parsed.data.nilai,
        }),
    });
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ data });
});

router.post('/paket/:id/koreksi/:koreksiId/ajukan', async (req, res) => {
    const { identity } = res.locals;
    requireRole(identity, ['penyedia_jasa'], 'Hanya Penyedia Jasa boleh mengajukan tindakan koreksi');
    const packageId = routeId(req.params.id, 'ID paket');
    const koreksiId = routeId(req.params.koreksiId, 'ID koreksi');
    const parsed = koreksiSubmitSchema.safeParse(req.body);
    if (!parsed.success) { invalidBody(res, parsed.error.flatten()); return; }

    const data = await supabaseRequest('/rest/v1/rpc/ajukan_koreksi', identity.token, {
        method: 'POST',
        body: JSON.stringify({
            p_paket_id: packageId,
            p_koreksi_id: koreksiId,
            p_expected_version: parsed.data.expected_version,
        }),
    });
    res.setHeader('Cache-Control', 'private, no-store');
    res.status(201).json({ data });
});

router.post('/paket/:id/koreksi/:koreksiId/review', async (req, res) => {
    const { identity } = res.locals;
    requireRole(identity, ['pic_balai'], 'Hanya PIC Balai boleh menyemak tindakan koreksi');
    const packageId = routeId(req.params.id, 'ID paket');
    const koreksiId = routeId(req.params.koreksiId, 'ID koreksi');
    const parsed = koreksiReviewSchema.safeParse(req.body);
    if (!parsed.success) { invalidBody(res, parsed.error.flatten()); return; }

    const data = await supabaseRequest('/rest/v1/rpc/review_koreksi', identity.token, {
        method: 'POST',
        body: JSON.stringify({
            p_paket_id: packageId,
            p_koreksi_id: koreksiId,
            p_expected_version: parsed.data.expected_version,
            p_keputusan: parsed.data.keputusan,
            p_catatan: parsed.data.catatan,
        }),
    });
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ data });
});

router.post('/paket/:id/koreksi/:koreksiId/laksana', async (req, res) => {
    const { identity } = res.locals;
    requireRole(identity, ['penyedia_jasa'], 'Hanya Penyedia Jasa boleh mencatat pelaksanaan tindakan');
    const packageId = routeId(req.params.id, 'ID paket');
    const koreksiId = routeId(req.params.koreksiId, 'ID koreksi');
    const parsed = koreksiExecuteSchema.safeParse(req.body);
    if (!parsed.success) { invalidBody(res, parsed.error.flatten()); return; }

    const data = await supabaseRequest('/rest/v1/rpc/laksana_koreksi', identity.token, {
        method: 'POST',
        body: JSON.stringify({
            p_paket_id: packageId,
            p_koreksi_id: koreksiId,
            p_expected_version: parsed.data.expected_version,
            p_execution_reference: parsed.data.execution_reference,
        }),
    });
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ data });
});

router.post('/paket/:id/koreksi/:koreksiId/uji-ulang', async (req, res) => {
    const { identity } = res.locals;
    requireRole(
        identity,
        ['penyedia_jasa', 'pic_balai', 'direktorat'],
        'Peran ini tidak boleh mencatat uji ulang koreksi'
    );
    const packageId = routeId(req.params.id, 'ID paket');
    const koreksiId = routeId(req.params.koreksiId, 'ID koreksi');
    const parsed = koreksiRetestSchema.safeParse(req.body);
    if (!parsed.success) { invalidBody(res, parsed.error.flatten()); return; }

    const data = await supabaseRequest('/rest/v1/rpc/uji_ulang_koreksi', identity.token, {
        method: 'POST',
        body: JSON.stringify({
            p_paket_id: packageId,
            p_koreksi_id: koreksiId,
            p_expected_version: parsed.data.expected_version,
            p_hasil: parsed.data.hasil,
            p_retest_reference: parsed.data.retest_reference,
        }),
    });
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ data });
});

router.post('/paket/:id/koreksi/:koreksiId/tutup', async (req, res) => {
    const { identity } = res.locals;
    requireRole(
        identity,
        ['penyedia_jasa', 'pic_balai', 'direktorat'],
        'Peran ini tidak boleh menutup kasus koreksi'
    );
    const packageId = routeId(req.params.id, 'ID paket');
    const koreksiId = routeId(req.params.koreksiId, 'ID koreksi');
    const parsed = koreksiCloseSchema.safeParse(req.body);
    if (!parsed.success) { invalidBody(res, parsed.error.flatten()); return; }

    const data = await supabaseRequest('/rest/v1/rpc/tutup_koreksi', identity.token, {
        method: 'POST',
        body: JSON.stringify({
            p_paket_id: packageId,
            p_koreksi_id: koreksiId,
            p_expected_version: parsed.data.expected_version,
        }),
    });
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ data });
});

export default router;
