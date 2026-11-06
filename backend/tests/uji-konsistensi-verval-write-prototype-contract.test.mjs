import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const proposal = await readFile(new URL('../proposals/uji-konsistensi-verval-write-prototype.md', import.meta.url), 'utf8');
const sql = await readFile(new URL('../proposals/uji-konsistensi-verval-write.sql', import.meta.url), 'utf8');
const route = await readFile(new URL('../src/routes/siklus-verval.ts', import.meta.url), 'utf8');
const schema = await readFile(new URL('../src/schemas/siklus-verval.ts', import.meta.url), 'utf8');

test('write proposal remains review-only and cannot execute a database write', () => {
  assert.match(sql, /DOKUMEN REVIEW SAHAJA/i);
  assert.match(sql, /<TABEL\/KOLOM YANG DISAHKAN>/);
  assert.doesNotMatch(sql, /^\s*(?:insert\s+into|update\s+public\.|delete\s+from|create\s+(?:or\s+replace\s+)?function)\b/im);
  assert.match(proposal, /belum ada endpoint POST atau write database/i);
  assert.match(proposal, /tidak boleh dikirim/i);
});

test('proposed contract rejects client-controlled actor/status and requires scoped authorization', () => {
  assert.match(proposal, /auth\.uid\(\)/);
  assert.match(proposal, /assignment paket/i);
  assert.match(proposal, /siklus milik paket/i);
  assert.match(proposal, /referensi survei\/ruas\/[\s\S]*?milik paket\/siklus yang sama/i);
  assert.match(proposal, /tidak dari body/i);
  assert.match(proposal, /tidak boleh menetapkan status\s+kelulusan/i);
  assert.match(proposal, /service-role/i);
  assert.match(proposal, /duplikasi/i);
});

test('contract scenarios specify validation and errors without calling Supabase', () => {
  const scenarios = [
    ['malformed IDs or extra actor/status fields', /400\s+payload\/ID\s+tidak sah/],
    ['missing or invalid JWT', /401\s+tiada\/sesi tidak sah/],
    ['role or package assignment denied', /403\s+role\/scope ditolak/],
    ['cycle or survey reference outside package scope', /404\s+siklus atau\s+referensi tidak ditemukan\/di luar scope/],
    ['duplicate record', /409\s+duplikasi/],
  ];
  for (const [scenario, expectation] of scenarios) {
    assert.match(proposal, expectation, `missing expected response for ${scenario}`);
  }
  assert.doesNotMatch(route, /simpan_uji_konsistensi|tambah_uji_konsistensi/);
  assert.match(route, /\/rest\/v1\/rpc\/baca_uji_konsistensi_verval/);
});

test('GET contract and shared schema stay unchanged pending schema confirmation', () => {
  assert.match(route, /router\.get\('\/paket\/:id\/siklus-verval\/:siklusId\/uji-konsistensi'/);
  assert.match(route, /p_paket_id:\s*packageId,\s*p_siklus_id:\s*cycleId/);
  assert.match(schema, /siklusVervalCreateBodySchema/);
  assert.doesNotMatch(schema, /ujiKonsistensiWrite/);
});
