# Jala Mutu — Tahap 4 RNI/LRS: Spesifikasi Implementasi Berasaskan KAK 2026

**Tarikh:** 11 November 2026  
**Status:** SPESIFIKASI KERJA LOKAL / BELUM DILULUSKAN SEBAGAI PERATURAN KONTRAK PRODUKSI  
**Skop:** Tahap 4 sahaja. Jangan mengubah rekod TEST/QA sedia ada, memasang migration atau mengaktifkan kelulusan.

## 1. Sumber dan keutamaan

1. `Update_KAK_2026_Rev_7552.docx`, seksyen 11.9.2 Prosedur (teks sekitar halaman 70) dan 11.9.7 Penerimaan (sekitar halaman 73). **Rujukan teknikal utama**, tertakluk pengesahan bahawa format KAK ini adalah dokumen yang terpakai untuk kontrak sasaran.
2. `Update Survey Pendahuluan,KAK_Inspeksi_Kondisi_Jaringan_Jalan_TA_2025_Lumsum Rev2.docx`, seksyen RNI/LRP — sokongan sejarah, bukan mengatasi KAK 2026.
3. `DRAFT Form Verifikasi Validasi Audit Data SMD Jalan.docx`, bahagian B, C, D, E, F, J dan K — **DRAF** checklist dan urutan SMD, bukannya bukti data benar-benar VALID dalam SMD.
4. `Draft Petunjuk Pelaksanaan Quality Control Quality Assurance.docx` — **DRAF** panduan proses, tanggungjawab, bukti dan audit.

## 2. Aturan yang disokong oleh sumber

- Kesalahan pengukuran jarak yang ditoleransi: **30 m per ruas**. Tafsir perbandingan ukuran panjang ruas sebagai `abs(panjang_lapangan_m - panjang_acuan_m) <= 30`, dengan syarat kedua nilai memang membandingkan jarak ruas yang sama dan satuan meter. Tafsiran pemetaan input ini perlu disahkan sebagai sebahagian reka bentuk.
- Untuk perbezaan dalam had: data boleh dikoreksi terhadap panjang acuan Pengguna Jasa menggunakan **faktor skala per ruas**. Jangan auto-koreksi data mentah atau menganggap koreksi telah dibuat.
- Untuk perbezaan lebih 30 m: **ukur ulang ruas**; jika pengukuran kedua mengesahkan hasil pertama, **maklumkan Pengguna Jasa**. Jangan statuskan lulus.
- Ketelitian jarak antara LRP: 0.1% daripada jarak pengukuran. **Tidak boleh dievaluasi daripada lima medan borang LRS sedia ada sahaja**; memerlukan bukti/ukuran LRP.
- Sumbu jalan mesti mempunyai topologi yang benar dan lengkap, dan setiap ruas mempunyai sumbu unik. `jumlah_error_topologi=0` ialah indikator pemeriksaan, bukan bukti automatik kelulusan RNI menyeluruh.
- Audit/penerimaan oleh Pengguna Jasa memeriksa format, ketelitian, kelengkapan dan kewajaran, dengan tindakan pembetulan apabila ada ketidaksesuaian. Berita Acara Penerimaan Data merupakan langkah berasingan daripada menyimpan borang Jala Mutu.
- Draf SMD mencadangkan urutan RNI VALID dahulu, kemudian data lain; semakan koordinat Defect dan STA mempunyai kriteria 30 m **yang berbeza** daripada toleransi panjang per ruas. Jangan gabungkan metrik tersebut.

## 3. Penilaian teknikal yang boleh dibina sekarang (READ-ONLY)

Input daripada RPC terpasang `public.baca_validasi_lrs(p_paket_id)`:
- `panjang_lapangan_m`, `panjang_acuan_m`, `jumlah_error_topologi`, `format_sesuai_glossary`, `sta_konsisten_iri_pci_ldt`, `versi`.

