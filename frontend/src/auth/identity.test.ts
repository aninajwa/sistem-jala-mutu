import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignedRoles, type Identity } from './identity';
const identity: Identity = { pengguna_id: 3, auth_user_id: 'user-1', username: 'test', email: 'test@example.com', terkunci: false, peran: [{ peran_id: 1, nama: 'pic_balai' }, { peran_id: 2, nama: 'admin' }], penugasan: [{ peran_id: 1, scope_balai_id: 18, scope_paket_id: null }] };
test('only assigned roles can be selected even if the server returns the entire role catalog', () => assert.deepEqual(assignedRoles(identity, 'user-1'), ['PIC Balai / Pengguna Jasa']));
test('locked, wrong identity and unassigned profiles are refused', () => {
  assert.throws(() => assignedRoles({ ...identity, terkunci: true }, 'user-1'));
  assert.throws(() => assignedRoles(identity, 'other-user'));
  assert.throws(() => assignedRoles({ ...identity, penugasan: [] }, 'user-1'));
});
test('pimpinan retains its separate read-only role', () => assert.deepEqual(assignedRoles({ ...identity, peran: [{ peran_id: 1, nama: 'pimpinan' }] }, 'user-1'), ['Pimpinan']));
