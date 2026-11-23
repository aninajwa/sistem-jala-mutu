import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ApiError } from '../auth/client';
import { AdminAccessAssignments, AdminAccessPreview, AdminAccessResults } from './AdminAccessPage';
import { canViewAdminAccess, isPicBalaiMutationRole, validatePicScopeDraft, type AdminAccessUser, type AdminRoleAssignment } from './adminAccessModel';
import { adminRoleMutationsEnabled, canMutateAssignment, mutationErrorMessage, revokePicAssignment, savePicAssignment } from './adminAccessMutations';

const rpcShapeFixture: AdminAccessUser = {
  pengguna_id: 17,
  username: 'fixture-user',
  terkunci: false,
  peran: [{ nama: 'pic_balai', scope_balai_id: 4, scope_paket_id: null }],
};
const assignmentFixture: AdminRoleAssignment = {
  pp_id: 91,
  pengguna_id: 17,
  peran_id: 1,
  nama_peran: 'pic_balai',
  scope_balai_id: 4,
  scope_paket_id: null,
  mutation_version: '3',
};

describe('Admin Hak Akses read-only view', () => {
  it('allows only the Admin role into the access view', () => {
    expect(canViewAdminAccess('Admin')).toBe(true);
    expect(canViewAdminAccess('Penyedia Jasa / Ketua Tim')).toBe(false);
    expect(canViewAdminAccess('PIC Balai / Pengguna Jasa')).toBe(false);
    expect(canViewAdminAccess('Direktorat / Pusat')).toBe(false);
  });

  it('renders role and exact returned Balai/package scopes, without mutation actions', () => {
    const html = renderToStaticMarkup(<AdminAccessResults state="ready" users={[rpcShapeFixture]} error="" />);
    expect(html).toContain('fixture-user');
    expect(html).toContain('pic_balai');
    expect(html).toContain('<td>4</td>');
    expect(html).toContain('<td>—</td>');
    expect(html).toContain('Aktif');
    expect(html).not.toMatch(/Simpan|Ubah peran|Cabut peran/);
  });

  it('renders live selected-user assignment role and scopes from the assignment read shape', () => {
    const html = renderToStaticMarkup(<AdminAccessAssignments state="ready" assignments={[assignmentFixture]} error="" />);
    expect(html).toContain('pic_balai');
    expect(html).toContain('<td>4</td>');
    expect(html).toContain('Semua paket di Balai');
    expect(html).not.toMatch(/Simpan|Hapus|Cabut/);
  });

  it('preserves selected-assignment loading, error, and empty states', () => {
    expect(renderToStaticMarkup(<AdminAccessAssignments state="loading" assignments={[]} error="" />)).toContain('Memuat penugasan tersimpan');
    expect(renderToStaticMarkup(<AdminAccessAssignments state="error" assignments={[]} error="RPC unavailable" />)).toContain('RPC unavailable');
    expect(renderToStaticMarkup(<AdminAccessAssignments state="ready" assignments={[]} error="" />)).toContain('belum memiliki penugasan');
  });

  it('renders loading, error, and empty states distinctly', () => {
    expect(renderToStaticMarkup(<AdminAccessResults state="loading" users={[]} error="" />)).toContain('Memuat penugasan peran');
    expect(renderToStaticMarkup(<AdminAccessResults state="error" users={[]} error="Tidak dapat dimuat." />)).toContain('Tidak dapat dimuat.');
    expect(renderToStaticMarkup(<AdminAccessResults state="ready" users={[]} error="" />)).toContain('Tidak ada pengguna yang cocok.');
  });

  it('shows a live-read-backed, explicitly unsaved preview layout with forbidden roles disabled', () => {
    const html = renderToStaticMarkup(<AdminAccessPreview users={[rpcShapeFixture]} />);
    expect(html).toContain('Pilih pengguna dari data Admin');
    expect(html).toContain('Perubahan lokal');
    expect(html).toContain('belum disimpan');
    expect(html).toContain('tidak diizinkan di V1');
    expect(html).not.toMatch(/<button[^>]*>(Simpan|Hapus|Cabut)/);
  });

  it('validates local PIC scope input without asserting database existence or activity', () => {
    expect(validatePicScopeDraft({ scope_balai_id: '4', scope_paket_id: '' })).toEqual({ valid: true, scope_balai_id: 4, scope_paket_id: null });
    expect(validatePicScopeDraft({ scope_balai_id: '', scope_paket_id: '' }).valid).toBe(false);
    expect(validatePicScopeDraft({ scope_balai_id: '4.2', scope_paket_id: '' }).valid).toBe(false);
    expect(validatePicScopeDraft({ scope_balai_id: '4', scope_paket_id: '-1' }).valid).toBe(false);
  });

  it('allows only pic_balai assignments belonging to another user', () => {
    expect(isPicBalaiMutationRole('pic_balai')).toBe(true);
    for (const role of ['admin', 'direktorat', 'penyedia_jasa', 'pimpinan']) expect(isPicBalaiMutationRole(role)).toBe(false);
    expect(canMutateAssignment(assignmentFixture, 3, 17)).toBe(true);
    expect(canMutateAssignment(assignmentFixture, 17, 17)).toBe(false);
    expect(canMutateAssignment({ ...assignmentFixture, nama_peran: 'admin' }, 3, 17)).toBe(false);
    expect(canMutateAssignment(assignmentFixture, null, 17)).toBe(false);
  });

  it('uses stable server assignment IDs and a quoted decimal If-Match version for change and revoke', async () => {
    const requests: Array<{ path: string; init?: RequestInit }> = [];
    const request = async <T,>(path: string, init?: RequestInit) => { requests.push({ path, init }); return { data: assignmentFixture } as T; };
    await savePicAssignment(17, assignmentFixture, { valid: true, scope_balai_id: 8, scope_paket_id: null }, request);
    await revokePicAssignment(17, assignmentFixture, request);
    expect(requests[0].path).toBe('/admin/users/17/roles/91');
    expect(requests[0].init?.method).toBe('PATCH');
    expect(new Headers(requests[0].init?.headers).get('If-Match')).toBe('"3"');
    expect(requests[0].init?.body).toBe(JSON.stringify({ scope_balai_id: 8, scope_paket_id: null }));
    expect(requests[1].init?.method).toBe('DELETE');
    expect(new Headers(requests[1].init?.headers).get('If-Match')).toBe('"3"');
  });

  it('uses POST only for a new assignment and defaults the separate frontend gate off', async () => {
    const requests: Array<{ path: string; init?: RequestInit }> = [];
    const request = async <T,>(path: string, init?: RequestInit) => { requests.push({ path, init }); return { data: assignmentFixture } as T; };
    await savePicAssignment(17, undefined, { valid: true, scope_balai_id: 8, scope_paket_id: 2 }, request);
    expect(requests[0].path).toBe('/admin/users/17/roles');
    expect(requests[0].init?.method).toBe('POST');
    expect(adminRoleMutationsEnabled(undefined)).toBe(false);
    expect(adminRoleMutationsEnabled('false')).toBe(false);
    expect(adminRoleMutationsEnabled('true')).toBe(true);
  });

  it('maps session, authorization, missing, stale-version, and disabled errors safely', () => {
    for (const [status, expected] of [[401, 'Sesi berakhir'], [403, 'Akses ditolak'], [404, 'tidak ditemukan'], [409, 'konflik versi'], [503, 'dinonaktifkan']] as const) {
      expect(mutationErrorMessage(new ApiError(status, 'server detail'))).toContain(expected);
    }
  });

  it('labels users without role assignments without inventing a role', () => {
    const html = renderToStaticMarkup(<AdminAccessResults state="ready" users={[{ ...rpcShapeFixture, peran: [] }]} error="" />);
    expect(html).toContain('Belum ada peran');
    expect(html).not.toContain('pic_balai');
  });
});