Untuk setiap rekod:
1. Jika kedua panjang tiada/tidak sah, tunjuk `LENGTH_INCOMPLETE`; jangan kira keputusan.
2. Jika sah, kira `selisih_panjang_m = abs(panjang_lapangan_m - panjang_acuan_m)` dengan aritmetik decimal stabil.
3. `selisih_panjang_m > 30`: `LENGTH_REMEASUREMENT_REQUIRED`; mesej spesifik dari KAK: ukur ulang ruas, lalu maklumkan Pengguna Jasa jika pengukuran kedua mengesahkan perbezaan.
4. `selisih_panjang_m <= 30`: `LENGTH_WITHIN_TOLERANCE`; ini hanya penilaian jarak, **bukan `gate=PASS` keseluruhan**.
5. `jumlah_error_topologi > 0`: papar isu topologi; `=0` hanya pemerhatian yang tidak menggantikan pengesahan geometri/LRS.
6. `format_sesuai_glossary=false`, `sta_konsisten_iri_pci_ldt=false`: paparkan isu/ketidaksesuaian; true hanya pemerhatian tanpa verifikasi dokumen atau SMD.
7. `progression_allowed=false`, workflow `gate=PENDING`, dan butang Ajukan/Review/Tahap5 kekal disabled sehingga aturan bukti, proses dan RPC lifecycle yang sah diluluskan.
8. **Jangan menulis** `status`, `deviasi_m`, `tgl_valid`, `gate_state` atau `audit_trail` untuk read-only evaluator ini.

Contoh regresi: paket TEST/QA 11 mempunyai panjang 1234 m lawan 1200 m => `selisih_panjang_m=34`, `LENGTH_REMEASUREMENT_REQUIRED`. Kekalkan satu baris sedia ada (versi 1), **jangan run save semula**.

## 4. Checklist bukti untuk paparan status, bukan auto-approval

Status bagi setiap item mesti `NOT_VERIFIED` sehingga bukti persisten dan pemeriksaan role yang relevan telah benar-benar tersedia:
- Ketepatan data referensi LRP / SHP dan identiti ruas;
- Keselarasan data dengan RNI/LRS dan aturan STA/arah/lajur;
- Bukti pengukuran panjang, koreksi faktor skala (jika berkaitan), pengukuran ulang (jika >30 m);
- Data GPS/GNSS RAW/RINEX dan XLSX perhitungan jarak **apabila kaedah GPS/GNSS digunakan**, menurut KAK 2026;
- Bukti pra-unggah berkaitan (kalibrasi, personel/team leader, laporan survei pendahuluan, registrasi alat) menurut draf SMD;
- Bukti SMD RNI valid dan bukti penghantaran/semakan; **jangan rekaan status `VALID` daripada checklist lokal**;
- Catatan penemuan, tindak lanjut, serta keputusan pemeriksaan PIC/Balai.

Pemilik proses perlu menetapkan item mana yang khusus **wajib untuk Submit Tahap 4** berbanding prasyarat keseluruhan SMD, dan bagaimana bukti ini dikaitkan ke rekod melalui Storage/RPC.

## 5. Reka bentuk lifecycle yang masih memerlukan keputusan

Cadangan dalam `backend/proposals/stage4-validation-submit-review-candidate.sql`:
`DRAFT -> DIAJUKAN -> DISETUJUI | PERLU_REVISI`, dengan `expected_version`, role Penyedia/PIC Balai, audit atomik, dan gate penerimaan.

Ini **belum boleh dipasang** kerana fail tersebut hanya komen dan belum ada DDL executable; aturan bukti wajib, hubungan status `VALID` SMD, sempadan review PIC vs Berita Acara, serta cara transisi semula daripada `PERLU_REVISI` masih perlu dimuktamadkan.

### Langkah implementasi paling kecil sekarang

- Tambah `read-only technical length assessment` menggunakan kontrak baca yang telah terpasang atau endpoint status lokal. Jangan mengubah RPC save/read yang sudah E2E PASS.
- Paparkan kategori `LENGTH_WITHIN_TOLERANCE`, `LENGTH_REMEASUREMENT_REQUIRED`, `LENGTH_INCOMPLETE`, bersama nilai asal dan sumber KAK; *bukan* keseluruhan `PASS`/`FAIL`.
- Ujian unit sempadan: selisih 0, 30, 30.01, 34; data hilang/salah jenis; sempadan peranan; `status/tgl_valid` masih NULL; reload kekal sama.
- Kemudian bentangkan senarai keputusan minimum untuk approval reka bentuk lifecycle. **Dilarang migration, remote write, edit QA row 11, synthetic approval** dalam langkah ini.

## 6. Kriteria selesai langkah seterusnya

- Pengguna login boleh buka paket 11 -> Tahap 4 dan melihat penilaian selisih panjang yang betul setelah refresh.
- `34m` dipaparkan sebagai **memerlukan pengukuran ulang**, tanpa status rasmi PASS/FAIL atau gate Tahap 5.
- Satu rekod LRS sedia ada dan versi 1 tidak berubah; tiada RPC write dipanggil.
- Frontend/backend typecheck, build dan focused regression tests lulus.
- Laporan menyatakan dengan jelas fungsi yang *read-only evaluated* berbanding fungsi submit/review yang belum deployable.
