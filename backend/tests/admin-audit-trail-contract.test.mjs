import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sql = await readFile(new URL('../proposals/admin-audit-trail-read-rpc.sql', import.meta.url), 'utf8');
const deploymentSql = await readFile(new URL('../proposals/admin-audit-role-labels-deploy.sql', import.meta.url), 'utf8');
const definition = sql.slice(sql.indexOf('create or replace function'), sql.indexOf('$function$;'));

test('audit read proposal requires an active Admin and bounded pagination/search', () => {
  assert.match(definition, /auth\.uid\(\) is null/);
  assert.match(definition, /role_catalog\.nama\s*=\s*'admin'/);
  assert.match(definition, /not coalesce\(caller\.terkunci, false\)/);
  assert.match(definition, /p_page_size > 100/);
  assert.match(definition, /p_page > 1000000/);
  assert.match(definition, /\(p_page::bigint - 1\) \* p_page_size::bigint/);
  assert.match(definition, /length\(v_search\) > 100/);
  assert.match(definition, /nullif\(btrim\(p_search\), ''\)/);
});

test('audit proposal preserves exact timestamp and actor column semantics without timezone conversion', () => {
  assert.match(definition, /waktu timestamp without time zone/);
  assert.match(definition, /pengguna_id integer/);
  assert.match(definition, /event\.waktu as waktu/);
  assert.match(definition, /event\.pengguna_id::integer as pengguna_id/);
  assert.doesNotMatch(definition, /coalesce\(event\.(?:waktu|pengguna_id)/i);
  assert.doesNotMatch(definition, /::\s*timestamptz|timezone\s*\(/i);
  assert.match(definition, /safe_events\.waktu desc nulls last/);
  assert.match(sql, /timezone-free\s+local timestamp string/i);
});

test('audit bigint is serialized as decimal text all the way through the API contract', async () => {
  const route = await readFile(new URL('../src/routes/admin-audit-trail.ts', import.meta.url), 'utf8');
  const openapi = await readFile(new URL('../openapi.yaml', import.meta.url), 'utf8');
  const frontend = await readFile(new URL('../../frontend/src/pages/AdminAuditTrailPage.tsx', import.meta.url), 'utf8');
  assert.match(definition, /returns table\s*\([\s\S]*trail_id text/i);
  assert.match(definition, /safe_events\.trail_id::text/);
  assert.match(route, /trail_id: string/);
  assert.match(frontend, /trail_id: string/);
  assert.match(openapi, /trail_id:\s*\n\s*type: string\s*\n\s*pattern: "\^\[0-9\]\+\$"/);
});

test('audit read proposal labels all three role mutation actions', () => {
  assert.match(definition, /when 'ASSIGN_ROLE' then 'Tetapkan peran'/);
  assert.match(definition, /when 'CHANGE_ROLE_SCOPE' then 'Ubah cakupan peran'/);
  assert.match(definition, /when 'REVOKE_ROLE' then 'Cabut peran'/);
});

test('older label deployment proposal is blocked because its bigint return type is obsolete', () => {
  assert.match(deploymentSql, /SUPERSEDED \/ DO NOT EXECUTE/);
  assert.doesNotMatch(deploymentSql, /create or replace function|drop function|\bgrant\b|\brevoke\b/i);
});

test('audit read proposal exposes only safe allowlisted categories, never raw audit payloads', () => {
  assert.match(definition, /returns table\s*\([\s\S]*trail_id text[\s\S]*waktu timestamp without time zone[\s\S]*pengguna_id integer[\s\S]*tabel text[\s\S]*aksi text[\s\S]*ringkasan text/i);
  assert.match(definition, /from public\.audit_trail as event/);
  assert.match(definition, /case event\.tabel::text/);
  assert.match(definition, /case event\.aksi::text/);
  const outputProjection = definition.slice(definition.indexOf('select\n      safe_events.trail_id'), definition.indexOf('from safe_events'));
  assert.match(outputProjection, /safe_events\.(?:tabel|aksi)/);
  assert.doesNotMatch(outputProjection, /event\.(?:tabel|aksi|nilai_lama|nilai_baru|record_id|ip_address|auth_user_id)/i);
  assert.doesNotMatch(definition, /event\.(?:nilai_lama|nilai_baru|record_id|ip_address|auth_user_id)/i);
  assert.match(definition, /else 'Data aplikasi lain'/);
  assert.match(definition, /else 'Aktivitas lain'/);
  assert.match(definition, /'Aktivitas ' \|\| lower\(safe_events\.aksi\) \|\| ' pada ' \|\| lower\(safe_events\.tabel\)/);
});

test('audit read proposal is scoped to authenticated execution and leaves table policies/grants alone', () => {
  assert.match(sql, /security definer/i);
  assert.match(sql, /set search_path = ''/i);
  assert.match(sql, /if current_user <> 'postgres'/i);
  assert.match(sql, /owner to postgres/i);
  assert.match(sql, /revoke all on function[\s\S]*from public, anon, authenticated/i);
  assert.match(sql, /grant execute on function[\s\S]*to authenticated/i);
  assert.doesNotMatch(sql, /grant\s+select\s+on\s+table\s+public\.audit_trail/i);
  assert.doesNotMatch(sql, /alter table public\.audit_trail/i);
});
