import assert from 'node:assert/strict';
import test from 'node:test';

import { paketDraftSchema, paketSurveyScopePatchSchema } from '../schemas/paket';
import {
  readDeclaredSurveyScopes,
  saveDeclaredSurveyScope,
  validateDeclaredSurveyScope,
} from './package-declared-survey-scope';
import { ApiError } from './supabase';

const scope = (paket_id: number, surveys: Array<{ jenis_survei_id: number; kode: string; nama: string; aktif: boolean }>, version = 1) => ({
  paket_id, state: 'defined', version, surveys,
});
const iri = { jenis_survei_id: 2, kode: 'IRI', nama: 'International Roughness Index', aktif: true };
const pci = { jenis_survei_id: 5, kode: 'PCI', nama: 'Pavement Condition Index', aktif: true };

test('create and edit schemas accept single/multiple surveys, normalize duplicates and reject invalid IDs', () => {
  const create = paketDraftSchema.parse({
    nama_paket: 'Paket', nomor_kontrak: 'K-1', tahun_anggaran: 2026, balai_id: 7, jenis_survei_ids: [5, 2, 5],
  });
  assert.deepEqual(create.jenis_survei_ids, [2, 5]);
  assert.deepEqual(paketSurveyScopePatchSchema.parse({ expected_version: 0, jenis_survei_ids: [2, 2] }).jenis_survei_ids, [2]);
  for (const ids of [[], [0], [-1], [1.2], [2147483648], ['2']]) {
    assert.equal(paketSurveyScopePatchSchema.safeParse({ expected_version: 0, jenis_survei_ids: ids }).success, false);
  }
  assert.equal(paketSurveyScopePatchSchema.safeParse({ expected_version: -1, jenis_survei_ids: [2] }).success, false);
});

test('read validates unset as unset, defined single/multiple selections, and preserves stable IDs/labels', () => {
  const values = [
    { paket_id: 3, state: 'unset', version: null, surveys: [] },
    scope(4, [pci, iri]),
  ];
  const rows = validateDeclaredSurveyScope(values, [3, 4]);
  assert.equal(rows[0].state, 'unset');
  assert.deepEqual(rows[1].surveys.map(survey => survey.jenis_survei_id), [5, 2]);
  assert.throws(() => validateDeclaredSurveyScope([scope(3, [iri, iri])], [3]), /tidak konsisten|duplikat/i);
  assert.throws(() => validateDeclaredSurveyScope([scope(3, [iri])], [3, 4]), /mencakup semua/i);
});

test('read uses one declared-contract RPC and rejects foreign-package denial without leaking partial results', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const rows = await readDeclaredSurveyScopes([4, 3, 4], 'test-token', async <T>(path: string, _token: string, init?: RequestInit): Promise<T> => {
    calls.push({ path, init });
    return [{ paket_id: 3, state: 'unset', version: null, surveys: [] }, scope(4, [iri])] as T;
  });
  assert.deepEqual(rows.map(row => row.paket_id), [3, 4]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/rest/v1/rpc/baca_scope_survei_kontrak');
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { p_paket_ids: [3, 4] });
  await assert.rejects(
    readDeclaredSurveyScopes([3, 999], 'test-token', async <T>(): Promise<T> => {
      throw new ApiError(404, 'Paket tidak ditemukan atau tidak boleh diakses');
    }),
    /tidak boleh diakses/,
  );
});

test('edit performs versioned write then authoritative readback and refuses mismatched selection', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const saved = await saveDeclaredSurveyScope(8, { expected_version: 1, jenis_survei_ids: [5, 2, 5] }, 'test-token',
    async <T>(path: string, _token: string, init?: RequestInit): Promise<T> => {
      calls.push({ path, init });
      if (path.endsWith('/simpan_scope_survei_kontrak')) return scope(8, [iri, pci], 2) as T;
      return [scope(8, [iri, pci], 2)] as T;
    });
  assert.deepEqual(saved.surveys.map(survey => survey.jenis_survei_id), [2, 5]);
  assert.deepEqual(calls.map(call => call.path), ['/rest/v1/rpc/simpan_scope_survei_kontrak']);
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { p_paket_id: 8, p_expected_version: 1, p_jenis_survei_ids: [2, 5] });
  await assert.rejects(
    saveDeclaredSurveyScope(8, { expected_version: 1, jenis_survei_ids: [2] }, 'test-token',
      async <T>(path: string): Promise<T> => path.endsWith('/simpan_scope_survei_kontrak')
        ? scope(8, [iri, pci], 2) as T
        : [scope(8, [iri, pci], 2)] as T),
    /Readback scope kontrak tidak sama/,
  );
});
