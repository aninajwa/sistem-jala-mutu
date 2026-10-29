import { ujiCobaPengukuranCreateSchema } from '../schemas/uji-coba-pengukuran';
import { ujiCobaSeksiCreateSchema } from '../schemas/uji-coba-seksi';
import { Router } from 'express';
import { ApiError, supabaseRequest } from '../services/supabase';
import { paketIdSchema } from '../schemas/paket';
import {
    ujiCobaCreateSchema,
    ujiCobaEvaluationSchema,
    ujiCobaReviewSchema,
    ujiCobaSubmitSchema,
} from '../schemas/uji-coba';

const router = Router();

function routeId(value: unknown, label: string) {
    const parsed = paketIdSchema.safeParse(value);
    if (!parsed.success) throw new ApiError(400, `${label} tidak valid`);
    return parsed.data;
}

router.post('/paket/:id/uji-coba', async (req, res) => {
    const { identity } = res.locals;

    // Hanya Penyedia Jasa boleh daftar uji coba.
    if (!identity.roles.some(role => role.nama === 'penyedia_jasa')) {
        throw new ApiError(403, 'Hanya Penyedia Jasa boleh mendaftarkan uji coba');
    }

    // Semak ID paket.
    const packageId = routeId(req.params.id, 'ID paket');

    // Semak data yang dihantar.
    const parsed = ujiCobaCreateSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({
            error: 'Data uji coba tidak valid',
            details: parsed.error.flatten(),
        });
        return;
    }

    const p = parsed.data;

    // Hantar data kepada RPC Supabase.
    const data = await supabaseRequest(
        '/rest/v1/rpc/simpan_uji_coba',
        identity.token,
        {
            method: 'POST',
            body: JSON.stringify({
                p_paket_id: packageId,
                p_tim_id: p.tim_id,
                p_jenis_survei_id: p.jenis_survei_id,
                p_alat_id: p.alat_id,
                p_ruas_id: p.ruas_id,
                p_tanggal: p.tanggal,
                p_panjang_km: p.panjang_km,
                p_percobaan_ke: p.percobaan_ke,
            }),
        }
    );

    res.status(201).json({ data });
});


router.post('/paket/:id/uji-coba/:ujiCobaId/seksi', async (req, res) => {
    const { identity } = res.locals;

    // Hanya Penyedia Jasa
    if (!identity.roles.some((role: { nama: string }) => role.nama === 'penyedia_jasa')) {
        throw new ApiError(403, 'Hanya Penyedia Jasa boleh menambah seksi uji coba');
    }

    // Validasi ID paket
    const packageId = routeId(req.params.id, 'ID paket');
    const ujiCobaId = routeId(req.params.ujiCobaId, 'ID uji coba');

    // Validasi body
    const parsed = ujiCobaSeksiCreateSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({
            error: 'Data seksi uji coba tidak valid',
            details: parsed.error.flatten(),
        });
        return;
    }

    const p = parsed.data;

    // Pastikan uji coba memang milik paket dalam URL


    // Simpan melalui RPC Supabase
    const data = await supabaseRequest(
        '/rest/v1/rpc/simpan_uji_coba_seksi',
        identity.token,
        {
            method: 'POST',
            body: JSON.stringify({
                p_paket_id: packageId,
                p_uji_coba_id: ujiCobaId,
                p_nama_seksi: p.nama_seksi,
                p_sta_awal: p.sta_awal,
                p_sta_akhir: p.sta_akhir,
                p_nilai_referensi: p.nilai_referensi,
                p_kategori_kondisi: p.kategori_kondisi,
            }),
        }
    );

    res.status(201).json({ data });
});


router.post('/paket/:id/uji-coba/:ujiCobaId/seksi/:seksiId/pengukuran', async (req, res) => {
    const { identity } = res.locals;

    // Hanya Penyedia Jasa
    if (!identity.roles.some((role: { nama: string }) => role.nama === 'penyedia_jasa')) {
        throw new ApiError(403, 'Hanya Penyedia Jasa boleh menambah pengukuran');
    }

    // Validasi ID paket
    const packageId = routeId(req.params.id, 'ID paket');
    const ujiCobaId = routeId(req.params.ujiCobaId, 'ID uji coba');
    const seksiId = routeId(req.params.seksiId, 'ID seksi');

    // Validasi data pengukuran
    const parsed = ujiCobaPengukuranCreateSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({
            error: 'Data pengukuran tidak valid',
            details: parsed.error.flatten(),
        });
        return;
    }

    const p = parsed.data;

    // Simpan melalui RPC yang memeriksa akses dan hubungan data
    const data = await supabaseRequest(
        '/rest/v1/rpc/simpan_uji_coba_pengukuran',
        identity.token,
        {
            method: 'POST',
            body: JSON.stringify({
                p_paket_id: packageId,
                p_uji_coba_id: ujiCobaId,
                p_seksi_id: seksiId,
                p_ulangan_ke: p.ulangan_ke,
                p_kecepatan_kmh: p.kecepatan_kmh,
                p_nilai_alat: p.nilai_alat,
                p_beban_kn: p.beban_kn,
                p_rater_personel_id: p.rater_personel_id,
            }),
        }
    );

    res.status(201).json({ data });
});

