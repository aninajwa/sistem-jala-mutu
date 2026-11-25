import { ApiError } from '../auth/client';
import type { SurveyCatalogOption } from '../workflow/declaredPackageSurveyScope';

export type PackageScopeAmendment = {
  pindaan_id: number;
  versi: number;
  expected_scope_version: number;
  status: 'DIAJUKAN' | 'DISETUJUI' | 'DITOLAK';
  skop_asal: SurveyCatalogOption[];
  tambahan_diminta: SurveyCatalogOption[];
  diajukan_oleh: number;
  diajukan_pada: string;
  direview_oleh: number | null;
  direview_pada: string | null;
  catatan_pic: string | null;
  versi_skop_diluluskan: number | null;
};

export type PackageScopeAmendmentState = {
  paket_id: number;
  scope_efektif: {
    state: 'unset' | 'defined';
    version: number | null;
    surveys: SurveyCatalogOption[];
  };
  pindaan: PackageScopeAmendment[];
};

type Request = <T>(path: string, init?: RequestInit) => Promise<{ data: T }>;

function isSurvey(value: unknown): value is SurveyCatalogOption {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return Number.isSafeInteger(row.jenis_survei_id) && Number(row.jenis_survei_id) > 0 &&
    (row.kode === null || typeof row.kode === 'string') &&
    (row.nama === null || typeof row.nama === 'string') &&
    (row.aktif === null || typeof row.aktif === 'boolean') &&
    Boolean(row.kode || row.nama);
}

export function parsePackageScopeAmendmentState(value: unknown, packageId: number): PackageScopeAmendmentState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Respons pindaan scope tidak sesuai.');
  }
  const row = value as Record<string, unknown>;
  if (row.paket_id !== packageId || !row.scope_efektif || typeof row.scope_efektif !== 'object' ||
      !Array.isArray(row.pindaan)) {
    throw new Error('Respons pindaan scope tidak sepadan dengan paket aktif.');
  }
  const scope = row.scope_efektif as Record<string, unknown>;
  if (!['unset', 'defined'].includes(String(scope.state)) || !Array.isArray(scope.surveys) ||
      !(scope.version === null || (Number.isSafeInteger(scope.version) && Number(scope.version) > 0)) ||
      scope.surveys.some(item => !isSurvey(item))) {
    throw new Error('Scope efektif pada respons pindaan tidak lengkap.');
  }
  const surveys = scope.surveys as SurveyCatalogOption[];
  if ((scope.state === 'unset' && (scope.version !== null || surveys.length !== 0)) ||
      (scope.state === 'defined' && (scope.version === null || surveys.length === 0)) ||
      new Set(surveys.map(item => item.jenis_survei_id)).size !== surveys.length) {
    throw new Error('Versi dan jenis survei dalam scope efektif tidak konsisten.');
  }

  const amendments = row.pindaan.map((item): PackageScopeAmendment => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('Riwayat pindaan scope tidak sesuai.');
    }
    const amendment = item as Record<string, unknown>;
    if (!Number.isSafeInteger(amendment.pindaan_id) || Number(amendment.pindaan_id) < 1 ||
        !Number.isSafeInteger(amendment.versi) || Number(amendment.versi) < 1 ||
        !Number.isSafeInteger(amendment.expected_scope_version) || Number(amendment.expected_scope_version) < 1 ||
        !['DIAJUKAN', 'DISETUJUI', 'DITOLAK'].includes(String(amendment.status)) ||
        !Array.isArray(amendment.skop_asal) || amendment.skop_asal.some(survey => !isSurvey(survey)) ||
        !Array.isArray(amendment.tambahan_diminta) || amendment.tambahan_diminta.length === 0 ||
        amendment.tambahan_diminta.some(survey => !isSurvey(survey)) ||
        !Number.isSafeInteger(amendment.diajukan_oleh) || typeof amendment.diajukan_pada !== 'string' ||
        !(amendment.direview_oleh === null || (Number.isSafeInteger(amendment.direview_oleh) && Number(amendment.direview_oleh) > 0)) ||
        !(amendment.direview_pada === null || typeof amendment.direview_pada === 'string') ||
        !(amendment.catatan_pic === null || typeof amendment.catatan_pic === 'string') ||
        !(amendment.versi_skop_diluluskan === null ||
          (Number.isSafeInteger(amendment.versi_skop_diluluskan) && Number(amendment.versi_skop_diluluskan) > 0))) {
      throw new Error('Riwayat pindaan scope tidak lengkap.');
    }
    if (amendment.status === 'DIAJUKAN'
      ? amendment.direview_oleh !== null || amendment.direview_pada !== null || amendment.versi_skop_diluluskan !== null
      : amendment.direview_oleh === null || amendment.direview_pada === null ||
        (amendment.status === 'DISETUJUI' ? amendment.versi_skop_diluluskan === null : amendment.versi_skop_diluluskan !== null)) {
      throw new Error('Status keputusan pindaan scope tidak konsisten.');
    }
    return amendment as unknown as PackageScopeAmendment;
  });
  if (amendments.filter(item => item.status === 'DIAJUKAN').length > 1 ||
      new Set(amendments.map(item => item.pindaan_id)).size !== amendments.length) {
    throw new Error('Terdapat permohonan pindaan scope pendua.');
  }
  return {
    paket_id: packageId,
    scope_efektif: {
      state: scope.state as 'unset' | 'defined',
      version: scope.version as number | null,
      surveys,
    },
    pindaan: amendments,
  };
}

