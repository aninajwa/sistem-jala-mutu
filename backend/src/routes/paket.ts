import ujiCobaRouter from './uji-coba';
import { Router } from 'express';
import dokumenRouter from './dokumen';
import kalibrasiAsasRouter from './kalibrasi-asas';
import kalibrasiRouter from './kalibrasi';
import personelRouter from './personel';
import kualifikasiBuktiRouter from './kualifikasi-bukti';
import { checklistDraftSchema, checklistEvidenceSchema, preparationSubmitSchema, preparationReviewSchema } from '../schemas/checklist';
import { requireAuth } from '../middleware/auth';
import { ApiError, supabaseRequest } from '../services/supabase';
import { paketDraftSchema, paketPatchSchema, paketIdSchema } from '../schemas/paket';
const router = Router();
router.use(requireAuth);
router.get('/me', (_req, res) => {
  const { profile, roles, assignments } = res.locals.identity;
  res.json({ data: { ...profile, peran: roles, penugasan: assignments } });
});
router.get('/balai', async (_req, res) => {
  const data = await supabaseRequest('/rest/v1/balai?select=balai_id,kode,nama,aktif&aktif=eq.true&order=nama', res.locals.identity.token);
  res.json({ data });
});
router.get('/paket', async (req, res) => {
  const page = Number(req.query.page ?? 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000) throw new ApiError(400, 'page tidak valid');
  const data = await supabaseRequest(`/rest/v1/paket_kontrak?select=paket_id,nama_paket,nomor_kontrak,tahun_anggaran,balai_id,status,created_by,created_at&order=paket_id.desc&limit=50&offset=${(page - 1) * 50}`, res.locals.identity.token);
  res.json({ data, page, page_size: 50 });
});
router.post('/paket', async (req, res) => {
  const { identity } = res.locals;
  if (!identity.roles.some(role => role.nama === 'penyedia_jasa')) throw new ApiError(403, 'Hanya Penyedia Jasa boleh mencipta draft');
  const result = paketDraftSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: 'Data paket tidak valid', details: result.error.flatten() }); return; }
  const p = result.data;
  const data = await supabaseRequest('/rest/v1/rpc/buat_paket_draft', identity.token, {
    method: 'POST', body: JSON.stringify({ p_nama_paket: p.nama_paket, p_nomor_kontrak: p.nomor_kontrak, p_tahun_anggaran: p.tahun_anggaran, p_balai_id: p.balai_id }),
  });
  res.status(201).json({ data });
});
router.get('/paket/:id', async (req, res) => {
  const id = paketIdSchema.safeParse(req.params.id);
  if (!id.success) throw new ApiError(400, 'ID paket tidak valid');
  const rows = await supabaseRequest<unknown[]>(
    `/rest/v1/paket_kontrak?select=paket_id,nama_paket,nomor_kontrak,tahun_anggaran,balai_id,penyedia_id,nama_ppk,tgl_spmk,tgl_selesai,nilai_kontrak,batas_lap_pendahuluan,status,created_by,created_at&paket_id=eq.${id.data}&limit=1`,
    res.locals.identity.token,
  );
  if (!rows.length) throw new ApiError(404, 'Paket tidak ditemukan atau tidak boleh diakses');
  res.json({ data: rows[0] });
});
router.patch('/paket/:id', async (req, res) => {
  const { identity } = res.locals;
  if (!identity.roles.some(role => role.nama === 'penyedia_jasa')) throw new ApiError(403, 'Hanya Penyedia Jasa boleh mengubah draft');
  const id = paketIdSchema.safeParse(req.params.id);
  if (!id.success) throw new ApiError(400, 'ID paket tidak valid');
  const result = paketPatchSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: 'Perubahan paket tidak valid', details: result.error.flatten() }); return; }
  const data = await supabaseRequest('/rest/v1/rpc/ubah_paket_draft', identity.token, {
    method: 'POST', body: JSON.stringify({ p_paket_id: id.data, p_patch: result.data }),
  });
  res.json({ data });
});
router.get('/paket/:id/ringkasan-persiapan', async (req, res) => {
  const id = paketIdSchema.safeParse(req.params.id);
  if (!id.success) throw new ApiError(400, 'ID paket tidak valid');
  const data = await supabaseRequest('/rest/v1/rpc/baca_ringkasan_persiapan', res.locals.identity.token, {
    method: 'POST', body: JSON.stringify({ p_paket_id: id.data }),
  });
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data });
});
router.get('/paket/:id/checklist-persiapan', async (req, res) => {
  const id = paketIdSchema.safeParse(req.params.id);
  if (!id.success) throw new ApiError(400, 'ID paket tidak valid');
  const data = await supabaseRequest('/rest/v1/rpc/baca_checklist_persiapan', res.locals.identity.token, {
    method: 'POST', body: JSON.stringify({ p_paket_id: id.data }),
  });
  res.json({ data });
});
router.patch('/paket/:id/checklist-persiapan', async (req, res) => {
  const { identity } = res.locals;
  if (!identity.roles.some(role => role.nama === 'penyedia_jasa')) throw new ApiError(403, 'Hanya Penyedia Jasa boleh mengisi checklist');
  const id = paketIdSchema.safeParse(req.params.id);
  if (!id.success) throw new ApiError(400, 'ID paket tidak valid');
  const result = checklistDraftSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: 'Jawapan checklist tidak valid', details: result.error.flatten() }); return; }
  const data = await supabaseRequest('/rest/v1/rpc/simpan_checklist_persiapan', identity.token, {
    method: 'POST', body: JSON.stringify({ p_paket_id: id.data, p_expected_version: result.data.expected_version, p_jawaban: result.data.jawaban }),
  });
  res.json({ data });
});
router.patch('/paket/:id/checklist-persiapan/bukti', async (req, res) => {
  const { identity } = res.locals;
  if (!identity.roles.some(role => role.nama === 'penyedia_jasa')) throw new ApiError(403, 'Hanya Penyedia Jasa boleh mengubah bukti checklist');
  const id = paketIdSchema.safeParse(req.params.id);
  if (!id.success) throw new ApiError(400, 'ID paket tidak valid');
  const result = checklistEvidenceSchema.safeParse(req.body);
  if (!result.success) { res.status(400).json({ error: 'Pautan bukti tidak valid', details: result.error.flatten() }); return; }
  const data = await supabaseRequest('/rest/v1/rpc/tautkan_bukti_persiapan', identity.token, {
    method: 'POST', body: JSON.stringify({ p_paket_id: id.data, p_expected_version: result.data.expected_version, p_item_id: result.data.item_id, p_dokumen_id: result.data.bukti_dokumen_id }),
  });
  res.json({ data });
});
router.get('/paket/:id/pengajuan-persiapan', async (req, res) => {
  const id = paketIdSchema.safeParse(req.params.id);
  if (!id.success) throw new ApiError(400, 'ID paket tidak valid');
  const data = await supabaseRequest('/rest/v1/rpc/baca_pengajuan_persiapan', res.locals.identity.token, {
    method: 'POST', body: JSON.stringify({ p_paket_id: id.data }),
  });
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data });
});
router.post('/paket/:id/pengajuan-persiapan', async (req, res) => {
  const { identity } = res.locals;
  if (!identity.roles.some(role => role.nama === 'penyedia_jasa')) throw new ApiError(403, 'Hanya Penyedia Jasa boleh menghantar persiapan');
  const id = paketIdSchema.safeParse(req.params.id);
  if (!id.success) throw new ApiError(400, 'ID paket tidak valid');
  const parsed = preparationSubmitSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Pengajuan tidak valid', details: parsed.error.flatten() }); return; }
  const data = await supabaseRequest('/rest/v1/rpc/ajukan_persiapan', identity.token, {
    method: 'POST', body: JSON.stringify({ p_paket_id: id.data, p_expected_version: parsed.data.expected_version }),
  });
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(201).json({ data });
});
router.post('/paket/:id/pengajuan-persiapan/review', async (req, res) => {
  const { identity } = res.locals;
  if (!identity.roles.some(role => role.nama === 'pic_balai')) throw new ApiError(403, 'Hanya PIC Balai boleh menyemak persiapan');
  const id = paketIdSchema.safeParse(req.params.id);
  if (!id.success) throw new ApiError(400, 'ID paket tidak valid');
  const parsed = preparationReviewSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Keputusan tidak valid', details: parsed.error.flatten() }); return; }
  const data = await supabaseRequest('/rest/v1/rpc/review_persiapan', identity.token, {
    method: 'POST', body: JSON.stringify({ p_paket_id: id.data, p_expected_version: parsed.data.expected_version, p_keputusan: parsed.data.keputusan, p_catatan: parsed.data.catatan }),
  });
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data });
});
router.use(dokumenRouter);
router.use(kalibrasiAsasRouter);
router.use(kalibrasiRouter);
router.use(personelRouter);
router.use(kualifikasiBuktiRouter);
router.use(ujiCobaRouter);
export default router;
