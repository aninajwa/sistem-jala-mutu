import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from './supabase';
import {
  parsePackageScopeIds,
  readPackageSurveyScopes,
  validatePackageSurveyScopeRows,
  type PackageSurveyScopeRow,
} from './package-survey-scope';

const scope = (paket_id: number): PackageSurveyScopeRow => ({
  paket_id,
  availability: 'available',
  declared_contract_scope: { availability: 'not_stored', source: 'paket_kontrak', surveys: [] },
  observed_location_associations: {
    availability: 'available',
    source: 'lokasi_pekerjaan',
    observation_state: 'observed',
    association_count: 2,
    unresolved_association_count: 0,
    surveys: [{ jenis_survei_id: 9, kode: 'LEGACY', nama: 'Legacy inactive survey', aktif: false }],
    associations: [
      { lokasi_id: 10, jenis_survei_id: 9, survey: { jenis_survei_id: 9, kode: 'LEGACY', nama: 'Legacy inactive survey', aktif: false } },
      { lokasi_id: 11, jenis_survei_id: 9, survey: { jenis_survei_id: 9, kode: 'LEGACY', nama: 'Legacy inactive survey', aktif: false } },
    ],
  },
});

test('scope ID parsing deduplicates, sorts and bounds batch requests', () => {
  assert.deepEqual(parsePackageScopeIds('7,3,7'), [3, 7]);
  for (const invalid of [undefined, '', '0', '1,abc', `${Array.from({ length: 51 }, (_, i) => i + 1).join(',')}`]) {
    assert.throws(() => parsePackageScopeIds(invalid), ApiError);
  }
});

test('response preserves declared-scope absence and observed inactive associations', () => {
  const row = validatePackageSurveyScopeRows([scope(3)], [3])[0];
  assert.equal(row.declared_contract_scope.availability, 'not_stored');
  assert.equal(row.observed_location_associations.association_count, 2);
  assert.deepEqual(row.observed_location_associations.surveys.map(survey => survey.jenis_survei_id), [9]);
  assert.equal(row.observed_location_associations.surveys[0].aktif, false);
});

test('an empty observed association set is available but is not reported as declared empty scope', () => {
  const empty = scope(3);
  empty.observed_location_associations = {
    ...empty.observed_location_associations,
    observation_state: 'none_observed',
    association_count: 0,
    surveys: [],
    associations: [],
  };
  const [row] = validatePackageSurveyScopeRows([empty], [3]);
  assert.equal(row.observed_location_associations.availability, 'available');
  assert.deepEqual(row.observed_location_associations.surveys, []);
  assert.equal(row.declared_contract_scope.availability, 'not_stored');
});

test('authorized package visibility is checked before the RPC and inaccessible packages are rejected', async () => {
  const calls: string[] = [];
  const request = async <T>(path: string): Promise<T> => {
    calls.push(path);
    return (path.includes('paket_kontrak') ? [{ paket_id: 3 }] : [scope(3)]) as T;
  };
  await assert.rejects(readPackageSurveyScopes([3, 4], 'user-token', request), (error: unknown) =>
    error instanceof ApiError && error.status === 404);
  assert.equal(calls.length, 1, 'do not call SECURITY DEFINER RPC for a package outside existing RLS visibility');
});

test('a visible but foreign Provider package is denied by the stricter association RPC, including in mixed batches', async () => {
  const calls: string[] = [];
  const request = async <T>(path: string): Promise<T> => {
    calls.push(path);
    if (path.includes('paket_kontrak')) return [{ paket_id: 3 }, { paket_id: 4 }] as T;
    throw new ApiError(403, 'Akses ke paket ini ditolak');
  };
  await assert.rejects(readPackageSurveyScopes([3, 4], 'provider-token', request), (error: unknown) =>
    error instanceof ApiError && error.status === 403);
  assert.equal(calls.length, 2);
  assert.match(calls[0], /paket_kontrak/);
  assert.match(calls[1], /baca_scope_survei_paket/);
});

test('visible package IDs reach the read-only RPC using the user token and returned rows are complete', async () => {
  const calls: Array<{ path: string; token: string; init?: RequestInit }> = [];
  const request = async <T>(path: string, token: string, init?: RequestInit): Promise<T> => {
    calls.push({ path, token, init });
    return (path.includes('paket_kontrak') ? [{ paket_id: 3 }, { paket_id: 4 }] : [scope(4), scope(3)]) as T;
  };
  const rows = await readPackageSurveyScopes([4, 3, 3], 'user-token', request);
  assert.deepEqual(rows.map(row => row.paket_id), [3, 4]);
  assert.equal(calls[1].token, 'user-token');
  assert.equal(calls[1].init?.method, 'POST');
  assert.deepEqual(JSON.parse(String(calls[1].init?.body)), { p_paket_ids: [3, 4] });
});

test('missing or incomplete RPC response is an error, never an empty scope', () => {
  assert.throws(() => validatePackageSurveyScopeRows(undefined, [3]), (error: unknown) =>
    error instanceof ApiError && error.status === 502);
  assert.throws(() => validatePackageSurveyScopeRows([], [3]), (error: unknown) =>
    error instanceof ApiError && error.status === 502);
});
