import { z } from 'zod';

const requiredText = z.string().trim().min(1).max(255);

export const ruasJalanCreateSchema = z.object({
  nomor_ruas: requiredText,
  nama_ruas: requiredText,
}).strict();
