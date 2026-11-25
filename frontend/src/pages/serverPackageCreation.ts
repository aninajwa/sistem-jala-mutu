import { apiRequest } from '../auth/client';
import type { WorkflowRole } from '../workflow/model';
import { normalizeSurveyIds, parseDeclaredPackageSurveyScope, type DeclaredPackageSurveyScope } from '../workflow/declaredPackageSurveyScope';

export type CreatedServerPackage = { paket_id: number; nama_paket: string; status: 'DRAFT'; declared_survey_scope: DeclaredPackageSurveyScope };
export type CreateServerPackageInput = {
  nama_paket: string;
  nomor_kontrak: string;
  tahun_anggaran: number;
  balai_id: number;
  jenis_survei_ids: number[];
};
type PackageRequest = <T>(path: string, init?: RequestInit) => Promise<T>;

export function canCreateServerPackage(role: WorkflowRole): boolean {
  return role === 'Penyedia Jasa / Ketua Tim';
}

/** POST only when explicitly called by the form submit handler; return server-confirmed data. */
export async function createServerPackage(
  input: CreateServerPackageInput,
  request: PackageRequest = apiRequest,
): Promise<CreatedServerPackage> {
  const surveyIds = normalizeSurveyIds(input.jenis_survei_ids);
  if (!surveyIds.length) throw new Error('Pilih sedikitnya satu jenis survei.');
  const result = await request<{ data: Partial<CreatedServerPackage> }>('/paket', {
    method: 'POST',
    body: JSON.stringify({ ...input, jenis_survei_ids: surveyIds }),
  });
  const item = result?.data;
  if (!item || !Number.isSafeInteger(item.paket_id) || (item.paket_id ?? 0) < 1 ||
      typeof item.nama_paket !== 'string' || item.status !== 'DRAFT') {
    throw new Error('Respons pembuatan paket tidak sesuai kontrak server.');
  }
  const createdScope = parseDeclaredPackageSurveyScope(item.declared_survey_scope, item.paket_id!);
  if (createdScope.state !== 'defined' || createdScope.surveys.map(survey => survey.jenis_survei_id).join(',') !== surveyIds.join(',')) {
    throw new Error('Respons pembuatan paket tidak mencakup pilihan scope yang dikirim.');
  }
  const readback = await request<{ data: unknown }>(`/paket/${item.paket_id}/declared-survey-scope`, { cache: 'no-store' });
  const scope = parseDeclaredPackageSurveyScope(readback.data, item.paket_id!);
  if (scope.state !== 'defined' || scope.surveys.map(survey => survey.jenis_survei_id).join(',') !== surveyIds.join(',')) {
    throw new Error('Readback scope setelah pembuatan paket tidak sama dengan pilihan.');
  }
  return { ...item, declared_survey_scope: scope } as CreatedServerPackage;
}
