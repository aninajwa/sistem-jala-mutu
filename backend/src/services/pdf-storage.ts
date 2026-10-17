import type { Request } from 'express';
import multer from 'multer';
import { createHash, randomUUID } from 'node:crypto';
import { ApiError, supabaseFetch, supabaseRequest } from './supabase';
const MAX = 10 * 1024 * 1024;
export const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX, files: 1, fields: 2, parts: 3, fieldSize: 2048 }, fileFilter(_req, file, callback) {
  if (file.mimetype !== 'application/pdf' || !/\.pdf$/i.test(file.originalname)) { callback(new ApiError(400, 'Fail mesti PDF')); return; }
  callback(null, true);
} }).single('file');
export async function storeAndRegister(req: Request, token: string, id: number, rpc: string, fields: Record<string, unknown>, bucket = 'dokumen-persiapan', prefix = String(id)) {
  const file = req.file;
  if (!file || !file.size) throw new ApiError(400, 'Pilih satu fail PDF');
  if (file.buffer.subarray(0, 5).toString('ascii') !== '%PDF-' || !file.buffer.subarray(Math.max(0, file.size - 1024)).includes(Buffer.from('%%EOF'))) throw new ApiError(400, 'Kandungan fail bukan PDF yang dikenali');
  const namaFile = file.originalname.replace(/[\x00-\x1f\x7f/\\]/g, '_');
  if (namaFile.length > 255) throw new ApiError(400, 'Nama fail terlalu panjang');
  const objectPath = `${prefix}/${randomUUID()}.pdf`;
  const hash = createHash('sha256').update(file.buffer).digest('hex');
  const storagePath = `/storage/v1/object/${bucket}/${objectPath}`;
  const uploaded = await supabaseFetch(storagePath, token, { method: 'POST', headers: { 'Content-Type': 'application/pdf', 'x-upsert': 'false' }, body: new Uint8Array(file.buffer) }, 60000);
  await uploaded.arrayBuffer();
  let data: unknown;
  try {
    data = await supabaseRequest(rpc, token, { method: 'POST', body: JSON.stringify({ ...fields, p_paket_id: id, p_object_path: objectPath, p_nama_file: namaFile, p_ukuran: file.size, p_sha256: hash }) });
  } catch (error) {
    // Only clean up a definite rejected transaction. On timeout the registration may have committed.
    // RLS prevents deleting an object already registered as a document.
    if (error instanceof ApiError && [400, 403, 404, 409].includes(error.status)) {
      try { const removed = await supabaseFetch(`/storage/v1/object/${bucket}`, token, { method: 'DELETE', body: JSON.stringify({ prefixes: [objectPath] }) }); await removed.arrayBuffer(); }
      catch { req.log.warn('Pembersihan fail upload gagal; perlu semak Storage'); }
    }
    throw error;
  }
  return data;
}

export interface StoredPdf { bucket_id: string; object_path: string; nama_file: string; ukuran_byte: number; hash_file: string }
export async function readPdfBytes(file: StoredPdf, token: string) {
  const path = file.object_path.split('/').map(encodeURIComponent).join('/');
  const response = await supabaseFetch(`/storage/v1/object/authenticated/${file.bucket_id}/${path}`, token, {}, 60000);
  const reader = response.body?.getReader();
  if (!reader) throw new ApiError(502, 'Fail tidak boleh dibaca');
  const chunks: Uint8Array[] = []; let length = 0;
  for (;;) { const { value, done } = await reader.read(); if (done) break; length += value.byteLength; if (length > MAX) { await reader.cancel(); throw new ApiError(502, 'Saiz fail tidak sepadan'); } chunks.push(value); }
  const bytes = Buffer.concat(chunks);
  if (bytes.length !== Number(file.ukuran_byte) || createHash('sha256').update(bytes).digest('hex') !== file.hash_file) throw new ApiError(502, 'Integriti fail tidak sepadan');
  return bytes;
}
