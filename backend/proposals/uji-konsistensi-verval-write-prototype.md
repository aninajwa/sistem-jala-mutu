# JALA MUTU — prototipe kontrak write uji konsistensi Verval (TEST/QA)

**Status: proposal kontrak sahaja; belum ada endpoint POST atau write database.**
Tiada SQL dijalankan, tiada allowlist TEST/QA diaktifkan dan tiada mutasi
Supabase live dibuat. Perubahan ini bukan izin menjalankan POST terhadap Paket #9.

## Fakta skema yang disahkan melalui pemeriksaan live READ-only

`public.uji_konsistensi`: `konsistensi_id integer` PK; `siklus_id integer` FK
ke `siklus_verval`; `jenis_survei_id integer` FK ke `jenis_survei`;
`tim_id integer` FK ke `tim_survei`; `ruas_id integer` FK ke `ruas_jalan`;
`sta_awal numeric`; `sta_akhir numeric`; `jumlah_ulangan integer`; `status
varchar`.

`public.uji_konsistensi_ulangan`: `ulangan_id integer` PK;
`konsistensi_id integer` FK ke `uji_konsistensi`; `ulangan_ke integer`;
`rater_personel_id integer` FK ke `personel`; `nilai numeric`. Metadata live
melaporkan semua kolom selain PK nullable. Tidak ditemukan RLS atau direct
table grants untuk `anon`/`authenticated`; ini **bukan** izin write. GET RPC
lokal membaca subset kolom yang sama, tetapi bukan bukti izin atau aturan write.

Fakta FK membuktikan referensi ke tabel induk, tetapi belum membuktikan bahawa
gabungan jenis survei/tim/ruas/personel tersebut ditugaskan kepada paket atau
siklus yang sama. RPC write harus memeriksa hubungan lintas tabel tersebut.
Belum ada keputusan bisnis tentang field wajib, pemetaan survei ke siklus,
hubungan tim/personel/ruas ke paket, format/rentang STA, makna nilai dan jumlah
ulangan, status, batas/pengulangan, duplikasi, catatan/bukti, atau lifecycle.
Role penulis juga **belum diputuskan**. Kolom `status` tidak membenarkan
keputusan lulus/gagal otomatis.

## Bentuk payload untuk simulasi lokal sahaja (bukan API)

Validator/repository in-memory berada di `backend/prototypes/` dan tidak
diregistrasikan ke Express. Bentuk berikut adalah contoh uji fixture, bukan
kontrak POST atau payload untuk dikirim ke server:

```json
{
  "siklus_id": 1,
  "jenis_survei_id": 4,
  "tim_id": 12,
  "ruas_id": 30,
  "sta_awal": 1.2,
  "sta_akhir": 2.4,
  "jumlah_ulangan": 2,
  "ulangan": [
    { "ulangan_ke": 1, "rater_personel_id": 101, "nilai": 3.5 },
    { "ulangan_ke": 2, "rater_personel_id": 102, "nilai": 3.7 }
  ]
}
```

`paket_id` ialah konteks pemanggilan repository lokal, bukan field payload
simulasi. Input mengacu kolom yang disahkan; ia tidak menambah `pencatat_id`
atau `evidence_id`. Validator melakukan validasi sintaks/tipe, strict keys,
dan validasi referensi terhadap katalog fixture. Hubungan fixture hanya
simulasi, bukan bukti FK/ownership yang tersedia live. Simulasi memulangkan
status `null` dan tidak mengira kelulusan. Keperluan field tersebut sebagai
payload write sebenar masih perlu pengesahan bisnis.

## Pengawalan akses calon

- Middleware Express sedia ada mengesahkan Bearer JWT, profil `pengguna` aktif,
  assignment `pengguna_peran`, dan mengisi `res.locals.identity`.
- Simulasi menerima callback otorisasi fixture, tanpa menetapkan nama role atau
  polisi role. Database mesti mengulang pengesahan identiti, role yang kelak
  disahkan, serta assignment/scope paket. Helper `assert_survei_read` hanya
  membuktikan akses baca, bukan izin tulis.
- `actorId` hanya konteks auth fixture untuk menjalankan simulasi dan tidak
  disimpan ke salah satu tabel. Skema yang diberikan tidak memiliki kolom
  pencatat; jangan menambahkannya. Jika audit pelaku diwajibkan, tentukan desain
  audit resmi terpisah sebelum implementasi.
- Database mengesahkan siklus milik paket, dan setiap referensi survei/ruas/
  segmen milik paket/siklus yang sama.
- Simulasi menguji siklus lintas paket, akses paket ditolak, referensi fixture
  yang tidak terkait, input tambahan, dan rollback jika insert ulangan gagal.
  Ia tidak menguji konkurensi atau duplikasi atomik. Definisi kunci duplikasi
  masih belum disahkan.
- Express kelak hanya memanggil RPC dengan JWT pengguna; tiada service-role
  ataupun direct insert. HTTP yang dicadangkan: 201 sukses; 400 payload/ID
  tidak sah; 401 tiada/sesi tidak sah; 403 role/scope ditolak; 404 siklus atau
  referensi tidak ditemukan/di luar scope; 409 duplikasi; 502/503 kegagalan
  upstream atau RPC belum tersedia. Pemetaan tepat perlu selaras dengan RPC.

## Urutan transaksi RPC yang dicadangkan (belum executable)

Draft SQL komentar-only memodelkan satu invokasi RPC sebagai satu transaksi:
authenticate `auth.uid()` → periksa profil aktif, role writer yang telah
disahkan dan assignment paket → validasi payload → pastikan pasangan
`(siklus_id, paket_id)` → periksa relasi gabungan jenis survei/tim/ruas/personel
terhadap paket/siklus → periksa duplikasi dengan kunci dan concurrency control
yang disetujui → insert parent → insert semua ulangan memakai parent ID server
→ pulangkan bentuk serasi GET. Exception apa pun mesti di-raise agar parent dan
semua child rollback bersama. Tidak ada actor column pada skema fakta ini;
authentication tidak bermaksud menambahkan pencatat ke tabel tersebut.

`SECURITY DEFINER`, `search_path` kosong, revoke/grant dan wrapper RPC hanya
opsi desain yang perlu review keamanan dan policy. Draft belum memberi grant,
tidak mengubah RLS, dan tidak mengandalkan FK biasa untuk scope gabungan.

## Batas tahap ini

SQL pendamping `uji-konsistensi-verval-write.sql` ialah komentar proposal yang
tidak executable. GET uji konsistensi kekal tanpa perubahan kontrak. Sebelum
implementasi sebenar, sahkan sekurang-kurangnya: (1) role writer dan polisi
assignment paket, (2) sumber relasi gabungan bagi jenis survei/tim/ruas/personel
ke paket/siklus termasuk strategi lock, (3) natural key dan constraint
duplikasi/idempotency, (4) payload required-vs-nullable, format STA dan semantik
jumlah/urutan ulangan, (5) default serta makna `status`, (6) apakah audit aktor
diperlukan dan skema resminya, (7) bentuk response/error, (8) review RLS,
SECURITY DEFINER, search_path, grants dan privilege minimum. Jangan tetapkan
toleransi, formula, sampling, kelulusan, BA atau transisi lifecycle tanpa sumber
rasmi.
