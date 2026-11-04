import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(new URL('../proposals/ruas-jalan-master-rpc.sql', import.meta.url), 'utf8');

test('road master RPC proposal limits writes to admin or PIC assigned to the same Balai', () => {
  assert.match(sql, /r\.nama\s*=\s*'admin'\s+or\s+\(r\.nama\s*=\s*'pic_balai'\s+and\s+pp\.scope_balai_id\s*=\s*p_balai_id\)/i);
  assert.match(sql, /u\.auth_user_id\s*=\s*auth\.uid\(\)/i);
  assert.match(sql, /not\s+coalesce\(u\.terkunci,\s*false\)/i);
  assert.match(sql, /b\.balai_id\s*=\s*p_balai_id\s+and\s+b\.aktif\s+is\s+true/i);
});

test('road master RPC validates required fields, inserts only the requested Balai and audits creation', () => {
  assert.match(sql, /length\(v_nomor\)\s+not\s+between\s+1\s+and\s+255/i);
  assert.match(sql, /length\(v_nama\)\s+not\s+between\s+1\s+and\s+255/i);
  assert.match(sql, /insert\s+into\s+public\.ruas_jalan\s*\(balai_id,\s*nomor_ruas,\s*nama_ruas\)/i);
  assert.match(sql, /insert\s+into\s+public\.audit_trail/i);
  assert.match(sql, /'CREATE_RUAS_JALAN'/i);
});

test('road RPCs remain explicit authenticated entry points without granting table access', () => {
  assert.match(sql, /grant\s+execute\s+on\s+function\s+public\.buat_ruas_jalan\(integer,\s*text,\s*text\)\s+to\s+authenticated/i);
  assert.match(sql, /grant\s+execute\s+on\s+function\s+public\.baca_ruas_paket\(integer\)\s+to\s+authenticated/i);
  assert.doesNotMatch(sql, /grant\s+(?:select|insert|update|all).*ruas_jalan\s+to\s+authenticated/i);
  assert.match(sql, /revoke\s+all\s+on\s+function\s+app_private\.buat_ruas_jalan/i);
});
