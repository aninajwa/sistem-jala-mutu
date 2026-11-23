/** UI colour only; no workflow state or action eligibility is inferred here. */
export function statusTone(
  value: string,
): "good" | "warn" | "bad" | "info" | "neutral" {
  if (/Tolak|Gagal|Kritis|Tidak Sesuai|Perbaikan|Lewat/i.test(value))
    return "bad";
  if (
    /Belum|Menunggu|Review|Verifikasi|Diusulkan|Sedang|Perlu|Klarifikasi/i.test(
      value,
    )
  )
    return "warn";
  if (
    /Lulus|Selesai|Lengkap|Berhasil|Aktif|Disetujui|Memenuhi|Diterima/i.test(
      value,
    )
  )
    return "good";
  if (/Draft|Dilaksanakan/i.test(value)) return "info";
  return "neutral";
}
