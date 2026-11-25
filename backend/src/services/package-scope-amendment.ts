import { z } from 'zod';
import { ApiError, supabaseRequest } from './supabase';
import {
  packageScopeAmendmentReviewSchema,
  packageScopeAmendmentSubmitSchema,
} from '../schemas/package-scope-amendment';
import { declaredSurveySchema } from './package-declared-survey-scope';

const snapshotSurveySchema = declaredSurveySchema;

const amendmentSchema = z.object({
  pindaan_id: z.number().int().positive(),
  versi: z.number().int().positive(),
  expected_scope_version: z.number().int().positive(),
  status: z.enum(['DIAJUKAN', 'DISETUJUI', 'DITOLAK']),
  skop_asal: z.array(snapshotSurveySchema),
  tambahan_diminta: z.array(snapshotSurveySchema),
  diajukan_oleh: z.number().int().positive(),
  diajukan_pada: z.string().min(1),
  direview_oleh: z.number().int().positive().nullable(),
  direview_pada: z.string().min(1).nullable(),
  catatan_pic: z.string().nullable(),
  versi_skop_diluluskan: z.number().int().positive().nullable(),
}).strict();

const stateSchema = z.object({
  paket_id: z.number().int().positive(),
  scope_efektif: z.object({
    state: z.enum(['unset', 'defined']),
    version: z.number().int().positive().nullable(),
    surveys: z.array(snapshotSurveySchema),
  }).strict(),
  pindaan: z.array(amendmentSchema),
}).strict();

export type PackageScopeAmendment = z.infer<typeof amendmentSchema>;
export type PackageScopeAmendmentState = z.infer<typeof stateSchema>;
type RpcRequest = <T>(path: string, token: string, init?: RequestInit) => Promise<T>;

function parseState(value: unknown, packageId: number): PackageScopeAmendmentState {
  const parsed = stateSchema.safeParse(value);
  if (!parsed.success || parsed.data.paket_id !== packageId ||
      (parsed.data.scope_efektif.state === 'unset' &&
        (parsed.data.scope_efektif.version !== null || parsed.data.scope_efektif.surveys.length !== 0)) ||
      (parsed.data.scope_efektif.state === 'defined' &&
        (parsed.data.scope_efektif.version === null || parsed.data.scope_efektif.surveys.length === 0)) ||
      parsed.data.pindaan.some(item => item.status === 'DIAJUKAN'
        ? item.direview_oleh !== null || item.direview_pada !== null || item.versi_skop_diluluskan !== null
        : item.direview_oleh === null || item.direview_pada === null ||
          (item.status === 'DISETUJUI' ? item.versi_skop_diluluskan === null : item.versi_skop_diluluskan !== null))) {
    throw new ApiError(502, 'Respons pindaan scope survei tidak lengkap atau tidak konsisten.');
  }
  const pending = parsed.data.pindaan.filter(item => item.status === 'DIAJUKAN');
  if (pending.length > 1) throw new ApiError(502, 'Lebih daripada satu pindaan scope masih menunggu keputusan.');
  return parsed.data;
}

export async function readPackageScopeAmendmentState(
  packageId: number,
  token: string,
  request: RpcRequest = supabaseRequest,
): Promise<PackageScopeAmendmentState> {
  const value = await request<unknown>('/rest/v1/rpc/baca_pindaan_scope_survei', token, {
    method: 'POST',
    body: JSON.stringify({ p_paket_id: packageId }),
  });
  return parseState(value, packageId);
}

export async function submitPackageScopeAmendment(
  packageId: number,
  input: unknown,
  token: string,
  request: RpcRequest = supabaseRequest,
): Promise<PackageScopeAmendmentState> {
  const parsed = packageScopeAmendmentSubmitSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(400, 'Permohonan penambahan jenis survei tidak valid.');
  await request<unknown>('/rest/v1/rpc/ajukan_pindaan_scope_survei', token, {
    method: 'POST',
    body: JSON.stringify({
      p_paket_id: packageId,
      p_expected_scope_version: parsed.data.expected_scope_version,
      p_jenis_survei_ids: parsed.data.jenis_survei_ids,
    }),
  });
  const state = await readPackageScopeAmendmentState(packageId, token, request);
  const latest = state.pindaan[0];
  if (!latest ||
      latest.expected_scope_version !== parsed.data.expected_scope_version ||
      latest.tambahan_diminta.map(item => item.jenis_survei_id).sort((a, b) => a - b)
        .join(',') !== parsed.data.jenis_survei_ids.join(',')) {
    throw new ApiError(502, 'Readback permohonan scope tidak sepadan dengan pilihan yang dihantar.');
  }
  return state;
}

export async function reviewPackageScopeAmendment(
  packageId: number,
  amendmentId: number,
  input: unknown,
  token: string,
  request: RpcRequest = supabaseRequest,
): Promise<PackageScopeAmendmentState> {
  const parsed = packageScopeAmendmentReviewSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(400, 'Keputusan pindaan scope tidak valid.');
  await request<unknown>('/rest/v1/rpc/review_pindaan_scope_survei', token, {
    method: 'POST',
    body: JSON.stringify({
      p_paket_id: packageId,
      p_pindaan_id: amendmentId,
      p_expected_version: parsed.data.expected_version,
      p_keputusan: parsed.data.keputusan,
      p_catatan: parsed.data.catatan ?? null,
    }),
  });
  const state = await readPackageScopeAmendmentState(packageId, token, request);
  const reviewed = state.pindaan.find(item => item.pindaan_id === amendmentId);
  if (!reviewed || reviewed.status !== parsed.data.keputusan ||
      reviewed.versi !== parsed.data.expected_version + 1 ||
      (parsed.data.keputusan === 'DISETUJUI' &&
        state.scope_efektif.version !== reviewed.versi_skop_diluluskan)) {
    throw new ApiError(502, 'Readback keputusan pindaan scope tidak sepadan dengan rekod server.');
  }
  return state;
}
