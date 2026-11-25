/** Tenggat Laporan Pendahuluan menurut KAK Revisi 2026 bagian 19.
 * Tambahkan 30 hari kalender sejak tanggal mulai pelaksanaan pada SPMK.
 * Hanya informasi jadwal: tidak memberikan/menolak persetujuan otomatis. */
export function preparationDeadlineFromSpmk(spmkDate: string | undefined): string | null {
  if (!spmkDate || !/^\d{4}-\d{2}-\d{2}$/.test(spmkDate)) return null;
  const [year, month, day] = spmkDate.split('-').map(Number);
  if (year < 100) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  date.setUTCDate(date.getUTCDate() + 30);
  return date.toISOString().slice(0, 10);
}
