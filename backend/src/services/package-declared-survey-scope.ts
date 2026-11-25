import { z } from 'zod';
import { ApiError, supabaseRequest } from './supabase';
import { paketSurveyScopePatchSchema, surveySelectionSchema } from '../schemas/paket';

export const declaredSurveySchema = z.object({
  jenis_survei_id: z.number().int().positive(),
  kode: z.string().nullable(),
  nama: z.string().nullable(),
  aktif: z.boolean().nullable(),
}).strict();

export const declaredSurveyScopeSchema = z.object({
  paket_id: z.number().int().positive(),
  state: z.enum(['unset', 'defined']),
  version: z.number().int().positive().nullable(),
  surveys: z.array(declaredSurveySchema),
}).strict().superRefine((scope, context) => {
  if ((scope.state === 'unset') !== (scope.version === null) ||
      (scope.state === 'unset') !== (scope.surveys.length === 0)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'State scope tidak konsisten.' });
  }
  if (new Set(scope.surveys.map(survey => survey.jenis_survei_id)).size !== scope.surveys.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Jenis survei duplikat.' });
  }
});

export type DeclaredSurveyScope = z.infer<typeof declaredSurveyScopeSchema>;
export type DeclaredSurvey = z.infer<typeof declaredSurveySchema>;
type SelectionRequest = <T>(path: string, token: string, init?: RequestInit) => Promise<T>;

const MAX_IDS = 50;
export function parseDeclaredScopePackageIds(value: unknown): number[] {
  if (typeof value !== 'string' || !value.length) throw new ApiError(400, 'paket_ids wajib berisi ID paket');
  const raw = value.split(',');
  if (raw.length > MAX_IDS || raw.some(id => !/^[1-9]\d*$/.test(id) ||
      !Number.isSafeInteger(Number(id)) || Number(id) > 2147483647)) {
    throw new ApiError(400, 'paket_ids tidak valid atau melebihi 50 paket');
  }
  return [...new Set(raw.map(Number))].sort((a, b) => a - b);
}

export function validateDeclaredSurveyScope(value: unknown, requestedIds: readonly number[]): DeclaredSurveyScope[] {
  if (!Array.isArray(value)) throw new ApiError(502, 'Respons scope kontrak paket tidak sesuai.');
  const result = value.map(row => {
    const parsed = declaredSurveyScopeSchema.safeParse(row);
    if (!parsed.success) throw new ApiError(502, 'Respons scope kontrak paket tidak lengkap atau tidak konsisten.');
    return parsed.data;
  });
  const ids = result.map(row => row.paket_id);
  if (new Set(ids).size !== ids.length || ids.length !== requestedIds.length ||
      requestedIds.some(id => !ids.includes(id)) ||
      result.some(row => row.surveys.some(survey => !survey.kode && !survey.nama))) {
    throw new ApiError(502, 'Respons scope kontrak paket tidak mencakup semua ID dengan label katalog.');
  }
  return result.sort((a, b) => a.paket_id - b.paket_id);
}

export async function readDeclaredSurveyScopes(
  packageIds: readonly number[],
  token: string,
  request: SelectionRequest = supabaseRequest,
): Promise<DeclaredSurveyScope[]> {
  const ids = [...new Set(packageIds)].sort((a, b) => a - b);
  if (!ids.length || ids.length > MAX_IDS) throw new ApiError(400, 'Permintaan scope kontrak tidak valid.');
  const rows = await request<unknown>('/rest/v1/rpc/baca_scope_survei_kontrak', token, {
    method: 'POST', body: JSON.stringify({ p_paket_ids: ids }),
  });
  return validateDeclaredSurveyScope(rows, ids);
}

export async function saveDeclaredSurveyScope(
  packageId: number,
  input: unknown,
  token: string,
  request: SelectionRequest = supabaseRequest,
): Promise<DeclaredSurveyScope> {
  const parsed = paketSurveyScopePatchSchema.safeParse(input);
  if (!parsed.success) throw new ApiError(400, 'Perubahan scope survei tidak valid.');
  const result = await request<unknown>('/rest/v1/rpc/simpan_scope_survei_kontrak', token, {
    method: 'POST',
    body: JSON.stringify({
      p_paket_id: packageId,
      p_expected_version: parsed.data.expected_version,
      p_jenis_survei_ids: parsed.data.jenis_survei_ids,
    }),
  });
  const scope = declaredSurveyScopeSchema.safeParse(result);
  if (!scope.success || scope.data.paket_id !== packageId ||
      scope.data.state !== 'defined' ||
      scope.data.surveys.map(survey => survey.jenis_survei_id).sort((a, b) => a - b)
        .join(',') !== parsed.data.jenis_survei_ids.join(',')) {
    throw new ApiError(502, 'Readback scope kontrak tidak sama dengan pilihan yang disimpan.');
  }
  return scope.data;
}

export function validateDeclaredSurveySelection(value: unknown): number[] {
  const parsed = surveySelectionSchema.safeParse(value);
  if (!parsed.success) throw new ApiError(400, 'Pilih sedikitnya satu jenis survei yang valid.');
  return parsed.data;
}
