/** Descriptive UX policy from ERD 07b and existing role responsibilities.
 * This is NOT a server authorization layer; backend must enforce scopes/actions.
 */
export const adminAccessRoles = [
  'Penyedia Jasa / Ketua Tim',
  'PIC Balai / Pengguna Jasa',
  'Direktorat / Pusat',
  'Admin',
] as const;
export type AdminAccessRole = (typeof adminAccessRoles)[number];
export const accessAreas = [
  { id: 'master', label: 'Data master', detail: 'Referensi Balai, jenis survei, alat, dan personel' },
  { id: 'entry', label: 'Data & bukti survei', detail: 'Pencatatan dan pengajuan dalam paket yang ditugaskan' },
  { id: 'balai', label: 'Review Balai', detail: 'Pemeriksaan dan keputusan oleh petugas Balai berwenang' },
  { id: 'pusat', label: 'Audit pusat', detail: 'Pemeriksaan dan keputusan tingkat Direktorat' },
  { id: 'access', label: 'Administrasi akun', detail: 'Referensi akun, peran, dan cakupan akses' },
] as const;
export type AccessArea = (typeof accessAreas)[number]['id'];
export type AccessOperation = 'lihat' | 'tulis' | 'setujui' | 'kelola';
/** Permissions are constrained to scope (Paket/Balai) and workflow state in backend. */
export const rolePermissions: Record<AdminAccessRole, Partial<Record<AccessArea, readonly AccessOperation[]>>> = {
  'Penyedia Jasa / Ketua Tim': { entry: ['lihat', 'tulis'] },
  'PIC Balai / Pengguna Jasa': { entry: ['lihat'], balai: ['lihat', 'setujui'] },
  'Direktorat / Pusat': { entry: ['lihat'], balai: ['lihat'], pusat: ['lihat', 'setujui'] },
  Admin: { master: ['lihat', 'tulis', 'kelola'], entry: ['lihat'], balai: ['lihat'], pusat: ['lihat'], access: ['lihat', 'tulis', 'kelola'] },
};
export function operationsFor(role: AdminAccessRole, area: AccessArea): readonly AccessOperation[] {
  return rolePermissions[role]?.[area] ?? [];
}
export function allowed(role: AdminAccessRole, area: AccessArea, operation: AccessOperation): boolean {
  return operationsFor(role, area).includes(operation);
}
export type TrailRecord = { id: string; waktu: string; pengguna: string; aktivitas: string; objek: string; hasil: string };
export function filterTrail(rows: readonly TrailRecord[], query: string): TrailRecord[] {
  const needle = query.trim().toLocaleLowerCase('id-ID');
  if (!needle) return [...rows];
  return rows.filter(row => [row.id, row.waktu, row.pengguna, row.aktivitas, row.objek, row.hasil]
    .some(value => value.toLocaleLowerCase('id-ID').includes(needle)));
}
export function csvCell(value: string): string {
  // Prevent spreadsheet formula injection while preserving the original value.
  const safe = /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function trailCsv(rows: readonly TrailRecord[]): string {
  const cols: Array<keyof TrailRecord> = ['id','waktu','pengguna','aktivitas','objek','hasil'];
  return '\uFEFF' + [cols.map(csvCell).join(';'), ...rows.map(row => cols.map(key => csvCell(row[key])).join(';'))].join('\r\n');
}

/** Ringkasan kebutuhan otorisasi: cakupan/aksi tidak membentuk izin server. */
export function describePermission(role: AdminAccessRole, area: AccessArea): string {
  if (operationsFor(role,area).length === 0) return '—';
  if (area === 'master') return 'Referensi sistem';
  if (area === 'access') return 'Usulan identitas dan penugasan';
  if (area === 'entry') return role === 'Penyedia Jasa / Ketua Tim' ? 'Paket yang ditugaskan; sesuai tahap' : 'Sesuai cakupan akses';
  if (area === 'balai') return role === 'PIC Balai / Pengguna Jasa' ? 'Paket dalam kewenangan Balai; tahap review' : 'Pemantauan sesuai kewenangan';
  if (area === 'pusat') return role === 'Direktorat / Pusat' ? 'Audit tingkat 3; sesuai tahap dan penugasan' : 'Pemantauan sesuai kewenangan';
  return 'Sesuai penugasan';
}
