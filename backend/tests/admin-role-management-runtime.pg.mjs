import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { Pool } from 'pg';

if (!process.env.ROLE_TEST_DATABASE_URL) {
  throw new Error('ROLE_TEST_DATABASE_URL is required; no PostgreSQL scenarios were run or skipped.');
}

const fixturePath = new URL('./admin-role-management-fixture.sql', import.meta.url);
const migrationPath = new URL('../proposals/admin-role-management-v1-install.sql', import.meta.url);
const adminAuthId = '00000000-0000-4000-8000-000000000001';
const picAuthId = '00000000-0000-4000-8000-000000000005';
let pool;

function testDatabaseUrl() {
  const raw = process.env.ROLE_TEST_DATABASE_URL;
  assert.ok(raw, 'ROLE_TEST_DATABASE_URL is required; no PostgreSQL scenarios were run or skipped.');
  const url = new URL(raw);
  assert.equal(url.protocol, 'postgres:', 'Runtime tests require PostgreSQL, not Supabase HTTP.');
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname), 'Refusing non-local database host; sandbox and shared databases are prohibited.');
  assert.equal(url.port || '5432', '5432', 'Runtime tests only permit the disposable local PostgreSQL service.');
  assert.equal(url.username, 'postgres', 'Fixture must run as disposable postgres superuser.');
  assert.equal(url.password, 'postgres', 'Only the workflow service test password is permitted.');
  assert.equal(url.pathname, '/role_management_test', 'Refusing any database other than role_management_test.');
  return url.toString();
}

async function runtimeSetup() {
  const client = await pool.connect();
  try {
    const identity = await client.query(`
      select current_database() as db, current_user as role,
             current_setting('server_version_num')::integer as version_num
    `);
    assert.equal(identity.rows[0].db, 'role_management_test', 'Connected database is not the disposable test DB.');
    assert.equal(identity.rows[0].role, 'postgres', 'Fixture setup requires postgres superuser.');
    assert.equal(Math.floor(identity.rows[0].version_num / 10000), 17, 'This runtime suite requires PostgreSQL 17 exactly.');
    const baseTables = await client.query(`
      select to_regclass('public.pengguna') as pengguna,
             to_regclass('public.peran') as peran,
             to_regclass('public.pengguna_peran') as pengguna_peran,
             to_regclass('public.balai') as balai,
             to_regclass('public.paket_kontrak') as paket_kontrak,
             to_regclass('public.audit_trail') as audit_trail
    `);
    assert.ok(Object.values(baseTables.rows[0]).every(value => value === null), 'Test database is not empty; refusing to modify it.');

    await client.query(await readFile(fixturePath, 'utf8'));
    await client.query(await readFile(migrationPath, 'utf8'));

    const readiness = await client.query(`
      select
        to_regprocedure('public.admin_tambah_penugasan_peran(integer,integer,integer,integer)') is not null as add_rpc,
        to_regprocedure('public.admin_ubah_penugasan_peran(integer,integer,bigint,integer,integer)') is not null as update_rpc,
        to_regprocedure('public.admin_cabut_penugasan_peran(integer,integer,bigint)') is not null as revoke_rpc,
        exists (select 1 from pg_trigger where tgname = 'pengguna_peran_bump_mutation_version' and not tgisinternal) as version_trigger,
        exists (select 1 from pg_indexes where schemaname = 'public' and indexname = 'pengguna_peran_assignment_nulls_not_distinct_uq') as duplicate_index
    `);
    assert.deepEqual(readiness.rows[0], { add_rpc: true, update_rpc: true, revoke_rpc: true, version_trigger: true, duplicate_index: true }, 'RPC/schema setup incomplete; tests must not silently skip.');
  } finally {
    client.release();
  }
}

