import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVervalCycleAndConfirm, displayVervalValue, getStage3BCapabilities, getVervalConsistency, getVervalCycle, getVervalCycles, saveConsistencyAndConfirm } from './serverVervalData';
import type { ProtectedGet } from './serverStage3Data';

function respond(response: unknown, paths: string[]): ProtectedGet {
  return (async <T>(path: string) => { paths.push(path); return response as T; }) as ProtectedGet;
}

test('Verval list GET returns package cycles and empty response without fabricating values', async () => {
  const paths: string[] = [];
  const cycles = [{ siklus_id: 1, paket_id: 9, siklus_ke: 1, periode_mulai: '2026-11-05', periode_selesai: '2026-11-18', status: null }];
  assert.deepEqual(await getVervalCycles('9', respond({ data: cycles }, paths)), cycles);
  assert.equal(paths[0], '/paket/9/siklus-verval');
  assert.equal(displayVervalValue('status', null), 'Belum ditetapkan');
  assert.deepEqual(await getVervalCycles('9', respond({ data: [] }, [])), []);
});

test('selecting cycle reads its detail and consistency list; empty consistency remains empty', async () => {
  const paths: string[] = [];
  const detail = { siklus_id: 1, siklus_ke: 1, status: null };
  const cycle = await getVervalCycle('9', 1, respond({ data: detail }, paths));
  const consistency = await getVervalConsistency('9', cycle.siklus_id, respond({ data: [] }, paths));
  assert.deepEqual(cycle, detail);
  assert.deepEqual(consistency, []);
  assert.deepEqual(paths, ['/paket/9/siklus-verval/1', '/paket/9/siklus-verval/1/uji-konsistensi']);
});

test('Verval list/detail/consistency surface authentication and authorization failures', async () => {
  const rejectWith = (status: number): ProtectedGet => (async () => { throw Object.assign(new Error(status === 401 ? 'Sesi tamat' : 'Akses ditolak'), { status }); }) as ProtectedGet;
  for (const status of [401, 403]) {
    await assert.rejects(getVervalCycles('9', rejectWith(status)), new RegExp(status === 401 ? 'Sesi tamat' : 'Akses ditolak'));
    await assert.rejects(getVervalCycle('9', 1, rejectWith(status)), new RegExp(status === 401 ? 'Sesi tamat' : 'Akses ditolak'));
    await assert.rejects(getVervalConsistency('9', 1, rejectWith(status)), new RegExp(status === 401 ? 'Sesi tamat' : 'Akses ditolak'));
  }
});

test('null status is never presented as approval and available attributes remain visible as values', () => {
  assert.equal(displayVervalValue('status', null), 'Belum ditetapkan');
  assert.equal(displayVervalValue('periode_mulai', '2026-11-05'), '5 November 2026');
  assert.equal(displayVervalValue('jumlah_ulangan', 2), '2');
});

test('cycle date formatting preserves calendar date and leaves invalid/non-date values unchanged', () => {
  assert.equal(displayVervalValue('periode_selesai', '2026-11-18'), '18 November 2026');
  assert.equal(displayVervalValue('jatuh_tempo', null), '—');
  assert.equal(displayVervalValue('periode_mulai', '2026-02-30'), '2026-02-30');
  assert.equal(displayVervalValue('catatan', '2026-11-05'), '2026-11-05');
});

test('capability contract makes unavailable RPCs explicitly read/write disabled', async () => {
  const paths: string[] = [];
  assert.deepEqual(await getStage3BCapabilities('9', respond({ data: { read: false, write: false, reason: 'Belum dipasang' } }, paths)), { read: false, write: false, reason: 'Belum dipasang' });
  assert.equal(paths[0], '/paket/9/siklus-verval/capabilities');
});

test('cycle creation uses request identity and only resolves after list/detail readback', async () => {
  const paths: string[] = [];
  const request = (async <T>(path: string, init?: RequestInit) => {
    paths.push(`${init?.method ?? 'GET'} ${path}`);
    if (init?.method === 'POST') return { data: { siklus_id: 11, paket_id: 9, versi: 0 } } as T;
    if (path.endsWith('/11')) return { data: { siklus_id: 11, paket_id: 9, versi: 0 } } as T;
    return { data: [{ siklus_id: 11, paket_id: 9, versi: 0 }] } as T;
  }) as ProtectedGet;
  const result = await createVervalCycleAndConfirm('9', request);
  assert.equal(result.cycle.siklus_id, 11);
  assert.deepEqual(paths.map(path => path.split(' ')[0]), ['POST', 'GET', 'GET']);
});

test('consistency write sends expected version and requires persisted parent/repetition/version readback', async () => {
  const paths: string[] = [];
  let sent: unknown;
  const payload = { request_id: 'f44d37c3-6c8f-419b-8e2a-269c5891e45d', expected_version: 0, jenis_survei_id: 1, tim_id: 2, ruas_id: 3, sta_awal: 0, sta_akhir: 10, ulangan: [{ ulangan_ke: 1, rater_personel_id: 4, nilai: 2.2 }] };
  const request = (async <T>(path: string, init?: RequestInit) => {
    paths.push(`${init?.method ?? 'GET'} ${path}`);
    if (init?.method === 'POST') { sent = JSON.parse(String(init.body)); return { data: { konsistensi_id: 55, siklus_id: 7, versi: 1 } } as T; }
    if (path.endsWith('/uji-konsistensi')) return { data: [{ konsistensi_id: 55, siklus_id: 7, ulangan: [{ konsistensi_id: 55, ulangan_ke: 1, nilai: 2.2 }] }] } as T;
    return { data: [{ siklus_id: 7, versi: 1 }] } as T;
  }) as ProtectedGet;
  const saved = await saveConsistencyAndConfirm('9', 7, payload, request);
  assert.equal(saved.consistency.konsistensi_id, 55);
  assert.match(paths[0], /^POST /);
  assert.deepEqual(sent, payload);
});

test('stale or absent consistency readback is not reported as a successful save', async () => {
  const payload = { request_id: 'f44d37c3-6c8f-419b-8e2a-269c5891e45d', expected_version: 0, jenis_survei_id: 1, tim_id: 2, ruas_id: 3, sta_awal: 0, sta_akhir: 10, ulangan: [{ ulangan_ke: 1, rater_personel_id: 4, nilai: 2.2 }] };
  const request = (async <T>(path: string, init?: RequestInit) => init?.method === 'POST'
    ? { data: { konsistensi_id: 55, siklus_id: 7, versi: 1 } } as T
    : path.endsWith('/uji-konsistensi') ? { data: [] } as T : { data: [{ siklus_id: 7, versi: 1 }] } as T) as ProtectedGet;
  await assert.rejects(saveConsistencyAndConfirm('9', 7, payload, request), /belum terkonfirmasi melalui GET/);
});
