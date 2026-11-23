import { z } from 'zod';
import { ApiError, supabaseRequest } from './supabase';
import {
  readDeclaredSurveyScopes,
  type DeclaredSurveyScope,
} from './package-declared-survey-scope';

const trialSchema = z.object({
  paket_id: z.number().int().positive(),
  uji_coba_id: z.number().int().positive(),
  jenis_survei_id: z.number().int().positive(),
  status: z.enum(['DRAFT', 'DIAJUKAN', 'PERLU_REVISI', 'DISETUJUI']),
}).passthrough();

export type Stage2PackageCompletion = {
  paket_id: number;
  state: 'complete' | 'partial' | 'unavailable';
  approved_count: number | null;
  total_count: number | null;
  pending_surveys: Array<{ jenis_survei_id: number; kode: string | null; nama: string | null }> | null;
  reason: 'DECLARED_SCOPE_UNSET' | 'DECLARED_SCOPE_EMPTY' | null;
  label: string;
};

export function calculateStage2PackageCompletion(
  packageId: number,
  scope: DeclaredSurveyScope,
  rawTrials: unknown,
): Stage2PackageCompletion {
  if (scope.paket_id !== packageId) {
    throw new ApiError(502, 'Scope rasmi Tahap 2 tidak sepadan dengan paket.');
  }
  if (!Array.isArray(rawTrials)) {
    throw new ApiError(502, 'Senarai keputusan Uji Coba Tahap 2 tidak sesuai kontrak.');
  }
  const trials = rawTrials.map(row => {
    const parsed = trialSchema.safeParse(row);
    if (!parsed.success || parsed.data.paket_id !== packageId) {
      throw new ApiError(502, 'Keputusan Uji Coba Tahap 2 tidak lengkap atau tidak sepadan dengan paket.');
    }
    return parsed.data;
  });

  if (scope.state === 'unset') {
    return {
      paket_id: packageId,
      state: 'unavailable',
      approved_count: null,
      total_count: null,
      pending_surveys: null,
      reason: 'DECLARED_SCOPE_UNSET',
      label: 'Belum tersedia · skop survei rasmi belum ditetapkan',
    };
  }
  const declaredSurveys = [...new Map(
    scope.surveys.map(survey => [survey.jenis_survei_id, survey]),
  ).values()];
  if (!declaredSurveys.length) {
    return {
      paket_id: packageId,
      state: 'unavailable',
      approved_count: 0,
      total_count: 0,
      pending_surveys: [],
      reason: 'DECLARED_SCOPE_EMPTY',
      label: 'Belum tersedia · skop survei rasmi kosong',
    };
  }

  const approvedSurveyIds = new Set(
    trials
      .filter(trial => trial.status === 'DISETUJUI')
      .map(trial => trial.jenis_survei_id),
  );
  const pendingSurveys = declaredSurveys
    .filter(survey => !approvedSurveyIds.has(survey.jenis_survei_id))
    .map(({ jenis_survei_id, kode, nama }) => ({ jenis_survei_id, kode, nama }));
  const approvedCount = declaredSurveys.length - pendingSurveys.length;

  if (!pendingSurveys.length) {
    return {
      paket_id: packageId,
      state: 'complete',
      approved_count: approvedCount,
      total_count: declaredSurveys.length,
      pending_surveys: [],
      reason: null,
      label: `Selesai · ${approvedCount}/${declaredSurveys.length} jenis survei`,
    };
  }

  const pendingLabels = pendingSurveys.map(survey =>
    survey.kode || survey.nama || `Jenis survei #${survey.jenis_survei_id}`);
  return {
    paket_id: packageId,
    state: 'partial',
    approved_count: approvedCount,
    total_count: declaredSurveys.length,
    pending_surveys: pendingSurveys,
    reason: null,
    label: `${approvedCount}/${declaredSurveys.length} jenis survei disetujui · Menunggu ${pendingLabels.join(', ')}`,
  };
}

type Stage2Request = <T>(path: string, token: string, init?: RequestInit) => Promise<T>;
type DeclaredScopeReader = typeof readDeclaredSurveyScopes;

export async function readStage2PackageCompletion(
  packageId: number,
  token: string,
  request: Stage2Request = supabaseRequest,
  readScopes: DeclaredScopeReader = readDeclaredSurveyScopes,
): Promise<Stage2PackageCompletion> {
  const [scopes, rawTrials] = await Promise.all([
    readScopes([packageId], token, request),
    request<unknown>('/rest/v1/rpc/ambil_senarai_uji_coba', token, {
      method: 'POST',
      body: JSON.stringify({ p_paket_id: packageId }),
    }),
  ]);
  if (scopes.length !== 1) {
    throw new ApiError(502, 'Skop survei rasmi Tahap 2 tidak tersedia untuk paket.');
  }
  return calculateStage2PackageCompletion(packageId, scopes[0], rawTrials);
}
