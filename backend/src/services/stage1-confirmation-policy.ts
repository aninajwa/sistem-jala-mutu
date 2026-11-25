import { ApiError, supabaseFetch } from './supabase';

export type Stage1ConfirmationIdentity = { roles: Array<{ nama: string }> };
export type Stage1ConfirmationActivation = {
  enabled?: string;
  approved?: string;
  authorizationInstalled?: string;
};

export const stage1ConfirmationEnabled = (config: Stage1ConfirmationActivation = {
  enabled: process.env.STAGE1_PIC_CONFIRMATION_ENABLED,
  approved: process.env.STAGE1_PIC_CONFIRMATION_APPROVED,
  authorizationInstalled: process.env.STAGE1_PIC_CONFIRMATION_AUTHORIZATION_INSTALLED,
}) => config.enabled === 'true' && config.approved === 'true' && config.authorizationInstalled === 'true';

export function assertStage1ConfirmationEnabled(config?: Stage1ConfirmationActivation) {
  if (!stage1ConfirmationEnabled(config)) {
    throw new ApiError(503, 'Konfirmasi PIC Kalibrasi Tahap 1 belum diaktifkan; persetujuan instalasi dan verifikasi scope database diperlukan.');
  }
}

export function assertStage1ConfirmationProvider(identity: Stage1ConfirmationIdentity) {
  if (!identity.roles.some(role => role.nama === 'penyedia_jasa')) {
    throw new ApiError(403, 'Hanya Penyedia Jasa boleh meminta konfirmasi kalibrasi Tahap 1.');
  }
}

export function assertStage1ConfirmationPic(identity: Stage1ConfirmationIdentity) {
  if (!identity.roles.some(role => role.nama === 'pic_balai')) {
    throw new ApiError(403, 'Hanya PIC Balai boleh memutuskan konfirmasi kalibrasi Tahap 1.');
  }
}

export type Stage1ConfirmationGate = {
  paket_id: number;
  status: string;
  versi: number;
  snapshot_saat_ini: unknown;
  pengajuan: { versi: number; snapshot: unknown } | null;
  review: { keputusan: string; catatan: string | null } | null;
  snapshot_sesuai: boolean;
  stage2_allowed: boolean;
};

export function parseStage1ConfirmationRpcJson(body: string): unknown {
  const exactBigints = body.replace(/("audit_id"\s*:\s*)(-?\d+)(?=\s*[,}])/g, (_match, key: string, digits: string) => `${key}"${digits}"`);
  try {
    return JSON.parse(exactBigints) as unknown;
  } catch {
    throw new ApiError(502, 'Respons RPC konfirmasi kalibrasi Tahap 1 bukan JSON yang sah.');
  }
}

export async function stage1ConfirmationRpc<T>(path: string, token: string, init: RequestInit = {}) {
  const response = await supabaseFetch(path, token, init);
  return parseStage1ConfirmationRpcJson(await response.text()) as T;
}

export async function readStage1ConfirmationGate(packageId: number, token: string) {
  assertStage1ConfirmationEnabled();
  const gate = await stage1ConfirmationRpc<Stage1ConfirmationGate>(
    '/rest/v1/rpc/baca_konfirmasi_kalibrasi_tahap1',
    token,
    { method: 'POST', body: JSON.stringify({ p_paket_id: packageId }) },
  );
  if (!gate || typeof gate !== 'object' || Array.isArray(gate) || gate.paket_id !== packageId ||
    !['BELUM_DIAJUKAN', 'DIAJUKAN', 'PERLU_REVISI', 'DISETUJUI'].includes(gate.status) ||
    !Number.isSafeInteger(gate.versi) || typeof gate.snapshot_sesuai !== 'boolean' ||
    typeof gate.stage2_allowed !== 'boolean' || !('snapshot_saat_ini' in gate) ||
    !(gate.pengajuan === null || (typeof gate.pengajuan === 'object' && gate.pengajuan !== null && 'snapshot' in gate.pengajuan))) {
    throw new ApiError(502, 'Status konfirmasi kalibrasi Tahap 1 tidak sesuai kontrak; akses Tahap 2 ditahan.');
  }
  return gate;
}

export async function assertStage2PicConfirmation(packageId: number, token: string) {
  const gate = await readStage1ConfirmationGate(packageId, token);
  if (!gate.stage2_allowed || gate.status !== 'DISETUJUI' || !gate.snapshot_sesuai) {
    throw new ApiError(409, 'Tahap 2 terkunci: konfirmasi kesesuaian kalibrasi PIC Balai belum berlaku untuk rekod Stage 1 terkini.');
  }
  return gate;
}
