import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const route = readFileSync(resolve(root, 'src/routes/admin-role-management.ts'), 'utf8');
const service = readFileSync(resolve(root, 'src/services/supabase.ts'), 'utf8');
const api = parse(readFileSync(resolve(root, 'openapi.yaml'), 'utf8'));

test('role routes separate default-off authenticated read and write gates', () => {
  assert.match(route, /process\.env\.ADMIN_ROLE_MANAGEMENT_ENABLED === 'true'/);
  assert.match(route, /process\.env\.ADMIN_ROLE_READS_ENABLED === 'true'/);
  assert.match(route, /router\.use\('\/admin', requireAuth\)/);
  assert.match(route, /router\.get\('\/admin\/roles', admin\(readsEnabled\)/);
  assert.match(route, /router\.get\('\/admin\/users\/:pengguna_id\/roles', admin\(readsEnabled\)/);
  assert.match(route, /router\.post\('\/admin\/users\/:pengguna_id\/roles', admin\(writesEnabled\)/);
  assert.match(route, /router\.patch\('\/admin\/users\/:pengguna_id\/roles\/:pp_id', admin\(writesEnabled\)/);
  assert.match(route, /router\.delete\('\/admin\/users\/:pengguna_id\/roles\/:pp_id', admin\(writesEnabled\)/);
  assert.match(route, /identity\.token/);
  assert.match(route, /Cache-Control', 'private, no-store'/);
  assert.match(route, /ADMIN_ROLE_MANAGEMENT_DISABLED/);
  assert.match(route, /if \(!enabled\(\)\)[\s\S]*?return/);
});

test('RPC names and arguments match consolidated V1 signatures; role ID comes from approved catalog', () => {
  for (const name of ['admin_daftar_peran_dapat_ditugaskan', 'admin_daftar_penugasan_peran', 'admin_tambah_penugasan_peran', 'admin_ubah_penugasan_peran', 'admin_cabut_penugasan_peran']) assert.ok(route.includes(name));
  assert.match(route, /catalog\.find\(role => role\.nama_peran === 'pic_balai'\)/);
  assert.match(route, /p_expected_version: version/);
  assert.doesNotMatch(route, /p_peran_id:\s*\d+/);
});

test('IDs, strict nullable scope body and quoted signed-bigint If-Match are validated', () => {
  assert.match(route, /function positiveId/);
  assert.match(route, /function scopes/);
  assert.match(route, /function expectedVersion/);
  assert.match(route, /\^"\(\[1-9\]\\d\*\)"\$/);
  assert.match(route, /VERSION_MAX/);
});

test('known role RPC SQLSTATEs are mapped to safe public statuses and messages', () => {
  for (const code of ['28000', '42501', 'P0002', '40001', '23505', '22023', '22003', '23514', 'PGRST202']) assert.ok(service.includes(code));
  assert.match(service, /'40001', '23505', '23514'[\s\S]*?new ApiError\(409/);
  assert.match(service, /'22023', '22003'[\s\S]*?new ApiError\(400/);
  assert.match(service, /Permintaan manajemen peran gagal/);
  assert.doesNotMatch(service, /throw new ApiError\(500, failure\.message/);
});

test('OpenAPI marks all five operations implemented but disabled and documents If-Match', () => {
  const paths = api.paths;
  assert.ok(paths['/admin/roles'].get.description.includes('ADMIN_ROLE_READS_ENABLED=true'));
  assert.ok(paths['/admin/users/{pengguna_id}/roles'].get.description.includes('ADMIN_ROLE_READS_ENABLED=true'));
  for (const [path, method] of [['/admin/roles','get'], ['/admin/users/{pengguna_id}/roles','get'], ['/admin/users/{pengguna_id}/roles','post'], ['/admin/users/{pengguna_id}/roles/{pp_id}','patch'], ['/admin/users/{pengguna_id}/roles/{pp_id}','delete']]) {
    assert.match(paths[path][method].summary, /implemented; disabled by default/);
    assert.ok(paths[path][method].responses['503']);
  }
  assert.ok(paths['/admin/users/{pengguna_id}/roles/{pp_id}'].patch.parameters.some(p => p.name === 'If-Match' && p.required));
  assert.ok(paths['/admin/users/{pengguna_id}/roles/{pp_id}'].delete.parameters.some(p => p.name === 'If-Match' && p.required));
});
