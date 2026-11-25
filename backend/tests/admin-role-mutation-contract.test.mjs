import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const contract = readFileSync(resolve(root, 'proposals/admin-role-mutation-contract.md'), 'utf8');
const sql = readFileSync(resolve(root, 'proposals/admin-role-management-v1-install.sql'), 'utf8');
const openapi = parse(readFileSync(resolve(root, 'openapi.yaml'), 'utf8'));

test('contract defines add, scope-change, and revoke RPC signatures without enabling routes', () => {
  for (const name of ['admin_tambah_penugasan_peran', 'admin_ubah_penugasan_peran', 'admin_cabut_penugasan_peran']) assert.match(sql, new RegExp(name));
  assert.match(sql, /p_peran_id integer/);
  assert.match(sql, /p_expected_version bigint/);
  assert.match(contract, /changes scope only/i);
  assert.match(sql, /never in shared databases/);
  assert.match(sql, /No endpoint is registered by this SQL/i);
  assert.match(contract, /ADMIN_ROLE_MANAGEMENT_ENABLED=true/);
  assert.match(contract, /Routes fail-closed by default/i);
});

test('contract requires independent Admin authorization and atomic safety checks', () => {
  for (const requirement of [
    /auth\.uid\(\)/, /database independently resolves/i, /Self-protection/i,
    /Admin assignment revocation is disabled/i, /advisory lock/i, /one PostgreSQL transaction/i,
    /expected_version/i, /audit failure rolls back/i,
  ]) assert.match(contract + sql, requirement);
  assert.match(contract, /Never .*service-role/i);
});

test('role identifiers and authoritative Balai/package scope rules are explicit', () => {
  assert.match(contract, /peran_id.*catalog identifier/i);
  assert.match(sql, /office\.aktif is true/i);
  assert.match(contract, /`paket_kontrak\.balai_id` must equal the chosen Balai/i);
  assert.match(sql, /role_catalog\.peran_id/);
  assert.match(sql, /public\.paket_kontrak/);
});

test('version preconditions and audit projection are specified', () => {
  assert.match(contract, /mutation_version bigint NOT NULL DEFAULT 1/);
  assert.match(contract, /If-Match/);
  assert.match(sql, /p_expected_version bigint/);
  assert.match(sql, /target_pengguna_id/);
  assert.match(sql, /scope_balai_id/);
  assert.match(contract, /`record_id=pp_id::text`/);
});

test('contract and OpenAPI define required statuses and proposed operations', () => {
  for (const status of ['400', '401', '403', '404', '409', '200', '201', '204']) assert.match(contract, new RegExp(`\\| ${status} \\|`));
  const assignments = openapi.paths['/admin/users/{pengguna_id}/roles'];
  const assignment = openapi.paths['/admin/users/{pengguna_id}/roles/{pp_id}'];
  assert.ok(openapi.paths['/admin/roles'].get);
  assert.ok(assignments.get && assignments.post);
  assert.ok(assignment.patch && assignment.delete);
  assert.equal(assignments.post.responses['201'] !== undefined, true);
  assert.ok(assignment.patch.parameters.some(parameter => parameter.name === 'If-Match' && parameter.required));
  assert.ok(assignment.delete.parameters.some(parameter => parameter.name === 'If-Match' && parameter.required));
  assert.equal(assignment.patch.responses['200'] !== undefined, true);
  assert.equal(assignment.delete.responses['204'] !== undefined, true);
});
