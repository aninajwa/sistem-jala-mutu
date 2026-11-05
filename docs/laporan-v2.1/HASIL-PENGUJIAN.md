# Hasil pengujian V2.1

Tanggal: 5 November 2026. Baseline ZIP terbaru 734 entri, SHA-256 `66f6362758ab473feeb21cce3f5c0eb6430d712d70528bf6fb74f9e57e58ba45`. Runtime Node v24.22.1, Chromium 153.0.8010.0; npm ci dari lock input tanpa mengubah dependency.

| Pengujian yang dijalankan | Hasil | Bukti |
|---|---|---|
| TypeScript + Vite build | Lulus; masih ada peringatan bundle >500 kB | evidence/build.log |
| reports.test.ts + v2.test.ts + dashboardMetrics.test.ts + v21.test.ts | 43/43 lulus: 28 tes lama + 15 V2.1 | evidence/metrics.log |
| Permission existing | 9/9 lulus | evidence/permissions.log |
| Notifikasi unit | 35/35 lulus | evidence/notifications.log |
| Dokumen unit | 9/9 lulus | evidence/documents.log |
| Domain pada V2.1 | 192/193; satu gagal UTF-8 Notifikasi existing | evidence/domain.log |
| Domain pada salinan baseline terbaru tanpa revisi V2.1 | 192/193; assertion sama | evidence/baseline-domain.log |
| Skrip browser V2 lama, tidak diubah | 8/8, errors [] | evidence/v2-legacy-browser.log dan v2-legacy-browser/results.json |
| Reproduksi P0 pada baseline asli | Berhasil mereproduksi crash randomUUID pada origin non-secure; satu pemeriksaan reproduksi berhasil, bukan klaim baseline bebas bug | evidence/baseline-http.log, baseline-http/results.json, baseline-http/baseline-http-crash.png |
| Browser V2.1 non-secure | 17/17, errors []: 16 kombinasi role/viewport + satu skenario negatif/empat jenis laporan | evidence/browser.log dan browser/results.json |
| Guard/rollback payload | Simulasi Python; lihat hasil detail, bukan eksekusi native PowerShell | evidence/installer-simulation.json |
| Preservasi source | Empat file existing laporan berubah, source existing lain byte-identik | evidence/source-preservation.json |

Core check terakhir beserta exit code berada pada evidence/final-core-checks.json. Pengujian browser dan unit dilengkapi screenshot/CSV/JSON fixture, bukan log toast keberhasilan palsu.

## Reproduksi HTTP yang nyata

Dokumen browser mempunyai origin `http://jala-http.test:<port>`. Alias diteruskan ke server lokal oleh test runner untuk kompatibilitas jaringan Work. Browser sendiri menghasilkan `isSecureContext=false`, `typeof crypto.randomUUID='undefined'`, `typeof crypto.getRandomValues='function'`. Tidak ada pemalsuan API crypto untuk skenario utama. Baseline crash dengan pesan yang dilaporkan pengguna; V2.1 menyelesaikan penyusunan, save, versi, reload dan JSON pada kondisi yang sama.

Pengujian negatif tambahan sengaja meniadakan getRandomValues setelah halaman terbuka: render tetap tidak crash, save menampilkan error, isi tetap ada. Ini berbeda dari skenario utama yang memakai crypto asli.

## Cakupan 43 tes fungsi

Lima belas tes baru mencakup masing-masing role teknis, perbedaan pertanyaan/chart, Admin, paket tanpa aktivitas versus filter kejadian, irisan filter, stack totals, nama paket sama dengan ID berbeda, duplikat key, kategori >6 tanpa donut, status tidak dikenal, UUID fallback/10.000 sampel unik/native/crypto tidak tersedia, versi immutable/lampiran/assignment yang dicabut, schema/owner/identitas bertentangan/data rusak/quota. Sampel ID unik tidak dianggap bukti keunikan matematis absolut.

