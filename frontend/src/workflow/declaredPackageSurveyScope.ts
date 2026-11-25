export type SurveyCatalogOption = {
  jenis_survei_id: number;
  kode: string | null;
  nama: string | null;
  aktif: boolean | null;
};

export type DeclaredPackageSurveyScope = {
  paket_id: number;
  state: 'unset' | 'defined';
  version: number | null;
  surveys: SurveyCatalogOption[];
};

export function declaredPackageSurveyScopeMessage(
  scopeState: DeclaredPackageSurveyScope['state'] | 'not_stored' | undefined,
  readStatus?: 'loading' | 'error',
): string {
  if (readStatus === 'loading') return 'Memuat scope kontrak…';
  if (readStatus === 'error') return 'Scope kontrak tidak dapat dibaca';
  if (scopeState === 'defined') return 'Jenis survei terpilih belum dikenali UI';
  return scopeState === 'not_stored' ? 'Scope kontrak belum tersedia pada versi server ini' : 'Scope kontrak belum ditetapkan';
}

type Request = (path: string, init?: RequestInit) => Promise<{ data: unknown }>;

export function normalizeSurveyIds(value: readonly number[]): number[] {
  if (!Array.isArray(value) || value.some(id => !Number.isSafeInteger(id) || id < 1 || id > 2147483647)) {
    throw new Error('Pilihan jenis survei tidak valid.');
  }
  return [...new Set(value)].sort((a, b) => a - b);
}

export function parseDeclaredPackageSurveyScope(value: unknown, packageId: number): DeclaredPackageSurveyScope {
  if (!value || typeof value !== 'object') throw new Error('Respons scope kontrak tidak sesuai.');
  const row = value as Record<string, unknown>;
  if (row.paket_id !== packageId || !['unset', 'defined'].includes(String(row.state)) ||
      !(row.version === null || (Number.isSafeInteger(row.version) && Number(row.version) > 0)) ||
      !Array.isArray(row.surveys)) {
    throw new Error('Respons scope kontrak tidak lengkap.');
  }
  const surveys = row.surveys.map(item => {
    if (!item || typeof item !== 'object') throw new Error('Katalog survei pada scope tidak sesuai.');
    const survey = item as Record<string, unknown>;
    if (!Number.isSafeInteger(survey.jenis_survei_id) || Number(survey.jenis_survei_id) < 1 ||
        !(survey.kode === null || typeof survey.kode === 'string') ||
        !(survey.nama === null || typeof survey.nama === 'string') ||
        !(survey.aktif === null || typeof survey.aktif === 'boolean') ||
        (!survey.kode && !survey.nama)) throw new Error('Label jenis survei tidak tersedia.');
    return survey as unknown as SurveyCatalogOption;
  }).sort((a, b) => a.jenis_survei_id - b.jenis_survei_id);
  const ids = surveys.map(item => item.jenis_survei_id);
  if (new Set(ids).size !== ids.length ||
      (row.state === 'unset' && (row.version !== null || surveys.length !== 0)) ||
      (row.state === 'defined' && (!Number.isSafeInteger(row.version) || surveys.length === 0))) {
    throw new Error('State scope kontrak tidak konsisten.');
  }
  return { paket_id: packageId, state: row.state as DeclaredPackageSurveyScope['state'], version: row.version as number | null, surveys };
}

export function parseDeclaredPackageSurveyScopeBatch(value: unknown, requestedIds: readonly number[]): Map<number, DeclaredPackageSurveyScope> {
  if (!Array.isArray(value)) throw new Error('Respons daftar scope kontrak tidak sesuai.');
  const requested = [...new Set(requestedIds)].sort((a, b) => a - b);
  const rows = value.map(row => {
    if (!row || typeof row !== 'object' || !Number.isSafeInteger((row as Record<string, unknown>).paket_id)) {
      throw new Error('Respons daftar scope kontrak tidak sesuai.');
    }
    const id = Number((row as Record<string, unknown>).paket_id);
    if (!requested.includes(id)) throw new Error('Respons memuat paket di luar permintaan.');
    return parseDeclaredPackageSurveyScope(row, id);
  });
  const result = new Map(rows.map(row => [row.paket_id, row]));
  if (result.size !== requested.length || requested.some(id => !result.has(id))) {
    throw new Error('Respons scope kontrak tidak mencakup semua paket.');
  }
  return result;
}

export async function readDeclaredPackageSurveyScopes(
  ids: readonly number[],
  request: Request,
): Promise<Map<number, DeclaredPackageSurveyScope | null>> {
  const packageIds = [...new Set(ids)].sort((a, b) => a - b);
  if (!packageIds.length || packageIds.length > 50) throw new Error('Jumlah paket untuk scope tidak valid.');
  const result = new Map<number, DeclaredPackageSurveyScope | null>();
  let cursor = 0;
  const worker = async () => {
    while (cursor < packageIds.length) {
      const id = packageIds[cursor++];
      try {
        const response = await request(`/paket/declared-survey-scope?paket_ids=${encodeURIComponent(String(id))}`);
        result.set(id, parseDeclaredPackageSurveyScopeBatch(response.data, [id]).get(id)!);
      } catch {
        result.set(id, null);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(5, packageIds.length) }, worker));
  return result;
}

export async function saveDeclaredPackageSurveyScope(
  packageId: number,
  expectedVersion: number,
  surveyIds: readonly number[],
  request: Request,
): Promise<DeclaredPackageSurveyScope> {
  const ids = normalizeSurveyIds(surveyIds);
  if (!ids.length) throw new Error('Pilih sedikitnya satu jenis survei.');
  await request(`/paket/${encodeURIComponent(String(packageId))}/survey-scope`, {
    method: 'PUT',
    body: JSON.stringify({ expected_version: expectedVersion, jenis_survei_ids: ids }),
  });
  const readback = await request(
    `/paket/${encodeURIComponent(String(packageId))}/declared-survey-scope`,
    { cache: 'no-store' },
  );
  const scope = parseDeclaredPackageSurveyScope(readback.data, packageId);
  if (scope.state !== 'defined' || scope.version === null ||
      scope.surveys.map(item => item.jenis_survei_id).join(',') !== ids.join(',')) {
    throw new Error('Readback scope survei tidak sama dengan pilihan. Pilihan lokal tetap dipertahankan.');
  }
  return scope;
}
