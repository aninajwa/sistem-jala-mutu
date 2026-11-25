import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError } from './supabase';
import {
  readPackageScopeAmendmentState,
  reviewPackageScopeAmendment,
  submitPackageScopeAmendment,
  type PackageScopeAmendment,
} from './package-scope-amendment';

const packageId = 7421;
const iri = { jenis_survei_id: 1, kode: 'IRI', nama: 'IRI', aktif: true };
const pci = { jenis_survei_id: 2, kode: 'PCI', nama: 'PCI', aktif: true };
const bridge = { jenis_survei_id: 4, kode: 'JEMBATAN', nama: 'Jembatan', aktif: true };
const request = {
  pindaan_id: 91, versi: 1, expected_scope_version: 1, status: 'DIAJUKAN' as const,
  skop_asal: [iri], tambahan_diminta: [pci, bridge], diajukan_oleh: 7,
  diajukan_pada: '2026-11-18T09:00:00Z', direview_oleh: null,
  direview_pada: null, catatan_pic: null, versi_skop_diluluskan: null,
};

type Survey = { jenis_survei_id: number; kode: string | null; nama: string | null; aktif: boolean | null };

function state(scope: Survey[], version: number | null, amendments: PackageScopeAmendment[]) {
  return {
    paket_id: packageId,
    scope_efektif: {
      state: version === null ? 'unset' as const : 'defined' as const,
      version,
      surveys: scope,
    },
    pindaan: amendments,
  };
}

test('read is scoped, no-store by callers, and rejects malformed or cross-package RPC state', async () => {
  const calls: Array<{ path: string; body: unknown }> = [];
  const read = await readPackageScopeAmendmentState(
    packageId,
    'test-token',
    async <T>(path: string, _token: string, init?: RequestInit): Promise<T> => {
      calls.push({ path, body: JSON.parse(String(init?.body)) });
      return state([iri], 1, [request]) as T;
    },
  );
  assert.equal(read.scope_efektif.surveys[0].kode, 'IRI');
  assert.equal(read.pindaan[0].status, 'DIAJUKAN');
  assert.deepEqual(calls, [{
    path: '/rest/v1/rpc/baca_pindaan_scope_survei',
    body: { p_paket_id: packageId },
  }]);

  await assert.rejects(readPackageScopeAmendmentState(
    packageId,
    'test-token',
    async <T>(): Promise<T> => ({ ...state([iri], 1, []), paket_id: packageId + 1 }) as T,
  ), (error: unknown) => error instanceof ApiError && error.status === 502);
  await assert.rejects(readPackageScopeAmendmentState(
    packageId,
    'test-token',
    async <T>(): Promise<T> => { throw new ApiError(503, 'read failed'); },
  ), /read failed/);
});

test('submit sends only additions with the expected official scope version and verifies authoritative readback', async () => {
  const calls: Array<{ path: string; body?: unknown }> = [];
  const submitted = { ...request, pindaan_id: 92 };
  const resultState = state([iri], 1, [submitted]);
  const result = await submitPackageScopeAmendment(
    packageId,
    { expected_scope_version: 1, jenis_survei_ids: [4, 2] },
    'test-token',
    async <T>(path: string, _token: string, init?: RequestInit): Promise<T> => {
      calls.push({ path, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (path.endsWith('/ajukan_pindaan_scope_survei')) return resultState as T;
      if (path.endsWith('/baca_pindaan_scope_survei')) return resultState as T;
      throw new Error(`Unexpected RPC ${path}`);
    },
  );
  assert.deepEqual(result.scope_efektif.surveys.map(item => item.kode), ['IRI']);
  assert.equal(result.pindaan[0].status, 'DIAJUKAN');
  assert.deepEqual(calls.map(item => item.path), [
    '/rest/v1/rpc/ajukan_pindaan_scope_survei',
    '/rest/v1/rpc/baca_pindaan_scope_survei',
  ]);
  assert.deepEqual(calls[0].body, {
    p_paket_id: packageId, p_expected_scope_version: 1, p_jenis_survei_ids: [2, 4],
  });
});

test('PIC review verifies persisted decision and scope-version readback', async () => {
  const approved = {
    ...request, versi: 2, status: 'DISETUJUI' as const,
    direview_oleh: 18, direview_pada: '2026-11-18T10:00:00Z',
    catatan_pic: null, versi_skop_diluluskan: 2,
  };
  const approvedState = state([iri, pci, bridge], 2, [approved]);
  const calls: string[] = [];
  const result = await reviewPackageScopeAmendment(
    packageId,
    91,
    { expected_version: 1, keputusan: 'DISETUJUI' },
    'pic-token',
    async <T>(path: string, _token: string, init?: RequestInit): Promise<T> => {
      calls.push(path);
      if (path.endsWith('/review_pindaan_scope_survei')) {
        assert.deepEqual(JSON.parse(String(init?.body)), {
          p_paket_id: packageId, p_pindaan_id: 91, p_expected_version: 1,
          p_keputusan: 'DISETUJUI', p_catatan: null,
        });
        return approvedState as T;
      }
      if (path.endsWith('/baca_pindaan_scope_survei')) return approvedState as T;
      throw new Error(`Unexpected RPC ${path}`);
    },
  );
  assert.deepEqual(result.scope_efektif.surveys.map(item => item.kode), ['IRI', 'PCI', 'JEMBATAN']);
  assert.deepEqual(calls, [
    '/rest/v1/rpc/review_pindaan_scope_survei',
    '/rest/v1/rpc/baca_pindaan_scope_survei',
  ]);
});

test('review fails closed when an RPC response does not reflect the committed decision', async () => {
  await assert.rejects(reviewPackageScopeAmendment(
    packageId,
    91,
    { expected_version: 1, keputusan: 'DISETUJUI' },
    'pic-token',
    async <T>(path: string): Promise<T> => {
      if (path.endsWith('/review_pindaan_scope_survei')) return {} as T;
      return state([iri], 1, [request]) as T;
    },
  ), (error: unknown) => error instanceof ApiError && error.status === 502);
});