async function withRpc(name, args, authId = adminAuthId, failAudit = false) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    await client.query('select set_config($1, $2, true)', ['request.jwt.claim.sub', authId ?? '']);
    await client.query('select set_config($1, $2, true)', ['test.admin_role_fail_audit', failAudit ? 'on' : 'off']);
    await client.query('set local role authenticated');
    const placeholders = args.map((_, index) => `$${index + 1}`).join(', ');
    const result = await client.query(`select * from public.${name}(${placeholders})`, args);
    await client.query('commit');
    return result.rows;
  } catch (error) {
    await client.query('rollback').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function add(userId, balaiId = 100, packageId = null, authId = adminAuthId, failAudit = false) {
  return withRpc('admin_tambah_penugasan_peran', [userId, 20, balaiId, packageId], authId, failAudit);
}

async function assignments(userId) {
  const { rows } = await pool.query('select * from public.pengguna_peran where pengguna_id = $1 order by pp_id', [userId]);
  return rows;
}

async function assignmentFor(userId, roleId = 20) {
  const { rows } = await pool.query('select * from public.pengguna_peran where pengguna_id = $1 and peran_id = $2 order by pp_id limit 1', [userId, roleId]);
  assert.equal(rows.length, 1, `Expected exactly one synthetic assignment for user ${userId}.`);
  return rows[0];
}

async function auditCount(action) {
  const { rows } = await pool.query('select count(*)::integer as count from public.audit_trail where aksi = $1', [action]);
  return rows[0].count;
}

before(async () => {
  pool = new Pool({ connectionString: testDatabaseUrl(), max: 6, connectionTimeoutMillis: 5000 });
  await runtimeSetup();
});

after(async () => {
  if (pool) await pool.end();
});

test('PostgreSQL 17 setup is real and all three installed-from-source RPCs are callable only by authenticated', async () => {
  const result = await withRpc('admin_daftar_peran_dapat_ditugaskan', []);
  assert.deepEqual(result, [{ peran_id: 20, nama_peran: 'pic_balai' }]);
  const { rows } = await pool.query(`
    select
      has_function_privilege('authenticated', 'public.admin_tambah_penugasan_peran(integer,integer,integer,integer)', 'execute') as add_exec,
      has_function_privilege('anon', 'public.admin_tambah_penugasan_peran(integer,integer,integer,integer)', 'execute') as add_anon_exec,
      has_function_privilege('authenticated', 'public.admin_ubah_penugasan_peran(integer,integer,bigint,integer,integer)', 'execute') as update_exec,
      has_function_privilege('anon', 'public.admin_ubah_penugasan_peran(integer,integer,bigint,integer,integer)', 'execute') as update_anon_exec,
      has_function_privilege('authenticated', 'public.admin_cabut_penugasan_peran(integer,integer,bigint)', 'execute') as revoke_exec,
      has_function_privilege('anon', 'public.admin_cabut_penugasan_peran(integer,integer,bigint)', 'execute') as revoke_anon_exec
  `);
  assert.deepEqual(rows[0], {
    add_exec: true, add_anon_exec: false,
    update_exec: true, update_anon_exec: false,
    revoke_exec: true, revoke_anon_exec: false,
  });
});

test('unauthenticated and non-Admin actors cannot add role assignments', async () => {
  await assert.rejects(add(10, 100, null, null), error => error.code === '28000');
  await assert.rejects(add(10, 100, null, picAuthId), error => error.code === '42501');
  assert.deepEqual(await assignments(10), []);
});

test('non-Admin cannot change or revoke assignments, and V1 cannot mutate a non-pic role', async () => {
  const targetAssignment = (await add(12))[0];
  await assert.rejects(withRpc('admin_ubah_penugasan_peran', [12, targetAssignment.pp_id, '1', 101, null], picAuthId), error => error.code === '42501');
  await assert.rejects(withRpc('admin_cabut_penugasan_peran', [12, targetAssignment.pp_id, '1'], picAuthId), error => error.code === '42501');

  const adminAssignment = await assignmentFor(4, 10);
  await assert.rejects(withRpc('admin_ubah_penugasan_peran', [4, adminAssignment.pp_id, adminAssignment.mutation_version, 100, null]), error => error.code === '42501');
  await assert.rejects(withRpc('admin_cabut_penugasan_peran', [4, adminAssignment.pp_id, adminAssignment.mutation_version]), error => error.code === '42501');
});

test('Admin can add Balai-wide and package-scoped pic_balai assignments and writes audit rows', async () => {
  const auditBefore = await auditCount('ASSIGN_ROLE');
  const wide = (await add(10))[0];
  const packageScoped = (await add(11, 101, 1001))[0];
  assert.equal(wide.mutation_version, '1');
  assert.equal(packageScoped.scope_paket_id, 1001);
  assert.equal(packageScoped.scope_balai_id, 101);
  assert.equal(await auditCount('ASSIGN_ROLE'), auditBefore + 2);
});

test('V1 rejects non-pic roles, self-changes, and locked targets', async () => {
  await assert.rejects(withRpc('admin_tambah_penugasan_peran', [12, 10, 100, null]), error => error.code === '42501');
  await assert.rejects(add(1), error => error.code === '42501');
  await assert.rejects(add(3), error => error.code === '42501');
  const own = await assignmentFor(1);
  await assert.rejects(withRpc('admin_ubah_penugasan_peran', [1, own.pp_id, own.mutation_version, 101, null]), error => error.code === '42501');
  await assert.rejects(withRpc('admin_cabut_penugasan_peran', [1, own.pp_id, own.mutation_version]), error => error.code === '42501');
  const locked = await assignmentFor(3);
  await assert.rejects(withRpc('admin_ubah_penugasan_peran', [3, locked.pp_id, locked.mutation_version, 101, null]), error => error.code === '42501');
});

test('Admin cannot revoke a pic_balai assignment from a locked target', async () => {
  const lockedBefore = await assignmentFor(3);
  const revokeAuditBefore = await auditCount('REVOKE_ROLE');

  await assert.rejects(
    withRpc('admin_cabut_penugasan_peran', [3, lockedBefore.pp_id, lockedBefore.mutation_version]),
    error => error.code === '42501',
  );

  const lockedAfter = await assignmentFor(3);
  assert.deepEqual(lockedAfter, lockedBefore);
  assert.equal(lockedAfter.mutation_version, lockedBefore.mutation_version);
  assert.equal(await auditCount('REVOKE_ROLE'), revokeAuditBefore);
});

test('Balai and package scope checks reject missing, inactive, and cross-Balai references', async () => {
  await assert.rejects(add(22, 999), error => error.code === 'P0002');
  await assert.rejects(add(22, 102), error => error.code === '23514');
  await assert.rejects(add(22, 100, 999), error => error.code === 'P0002');
  await assert.rejects(add(22, 100, 1001), error => error.code === '23514');
  assert.deepEqual(await assignments(22), []);
});

test('scope update advances mutation_version, audits atomically, and rejects stale If-Match version', async () => {
  await add(13);
  const initial = await assignmentFor(13);
  await assert.rejects(withRpc('admin_ubah_penugasan_peran', [13, initial.pp_id, '1', 100, 1001]), error => error.code === '23514');
  assert.deepEqual(await assignmentFor(13), initial);
  const changed = (await withRpc('admin_ubah_penugasan_peran', [13, initial.pp_id, '1', 101, null]))[0];
  assert.equal(changed.mutation_version, '2');
  assert.equal(changed.scope_balai_id, 101);
  const auditBeforeStale = await auditCount('CHANGE_ROLE_SCOPE');
  await assert.rejects(withRpc('admin_ubah_penugasan_peran', [13, initial.pp_id, '1', 100, null]), error => error.code === '40001');
  assert.equal(await auditCount('CHANGE_ROLE_SCOPE'), auditBeforeStale);
});

test('two concurrent updates using the same expected version have exactly one winner', async () => {
  await add(14);
  const row = await assignmentFor(14);
  const operations = await Promise.allSettled([
    withRpc('admin_ubah_penugasan_peran', [14, row.pp_id, '1', 101, null]),
    withRpc('admin_ubah_penugasan_peran', [14, row.pp_id, '1', 100, 1000]),
  ]);
  assert.equal(operations.filter(result => result.status === 'fulfilled').length, 1);
  const rejected = operations.find(result => result.status === 'rejected');
  assert.equal(rejected.reason.code, '40001');
  assert.equal((await assignmentFor(14)).mutation_version, '2');
});

test('duplicate assignments are rejected sequentially and under two-connection concurrency', async () => {
  await add(15);
  await assert.rejects(add(15), error => error.code === '23505');

  const duplicateRace = await Promise.allSettled([add(16), add(16)]);
  assert.equal(duplicateRace.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(duplicateRace.filter(result => result.status === 'rejected' && result.reason.code === '23505').length, 1);
  assert.equal((await assignments(16)).length, 1);
});

test('Admin can revoke a pic_balai assignment with the current version; stale revoke is rejected', async () => {
  await add(17);
  const row = await assignmentFor(17);
  const revoked = await withRpc('admin_cabut_penugasan_peran', [17, row.pp_id, '1']);
  assert.deepEqual(revoked, [{ pp_id: row.pp_id, revoked: true }]);
  assert.deepEqual(await assignments(17), []);
  assert.equal(await auditCount('REVOKE_ROLE'), 1);

  await add(18);
  const staleRow = await assignmentFor(18);
  await withRpc('admin_ubah_penugasan_peran', [18, staleRow.pp_id, '1', 101, null]);
  await assert.rejects(withRpc('admin_cabut_penugasan_peran', [18, staleRow.pp_id, '1']), error => error.code === '40001');
  assert.equal((await assignments(18)).length, 1);
});

test('audit insert failure rolls back add, update, and revoke in PostgreSQL', async () => {
  const addAuditBefore = await auditCount('ASSIGN_ROLE');
  await assert.rejects(add(19, 100, null, adminAuthId, true), error => error.code === 'P0001');
  assert.deepEqual(await assignments(19), []);
  assert.equal(await auditCount('ASSIGN_ROLE'), addAuditBefore);

  await add(20);
  const updateBefore = await assignmentFor(20);
  const updateAuditBefore = await auditCount('CHANGE_ROLE_SCOPE');
  await assert.rejects(withRpc('admin_ubah_penugasan_peran', [20, updateBefore.pp_id, '1', 101, null], adminAuthId, true), error => error.code === 'P0001');
  assert.deepEqual(await assignmentFor(20), updateBefore);
  assert.equal(await auditCount('CHANGE_ROLE_SCOPE'), updateAuditBefore);

  await add(21);
  const revokeBefore = await assignmentFor(21);
  const revokeAuditBefore = await auditCount('REVOKE_ROLE');
  await assert.rejects(withRpc('admin_cabut_penugasan_peran', [21, revokeBefore.pp_id, '1'], adminAuthId, true), error => error.code === 'P0001');
  assert.deepEqual(await assignmentFor(21), revokeBefore);
  assert.equal(await auditCount('REVOKE_ROLE'), revokeAuditBefore);
});
