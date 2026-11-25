import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(new URL('../proposals/siklus-verval-read-rpc.sql', import.meta.url), 'utf8');
const route = await readFile(new URL('../src/routes/siklus-verval.ts', import.meta.url), 'utf8');
const schema = await readFile(new URL('../src/schemas/siklus-verval.ts', import.meta.url), 'utf8');

test('cycle Verval READ RPCs require auth and package-scoped access', () => {
  assert.equal((sql.match(/security\s+definer/ig) ?? []).length, 2);
  assert.equal((sql.match(/auth\.uid\(\)/ig) ?? []).length, 2);
  assert.equal((sql.match(/app_private\.assert_survei_read\(p_paket_id\)/ig) ?? []).length, 2);
  assert.match(sql, /where\s+s\.paket_id\s*=\s*p_paket_id/i);
  assert.match(sql, /where\s+s\.paket_id\s*=\s*p_paket_id\s+and\s+s\.siklus_id\s*=\s*p_siklus_id/i);
  assert.match(sql, /raise exception 'Siklus Verval tidak ditemukan dalam paket ini' using errcode = 'P0002'/i);
  assert.match(sql, /set search_path\s*=\s*''/i);
  assert.match(sql, /grant execute on function public\.baca_siklus_verval\(integer, integer\) to authenticated/i);
  assert.doesNotMatch(sql, /insert into|update public\.siklus_verval|delete from/i);
  assert.doesNotMatch(sql, /sesi_id|data_id|status\s*=/i);
});

test('Express READ routes validate IDs and delegate through authenticated RPC calls', () => {
  assert.match(route, /\/paket\/:id\/siklus-verval/);
  assert.match(route, /\/rest\/v1\/rpc\/baca_senarai_siklus_verval/);
  assert.match(route, /\/rest\/v1\/rpc\/baca_siklus_verval/);
  assert.match(route, /res\.locals\.identity\.token/);
  assert.match(route, /p_paket_id:\s*packageId/);
  assert.match(route, /p_siklus_id:\s*cycleId/);
  assert.match(schema, /2147483647/);
  assert.match(route, /Cache-Control', 'private, no-store'/);
});
