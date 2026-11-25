import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError } from './supabase';
import {
  calculateStage2PackageCompletion,
  readStage2PackageCompletion,
} from './stage2-package-completion';

const packageId = 7421;
const iri = { jenis_survei_id: 31, kode: 'IRI', nama: 'IRI', aktif: true };
const pci = { jenis_survei_id: 44, kode: 'PCI', nama: 'PCI', aktif: true };
const scope = { paket_id: packageId, state: 'defined' as const, version: 1, surveys: [iri, pci] };
const approvedTrial = (uji_coba_id: number, jenis_survei_id: number) => ({
  paket_id: packageId, uji_coba_id, jenis_survei_id, status: 'DISETUJUI',
});

test('package completion requires an approved PIC trial for each unique declared survey ID', () => {
  const iriOnly = calculateStage2PackageCompletion(packageId, {
    paket_id: packageId, state: 'defined', version: 1, surveys: [iri],
  }, [approvedTrial(10, iri.jenis_survei_id)]);
  assert.equal(iriOnly.state, 'complete');
  assert.equal(iriOnly.label, 'Selesai · 1/1 jenis survei');

  const onlyIri = calculateStage2PackageCompletion(packageId, scope, [approvedTrial(1, iri.jenis_survei_id)]);
  assert.equal(onlyIri.state, 'partial');
  assert.equal(onlyIri.label, '1/2 jenis survei disetujui · Menunggu PCI');

  const repeatedIri = calculateStage2PackageCompletion(packageId, scope, [
    approvedTrial(1, iri.jenis_survei_id),
    approvedTrial(2, iri.jenis_survei_id),
  ]);
  assert.equal(repeatedIri.state, 'partial');
  assert.equal(repeatedIri.label, '1/2 jenis survei disetujui · Menunggu PCI');

  const iriAndPci = calculateStage2PackageCompletion(packageId, scope, [
    approvedTrial(1, iri.jenis_survei_id),
    approvedTrial(2, iri.jenis_survei_id),
    approvedTrial(3, pci.jenis_survei_id),
  ]);
  assert.equal(iriAndPci.state, 'complete');
  assert.equal(iriAndPci.label, 'Selesai · 2/2 jenis survei');

  const pciApproval = calculateStage2PackageCompletion(packageId, scope, [
    approvedTrial(4, pci.jenis_survei_id),
  ]);
  assert.equal(pciApproval.approved_count, 1);
  assert.equal(pciApproval.label, '1/2 jenis survei disetujui · Menunggu IRI');
});

test('non-approved or revised attempts do not satisfy a survey type', () => {
  for (const status of ['DRAFT', 'DIAJUKAN', 'PERLU_REVISI']) {
    const result = calculateStage2PackageCompletion(packageId, scope, [
      { ...approvedTrial(1, iri.jenis_survei_id), status },
    ]);
    assert.equal(result.state, 'partial');
    assert.equal(result.approved_count, 0);
  }
});

test('unset and empty official scope are unavailable, never complete', () => {
  const unset = calculateStage2PackageCompletion(packageId, {
    paket_id: packageId, state: 'unset', version: null, surveys: [],
  }, []);
  assert.equal(unset.state, 'unavailable');
  assert.match(unset.label, /skop survei rasmi belum ditetapkan/);

  const empty = calculateStage2PackageCompletion(packageId, {
    paket_id: packageId, state: 'defined', version: 1, surveys: [],
  }, []);
  assert.equal(empty.state, 'unavailable');
  assert.equal(empty.reason, 'DECLARED_SCOPE_EMPTY');
  assert.match(empty.label, /skop survei rasmi kosong/);
});

test('failed, malformed, or cross-package reads fail closed', async () => {
  assert.throws(
    () => calculateStage2PackageCompletion(packageId, scope, null),
    (error: unknown) => error instanceof ApiError && error.status === 502,
  );
  assert.throws(
    () => calculateStage2PackageCompletion(packageId, scope, [{ ...approvedTrial(1, 31), paket_id: packageId + 1 }]),
    (error: unknown) => error instanceof ApiError && error.status === 502,
  );
  await assert.rejects(readStage2PackageCompletion(
    packageId,
    'read-only-test-token',
    async <T>(): Promise<T> => { throw new ApiError(502, 'read unavailable'); },
  ), /read unavailable/);
});

test('server read reuses the declared-scope RPC and same-package trial-list RPC only', async () => {
  const calls: Array<{ path: string; body?: unknown }> = [];
  const result = await readStage2PackageCompletion(
    packageId,
    'read-only-test-token',
    async <T>(path: string, _token: string, init?: RequestInit): Promise<T> => {
      calls.push({ path, body: init?.body ? JSON.parse(String(init.body)) : undefined });
      if (path.endsWith('/baca_scope_survei_kontrak')) return [scope] as T;
      if (path.endsWith('/ambil_senarai_uji_coba')) return [approvedTrial(1, iri.jenis_survei_id)] as T;
      throw new Error(`Unexpected RPC ${path}`);
    },
  );
  assert.equal(result.label, '1/2 jenis survei disetujui · Menunggu PCI');
  assert.deepEqual(calls.map(call => call.path), [
    '/rest/v1/rpc/baca_scope_survei_kontrak',
    '/rest/v1/rpc/ambil_senarai_uji_coba',
  ]);
  assert.deepEqual(calls[0].body, { p_paket_ids: [packageId] });
  assert.deepEqual(calls[1].body, { p_paket_id: packageId });
});