/** Server gate for scope amendments; the panel stays hidden while the migration is not installed. */
export async function getScopeAmendmentCapabilities(packageId: string, request: Request): Promise<{ enabled: boolean }> {
  const response = await request<unknown>(
    `/paket/${encodeURIComponent(packageId)}/scope-amendment-capabilities`,
    { cache: 'no-store' },
  );
  const data = (response as { data?: unknown } | null)?.data as { enabled?: unknown } | undefined;
  if (!data || typeof data.enabled !== 'boolean') throw new Error('Format kapabilitas penambahan jenis survei tidak sesuai.');
  return { enabled: data.enabled };
}

export async function getPackageScopeAmendmentState(
  packageId: string,
  request: Request,
): Promise<PackageScopeAmendmentState> {
  const id = Number(packageId);
  const response = await request<unknown>(
    `/paket/${encodeURIComponent(packageId)}/scope-amendment`,
    { cache: 'no-store' },
  );
  return parsePackageScopeAmendmentState(response.data, id);
}

export async function submitPackageScopeAmendment(
  packageId: string,
  scopeVersion: number,
  surveyIds: readonly number[],
  request: Request,
) {
  const ids = [...new Set(surveyIds)].sort((a, b) => a - b);
  if (!Number.isSafeInteger(scopeVersion) || scopeVersion < 1 || !ids.length ||
      ids.some(id => !Number.isSafeInteger(id) || id < 1)) {
    throw new Error('Versi scope atau pilihan jenis survei tidak valid.');
  }
  await request<unknown>(`/paket/${encodeURIComponent(packageId)}/scope-amendment`, {
    method: 'POST',
    body: JSON.stringify({ expected_scope_version: scopeVersion, jenis_survei_ids: ids }),
  });
  const state = await getPackageScopeAmendmentState(packageId, request);
  const pending = state.pindaan.find(item => item.status === 'DIAJUKAN');
  if (!pending || pending.expected_scope_version !== scopeVersion ||
      pending.tambahan_diminta.map(item => item.jenis_survei_id).sort((a, b) => a - b).join(',') !== ids.join(',')) {
    throw new ApiError(502, 'Bacaan ulang belum mengesahkan permohonan penambahan jenis survei.');
  }
  return state;
}

export async function reviewPackageScopeAmendment(
  packageId: string,
  amendment: PackageScopeAmendment,
  decision: 'DISETUJUI' | 'DITOLAK',
  note: string,
  request: Request,
) {
  await request<unknown>(
    `/paket/${encodeURIComponent(packageId)}/scope-amendment/${encodeURIComponent(String(amendment.pindaan_id))}/review`,
    {
      method: 'POST',
      body: JSON.stringify({
        expected_version: amendment.versi,
        keputusan: decision,
        catatan: note.trim() || null,
      }),
    },
  );
  const state = await getPackageScopeAmendmentState(packageId, request);
  const reviewed = state.pindaan.find(item => item.pindaan_id === amendment.pindaan_id);
  if (!reviewed || reviewed.status !== decision || reviewed.versi !== amendment.versi + 1 ||
      (decision === 'DISETUJUI' && state.scope_efektif.version !== reviewed.versi_skop_diluluskan)) {
    throw new ApiError(502, 'Bacaan ulang belum mengesahkan keputusan PIC terhadap pindaan scope.');
  }
  return state;
}
