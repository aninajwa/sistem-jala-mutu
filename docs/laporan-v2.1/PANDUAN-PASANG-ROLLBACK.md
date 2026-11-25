# Pemasangan dan rollback V2.1

Patch hanya disiapkan untuk proyek yang cocok dengan isi ZIP **JALA-WORK-DASHBOARD-LAPORAN-V2.1-SOURCE.zip**. Jangan gunakan source V1, commit lama atau ZIP V2 sebelumnya sebagai pengganti baseline. Hash ZIP input: `66f6362758ab473feeb21cce3f5c0eb6430d712d70528bf6fb74f9e57e58ba45`.

## Pemasangan selektif

1. Ekstrak patch ke folder terpisah dari proyek. Tutup dev/build/editor yang sedang menulis file target.
2. ProjectRoot harus menunjuk folder yang berisi frontend dan docs. Jalankan dari folder patch:

```powershell
.\Install-V21.ps1 -ProjectRoot 'D:\JALA-MUTU' -CheckOnly
.\Install-V21.ps1 -ProjectRoot 'D:\JALA-MUTU'
```

`-CheckOnly` tidak menulis atau membuat backup. Semua payload dan seluruh file baseline yang ditimpa harus cocok sebelum copy pertama. File baru yang sudah ada juga menghentikan instalasi, agar perubahan lokal tidak hilang. Jika ada mismatch, hentikan dan bandingkan versi file; jangan mematikan guard untuk memaksa.

Installer tidak mengekstrak seluruh proyek atau menyentuh file yang tidak terdaftar. Hanya empat file existing modul laporan ditimpa; file baru berada di source/tests pelaporan dan docs/laporan-v2.1. Backend, migrasi, navigasi, dependency dan modul lain tidak dipasang ulang.

Backup selektif berada pada folder sibling `jala-v21-backups/<transaksi>`, di luar proyek. Lokasi dicetak setelah instalasi. Parameter `-BackupRoot` dapat digunakan bila memerlukan lokasi lain. Receipt mencatat file existing dan file baru. Backup existing diverifikasi, lalu hash setiap hasil copy diperiksa. Kegagalan copy memulihkan path yang sudah dicoba.

3. Dari frontend jalankan:

```powershell
npm run build
node --import tsx --test src/reports/reports.test.ts src/reports/v2.test.ts src/reports/v21.test.ts src/pages/dashboardMetrics.test.ts
npm run test:permissions
npx tsx scripts/verifyReportsV2.ts
npx tsx scripts/verifyReportsV21.ts
```

Tidak ada dependency baru. Jika node_modules belum tersedia, `npm ci` tetap memakai lock baseline. Browser test memerlukan instalasi Chromium/Playwright yang sudah digunakan pengujian V2; CHROMIUM_EXECUTABLE dapat menunjuk executable lokal sesuai lingkungan.

Test runner V2.1 memakai alias HTTP `jala-http.test` dengan pengambilan byte dari server loopback. Halaman browser tetap mempunyai origin non-secure dan menjalankan crypto asli; skenario utama tidak memalsukan randomUUID. Server pengujian default port 5184, dapat diganti TEST_PORT. Semua data uji dibuat dalam context browser terisolasi dan tidak menulis localStorage browser harian pengguna.

## Pemeriksaan HP sesudah pasang

Buka alamat aplikasi pada HP seperti biasa. Pilih role Penyedia dan Laporan Periodik. Halaman harus terbuka pada HTTP tanpa error randomUUID. Simpan draf/lampiran, buat versi berikutnya, reload, buka versi terdahulu dan unduh JSON. Coba dashboard: tap grafik untuk tooltip, Filter lainnya, chip aktif, Reset, Lihat Semua dan tabel rekap yang dapat digeser. Admin tetap tidak mempunyai ekspor teknis.

Draf localhost laptop dan alamat HTTP HP adalah penyimpanan origin yang berbeda. Tidak munculnya draf laptop pada HP bukan bukti penghapusan data. V2.1 mempertahankan namespace V2 pada origin yang sama, tidak menambahkan sinkronisasi atau migrasi server otomatis.

## Rollback

```powershell
.\Rollback-V21.ps1 -BackupPath 'D:\jala-v21-backups\<transaksi>'
```

Rollback memverifikasi seluruh file masih identik dengan patch dan seluruh backup cocok sebelum mengubah apa pun. Jika pengguna sudah mengedit file sesudah pemasangan, rollback ditolak agar edit baru tidak hilang. File existing dikembalikan ke baseline V2 terbaru; file baru yang diperkenalkan V2.1 dihapus secara selektif. Folder kosong dapat tertinggal. Backup dan draf browser tidak dihapus.

Kembali ke V2 juga mengembalikan bug HTTP lama; ekspor salinan JSON draf terlebih dahulu bila diperlukan. Tidak ada reset Git, pembersihan proyek, database atau localStorage oleh installer/rollback.

## Manifest dan batas verifikasi installer

`manifest-v21.json`: path asli, SHA-256 baseline (null untuk file baru), SHA-256 patch. `BASELINE-ZIP-SHA256.txt`: identitas ZIP input. `PACKAGE-SHA256.txt`: hash paket termasuk installer dan manifest, kecuali daftar hash itu sendiri. ZIP diuji CRC dan semua hash payload diverifikasi ulang sesudah pengemasan.

Di Work, guard/mismatch/collision/copy/rollback diuji melalui simulasi payload Python di direktori sementara. PowerShell/Windows tidak tersedia; eksekusi native Windows tidak diklaim lulus. Jalankan `-CheckOnly` pada Windows sebelum memasang. Patch ini tidak pernah dipasang pada proyek asli pengguna.
