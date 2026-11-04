import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(new URL('../proposals/data-segmen-rpc.sql', import.meta.url), 'utf8');
const fixture = await readFile(new URL('./survei-rpc-fixture.sql', import.meta.url), 'utf8');
const runner = await readFile(new URL('./survei-rpc-isolated.run.sql', import.meta.url), 'utf8');
const sessionFlow = await readFile(new URL('./survei-rpc-isolated.test.sql', import.meta.url), 'utf8');
const segmentFlow = await readFile(new URL('./data-segmen-rpc-isolated.test.sql', import.meta.url), 'utf8');

test('data-segment RPC binds package/session/road/type from database relationships', () => {
  assert.match(sql, /v_package\.created_by\s+is\s+distinct\s+from\s+v_actor/i);
  assert.match(sql, /sesi_id\s*=\s*p_sesi_id\s+and\s+paket_id\s*=\s*p_paket_id/i);
  assert.match(sql, /tim_id\s*=\s*v_session\.tim_id\s+and\s+paket_id\s*=\s*p_paket_id/i);
  assert.match(sql, /ruas_id\s*=\s*v_session\.ruas_id\s+and\s+balai_id\s*=\s*v_package\.balai_id/i);
  assert.match(sql, /jenis_survei_id\s*=\s*v_team\.jenis_survei_id/i);
  assert.match(sql, /v_session\.sesi_id,\s*v_survey_type\.jenis_survei_id,\s*v_road\.ruas_id/i);
});

test('data-segment RPC does not set QC or version lifecycle and scopes reads to session', () => {
  assert.match(sql, /insert into public\.data_segmen\s*\(\s*sesi_id,jenis_survei_id,ruas_id,sta_awal,sta_akhir,lajur,nilai_utama,atribut_detail,lat,lon\s*\)/i);
  assert.doesNotMatch(sql.match(/insert into public\.data_segmen\s*\(([\s\S]*?)\)\s*values/i)?.[1] ?? '', /status_qc|versi_aktif/i);
  assert.doesNotMatch(sql, /data_segmen_versi/i);
  assert.match(sql, /where d\.data_id\s*=\s*p_data_id\s+and s\.sesi_id\s*=\s*p_sesi_id/i);
  assert.match(sql, /r\.ruas_id\s*=\s*s\.ruas_id\s+and r\.ruas_id\s*=\s*d\.ruas_id\s+and r\.balai_id\s*=\s*p\.balai_id/i);
  assert.match(sql, /j\.jenis_survei_id\s*=\s*t\.jenis_survei_id\s+and j\.jenis_survei_id\s*=\s*d\.jenis_survei_id/i);
  assert.match(sql, /app_private\.assert_survei_read\(p_paket_id\)/i);
  assert.match(sql, /set search_path\s*=\s*''/i);
  assert.match(sql, /security definer/i);
  assert.match(sql, /revoke all on function public\.simpan_data_segmen/i);
  assert.match(sql, /grant execute on function public\.simpan_data_segmen[^;]*to authenticated/i);
});

test('isolated fixture contains synthetic approved and unapproved Tahap 2 relationships', () => {
  assert.match(fixture, /Jenis Survei Sintetik A/i);
  assert.match(fixture, /\(301, 401, 501, 101\)/);
  assert.match(fixture, /\(601, 301, 701\)/);
  assert.match(fixture, /\(801, 501, 701\)/);
  assert.match(fixture, /\(901, 601, 801/);
  assert.match(fixture, /\(1001, 401\)/);
  assert.match(fixture, /values \(401\), \(402\), \(999\)/);
  assert.match(fixture, /\(1101, 301, 601, 701, 801, 1001, 'DISETUJUI'\)/);
  assert.match(fixture, /\(1103, 301, 601, 701, 804, 1001, 'DRAFT'\)/);
});

test('isolated integration script loads dependent proposals in order and rolls back positive/negative flow', () => {
  assert.match(runner, /begin;/i);
  assert.ok(runner.indexOf('../proposals/survei-sesi-rpc.sql') < runner.indexOf('../proposals/data-segmen-rpc.sql'));
  assert.ok(runner.indexOf('../proposals/data-segmen-rpc.sql') < runner.indexOf('survei-rpc-isolated.test.sql'));
  assert.ok(runner.indexOf('survei-rpc-isolated.test.sql') < runner.indexOf('data-segmen-rpc-isolated.test.sql'));
  assert.match(runner, /rollback;/i);
  assert.match(runner, /Database ujian mesti kosong/i);
  assert.match(sessionFlow, /public\.simpan_sesi_survei\(301/i);
  assert.match(sessionFlow, /public\.baca_sesi_survei\(301/i);
  assert.match(sessionFlow, /'55000',[\s\S]*?Tahap 2 belum DISETUJUI/i);
  assert.match(sessionFlow, /'42501',[\s\S]*?paket milik pengguna lain/i);
  assert.match(segmentFlow, /public\.simpan_data_segmen\(301/i);
  assert.match(segmentFlow, /public\.baca_senarai_data_segmen\(301/i);
  assert.match(segmentFlow, /public\.baca_data_segmen\(301/i);
  assert.match(segmentFlow, /data segmen untuk paket milik orang lain/i);
});
