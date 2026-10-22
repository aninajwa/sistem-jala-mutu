import { ujiCobaPengukuranCreateSchema } from '../schemas/uji-coba-pengukuran';
import { ujiCobaSeksiCreateSchema } from '../schemas/uji-coba-seksi';
import { Router } from 'express';
import { ApiError, supabaseRequest } from '../services/supabase';
import { paketIdSchema } from '../schemas/paket';
import { ujiCobaCreateSchema } from '../schemas/uji-coba';

const router = Router();

router.post('/paket/:id/uji-coba', async (req, res) => {
    const { identity } = res.locals;

    // Hanya Penyedia Jasa boleh daftar uji coba.
    if (!identity.roles.some(role => role.nama === 'penyedia_jasa')) {
        throw new ApiError(403, 'Hanya Penyedia Jasa boleh mendaftarkan uji coba');
    }

    // Semak ID paket.
    const id = paketIdSchema.safeParse(req.params.id);

    if (!id.success) {
        throw new ApiError(400, 'ID paket tidak valid');
    }

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
                p_paket_id: id.data,
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
    const paketId = paketIdSchema.safeParse(req.params.id);

    if (!paketId.success) {
        throw new ApiError(400, 'ID paket tidak valid');
    }

    // Validasi ID uji coba
    const ujiCobaId = Number(req.params.ujiCobaId);

    if (!Number.isSafeInteger(ujiCobaId) || ujiCobaId <= 0) {
        throw new ApiError(400, 'ID uji coba tidak valid');
    }

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
                p_paket_id: paketId.data,
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
    const paketId = paketIdSchema.safeParse(req.params.id);

    if (!paketId.success) {
        throw new ApiError(400, 'ID paket tidak valid');
    }

    // Validasi ID uji coba
    const ujiCobaId = Number(req.params.ujiCobaId);

    if (!Number.isSafeInteger(ujiCobaId) || ujiCobaId <= 0) {
        throw new ApiError(400, 'ID uji coba tidak valid');
    }

    // Validasi ID seksi
    const seksiId = Number(req.params.seksiId);

    if (!Number.isSafeInteger(seksiId) || seksiId <= 0) {
        throw new ApiError(400, 'ID seksi tidak valid');
    }

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
                p_paket_id: paketId.data,
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

        const paketId = Number(req.params.id);
        const ujiCobaId = Number(req.params.ujiCobaId);

        if (!Number.isSafeInteger(paketId) || paketId <= 0) {
            throw new ApiError(400, 'ID paket tidak valid');
        }

        if (!Number.isSafeInteger(ujiCobaId) || ujiCobaId <= 0) {
            throw new ApiError(400, 'ID uji coba tidak valid');
        }

        const data = await supabaseRequest(
            '/rest/v1/rpc/ambil_detail_uji_coba',
            identity.token,
            {
                method: 'POST',
                body: JSON.stringify({
                    p_paket_id: paketId,
                    p_uji_coba_id: ujiCobaId,
                }),
            }
        );

        res.json({ data });
    } catch (error) {
        next(error);
    }
});

router.get('/paket/:id/uji-coba', async (req, res, next) => {
    try {
        const { identity } = res.locals;

        const paketId = Number(req.params.id);

        if (!Number.isSafeInteger(paketId) || paketId <= 0) {
            throw new ApiError(400, 'ID paket tidak valid');
        }

        const data = await supabaseRequest(
            '/rest/v1/rpc/ambil_senarai_uji_coba',
            identity.token,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    p_paket_id: paketId,
                }),
            }
        );

        res.json({ data });
    } catch (error) {
        next(error);
    }
});

export default router;
