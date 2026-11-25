# Daftar file dan konsekuensi integrasi Anin

| File | Status | Tujuan |
|---|---|---|
| frontend/src/pages/ReportsPage.tsx | Diubah | Pakai filter grid bersama, penerusan context KPI, region tabel mobile, penjelasan sumber lokal/data uji |
| frontend/src/reports/Dashboard.tsx | Diubah | Ikon/warna KPI, visual dan urutan per role, bar horizontal/stack/area/multiline/donut bersyarat, tooltip hover/tap |
| frontend/src/reports/PeriodicReports.tsx | Diubah | Hilangkan UUID saat render, simpan/ekspor aman HTTP, error storage, guard lampiran/context, form responsif dan katalog mobile lipat |
| frontend/src/reports/reports-v2.css | Diubah | Gaya scoped pelaporan untuk KPI/filter/chart/table/form desktop/HP |
| frontend/src/reports/ReportFilters.tsx | Baru | Filter utama/lanjutan, chip aktif dan penjelasan basis tanggal |
| frontend/src/reports/dashboardModel.ts | Baru | Agregasi murni, distinct count, konfigurasi pertanyaan/chart per role |
| frontend/src/reports/localId.ts | Baru | Native UUID atau UUID v4 dari getRandomValues, tanpa Math.random |
| frontend/src/reports/draftStorage.ts | Baru | Parser riwayat, append versi dan penanganan data/izin tanpa overwrite data rusak |
| frontend/src/reports/v21.test.ts | Baru | Tes agregasi, role, ID, schema, versi, quota, dan cakupan |
| frontend/scripts/verifyReportsV21.ts | Baru | HTTP non-secure, desktop/tablet/mobile empat role, tooltip sentuh, workflow lokal, negative states |
| docs/laporan-v2.1/* | Baru | Audit, keputusan, matriks, pengujian, screenshot, instalasi dan bukti preservasi |
| Install-V21.ps1, Rollback-V21.ps1, manifest-v21.json, PACKAGE-SHA256.txt, BASELINE-ZIP-SHA256.txt | Alat distribusi | Guard baseline/payload, CheckOnly, backup/rollback selektif; tidak perlu disalin manual ke source |

## Tidak berubah

reports/adapter.ts, query.ts, model.ts, export.ts, periodic.ts, reports.test.ts, v2.test.ts, scripts/verifyReportsV2.ts, roleNavigation.ts, App.tsx dan seluruh source existing di luar empat file di atas dibandingkan dengan ZIP V2.1. Backend/migrasi, kontrak Anin, dependency/lock serta Ringkasan QA/QC/Notifikasi/Dokumen Mutu/Tindakan Perbaikan tetap byte-identik. Satu-satunya baseline hash adalah ZIP terbaru, bukan commit atau patch Work lama.

## Catatan integrasi untuk Anin

Tidak ada endpoint, enum backend, skema database, atau kontrak integrasi V2 yang diubah. Kontrak kebutuhan yang sudah ada pada docs/laporan-v2/KONTRAK-INTEGRASI-ANIN.md tetap berlaku. Konsekuensi client berikut perlu diketahui:

1. KPI paket sekarang berarti paket assignment yang cocok filter; tanpa filter kejadian dapat mencakup paket belum mempunyai aktivitas. API kelak perlu membedakan cakupan assignment dari paket aktif, bukan menggunakan jumlah aktivitas sebagai jumlah paket.
2. Balai saat ini dikelompokkan nama lokal; server perlu ID Balai kanonik untuk agregasi wilayah, bukan menebak ID dari label.
3. Aktif/ditutup memakai status sumber kasus. Histori openedAt/closedAt masih diperlukan jika nanti diminta tren penyelesaian. Tidak ada SLA atau status baru.
4. Client membuat UUID v4 lokal melalui CSPRNG. ID lokal tidak mengubah otorisasi server; server perlu validasi identitas, konflik revisi, idempotensi, owner/assignment dan migrasi draf secara eksplisit.
5. Data draf tetap browser/origin yang sama, namespace V2. Membuka alamat HTTP HP tidak membaca localStorage localhost laptop. V2.1 memperbaiki crash, bukan membangun sinkronisasi multiuser.
6. Katalog mingguan/bulanan/semesteran/akhir tetap struktur kerja sementara. Submit/review/approve, nomor, tanda tangan dan status laporan resmi tidak diaktifkan. BA tetap di Dokumen Mutu dengan identitas/status sumbernya.
7. Ekspor CSV tetap kontrak V2; JSON adalah draf lokal. Audit ekspor/generator keluaran resmi server belum tersedia. Tidak ada klaim API/SMD produksi terhubung.

Tidak diperlukan perubahan backend untuk menerapkan patch frontend ini. Konfirmasi formal template, pemeriksa/pengesah, retensi, ID wilayah, definisi km dan generator keluaran tetap menjadi pekerjaan integrasi lanjutan.
