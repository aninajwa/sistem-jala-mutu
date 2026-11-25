import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sql = readFileSync(resolve(root, 'proposals/admin-role-management-v1-install.sql'), 'utf8');
const contract = readFileSync(resolve(root, 'proposals/admin-role-mutation-contract.md'), 'utf8');
const openapi = parse(readFileSync(resolve(root, 'openapi.yaml'), 'utf8'));
const routeIndex = readFileSync(resolve(root, 'src/routes/index.ts'), 'utf8');
const userRoute = readFileSync(resolve(root, 'src/routes/admin-users.ts'), 'utf8');
const types = readFileSync(resolve(root, 'src/contracts/admin-role-assignments.ts'), 'utf8');

test('consolidated read RPC returns stable assignment identity and bigint as decimal text', () => {
  for (const field of ['pp_id integer', 'pengguna_id integer', 'peran_id integer', 'nama_peran text', 'scope_balai_id integer', 'scope_paket_id integer', 'mutation_version text']) assert.match(sql, new RegExp(field));
  assert.match(sql, /assignment\.mutation_version::text/);
  assert.match(sql, /order by assignment\.pp_id/);
  assert.match(types, /mutation_version: string/);
});

test('RPC independently requires authenticated unlocked Admin and safely handles target errors', () => {
  assert.match(sql, /auth\.uid\(\) is null[\s\S]*28000/);
  assert.match(sql, /actor\.auth_user_id = auth\.uid\(\)/);
  assert.match(sql, /not coalesce\(actor\.terkunci, false\)/);
  assert.match(sql, /role_catalog\.nama = 'admin'/);
  assert.match(sql, /USER_NOT_FOUND[\s\S]*P0002/);
  assert.match(sql, /INVALID_TARGET[\s\S]*22023/);
  assert.match(sql, /security definer[\s\S]*set search_path = ''/i);
});

test('least-privilege ACL changes only function EXECUTE and leaves RLS/table grants alone', () => {
  assert.match(sql, /owner to postgres/);
  assert.match(sql, /revoke all on function public\.admin_daftar_penugasan_peran\(integer\)[\s\S]*from public, anon, authenticated/);
  assert.match(sql, /grant execute on function public\.admin_daftar_penugasan_peran\(integer\)[\s\S]*to authenticated/);
  assert.doesNotMatch(sql, /grant\s+(?:select|insert|update|delete|all)\s+on\s+(?:table\s+)?public\./i);
  assert.doesNotMatch(sql, /create\s+policy|alter\s+policy|enable\s+row\s+level\s+security/i);
  assert.match(sql, /CANDIDATE ONLY; execute in the disposable PostgreSQL 17 test service, never in shared databases/);
});

test('OpenAPI defines implemented but disabled GET response and route is registered behind flag', () => {
  const endpoint = openapi.paths['/admin/users/{pengguna_id}/roles'];
  assert.ok(endpoint.get);
  assert.match(endpoint.get.description, /ADMIN_ROLE_MANAGEMENT_ENABLED=true/);
  assert.ok(endpoint.get.responses['200']);
  assert.ok(endpoint.get.responses['401']);
  assert.ok(endpoint.get.responses['403']);
  assert.ok(endpoint.get.responses['404']);
  assert.ok(endpoint.get.responses['503']);
  const schema = openapi.components.schemas.AdminUserRoleAssignment;
  assert.deepEqual(schema.required, ['pp_id', 'pengguna_id', 'peran_id', 'nama_peran', 'scope_balai_id', 'scope_paket_id', 'mutation_version']);
  assert.equal(schema.properties.mutation_version.type, 'string');
  assert.match(routeIndex, /adminRoleManagementRouter/);
  assert.match(userRoute, /admin\/users/);
  assert.match(contract, /GET \/api\/admin\/users\/:pengguna_id\/roles/);
  assert.match(types, /AdminUserRoleAssignmentsResponse/);
});
