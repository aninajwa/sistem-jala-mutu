export type AdminAccessRole = {
  nama: string;
  scope_balai_id: number | null;
  scope_paket_id: number | null;
};

export type AdminAccessUser = {
  pengguna_id: number;
  username: string;
  terkunci: boolean | null;
  peran: AdminAccessRole[];
};

export type AdminRoleCatalogEntry = { peran_id: number; nama_peran: string };
export type AdminRoleAssignment = {
  pp_id: number;
  pengguna_id: number;
  peran_id: number;
  nama_peran: string;
  scope_balai_id: number | null;
  scope_paket_id: number | null;
  mutation_version: string;
};

export type PicScopeDraft = { scope_balai_id: string; scope_paket_id: string };
export type PicScopePreview = { valid: true; scope_balai_id: number; scope_paket_id: number | null } | { valid: false; message: string };

export function validatePicScopeDraft(draft: PicScopeDraft): PicScopePreview {
  const balai = draft.scope_balai_id.trim();
  const paket = draft.scope_paket_id.trim();
  if (!/^\d+$/.test(balai) || !Number.isSafeInteger(Number(balai)) || Number(balai) < 1)
    return { valid: false, message: 'Masukkan ID Balai berupa bilangan bulat positif.' };
  if (paket && (!/^\d+$/.test(paket) || !Number.isSafeInteger(Number(paket)) || Number(paket) < 1))
    return { valid: false, message: 'ID paket harus kosong atau bilangan bulat positif.' };
  return { valid: true, scope_balai_id: Number(balai), scope_paket_id: paket ? Number(paket) : null };
}

export function isPicBalaiMutationRole(role: string) { return role === 'pic_balai'; }

export function canViewAdminAccess(role: string) {
  return role === 'Admin';
}
