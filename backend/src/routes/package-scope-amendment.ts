import { Router } from 'express';
import { paketIdSchema } from '../schemas/paket';
import {
  packageScopeAmendmentIdSchema,
  packageScopeAmendmentReviewSchema,
  packageScopeAmendmentSubmitSchema,
} from '../schemas/package-scope-amendment';
import { ApiError } from '../services/supabase';
import {
  readPackageScopeAmendmentState,
  reviewPackageScopeAmendment,
  submitPackageScopeAmendment,
} from '../services/package-scope-amendment';

const router = Router();

function parsePackageId(value: unknown) {
  const parsed = paketIdSchema.safeParse(value);
  if (!parsed.success) throw new ApiError(400, 'ID paket tidak valid');
  return parsed.data;
}

router.get('/paket/:id/scope-amendment', async (req, res) => {
  const packageId = parsePackageId(req.params.id);
  const data = await readPackageScopeAmendmentState(packageId, res.locals.identity.token);
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data });
});

router.post('/paket/:id/scope-amendment', async (req, res) => {
  const { identity } = res.locals;
  if (!identity.roles.some((role: { nama: string }) => role.nama === 'penyedia_jasa')) {
    throw new ApiError(403, 'Hanya Penyedia Jasa boleh mengajukan penambahan jenis survei.');
  }
  const packageId = parsePackageId(req.params.id);
  const parsed = packageScopeAmendmentSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Permohonan penambahan jenis survei tidak valid.', details: parsed.error.flatten() });
    return;
  }
  const data = await submitPackageScopeAmendment(packageId, parsed.data, identity.token);
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(201).json({ data });
});

router.post('/paket/:id/scope-amendment/:amendmentId/review', async (req, res) => {
  const { identity } = res.locals;
  if (!identity.roles.some((role: { nama: string }) => role.nama === 'pic_balai')) {
    throw new ApiError(403, 'Hanya PIC Balai boleh memutuskan pindaan scope survei.');
  }
  const packageId = parsePackageId(req.params.id);
  const parsedId = packageScopeAmendmentIdSchema.safeParse(req.params.amendmentId);
  if (!parsedId.success) throw new ApiError(400, 'ID pindaan scope tidak valid.');
  const parsed = packageScopeAmendmentReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Keputusan pindaan scope tidak valid.', details: parsed.error.flatten() });
    return;
  }
  const data = await reviewPackageScopeAmendment(packageId, parsedId.data, parsed.data, identity.token);
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data });
});

export default router;
