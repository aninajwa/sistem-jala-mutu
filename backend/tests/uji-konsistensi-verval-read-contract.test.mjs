import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(new URL('../proposals/uji-konsistensi-verval-read-rpc.sql', import.meta.url), 'utf8');
const route = await readFile(new URL('../src/routes/siklus-verval.ts', import.meta.url), 'utf8');

test('consistency READ checks package scope and cycle ownership before reading children', () => {
  assert.match(sql, /security\s+definer/i);
  assert.match(sql, /auth\.uid\(\)/i);
  assert.match(sql, /perform\s+app_private\.assert_survei_read\(p_paket_id\)/i);
  assert.match(sql, /from public\.siklus_verval s[\s\S]*?where s\.siklus_id\s*=\s*p_siklus_id and s\.paket_id\s*=\s*p_paket_id/i);
  assert.ok(sql.indexOf('app_private.assert_survei_read(p_paket_id)') < sql.indexOf('from public.siklus_verval s'));
  assert.ok(sql.indexOf('where s.siklus_id = p_siklus_id and s.paket_id = p_paket_id') < sql.indexOf('from public.uji_konsistensi k'));
  assert.match(sql, /where k\.siklus_id\s*=\s*p_siklus_id/i);
  assert.match(sql, /from public\.uji_konsistensi_ulangan u[\s\S]*?where u\.konsistensi_id\s*=\s*k\.konsistensi_id/i);
  assert.match(sql, /set search_path\s*=\s*''/i);
  assert.match(sql, /grant execute on function public\.baca_uji_konsistensi_verval\(integer, integer\) to authenticated/i);
  assert.doesNotMatch(sql, /public\.(hasil_parameter|berita_acara)/i);
  assert.doesNotMatch(sql, /insert into|update public\.|delete from/i);
});

test('consistency READ endpoint validates both IDs and calls only the scoped RPC', () => {
  assert.match(route, /\/paket\/:id\/siklus-verval\/:siklusId\/uji-konsistensi/);
  assert.match(route, /\/rest\/v1\/rpc\/baca_uji_konsistensi_verval/);
  assert.match(route, /p_paket_id:\s*packageId,\s*p_siklus_id:\s*cycleId/);
  assert.match(route, /res\.locals\.identity\.token/);
});
