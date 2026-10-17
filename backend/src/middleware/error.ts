import type { ErrorRequestHandler } from 'express';
import multer from 'multer';
import { ApiError } from '../services/supabase';
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof multer.MulterError) { res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Fail melebihi 10 MB' : 'Form upload tidak valid; gunakan satu fail pada field file' }); return; }
  if (error instanceof ApiError) { res.status(error.status).json({ error: error.message }); return; }
  if (error?.type === 'entity.parse.failed') { res.status(400).json({ error: 'JSON tidak valid' }); return; }
  if (error?.type === 'entity.too.large') { res.status(413).json({ error: 'Request terlalu besar' }); return; }
  res.status(500).json({ error: 'Kesalahan dalaman server' });
};
