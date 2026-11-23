import { apiRequest, ApiError } from '../auth/client';
import type { AdminRoleAssignment, PicScopePreview } from './adminAccessModel';

export function canMutateAssignment(assignment: AdminRoleAssignment, actorId: number | null, targetId: number, picRoleId?: number) {
  return actorId !== null && targetId !== actorId && assignment.pengguna_id === targetId && assignment.nama_peran === 'pic_balai' && (picRoleId === undefined || assignment.peran_id === picRoleId);
}

export function adminRoleMutationsEnabled(value: string | undefined) { return value === 'true'; }

export function mutationErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Sesi berakhir. Masuk kembali; perubahan tidak dapat dipastikan. Muat ulang data sebelum mencoba lagi.';
    if (error.status === 403) return 'Akses ditolak. Hanya Admin berwenang yang dapat mengubah penugasan.';
    if (error.status === 404) return 'Pengguna atau penugasan tidak ditemukan. Muat ulang daftar sebelum mencoba lagi.';
    if (error.status === 409) return 'Data penugasan berubah sejak dimuat (konflik versi). Muat ulang penugasan lalu tinjau kembali perubahan.';
    if (error.status === 503) return 'Mutasi penugasan sedang dinonaktifkan oleh server. Tidak ada perubahan yang dapat dilakukan.';
    return error.message || `Permintaan gagal (${error.status}).`;
  }
  return error instanceof Error ? error.message : 'Perubahan gagal. Muat ulang penugasan sebelum mencoba lagi.';
}

type MutationResponse = { data: AdminRoleAssignment };
type Requester = <T>(path: string, init?: RequestInit) => Promise<T>;

export async function savePicAssignment(targetId: number, assignment: AdminRoleAssignment | undefined, scope: Extract<PicScopePreview, { valid: true }>, request: Requester = apiRequest, picRoleId?: number) {
  const body = JSON.stringify({ scope_balai_id: scope.scope_balai_id, scope_paket_id: scope.scope_paket_id });
  if (assignment) {
    if (assignment.pengguna_id !== targetId || assignment.nama_peran !== 'pic_balai' || (picRoleId !== undefined && assignment.peran_id !== picRoleId)) throw new Error('Hanya penugasan pic_balai pengguna lain yang dapat diubah.');
    if (!/^[1-9]\d*$/.test(assignment.mutation_version)) throw new Error('Versi penugasan tidak valid. Muat ulang data.');
    return request<MutationResponse>(`/admin/users/${targetId}/roles/${assignment.pp_id}`, {
      method: 'PATCH', headers: { 'If-Match': `"${assignment.mutation_version}"` }, body,
    });
  }
  return request<MutationResponse>(`/admin/users/${targetId}/roles`, { method: 'POST', body });
}

export async function revokePicAssignment(targetId: number, assignment: AdminRoleAssignment, request: Requester = apiRequest, picRoleId?: number) {
  if (assignment.pengguna_id !== targetId || assignment.nama_peran !== 'pic_balai' || (picRoleId !== undefined && assignment.peran_id !== picRoleId)) throw new Error('Hanya penugasan pic_balai pengguna lain yang dapat dicabut.');
  if (!/^[1-9]\d*$/.test(assignment.mutation_version)) throw new Error('Versi penugasan tidak valid. Muat ulang data.');
  await request<void>(`/admin/users/${targetId}/roles/${assignment.pp_id}`, {
    method: 'DELETE', headers: { 'If-Match': `"${assignment.mutation_version}"` },
  });
}
