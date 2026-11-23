import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { ApiError, supabaseRequest } from '../services/supabase';

const router = Router();
const readsEnabled = () => process.env.ADMIN_ROLE_READS_ENABLED === 'true' || process.env.ADMIN_ROLE_MANAGEMENT_ENABLED === 'true';
const writesEnabled = () => process.env.ADMIN_ROLE_MANAGEMENT_ENABLED === 'true';
const ID_MAX = 2_147_483_647;
const VERSION_MAX = '9223372036854775807';

type Assignment = { pp_id: number; pengguna_id: number; peran_id: number; nama_peran: string; scope_balai_id: number | null; scope_paket_id: number | null; mutation_version: string };
type RpcOptions = { method: 'POST'; body: string };

function positiveId(value: unknown, label: string): number {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new ApiError(400, `${label} tidak valid`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > ID_MAX) throw new ApiError(400, `${label} tidak valid`);
  return parsed;
}

function scopes(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ApiError(400, 'Body tidak valid');
  const record = body as Record<string, unknown>;
  if (Object.keys(record).some(key => !['scope_balai_id', 'scope_paket_id'].includes(key)) || !('scope_balai_id' in record) || !('scope_paket_id' in record)) throw new ApiError(400, 'Body tidak valid');
  const scope_balai_id = record.scope_balai_id;
  const scope_paket_id = record.scope_paket_id;
  if (!Number.isSafeInteger(scope_balai_id) || (scope_balai_id as number) < 1 || (scope_balai_id as number) > ID_MAX) throw new ApiError(400, 'scope_balai_id tidak valid');
  if (scope_paket_id !== null && (!Number.isSafeInteger(scope_paket_id) || (scope_paket_id as number) < 1 || (scope_paket_id as number) > ID_MAX)) throw new ApiError(400, 'scope_paket_id tidak valid');
  return { scope_balai_id: scope_balai_id as number, scope_paket_id: scope_paket_id as number | null };
}

function expectedVersion(value: unknown): string {
  if (typeof value !== 'string') throw new ApiError(400, 'If-Match wajib diisi');
  const match = /^"([1-9]\d*)"$/.exec(value);
  if (!match || match[1].length > VERSION_MAX.length || (match[1].length === VERSION_MAX.length && match[1] > VERSION_MAX)) throw new ApiError(400, 'If-Match tidak valid');
  return match[1];
}

function admin(enabled: () => boolean) {
  return (_req: any, res: any, next: any) => {
  res.setHeader('Cache-Control', 'private, no-store');
  if (!enabled()) { res.status(503).json({ code: 'ADMIN_ROLE_MANAGEMENT_DISABLED', error: 'Manajemen peran Admin belum diaktifkan' }); return; }
  const identity = res.locals.identity;
  if (!identity.roles.some((role: { nama: string }) => role.nama === 'admin')) throw new ApiError(403, 'Hanya Admin aktif boleh mengelola penugasan peran');
  next();
  };
}

const rpc = <T>(name: string, token: string, args: Record<string, unknown>) => supabaseRequest<T>(`/rest/v1/rpc/${name}`, token, { method: 'POST', body: JSON.stringify(args) } satisfies RpcOptions);

router.use('/admin', requireAuth);

router.get('/admin/roles', admin(readsEnabled), async (_req, res, next) => {
  try { const { identity } = res.locals; const data = await rpc<Array<{ peran_id: number; nama_peran: string }>>('admin_daftar_peran_dapat_ditugaskan', identity.token, {}); res.json({ data }); }
  catch (error) { next(error); }
});

router.get('/admin/users/:pengguna_id/roles', admin(readsEnabled), async (req, res, next) => {
  try { const id = positiveId(req.params.pengguna_id, 'pengguna_id'); const { identity } = res.locals; const data = await rpc<Assignment[]>('admin_daftar_penugasan_peran', identity.token, { p_pengguna_id: id }); res.json({ data }); }
  catch (error) { next(error); }
});

router.post('/admin/users/:pengguna_id/roles', admin(writesEnabled), async (req, res, next) => {
  try {
    const id = positiveId(req.params.pengguna_id, 'pengguna_id'); const scope = scopes(req.body); const { identity } = res.locals;
    const catalog = await rpc<Array<{ peran_id: number; nama_peran: string }>>('admin_daftar_peran_dapat_ditugaskan', identity.token, {});
    const pic = catalog.find(role => role.nama_peran === 'pic_balai');
    if (!pic) throw new ApiError(503, 'Katalog peran pic_balai belum tersedia');
    const rows = await rpc<Array<Omit<Assignment, 'nama_peran'>>>('admin_tambah_penugasan_peran', identity.token, { p_pengguna_id: id, p_peran_id: pic.peran_id, p_scope_balai_id: scope.scope_balai_id, p_scope_paket_id: scope.scope_paket_id });
    // V1 only permits pic_balai; mutation RPC returns the role ID but omits its label.
    res.status(201).json({ data: { ...rows[0], nama_peran: 'pic_balai' } });
  } catch (error) { next(error); }
});

router.patch('/admin/users/:pengguna_id/roles/:pp_id', admin(writesEnabled), async (req, res, next) => {
  try {
    const pengguna_id = positiveId(req.params.pengguna_id, 'pengguna_id'); const pp_id = positiveId(req.params.pp_id, 'pp_id');
    const version = expectedVersion(req.get('If-Match')); const scope = scopes(req.body); const { identity } = res.locals;
    const rows = await rpc<Array<Omit<Assignment, 'nama_peran'>>>('admin_ubah_penugasan_peran', identity.token, { p_pengguna_id: pengguna_id, p_pp_id: pp_id, p_expected_version: version, p_scope_balai_id: scope.scope_balai_id, p_scope_paket_id: scope.scope_paket_id });
    const data = { ...rows[0], nama_peran: 'pic_balai' }; res.setHeader('ETag', `"${data.mutation_version}"`); res.json({ data });
  } catch (error) { next(error); }
});

router.delete('/admin/users/:pengguna_id/roles/:pp_id', admin(writesEnabled), async (req, res, next) => {
  try {
    const pengguna_id = positiveId(req.params.pengguna_id, 'pengguna_id'); const pp_id = positiveId(req.params.pp_id, 'pp_id');
    const version = expectedVersion(req.get('If-Match')); const { identity } = res.locals;
    await rpc('admin_cabut_penugasan_peran', identity.token, { p_pengguna_id: pengguna_id, p_pp_id: pp_id, p_expected_version: version }); res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
