# Keputusan desain pengembang V2.1

Keputusan berikut mendukung monitoring menurut KAK/Draft PP dan arah revisi pengguna; detail visual dan mekanisme browser bukan ketentuan eksplisit dokumen resmi. Struktur format laporan periodik belum dinyatakan sebagai format resmi final.

## 1. P0 identitas draf pada HTTP

**Masalah:** baseline memanggil crypto.randomUUID saat render. API tersebut tidak tersedia pada origin HTTP non-secure, walaupun Crypto.getRandomValues tersedia. Error berhasil direproduksi pada source terbaru, bukan sekadar dugaan dari screenshot.

**Dasar eksplisit:** KAK §11.10.6 dan ERD 07a menuntut keterlacakan/versi; tidak menetapkan library pembuat ID browser.

**Interpretasi dan keputusan:** identitas lokal dibutuhkan saat simpan/ekspor. Render menggunakan id kosong untuk draf baru, sehingga tidak bergantung API secure-context. createLocalId menggunakan randomUUID native bila tersedia; jika tidak, 16 byte getRandomValues dibentuk menjadi UUID v4 (122 bit acak setelah bit versi/varian). Tidak memakai Math.random, tanggal saja, atau counter saja. ID yang sudah tersimpan tidak diganti.

**Alasan/alternatif:** penggantian langsung dengan Math.random atau Date.now lebih mudah tetapi tidak memberi karakteristik keunikan lintas tab/perangkat yang memadai. Memaksa pengguna HTTPS hanya untuk membuka draf tidak menyelesaikan bug frontend HTTP yang dilaporkan. Fallback CSPRNG memiliki probabilitas tabrakan sangat kecil, bukan jaminan absolut; pengujian 10.000 ID unik hanyalah sanity check, bukan pembuktian matematis keunikan global. ID bukan token akses.

**Konsekuensi:** jika kedua API kripto tidak tersedia, halaman tetap terbuka; aksi simpan/ekspor menampilkan error dan mempertahankan isi. Backend tetap harus menerbitkan/menegakkan ID dan otorisasi otoritatif saat integrasi. Tidak ada submit lintas pengguna baru.

**Konfirmasi tersisa:** migrasi draf lokal ke registri server, collision/revision handling server, identitas dokumen resmi.

## 2. Role menentukan pertanyaan dashboard

**Masalah:** V2 lebih banyak mengganti urutan KPI daripada pertanyaan grafik.

**Dasar eksplisit:** Flowchart 05a/05b; KAK §11.10.2; ERD 02/06/07b. Penyedia melaksanakan, Balai memeriksa, Direktorat memonitor, Admin mengelola master/administrasi.

**Interpretasi/keputusan:** Penyedia mendapatkan tren pelaksanaan dan koreksi; Balai perbandingan paket serta status review; Direktorat perbandingan dan tren lintas Balai. Matriks rinci ada di MATRIKS-KPI-CHART-ROLE.md. Jumlah aktivitas tidak dijadikan skor mutu, ranking, atau kelulusan.

**Alasan/alternatif:** tidak menyalin Ringkasan QA/QC atau menambah grafik review kosong pada Penyedia hanya untuk menyamakan layout. Donut dibatasi enam kategori sebagai pilihan desain keterbacaan, bukan aturan bisnis. Perbandingan kategori panjang memakai bar horizontal; status memakai stack dengan total sama sumber.

**Konsekuensi:** data input tetap adapter V2. Histori tidak tersedia tidak dibuat. Km tetap tanda —; tidak ada konversi count→km. Paket dan Balai dihitung sebagai cakupan, bukan denominator kepatuhan. Label Balai lokal belum merupakan ID geografis kanonik.

**Konfirmasi:** definisi target/progres kontrak, agregasi km, ID Balai server dan cakupan multi-Balai yang otoritatif.

## 3. KPI, filter, dan makna periode

**Masalah:** KPI datar, filter rapat, panel tinggi di HP.

**Dasar eksplisit:** kebutuhan monitoring dan akses scoped; detail UI merupakan keputusan pengembang berdasarkan permintaan pengguna D/E.

**Keputusan:** ikon lingkaran lembut, angka besar, catatan cakupan, warna semantik dan kartu seimbang. Kartu hanya clickable bila mempunyai rekap yang sesuai. Aktif adalah lima status kasus non-ditutup yang sudah ada; ditutup berdasarkan status kini, bukan histori penutupan. Paket assignment termasuk paket tanpa aktivitas saat filter kejadian tidak aktif; tanggal/status membatasinya ke paket dengan rekaman relevan.

