import { Router } from 'express';
import { ruasJalanCreateSchema } from '../schemas/ruas-jalan';
import { paketIdSchema } from '../schemas/paket';
import { ApiError, supabaseRequest } from '../services/supabase';

const router = Router();

function balaiId(value: unknown) {
  const result = paketIdSchema.safeParse(value);
  if (!result.success) throw new ApiError(400, 'ID Balai tidak valid');
  return result.data;
}

function mayManageBalai(identity: Express.Locals['identity'], id: number) {
  if (identity.roles.some(role => role.nama === 'admin')) return true;
  const picRoleIds = new Set(identity.roles.filter(role => role.nama === 'pic_balai').map(role => role.peran_id));
  return identity.assignments.some(assignment =>
    picRoleIds.has(assignment.peran_id) && assignment.scope_balai_id === id,
  );
}

async function visiblePackageBalai(packageId: number, token: string) {
  const rows = await supabaseRequest<Array<{ paket_id: number; balai_id: number }>>(
    `/rest/v1/paket_kontrak?select=paket_id,balai_id&paket_id=eq.${packageId}&limit=1`,
    token,
  );
  if (!rows[0]) throw new ApiError(404, 'Paket tidak ditemukan atau tidak boleh diakses');
  return rows[0].balai_id;
}

router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store');
  next();
});

router.get('/paket/:id/ruas-jalan', async (req, res) => {
  const parsedId = paketIdSchema.safeParse(req.params.id);
  if (!parsedId.success) throw new ApiError(400, 'ID paket tidak valid');
  await visiblePackageBalai(parsedId.data, res.locals.identity.token);
  const data = await supabaseRequest(
    '/rest/v1/rpc/baca_ruas_paket',
    res.locals.identity.token,
    { method: 'POST', body: JSON.stringify({ p_paket_id: parsedId.data }) },
  );
  res.json({ data });
});

router.post('/balai/:balaiId/ruas-jalan', async (req, res) => {
  const id = balaiId(req.params.balaiId);
  const { identity } = res.locals;
  if (!mayManageBalai(identity, id)) {
    throw new ApiError(403, 'Hanya admin atau PIC Balai dengan scope Balai yang sesuai boleh mendaftarkan ruas');
  }

  const parsed = ruasJalanCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Data ruas tidak valid', details: parsed.error.flatten() });
    return;
  }

  const data = await supabaseRequest(
    '/rest/v1/rpc/buat_ruas_jalan',
    identity.token,
    {
      method: 'POST',
      body: JSON.stringify({
        p_balai_id: id,
        p_nomor_ruas: parsed.data.nomor_ruas,
        p_nama_ruas: parsed.data.nama_ruas,
      }),
    },
  );
  res.status(201).json({ data });
});

export default router;
