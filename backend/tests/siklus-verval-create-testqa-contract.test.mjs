import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = (await readFile(new URL('../proposals/siklus-verval-create-testqa-rpc.sql', import.meta.url), 'utf8')).replace(/\r\n/g, '\n');
const allowlist = await readFile(new URL('../proposals/siklus-verval-testqa-allowlist.sql', import.meta.url), 'utf8');
const route = await readFile(new URL('../src/routes/siklus-verval.ts', import.meta.url), 'utf8');
const schema = await readFile(new URL('../src/schemas/siklus-verval.ts', import.meta.url), 'utf8');

test('test-only CREATE requires allowlist, owned provider and creates only the first cycle', () => {
  assert.match(sql, /auth\.uid\(\)/i);
  assert.match(sql, /r\.nama\s*=\s*'penyedia_jasa'/i);
  assert.match(sql, /v_package\.created_by\s+is\s+distinct\s+from\s+v_actor/i);
  assert.match(sql, /from\s+app_private\.siklus_verval_testqa_allowlist a[\s\S]*?where a\.paket_id\s*=\s*p_paket_id[\s\S]*?a\.aktif is true[\s\S]*?btrim\(a\.tujuan_pengujian\)[\s\S]*?for share/i);
  assert.doesNotMatch(sql, /p_paket_id\s+is\s+distinct\s+from\s+9/i);
  assert.match(sql, /where\s+paket_id\s*=\s*p_paket_id\s+for\s+update/i);
  const packageLock = sql.indexOf('where paket_id = p_paket_id\n  for update');
  const ownershipCheck = sql.indexOf('v_package.created_by is distinct from v_actor');
  const allowlistLock = sql.indexOf('select * into v_allowlist');
  const cycleInsert = sql.indexOf('insert into public.siklus_verval');
  assert.ok(packageLock >= 0 && packageLock < ownershipCheck);
  assert.ok(ownershipCheck < allowlistLock && allowlistLock < cycleInsert);
  assert.match(sql, /where\s+s\.paket_id\s*=\s*p_paket_id\s*\)\s*then[\s\S]*?sudah ada/i);
  assert.match(sql, /select\s+min\(s\.tanggal\)[\s\S]*?from public\.sesi_survei s[\s\S]*?where s\.paket_id\s*=\s*p_paket_id/i);
  assert.match(sql, /paket_id,\s*siklus_ke,\s*periode_mulai,\s*periode_selesai,[\s\S]*?jatuh_tempo,\s*panjang_periode_km,\s*status/i);
  assert.match(sql, /p_paket_id,\s*1,\s*v_tanggal_awal,\s*v_tanggal_awal\s*\+\s*13,[\s\S]*?null,\s*null,\s*null/i);
  assert.match(sql, /grant execute on function public\.buat_siklus_verval_testqa\(integer\) to authenticated/i);
  assert.doesNotMatch(sql, /insert into public\.(berita_acara|uji_konsistensi)|BA simulasi|approved|disetujui/i);
});

test('TEST/QA allowlist has explicit FK, active marker and purpose, with no authenticated write grant or seed', () => {
  assert.match(allowlist, /create table if not exists app_private\.siklus_verval_testqa_allowlist/i);
  assert.match(allowlist, /paket_id integer primary key references public\.paket_kontrak\(paket_id\)/i);
  assert.match(allowlist, /aktif boolean not null default false/i);
  assert.match(allowlist, /tujuan_pengujian text not null/i);
  assert.match(allowlist, /check \(length\(btrim\(tujuan_pengujian\)\) > 0\)/i);
  assert.match(allowlist, /enable row level security/i);
  assert.match(allowlist, /revoke all on table app_private\.siklus_verval_testqa_allowlist from public, anon, authenticated/i);
  assert.doesNotMatch(allowlist, /revoke all on schema app_private/i);
  assert.doesNotMatch(allowlist, /grant\s+.*(?:insert|update|delete)|insert into/i);
  assert.match(allowlist, /Tidak memasukkan Paket #9 atau paket lain/i);
});

test('CREATE HTTP route accepts only package ID and delegates to the TEST/QA RPC', () => {
  assert.match(route, /router\.post\('\/paket\/:id\/siklus-verval'/);
  assert.match(route, /\/rest\/v1\/rpc\/buat_siklus_verval_testqa/);
  assert.match(route, /p_paket_id:\s*packageId/);
  assert.match(schema, /siklusVervalCreateBodySchema\s*=\s*z\.object\(\{\}\)\.strict\(\)/);
});
