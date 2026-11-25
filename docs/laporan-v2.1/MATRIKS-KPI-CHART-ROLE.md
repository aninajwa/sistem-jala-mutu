# Matriks kebutuhan, KPI dan chart per role

Semua hitungan berasal dari `readLocalReports` V2 yang sudah membatasi principal.packageIds dan kesamaan identitas paket. Data kemudian melewati `filterReport` yang tidak diubah. `dashboardModel` tidak membaca store global lain atau endpoint baru.

## Pertanyaan utama dan visual

| Role | Pertanyaan operasional | Susunan grafik | Tindak lanjut |
|---|---|---|---|
| Penyedia | Apa yang sudah dicatat dan bagaimana status koreksi paket saya? | Area aktivitas bulanan; komposisi jenis (donut ≤6 kategori, bar horizontal jika lebih); stacked status kasus per paket; bar aktivitas per paket | Rekap aktivitas/kasus; draf laporan lokal |
| PIC Balai | Paket mana yang mempunyai aktivitas, pemeriksaan apa yang benar-benar tercatat, dan kasus apa yang belum ditutup? | Bar horizontal aktivitas antar-paket; bar status review; stacked kasus per paket; line aktivitas bulanan | Rekap pemeriksaan/kasus sesuai penugasan; tidak menciptakan antrean palsu |
| Direktorat | Bagaimana distribusi aktivitas dan tindak lanjut lintas Balai dalam monitoring saya? | Bar aktivitas per Balai; multi-line aktivitas per bulan/Balai; stacked kasus per Balai; stacked status review per Balai | Penelusuran rekap, bukan peringkat kualitas Balai |
| Admin | Mengapa pelaporan teknis tidak menjadi kewenangan saya? | Tidak ada KPI/grafik/ekspor teknis | Penjelasan akses rapi; administrasi tetap di modul yang sudah tersedia |

## KPI dan definisi tepat

| KPI | Role | Rumus / populasi | Klik |
|---|---|---|---|
| Paket penugasan / dalam kewenangan / terpantau | Tiga role teknis | Distinct ID paket dari snapshot scoped, disaring paket/Balai/jenis yang dipilih. Jika tanggal atau status aktif, hanya paket dengan setidaknya satu rekaman relevan pada salah satu dari tiga rekap terfilter | Tidak, karena paket tanpa aktivitas juga dapat termasuk; tidak membuka rekap yang seolah-olah jumlahnya identik |
| Balai terpantau | Direktorat | Distinct nama Balai non-kosong dari populasi paket di atas; model lokal belum menyediakan ID Balai kanonik untuk agregasi ini | Tidak; label menjelaskan cakupan |
| Aktivitas survei | Semua role teknis | Jumlah key aktivitas unik setelah scope dan seluruh filter | Rekap aktivitas, filter tetap |
| Pemeriksaan tercatat | Balai | Jumlah key review efektif pada periode aktif/bertahap yang tersedia, setelah filter; bukan semua histori audit | Rekap pemeriksaan, filter tetap |
| Tindakan aktif | Semua role teknis | Kasus unik berstatus Terbuka, Menunggu Persetujuan, Disetujui, Dilaksanakan, atau Verifikasi Ulang, setelah filter. Status tak dikenal tidak otomatis dianggap aktif | Tidak, karena filter status tunggal V2 tidak mengekspresikan gabungan lima status |
| Tindakan ditutup | Penyedia | Kasus unik dengan status sumber Ditutup, setelah filter. Bukan jumlah yang ditutup selama periode | Rekap kasus dengan status Ditutup jika tidak bertentangan dengan status aktif saat ini; kartu tidak mengubah filter bertentangan secara diam-diam |
| Panjang survei | Semua role teknis | Tidak dihitung, karena nilai sesi/API sah belum tersedia | Tidak; tanda —, bukan nol |

