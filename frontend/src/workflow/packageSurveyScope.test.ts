import test from 'node:test';
import assert from 'node:assert/strict';
import {
  packageSurveyScopeMessage,
  parsePackageSurveyScopeBatch,
  readPackageSurveyScopesForCards,
} from './packageSurveyScope';

test('package scope loading, request failure, undefined and defined-empty states stay distinct', () => {
  assert.equal(packageSurveyScopeMessage('loading'), 'Memuat cakupan survei…');
  assert.equal(packageSurveyScopeMessage('error'), 'Cakupan survei gagal dimuat');
  assert.equal(packageSurveyScopeMessage('undefined'), 'Cakupan survei belum tersedia dari kontrak baca server');
  assert.equal(packageSurveyScopeMessage('defined'), 'Survei pada lokasi belum ditetapkan');
});

test('denied card reads stay errors while empty authorized associations remain defined and sibling reads continue', async () => {
  const requested: string[] = [];
  const response = (id: number) => ({
    paket_id: id,
    availability: 'available',
    declared_contract_scope: { availability: 'not_stored', source: 'paket_kontrak', surveys: [] },
    observed_location_associations: {
      availability: 'available',
      source: 'lokasi_pekerjaan',
      observation_state: 'none_observed',
      association_count: 0,
      unresolved_association_count: 0,
      surveys: [],
      associations: [],
    },
  });
  const result = await readPackageSurveyScopesForCards([3, 4, 5], async path => {
    requested.push(path);
    const id = Number(new URL(path, 'http://local').searchParams.get('paket_ids'));
    if (id === 4) throw new Error('403 denied');
    return { data: [response(id)] };
  }, 2);

  assert.deepEqual(requested.sort(), [
    '/paket/survey-scope?paket_ids=3',
    '/paket/survey-scope?paket_ids=4',
    '/paket/survey-scope?paket_ids=5',
  ]);
  assert.equal(result.get(3)?.status, 'defined');
  assert.equal(result.get(3)?.status === 'defined' && result.get(3)?.scope.observed_location_associations.association_count, 0);
  assert.equal(result.get(4)?.status, 'error');
  assert.equal(result.get(5)?.status, 'defined');
  assert.equal(packageSurveyScopeMessage(result.get(4)?.status), 'Cakupan survei gagal dimuat');
  assert.equal(packageSurveyScopeMessage(result.get(3)?.status, 0), 'Survei pada lokasi belum ditetapkan');
});

test('scope response preserves inactive associations, deduplicates IDs, and rejects missing packages', () => {
  const value = {
    paket_id: 3,
    availability: 'available',
    declared_contract_scope: { availability: 'not_stored', source: 'paket_kontrak', surveys: [] },
    observed_location_associations: {
      availability: 'available', source: 'lokasi_pekerjaan', observation_state: 'observed',
      association_count: 2, unresolved_association_count: 0,
      surveys: [
        { jenis_survei_id: 9, kode: 'OLD', nama: 'Inactive', aktif: false },
        { jenis_survei_id: 9, kode: 'OLD', nama: 'Inactive', aktif: false },
      ],
      associations: [
        { lokasi_id: 1, jenis_survei_id: 9, survey: { jenis_survei_id: 9, kode: 'OLD', nama: 'Inactive', aktif: false } },
        { lokasi_id: 2, jenis_survei_id: 9, survey: { jenis_survei_id: 9, kode: 'OLD', nama: 'Inactive', aktif: false } },
      ],
    },
  };
  const parsed = parsePackageSurveyScopeBatch([value], [3]).get(3)!;
  assert.equal(parsed.observed_location_associations.surveys.length, 1);
  assert.equal(parsed.observed_location_associations.surveys[0].aktif, false);
  assert.equal(parsed.declared_contract_scope.availability, 'not_stored');
  assert.throws(() => parsePackageSurveyScopeBatch([], [3]), /tidak mencakup/);
  assert.throws(() => parsePackageSurveyScopeBatch([{ ...value, availability: undefined }], [3]), /tidak lengkap/);
});
