export type PackageSurveyScopeStatus = 'loading' | 'error' | 'undefined' | 'defined';

export type PackageScopeSurvey = {
  jenis_survei_id: number;
  kode: string | null;
  nama: string | null;
  aktif: boolean | null;
};

export type PackageSurveyScopeRead = {
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
    surveys: PackageScopeSurvey[];
    associations: Array<{
      lokasi_id: number;
      jenis_survei_id: number | null;
      survey: PackageScopeSurvey | null;
    }>;
  };
};

export type PackageSurveyScopeCardResult =
  | { status: 'defined'; scope: PackageSurveyScopeRead }
  | { status: 'error' };

type ScopeRequest = (path: string) => Promise<{ data: unknown }>;

/**
 * Read independently per package: package-list visibility may be broader than
 * location-association visibility. One denied RPC must not fail sibling cards.
 * A bounded worker pool avoids turning a page of packages into 50 concurrent
 * requests while preserving per-package authorization boundaries.
 */
export async function readPackageSurveyScopesForCards(
  packageIds: readonly number[],
  request: ScopeRequest,
  concurrency = 5,
): Promise<Map<number, PackageSurveyScopeCardResult>> {
  const ids = [...new Set(packageIds)];
  if (!Number.isSafeInteger(concurrency) || concurrency < 1) {
    throw new Error('Batas pembacaan scope paket tidak valid.');
  }
  const results = new Map<number, PackageSurveyScopeCardResult>();
  let cursor = 0;
  const worker = async () => {
    while (cursor < ids.length) {
      const id = ids[cursor++];
      try {
        const response = await request(
          `/paket/survey-scope?paket_ids=${encodeURIComponent(String(id))}`,
        );
        const scope = parsePackageSurveyScopeBatch(response.data, [id]).get(id);
        if (!scope) throw new Error('Scope response missing package');
        results.set(id, { status: 'defined', scope });
      } catch {
        results.set(id, { status: 'error' });
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) }, worker));
  return results;
}

export function packageSurveyScopeMessage(
  status?: PackageSurveyScopeStatus,
  associationCount = 0,
  unresolvedAssociationCount = 0,
): string {
  switch (status) {
    case 'loading': return 'Memuat cakupan survei…';
    case 'error': return 'Cakupan survei gagal dimuat';
    case 'defined':
      if (associationCount === 0) return 'Survei pada lokasi belum ditetapkan';
      if (unresolvedAssociationCount > 0) return 'Ada asosiasi lokasi yang belum memiliki jenis survei';
      return 'Asosiasi lokasi teramati; scope kontrak tidak tersimpan';
    case 'undefined':
    default: return 'Cakupan survei belum tersedia dari kontrak baca server';
  }
}

export function parsePackageSurveyScopeBatch(
  value: unknown,
  requestedPackageIds: readonly number[],
): Map<number, PackageSurveyScopeRead> {
  if (!Array.isArray(value)) throw new Error('Format respons scope survei paket tidak sesuai.');
  const byId = new Map<number, PackageSurveyScopeRead>();
  for (const item of value) {
    if (!item || typeof item !== 'object') throw new Error('Format respons scope survei paket tidak sesuai.');
    const row = item as PackageSurveyScopeRead;
    const observed = row.observed_location_associations;
    if (!Number.isSafeInteger(row.paket_id) || !requestedPackageIds.includes(row.paket_id) ||
        row.availability !== 'available' ||
        row.declared_contract_scope?.availability !== 'not_stored' ||
        row.declared_contract_scope?.source !== 'paket_kontrak' ||
        observed?.availability !== 'available' || observed.source !== 'lokasi_pekerjaan' ||
        !['observed', 'none_observed'].includes(observed.observation_state) ||
        !Number.isSafeInteger(observed.association_count) || observed.association_count < 0 ||
        !Number.isSafeInteger(observed.unresolved_association_count) || observed.unresolved_association_count < 0 ||
        !Array.isArray(observed.surveys) || !Array.isArray(observed.associations) ||
        observed.association_count !== observed.associations.length ||
        observed.unresolved_association_count !== observed.associations.filter(association =>
          association?.jenis_survei_id === null || association?.survey === null).length ||
        (observed.association_count === 0) !== (observed.observation_state === 'none_observed') ||
        observed.surveys.some(survey => !Number.isSafeInteger(survey?.jenis_survei_id) ||
          !(survey.kode === null || typeof survey.kode === 'string') ||
          !(survey.nama === null || typeof survey.nama === 'string') ||
          !(survey.aktif === null || typeof survey.aktif === 'boolean')) ||
        observed.associations.some(association =>
          !association || !Number.isSafeInteger(association.lokasi_id) ||
          !(association.jenis_survei_id === null || Number.isSafeInteger(association.jenis_survei_id)) ||
          !(association.survey === null ||
            (Number.isSafeInteger(association.survey.jenis_survei_id) &&
              association.survey.jenis_survei_id === association.jenis_survei_id &&
              (association.survey.kode === null || typeof association.survey.kode === 'string') &&
              (association.survey.nama === null || typeof association.survey.nama === 'string') &&
              (association.survey.aktif === null || typeof association.survey.aktif === 'boolean'))))) {
      throw new Error('Respons scope survei paket tidak lengkap atau tidak sesuai.');
    }
    if (byId.has(row.paket_id)) throw new Error('Respons scope survei paket berisi ID duplikat.');
    // Preserve every referenced catalog ID, including inactive/unmapped surveys.
    const seen = new Set<number>();
    const surveys = [...observed.surveys]
      .sort((a, b) => a.jenis_survei_id - b.jenis_survei_id)
      .filter(survey => !seen.has(survey.jenis_survei_id) && !!seen.add(survey.jenis_survei_id));
    byId.set(row.paket_id, { ...row, observed_location_associations: { ...observed, surveys } });
  }
  if (byId.size !== requestedPackageIds.length) {
    throw new Error('Respons scope survei tidak mencakup semua paket yang diminta.');
  }
  return byId;
}
