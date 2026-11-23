import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const base = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(resolve(base, 'proposals/admin-role-management-v1-install.sql'), 'utf8');
const contract = readFileSync(resolve(base, 'proposals/admin-role-mutation-contract.md'), 'utf8');

test('single local package contains read and all three PIC assignment RPCs', () => {
  assert.match(sql, /COHERENT V1 INSTALLATION CANDIDATE ONLY\. DO NOT EXECUTE/);
  for (const rpc of ['admin_daftar_penugasan_peran', 'admin_tambah_penugasan_peran', 'admin_ubah_penugasan_peran', 'admin_cabut_penugasan_peran'])
    assert.match(sql, new RegExp(`create or replace function public\\.${rpc}`));
  assert.match(sql, /mutation_version text/);
  assert.match(sql, /assignment\.mutation_version::text/);
  assert.doesNotMatch(sql, /grant\s+(?:insert|update|delete|all)\s+on\s+table/i);
});

test('public RPCs delegate to JWT-derived active Admin check and use fixed-path definers', () => {
  for (const rpc of ['admin_daftar_penugasan_peran', 'admin_tambah_penugasan_peran', 'admin_ubah_penugasan_peran', 'admin_cabut_penugasan_peran']) {
    const pos = sql.indexOf(`create or replace function public.${rpc}`);
    const end = sql.indexOf('create or replace function', pos + 1);
    const body = sql.slice(pos, end < 0 ? undefined : end);
    assert.match(body, /public\.admin_role_mutation_authorize\(\)/);
    assert.match(body, /security definer[\s\S]*set search_path = ''/i);
  }
  assert.match(sql, /actor\.auth_user_id = auth\.uid\(\)/);
  assert.match(sql, /role_catalog\.nama = 'admin'/);
  assert.match(sql, /not coalesce\(actor\.terkunci, false\)/);
  assert.match(sql, /owner to postgres/);
  assert.doesNotMatch(sql, /service_role/i);
});

test('PG17 unique NULLS NOT DISTINCT index and all-writer version trigger protect concurrency', () => {
  assert.match(sql, /group by pengguna_id, peran_id, scope_balai_id, scope_paket_id[\s\S]*having count\(\*\) > 1/i);
  assert.match(sql, /nulls not distinct/i);
  assert.match(sql, /create trigger pengguna_peran_bump_mutation_version[\s\S]*before update on public\.pengguna_peran/i);
  assert.match(sql, /new\.mutation_version := old\.mutation_version \+ 1/i);
  assert.match(sql, /p_expected_version <> v_version/);
  assert.equal((sql.match(/pg_advisory_xact_lock\(74192031, 1\)/g) ?? []).length, 3);
});

test('V1 role/scope policy and atomic audit behavior are fail-closed', () => {
  assert.match(sql, /office\.aktif is true/);
  assert.match(sql, /package\.balai_id = p_scope_balai_id/);
  assert.match(sql, /ROLE_MUTATION_FORBIDDEN/);
  assert.match(sql, /SELF_CHANGE_FORBIDDEN/);
  assert.doesNotMatch(sql, /LAST_ACTIVE_ADMIN/);
  for (const action of ['ASSIGN_ROLE', 'CHANGE_ROLE_SCOPE', 'REVOKE_ROLE']) assert.match(sql, new RegExp(action));
  assert.equal((sql.match(/insert into public\.audit_trail/g) ?? []).length, 3);
  assert.match(contract, /transaction advisory lock/);
});

test('only function EXECUTE is granted; no direct table privileges or RLS edits', () => {
  assert.equal((sql.match(/grant execute on function public\.admin_/g) ?? []).length, 5);
  assert.match(sql, /grant execute on function public\.admin_daftar_peran_dapat_ditugaskan\(\) to authenticated/);
  assert.match(sql, /grant execute on function public\.admin_daftar_penugasan_peran\(integer\) to authenticated/);
  assert.doesNotMatch(sql, /grant\s+(?:select|insert|update|delete|all)\s+on\s+(?:table\s+)?public\./i);
  assert.doesNotMatch(sql, /create\s+policy|alter\s+policy|enable\s+row\s+level\s+security/i);
});
