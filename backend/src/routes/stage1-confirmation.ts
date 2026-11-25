import { Router } from 'express';
import { paketIdSchema } from '../schemas/paket';
import { stage1ConfirmationReviewSchema, stage1ConfirmationSubmitSchema } from '../schemas/stage1-confirmation';
import {
  assertStage1ConfirmationEnabled,
  assertStage1ConfirmationPic,
  assertStage1ConfirmationProvider,
  readStage1ConfirmationGate,
  stage1ConfirmationRpc,
  stage1ConfirmationEnabled,
} from '../services/stage1-confirmation-policy';
import { ApiError, supabaseRequest } from '../services/supabase';

const router = Router();

function parsePackageId(value: unknown) {
  const parsed = paketIdSchema.safeParse(value);
  if (!parsed.success) throw new ApiError(400, 'ID paket tidak valid');
  return parsed.data;
}

router.get('/paket/:id/konfirmasi-kalibrasi', async (req, res) => {
  const packageId = parsePackageId(req.params.id);
  res.setHeader('Cache-Control', 'private, no-store');
  if (!stage1ConfirmationEnabled()) {
    const packages = await supabaseRequest<Array<{ paket_id: number }>>(
      `/rest/v1/paket_kontrak?select=paket_id&paket_id=eq.${packageId}&limit=1`,
      res.locals.identity.token,
    );
    if (!packages.some(item => item.paket_id === packageId)) {
      throw new ApiError(404, 'Paket tidak ditemukan atau tidak boleh diakses');
    }
    res.json({ data: {
      aktif: false,
      paket_id: packageId,
      status: 'NONAKTIF',
      versi: 0,
      snapshot_saat_ini: null,
      pengajuan: null,
      review: null,
      snapshot_sesuai: false,
      stage2_allowed: false,
      alasan: 'Kontrak konfirmasi PIC Tahap 1 belum disetujui, dipasang, dan diaktifkan.',
    } });
    return;
  }
  const data = await readStage1ConfirmationGate(packageId, res.locals.identity.token);
  res.json({ data: { ...data, aktif: true } });
});

router.post('/paket/:id/konfirmasi-kalibrasi/pengajuan', async (req, res) => {
  const { identity } = res.locals;
  assertStage1ConfirmationEnabled();
  assertStage1ConfirmationProvider(identity);
  const packageId = parsePackageId(req.params.id);
  const parsed = stage1ConfirmationSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Versi pengajuan konfirmasi kalibrasi tidak valid', details: parsed.error.flatten() });
    return;
  }
  const data = await stage1ConfirmationRpc<Record<string, unknown>>('/rest/v1/rpc/ajukan_konfirmasi_kalibrasi_tahap1', identity.token, {
    method: 'POST',
    body: JSON.stringify({ p_paket_id: packageId, p_expected_version: parsed.data.expected_version }),
  });
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(201).json({ data: { ...(data && typeof data === 'object' ? data : {}), aktif: true } });
});

router.post('/paket/:id/konfirmasi-kalibrasi/review', async (req, res) => {
  const { identity } = res.locals;
  assertStage1ConfirmationEnabled();
  assertStage1ConfirmationPic(identity);
  const packageId = parsePackageId(req.params.id);
  const parsed = stage1ConfirmationReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Keputusan konfirmasi kalibrasi tidak valid', details: parsed.error.flatten() });
    return;
  }
  const data = await stage1ConfirmationRpc<Record<string, unknown>>('/rest/v1/rpc/review_konfirmasi_kalibrasi_tahap1', identity.token, {
    method: 'POST',
    body: JSON.stringify({
      p_paket_id: packageId,
      p_expected_version: parsed.data.expected_version,
      p_keputusan: parsed.data.keputusan,
      p_catatan: parsed.data.catatan,
    }),
  });
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data: { ...(data && typeof data === 'object' ? data : {}), aktif: true } });
});

export default router;
