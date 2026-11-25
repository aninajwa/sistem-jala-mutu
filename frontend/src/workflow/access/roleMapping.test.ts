import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { diraRoleForServerRoles, serverRoleToDiraRole } from './roleMapping';

describe('Pemetaan peran server ke role UI Dira', () => {
  const PERAN_RESMI = ['penyedia_jasa', 'pic_balai', 'direktorat', 'admin'] as const;

  it('Empat peran resmi dipetakan khusus, tidak lebih', () => {
    assert.deepEqual(Object.keys(serverRoleToDiraRole).sort(), [...PERAN_RESMI].sort());
    assert.equal(serverRoleToDiraRole.penyedia_jasa, 'Penyedia Jasa / Ketua Tim');
    assert.equal(serverRoleToDiraRole.pic_balai, 'PIC Balai / Pengguna Jasa');
    assert.equal(serverRoleToDiraRole.direktorat, 'Direktorat / Pusat');
    assert.equal(serverRoleToDiraRole.admin, 'Admin');
  });

  it('Peran tidak resmi tidak ada di kamus', () => {
    assert.equal('pimpinan' in serverRoleToDiraRole, false);
    assert.equal('validator' in serverRoleToDiraRole, false);
    assert.equal('validator_direktorat' in serverRoleToDiraRole, false);
  });

  it('Satu nama peran server diubah ke label Dira', () => {
    assert.equal(diraRoleForServerRoles('penyedia_jasa'), 'Penyedia Jasa / Ketua Tim');
    assert.equal(diraRoleForServerRoles('pic_balai'), 'PIC Balai / Pengguna Jasa');
  });

  it('Kumpulan peran memakai peran pertama yang dikenali', () => {
    assert.equal(diraRoleForServerRoles(['dp_tidak_ada', 'direktorat', 'admin']), 'Direktorat / Pusat');
    assert.equal(diraRoleForServerRoles(['penyedia_jasa', 'admin']), 'Penyedia Jasa / Ketua Tim');
  });

  it('Bentuk array objek dari /api/me (peran: [{nama}]) juga diterima', () => {
    assert.equal(
      diraRoleForServerRoles([{ peran_id: 3, nama: 'penyedia_jasa' }]),
    'Penyedia Jasa / Ketua Tim');
    assert.equal(
      diraRoleForServerRoles([
        { peran_id: 3, nama: 'penyedia_jasa' },
        { peran_id: 1, nama: 'pic_balai' },
      ]),
    'Penyedia Jasa / Ketua Tim');
  });

  it('Spasi tidak mengganggu', () => {
    assert.equal(diraRoleForServerRoles(' pic_balai '), 'PIC Balai / Pengguna Jasa');
  });

  it('Null, kosong, atau peran tidak dikenal menghasilkan null', () => {
    assert.equal(diraRoleForServerRoles(null), null);
    assert.equal(diraRoleForServerRoles(undefined), null);
    assert.equal(diraRoleForServerRoles([]), null);
    assert.equal(diraRoleForServerRoles('validator'), null);
    assert.equal(diraRoleForServerRoles('pimpinan'), null);
    assert.equal(diraRoleForServerRoles('validator_direktorat'), null);
    assert.equal(diraRoleForServerRoles('role_ngasal'), null);
  });
});
