import { Router } from 'express';
import { ApiError, supabaseRequest } from '../services/supabase';
import { stage4LrsIdSchema, stage4LrsSaveSchema, stage4WorkflowReviewSchema, stage4WorkflowVersionSchema } from '../schemas/stage4-lrs';

const router = Router();
export const stage4LrsRpcEnabled = (value = process.env.STAGE4_LRS_RPCS) => value === 'true';
export const stage4LrsCapabilities = (enabled: boolean) => ({
  read: enabled,
  write: enabled,
  reason: enabled ? null : 'Stage 4 LRS dinonaktifkan oleh feature gate; aktifkan hanya setelah readback berotorisasi diverifikasi di QA.',
});
export const stage4WorkflowRpcEnabled = (value = process.env.STAGE4_WORKFLOW_RPCS) => value === 'true';
// The read-only status RPC is installed independently from lifecycle mutations.
export const stage4StatusRpcEnabled = () => true;

function parseId(value: unknown, label: string) {
  const parsed = stage4LrsIdSchema.safeParse(value);
  if (!parsed.success) throw new ApiError(400, `${label} tidak valid`);
  return parsed.data;
}

router.get('/paket/:id/validasi-lrs-capabilities', (_req, res) => {
  const enabled = stage4LrsRpcEnabled();
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data: stage4LrsCapabilities(enabled) });
});

router.get('/paket/:id/validasi-lrs-workflow-capabilities', (_req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data: { status: stage4StatusRpcEnabled(), submit: stage4WorkflowRpcEnabled(), review: stage4WorkflowRpcEnabled(), reason: stage4WorkflowRpcEnabled() ? null : 'Kontrak submit/review Stage 4 belum dipasang dan aturan bisnis belum disahkan.' } });
});

router.get('/paket/:id/validasi-lrs', async (req, res) => {
  if (!stage4LrsRpcEnabled()) throw new ApiError(503, 'Baca validasi LRS server dinonaktifkan oleh feature gate sampai readback berotorisasi diverifikasi di QA.');
  const packageId = parseId(req.params.id, 'ID paket');
  const data = await supabaseRequest('/rest/v1/rpc/baca_validasi_lrs', res.locals.identity.token, {
    method: 'POST', body: JSON.stringify({ p_paket_id: packageId }),
  });
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data });
});

router.put('/paket/:id/validasi-lrs/:ruasId', async (req, res) => {
  if (!stage4LrsRpcEnabled()) throw new ApiError(503, 'Simpan validasi LRS dinonaktifkan oleh feature gate sampai readback berotorisasi diverifikasi di QA.');
  const { identity } = res.locals;
  if (!identity.roles.some((role: { nama: string }) => role.nama === 'penyedia_jasa')) throw new ApiError(403, 'Hanya Penyedia Jasa boleh mencatat validasi LRS.');
  const packageId = parseId(req.params.id, 'ID paket');
  const roadId = parseId(req.params.ruasId, 'ID ruas');
  const parsed = stage4LrsSaveSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Data validasi LRS tidak valid', details: parsed.error.flatten() }); return; }
  const { expected_version, ...data } = parsed.data;
  const saved = await supabaseRequest('/rest/v1/rpc/simpan_validasi_lrs', identity.token, {
    method: 'POST',
    body: JSON.stringify({ p_paket_id: packageId, p_ruas_id: roadId, p_expected_version: expected_version, p_data: data }),
  });
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data: saved });
});

// Read-only status is installed independently of the still-disabled submit/review lifecycle.
router.get('/paket/:id/validasi-lrs-status', async (req, res) => {
  const packageId = parseId(req.params.id, 'ID paket');
  const persisted = await supabaseRequest<unknown>('/rest/v1/rpc/baca_status_validasi_lrs', res.locals.identity.token, {
    method: 'POST', body: JSON.stringify({ p_paket_id: packageId }),
  });
  if (!persisted || typeof persisted !== 'object' || Array.isArray(persisted)) throw new ApiError(502, 'Status workflow Stage 4 dari database tidak sesuai kontrak.');
  const value = persisted as Record<string, unknown>;
  const validStates = ['PENDING_RULES', 'DRAFT', 'DIAJUKAN', 'PERLU_REVISI', 'DISETUJUI'];
  const validGates = ['PENDING', 'PASS', 'FAIL'];
  if (value.paket_id !== packageId || !validStates.includes(String(value.state)) || !validGates.includes(String(value.gate)) ||
    typeof value.progression_allowed !== 'boolean' || !Number.isSafeInteger(value.workflow_version) || !Array.isArray(value.blockers) ||
    !value.blockers.every((blocker: unknown) => blocker !== null && typeof blocker === 'object' && !Array.isArray(blocker) &&
      typeof (blocker as Record<string, unknown>).code === 'string' && typeof (blocker as Record<string, unknown>).message === 'string') ||
    !Array.isArray(value.validations)) {
    throw new ApiError(502, 'Status workflow Stage 4 dari database tidak lengkap atau tidak sesuai kontrak.');
  }

  // A pending gate can never authorize progression, even if a database payload
  // is malformed in that one field. Preserve server status and blockers verbatim.
  const blockers = value.blockers as Array<{ code: string; message: string }>;
  const progressionAllowed = value.gate === 'PENDING' || value.state === 'PENDING_RULES'
    ? false : value.progression_allowed;
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data: { ...value, progression_allowed: progressionAllowed, unresolved: blockers.map(blocker => blocker.message) } });
});

router.post('/paket/:id/validasi-lrs/submit', async (req, res) => {
  if (!stage4WorkflowRpcEnabled()) throw new ApiError(503, 'Submit Stage 4 dinonaktifkan sampai RPC dan aturan bisnis disahkan.');
  const { identity } = res.locals;
  if (!identity.roles.some(role => role.nama === 'penyedia_jasa')) throw new ApiError(403, 'Hanya Penyedia Jasa boleh mengajukan Stage 4.');
  const packageId = parseId(req.params.id, 'ID paket');
  const parsed = stage4WorkflowVersionSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Versi pengajuan Stage 4 tidak valid', details: parsed.error.flatten() }); return; }
  const data = await supabaseRequest('/rest/v1/rpc/ajukan_validasi_lrs', identity.token, {
    method: 'POST', body: JSON.stringify({ p_paket_id: packageId, p_expected_version: parsed.data.expected_version }),
  });
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data });
});

router.post('/paket/:id/validasi-lrs/review', async (req, res) => {
  if (!stage4WorkflowRpcEnabled()) throw new ApiError(503, 'Review Stage 4 dinonaktifkan sampai RPC dan aturan bisnis disahkan.');
  const { identity } = res.locals;
  if (!identity.roles.some(role => role.nama === 'pic_balai')) throw new ApiError(403, 'Hanya PIC Balai boleh meninjau pengajuan Stage 4.');
  const packageId = parseId(req.params.id, 'ID paket');
  const parsed = stage4WorkflowReviewSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Keputusan review Stage 4 tidak valid', details: parsed.error.flatten() }); return; }
  const data = await supabaseRequest('/rest/v1/rpc/review_validasi_lrs', identity.token, {
    method: 'POST', body: JSON.stringify({ p_paket_id: packageId, p_expected_version: parsed.data.expected_version, p_keputusan: parsed.data.keputusan, p_catatan: parsed.data.catatan }),
  });
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data });
});

export default router;
