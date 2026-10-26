import { describe, expect, it } from 'vitest';

import { diraRoleForServerRoles, serverRoleToDiraRole } from './roleMapping';

describe('Pemetaan peran server ke role UI Dira', () => {
  const PERAN_RESMI = ['penyedia_jasa', 'pic_balai', 'direktorat', 'admin'] as const;

  it('Empat peran resmi dipetakan khusus, tidak lebih', () => {
    expect(Object.keys(serverRoleToDiraRole).sort()).toEqual([...PERAN_RESMI].sort());
    expect(serverRoleToDiraRole.penyedia_jasa).toBe('Penyedia Jasa / Ketua Tim');
    expect(serverRoleToDiraRole.pic_balai).toBe('PIC Balai / Pengguna Jasa');
    expect(serverRoleToDiraRole.direktorat).toBe('Direktorat / Pusat');
    expect(serverRoleToDiraRole.admin).toBe('Admin');
  });

  it('Peran tidak resmi tidak ada di kamus', () => {
    expect('pimpinan' in serverRoleToDiraRole).toBe(false);
    expect('validator' in serverRoleToDiraRole).toBe(false);
    expect('validator_direktorat' in serverRoleToDiraRole).toBe(false);
  });

  it('Satu nama peran server diubah ke label Dira', () => {
    expect(diraRoleForServerRoles('penyedia_jasa')).toBe('Penyedia Jasa / Ketua Tim');
    expect(diraRoleForServerRoles('pic_balai')).toBe('PIC Balai / Pengguna Jasa');
  });

  it('Kumpulan peran memakai peran pertama yang dikenali', () => {
    expect(diraRoleForServerRoles(['dp_tidak_ada', 'direktorat', 'admin'])).toBe('Direktorat / Pusat');
    expect(diraRoleForServerRoles(['penyedia_jasa', 'admin'])).toBe('Penyedia Jasa / Ketua Tim');
  });

  it('Bentuk array objek dari /api/me (peran: [{nama}]) juga diterima', () => {
    expect(
      diraRoleForServerRoles([{ peran_id: 3, nama: 'penyedia_jasa' }]),
    ).toBe('Penyedia Jasa / Ketua Tim');
    expect(
      diraRoleForServerRoles([
        { peran_id: 3, nama: 'penyedia_jasa' },
        { peran_id: 1, nama: 'pic_balai' },
      ]),
    ).toBe('Penyedia Jasa / Ketua Tim');
  });

  it('Spasi tidak mengganggu', () => {
    expect(diraRoleForServerRoles(' pic_balai ')).toBe('PIC Balai / Pengguna Jasa');
  });

  it('Null, kosong, atau peran tidak dikenal menghasilkan null', () => {
    expect(diraRoleForServerRoles(null)).toBeNull();
    expect(diraRoleForServerRoles(undefined)).toBeNull();
    expect(diraRoleForServerRoles([])).toBeNull();
    expect(diraRoleForServerRoles('validator')).toBeNull();
    expect(diraRoleForServerRoles('pimpinan')).toBeNull();
    expect(diraRoleForServerRoles('validator_direktorat')).toBeNull();
    expect(diraRoleForServerRoles('role_ngasal')).toBeNull();
  });
});
