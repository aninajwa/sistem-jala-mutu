import { Router, type RequestHandler } from 'express';
import multer from 'multer';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { ApiError, supabaseFetch, supabaseRequest } from '../services/supabase';
import { paketIdSchema } from '../schemas/paket';
const router = Router();
const MAX = 10 * 1024 * 1024;
const BUCKET = 'dokumen-persiapan';
const formSchema = z.object({ judul: z.string().trim().min(1).max(255), jenis_dokumen: z.enum(['LAPORAN_PENDAHULUAN', 'PROGRAM_MUTU']) }).strict();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX, files: 1, fields: 2, parts: 3, fieldSize: 2048 }, fileFilter(_req, file, callback) {
  if (file.mimetype !== 'application/pdf' || !/\.pdf$/i.test(file.originalname)) { callback(new ApiError(400, 'Fail mesti PDF')); return; }
  callback(null, true);
} }).single('file');
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
  const data = await supabaseRequest(`/rest/v1/dokumen?select=${documentSelect}&paket_id=eq.${id}&status=eq.TERSEDIA&order=dokumen_id.desc&limit=100`, token);
  res.json({ data });
});
router.post('/paket/:id/dokumen', providerDraft, upload, async (req, res) => {
  const form = formSchema.safeParse(req.body);
  if (!form.success) { res.status(400).json({ error: 'Judul dan jenis dokumen tidak valid', details: form.error.flatten() }); return; }
  const file = req.file;
  if (!file || !file.size) throw new ApiError(400, 'Pilih satu fail PDF');
  if (file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-' || !file.buffer.subarray(Math.max(0, file.size - 1024)).includes(Buffer.from('%%EOF'))) throw new ApiError(400, 'Kandungan fail bukan PDF yang dikenali');
  const namaFile = file.originalname.replace(/[\x00-\x1f\x7f/\\]/g, '_');
  if (namaFile.length > 255) throw new ApiError(400, 'Nama fail terlalu panjang');
  const id = packageId(req.params.id);
  const token = res.locals.identity.token;
  const objectPath = `${id}/${randomUUID()}.pdf`;
  const hash = createHash('sha256').update(file.buffer).digest('hex');
  const storagePath = `/storage/v1/object/${BUCKET}/${objectPath}`;
  const uploaded = await supabaseFetch(storagePath, token, { method: 'POST', headers: { 'Content-Type': 'application/pdf', 'x-upsert': 'false' }, body: new Uint8Array(file.buffer) }, 60000);
  await uploaded.arrayBuffer();
  let data: unknown;
  try {
    data = await supabaseRequest('/rest/v1/rpc/daftar_dokumen_persiapan', token, { method: 'POST', body: JSON.stringify({ p_paket_id: id, p_jenis: form.data.jenis_dokumen, p_judul: form.data.judul, p_object_path: objectPath, p_nama_file: namaFile, p_ukuran: file.size, p_sha256: hash }) });
  } catch (error) {
    // Only clean up a definite rejected transaction. On timeout the registration may have committed.
    // RLS prevents deleting an object already registered as a document.
    if (error instanceof ApiError && [400, 403, 404, 409].includes(error.status)) {
      try { const removed = await supabaseFetch(`/storage/v1/object/${BUCKET}`, token, { method: 'DELETE', body: JSON.stringify({ prefixes: [objectPath] }) }); await removed.arrayBuffer(); }
      catch { req.log.warn('Pembersihan fail upload gagal; perlu semak Storage'); }
    }
    throw error;
  }
  res.status(201).json({ data });
});
router.get('/paket/:id/dokumen/:dokumenId/download', async (req, res) => {
  const id = packageId(req.params.id);
  const documentId = packageId(req.params.dokumenId);
  const token = res.locals.identity.token;
  await visiblePackage(id, token);
  const docs = await supabaseRequest<DocumentRow[]>(`/rest/v1/dokumen?select=${documentSelect}&paket_id=eq.${id}&dokumen_id=eq.${documentId}&status=eq.TERSEDIA&limit=1`, token);
  const doc = docs[0];
  const file = doc?.dokumen_versi.find(v => v.versi_ke === doc.versi_aktif);
  if (!file || file.bucket_id !== BUCKET || !file.object_path.startsWith(`${id}/`)) throw new ApiError(404, 'Dokumen tidak ditemukan atau tidak boleh diakses');
  const path = file.object_path.split('/').map(encodeURIComponent).join('/');
  const response = await supabaseFetch(`/storage/v1/object/authenticated/${BUCKET}/${path}`, token, {}, 60000);
  const reader = response.body?.getReader();
  if (!reader) throw new ApiError(502, 'Fail tidak boleh dibaca');
  const chunks: Uint8Array[] = []; let length = 0;
  for (;;) { const { value, done } = await reader.read(); if (done) break; length += value.byteLength; if (length > MAX) { await reader.cancel(); throw new ApiError(502, 'Saiz fail tidak sepadan'); } chunks.push(value); }
  const bytes = Buffer.concat(chunks);
  if (bytes.length !== Number(file.ukuran_byte) || createHash('sha256').update(bytes).digest('hex') !== file.hash_file) throw new ApiError(502, 'Integriti fail tidak sepadan');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.attachment(file.nama_file.replace(/[\x00-\x1f\x7f/\\]/g, '_'));
  res.type('application/pdf').send(bytes);
});
export default router;
