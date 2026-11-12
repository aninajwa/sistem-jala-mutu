import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = (await readFile(new URL('../proposals/stage4-lrs-save-read-candidate.sql', import.meta.url), 'utf8')).replace(/\r\n/g, '\n');
const between = (start, end) => sql.slice(sql.indexOf(start), sql.indexOf(end));

test('negative authorization contract: unauthenticated, locked, foreign provider and out-of-scope Balai cannot pass', () => {
  const access = between('create or replace function app_private.assert_validasi_lrs_access', 'create or replace function app_private.baca_validasi_lrs');
  assert.match(access, /auth\.uid\(\) is null[\s\S]*42501/);
  assert.match(access, /auth_user_id=auth\.uid\(\) and not coalesce\(terkunci,false\)/);
  assert.match(access, /p\.created_by is distinct from u\.pengguna_id/);
  assert.match(access, /r\.nama='penyedia_jasa'/);
  assert.match(access, /r\.nama='pic_balai'[\s\S]*pp\.scope_balai_id=p\.balai_id/);
  assert.match(access, /pp\.scope_paket_id is null or pp\.scope_paket_id=p_paket_id/);
  assert.match(sql, /where v\.paket_id=p_paket_id\),'\[\]'::jsonb/);
  assert.match(sql, /join public\.ruas_jalan r on r\.ruas_id=v\.ruas_id and r\.balai_id=p\.balai_id/);
});

test('definer and execute boundary: postgres owns fixed-search-path definers; anonymous/public/helper access is revoked', () => {
  assert.match(sql, /current_user <> 'postgres'/);
  assert.match(sql, /security definer set search_path = ''/);
  for (const signature of [
    'alter function app_private.assert_validasi_lrs_access(integer,boolean) owner to postgres',
    'alter function app_private.baca_validasi_lrs(integer) owner to postgres',
    'alter function app_private.simpan_validasi_lrs(integer,integer,integer,jsonb) owner to postgres',
  ]) assert.ok(sql.includes(signature));
  assert.match(sql, /revoke all on function app_private\.assert_validasi_lrs_access\(integer,boolean\) from public,anon,authenticated/);
  assert.match(sql, /revoke all on function public\.simpan_validasi_lrs\(integer,integer,integer,jsonb\) from public,anon,authenticated,service_role/);
  assert.match(sql, /grant execute on function public\.simpan_validasi_lrs\(integer,integer,integer,jsonb\) to authenticated/);
});

test('optimistic version and concurrent first insert are serialized and uniqueness is enforced', () => {
  const save = between('create or replace function app_private.simpan_validasi_lrs', 'create or replace function public.baca_validasi_lrs');
  assert.match(sql, /create unique index validasi_lrs_paket_ruas_uq[\s\S]*on public\.validasi_lrs\(paket_id,ruas_id\)/);
  assert.match(save, /pg_advisory_xact_lock\(hashtextextended\(p_paket_id::text\|\|':'\|\|p_ruas_id::text,0\)\)/);
  assert.ok(save.indexOf('pg_advisory_xact_lock') < save.indexOf('from public.validasi_lrs where paket_id=p_paket_id and ruas_id=p_ruas_id for update'));
  assert.match(save, /p_expected_version<>0[\s\S]*errcode='40001'/);
  assert.match(save, /current_version<>p_expected_version[\s\S]*errcode='40001'/);
  assert.match(save, /next_version:=current_version\+1/);
});

test('audit is in the same transaction and uses verified sequence/columns; an audit error aborts the save', () => {
  const save = between('create or replace function app_private.simpan_validasi_lrs', 'create or replace function public.baca_validasi_lrs');
  assert.match(sql, /begin;[\s\S]*commit;/);
  assert.match(save, /insert into public\.audit_trail\(trail_id,pengguna_id,tabel,record_id,aksi,nilai_lama,nilai_baru,waktu\)/);
  assert.match(save, /nextval\('public\.audit_trail_trail_id_seq'::regclass\)/);
  assert.match(save, /return after_value/);
  assert.doesNotMatch(save.slice(save.indexOf('insert into public.audit_trail')), /exception when others/);
});
