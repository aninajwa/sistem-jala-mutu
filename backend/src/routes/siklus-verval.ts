import { Router } from 'express';
import { denyAdminWorkflowWrites } from '../middleware/workflow-write';
import { ApiError, supabaseRequest } from '../services/supabase';
import { siklusVervalConsistencyBodySchema, siklusVervalCreateBodySchema, siklusVervalIdSchema } from '../schemas/siklus-verval';

const router = Router();
router.use(denyAdminWorkflowWrites);
const productionRpcEnabled = () => process.env.STAGE3B_PRODUCTION_RPCS === 'true';

router.get('/paket/:id/siklus-verval/capabilities', (_req, res) => {
  const enabled = productionRpcEnabled();
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data: { read: enabled, write: enabled, reason: enabled ? null : 'RPC Stage 3B produksi belum diaktifkan setelah migrasi QA diverifikasi.' } });
});

function parseId(value: unknown, label: string) {
  const parsed = siklusVervalIdSchema.safeParse(value);
  if (!parsed.success) throw new ApiError(400, `${label} tidak valid`);
  return parsed.data;
}

router.get('/paket/:id/siklus-verval', async (req, res) => {
  if (!productionRpcEnabled()) throw new ApiError(503, 'RPC Stage 3B produksi belum diaktifkan.');
  const packageId = parseId(req.params.id, 'ID paket');
  const data = await supabaseRequest(
    '/rest/v1/rpc/baca_senarai_siklus_verval',
    res.locals.identity.token,
    { method: 'POST', body: JSON.stringify({ p_paket_id: packageId }) },
  );
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data });
});

router.post('/paket/:id/siklus-verval', async (req, res) => {
  if (!productionRpcEnabled()) throw new ApiError(503, 'Pembukaan siklus Stage 3B dinonaktifkan sampai RPC produksi terpasang dan diverifikasi.');
  const packageId = parseId(req.params.id, 'ID paket');
  if (!res.locals.identity.roles.some((role: { nama: string }) => role.nama === 'penyedia_jasa')) throw new ApiError(403, 'Hanya Penyedia Jasa boleh membuka siklus Verval');
  const parsed = siklusVervalCreateBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'request_id UUID wajib dan hanya itu yang boleh dikirim' });
    return;
  }
  const data = await supabaseRequest(
    '/rest/v1/rpc/buat_siklus_verval',
    res.locals.identity.token,
    { method: 'POST', body: JSON.stringify({ p_paket_id: packageId, p_request_id: parsed.data.request_id }) },
  );
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(201).json({ data });
});

router.get('/paket/:id/siklus-verval/:siklusId', async (req, res) => {
  if (!productionRpcEnabled()) throw new ApiError(503, 'RPC Stage 3B produksi belum diaktifkan.');
  const packageId = parseId(req.params.id, 'ID paket');
  const cycleId = parseId(req.params.siklusId, 'ID siklus Verval');
  const data = await supabaseRequest(
    '/rest/v1/rpc/baca_siklus_verval',
    res.locals.identity.token,
    { method: 'POST', body: JSON.stringify({ p_paket_id: packageId, p_siklus_id: cycleId }) },
  );
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data });
});

router.get('/paket/:id/siklus-verval/:siklusId/uji-konsistensi', async (req, res) => {
  if (!productionRpcEnabled()) throw new ApiError(503, 'RPC Stage 3B produksi belum diaktifkan.');
  const packageId = parseId(req.params.id, 'ID paket');
  const cycleId = parseId(req.params.siklusId, 'ID siklus Verval');
  const data = await supabaseRequest(
    '/rest/v1/rpc/baca_uji_konsistensi_verval',
    res.locals.identity.token,
    { method: 'POST', body: JSON.stringify({ p_paket_id: packageId, p_siklus_id: cycleId }) },
  );
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data });
});

router.post('/paket/:id/siklus-verval/:siklusId/uji-konsistensi', async (req, res) => {
  if (!productionRpcEnabled()) throw new ApiError(503, 'Penulisan Stage 3B dinonaktifkan sampai RPC produksi terpasang dan diverifikasi.');
  const { identity } = res.locals;
  if (!identity.roles.some((role: { nama: string }) => role.nama === 'penyedia_jasa')) throw new ApiError(403, 'Hanya Penyedia Jasa boleh mencatat uji konsistensi');
  const packageId = parseId(req.params.id, 'ID paket');
  const cycleId = parseId(req.params.siklusId, 'ID siklus Verval');
  const parsed = siklusVervalConsistencyBodySchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Data uji konsistensi tidak valid', details: parsed.error.flatten() }); return; }
  const data = await supabaseRequest('/rest/v1/rpc/simpan_uji_konsistensi_verval', identity.token, {
    method: 'POST', body: JSON.stringify({ p_paket_id: packageId, p_siklus_id: cycleId, p_data: parsed.data }),
  });
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(201).json({ data });
});

export default router;
