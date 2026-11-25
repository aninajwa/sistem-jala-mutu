import assert from 'node:assert/strict';
import test from 'node:test';
import { ApiError } from '../auth/client';
import {
  getScopeAmendmentCapabilities,
  parsePackageScopeAmendmentState,
  reviewPackageScopeAmendment,
  submitPackageScopeAmendment,
} from './packageScopeAmendmentData';

const iri = { jenis_survei_id: 1, kode: 'IRI', nama: 'IRI', aktif: true };
const pci = { jenis_survei_id: 2, kode: 'PCI', nama: 'PCI', aktif: true };
const bridge = { jenis_survei_id: 4, kode: 'JEMBATAN', nama: 'Jembatan', aktif: true };
const pending = {
  pindaan_id: 9, versi: 1, expected_scope_version: 1, status: 'DIAJUKAN',
  skop_asal: [iri], tambahan_diminta: [pci, bridge], diajukan_oleh: 7,
  diajukan_pada: '2026-11-18T09:00:00Z', direview_oleh: null,
  direview_pada: null, catatan_pic: null, versi_skop_diluluskan: null,
};
const packageId = 53;

function state(surveys: typeof iri[], version: number, amendments: unknown[]) {
  return {
    paket_id: packageId,
    scope_efektif: { state: 'defined', version, surveys },
    pindaan: amendments,
  };
}

test('Provider pending request leaves the effective IRI-only scope unchanged and parses after refresh', () => {
  const parsed = parsePackageScopeAmendmentState(state([iri], 1, [pending]), packageId);
  assert.deepEqual(parsed.scope_efektif.surveys.map(survey => survey.kode), ['IRI']);
  assert.equal(parsed.pindaan[0].status, 'DIAJUKAN');
  assert.equal(parsed.pindaan[0].tambahan_diminta.length, 2);
});

test('PIC approval adds the requested types and reflects the new scope version on readback', async () => {
  const approved = {
    ...pending,
    versi: 2,
    status: 'DISETUJUI',
    direview_oleh: 18,
    direview_pada: '2026-11-18T10:00:00Z',
    versi_skop_diluluskan: 2,
  };
  const approvedState = state([iri, pci, bridge], 2, [approved]);
  const calls: string[] = [];
  const result = await reviewPackageScopeAmendment(
    String(packageId),
    parsePackageScopeAmendmentState(state([iri], 1, [pending]), packageId).pindaan[0],
    'DISETUJUI',
    '',
    async <T>(path: string): Promise<{ data: T }> => {
      calls.push(path);
      return { data: (path.endsWith('/review') ? approvedState : approvedState) as T };
    },
  );
  assert.equal(result.scope_efektif.version, 2);
  assert.deepEqual(result.scope_efektif.surveys.map(survey => survey.kode), ['IRI', 'PCI', 'JEMBATAN']);
  assert.equal(calls.length, 2);
});

test('a rejected or pending request does not alter official scope; stale review readback fails closed', async () => {
  const rejected = {
    ...pending,
    versi: 2,
    status: 'DITOLAK',
    direview_oleh: 18,
    direview_pada: '2026-11-18T10:00:00Z',
    catatan_pic: 'Belum ada dukungan alat.',
  };
  const stateAfterReject = state([iri], 1, [rejected]);
  const result = await reviewPackageScopeAmendment(
    String(packageId),
    parsePackageScopeAmendmentState(state([iri], 1, [pending]), packageId).pindaan[0],
    'DITOLAK',
    'Belum ada dukungan alat.',
    async <T>(): Promise<{ data: T }> => ({ data: stateAfterReject as T }),
  );
  assert.equal(result.scope_efektif.surveys.length, 1);
  assert.equal(result.pindaan[0].status, 'DITOLAK');

  await assert.rejects(reviewPackageScopeAmendment(
    String(packageId),
    parsePackageScopeAmendmentState(state([iri], 1, [pending]), packageId).pindaan[0],
    'DISETUJUI',
    '',
    async <T>(path: string): Promise<{ data: T }> => ({
      data: (path.endsWith('/review') ? {} : state([iri], 2, [pending])) as T,
    }),
  ), (error: unknown) => error instanceof ApiError && error.status === 502);
});

test('Provider submits IRI to IRI plus PCI and bridge in one request and verifies fresh readback', async () => {
  const submitted = { ...pending, pindaan_id: 10 };
  const afterSubmit = state([iri], 1, [submitted]);
  const paths: string[] = [];
  const result = await submitPackageScopeAmendment(
    String(packageId),
    1,
    [4, 2],
    async <T>(path: string, init?: RequestInit): Promise<{ data: T }> => {
      paths.push(path);
      if (path.endsWith('/scope-amendment') && init?.method === 'POST') {
        assert.deepEqual(JSON.parse(String(init?.body)), {
          expected_scope_version: 1,
          jenis_survei_ids: [2, 4],
        });
      }
      return { data: afterSubmit as T };
    },
  );
  assert.deepEqual(result.scope_efektif.surveys.map(survey => survey.kode), ['IRI']);
  assert.equal(result.pindaan[0].status, 'DIAJUKAN');
  assert.equal(paths.length, 2);
});

test('scope amendment capabilities parse the server gate and reject malformed bodies', async () => {
  const paths: string[] = [];
  const reply = (body: unknown) => (async <T,>(path: string) => { paths.push(path); return body as T; }) as never;
  assert.deepEqual(await getScopeAmendmentCapabilities('53', reply({ data: { enabled: false } })), { enabled: false });
  assert.deepEqual(await getScopeAmendmentCapabilities('53', reply({ data: { enabled: true } })), { enabled: true });
  assert.equal(paths[0], '/paket/53/scope-amendment-capabilities');
  for (const body of [{}, { data: {} }, { data: { enabled: 'true' } }, null]) {
    await assert.rejects(getScopeAmendmentCapabilities('53', reply(body)), /Format kapabilitas penambahan jenis survei tidak sesuai/);
  }
});
