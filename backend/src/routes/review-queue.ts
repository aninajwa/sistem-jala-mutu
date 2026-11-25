import { Router } from 'express';
import { buildReviewQueue } from '../services/review-queue';

const router = Router();

/** Aggregated submission states (Tahap 0–2) across the caller's visible packages. */
router.get('/review-queue', async (_req, res) => {
  const { rows, partial } = await buildReviewQueue(res.locals.identity.token);
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data: rows, partial });
});

export default router;
