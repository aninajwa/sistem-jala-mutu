import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  addPackageRoadLocation,
  getOfficialPackageRoads,
  getPackageRoadAssignmentOptions,
  parseAssignmentOptions,
  type PackageRoadRequest,
} from './packageRoadMembership';

const roads = [
  { ruas_id: 2101, balai_id: 7, nomor_ruas: 'MOCK-A', nama_ruas: 'Mock Road A' },
  { ruas_id: 2102, balai_id: 7, nomor_ruas: 'MOCK-B', nama_ruas: 'Mock Road B' },
];
const surveys = [{ jenis_survei_id: 1, kode: 'IRI', nama: 'IRI' }];
function options(locations: Array<Record<string, unknown>> = []) {
  return {
    paket_id: 71, balai_id: 7, survei: surveys, semester_tersedia: [1],
    ruas_tersedia: roads, lokasi_ditetapkan: locations,
  };
}
const location = (id: number, roadId: number, semester: number | null) => ({
  lokasi: {
    lokasi_id: id, paket_id: 71, ruas_id: roadId, jenis_survei_id: 1,
    semester, jembatan_id: null, lereng_id: null, jenis_pemeriksaan: null,
    target_volume: null, lampiran: null,
  },
  ruas: roads.find(road => road.ruas_id === roadId),
  survei: surveys[0],
});

test('PIC assignment read validates package scope and preserves survey/semester location rows', async () => {
  const raw = options([location(301, 2101, 1), location(302, 2101, null)]);
  const api: PackageRoadRequest = async <T>(path: string) => {
    assert.equal(path, '/paket/71/ruas-jalan/assignment');
    return { data: raw } as T;
  };
  const result = await getPackageRoadAssignmentOptions('71', api);
  assert.equal(result.lokasi_ditetapkan.length, 2);
  assert.equal(result.lokasi_ditetapkan[0].semester, 1);
  assert.equal(result.lokasi_ditetapkan[1].semester, null);
  assert.deepEqual(result.ruas_tersedia.map(road => road.ruas_id), [2101, 2102]);
  assert.throws(() => parseAssignmentOptions({ ...raw, paket_id: 72 }, '71'), /tidak lengkap atau tidak sesuai paket/);
});

test('Provider reads official roads using the shared package-road route', async () => {
  const calls: string[] = [];
  const api: PackageRoadRequest = async <T>(path: string) => {
    calls.push(path);
    return { data: [roads[0]] } as T;
  };
  const result = await getOfficialPackageRoads('71', api);
  assert.deepEqual(calls, ['/paket/71/ruas-jalan']);
  assert.deepEqual(result.map(road => road.ruas_id), [2101]);
});

test('PIC save is successful only with the exact saved location and official road in RPC readback', async () => {
  const calls: Array<{ path: string; method: string; body?: unknown }> = [];
  const api: PackageRoadRequest = async <T>(path: string, init?: RequestInit) => {
    calls.push({
      path,
      method: init?.method ?? 'GET',
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    return {
      data: {
        lokasi: { lokasi_id: 401, paket_id: 71, ruas_id: 2102, jenis_survei_id: 1, semester: 1 },
        ruas_paket: roads,
      },
    } as T;
  };
  const saved = await addPackageRoadLocation('71', { ruas_id: 2102, jenis_survei_id: 1, semester: 1 }, api);
  assert.equal(saved.location.lokasi_id, 401);
  assert.deepEqual(calls, [{
    path: '/paket/71/ruas-jalan/assignment',
    method: 'POST',
    body: { ruas_id: 2102, jenis_survei_id: 1, semester: 1 },
  }]);
  await assert.rejects(
    addPackageRoadLocation('71', { ruas_id: 2102, jenis_survei_id: 1, semester: null }, async <T>() => ({
      data: { lokasi: { lokasi_id: 402, paket_id: 71, ruas_id: 2102, jenis_survei_id: 1, semester: null }, ruas_paket: [roads[0]] },
    }) as T),
    /belum muncul pada bacaan ruas resmi/,
  );
});

test('failed and duplicate saves remain failures and do not fabricate a persisted location', async () => {
  const failure: PackageRoadRequest = async <T>() => { throw new Error('HTTP 409 duplicate scope'); };
  await assert.rejects(
    addPackageRoadLocation('71', { ruas_id: 2102, jenis_survei_id: 1, semester: 1 }, failure),
    /duplicate scope/,
  );
});

test('Dirah package panel separates official roads from PIC-only additive controls and exposes async states', async () => {
  const source = await readFile(new URL('./PackageRoadMembershipPanel.tsx', import.meta.url), 'utf8');
  const page = await readFile(new URL('./ServerPackageWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(source, /role === assignmentRole/);
  assert.match(source, /role === providerRole/);
  assert.match(source, /officialRoads/);
  assert.match(source, /lokasi_ditetapkan/);
  assert.match(source, /saving \? 'Menyimpan dan mengesahkan…'/);
  assert.match(source, /role="alert"/);
  assert.match(source, /role="status"/);
  assert.match(source, /Muat ulang keanggotaan resmi sebelum mengirim ulang/);
  assert.match(page, /<PackageRoadMembershipPanel packageId=\{packageId\} role=\{role\} \/>/);
  assert.equal((page.match(/<PackageRoadMembershipPanel packageId=\{packageId\} role=\{role\} \/>/g) ?? []).length, 2,
    'membership panel is mounted in both package overview render paths, including Dirah’s server-backed shell');
});
