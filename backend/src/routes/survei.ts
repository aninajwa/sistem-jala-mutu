import { Router } from 'express';
import { ApiError, supabaseRequest } from '../services/supabase';
import { paketIdSchema } from '../schemas/paket';
import { pemeriksaanHarianAlatPrototypeSchema, sesiSurveiCreateSchema } from '../schemas/survei';
import { dataSegmenCreateSchema, dataSegmenIdSchema } from '../schemas/data-segmen';

const router = Router();

function parseId(value: unknown, label: string) {
  const parsed = paketIdSchema.safeParse(value);
  if (!parsed.success) throw new ApiError(400, `${label} tidak valid`);
  return parsed.data;
}

function parsePage(value: unknown) {
  if (value === undefined) return 1;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || Number(value) > 1000000) {
    throw new ApiError(400, 'page tidak valid');
  }
  return Number(value);
}

router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store');
  next();
});

router.post('/paket/:id/sesi-survei', async (req, res) => {
  const { identity } = res.locals;
  if (!identity.roles.some(role => role.nama === 'penyedia_jasa')) {
    throw new ApiError(403, 'Hanya Penyedia Jasa boleh membuat sesi survei');
  }
  const packageId = parseId(req.params.id, 'ID paket');
  const parsed = sesiSurveiCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Data sesi survei tidak valid', details: parsed.error.flatten() });
    return;
  }
  const data = await supabaseRequest(
    '/rest/v1/rpc/simpan_sesi_survei',
    identity.token,
    { method: 'POST', body: JSON.stringify({ p_paket_id: packageId, p_data: parsed.data }) },
  );
  res.status(201).json({ data });
});

router.get('/paket/:id/sesi-survei/:sesiId', async (req, res) => {
  const packageId = parseId(req.params.id, 'ID paket');
  const sesiId = parseId(req.params.sesiId, 'ID sesi survei');
  const data = await supabaseRequest(
    '/rest/v1/rpc/baca_sesi_survei',
    res.locals.identity.token,
    { method: 'POST', body: JSON.stringify({ p_paket_id: packageId, p_sesi_id: sesiId }) },
  );
  res.json({ data });
});

router.get('/paket/:id/sesi-survei', async (req, res) => {
  const packageId = parseId(req.params.id, 'ID paket');
  const data = await supabaseRequest(
    '/rest/v1/rpc/baca_senarai_sesi_survei',
    res.locals.identity.token,
    { method: 'POST', body: JSON.stringify({ p_paket_id: packageId }) },
  );
  res.json({ data });
});

router.get('/paket/:id/pemeriksaan-harian-alat', async (req, res) => {
  const packageId = parseId(req.params.id, 'ID paket');
  const page = parsePage(req.query.page);
  const data = await supabaseRequest(
    '/rest/v1/rpc/baca_senarai_pemeriksaan_harian_alat_prototype',
    res.locals.identity.token,
    { method: 'POST', body: JSON.stringify({ p_paket_id: packageId, p_page: page }) },
  );
  res.json({ data, page, page_size: 50 });
});

router.post('/paket/:id/pemeriksaan-harian-alat', async (req, res) => {
  const { identity } = res.locals;
  if (!identity.roles.some(role => role.nama === 'penyedia_jasa')) {
    throw new ApiError(403, 'Hanya Penyedia Jasa boleh mencatat pemeriksaan harian alat TEST/QA');
  }
  const packageId = parseId(req.params.id, 'ID paket');
  const parsed = pemeriksaanHarianAlatPrototypeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Data pemeriksaan harian alat TEST/QA tidak valid', details: parsed.error.flatten() });
    return;
  }
  const data = await supabaseRequest(
    '/rest/v1/rpc/catat_pemeriksaan_harian_alat_prototype',
    identity.token,
    {
      method: 'POST',
      body: JSON.stringify({
        p_paket_id: packageId,
        p_alat_id: parsed.data.alat_id,
        p_tanggal: parsed.data.tanggal,
        p_item_pemeriksaan: parsed.data.item_pemeriksaan,
        p_hasil_pemeriksaan: parsed.data.hasil_pemeriksaan,
        p_catatan: parsed.data.catatan ?? null,
      }),
    },
  );
  res.status(201).json({ data });
});

router.post('/paket/:id/sesi-survei/:sesiId/data-segmen', async (req, res) => {
  const { identity } = res.locals;
  if (!identity.roles.some(role => role.nama === 'penyedia_jasa')) {
    throw new ApiError(403, 'Hanya Penyedia Jasa boleh mencatat data segmen');
  }
  const packageId = parseId(req.params.id, 'ID paket');
  const sesiId = parseId(req.params.sesiId, 'ID sesi survei');
  const parsed = dataSegmenCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Data segmen tidak valid', details: parsed.error.flatten() });
    return;
  }
  const data = await supabaseRequest(
    '/rest/v1/rpc/simpan_data_segmen',
    identity.token,
    { method: 'POST', body: JSON.stringify({ p_paket_id: packageId, p_sesi_id: sesiId, p_data: parsed.data }) },
  );
  res.status(201).json({ data });
});

router.get('/paket/:id/sesi-survei/:sesiId/data-segmen/:dataId', async (req, res) => {
  const packageId = parseId(req.params.id, 'ID paket');
  const sesiId = parseId(req.params.sesiId, 'ID sesi survei');
  const dataId = dataSegmenIdSchema.safeParse(req.params.dataId);
  if (!dataId.success) throw new ApiError(400, 'ID data segmen tidak valid');
  const data = await supabaseRequest(
    '/rest/v1/rpc/baca_data_segmen',
    res.locals.identity.token,
    { method: 'POST', body: JSON.stringify({ p_paket_id: packageId, p_sesi_id: sesiId, p_data_id: dataId.data }) },
  );
  res.json({ data });
});

router.get('/paket/:id/sesi-survei/:sesiId/data-segmen', async (req, res) => {
  const packageId = parseId(req.params.id, 'ID paket');
  const sesiId = parseId(req.params.sesiId, 'ID sesi survei');
  const data = await supabaseRequest(
    '/rest/v1/rpc/baca_senarai_data_segmen',
    res.locals.identity.token,
    { method: 'POST', body: JSON.stringify({ p_paket_id: packageId, p_sesi_id: sesiId }) },
  );
  res.json({ data });
});

export default router;
