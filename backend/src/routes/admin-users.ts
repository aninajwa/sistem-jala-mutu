import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { ApiError, supabaseRequest } from '../services/supabase';

const router = Router();
const MAX_PAGE = 1_000_000;
const MAX_PAGE_SIZE = 100;

function positiveInteger(value: unknown, fallback: number, maximum: number, label: string) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new ApiError(400, `${label} tidak valid`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) throw new ApiError(400, `${label} tidak valid`);
  return parsed;
}

function usernameSearch(value: unknown) {
  if (value === undefined) return null;
  if (typeof value !== 'string') throw new ApiError(400, 'q tidak valid');
  const search = value.trim();
  if (search.length > 100) throw new ApiError(400, 'q tidak valid');
  return search || null;
}

router.get('/admin/users', requireAuth, async (req, res, next) => {
 try {
  const { identity } = res.locals;
  if (!identity.roles.some(role => role.nama === 'admin')) throw new ApiError(403, 'Hanya Admin boleh melihat administrasi pengguna');

  const page = positiveInteger(req.query.page, 1, MAX_PAGE, 'page');
  const pageSize = positiveInteger(req.query.page_size, 25, MAX_PAGE_SIZE, 'page_size');
  const search = usernameSearch(req.query.q);
  if (!Number.isSafeInteger((page - 1) * pageSize)) throw new ApiError(400, 'page tidak valid');

  const data = await supabaseRequest<Array<{ pengguna_id: number; username: string; terkunci: boolean | null; peran: Array<{ nama: string; scope_balai_id: number | null; scope_paket_id: number | null }> }>>(
    '/rest/v1/rpc/admin_daftar_pengguna', identity.token,
    { method: 'POST', body: JSON.stringify({ p_page: page, p_page_size: pageSize, p_username_search: search }) });
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data, page, page_size: pageSize });
 } catch (error) { next(error); }
});

export default router;