Tidak ada persentase kelulusan, target km, waktu layanan, atau denominator mutu baru. Paket tanpa rekaman tetap terlihat sebagai cakupan penugasan saat filter kejadian tidak aktif; ini sengaja berbeda dari KPI lama "paket dengan aktivitas survei". Catatan kecil pada kartu berubah menjadi "Paket dengan rekaman terfilter" saat tanggal/status aktif.

## Definisi setiap chart

| Grafik | Satuan/identitas | Basis tanggal | Interpretasi aman |
|---|---|---|---|
| Aktivitas bulanan | Aktivitas unik dikelompokkan YYYY-MM | Tanggal kegiatan valid | Bulan yang mempunyai rekaman pada snapshot lokal; bukan timeline seluruh realisasi kontrak. Tidak menginterpolasi angka sebagai hasil teknis |
| Jenis kegiatan | Aktivitas unik per survey | Sama | Komposisi kegiatan, bukan kepatuhan |
| Aktivitas per paket | Aktivitas unik per packageId; label menyertakan nama dan ID | Sama | Nama paket sama tidak digabung; bukan peringkat kualitas |
| Aktivitas per Balai | Aktivitas unik per nama Balai sumber | Sama | Hitungan volume pencatatan dalam cakupan, bukan mutu wilayah |
| Tren lintas Balai | Aktivitas unik per bulan × nama Balai | Sama | Nol pada seri di bulan yang memiliki rekaman lokal berarti tidak ada rekaman lokal pada seri tersebut, bukan bukti tidak ada pekerjaan di lapangan |
| Status review | Key review efektif per status sumber | Tanggal keputusan terkini; pending re-review tanpa tanggal lama | Tidak mengarang Belum Diperiksa untuk rekaman yang tidak ada |
| Status kasus per paket/Balai | Kasus unik × status terkini | Tenggat kasus, sesuai adapter V2 | Status kini, bukan tren pembukaan/penutupan atau kelulusan paket |

`groupRows` dan `splitRows` mencegah penghitungan ulang key yang sama. Adapter V2 tetap menolak identitas sumber ambigu sebelum agregasi. Total setiap stack sama dengan jumlah baris kasus/review pada grupnya. Tidak menjumlahkan entitas survei, review dan kasus menjadi satu KPI campuran.

## Warna, interaksi dan filter

Ikon/warna KPI: aktivitas/paket biru, review/ditutup hijau, aktif amber, km tidak tersedia netral. Status grafik memakai warna konsisten (Ditutup/Sesuai hijau; Terbuka/Temuan amber; status proses berbeda), dan legenda memakai warna yang sama dengan data. Bar satu seri tidak memiliki legenda berwarna seolah-olah bar berbeda warna.

Desktop menggunakan tooltip hover. Pointer kasar menggunakan trigger tap/click native Recharts agar tooltip bertahan setelah sentuhan, termasuk pada 360 px. Legend, label, detail source dan Lihat Semua dipertahankan. Chart kosong menjadi state ringkas dan tidak diberi data contoh. Kategori panjang memakai sumbu horizontal, nama lengkap tersedia pada tooltip/legend. Grafik kategori banyak/legend memiliki scroll internal tanpa melebarkan halaman.

Filter utama: paket + tanggal awal/akhir; rekap menambah jenis rekap. Filter lainnya: Balai, jenis survei, status. Indikator dan chip tetap terlihat meski panel dilipat; chip dapat dihapus satu per satu. Reset membersihkan filter, pencarian, pilihan rincian, dan kembali halaman pertama. Semua basis tanggal dan cakupan V2 dipertahankan; penjelasan ada di panel Dasar tanggal dan cakupan.

CSV tetap memakai seluruh hasil filter global, bukan hanya halaman tabel atau hasil pencarian teks. UI menjelaskannya; kontrak ekspor V2 tidak diubah. Lihat Semua mengganti jenis rekap dan mempertahankan filter global. Tabel mobile dapat digeser dalam region yang dapat difokuskan, dengan petunjuk geser dan scrollbar.
