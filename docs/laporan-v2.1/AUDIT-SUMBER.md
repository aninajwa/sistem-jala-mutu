# Audit V2.1 — 5 November 2026

## Baseline yang benar-benar dipakai

Satu-satunya baseline isi source: **JALA-WORK-DASHBOARD-LAPORAN-V2.1-SOURCE.zip**, 734 entri, SHA-256 `66f6362758ab473feeb21cce3f5c0eb6430d712d70528bf6fb74f9e57e58ba45`. ZIP diekstrak menjadi salinan baseline dan salinan kerja V2.1 tersendiri. ZIP V1, ZIP V2 lama, commit Git, dan output Work sebelumnya tidak dipakai menggantikan isi baseline. Tidak ada operasi Git atau pemasangan pada proyek asli pengguna.

## Temuan source sebelum perubahan

| Lokasi | Temuan | Keputusan |
|---|---|---|
| reports/PeriodicReports.tsx | `id: id || crypto.randomUUID()` berjalan saat render, termasuk sebelum simpan | P0: render tidak boleh meminta ID; buat saat simpan/ekspor dengan CSPRNG fallback |
| reports/Dashboard.tsx | Role sebagian besar memakai empat grafik sama; KPI hanya teks dan angka | Model pertanyaan/KPI/chart per role, ikon dan warna semantik |
| pages/ReportsPage.tsx | Filter memakai toolbar flex berisi seluruh kontrol; tabel belum memberi petunjuk scroll | Komponen filter grid bersama untuk dashboard dan rekap; lanjutan dilipat; scroll tabel internal yang jelas |
| reports/adapter.ts, query.ts, export.ts | Cakupan principal, identitas unik, basis tanggal dan ekspor sudah bekerja | Pertahankan byte, tidak menulis ulang aturan akses/CSV |
| reports/PeriodicReports.tsx | Validasi storage inline; error awal tidak terlihat; async lampiran belum membedakan pembacaan lama | Parser tanpa overwrite data rusak, error terlihat, append versi tetap namespace V2, guard pembacaan lampiran |
| workflow/access/packageAccess.ts dan hooks/usePackageStore.ts | Baseline DEV menambahkan paket contoh 003/004 dan memasukkan paket demo ke cakupan uji | Tidak diubah. Screenshot Work dapat memuat data uji baseline; tidak dianggap data produksi atau angka baru yang ditanam patch |

Audit randomUUID dalam folder laporan menemukan satu pemanggilan langsung tersebut. Versi memakai integer bertambah; lampiran memakai metadata dan data URL, bukan randomUUID. V2.1 tidak memperkenalkan ID versi/lampiran baru yang tidak diperlukan.

## Landasan bisnis dan batas interpretasi

| Sumber / bagian | Ketentuan yang dipakai | Dampak V2.1 |
|---|---|---|
| KAK Revisi 2026 §11.10.2 | Display kemajuan pekerjaan dan pelaporan mingguan | Dashboard operasional berbasis rekaman kegiatan, bukan dashboard mutu kedua |
| KAK §11.10.6 | Dokumentasi proses yang mudah ditelusuri | Detail menuju sumber; versi lokal tidak mengubah keputusan sumber |
| KAK §12.1–12.2; §20–21 | Keluaran elektronik dan perbedaan laporan QA/QC/hasil survei/akhir pekerjaan | Tidak membuat pengesahan/nomor/tanda tangan; JSON/CSV bukan keluaran resmi final |
| Draft PP F.1–F.3 | Dokumentasi, tujuh BA, QA/QC bulanan/semesteran/akhir | Katalog empat jenis tetap struktur kerja sementara; tujuh BA tetap di Dokumen Mutu |
| Flowchart 05a hlm.17 | Akses/peran: Penyedia pelaksanaan; Balai pemeriksaan; Direktorat monitoring; Admin master | Pertanyaan dashboard berbeda, tidak memperluas akses Admin |
| Flowchart 05b hlm.18 | Data sumber lintas survei/verval/audit/perbaikan/dokumen | Agregasi membaca sumber; tidak membuat status pemeriksaan atau persetujuan baru |
| ERD 02 hlm.5; 07b hlm.12 | Paket/penugasan, hak dan scope paket/Balai | Pengelompokan hanya snapshot scoped; hak lihat bukan hak persetujuan |
| ERD 04a hlm.7 | panjang_tercapai_km adalah rancangan atribut sesi | KPI km tetap belum tersedia; tidak menjumlahkan rekaman menjadi kilometer |
| ERD 04b hlm.8; 05 hlm.9 | Periode verval dan audit/penerimaan | Review aktif bukan histori semua pemeriksaan |
| ERD 06 hlm.10 | Kasus, riwayat, tindakan dan status | Aktif: lima status belum ditutup yang benar-benar ada dalam model; ditutup hanya status Ditutup |
| ERD 07a hlm.11 | Dokumen, versi dan persetujuan terpisah | Draf lokal tidak menulis registri/persetujuan Dokumen Mutu |
| Catatan Pak Hary, pembicaraan revisi.txt, dialog awal | Nilai tersedia di SMD, lakukan verifikasi/validasi, jangan hitung ulang | Tidak menghitung ulang nilai teknis SMD |

KAK §11.10.2/11.10.6 dan Draft PP F.1–F.3 ditelusuri kembali pada sumber resmi yang tersedia dari pekerjaan sebelumnya, tanpa memakai source frontend lama sebagai baseline. Acuan diagram/format tetap sebagaimana audit sumber V2 yang disertakan dalam baseline, beserta halaman diagram yang telah dibaca pada tahap sebelumnya. V2.1 tidak mengklaim audit ulang seluruh 55 checklist. Perubahan visual, ambang enam kategori donut, grid, dan trigger tooltip adalah **keputusan desain pengembang**, bukan kalimat eksplisit dalam KAK.

Tahun TA 2027 pada judul diagram tidak menjadi periode aplikasi. Tanggal 2027 pada screenshot pengujian berasal paket DEV yang sudah ada pada baseline. UI dan angka tetap mengikuti tanggal rekaman serta filter, tanpa memaksakan tahun tertentu.

## Batas tetap

Tidak mengubah backend, migrasi, Ringkasan QA/QC, Notifikasi, Dokumen Mutu, Tindakan Perbaikan, package store, principal/assignment, navigasi role, kontrak Anin, atau dependency/lock. Pemeriksaan byte terhadap ZIP input dicatat pada evidence/source-preservation.json. Perubahan source existing hanya empat file modul laporan; semua source existing lainnya harus tetap identik sebelum ZIP final dibuat.