Tes V2 lama memeriksa populasi/filter/CSV, pembatasan akses/formula injection, dan Ringkasan QA/QC; semua 28 tetap lulus.

## Cakupan browser V2.1

- Penyedia, PIC Balai, Direktorat dan Admin masing-masing pada 1440, 768, 390 dan 360 piksel. Mobile menggunakan hasTouch/isMobile Chromium; bukan Android fisik.
- Empat chart dan urutannya berbeda menurut role. Tooltip hover pada desktop/tablet pointer halus dan tap pada pointer kasar benar-benar diuji terlihat, bukan sekadar elemen terpasang.
- Data di luar assignment tidak muncul. Paket DEV bawaan baseline dapat ikut dalam cakupan development sesuai localPrincipal yang tidak diubah; screenshot bukan bukti data produksi.
- Filter tanggal kosong/aktif, empat chart empty-state, Reset, panel lanjutan, chip, filter paket/Balai dan Lihat Semua dengan konteks tetap.
- Rekap fixture 13 baris dalam satu paket: 10+3 pagination, pencarian satu referensi, rincian, CSV nyata termasuk rekaman halaman berikutnya dan tidak memuat paket rahasia.
- Tabel 360/390 benar-benar digeser lewat scrollLeft internal; seluruh halaman tidak melebar.
- Empat role diuji tidak mempunyai page error; Admin tidak mendapat tombol ekspor teknis. Pemeriksa tidak mendapat tombol save Penyedia.
- Draf Penyedia pada setiap viewport non-secure: tanggal/field wajib, tipe lampiran ditolak dengan pesan, PNG dibaca nyata, dua versi tersimpan, versi lama dikembalikan, reload, JSON berisi ID/versi/lampiran/sifat belum disahkan. Ajukan tetap disabled.
- Katalog mobile dibuka-tutup dan empat pilihan tetap tersedia. Form satu kolom, tanggal dan tombol dapat disentuh, tanpa overflow.
- Pada skenario tambahan semua empat jenis laporan disimpan/diekspor dengan empat ID berbeda. Quota failure pada desktop tidak menambah versi dan tidak memberi sukses; crypto absent mempertahankan isi; data rusak tampil sebagai error dan tidak ditimpa.

## Visual dan bukti

Screenshot utama: evidence/browser/dashboard-<role>-<width>.png, recap-<role>-<width>.png, periodic-<role>-<width>.png; role 0 Penyedia, 1 Balai, 2 Direktorat. Admin memakai admin-<width>.png. Ada bukti baseline crash serta error aman saat provider crypto tidak tersedia. Desktop, mobile 360 dan form periodik telah diperiksa visual; tabel mobile sengaja scroll internal, bukan kolom hilang.

Data pengujian terisolasi. Angka/tanggal 2027 yang mungkin muncul pada screenshot berasal seed DEV baseline yang memang sudah ada dan tidak diubah patch. Tidak ada data dummy baru ditanam pada source operasional.

## Regresi lama, dipisahkan

Tes UTF-8 `sourceTechnicalEvaluation.test.ts` gagal pada NotificationsPage.tsx yang byte-identik pada baseline terbaru dan V2.1. Dua masalah script browser inbox Notifikasi/selector tabel Dokumen Mutu tercatat dalam riwayat baseline V2; kedua script itu tidak diulang pada V2.1 dan tidak diklaim lulus. Riwayat 184 browser checks dari V2 juga tidak diklaim sebagai eksekusi baru V2.1. Source modul tersebut tidak diubah; unit relevan serta pengujian Ringkasan di atas tetap dijalankan.

## Batas

Tidak mengklaim API produksi tersambung, template empat laporan resmi final, penyimpanan multiuser, pengesahan resmi, Android fisik, atau installer Windows telah diuji native. Tidak ada perubahan backend atau kontrak API. Tindak lanjut formal ada pada dokumen keputusan dan catatan integrasi.
