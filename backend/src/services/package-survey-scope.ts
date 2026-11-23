import { ApiError, supabaseRequest } from './supabase';

export type PackageSurveyScopeRow = {
  paket_id: number;
  availability: 'available';
  declared_contract_scope: {
    availability: 'not_stored';
    source: 'paket_kontrak';
    surveys: [];
  };
  observed_location_associations: {
    availability: 'available';
    source: 'lokasi_pekerjaan';
    observation_state: 'observed' | 'none_observed';
    association_count: number;
    unresolved_association_count: number;
    surveys: Array<{
      jenis_survei_id: number;
      kode: string | null;
      nama: string | null;
      aktif: boolean | null;
    }>;
    associations: Array<{
      lokasi_id: number;
      jenis_survei_id: number | null;
      survey: {
        jenis_survei_id: number;
        kode: string | null;
        nama: string | null;
        aktif: boolean | null;
      } | null;
    }>;
  };
};

type PackageSurveyScopeRequest = <T>(
  path: string,
  token: string,
  init?: RequestInit,
) => Promise<T>;

const MAX_PACKAGE_SCOPE_READ = 50;

export function parsePackageScopeIds(value: unknown): number[] {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ApiError(400, 'paket_ids wajib berisi ID paket');
  }
  const raw = value.split(',');
  if (raw.length > MAX_PACKAGE_SCOPE_READ ||
      raw.some(item => !/^[1-9]\d*$/.test(item) || !Number.isSafeInteger(Number(item)) || Number(item) > 2147483647)) {
    throw new ApiError(400, 'paket_ids tidak valid atau melebihi 50 paket');
  }
  return [...new Set(raw.map(Number))].sort((a, b) => a - b);
}

function validSurvey(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const survey = value as Record<string, unknown>;
  return Number.isSafeInteger(survey.jenis_survei_id) &&
    (survey.kode === null || typeof survey.kode === 'string') &&
    (survey.nama === null || typeof survey.nama === 'string') &&
    (survey.aktif === null || typeof survey.aktif === 'boolean');
}

export function validatePackageSurveyScopeRows(
  value: unknown,
  requestedIds: readonly number[],
): PackageSurveyScopeRow[] {
  if (!Array.isArray(value)) throw new ApiError(502, 'Respons scope survei paket tidak sesuai.');
  const byId = new Map<number, PackageSurveyScopeRow>();
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') throw new ApiError(502, 'Respons scope survei paket tidak sesuai.');
    const row = candidate as Record<string, any>;
    const observed = row.observed_location_associations;
    if (!Number.isSafeInteger(row.paket_id) || row.availability !== 'available' ||
        row.declared_contract_scope?.availability !== 'not_stored' ||
        row.declared_contract_scope?.source !== 'paket_kontrak' ||
        observed?.availability !== 'available' || observed?.source !== 'lokasi_pekerjaan' ||
        !['observed', 'none_observed'].includes(observed.observation_state) ||
        !Number.isSafeInteger(observed.association_count) || observed.association_count < 0 ||
        !Number.isSafeInteger(observed.unresolved_association_count) || observed.unresolved_association_count < 0 ||
        !Array.isArray(observed.surveys) || !Array.isArray(observed.associations) ||
        observed.association_count !== observed.associations.length ||
        observed.unresolved_association_count !== observed.associations.filter((association: any) =>
          association?.jenis_survei_id === null || association?.survey === null).length ||
        (observed.association_count === 0) !== (observed.observation_state === 'none_observed') ||
        !observed.surveys.every(validSurvey) ||
        !observed.associations.every((association: any) =>
          association && Number.isSafeInteger(association.lokasi_id) &&
          (association.jenis_survei_id === null || Number.isSafeInteger(association.jenis_survei_id)) &&
          (association.survey === null || (validSurvey(association.survey) &&
            association.survey.jenis_survei_id === association.jenis_survei_id)))) {
      throw new ApiError(502, 'Respons scope survei paket tidak lengkap atau tidak sesuai.');
    }
    const typed = candidate as PackageSurveyScopeRow;
    if (!requestedIds.includes(typed.paket_id) || byId.has(typed.paket_id)) {
      throw new ApiError(502, 'Respons scope survei mengandung paket duplikat atau di luar permintaan.');
    }
    byId.set(typed.paket_id, typed);
  }
  if (byId.size !== requestedIds.length) {
    throw new ApiError(502, 'Respons scope survei tidak memuat semua paket yang diminta.');
  }
  return [...requestedIds].sort((a, b) => a - b).map(id => byId.get(id)!);
}

export async function readPackageSurveyScopes(
  paketIds: readonly number[],
  token: string,
  request: PackageSurveyScopeRequest = supabaseRequest,
): Promise<PackageSurveyScopeRow[]> {
  const ids = [...new Set(paketIds)].sort((a, b) => a - b);
  if (!ids.length || ids.length > MAX_PACKAGE_SCOPE_READ) {
    throw new ApiError(400, 'Permintaan scope survei paket tidak valid.');
  }

  // Check visibility using the existing user-token paket_kontrak SELECT/RLS
  // contract before calling a SECURITY DEFINER RPC.
  const visible = await request<Array<{ paket_id: number }>>(
    `/rest/v1/paket_kontrak?select=paket_id&paket_id=in.(${ids.join(',')})&limit=${MAX_PACKAGE_SCOPE_READ}`,
    token,
  );
  const visibleIds = new Set(visible.map(row => row.paket_id));
  if (visibleIds.size !== ids.length || ids.some(id => !visibleIds.has(id))) {
    throw new ApiError(404, 'Paket tidak ditemukan atau tidak boleh diakses.');
  }

  const rows = await request<unknown>(
    '/rest/v1/rpc/baca_scope_survei_paket',
    token,
    { method: 'POST', body: JSON.stringify({ p_paket_ids: ids }) },
  );
  return validatePackageSurveyScopeRows(rows, ids);
}