router.get('/paket/:id/uji-coba/:ujiCobaId', async (req, res, next) => {
    try {
        const { identity } = res.locals;

        const packageId = routeId(req.params.id, 'ID paket');
        const ujiCobaId = routeId(req.params.ujiCobaId, 'ID uji coba');

        const data = await supabaseRequest(
            '/rest/v1/rpc/ambil_detail_uji_coba',
            identity.token,
            {
                method: 'POST',
                body: JSON.stringify({
                    p_paket_id: packageId,
                    p_uji_coba_id: ujiCobaId,
                }),
            }
        );

        res.json({ data });
    } catch (error) {
        next(error);
    }
});

router.get('/paket/:id/uji-coba/:ujiCobaId/pengajuan', async (req, res) => {
    const packageId = routeId(req.params.id, 'ID paket');
    const ujiCobaId = routeId(req.params.ujiCobaId, 'ID uji coba');
    const data = await supabaseRequest(
        '/rest/v1/rpc/baca_pengajuan_uji_coba',
        res.locals.identity.token,
        {
            method: 'POST',
            body: JSON.stringify({
                p_paket_id: packageId,
                p_uji_coba_id: ujiCobaId,
            }),
        },
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ data });
});

router.get('/paket/:id/uji-coba/:ujiCobaId/evaluasi', async (req, res) => {
    const packageId = routeId(req.params.id, 'ID paket');
    const ujiCobaId = routeId(req.params.ujiCobaId, 'ID uji coba');
    const data = await supabaseRequest(
        '/rest/v1/rpc/baca_evaluasi_uji_coba',
        res.locals.identity.token,
        {
            method: 'POST',
            body: JSON.stringify({
                p_paket_id: packageId,
                p_uji_coba_id: ujiCobaId,
            }),
        },
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ data });
});

router.post('/paket/:id/uji-coba/:ujiCobaId/evaluasi', async (req, res) => {
    const { identity } = res.locals;
    if (!identity.roles.some(role => role.nama === 'penyedia_jasa')) {
        throw new ApiError(403, 'Hanya Penyedia Jasa boleh menyimpan evaluasi uji coba');
    }

    const packageId = routeId(req.params.id, 'ID paket');
    const ujiCobaId = routeId(req.params.ujiCobaId, 'ID uji coba');
    const parsed = ujiCobaEvaluationSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Evaluasi uji coba tidak valid', details: parsed.error.flatten() });
        return;
    }

    const data = await supabaseRequest(
        '/rest/v1/rpc/simpan_evaluasi_uji_coba',
        identity.token,
        {
            method: 'POST',
            body: JSON.stringify({
                p_paket_id: packageId,
                p_uji_coba_id: ujiCobaId,
                p_expected_version: parsed.data.expected_version,
                p_hasil: parsed.data.hasil,
            }),
        },
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ data });
});

router.post('/paket/:id/uji-coba/:ujiCobaId/pengajuan', async (req, res) => {
    const { identity } = res.locals;
    if (!identity.roles.some(role => role.nama === 'penyedia_jasa')) {
        throw new ApiError(403, 'Hanya Penyedia Jasa boleh mengajukan uji coba');
    }
    const packageId = routeId(req.params.id, 'ID paket');
    const ujiCobaId = routeId(req.params.ujiCobaId, 'ID uji coba');
    const parsed = ujiCobaSubmitSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Pengajuan uji coba tidak valid', details: parsed.error.flatten() });
        return;
    }
    const data = await supabaseRequest(
        '/rest/v1/rpc/ajukan_uji_coba',
        identity.token,
        {
            method: 'POST',
            body: JSON.stringify({
                p_paket_id: packageId,
                p_uji_coba_id: ujiCobaId,
                p_expected_version: parsed.data.expected_version,
            }),
        },
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.status(201).json({ data });
});

router.post('/paket/:id/uji-coba/:ujiCobaId/pengajuan/review', async (req, res) => {
    const { identity } = res.locals;
    if (!identity.roles.some(role => role.nama === 'pic_balai')) {
        throw new ApiError(403, 'Hanya PIC Balai boleh menyemak uji coba');
    }
    const packageId = routeId(req.params.id, 'ID paket');
    const ujiCobaId = routeId(req.params.ujiCobaId, 'ID uji coba');
    const parsed = ujiCobaReviewSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Keputusan uji coba tidak valid', details: parsed.error.flatten() });
        return;
    }
    const data = await supabaseRequest(
        '/rest/v1/rpc/review_uji_coba',
        identity.token,
        {
            method: 'POST',
            body: JSON.stringify({
                p_paket_id: packageId,
                p_uji_coba_id: ujiCobaId,
                p_expected_version: parsed.data.expected_version,
                p_keputusan: parsed.data.keputusan,
                p_catatan: parsed.data.catatan,
            }),
        },
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ data });
});

router.get('/paket/:id/uji-coba', async (req, res, next) => {
    try {
        const { identity } = res.locals;

        const packageId = routeId(req.params.id, 'ID paket');

        const data = await supabaseRequest(
            '/rest/v1/rpc/ambil_senarai_uji_coba',
            identity.token,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    p_paket_id: packageId,
                }),
            }
        );

        res.json({ data });
    } catch (error) {
        next(error);
    }
});

export default router;
