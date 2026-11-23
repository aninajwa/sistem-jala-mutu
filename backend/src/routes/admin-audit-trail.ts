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

function searchText(value: unknown) {
  if (value === undefined) return null;
  if (typeof value !== 'string') throw new ApiError(400, 'q tidak valid');
  const search = value.trim();
  if (search.length > 100) throw new ApiError(400, 'q tidak valid');
  return search || null;
}

type AuditTrailRow = {
  trail_id: string;
  waktu: string | null;
  pengguna_id: number | null;
  tabel: string;
  aksi: string;
  ringkasan: string;
};

router.get('/admin/audit-trail', requireAuth, async (req, res, next) => {
  try {
    const { identity } = res.locals;
    if (!identity.roles.some(role => role.nama === 'admin')) throw new ApiError(403, 'Hanya Admin boleh melihat jejak aktivitas');

    const page = positiveInteger(req.query.page, 1, MAX_PAGE, 'page');
    const pageSize = positiveInteger(req.query.page_size, 25, MAX_PAGE_SIZE, 'page_size');
    const search = searchText(req.query.q);
    if (!Number.isSafeInteger((page - 1) * pageSize)) throw new ApiError(400, 'page tidak valid');

    const rows = await supabaseRequest<AuditTrailRow[]>(
      '/rest/v1/rpc/admin_daftar_jejak_aktivitas', identity.token,
      { method: 'POST', body: JSON.stringify({ p_page: page, p_page_size: pageSize, p_search: search }) },
    );
    // Whitelist the public response instead of passing through any future RPC columns.
    const data = rows.map(row => ({
      // The RPC returns bigint as decimal text so JSON/JavaScript cannot round it.
      trail_id: row.trail_id,
      waktu: row.waktu,
      pengguna_id: row.pengguna_id,
      tabel: row.tabel,
      aksi: row.aksi,
      ringkasan: row.ringkasan,
    }));
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ data, page, page_size: pageSize });
  } catch (error) { next(error); }
});

export default router;
