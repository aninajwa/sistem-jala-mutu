import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:http';
import { setTimeout as delay } from 'node:timers/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const adminIdentity = {
  pengguna_id: 900,
  auth_user_id: '00000000-0000-4000-8000-000000000900',
  username: 'synthetic-admin',
  terkunci: false,
  penugasan: [{ peran_id: 2, scope_balai_id: null, scope_paket_id: null }],
  peran: [{ peran_id: 2, nama: 'admin' }],
};
const picIdentity = {
  pengguna_id: 901,
  auth_user_id: '00000000-0000-4000-8000-000000000901',
  username: 'synthetic-pic',
  terkunci: false,
  penugasan: [{ peran_id: 1, scope_balai_id: 101, scope_paket_id: null }],
  peran: [{ peran_id: 1, nama: 'pic_balai' }],
};

function clone(value) { return structuredClone(value); }

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let text = '';
  for await (const chunk of req) text += chunk;
  return text ? JSON.parse(text) : {};
}

test('isolated HTTP mock exercises Admin PIC assignment mutations and security', async () => {
  const calls = [];
  const audit = [];
  let nextAssignmentId = 799;
  let assignments = [
    { pp_id: 701, pengguna_id: 1004, peran_id: 2, scope_balai_id: null, scope_paket_id: null, mutation_version: '1' },
    { pp_id: 702, pengguna_id: 1004, peran_id: 20, scope_balai_id: 999, scope_paket_id: null, mutation_version: '9' },
    { pp_id: 703, pengguna_id: 900, peran_id: 2, scope_balai_id: null, scope_paket_id: null, mutation_version: '1' },
  ];

  const mock = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    const token = /^Bearer\s+(.+)$/i.exec(req.headers.authorization ?? '')?.[1] ?? '';
    calls.push({ method: req.method, path: url.pathname, token, remoteAddress: req.socket.remoteAddress });
    if (url.pathname === '/auth/v1/user' && req.method === 'GET') {
      const identity = token === 'admin-fixture' ? adminIdentity : token === 'pic-fixture' ? picIdentity : null;
      return identity
        ? send(res, 200, { id: identity.auth_user_id, email: `${identity.username}@fixture.invalid` })
        : send(res, 401, { code: 'invalid_token' });
    }
    if (url.pathname === '/rest/v1/rpc/authenticated_identity_self' && req.method === 'POST') {
      const identity = token === 'admin-fixture' ? adminIdentity : token === 'pic-fixture' ? picIdentity : null;
      return identity ? send(res, 200, [identity]) : send(res, 401, { code: '28000' });
    }
    if (url.pathname.startsWith('/storage/')) return send(res, 500, { message: 'Storage must not be called in role mutation simulation' });
    if (!url.pathname.startsWith('/rest/v1/rpc/admin_') || req.method !== 'POST') {
      return send(res, 404, { code: 'not_found' });
    }

    const args = await readJson(req);
    const acting = token === 'admin-fixture' ? adminIdentity : token === 'pic-fixture' ? picIdentity : null;
    if (!acting || !acting.peran.some(role => role.nama === 'admin')) return send(res, 403, { code: '42501' });

    if (url.pathname.endsWith('/admin_daftar_peran_dapat_ditugaskan')) {
      return send(res, 200, [{ peran_id: 20, nama_peran: 'pic_balai' }]);
    }
    if (url.pathname.endsWith('/admin_tambah_penugasan_peran')) {
      if (args.p_pengguna_id === acting.pengguna_id || args.p_pengguna_id === 1005 || args.p_peran_id !== 20) {
        return send(res, 403, { code: '42501' });
      }
      if (assignments.some(row => row.pengguna_id === args.p_pengguna_id && row.peran_id === args.p_peran_id)) {
        return send(res, 409, { code: '23505' });
      }
      const row = {
        pp_id: ++nextAssignmentId,
        pengguna_id: args.p_pengguna_id,
        peran_id: args.p_peran_id,
        scope_balai_id: args.p_scope_balai_id,
        scope_paket_id: args.p_scope_paket_id,
        mutation_version: '1',
      };
      assignments.push(row);
      audit.push('ASSIGN_ROLE');
      return send(res, 200, [{ ...row }]);
    }
    if (url.pathname.endsWith('/admin_ubah_penugasan_peran')) {
      const row = assignments.find(item => item.pp_id === args.p_pp_id && item.pengguna_id === args.p_pengguna_id);
      if (!row) return send(res, 404, { code: 'P0002' });
      if (row.pengguna_id === acting.pengguna_id || row.pengguna_id === 1005 || row.peran_id !== 20) {
        return send(res, 403, { code: '42501' });
      }
      if (String(args.p_expected_version) !== row.mutation_version) return send(res, 409, { code: '40001' });
      row.scope_balai_id = args.p_scope_balai_id;
      row.scope_paket_id = args.p_scope_paket_id;
      row.mutation_version = String(BigInt(row.mutation_version) + 1n);
      audit.push('CHANGE_ROLE_SCOPE');
      return send(res, 200, [{ ...row }]);
    }
    if (url.pathname.endsWith('/admin_cabut_penugasan_peran')) {
      const row = assignments.find(item => item.pp_id === args.p_pp_id && item.pengguna_id === args.p_pengguna_id);
      if (!row) return send(res, 404, { code: 'P0002' });
      if (row.pengguna_id === acting.pengguna_id || row.peran_id !== 20) return send(res, 403, { code: '42501' });
      if (String(args.p_expected_version) !== row.mutation_version) return send(res, 409, { code: '40001' });
      assignments = assignments.filter(item => item.pp_id !== row.pp_id);
      audit.push('REVOKE_ROLE');
      return send(res, 200, [{ pp_id: row.pp_id, revoked: true }]);
    }
    return send(res, 404, { code: 'rpc_not_found' });
  });
  mock.listen(0, '127.0.0.1');
  await once(mock, 'listening');
  const upstreamPort = mock.address().port;

  let child;
  let apiBase;
  async function startBackend(writesEnabled) {
    const probe = createServer();
    probe.listen(0, '127.0.0.1');
    await once(probe, 'listening');
    const port = probe.address().port;
    await new Promise((resolveClose, rejectClose) => probe.close(error => error ? rejectClose(error) : resolveClose()));
    child = spawn(process.execPath, [resolve(backendRoot, 'dist/index.mjs')], {
      cwd: backendRoot,
      env: {
        ...process.env,
        PORT: String(port),
        SUPABASE_URL: `http://127.0.0.1:${upstreamPort}`,
        SUPABASE_PUBLISHABLE_KEY: 'local-fixture-only',
        ADMIN_SANDBOX_QA: 'false',
        ADMIN_ROLE_READS_ENABLED: 'true',
        ADMIN_ROLE_MANAGEMENT_ENABLED: writesEnabled ? 'true' : 'false',
        LOG_LEVEL: 'silent',
        NODE_ENV: 'production',
      },
      stdio: 'ignore',
    });
    apiBase = `http://127.0.0.1:${port}/api`;
    for (let attempt = 0; attempt < 80; attempt++) {
      if (child.exitCode !== null) throw new Error(`Isolated backend exited during startup (${child.exitCode}).`);
      try {
        const response = await fetch(`${apiBase}/healthz`);
        if (response.ok) return;
      } catch {}
      await delay(50);
    }
    throw new Error('Isolated backend did not become ready.');
  }
  async function stopBackend() {
    if (!child || child.exitCode !== null) return;
    child.kill();
    await Promise.race([once(child, 'exit'), delay(3000)]);
    child = null;
  }
  async function request(path, { token = 'admin-fixture', method = 'GET', body, headers = {} } = {}) {
    const response = await fetch(`${apiBase}${path}`, {
      method,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const payload = response.status === 204 ? null : await response.json();
    return { status: response.status, payload };
  }

  try {
    const untouchedBefore = clone(assignments.filter(row => row.pengguna_id !== 1003));

    await startBackend(false);
    const rpcCallsAtGateStart = calls.filter(call => call.path.startsWith('/rest/v1/rpc/admin_')).length;
    for (const [method, path, body, headers] of [
      ['POST', '/admin/users/1003/roles', { scope_balai_id: 101, scope_paket_id: null }, {}],
      ['PATCH', '/admin/users/1004/roles/702', { scope_balai_id: 102, scope_paket_id: null }, { 'If-Match': '"9"' }],
      ['DELETE', '/admin/users/1004/roles/702', undefined, { 'If-Match': '"9"' }],
    ]) {
      const result = await request(path, { method, body, headers });
      assert.equal(result.status, 503, `closed gate must reject ${method}`);
      assert.equal(result.payload.code, 'ADMIN_ROLE_MANAGEMENT_DISABLED');
    }
    assert.equal(calls.filter(call => call.path.startsWith('/rest/v1/rpc/admin_')).length, rpcCallsAtGateStart, 'gate-off mutations must not call any role-management RPC');
    await stopBackend();

    await startBackend(true);
    const beforeUnauthenticated = calls.length;
    for (const [method, path, body, headers] of [
      ['POST', '/admin/users/1003/roles', { scope_balai_id: 101, scope_paket_id: null }, {}],
      ['PATCH', '/admin/users/1004/roles/702', { scope_balai_id: 102, scope_paket_id: null }, { 'If-Match': '"9"' }],
      ['DELETE', '/admin/users/1004/roles/702', undefined, { 'If-Match': '"9"' }],
    ]) assert.equal((await request(path, { token: null, method, body, headers })).status, 401);
    assert.equal(calls.length, beforeUnauthenticated, 'missing bearer token must be rejected before upstream requests');

    const beforePicRpc = calls.filter(call => call.path.startsWith('/rest/v1/rpc/admin_')).length;
    for (const [method, path, body, headers] of [
      ['POST', '/admin/users/1003/roles', { scope_balai_id: 101, scope_paket_id: null }, {}],
      ['PATCH', '/admin/users/1004/roles/702', { scope_balai_id: 102, scope_paket_id: null }, { 'If-Match': '"9"' }],
      ['DELETE', '/admin/users/1004/roles/702', undefined, { 'If-Match': '"9"' }],
    ]) assert.equal((await request(path, { token: 'pic-fixture', method, body, headers })).status, 403);
    assert.equal(calls.filter(call => call.path.startsWith('/rest/v1/rpc/admin_')).length, beforePicRpc, 'PIC requests must fail before Admin RPCs');

    const add = await request('/admin/users/1003/roles', {
      method: 'POST', body: { scope_balai_id: 101, scope_paket_id: null },
    });
    assert.equal(add.status, 201);
    assert.equal(add.payload.data.pengguna_id, 1003);
    assert.equal(add.payload.data.nama_peran, 'pic_balai');
    assert.equal(add.payload.data.scope_balai_id, 101);
    assert.equal(add.payload.data.mutation_version, '1');
    const assignmentId = add.payload.data.pp_id;

    const targetAfterAdd = assignments.find(row => row.pengguna_id === 1003 && row.pp_id === assignmentId);
    assert.ok(targetAfterAdd);
    const stalePatch = await request(`/admin/users/1003/roles/${assignmentId}`, {
      method: 'PATCH', body: { scope_balai_id: 103, scope_paket_id: null }, headers: { 'If-Match': '"8"' },
    });
    assert.equal(stalePatch.status, 409);
    assert.deepEqual(assignments.find(row => row.pp_id === assignmentId), targetAfterAdd);
    const staleDelete = await request(`/admin/users/1003/roles/${assignmentId}`, {
      method: 'DELETE', headers: { 'If-Match': '"8"' },
    });
    assert.equal(staleDelete.status, 409);
    assert.deepEqual(assignments.find(row => row.pp_id === assignmentId), targetAfterAdd);

    const patch = await request(`/admin/users/1003/roles/${assignmentId}`, {
      method: 'PATCH', body: { scope_balai_id: 102, scope_paket_id: null }, headers: { 'If-Match': '"1"' },
    });
    assert.equal(patch.status, 200);
    assert.equal(patch.payload.data.scope_balai_id, 102);
    assert.equal(patch.payload.data.mutation_version, '2');
    const staleDeleteAfterUpdate = await request(`/admin/users/1003/roles/${assignmentId}`, {
      method: 'DELETE', headers: { 'If-Match': '"1"' },
    });
    assert.equal(staleDeleteAfterUpdate.status, 409);

    const revoke = await request(`/admin/users/1003/roles/${assignmentId}`, {
      method: 'DELETE', headers: { 'If-Match': '"2"' },
    });
    assert.equal(revoke.status, 204);
    assert.deepEqual(assignments.filter(row => row.pengguna_id === 1003), []);
    assert.deepEqual(audit, ['ASSIGN_ROLE', 'CHANGE_ROLE_SCOPE', 'REVOKE_ROLE']);

    const locked = await request('/admin/users/1005/roles', {
      method: 'POST', body: { scope_balai_id: 101, scope_paket_id: null },
    });
    assert.equal(locked.status, 403);
    assert.equal(assignments.some(row => row.pengguna_id === 1005), false);

    for (const [method, path, body, headers] of [
      ['PATCH', '/admin/users/1004/roles/701', { scope_balai_id: 102, scope_paket_id: null }, { 'If-Match': '"1"' }],
      ['DELETE', '/admin/users/1004/roles/701', undefined, { 'If-Match': '"1"' }],
    ]) assert.equal((await request(path, { method, body, headers })).status, 403, 'non-pic role assignments must be immutable');

    const selfAdd = await request('/admin/users/900/roles', {
      method: 'POST', body: { scope_balai_id: 101, scope_paket_id: null },
    });
    assert.equal(selfAdd.status, 403);
    const selfPatch = await request('/admin/users/900/roles/703', {
      method: 'PATCH', body: { scope_balai_id: 102, scope_paket_id: null }, headers: { 'If-Match': '"1"' },
    });
    assert.equal(selfPatch.status, 403);

    assert.deepEqual(assignments.filter(row => row.pengguna_id !== 1003 && row.pengguna_id !== 1005), untouchedBefore);
    assert.deepEqual(audit, ['ASSIGN_ROLE', 'CHANGE_ROLE_SCOPE', 'REVOKE_ROLE'], 'rejected operations must not produce audit events');
    assert.equal(calls.some(call => call.path.startsWith('/storage/')), false, 'role assignment simulation must not touch Storage');
    assert.ok(calls.length > 0 && calls.every(call => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(call.remoteAddress)), 'all upstream calls must be loopback-only');
  } finally {
    await stopBackend();
    await new Promise(resolveClose => mock.close(resolveClose));
  }
});
