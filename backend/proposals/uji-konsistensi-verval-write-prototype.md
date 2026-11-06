# JALA MUTU — prototipe kontrak write uji konsistensi Verval (TEST/QA)

**Status: proposal kontrak sahaja; belum ada endpoint POST atau write database.**
Tiada SQL dijalankan, tiada allowlist TEST/QA diaktifkan dan tiada mutasi
Supabase live dibuat. Perubahan ini bukan izin menjalankan POST terhadap Paket #9.

## Bukti skema yang tersedia

`uji-konsistensi-verval-read-rpc.sql` membaca `public.siklus_verval` dengan
`siklus_id` dan `paket_id`, `public.uji_konsistensi` dengan
`konsistensi_id`, `siklus_id`, `jenis_survei_id`, `tim_id`, `ruas_id`,
`sta_awal`, `sta_akhir`, `jumlah_ulangan`, `status`, serta
`public.uji_konsistensi_ulangan` dengan `ulangan_id`, `konsistensi_id`,
`rater_personel_id`, `ulangan_ke`, `nilai`. Ini bukti adanya kontrak READ
sahaja, bukan pengesahan semua tipe/nullability, FK, constraint, atau arti
bisnis kolom tersebut. Tidak ditemukan definisi skema dua tabel uji konsistensi
dalam `backend/db-reference` atau migrasi yang diperiksa.

Belum diketahui target rekod pemeriksaan baru, hubungan sumber data survei,
jenis pemeriksaan dan unit nilai, penanganan bukti, catatan, kunci duplikasi,
aktor pencatat, daftar peran penulis yang berwenang, maupun lifecycle/status.
Kolom `status` yang dibaca GET tidak membenarkan implementasi keputusan
lulus/gagal otomatis.

## Kontrak calon endpoint (belum dipasang)

`POST /api/paket/{paketId}/siklus-verval/{siklusId}/uji-konsistensi`

Payload dummy untuk menunjukkan scope sahaja — **bukan payload valid untuk
write dan tidak boleh dikirim**:

```json
{
  "paket_id": 9,
  "siklus_id": 1,
  "referensi_survei": "<ID sesi/ruas/segmen yang mesti disahkan>",
  "pemeriksaan": "<jenis dan parameter yang mesti disahkan>",
  "hasil": "<nilai atau rujukan bukti yang mesti disahkan>",
  "catatan": "<catatan opsional; batas panjang mesti disahkan>"
}
```

Identiti paket dan siklus sebaiknya daripada path sahaja; contoh body
memperlihatkan scope semantik, bukan cadangan menerima ID rangkap. Bentuk
minimum final belum dapat ditetapkan: sesi/ruas/segmen, jenis/parameter, nilai
hasil/bukti dan catatan perlu dipetakan ke skema yang disahkan. Identiti
pencatat wajib berasal dari JWT di database (`auth.uid()` lalu profil
`pengguna`), tidak dari body. Body juga tidak boleh menetapkan status
kelulusan.

## Pengawalan akses calon

- Middleware Express sedia ada mengesahkan Bearer JWT, profil `pengguna` aktif,
  assignment `pengguna_peran`, dan mengisi `res.locals.identity`.
- Untuk write, database mesti mengulang pengesahan identiti dan autorisasi
  peran+assignment paket. Helper `assert_survei_read(p_paket_id)` yang ada hanya
  menetapkan akses baca berdasarkan pemilik Penyedia Jasa atau PIC Balai;
  ia **bukan** kebenaran write atau peraturan role write.
- Database mengesahkan siklus milik paket, dan setiap referensi survei/ruas/
  segmen milik paket/siklus yang sama.
- Penolakan lintas paket, siklus tidak cocok, referensi tidak sah, duplikasi
  atomik, dan payload tambahan/ID aktor/status harus menjadi validasi kontrak.
- Express kelak hanya memanggil RPC dengan JWT pengguna; tiada service-role
  ataupun direct insert. HTTP yang dicadangkan: 201 sukses; 400 payload/ID
  tidak sah; 401 tiada/sesi tidak sah; 403 role/scope ditolak; 404 siklus atau
  referensi tidak ditemukan/di luar scope; 409 duplikasi; 502/503 kegagalan
  upstream atau RPC belum tersedia. Pemetaan tepat perlu selaras dengan RPC.

## Batas tahap ini

SQL pendamping `uji-konsistensi-verval-write.sql` ialah komentar proposal yang
tidak executable. GET uji konsistensi kekal tanpa perubahan kontrak.
Sebelum write boleh diuji di PostgreSQL terasing, sahkan skema aktual dan
constraints/FK, aturan KAK, role/assignment penulis, sumber nilai dan bukti,
definisi duplikasi, serta bentuk respons. Jangan tetapkan toleransi, formula,
sampling, kelulusan, BA atau transisi lifecycle tanpa sumber resmi.
