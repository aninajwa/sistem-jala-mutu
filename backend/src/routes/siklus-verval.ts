import { Router } from 'express';
import { ApiError, supabaseRequest } from '../services/supabase';
import { siklusVervalCreateBodySchema, siklusVervalIdSchema } from '../schemas/siklus-verval';

const router = Router();

function parseId(value: unknown, label: string) {
  const parsed = siklusVervalIdSchema.safeParse(value);
  if (!parsed.success) throw new ApiError(400, `${label} tidak valid`);
  return parsed.data;
}

router.get('/paket/:id/siklus-verval', async (req, res) => {
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
  const packageId = parseId(req.params.id, 'ID paket');
  const parsed = siklusVervalCreateBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: 'CREATE siklus Verval tidak menerima input selain ID paket' });
    return;
  }
  const data = await supabaseRequest(
    '/rest/v1/rpc/buat_siklus_verval_testqa',
    res.locals.identity.token,
    { method: 'POST', body: JSON.stringify({ p_paket_id: packageId }) },
  );
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(201).json({ data });
});

router.get('/paket/:id/siklus-verval/:siklusId', async (req, res) => {
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

export default router;
