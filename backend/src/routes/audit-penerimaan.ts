import { Router, type Response } from 'express';
import { ApiError, supabaseRequest } from '../services/supabase';
import { denyAdminWorkflowWrites } from '../middleware/workflow-write';
import { paketIdSchema } from '../schemas/paket';
import {
  auditDecisionSchema,
  auditLevelSchema,
  auditSaveSchema,
  penerimaanSchema,
  terminNumberSchema,
  uploadSistemSchema,
} from '../schemas/audit-penerimaan';

/** Tahap 4 upload log, Tahap 5 tiered audit and Tahap 6 term acceptance. Gate: AUDIT_ACCEPTANCE_RPCS. */
const router = Router();
const enabled = () => process.env.AUDIT_ACCEPTANCE_RPCS === 'true';
const AUDIT_OWNER: Record<number, { role: string; label: string }> = {
  1: { role: 'penyedia_jasa', label: 'Penyedia Jasa' },
  2: { role: 'pic_balai', label: 'PIC Balai' },
  3: { role: 'direktorat', label: 'Direktorat' },
};

function requireEnabled() {
  if (!enabled()) throw new ApiError(503, 'Audit dan penerimaan server dinonaktifkan sampai RPC dipasang dan diverifikasi.');
}
function parse<T>(schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } }, value: unknown, label: string): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new ApiError(400, `${label} tidak valid`);
  return parsed.data;
}
function requireRole(res: Response, role: string, message: string) {
  if (!res.locals.identity.roles.some((r: { nama: string }) => r.nama === role)) throw new ApiError(403, message);
}
async function rpc(res: Response, name: string, args: Record<string, unknown>, status = 200) {
  const data = await supabaseRequest(`/rest/v1/rpc/${name}`, res.locals.identity.token, { method: 'POST', body: JSON.stringify(args) });
  res.setHeader('Cache-Control', 'private, no-store');
  res.status(status).json({ data });
}

router.get('/paket/:id/audit-penerimaan-capabilities', (_req, res) => {
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ data: { enabled: enabled(), reason: enabled() ? null : 'RPC audit dan penerimaan belum diaktifkan di server.' } });
});

/** Active stage of every package the caller may read, in one call (dashboard and package list). */
router.get('/paket-tahap', async (_req, res) => {
  requireEnabled();
  await rpc(res, 'baca_tahap_paket_saya', {});
});

router.get('/paket/:id/progres-akhir', async (req, res) => {
  requireEnabled();
  await rpc(res, 'baca_progres_tahap_akhir', { p_paket_id: parse(paketIdSchema, req.params.id, 'ID paket') });
});

router.get('/paket/:id/upload-sistem', async (req, res) => {
  requireEnabled();
  await rpc(res, 'daftar_upload_sistem', { p_paket_id: parse(paketIdSchema, req.params.id, 'ID paket') });
});

router.post('/paket/:id/upload-sistem', denyAdminWorkflowWrites, async (req, res) => {
  requireEnabled();
  requireRole(res, 'penyedia_jasa', 'Hanya Penyedia Jasa boleh mencatat upload ke sistem');
  const packageId = parse(paketIdSchema, req.params.id, 'ID paket');
  const body = parse(uploadSistemSchema, req.body, 'Data upload');
  await rpc(res, 'catat_upload_sistem', { p_paket_id: packageId, p_data: body }, 201);
});

router.get('/paket/:id/audit', async (req, res) => {
  requireEnabled();
  await rpc(res, 'baca_audit', { p_paket_id: parse(paketIdSchema, req.params.id, 'ID paket') });
});

router.put('/paket/:id/audit/:tingkat', denyAdminWorkflowWrites, async (req, res) => {
  requireEnabled();
  const packageId = parse(paketIdSchema, req.params.id, 'ID paket');
  const level = parse(auditLevelSchema, req.params.tingkat, 'Tingkat audit');
  requireRole(res, AUDIT_OWNER[level].role, `Audit tingkat ${level} hanya untuk ${AUDIT_OWNER[level].label}`);
  const { expected_version, ...data } = parse(auditSaveSchema, req.body, 'Data audit');
  await rpc(res, 'simpan_audit', { p_paket_id: packageId, p_tingkat: level, p_expected_version: expected_version, p_data: data });
});

router.post('/paket/:id/audit/:tingkat/keputusan', denyAdminWorkflowWrites, async (req, res) => {
  requireEnabled();
  const packageId = parse(paketIdSchema, req.params.id, 'ID paket');
  const level = parse(auditLevelSchema, req.params.tingkat, 'Tingkat audit');
  requireRole(res, AUDIT_OWNER[level].role, `Audit tingkat ${level} hanya untuk ${AUDIT_OWNER[level].label}`);
  const body = parse(auditDecisionSchema, req.body, 'Keputusan audit');
  await rpc(res, 'putuskan_audit', { p_paket_id: packageId, p_tingkat: level, p_expected_version: body.expected_version, p_keputusan: body.keputusan, p_catatan: body.catatan });
});

router.get('/paket/:id/penerimaan', async (req, res) => {
  requireEnabled();
  await rpc(res, 'baca_penerimaan', { p_paket_id: parse(paketIdSchema, req.params.id, 'ID paket') });
});

router.post('/paket/:id/penerimaan/:termin', denyAdminWorkflowWrites, async (req, res) => {
  requireEnabled();
  requireRole(res, 'pic_balai', 'Hanya PIC Balai boleh mencatat penerimaan data');
  const packageId = parse(paketIdSchema, req.params.id, 'ID paket');
  const term = parse(terminNumberSchema, req.params.termin, 'Nomor termin');
  const { expected_version, ...data } = parse(penerimaanSchema, req.body, 'Data penerimaan');
  await rpc(res, 'catat_penerimaan', { p_paket_id: packageId, p_termin: term, p_expected_version: expected_version, p_data: data }, 201);
});

export default router;
