export interface AdminUserRoleAssignment {
  pp_id: number;
  pengguna_id: number;
  peran_id: number;
  nama_peran: string;
  scope_balai_id: number | null;
  scope_paket_id: number | null;
  mutation_version: string;
}

export interface AdminUserRoleAssignmentsResponse {
  data: AdminUserRoleAssignment[];
}

export interface AdminRoleAssignmentsError {
  code: 'UNAUTHENTICATED' | 'FORBIDDEN' | 'INVALID_TARGET' | 'USER_NOT_FOUND' | 'ADMIN_ASSIGNMENTS_UNAVAILABLE';
  error: string;
}