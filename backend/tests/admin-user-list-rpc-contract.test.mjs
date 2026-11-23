import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(new URL('../proposals/admin-user-list-rpc.sql', import.meta.url), 'utf8');
const executableSql = sql.replace(/^\s*--.*$/gm, '');
const functionDefinition = sql.slice(sql.indexOf('create function public.admin_daftar_pengguna'), sql.indexOf('$function$;'));

test('RPC takes only bounded listing inputs and verifies the live, unlocked Admin assignment', () => {
  assert.match(functionDefinition, /p_page integer default 1/i);
  assert.match(functionDefinition, /p_page_size integer default 25/i);
  assert.match(functionDefinition, /p_username_search text default null/i);
  const inputNames = [...functionDefinition.slice(0, functionDefinition.indexOf('returns table')).matchAll(/^\s*(p_[a-z_]+)\s/gm)].map(match => match[1]);
  assert.deepEqual(inputNames, ['p_page', 'p_page_size', 'p_username_search']);
  assert.match(functionDefinition, /v_auth_user_id := auth\.uid\(\)/i);
  assert.match(functionDefinition, /caller\.auth_user_id = v_auth_user_id/i);
  assert.match(functionDefinition, /not coalesce\(caller\.terkunci, false\)/i);
  assert.match(functionDefinition, /join public\.pengguna_peran/i);
  assert.match(functionDefinition, /join public\.peran/i);
  assert.match(functionDefinition, /caller_role\.nama = 'admin'/i);
  assert.match(functionDefinition, /errcode = '42501'/i);
  assert.match(functionDefinition, /errcode = '28000'/i);
});

test('RPC exposes only allowlisted user fields and role scopes; unassigned users get an empty role array', () => {
  const returnShape = functionDefinition.slice(functionDefinition.indexOf('returns table'), functionDefinition.indexOf('language plpgsql'));
  assert.match(returnShape, /pengguna_id integer[\s\S]*username text[\s\S]*terkunci boolean[\s\S]*peran jsonb/i);
  assert.doesNotMatch(returnShape, /email|password|mfa|token|metadata|auth_user_id/i);
  assert.match(functionDefinition, /'nama', assigned_role\.nama/i);
  assert.match(functionDefinition, /'scope_balai_id', assignment\.scope_balai_id/i);
  assert.match(functionDefinition, /'scope_paket_id', assignment\.scope_paket_id/i);
  assert.match(functionDefinition, /left join lateral/i);
  assert.match(functionDefinition, /coalesce\(assigned_roles\.peran, '\[\]'::jsonb\)/i);
  assert.match(functionDefinition, /order by target\.pengguna_id asc/i);
});

test('RPC bounds pages and treats username search wildcard characters literally', () => {
  assert.match(functionDefinition, /p_page > 1000000/i);
  assert.match(functionDefinition, /p_page_size > 100/i);
  assert.match(functionDefinition, /char_length\(pg_catalog\.btrim\(p_username_search\)\) > 100/i);
  assert.match(functionDefinition, /limit p_page_size[\s\S]*offset \(\(p_page - 1\) \* p_page_size\)/i);
  assert.match(functionDefinition, /target\.username ilike v_pattern escape/i);
  assert.match(functionDefinition, /pg_catalog\.replace\([\s\S]{0,200}'%'/i);
  assert.match(functionDefinition, /pg_catalog\.replace\([\s\S]{0,300}'_'/i);
});

test('candidate uses the installed definer ownership convention without a new elevated role', () => {
  assert.match(sql, /security definer[\s\S]*set search_path = ''/i);
  assert.match(sql, /same trusted[^\n]*\n-- migration owner used for the already-installed SECURITY DEFINER RPCs/i);
  assert.doesNotMatch(executableSql, /create role|bypassrls|alter function[\s\S]*owner to/i);
  assert.doesNotMatch(executableSql, /grant\s+(?:select|usage|create)[\s\S]*on\s+(?:table|schema)/i);
  assert.doesNotMatch(executableSql, /create policy|alter policy|drop policy/i);
});

test('only authenticated may execute the RPC; direct table SELECT privileges are not expanded', () => {
  assert.match(sql, /revoke all on function public\.admin_daftar_pengguna[\s\S]*from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function public\.admin_daftar_pengguna[\s\S]*to authenticated/i);
  assert.doesNotMatch(executableSql, /grant\s+select[\s\S]*on\s+table\s+public\.(?:pengguna|pengguna_peran|peran)/i);
  assert.doesNotMatch(executableSql, /grant execute on function public\.admin_daftar_pengguna[\s\S]*to\s+(?:public|anon)/i);
});
