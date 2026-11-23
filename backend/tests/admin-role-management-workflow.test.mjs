import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workflowText = readFileSync(resolve(root, '../.github/workflows/admin-role-management-postgres17.yml'), 'utf8');
const workflow = parse(workflowText);
const runtime = readFileSync(resolve(root, 'tests/admin-role-management-runtime.pg.mjs'), 'utf8');
const fixture = readFileSync(resolve(root, 'tests/admin-role-management-fixture.sql'), 'utf8');
const candidate = readFileSync(resolve(root, 'proposals/admin-role-management-v1-install.sql'), 'utf8');

test('manual workflow uses only an ephemeral PostgreSQL 17 service and runtime test', () => {
  assert.match(workflowText, /^on:\s*\r?\n\s+workflow_dispatch:/m);
  assert.equal(workflow.jobs['role-management-runtime'].services.postgres.image, 'postgres:17');
  assert.match(workflow.jobs['role-management-runtime'].steps.at(-1).run, /node --test tests\/admin-role-management-runtime\.pg\.mjs/);
  assert.doesNotMatch(workflowText, /SUPABASE|service_role|deployment|deploy/i);
  assert.doesNotMatch(workflowText, /\$\{\{\s*secrets\./i);
});

test('runtime suite installs and calls the actual V1 SQL source, with hard database safety checks', () => {
  assert.match(runtime, /admin-role-management-v1-install\.sql/);
  for (const rpc of ['admin_tambah_penugasan_peran', 'admin_ubah_penugasan_peran', 'admin_cabut_penugasan_peran']) {
    assert.match(runtime, new RegExp(`public\\.${rpc}`));
    assert.match(candidate, new RegExp(`create or replace function public\\.${rpc}`));
  }
  assert.match(runtime, /ROLE_TEST_DATABASE_URL/);
  assert.match(runtime, /127\.0\.0\.1.*localhost/);
  assert.match(runtime, /role_management_test/);
  assert.match(runtime, /server_version_num/);
  assert.match(runtime, /must not contain application tables|Test database is not empty/);
});

test('synthetic fixture provides auth.uid, caller roles, required relations and audit-failure trigger', () => {
  for (const source of [
    /create function auth\.uid\(\)/,
    /request\.jwt\.claim\.sub/,
    /create role authenticated nologin/,
    /create table public\.pengguna_peran/,
    /create table public\.audit_trail/,
    /references public\.balai/,
    /references public\.paket_kontrak/,
    /admin_role_test_fail_audit_before_insert/,
    /synthetic audit insert failure/,
  ]) assert.match(fixture, source);
});

test('runtime matrix contains authorization, scope, duplicate, version, concurrency, and audit rollback cases', () => {
  for (const scenario of [
    /unauthenticated and non-Admin actors/,
    /self-changes, and locked targets/,
    /Balai and package scope checks/,
    /mutation_version, audits atomically, and rejects stale/,
    /two concurrent updates using the same expected version/,
    /duplicate assignments are rejected sequentially and under two-connection concurrency/,
    /can revoke a pic_balai assignment/,
    /audit insert failure rolls back add, update, and revoke/,
  ]) assert.match(runtime, scenario);
});