Filter utama paket/tanggal, jenis rekap di halaman rekap, serta panel Filter lainnya untuk Balai/jenis/status. Indikator dan chip memperlihatkan filter yang tetap berlaku walau panel tertutup. Reset kembali halaman pertama dan membersihkan pencarian. Basis tanggal tetap tanggal kegiatan / keputusan efektif / tenggat kasus. Pencarian hanya tampilan; CSV tetap hasil filter global sebagaimana V2.

**Alternatif:** menghapus filter pada mobile atau mengganti makna tanggal supaya grafik lebih penuh ditolak. Membuat KPI aktif membuka semua kasus tanpa penjelasan ditolak karena jumlahnya berbeda. Kartu Ditutup tidak membuka populasi lain ketika status filter bertentangan.

**Konsekuensi:** tidak ada endpoint/enum/filter backend baru. Filter tetap state halaman, belum bookmark URL persisten. Informasi cakupan ditampilkan singkat; pasal KAK tetap dokumentasi.

**Konfirmasi:** kebutuhan deep-link filter server dan ekspor pencarian jika kelak diminta.

## 4. Interaksi sentuh dan responsive

**Masalah:** pada 360 px tooltip hover tidak selalu bertahan setelah tap; input tanggal/tabel sulit dibaca.

**Dasar:** keputusan UX, bukan ketentuan teknis KAK. Fitur Recharts yang disukai harus tetap bekerja.

**Keputusan:** tooltip native Recharts memakai hover untuk pointer halus dan click/tap untuk pointer kasar. Bukan pengganti chart dengan gambar statis. Grid tanggal dua kolom HP, paket selebar baris, kontrol sentuh memadai, filter lanjutan dilipat. Tabel tetap memuat seluruh kolom pada scroll region internal dengan petunjuk dan keyboard focus. Form periodik satu kolom di HP; katalog dilipat secara default agar form lebih cepat dicapai, tetap dapat dibuka. Desktop katalog terbuka.

**Alternatif:** menyembunyikan kolom rincian/CSV, membuat tabel potong tanpa scroll, atau menghapus tooltip ditolak. Card-per-row dipertimbangkan tetapi dipilih scroll region untuk mempertahankan perbandingan kolom dan perilaku V2.

**Konsekuensi:** semua perubahan gaya di namespace rv, tanpa selector Ringkasan. Work memakai emulasi sentuh Chromium pada 360/390, tablet 768, desktop 1440; bukan klaim pengujian Android fisik. HTTP alias pada test runner benar-benar menghasilkan isSecureContext false tanpa memalsukan randomUUID untuk skenario utama.

## 5. Penyimpanan draf dan lampiran

**Masalah:** data rusak tidak boleh diam-diam ditimpa, async pembacaan lama tidak boleh menggantikan lampiran konteks baru, dan quota failure harus terlihat.

**Dasar eksplisit:** KAK §11.10.6, ERD 07a versi dokumen; kapasitas browser bukan ketentuan sumber resmi.

**Keputusan:** namespace jala-report-drafts-v2:<principal> dipertahankan. readDraftHistory memeriksa struktur, jenis, identitas versi dan metadata; append membaca ulang sebelum menambah versi dan mempertahankan arsip milik owner yang sementara keluar assignment. Izin/identitas diperiksa sebelum tulis. Data rusak menolak save; quota menampilkan error tanpa pesan sukses. Pembacaan file menggunakan urutan token agar pembacaan lama dibuang setelah pilihan/konteks berubah; save/JSON disabled selama pembacaan. Versi lama tidak dimutasi. Paket yang tidak lagi dalam scope tidak menampilkan isi draf.

**Alternatif:** mengganti namespace dan mengosongkan riwayat, menulis ke store BA, atau membuat pengajuan multiuser lokal palsu ditolak. Batas PDF/PNG/JPEG total 2 MB per versi tetap V2; belum menjadi kebijakan upload server.

**Konsekuensi:** localStorage masih satu browser/origin, tanpa transaksi multi-tab atomik, enkripsi atau arsip resmi. HTTP LAN dan localhost berbeda origin: draf localhost tidak otomatis muncul pada alamat HP. JSON menyediakan salinan draf, bukan laporan sah. Tidak ada migrasi diam-diam.

**Konfirmasi:** kebijakan retensi/upload, multiuser/concurrency server, template empat laporan dan jalur pengesahan resmi.
