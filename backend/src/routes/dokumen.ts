import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { ApiError, supabaseRequest } from '../services/supabase';
import { upload, storeAndRegister, readPdfBytes } from '../services/pdf-storage';
import { paketIdSchema } from '../schemas/paket';
const router = Router();
const BUCKET = 'dokumen-persiapan';
const formSchema = z.object({ judul: z.string().trim().min(1).max(255), jenis_dokumen: z.enum(['LAPORAN_PENDAHULUAN', 'PROGRAM_MUTU']) }).strict();
const versionFormSchema = z.object({ expected_version: z.string().regex(/^[1-9]\d*$/).transform(Number).refine(value => Number.isSafeInteger(value) && value <= 2147483646) }).strict();
interface FileVersion { bucket_id: string; object_path: string; nama_file: string; ukuran_byte: number; hash_file: string; versi_ke: number }
interface DocumentRow { dokumen_id: number; paket_id: number; judul: string; versi_aktif: number; dokumen_versi: FileVersion[] }
const documentSelect = 'dokumen_id,paket_id,judul,status,versi_aktif,diunggah_oleh,diunggah_pada,jenis_dokumen(kode,nama),dokumen_versi(bucket_id,object_path,nama_file,ukuran_byte,hash_file,versi_ke)';
async function visiblePackage(id: number, token: string) {
  const rows = await supabaseRequest<Array<{ paket_id: number; status: string }>>(`/rest/v1/paket_kontrak?select=paket_id,status&paket_id=eq.${id}&limit=1`, token);
  if (!rows.length) throw new ApiError(404, 'Paket tidak ditemukan atau tidak boleh diakses');
  return rows[0];
}
function packageId(value: unknown): number {
  const result = paketIdSchema.safeParse(value);
  if (!result.success) throw new ApiError(400, 'ID tidak valid');
  return result.data;
}
const providerDraft: RequestHandler = async (req, res, next) => {
  try {
    const { identity } = res.locals;
    if (!identity.roles.some(role => role.nama === 'penyedia_jasa')) throw new ApiError(403, 'Hanya Penyedia Jasa boleh upload dokumen');
    const p = await visiblePackage(packageId(req.params.id), identity.token);
    if (p.status !== 'DRAFT') throw new ApiError(409, 'Upload hanya dibenarkan ketika paket DRAFT');
    const preparation = await supabaseRequest<{ status: string }>('/rest/v1/rpc/baca_pengajuan_persiapan', identity.token, {
      method: 'POST', body: JSON.stringify({ p_paket_id: packageId(req.params.id) }),
    });
    if (!['DRAFT', 'PERLU_REVISI'].includes(preparation.status)) throw new ApiError(409, 'Persiapan dikunci ketika menunggu semakan atau sudah disetujui');
    next();
  } catch (error) { next(error); }
};
router.get('/jenis-dokumen', async (_req, res) => {
  const data = await supabaseRequest('/rest/v1/jenis_dokumen?select=jenis_dokumen_id,kode,nama&order=jenis_dokumen_id', res.locals.identity.token);
  res.json({ data });
});
router.get('/paket/:id/dokumen', async (req, res) => {
  const id = packageId(req.params.id);
  const token = res.locals.identity.token;
  await visiblePackage(id, token);
  const data = await supabaseRequest(`/rest/v1/dokumen?select=${documentSelect}&paket_id=eq.${id}&sumber_tipe=eq.PERSIAPAN&status=eq.TERSEDIA&order=dokumen_id.desc&limit=100`, token);
  res.json({ data });
});
router.get('/paket/:id/dokumen/:dokumenId', async (req, res) => {
  const id = packageId(req.params.id);
  const documentId = packageId(req.params.dokumenId);
  if (Object.keys(req.query).some(key => key !== 'page')) throw new ApiError(400, 'Parameter tidak disokong');
  const pageValue = req.query.page ?? '1';
  if (typeof pageValue !== 'string' || !/^[1-9]\d*$/.test(pageValue)) throw new ApiError(400, 'page tidak valid');
  const page = Number(pageValue);
  if (!Number.isSafeInteger(page) || page > 1000000) throw new ApiError(400, 'page tidak valid');
  const data = await supabaseRequest('/rest/v1/rpc/baca_detail_dokumen_persiapan', res.locals.identity.token, {
    method: 'POST', body: JSON.stringify({ p_paket_id: id, p_dokumen_id: documentId, p_page: page }),
  });
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data });
});
router.post('/paket/:id/dokumen', providerDraft, upload, async (req, res) => {
  const form = formSchema.safeParse(req.body);
  if (!form.success) { res.status(400).json({ error: 'Judul dan jenis dokumen tidak valid', details: form.error.flatten() }); return; }
  const data = await storeAndRegister(req, res.locals.identity.token, packageId(req.params.id), '/rest/v1/rpc/daftar_dokumen_persiapan', { p_jenis: form.data.jenis_dokumen, p_judul: form.data.judul });
  res.status(201).json({ data });
});
router.post('/paket/:id/dokumen/:dokumenId/versi', providerDraft, upload, async (req, res) => {
  const id = packageId(req.params.id);
  const documentId = packageId(req.params.dokumenId);
  const form = versionFormSchema.safeParse(req.body);
  if (!form.success) { res.status(400).json({ error: 'Versi dokumen tidak valid', details: form.error.flatten() }); return; }
  const token = res.locals.identity.token;
  const docs = await supabaseRequest<DocumentRow[]>(`/rest/v1/dokumen?select=${documentSelect}&paket_id=eq.${id}&dokumen_id=eq.${documentId}&sumber_tipe=eq.PERSIAPAN&status=eq.TERSEDIA&limit=1`, token);
  if (!docs.length) throw new ApiError(404, 'Dokumen tidak ditemukan atau tidak boleh diakses');
  if (docs[0].versi_aktif !== form.data.expected_version) throw new ApiError(409, 'Versi dokumen telah berubah. Baca senarai dokumen semula');
  const data = await storeAndRegister(req, token, id, '/rest/v1/rpc/tambah_versi_dokumen_persiapan', { p_dokumen_id: documentId, p_expected_version: form.data.expected_version });
  res.status(201).json({ data });
});
const downloadDocument: RequestHandler = async (req, res) => {
  const id = packageId(req.params.id);
  const documentId = packageId(req.params.dokumenId);
  const token = res.locals.identity.token;
  await visiblePackage(id, token);
  const docs = await supabaseRequest<DocumentRow[]>(`/rest/v1/dokumen?select=${documentSelect}&paket_id=eq.${id}&dokumen_id=eq.${documentId}&sumber_tipe=eq.PERSIAPAN&status=eq.TERSEDIA&limit=1`, token);
  const doc = docs[0];
  const requestedVersion = req.params.versi === undefined ? doc?.versi_aktif : packageId(req.params.versi);
  const file = doc?.dokumen_versi.find(v => v.versi_ke === requestedVersion);
  if (!file || file.bucket_id !== BUCKET || !file.object_path.startsWith(`${id}/`)) throw new ApiError(404, 'Dokumen tidak ditemukan atau tidak boleh diakses');
  const bytes = await readPdfBytes(file, token);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.attachment(file.nama_file.replace(/[\x00-\x1f\x7f/\\]/g, '_'));
  res.type('application/pdf').send(bytes);
};
router.get('/paket/:id/dokumen/:dokumenId/download', downloadDocument);
router.get('/paket/:id/dokumen/:dokumenId/versi/:versi/download', downloadDocument);
export default router;
