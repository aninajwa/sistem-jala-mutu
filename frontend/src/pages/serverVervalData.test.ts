import { test } from 'node:test';
import assert from 'node:assert/strict';
import { displayVervalValue, getVervalConsistency, getVervalCycle, getVervalCycles } from './serverVervalData';
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
