import { adminAccessRoles, type AdminAccessRole } from './accessPolicy';

/** Session-only preparation records. Never an authenticated account or entitlement. */
export type ProposedAssignment = {
  role: AdminAccessRole;
  scopeType: 'balai' | 'paket' | 'nasional' | 'sistem';
  scopeRef: string;
};
export type AccountDraft = {
  id: string;
  username: string;
  email: string;
  organization: string;
  assignments: ProposedAssignment[];
  createdAt: string;
};
export const ACCOUNT_DRAFT_KEY = 'jala-admin-account-proposals-session-v1';
export const scopeForRole: Record<AdminAccessRole, readonly ProposedAssignment['scopeType'][]> = {
  'Penyedia Jasa / Ketua Tim': ['paket'],
  'PIC Balai / Pengguna Jasa': ['balai', 'paket'],
  'Direktorat / Pusat': ['nasional'],
  'Admin': ['sistem'],
};
export const scopeLabels: Record<ProposedAssignment['scopeType'], string> = {
  balai: 'Balai', paket: 'Paket', nasional: 'Nasional', sistem: 'Sistem',
};
const tidy = (v: string) => v.trim();
export type AccountDraftInput = Omit<AccountDraft, 'id' | 'createdAt'>;
export function validateAccountDraft(input: AccountDraftInput, existing: readonly AccountDraft[]): string | null {
  const user = tidy(input.username);
  const email = tidy(input.email).toLowerCase();
  if (!/^[a-zA-Z0-9._-]{3,64}$/.test(user)) return 'Username harus 3–64 karakter (huruf, angka, titik, garis bawah, atau tanda hubung).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return 'Alamat email tidak valid.';
  if (tidy(input.organization).length < 2) return 'Nama instansi/organisasi wajib diisi.';
  if (existing.some(x => x.username.toLowerCase() === user.toLowerCase())) return 'Username sudah digunakan pada usulan yang tersedia.';
  if (existing.some(x => x.email.toLowerCase() === email)) return 'Email sudah digunakan pada usulan yang tersedia.';
  if (input.assignments.length === 0) return 'Minimal satu penugasan peran diperlukan.';
  const seen = new Set<string>();
  for (const a of input.assignments) {
    if (!a || typeof a !== 'object' || typeof a.role !== 'string' || typeof a.scopeType !== 'string' || typeof a.scopeRef !== 'string') return 'Penugasan tidak valid.';
    if (!adminAccessRoles.includes(a.role)) return 'Peran tidak dikenal.';
    if (!scopeForRole[a.role].includes(a.scopeType)) return 'Cakupan tidak sesuai dengan peran.';
    if ((a.scopeType === 'balai' || a.scopeType === 'paket') && !tidy(a.scopeRef)) return 'Identitas Balai/paket untuk penugasan wajib diisi.';
    if ((a.scopeType === 'nasional' || a.scopeType === 'sistem') && tidy(a.scopeRef)) return 'Cakupan nasional/sistem tidak membutuhkan identitas Balai atau paket.';
    const key = `${a.role}|${a.scopeType}|${tidy(a.scopeRef).toLowerCase()}`;
    if (seen.has(key)) return 'Penugasan yang sama tidak boleh ditambahkan dua kali.';
    seen.add(key);
  }
  return null;
}
export function createAccountDraft(input: AccountDraftInput, existing: readonly AccountDraft[], id: string, createdAt: string): AccountDraft {
  const error = validateAccountDraft(input, existing);
  if (error) throw new Error(error);
  return { id, createdAt, username: tidy(input.username), email: tidy(input.email).toLowerCase(), organization: tidy(input.organization),
    assignments: input.assignments.map(x => ({ ...x, scopeRef: tidy(x.scopeRef) })) };
}
export function parseAccountDrafts(raw: string | null): AccountDraft[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || value.length > 300) return [];
    const result: AccountDraft[] = [];
    for (const row of value) {
      if (!row || typeof row !== 'object') continue;
      const obj = row as Partial<AccountDraft>;
      if (typeof obj.id !== 'string' || typeof obj.createdAt !== 'string' ||
          typeof obj.username !== 'string' || typeof obj.email !== 'string' ||
          typeof obj.organization !== 'string' || !Array.isArray(obj.assignments)) continue;
      if (validateAccountDraft({ username:obj.username,email:obj.email,organization:obj.organization,assignments:obj.assignments },result)) continue;
      result.push(obj as AccountDraft);
    }
    return result;
  } catch { return []; }
}
export function roleAssignmentLabel(a: ProposedAssignment): string {
  return `${a.role} · ${scopeLabels[a.scopeType]}${a.scopeRef ? `: ${a.scopeRef}` : ''}`;
}
