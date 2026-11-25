import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(new URL('../proposals/pemeriksaan-harian-alat-prototype.sql', import.meta.url), 'utf8');
const route = await readFile(new URL('../src/routes/survei.ts', import.meta.url), 'utf8');
const schema = await readFile(new URL('../src/schemas/survei.ts', import.meta.url), 'utf8');
const fixture = await readFile(new URL('./pemeriksaan-harian-alat-prototype.test.sql', import.meta.url), 'utf8');
const runner = await readFile(new URL('./survei-rpc-isolated.run.sql', import.meta.url), 'utf8');

test('prototype examination table has valid ownership FKs and unique per-item daily key', () => {
  assert.match(sql, /paket_id integer not null references public\.paket_kontrak\(paket_id\)/i);
  assert.match(sql, /alat_id integer not null references public\.alat_survei\(alat_id\)/i);
  assert.match(sql, /pencatat_id integer not null references public\.pengguna\(pengguna_id\)/i);
  assert.match(sql, /unique\s*\(paket_id,\s*alat_id,\s*tanggal,\s*item_pemeriksaan\)/i);
  assert.match(sql, /enable row level security/i);
  assert.match(sql, /revoke all on table app_private\.pemeriksaan_harian_alat_prototype from public, anon, authenticated/i);
});

test('prototype RPCs enforce authenticated package scope, provider ownership and assigned tool', () => {
  assert.match(sql, /security definer[\s\S]*?set search_path\s*=\s*''/i);
  assert.match(sql, /perform app_private\.assert_survei_read\(p_paket_id\)/i);
  assert.match(sql, /auth\.uid\(\)[\s\S]*?r\.nama\s*=\s*'penyedia_jasa'/i);
  assert.match(sql, /v_package\.created_by is distinct from v_actor/i);
  assert.match(sql, /t\.paket_id\s*=\s*p_paket_id[\s\S]*?a\.alat_id\s*=\s*p_alat_id[\s\S]*?pa\.mulai is null or pa\.mulai <= p_tanggal/i);
  assert.match(sql, /pencatat_id\s*\)[\s\S]*?v_actor/i);
  assert.match(sql, /grant execute on function public\.catat_pemeriksaan_harian_alat_prototype[^;]*to authenticated/i);
  assert.match(sql, /grant execute on function public\.baca_senarai_pemeriksaan_harian_alat_prototype[^;]*to authenticated/i);
});

test('prototype contract is strict and does not create QA/QC or approval effects', () => {
  assert.match(schema, /export const pemeriksaanHarianAlatPrototypeSchema = z\.object/);
  for (const value of ["z.enum(['GPS', 'BATERAI', 'PENYIMPANAN', 'BOUNCE_TEST_KELAS_I'])", "z.enum(['OK', 'BERMASALAH', 'TIDAK_DILAKUKAN'])", '}).strict();']) {
    assert.ok(schema.includes(value), `schema mesti mengandungi ${value}`);
  }
  assert.match(route, /router\.get\('\/paket\/:id\/pemeriksaan-harian-alat'/);
  assert.match(route, /router\.post\('\/paket\/:id\/pemeriksaan-harian-alat'/);
  assert.match(route, /Hanya Penyedia Jasa boleh mencatat pemeriksaan harian alat TEST\/QA/);
  assert.doesNotMatch(sql, /update public\.(sesi_survei|uji_coba|siklus_verval)|insert into public\.(berita_acara|siklus_verval)/i);
  assert.match(sql, /PROTOTYPE \/ TEST\/QA sahaja/i);
});

test('isolated fixture exercises success, duplicate, cross-package and invalid prototype cases then rolls back', () => {
  assert.match(runner, /Database ujian mesti kosong/i);
  assert.ok(runner.indexOf('../proposals/survei-sesi-rpc.sql') < runner.indexOf('../proposals/pemeriksaan-harian-alat-prototype.sql'));
  assert.ok(runner.indexOf('../proposals/pemeriksaan-harian-alat-prototype.sql') < runner.indexOf('pemeriksaan-harian-alat-prototype.test.sql'));
  assert.match(fixture, /catat_pemeriksaan_harian_alat_prototype\(\s*301, 801/i);
  assert.match(fixture, /duplikasi alat\/item\/tanggal/i);
  assert.match(fixture, /paket milik pengguna lain/i);
  assert.match(fixture, /item tidak dibenarkan/i);
  assert.match(runner, /rollback;/i);
});
