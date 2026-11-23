import ujiCobaRouter from './uji-coba';
import surveiRouter from './survei';
import koreksiRouter from './koreksi';
import { Router } from 'express';
import dokumenRouter from './dokumen';
import kalibrasiAsasRouter from './kalibrasi-asas';
import kalibrasiRouter from './kalibrasi';
import personelRouter from './personel';
import kualifikasiBuktiRouter from './kualifikasi-bukti';
import ruasJalanRouter from './ruas-jalan';
import siklusVervalRouter from './siklus-verval';
import stage4LrsRouter from './stage4-lrs';
import stage1ConfirmationRouter from './stage1-confirmation';
import packageScopeAmendmentRouter from './package-scope-amendment';
import { checklistDraftSchema, checklistEvidenceSchema, preparationSubmitSchema, preparationReviewSchema, stage1IriDraftSchema } from '../schemas/checklist';
import { requireAuth } from '../middleware/auth';
import { ApiError, supabaseRequest } from '../services/supabase';
import { paketDraftSchema, paketPatchSchema, paketIdSchema, paketSurveyScopePatchSchema } from '../schemas/paket';
import { assertStage1IriChecklistEditor, assertStage1IriChecklistEnabled } from '../services/stage1-iri-checklist-policy';
import { parsePackageScopeIds, readPackageSurveyScopes } from '../services/package-survey-scope';
import { parseDeclaredScopePackageIds, readDeclaredSurveyScopes, saveDeclaredSurveyScope } from '../services/package-declared-survey-scope';
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
router.get('/paket/survey-scope', async (req, res) => {
  const ids = parsePackageScopeIds(req.query.paket_ids);
  const data = await readPackageSurveyScopes(ids, res.locals.identity.token);
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data });
});
router.get('/paket/declared-survey-scope', async (req, res) => {
  const ids = parseDeclaredScopePackageIds(req.query.paket_ids);
  const data = await readDeclaredSurveyScopes(ids, res.locals.identity.token);
  res.setHeader('Cache-Control', 'private, no-store');
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
  const data = await supabaseRequest('/rest/v1/rpc/buat_paket_draft_dengan_scope', identity.token, {
    method: 'POST', body: JSON.stringify({
      p_nama_paket: p.nama_paket,
      p_nomor_kontrak: p.nomor_kontrak,
      p_tahun_anggaran: p.tahun_anggaran,
      p_balai_id: p.balai_id,
      p_jenis_survei_ids: p.jenis_survei_ids,
    }),
  });
  if (!data || typeof data !== 'object' ||
      !Number.isSafeInteger((data as Record<string, unknown>).paket_id) ||
      (data as Record<string, unknown>).status !== 'DRAFT') {
    throw new ApiError(502, 'Respons pembuatan paket dan scope tidak sesuai.');
  }
  res.status(201).json({ data });
});
router.get('/paket/:id/declared-survey-scope', async (req, res) => {
  const id = paketIdSchema.safeParse(req.params.id);
  if (!id.success) throw new ApiError(400, 'ID paket tidak valid');
  const data = await readDeclaredSurveyScopes([id.data], res.locals.identity.token);
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data: data[0] });
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
router.put('/paket/:id/survey-scope', async (req, res) => {
  const { identity } = res.locals;
  const id = paketIdSchema.safeParse(req.params.id);
  if (!id.success) throw new ApiError(400, 'ID paket tidak valid');
  const parsed = paketSurveyScopePatchSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Perubahan scope survei tidak valid', details: parsed.error.flatten() });
    return;
  }
  if (!identity.roles.some(role => role.nama === 'penyedia_jasa')) {
    throw new ApiError(403, 'Hanya Penyedia Jasa boleh mengubah scope kontrak');
  }
  const data = await saveDeclaredSurveyScope(id.data, parsed.data, identity.token);
  res.setHeader('Cache-Control', 'private, no-store');
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
// Stage 1 candidate RPCs stay fail-closed until internal-draft acceptance,
// SQL installation/authorization verification, and separate activation.
router.get('/paket/:id/checklist-kalibrasi', async (req, res) => {
  assertStage1IriChecklistEnabled();
  if (req.query.survey !== 'IRI') throw new ApiError(400, 'Endpoint ini hanya mendukung survey IRI');
  const id = paketIdSchema.safeParse(req.params.id);
  if (!id.success) throw new ApiError(400, 'ID paket tidak valid');
  const data = await supabaseRequest('/rest/v1/rpc/baca_checklist_kalibrasi_iri', res.locals.identity.token, {
    method: 'POST', body: JSON.stringify({ p_paket_id: id.data }),
  });
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data });
});
router.patch('/paket/:id/checklist-kalibrasi', async (req, res) => {
  const { identity } = res.locals;
  assertStage1IriChecklistEnabled();
  assertStage1IriChecklistEditor(identity);
  const id = paketIdSchema.safeParse(req.params.id);
  if (!id.success) throw new ApiError(400, 'ID paket tidak valid');
  const parsed = stage1IriDraftSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Jawaban checklist IRI tidak valid', details: parsed.error.flatten() }); return; }
  const data = await supabaseRequest('/rest/v1/rpc/simpan_checklist_kalibrasi_iri', identity.token, {
    method: 'POST', body: JSON.stringify({ p_paket_id: id.data, p_template_id: parsed.data.template_id, p_expected_version: parsed.data.expected_version, p_answers: parsed.data.answers }),
  });
  res.setHeader('Cache-Control', 'private, no-store');
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
router.use(surveiRouter);
router.use(siklusVervalRouter);
router.use(stage4LrsRouter);
router.use(stage1ConfirmationRouter);
router.use(packageScopeAmendmentRouter);
router.use(ruasJalanRouter);
router.use(koreksiRouter);
export default router;
