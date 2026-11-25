import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(new URL('../proposals/koreksi-baca-rpc.sql', import.meta.url), 'utf8');

test('correction read RPCs enforce package ownership and scoped roles', () => {
  const [listFn, detailFn] = sql.split(/create or replace function public\.baca_koreksi\(/i);
  assert.match(sql, /u\.auth_user_id\s*=\s*auth\.uid\(\)/i);
  assert.match(listFn, /p\.created_by\s*=\s*u\.pengguna_id/i);
  assert.match(sql.slice(sql.search(/create or replace function public\.baca_koreksi\(/i)), /p\.created_by\s*=\s*u\.pengguna_id/i);
  for (const fn of [listFn, detailFn]) {
    assert.match(fn, /r\.nama\s+in\s*\('direktorat',\s*'admin'\)/i);
    assert.match(fn, /r\.nama\s*=\s*'pic_balai'.*?pp\.scope_balai_id\s*=\s*p\.balai_id/is);
    assert.match(fn, /pp\.scope_paket_id\s+is\s+null\s+or\s+pp\.scope_paket_id\s*=\s*p\.paket_id/i);
    assert.doesNotMatch(fn, /r\.nama\s+in\s*\('penyedia_jasa',\s*'direktorat',\s*'admin'\)/i);
  }
});

test('correction detail returns only the requested correction and aggregates deterministically', () => {
  const detail = sql.slice(sql.search(/create or replace function public\.baca_koreksi\(/i));
  assert.match(detail, /where kd\.kasus_id\s*=\s*k\.kasus_id\s+and kd\.koreksi_id\s*=\s*p_koreksi_id/i);
  assert.match(detail, /'kasus_temuan',\s*to_jsonb\(k\)/i);
  assert.match(detail, /'tindakan_perbaikan'/i);
  assert.match(detail, /'riwayat_status_kasus'/i);
  const aggregateCount = [...sql.matchAll(/jsonb_agg\(/gi)].length;
  const orderedAggregateCount = [...sql.matchAll(/\border by\b/gi)].length;
  assert.ok(aggregateCount > 0);
  assert.equal(orderedAggregateCount, aggregateCount);
  assert.match(sql, /order by k\.kasus_id/i);
  assert.match(sql, /order by t\.tindakan_id/i);
  assert.match(sql, /order by kd\.koreksi_id/i);
  assert.match(sql, /jsonb_agg\(to_jsonb\(uu\)\s+order by uu\.uji_ulang_id\)/i);
  assert.match(sql, /jsonb_agg\(to_jsonb\(vk\)\s+order by vk\.verif_id\)/i);
  assert.match(sql, /jsonb_agg\(to_jsonb\(rs\)\s+order by rs\.riwayat_id\)/i);
});
