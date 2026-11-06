import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const proposal = await readFile(new URL('../proposals/uji-konsistensi-verval-write-prototype.md', import.meta.url), 'utf8');
const sql = await readFile(new URL('../proposals/uji-konsistensi-verval-write.sql', import.meta.url), 'utf8');
const route = await readFile(new URL('../src/routes/siklus-verval.ts', import.meta.url), 'utf8');
const schema = await readFile(new URL('../src/schemas/siklus-verval.ts', import.meta.url), 'utf8');

test('write proposal remains review-only and cannot execute a database write', () => {
  assert.match(sql, /NON-EXECUTABLE/i);
  assert.match(sql, /<APPROVED PARENT COLUMNS>/);
  assert.doesNotMatch(sql, /^\s*(?:insert\s+into|update\s+public\.|delete\s+from|create\s+(?:or\s+replace\s+)?function)\b/im);
  assert.match(proposal, /belum ada endpoint POST atau write database/i);
  assert.match(proposal, /contoh uji fixture, bukan/i);
});

test('RPC draft is entirely non-executable and contains no grants or RLS mutation', () => {
  const lines = sql.split(/\r?\n/).filter((line) => line.trim());
  assert.ok(lines.length > 20);
  assert.ok(lines.every((line) => /^\s*--/.test(line)), 'every draft line must remain a SQL comment');
  assert.doesNotMatch(sql, /\b(?:service_role|SUPABASE_SERVICE_ROLE_KEY)\b/i);
  assert.doesNotMatch(sql, /\b(?:ALTER\s+TABLE|CREATE\s+POLICY|DROP\s+POLICY|GRANT\s+EXECUTE|REVOKE\s+ALL)\b/i);
  assert.doesNotMatch(sql, /postgres(?:ql)?:\/\//i);
});

test('RPC draft orders authorization and package relationship checks before atomic inserts', () => {
  const orderedSteps = [
    'v_actor := auth.uid()',
    '<AUTHORIZATION CHECK:',
    '<VALIDATE INPUT:',
    '<ASSERT CYCLE OWNERSHIP:',
    '<ASSERT PACKAGE-CYCLE-SURVEY-TEAM-ROAD-PERSONNEL RELATIONSHIPS>',
    '<DUPLICATE CHECK USING APPROVED KEY',
    'INSERT INTO public.uji_konsistensi',
    'INSERT INTO public.uji_konsistensi_ulangan',
    'RETURN <GET-COMPATIBLE RESULT',
    'RAISE;\n-- END;',
  ];
  let lastPosition = -1;
  for (const step of orderedSteps) {
    const position = sql.indexOf(step);
    assert.ok(position > lastPosition, `RPC draft step out of order or absent: ${step}`);
    lastPosition = position;
  }
  assert.match(sql, /FK ke jenis_survei[\s\S]*?tidak cukup/i);
  assert.match(sql, /role writer yang DISETUJUI/i);
  assert.match(sql, /natural key\/idempotency policy/i);
  assert.match(sql, /exception yang tidak ditelan membatalkan parent dan/);
  assert.match(sql, /Jangan menyisipkan status keputusan atau actor column/i);
});

test('proposed contract rejects client-controlled actor/status and requires scoped authorization', () => {
  assert.match(proposal, /role penulis juga \*\*belum diputuskan\*\*/i);
  assert.match(proposal, /assignment\/scope paket/i);
  assert.match(proposal, /siklus milik paket/i);
  assert.match(proposal, /referensi survei\/ruas\/[\s\S]*?milik paket\/siklus yang sama/i);
  assert.match(proposal, /tidak menambah `pencatat_id`/i);
  assert.match(proposal, /status `null` dan tidak mengira kelulusan/i);
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
