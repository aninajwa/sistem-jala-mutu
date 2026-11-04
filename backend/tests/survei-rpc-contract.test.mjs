import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(new URL('../proposals/survei-sesi-rpc.sql', import.meta.url), 'utf8');

test('survey-session RPC proposal gates exact approved team, survey type, tool and road', () => {
  assert.match(sql, /u\.status\s*=\s*'DISETUJUI'/i);
  assert.match(sql, /u\.paket_id\s*=\s*p_paket_id[\s\S]*?u\.tim_id\s*=\s*v_team\.tim_id[\s\S]*?u\.jenis_survei_id\s*=\s*v_team\.jenis_survei_id[\s\S]*?u\.alat_id\s*=\s*v_alat_id[\s\S]*?u\.ruas_id\s*=\s*v_ruas_id/i);
  assert.match(sql, /a\.penyedia_id\s*=\s*v_package\.penyedia_id/i);
  assert.match(sql, /r\.ruas_id\s*=\s*v_ruas_id\s+and\s+r\.balai_id\s*=\s*v_package\.balai_id/i);
  assert.match(sql, /pa\.tim_id\s*=\s*v_team\.tim_id[\s\S]*?pa\.alat_id\s*=\s*v_alat_id/i);
});

test('survey-session RPC validates JSON types, ranges, date/time and text lengths', () => {
  assert.match(sql, /jsonb_typeof\(p_data->v_key\)\s+is\s+distinct\s+from\s+'number'/i);
  assert.match(sql, /v_number\s*<>\s*trunc\(v_number\)/i);
  assert.match(sql, /v_number\s*>\s*2147483647/i);
  assert.match(sql, /tanggal.*YYYY-MM-DD/i);
  assert.match(sql, /HH:MM atau HH:MM:SS/i);
  assert.match(sql, /length\(btrim\(p_data->>v_key\)\)\s*>\s*255/i);
  assert.match(sql, /length\(btrim\(p_data->>v_key\)\)\s*>\s*2000/i);
  assert.match(sql, /v_length\s*<\s*0/i);
});

test('survey-session RPC uses database-side auth, scoped execution and relationship locks without inventing status', () => {
  assert.match(sql, /security\s+definer/i);
  assert.match(sql, /set\s+search_path\s*=\s*''/i);
  assert.match(sql, /auth\.uid\(\)/i);
  assert.match(sql, /v_package\.created_by\s+is\s+distinct\s+from\s+v_actor/i);
  assert.match(sql, /where\s+paket_id\s*=\s*p_paket_id\s+for\s+update/i);
  assert.match(sql, /for\s+share\s+of\s+pa,\s*a/i);
  assert.match(sql, /limit\s+1\s+for\s+share/i);
  assert.match(sql, /grant\s+execute\s+on\s+function\s+public\.simpan_sesi_survei\(integer,\s*jsonb\)\s+to\s+authenticated/i);
  const insert = sql.match(/insert into public\.sesi_survei\(([\s\S]*?)\) values/i)?.[1] ?? '';
  assert.ok(insert, 'expected a session insert');
  assert.doesNotMatch(insert, /\bstatus\b/i);
});
