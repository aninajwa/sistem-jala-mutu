import type { WorkflowRole } from '../model';

/**
 * Kamus pemetaan nama peran resmi Supabase (hasil GET /api/me → field `peran`)
 * ke label role UI Dira (`WorkflowRole`).
 *
 * Inilah SATU-SATUNYA tempat membandingkan nama peran server.
 * Komponen UI Dira tetap memakai label panjang `WorkflowRole` seperti biasa,
 * sehingga tidak ada gate role lama yang perlu diubah.
 *
 * Peran resmi hanya ada 4 (tidak ada `pimpinan`, `validator`, atau
 * `validator_direktorat`):
 * - penyedia_jasa → Penyedia Jasa / Ketua Tim  : isi, upload, ajukan.
 * - pic_balai     → PIC Balai / Pengguna Jasa : review dalam scope balainya.
 * - direktorat    → Direktorat / Pusat        : pengawasan lintas balai.
 * - admin         → Admin                     : administrasi.
 */
export const serverRoleToDiraRole: Record<string, WorkflowRole> = {
  penyedia_jasa: 'Penyedia Jasa / Ketua Tim',
  pic_balai: 'PIC Balai / Pengguna Jasa',
  direktorat: 'Direktorat / Pusat',
  admin: 'Admin',
};

/**
 * Ubah peran dari server (satu nama atau kumpulan nama) menjadi `WorkflowRole`.
 * Memakai urutan peran yang dikembalikan server; peran pertama yang dikenali
 * yang dipakai. Mengembalikan `null` bila tidak ada yang dikenali — pemanggil
 * yang memutuskan perlakuan untuk pengguna tanpa peran.
 */
export function diraRoleForServerRoles(
  names:
    | ReadonlyArray<{ nama?: string } | string>
    | string
    | null
    | undefined,
): WorkflowRole | null {
  const list = typeof names === 'string' ? [names] : names ?? [];
  for (const entry of list) {
    const name = typeof entry === 'string' ? entry : entry?.nama ?? '';
    const mapped = serverRoleToDiraRole[name.trim()];
    if (mapped) return mapped;
  }
  return null;
}
