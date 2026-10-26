import type { WorkflowRole } from '../workflow/model';
export interface Identity {
  pengguna_id: number;
  auth_user_id: string;
  username: string;
  email: string;
  terkunci: boolean | null;
  peran: Array<{ peran_id: number; nama: string }>;
  penugasan: Array<{ peran_id: number; scope_balai_id: number | null; scope_paket_id: number | null }>;
}
export const roleMapping: Record<string, WorkflowRole | 'Pimpinan'> = {
  penyedia_jasa: 'Penyedia Jasa / Ketua Tim',
  pic_balai: 'PIC Balai / Pengguna Jasa',
  direktorat: 'Direktorat / Pusat',
  pimpinan: 'Pimpinan',
  admin: 'Admin',
};
export function assignedRoles(identity: Identity, authUserId: string) {
  if (identity.auth_user_id !== authUserId || identity.terkunci) throw new Error('Profil tidak sesuai atau akun terkunci.');
  const assigned = new Set(identity.penugasan.map(item => item.peran_id));
  const roles = [...new Set(identity.peran.filter(item => assigned.has(item.peran_id))
    .map(item => roleMapping[item.nama.toLowerCase()]).filter((role): role is WorkflowRole | 'Pimpinan' => !!role))];
  if (!roles.length) throw new Error('Akun belum memiliki peran yang didukung. Hubungi admin untuk memeriksa penugasan.');
  return roles;
}
