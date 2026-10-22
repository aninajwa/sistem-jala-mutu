/* KANDIDAT HASIL EKSTRAKSI DOCX.
   Belum boleh digunakan sebagai gate final.
   Tipe jawaban dan struktur tabel perlu diperiksa. */
import type { Stage3BTemplate } from './stage3bChecklistData.generated';

export const STAGE3B_DOCX_CANDIDATES: Stage3BTemplate[] = [
  {
    "id": "docx-1-lalu-lintas-periodic14",
    "survey": "Lalu Lintas",
    "phase": "periodic14",
    "items": [
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0001",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "No. Dokumen: _____________________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0002",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tanggal: _____________________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0003",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Periode: _____________________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0004",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Lokasi: _____________________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0005",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tim Surveyor: _____________________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0006",
        "section": "1. Kegiatan Survei yang Dilakukan",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Kegiatan Survei yang Dilakukan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Lokasi Survei",
            "Tanggal Pelaksanaan",
            "Status Penyelesaian",
            "Surveyor Penanggung Jawab"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3.",
            "4.",
            "5."
          ],
          "source_rows": [
            [
              "1.",
              "",
              "",
              "□ Selesai □ Proses",
              ""
            ],
            [
              "2.",
              "",
              "",
              "□ Selesai □ Proses",
              ""
            ],
            [
              "3.",
              "",
              "",
              "□ Selesai □ Proses",
              ""
            ],
            [
              "4.",
              "",
              "",
              "□ Selesai □ Proses",
              ""
            ],
            [
              "5.",
              "",
              "",
              "□ Selesai □ Proses",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0007",
        "section": "2. Rekap Jumlah Survei 2 Mingguan",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Rekap Jumlah Survei 2 Mingguan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Parameter",
            "Jumlah",
            "Keterangan"
          ],
          "row_labels": [
            "Jumlah titik TC yang direncanakan",
            "Jumlah titik TC yang telah dilaksanakan",
            "Persentase penyelesaian (%)",
            "Jumlah data yang telah divalidasi",
            "Jumlah data yang perlu disurvei ulang"
          ],
          "source_rows": [
            [
              "Jumlah titik TC yang direncanakan",
              "",
              ""
            ],
            [
              "Jumlah titik TC yang telah dilaksanakan",
              "",
              ""
            ],
            [
              "Persentase penyelesaian (%)",
              "",
              ""
            ],
            [
              "Jumlah data yang telah divalidasi",
              "",
              ""
            ],
            [
              "Jumlah data yang perlu disurvei ulang",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0008",
        "section": "1. Kelengkapan Dokumentasi Administrasi",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Kelengkapan Dokumentasi Administrasi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Dokumen",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6"
          ],
          "source_rows": [
            [
              "1.1",
              "Surat izin survei",
              "□ Lengkap □ Tidak □ N/A",
              ""
            ],
            [
              "1.2",
              "Berita acara pelaksanaan",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.3",
              "Form pencatatan harian",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.4",
              "Dokumentasi pelaksanaan survei",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.5",
              "Log book kegiatan survei",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.6",
              "Notulensi koordinasi tim",
              "□ Lengkap □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0009",
        "section": "2. Verifikasi Administrasi Personil",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Verifikasi Administrasi Personil",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4"
          ],
          "source_rows": [
            [
              "2.1",
              "Kehadiran tim survei sesuai jadwal",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "2.2",
              "Rotasi personil sesuai rencana",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "2.3",
              "Pencatatan jam kerja personil",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "2.4",
              "Pelatihan personil tambahan (jika ada)",
              "□ Dilakukan □ Tidak □ N/A",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0010",
        "section": "1. Kesesuaian Metode",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Kesesuaian Metode",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6"
          ],
          "source_rows": [
            [
              "1.1",
              "Metode survei sesuai dengan KAK",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.2",
              "Penempatan peralatan sesuai prosedur",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.3",
              "Durasi survei sesuai ketentuan (3x24 jam)",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.4",
              "Waktu mulai survei sesuai standar (00.00)",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.5",
              "Penggunaan alat bantu sesuai kebutuhan",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.6",
              "Metode pencatatan sesuai protokol",
              "□ Sesuai □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0011",
        "section": "2. Verifikasi Peralatan Survei",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Verifikasi Peralatan Survei",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6"
          ],
          "source_rows": [
            [
              "2.1",
              "Kesesuaian spesifikasi peralatan",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "2.2",
              "Kondisi peralatan (kamera, tripod, dll)",
              "□ Baik □ Rusak",
              ""
            ],
            [
              "2.3",
              "Kalibrasi peralatan masih berlaku",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "2.4",
              "Ketersediaan peralatan cadangan",
              "□ Tersedia □ Tidak",
              ""
            ],
            [
              "2.5",
              "Sistem penyimpanan data berfungsi",
              "□ Berfungsi □ Tidak",
              ""
            ],
            [
              "2.6",
              "Sumber daya listrik memadai",
              "□ Memadai □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0012",
        "section": "1. Kelengkapan Data",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Kelengkapan Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Validasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6"
          ],
          "source_rows": [
            [
              "1.1",
              "Data pencatatan 24 jam pertama",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.2",
              "Data pencatatan 24 jam kedua",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.3",
              "Data pencatatan 24 jam ketiga",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.4",
              "Kelengkapan klasifikasi kendaraan",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.5",
              "Kelengkapan pencatatan arah pergerakan",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.6",
              "Kelengkapan metadata (koordinat, waktu)",
              "□ Lengkap □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0013",
        "section": "2. Validasi Kualitas Data",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Validasi Kualitas Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Validasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6"
          ],
          "source_rows": [
            [
              "2.1",
              "Konsistensi data antar hari",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.2",
              "Pola fluktuasi lalu lintas wajar",
              "□ Wajar □ Tidak",
              ""
            ],
            [
              "2.3",
              "Komposisi kendaraan sesuai karakteristik jalan",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "2.4",
              "Jam puncak sesuai dengan pola normal",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "2.5",
              "Perbandingan volume antar arah wajar",
              "□ Wajar □ Tidak",
              ""
            ],
            [
              "2.6",
              "Tidak ada data yang hilang/kosong",
              "□ Ya □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0014",
        "section": "3. Validasi Khusus Sampel Data",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Validasi Khusus Sampel Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Validasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4"
          ],
          "source_rows": [
            [
              "3.1",
              "Pengujian ulang sampel data (5% data)",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "3.2",
              "Deviasi hasil pengujian ulang (<5%)",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "3.3",
              "Cross-check dengan data sekunder (jika ada)",
              "□ Sesuai □ Tidak □ N/A",
              ""
            ],
            [
              "3.4",
              "Validasi metode pencacahan dengan pengamat kedua",
              "□ Sesuai □ Tidak",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0015",
        "section": "1. Format Data",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Format Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5"
          ],
          "source_rows": [
            [
              "1.1",
              "Format data sesuai ketentuan SMD Jalan",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.2",
              "Struktur data rekapitulasi konsisten",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.3",
              "Format penamaan file sesuai protokol",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.4",
              "Format metadata terstruktur dengan baik",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "1.5",
              "Penggunaan satuan pengukuran konsisten",
              "□ Konsisten □ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0016",
        "section": "2. Metode Analisis",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Metode Analisis",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6"
          ],
          "source_rows": [
            [
              "2.1",
              "Metode perhitungan LHR sesuai standar",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "2.2",
              "Faktor konversi SMP sesuai standar",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "2.3",
              "Perhitungan fluktuasi jam puncak tepat",
              "□ Tepat □ Tidak",
              ""
            ],
            [
              "2.4",
              "Metode perhitungan derajat kejenuhan sesuai",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "2.5",
              "Analisis distribusi kendaraan tepat",
              "□ Tepat □ Tidak",
              ""
            ],
            [
              "2.6",
              "Metode pengelompokan data sudah benar",
              "□ Benar □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0017",
        "section": "1. Kelengkapan Laporan",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Kelengkapan Laporan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6"
          ],
          "source_rows": [
            [
              "1.1",
              "Laporan hasil survei lengkap",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.2",
              "Dokumentasi foto dan video tersedia",
              "□ Tersedia □ Tidak",
              ""
            ],
            [
              "1.3",
              "Tabel hasil pencacahan lengkap",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.4",
              "Grafik fluktuasi lalu lintas tersedia",
              "□ Tersedia □ Tidak",
              ""
            ],
            [
              "1.5",
              "Sketsa lokasi survei tersedia",
              "□ Tersedia □ Tidak",
              ""
            ],
            [
              "1.6",
              "Kesimpulan dan analisis disajikan",
              "□ Disajikan □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0018",
        "section": "2. Kualitas Penyajian",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Kualitas Penyajian",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6"
          ],
          "source_rows": [
            [
              "2.1",
              "Format tabel mudah dibaca",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "2.2",
              "Grafik informatif dan sesuai standar",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "2.3",
              "Ukuran font dan tata letak sesuai",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "2.4",
              "Penggunaan satuan konsisten",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.5",
              "Kualitas gambar/foto memadai",
              "□ Memadai □ Tidak",
              ""
            ],
            [
              "2.6",
              "Tidak ada kesalahan penulisan/format",
              "□ Ya □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0019",
        "section": "1. Permasalahan yang Ditemukan Selama 2 Minggu",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Permasalahan yang Ditemukan Selama 2 Minggu",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Permasalahan",
            "Dampak",
            "Lokasi/Tanggal",
            "Status"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3.",
            "4.",
            "5."
          ],
          "source_rows": [
            [
              "1.",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ],
            [
              "2.",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ],
            [
              "3.",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ],
            [
              "4.",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ],
            [
              "5.",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0020",
        "section": "2. Identifikasi Risiko untuk 2 Minggu Kedepan",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Identifikasi Risiko untuk 2 Minggu Kedepan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Risiko Potensial",
            "Dampak",
            "Mitigasi",
            "PIC"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3.",
            "4.",
            "5."
          ],
          "source_rows": [
            [
              "1.",
              "",
              "",
              "",
              ""
            ],
            [
              "2.",
              "",
              "",
              "",
              ""
            ],
            [
              "3.",
              "",
              "",
              "",
              ""
            ],
            [
              "4.",
              "",
              "",
              "",
              ""
            ],
            [
              "5.",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0021",
        "section": "1. Tindakan Perbaikan untuk Temuan",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Tindakan Perbaikan untuk Temuan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Temuan",
            "Tindakan Perbaikan",
            "Target Penyelesaian",
            "PIC"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3.",
            "4.",
            "5."
          ],
          "source_rows": [
            [
              "1.",
              "",
              "",
              "",
              ""
            ],
            [
              "2.",
              "",
              "",
              "",
              ""
            ],
            [
              "3.",
              "",
              "",
              "",
              ""
            ],
            [
              "4.",
              "",
              "",
              "",
              ""
            ],
            [
              "5.",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0022",
        "section": "2. Rekomendasi untuk Peningkatan",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Rekomendasi untuk Peningkatan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Area Peningkatan",
            "Rekomendasi",
            "Prioritas",
            "PIC"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3.",
            "4.",
            "5."
          ],
          "source_rows": [
            [
              "1.",
              "",
              "",
              "□ Tinggi □ Sedang □ Rendah",
              ""
            ],
            [
              "2.",
              "",
              "",
              "□ Tinggi □ Sedang □ Rendah",
              ""
            ],
            [
              "3.",
              "",
              "",
              "□ Tinggi □ Sedang □ Rendah",
              ""
            ],
            [
              "4.",
              "",
              "",
              "□ Tinggi □ Sedang □ Rendah",
              ""
            ],
            [
              "5.",
              "",
              "",
              "□ Tinggi □ Sedang □ Rendah",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0023",
        "section": "1. Jadwal Survei",
        "options": [],
        "required": false,
        "order": 23,
        "sourceOrder": 23,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Jadwal Survei",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Lokasi",
            "Tanggal Rencana",
            "Metode",
            "Tim Surveyor"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3.",
            "4.",
            "5."
          ],
          "source_rows": [
            [
              "1.",
              "",
              "",
              "",
              ""
            ],
            [
              "2.",
              "",
              "",
              "",
              ""
            ],
            [
              "3.",
              "",
              "",
              "",
              ""
            ],
            [
              "4.",
              "",
              "",
              "",
              ""
            ],
            [
              "5.",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0024",
        "section": "2. Alokasi Sumber Daya",
        "options": [],
        "required": false,
        "order": 24,
        "sourceOrder": 24,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Alokasi Sumber Daya",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Jenis Sumber Daya",
            "Jumlah",
            "Lokasi Penugasan",
            "Keterangan"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3.",
            "4.",
            "5."
          ],
          "source_rows": [
            [
              "1.",
              "Personil",
              "",
              "",
              ""
            ],
            [
              "2.",
              "Peralatan Utama",
              "",
              "",
              ""
            ],
            [
              "3.",
              "Peralatan Cadangan",
              "",
              "",
              ""
            ],
            [
              "4.",
              "Kendaraan",
              "",
              "",
              ""
            ],
            [
              "5.",
              "Lainnya",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0025",
        "section": "J. PERSETUJUAN VERIFIKASI DAN VALIDASI",
        "options": [],
        "required": false,
        "order": 25,
        "sourceOrder": 25,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: J. PERSETUJUAN VERIFIKASI DAN VALIDASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Pihak",
            "Nama",
            "Jabatan",
            "Tanda Tangan",
            "Tanggal"
          ],
          "row_labels": [
            "Tim QA/QC Penyedia Jasa",
            "Surveyor Penanggung Jawab",
            "Pengawas dari Pengguna Jasa",
            "PPK Fisik"
          ],
          "source_rows": [
            [
              "Tim QA/QC Penyedia Jasa",
              "",
              "",
              "",
              ""
            ],
            [
              "Surveyor Penanggung Jawab",
              "",
              "",
              "",
              ""
            ],
            [
              "Pengawas dari Pengguna Jasa",
              "",
              "",
              "",
              ""
            ],
            [
              "PPK Fisik",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0026",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 26,
        "sourceOrder": 26,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi kegiatan survei 2 mingguan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0027",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 27,
        "sourceOrder": 27,
        "unit": "",
        "rule": {},
        "label": "Sampel data hasil pencacahan lalu lintas",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0028",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 28,
        "sourceOrder": 28,
        "unit": "",
        "rule": {},
        "label": "Grafik hasil analisis survei lalu lintas",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0029",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 29,
        "sourceOrder": 29,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi permasalahan yang ditemukan (jika ada)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0030",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 30,
        "sourceOrder": 30,
        "unit": "",
        "rule": {},
        "label": "Log perubahan/perbaikan yang dilakukan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0031",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 31,
        "sourceOrder": 31,
        "unit": "",
        "rule": {},
        "label": "Hasil pengujian ulang (repeatability) sampel data",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_PERIODIC14_0032",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 32,
        "sourceOrder": 32,
        "unit": "",
        "rule": {},
        "label": "Berita acara koordinasi antara Penyedia Jasa dan Pengguna Jasa",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-2-lalu-lintas-consistency",
    "survey": "Lalu Lintas",
    "phase": "consistency",
    "items": [
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0001",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "No. Dokumen: _____________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0002",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tanggal : _____________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0003",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Lokasi: _____________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0004",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tim Surveyor: _____________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0005",
        "section": "1. Konsistensi Kamera Perekam",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Konsistensi Kamera Perekam",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7",
            "1.8"
          ],
          "source_rows": [
            [
              "1.1",
              "Konsistensi kualitas rekaman (24 jam pertama)",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.2",
              "Konsistensi kualitas rekaman (24 jam kedua)",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.3",
              "Konsistensi kualitas rekaman (24 jam ketiga)",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.4",
              "Konsistensi rekaman siang hari",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.5",
              "Konsistensi rekaman malam hari",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.6",
              "Konsistensi frame rate selama perekaman",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.7",
              "Konsistensi sudut pandang kamera",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.8",
              "Stabilitas tripod dan mounting selama 3x24 jam",
              "□ Stabil □ Tidak",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0006",
        "section": "2. Konsistensi Perangkat Penunjang",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Konsistensi Perangkat Penunjang",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6"
          ],
          "source_rows": [
            [
              "2.1",
              "Stabilitas sumber listrik selama survei",
              "□ Stabil □ Tidak",
              ""
            ],
            [
              "2.2",
              "Konsistensi performa perangkat penyimpanan",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.3",
              "Konsistensi koneksi antar perangkat",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.4",
              "Stabilitas jaringan (untuk IP Camera)",
              "□ Stabil □ Tidak",
              ""
            ],
            [
              "2.5",
              "Konsistensi sinkronisasi waktu antar perangkat",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.6",
              "Konsistensi GPS tagging selama survei",
              "□ Konsisten □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0007",
        "section": "1. Konsistensi Lokasi",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Konsistensi Lokasi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6"
          ],
          "source_rows": [
            [
              "1.1",
              "Konsistensi posisi titik survei selama 3x24 jam",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.2",
              "Konsistensi area cakupan pandangan",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.3",
              "Konsistensi jarak pandang (dekat, menengah, jauh)",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.4",
              "Konsistensi dalam pengamatan semua lajur",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.5",
              "Konsistensi dalam menangkap pergerakan kendaraan",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.6",
              "Konsistensi pengamatan pada titik masuk/keluar",
              "□ Konsisten □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0008",
        "section": "2. Konsistensi Waktu",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Konsistensi Waktu",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6"
          ],
          "source_rows": [
            [
              "2.1",
              "Konsistensi jam mulai survei setiap hari (00.00)",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.2",
              "Konsistensi pencatatan waktu setiap jam",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.3",
              "Konsistensi durasi interval pencatatan",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.4",
              "Konsistensi jam puncak yang tercatat",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.5",
              "Konsistensi pencatatan waktu antara hari ke-1, 2, dan 3",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.6",
              "Konsistensi tidak adanya gap waktu dalam perekaman",
              "□ Konsisten □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0009",
        "section": "1. Konsistensi Metode Manual",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Konsistensi Metode Manual",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6"
          ],
          "source_rows": [
            [
              "1.1",
              "Konsistensi penempatan surveyor di lapangan",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.2",
              "Konsistensi rotasi petugas pencatat",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.3",
              "Konsistensi format pencatatan (tally sheet)",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.4",
              "Konsistensi metode perhitungan antar petugas",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.5",
              "Konsistensi klasifikasi kendaraan antar petugas",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.6",
              "Konsistensi penandaan arah pergerakan kendaraan",
              "□ Konsisten □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0010",
        "section": "2. Konsistensi Metode Tidak Langsung (Rekaman)",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Konsistensi Metode Tidak Langsung (Rekaman)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6"
          ],
          "source_rows": [
            [
              "2.1",
              "Konsistensi pemutaran ulang rekaman",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.2",
              "Konsistensi metode pencacahan dari rekaman",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.3",
              "Konsistensi operator analisis rekaman",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.4",
              "Konsistensi kecepatan pemutaran untuk analisis",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.5",
              "Konsistensi penggunaan perangkat lunak analisis",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.6",
              "Konsistensi identifikasi kendaraan dari rekaman",
              "□ Konsisten □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0011",
        "section": "1. Konsistensi Identifikasi Jenis Kendaraan",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Konsistensi Identifikasi Jenis Kendaraan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7",
            "1.8"
          ],
          "source_rows": [
            [
              "1.1",
              "Konsistensi identifikasi sepeda motor",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.2",
              "Konsistensi identifikasi kendaraan ringan",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.3",
              "Konsistensi identifikasi bus kecil",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.4",
              "Konsistensi identifikasi bus besar",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.5",
              "Konsistensi identifikasi truk ringan (2 sumbu)",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.6",
              "Konsistensi identifikasi truk sedang (3 sumbu)",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.7",
              "Konsistensi identifikasi truk berat (>3 sumbu)",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.8",
              "Konsistensi identifikasi kendaraan tidak bermotor",
              "□ Konsisten □ Tidak",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0012",
        "section": "2. Konsistensi Antar Operator",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Konsistensi Antar Operator",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5"
          ],
          "source_rows": [
            [
              "2.1",
              "Konsistensi klasifikasi antar operator (sampel kecil)",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.2",
              "Deviasi hasil perhitungan antar operator (<5%)",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "2.3",
              "Konsistensi interpretasi jenis kendaraan antar operator",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.4",
              "Konsistensi pencatatan kendaraan campuran",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.5",
              "Konsistensi dalam menangani kasus ambigu",
              "□ Konsisten □ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0013",
        "section": "1. Konsistensi Harian",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Konsistensi Harian",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5"
          ],
          "source_rows": [
            [
              "1.1",
              "Pola volume lalu lintas harian konsisten",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.2",
              "Pola jam puncak konsisten antar hari",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.3",
              "Komposisi kendaraan konsisten antar hari",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.4",
              "Konsistensi volume pada jam tenang (malam hari)",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.5",
              "Konsistensi total volume harian dalam kisaran wajar",
              "□ Konsisten □ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0014",
        "section": "2. Konsistensi Sampel (Uji Repeatability)",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Konsistensi Sampel (Uji Repeatability)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4"
          ],
          "source_rows": [
            [
              "2.1",
              "Repeatability pengukuran pada segmen sampel 1 jam",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.2",
              "Deviasi pengulangan pencacahan sampel <5%",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "2.3",
              "Konsistensi hasil dengan kondisi lapangan",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.4",
              "Konsistensi antar metode pencacahan (jika ada)",
              "□ Konsisten □ Tidak",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0015",
        "section": "1. Konsistensi Format Data",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Konsistensi Format Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6"
          ],
          "source_rows": [
            [
              "1.1",
              "Konsistensi format pencatatan per jamnya",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.2",
              "Konsistensi format rekapitulasi harian",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.3",
              "Konsistensi format pengolahan data",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.4",
              "Konsistensi satuan pengukuran yang digunakan",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.5",
              "Konsistensi penggunaan faktor konversi",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.6",
              "Konsistensi format data untuk SMD Jalan",
              "□ Konsisten □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0016",
        "section": "2. Konsistensi Analisis",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Konsistensi Analisis",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6"
          ],
          "source_rows": [
            [
              "2.1",
              "Konsistensi metode penghitungan LHR",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.2",
              "Konsistensi perhitungan derajat kejenuhan",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.3",
              "Konsistensi penentuan faktor k dan faktor direktional",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.4",
              "Konsistensi perhitungan distribusi jenis kendaraan",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.5",
              "Konsistensi konversi ke satuan mobil penumpang (SMP)",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.6",
              "Konsistensi penyajian grafik fluktuasi lalu lintas",
              "□ Konsisten □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0017",
        "section": "1. Konsistensi dengan Data Historis",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Konsistensi dengan Data Historis",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3"
          ],
          "source_rows": [
            [
              "1.1",
              "Kesesuaian tren dengan data historis lokasi sama",
              "□ Sesuai □ Tidak □ N/A",
              ""
            ],
            [
              "1.2",
              "Pertumbuhan volume dalam kisaran normal",
              "□ Ya □ Tidak □ N/A",
              ""
            ],
            [
              "1.3",
              "Konsistensi distribusi kendaraan dengan data historis",
              "□ Konsisten □ Tidak □ N/A",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0018",
        "section": "2. Konsistensi dengan Data Sekitar",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Konsistensi dengan Data Sekitar",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3"
          ],
          "source_rows": [
            [
              "2.1",
              "Konsistensi dengan lokasi TC terdekat",
              "□ Konsisten □ Tidak □ N/A",
              ""
            ],
            [
              "2.2",
              "Konsistensi dengan karakteristik jalan serupa",
              "□ Konsisten □ Tidak □ N/A",
              ""
            ],
            [
              "2.3",
              "Konsistensi dengan data dari persimpangan terkait",
              "□ Konsisten □ Tidak □ N/A",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0019",
        "section": "1. Pengulangan Pemrosesan",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Pengulangan Pemrosesan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3"
          ],
          "source_rows": [
            [
              "1.1",
              "Pemrosesan ulang menghasilkan hasil sama",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "1.2",
              "Pengolahan oleh operator berbeda hasilnya konsisten",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.3",
              "Hasil akhir bertahan setelah pengujian silang",
              "□ Ya □ Tidak",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0020",
        "section": "2. Uji Cross-check",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Uji Cross-check",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3"
          ],
          "source_rows": [
            [
              "2.1",
              "Sampel cross-check antara data mentah dan olahan",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.2",
              "Cross-check antar format laporan (perhitungan sama)",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.3",
              "Cross-check dengan metode analisis alternatif",
              "□ Konsisten □ Tidak",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0021",
        "section": "1. Konsistensi Total",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Konsistensi Total",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4"
          ],
          "source_rows": [
            [
              "1.1",
              "Konsistensi keseluruhan data 3x24 jam",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.2",
              "Konsistensi seluruh parameter utama",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.3",
              "Data telah melewati semua uji konsistensi",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "1.4",
              "Data cocok untuk digunakan dalam analisis lanjutan",
              "□ Ya □ Tidak",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0022",
        "section": "2. Temuan Inkonsistensi dan Mitigasi",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Temuan Inkonsistensi dan Mitigasi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Temuan Inkonsistensi",
            "Dampak",
            "Tindakan Mitigasi",
            "Status"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3.",
            "4.",
            "5."
          ],
          "source_rows": [
            [
              "1.",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ],
            [
              "2.",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ],
            [
              "3.",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ],
            [
              "4.",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ],
            [
              "5.",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0023",
        "section": "J. VALIDASI KONSISTENSI",
        "options": [],
        "required": false,
        "order": 23,
        "sourceOrder": 23,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: J. VALIDASI KONSISTENSI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Pihak",
            "Nama",
            "Jabatan",
            "Tanda Tangan",
            "Tanggal"
          ],
          "row_labels": [
            "Tim QA/QC",
            "Surveyor",
            "Pengawas",
            "Pengguna Jasa"
          ],
          "source_rows": [
            [
              "Tim QA/QC",
              "",
              "",
              "",
              ""
            ],
            [
              "Surveyor",
              "",
              "",
              "",
              ""
            ],
            [
              "Pengawas",
              "",
              "",
              "",
              ""
            ],
            [
              "Pengguna Jasa",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0024",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 24,
        "sourceOrder": 24,
        "unit": "",
        "rule": {},
        "label": "Grafik perbandingan data harian (3 hari)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0025",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 25,
        "sourceOrder": 25,
        "unit": "",
        "rule": {},
        "label": "Hasil pengujian repeatability",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0026",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 26,
        "sourceOrder": 26,
        "unit": "",
        "rule": {},
        "label": "Tabel deviasi antar operator",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0027",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 27,
        "sourceOrder": 27,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi uji konsistensi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0028",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 28,
        "sourceOrder": 28,
        "unit": "",
        "rule": {},
        "label": "Hasil cross-check dengan data historis (jika ada)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_CONSISTENCY_0029",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 29,
        "sourceOrder": 29,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi tindakan mitigasi untuk inkonsistensi yang ditemukan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-3-lalu-lintas-internal",
    "survey": "Lalu Lintas",
    "phase": "internal",
    "items": [
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0001",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "CHECKLIST VERIFIKASI DAN VALIDASI INTERNAL",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0002",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "SURVEI LALU LINTAS (3 x 24 JAM)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0003",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "No. Dokumen: _____________________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0004",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tanggal: _____________________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0005",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Periode: _____________________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0006",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Lokasi: _____________________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0007",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tim Surveyor: _____________________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0008",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Validator: _____________________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0009",
        "section": "1. Persiapan Administrasi",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Persiapan Administrasi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6"
          ],
          "source_rows": [
            [
              "1.1",
              "Surat tugas tim survei",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.2",
              "Surat izin pelaksanaan survei",
              "□ Lengkap □ Tidak □ N/A",
              ""
            ],
            [
              "1.3",
              "Koordinasi dengan pihak terkait (Kepolisian/PJR)",
              "□ Sudah □ Belum □ N/A",
              ""
            ],
            [
              "1.4",
              "Jadwal pelaksanaan survei",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.5",
              "Form pencatatan survei",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.6",
              "Dokumen KAK dan kelengkapan kontrak terkait",
              "□ Lengkap □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0010",
        "section": "2. Persiapan Tim Survei",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Persiapan Tim Survei",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7"
          ],
          "source_rows": [
            [
              "2.1",
              "Briefing tim survei",
              "□ Dilakukan □ Belum",
              ""
            ],
            [
              "2.2",
              "Pelatihan penggunaan alat",
              "□ Dilakukan □ Belum",
              ""
            ],
            [
              "2.3",
              "Pelatihan metode pencatatan",
              "□ Dilakukan □ Belum",
              ""
            ],
            [
              "2.4",
              "Pemahaman klasifikasi kendaraan",
              "□ Paham □ Belum",
              ""
            ],
            [
              "2.5",
              "Alokasi tugas tim",
              "□ Jelas □ Belum",
              ""
            ],
            [
              "2.6",
              "Pemahaman prosedur keadaan darurat",
              "□ Paham □ Belum",
              ""
            ],
            [
              "2.7",
              "Kelengkapan APD (Alat Pelindung Diri)",
              "□ Lengkap □ Tidak",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0011",
        "section": "3. Persiapan Peralatan",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Persiapan Peralatan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7",
            "3.8",
            "3.9",
            "3.10",
            "3.11"
          ],
          "source_rows": [
            [
              "3.1",
              "Kamera perekam (CCTV/IP Camera)",
              "□ Tersedia □ Tidak",
              ""
            ],
            [
              "3.2",
              "Kondisi kamera (berfungsi, resolusi min. 800x600)",
              "□ Baik □ Rusak",
              ""
            ],
            [
              "3.3",
              "Tripod (ketinggian min. 5 meter)",
              "□ Tersedia □ Tidak",
              ""
            ],
            [
              "3.4",
              "Braket dan mounting",
              "□ Tersedia □ Tidak",
              ""
            ],
            [
              "3.5",
              "Komputer/laptop",
              "□ Tersedia □ Tidak",
              ""
            ],
            [
              "3.6",
              "Perangkat penyimpan data (HDD/DVR/NVR)",
              "□ Tersedia □ Tidak",
              ""
            ],
            [
              "3.7",
              "Sumber daya listrik (PLN/Generator/Panel Surya)",
              "□ Tersedia □ Tidak",
              ""
            ],
            [
              "3.8",
              "Kabel komunikasi (coaxial/LAN)",
              "□ Tersedia □ Tidak",
              ""
            ],
            [
              "3.9",
              "Alat penanda waktu",
              "□ Tersedia □ Tidak",
              ""
            ],
            [
              "3.10",
              "Checklist kesiapan peralatan",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "3.11",
              "Peralatan cadangan",
              "□ Tersedia □ Tidak",
              ""
            ]
          ],
          "table_rows": 11,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0012",
        "section": "4. Survei Pendahuluan",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 4. Survei Pendahuluan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "4.1",
            "4.2",
            "4.3",
            "4.4",
            "4.5",
            "4.6",
            "4.7"
          ],
          "source_rows": [
            [
              "4.1",
              "Survei lokasi titik pengamatan",
              "□ Dilakukan □ Belum",
              ""
            ],
            [
              "4.2",
              "Pemeriksaan kondisi geometrik lokasi",
              "□ Dilakukan □ Belum",
              ""
            ],
            [
              "4.3",
              "Identifikasi lajur yang akan diamati",
              "□ Jelas □ Belum",
              ""
            ],
            [
              "4.4",
              "Identifikasi hambatan (pohon, tiang, dll)",
              "□ Dilakukan □ Belum",
              ""
            ],
            [
              "4.5",
              "Uji coba penempatan peralatan",
              "□ Dilakukan □ Belum",
              ""
            ],
            [
              "4.6",
              "Dokumentasi lokasi survei",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "4.7",
              "Sketsa lokasi survei",
              "□ Dibuat □ Belum",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0013",
        "section": "1. Verifikasi Pemasangan Peralatan",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Verifikasi Pemasangan Peralatan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7",
            "1.8"
          ],
          "source_rows": [
            [
              "1.1",
              "Posisi dan sudut kamera (min. 120° dari garis depan)",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.2",
              "Ketinggian kamera (min. 5 meter)",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.3",
              "Stabilitas tripod dan mounting",
              "□ Stabil □ Tidak",
              ""
            ],
            [
              "1.4",
              "Penempatan di luar Rumaja",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.5",
              "Fungsi led infra merah untuk malam hari",
              "□ Berfungsi □ Tidak",
              ""
            ],
            [
              "1.6",
              "Pengaturan waktu pada kamera",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.7",
              "Koneksi antar perangkat",
              "□ Berfungsi □ Tidak",
              ""
            ],
            [
              "1.8",
              "Keamanan peralatan",
              "□ Aman □ Tidak",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0014",
        "section": "2. Verifikasi Proses Pengambilan Data",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Verifikasi Proses Pengambilan Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7",
            "2.8",
            "2.9",
            "2.10"
          ],
          "source_rows": [
            [
              "2.1",
              "Waktu mulai survei (00.00)",
              "□ Tepat □ Tidak",
              ""
            ],
            [
              "2.2",
              "Resolusi rekaman (min. 800x600)",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "2.3",
              "Frame rate (min. 24 fps)",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "2.4",
              "Format kompresi file (H-264/MPEG-4)",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "2.5",
              "Kejelasan gambar rekaman siang hari",
              "□ Jelas □ Tidak",
              ""
            ],
            [
              "2.6",
              "Kejelasan gambar rekaman malam hari",
              "□ Jelas □ Tidak",
              ""
            ],
            [
              "2.7",
              "Visibilitas semua lajur",
              "□ Terlihat □ Tidak",
              ""
            ],
            [
              "2.8",
              "Penandaan waktu pada rekaman",
              "□ Ada □ Tidak",
              ""
            ],
            [
              "2.9",
              "Penandaan lokasi pada rekaman",
              "□ Ada □ Tidak",
              ""
            ],
            [
              "2.10",
              "Kontinuitas rekaman (tanpa putus)",
              "□ Kontinyu □ Tidak",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0015",
        "section": "3. Verifikasi Pengumpulan Data Harian",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Verifikasi Pengumpulan Data Harian",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7",
            "3.8"
          ],
          "source_rows": [
            [
              "3.1",
              "Kelengkapan log sheet harian",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "3.2",
              "Pencatatan kondisi cuaca",
              "□ Tercatat □ Tidak",
              ""
            ],
            [
              "3.3",
              "Pencatatan kejadian khusus",
              "□ Tercatat □ Tidak",
              ""
            ],
            [
              "3.4",
              "Backup data harian",
              "□ Dilakukan □ Tidak",
              ""
            ],
            [
              "3.5",
              "Pengecekan kualitas data harian",
              "□ Dilakukan □ Tidak",
              ""
            ],
            [
              "3.6",
              "Rotasi personil sesuai jadwal",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "3.7",
              "Perawatan peralatan harian",
              "□ Dilakukan □ Tidak",
              ""
            ],
            [
              "3.8",
              "Ketersediaan daya listrik",
              "□ Mencukupi □ Tidak",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0016",
        "section": "1. Validasi Kelengkapan Data",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Validasi Kelengkapan Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Validasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7"
          ],
          "source_rows": [
            [
              "1.1",
              "Kelengkapan data 24 jam pertama",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.2",
              "Kelengkapan data 24 jam kedua",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.3",
              "Kelengkapan data 24 jam ketiga",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.4",
              "Tidak ada gap/blank periode",
              "□ Tidak ada □ Ada",
              ""
            ],
            [
              "1.5",
              "Tersedia data untuk semua lajur",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.6",
              "Tersedia data untuk semua arah",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.7",
              "Metadata (tanggal, waktu, lokasi) lengkap",
              "□ Lengkap □ Tidak",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0017",
        "section": "2. Validasi Kualitas Data Mentah",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Validasi Kualitas Data Mentah",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Validasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7"
          ],
          "source_rows": [
            [
              "2.1",
              "Kualitas gambar rekaman memadai",
              "□ Memadai □ Tidak",
              ""
            ],
            [
              "2.2",
              "Visibilitas pada jam malam hari",
              "□ Memadai □ Tidak",
              ""
            ],
            [
              "2.3",
              "Identifikasi kendaraan dapat dilakukan",
              "□ Dapat □ Sulit",
              ""
            ],
            [
              "2.4",
              "Frame rate stabil selama rekaman",
              "□ Stabil □ Tidak",
              ""
            ],
            [
              "2.5",
              "Tidak ada gangguan cuaca ekstrem",
              "□ Tidak ada □ Ada",
              ""
            ],
            [
              "2.6",
              "Tidak ada gangguan teknis peralatan",
              "□ Tidak ada □ Ada",
              ""
            ],
            [
              "2.7",
              "Tidak ada gangguan lainnya",
              "□ Tidak ada □ Ada",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0018",
        "section": "1. Verifikasi Metode Pencacahan",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Verifikasi Metode Pencacahan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7"
          ],
          "source_rows": [
            [
              "1.1",
              "Metode pencacahan sesuai manual",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.2",
              "Interval pemutaran rekaman konsisten",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.3",
              "Posisi titik pengamatan konsisten",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.4",
              "Pengelompokan jenis kendaraan sesuai",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.5",
              "Teknik pencatatan konsisten",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "1.6",
              "Perangkat lunak analisis berfungsi",
              "□ Berfungsi □ Tidak",
              ""
            ],
            [
              "1.7",
              "Operator terlatih",
              "□ Terlatih □ Tidak",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0019",
        "section": "2. Validasi Hasil Pencacahan",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Validasi Hasil Pencacahan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Validasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7",
            "2.8"
          ],
          "source_rows": [
            [
              "2.1",
              "Kelengkapan hasil pencacahan per jam",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "2.2",
              "Kelengkapan hasil pencacahan per arah",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "2.3",
              "Kelengkapan hasil pencacahan per jenis",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "2.4",
              "Pola fluktuasi volume harian wajar",
              "□ Wajar □ Tidak",
              ""
            ],
            [
              "2.5",
              "Jam puncak masuk akal",
              "□ Masuk akal □ Tidak",
              ""
            ],
            [
              "2.6",
              "Komposisi kendaraan masuk akal",
              "□ Masuk akal □ Tidak",
              ""
            ],
            [
              "2.7",
              "Konsistensi antar hari",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.8",
              "Kesesuaian dengan karakteristik lokasi",
              "□ Sesuai □ Tidak",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0020",
        "section": "3. Validasi Sampling Internal",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Validasi Sampling Internal",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Validasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5"
          ],
          "source_rows": [
            [
              "3.1",
              "Dilakukan pencacahan ulang sampel (10%)",
              "□ Dilakukan □ Tidak",
              ""
            ],
            [
              "3.2",
              "Deviasi hasil <5%",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "3.3",
              "Dilakukan oleh operator berbeda",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "3.4",
              "Kesalahan konsisten teridentifikasi",
              "□ Tidak ada □ Ada",
              ""
            ],
            [
              "3.5",
              "Kesalahan acak teridentifikasi",
              "□ Tidak ada □ Ada",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0021",
        "section": "1. Verifikasi Metode Pengolahan",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Verifikasi Metode Pengolahan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7",
            "1.8"
          ],
          "source_rows": [
            [
              "1.1",
              "Metode perhitungan LHR sesuai pedoman",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.2",
              "Faktor k sesuai standar",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.3",
              "Faktor konversi SMP sesuai standar",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.4",
              "Penggunaan software analisis tepat",
              "□ Tepat □ Tidak",
              ""
            ],
            [
              "1.5",
              "Perhitungan jam puncak tepat",
              "□ Tepat □ Tidak",
              ""
            ],
            [
              "1.6",
              "Perhitungan derajat kejenuhan tepat",
              "□ Tepat □ Tidak",
              ""
            ],
            [
              "1.7",
              "Perhitungan distribusi kendaraan tepat",
              "□ Tepat □ Tidak",
              ""
            ],
            [
              "1.8",
              "Metode grafik/tabel sesuai standar",
              "□ Sesuai □ Tidak",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0022",
        "section": "2. Validasi Hasil Pengolahan",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Validasi Hasil Pengolahan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Validasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7"
          ],
          "source_rows": [
            [
              "2.1",
              "Kesesuaian hasil pengolahan dengan data mentah",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "2.2",
              "Tidak ada kesalahan perhitungan",
              "□ Tidak ada □ Ada",
              ""
            ],
            [
              "2.3",
              "Hasil LHR masuk akal untuk lokasi",
              "□ Masuk akal □ Tidak",
              ""
            ],
            [
              "2.4",
              "Hasil derajat kejenuhan masuk akal",
              "□ Masuk akal □ Tidak",
              ""
            ],
            [
              "2.5",
              "Kesesuaian dengan data historis (jika ada)",
              "□ Sesuai □ Tidak □ N/A",
              ""
            ],
            [
              "2.6",
              "Cross-check antar metode perhitungan",
              "□ Konsisten □ Tidak",
              ""
            ],
            [
              "2.7",
              "Validasi perhitungan oleh analis kedua",
              "□ Dilakukan □ Tidak",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0023",
        "section": "1. Verifikasi Format Data",
        "options": [],
        "required": false,
        "order": 23,
        "sourceOrder": 23,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Verifikasi Format Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6"
          ],
          "source_rows": [
            [
              "1.1",
              "Format data sesuai SMD Jalan",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.2",
              "Penamaan file sesuai ketentuan",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.3",
              "Struktur folder data terorganisir",
              "□ Terorganisir □ Tidak",
              ""
            ],
            [
              "1.4",
              "Format tabel hasil sesuai standar",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.5",
              "Format grafik sesuai standar",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.6",
              "Metadata tersedia dan lengkap",
              "□ Lengkap □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0024",
        "section": "2. Verifikasi Penyajian Laporan",
        "options": [],
        "required": false,
        "order": 24,
        "sourceOrder": 24,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Verifikasi Penyajian Laporan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7",
            "2.8"
          ],
          "source_rows": [
            [
              "2.1",
              "Struktur laporan sesuai ketentuan",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "2.2",
              "Dokumentasi lokasi lengkap",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "2.3",
              "Tabel hasil survei lengkap",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "2.4",
              "Grafik fluktuasi lalu lintas tersedia",
              "□ Tersedia □ Tidak",
              ""
            ],
            [
              "2.5",
              "Hasil analisis disajikan dengan jelas",
              "□ Jelas □ Tidak",
              ""
            ],
            [
              "2.6",
              "Kualitas grafik dan tabel baik",
              "□ Baik □ Tidak",
              ""
            ],
            [
              "2.7",
              "Kesimpulan dan rekomendasi disertakan",
              "□ Disertakan □ Tidak",
              ""
            ],
            [
              "2.8",
              "Dokumentasi lengkap",
              "□ Lengkap □ Tidak",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0025",
        "section": "1. Verifikasi Backup Data",
        "options": [],
        "required": false,
        "order": 25,
        "sourceOrder": 25,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Verifikasi Backup Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6"
          ],
          "source_rows": [
            [
              "1.1",
              "Backup data mentah dilakukan",
              "□ Dilakukan □ Tidak",
              ""
            ],
            [
              "1.2",
              "Backup data olahan dilakukan",
              "□ Dilakukan □ Tidak",
              ""
            ],
            [
              "1.3",
              "Data disimpan di minimal 2 media",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "1.4",
              "Lokasi penyimpanan aman",
              "□ Aman □ Tidak",
              ""
            ],
            [
              "1.5",
              "Metadata backup tercatat",
              "□ Tercatat □ Tidak",
              ""
            ],
            [
              "1.6",
              "Sistem penamaan file backup jelas",
              "□ Jelas □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0026",
        "section": "2. Verifikasi Keamanan Data",
        "options": [],
        "required": false,
        "order": 26,
        "sourceOrder": 26,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Verifikasi Keamanan Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Verifikasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5"
          ],
          "source_rows": [
            [
              "2.1",
              "Anti-virus pada komputer terinstal",
              "□ Terinstal □ Tidak",
              ""
            ],
            [
              "2.2",
              "Pembatasan akses data",
              "□ Diterapkan □ Tidak",
              ""
            ],
            [
              "2.3",
              "Perlindungan password data penting",
              "□ Diterapkan □ Tidak",
              ""
            ],
            [
              "2.4",
              "Log akses data tersedia",
              "□ Tersedia □ Tidak",
              ""
            ],
            [
              "2.5",
              "Prosedur pencadangan tertulis",
              "□ Tersedia □ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0027",
        "section": "1. Permasalahan yang Teridentifikasi",
        "options": [],
        "required": false,
        "order": 27,
        "sourceOrder": 27,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Permasalahan yang Teridentifikasi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Permasalahan",
            "Dampak",
            "Lokasi/Waktu",
            "Status"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3.",
            "4.",
            "5."
          ],
          "source_rows": [
            [
              "1.",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ],
            [
              "2.",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ],
            [
              "3.",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ],
            [
              "4.",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ],
            [
              "5.",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0028",
        "section": "2. Tindakan Perbaikan",
        "options": [],
        "required": false,
        "order": 28,
        "sourceOrder": 28,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Tindakan Perbaikan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Permasalahan",
            "Tindakan Perbaikan",
            "PIC",
            "Target",
            "Status"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3.",
            "4.",
            "5."
          ],
          "source_rows": [
            [
              "1.",
              "",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ],
            [
              "2.",
              "",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ],
            [
              "3.",
              "",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ],
            [
              "4.",
              "",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ],
            [
              "5.",
              "",
              "",
              "",
              "",
              "□ Selesai □ Proses"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0029",
        "section": "1. Validasi Kelengkapan Final",
        "options": [],
        "required": false,
        "order": 29,
        "sourceOrder": 29,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Validasi Kelengkapan Final",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Validasi",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7",
            "1.8"
          ],
          "source_rows": [
            [
              "1.1",
              "Data survei lengkap 3x24 jam",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.2",
              "Format data sesuai SMD Jalan",
              "□ Sesuai □ Tidak",
              ""
            ],
            [
              "1.3",
              "Laporan lengkap sesuai format",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.4",
              "Backup data aman",
              "□ Aman □ Tidak",
              ""
            ],
            [
              "1.5",
              "Dokumentasi survei lengkap",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.6",
              "Log sheet dan catatan lengkap",
              "□ Lengkap □ Tidak",
              ""
            ],
            [
              "1.7",
              "Data survei valid dan akurat",
              "□ Valid □ Tidak",
              ""
            ],
            [
              "1.8",
              "Semua permasalahan telah ditindaklanjuti",
              "□ Ya □ Tidak",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0030",
        "section": "2. Komentar dan Rekomendasi Internal",
        "options": [],
        "required": false,
        "order": 30,
        "sourceOrder": 30,
        "unit": "",
        "rule": {},
        "label": "...............................................................................................................................",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0031",
        "section": "2. Komentar dan Rekomendasi Internal",
        "options": [],
        "required": false,
        "order": 31,
        "sourceOrder": 31,
        "unit": "",
        "rule": {},
        "label": "...............................................................................................................................",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0032",
        "section": "2. Komentar dan Rekomendasi Internal",
        "options": [],
        "required": false,
        "order": 32,
        "sourceOrder": 32,
        "unit": "",
        "rule": {},
        "label": "...............................................................................................................................",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0033",
        "section": "2. Komentar dan Rekomendasi Internal",
        "options": [],
        "required": false,
        "order": 33,
        "sourceOrder": 33,
        "unit": "",
        "rule": {},
        "label": "...............................................................................................................................",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0034",
        "section": "2. Komentar dan Rekomendasi Internal",
        "options": [],
        "required": false,
        "order": 34,
        "sourceOrder": 34,
        "unit": "",
        "rule": {},
        "label": "...............................................................................................................................",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0035",
        "section": "J. PERSETUJUAN INTERNAL",
        "options": [],
        "required": false,
        "order": 35,
        "sourceOrder": 35,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: J. PERSETUJUAN INTERNAL",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Pihak",
            "Nama",
            "Jabatan",
            "Tanda Tangan",
            "Tanggal"
          ],
          "row_labels": [
            "Surveyor",
            "Supervisor",
            "QA/QC Internal",
            "Manajer Proyek"
          ],
          "source_rows": [
            [
              "Surveyor",
              "",
              "",
              "",
              ""
            ],
            [
              "Supervisor",
              "",
              "",
              "",
              ""
            ],
            [
              "QA/QC Internal",
              "",
              "",
              "",
              ""
            ],
            [
              "Manajer Proyek",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0036",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 36,
        "sourceOrder": 36,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi survei (foto/video)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0037",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 37,
        "sourceOrder": 37,
        "unit": "",
        "rule": {},
        "label": "Log sheet harian",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0038",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 38,
        "sourceOrder": 38,
        "unit": "",
        "rule": {},
        "label": "Sampel data pencacahan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0039",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 39,
        "sourceOrder": 39,
        "unit": "",
        "rule": {},
        "label": "Hasil validasi sampel",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0040",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 40,
        "sourceOrder": 40,
        "unit": "",
        "rule": {},
        "label": "Laporan permasalahan dan tindakan perbaikan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0041",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 41,
        "sourceOrder": 41,
        "unit": "",
        "rule": {},
        "label": "Backup log",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LALU_LINTAS_INTERNAL_0042",
        "section": "K. LAMPIRAN",
        "options": [],
        "required": false,
        "order": 42,
        "sourceOrder": 42,
        "unit": "",
        "rule": {},
        "label": "Lainnya: ____________________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-4-lereng-consistency",
    "survey": "Lereng",
    "phase": "consistency",
    "items": [
      {
        "code": "DOCX_LERENG_CONSISTENCY_0001",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: Informasi dan Pemeriksaan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "",
            "KEMENTERIAN PEKERJAAN UMUM DAN PERUMAHAN RAKYATDIREKTORAT JENDERAL BINA MARGADIREKTORAT BINA TEKNIK JALAN DAN JEMBATAN",
            ""
          ],
          "row_labels": [
            "",
            "No. Dok.: No. Rev.: 00"
          ],
          "source_rows": [
            [
              "",
              "PETUNJUK PELAKSANAAN QUALITY ASSURANCE DAN QUALITY CONTROL PADA KEGIATAN SURVEY KONDISI JALANCHECKLIST KONSISTENSI SURVEI LERENG"
            ],
            [
              "No. Dok.: No. Rev.: 00",
              "Tgl. Diterbitkan: Maret 2025Tgl. Revisi: -",
              "Hal:1 dari 2Paraf:"
            ]
          ],
          "table_rows": 2,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0002",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Dokumen No.: SLOPE-CONS-001Revisi: 00Tanggal: [DD/MM/YYYY]Lokasi Uji Konsistensi: [Nama Ruas/Segmen Jalan]",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0003",
        "section": "BAGIAN 1: INFORMASI UMUM",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: BAGIAN 1: INFORMASI UMUM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Detail"
          ],
          "row_labels": [
            "Nama Proyek",
            "Nomor Kontrak",
            "Penyedia Jasa",
            "Pengguna Jasa",
            "Penanggung Jawab Uji Konsistensi",
            "Tim Surveyor yang Dievaluasi",
            "Periode Survei",
            "Jenis Uji Konsistensi",
            "Lokasi Sampel Uji"
          ],
          "source_rows": [
            [
              "Nama Proyek",
              ""
            ],
            [
              "Nomor Kontrak",
              ""
            ],
            [
              "Penyedia Jasa",
              ""
            ],
            [
              "Pengguna Jasa",
              ""
            ],
            [
              "Penanggung Jawab Uji Konsistensi",
              ""
            ],
            [
              "Tim Surveyor yang Dievaluasi",
              ""
            ],
            [
              "Periode Survei",
              ""
            ],
            [
              "Jenis Uji Konsistensi",
              "□ Awal □ Berkala □ Akhir"
            ],
            [
              "Lokasi Sampel Uji",
              ""
            ]
          ],
          "table_rows": 9,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0004",
        "section": "2.1 Pengujian Konsistensi GPS",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2.1 Pengujian Konsistensi GPS",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Uji Konsistensi",
            "Hasil Pengukuran"
          ],
          "row_labels": [
            "1",
            "",
            "",
            "",
            "",
            "",
            "",
            "2",
            "",
            "",
            "",
            "",
            "",
            ""
          ],
          "source_rows": [
            [
              "1",
              "Pengukuran Titik Referensi yang Sama (3x pengukuran)",
              ""
            ],
            [
              "",
              "Pengukuran 1",
              "Lat: __________ Long: __________"
            ],
            [
              "",
              "Pengukuran 2",
              "Lat: __________ Long: __________"
            ],
            [
              "",
              "Pengukuran 3",
              "Lat: __________ Long: __________"
            ],
            [
              "",
              "Simpangan Maksimum",
              "___________ meter"
            ],
            [
              "",
              "Standar Keberterimaan",
              "≤ 5 meter"
            ],
            [
              "",
              "Status Konsistensi",
              "□ Konsisten □ Tidak Konsisten"
            ],
            [
              "2",
              "Pengukuran Jarak Antara 2 Titik (3x pengukuran)",
              ""
            ],
            [
              "",
              "Pengukuran 1",
              "___________ meter"
            ],
            [
              "",
              "Pengukuran 2",
              "___________ meter"
            ],
            [
              "",
              "Pengukuran 3",
              "___________ meter"
            ],
            [
              "",
              "Simpangan Maksimum",
              "___________ %"
            ],
            [
              "",
              "Standar Keberterimaan",
              "≤ 5%"
            ],
            [
              "",
              "Status Konsistensi",
              "□ Konsisten □ Tidak Konsisten"
            ]
          ],
          "table_rows": 14,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0005",
        "section": "2.2 Pengujian Konsistensi Clinometer/Inclinometer",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2.2 Pengujian Konsistensi Clinometer/Inclinometer",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Uji Konsistensi",
            "Hasil Pengukuran"
          ],
          "row_labels": [
            "1",
            "",
            "",
            "",
            "",
            "",
            "",
            "2",
            "",
            "",
            "",
            "",
            "",
            ""
          ],
          "source_rows": [
            [
              "1",
              "Pengukuran Kemiringan Permukaan Datar (3x pengukuran)",
              ""
            ],
            [
              "",
              "Pengukuran 1",
              "___________ derajat"
            ],
            [
              "",
              "Pengukuran 2",
              "___________ derajat"
            ],
            [
              "",
              "Pengukuran 3",
              "___________ derajat"
            ],
            [
              "",
              "Simpangan Maksimum",
              "___________ derajat"
            ],
            [
              "",
              "Standar Keberterimaan",
              "≤ 1 derajat"
            ],
            [
              "",
              "Status Konsistensi",
              "□ Konsisten □ Tidak Konsisten"
            ],
            [
              "2",
              "Pengukuran Kemiringan Standar (3x pengukuran)",
              ""
            ],
            [
              "",
              "Pengukuran 1",
              "___________ derajat"
            ],
            [
              "",
              "Pengukuran 2",
              "___________ derajat"
            ],
            [
              "",
              "Pengukuran 3",
              "___________ derajat"
            ],
            [
              "",
              "Simpangan Maksimum",
              "___________ derajat"
            ],
            [
              "",
              "Standar Keberterimaan",
              "≤ 2 derajat"
            ],
            [
              "",
              "Status Konsistensi",
              "□ Konsisten □ Tidak Konsisten"
            ]
          ],
          "table_rows": 14,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0006",
        "section": "2.3 Pengujian Konsistensi Distance Meter/Roll Meter",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2.3 Pengujian Konsistensi Distance Meter/Roll Meter",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Uji Konsistensi",
            "Hasil Pengukuran"
          ],
          "row_labels": [
            "1",
            "",
            "",
            "",
            "",
            "",
            ""
          ],
          "source_rows": [
            [
              "1",
              "Pengukuran Jarak Standar (3x pengukuran)",
              ""
            ],
            [
              "",
              "Pengukuran 1",
              "___________ meter"
            ],
            [
              "",
              "Pengukuran 2",
              "___________ meter"
            ],
            [
              "",
              "Pengukuran 3",
              "___________ meter"
            ],
            [
              "",
              "Simpangan Maksimum",
              "___________ %"
            ],
            [
              "",
              "Standar Keberterimaan",
              "≤ 2%"
            ],
            [
              "",
              "Status Konsistensi",
              "□ Konsisten □ Tidak Konsisten"
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0007",
        "section": "2.4 Pengujian Konsistensi Drone (jika digunakan)",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2.4 Pengujian Konsistensi Drone (jika digunakan)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Uji Konsistensi",
            "Hasil Pengukuran"
          ],
          "row_labels": [
            "1",
            "",
            "",
            "",
            "",
            "",
            "",
            "2",
            "",
            "",
            ""
          ],
          "source_rows": [
            [
              "1",
              "Pengukuran Ketinggian dengan Drone (3x pengukuran)",
              ""
            ],
            [
              "",
              "Pengukuran 1",
              "___________ meter"
            ],
            [
              "",
              "Pengukuran 2",
              "___________ meter"
            ],
            [
              "",
              "Pengukuran 3",
              "___________ meter"
            ],
            [
              "",
              "Simpangan Maksimum",
              "___________ %"
            ],
            [
              "",
              "Standar Keberterimaan",
              "≤ 5%"
            ],
            [
              "",
              "Status Konsistensi",
              "□ Konsisten □ Tidak Konsisten"
            ],
            [
              "2",
              "Konsistensi Koordinat GPS Drone",
              ""
            ],
            [
              "",
              "Simpangan dengan GPS Referensi",
              "___________ meter"
            ],
            [
              "",
              "Standar Keberterimaan",
              "≤ 5 meter"
            ],
            [
              "",
              "Status Konsistensi",
              "□ Konsisten □ Tidak Konsisten"
            ]
          ],
          "table_rows": 11,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0008",
        "section": "3.1 Pengukuran Geometri Lereng",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3.1 Pengukuran Geometri Lereng",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Parameter",
            "Operator 1",
            "Operator 2",
            "Operator 3",
            "Simpangan Max",
            "Standar",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Tinggi Lereng (m)",
              "",
              "",
              "",
              "",
              "≤10%",
              "□ Konsisten □ Tidak Konsisten"
            ],
            [
              "2",
              "Kemiringan Lereng (°)",
              "",
              "",
              "",
              "",
              "≤5°",
              "□ Konsisten □ Tidak Konsisten"
            ],
            [
              "3",
              "Panjang Lereng (m)",
              "",
              "",
              "",
              "",
              "≤10%",
              "□ Konsisten □ Tidak Konsisten"
            ],
            [
              "4",
              "Jarak dari Tepi Jalan (m)",
              "",
              "",
              "",
              "",
              "≤5%",
              "□ Konsisten □ Tidak Konsisten"
            ],
            [
              "5",
              "Lebar Bahu Jalan (m)",
              "",
              "",
              "",
              "",
              "≤5%",
              "□ Konsisten □ Tidak Konsisten"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0009",
        "section": "3.2 Identifikasi Material Penyusun Lereng",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3.2 Identifikasi Material Penyusun Lereng",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Parameter",
            "Operator 1",
            "Operator 2",
            "Operator 3",
            "Status Konsistensi",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Jenis Material Dominan",
              "",
              "",
              "",
              "□ Konsisten □ Tidak Konsisten",
              ""
            ],
            [
              "2",
              "Struktur Batuan",
              "",
              "",
              "",
              "□ Konsisten □ Tidak Konsisten",
              ""
            ],
            [
              "3",
              "Tingkat Pelapukan",
              "",
              "",
              "",
              "□ Konsisten □ Tidak Konsisten",
              ""
            ],
            [
              "4",
              "Kondisi Keairan",
              "",
              "",
              "",
              "□ Konsisten □ Tidak Konsisten",
              ""
            ],
            [
              "5",
              "Sifat Material",
              "",
              "",
              "",
              "□ Konsisten □ Tidak Konsisten",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0010",
        "section": "3.3 Identifikasi Gejala Keruntuhan",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3.3 Identifikasi Gejala Keruntuhan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Parameter",
            "Operator 1",
            "Operator 2",
            "Operator 3",
            "Status Konsistensi",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4"
          ],
          "source_rows": [
            [
              "1",
              "Tipe Gejala Keruntuhan",
              "",
              "",
              "",
              "□ Konsisten □ Tidak Konsisten",
              ""
            ],
            [
              "2",
              "Dimensi Retak/Longsoran",
              "",
              "",
              "",
              "□ Konsisten □ Tidak Konsisten",
              ""
            ],
            [
              "3",
              "Lokasi Gejala Keruntuhan",
              "",
              "",
              "",
              "□ Konsisten □ Tidak Konsisten",
              ""
            ],
            [
              "4",
              "Penyebab Potensial",
              "",
              "",
              "",
              "□ Konsisten □ Tidak Konsisten",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0011",
        "section": "3.4 Penilaian Kondisi dan Risiko Lereng",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3.4 Penilaian Kondisi dan Risiko Lereng",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Parameter",
            "Operator 1",
            "Operator 2",
            "Operator 3",
            "Status Konsistensi",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4"
          ],
          "source_rows": [
            [
              "1",
              "Tingkat Bahaya",
              "",
              "",
              "",
              "□ Konsisten □ Tidak Konsisten",
              ""
            ],
            [
              "2",
              "Tingkat Konsekuensi",
              "",
              "",
              "",
              "□ Konsisten □ Tidak Konsisten",
              ""
            ],
            [
              "3",
              "Nilai Risiko Final",
              "",
              "",
              "",
              "□ Konsisten □ Tidak Konsisten",
              ""
            ],
            [
              "4",
              "Rekomendasi Penanganan",
              "",
              "",
              "",
              "□ Konsisten □ Tidak Konsisten",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0012",
        "section": "4.1 Pengukuran Ulang Pada Lokasi Yang Sama (Interval 2 Minggu)",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 4.1 Pengukuran Ulang Pada Lokasi Yang Sama (Interval 2 Minggu)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Parameter",
            "Pengukuran Awal [Tanggal]",
            "Pengukuran Ulang [Tanggal]",
            "Deviasi",
            "Standar",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Tinggi Lereng (m)",
              "",
              "",
              "",
              "≤10%",
              "□ Konsisten □ Tidak Konsisten"
            ],
            [
              "2",
              "Kemiringan Lereng (°)",
              "",
              "",
              "",
              "≤5°",
              "□ Konsisten □ Tidak Konsisten"
            ],
            [
              "3",
              "Penilaian Risiko",
              "",
              "",
              "",
              "Sama",
              "□ Konsisten □ Tidak Konsisten"
            ],
            [
              "4",
              "Identifikasi Material",
              "",
              "",
              "",
              "Sama",
              "□ Konsisten □ Tidak Konsisten"
            ],
            [
              "5",
              "Gejala Keruntuhan",
              "",
              "",
              "",
              "Sama*",
              "□ Konsisten □ Tidak Konsisten"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0013",
        "section": "4.1 Pengukuran Ulang Pada Lokasi Yang Sama (Interval 2 Minggu)",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "*Kecuali ada perubahan kondisi aktual di lapangan yang terdokumentasi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0014",
        "section": "5.1 Dokumentasi Visual",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 5.1 Dokumentasi Visual",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Foto diambil dari sudut pandang konsisten",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Kualitas foto konsisten (pencahayaan, fokus)",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Skala foto konsisten (penggunaan alat ukur)",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Jumlah foto sesuai standar minimum",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Orientasi foto (tampak atas, samping, dll) konsisten",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0015",
        "section": "5.2 Sketsa dan Gambar",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 5.2 Sketsa dan Gambar",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Format sketsa konsisten",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Elemen sketsa lengkap sesuai standar",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Skala sketsa konsisten",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Penggunaan simbol dan legenda konsisten",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Informasi dimensi pada sketsa lengkap",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0016",
        "section": "BAGIAN 6: KONSISTENSI DATA DIGITAL",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: BAGIAN 6: KONSISTENSI DATA DIGITAL",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8"
          ],
          "source_rows": [
            [
              "1",
              "Format file data konsisten sesuai standar",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Struktur penamaan file konsisten",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Struktur folder penyimpanan konsisten",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Metadata lengkap dan konsisten",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Format koordinat konsisten",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Format numerik (desimal, unit) konsisten",
              "□",
              "□",
              ""
            ],
            [
              "7",
              "Tautan antara data spasial dan foto konsisten",
              "□",
              "□",
              ""
            ],
            [
              "8",
              "Format data untuk InSlope konsisten",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0017",
        "section": "BAGIAN 7: KONSISTENSI METODE KERJA",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: BAGIAN 7: KONSISTENSI METODE KERJA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8"
          ],
          "source_rows": [
            [
              "1",
              "Alur kerja survei konsisten antar lokasi",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Protokol pengukuran geometri lereng konsisten",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Metode penilaian material penyusun konsisten",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Metode identifikasi gejala keruntuhan konsisten",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Metode penentuan tingkat risiko konsisten",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Protokol dokumentasi visual konsisten",
              "□",
              "□",
              ""
            ],
            [
              "7",
              "Prosedur pencatatan data konsisten",
              "□",
              "□",
              ""
            ],
            [
              "8",
              "Metode pengunggahan data konsisten",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0018",
        "section": "8.1 Ringkasan Hasil Konsistensi",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 8.1 Ringkasan Hasil Konsistensi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Kategori",
            "Jumlah Parameter",
            "Konsisten",
            "Tidak Konsisten",
            "% Konsistensi"
          ],
          "row_labels": [
            "Konsistensi Peralatan",
            "Konsistensi Antar Operator",
            "Konsistensi Temporal",
            "Konsistensi Dokumentasi",
            "Konsistensi Data Digital",
            "Konsistensi Metode Kerja",
            "Total"
          ],
          "source_rows": [
            [
              "Konsistensi Peralatan",
              "",
              "",
              "",
              ""
            ],
            [
              "Konsistensi Antar Operator",
              "",
              "",
              "",
              ""
            ],
            [
              "Konsistensi Temporal",
              "",
              "",
              "",
              ""
            ],
            [
              "Konsistensi Dokumentasi",
              "",
              "",
              "",
              ""
            ],
            [
              "Konsistensi Data Digital",
              "",
              "",
              "",
              ""
            ],
            [
              "Konsistensi Metode Kerja",
              "",
              "",
              "",
              ""
            ],
            [
              "Total",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0019",
        "section": "8.2 Status Konsistensi",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 8.2 Status Konsistensi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Level Konsistensi",
            "Kriteria",
            "Status"
          ],
          "row_labels": [
            "□ Tinggi",
            "□ Sedang",
            "□ Rendah"
          ],
          "source_rows": [
            [
              "□ Tinggi",
              "≥90% parameter konsisten",
              ""
            ],
            [
              "□ Sedang",
              "75-89% parameter konsisten",
              ""
            ],
            [
              "□ Rendah",
              "<75% parameter konsisten",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0020",
        "section": "8.3 Temuan Ketidakkonsistenan dan Tindakan Perbaikan",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 8.3 Temuan Ketidakkonsistenan dan Tindakan Perbaikan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Temuan Ketidakkonsistenan",
            "Kategori",
            "Penyebab",
            "Tindakan Perbaikan",
            "PIC",
            "Target Penyelesaian"
          ],
          "row_labels": [
            "1",
            "2",
            "3"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0021",
        "section": "9.1 Kesimpulan",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "[Isi dengan kesimpulan singkat tentang hasil uji konsistensi secara keseluruhan]",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0022",
        "section": "9.2 Rekomendasi",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "[Isi dengan rekomendasi untuk mempertahankan atau meningkatkan konsistensi survei]",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0023",
        "section": "9.3 Jadwal Uji Konsistensi Berikutnya",
        "options": [],
        "required": false,
        "order": 23,
        "sourceOrder": 23,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 9.3 Jadwal Uji Konsistensi Berikutnya",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Keterangan"
          ],
          "row_labels": [
            "Tanggal",
            "Lokasi",
            "Tim yang Dievaluasi",
            "Parameter Fokus"
          ],
          "source_rows": [
            [
              "Tanggal",
              ""
            ],
            [
              "Lokasi",
              ""
            ],
            [
              "Tim yang Dievaluasi",
              ""
            ],
            [
              "Parameter Fokus",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0024",
        "section": "BAGIAN 10: TANDA TANGAN",
        "options": [],
        "required": false,
        "order": 24,
        "sourceOrder": 24,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: BAGIAN 10: TANDA TANGAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Posisi",
            "Nama",
            "Institusi",
            "Tanda Tangan",
            "Tanggal"
          ],
          "row_labels": [
            "Penanggung Jawab Uji Konsistensi",
            "QA/QC Manager",
            "Kepala Tim Surveyor",
            "Wakil Pengguna Jasa"
          ],
          "source_rows": [
            [
              "Penanggung Jawab Uji Konsistensi",
              "",
              "",
              "",
              ""
            ],
            [
              "QA/QC Manager",
              "",
              "",
              "",
              ""
            ],
            [
              "Kepala Tim Surveyor",
              "",
              "",
              "",
              ""
            ],
            [
              "Wakil Pengguna Jasa",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0025",
        "section": "BAGIAN 11: LAMPIRAN",
        "options": [],
        "required": false,
        "order": 25,
        "sourceOrder": 25,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi proses uji konsistensi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0026",
        "section": "BAGIAN 11: LAMPIRAN",
        "options": [],
        "required": false,
        "order": 26,
        "sourceOrder": 26,
        "unit": "",
        "rule": {},
        "label": "Data hasil pengukuran konsistensi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0027",
        "section": "BAGIAN 11: LAMPIRAN",
        "options": [],
        "required": false,
        "order": 27,
        "sourceOrder": 27,
        "unit": "",
        "rule": {},
        "label": "Foto-foto pendukung",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_CONSISTENCY_0028",
        "section": "BAGIAN 11: LAMPIRAN",
        "options": [],
        "required": false,
        "order": 28,
        "sourceOrder": 28,
        "unit": "",
        "rule": {},
        "label": "Berita acara uji konsistensi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-5-lereng-internal",
    "survey": "Lereng",
    "phase": "internal",
    "items": [
      {
        "code": "DOCX_LERENG_INTERNAL_0001",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "Dokumen No.: SLOPE-INT-VALID-001Revisi: 00Tanggal: [DD/MM/YYYY]Periode: [DD/MM/YYYY] s.d. [DD/MM/YYYY]",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0002",
        "section": "BAGIAN 1: INFORMASI UMUM",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: BAGIAN 1: INFORMASI UMUM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Detail"
          ],
          "row_labels": [
            "Nama Proyek",
            "Nomor Kontrak",
            "Penyedia Jasa",
            "Penanggung Jawab Validasi Internal",
            "Tim Validasi Internal",
            "Lokasi Validasi",
            "Periode Data yang Divalidasi",
            "Jumlah Lereng yang Divalidasi"
          ],
          "source_rows": [
            [
              "Nama Proyek",
              ""
            ],
            [
              "Nomor Kontrak",
              ""
            ],
            [
              "Penyedia Jasa",
              ""
            ],
            [
              "Penanggung Jawab Validasi Internal",
              ""
            ],
            [
              "Tim Validasi Internal",
              ""
            ],
            [
              "Lokasi Validasi",
              ""
            ],
            [
              "Periode Data yang Divalidasi",
              ""
            ],
            [
              "Jumlah Lereng yang Divalidasi",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0003",
        "section": "2.1 Dokumen Persiapan",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2.1 Dokumen Persiapan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Dokumen",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9"
          ],
          "source_rows": [
            [
              "1",
              "Program Mutu Pekerjaan",
              "□ Lengkap □ Belum Lengkap",
              ""
            ],
            [
              "2",
              "Rencana Kerja Survei",
              "□ Lengkap □ Belum Lengkap",
              ""
            ],
            [
              "3",
              "Jadwal Pelaksanaan",
              "□ Lengkap □ Belum Lengkap",
              ""
            ],
            [
              "4",
              "Pembagian Tim dan Tanggung Jawab",
              "□ Lengkap □ Belum Lengkap",
              ""
            ],
            [
              "5",
              "Prosedur Standar Operasional Survei",
              "□ Lengkap □ Belum Lengkap",
              ""
            ],
            [
              "6",
              "Formulir Survei Lereng",
              "□ Lengkap □ Belum Lengkap",
              ""
            ],
            [
              "7",
              "Data Historis/Sekunder Lereng",
              "□ Lengkap □ Belum Lengkap",
              ""
            ],
            [
              "8",
              "Peta Lokasi dan Rute Survei",
              "□ Lengkap □ Belum Lengkap",
              ""
            ],
            [
              "9",
              "Daftar Peralatan Survei",
              "□ Lengkap □ Belum Lengkap",
              ""
            ]
          ],
          "table_rows": 9,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0004",
        "section": "2.2 Kesiapan Tim",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2.2 Kesiapan Tim",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7"
          ],
          "source_rows": [
            [
              "1",
              "Tim surveyor terdiri dari personil dengan kualifikasi sesuai",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "2",
              "Tim surveyor telah mendapatkan briefing/pelatihan",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "3",
              "Tim surveyor memahami prosedur survei lereng",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "4",
              "Tim surveyor memahami penggunaan peralatan",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "5",
              "Tim surveyor memahami prosedur K3",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "6",
              "Tim QA/QC internal tersedia",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "7",
              "Kebutuhan logistik tim terpenuhi",
              "□ Ya □ Tidak",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0005",
        "section": "3.1 Kelengkapan dan Kondisi Peralatan",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3.1 Kelengkapan dan Kondisi Peralatan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Peralatan",
            "Kondisi",
            "Terkalibrasi",
            "Status Verifikasi",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9"
          ],
          "source_rows": [
            [
              "1",
              "GPS",
              "□ Baik □ Rusak",
              "□ Ya □ Tidak",
              "□ Terverifikasi □ Tidak",
              ""
            ],
            [
              "2",
              "Clinometer",
              "□ Baik □ Rusak",
              "□ Ya □ Tidak",
              "□ Terverifikasi □ Tidak",
              ""
            ],
            [
              "3",
              "Distance Meter/Roll Meter",
              "□ Baik □ Rusak",
              "□ Ya □ Tidak",
              "□ Terverifikasi □ Tidak",
              ""
            ],
            [
              "4",
              "Drone (jika ada)",
              "□ Baik □ Rusak",
              "□ Ya □ Tidak",
              "□ Terverifikasi □ Tidak",
              ""
            ],
            [
              "5",
              "Kompas Geologi",
              "□ Baik □ Rusak",
              "□ Ya □ Tidak",
              "□ Terverifikasi □ Tidak",
              ""
            ],
            [
              "6",
              "Palu Geologi",
              "□ Baik □ Rusak",
              "□ Ya □ Tidak",
              "□ Terverifikasi □ Tidak",
              ""
            ],
            [
              "7",
              "Kamera",
              "□ Baik □ Rusak",
              "□ Ya □ Tidak",
              "□ Terverifikasi □ Tidak",
              ""
            ],
            [
              "8",
              "Tablet/Perangkat Data",
              "□ Baik □ Rusak",
              "□ Ya □ Tidak",
              "□ Terverifikasi □ Tidak",
              ""
            ],
            [
              "9",
              "APD (Helm, Rompi, dll)",
              "□ Baik □ Rusak",
              "□ Ya □ Tidak",
              "□ Terverifikasi □ Tidak",
              ""
            ]
          ],
          "table_rows": 9,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0006",
        "section": "3.2 Verifikasi Hasil Kalibrasi Peralatan",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3.2 Verifikasi Hasil Kalibrasi Peralatan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Peralatan",
            "Tanggal Kalibrasi",
            "Hasil Kalibrasi",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "GPS",
              "",
              "□ Memenuhi □ Tidak",
              ""
            ],
            [
              "2",
              "Clinometer",
              "",
              "□ Memenuhi □ Tidak",
              ""
            ],
            [
              "3",
              "Distance Meter",
              "",
              "□ Memenuhi □ Tidak",
              ""
            ],
            [
              "4",
              "Drone (jika ada)",
              "",
              "□ Memenuhi □ Tidak",
              ""
            ],
            [
              "5",
              "Peralatan lainnya",
              "",
              "□ Memenuhi □ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0007",
        "section": "4.1 Kesesuaian Metode Survei",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 4.1 Kesesuaian Metode Survei",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek",
            "Sesuai Standar",
            "Tidak Sesuai",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9"
          ],
          "source_rows": [
            [
              "1",
              "Metode penentuan lokasi survei",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Metode inventarisasi lereng",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Metode pengukuran geometri lereng",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Metode identifikasi material penyusun",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Metode identifikasi gejala keruntuhan",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Metode penilaian risiko",
              "□",
              "□",
              ""
            ],
            [
              "7",
              "Metode dokumentasi visual",
              "□",
              "□",
              ""
            ],
            [
              "8",
              "Prosedur K3 di lapangan",
              "□",
              "□",
              ""
            ],
            [
              "9",
              "Koordinasi dengan pihak terkait",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 9,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0008",
        "section": "4.2 Penerapan Protokol K3",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 4.2 Penerapan Protokol K3",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek",
            "Diterapkan",
            "Tidak Diterapkan",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6"
          ],
          "source_rows": [
            [
              "1",
              "Penggunaan APD lengkap",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Manajemen keselamatan lalu lintas",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Protokol keselamatan saat cuaca buruk",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Protokol keselamatan saat bekerja di lereng",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Prosedur tanggap darurat",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Komunikasi tim di lapangan",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0009",
        "section": "5.1 Validasi Sampling Data (Minimum 10%)",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 5.1 Validasi Sampling Data (Minimum 10%)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Lokasi Lereng",
            "Kelengkapan Data",
            "Kesesuaian Format",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "□ Lengkap □ Tidak",
              "□ Sesuai □ Tidak",
              "□ Valid □ Tidak",
              ""
            ],
            [
              "2",
              "",
              "□ Lengkap □ Tidak",
              "□ Sesuai □ Tidak",
              "□ Valid □ Tidak",
              ""
            ],
            [
              "3",
              "",
              "□ Lengkap □ Tidak",
              "□ Sesuai □ Tidak",
              "□ Valid □ Tidak",
              ""
            ],
            [
              "4",
              "",
              "□ Lengkap □ Tidak",
              "□ Sesuai □ Tidak",
              "□ Valid □ Tidak",
              ""
            ],
            [
              "5",
              "",
              "□ Lengkap □ Tidak",
              "□ Sesuai □ Tidak",
              "□ Valid □ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0010",
        "section": "5.2 Validasi Kelengkapan Data Administrasi",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 5.2 Validasi Kelengkapan Data Administrasi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek",
            "Lengkap",
            "Tidak Lengkap",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7"
          ],
          "source_rows": [
            [
              "1",
              "Nomor dan nama ruas jalan",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Titik referensi/sta.",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Koordinat lokasi (GPS)",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Tanggal dan waktu survei",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Nama surveyor",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Kondisi cuaca saat survei",
              "□",
              "□",
              ""
            ],
            [
              "7",
              "Peta lokasi",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0011",
        "section": "5.3 Validasi Kelengkapan Data Geometri Lereng",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 5.3 Validasi Kelengkapan Data Geometri Lereng",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek",
            "Lengkap",
            "Tidak Lengkap",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7"
          ],
          "source_rows": [
            [
              "1",
              "Tinggi lereng",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Kemiringan lereng",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Panjang lereng",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Lebar bahu jalan",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Posisi lereng (kiri/kanan)",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Bangunan pengaman (jika ada)",
              "□",
              "□",
              ""
            ],
            [
              "7",
              "Sketsa geometri lereng",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0012",
        "section": "5.4 Validasi Kelengkapan Data Material Penyusun",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 5.4 Validasi Kelengkapan Data Material Penyusun",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek",
            "Lengkap",
            "Tidak Lengkap",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6"
          ],
          "source_rows": [
            [
              "1",
              "Jenis material dominan",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Struktur batuan/tanah",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Tingkat pelapukan",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Kondisi keairan",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Vegetasi penutup",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Foto material penyusun",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0013",
        "section": "5.5 Validasi Kelengkapan Data Gejala Keruntuhan",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 5.5 Validasi Kelengkapan Data Gejala Keruntuhan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek",
            "Lengkap",
            "Tidak Lengkap",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6"
          ],
          "source_rows": [
            [
              "1",
              "Jenis gejala keruntuhan",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Lokasi gejala keruntuhan",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Dimensi gejala keruntuhan",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Foto gejala keruntuhan",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Sketsa gejala keruntuhan",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Faktor penyebab potensial",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0014",
        "section": "5.6 Validasi Kelengkapan Penilaian Risiko",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 5.6 Validasi Kelengkapan Penilaian Risiko",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek",
            "Lengkap",
            "Tidak Lengkap",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Nilai tingkat bahaya",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Nilai tingkat konsekuensi",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Nilai risiko final",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Justifikasi penilaian",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Rekomendasi penanganan",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0015",
        "section": "5.7 Validasi Dokumentasi Visual",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 5.7 Validasi Dokumentasi Visual",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek",
            "Lengkap",
            "Tidak Lengkap",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8"
          ],
          "source_rows": [
            [
              "1",
              "Foto tampak keseluruhan lereng",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Foto material penyusun",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Foto gejala keruntuhan (jika ada)",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Foto bangunan pengaman (jika ada)",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Foto kondisi drainase",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Sketsa lereng",
              "□",
              "□",
              ""
            ],
            [
              "7",
              "Kualitas foto (pencahayaan, fokus)",
              "□",
              "□",
              ""
            ],
            [
              "8",
              "Skala pada foto",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0016",
        "section": "6.1 Verifikasi Input Data",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 6.1 Verifikasi Input Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek",
            "Terverifikasi",
            "Tidak Terverifikasi",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7"
          ],
          "source_rows": [
            [
              "1",
              "Data diinput dengan akurat",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Tidak ada kesalahan pengetikan",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Format data sesuai standar",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Struktur data konsisten",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Satuan pengukuran konsisten",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Data lengkap untuk semua parameter",
              "□",
              "□",
              ""
            ],
            [
              "7",
              "Kode/ID lokasi konsisten",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0017",
        "section": "6.2 Verifikasi Perhitungan dan Analisis",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 6.2 Verifikasi Perhitungan dan Analisis",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek",
            "Terverifikasi",
            "Tidak Terverifikasi",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6"
          ],
          "source_rows": [
            [
              "1",
              "Perhitungan nilai bahaya sesuai pedoman",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Perhitungan nilai konsekuensi sesuai pedoman",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Matriks risiko diterapkan dengan benar",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Konsistensi analisis antar lokasi",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Justifikasi penilaian sesuai dengan data",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Rekomendasi sesuai dengan tingkat risiko",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0018",
        "section": "6.3 Verifikasi Format Data untuk Sistem InSlope",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 6.3 Verifikasi Format Data untuk Sistem InSlope",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek",
            "Terverifikasi",
            "Tidak Terverifikasi",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7"
          ],
          "source_rows": [
            [
              "1",
              "Format data sesuai kebutuhan InSlope",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Struktur file sesuai standar",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Penamaan file sesuai konvensi",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Metadata lengkap",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Data spasial dalam format yang sesuai",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Tautan foto ke data spasial berfungsi",
              "□",
              "□",
              ""
            ],
            [
              "7",
              "Backup data tersedia",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0019",
        "section": "7.1 Verifikasi Kelengkapan Laporan",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 7.1 Verifikasi Kelengkapan Laporan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek",
            "Terverifikasi",
            "Tidak Terverifikasi",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7"
          ],
          "source_rows": [
            [
              "1",
              "Format laporan sesuai ketentuan",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Informasi administrasi lengkap",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Data hasil survei lengkap",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Analisis hasil survei lengkap",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Rekomendasi penanganan jelas",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Dokumentasi visual lengkap",
              "□",
              "□",
              ""
            ],
            [
              "7",
              "Peta dan sketsa lengkap",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0020",
        "section": "7.2 Verifikasi Dokumentasi Pendukung",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 7.2 Verifikasi Dokumentasi Pendukung",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek",
            "Terverifikasi",
            "Tidak Terverifikasi",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6"
          ],
          "source_rows": [
            [
              "1",
              "Dokumen kalibrasi peralatan",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Dokumen validasi internal",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Dokumentasi K3 lapangan",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Berita acara kegiatan survei",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Dokumentasi koordinasi dengan pihak terkait",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Data mentah survei tersimpan dengan baik",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0021",
        "section": "8.1 Daftar Temuan Internal",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 8.1 Daftar Temuan Internal",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Deskripsi Temuan",
            "Kategori*",
            "Lokasi/Data",
            "Penyebab"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0022",
        "section": "8.1 Daftar Temuan Internal",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "*Kategori: Kritis (mempengaruhi keselamatan/integritas data), Major (signifikan), Minor (tidak signifikan)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0023",
        "section": "8.2 Tindakan Perbaikan dan Pencegahan",
        "options": [],
        "required": false,
        "order": 23,
        "sourceOrder": 23,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 8.2 Tindakan Perbaikan dan Pencegahan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Referensi Temuan",
            "Tindakan Perbaikan",
            "PIC",
            "Target Selesai",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              "□ Selesai □ Proses □ Belum"
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              "□ Selesai □ Proses □ Belum"
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              "□ Selesai □ Proses □ Belum"
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              "□ Selesai □ Proses □ Belum"
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              "□ Selesai □ Proses □ Belum"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0024",
        "section": "9.1 Status Validasi Data",
        "options": [],
        "required": false,
        "order": 24,
        "sourceOrder": 24,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 9.1 Status Validasi Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Kategori",
            "Jumlah Lereng",
            "Persentase"
          ],
          "row_labels": [
            "Data Valid tanpa Catatan",
            "Data Valid dengan Catatan Minor",
            "Data Perlu Perbaikan",
            "Data Tidak Valid",
            "Total"
          ],
          "source_rows": [
            [
              "Data Valid tanpa Catatan",
              "",
              ""
            ],
            [
              "Data Valid dengan Catatan Minor",
              "",
              ""
            ],
            [
              "Data Perlu Perbaikan",
              "",
              ""
            ],
            [
              "Data Tidak Valid",
              "",
              ""
            ],
            [
              "Total",
              "",
              "100%"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0025",
        "section": "9.2 Kendala dan Risiko",
        "options": [],
        "required": false,
        "order": 25,
        "sourceOrder": 25,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 9.2 Kendala dan Risiko",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Kendala/Risiko",
            "Dampak",
            "Mitigasi yang Dilakukan"
          ],
          "row_labels": [
            "1",
            "2",
            "3"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0026",
        "section": "10.1 Kesimpulan",
        "options": [],
        "required": false,
        "order": 26,
        "sourceOrder": 26,
        "unit": "",
        "rule": {},
        "label": "[Isi dengan kesimpulan ringkas tentang hasil validasi dan verifikasi internal]",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0027",
        "section": "10.2 Rekomendasi Internal",
        "options": [],
        "required": false,
        "order": 27,
        "sourceOrder": 27,
        "unit": "",
        "rule": {},
        "label": "[Isi dengan rekomendasi untuk peningkatan kualitas survei dan data]",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0028",
        "section": "10.3 Rencana Validasi dan Verifikasi Selanjutnya",
        "options": [],
        "required": false,
        "order": 28,
        "sourceOrder": 28,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 10.3 Rencana Validasi dan Verifikasi Selanjutnya",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Keterangan"
          ],
          "row_labels": [
            "Jadwal",
            "Fokus Area",
            "Peningkatan yang Diperlukan"
          ],
          "source_rows": [
            [
              "Jadwal",
              ""
            ],
            [
              "Fokus Area",
              ""
            ],
            [
              "Peningkatan yang Diperlukan",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0029",
        "section": "BAGIAN 11: TANDA TANGAN PERSETUJUAN INTERNAL",
        "options": [],
        "required": false,
        "order": 29,
        "sourceOrder": 29,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: BAGIAN 11: TANDA TANGAN PERSETUJUAN INTERNAL",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Posisi",
            "Nama",
            "Tanda Tangan",
            "Tanggal"
          ],
          "row_labels": [
            "QA/QC Manager",
            "Kepala Tim Survei",
            "Ahli Geologi",
            "Pengolah Data",
            "Project Manager"
          ],
          "source_rows": [
            [
              "QA/QC Manager",
              "",
              "",
              ""
            ],
            [
              "Kepala Tim Survei",
              "",
              "",
              ""
            ],
            [
              "Ahli Geologi",
              "",
              "",
              ""
            ],
            [
              "Pengolah Data",
              "",
              "",
              ""
            ],
            [
              "Project Manager",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0030",
        "section": "BAGIAN 12: LAMPIRAN",
        "options": [],
        "required": false,
        "order": 30,
        "sourceOrder": 30,
        "unit": "",
        "rule": {},
        "label": "Data sampling validasi dan verifikasi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0031",
        "section": "BAGIAN 12: LAMPIRAN",
        "options": [],
        "required": false,
        "order": 31,
        "sourceOrder": 31,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi temuan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0032",
        "section": "BAGIAN 12: LAMPIRAN",
        "options": [],
        "required": false,
        "order": 32,
        "sourceOrder": 32,
        "unit": "",
        "rule": {},
        "label": "Bukti tindakan perbaikan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0033",
        "section": "BAGIAN 12: LAMPIRAN",
        "options": [],
        "required": false,
        "order": 33,
        "sourceOrder": 33,
        "unit": "",
        "rule": {},
        "label": "Checklist verifikasi per lokasi sampel",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_INTERNAL_0034",
        "section": "BAGIAN 12: LAMPIRAN",
        "options": [],
        "required": false,
        "order": 34,
        "sourceOrder": 34,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi kegiatan validasi internal",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-6-lereng-periodic14",
    "survey": "Lereng",
    "phase": "periodic14",
    "items": [
      {
        "code": "DOCX_LERENG_PERIODIC14_0001",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: Informasi dan Pemeriksaan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "",
            "KEMENTERIAN PEKERJAAN UMUM DAN PERUMAHAN RAKYATDIREKTORAT JENDERAL BINA MARGADIREKTORAT BINA TEKNIK JALAN DAN JEMBATAN",
            ""
          ],
          "row_labels": [
            "",
            "No. Dok.: No. Rev.: 00"
          ],
          "source_rows": [
            [
              "",
              "PETUNJUK PELAKSANAAN QUALITY ASSURANCE DAN QUALITY CONTROL PADA KEGIATAN SURVEY KONDISI JALANCHECKLIST VERIFIKASI DAN VALIDASI 2 MINGGUAN SURVEI LERENG"
            ],
            [
              "No. Dok.: No. Rev.: 00",
              "Tgl. Diterbitkan: Maret 2025Tgl. Revisi: -",
              "Hal:1 dari 2Paraf:"
            ]
          ],
          "table_rows": 2,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0002",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Dokumen No.: SLOPE-VV-2W-001Revisi: 00Periode: [DD/MM/YYYY] s.d. [DD/MM/YYYY]Wilayah Survei: [Nama Ruas/Wilayah]",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0003",
        "section": "BAGIAN 1: INFORMASI UMUM",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: BAGIAN 1: INFORMASI UMUM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Detail"
          ],
          "row_labels": [
            "Nama Proyek",
            "Nomor Kontrak",
            "Penyedia Jasa",
            "Pengguna Jasa",
            "Penanggung Jawab Verifikasi",
            "Tim Verifikasi",
            "Tanggal Verifikasi",
            "Lokasi Pertemuan"
          ],
          "source_rows": [
            [
              "Nama Proyek",
              ""
            ],
            [
              "Nomor Kontrak",
              ""
            ],
            [
              "Penyedia Jasa",
              ""
            ],
            [
              "Pengguna Jasa",
              ""
            ],
            [
              "Penanggung Jawab Verifikasi",
              ""
            ],
            [
              "Tim Verifikasi",
              ""
            ],
            [
              "Tanggal Verifikasi",
              ""
            ],
            [
              "Lokasi Pertemuan",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0004",
        "section": "BAGIAN 2: KEMAJUAN PEKERJAAN",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: BAGIAN 2: KEMAJUAN PEKERJAAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Parameter",
            "Target 2 Minggu",
            "Realisasi",
            "% Kemajuan",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6"
          ],
          "source_rows": [
            [
              "1",
              "Jumlah lereng tersurvei",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "Panjang ruas jalan tersurvei (km)",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "Data inventarisasi lereng",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "Data inspeksi berkala lereng",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "Data penilaian risiko lereng",
              "",
              "",
              "",
              ""
            ],
            [
              "6",
              "Data telah diunggah ke InSlope",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0005",
        "section": "3.1 Verifikasi Personil",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3.1 Verifikasi Personil",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek Verifikasi",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8"
          ],
          "source_rows": [
            [
              "1",
              "Personil sesuai dengan yang tercantum dalam kontrak",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Ahli Geologi tersedia dan terlibat aktif",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Asisten Ahli Geologi tersedia dan terlibat aktif",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Surveyor tersedia dan terlibat aktif",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Tim lapangan memiliki kompetensi yang memadai",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Pelatihan penyegaran telah dilaksanakan",
              "□",
              "□",
              ""
            ],
            [
              "7",
              "Personil memahami prosedur standar survei lereng",
              "□",
              "□",
              ""
            ],
            [
              "8",
              "Personil menerapkan protokol K3 dengan baik",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0006",
        "section": "3.2 Verifikasi Peralatan",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3.2 Verifikasi Peralatan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek Verifikasi",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11"
          ],
          "source_rows": [
            [
              "1",
              "Peralatan lengkap sesuai kebutuhan survei",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "GPS berfungsi dengan baik dan terkalibrasi",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Clinometer berfungsi dengan baik dan terkalibrasi",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Distance meter/Roll meter dalam kondisi baik",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Drone (jika digunakan) berfungsi optimal",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Kompas geologi berfungsi dengan baik",
              "□",
              "□",
              ""
            ],
            [
              "7",
              "Tablet/perangkat untuk aplikasi InSlope berfungsi",
              "□",
              "□",
              ""
            ],
            [
              "8",
              "Kamera dokumentasi berfungsi dengan baik",
              "□",
              "□",
              ""
            ],
            [
              "9",
              "Alat Pelindung Diri (APD) lengkap dan digunakan",
              "□",
              "□",
              ""
            ],
            [
              "10",
              "Bukti kalibrasi alat tersedia dan masih berlaku",
              "□",
              "□",
              ""
            ],
            [
              "11",
              "Peralatan komunikasi berfungsi dengan baik",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 11,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0007",
        "section": "BAGIAN 4: VERIFIKASI METODE DAN PROSEDUR",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: BAGIAN 4: VERIFIKASI METODE DAN PROSEDUR",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek Verifikasi",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10"
          ],
          "source_rows": [
            [
              "1",
              "Metode survei sesuai dengan Pedoman Survei Lereng Jalan",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Prosedur inventarisasi lereng dilaksanakan dengan benar",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Prosedur inspeksi berkala lereng dilaksanakan dengan benar",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Prosedur penilaian risiko lereng dilaksanakan dengan benar",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Titik-titik pengamatan ditentukan dengan tepat",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Pengukuran geometri lereng dilakukan dengan benar",
              "□",
              "□",
              ""
            ],
            [
              "7",
              "Identifikasi material penyusun lereng dilakukan dengan benar",
              "□",
              "□",
              ""
            ],
            [
              "8",
              "Identifikasi gejala keruntuhan dilakukan dengan teliti",
              "□",
              "□",
              ""
            ],
            [
              "9",
              "Dokumentasi visual dilakukan dengan sistematis",
              "□",
              "□",
              ""
            ],
            [
              "10",
              "Prosedur pengunggahan data ke InSlope dilakukan dengan benar",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0008",
        "section": "5.1 Validasi Kelengkapan Data",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 5.1 Validasi Kelengkapan Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek Validasi",
            "Sesuai",
            "Tidak Sesuai",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11"
          ],
          "source_rows": [
            [
              "1",
              "Data administrasi (nomor dan nama ruas, koordinat) lengkap",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Data inventarisasi lereng lengkap",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Data geometrik lereng lengkap",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Data material penyusun lereng lengkap",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Data gejala keruntuhan lengkap",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Data bangunan rekayasa (jika ada) lengkap",
              "□",
              "□",
              ""
            ],
            [
              "7",
              "Data vegetasi penutup lereng lengkap",
              "□",
              "□",
              ""
            ],
            [
              "8",
              "Data sistem drainase lengkap",
              "□",
              "□",
              ""
            ],
            [
              "9",
              "Foto dokumentasi lengkap",
              "□",
              "□",
              ""
            ],
            [
              "10",
              "Sketsa/gambar lereng lengkap",
              "□",
              "□",
              ""
            ],
            [
              "11",
              "Data penilaian risiko lengkap",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 11,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0009",
        "section": "5.2 Validasi Akurasi Data (Cek Silang dengan Data Lapangan)",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 5.2 Validasi Akurasi Data (Cek Silang dengan Data Lapangan)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek Validasi",
            "Sesuai",
            "Tidak Sesuai",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8"
          ],
          "source_rows": [
            [
              "1",
              "Data koordinat akurat (±5m)",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Data ketinggian lereng akurat (±10%)",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Data kemiringan lereng akurat (±5°)",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Data panjang lereng akurat (±10%)",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Identifikasi material penyusun akurat",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Identifikasi gejala keruntuhan akurat",
              "□",
              "□",
              ""
            ],
            [
              "7",
              "Dokumentasi foto representatif dan jelas",
              "□",
              "□",
              ""
            ],
            [
              "8",
              "Penilaian tingkat risiko konsisten",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0010",
        "section": "5.3 Validasi Konsistensi Data (Perbandingan Antar Surveyor)",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 5.3 Validasi Konsistensi Data (Perbandingan Antar Surveyor)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek Validasi",
            "Tinggi",
            "Sedang",
            "Rendah",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6"
          ],
          "source_rows": [
            [
              "1",
              "Konsistensi pengukuran geometri lereng",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Konsistensi identifikasi material penyusun",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Konsistensi identifikasi gejala keruntuhan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Konsistensi penilaian risiko lereng",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Konsistensi penamaan/penomoran lokasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Konsistensi dokumentasi visual",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0011",
        "section": "BAGIAN 6: VALIDASI PENGUNGGAHAN DATA",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: BAGIAN 6: VALIDASI PENGUNGGAHAN DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Aspek Validasi",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7"
          ],
          "source_rows": [
            [
              "1",
              "Data telah diunggah ke sistem InSlope",
              "□",
              "□",
              ""
            ],
            [
              "2",
              "Format data sesuai dengan standar InSlope",
              "□",
              "□",
              ""
            ],
            [
              "3",
              "Data dapat diakses dalam sistem InSlope",
              "□",
              "□",
              ""
            ],
            [
              "4",
              "Tidak ada error/kesalahan dalam data yang diunggah",
              "□",
              "□",
              ""
            ],
            [
              "5",
              "Metadata lengkap dan akurat",
              "□",
              "□",
              ""
            ],
            [
              "6",
              "Foto telah terhubung dengan data spasial",
              "□",
              "□",
              ""
            ],
            [
              "7",
              "Data backup tersedia",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0012",
        "section": "7.1 Temuan dan Deviasi",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 7.1 Temuan dan Deviasi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Deskripsi Temuan",
            "Kategori*",
            "Tindakan Perbaikan",
            "PIC",
            "Target Penyelesaian"
          ],
          "row_labels": [
            "1",
            "2",
            "3"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0013",
        "section": "7.1 Temuan dan Deviasi",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "*Kategori: Major (mempengaruhi kualitas data secara signifikan), Minor (tidak mempengaruhi kualitas data secara signifikan), Observasi (catatan untuk perbaikan)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0014",
        "section": "7.2 Identifikasi Risiko dan Mitigasi",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 7.2 Identifikasi Risiko dan Mitigasi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Risiko Teridentifikasi",
            "Dampak",
            "Kemungkinan",
            "Level Risiko",
            "Tindakan Mitigasi",
            "PIC"
          ],
          "row_labels": [
            "1",
            "2",
            "3"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0015",
        "section": "8.1 Status Verifikasi dan Validasi",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 8.1 Status Verifikasi dan Validasi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Status",
            "Keputusan"
          ],
          "row_labels": [
            "□ Diterima tanpa catatan",
            "□ Diterima dengan catatan",
            "□ Perlu revisi",
            "□ Ditolak"
          ],
          "source_rows": [
            [
              "□ Diterima tanpa catatan",
              "Data kualitas baik dan memenuhi semua persyaratan"
            ],
            [
              "□ Diterima dengan catatan",
              "Data dapat diterima dengan beberapa perbaikan minor"
            ],
            [
              "□ Perlu revisi",
              "Data perlu direvisi sebelum dapat diterima"
            ],
            [
              "□ Ditolak",
              "Data tidak memenuhi persyaratan kualitas dan perlu survei ulang"
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0016",
        "section": "8.2 Rekomendasi Tindak Lanjut",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "[Isi dengan rekomendasi tindak lanjut yang jelas dan spesifik]",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0017",
        "section": "8.3 Rencana Verifikasi Berikutnya",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 8.3 Rencana Verifikasi Berikutnya",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Keterangan"
          ],
          "row_labels": [
            "Jadwal",
            "Lokasi",
            "Fokus Area",
            "Target Khusus"
          ],
          "source_rows": [
            [
              "Jadwal",
              ""
            ],
            [
              "Lokasi",
              ""
            ],
            [
              "Fokus Area",
              ""
            ],
            [
              "Target Khusus",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0018",
        "section": "BAGIAN 9: TANDA TANGAN",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: BAGIAN 9: TANDA TANGAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Posisi",
            "Nama",
            "Institusi",
            "Tanda Tangan",
            "Tanggal"
          ],
          "row_labels": [
            "Perwakilan Penyedia Jasa",
            "Perwakilan Pengguna Jasa",
            "QA/QC Manager",
            "Ahli Geologi"
          ],
          "source_rows": [
            [
              "Perwakilan Penyedia Jasa",
              "",
              "",
              "",
              ""
            ],
            [
              "Perwakilan Pengguna Jasa",
              "",
              "",
              "",
              ""
            ],
            [
              "QA/QC Manager",
              "",
              "",
              "",
              ""
            ],
            [
              "Ahli Geologi",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0019",
        "section": "BAGIAN 10: LAMPIRAN",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi kegiatan verifikasi dan validasi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0020",
        "section": "BAGIAN 10: LAMPIRAN",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "Sampel data yang diverifikasi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0021",
        "section": "BAGIAN 10: LAMPIRAN",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Bukti temuan (foto, screenshot, dll.)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0022",
        "section": "BAGIAN 10: LAMPIRAN",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "Bukti tindakan perbaikan dari verifikasi sebelumnya",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0023",
        "section": "BAGIAN 10: LAMPIRAN",
        "options": [],
        "required": false,
        "order": 23,
        "sourceOrder": 23,
        "unit": "",
        "rule": {},
        "label": "Bukti kalibrasi peralatan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LERENG_PERIODIC14_0024",
        "section": "BAGIAN 10: LAMPIRAN",
        "options": [],
        "required": false,
        "order": 24,
        "sourceOrder": 24,
        "unit": "",
        "rule": {},
        "label": "Berita acara pertemuan verifikasi dan validasi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-7-drainase-consistency",
    "survey": "Drainase",
    "phase": "consistency",
    "items": [
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0001",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "KEGIATAN QA/QC KONSISTENSI SURVEI DRAINASE",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0002",
        "section": "A. INFORMASI UMUM",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. INFORMASI UMUM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Detail"
          ],
          "row_labels": [
            "Nama Proyek",
            "Nomor Kontrak",
            "Periode Pengujian Konsistensi",
            "Lokasi",
            "Tanggal Pengujian",
            "Penanggung Jawab",
            "Jabatan",
            "Instansi",
            "Tim Surveyor yang Diuji"
          ],
          "source_rows": [
            [
              "Nama Proyek",
              ""
            ],
            [
              "Nomor Kontrak",
              ""
            ],
            [
              "Periode Pengujian Konsistensi",
              ""
            ],
            [
              "Lokasi",
              ""
            ],
            [
              "Tanggal Pengujian",
              ""
            ],
            [
              "Penanggung Jawab",
              ""
            ],
            [
              "Jabatan",
              ""
            ],
            [
              "Instansi",
              ""
            ],
            [
              "Tim Surveyor yang Diuji",
              ""
            ]
          ],
          "table_rows": 9,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0003",
        "section": "B. INFORMASI LOKASI UJI KONSISTENSI",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. INFORMASI LOKASI UJI KONSISTENSI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Detail"
          ],
          "row_labels": [
            "Nomor Ruas Jalan",
            "Nama Ruas Jalan",
            "Panjang Segmen Uji (km)",
            "Jumlah Titik Sampel",
            "Koordinat Awal",
            "Koordinat Akhir",
            "Tanggal Pelaksanaan Uji",
            "Kondisi Cuaca"
          ],
          "source_rows": [
            [
              "Nomor Ruas Jalan",
              ""
            ],
            [
              "Nama Ruas Jalan",
              ""
            ],
            [
              "Panjang Segmen Uji (km)",
              ""
            ],
            [
              "Jumlah Titik Sampel",
              ""
            ],
            [
              "Koordinat Awal",
              ""
            ],
            [
              "Koordinat Akhir",
              ""
            ],
            [
              "Tanggal Pelaksanaan Uji",
              ""
            ],
            [
              "Kondisi Cuaca",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0004",
        "section": "C. KONSISTENSI PENGUKURAN ANTAR SURVEYOR",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. KONSISTENSI PENGUKURAN ANTAR SURVEYOR",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Parameter Pengujian",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "C.1",
            "C.2",
            "C.3",
            "C.4",
            "C.5",
            "C.6",
            "C.7",
            "C.8",
            "C.9",
            "C.10"
          ],
          "source_rows": [
            [
              "C.1",
              "Pengukuran dilakukan oleh minimal 2 surveyor secara independen",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.2",
              "Pengukuran mencakup minimal 5 sampel untuk setiap jenis saluran",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.3",
              "Sampel mewakili berbagai kondisi saluran (baik, sedang, rusak)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.4",
              "Selisih pengukuran lebar saluran antar surveyor ≤ 10 cm",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.5",
              "Selisih pengukuran kedalaman saluran antar surveyor ≤ 10 cm",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.6",
              "Selisih pengukuran tinggi sedimentasi antar surveyor ≤ 10 cm",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.7",
              "Identifikasi jenis saluran konsisten antar surveyor",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.8",
              "Penilaian kondisi saluran konsisten antar surveyor",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.9",
              "Penilaian kategori kerusakan konsisten antar surveyor",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.10",
              "Identifikasi permasalahan drainase konsisten antar surveyor",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0005",
        "section": "D. KONSISTENSI PENGUKURAN BERULANG (REPEATABILITY)",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: D. KONSISTENSI PENGUKURAN BERULANG (REPEATABILITY)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Parameter Pengujian",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "D.1",
            "D.2",
            "D.3",
            "D.4",
            "D.5",
            "D.6",
            "D.7",
            "D.8",
            "D.9",
            "D.10"
          ],
          "source_rows": [
            [
              "D.1",
              "Pengukuran berulang dilakukan dengan jeda waktu minimal 1 hari",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.2",
              "Pengukuran berulang dilakukan oleh surveyor yang sama",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.3",
              "Pengukuran berulang dilakukan pada lokasi yang persis sama",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.4",
              "Selisih pengukuran lebar saluran pada pengukuran berulang ≤ 10 cm",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.5",
              "Selisih pengukuran kedalaman saluran pada pengukuran berulang ≤ 10 cm",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.6",
              "Selisih pengukuran tinggi sedimentasi pada pengukuran berulang ≤ 10 cm",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.7",
              "Identifikasi jenis saluran konsisten pada pengukuran berulang",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.8",
              "Penilaian kondisi saluran konsisten pada pengukuran berulang",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.9",
              "Penilaian kategori kerusakan konsisten pada pengukuran berulang",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.10",
              "Identifikasi permasalahan drainase konsisten pada pengukuran berulang",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0006",
        "section": "E. KONSISTENSI PENGGUNAAN APLIKASI INDRAIN",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: E. KONSISTENSI PENGGUNAAN APLIKASI INDRAIN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Parameter Pengujian",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "E.1",
            "E.2",
            "E.3",
            "E.4",
            "E.5",
            "E.6",
            "E.7",
            "E.8",
            "E.9",
            "E.10"
          ],
          "source_rows": [
            [
              "E.1",
              "Konsistensi dalam pemilihan menu dan opsi aplikasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.2",
              "Konsistensi dalam pengisian data administrasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.3",
              "Konsistensi dalam pengambilan titik koordinat",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.4",
              "Konsistensi dalam pengisian formulir inspeksi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.5",
              "Konsistensi dalam pengambilan dan penamaan foto",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.6",
              "Konsistensi dalam penggunaan skala penilaian",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.7",
              "Konsistensi dalam penyimpanan data",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.8",
              "Konsistensi dalam pengisian keterangan tambahan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.9",
              "Konsistensi dalam penamaan file",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.10",
              "Konsistensi dalam proses pengunggahan data",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0007",
        "section": "F. KONSISTENSI DENGAN STANDAR DAN PEDOMAN",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: F. KONSISTENSI DENGAN STANDAR DAN PEDOMAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Parameter Pengujian",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "F.1",
            "F.2",
            "F.3",
            "F.4",
            "F.5",
            "F.6",
            "F.7",
            "F.8",
            "F.9",
            "F.10"
          ],
          "source_rows": [
            [
              "F.1",
              "Metode survei konsisten dengan SE Direktur Jenderal Bina Marga No. 04/SE/Db/2021",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.2",
              "Penggunaan aplikasi konsisten dengan Petunjuk Teknis No. 01/JUKNIS/BM/2024",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.3",
              "Kriteria penilaian kondisi saluran konsisten dengan standar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.4",
              "Klasifikasi kondisi drainase konsisten dengan standar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.5",
              "Pengukuran dimensi saluran konsisten dengan metode standar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.6",
              "Dokumentasi foto konsisten dengan ketentuan pedoman",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.7",
              "Identifikasi permasalahan drainase konsisten dengan pedoman",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.8",
              "Format pelaporan konsisten dengan ketentuan pedoman",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.9",
              "Prosedur keselamatan kerja konsisten dengan ketentuan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.10",
              "Interpretasi hasil penilaian konsisten dengan pedoman",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0008",
        "section": "G. KONSISTENSI DOKUMENTASI",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: G. KONSISTENSI DOKUMENTASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Parameter Pengujian",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "G.1",
            "G.2",
            "G.3",
            "G.4",
            "G.5",
            "G.6",
            "G.7",
            "G.8",
            "G.9",
            "G.10"
          ],
          "source_rows": [
            [
              "G.1",
              "Pengambilan foto konsisten dari segi sudut pandang",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.2",
              "Pengambilan foto konsisten dari segi pencahayaan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.3",
              "Pengambilan foto konsisten dari segi jarak",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.4",
              "Foto menampilkan fitur drainase secara jelas dan konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.5",
              "Penamaan file foto konsisten sesuai standar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.6",
              "Metadata foto (koordinat, waktu) konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.7",
              "Jumlah foto per lokasi konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.8",
              "Resolusi foto konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.9",
              "Dokumentasi kerusakan/permasalahan konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.10",
              "Dokumentasi tanggal dan waktu survei konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0009",
        "section": "H. HASIL UJI KONSISTENSI PENGUKURAN ANTAR SURVEYOR",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: H. HASIL UJI KONSISTENSI PENGUKURAN ANTAR SURVEYOR",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Lokasi (STA)",
            "Parameter",
            "Surveyor 1",
            "Surveyor 2",
            "Selisih",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "Lebar saluran",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "Kedalaman saluran",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "Tinggi sedimentasi",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "Kondisi saluran",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "Kategori kerusakan",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0010",
        "section": "H. HASIL UJI KONSISTENSI PENGUKURAN ANTAR SURVEYOR",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Kriteria Status: Konsisten (selisih ≤10%), Kurang Konsisten (selisih 10-20%), Tidak Konsisten (selisih >20%)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0011",
        "section": "I. HASIL UJI KONSISTENSI PENGUKURAN BERULANG",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: I. HASIL UJI KONSISTENSI PENGUKURAN BERULANG",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Lokasi (STA)",
            "Parameter",
            "Pengukuran 1",
            "Pengukuran 2",
            "Selisih",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "Lebar saluran",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "Kedalaman saluran",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "Tinggi sedimentasi",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "Kondisi saluran",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "Kategori kerusakan",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0012",
        "section": "I. HASIL UJI KONSISTENSI PENGUKURAN BERULANG",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Kriteria Status: Konsisten (selisih ≤10%), Kurang Konsisten (selisih 10-20%), Tidak Konsisten (selisih >20%)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0013",
        "section": "J. ANALISIS HASIL UJI KONSISTENSI",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: J. ANALISIS HASIL UJI KONSISTENSI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Parameter",
            "Nilai",
            "Keterangan"
          ],
          "row_labels": [
            "Tingkat konsistensi pengukuran antar surveyor (%)",
            "Tingkat konsistensi pengukuran berulang (%)",
            "Tingkat konsistensi penggunaan aplikasi (%)",
            "Tingkat konsistensi dengan standar dan pedoman (%)",
            "Tingkat konsistensi dokumentasi (%)",
            "Koefisien variasi pengukuran lebar saluran (%)",
            "Koefisien variasi pengukuran kedalaman saluran (%)",
            "Koefisien variasi pengukuran tinggi sedimentasi (%)",
            "Tingkat konsistensi penilaian kondisi saluran (%)",
            "Tingkat konsistensi identifikasi jenis kerusakan (%)"
          ],
          "source_rows": [
            [
              "Tingkat konsistensi pengukuran antar surveyor (%)",
              "",
              ""
            ],
            [
              "Tingkat konsistensi pengukuran berulang (%)",
              "",
              ""
            ],
            [
              "Tingkat konsistensi penggunaan aplikasi (%)",
              "",
              ""
            ],
            [
              "Tingkat konsistensi dengan standar dan pedoman (%)",
              "",
              ""
            ],
            [
              "Tingkat konsistensi dokumentasi (%)",
              "",
              ""
            ],
            [
              "Koefisien variasi pengukuran lebar saluran (%)",
              "",
              ""
            ],
            [
              "Koefisien variasi pengukuran kedalaman saluran (%)",
              "",
              ""
            ],
            [
              "Koefisien variasi pengukuran tinggi sedimentasi (%)",
              "",
              ""
            ],
            [
              "Tingkat konsistensi penilaian kondisi saluran (%)",
              "",
              ""
            ],
            [
              "Tingkat konsistensi identifikasi jenis kerusakan (%)",
              "",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0014",
        "section": "K. TEMUAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: K. TEMUAN DAN REKOMENDASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Kategori Temuan",
            "Deskripsi Temuan",
            "Dampak",
            "Rekomendasi Tindakan",
            "Prioritas"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0015",
        "section": "L. KESIMPULAN UJI KONSISTENSI",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: L. KESIMPULAN UJI KONSISTENSI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Aspek",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "Konsistensi Pengukuran Antar Surveyor",
            "Konsistensi Pengukuran Berulang",
            "Konsistensi Penggunaan Aplikasi",
            "Konsistensi dengan Standar dan Pedoman",
            "Konsistensi Dokumentasi",
            "Status Akhir"
          ],
          "source_rows": [
            [
              "Konsistensi Pengukuran Antar Surveyor",
              "☐ Konsisten ☐ Cukup Konsisten ☐ Tidak Konsisten",
              ""
            ],
            [
              "Konsistensi Pengukuran Berulang",
              "☐ Konsisten ☐ Cukup Konsisten ☐ Tidak Konsisten",
              ""
            ],
            [
              "Konsistensi Penggunaan Aplikasi",
              "☐ Konsisten ☐ Cukup Konsisten ☐ Tidak Konsisten",
              ""
            ],
            [
              "Konsistensi dengan Standar dan Pedoman",
              "☐ Konsisten ☐ Cukup Konsisten ☐ Tidak Konsisten",
              ""
            ],
            [
              "Konsistensi Dokumentasi",
              "☐ Konsisten ☐ Cukup Konsisten ☐ Tidak Konsisten",
              ""
            ],
            [
              "Status Akhir",
              "☐ MEMENUHI SYARAT ☐ MEMENUHI SYARAT DENGAN CATATAN ☐ PERLU PELATIHAN ULANG",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0016",
        "section": "M. PERSETUJUAN HASIL UJI KONSISTENSI",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: M. PERSETUJUAN HASIL UJI KONSISTENSI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Peran",
            "Nama",
            "Instansi",
            "Tanda Tangan",
            "Tanggal"
          ],
          "row_labels": [
            "Penanggung Jawab Uji Konsistensi",
            "Ketua Tim Survei",
            "Perwakilan Penyedia Jasa",
            "Perwakilan Pengguna Jasa"
          ],
          "source_rows": [
            [
              "Penanggung Jawab Uji Konsistensi",
              "",
              "",
              "",
              ""
            ],
            [
              "Ketua Tim Survei",
              "",
              "",
              "",
              ""
            ],
            [
              "Perwakilan Penyedia Jasa",
              "",
              "",
              "",
              ""
            ],
            [
              "Perwakilan Pengguna Jasa",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0017",
        "section": "M. PERSETUJUAN HASIL UJI KONSISTENSI",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "LAMPIRAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0018",
        "section": "M. PERSETUJUAN HASIL UJI KONSISTENSI",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi foto lokasi uji konsistensi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0019",
        "section": "M. PERSETUJUAN HASIL UJI KONSISTENSI",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Tabel hasil pengukuran detail setiap sampel",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0020",
        "section": "M. PERSETUJUAN HASIL UJI KONSISTENSI",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "Grafik perbandingan hasil pengukuran antar surveyor",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0021",
        "section": "M. PERSETUJUAN HASIL UJI KONSISTENSI",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Grafik perbandingan hasil pengukuran berulang",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_CONSISTENCY_0022",
        "section": "M. PERSETUJUAN HASIL UJI KONSISTENSI",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi kegiatan uji konsistensi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-8-drainase-periodic14",
    "survey": "Drainase",
    "phase": "periodic14",
    "items": [
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0001",
        "section": "A. INFORMASI UMUM",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. INFORMASI UMUM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Detail"
          ],
          "row_labels": [
            "Nama Proyek",
            "Nomor Kontrak",
            "Periode Verifikasi & Validasi",
            "Lokasi",
            "Tanggal Pelaksanaan",
            "Penanggung Jawab",
            "Jabatan",
            "Instansi",
            "Tim Surveyor yang Dievaluasi"
          ],
          "source_rows": [
            [
              "Nama Proyek",
              ""
            ],
            [
              "Nomor Kontrak",
              ""
            ],
            [
              "Periode Verifikasi & Validasi",
              ""
            ],
            [
              "Lokasi",
              ""
            ],
            [
              "Tanggal Pelaksanaan",
              ""
            ],
            [
              "Penanggung Jawab",
              ""
            ],
            [
              "Jabatan",
              ""
            ],
            [
              "Instansi",
              ""
            ],
            [
              "Tim Surveyor yang Dievaluasi",
              ""
            ]
          ],
          "table_rows": 9,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0002",
        "section": "B. INFORMASI PROGRESS SURVEI",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. INFORMASI PROGRESS SURVEI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Detail"
          ],
          "row_labels": [
            "Total Target Survei (km)",
            "Progress 2 Minggu Sebelumnya (km)",
            "Progress 2 Minggu Terakhir (km)",
            "Progress Kumulatif (km)",
            "Persentase Progress (%)",
            "Jumlah Tim Lapangan Aktif",
            "Rata-rata Produktivitas per Tim (km/hari)",
            "Ruas-ruas yang Telah Disurvei"
          ],
          "source_rows": [
            [
              "Total Target Survei (km)",
              ""
            ],
            [
              "Progress 2 Minggu Sebelumnya (km)",
              ""
            ],
            [
              "Progress 2 Minggu Terakhir (km)",
              ""
            ],
            [
              "Progress Kumulatif (km)",
              ""
            ],
            [
              "Persentase Progress (%)",
              ""
            ],
            [
              "Jumlah Tim Lapangan Aktif",
              ""
            ],
            [
              "Rata-rata Produktivitas per Tim (km/hari)",
              ""
            ],
            [
              "Ruas-ruas yang Telah Disurvei",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0003",
        "section": "C. VERIFIKASI KELENGKAPAN DATA",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. VERIFIKASI KELENGKAPAN DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "C.1",
            "C.2",
            "C.3",
            "C.4",
            "C.5",
            "C.6",
            "C.7",
            "C.8",
            "C.9",
            "C.10",
            "C.11",
            "C.12"
          ],
          "source_rows": [
            [
              "C.1",
              "Data tersedia untuk semua ruas yang disurvei 2 minggu terakhir",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.2",
              "Data informasi umum ruas jalan 2 minggu terakhir lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.3",
              "Data saluran samping (kiri/kanan) 2 minggu terakhir lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.4",
              "Data gorong-gorong 2 minggu terakhir lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.5",
              "Data saluran terjunan lereng 2 minggu terakhir lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.6",
              "Data dimensi saluran 2 minggu terakhir lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.7",
              "Data koordinat GPS 2 minggu terakhir lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.8",
              "Metadata (tanggal, waktu, operator) 2 minggu terakhir lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.9",
              "Dokumentasi foto 2 minggu terakhir lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.10",
              "Log harian survei 2 minggu terakhir lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.11",
              "Laporan kendala dan solusi 2 minggu terakhir lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.12",
              "Data telah dibackup dan tersedia salinannya",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 12,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0004",
        "section": "D. VALIDASI KONSISTENSI PELAKSANAAN SURVEI",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: D. VALIDASI KONSISTENSI PELAKSANAAN SURVEI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "D.1",
            "D.2",
            "D.3",
            "D.4",
            "D.5",
            "D.6",
            "D.7",
            "D.8",
            "D.9",
            "D.10"
          ],
          "source_rows": [
            [
              "D.1",
              "Metode survei konsisten dengan verifikasi 2 minggu sebelumnya",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.2",
              "Pemilihan lokasi survei sesuai dengan rencana",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.3",
              "Pengukuran dimensi drainase konsisten antar tim",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.4",
              "Pengambilan titik koordinat konsisten dengan metode standar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.5",
              "SOP survei dijalankan dengan konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.6",
              "Personil surveyor konsisten (tidak ada pergantian tanpa pelatihan)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.7",
              "Penggunaan aplikasi InDrain konsisten dengan pedoman",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.8",
              "Klasifikasi kondisi drainase konsisten antar tim",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.9",
              "Dokumentasi foto konsisten dalam kualitas dan sudut pengambilan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.10",
              "Konsistensi penanganan kondisi khusus (hujan, macet, dll)",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0005",
        "section": "E. VALIDASI SAMPLING ULANG",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: E. VALIDASI SAMPLING ULANG",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "E.1",
            "E.2",
            "E.3",
            "E.4",
            "E.5",
            "E.6",
            "E.7",
            "E.8",
            "E.9",
            "E.10"
          ],
          "source_rows": [
            [
              "E.1",
              "Pemilihan lokasi sampling ≥ 5% dari total data 2 minggu terakhir",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.2",
              "Pemilihan lokasi sampling mencakup variasi jenis saluran",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.3",
              "Pemilihan lokasi sampling mencakup variasi kondisi saluran",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.4",
              "Pengukuran ulang lebar saluran sesuai dengan data awal (±10cm)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.5",
              "Pengukuran ulang kedalaman saluran sesuai dengan data awal (±10cm)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.6",
              "Pengukuran ulang tinggi sedimentasi sesuai dengan data awal (±10cm)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.7",
              "Identifikasi jenis saluran pada sampling ulang sesuai dengan data awal",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.8",
              "Penilaian kondisi saluran pada sampling ulang sesuai dengan data awal",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.9",
              "Koordinat GPS pada sampling ulang sesuai dengan data awal (±5m)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.10",
              "Dokumentasi foto pada sampling ulang sesuai dengan data awal",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0006",
        "section": "F. VALIDASI KUALITAS DATA",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: F. VALIDASI KUALITAS DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "F.1",
            "F.2",
            "F.3",
            "F.4",
            "F.5",
            "F.6",
            "F.7",
            "F.8",
            "F.9",
            "F.10"
          ],
          "source_rows": [
            [
              "F.1",
              "Format data sesuai dengan ketentuan InDrain",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.2",
              "Resolusi foto memenuhi standar minimum",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.3",
              "Ketelitian koordinat GPS memenuhi standar (±5m)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.4",
              "Ketelitian pengukuran dimensi saluran memenuhi standar (±10cm)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.5",
              "Penilaian kondisi saluran sesuai dengan indikator kerusakan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.6",
              "Distribusi kelas kondisi drainase masuk akal",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.7",
              "Tidak ada data yang hilang/kosong tanpa penjelasan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.8",
              "Metadata lengkap dan akurat",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.9",
              "Data telah diunggah ke sistem InDrain",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.10",
              "Tidak ada kesalahan format penulisan data",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0007",
        "section": "G. VERIFIKASI KONSISTENSI PERALATAN",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: G. VERIFIKASI KONSISTENSI PERALATAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "G.1",
            "G.2",
            "G.3",
            "G.4",
            "G.5",
            "G.6",
            "G.7",
            "G.8",
            "G.9",
            "G.10"
          ],
          "source_rows": [
            [
              "G.1",
              "Aplikasi InDrain masih versi terbaru dan berfungsi baik",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.2",
              "Gawai/smartphone berfungsi baik",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.3",
              "GPS gawai/smartphone berfungsi baik",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.4",
              "Alat pengukur jarak masih berfungsi baik",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.5",
              "Alat pengukur dimensi saluran masih berfungsi baik",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.6",
              "Kamera gawai/smartphone masih berfungsi baik",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.7",
              "Peralatan pendukung lainnya masih berfungsi baik",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.8",
              "Tidak ada penggantian peralatan tanpa kalibrasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.9",
              "Peralatan safety masih lengkap dan berfungsi baik",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.10",
              "Kapasitas penyimpanan gawai/smartphone masih mencukupi",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0008",
        "section": "H. VERIFIKASI PROSES UNGGAH DATA",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: H. VERIFIKASI PROSES UNGGAH DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "H.1",
            "H.2",
            "H.3",
            "H.4",
            "H.5",
            "H.6",
            "H.7",
            "H.8",
            "H.9",
            "H.10"
          ],
          "source_rows": [
            [
              "H.1",
              "Data 2 minggu terakhir telah diunggah ke sistem InDrain",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.2",
              "Tidak ada error pada saat proses unggah data",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.3",
              "Format data yang diunggah sesuai ketentuan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.4",
              "Semua foto berhasil diunggah dengan kualitas baik",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.5",
              "Metadata terunggah dengan lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.6",
              "Proses backup data dilakukan secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.7",
              "Kode ruas dan segmen di sistem sesuai dengan data lapangan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.8",
              "Proses perbaikan data (jika ada) dilakukan dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.9",
              "Versi data yang diunggah merupakan versi final/terbaru",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.10",
              "Data dapat diakses melalui sistem InDrain",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0009",
        "section": "I. HASIL SAMPLING ULANG",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: I. HASIL SAMPLING ULANG",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Lokasi (Ruas/STA)",
            "Parameter",
            "Data Awal",
            "Sampling Ulang",
            "Selisih",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "Lebar saluran",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "Kedalaman saluran",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "Tinggi sedimentasi",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "Kondisi saluran",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "Jenis saluran",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0010",
        "section": "I. HASIL SAMPLING ULANG",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Kriteria Status: Sesuai (selisih ≤10%), Perlu Perbaikan (selisih 10-20%), Tidak Sesuai (selisih >20%)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0011",
        "section": "J. DISTRIBUSI KONDISI DRAINASE (2 MINGGU TERAKHIR)",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: J. DISTRIBUSI KONDISI DRAINASE (2 MINGGU TERAKHIR)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Kondisi Drainase",
            "Jumlah Segmen",
            "Panjang Total (km)",
            "Persentase (%)",
            "Kewajaran"
          ],
          "row_labels": [
            "Sangat Baik",
            "Baik",
            "Sedang",
            "Rusak Ringan",
            "Rusak Berat",
            "Total"
          ],
          "source_rows": [
            [
              "Sangat Baik",
              "",
              "",
              "",
              ""
            ],
            [
              "Baik",
              "",
              "",
              "",
              ""
            ],
            [
              "Sedang",
              "",
              "",
              "",
              ""
            ],
            [
              "Rusak Ringan",
              "",
              "",
              "",
              ""
            ],
            [
              "Rusak Berat",
              "",
              "",
              "",
              ""
            ],
            [
              "Total",
              "",
              "",
              "100%",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0012",
        "section": "K. ANALISIS TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: K. ANALISIS TEMUAN DAN TINDAKAN PERBAIKAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Kategori Temuan",
            "Deskripsi Temuan",
            "Dampak",
            "Tindakan Perbaikan",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0013",
        "section": "L. ANALISIS KENDALA DAN SOLUSI",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: L. ANALISIS KENDALA DAN SOLUSI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Kendala yang Dihadapi",
            "Dampak",
            "Solusi yang Diterapkan",
            "Efektivitas Solusi",
            "Tindak Lanjut"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0014",
        "section": "M. KESIMPULAN VERIFIKASI DAN VALIDASI 2-MINGGUAN",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: M. KESIMPULAN VERIFIKASI DAN VALIDASI 2-MINGGUAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Aspek",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "Kelengkapan Data",
            "Konsistensi Pelaksanaan",
            "Hasil Sampling Ulang",
            "Kualitas Data",
            "Konsistensi Peralatan",
            "Proses Unggah Data",
            "Status Akhir"
          ],
          "source_rows": [
            [
              "Kelengkapan Data",
              "☐ Lengkap ☐ Cukup Lengkap ☐ Tidak Lengkap",
              ""
            ],
            [
              "Konsistensi Pelaksanaan",
              "☐ Konsisten ☐ Cukup Konsisten ☐ Tidak Konsisten",
              ""
            ],
            [
              "Hasil Sampling Ulang",
              "☐ Sesuai ☐ Cukup Sesuai ☐ Tidak Sesuai",
              ""
            ],
            [
              "Kualitas Data",
              "☐ Baik ☐ Cukup Baik ☐ Kurang Baik",
              ""
            ],
            [
              "Konsistensi Peralatan",
              "☐ Baik ☐ Cukup Baik ☐ Kurang Baik",
              ""
            ],
            [
              "Proses Unggah Data",
              "☐ Berhasil ☐ Berhasil Sebagian ☐ Gagal",
              ""
            ],
            [
              "Status Akhir",
              "☐ DITERIMA ☐ DITERIMA DENGAN CATATAN ☐ PERLU PERBAIKAN",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0015",
        "section": "O. PERSETUJUAN HASIL VERIFIKASI DAN VALIDASI 2-MINGGUAN",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: O. PERSETUJUAN HASIL VERIFIKASI DAN VALIDASI 2-MINGGUAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Peran",
            "Nama",
            "Instansi",
            "Tanda Tangan",
            "Tanggal"
          ],
          "row_labels": [
            "Penanggung Jawab Verifikasi & Validasi",
            "Ketua Tim Survei",
            "Perwakilan Penyedia Jasa",
            "Perwakilan Pengguna Jasa"
          ],
          "source_rows": [
            [
              "Penanggung Jawab Verifikasi & Validasi",
              "",
              "",
              "",
              ""
            ],
            [
              "Ketua Tim Survei",
              "",
              "",
              "",
              ""
            ],
            [
              "Perwakilan Penyedia Jasa",
              "",
              "",
              "",
              ""
            ],
            [
              "Perwakilan Pengguna Jasa",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0016",
        "section": "O. PERSETUJUAN HASIL VERIFIKASI DAN VALIDASI 2-MINGGUAN",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "LAMPIRAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0017",
        "section": "O. PERSETUJUAN HASIL VERIFIKASI DAN VALIDASI 2-MINGGUAN",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "Peta sebaran lokasi survei 2 minggu terakhir",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0018",
        "section": "O. PERSETUJUAN HASIL VERIFIKASI DAN VALIDASI 2-MINGGUAN",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Peta lokasi sampling ulang",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0019",
        "section": "O. PERSETUJUAN HASIL VERIFIKASI DAN VALIDASI 2-MINGGUAN",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi foto kegiatan verifikasi dan validasi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0020",
        "section": "O. PERSETUJUAN HASIL VERIFIKASI DAN VALIDASI 2-MINGGUAN",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "Grafik progress kumulatif survei",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_PERIODIC14_0021",
        "section": "O. PERSETUJUAN HASIL VERIFIKASI DAN VALIDASI 2-MINGGUAN",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi kendala yang dihadapi dan solusinya",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-9-drainase-internal",
    "survey": "Drainase",
    "phase": "internal",
    "items": [
      {
        "code": "DOCX_DRAINASE_INTERNAL_0001",
        "section": "A. INFORMASI UMUM",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. INFORMASI UMUM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Detail"
          ],
          "row_labels": [
            "Nama Proyek",
            "Nomor Kontrak",
            "Periode Verifikasi & Validasi Internal",
            "Lokasi",
            "Tanggal Pelaksanaan",
            "Penanggung Jawab",
            "Jabatan",
            "Tim Surveyor yang Dievaluasi",
            "Ruas Jalan yang Dievaluasi"
          ],
          "source_rows": [
            [
              "Nama Proyek",
              ""
            ],
            [
              "Nomor Kontrak",
              ""
            ],
            [
              "Periode Verifikasi & Validasi Internal",
              ""
            ],
            [
              "Lokasi",
              ""
            ],
            [
              "Tanggal Pelaksanaan",
              ""
            ],
            [
              "Penanggung Jawab",
              ""
            ],
            [
              "Jabatan",
              ""
            ],
            [
              "Tim Surveyor yang Dievaluasi",
              ""
            ],
            [
              "Ruas Jalan yang Dievaluasi",
              ""
            ]
          ],
          "table_rows": 9,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0002",
        "section": "B. INFORMASI PROGRESS SURVEI",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. INFORMASI PROGRESS SURVEI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Detail"
          ],
          "row_labels": [
            "Total Target Survei (km)",
            "Volume Survei yang Dievaluasi (km)",
            "Persentase dari Total Target (%)",
            "Tanggal Pengambilan Data",
            "Jumlah Tim Lapangan Terlibat",
            "Kondisi Cuaca saat Survei",
            "Ruas-ruas yang Dievaluasi"
          ],
          "source_rows": [
            [
              "Total Target Survei (km)",
              ""
            ],
            [
              "Volume Survei yang Dievaluasi (km)",
              ""
            ],
            [
              "Persentase dari Total Target (%)",
              ""
            ],
            [
              "Tanggal Pengambilan Data",
              ""
            ],
            [
              "Jumlah Tim Lapangan Terlibat",
              ""
            ],
            [
              "Kondisi Cuaca saat Survei",
              ""
            ],
            [
              "Ruas-ruas yang Dievaluasi",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0003",
        "section": "C. VERIFIKASI PERSIAPAN SURVEI",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. VERIFIKASI PERSIAPAN SURVEI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "C.1",
            "C.2",
            "C.3",
            "C.4",
            "C.5",
            "C.6",
            "C.7",
            "C.8",
            "C.9",
            "C.10",
            "C.11",
            "C.12"
          ],
          "source_rows": [
            [
              "C.1",
              "Personil survei telah mendapatkan pelatihan yang memadai",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.2",
              "Peralatan survei telah dikalibrasi sesuai prosedur",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.3",
              "Aplikasi InDrain versi terbaru terpasang di semua gawai",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.4",
              "Semua gawai telah diuji berfungsi dengan baik",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.5",
              "GPS dalam gawai telah diuji akurasinya",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.6",
              "Alat pengukur dimensi drainase dalam kondisi baik",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.7",
              "Kamera gawai menghasilkan foto berkualitas baik",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.8",
              "Kapasitas penyimpanan gawai mencukupi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.9",
              "Daya baterai gawai dan cadangannya tersedia",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.10",
              "Briefing SOP dan prosedur keselamatan telah dilakukan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.11",
              "Perlengkapan keselamatan tersedia dan dalam kondisi baik",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.12",
              "Rencana rute survei telah dipersiapkan dengan baik",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 12,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0004",
        "section": "D. VERIFIKASI PELAKSANAAN SURVEI",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: D. VERIFIKASI PELAKSANAAN SURVEI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "D.1",
            "D.2",
            "D.3",
            "D.4",
            "D.5",
            "D.6",
            "D.7",
            "D.8",
            "D.9",
            "D.10",
            "D.11",
            "D.12"
          ],
          "source_rows": [
            [
              "D.1",
              "Survei dilaksanakan sesuai dengan SOP yang ditetapkan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.2",
              "Waktu mulai dan selesai survei dicatat dengan baik",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.3",
              "Titik awal dan akhir segmen drainase dicatat dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.4",
              "Pengukuran dimensi saluran dilakukan dengan teknik yang benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.5",
              "Pengambilan koordinat GPS dilakukan dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.6",
              "Pengambilan foto saluran dari sudut yang tepat",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.7",
              "Penilaian kondisi saluran mengikuti standar penilaian",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.8",
              "Identifikasi jenis saluran dilakukan dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.9",
              "Pengisian formulir digital dilakukan dengan teliti",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.10",
              "Prosedur keselamatan kerja dipatuhi selama survei",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.11",
              "Kendala lapangan dicatat dan dilaporkan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.12",
              "Personil survei menunjukkan pemahaman yang baik",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 12,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0005",
        "section": "E. VALIDASI KELENGKAPAN DATA",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: E. VALIDASI KELENGKAPAN DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "E.1",
            "E.2",
            "E.3",
            "E.4",
            "E.5",
            "E.6",
            "E.7",
            "E.8",
            "E.9",
            "E.10",
            "E.11",
            "E.12"
          ],
          "source_rows": [
            [
              "E.1",
              "Data administrasi ruas jalan lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.2",
              "Data dimensi saluran samping kiri lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.3",
              "Data dimensi saluran samping kanan lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.4",
              "Data gorong-gorong lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.5",
              "Data saluran terjunan lereng lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.6",
              "Data kondisi saluran lengkap untuk semua segmen",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.7",
              "Data tinggi sedimentasi saluran lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.8",
              "Data koordinat GPS lengkap untuk semua segmen",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.9",
              "Dokumentasi foto saluran lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.10",
              "Metadata (tanggal, waktu, surveyor) lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.11",
              "Data rekomendasi penanganan saluran lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.12",
              "Tidak ada data yang hilang tanpa penjelasan",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 12,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0006",
        "section": "F. VALIDASI KUALITAS DATA",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: F. VALIDASI KUALITAS DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "F.1",
            "F.2",
            "F.3",
            "F.4",
            "F.5",
            "F.6",
            "F.7",
            "F.8",
            "F.9",
            "F.10",
            "F.11",
            "F.12"
          ],
          "source_rows": [
            [
              "F.1",
              "Format data sesuai dengan ketentuan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.2",
              "Ketelitian koordinat GPS memenuhi standar (±5m)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.3",
              "Ketelitian pengukuran lebar saluran memenuhi standar (±10cm)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.4",
              "Ketelitian pengukuran kedalaman saluran memenuhi standar (±10cm)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.5",
              "Ketelitian pengukuran tinggi sedimentasi memenuhi standar (±10cm)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.6",
              "Foto saluran memiliki resolusi dan pencahayaan yang baik",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.7",
              "Penilaian kondisi saluran sesuai dengan indikator kerusakan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.8",
              "Rekomendasi penanganan sesuai dengan kondisi saluran",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.9",
              "Tidak ada kesalahan pengkodean segmen saluran",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.10",
              "Tidak ada duplikasi data",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.11",
              "Tidak ada kesalahan entri data yang signifikan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.12",
              "Data dapat dibaca dengan jelas oleh aplikasi InDrain",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 12,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0007",
        "section": "G. VALIDASI KONSISTENSI DATA",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: G. VALIDASI KONSISTENSI DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "G.1",
            "G.2",
            "G.3",
            "G.4",
            "G.5",
            "G.6",
            "G.7",
            "G.8",
            "G.9",
            "G.10",
            "G.11",
            "G.12"
          ],
          "source_rows": [
            [
              "G.1",
              "Konsistensi pengukuran antar surveyor pada segmen yang sama",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.2",
              "Konsistensi identifikasi jenis saluran antar surveyor",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.3",
              "Konsistensi penilaian kondisi saluran antar surveyor",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.4",
              "Konsistensi pengambilan foto antar surveyor",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.5",
              "Konsistensi rekomendasi penanganan antar surveyor",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.6",
              "Konsistensi data antar segmen yang berdekatan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.7",
              "Konsistensi pengukuran pada titik overlap segmen",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.8",
              "Konsistensi penggunaan skala penilaian",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.9",
              "Konsistensi penamaan file foto",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.10",
              "Konsistensi pengisian metadata",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.11",
              "Konsistensi pengukuran dengan hasil survei sebelumnya (jika ada)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.12",
              "Konsistensi interpretasi indikator kerusakan",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 12,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0008",
        "section": "H. VALIDASI KEWAJARAN DATA",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: H. VALIDASI KEWAJARAN DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "H.1",
            "H.2",
            "H.3",
            "H.4",
            "H.5",
            "H.6",
            "H.7",
            "H.8",
            "H.9",
            "H.10",
            "H.11",
            "H.12"
          ],
          "source_rows": [
            [
              "H.1",
              "Jenis saluran sesuai dengan kondisi lapangan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.2",
              "Dimensi saluran masuk akal sesuai standar tipikal",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.3",
              "Tingkat sedimentasi masuk akal berdasarkan foto",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.4",
              "Penilaian kondisi saluran sesuai dengan foto",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.5",
              "Distribusi kelas kondisi saluran secara keseluruhan masuk akal",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.6",
              "Perubahan kondisi saluran antar segmen masuk akal",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.7",
              "Rekomendasi penanganan sesuai dengan kondisi saluran",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.8",
              "Koordinat GPS masuk akal sesuai dengan rute ruas jalan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.9",
              "Keberadaan dan ukuran gorong-gorong masuk akal",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.10",
              "Lokasi saluran terjunan lereng masuk akal",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.11",
              "Tidak ada anomali data yang tidak dijelaskan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.12",
              "Kondisi drainase sesuai dengan karakteristik wilayah",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 12,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0009",
        "section": "I. VALIDASI PENGELOLAAN DATA",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: I. VALIDASI PENGELOLAAN DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "I.1",
            "I.2",
            "I.3",
            "I.4",
            "I.5",
            "I.6",
            "I.7",
            "I.8",
            "I.9",
            "I.10",
            "I.11",
            "I.12"
          ],
          "source_rows": [
            [
              "I.1",
              "Data diunduh dari gawai segera setelah survei",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.2",
              "Data dibackup pada media penyimpanan terpisah",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.3",
              "Data diperiksa kelengkapannya sebelum diunggah",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.4",
              "Format data disesuaikan dengan kebutuhan InDrain",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.5",
              "Foto dikelola dan dinamai sesuai standar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.6",
              "Data terorganisir dengan baik berdasarkan ruas dan tanggal",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.7",
              "Data koreksi dan perbaikan didokumentasikan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.8",
              "Versi data dapat diidentifikasi dengan jelas",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.9",
              "Akses data terbatas hanya untuk tim yang berwenang",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.10",
              "Proses perbaikan data (jika ada) dilakukan dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.11",
              "Data siap diunggah ke sistem InDrain",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.12",
              "Log perubahan data (jika ada) tersedia",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 12,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0010",
        "section": "J. UJI SAMPLING INTERNAL",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: J. UJI SAMPLING INTERNAL",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Lokasi (Ruas/STA)",
            "Parameter",
            "Data Tim Lapangan",
            "Data Tim QA/QC",
            "Selisih",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "Lebar saluran",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "Kedalaman saluran",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "Tinggi sedimentasi",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "Kondisi saluran",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "Jenis saluran",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0011",
        "section": "J. UJI SAMPLING INTERNAL",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Kriteria Status: Sesuai (selisih ≤10%), Perlu Perbaikan (selisih 10-20%), Tidak Sesuai (selisih >20%)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0012",
        "section": "K. DISTRIBUSI KONDISI DRAINASE",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: K. DISTRIBUSI KONDISI DRAINASE",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Kondisi Drainase",
            "Jumlah Segmen",
            "Panjang Total (km)",
            "Persentase (%)",
            "Kewajaran"
          ],
          "row_labels": [
            "Sangat Baik",
            "Baik",
            "Sedang",
            "Rusak Ringan",
            "Rusak Berat",
            "Total"
          ],
          "source_rows": [
            [
              "Sangat Baik",
              "",
              "",
              "",
              ""
            ],
            [
              "Baik",
              "",
              "",
              "",
              ""
            ],
            [
              "Sedang",
              "",
              "",
              "",
              ""
            ],
            [
              "Rusak Ringan",
              "",
              "",
              "",
              ""
            ],
            [
              "Rusak Berat",
              "",
              "",
              "",
              ""
            ],
            [
              "Total",
              "",
              "",
              "100%",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0013",
        "section": "L. TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: L. TEMUAN DAN TINDAKAN PERBAIKAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Kategori Temuan",
            "Deskripsi Temuan",
            "Dampak",
            "Tindakan Perbaikan",
            "PIC",
            "Tenggat Waktu"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0014",
        "section": "M. KESIMPULAN VERIFIKASI DAN VALIDASI INTERNAL",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: M. KESIMPULAN VERIFIKASI DAN VALIDASI INTERNAL",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Aspek",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "Persiapan Survei",
            "Pelaksanaan Survei",
            "Kelengkapan Data",
            "Kualitas Data",
            "Konsistensi Data",
            "Kewajaran Data",
            "Pengelolaan Data",
            "Hasil Uji Sampling",
            "Status Final Data"
          ],
          "source_rows": [
            [
              "Persiapan Survei",
              "☐ Baik☐ Cukup Baik☐ Kurang Baik",
              ""
            ],
            [
              "Pelaksanaan Survei",
              "☐ Baik☐ Cukup Baik☐ Kurang Baik",
              ""
            ],
            [
              "Kelengkapan Data",
              "☐ Lengkap☐ Cukup Lengkap☐ Tidak Lengkap",
              ""
            ],
            [
              "Kualitas Data",
              "☐ Baik☐ Cukup Baik☐ Kurang Baik",
              ""
            ],
            [
              "Konsistensi Data",
              "☐ Konsisten☐ Cukup Konsisten☐ Tidak Konsisten",
              ""
            ],
            [
              "Kewajaran Data",
              "☐ Wajar☐ Cukup Wajar☐ Tidak Wajar",
              ""
            ],
            [
              "Pengelolaan Data",
              "☐ Baik☐ Cukup Baik☐ Kurang Baik",
              ""
            ],
            [
              "Hasil Uji Sampling",
              "☐ Sesuai☐ Cukup Sesuai☐ Tidak Sesuai",
              ""
            ],
            [
              "Status Final Data",
              "☐ SIAP DIUNGGAH☐ PERLU PERBAIKAN MINOR☐ PERLU SURVEI ULANG",
              ""
            ]
          ],
          "table_rows": 9,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0015",
        "section": "O. PERSETUJUAN HASIL VERIFIKASI DAN VALIDASI INTERNAL",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: O. PERSETUJUAN HASIL VERIFIKASI DAN VALIDASI INTERNAL",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Peran",
            "Nama",
            "Tanda Tangan",
            "Tanggal"
          ],
          "row_labels": [
            "Penanggung Jawab QA/QC Internal",
            "Manajer Proyek",
            "Ketua Tim Survei",
            "Tim QA/QC Internal",
            "Perwakilan Tim Lapangan"
          ],
          "source_rows": [
            [
              "Penanggung Jawab QA/QC Internal",
              "",
              "",
              ""
            ],
            [
              "Manajer Proyek",
              "",
              "",
              ""
            ],
            [
              "Ketua Tim Survei",
              "",
              "",
              ""
            ],
            [
              "Tim QA/QC Internal",
              "",
              "",
              ""
            ],
            [
              "Perwakilan Tim Lapangan",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0016",
        "section": "O. PERSETUJUAN HASIL VERIFIKASI DAN VALIDASI INTERNAL",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "LAMPIRAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0017",
        "section": "O. PERSETUJUAN HASIL VERIFIKASI DAN VALIDASI INTERNAL",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi foto kegiatan verifikasi dan validasi internal",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0018",
        "section": "O. PERSETUJUAN HASIL VERIFIKASI DAN VALIDASI INTERNAL",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Contoh data hasil survei yang baik",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0019",
        "section": "O. PERSETUJUAN HASIL VERIFIKASI DAN VALIDASI INTERNAL",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Contoh data yang memerlukan perbaikan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0020",
        "section": "O. PERSETUJUAN HASIL VERIFIKASI DAN VALIDASI INTERNAL",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "Hasil uji sampling detail",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_DRAINASE_INTERNAL_0021",
        "section": "O. PERSETUJUAN HASIL VERIFIKASI DAN VALIDASI INTERNAL",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi briefing dan tindakan perbaikan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-10-iri-periodic14",
    "survey": "IRI",
    "phase": "periodic14",
    "items": [
      {
        "code": "DOCX_IRI_PERIODIC14_0001",
        "section": "A. INFORMASI UMUM",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. INFORMASI UMUM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Detail"
          ],
          "row_labels": [
            "Nama Proyek",
            "Nomor Kontrak",
            "Periode Verifikasi",
            "Tahap Survei",
            "Lokasi",
            "Ruas Jalan yang Disurvei",
            "Panjang Total yang Disurvei (km)",
            "Tanggal Verifikasi",
            "Penyedia Jasa",
            "Pengguna Jasa"
          ],
          "source_rows": [
            [
              "Nama Proyek",
              ""
            ],
            [
              "Nomor Kontrak",
              ""
            ],
            [
              "Periode Verifikasi",
              "Tanggal: ___ s/d ___"
            ],
            [
              "Tahap Survei",
              "Minggu ke: ___ s/d ___"
            ],
            [
              "Lokasi",
              ""
            ],
            [
              "Ruas Jalan yang Disurvei",
              ""
            ],
            [
              "Panjang Total yang Disurvei (km)",
              ""
            ],
            [
              "Tanggal Verifikasi",
              ""
            ],
            [
              "Penyedia Jasa",
              ""
            ],
            [
              "Pengguna Jasa",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0002",
        "section": "B. TIM PELAKSANA VERIFIKASI DAN VALIDASI",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. TIM PELAKSANA VERIFIKASI DAN VALIDASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Peran",
            "Nama",
            "Instansi",
            "Tanda Tangan"
          ],
          "row_labels": [
            "Koordinator Verifikasi",
            "Perwakilan Penyedia Jasa",
            "Perwakilan Pengguna Jasa",
            "Quality Control",
            "Technical Support"
          ],
          "source_rows": [
            [
              "Koordinator Verifikasi",
              "",
              "",
              ""
            ],
            [
              "Perwakilan Penyedia Jasa",
              "",
              "",
              ""
            ],
            [
              "Perwakilan Pengguna Jasa",
              "",
              "",
              ""
            ],
            [
              "Quality Control",
              "",
              "",
              ""
            ],
            [
              "Technical Support",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0003",
        "section": "C. RUAS JALAN YANG DIEVALUASI (PERIODE 2 MINGGUAN)",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. RUAS JALAN YANG DIEVALUASI (PERIODE 2 MINGGUAN)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Nomor Ruas",
            "Nama Ruas",
            "Panjang (km)",
            "Tanggal Survei",
            "Status Verifikasi"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0004",
        "section": "D. VERIFIKASI DAN VALIDASI ALAT",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: D. VERIFIKASI DAN VALIDASI ALAT",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "D.1",
            "D.2",
            "D.3",
            "D.4",
            "D.5",
            "D.6",
            "D.7",
            "D.8",
            "D.9",
            "D.10"
          ],
          "source_rows": [
            [
              "D.1",
              "Bounce test telah dilakukan setiap hari",
              "☐",
              "☐",
              ""
            ],
            [
              "D.2",
              "Odometer dikalibrasi sesuai jadwal yang ditentukan",
              "☐",
              "☐",
              ""
            ],
            [
              "D.3",
              "Pengujian konsistensi (repeatability) periode 2 minggu telah dilakukan",
              "☐",
              "☐",
              ""
            ],
            [
              "D.4",
              "Pengujian konsistensi dilakukan pada minimal 5 km ruas jalan",
              "☐",
              "☐",
              ""
            ],
            [
              "D.5",
              "Pengujian konsistensi dilakukan minimum 3 kali lintasan",
              "☐",
              "☐",
              ""
            ],
            [
              "D.6",
              "Hasil koefisien variasi (CV) pengujian konsistensi ≤ 5%",
              "☐",
              "☐",
              ""
            ],
            [
              "D.7",
              "Alat GPS berfungsi dengan baik selama periode survei",
              "☐",
              "☐",
              ""
            ],
            [
              "D.8",
              "Sensor laser tetap terkalibrasi (tidak ada tanda-tanda penyimpangan)",
              "☐",
              "☐",
              ""
            ],
            [
              "D.9",
              "Sensor accelerometer tetap terkalibrasi dan berfungsi normal",
              "☐",
              "☐",
              ""
            ],
            [
              "D.10",
              "Log pemeliharaan dan kalibrasi alat selama 2 minggu tersedia",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0005",
        "section": "E. VERIFIKASI PROSEDUR SURVEI",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: E. VERIFIKASI PROSEDUR SURVEI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "E.1",
            "E.2",
            "E.3",
            "E.4",
            "E.5",
            "E.6",
            "E.7",
            "E.8",
            "E.9",
            "E.10"
          ],
          "source_rows": [
            [
              "E.1",
              "Survei dilakukan sesuai dengan metode standar (SNI 3426:2022)",
              "☐",
              "☐",
              ""
            ],
            [
              "E.2",
              "Kecepatan kendaraan selama survei berada pada rentang yang ditetapkan",
              "☐",
              "☐",
              ""
            ],
            [
              "E.3",
              "Survei dilakukan pada cuaca yang sesuai (tidak hujan)",
              "☐",
              "☐",
              ""
            ],
            [
              "E.4",
              "Permukaan jalan dalam kondisi kering saat survei",
              "☐",
              "☐",
              ""
            ],
            [
              "E.5",
              "Operator dan pengemudi melaksanakan SOP yang ditentukan",
              "☐",
              "☐",
              ""
            ],
            [
              "E.6",
              "Pengukuran dilakukan pada lajur yang ditentukan",
              "☐",
              "☐",
              ""
            ],
            [
              "E.7",
              "Arah pengukuran sesuai dengan yang ditentukan",
              "☐",
              "☐",
              ""
            ],
            [
              "E.8",
              "Faktor-faktor pengganggu pengukuran dicatat dengan baik",
              "☐",
              "☐",
              ""
            ],
            [
              "E.9",
              "Penandaan referensi lokasi (LRP) yang benar",
              "☐",
              "☐",
              ""
            ],
            [
              "E.10",
              "Catatan perubahan prosedur (jika ada) tersedia dan terdokumentasi",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0006",
        "section": "F. VERIFIKASI KELENGKAPAN DAN KUALITAS DATA",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: F. VERIFIKASI KELENGKAPAN DAN KUALITAS DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "F.1",
            "F.2",
            "F.3",
            "F.4",
            "F.5",
            "F.6",
            "F.7",
            "F.8",
            "F.9",
            "F.10",
            "F.11",
            "F.12"
          ],
          "source_rows": [
            [
              "F.1",
              "Data untuk seluruh ruas jalan target periode 2 mingguan tersedia",
              "☐",
              "☐",
              ""
            ],
            [
              "F.2",
              "Interval pelaporan data 100 m konsisten",
              "☐",
              "☐",
              ""
            ],
            [
              "F.3",
              "Interval sampling data memanjang tidak lebih dari 50 mm",
              "☐",
              "☐",
              ""
            ],
            [
              "F.4",
              "Data GPS tersedia untuk setiap segmen pengukuran",
              "☐",
              "☐",
              ""
            ],
            [
              "F.5",
              "Nilai IRI roda kanan dan kiri tercatat",
              "☐",
              "☐",
              ""
            ],
            [
              "F.6",
              "Nilai IRI lajur (rata-rata roda kanan dan kiri) tercatat",
              "☐",
              "☐",
              ""
            ],
            [
              "F.7",
              "Data kecepatan kendaraan saat pengukuran tercatat",
              "☐",
              "☐",
              ""
            ],
            [
              "F.8",
              "Data faktor pengganggu pengukuran tercatat",
              "☐",
              "☐",
              ""
            ],
            [
              "F.9",
              "Catatan operator selama survei tersedia",
              "☐",
              "☐",
              ""
            ],
            [
              "F.10",
              "Metadata survei lengkap (tanggal, waktu, operator, alat, dll.)",
              "☐",
              "☐",
              ""
            ],
            [
              "F.11",
              "Format data sesuai dengan standar SMD Jalan",
              "☐",
              "☐",
              ""
            ],
            [
              "F.12",
              "Backup data mentah tersedia dan aman",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 12,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0007",
        "section": "G. VALIDASI KEWAJARAN DATA",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: G. VALIDASI KEWAJARAN DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "G.1",
            "G.2",
            "G.3",
            "G.4",
            "G.5",
            "G.6",
            "G.7",
            "G.8",
            "G.9",
            "G.10"
          ],
          "source_rows": [
            [
              "G.1",
              "Nilai IRI berada dalam rentang yang wajar (sebanding dengan kondisi jalan)",
              "☐",
              "☐",
              ""
            ],
            [
              "G.2",
              "Tidak ada lonjakan nilai IRI yang tidak dapat dijelaskan",
              "☐",
              "☐",
              ""
            ],
            [
              "G.3",
              "Segmen yang bernilai 0 atau NULL telah diidentifikasi dan dijelaskan",
              "☐",
              "☐",
              ""
            ],
            [
              "G.4",
              "Segmen dengan nilai ekstrem telah diidentifikasi dan diverifikasi",
              "☐",
              "☐",
              ""
            ],
            [
              "G.5",
              "Nilai IRI konsisten dengan data historis (jika tersedia)",
              "☐",
              "☐",
              ""
            ],
            [
              "G.6",
              "Nilai IRI konsisten dengan hasil survei parameter lain (misal: PCI)",
              "☐",
              "☐",
              ""
            ],
            [
              "G.7",
              "Perbedaan nilai IRI antara roda kanan dan kiri dapat dijelaskan",
              "☐",
              "☐",
              ""
            ],
            [
              "G.8",
              "Nilai IRI pada area konstruksi/maintenance dijelaskan",
              "☐",
              "☐",
              ""
            ],
            [
              "G.9",
              "Perubahan nilai IRI pada titik referensi overlap konsisten",
              "☐",
              "☐",
              ""
            ],
            [
              "G.10",
              "Pola distribusi nilai IRI sesuai dengan karakteristik geografis ruas",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0008",
        "section": "H. HASIL SAMPLING VERIFIKASI (MIN 5% DARI TOTAL PANJANG)",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: H. HASIL SAMPLING VERIFIKASI (MIN 5% DARI TOTAL PANJANG)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Lokasi (Ruas/STA)",
            "Nilai IRI Data Asli",
            "Nilai IRI Verifikasi",
            "Selisih (%)",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0009",
        "section": "H. HASIL SAMPLING VERIFIKASI (MIN 5% DARI TOTAL PANJANG)",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Kriteria Status: Diterima (selisih ≤5%), Revisi Minor (selisih 5-10%), Revisi Major (selisih >10%)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0010",
        "section": "I. ANALISIS STATISTIK HASIL SAMPLING",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: I. ANALISIS STATISTIK HASIL SAMPLING",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Parameter",
            "Nilai",
            "Keterangan"
          ],
          "row_labels": [
            "Jumlah segmen sampling",
            "Persentase sampling dari total data (%)",
            "Rata-rata selisih (%)",
            "Standar deviasi selisih (%)",
            "Selisih maksimum (%)",
            "Selisih minimum (%)",
            "Persentase data yang diterima (%)",
            "Persentase data yang perlu revisi minor (%)",
            "Persentase data yang perlu revisi major (%)"
          ],
          "source_rows": [
            [
              "Jumlah segmen sampling",
              "",
              ""
            ],
            [
              "Persentase sampling dari total data (%)",
              "",
              ""
            ],
            [
              "Rata-rata selisih (%)",
              "",
              ""
            ],
            [
              "Standar deviasi selisih (%)",
              "",
              ""
            ],
            [
              "Selisih maksimum (%)",
              "",
              ""
            ],
            [
              "Selisih minimum (%)",
              "",
              ""
            ],
            [
              "Persentase data yang diterima (%)",
              "",
              ""
            ],
            [
              "Persentase data yang perlu revisi minor (%)",
              "",
              ""
            ],
            [
              "Persentase data yang perlu revisi major (%)",
              "",
              ""
            ]
          ],
          "table_rows": 9,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0011",
        "section": "J. DOKUMENTASI MASALAH DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: J. DOKUMENTASI MASALAH DAN TINDAKAN PERBAIKAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Masalah/Temuan",
            "Lokasi (Ruas/STA)",
            "Tindakan Perbaikan",
            "Penanggung Jawab",
            "Target Penyelesaian",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0012",
        "section": "K. FAKTOR-FAKTOR YANG MEMPENGARUHI KUALITAS PENGUKURAN",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: K. FAKTOR-FAKTOR YANG MEMPENGARUHI KUALITAS PENGUKURAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Faktor",
            "Frekuensi Kejadian",
            "Lokasi",
            "Dampak pada Data",
            "Tindakan Mitigasi"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6"
          ],
          "source_rows": [
            [
              "1",
              "Kemacetan lalu lintas",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "Kegiatan konstruksi",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "Hujan/Permukaan basah",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "Gangguan alat",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "Kendala akses",
              "",
              "",
              "",
              ""
            ],
            [
              "6",
              "Lainnya (sebutkan)",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0013",
        "section": "L. EVALUASI PROGRESS SURVEI",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: L. EVALUASI PROGRESS SURVEI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Parameter",
            "Target",
            "Realisasi",
            "Persentase (%)",
            "Keterangan"
          ],
          "row_labels": [
            "Panjang total ruas (km)",
            "Panjang survei selesai s.d periode sebelumnya (km)",
            "Panjang survei periode 2 mingguan ini (km)",
            "Total panjang survei s.d saat ini (km)",
            "Panjang yang memerlukan survei ulang (km)",
            "Sisa panjang yang belum disurvei (km)"
          ],
          "source_rows": [
            [
              "Panjang total ruas (km)",
              "",
              "",
              "",
              ""
            ],
            [
              "Panjang survei selesai s.d periode sebelumnya (km)",
              "",
              "",
              "",
              ""
            ],
            [
              "Panjang survei periode 2 mingguan ini (km)",
              "",
              "",
              "",
              ""
            ],
            [
              "Total panjang survei s.d saat ini (km)",
              "",
              "",
              "",
              ""
            ],
            [
              "Panjang yang memerlukan survei ulang (km)",
              "",
              "",
              "",
              ""
            ],
            [
              "Sisa panjang yang belum disurvei (km)",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0014",
        "section": "M. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Kesimpulan Verifikasi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0015",
        "section": "M. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: M. KESIMPULAN DAN REKOMENDASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Aspek",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "Alat & Kalibrasi",
            "Prosedur Survei",
            "Kelengkapan Data",
            "Kualitas Data",
            "Kewajaran Data",
            "Progress Survei"
          ],
          "source_rows": [
            [
              "Alat & Kalibrasi",
              "☐ Sesuai ☐ Perlu Perbaikan ☐ Tidak Sesuai",
              ""
            ],
            [
              "Prosedur Survei",
              "☐ Sesuai ☐ Perlu Perbaikan ☐ Tidak Sesuai",
              ""
            ],
            [
              "Kelengkapan Data",
              "☐ Lengkap ☐ Perlu Perbaikan ☐ Tidak Lengkap",
              ""
            ],
            [
              "Kualitas Data",
              "☐ Baik ☐ Perlu Perbaikan ☐ Tidak Baik",
              ""
            ],
            [
              "Kewajaran Data",
              "☐ Wajar ☐ Perlu Perbaikan ☐ Tidak Wajar",
              ""
            ],
            [
              "Progress Survei",
              "☐ Sesuai Target ☐ Perlu Percepatan ☐ Tertinggal",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0016",
        "section": "M. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Status Akhir Data Periode 2-Mingguan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0017",
        "section": "M. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: M. KESIMPULAN DAN REKOMENDASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Status",
            "Persentase",
            "Keterangan"
          ],
          "row_labels": [
            "☐ Diterima",
            "☐ Diterima dengan catatan",
            "☐ Perlu perbaikan sebelum diterima",
            "☐ Ditolak"
          ],
          "source_rows": [
            [
              "☐ Diterima",
              "",
              ""
            ],
            [
              "☐ Diterima dengan catatan",
              "",
              ""
            ],
            [
              "☐ Perlu perbaikan sebelum diterima",
              "",
              ""
            ],
            [
              "☐ Ditolak",
              "",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0018",
        "section": "M. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Rekomendasi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0019",
        "section": "M. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Copy",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0020",
        "section": "M. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "[Cantumkan rekomendasi untuk perbaikan proses survei, tindak lanjut atas temuan, atau hal lain yang perlu diperhatikan untuk periode survei berikutnya]",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0021",
        "section": "N. RENCANA TINDAK LANJUT",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: N. RENCANA TINDAK LANJUT",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Kegiatan",
            "Penanggung Jawab",
            "Target Waktu",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0022",
        "section": "O. PERSETUJUAN",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "Dengan ini menyatakan bahwa proses verifikasi dan validasi 2-mingguan telah dilakukan sesuai dengan ketentuan dan prosedur yang berlaku.",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0023",
        "section": "O. PERSETUJUAN",
        "options": [],
        "required": false,
        "order": 23,
        "sourceOrder": 23,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: O. PERSETUJUAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Jabatan",
            "Nama",
            "Tanda Tangan",
            "Tanggal"
          ],
          "row_labels": [
            "Koordinator Verifikasi",
            "Quality Control Penyedia Jasa",
            "Perwakilan Pengguna Jasa",
            "Pejabat Pembuat Komitmen"
          ],
          "source_rows": [
            [
              "Koordinator Verifikasi",
              "",
              "",
              ""
            ],
            [
              "Quality Control Penyedia Jasa",
              "",
              "",
              ""
            ],
            [
              "Perwakilan Pengguna Jasa",
              "",
              "",
              ""
            ],
            [
              "Pejabat Pembuat Komitmen",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0024",
        "section": "O. PERSETUJUAN",
        "options": [],
        "required": false,
        "order": 24,
        "sourceOrder": 24,
        "unit": "",
        "rule": {},
        "label": "LAMPIRAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0025",
        "section": "O. PERSETUJUAN",
        "options": [],
        "required": false,
        "order": 25,
        "sourceOrder": 25,
        "unit": "",
        "rule": {},
        "label": "Peta lokasi ruas jalan yang disurvei pada periode 2 mingguan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0026",
        "section": "O. PERSETUJUAN",
        "options": [],
        "required": false,
        "order": 26,
        "sourceOrder": 26,
        "unit": "",
        "rule": {},
        "label": "Grafik distribusi nilai IRI hasil survei",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0027",
        "section": "O. PERSETUJUAN",
        "options": [],
        "required": false,
        "order": 27,
        "sourceOrder": 27,
        "unit": "",
        "rule": {},
        "label": "Foto dokumentasi proses verifikasi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0028",
        "section": "O. PERSETUJUAN",
        "options": [],
        "required": false,
        "order": 28,
        "sourceOrder": 28,
        "unit": "",
        "rule": {},
        "label": "Hasil pengujian konsistensi (repeatability)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0029",
        "section": "O. PERSETUJUAN",
        "options": [],
        "required": false,
        "order": 29,
        "sourceOrder": 29,
        "unit": "",
        "rule": {},
        "label": "Catatan lapangan selama survei",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_PERIODIC14_0030",
        "section": "O. PERSETUJUAN",
        "options": [],
        "required": false,
        "order": 30,
        "sourceOrder": 30,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi kendala dan solusi selama periode survei",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-11-iri-internal",
    "survey": "IRI",
    "phase": "internal",
    "items": [
      {
        "code": "DOCX_IRI_INTERNAL_0001",
        "section": "A. INFORMASI UMUM",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. INFORMASI UMUM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Detail"
          ],
          "row_labels": [
            "Nama Proyek",
            "Nomor Kontrak",
            "Periode Verifikasi",
            "Nomor Ruas",
            "Nama Ruas",
            "Panjang Ruas",
            "Tanggal Verifikasi",
            "Nama Petugas",
            "Jabatan Petugas",
            "Nama Supervisor"
          ],
          "source_rows": [
            [
              "Nama Proyek",
              ""
            ],
            [
              "Nomor Kontrak",
              ""
            ],
            [
              "Periode Verifikasi",
              ""
            ],
            [
              "Nomor Ruas",
              ""
            ],
            [
              "Nama Ruas",
              ""
            ],
            [
              "Panjang Ruas",
              ""
            ],
            [
              "Tanggal Verifikasi",
              ""
            ],
            [
              "Nama Petugas",
              ""
            ],
            [
              "Jabatan Petugas",
              ""
            ],
            [
              "Nama Supervisor",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0002",
        "section": "B. PERSIAPAN VERIFIKASI DAN VALIDASI",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. PERSIAPAN VERIFIKASI DAN VALIDASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "B.1",
            "B.2",
            "B.3",
            "B.4",
            "B.5",
            "B.6",
            "B.7",
            "B.8",
            "B.9",
            "B.10"
          ],
          "source_rows": [
            [
              "B.1",
              "Data survei tersedia dalam format yang sesuai",
              "☐",
              "☐",
              ""
            ],
            [
              "B.2",
              "Dokumentasi survei tersedia (foto, video, catatan)",
              "☐",
              "☐",
              ""
            ],
            [
              "B.3",
              "Data hasil kalibrasi alat tersedia",
              "☐",
              "☐",
              ""
            ],
            [
              "B.4",
              "Laporan kendala lapangan tersedia",
              "☐",
              "☐",
              ""
            ],
            [
              "B.5",
              "Peralatan verifikasi telah disiapkan",
              "☐",
              "☐",
              ""
            ],
            [
              "B.6",
              "Tim verifikasi lengkap",
              "☐",
              "☐",
              ""
            ],
            [
              "B.7",
              "Metode sampling untuk verifikasi telah ditentukan",
              "☐",
              "☐",
              ""
            ],
            [
              "B.8",
              "Data referensi untuk validasi tersedia",
              "☐",
              "☐",
              ""
            ],
            [
              "B.9",
              "Peta ruas jalan tersedia",
              "☐",
              "☐",
              ""
            ],
            [
              "B.10",
              "Checklist konsistensi harian tersedia",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0003",
        "section": "C. VERIFIKASI KELENGKAPAN DATA",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. VERIFIKASI KELENGKAPAN DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "C.1",
            "C.2",
            "C.3",
            "C.4",
            "C.5",
            "C.6",
            "C.7",
            "C.8",
            "C.9",
            "C.10",
            "C.11",
            "C.12"
          ],
          "source_rows": [
            [
              "C.1",
              "Semua segmen ruas jalan terukur lengkap",
              "☐",
              "☐",
              ""
            ],
            [
              "C.2",
              "Data IRI untuk setiap lajur tercatat",
              "☐",
              "☐",
              ""
            ],
            [
              "C.3",
              "Data IRI roda kanan tercatat",
              "☐",
              "☐",
              ""
            ],
            [
              "C.4",
              "Data IRI roda kiri tercatat",
              "☐",
              "☐",
              ""
            ],
            [
              "C.5",
              "Koordinat GPS untuk setiap segmen 100 m tersedia",
              "☐",
              "☐",
              ""
            ],
            [
              "C.6",
              "Arah pengukuran tercatat dengan benar",
              "☐",
              "☐",
              ""
            ],
            [
              "C.7",
              "Kecepatan kendaraan saat survei tercatat",
              "☐",
              "☐",
              ""
            ],
            [
              "C.8",
              "Tanggal dan waktu survei tercatat",
              "☐",
              "☐",
              ""
            ],
            [
              "C.9",
              "Informasi operator dan surveyor tercatat",
              "☐",
              "☐",
              ""
            ],
            [
              "C.10",
              "Faktor-faktor yang mempengaruhi pengukuran tercatat",
              "☐",
              "☐",
              ""
            ],
            [
              "C.11",
              "Dokumentasi foto kondisi permukaan jalan tersedia",
              "☐",
              "☐",
              ""
            ],
            [
              "C.12",
              "Jumlah titik data memanjang per 100 m interval sudah sesuai",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 12,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0004",
        "section": "D. VERIFIKASI KEWAJARAN DATA",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: D. VERIFIKASI KEWAJARAN DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "D.1",
            "D.2",
            "D.3",
            "D.4",
            "D.5",
            "D.6",
            "D.7",
            "D.8",
            "D.9",
            "D.10"
          ],
          "source_rows": [
            [
              "D.1",
              "Nilai IRI berada dalam rentang yang masuk akal untuk kondisi jalan",
              "☐",
              "☐",
              ""
            ],
            [
              "D.2",
              "Tidak ada nilai IRI yang tiba-tiba berubah drastis tanpa alasan",
              "☐",
              "☐",
              ""
            ],
            [
              "D.3",
              "Nilai IRI roda kiri dan kanan tidak memiliki deviasi yang ekstrem",
              "☐",
              "☐",
              ""
            ],
            [
              "D.4",
              "Perbedaan kecepatan pada segmen yang berdekatan terjustifikasi",
              "☐",
              "☐",
              ""
            ],
            [
              "D.5",
              "Nilai IRI konsisten dengan kondisi permukaan jalan yang diketahui",
              "☐",
              "☐",
              ""
            ],
            [
              "D.6",
              "Data koordinat GPS konsisten dengan rute jalan yang disurvei",
              "☐",
              "☐",
              ""
            ],
            [
              "D.7",
              "Jika ada nilai hilang/anomali, sudah dicatat dan dijelaskan",
              "☐",
              "☐",
              ""
            ],
            [
              "D.8",
              "Kecepatan survei sesuai rentang yang disarankan (40-80 km/jam)",
              "☐",
              "☐",
              ""
            ],
            [
              "D.9",
              "Nilai IRI pada jembatan dan struktur khusus masuk akal",
              "☐",
              "☐",
              ""
            ],
            [
              "D.10",
              "Hubungan antara nilai IRI dengan kecepatan survei konsisten",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0005",
        "section": "E. VALIDASI KEAKURATAN DATA",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: E. VALIDASI KEAKURATAN DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "E.1",
            "E.2",
            "E.3",
            "E.4",
            "E.5",
            "E.6",
            "E.7",
            "E.8",
            "E.9",
            "E.10"
          ],
          "source_rows": [
            [
              "E.1",
              "Sampel minimal 5% dari total panjang ruas telah diverifikasi",
              "☐",
              "☐",
              ""
            ],
            [
              "E.2",
              "Nilai IRI hasil survei konvergen dengan nilai referensi (jika ada)",
              "☐",
              "☐",
              ""
            ],
            [
              "E.3",
              "Nilai IRI untuk bagian jalan yang tidak berubah konsisten dengan data historis",
              "☐",
              "☐",
              ""
            ],
            [
              "E.4",
              "Nilai IRI untuk bagian jalan yang diperbaiki menunjukkan perbaikan dari data historis",
              "☐",
              "☐",
              ""
            ],
            [
              "E.5",
              "Nilai IRI konsisten dengan data kondisi perkerasan (PCI) pada lokasi yang sama",
              "☐",
              "☐",
              ""
            ],
            [
              "E.6",
              "Perbandingan cross-check dengan metode manual menunjukkan konsistensi",
              "☐",
              "☐",
              ""
            ],
            [
              "E.7",
              "Validasi dengan pengukuran ulang pada lokasi sampling menunjukkan konsistensi",
              "☐",
              "☐",
              ""
            ],
            [
              "E.8",
              "Nilai IRI konsisten untuk segmen yang diukur dalam arah yang berbeda",
              "☐",
              "☐",
              ""
            ],
            [
              "E.9",
              "Nilai IRI pada titik overlap antar ruas konsisten",
              "☐",
              "☐",
              ""
            ],
            [
              "E.10",
              "Data telah divalidasi terhadap pengukuran independen (jika tersedia)",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0006",
        "section": "F. VALIDASI FORMAT DATA",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: F. VALIDASI FORMAT DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "F.1",
            "F.2",
            "F.3",
            "F.4",
            "F.5",
            "F.6",
            "F.7",
            "F.8",
            "F.9",
            "F.10"
          ],
          "source_rows": [
            [
              "F.1",
              "Format file sesuai dengan ketentuan SMD Jalan",
              "☐",
              "☐",
              ""
            ],
            [
              "F.2",
              "Struktur data sesuai dengan spesifikasi",
              "☐",
              "☐",
              ""
            ],
            [
              "F.3",
              "Kolom data lengkap dan diisi dengan benar",
              "☐",
              "☐",
              ""
            ],
            [
              "F.4",
              "Penomoran ruas konsisten dengan basis data SMD Jalan",
              "☐",
              "☐",
              ""
            ],
            [
              "F.5",
              "Penomoran segmen konsisten dan berurutan",
              "☐",
              "☐",
              ""
            ],
            [
              "F.6",
              "Format tanggal dan waktu sesuai standar",
              "☐",
              "☐",
              ""
            ],
            [
              "F.7",
              "Format koordinat GPS sesuai standar",
              "☐",
              "☐",
              ""
            ],
            [
              "F.8",
              "Satuan pengukuran sesuai dengan standar (m/km untuk IRI)",
              "☐",
              "☐",
              ""
            ],
            [
              "F.9",
              "Desimal nilai IRI tidak lebih dari 2 digit",
              "☐",
              "☐",
              ""
            ],
            [
              "F.10",
              "Data siap diunggah ke sistem SMD Jalan",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0007",
        "section": "G. HASIL SPOT CHECK / SAMPLING",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: G. HASIL SPOT CHECK / SAMPLING",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Lokasi (STA)",
            "Nilai IRI Data Asli",
            "Nilai IRI Verifikasi",
            "Selisih (%)",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "6",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "7",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "8",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "9",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "10",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0008",
        "section": "G. HASIL SPOT CHECK / SAMPLING",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Kriteria Status: Diterima (selisih ≤5%), Diperiksa Kembali (selisih 5-10%), Ditolak (selisih >10%)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0009",
        "section": "H. STATISTIK VALIDASI DATA",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: H. STATISTIK VALIDASI DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Parameter",
            "Nilai",
            "Keterangan"
          ],
          "row_labels": [
            "Jumlah Segmen Total",
            "Jumlah Segmen Sampel",
            "Persentase Sampel (%)",
            "Nilai IRI Rata-rata",
            "Standar Deviasi IRI",
            "Nilai IRI Minimum",
            "Nilai IRI Maksimum",
            "Deviasi Rata-rata Data Sampel (%)"
          ],
          "source_rows": [
            [
              "Jumlah Segmen Total",
              "",
              ""
            ],
            [
              "Jumlah Segmen Sampel",
              "",
              ""
            ],
            [
              "Persentase Sampel (%)",
              "",
              ""
            ],
            [
              "Nilai IRI Rata-rata",
              "",
              ""
            ],
            [
              "Standar Deviasi IRI",
              "",
              ""
            ],
            [
              "Nilai IRI Minimum",
              "",
              ""
            ],
            [
              "Nilai IRI Maksimum",
              "",
              ""
            ],
            [
              "Deviasi Rata-rata Data Sampel (%)",
              "",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0010",
        "section": "I. TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: I. TEMUAN DAN TINDAKAN PERBAIKAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Temuan/Permasalahan",
            "Lokasi (STA)",
            "Tindakan Perbaikan yang Diusulkan",
            "Status",
            "Target Penyelesaian"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0011",
        "section": "J. KESIMPULAN VERIFIKASI DAN VALIDASI",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: J. KESIMPULAN VERIFIKASI DAN VALIDASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Aspek",
            "Hasil"
          ],
          "row_labels": [
            "Kelengkapan Data",
            "Kewajaran Data",
            "Keakuratan Data",
            "Format Data",
            "Status Akhir Data"
          ],
          "source_rows": [
            [
              "Kelengkapan Data",
              "☐ Lengkap ☐ Tidak Lengkap"
            ],
            [
              "Kewajaran Data",
              "☐ Wajar ☐ Tidak Wajar"
            ],
            [
              "Keakuratan Data",
              "☐ Akurat ☐ Tidak Akurat"
            ],
            [
              "Format Data",
              "☐ Sesuai ☐ Tidak Sesuai"
            ],
            [
              "Status Akhir Data",
              "☐ Diterima ☐ Diterima dengan Catatan ☐ Perlu Perbaikan ☐ Ditolak"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0012",
        "section": "K. CATATAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "[Cantumkan catatan penting dan rekomendasi terkait hasil verifikasi dan validasi data]",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0013",
        "section": "K. CATATAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "PERSETUJUAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0014",
        "section": "K. CATATAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: K. CATATAN DAN REKOMENDASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Jabatan",
            "Nama",
            "Tanda Tangan",
            "Tanggal"
          ],
          "row_labels": [
            "Petugas Verifikasi",
            "Supervisor QA/QC",
            "Manajer Teknis",
            "Pimpinan Penyedia Jasa"
          ],
          "source_rows": [
            [
              "Petugas Verifikasi",
              "",
              "",
              ""
            ],
            [
              "Supervisor QA/QC",
              "",
              "",
              ""
            ],
            [
              "Manajer Teknis",
              "",
              "",
              ""
            ],
            [
              "Pimpinan Penyedia Jasa",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0015",
        "section": "K. CATATAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "LAMPIRAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0016",
        "section": "K. CATATAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Peta lokasi dengan indikasi segmen yang diverifikasi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0017",
        "section": "K. CATATAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "Foto dokumentasi verifikasi lapangan (jika dilakukan)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0018",
        "section": "K. CATATAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Data statistik hasil verifikasi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0019",
        "section": "K. CATATAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Grafik perbandingan nilai IRI data asli vs verifikasi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_INTERNAL_0020",
        "section": "K. CATATAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "Log perubahan data (jika dilakukan perbaikan)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-12-jembatan-consistency",
    "survey": "Jembatan",
    "phase": "consistency",
    "items": [
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0001",
        "section": "A. INFORMASI UMUM",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. INFORMASI UMUM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Detail"
          ],
          "row_labels": [
            "Nama Proyek",
            "Nomor Kontrak",
            "Periode Evaluasi Konsistensi",
            "Lokasi",
            "Tanggal Evaluasi",
            "Nama Evaluator",
            "Jabatan",
            "Instansi"
          ],
          "source_rows": [
            [
              "Nama Proyek",
              ""
            ],
            [
              "Nomor Kontrak",
              ""
            ],
            [
              "Periode Evaluasi Konsistensi",
              ""
            ],
            [
              "Lokasi",
              ""
            ],
            [
              "Tanggal Evaluasi",
              ""
            ],
            [
              "Nama Evaluator",
              ""
            ],
            [
              "Jabatan",
              ""
            ],
            [
              "Instansi",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0002",
        "section": "B. DAFTAR JEMBATAN YANG DIEVALUASI KONSISTENSINYA",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. DAFTAR JEMBATAN YANG DIEVALUASI KONSISTENSINYA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Nomor Jembatan",
            "Nama Jembatan",
            "Tipe Bangunan Atas",
            "Jenis Pemeriksaan*",
            "Nama Inspektor"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0003",
        "section": "B. DAFTAR JEMBATAN YANG DIEVALUASI KONSISTENSINYA",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "*Jenis Pemeriksaan: Inventarisasi, Detail, Rutin, Khusus",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0004",
        "section": "C. KONSISTENSI PERSONIL PEMERIKSAAN",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. KONSISTENSI PERSONIL PEMERIKSAAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "C.1",
            "C.2",
            "C.3",
            "C.4",
            "C.5",
            "C.6",
            "C.7",
            "C.8",
            "C.9",
            "C.10"
          ],
          "source_rows": [
            [
              "C.1",
              "Tim pemeriksaan konsisten dengan yang telah disetujui",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.2",
              "Ahli Teknik Jembatan yang sama melakukan supervisi secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.3",
              "Asisten Tenaga Ahli Jembatan konsisten dalam pelaksanaan tugas",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.4",
              "Personil pengganti (jika ada) memiliki kualifikasi yang setara",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.5",
              "Beban kerja tim pemeriksaan terdistribusi secara wajar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.6",
              "Jumlah personil sesuai dengan kebutuhan pemeriksaan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.7",
              "Tim pemeriksaan memahami mekanisme pemeriksaan silang (cross-check)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.8",
              "Pelatihan penyegaran dilakukan secara berkala",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.9",
              "Pembagian tugas dalam tim terdokumentasi dengan jelas",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.10",
              "Koordinasi antar anggota tim berjalan dengan baik",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0005",
        "section": "D. KONSISTENSI PERALATAN PEMERIKSAAN",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: D. KONSISTENSI PERALATAN PEMERIKSAAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "D.1",
            "D.2",
            "D.3",
            "D.4",
            "D.5",
            "D.6",
            "D.7",
            "D.8",
            "D.9",
            "D.10"
          ],
          "source_rows": [
            [
              "D.1",
              "Peralatan yang sama digunakan secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.2",
              "Peralatan pembersih cacat elemen digunakan secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.3",
              "Alat inspeksi (pisau saku, ice pick, bor tangan, dll) digunakan secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.4",
              "Alat bantu penglihatan digunakan secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.5",
              "Alat pengukur digunakan secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.6",
              "Pengukur retak/crack meter digunakan secara konsisten untuk mengukur retak",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.7",
              "Dokumentasi (kamera) dengan kualitas konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.8",
              "Aplikasi INVI-J digunakan secara konsisten di lapangan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.9",
              "Drone/UAV digunakan secara konsisten untuk jembatan yang sulit diakses",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.10",
              "Alat Pelindung Diri (APD) digunakan secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0006",
        "section": "E. KONSISTENSI PROSEDUR PEMERIKSAAN INVENTARISASI",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: E. KONSISTENSI PROSEDUR PEMERIKSAAN INVENTARISASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "E.1",
            "E.2",
            "E.3",
            "E.4",
            "E.5",
            "E.6",
            "E.7",
            "E.8",
            "E.9",
            "E.10"
          ],
          "source_rows": [
            [
              "E.1",
              "Data administrasi dicatat secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.2",
              "Informasi pembangunan jembatan dicatat secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.3",
              "Data kapasitas dan karakteristik lalu lintas dicatat secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.4",
              "Data kapasitas muatan dicatat secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.5",
              "Informasi batasan perlintasan, geometri dan lingkungan dicatat secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.6",
              "Inventarisasi Komponen, Elemen Utama, dan Elemen Jembatan dilakukan secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.7",
              "Data bentang, jenis komponen, data bahan jembatan dicatat secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.8",
              "Data Tipe DAS dicatat secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.9",
              "Koordinat Lintang dan Bujur direkam secara konsisten dalam format desimal",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.10",
              "Pendekatan pengisian data dalam aplikasi INVI-J konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0007",
        "section": "F. KONSISTENSI PROSEDUR PEMERIKSAAN DETAIL",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: F. KONSISTENSI PROSEDUR PEMERIKSAAN DETAIL",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "F.1",
            "F.2",
            "F.3",
            "F.4",
            "F.5",
            "F.6",
            "F.7",
            "F.8",
            "F.9",
            "F.10"
          ],
          "source_rows": [
            [
              "F.1",
              "Identifikasi kerusakan dilakukan secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.2",
              "Parameter kerusakan (jenis, tingkat, volume) dicatat secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.3",
              "Penilaian kondisi komponen, elemen utama, dan elemen jembatan dilakukan secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.4",
              "Penggunaan kriteria nilai kondisi jembatan (NK) konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.5",
              "Pendekatan SRKFP (Struktur, Rasa Aman, Keselamatan, Fungsi, Pelayanan) diterapkan secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.6",
              "Kebutuhan penanganan jembatan diidentifikasi secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.7",
              "Kebutuhan tindakan darurat diidentifikasi secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.8",
              "Kebutuhan pemeriksaan khusus diidentifikasi secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.9",
              "Pengukuran dimensi kerusakan konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.10",
              "Dokumentasi foto kerusakan konsisten dalam sudut, pencahayaan dan jarak",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0008",
        "section": "G. KONSISTENSI PROSEDUR PEMERIKSAAN RUTIN",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: G. KONSISTENSI PROSEDUR PEMERIKSAAN RUTIN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "G.1",
            "G.2",
            "G.3",
            "G.4",
            "G.5",
            "G.6",
            "G.7",
            "G.8",
            "G.9",
            "G.10"
          ],
          "source_rows": [
            [
              "G.1",
              "Aspek keamanan jembatan diperiksa secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.2",
              "Aspek keselamatan jembatan diperiksa secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.3",
              "Aspek kenyamanan jembatan diperiksa secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.4",
              "Dokumentasi penanganan jembatan yang sedang berjalan dilakukan secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.5",
              "Dokumentasi kondisi sosial kemasyarakatan dilakukan secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.6",
              "Perubahan kondisi jembatan dibandingkan pemeriksaan sebelumnya dicatat secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.7",
              "Kebutuhan tindakan darurat diidentifikasi secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.8",
              "Kebutuhan pemeriksaan khusus diidentifikasi secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.9",
              "Pengisian format laporan pemeriksaan rutin dilakukan secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.10",
              "Pendekatan pengisian data dalam aplikasi INVI-J konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0009",
        "section": "H. KONSISTENSI DOKUMENTASI VISUAL",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: H. KONSISTENSI DOKUMENTASI VISUAL",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "H.1",
            "H.2",
            "H.3",
            "H.4",
            "H.5",
            "H.6",
            "H.7",
            "H.8",
            "H.9",
            "H.10"
          ],
          "source_rows": [
            [
              "H.1",
              "Pengambilan foto papan nama jembatan konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.2",
              "Pengambilan foto tampak keseluruhan jembatan konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.3",
              "Pengambilan foto bangunan bawah konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.4",
              "Pengambilan foto elemen jembatan konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.5",
              "Pengambilan foto kerusakan konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.6",
              "Pencahayaan pada foto konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.7",
              "Sudut pengambilan foto konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.8",
              "Resolusi foto konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.9",
              "Penamaan file foto konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.10",
              "Metode pengambilan gambar drone (jika digunakan) konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0010",
        "section": "I. KONSISTENSI PENILAIAN TINGKAT KERUSAKAN",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: I. KONSISTENSI PENILAIAN TINGKAT KERUSAKAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "I.1",
            "I.2",
            "I.3",
            "I.4",
            "I.5",
            "I.6",
            "I.7",
            "I.8",
            "I.9",
            "I.10"
          ],
          "source_rows": [
            [
              "I.1",
              "Penilaian tingkat kerusakan lantai jembatan konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.2",
              "Penilaian tingkat kerusakan gelagar konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.3",
              "Penilaian tingkat kerusakan diafragma konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.4",
              "Penilaian tingkat kerusakan ikatan angin/ikatan pengaku konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.5",
              "Penilaian tingkat kerusakan perletakan konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.6",
              "Penilaian tingkat kerusakan kepala jembatan konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.7",
              "Penilaian tingkat kerusakan pilar konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.8",
              "Penilaian tingkat kerusakan fondasi konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.9",
              "Penilaian tingkat kerusakan pelengkap konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.10",
              "Penilaian tingkat kerusakan daerah aliran sungai konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0011",
        "section": "J. KONSISTENSI PENILAIAN NILAI KONDISI (NK)",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: J. KONSISTENSI PENILAIAN NILAI KONDISI (NK)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "J.1",
            "J.2",
            "J.3",
            "J.4",
            "J.5",
            "J.6",
            "J.7",
            "J.8",
            "J.9",
            "J.10"
          ],
          "source_rows": [
            [
              "J.1",
              "Penilaian NK level 5 (elemen jembatan) konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.2",
              "Penilaian NK level 4 (elemen utama) konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.3",
              "Penilaian NK level 3 (komponen) konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.4",
              "Penilaian NK level 2 (bentang) konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.5",
              "Penilaian NK level 1 (jembatan) konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.6",
              "Penggunaan kategori NK 0 (Tidak ada kerusakan) konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.7",
              "Penggunaan kategori NK 1 (Rusak ringan) konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.8",
              "Penggunaan kategori NK 2 (Rusak sedang) konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.9",
              "Penggunaan kategori NK 3 (Rusak berat) konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.10",
              "Penggunaan kategori NK 4 (Runtuh) konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0012",
        "section": "K. KONSISTENSI PENILAIAN SRKFP",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: K. KONSISTENSI PENILAIAN SRKFP",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "K.1",
            "K.2",
            "K.3",
            "K.4",
            "K.5",
            "K.6",
            "K.7",
            "K.8",
            "K.9",
            "K.10"
          ],
          "source_rows": [
            [
              "K.1",
              "Penilaian aspek Struktur (S) konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "K.2",
              "Penilaian aspek Rasa Aman (R) konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "K.3",
              "Penilaian aspek Keselamatan (K) konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "K.4",
              "Penilaian aspek Fungsi (F) konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "K.5",
              "Penilaian aspek Pelayanan (P) konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "K.6",
              "Keterkaitan nilai SRKFP dengan NK konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "K.7",
              "Deskripsi kerusakan sesuai dengan nilai SRKFP",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "K.8",
              "Bukti visual mendukung penilaian SRKFP",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "K.9",
              "Rekomendasi penanganan sesuai dengan nilai SRKFP",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "K.10",
              "Hubungan antara nilai SRKFP dengan level hirarki elemen konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0013",
        "section": "L. KONSISTENSI PENGUNGGAHAN DATA KE SISTEM",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: L. KONSISTENSI PENGUNGGAHAN DATA KE SISTEM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "L.1",
            "L.2",
            "L.3",
            "L.4",
            "L.5",
            "L.6",
            "L.7",
            "L.8",
            "L.9",
            "L.10"
          ],
          "source_rows": [
            [
              "L.1",
              "Data jembatan diunggah ke INVI-J secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "L.2",
              "Format data yang diunggah konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "L.3",
              "Kelengkapan data yang diunggah konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "L.4",
              "Waktu pengunggahan data konsisten sesuai jadwal",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "L.5",
              "Kualitas foto yang diunggah konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "L.6",
              "Resolusi foto yang diunggah konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "L.7",
              "Metadata foto yang diunggah konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "L.8",
              "Proses verifikasi data setelah unggah dilakukan secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "L.9",
              "Penanganan kesalahan unggah dilakukan secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "L.10",
              "Backup data sebelum pengunggahan dilakukan secara konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0014",
        "section": "M. HASIL UJI KONSISTENSI ANTAR INSPEKTOR",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: M. HASIL UJI KONSISTENSI ANTAR INSPEKTOR",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Jembatan",
            "Elemen yang Diuji",
            "Inspektor 1",
            "Inspektor 2",
            "Selisih NK",
            "Status*"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0015",
        "section": "M. HASIL UJI KONSISTENSI ANTAR INSPEKTOR",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "*Status: Konsisten (selisih 0), Minor (selisih 1), Major (selisih >1)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0016",
        "section": "N. HASIL UJI KONSISTENSI TERHADAP REFERENSI",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: N. HASIL UJI KONSISTENSI TERHADAP REFERENSI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Jembatan",
            "Elemen yang Diuji",
            "NK Tim Lapangan",
            "NK Referensi",
            "Selisih NK",
            "Status*"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0017",
        "section": "N. HASIL UJI KONSISTENSI TERHADAP REFERENSI",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "*Status: Konsisten (selisih 0), Minor (selisih 1), Major (selisih >1)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0018",
        "section": "O. ANALISIS STATISTIK KONSISTENSI",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: O. ANALISIS STATISTIK KONSISTENSI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Parameter",
            "Nilai",
            "Keterangan"
          ],
          "row_labels": [
            "Jumlah jembatan yang dievaluasi",
            "Persentase konsistensi personil (%)",
            "Persentase konsistensi peralatan (%)",
            "Persentase konsistensi prosedur inventarisasi (%)",
            "Persentase konsistensi prosedur pemeriksaan detail (%)",
            "Persentase konsistensi prosedur pemeriksaan rutin (%)",
            "Persentase konsistensi dokumentasi visual (%)",
            "Persentase konsistensi penilaian tingkat kerusakan (%)",
            "Persentase konsistensi penilaian NK (%)",
            "Persentase konsistensi penilaian SRKFP (%)",
            "Persentase konsistensi pengunggahan data (%)",
            "Persentase konsistensi antar inspektor (%)",
            "Persentase konsistensi terhadap referensi (%)"
          ],
          "source_rows": [
            [
              "Jumlah jembatan yang dievaluasi",
              "",
              ""
            ],
            [
              "Persentase konsistensi personil (%)",
              "",
              ""
            ],
            [
              "Persentase konsistensi peralatan (%)",
              "",
              ""
            ],
            [
              "Persentase konsistensi prosedur inventarisasi (%)",
              "",
              ""
            ],
            [
              "Persentase konsistensi prosedur pemeriksaan detail (%)",
              "",
              ""
            ],
            [
              "Persentase konsistensi prosedur pemeriksaan rutin (%)",
              "",
              ""
            ],
            [
              "Persentase konsistensi dokumentasi visual (%)",
              "",
              ""
            ],
            [
              "Persentase konsistensi penilaian tingkat kerusakan (%)",
              "",
              ""
            ],
            [
              "Persentase konsistensi penilaian NK (%)",
              "",
              ""
            ],
            [
              "Persentase konsistensi penilaian SRKFP (%)",
              "",
              ""
            ],
            [
              "Persentase konsistensi pengunggahan data (%)",
              "",
              ""
            ],
            [
              "Persentase konsistensi antar inspektor (%)",
              "",
              ""
            ],
            [
              "Persentase konsistensi terhadap referensi (%)",
              "",
              ""
            ]
          ],
          "table_rows": 13,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0019",
        "section": "P. TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: P. TEMUAN DAN TINDAKAN PERBAIKAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Temuan Ketidakkonsistenan",
            "Jembatan/Lokasi",
            "Dampak",
            "Tindakan Perbaikan",
            "PIC",
            "Target Waktu"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0020",
        "section": "P. TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "Q. KESIMPULAN DAN REKOMENDASI",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0021",
        "section": "P. TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Q.1. Kesimpulan Evaluasi Konsistensi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0022",
        "section": "P. TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: P. TEMUAN DAN TINDAKAN PERBAIKAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Aspek",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "Konsistensi Personil",
            "Konsistensi Peralatan",
            "Konsistensi Prosedur",
            "Konsistensi Dokumentasi",
            "Konsistensi Penilaian",
            "Konsistensi Pengunggahan",
            "Status Keseluruhan"
          ],
          "source_rows": [
            [
              "Konsistensi Personil",
              "☐ Konsisten ☐ Perlu Perbaikan ☐ Tidak Konsisten",
              ""
            ],
            [
              "Konsistensi Peralatan",
              "☐ Konsisten ☐ Perlu Perbaikan ☐ Tidak Konsisten",
              ""
            ],
            [
              "Konsistensi Prosedur",
              "☐ Konsisten ☐ Perlu Perbaikan ☐ Tidak Konsisten",
              ""
            ],
            [
              "Konsistensi Dokumentasi",
              "☐ Konsisten ☐ Perlu Perbaikan ☐ Tidak Konsisten",
              ""
            ],
            [
              "Konsistensi Penilaian",
              "☐ Konsisten ☐ Perlu Perbaikan ☐ Tidak Konsisten",
              ""
            ],
            [
              "Konsistensi Pengunggahan",
              "☐ Konsisten ☐ Perlu Perbaikan ☐ Tidak Konsisten",
              ""
            ],
            [
              "Status Keseluruhan",
              "☐ Konsisten ☐ Perlu Perbaikan ☐ Tidak Konsisten",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0023",
        "section": "P. TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 23,
        "sourceOrder": 23,
        "unit": "",
        "rule": {},
        "label": "Q.2. Rekomendasi Peningkatan Konsistensi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0024",
        "section": "P. TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 24,
        "sourceOrder": 24,
        "unit": "",
        "rule": {},
        "label": "[Tuliskan rekomendasi untuk meningkatkan konsistensi pemeriksaan jembatan]",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0025",
        "section": "P. TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 25,
        "sourceOrder": 25,
        "unit": "",
        "rule": {},
        "label": "R. PERSETUJUAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0026",
        "section": "P. TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 26,
        "sourceOrder": 26,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: P. TEMUAN DAN TINDAKAN PERBAIKAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Jabatan",
            "Nama",
            "Tanda Tangan",
            "Tanggal"
          ],
          "row_labels": [
            "Evaluator",
            "Ahli Teknik Jembatan",
            "Pengguna Jasa",
            "Pejabat Pembuat Komitmen"
          ],
          "source_rows": [
            [
              "Evaluator",
              "",
              "",
              ""
            ],
            [
              "Ahli Teknik Jembatan",
              "",
              "",
              ""
            ],
            [
              "Pengguna Jasa",
              "",
              "",
              ""
            ],
            [
              "Pejabat Pembuat Komitmen",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0027",
        "section": "P. TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 27,
        "sourceOrder": 27,
        "unit": "",
        "rule": {},
        "label": "LAMPIRAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0028",
        "section": "P. TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 28,
        "sourceOrder": 28,
        "unit": "",
        "rule": {},
        "label": "Grafik analisis statistik konsistensi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0029",
        "section": "P. TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 29,
        "sourceOrder": 29,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi uji konsistensi antar inspektor",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0030",
        "section": "P. TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 30,
        "sourceOrder": 30,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi uji konsistensi terhadap referensi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0031",
        "section": "P. TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 31,
        "sourceOrder": 31,
        "unit": "",
        "rule": {},
        "label": "Contoh kasus ketidakkonsistenan yang ditemukan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_CONSISTENCY_0032",
        "section": "P. TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 32,
        "sourceOrder": 32,
        "unit": "",
        "rule": {},
        "label": "Bukti tindakan perbaikan yang telah dilakukan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-13-jembatan-periodic14",
    "survey": "Jembatan",
    "phase": "periodic14",
    "items": [
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0001",
        "section": "A. INFORMASI UMUM",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. INFORMASI UMUM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Detail"
          ],
          "row_labels": [
            "Nama Proyek",
            "Nomor Kontrak",
            "Periode Verifikasi",
            "Lokasi",
            "Tanggal Verifikasi",
            "Petugas Verifikasi",
            "Perwakilan Penyedia Jasa",
            "Perwakilan Pengguna Jasa"
          ],
          "source_rows": [
            [
              "Nama Proyek",
              ""
            ],
            [
              "Nomor Kontrak",
              ""
            ],
            [
              "Periode Verifikasi",
              "Tanggal: ___________ s/d ___________"
            ],
            [
              "Lokasi",
              ""
            ],
            [
              "Tanggal Verifikasi",
              ""
            ],
            [
              "Petugas Verifikasi",
              ""
            ],
            [
              "Perwakilan Penyedia Jasa",
              ""
            ],
            [
              "Perwakilan Pengguna Jasa",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0002",
        "section": "B. JEMBATAN YANG DIPERIKSA DALAM PERIODE 2 MINGGUAN",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. JEMBATAN YANG DIPERIKSA DALAM PERIODE 2 MINGGUAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Nomor Jembatan",
            "Nama Jembatan",
            "Ruas Jalan",
            "Jenis Pemeriksaan*",
            "Tanggal Pemeriksaan",
            "Tim Pemeriksa"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0003",
        "section": "B. JEMBATAN YANG DIPERIKSA DALAM PERIODE 2 MINGGUAN",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "*Jenis Pemeriksaan: Inventarisasi (INV), Detail (DTL), Rutin (RTN), Khusus (KHS)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0004",
        "section": "C. VERIFIKASI RENCANA VS REALISASI",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. VERIFIKASI RENCANA VS REALISASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "C.1",
            "C.2",
            "C.3",
            "C.4",
            "C.5",
            "C.6",
            "C.7",
            "C.8",
            "C.9",
            "C.10"
          ],
          "source_rows": [
            [
              "C.1",
              "Jumlah jembatan yang diperiksa sesuai dengan target 2 mingguan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.2",
              "Jenis pemeriksaan yang dilakukan sesuai dengan rencana",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.3",
              "Tim pemeriksa sesuai dengan yang telah ditetapkan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.4",
              "Waktu pelaksanaan sesuai dengan jadwal",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.5",
              "Durasi pemeriksaan per jembatan sesuai dengan standar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.6",
              "Jembatan prioritas (NK ≥ 3) diprioritaskan dalam pemeriksaan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.7",
              "Bukti koordinasi dengan pihak terkait (PPK, Satker, Penilik Jalan) tersedia",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.8",
              "Lokasi jembatan telah diidentifikasi dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.9",
              "Peralatan pemeriksaan yang digunakan sesuai dengan yang disyaratkan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.10",
              "Prosedur pemeriksaan sesuai dengan pedoman",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0005",
        "section": "D. VERIFIKASI KELENGKAPAN DOKUMENTASI PENDUKUNG",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: D. VERIFIKASI KELENGKAPAN DOKUMENTASI PENDUKUNG",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "D.1",
            "D.2",
            "D.3",
            "D.4",
            "D.5",
            "D.6",
            "D.7",
            "D.8",
            "D.9",
            "D.10"
          ],
          "source_rows": [
            [
              "D.1",
              "Formulir pemeriksaan atau aplikasi INVI-J digunakan dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.2",
              "Berita acara pelaksanaan pemeriksaan tersedia",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.3",
              "Log harian pemeriksaan tersedia",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.4",
              "Dokumentasi foto jembatan (papan nama, tampak keseluruhan, dll) lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.5",
              "Dokumentasi foto kerusakan jembatan lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.6",
              "Dokumentasi sketsa lokasi kerusakan tersedia",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.7",
              "Kualitas foto memadai untuk identifikasi kerusakan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.8",
              "Catatan kendala pemeriksaan tersedia (jika ada)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.9",
              "Dokumentasi kondisi dan pembacaan alat pemeriksaan tersedia",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.10",
              "Surat izin pemeriksaan jembatan tersedia (jika diperlukan)",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0006",
        "section": "E. VERIFIKASI KELENGKAPAN DATA PEMERIKSAAN INVENTARISASI",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: E. VERIFIKASI KELENGKAPAN DATA PEMERIKSAAN INVENTARISASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "E.1",
            "E.2",
            "E.3",
            "E.4",
            "E.5",
            "E.6",
            "E.7",
            "E.8",
            "E.9",
            "E.10"
          ],
          "source_rows": [
            [
              "E.1",
              "Data administrasi jembatan lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.2",
              "Koordinat jembatan diukur dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.3",
              "Dimensi jembatan (panjang, lebar, tinggi) diukur dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.4",
              "Tipe bangunan atas diidentifikasi dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.5",
              "Tipe bangunan bawah diidentifikasi dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.6",
              "Data bahan konstruksi jembatan diidentifikasi dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.7",
              "Data bentang jembatan lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.8",
              "Data tipe DAS (Daerah Aliran Sungai) lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.9",
              "Penomoran elemen jembatan sesuai pedoman",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.10",
              "Data telah diinput ke aplikasi INVI-J",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0007",
        "section": "F. VERIFIKASI KELENGKAPAN DATA PEMERIKSAAN DETAIL",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: F. VERIFIKASI KELENGKAPAN DATA PEMERIKSAAN DETAIL",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "F.1",
            "F.2",
            "F.3",
            "F.4",
            "F.5",
            "F.6",
            "F.7",
            "F.8",
            "F.9",
            "F.10"
          ],
          "source_rows": [
            [
              "F.1",
              "Semua elemen jembatan diperiksa secara menyeluruh",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.2",
              "Semua kerusakan teridentifikasi dan terdokumentasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.3",
              "Jenis kerusakan diklasifikasikan dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.4",
              "Lokasi kerusakan tercatat dengan jelas",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.5",
              "Dimensi kerusakan diukur dan dicatat dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.6",
              "Nilai kondisi (NK) ditetapkan dengan benar untuk setiap elemen",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.7",
              "Nilai kondisi (NK) ditetapkan dengan benar untuk setiap level (1-5)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.8",
              "Penilaian SRKFP (Struktur, Rasa Aman, Keselamatan, Fungsi, Pelayanan) ditetapkan dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.9",
              "Rekomendasi penanganan sesuai dengan tingkat kerusakan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.10",
              "Data telah diinput ke aplikasi INVI-J",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0008",
        "section": "G. VERIFIKASI KELENGKAPAN DATA PEMERIKSAAN RUTIN",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: G. VERIFIKASI KELENGKAPAN DATA PEMERIKSAAN RUTIN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "G.1",
            "G.2",
            "G.3",
            "G.4",
            "G.5",
            "G.6",
            "G.7",
            "G.8",
            "G.9",
            "G.10"
          ],
          "source_rows": [
            [
              "G.1",
              "Kondisi keamanan jembatan dievaluasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.2",
              "Kondisi keselamatan jembatan dievaluasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.3",
              "Kondisi kenyamanan jembatan dievaluasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.4",
              "Penanganan jembatan yang sedang berjalan didokumentasikan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.5",
              "Kondisi sosial kemasyarakatan di sekitar jembatan didokumentasikan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.6",
              "Perubahan kondisi dibandingkan pemeriksaan sebelumnya diidentifikasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.7",
              "Kebutuhan tindakan darurat diidentifikasi (jika ada)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.8",
              "Kebutuhan pemeriksaan khusus diidentifikasi (jika ada)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.9",
              "Kebutuhan perbaikan data inventarisasi diidentifikasi (jika ada)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.10",
              "Data telah diinput ke aplikasi INVI-J",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0009",
        "section": "H. VALIDASI KUALITAS DATA",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: H. VALIDASI KUALITAS DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "H.1",
            "H.2",
            "H.3",
            "H.4",
            "H.5",
            "H.6",
            "H.7",
            "H.8",
            "H.9",
            "H.10"
          ],
          "source_rows": [
            [
              "H.1",
              "Data yang dikumpulkan akurat dan sesuai kondisi lapangan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.2",
              "Nilai kondisi (NK) sesuai dengan bukti visual kerusakan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.3",
              "Hubungan NK antar level (1-5) konsisten dan logis",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.4",
              "Penilaian SRKFP sesuai dengan kerusakan yang teridentifikasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.5",
              "Data dimensi jembatan masuk akal dan konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.6",
              "Foto kerusakan jelas dan mampu menunjukkan kondisi sebenarnya",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.7",
              "Rekomendasi penanganan sesuai dengan tingkat kerusakan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.8",
              "Data konsisten dengan hasil pemeriksaan sebelumnya (jika ada)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.9",
              "Format data sesuai dengan ketentuan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.10",
              "Data bebas dari kesalahan input/typo",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0010",
        "section": "I. HASIL SAMPLING VERIFIKASI",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: I. HASIL SAMPLING VERIFIKASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Jembatan",
            "Elemen",
            "NK Pemeriksaan",
            "NK Verifikasi",
            "Selisih",
            "Status*"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0011",
        "section": "I. HASIL SAMPLING VERIFIKASI",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "*Status: Sesuai (selisih 0), Minor (selisih 1), Major (selisih >1)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0012",
        "section": "J. EVALUASI METODE PEMERIKSAAN",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: J. EVALUASI METODE PEMERIKSAAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "J.1",
            "J.2",
            "J.3",
            "J.4",
            "J.5",
            "J.6",
            "J.7",
            "J.8",
            "J.9",
            "J.10"
          ],
          "source_rows": [
            [
              "J.1",
              "Peralatan pemeriksaan digunakan dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.2",
              "Persiapan pemeriksaan dilakukan secara memadai",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.3",
              "Tim pemeriksaan mengikuti prosedur keselamatan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.4",
              "Akses untuk pemeriksaan memadai dan aman",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.5",
              "Alat bantu akses (tangga, perancah, dsb.) digunakan jika diperlukan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.6",
              "Kondisi saat pemeriksaan (cuaca, waktu, lalu lintas) sesuai",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.7",
              "Pengukuran dimensi kerusakan dilakukan dengan alat yang tepat",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.8",
              "Dokumentasi visual dilakukan dengan teknik yang tepat",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.9",
              "Aplikasi INVI-J digunakan dengan benar di lapangan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.10",
              "Koordinasi dengan pihak terkait dilakukan dengan baik",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0013",
        "section": "K. KENDALA DAN SOLUSI SELAMA PERIODE 2 MINGGUAN",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: K. KENDALA DAN SOLUSI SELAMA PERIODE 2 MINGGUAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Kendala",
            "Jembatan Terdampak",
            "Solusi yang Diterapkan",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0014",
        "section": "L. TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: L. TEMUAN DAN TINDAKAN PERBAIKAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Temuan",
            "Jembatan Terkait",
            "Dampak",
            "Tindakan Perbaikan",
            "PIC",
            "Target Penyelesaian"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0015",
        "section": "M. EVALUASI PROGRESS PEKERJAAN",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: M. EVALUASI PROGRESS PEKERJAAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Parameter",
            "Target",
            "Realisasi",
            "Persentase",
            "Keterangan"
          ],
          "row_labels": [
            "Jumlah jembatan inventarisasi s.d. periode sebelumnya",
            "Jumlah jembatan inventarisasi periode ini",
            "Jumlah jembatan detail s.d. periode sebelumnya",
            "Jumlah jembatan detail periode ini",
            "Jumlah jembatan rutin s.d. periode sebelumnya",
            "Jumlah jembatan rutin periode ini",
            "Jumlah jembatan khusus s.d. periode sebelumnya",
            "Jumlah jembatan khusus periode ini",
            "Total jembatan terperiksa s.d. saat ini",
            "Total jembatan target keseluruhan",
            "Sisa jembatan yang belum diperiksa"
          ],
          "source_rows": [
            [
              "Jumlah jembatan inventarisasi s.d. periode sebelumnya",
              "",
              "",
              "",
              ""
            ],
            [
              "Jumlah jembatan inventarisasi periode ini",
              "",
              "",
              "",
              ""
            ],
            [
              "Jumlah jembatan detail s.d. periode sebelumnya",
              "",
              "",
              "",
              ""
            ],
            [
              "Jumlah jembatan detail periode ini",
              "",
              "",
              "",
              ""
            ],
            [
              "Jumlah jembatan rutin s.d. periode sebelumnya",
              "",
              "",
              "",
              ""
            ],
            [
              "Jumlah jembatan rutin periode ini",
              "",
              "",
              "",
              ""
            ],
            [
              "Jumlah jembatan khusus s.d. periode sebelumnya",
              "",
              "",
              "",
              ""
            ],
            [
              "Jumlah jembatan khusus periode ini",
              "",
              "",
              "",
              ""
            ],
            [
              "Total jembatan terperiksa s.d. saat ini",
              "",
              "",
              "",
              ""
            ],
            [
              "Total jembatan target keseluruhan",
              "",
              "",
              "",
              ""
            ],
            [
              "Sisa jembatan yang belum diperiksa",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 11,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0016",
        "section": "N. ANALISIS STATISTIK PENILAIAN KONDISI",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: N. ANALISIS STATISTIK PENILAIAN KONDISI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Parameter",
            "Jumlah",
            "Persentase",
            "Keterangan"
          ],
          "row_labels": [
            "Jembatan dengan NK 0 (Tidak ada kerusakan)",
            "Jembatan dengan NK 1 (Rusak ringan)",
            "Jembatan dengan NK 2 (Rusak sedang)",
            "Jembatan dengan NK 3 (Rusak berat)",
            "Jembatan dengan NK 4 (Runtuh)",
            "Jembatan yang perlu tindakan darurat",
            "Jembatan yang perlu pemeriksaan khusus"
          ],
          "source_rows": [
            [
              "Jembatan dengan NK 0 (Tidak ada kerusakan)",
              "",
              "",
              ""
            ],
            [
              "Jembatan dengan NK 1 (Rusak ringan)",
              "",
              "",
              ""
            ],
            [
              "Jembatan dengan NK 2 (Rusak sedang)",
              "",
              "",
              ""
            ],
            [
              "Jembatan dengan NK 3 (Rusak berat)",
              "",
              "",
              ""
            ],
            [
              "Jembatan dengan NK 4 (Runtuh)",
              "",
              "",
              ""
            ],
            [
              "Jembatan yang perlu tindakan darurat",
              "",
              "",
              ""
            ],
            [
              "Jembatan yang perlu pemeriksaan khusus",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0017",
        "section": "O. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "O.1. Kesimpulan Verifikasi dan Validasi 2-Mingguan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0018",
        "section": "O. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: O. KESIMPULAN DAN REKOMENDASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Aspek",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "Ketercapaian Rencana",
            "Kelengkapan Dokumentasi",
            "Kelengkapan Data",
            "Kualitas Data",
            "Metode Pemeriksaan",
            "Penanganan Kendala",
            "Status Keseluruhan"
          ],
          "source_rows": [
            [
              "Ketercapaian Rencana",
              "☐ Sesuai Target ☐ Perlu Percepatan ☐ Tidak Sesuai Target",
              ""
            ],
            [
              "Kelengkapan Dokumentasi",
              "☐ Lengkap ☐ Perlu Perbaikan ☐ Tidak Lengkap",
              ""
            ],
            [
              "Kelengkapan Data",
              "☐ Lengkap ☐ Perlu Perbaikan ☐ Tidak Lengkap",
              ""
            ],
            [
              "Kualitas Data",
              "☐ Baik ☐ Perlu Perbaikan ☐ Kurang",
              ""
            ],
            [
              "Metode Pemeriksaan",
              "☐ Sesuai ☐ Perlu Perbaikan☐ Tidak Sesuai",
              ""
            ],
            [
              "Penanganan Kendala",
              "☐ Baik ☐ Perlu Perbaikan ☐ Kurang",
              ""
            ],
            [
              "Status Keseluruhan",
              "☐ Diterima ☐ Diterima dengan catatan ☐ Perlu perbaikan",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0019",
        "section": "O. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "O.2. Rekomendasi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0020",
        "section": "O. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "[Tuliskan rekomendasi untuk perbaikan atau peningkatan kualitas pemeriksaan jembatan untuk periode berikutnya]",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0021",
        "section": "P. RENCANA KERJA PERIODE BERIKUTNYA",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: P. RENCANA KERJA PERIODE BERIKUTNYA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Kegiatan",
            "Jumlah Jembatan",
            "Lokasi",
            "Target Selesai",
            "PIC"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0022",
        "section": "P. RENCANA KERJA PERIODE BERIKUTNYA",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "Q. PERSETUJUAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0023",
        "section": "P. RENCANA KERJA PERIODE BERIKUTNYA",
        "options": [],
        "required": false,
        "order": 23,
        "sourceOrder": 23,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: P. RENCANA KERJA PERIODE BERIKUTNYA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Jabatan",
            "Nama",
            "Tanda Tangan",
            "Tanggal"
          ],
          "row_labels": [
            "Perwakilan Penyedia Jasa",
            "Perwakilan Pengguna Jasa",
            "Koordinator Verifikasi",
            "Quality Control"
          ],
          "source_rows": [
            [
              "Perwakilan Penyedia Jasa",
              "",
              "",
              ""
            ],
            [
              "Perwakilan Pengguna Jasa",
              "",
              "",
              ""
            ],
            [
              "Koordinator Verifikasi",
              "",
              "",
              ""
            ],
            [
              "Quality Control",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0024",
        "section": "P. RENCANA KERJA PERIODE BERIKUTNYA",
        "options": [],
        "required": false,
        "order": 24,
        "sourceOrder": 24,
        "unit": "",
        "rule": {},
        "label": "LAMPIRAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0025",
        "section": "P. RENCANA KERJA PERIODE BERIKUTNYA",
        "options": [],
        "required": false,
        "order": 25,
        "sourceOrder": 25,
        "unit": "",
        "rule": {},
        "label": "Daftar jembatan yang diperiksa dalam periode 2 mingguan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0026",
        "section": "P. RENCANA KERJA PERIODE BERIKUTNYA",
        "options": [],
        "required": false,
        "order": 26,
        "sourceOrder": 26,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi foto representatif jembatan yang diperiksa",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0027",
        "section": "P. RENCANA KERJA PERIODE BERIKUTNYA",
        "options": [],
        "required": false,
        "order": 27,
        "sourceOrder": 27,
        "unit": "",
        "rule": {},
        "label": "Foto-foto kerusakan utama yang ditemukan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0028",
        "section": "P. RENCANA KERJA PERIODE BERIKUTNYA",
        "options": [],
        "required": false,
        "order": 28,
        "sourceOrder": 28,
        "unit": "",
        "rule": {},
        "label": "Log harian pemeriksaan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_PERIODIC14_0029",
        "section": "P. RENCANA KERJA PERIODE BERIKUTNYA",
        "options": [],
        "required": false,
        "order": 29,
        "sourceOrder": 29,
        "unit": "",
        "rule": {},
        "label": "Bukti penanganan kendala dan perbaikan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-14-jembatan-internal",
    "survey": "Jembatan",
    "phase": "internal",
    "items": [
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0001",
        "section": "A. INFORMASI UMUM",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. INFORMASI UMUM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Detail"
          ],
          "row_labels": [
            "Nama Proyek",
            "Nomor Kontrak",
            "Periode Verifikasi Internal",
            "Lokasi",
            "Tanggal Verifikasi",
            "Nama Petugas Verifikasi",
            "Jabatan",
            "Tim Penyedia Jasa"
          ],
          "source_rows": [
            [
              "Nama Proyek",
              ""
            ],
            [
              "Nomor Kontrak",
              ""
            ],
            [
              "Periode Verifikasi Internal",
              ""
            ],
            [
              "Lokasi",
              ""
            ],
            [
              "Tanggal Verifikasi",
              ""
            ],
            [
              "Nama Petugas Verifikasi",
              ""
            ],
            [
              "Jabatan",
              ""
            ],
            [
              "Tim Penyedia Jasa",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0002",
        "section": "B. INFORMASI JEMBATAN YANG DIVERIFIKASI",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. INFORMASI JEMBATAN YANG DIVERIFIKASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Detail"
          ],
          "row_labels": [
            "Nomor Jembatan",
            "Nama Jembatan",
            "Nomor Ruas Jalan",
            "Nama Ruas Jalan",
            "Koordinat Jembatan",
            "Panjang Jembatan",
            "Lebar Jembatan",
            "Jumlah Bentang",
            "Tipe Bangunan Atas",
            "Tahun Pembangunan",
            "Jenis Pemeriksaan",
            "Tim Pelaksana Survei",
            "Tanggal Pelaksanaan Survei"
          ],
          "source_rows": [
            [
              "Nomor Jembatan",
              ""
            ],
            [
              "Nama Jembatan",
              ""
            ],
            [
              "Nomor Ruas Jalan",
              ""
            ],
            [
              "Nama Ruas Jalan",
              ""
            ],
            [
              "Koordinat Jembatan",
              "Lintang: ______________ Bujur: ______________"
            ],
            [
              "Panjang Jembatan",
              ""
            ],
            [
              "Lebar Jembatan",
              ""
            ],
            [
              "Jumlah Bentang",
              ""
            ],
            [
              "Tipe Bangunan Atas",
              ""
            ],
            [
              "Tahun Pembangunan",
              ""
            ],
            [
              "Jenis Pemeriksaan",
              "□ Inventarisasi □ Detail □ Rutin □ Khusus"
            ],
            [
              "Tim Pelaksana Survei",
              ""
            ],
            [
              "Tanggal Pelaksanaan Survei",
              ""
            ]
          ],
          "table_rows": 13,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0003",
        "section": "C. VERIFIKASI KELENGKAPAN DATA JEMBATAN",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. VERIFIKASI KELENGKAPAN DATA JEMBATAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "C.1",
            "C.2",
            "C.3",
            "C.4",
            "C.5",
            "C.6",
            "C.7",
            "C.8",
            "C.9",
            "C.10",
            "C.11",
            "C.12"
          ],
          "source_rows": [
            [
              "C.1",
              "Data administrasi jembatan lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.2",
              "Koordinat lintang dan bujur dicatat dengan format yang benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.3",
              "Jenis bangunan atas teridentifikasi dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.4",
              "Jumlah bentang dan dimensi setiap bentang tercatat dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.5",
              "Lebar jembatan (termasuk trotoar) terukur dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.6",
              "Tinggi bangunan atas terukur dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.7",
              "Informasi tahun pembangunan tercatat",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.8",
              "Data bahan jembatan tercatat dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.9",
              "Informasi pemeliharaan/rehabilitasi sebelumnya tercatat",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.10",
              "Data lalu lintas tercatat",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.11",
              "Data batasan muatan jembatan tercatat",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "C.12",
              "Data tipe DAS (Daerah Aliran Sungai) tercatat",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 12,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0004",
        "section": "D. VERIFIKASI DOKUMENTASI VISUAL",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: D. VERIFIKASI DOKUMENTASI VISUAL",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "D.1",
            "D.2",
            "D.3",
            "D.4",
            "D.5",
            "D.6",
            "D.7",
            "D.8",
            "D.9",
            "D.10",
            "D.11",
            "D.12",
            "D.13",
            "D.14",
            "D.15"
          ],
          "source_rows": [
            [
              "D.1",
              "Foto papan nama jembatan tersedia dan jelas",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.2",
              "Foto tampak keseluruhan jembatan tersedia dan jelas",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.3",
              "Foto bangunan bawah tersedia dan jelas",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.4",
              "Foto sandaran tersedia dan jelas",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.5",
              "Foto landasan tersedia dan jelas",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.6",
              "Foto kendaraan yang melintas tersedia",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.7",
              "Foto tampak situasi sekitar jembatan tersedia",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.8",
              "Foto tampak masuk dan keluar jembatan tersedia",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.9",
              "Foto tampak atas tersedia (jika memungkinkan)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.10",
              "Foto tampak samping kiri dan kanan tersedia",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.11",
              "Foto seluruh kerusakan tersedia dan jelas",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.12",
              "Resolusi foto memadai untuk evaluasi kerusakan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.13",
              "Pencahayaan foto memadai untuk evaluasi kerusakan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.14",
              "Sudut pengambilan foto sesuai untuk menunjukkan kerusakan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "D.15",
              "Nama file foto terstruktur dan mengikuti format yang ditentukan",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 15,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0005",
        "section": "E. VERIFIKASI KELENGKAPAN DATA PEMERIKSAAN INVENTARISASI",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: E. VERIFIKASI KELENGKAPAN DATA PEMERIKSAAN INVENTARISASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "E.1",
            "E.2",
            "E.3",
            "E.4",
            "E.5",
            "E.6",
            "E.7",
            "E.8",
            "E.9",
            "E.10"
          ],
          "source_rows": [
            [
              "E.1",
              "Inventarisasi struktur utama/awal jembatan lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.2",
              "Inventarisasi struktur pelebaran jembatan lengkap (jika ada)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.3",
              "Data bahan jembatan pada masing-masing bentang lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.4",
              "Data tipe bangunan atas sesuai dengan pedoman kodifikasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.5",
              "Data tipe bangunan bawah sesuai dengan pedoman kodifikasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.6",
              "Data tipe perletakan sesuai dengan pedoman kodifikasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.7",
              "Data tipe ekspansi sesuai dengan pedoman kodifikasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.8",
              "Data tipe sandaran sesuai dengan pedoman kodifikasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.9",
              "Data kondisi geometrik jalan di atas jembatan lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "E.10",
              "Data kondisi alinyemen vertikal dan horizontal lengkap",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0006",
        "section": "F. VERIFIKASI KELENGKAPAN DATA PEMERIKSAAN DETAIL",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: F. VERIFIKASI KELENGKAPAN DATA PEMERIKSAAN DETAIL",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "F.1",
            "F.2",
            "F.3",
            "F.4",
            "F.5",
            "F.6",
            "F.7",
            "F.8",
            "F.9",
            "F.10",
            "F.11",
            "F.12",
            "F.13",
            "F.14",
            "F.15"
          ],
          "source_rows": [
            [
              "F.1",
              "Semua kerusakan pada elemen jembatan teridentifikasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.2",
              "Jenis kerusakan diklasifikasikan dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.3",
              "Lokasi kerusakan dicatat dengan jelas",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.4",
              "Dimensi kerusakan (panjang, lebar, kedalaman) terukur",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.5",
              "Volume kerusakan terukur",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.6",
              "Tingkat keparahan kerusakan dinilai dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.7",
              "Nilai kondisi (NK) elemen level 5 ditetapkan dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.8",
              "Nilai kondisi (NK) elemen utama level 4 ditetapkan dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.9",
              "Nilai kondisi (NK) komponen level 3 ditetapkan dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.10",
              "Nilai kondisi (NK) bentang level 2 ditetapkan dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.11",
              "Nilai kondisi (NK) jembatan level 1 ditetapkan dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.12",
              "Penilaian SRKFP (Struktur, Rasa Aman, Keselamatan, Fungsi, Pelayanan) ditetapkan dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.13",
              "Rekomendasi penanganan sesuai dengan tingkat kerusakan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.14",
              "Tindakan darurat diidentifikasi (jika diperlukan)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "F.15",
              "Kebutuhan pemeriksaan khusus diidentifikasi (jika diperlukan)",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 15,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0007",
        "section": "G. VERIFIKASI KELENGKAPAN DATA PEMERIKSAAN RUTIN",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: G. VERIFIKASI KELENGKAPAN DATA PEMERIKSAAN RUTIN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "G.1",
            "G.2",
            "G.3",
            "G.4",
            "G.5",
            "G.6",
            "G.7",
            "G.8",
            "G.9",
            "G.10"
          ],
          "source_rows": [
            [
              "G.1",
              "Kondisi keamanan jembatan dievaluasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.2",
              "Kondisi keselamatan jembatan dievaluasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.3",
              "Kondisi kenyamanan jembatan dievaluasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.4",
              "Penanganan jembatan yang sedang berjalan dicatat",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.5",
              "Kondisi sosial kemasyarakatan di sekitar jembatan dicatat",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.6",
              "Perubahan kondisi jembatan dibandingkan dengan pemeriksaan sebelumnya diidentifikasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.7",
              "Tindakan darurat diidentifikasi (jika diperlukan)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.8",
              "Kebutuhan pemeriksaan khusus diidentifikasi (jika diperlukan)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.9",
              "Kebutuhan perbaikan data inventarisasi diidentifikasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "G.10",
              "Kebutuhan perbaikan data pemeriksaan detail diidentifikasi",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0008",
        "section": "H. VERIFIKASI KELENGKAPAN DATA PEMERIKSAAN KHUSUS (JIKA DILAKUKAN)",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: H. VERIFIKASI KELENGKAPAN DATA PEMERIKSAAN KHUSUS (JIKA DILAKUKAN)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "H.1",
            "H.2",
            "H.3",
            "H.4",
            "H.5",
            "H.6",
            "H.7",
            "H.8",
            "H.9",
            "H.10"
          ],
          "source_rows": [
            [
              "H.1",
              "Analisa bahan elemen-elemen jembatan dilakukan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.2",
              "Evaluasi kondisi elemen jembatan dilakukan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.3",
              "Evaluasi respon struktur komponen jembatan dilakukan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.4",
              "Dimensi kerusakan yang tidak teridentifikasi melalui pemeriksaan detail diukur",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.5",
              "Pengujian material dilakukan (jika diperlukan)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.6",
              "Pengujian kekuatan struktur dilakukan (jika diperlukan)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.7",
              "Pengujian dinamik dilakukan (jika diperlukan)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.8",
              "Analisis kebutuhan rehabilitasi dilakukan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.9",
              "Analisis kebutuhan penggantian dilakukan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "H.10",
              "Analisis kebutuhan tindakan darurat dilakukan",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0009",
        "section": "I. VALIDASI KEWAJARAN DATA",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: I. VALIDASI KEWAJARAN DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "I.1",
            "I.2",
            "I.3",
            "I.4",
            "I.5",
            "I.6",
            "I.7",
            "I.8",
            "I.9",
            "I.10"
          ],
          "source_rows": [
            [
              "I.1",
              "Nilai kondisi (NK) sesuai dengan kondisi visual jembatan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.2",
              "Ukuran dimensi jembatan masuk akal dan konsisten",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.3",
              "Hubungan NK antar level (1-5) konsisten dan logis",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.4",
              "Penilaian SRKFP sesuai dengan kerusakan yang teridentifikasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.5",
              "Jenis kerusakan sesuai dengan jenis bahan dan elemen",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.6",
              "Volume kerusakan masuk akal dan sesuai dengan bukti visual",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.7",
              "Rekomendasi penanganan sesuai dengan tingkat kerusakan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.8",
              "Perkiraan tahun pembangunan masuk akal dengan tipe struktur",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.9",
              "Data bahan jembatan sesuai dengan bukti visual",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "I.10",
              "Koordinat jembatan sesuai dengan lokasi sebenarnya",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0010",
        "section": "J. VALIDASI KONSISTENSI DATA",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: J. VALIDASI KONSISTENSI DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "J.1",
            "J.2",
            "J.3",
            "J.4",
            "J.5",
            "J.6",
            "J.7",
            "J.8",
            "J.9",
            "J.10"
          ],
          "source_rows": [
            [
              "J.1",
              "Data konsisten antara formulir dan sistem INVI-J",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.2",
              "Nilai kondisi (NK) konsisten antar elemen sejenis",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.3",
              "Penilaian SRKFP konsisten antar elemen sejenis",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.4",
              "Data konsisten dengan hasil pemeriksaan sebelumnya (jika ada)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.5",
              "Penomoran elemen konsisten dengan pedoman",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.6",
              "Klasifikasi kerusakan konsisten dengan pedoman",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.7",
              "Dokumentasi visual konsisten dengan data tertulis",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.8",
              "Rekomendasi penanganan konsisten dengan nilai kondisi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.9",
              "Klasifikasi tipe bangunan konsisten dengan pedoman kodifikasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "J.10",
              "Penulisan nama dan nomor jembatan konsisten dengan data pokok",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0011",
        "section": "K. VALIDASI FORMAT DATA",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: K. VALIDASI FORMAT DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "K.1",
            "K.2",
            "K.3",
            "K.4",
            "K.5",
            "K.6",
            "K.7",
            "K.8",
            "K.9",
            "K.10"
          ],
          "source_rows": [
            [
              "K.1",
              "Format data sesuai dengan ketentuan INVI-J",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "K.2",
              "Koordinat dalam format desimal yang benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "K.3",
              "Satuan pengukuran sesuai dengan standar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "K.4",
              "Struktur data konsisten dan terorganisir",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "K.5",
              "Format foto sesuai ketentuan (resolusi, ukuran file)",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "K.6",
              "Penamaan file foto sesuai dengan ketentuan",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "K.7",
              "Metadata foto terisi dengan benar",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "K.8",
              "Format laporan sesuai dengan template",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "K.9",
              "Kode elemen sesuai dengan pedoman kodifikasi",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "K.10",
              "Kode jenis kerusakan sesuai dengan pedoman kodifikasi",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0012",
        "section": "L. VERIFIKASI PENGUNGGAHAN DATA KE SISTEM",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: L. VERIFIKASI PENGUNGGAHAN DATA KE SISTEM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Keterangan"
          ],
          "row_labels": [
            "L.1",
            "L.2",
            "L.3",
            "L.4",
            "L.5",
            "L.6",
            "L.7",
            "L.8",
            "L.9",
            "L.10"
          ],
          "source_rows": [
            [
              "L.1",
              "Data berhasil diunggah ke aplikasi INVI-J",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "L.2",
              "Semua foto kerusakan berhasil diunggah",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "L.3",
              "Semua informasi terkait berhasil diunggah",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "L.4",
              "Koordinat jembatan terpetakan dengan benar di sistem",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "L.5",
              "Status pemeriksaan terupdate di sistem",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "L.6",
              "Semua elemen jembatan terdaftar di sistem",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "L.7",
              "Semua kerusakan tercatat di sistem",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "L.8",
              "Nilai kondisi (NK) tercatat di sistem",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "L.9",
              "Penilaian SRKFP tercatat di sistem",
              "☐",
              "☐",
              "☐",
              ""
            ],
            [
              "L.10",
              "Rekomendasi penanganan tercatat di sistem",
              "☐",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0013",
        "section": "M. ANALISIS KERUSAKAN STRUKTURAL",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: M. ANALISIS KERUSAKAN STRUKTURAL",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Komponen",
            "Elemen",
            "Jenis Kerusakan",
            "NK",
            "Bukti Visual",
            "Status Validasi"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0014",
        "section": "N. TEMUAN DAN PERBAIKAN YANG DIPERLUKAN",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: N. TEMUAN DAN PERBAIKAN YANG DIPERLUKAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Temuan",
            "Elemen Terkait",
            "Dampak",
            "Perbaikan yang Diperlukan",
            "Target Selesai"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0015",
        "section": "O. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "O.1. Kesimpulan Verifikasi dan Validasi Internal",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0016",
        "section": "O. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: O. KESIMPULAN DAN REKOMENDASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Aspek",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "Kelengkapan Data Jembatan",
            "Dokumentasi Visual",
            "Kelengkapan Data Pemeriksaan",
            "Kewajaran Data",
            "Konsistensi Data",
            "Format Data",
            "Pengunggahan Data"
          ],
          "source_rows": [
            [
              "Kelengkapan Data Jembatan",
              "☐ Lengkap ☐ Perlu Perbaikan ☐ Tidak Lengkap",
              ""
            ],
            [
              "Dokumentasi Visual",
              "☐ Memadai ☐ Perlu Perbaikan ☐ Tidak Memadai",
              ""
            ],
            [
              "Kelengkapan Data Pemeriksaan",
              "☐ Lengkap ☐ Perlu Perbaikan ☐ Tidak Lengkap",
              ""
            ],
            [
              "Kewajaran Data",
              "☐ Wajar ☐ Perlu Perbaikan ☐ Tidak Wajar",
              ""
            ],
            [
              "Konsistensi Data",
              "☐ Konsisten ☐ Perlu Perbaikan ☐ Tidak Konsisten",
              ""
            ],
            [
              "Format Data",
              "☐ Sesuai ☐ Perlu Perbaikan ☐ Tidak Sesuai",
              ""
            ],
            [
              "Pengunggahan Data",
              "☐ Berhasil ☐ Perlu Perbaikan ☐ Gagal",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0017",
        "section": "O. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "O.2. Status Data Jembatan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0018",
        "section": "O. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "□ Disetujui untuk penyerahan ke Pengguna Jasa□ Disetujui dengan perbaikan minor□ Perlu perbaikan dan verifikasi ulang□ Ditolak, perlu survei ulang",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0019",
        "section": "O. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "O.3. Rekomendasi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0020",
        "section": "O. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "[Tuliskan rekomendasi untuk perbaikan atau tindak lanjut berdasarkan hasil verifikasi dan validasi internal]",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0021",
        "section": "P. PERSETUJUAN INTERNAL",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: P. PERSETUJUAN INTERNAL",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Jabatan",
            "Nama",
            "Tanda Tangan",
            "Tanggal"
          ],
          "row_labels": [
            "Petugas Verifikasi",
            "Ketua Tim Penyedia Jasa",
            "Ahli Teknik Jembatan",
            "Quality Control"
          ],
          "source_rows": [
            [
              "Petugas Verifikasi",
              "",
              "",
              ""
            ],
            [
              "Ketua Tim Penyedia Jasa",
              "",
              "",
              ""
            ],
            [
              "Ahli Teknik Jembatan",
              "",
              "",
              ""
            ],
            [
              "Quality Control",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0022",
        "section": "P. PERSETUJUAN INTERNAL",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "LAMPIRAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0023",
        "section": "P. PERSETUJUAN INTERNAL",
        "options": [],
        "required": false,
        "order": 23,
        "sourceOrder": 23,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi foto jembatan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0024",
        "section": "P. PERSETUJUAN INTERNAL",
        "options": [],
        "required": false,
        "order": 24,
        "sourceOrder": 24,
        "unit": "",
        "rule": {},
        "label": "Foto-foto kerusakan utama",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0025",
        "section": "P. PERSETUJUAN INTERNAL",
        "options": [],
        "required": false,
        "order": 25,
        "sourceOrder": 25,
        "unit": "",
        "rule": {},
        "label": "Sketsa lokasi kerusakan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0026",
        "section": "P. PERSETUJUAN INTERNAL",
        "options": [],
        "required": false,
        "order": 26,
        "sourceOrder": 26,
        "unit": "",
        "rule": {},
        "label": "Catatan pemeriksaan lapangan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_JEMBATAN_INTERNAL_0027",
        "section": "P. PERSETUJUAN INTERNAL",
        "options": [],
        "required": false,
        "order": 27,
        "sourceOrder": 27,
        "unit": "",
        "rule": {},
        "label": "Hasil validasi data di sistem INVI-J",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-15-pci-ai-consistency",
    "survey": "PCI AI",
    "phase": "consistency",
    "items": [
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0001",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "CHECKLIST KONSISTENSI SURVEI PCI BERBASIS AI",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0002",
        "section": "I. INFORMASI UMUM",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: I. INFORMASI UMUM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Uraian",
            "Keterangan"
          ],
          "row_labels": [
            "Nama/Judul Kegiatan",
            "Nomor Kontrak",
            "Waktu Pelaksanaan",
            "Nama Penyedia Jasa",
            "Lokasi Ruas Jalan",
            "Nomor Ruas",
            "Panjang Ruas (km)",
            "Periode Evaluasi Konsistensi",
            "Nama Petugas Evaluasi"
          ],
          "source_rows": [
            [
              "Nama/Judul Kegiatan",
              ""
            ],
            [
              "Nomor Kontrak",
              ""
            ],
            [
              "Waktu Pelaksanaan",
              ""
            ],
            [
              "Nama Penyedia Jasa",
              ""
            ],
            [
              "Lokasi Ruas Jalan",
              ""
            ],
            [
              "Nomor Ruas",
              ""
            ],
            [
              "Panjang Ruas (km)",
              ""
            ],
            [
              "Periode Evaluasi Konsistensi",
              ""
            ],
            [
              "Nama Petugas Evaluasi",
              ""
            ]
          ],
          "table_rows": 9,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0003",
        "section": "A. Konsistensi Perangkat",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Konsistensi Perangkat",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6"
          ],
          "source_rows": [
            [
              "1",
              "Smartphone yang digunakan konsisten dan sesuai spesifikasi minimal",
              "",
              "",
              ""
            ],
            [
              "2",
              "Penyangga smartphone (mount holder) dipasang pada posisi yang sama",
              "",
              "",
              ""
            ],
            [
              "3",
              "Posisi smartphone pada penyangga konsisten untuk setiap sesi perekaman",
              "",
              "",
              ""
            ],
            [
              "4",
              "Sudut kamera konsisten (70% area jalan) untuk setiap sesi perekaman",
              "",
              "",
              ""
            ],
            [
              "5",
              "Penggunaan pendingin smartphone konsisten untuk mencegah overheating",
              "",
              "",
              ""
            ],
            [
              "6",
              "Kondisi kaca depan kendaraan tetap bersih dan bebas dari penghalang",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0004",
        "section": "B. Konsistensi Metode Akuisisi",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Konsistensi Metode Akuisisi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8"
          ],
          "source_rows": [
            [
              "1",
              "Versi aplikasi smartphone konsisten selama seluruh periode survei",
              "",
              "",
              ""
            ],
            [
              "2",
              "Kecepatan kendaraan konsisten (maksimum 60 km/jam)",
              "",
              "",
              ""
            ],
            [
              "3",
              "Posisi kendaraan konsisten (tetap pada lajur yang sama)",
              "",
              "",
              ""
            ],
            [
              "4",
              "Pengambilan video selalu dimulai dari titik awal lajur dan diakhiri di titik akhir lajur",
              "",
              "",
              ""
            ],
            [
              "5",
              "Pengambilan data hanya dilakukan pada kondisi cuaca cerah dengan permukaan jalan kering",
              "",
              "",
              ""
            ],
            [
              "6",
              "Pengambilan data tidak dilakukan saat menghadap matahari",
              "",
              "",
              ""
            ],
            [
              "7",
              "Durasi rekaman konsisten (maksimal 30-60 menit per sesi)",
              "",
              "",
              ""
            ],
            [
              "8",
              "Proses unggah video ke cloud server dilakukan secara konsisten",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0005",
        "section": "A. Konsistensi Proses Pengolahan",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Konsistensi Proses Pengolahan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Model AI yang digunakan konsisten selama seluruh periode survei",
              "",
              "",
              ""
            ],
            [
              "2",
              "Parameter pemrosesan model AI konsisten untuk semua data",
              "",
              "",
              ""
            ],
            [
              "3",
              "Pengolahan data dilakukan tanpa intervensi manual dalam proses pemrosesan",
              "",
              "",
              ""
            ],
            [
              "4",
              "Waktu pengolahan data konsisten (±10%) untuk panjang ruas yang sebanding",
              "",
              "",
              ""
            ],
            [
              "5",
              "Pengolahan data dilakukan segera setelah video diunggah (maksimal 24 jam)",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0006",
        "section": "B. Konsistensi Format Data Hasil",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Konsistensi Format Data Hasil",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Format data output konsisten untuk semua hasil pengolahan",
              "",
              "",
              ""
            ],
            [
              "2",
              "Interval pelaporan nilai PCI konsisten (setiap 50 meter)",
              "",
              "",
              ""
            ],
            [
              "3",
              "Informasi koordinat (longitude/latitude) konsisten untuk semua deteksi kerusakan",
              "",
              "",
              ""
            ],
            [
              "4",
              "Informasi dimensi kerusakan konsisten dalam satuan pengukuran",
              "",
              "",
              ""
            ],
            [
              "5",
              "Metadata hasil pengolahan konsisten untuk semua data",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0007",
        "section": "A. Uji Konsistensi Berkala",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Uji Konsistensi Berkala",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Uji konsistensi dilakukan setiap 14 hari pada ruas referensi",
              "",
              "",
              ""
            ],
            [
              "2",
              "Panjang ruas referensi minimal 5 km",
              "",
              "",
              ""
            ],
            [
              "3",
              "Ruas referensi direkam sebanyak 3 kali untuk menguji konsistensi",
              "",
              "",
              ""
            ],
            [
              "4",
              "Hasil pengolahan dari 3 kali perekaman menunjukkan konsistensi tinggi (CV ≤ 5%)",
              "",
              "",
              ""
            ],
            [
              "5",
              "Dokumentasi hasil uji konsistensi tersedia dan lengkap",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0008",
        "section": "B. Evaluasi Stabilitas Deteksi",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Evaluasi Stabilitas Deteksi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Deteksi jenis kerusakan konsisten pada lokasi yang sama",
              "",
              "",
              ""
            ],
            [
              "2",
              "Deteksi dimensi kerusakan konsisten pada lokasi yang sama (variasi ≤ 10%)",
              "",
              "",
              ""
            ],
            [
              "3",
              "Nilai PCI konsisten pada segmen yang sama (variasi ≤ 5%)",
              "",
              "",
              ""
            ],
            [
              "4",
              "Tidak ada perubahan signifikan pada deteksi kerusakan tanpa adanya perubahan kondisi jalan",
              "",
              "",
              ""
            ],
            [
              "5",
              "Konsistensi deteksi terjaga pada berbagai kondisi pencahayaan (pagi/siang)",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0009",
        "section": "A. Verifikasi Internal (Penyedia Jasa)",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Verifikasi Internal (Penyedia Jasa)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Dilakukan verifikasi konsistensi internal pada minimal 10% dari total data",
              "",
              "",
              ""
            ],
            [
              "2",
              "Verifikasi dilakukan dengan membandingkan hasil dari beberapa kali pengambilan data",
              "",
              "",
              ""
            ],
            [
              "3",
              "Koefisien variasi hasil verifikasi internal ≤ 5%",
              "",
              "",
              ""
            ],
            [
              "4",
              "Dilakukan dokumentasi lengkap hasil verifikasi konsistensi internal",
              "",
              "",
              ""
            ],
            [
              "5",
              "Hasil verifikasi konsistensi internal memenuhi standar yang ditetapkan",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0010",
        "section": "B. Verifikasi Eksternal (Pengguna Jasa)",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Verifikasi Eksternal (Pengguna Jasa)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Dilakukan verifikasi konsistensi oleh Pengguna Jasa pada minimal 5% dari total data",
              "",
              "",
              ""
            ],
            [
              "2",
              "Verifikasi dilakukan dengan membandingkan hasil AI dengan penilaian visual manual",
              "",
              "",
              ""
            ],
            [
              "3",
              "Perbedaan nilai PCI hasil verifikasi ≤ 10 poin",
              "",
              "",
              ""
            ],
            [
              "4",
              "Dilakukan dokumentasi lengkap hasil verifikasi konsistensi eksternal",
              "",
              "",
              ""
            ],
            [
              "5",
              "Hasil verifikasi konsistensi eksternal memenuhi standar yang ditetapkan",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0011",
        "section": "A. Analisis Konsistensi Per Jenis Kerusakan",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Analisis Konsistensi Per Jenis Kerusakan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Jenis Kerusakan",
            "Konsistensi Deteksi (%)",
            "Standar (≥90%)",
            "Keterangan"
          ],
          "row_labels": [
            "Perkerasan Lentur",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12",
            "Perkerasan Kaku",
            "13",
            "14",
            "15",
            "16",
            "17",
            "18",
            "19",
            "20",
            "21",
            "22",
            "23",
            "24"
          ],
          "source_rows": [
            [
              "Perkerasan Lentur",
              "",
              "",
              "",
              ""
            ],
            [
              "1",
              "Retak Buaya (Crocodile Cracking)",
              "",
              "≥90%",
              ""
            ],
            [
              "2",
              "Retak Tepi (Edge Cracking)",
              "",
              "≥90%",
              ""
            ],
            [
              "3",
              "Retak Melintang (Transverse Cracking)",
              "",
              "≥90%",
              ""
            ],
            [
              "4",
              "Retak lainnya (Other Cracking)",
              "",
              "≥90%",
              ""
            ],
            [
              "5",
              "Lubang (Pothole)",
              "",
              "≥90%",
              ""
            ],
            [
              "6",
              "Tambalan (Patching)",
              "",
              "≥90%",
              ""
            ],
            [
              "7",
              "Alur (Rutting)",
              "",
              "≥90%",
              ""
            ],
            [
              "8",
              "Keriting (Corrugations)",
              "",
              "≥90%",
              ""
            ],
            [
              "9",
              "Sungkur/Amblas (Shoving/Depression)",
              "",
              "≥90%",
              ""
            ],
            [
              "10",
              "Pelapukan/Pelepasan Butir (Weathering/Ravelling)",
              "",
              "≥90%",
              ""
            ],
            [
              "11",
              "Kegemukan/Licin (Bleeding/Slippery Surface)",
              "",
              "≥90%",
              ""
            ],
            [
              "12",
              "Penurunan Bahu (Drop off)",
              "",
              "≥90%",
              ""
            ],
            [
              "Perkerasan Kaku",
              "",
              "",
              "",
              ""
            ],
            [
              "13",
              "Retak Sudut (Corner Break)",
              "",
              "≥90%",
              ""
            ],
            [
              "14",
              "Pemisahan Panel (Divided Slab)",
              "",
              "≥90%",
              ""
            ],
            [
              "15",
              "Penanggaan (Faulting)",
              "",
              "≥90%",
              ""
            ],
            [
              "16",
              "Retak Linear (Linear Cracking)",
              "",
              "≥90%",
              ""
            ],
            [
              "17",
              "Panel Pecah (Punched Out)",
              "",
              "≥90%",
              ""
            ],
            [
              "18",
              "Retak Susut/Lainnya (Shrinkage/Other Cracking)",
              "",
              "≥90%",
              ""
            ],
            [
              "19",
              "Pemompaan (Pumping)",
              "",
              "≥90%",
              ""
            ],
            [
              "20",
              "Gompal Sudut (Spalling Corner)",
              "",
              "≥90%",
              ""
            ],
            [
              "21",
              "Gompal Sambungan (Spalling Join)",
              "",
              "≥90%",
              ""
            ],
            [
              "22",
              "Tambalan (Patching)",
              "",
              "≥90%",
              ""
            ],
            [
              "23",
              "Kerusakan Bahan Penyumbat (Joint Seal)",
              "",
              "≥90%",
              ""
            ],
            [
              "24",
              "Penurunan Lajur/Bahu (Drop Off)",
              "",
              "≥90%",
              ""
            ]
          ],
          "table_rows": 26,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0012",
        "section": "B. Analisis Konsistensi Dimensi Kerusakan",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Analisis Konsistensi Dimensi Kerusakan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Dimensi",
            "Konsistensi Pengukuran (%)",
            "Standar (≥85%)",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3"
          ],
          "source_rows": [
            [
              "1",
              "Luas (m²)",
              "",
              "≥85%",
              ""
            ],
            [
              "2",
              "Panjang (m)",
              "",
              "≥85%",
              ""
            ],
            [
              "3",
              "Kedalaman (mm)",
              "",
              "≥85%",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0013",
        "section": "C. Analisis Konsistensi Klasifikasi Kerusakan",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. Analisis Konsistensi Klasifikasi Kerusakan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Parameter",
            "Konsistensi Klasifikasi (%)",
            "Standar (≥90%)",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3"
          ],
          "source_rows": [
            [
              "1",
              "Klasifikasi tingkat keparahan rendah",
              "",
              "≥90%",
              ""
            ],
            [
              "2",
              "Klasifikasi tingkat keparahan sedang",
              "",
              "≥90%",
              ""
            ],
            [
              "3",
              "Klasifikasi tingkat keparahan tinggi",
              "",
              "≥90%",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0014",
        "section": "A. Identifikasi Faktor Penyebab Inkonsistensi",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Identifikasi Faktor Penyebab Inkonsistensi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Faktor Penyebab",
            "Dampak",
            "Solusi"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0015",
        "section": "B. Implementasi Tindakan Koreksi",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Implementasi Tindakan Koreksi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Tindakan Koreksi",
            "Status Implementasi",
            "Hasil",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0016",
        "section": "A. Hasil Uji Konsistensi pada Ruas Referensi",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Hasil Uji Konsistensi pada Ruas Referensi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Tanggal Uji",
            "Lokasi Ruas",
            "Panjang (km)",
            "CV Deteksi (%)",
            "CV Nilai PCI (%)",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0017",
        "section": "B. Dokumentasi Visual",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Dokumentasi Visual",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uji Ke-",
            "Tangkapan Layar/Foto",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3"
          ],
          "source_rows": [
            [
              "1",
              "1",
              "[Tambahkan gambar/foto]",
              ""
            ],
            [
              "2",
              "2",
              "[Tambahkan gambar/foto]",
              ""
            ],
            [
              "3",
              "3",
              "[Tambahkan gambar/foto]",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0018",
        "section": "A. Kesimpulan Hasil Uji Konsistensi",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "[Tuliskan kesimpulan dari hasil evaluasi konsistensi survei PCI berbasis AI]",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0019",
        "section": "B. Rekomendasi untuk Peningkatan Konsistensi",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "[Tuliskan rekomendasi untuk meningkatkan konsistensi pada survei PCI berbasis AI]",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0020",
        "section": "B. Rekomendasi untuk Peningkatan Konsistensi",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "BERITA ACARA UJI KONSISTENSI",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0021",
        "section": "B. Rekomendasi untuk Peningkatan Konsistensi",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Pada hari ini ............... tanggal ............... bulan ............... tahun ............... telah dilakukan uji konsistensi terhadap survei PCI berbasis AI pada kegiatan ............... dengan hasil sebagaimana tercantum dalam dokumen ini.",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0022",
        "section": "B. Rekomendasi untuk Peningkatan Konsistensi",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "Berdasarkan hasil uji konsistensi tersebut, maka disimpulkan bahwa hasil survei PCI berbasis AI MEMENUHI / TIDAK MEMENUHI standar konsistensi yang dipersyaratkan.",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_CONSISTENCY_0023",
        "section": "B. Rekomendasi untuk Peningkatan Konsistensi",
        "options": [],
        "required": false,
        "order": 23,
        "sourceOrder": 23,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Rekomendasi untuk Peningkatan Konsistensi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Pihak",
            "Penyedia Jasa",
            "Pengguna Jasa",
            "Direktorat"
          ],
          "row_labels": [
            "Nama",
            "Jabatan",
            "Tanda Tangan",
            "Tanggal"
          ],
          "source_rows": [
            [
              "Nama",
              "",
              "",
              ""
            ],
            [
              "Jabatan",
              "",
              "",
              ""
            ],
            [
              "Tanda Tangan",
              "",
              "",
              ""
            ],
            [
              "Tanggal",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-16-pci-ai-periodic14",
    "survey": "PCI AI",
    "phase": "periodic14",
    "items": [
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0001",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "CHECKLIST VERIFIKASI DAN VALIDASI 2-MINGGUAN SURVEI PCI BERBASIS AI",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0002",
        "section": "I. INFORMASI UMUM",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: I. INFORMASI UMUM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Uraian",
            "Keterangan"
          ],
          "row_labels": [
            "Nama/Judul Kegiatan",
            "Nomor Kontrak",
            "Periode Verifikasi & Validasi",
            "Nama Penyedia Jasa",
            "Petugas Verifikasi & Validasi",
            "Lokasi Ruas Jalan Sampling",
            "Nomor Ruas",
            "Panjang Ruas Sampling (km)",
            "Nomor Dokumen"
          ],
          "source_rows": [
            [
              "Nama/Judul Kegiatan",
              ""
            ],
            [
              "Nomor Kontrak",
              ""
            ],
            [
              "Periode Verifikasi & Validasi",
              "//_____ s.d. //_____"
            ],
            [
              "Nama Penyedia Jasa",
              ""
            ],
            [
              "Petugas Verifikasi & Validasi",
              ""
            ],
            [
              "Lokasi Ruas Jalan Sampling",
              ""
            ],
            [
              "Nomor Ruas",
              ""
            ],
            [
              "Panjang Ruas Sampling (km)",
              ""
            ],
            [
              "Nomor Dokumen",
              "VV-2W-PCI-AI///___"
            ]
          ],
          "table_rows": 9,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0003",
        "section": "A. Status Tindak Lanjut Temuan Sebelumnya",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Status Tindak Lanjut Temuan Sebelumnya",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Temuan Periode Sebelumnya",
            "Tindak Lanjut yang Disarankan",
            "Status Penyelesaian",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "☐ Selesai ☐ Belum Selesai",
              ""
            ],
            [
              "2",
              "",
              "",
              "☐ Selesai ☐ Belum Selesai",
              ""
            ],
            [
              "3",
              "",
              "",
              "☐ Selesai ☐ Belum Selesai",
              ""
            ],
            [
              "4",
              "",
              "",
              "☐ Selesai ☐ Belum Selesai",
              ""
            ],
            [
              "5",
              "",
              "",
              "☐ Selesai ☐ Belum Selesai",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0004",
        "section": "B. Perkembangan Tindakan Perbaikan",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Perkembangan Tindakan Perbaikan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Tindakan Perbaikan",
            "Perkembangan",
            "Target Penyelesaian",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "☐ On Track ☐ Delayed ☐ Completed"
            ],
            [
              "2",
              "",
              "",
              "",
              "☐ On Track ☐ Delayed ☐ Completed"
            ],
            [
              "3",
              "",
              "",
              "",
              "☐ On Track ☐ Delayed ☐ Completed"
            ],
            [
              "4",
              "",
              "",
              "",
              "☐ On Track ☐ Delayed ☐ Completed"
            ],
            [
              "5",
              "",
              "",
              "",
              "☐ On Track ☐ Delayed ☐ Completed"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0005",
        "section": "A. Pemeriksaan Rutin Perangkat",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Pemeriksaan Rutin Perangkat",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7"
          ],
          "source_rows": [
            [
              "1",
              "Smartphone dalam kondisi optimal (baterai, kamera, storage)",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Penyangga smartphone (mount holder) dalam kondisi baik",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Pendingin smartphone (cooling fan) berfungsi dengan baik",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Kaca kendaraan tetap bersih dan bebas jamur",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Sumber daya tambahan (power bank/car charger) berfungsi",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "6",
              "Paket data/WiFi tersedia dengan kuota yang mencukupi",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "7",
              "Aplikasi smartphone tetap dalam versi terbaru",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0006",
        "section": "B. Pemeriksaan Kalibrasi",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Pemeriksaan Kalibrasi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Kalibrasi groundtruth dimensi dilakukan ulang",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Boundary box disesuaikan ulang",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Sudut kamera dioptimalkan kembali untuk AOI",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Hasil kalibrasi ulang dokumentasikan dan disimpan",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Hasil kalibrasi sesuai dengan standar",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0007",
        "section": "A. Uji Konsistensi 2-Mingguan",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Uji Konsistensi 2-Mingguan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Ruas jalan sampling dengan panjang minimal 5 km telah ditentukan",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Pengambilan data ulang dilakukan pada ruas sampling",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Pengambilan data dilakukan sebanyak 3 kali pada ruas yang sama",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Pengolahan data oleh model AI telah selesai",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Hasil pengolahan dari 3 kali pengambilan data dibandingkan",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0008",
        "section": "B. Hasil Uji Konsistensi",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Hasil Uji Konsistensi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Parameter",
            "Hasil Uji 1",
            "Hasil Uji 2",
            "Hasil Uji 3",
            "CV (%)",
            "Standar (≤5%)",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6"
          ],
          "source_rows": [
            [
              "1",
              "Rata-rata nilai PCI",
              "",
              "",
              "",
              "",
              "≤5%",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "2",
              "Jumlah total kerusakan terdeteksi",
              "",
              "",
              "",
              "",
              "≤5%",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "3",
              "Total luas kerusakan (m²)",
              "",
              "",
              "",
              "",
              "≤5%",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "4",
              "Rata-rata precision",
              "",
              "",
              "",
              "",
              "≤5%",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "5",
              "Rata-rata recall",
              "",
              "",
              "",
              "",
              "≤5%",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "6",
              "F1 Score",
              "",
              "",
              "",
              "",
              "≤5%",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0009",
        "section": "A. Progres Pengambilan Data",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Progres Pengambilan Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Periode Sebelumnya",
            "Periode Ini",
            "Total",
            "Target",
            "% Progres"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Jumlah ruas jalan",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "Panjang ruas jalan (km)",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "Jumlah lajur-km",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "Durasi video yang direkam (jam)",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "Ukuran data video (GB)",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0010",
        "section": "B. Progres Pengolahan Data",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Progres Pengolahan Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Periode Sebelumnya",
            "Periode Ini",
            "Total",
            "Target",
            "% Progres"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Jumlah ruas jalan yang diproses",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "Panjang ruas jalan yang diproses (km)",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "Jumlah lajur-km yang diproses",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "Jumlah segmen 50m yang dianalisis",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "Jumlah kerusakan yang terdeteksi",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0011",
        "section": "C. Kesesuaian dengan Jadwal",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. Kesesuaian dengan Jadwal",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Progres pengambilan data sesuai jadwal",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Progres pengolahan data sesuai jadwal",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Progres verifikasi internal sesuai jadwal",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Progres pengunggahan data sesuai jadwal",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Target pengambilan data periode berikutnya realistis",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0012",
        "section": "A. Sampling Acak Data",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Sampling Acak Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Sampel acak minimal 10% dari data periode ini telah dipilih",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Sampel mencakup minimal 3 ruas jalan berbeda",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Sampel mewakili berbagai tipe perkerasan (lentur/kaku)",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Sampel mewakili berbagai kondisi jalan (baik/sedang/rusak)",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Sampel mencakup lokasi dengan kerusakan bervariasi",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0013",
        "section": "B. Validasi Sampling oleh Tim QA/QC",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Validasi Sampling oleh Tim QA/QC",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Video sampel diverifikasi kualitasnya",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Hasil deteksi kerusakan diverifikasi akurasinya",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Perhitungan nilai PCI diverifikasi",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Koordinat lokasi kerusakan diverifikasi",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Kategori kondisi jalan diverifikasi",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0014",
        "section": "C. Hasil Validasi Sampling",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. Hasil Validasi Sampling",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Parameter",
            "Nilai",
            "Standar",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6"
          ],
          "source_rows": [
            [
              "1",
              "Precision sampel",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "2",
              "Recall sampel",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "3",
              "F1 Score sampel",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "4",
              "Akurasi dimensi kerusakan",
              "",
              "≥ 85%",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "5",
              "Akurasi klasifikasi kerusakan",
              "",
              "≥ 90%",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "6",
              "Akurasi nilai PCI",
              "",
              "± 10 poin",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0015",
        "section": "A. Evaluasi Performa Model AI",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Evaluasi Performa Model AI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Parameter",
            "Nilai Periode Sebelumnya",
            "Nilai Periode Ini",
            "Perubahan (%)",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Precision rata-rata",
              "",
              "",
              "",
              "☐ Membaik ☐ Stabil ☐ Menurun"
            ],
            [
              "2",
              "Recall rata-rata",
              "",
              "",
              "",
              "☐ Membaik ☐ Stabil ☐ Menurun"
            ],
            [
              "3",
              "F1 Score rata-rata",
              "",
              "",
              "",
              "☐ Membaik ☐ Stabil ☐ Menurun"
            ],
            [
              "4",
              "mAP",
              "",
              "",
              "",
              "☐ Membaik ☐ Stabil ☐ Menurun"
            ],
            [
              "5",
              "Rata-rata waktu pemrosesan per km",
              "",
              "",
              "",
              "☐ Membaik ☐ Stabil ☐ Menurun"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0016",
        "section": "B. Evaluasi per Jenis Kerusakan (Top 5 Jenis Kerusakan Terdeteksi)",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Evaluasi per Jenis Kerusakan (Top 5 Jenis Kerusakan Terdeteksi)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Jenis Kerusakan",
            "Jumlah Deteksi",
            "F1 Score",
            "Standar",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "2",
              "",
              "",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "3",
              "",
              "",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "4",
              "",
              "",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "5",
              "",
              "",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0017",
        "section": "C. Identifikasi Pola Kesalahan",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. Identifikasi Pola Kesalahan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Jenis Kesalahan",
            "Frekuensi",
            "Pola/Kondisi",
            "Potensi Penyebab",
            "Solusi yang Diusulkan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "False Positive",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "False Negative",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "Kesalahan Klasifikasi",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "Kesalahan Dimensi",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "Kesalahan Perhitungan PCI",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0018",
        "section": "A. Kelengkapan Data",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Kelengkapan Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Data video semua ruas telah diunggah ke cloud",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Semua data video telah diproses oleh model AI",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Data hasil pengolahan telah diformat sesuai standar",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Metadata lengkap untuk semua data",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Backup data tersedia",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0019",
        "section": "B. Kesiapan Format Data untuk SMD Jalan",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Kesiapan Format Data untuk SMD Jalan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6"
          ],
          "source_rows": [
            [
              "1",
              "Format data sesuai standar Ditjen Bina Marga",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Data terstruktur sesuai kebutuhan SMD Jalan",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Semua field terisi lengkap",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Tidak ada data yang duplikat",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Koordinat dan referensi lokasi akurat",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "6",
              "Link video di YouTube tersedia dan berfungsi",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0020",
        "section": "C. Uji Coba Pengunggahan",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. Uji Coba Pengunggahan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Uji coba pengunggahan data ke SMD Jalan telah dilakukan",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Tidak ada error selama uji coba pengunggahan",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Format data diterima oleh sistem SMD Jalan",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Data dapat ditampilkan dengan benar di SMD Jalan",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Validasi otomatis SMD Jalan berhasil dilewati",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0021",
        "section": "A. Temuan Utama",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Temuan Utama",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Jenis Temuan",
            "Deskripsi",
            "Dampak",
            "Tingkat Keparahan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "☐ Rendah ☐ Sedang ☐ Tinggi"
            ],
            [
              "2",
              "",
              "",
              "",
              "☐ Rendah ☐ Sedang ☐ Tinggi"
            ],
            [
              "3",
              "",
              "",
              "",
              "☐ Rendah ☐ Sedang ☐ Tinggi"
            ],
            [
              "4",
              "",
              "",
              "",
              "☐ Rendah ☐ Sedang ☐ Tinggi"
            ],
            [
              "5",
              "",
              "",
              "",
              "☐ Rendah ☐ Sedang ☐ Tinggi"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0022",
        "section": "B. Rekomendasi Tindakan Perbaikan",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Rekomendasi Tindakan Perbaikan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Temuan Terkait",
            "Rekomendasi",
            "Prioritas",
            "Target Penyelesaian"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "☐ Rendah ☐ Sedang ☐ Tinggi",
              ""
            ],
            [
              "2",
              "",
              "",
              "☐ Rendah ☐ Sedang ☐ Tinggi",
              ""
            ],
            [
              "3",
              "",
              "",
              "☐ Rendah ☐ Sedang ☐ Tinggi",
              ""
            ],
            [
              "4",
              "",
              "",
              "☐ Rendah ☐ Sedang ☐ Tinggi",
              ""
            ],
            [
              "5",
              "",
              "",
              "☐ Rendah ☐ Sedang ☐ Tinggi",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0023",
        "section": "A. Ringkasan Status",
        "options": [],
        "required": false,
        "order": 23,
        "sourceOrder": 23,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Ringkasan Status",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Aspek",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7"
          ],
          "source_rows": [
            [
              "1",
              "Status Tindak Lanjut Periode Sebelumnya",
              "☐ Baik ☐ Perlu Perhatian",
              ""
            ],
            [
              "2",
              "Kondisi Perangkat",
              "☐ Baik ☐ Perlu Perhatian",
              ""
            ],
            [
              "3",
              "Hasil Uji Konsistensi",
              "☐ Baik ☐ Perlu Perhatian",
              ""
            ],
            [
              "4",
              "Progres Survei",
              "☐ Baik ☐ Perlu Perhatian",
              ""
            ],
            [
              "5",
              "Hasil Validasi Sampling",
              "☐ Baik ☐ Perlu Perhatian",
              ""
            ],
            [
              "6",
              "Kinerja Model AI",
              "☐ Baik ☐ Perlu Perhatian",
              ""
            ],
            [
              "7",
              "Kesiapan Data untuk Pengunggahan",
              "☐ Baik ☐ Perlu Perhatian",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0024",
        "section": "B. Hasil Verifikasi dan Validasi 2-Mingguan",
        "options": [],
        "required": false,
        "order": 24,
        "sourceOrder": 24,
        "unit": "",
        "rule": {},
        "label": "☐ DITERIMA - Seluruh aspek memenuhi standar yang ditetapkan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0025",
        "section": "B. Hasil Verifikasi dan Validasi 2-Mingguan",
        "options": [],
        "required": false,
        "order": 25,
        "sourceOrder": 25,
        "unit": "",
        "rule": {},
        "label": "☐ DITERIMA DENGAN CATATAN - Terdapat aspek yang perlu diperbaiki namun tidak signifikan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0026",
        "section": "B. Hasil Verifikasi dan Validasi 2-Mingguan",
        "options": [],
        "required": false,
        "order": 26,
        "sourceOrder": 26,
        "unit": "",
        "rule": {},
        "label": "☐ TIDAK DITERIMA - Terdapat aspek kritis yang tidak memenuhi standar",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0027",
        "section": "C. Catatan Tambahan",
        "options": [],
        "required": false,
        "order": 27,
        "sourceOrder": 27,
        "unit": "",
        "rule": {},
        "label": "BERITA ACARA VERIFIKASI DAN VALIDASI 2-MINGGUAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0028",
        "section": "C. Catatan Tambahan",
        "options": [],
        "required": false,
        "order": 28,
        "sourceOrder": 28,
        "unit": "",
        "rule": {},
        "label": "Pada hari ini ........................ tanggal ........................... bulan ........................... tahun .................., telah dilakukan verifikasi dan validasi 2-mingguan terhadap survei PCI berbasis AI pada kegiatan ............................................................ untuk periode ........................... s.d. ...........................",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0029",
        "section": "C. Catatan Tambahan",
        "options": [],
        "required": false,
        "order": 29,
        "sourceOrder": 29,
        "unit": "",
        "rule": {},
        "label": "Berdasarkan hasil verifikasi dan validasi 2-mingguan tersebut, maka disimpulkan bahwa hasil survei PCI berbasis AI untuk periode ini DITERIMA / DITERIMA DENGAN CATATAN / TIDAK DITERIMA.",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_PERIODIC14_0030",
        "section": "C. Catatan Tambahan",
        "options": [],
        "required": false,
        "order": 30,
        "sourceOrder": 30,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. Catatan Tambahan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Pihak",
            "Penyedia Jasa",
            "Pengguna Jasa"
          ],
          "row_labels": [
            "Nama",
            "Jabatan",
            "Tanda Tangan",
            "Tanggal"
          ],
          "source_rows": [
            [
              "Nama",
              "",
              ""
            ],
            [
              "Jabatan",
              "",
              ""
            ],
            [
              "Tanda Tangan",
              "",
              ""
            ],
            [
              "Tanggal",
              "",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-17-pci-ai-internal",
    "survey": "PCI AI",
    "phase": "internal",
    "items": [
      {
        "code": "DOCX_PCI_AI_INTERNAL_0001",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "CHECKLIST VERIFIKASI DAN VALIDASI INTERNAL SURVEI PCI BERBASIS AI",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0002",
        "section": "I. INFORMASI UMUM",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: I. INFORMASI UMUM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Uraian",
            "Keterangan"
          ],
          "row_labels": [
            "Nama/Judul Kegiatan",
            "Nomor Kontrak",
            "Waktu Pelaksanaan",
            "Nama Penyedia Jasa",
            "Lokasi Ruas Jalan",
            "Nomor Ruas",
            "Panjang Ruas (km)",
            "Tanggal Verifikasi & Validasi",
            "Nama Petugas Verifikasi",
            "Nomor Dokumen"
          ],
          "source_rows": [
            [
              "Nama/Judul Kegiatan",
              ""
            ],
            [
              "Nomor Kontrak",
              ""
            ],
            [
              "Waktu Pelaksanaan",
              ""
            ],
            [
              "Nama Penyedia Jasa",
              ""
            ],
            [
              "Lokasi Ruas Jalan",
              ""
            ],
            [
              "Nomor Ruas",
              ""
            ],
            [
              "Panjang Ruas (km)",
              ""
            ],
            [
              "Tanggal Verifikasi & Validasi",
              ""
            ],
            [
              "Nama Petugas Verifikasi",
              ""
            ],
            [
              "Nomor Dokumen",
              "VV-PCI-AI///___"
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0003",
        "section": "A. Verifikasi Perangkat Pengambilan Data",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Verifikasi Perangkat Pengambilan Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8"
          ],
          "source_rows": [
            [
              "1",
              "Smartphone memenuhi spesifikasi minimal (RAM 8GB, storage 150GB, kamera 12MP)",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Kondisi smartphone dalam keadaan baik (baterai, kamera, storage)",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Penyangga smartphone (mount holder) terpasang dengan benar",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Pendingin smartphone (cooling fan) berfungsi dengan baik",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Kaca kendaraan dalam keadaan bersih dan bebas jamur",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "6",
              "Dashboard kendaraan berwarna gelap atau ditutupi kain gelap",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "7",
              "Tersedia sumber daya tambahan (power bank/car charger)",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "8",
              "Tersedia paket data/WiFi dengan kuota yang mencukupi",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0004",
        "section": "B. Verifikasi Aplikasi Smartphone",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Verifikasi Aplikasi Smartphone",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7"
          ],
          "source_rows": [
            [
              "1",
              "Aplikasi smartphone terinstall dengan benar",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Versi aplikasi merupakan versi terbaru",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Aplikasi dapat berjalan tanpa error",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Fitur akuisisi video berfungsi dengan baik",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Fitur kalibrasi mandiri berfungsi dengan baik",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "6",
              "Boundary box untuk penyesuaian sudut kamera berfungsi",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "7",
              "Fitur unggah video ke cloud server berfungsi dengan baik",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0005",
        "section": "C. Verifikasi Kondisi Lingkungan",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. Verifikasi Kondisi Lingkungan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Kondisi cuaca cerah, tidak hujan",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Permukaan jalan dalam keadaan kering",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Arah pergerakan kendaraan tidak menghadap sinar matahari",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Kondisi lalu lintas memungkinkan untuk menjalankan kendaraan dengan stabil",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Tidak ada kendala akses ke lokasi pengambilan data",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0006",
        "section": "A. Persiapan Pengambilan Data",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Persiapan Pengambilan Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6"
          ],
          "source_rows": [
            [
              "1",
              "Personil telah mendapatkan pelatihan penggunaan aplikasi",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Pre-test aplikasi telah dilakukan sebelum survei",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Input informasi ruas jalan dilakukan dengan benar",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Kalibrasi dimensi groundtruth telah dilakukan",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Penyesuaian boundary box untuk sudut kamera telah dilakukan",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "6",
              "Komposisi pengambilan gambar (70% objek jalan) telah diatur",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0007",
        "section": "B. Proses Pengambilan Data",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Proses Pengambilan Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6"
          ],
          "source_rows": [
            [
              "1",
              "Smartphone mulai merekam saat berada di awal lajur",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Kecepatan kendaraan terjaga stabil (maksimum 60 km/jam)",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Kendaraan tetap pada lajur yang sama selama perekaman",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Perekaman tidak ada gangguan (jeda/pause)",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Smartphone berhenti merekam saat berada di akhir lajur",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "6",
              "Durasi rekaman tidak melebihi 60 menit per sesi",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0008",
        "section": "C. Pengunggahan dan Penyimpanan Data",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. Pengunggahan dan Penyimpanan Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Video berhasil diunggah ke cloud server",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Proses unggah dilakukan segera setelah perekaman",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Video tersimpan dengan informasi metadata yang lengkap",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Backup data tersedia sebagai antisipasi kegagalan unggah",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Kapasitas penyimpanan masih mencukupi untuk sesi berikutnya",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0009",
        "section": "A. Kualitas Visual",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Kualitas Visual",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7"
          ],
          "source_rows": [
            [
              "1",
              "Resolusi video minimal 4K (3840 x 2160 piksel)",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Frame rate minimal 60fps",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Gambar jelas dan tidak blur",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Tidak ada debu/kotoran/jamur pada lensa kamera",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Tidak ada pantulan dasbor pada kaca depan",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "6",
              "Tidak ada bayangan yang mengganggu pandangan",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "7",
              "Area of Interest (AOI) berbentuk trapesium terlihat jelas",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0010",
        "section": "B. Stabilitas Video",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Stabilitas Video",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Video tidak bergoyang/stabil",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Tidak ada guncangan keras yang mengganggu kualitas video",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Permukaan jalan terlihat jelas dan stabil",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Fitur stabilisasi gambar pada kamera berfungsi dengan baik",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Tidak ada frame yang hilang (drop frame)",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0011",
        "section": "C. Kelengkapan Cakupan",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. Kelengkapan Cakupan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Video mencakup seluruh panjang ruas yang disurvei",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Seluruh lebar lajur terlihat dalam video",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Bahu jalan terlihat dalam video",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Tidak ada segmen yang terlewatkan",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Metadata GPS terekam dengan benar dan lengkap",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0012",
        "section": "A. Proses Pengolahan",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Proses Pengolahan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Video berhasil diproses oleh model AI",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Waktu pemrosesan sesuai standar (≤24 jam)",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Tidak ada error selama pemrosesan",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Log pemrosesan lengkap dan jelas",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Pengolahan dilakukan tanpa intervensi manual",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0013",
        "section": "B. Validasi Deteksi Kerusakan",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Validasi Deteksi Kerusakan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6"
          ],
          "source_rows": [
            [
              "1",
              "Model AI mendeteksi semua jenis kerusakan yang terlihat",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Tidak ada kerusakan yang terlewatkan (false negative)",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Tidak ada deteksi yang salah (false positive)",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Klasifikasi jenis kerusakan akurat",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Batas-batas area kerusakan terdeteksi dengan akurat",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "6",
              "Tingkat keparahan kerusakan terklasifikasi dengan tepat",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0014",
        "section": "C. Validasi Pengukuran Dimensi",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. Validasi Pengukuran Dimensi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Luas kerusakan (m²) terukur dengan akurat",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Panjang kerusakan (m) terukur dengan akurat",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Kedalaman kerusakan (mm) terukur dengan akurat",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Dimensi kerusakan terukur sesuai dengan groundtruth",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Nilai PCI per 50 meter dihitung dengan benar",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0015",
        "section": "A. Validasi Sampling Internal",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Validasi Sampling Internal",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Parameter",
            "Nilai",
            "Standar Minimal",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Precision",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "2",
              "Recall",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "3",
              "F1 Score",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "4",
              "Average Precision (AP)",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "5",
              "Mean Average Precision (mAP)",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0016",
        "section": "B. Validasi Per Jenis Kerusakan",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Validasi Per Jenis Kerusakan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Jenis Kerusakan",
            "F1 Score",
            "Standar",
            "Status"
          ],
          "row_labels": [
            "Perkerasan Lentur",
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12",
            "Perkerasan Kaku",
            "13",
            "14",
            "15",
            "..."
          ],
          "source_rows": [
            [
              "Perkerasan Lentur",
              "",
              "",
              "",
              ""
            ],
            [
              "1",
              "Retak Buaya (Crocodile Cracking)",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "2",
              "Retak Tepi (Edge Cracking)",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "3",
              "Retak Melintang (Transverse Cracking)",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "4",
              "Retak lainnya (Other Cracking)",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "5",
              "Lubang (Pothole)",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "6",
              "Tambalan (Patching)",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "7",
              "Alur (Rutting)",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "8",
              "Keriting (Corrugations)",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "9",
              "Sungkur/Amblas (Shoving/Depression)",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "10",
              "Pelapukan/Pelepasan Butir (Weathering/Ravelling)",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "11",
              "Kegemukan/Licin (Bleeding/Slippery Surface)",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "12",
              "Penurunan Bahu (Drop off)",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "Perkerasan Kaku",
              "",
              "",
              "",
              ""
            ],
            [
              "13",
              "Retak Sudut (Corner Break)",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "14",
              "Pemisahan Panel (Divided Slab)",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "15",
              "Penanggaan (Faulting)",
              "",
              "≥ 0,9",
              "☐ Memenuhi ☐ Tidak Memenuhi"
            ],
            [
              "...",
              "[dan seterusnya untuk jenis kerusakan lainnya]",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 18,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0017",
        "section": "C. Validasi Hasil PCI",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. Validasi Hasil PCI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Nilai PCI dihitung setiap 50 meter",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Nilai PCI sesuai dengan jenis dan tingkat kerusakan yang terdeteksi",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Nilai PCI konsisten dengan kondisi visual jalan",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Rentang nilai PCI sesuai dengan standar (0-100)",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Kategori kondisi jalan (baik/sedang/rusak ringan/rusak berat) sesuai",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0018",
        "section": "A. Format Data",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Format Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Format data output sesuai standar Ditjen Bina Marga",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Struktur data lengkap dan terorganisir",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Semua field terisi dengan benar",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Koordinat lokasi (longitude/latitude) tercatat dengan benar",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Metadata lengkap (tanggal pengambilan, ruas, operator, dll.)",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0019",
        "section": "B. Kelengkapan Data",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Kelengkapan Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Seluruh ruas jalan terekam dan terproses",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Seluruh jenis kerusakan tercatat",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Semua segmen 50 meter memiliki nilai PCI",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Informasi dimensi kerusakan lengkap",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Kondisi bahu jalan tercatat",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0020",
        "section": "C. Validasi Data",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. Validasi Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Tidak ada data duplikat",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Tidak ada data yang hilang",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Tidak ada nilai anomali (outlier)",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Tidak ada inkonsistensi data",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Data dapat diintegrasikan dengan Sistem Masukan Data Jalan",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0021",
        "section": "A. Temuan Masalah dan Solusi",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Temuan Masalah dan Solusi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Temuan",
            "Kategori",
            "Solusi",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "☐ Selesai ☐ Belum Selesai"
            ],
            [
              "2",
              "",
              "",
              "",
              "☐ Selesai ☐ Belum Selesai"
            ],
            [
              "3",
              "",
              "",
              "",
              "☐ Selesai ☐ Belum Selesai"
            ],
            [
              "4",
              "",
              "",
              "",
              "☐ Selesai ☐ Belum Selesai"
            ],
            [
              "5",
              "",
              "",
              "",
              "☐ Selesai ☐ Belum Selesai"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0022",
        "section": "B. Tindak Lanjut",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. Tindak Lanjut",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Uraian",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "Perlu pengambilan data ulang",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "2",
              "Perlu perbaikan metode pengambilan data",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "3",
              "Perlu perbaikan model AI",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "4",
              "Perlu pelabelan manual tambahan",
              "☐ Ya ☐ Tidak",
              ""
            ],
            [
              "5",
              "Perlu perbaikan aplikasi",
              "☐ Ya ☐ Tidak",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0023",
        "section": "A. Ringkasan Hasil",
        "options": [],
        "required": false,
        "order": 23,
        "sourceOrder": 23,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. Ringkasan Hasil",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Aspek",
            "Status",
            "Keterangan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6"
          ],
          "source_rows": [
            [
              "1",
              "Perangkat dan Lingkungan",
              "☐ Baik ☐ Perlu Perbaikan",
              ""
            ],
            [
              "2",
              "Prosedur Pengambilan Data",
              "☐ Baik ☐ Perlu Perbaikan",
              ""
            ],
            [
              "3",
              "Kualitas Data Video",
              "☐ Baik ☐ Perlu Perbaikan",
              ""
            ],
            [
              "4",
              "Pengolahan Data AI",
              "☐ Baik ☐ Perlu Perbaikan",
              ""
            ],
            [
              "5",
              "Hasil dan Metrik Model AI",
              "☐ Baik ☐ Perlu Perbaikan",
              ""
            ],
            [
              "6",
              "Output Data",
              "☐ Baik ☐ Perlu Perbaikan",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0024",
        "section": "B. Hasil Verifikasi dan Validasi Internal",
        "options": [],
        "required": false,
        "order": 24,
        "sourceOrder": 24,
        "unit": "",
        "rule": {},
        "label": "☐ DITERIMA - Seluruh aspek memenuhi standar yang ditetapkan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0025",
        "section": "B. Hasil Verifikasi dan Validasi Internal",
        "options": [],
        "required": false,
        "order": 25,
        "sourceOrder": 25,
        "unit": "",
        "rule": {},
        "label": "☐ DITERIMA DENGAN CATATAN - Terdapat aspek yang perlu diperbaiki namun tidak signifikan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0026",
        "section": "B. Hasil Verifikasi dan Validasi Internal",
        "options": [],
        "required": false,
        "order": 26,
        "sourceOrder": 26,
        "unit": "",
        "rule": {},
        "label": "☐ TIDAK DITERIMA - Terdapat aspek kritis yang tidak memenuhi standar",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0027",
        "section": "C. Catatan Tambahan",
        "options": [],
        "required": false,
        "order": 27,
        "sourceOrder": 27,
        "unit": "",
        "rule": {},
        "label": "BERITA ACARA VERIFIKASI DAN VALIDASI INTERNAL",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0028",
        "section": "C. Catatan Tambahan",
        "options": [],
        "required": false,
        "order": 28,
        "sourceOrder": 28,
        "unit": "",
        "rule": {},
        "label": "Pada hari ini ........................ tanggal ........................... bulan ........................... tahun .................., telah dilakukan verifikasi dan validasi internal terhadap survei PCI berbasis AI pada kegiatan ............................................................",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0029",
        "section": "C. Catatan Tambahan",
        "options": [],
        "required": false,
        "order": 29,
        "sourceOrder": 29,
        "unit": "",
        "rule": {},
        "label": "Berdasarkan hasil verifikasi dan validasi internal tersebut, maka disimpulkan bahwa hasil survei PCI berbasis AI DITERIMA / DITERIMA DENGAN CATATAN / TIDAK DITERIMA.",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0030",
        "section": "C. Catatan Tambahan",
        "options": [],
        "required": false,
        "order": 30,
        "sourceOrder": 30,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. Catatan Tambahan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Pihak",
            "Tim QA/QC",
            "Manajer Teknis",
            "Pimpinan Proyek"
          ],
          "row_labels": [
            "Nama",
            "Jabatan",
            "Tanda Tangan",
            "Tanggal"
          ],
          "source_rows": [
            [
              "Nama",
              "",
              "",
              ""
            ],
            [
              "Jabatan",
              "",
              "",
              ""
            ],
            [
              "Tanda Tangan",
              "",
              "",
              ""
            ],
            [
              "Tanggal",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_AI_INTERNAL_0031",
        "section": "C. Catatan Tambahan",
        "options": [],
        "required": false,
        "order": 31,
        "sourceOrder": 31,
        "unit": "",
        "rule": {},
        "label": ".",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-18-pci-manual-consistency",
    "survey": "PCI Manual",
    "phase": "consistency",
    "items": [
      {
        "code": "DOCX_PCI_MANUAL_CONSISTENCY_0001",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "Nomor Dokumen: QA/QC-PCI-002Tanggal Pengujian: _________________Lokasi Uji Konsistensi: _________________Panjang Segmen Uji: _________________ km",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_CONSISTENCY_0002",
        "section": "A. INFORMASI PENGUJIAN",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. INFORMASI PENGUJIAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Data Pengujian",
            "Keterangan"
          ],
          "row_labels": [
            "Frekuensi Pengujian",
            "Tanggal Pengujian Sebelumnya",
            "Tanggal Pengujian Saat Ini",
            "Kode Ruas Jalan",
            "Nama Ruas Jalan",
            "Segmen Pengujian (STA)",
            "Tim Penilai yang Diuji"
          ],
          "source_rows": [
            [
              "Frekuensi Pengujian",
              "□ 14 Hari Sekali □ Lainnya: _____________"
            ],
            [
              "Tanggal Pengujian Sebelumnya",
              "_________________"
            ],
            [
              "Tanggal Pengujian Saat Ini",
              "_________________"
            ],
            [
              "Kode Ruas Jalan",
              "_________________"
            ],
            [
              "Nama Ruas Jalan",
              "_________________"
            ],
            [
              "Segmen Pengujian (STA)",
              "_________________ s/d _________________"
            ],
            [
              "Tim Penilai yang Diuji",
              "_________________"
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_CONSISTENCY_0003",
        "section": "B. KONDISI PENGUJIAN",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. KONDISI PENGUJIAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6"
          ],
          "source_rows": [
            [
              "1",
              "Cuaca cerah dan permukaan jalan kering",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "2",
              "Kondisi pencahayaan baik",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "3",
              "Lalu lintas normal (tidak macet)",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "4",
              "Peralatan survei dalam kondisi baik",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "5",
              "Segmen jalan yang sama dengan pengujian sebelumnya",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "6",
              "Penilai tidak mengetahui hasil penilaian sebelumnya",
              "□ Ya □ Tidak",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_CONSISTENCY_0004",
        "section": "1. Perbandingan Nilai PCI Rata-rata",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Perbandingan Nilai PCI Rata-rata",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Segmen",
            "Nilai PCI Penilaian Awal",
            "Nilai PCI Penilaian Ulang",
            "Selisih",
            "% Perbedaan",
            "Status (≤10%)"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "Rata-rata"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Rata-rata",
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_CONSISTENCY_0005",
        "section": "2. Konsistensi Identifikasi Jenis Kerusakan",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Konsistensi Identifikasi Jenis Kerusakan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Jenis Kerusakan",
            "Jumlah Teridentifikasi (Awal)",
            "Jumlah Teridentifikasi (Ulang)",
            "% Konsistensi",
            "Status (≥85%)"
          ],
          "row_labels": [
            "Retak Buaya (Crocodile Cracking)",
            "Retak Tepi (Edge Cracking)",
            "Retak Melintang (Transverse Cracking)",
            "Retak lainnya (Other Cracking)",
            "Lubang (Pothole)",
            "Tambalan (Patching)",
            "Alur (Rutting)",
            "Keriting (Corrugations)",
            "Sungkur/Amblas (Shoving/Depression)",
            "Pelapukan/Pelepasan Butir",
            "Kegemukan/Licin",
            "Penurunan Bahu (Drop off)",
            "Rata-rata Konsistensi"
          ],
          "source_rows": [
            [
              "Retak Buaya (Crocodile Cracking)",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Retak Tepi (Edge Cracking)",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Retak Melintang (Transverse Cracking)",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Retak lainnya (Other Cracking)",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Lubang (Pothole)",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Tambalan (Patching)",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Alur (Rutting)",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Keriting (Corrugations)",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Sungkur/Amblas (Shoving/Depression)",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Pelapukan/Pelepasan Butir",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Kegemukan/Licin",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Penurunan Bahu (Drop off)",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Rata-rata Konsistensi",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ]
          ],
          "table_rows": 13,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_CONSISTENCY_0006",
        "section": "3. Konsistensi Penilaian Tingkat Keparahan",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Konsistensi Penilaian Tingkat Keparahan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Tingkat Keparahan",
            "Jumlah Teridentifikasi (Awal)",
            "Jumlah Teridentifikasi (Ulang)",
            "% Konsistensi",
            "Status (≥85%)"
          ],
          "row_labels": [
            "Ringan (Low)",
            "Sedang (Medium)",
            "Parah (High)",
            "Rata-rata Konsistensi"
          ],
          "source_rows": [
            [
              "Ringan (Low)",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Sedang (Medium)",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Parah (High)",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Rata-rata Konsistensi",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_CONSISTENCY_0007",
        "section": "4. Konsistensi Pengukuran Dimensi Kerusakan",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 4. Konsistensi Pengukuran Dimensi Kerusakan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Parameter Dimensi",
            "Pengukuran Awal (Rata-rata)",
            "Pengukuran Ulang (Rata-rata)",
            "% Perbedaan",
            "Status (≤15%)"
          ],
          "row_labels": [
            "Luas Kerusakan (m²)",
            "Panjang Kerusakan (m)",
            "Kedalaman Kerusakan (mm)",
            "Rata-rata"
          ],
          "source_rows": [
            [
              "Luas Kerusakan (m²)",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Panjang Kerusakan (m)",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Kedalaman Kerusakan (mm)",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Rata-rata",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_CONSISTENCY_0008",
        "section": "D. ANALISIS STATISTIK KONSISTENSI",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: D. ANALISIS STATISTIK KONSISTENSI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Parameter Statistik",
            "Nilai",
            "Batas Penerimaan",
            "Status"
          ],
          "row_labels": [
            "Standar Deviasi PCI",
            "Koefisien Variasi (CV)",
            "Koefisien Korelasi (R²)",
            "Indeks Kappa (Antar Penilai)"
          ],
          "source_rows": [
            [
              "Standar Deviasi PCI",
              "",
              "≤ 5",
              "□ Ya □ Tidak"
            ],
            [
              "Koefisien Variasi (CV)",
              "",
              "≤ 10%",
              "□ Ya □ Tidak"
            ],
            [
              "Koefisien Korelasi (R²)",
              "",
              "≥ 0.85",
              "□ Ya □ Tidak"
            ],
            [
              "Indeks Kappa (Antar Penilai)",
              "",
              "≥ 0.70",
              "□ Ya □ Tidak"
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_CONSISTENCY_0009",
        "section": "E. EVALUASI KHUSUS PENILAI",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: E. EVALUASI KHUSUS PENILAI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Nama Penilai",
            "Tingkat Konsistensi (%)",
            "Evaluasi",
            "Rekomendasi"
          ],
          "row_labels": [
            "",
            "",
            "",
            ""
          ],
          "source_rows": [
            [
              "",
              "",
              "□ Baik □ Cukup □ Kurang",
              ""
            ],
            [
              "",
              "",
              "□ Baik □ Cukup □ Kurang",
              ""
            ],
            [
              "",
              "",
              "□ Baik □ Cukup □ Kurang",
              ""
            ],
            [
              "",
              "",
              "□ Baik □ Cukup □ Kurang",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_CONSISTENCY_0010",
        "section": "F. HASIL PENGUJIAN KONSISTENSI",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Kesimpulan: □ Hasil Konsisten (semua parameter memenuhi batas penerimaan) □ Hasil Kurang Konsisten (ada parameter yang tidak memenuhi, tetapi masih dalam batas toleransi) □ Hasil Tidak Konsisten (banyak parameter yang tidak memenuhi batas penerimaan)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_CONSISTENCY_0011",
        "section": "F. HASIL PENGUJIAN KONSISTENSI",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Rekomendasi Tindak Lanjut: □ Data Dapat Diterima □ Perlu Penilaian Ulang Sebagian Segmen □ Perlu Penilaian Ulang Seluruh Segmen □ Perlu Pelatihan Ulang Personil Penilai □ Lainnya: ______________________________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_CONSISTENCY_0012",
        "section": "F. HASIL PENGUJIAN KONSISTENSI",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Catatan Pengujian:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_CONSISTENCY_0013",
        "section": "F. HASIL PENGUJIAN KONSISTENSI",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Petugas Pengujian Konsistensi:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_CONSISTENCY_0014",
        "section": "F. HASIL PENGUJIAN KONSISTENSI",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Nama: _________________Jabatan: _________________Tanda tangan: _________________Tanggal: _________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_CONSISTENCY_0015",
        "section": "F. HASIL PENGUJIAN KONSISTENSI",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Diverifikasi oleh:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_CONSISTENCY_0016",
        "section": "F. HASIL PENGUJIAN KONSISTENSI",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Nama: _________________Jabatan: _________________Tanda tangan: _________________Tanggal: _________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_CONSISTENCY_0017",
        "section": "F. HASIL PENGUJIAN KONSISTENSI",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "Disetujui oleh:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_CONSISTENCY_0018",
        "section": "F. HASIL PENGUJIAN KONSISTENSI",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Nama: _________________Jabatan: _________________Tanda tangan: _________________Tanggal: _________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-19-pci-manual-periodic14",
    "survey": "PCI Manual",
    "phase": "periodic14",
    "items": [
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0001",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "Nomor Dokumen: QA/QC-PCI-004Periode Verifikasi: _________________ s/d _________________Tanggal Verifikasi: _________________Tim QA/QC: _________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0002",
        "section": "A. INFORMASI UMUM",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. INFORMASI UMUM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Data Verifikasi",
            "Keterangan"
          ],
          "row_labels": [
            "Periode Survei",
            "Wilayah/Provinsi",
            "Jumlah Ruas yang Disurvei",
            "Total Panjang yang Disurvei",
            "Jumlah Tim Survei",
            "Jumlah Sampel yang Diverifikasi",
            "Metode Pengambilan Sampel"
          ],
          "source_rows": [
            [
              "Periode Survei",
              "_________________"
            ],
            [
              "Wilayah/Provinsi",
              "_________________"
            ],
            [
              "Jumlah Ruas yang Disurvei",
              "_________________"
            ],
            [
              "Total Panjang yang Disurvei",
              "_________________ km"
            ],
            [
              "Jumlah Tim Survei",
              "_________________"
            ],
            [
              "Jumlah Sampel yang Diverifikasi",
              "_________________ segmen (minimum 1 km per tim)"
            ],
            [
              "Metode Pengambilan Sampel",
              "□ Random □ Sistematis □ Stratified Random □ Lainnya: ________"
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0003",
        "section": "B. PERSONEL DAN PERALATAN YANG DIVERIFIKASI",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. PERSONEL DAN PERALATAN YANG DIVERIFIKASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Tim Survei",
            "Personel yang Dievaluasi",
            "Peralatan yang Digunakan",
            "Status Operasional"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "□ Baik □ Perlu Perbaikan"
            ],
            [
              "2",
              "",
              "",
              "",
              "□ Baik □ Perlu Perbaikan"
            ],
            [
              "3",
              "",
              "",
              "",
              "□ Baik □ Perlu Perbaikan"
            ],
            [
              "4",
              "",
              "",
              "",
              "□ Baik □ Perlu Perbaikan"
            ],
            [
              "5",
              "",
              "",
              "",
              "□ Baik □ Perlu Perbaikan"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0004",
        "section": "C. VERIFIKASI PROSES PENGAMBILAN DATA",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. VERIFIKASI PROSES PENGAMBILAN DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10"
          ],
          "source_rows": [
            [
              "1",
              "Kalibrasi peralatan dilakukan sesuai jadwal",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "2",
              "Pengambilan gambar dilakukan pada kondisi cuaca cerah",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "3",
              "Permukaan jalan dalam kondisi kering",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "4",
              "Pengambilan gambar dengan sudut dan jarak yang tepat",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "5",
              "Interval pengambilan gambar konsisten (maks. 10m)",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "6",
              "Pengambilan data sesuai dengan prosedur survei",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "7",
              "Prosedur keselamatan dan pengendalian lalu lintas diterapkan",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "8",
              "Data koordinat GPS terekam dengan baik",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "9",
              "Pengukuran dimensi kerusakan dilakukan dengan benar",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "10",
              "Identifikasi jenis kerusakan dilakukan dengan benar",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0005",
        "section": "1. Perbandingan Hasil Nilai PCI",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Perbandingan Hasil Nilai PCI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Tim Survei",
            "Segmen Verifikasi",
            "Nilai PCI Tim",
            "Nilai PCI Verifikator",
            "Selisih",
            "Status (≤10%)"
          ],
          "row_labels": [
            "",
            "",
            "",
            "",
            "",
            "Rata-rata"
          ],
          "source_rows": [
            [
              "",
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "",
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "",
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "",
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "",
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Rata-rata",
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0006",
        "section": "2. Perbandingan Identifikasi Jenis Kerusakan",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Perbandingan Identifikasi Jenis Kerusakan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Tim Survei",
            "Jumlah Kerusakan Teridentifikasi",
            "Jumlah Terverifikasi Benar",
            "% Keberhasilan",
            "Status (≥85%)"
          ],
          "row_labels": [
            "",
            "",
            "",
            "",
            "",
            "Rata-rata"
          ],
          "source_rows": [
            [
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Rata-rata",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0007",
        "section": "3. Perbandingan Penilaian Tingkat Keparahan",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Perbandingan Penilaian Tingkat Keparahan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Tim Survei",
            "Jumlah Penilaian Tingkat Keparahan",
            "Jumlah Terverifikasi Benar",
            "% Keberhasilan",
            "Status (≥85%)"
          ],
          "row_labels": [
            "",
            "",
            "",
            "",
            "",
            "Rata-rata"
          ],
          "source_rows": [
            [
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Rata-rata",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0008",
        "section": "4. Perbandingan Pengukuran Dimensi",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 4. Perbandingan Pengukuran Dimensi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Tim Survei",
            "Jumlah Pengukuran Dimensi",
            "Jumlah Terverifikasi Benar",
            "% Keberhasilan",
            "Status (≥85%)"
          ],
          "row_labels": [
            "",
            "",
            "",
            "",
            "",
            "Rata-rata"
          ],
          "source_rows": [
            [
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "Rata-rata",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0009",
        "section": "E. VALIDASI KUALITAS DOKUMENTASI",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: E. VALIDASI KUALITAS DOKUMENTASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Tim Survei",
            "Kualitas Foto",
            "Kualitas Video",
            "Kelengkapan",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "□ Baik □ Sedang □ Kurang",
              "□ Baik □ Sedang □ Kurang",
              "□ Lengkap □ Sebagian □ Kurang",
              "□ Diterima □ Perlu Perbaikan"
            ],
            [
              "2",
              "",
              "□ Baik □ Sedang □ Kurang",
              "□ Baik □ Sedang □ Kurang",
              "□ Lengkap □ Sebagian □ Kurang",
              "□ Diterima □ Perlu Perbaikan"
            ],
            [
              "3",
              "",
              "□ Baik □ Sedang □ Kurang",
              "□ Baik □ Sedang □ Kurang",
              "□ Lengkap □ Sebagian □ Kurang",
              "□ Diterima □ Perlu Perbaikan"
            ],
            [
              "4",
              "",
              "□ Baik □ Sedang □ Kurang",
              "□ Baik □ Sedang □ Kurang",
              "□ Lengkap □ Sebagian □ Kurang",
              "□ Diterima □ Perlu Perbaikan"
            ],
            [
              "5",
              "",
              "□ Baik □ Sedang □ Kurang",
              "□ Baik □ Sedang □ Kurang",
              "□ Lengkap □ Sebagian □ Kurang",
              "□ Diterima □ Perlu Perbaikan"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0010",
        "section": "F. VALIDASI KEWAJARAN DATA 2-MINGGUAN",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: F. VALIDASI KEWAJARAN DATA 2-MINGGUAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10"
          ],
          "source_rows": [
            [
              "1",
              "Distribusi nilai PCI konsisten dengan kondisi jalan yang diketahui",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ],
            [
              "2",
              "Tren PCI sesuai dengan umur jalan dan beban lalu lintas",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ],
            [
              "3",
              "Jenis kerusakan sesuai dengan tipikal kerusakan pada wilayah tersebut",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ],
            [
              "4",
              "Tidak ada anomali data yang signifikan antar segmen berdekatan",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ],
            [
              "5",
              "Data konsisten dengan data historis (jika tersedia)",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ],
            [
              "6",
              "Data konsisten dengan pola musim (hujan/kemarau)",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ],
            [
              "7",
              "Tingkat keparahan kerusakan konsisten dengan umur jalan",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ],
            [
              "8",
              "Produktivitas survei konsisten dengan kapasitas tim",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ],
            [
              "9",
              "Konsistensi data antar tim survei pada kondisi jalan serupa",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ],
            [
              "10",
              "Distribusi kerusakan konsisten dengan pola beban lalu lintas",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0011",
        "section": "G. VALIDASI BERDASARKAN JENIS KERUSAKAN",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: G. VALIDASI BERDASARKAN JENIS KERUSAKAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Jenis Kerusakan",
            "Akurasi Identifikasi (%)",
            "Akurasi Tingkat Keparahan (%)",
            "Akurasi Pengukuran (%)",
            "Status"
          ],
          "row_labels": [
            "Retak Buaya (Crocodile Cracking)",
            "Retak Tepi (Edge Cracking)",
            "Retak Melintang (Transverse Cracking)",
            "Retak lainnya (Other Cracking)",
            "Lubang (Pothole)",
            "Tambalan (Patching)",
            "Alur (Rutting)",
            "Keriting (Corrugations)",
            "Sungkur/Amblas (Shoving/Depression)",
            "Pelapukan/Pelepasan Butir",
            "Kegemukan/Licin",
            "Penurunan Bahu (Drop off)"
          ],
          "source_rows": [
            [
              "Retak Buaya (Crocodile Cracking)",
              "",
              "",
              "",
              "□ Baik □ Perlu Perbaikan"
            ],
            [
              "Retak Tepi (Edge Cracking)",
              "",
              "",
              "",
              "□ Baik □ Perlu Perbaikan"
            ],
            [
              "Retak Melintang (Transverse Cracking)",
              "",
              "",
              "",
              "□ Baik □ Perlu Perbaikan"
            ],
            [
              "Retak lainnya (Other Cracking)",
              "",
              "",
              "",
              "□ Baik □ Perlu Perbaikan"
            ],
            [
              "Lubang (Pothole)",
              "",
              "",
              "",
              "□ Baik □ Perlu Perbaikan"
            ],
            [
              "Tambalan (Patching)",
              "",
              "",
              "",
              "□ Baik □ Perlu Perbaikan"
            ],
            [
              "Alur (Rutting)",
              "",
              "",
              "",
              "□ Baik □ Perlu Perbaikan"
            ],
            [
              "Keriting (Corrugations)",
              "",
              "",
              "",
              "□ Baik □ Perlu Perbaikan"
            ],
            [
              "Sungkur/Amblas (Shoving/Depression)",
              "",
              "",
              "",
              "□ Baik □ Perlu Perbaikan"
            ],
            [
              "Pelapukan/Pelepasan Butir",
              "",
              "",
              "",
              "□ Baik □ Perlu Perbaikan"
            ],
            [
              "Kegemukan/Licin",
              "",
              "",
              "",
              "□ Baik □ Perlu Perbaikan"
            ],
            [
              "Penurunan Bahu (Drop off)",
              "",
              "",
              "",
              "□ Baik □ Perlu Perbaikan"
            ]
          ],
          "table_rows": 12,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0012",
        "section": "H. EVALUASI TIM SURVEI",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: H. EVALUASI TIM SURVEI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Tim Survei",
            "Kepatuhan Prosedur (%)",
            "Akurasi Data (%)",
            "Kualitas Dokumentasi (%)",
            "Produktivitas",
            "Penilaian Keseluruhan"
          ],
          "row_labels": [
            "",
            "",
            "",
            "",
            ""
          ],
          "source_rows": [
            [
              "",
              "",
              "",
              "",
              "km/hari",
              "□ Sangat Baik □ Baik □ Cukup □ Kurang"
            ],
            [
              "",
              "",
              "",
              "",
              "km/hari",
              "□ Sangat Baik □ Baik □ Cukup □ Kurang"
            ],
            [
              "",
              "",
              "",
              "",
              "km/hari",
              "□ Sangat Baik □ Baik □ Cukup □ Kurang"
            ],
            [
              "",
              "",
              "",
              "",
              "km/hari",
              "□ Sangat Baik □ Baik □ Cukup □ Kurang"
            ],
            [
              "",
              "",
              "",
              "",
              "km/hari",
              "□ Sangat Baik □ Baik □ Cukup □ Kurang"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0013",
        "section": "I. TEMUAN VERIFIKASI DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: I. TEMUAN VERIFIKASI DAN TINDAKAN PERBAIKAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Temuan",
            "Tim yang Terlibat",
            "Tingkat Keparahan",
            "Tindakan Perbaikan",
            "Tenggat Waktu",
            "PIC",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "□ Major □ Minor",
              "",
              "",
              "",
              "□ Open □ Closed"
            ],
            [
              "2",
              "",
              "",
              "□ Major □ Minor",
              "",
              "",
              "",
              "□ Open □ Closed"
            ],
            [
              "3",
              "",
              "",
              "□ Major □ Minor",
              "",
              "",
              "",
              "□ Open □ Closed"
            ],
            [
              "4",
              "",
              "",
              "□ Major □ Minor",
              "",
              "",
              "",
              "□ Open □ Closed"
            ],
            [
              "5",
              "",
              "",
              "□ Major □ Minor",
              "",
              "",
              "",
              "□ Open □ Closed"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0014",
        "section": "J. RINGKASAN HASIL VERIFIKASI 2-MINGGUAN",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: J. RINGKASAN HASIL VERIFIKASI 2-MINGGUAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Aspek",
            "% Keberhasilan Rata-rata",
            "Status"
          ],
          "row_labels": [
            "Akurasi Nilai PCI",
            "Identifikasi Jenis Kerusakan",
            "Penilaian Tingkat Keparahan",
            "Pengukuran Dimensi",
            "Kualitas Dokumentasi",
            "Kewajaran Data",
            "Rata-rata Keseluruhan"
          ],
          "source_rows": [
            [
              "Akurasi Nilai PCI",
              "",
              "□ Diterima □ Perlu Perbaikan □ Ditolak"
            ],
            [
              "Identifikasi Jenis Kerusakan",
              "",
              "□ Diterima □ Perlu Perbaikan □ Ditolak"
            ],
            [
              "Penilaian Tingkat Keparahan",
              "",
              "□ Diterima □ Perlu Perbaikan □ Ditolak"
            ],
            [
              "Pengukuran Dimensi",
              "",
              "□ Diterima □ Perlu Perbaikan □ Ditolak"
            ],
            [
              "Kualitas Dokumentasi",
              "",
              "□ Diterima □ Perlu Perbaikan □ Ditolak"
            ],
            [
              "Kewajaran Data",
              "",
              "□ Diterima □ Perlu Perbaikan □ Ditolak"
            ],
            [
              "Rata-rata Keseluruhan",
              "",
              "□ Diterima □ Perlu Perbaikan □ Ditolak"
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0015",
        "section": "K. TREN KINERJA 2-MINGGUAN",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: K. TREN KINERJA 2-MINGGUAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Periode",
            "Akurasi Rata-rata (%)",
            "Tren",
            "Catatan"
          ],
          "row_labels": [
            "2 Minggu sebelumnya",
            "4 Minggu sebelumnya",
            "6 Minggu sebelumnya"
          ],
          "source_rows": [
            [
              "2 Minggu sebelumnya",
              "",
              "□ Meningkat □ Stabil □ Menurun",
              ""
            ],
            [
              "4 Minggu sebelumnya",
              "",
              "□ Meningkat □ Stabil □ Menurun",
              ""
            ],
            [
              "6 Minggu sebelumnya",
              "",
              "□ Meningkat □ Stabil □ Menurun",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0016",
        "section": "L. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Kesimpulan Hasil Verifikasi 2-Mingguan:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0017",
        "section": "L. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "□ Data Diterima (≥90% keberhasilan rata-rata)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0018",
        "section": "L. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "□ Data Diterima dengan Catatan (80-89% keberhasilan rata-rata)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0019",
        "section": "L. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "□ Data Perlu Perbaikan (70-79% keberhasilan rata-rata)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0020",
        "section": "L. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "□ Data Ditolak (<70% keberhasilan rata-rata)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0021",
        "section": "L. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Rekomendasi untuk Periode Berikutnya:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0022",
        "section": "L. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "Diverifikasi oleh:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0023",
        "section": "L. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 23,
        "sourceOrder": 23,
        "unit": "",
        "rule": {},
        "label": "Nama: _________________Jabatan: _________________Tanda tangan: _________________Tanggal: _________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0024",
        "section": "L. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 24,
        "sourceOrder": 24,
        "unit": "",
        "rule": {},
        "label": "Disetujui oleh:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_PERIODIC14_0025",
        "section": "L. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 25,
        "sourceOrder": 25,
        "unit": "",
        "rule": {},
        "label": "Nama: _________________Jabatan: _________________Tanda tangan: _________________Tanggal: _________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-20-pci-manual-internal",
    "survey": "PCI Manual",
    "phase": "internal",
    "items": [
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0001",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "Nomor Dokumen: QA/QC-PCI-003Tanggal Verifikasi: _________________Periode Data yang Diverifikasi: _________________Lokasi/Ruas Jalan: _________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0002",
        "section": "A. INFORMASI UMUM",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: A. INFORMASI UMUM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Data Verifikasi",
            "Keterangan"
          ],
          "row_labels": [
            "Verifikasi oleh",
            "Jabatan",
            "Tim Survei yang Diverifikasi",
            "Jenis Dokumen yang Diverifikasi",
            "Jumlah Data/Sampel yang Diverifikasi",
            "Metode Pengambilan Sampel"
          ],
          "source_rows": [
            [
              "Verifikasi oleh",
              "_________________"
            ],
            [
              "Jabatan",
              "_________________"
            ],
            [
              "Tim Survei yang Diverifikasi",
              "_________________"
            ],
            [
              "Jenis Dokumen yang Diverifikasi",
              "□ Data Mentah □ Data Terproses □ Foto Dokumentasi □ Video Dokumentasi □ Laporan"
            ],
            [
              "Jumlah Data/Sampel yang Diverifikasi",
              "_________________"
            ],
            [
              "Metode Pengambilan Sampel",
              "□ Random □ Sistematis □ Terstruktur"
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0003",
        "section": "B. VERIFIKASI KELENGKAPAN DATA",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: B. VERIFIKASI KELENGKAPAN DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10"
          ],
          "source_rows": [
            [
              "1",
              "Data administratif lengkap (tanggal, lokasi, tim, dll)",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "2",
              "Semua segmen jalan tersurvei",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "3",
              "Dokumentasi foto untuk setiap segmen tersedia",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "4",
              "Dokumentasi video untuk setiap segmen tersedia",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "5",
              "Data koordinat GPS lengkap",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "6",
              "Data jenis kerusakan teridentifikasi",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "7",
              "Data dimensi/ukuran kerusakan lengkap",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "8",
              "Data tingkat keparahan kerusakan lengkap",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "9",
              "Perhitungan nilai PCI untuk setiap segmen tersedia",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "10",
              "Format data sesuai standar Ditjen Bina Marga",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0004",
        "section": "C. VERIFIKASI KUALITAS DATA DOKUMENTASI",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: C. VERIFIKASI KUALITAS DATA DOKUMENTASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10"
          ],
          "source_rows": [
            [
              "1",
              "Foto/video diambil dalam kondisi cuaca cerah",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "2",
              "Permukaan jalan dalam kondisi kering",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "3",
              "Kualitas gambar/video jelas dan tidak kabur",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "4",
              "Gambar/video tidak terganggu oleh debu/kotoran pada lensa",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "5",
              "Pengambilan gambar tidak menghadap matahari",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "6",
              "Bayangan tidak mengganggu pengamatan kerusakan",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "7",
              "Komposisi gambar menampilkan 70% permukaan jalan",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "8",
              "Jenis kerusakan dapat teridentifikasi dengan jelas dari gambar",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "9",
              "Tingkat keparahan dapat teridentifikasi dari gambar",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "10",
              "Interval pengambilan gambar sesuai ketentuan (maksimum 10m)",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0005",
        "section": "D. VALIDASI AKURASI DATA PENGUKURAN",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: D. VALIDASI AKURASI DATA PENGUKURAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Item Pemeriksaan",
            "Jumlah Sampel",
            "Jumlah Sesuai",
            "% Kesesuaian",
            "Status (≥85%)"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10"
          ],
          "source_rows": [
            [
              "1",
              "Jenis kerusakan teridentifikasi dengan benar",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "2",
              "Tingkat keparahan dinilai dengan benar",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "3",
              "Pengukuran dimensi kerusakan akurat",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "4",
              "Perhitungan nilai pengurang (deduct value) benar",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "5",
              "Perhitungan total nilai pengurang benar",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "6",
              "Penentuan nilai pengurang terkoreksi benar",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "7",
              "Perhitungan nilai PCI benar",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "8",
              "Penentuan kategori kondisi perkerasan sesuai",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "9",
              "Konsistensi pengukuran antar segmen",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ],
            [
              "10",
              "Konsistensi pengukuran antar penilai",
              "",
              "",
              "",
              "□ Ya □ Tidak"
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0006",
        "section": "E. VALIDASI KEWAJARAN DATA",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: E. VALIDASI KEWAJARAN DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10"
          ],
          "source_rows": [
            [
              "1",
              "Distribusi nilai PCI wajar untuk kondisi jalan",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ],
            [
              "2",
              "Tidak ada lonjakan/penurunan nilai PCI yang ekstrem antar segmen berdekatan",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ],
            [
              "3",
              "Jenis kerusakan sesuai dengan karakteristik jalan",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ],
            [
              "4",
              "Tingkat keparahan sesuai dengan umur perkerasan",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ],
            [
              "5",
              "Hasil penilaian konsisten dengan hasil survei sebelumnya pada lokasi yang sama",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ],
            [
              "6",
              "Variasi data berada dalam rentang yang bisa diterima",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ],
            [
              "7",
              "Tidak terdapat anomali data yang signifikan",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ],
            [
              "8",
              "Data sesuai dengan beban lalu lintas pada ruas jalan",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ],
            [
              "9",
              "Data sesuai dengan pola kerusakan yang umum terjadi",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ],
            [
              "10",
              "Ketidakpastian pengukuran dalam batas yang wajar",
              "□ Ya □ Tidak □ Meragukan",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0007",
        "section": "F. VERIFIKASI KEPATUHAN TERHADAP PROSEDUR",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: F. VERIFIKASI KEPATUHAN TERHADAP PROSEDUR",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10"
          ],
          "source_rows": [
            [
              "1",
              "Prosedur pengambilan gambar diikuti dengan benar",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "2",
              "Prosedur identifikasi jenis kerusakan diikuti dengan benar",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "3",
              "Prosedur pengukuran dimensi kerusakan diikuti dengan benar",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "4",
              "Prosedur penentuan tingkat keparahan diikuti dengan benar",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "5",
              "Prosedur perhitungan nilai PCI diikuti dengan benar",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "6",
              "Rencana sampling diikuti dengan benar",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "7",
              "Prosedur kalibrasi peralatan diikuti dengan benar",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "8",
              "Prosedur pelaporan data diikuti dengan benar",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "9",
              "Prosedur pengendalian mutu diikuti dengan benar",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "10",
              "Prosedur keamanan dan keselamatan diikuti dengan benar",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0008",
        "section": "G. VERIFIKASI FORMAT PELAPORAN",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: G. VERIFIKASI FORMAT PELAPORAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Item Pemeriksaan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9",
            "10"
          ],
          "source_rows": [
            [
              "1",
              "Format data sesuai dengan SMD Jalan",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "2",
              "Struktur data memenuhi persyaratan",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "3",
              "Penulisan metadata sesuai ketentuan",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "4",
              "Penggunaan kode standar untuk jenis kerusakan",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "5",
              "Penggunaan kode standar untuk tingkat keparahan",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "6",
              "Penggunaan satuan pengukuran sesuai ketentuan",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "7",
              "Penamaan file sesuai konvensi yang ditetapkan",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "8",
              "Tabel, grafik, dan lampiran lengkap",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "9",
              "Link video YouTube telah diunggah dan berfungsi",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ],
            [
              "10",
              "Backup data tersedia",
              "□ Ya □ Tidak □ Sebagian",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0009",
        "section": "H. TEMUAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: H. TEMUAN DAN REKOMENDASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Temuan",
            "Tingkat Keparahan",
            "Rekomendasi Tindakan",
            "Tenggat Waktu",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "□ Major □ Minor",
              "",
              "",
              "□ Open □ Closed"
            ],
            [
              "2",
              "",
              "□ Major □ Minor",
              "",
              "",
              "□ Open □ Closed"
            ],
            [
              "3",
              "",
              "□ Major □ Minor",
              "",
              "",
              "□ Open □ Closed"
            ],
            [
              "4",
              "",
              "□ Major □ Minor",
              "",
              "",
              "□ Open □ Closed"
            ],
            [
              "5",
              "",
              "□ Major □ Minor",
              "",
              "",
              "□ Open □ Closed"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0010",
        "section": "I. RINGKASAN HASIL VERIFIKASI DAN VALIDASI",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: I. RINGKASAN HASIL VERIFIKASI DAN VALIDASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Aspek",
            "Jumlah Item",
            "Jumlah Sesuai",
            "% Kesesuaian",
            "Status"
          ],
          "row_labels": [
            "Kelengkapan Data",
            "Kualitas Dokumentasi",
            "Akurasi Data",
            "Kewajaran Data",
            "Kepatuhan Prosedur",
            "Format Pelaporan",
            "TOTAL"
          ],
          "source_rows": [
            [
              "Kelengkapan Data",
              "10",
              "",
              "",
              "□ Diterima □ Perlu Perbaikan □ Ditolak"
            ],
            [
              "Kualitas Dokumentasi",
              "10",
              "",
              "",
              "□ Diterima □ Perlu Perbaikan □ Ditolak"
            ],
            [
              "Akurasi Data",
              "10",
              "",
              "",
              "□ Diterima □ Perlu Perbaikan □ Ditolak"
            ],
            [
              "Kewajaran Data",
              "10",
              "",
              "",
              "□ Diterima □ Perlu Perbaikan □ Ditolak"
            ],
            [
              "Kepatuhan Prosedur",
              "10",
              "",
              "",
              "□ Diterima □ Perlu Perbaikan □ Ditolak"
            ],
            [
              "Format Pelaporan",
              "10",
              "",
              "",
              "□ Diterima □ Perlu Perbaikan □ Ditolak"
            ],
            [
              "TOTAL",
              "60",
              "",
              "",
              "□ Diterima □ Perlu Perbaikan □ Ditolak"
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0011",
        "section": "J. KESIMPULAN",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Hasil Verifikasi dan Validasi Internal:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0012",
        "section": "J. KESIMPULAN",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "□ Data Diterima (≥90% kesesuaian)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0013",
        "section": "J. KESIMPULAN",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "□ Data Diterima dengan Catatan (80-89% kesesuaian)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0014",
        "section": "J. KESIMPULAN",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "□ Data Perlu Perbaikan (60-79% kesesuaian)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0015",
        "section": "J. KESIMPULAN",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "□ Data Ditolak (<60% kesesuaian)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0016",
        "section": "J. KESIMPULAN",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Catatan Kesimpulan:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0017",
        "section": "J. KESIMPULAN",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "Dilakukan oleh:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0018",
        "section": "J. KESIMPULAN",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Nama: _________________Jabatan: _________________Tanda tangan: _________________Tanggal: _________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0019",
        "section": "J. KESIMPULAN",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Disetujui oleh:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_PCI_MANUAL_INTERNAL_0020",
        "section": "J. KESIMPULAN",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "Nama: _________________Jabatan: _________________Tanda tangan: _________________Tanggal: _________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-21-rni-consistency",
    "survey": "RNI",
    "phase": "consistency",
    "items": [
      {
        "code": "DOCX_RNI_CONSISTENCY_0001",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: Informasi dan Pemeriksaan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "INFORMASI PROYEK",
            ""
          ],
          "row_labels": [
            "Nama Proyek",
            "Nomor Kontrak",
            "Penyedia Jasa",
            "Periode Survei",
            "Lokasi Survei",
            "Tanggal Checklist",
            "No. Dokumen"
          ],
          "source_rows": [
            [
              "Nama Proyek",
              ": __________________________________"
            ],
            [
              "Nomor Kontrak",
              ": __________________________________"
            ],
            [
              "Penyedia Jasa",
              ": __________________________________"
            ],
            [
              "Periode Survei",
              ": __________________________________"
            ],
            [
              "Lokasi Survei",
              ": __________________________________"
            ],
            [
              "Tanggal Checklist",
              ": __________________________________"
            ],
            [
              "No. Dokumen",
              ": __________________________________"
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0002",
        "section": "1. Penetapan Ruas Uji Konsistensi",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Penetapan Ruas Uji Konsistensi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7"
          ],
          "source_rows": [
            [
              "1.1",
              "Ruas uji konsistensi awal minimal sepanjang 5 km telah ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.2",
              "Ruas uji mewakili karakteristik tipikal jalan (lurus, tikungan, tanjakan)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.3",
              "Ruas uji memiliki referensi titik yang jelas (patok km, jembatan)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.4",
              "Koordinat awal dan akhir ruas uji telah direkam dengan akurat",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.5",
              "Ruas uji telah dikoordinasikan dengan Pengguna Jasa",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.6",
              "Dokumentasi visual ruas uji konsistensi tersedia",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.7",
              "Data referensi ruas uji sudah disiapkan (jika ada data survei sebelumnya)",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0003",
        "section": "2. Metode Pengujian Konsistensi Awal",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Metode Pengujian Konsistensi Awal",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7"
          ],
          "source_rows": [
            [
              "2.1",
              "Pengukuran jarak dilakukan minimal 3 kali lintasan di ruas uji",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.2",
              "Pengukuran koordinat dengan GPS dilakukan 3 kali lintasan di ruas uji",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.3",
              "Pengukuran inventori jalan dilakukan minimal 2 kali di ruas uji",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.4",
              "Pengukuran dilakukan oleh minimal 2 tim survei berbeda",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.5",
              "Pengukuran dilakukan pada kecepatan survei 40, 50, dan >60 km/jam",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.6",
              "Pengukuran dilakukan pada kondisi cuaca yang berbeda (jika memungkinkan)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.7",
              "Pengujian konsistensi mencakup seluruh parameter RNI",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0004",
        "section": "3. Jaminan Kualitas Pengukuran Awal",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Jaminan Kualitas Pengukuran Awal",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7"
          ],
          "source_rows": [
            [
              "3.1",
              "Alat pengukur jarak sudah dikalibrasi sebelum uji konsistensi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.2",
              "GPS sudah dikalibrasi sebelum uji konsistensi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.3",
              "Alat ukur penampang melintang sudah dikalibrasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.4",
              "Pengamat yang melakukan survei sudah terlatih dan tersertifikasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.5",
              "Sistem basis data sudah dipersiapkan untuk analisis konsistensi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.6",
              "Metode analisis statistik konsistensi sudah ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.7",
              "Personil QA/QC mengawasi proses pengujian konsistensi awal",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0005",
        "section": "1. Jadwal Pengujian Konsistensi",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Jadwal Pengujian Konsistensi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7"
          ],
          "source_rows": [
            [
              "1.1",
              "Jadwal pengujian konsistensi berkala ditetapkan setiap 14 hari",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.2",
              "Jadwal pengujian terdokumentasi dalam rencana mutu",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.3",
              "Jadwal memperhitungkan variasi kondisi cuaca dan lalu lintas",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.4",
              "Pengujian konsistensi terjadwal sebelum dan sesudah pemeliharaan alat",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.5",
              "Pengujian terjadwal setelah penggantian operator atau personil",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.6",
              "Pengujian dilakukan setiap pergantian wilayah/area survei",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.7",
              "Penjadwalan mengantisipasi ketersediaan personil QA/QC",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0006",
        "section": "2. Metode Pengujian Konsistensi Berkala",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Metode Pengujian Konsistensi Berkala",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7"
          ],
          "source_rows": [
            [
              "2.1",
              "Pengukuran ulang dilakukan minimal 3 kali lintasan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.2",
              "Ruas pengujian berkala minimal sepanjang 5 km",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.3",
              "Data pengujian berkala dibandingkan dengan data pengujian awal",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.4",
              "Standar deviasi pada pengukuran ulang < 5%",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.5",
              "Metode analisis data konsisten dengan pengujian awal",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.6",
              "Bounce test pada alat dilakukan setiap hari survei",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.7",
              "Dokumentasi pengujian berkala mengikuti format standar",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0007",
        "section": "3. Pemeriksaan Parameter Konsistensi",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Pemeriksaan Parameter Konsistensi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7"
          ],
          "source_rows": [
            [
              "3.1",
              "Konsistensi pengukuran jarak (standar deviasi < 0.1%)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.2",
              "Konsistensi pengukuran koordinat (standar deviasi < 6m)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.3",
              "Konsistensi pengukuran lebar jalan (standar deviasi < 10cm)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.4",
              "Konsistensi identifikasi objek referensi lokasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.5",
              "Konsistensi pengukuran penampang melintang",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.6",
              "Konsistensi pengamatan drainase",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.7",
              "Konsistensi dokumentasi foto/video",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0008",
        "section": "1. Pengukuran Jarak",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Pengukuran Jarak",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7"
          ],
          "source_rows": [
            [
              "1.1",
              "Standar deviasi pengukuran jarak < 0.1% panjang ruas",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.2",
              "Koefisien variasi pengukuran jarak < 5%",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.3",
              "Kesalahan pengukuran jarak total < 30m per ruas jalan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.4",
              "Hasil pengukuran antar operator konsisten",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.5",
              "Hasil pengukuran antar alat konsisten",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.6",
              "Hasil analisis regresi linier: 0,95 ≤ A ≤ 1,05; -0,25 ≤ B ≤ 0,25",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.7",
              "Koefisien determinasi (R²) ≥ 0,95",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0009",
        "section": "2. Pengukuran Koordinat",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Pengukuran Koordinat",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7"
          ],
          "source_rows": [
            [
              "2.1",
              "Standar deviasi pengukuran koordinat < 6m",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.2",
              "Koordinat LRP konsisten pada setiap pengukuran",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.3",
              "Koordinat awal/akhir ruas konsisten",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.4",
              "Koordinat objek referensi konsisten",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.5",
              "Hasil pengukuran tidak menunjukkan bias sistematis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.6",
              "Konversi koordinat ke UTM dilakukan dengan benar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.7",
              "Kesalahan pengukuran koordinat terus memantau",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0010",
        "section": "3. Data Inventori Jalan",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Data Inventori Jalan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7"
          ],
          "source_rows": [
            [
              "3.1",
              "Pengukuran lebar perkerasan konsisten (standar deviasi < 10cm)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.2",
              "Pengukuran lebar bahu jalan konsisten (standar deviasi < 10cm)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.3",
              "Pengukuran lebar median konsisten (standar deviasi < 10cm)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.4",
              "Pengukuran lebar saluran konsisten (standar deviasi < 10cm)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.5",
              "Identifikasi jenis permukaan jalan konsisten",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.6",
              "Identifikasi objek referensi konsisten",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.7",
              "Identifikasi lokasi perubahan geometri konsisten",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0011",
        "section": "1. Format Laporan Konsistensi",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Format Laporan Konsistensi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7"
          ],
          "source_rows": [
            [
              "1.1",
              "Berita acara pengujian konsistensi dibuat",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.2",
              "Format berita acara konsistensi sesuai standar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.3",
              "Hasil analisis statistik dilampirkan dalam laporan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.4",
              "Dokumentasi visual pengujian dilampirkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.5",
              "Data mentah pengujian konsistensi tersedia",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.6",
              "Metode analisis dijelaskan dalam laporan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.7",
              "Rekomendasi tindak lanjut dicantumkan",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0012",
        "section": "2. Pemantauan Tren Konsistensi",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Pemantauan Tren Konsistensi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7"
          ],
          "source_rows": [
            [
              "2.1",
              "Nilai konsistensi dipantau dari waktu ke waktu",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.2",
              "Grafik tren konsistensi dibuat dan dianalisis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.3",
              "Perubahan signifikan dalam tren konsistensi diinvestigasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.4",
              "Perbandingan konsistensi antar ruas uji dilakukan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.5",
              "Perbandingan konsistensi antar tim survei dilakukan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.6",
              "Perbandingan konsistensi antar alat survei dilakukan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.7",
              "Korelasi perubahan konsistensi dengan faktor eksternal dianalisis",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0013",
        "section": "3. Pengelolaan Data Konsistensi",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Pengelolaan Data Konsistensi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7"
          ],
          "source_rows": [
            [
              "3.1",
              "Database hasil pengujian konsistensi dikelola",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.2",
              "Data diarsipkan sesuai dengan prosedur",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.3",
              "Akses ke data konsistensi dikendalikan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.4",
              "Data cadangan (backup) dibuat secara teratur",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.5",
              "Data konsistensi tersedia untuk audit",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.6",
              "Data konsistensi disinkronkan dengan data survei",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.7",
              "Pembaruan basis data konsistensi terdokumentasi",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0014",
        "section": "1. Identifikasi Penyimpangan",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Identifikasi Penyimpangan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7"
          ],
          "source_rows": [
            [
              "1.1",
              "Ambang batas penyimpangan konsistensi ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.2",
              "Penyimpangan terhadap kriteria konsistensi diidentifikasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.3",
              "Analisis akar masalah penyimpangan dilakukan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.4",
              "Dampak penyimpangan terhadap data survei dianalisis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.5",
              "Penyimpangan dikategorikan berdasarkan tingkat keparahan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.6",
              "Penyimpangan dikomunikasikan kepada semua pihak terkait",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.7",
              "Waktu respon terhadap penyimpangan sesuai dengan tingkat keparahan",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0015",
        "section": "2. Mitigasi Penyimpangan",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Mitigasi Penyimpangan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7"
          ],
          "source_rows": [
            [
              "2.1",
              "Tindakan koreksi untuk setiap penyimpangan ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.2",
              "Tindakan koreksi dilaksanakan sesuai jadwal",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.3",
              "Tindakan pencegahan untuk menghindari pengulangan ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.4",
              "Survei ulang dilakukan jika diperlukan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.5",
              "Kalibrasi ulang alat dilakukan jika diperlukan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.6",
              "Pelatihan ulang personil dilakukan jika diperlukan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.7",
              "Pembaruan prosedur survei dilakukan jika diperlukan",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0016",
        "section": "3. Evaluasi Efektivitas Tindakan",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Evaluasi Efektivitas Tindakan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7"
          ],
          "source_rows": [
            [
              "3.1",
              "Pengujian konsistensi diulang setelah tindakan koreksi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.2",
              "Hasil pengujian menunjukkan perbaikan konsistensi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.3",
              "Efektivitas tindakan diukur dan didokumentasikan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.4",
              "Pembelajaran dari tindakan koreksi didokumentasikan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.5",
              "Prosedur survei diperbarui berdasarkan pembelajaran",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.6",
              "Peningkatan kinerja konsistensi terukur",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.7",
              "Hasil evaluasi dikomunikasikan kepada semua pihak terkait",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0017",
        "section": "3. Evaluasi Efektivitas Tindakan",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "KESIMPULAN DAN REKOMENDASI",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0018",
        "section": "3. Evaluasi Efektivitas Tindakan",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Evaluasi Efektivitas Tindakan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Komponen",
            "Hasil",
            "Catatan"
          ],
          "row_labels": [
            "A. Data Konsistensi Awal",
            "B. Pengujian Konsistensi Berkala",
            "C. Analisis Hasil Konsistensi",
            "D. Dokumentasi Hasil Konsistensi",
            "E. Tindakan Koreksi dan Pencegahan"
          ],
          "source_rows": [
            [
              "A. Data Konsistensi Awal",
              "□ Memenuhi<br>□ Tidak Memenuhi",
              ""
            ],
            [
              "B. Pengujian Konsistensi Berkala",
              "□ Memenuhi<br>□ Tidak Memenuhi",
              ""
            ],
            [
              "C. Analisis Hasil Konsistensi",
              "□ Memenuhi<br>□ Tidak Memenuhi",
              ""
            ],
            [
              "D. Dokumentasi Hasil Konsistensi",
              "□ Memenuhi<br>□ Tidak Memenuhi",
              ""
            ],
            [
              "E. Tindakan Koreksi dan Pencegahan",
              "□ Memenuhi<br>□ Tidak Memenuhi",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0019",
        "section": "3. Evaluasi Efektivitas Tindakan",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Rekomendasi:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0020",
        "section": "3. Evaluasi Efektivitas Tindakan",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "PERSETUJUAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0021",
        "section": "3. Evaluasi Efektivitas Tindakan",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Tanggal Verifikasi: _______________________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0022",
        "section": "3. Evaluasi Efektivitas Tindakan",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "Tim Pelaksana QA/QC:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0023",
        "section": "3. Evaluasi Efektivitas Tindakan",
        "options": [],
        "required": false,
        "order": 23,
        "sourceOrder": 23,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Evaluasi Efektivitas Tindakan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Nama",
            "Jabatan",
            "Tanda Tangan"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3."
          ],
          "source_rows": [
            [
              "1.",
              "",
              "",
              ""
            ],
            [
              "2.",
              "",
              "",
              ""
            ],
            [
              "3.",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0024",
        "section": "3. Evaluasi Efektivitas Tindakan",
        "options": [],
        "required": false,
        "order": 24,
        "sourceOrder": 24,
        "unit": "",
        "rule": {},
        "label": "Disetujui oleh:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0025",
        "section": "3. Evaluasi Efektivitas Tindakan",
        "options": [],
        "required": false,
        "order": 25,
        "sourceOrder": 25,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Evaluasi Efektivitas Tindakan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Pihak",
            "Nama",
            "Jabatan",
            "Tanda Tangan",
            "Tanggal"
          ],
          "row_labels": [
            "Penyedia Jasa",
            "Pengguna Jasa"
          ],
          "source_rows": [
            [
              "Penyedia Jasa",
              "",
              "",
              "",
              ""
            ],
            [
              "Pengguna Jasa",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 2,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0026",
        "section": "3. Evaluasi Efektivitas Tindakan",
        "options": [],
        "required": false,
        "order": 26,
        "sourceOrder": 26,
        "unit": "",
        "rule": {},
        "label": "Lampiran:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0027",
        "section": "3. Evaluasi Efektivitas Tindakan",
        "options": [],
        "required": false,
        "order": 27,
        "sourceOrder": 27,
        "unit": "",
        "rule": {},
        "label": "Analisis Statistik Konsistensi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0028",
        "section": "3. Evaluasi Efektivitas Tindakan",
        "options": [],
        "required": false,
        "order": 28,
        "sourceOrder": 28,
        "unit": "",
        "rule": {},
        "label": "Grafik Tren Konsistensi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0029",
        "section": "3. Evaluasi Efektivitas Tindakan",
        "options": [],
        "required": false,
        "order": 29,
        "sourceOrder": 29,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi Pengujian Konsistensi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_CONSISTENCY_0030",
        "section": "3. Evaluasi Efektivitas Tindakan",
        "options": [],
        "required": false,
        "order": 30,
        "sourceOrder": 30,
        "unit": "",
        "rule": {},
        "label": "Catatan Tindakan Koreksi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-22-rni-periodic14",
    "survey": "RNI",
    "phase": "periodic14",
    "items": [
      {
        "code": "DOCX_RNI_PERIODIC14_0001",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: Informasi dan Pemeriksaan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "INFORMASI PROYEK",
            ""
          ],
          "row_labels": [
            "Nama Proyek",
            "Nomor Kontrak",
            "Penyedia Jasa",
            "Periode Verifikasi",
            "Lokasi Survei",
            "Tanggal Checklist",
            "No. Dokumen"
          ],
          "source_rows": [
            [
              "Nama Proyek",
              ": __________________________________"
            ],
            [
              "Nomor Kontrak",
              ": __________________________________"
            ],
            [
              "Penyedia Jasa",
              ": __________________________________"
            ],
            [
              "Periode Verifikasi",
              ": __________________________________"
            ],
            [
              "Lokasi Survei",
              ": __________________________________"
            ],
            [
              "Tanggal Checklist",
              ": __________________________________"
            ],
            [
              "No. Dokumen",
              ": __________________________________"
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0002",
        "section": "1. Penjadwalan dan Tim Pelaksana",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Penjadwalan dan Tim Pelaksana",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7"
          ],
          "source_rows": [
            [
              "1.1",
              "Jadwal verifikasi dan validasi 2-mingguan telah ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.2",
              "Tim verifikator dari Pengguna Jasa telah ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.3",
              "Tim dari Penyedia Jasa hadir dalam verifikasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.4",
              "Wakil PPK Fisik dilibatkan dalam proses verifikasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.5",
              "Tim verifikator memiliki kompetensi yang sesuai",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.6",
              "Peran dan tanggung jawab tim didefinisikan dengan jelas",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.7",
              "Koordinasi dengan semua pihak telah dilakukan",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0003",
        "section": "2. Persiapan Dokumen dan Data",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Persiapan Dokumen dan Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7"
          ],
          "source_rows": [
            [
              "2.1",
              "Laporan validasi internal Penyedia Jasa periode 2 minggu tersedia",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.2",
              "Data mentah survei 2 minggu terakhir tersedia",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.3",
              "Data hasil pengolahan 2 minggu terakhir tersedia",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.4",
              "Hasil pemeriksaan konsistensi 2 minggu terakhir tersedia",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.5",
              "Hasil kalibrasi alat 2 minggu terakhir tersedia",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.6",
              "Berita acara verifikasi dan validasi periode sebelumnya tersedia",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.7",
              "Dokumentasi tindak lanjut periode sebelumnya tersedia",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0004",
        "section": "3. Penetapan Ruang Lingkup",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Penetapan Ruang Lingkup",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7"
          ],
          "source_rows": [
            [
              "3.1",
              "Ruas jalan yang diverifikasi dan divalidasi ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.2",
              "Metode sampling data untuk verifikasi ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.3",
              "Parameter RNI yang diverifikasi ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.4",
              "Kriteria penerimaan ditetapkan dan disepakati",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.5",
              "Fokus area berdasarkan hasil periode sebelumnya ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.6",
              "Lokasi kunjungan lapangan (jika ada) ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.7",
              "Alokasi waktu untuk setiap kegiatan verifikasi ditetapkan",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0005",
        "section": "1. Kelengkapan Laporan Validasi Internal",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Kelengkapan Laporan Validasi Internal",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7"
          ],
          "source_rows": [
            [
              "1.1",
              "Laporan validasi internal mencakup seluruh ruas yang disurvei",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.2",
              "Laporan mencakup validasi harian selama 2 minggu",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.3",
              "Format laporan sesuai dengan standar yang disepakati",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.4",
              "Dokumentasi pendukung validasi internal tersedia",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.5",
              "Data statistik hasil validasi internal tersedia",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.6",
              "Temuan dan ketidaksesuaian didokumentasikan dengan jelas",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.7",
              "Laporan ditandatangani oleh personil yang berwenang",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0006",
        "section": "2. Kesesuaian Kriteria Validasi Internal",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Kesesuaian Kriteria Validasi Internal",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7"
          ],
          "source_rows": [
            [
              "2.1",
              "Kriteria validasi format data sesuai standar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.2",
              "Kriteria validasi kelengkapan data sesuai standar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.3",
              "Kriteria validasi ketelitian data sesuai standar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.4",
              "Kriteria validasi kewajaran data sesuai standar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.5",
              "Ambang batas penyimpangan sesuai dengan pedoman teknis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.6",
              "Metode sampling internal sesuai dengan standar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.7",
              "Proses validasi internal dilakukan secara konsisten",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0007",
        "section": "3. Tindak Lanjut Temuan Internal",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Tindak Lanjut Temuan Internal",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7"
          ],
          "source_rows": [
            [
              "3.1",
              "Semua temuan dari validasi internal telah ditindaklanjuti",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.2",
              "Tindakan perbaikan untuk ketidaksesuaian didokumentasikan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.3",
              "Tindakan pencegahan untuk menghindari pengulangan ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.4",
              "Hasil perbaikan data telah diverifikasi ulang secara internal",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.5",
              "Bukti tindak lanjut disertakan dalam laporan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.6",
              "Status tindak lanjut setiap temuan jelas",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.7",
              "Efektivitas tindakan perbaikan dievaluasi",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0008",
        "section": "1. Pengambilan Sampel",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Pengambilan Sampel",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7"
          ],
          "source_rows": [
            [
              "1.1",
              "Pengambilan sampel minimal 5% dari total data 2 minggu",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.2",
              "Sampel mewakili berbagai karakteristik ruas jalan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.3",
              "Sampel mencakup semua parameter RNI",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.4",
              "Metode pengambilan sampel terdokumentasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.5",
              "Sampel mencakup data yang dilaporkan bermasalah",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.6",
              "Sampel mencakup data yang diperbaiki",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.7",
              "Lokasi pengambilan sampel terdistribusi merata",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0009",
        "section": "2. Pemeriksaan Parameter Kunci",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Pemeriksaan Parameter Kunci",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7"
          ],
          "source_rows": [
            [
              "2.1",
              "Verifikasi data koordinat dari sampel",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.2",
              "Verifikasi data jarak dari sampel",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.3",
              "Verifikasi data penampang melintang dari sampel",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.4",
              "Verifikasi data drainase dari sampel",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.5",
              "Verifikasi objek referensi dari sampel",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.6",
              "Verifikasi data atribut (tipe jalan, kondisi) dari sampel",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.7",
              "Kesesuaian dengan dokumentasi visual diperiksa",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0010",
        "section": "3. Analisis Konsistensi Data",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Analisis Konsistensi Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7"
          ],
          "source_rows": [
            [
              "3.1",
              "Konsistensi data koordinat dalam batas toleransi (±6m)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.2",
              "Konsistensi pengukuran jarak dalam batas toleransi (0.1%)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.3",
              "Konsistensi pengukuran lebar dalam batas toleransi (10 cm)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.4",
              "Konsistensi metode pengukuran antar tim survei",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.5",
              "Konsistensi data antar segmen yang berdekatan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.6",
              "Konsistensi antara data dan dokumentasi visual",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.7",
              "Standar deviasi pengukuran ulang < 5%",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0011",
        "section": "1. Kesesuaian dengan Pedoman Teknis",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Kesesuaian dengan Pedoman Teknis",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7"
          ],
          "source_rows": [
            [
              "1.1",
              "Kesesuaian dengan Peraturan Menteri PU No. 17 tahun 2007",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.2",
              "Kesesuaian dengan SE Dirjen Bina Marga terkait RNI",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.3",
              "Kesesuaian dengan sistem LRS (Linear Referencing System)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.4",
              "Kesesuaian metode pengukuran dengan standar teknis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.5",
              "Kesesuaian klasifikasi dan kodefikasi objek dengan standar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.6",
              "Kesesuaian metode kalibrasi alat dengan standar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.7",
              "Kesesuaian prosedur pengendalian mutu dengan standar",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0012",
        "section": "2. Kesesuaian dengan Spesifikasi Kontrak",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Kesesuaian dengan Spesifikasi Kontrak",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7"
          ],
          "source_rows": [
            [
              "2.1",
              "Kesesuaian dengan ruang lingkup pekerjaan dalam kontrak",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.2",
              "Kesesuaian dengan spesifikasi alat dalam kontrak",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.3",
              "Kesesuaian dengan spesifikasi metode dalam kontrak",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.4",
              "Kesesuaian dengan spesifikasi personil dalam kontrak",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.5",
              "Kesesuaian dengan jadwal dalam kontrak",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.6",
              "Kesesuaian dengan prosedur QA/QC dalam kontrak",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.7",
              "Kesesuaian dengan format pelaporan dalam kontrak",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0013",
        "section": "3. Kesesuaian dengan Standar SMD Jalan",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Kesesuaian dengan Standar SMD Jalan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7"
          ],
          "source_rows": [
            [
              "3.1",
              "Format data sesuai dengan format SMD Jalan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.2",
              "Struktur data sesuai dengan struktur SMD Jalan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.3",
              "Metadata sesuai dengan standar SMD Jalan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.4",
              "Kodefikasi objek sesuai dengan standar SMD Jalan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.5",
              "Atribut data sesuai dengan standar SMD Jalan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.6",
              "Data siap untuk diunggah ke SMD Jalan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.7",
              "Data dapat diintegrasikan dengan data eksisting",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0014",
        "section": "1. Kesesuaian dengan Jadwal",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Kesesuaian dengan Jadwal",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7"
          ],
          "source_rows": [
            [
              "1.1",
              "Progres aktual sesuai dengan jadwal rencana",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.2",
              "Deviasi jadwal dalam batas toleransi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.3",
              "Penyebab keterlambatan (jika ada) teridentifikasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.4",
              "Rencana perbaikan jadwal (jika diperlukan) tersedia",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.5",
              "Jadwal pengolahan data sesuai rencana",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.6",
              "Jadwal pengunggahan data ke SMD Jalan sesuai rencana",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.7",
              "Jadwal penyerahan laporan sesuai rencana",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0015",
        "section": "2. Kesesuaian dengan Target Volume",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Kesesuaian dengan Target Volume",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7"
          ],
          "source_rows": [
            [
              "2.1",
              "Volume survei aktual sesuai dengan target 2 mingguan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.2",
              "Jumlah ruas yang disurvei sesuai target",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.3",
              "Panjang total yang disurvei sesuai target",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.4",
              "Volume parameter RNI sesuai target",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.5",
              "Volume pengolahan data sesuai target",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.6",
              "Distribusi volume antar tim survei sesuai rencana",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.7",
              "Rencana pencapaian target (jika tertinggal) tersedia",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0016",
        "section": "3. Kualitas Hasil Survei",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Kualitas Hasil Survei",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7"
          ],
          "source_rows": [
            [
              "3.1",
              "Jumlah temuan ketidaksesuaian menurun dibanding periode sebelumnya",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.2",
              "Tingkat keparahan ketidaksesuaian menurun",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.3",
              "Persentase data valid meningkat",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.4",
              "Kualitas dokumentasi visual memadai",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.5",
              "Kualitas pengukuran konsisten",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.6",
              "Penggunaan alat dan metode konsisten",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.7",
              "Tindakan perbaikan dari periode sebelumnya efektif",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0017",
        "section": "1. Identifikasi Temuan",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Identifikasi Temuan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7"
          ],
          "source_rows": [
            [
              "1.1",
              "Temuan ketidaksesuaian dari verifikasi diidentifikasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.2",
              "Temuan dikategorikan berdasarkan jenis (format, kelengkapan, dll)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.3",
              "Temuan dikategorikan berdasarkan tingkat keparahan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.4",
              "Temuan didokumentasikan dengan jelas",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.5",
              "Bukti temuan (screenshot, data) dilampirkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.6",
              "Penyebab temuan dianalisis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.7",
              "Dampak temuan terhadap hasil survei dianalisis",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0018",
        "section": "2. Rekomendasi Tindakan Perbaikan",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Rekomendasi Tindakan Perbaikan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7"
          ],
          "source_rows": [
            [
              "2.1",
              "Rekomendasi tindakan perbaikan ditetapkan untuk setiap temuan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.2",
              "Prioritas tindakan perbaikan ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.3",
              "Tenggat waktu tindakan perbaikan ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.4",
              "Penanggung jawab tindakan perbaikan ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.5",
              "Metode verifikasi hasil perbaikan ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.6",
              "Tindakan pencegahan untuk menghindari pengulangan ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.7",
              "Rekomendasi disepakati oleh Penyedia Jasa dan Pengguna Jasa",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0019",
        "section": "3. Evaluasi Tindak Lanjut Periode Sebelumnya",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Evaluasi Tindak Lanjut Periode Sebelumnya",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7"
          ],
          "source_rows": [
            [
              "3.1",
              "Status tindak lanjut temuan periode sebelumnya dievaluasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.2",
              "Bukti tindak lanjut tersedia",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.3",
              "Efektivitas tindak lanjut dievaluasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.4",
              "Temuan yang belum diselesaikan diidentifikasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.5",
              "Kendala dalam tindak lanjut diidentifikasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.6",
              "Solusi untuk kendala tindak lanjut ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.7",
              "Pembelajaran dari tindak lanjut didokumentasikan",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0020",
        "section": "1. Penerbitan Berita Acara",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Penerbitan Berita Acara",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7"
          ],
          "source_rows": [
            [
              "1.1",
              "Berita acara verifikasi dan validasi 2-mingguan dibuat",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.2",
              "Format berita acara sesuai standar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.3",
              "Berita acara mencakup informasi lengkap proses verifikasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.4",
              "Berita acara mencakup ringkasan temuan dan rekomendasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.5",
              "Berita acara dilengkapi dengan lampiran yang relevan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.6",
              "Berita acara ditandatangani oleh perwakilan berwenang",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.7",
              "Berita acara diterbitkan tepat waktu",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0021",
        "section": "2. Pelaporan dan Distribusi",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Pelaporan dan Distribusi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7"
          ],
          "source_rows": [
            [
              "2.1",
              "Laporan verifikasi dan validasi 2-mingguan dibuat",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.2",
              "Laporan mencakup analisis tren dan statistik",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.3",
              "Laporan mencakup grafik dan visualisasi temuan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.4",
              "Laporan didistribusikan kepada pihak terkait",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.5",
              "Ringkasan eksekutif untuk manajemen dibuat",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.6",
              "Laporan teknis detail tersedia",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.7",
              "Laporan dikirimkan tepat waktu",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0022",
        "section": "3. Dokumentasi dan Pengarsipan",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Dokumentasi dan Pengarsipan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7"
          ],
          "source_rows": [
            [
              "3.1",
              "Semua dokumen verifikasi diarsipkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.2",
              "Data sampel yang diverifikasi diarsipkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.3",
              "Hasil analisis diarsipkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.4",
              "Dokumentasi temuan diarsipkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.5",
              "Berita acara dan laporan diarsipkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.6",
              "Sistem pengarsipan terorganisir dan terindeks",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.7",
              "Backup dokumentasi tersedia",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0023",
        "section": "3. Dokumentasi dan Pengarsipan",
        "options": [],
        "required": false,
        "order": 23,
        "sourceOrder": 23,
        "unit": "",
        "rule": {},
        "label": "KESIMPULAN DAN REKOMENDASI",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0024",
        "section": "3. Dokumentasi dan Pengarsipan",
        "options": [],
        "required": false,
        "order": 24,
        "sourceOrder": 24,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Dokumentasi dan Pengarsipan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Komponen",
            "Hasil",
            "Catatan"
          ],
          "row_labels": [
            "A. Persiapan Verifikasi dan Validasi 2-Mingguan",
            "B. Verifikasi Hasil Validasi Internal Penyedia Jasa",
            "C. Pemeriksaan Sampling Data Teknis",
            "D. Verifikasi Kesesuaian dengan Standar Teknis",
            "E. Validasi Progres Survei",
            "F. Tindak Lanjut dan Rekomendasi",
            "G. Dokumentasi dan Pelaporan"
          ],
          "source_rows": [
            [
              "A. Persiapan Verifikasi dan Validasi 2-Mingguan",
              "□ Memenuhi □ Tidak Memenuhi",
              ""
            ],
            [
              "B. Verifikasi Hasil Validasi Internal Penyedia Jasa",
              "□ Memenuhi □ Tidak Memenuhi",
              ""
            ],
            [
              "C. Pemeriksaan Sampling Data Teknis",
              "□ Memenuhi □ Tidak Memenuhi",
              ""
            ],
            [
              "D. Verifikasi Kesesuaian dengan Standar Teknis",
              "□ Memenuhi □ Tidak Memenuhi",
              ""
            ],
            [
              "E. Validasi Progres Survei",
              "□ Memenuhi □ Tidak Memenuhi",
              ""
            ],
            [
              "F. Tindak Lanjut dan Rekomendasi",
              "□ Memenuhi □ Tidak Memenuhi",
              ""
            ],
            [
              "G. Dokumentasi dan Pelaporan",
              "□ Memenuhi □ Tidak Memenuhi",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0025",
        "section": "3. Dokumentasi dan Pengarsipan",
        "options": [],
        "required": false,
        "order": 25,
        "sourceOrder": 25,
        "unit": "",
        "rule": {},
        "label": "Rekomendasi:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0026",
        "section": "3. Dokumentasi dan Pengarsipan",
        "options": [],
        "required": false,
        "order": 26,
        "sourceOrder": 26,
        "unit": "",
        "rule": {},
        "label": "PERSETUJUAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0027",
        "section": "3. Dokumentasi dan Pengarsipan",
        "options": [],
        "required": false,
        "order": 27,
        "sourceOrder": 27,
        "unit": "",
        "rule": {},
        "label": "Tanggal Verifikasi: _______________________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0028",
        "section": "3. Dokumentasi dan Pengarsipan",
        "options": [],
        "required": false,
        "order": 28,
        "sourceOrder": 28,
        "unit": "",
        "rule": {},
        "label": "Tim Verifikasi dan Validasi:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0029",
        "section": "3. Dokumentasi dan Pengarsipan",
        "options": [],
        "required": false,
        "order": 29,
        "sourceOrder": 29,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Dokumentasi dan Pengarsipan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Nama",
            "Jabatan",
            "Tanda Tangan"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3."
          ],
          "source_rows": [
            [
              "1.",
              "",
              "",
              ""
            ],
            [
              "2.",
              "",
              "",
              ""
            ],
            [
              "3.",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0030",
        "section": "3. Dokumentasi dan Pengarsipan",
        "options": [],
        "required": false,
        "order": 30,
        "sourceOrder": 30,
        "unit": "",
        "rule": {},
        "label": "Disetujui oleh:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0031",
        "section": "3. Dokumentasi dan Pengarsipan",
        "options": [],
        "required": false,
        "order": 31,
        "sourceOrder": 31,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Dokumentasi dan Pengarsipan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Pihak",
            "Nama",
            "Jabatan",
            "Tanda Tangan",
            "Tanggal"
          ],
          "row_labels": [
            "Penyedia Jasa",
            "Pengguna Jasa",
            "PPK Fisik"
          ],
          "source_rows": [
            [
              "Penyedia Jasa",
              "",
              "",
              "",
              ""
            ],
            [
              "Pengguna Jasa",
              "",
              "",
              "",
              ""
            ],
            [
              "PPK Fisik",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0032",
        "section": "3. Dokumentasi dan Pengarsipan",
        "options": [],
        "required": false,
        "order": 32,
        "sourceOrder": 32,
        "unit": "",
        "rule": {},
        "label": "Lampiran:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0033",
        "section": "3. Dokumentasi dan Pengarsipan",
        "options": [],
        "required": false,
        "order": 33,
        "sourceOrder": 33,
        "unit": "",
        "rule": {},
        "label": "Daftar ruas dan segmen yang diverifikasi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0034",
        "section": "3. Dokumentasi dan Pengarsipan",
        "options": [],
        "required": false,
        "order": 34,
        "sourceOrder": 34,
        "unit": "",
        "rule": {},
        "label": "Rangkuman temuan ketidaksesuaian",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0035",
        "section": "3. Dokumentasi dan Pengarsipan",
        "options": [],
        "required": false,
        "order": 35,
        "sourceOrder": 35,
        "unit": "",
        "rule": {},
        "label": "Daftar tindak lanjut periode sebelumnya dan statusnya",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0036",
        "section": "3. Dokumentasi dan Pengarsipan",
        "options": [],
        "required": false,
        "order": 36,
        "sourceOrder": 36,
        "unit": "",
        "rule": {},
        "label": "Analisis tren verifikasi dan validasi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_PERIODIC14_0037",
        "section": "3. Dokumentasi dan Pengarsipan",
        "options": [],
        "required": false,
        "order": 37,
        "sourceOrder": 37,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi visual verifikasi lapangan (jika ada)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-23-rni-internal",
    "survey": "RNI",
    "phase": "internal",
    "items": [
      {
        "code": "DOCX_RNI_INTERNAL_0001",
        "section": "Informasi dan Pemeriksaan",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: Informasi dan Pemeriksaan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "INFORMASI PROYEK",
            ""
          ],
          "row_labels": [
            "Nama Proyek",
            "Nomor Kontrak",
            "Penyedia Jasa",
            "Periode Survei",
            "Lokasi Survei",
            "Tanggal Checklist",
            "No. Dokumen"
          ],
          "source_rows": [
            [
              "Nama Proyek",
              ": __________________________________"
            ],
            [
              "Nomor Kontrak",
              ": __________________________________"
            ],
            [
              "Penyedia Jasa",
              ": __________________________________"
            ],
            [
              "Periode Survei",
              ": __________________________________"
            ],
            [
              "Lokasi Survei",
              ": __________________________________"
            ],
            [
              "Tanggal Checklist",
              ": __________________________________"
            ],
            [
              "No. Dokumen",
              ": __________________________________"
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0002",
        "section": "1. Tim Verifikasi dan Validasi Internal",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Tim Verifikasi dan Validasi Internal",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7"
          ],
          "source_rows": [
            [
              "1.1",
              "Tim verifikasi dan validasi internal telah dibentuk",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.2",
              "Personil tim memiliki kompetensi yang sesuai",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.3",
              "Peran dan tanggung jawab tim didefinisikan dengan jelas",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.4",
              "Tim terpisah dari tim pengumpul data",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.5",
              "Tim telah mendapatkan pelatihan tentang prosedur verifikasi dan validasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.6",
              "Tim memahami persyaratan teknis RNI secara menyeluruh",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.7",
              "Koordinator verifikasi dan validasi internal telah ditunjuk",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0003",
        "section": "2. Perencanaan Verifikasi dan Validasi",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Perencanaan Verifikasi dan Validasi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7"
          ],
          "source_rows": [
            [
              "2.1",
              "Rencana verifikasi dan validasi internal telah disusun",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.2",
              "Jadwal verifikasi harian telah ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.3",
              "Jadwal validasi 2 mingguan telah ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.4",
              "Metode sampling data untuk validasi telah ditentukan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.5",
              "Alokasi sumber daya untuk verifikasi dan validasi mencukupi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.6",
              "Prosedur verifikasi dan validasi didokumentasikan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.7",
              "Rencana telah dikomunikasikan ke semua pihak terkait",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0004",
        "section": "3. Penetapan Kriteria Penerimaan",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Penetapan Kriteria Penerimaan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7"
          ],
          "source_rows": [
            [
              "3.1",
              "Kriteria penerimaan format data telah ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.2",
              "Kriteria penerimaan kelengkapan data telah ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.3",
              "Kriteria penerimaan ketelitian data telah ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.4",
              "Kriteria penerimaan kewajaran data telah ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.5",
              "Ambang batas penyimpangan ditetapkan untuk setiap parameter",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.6",
              "Kriteria penerimaan sesuai dengan standar teknis yang berlaku",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.7",
              "Kriteria penerimaan dikomunikasikan kepada semua pihak terkait",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0005",
        "section": "1. Kelengkapan Data Survei",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Kelengkapan Data Survei",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7",
            "1.8"
          ],
          "source_rows": [
            [
              "1.1",
              "Semua segmen yang disurvei pada hari tersebut terdata",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.2",
              "Data koordinat tersedia untuk semua segmen",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.3",
              "Data jarak tersedia untuk semua segmen",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.4",
              "Data penampang melintang tersedia untuk semua titik perubahan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.5",
              "Data drainase tersedia untuk semua titik perubahan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.6",
              "Data objek referensi tersedia",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.7",
              "Dokumentasi visual (foto/video) tersedia",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.8",
              "Metadata survei lengkap (tanggal, waktu, operator, alat)",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0006",
        "section": "2. Format Data",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Format Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7",
            "2.8"
          ],
          "source_rows": [
            [
              "2.1",
              "Format data koordinat sesuai (desimal, DMS, UTM)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.2",
              "Format data jarak dalam satuan meter",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.3",
              "Format data atribut sesuai dengan kode standar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.4",
              "Format data penampang melintang sesuai",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.5",
              "Format data drainase sesuai",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.6",
              "Format penamaan file sesuai standar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.7",
              "Format dokumentasi visual sesuai",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.8",
              "Format metadata sesuai standar",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0007",
        "section": "3. Kewajaran Data",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Kewajaran Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7",
            "3.8"
          ],
          "source_rows": [
            [
              "3.1",
              "Tidak ada data koordinat yang ekstrim/outlier",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.2",
              "Tidak ada data jarak yang ekstrim/outlier",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.3",
              "Lebar perkerasan masuk dalam rentang wajar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.4",
              "Lebar bahu jalan masuk dalam rentang wajar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.5",
              "Lebar median masuk dalam rentang wajar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.6",
              "Lebar saluran masuk dalam rentang wajar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.7",
              "Tidak ada data duplikat",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.8",
              "Tidak ada data yang bertentangan satu sama lain",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0008",
        "section": "1. Kelengkapan Data",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Kelengkapan Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7",
            "1.8"
          ],
          "source_rows": [
            [
              "1.1",
              "Semua ruas yang disurvei dalam periode 2 minggu terdata",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.2",
              "Semua data harian dalam periode 2 minggu telah diverifikasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.3",
              "Semua perubahan geometri tercatat dengan lengkap",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.4",
              "Semua objek referensi tercatat dengan lengkap",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.5",
              "Tidak ada kesenjangan (gap) data antar segmen",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.6",
              "Data survei konsistensi berkala tersedia",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.7",
              "Data kalibrasi alat dalam periode tersedia",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.8",
              "Dokumentasi visual mencakup semua ruas yang disurvei",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0009",
        "section": "2. Ketelitian Data",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Ketelitian Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7",
            "2.8"
          ],
          "source_rows": [
            [
              "2.1",
              "Ketelitian pengukuran jarak memenuhi standar (0.1%)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.2",
              "Ketelitian koordinat memenuhi standar (±6m pada 90% waktu)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.3",
              "Ketelitian pengukuran lebar memenuhi standar (10 cm)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.4",
              "Standar deviasi pengukuran berulang < 5%",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.5",
              "Pengukuran koordinat LRP konsisten",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.6",
              "Pengukuran jarak antar LRP konsisten",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.7",
              "Pengukuran berulang pada segmen yang sama konsisten",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.8",
              "Pengukuran oleh operator berbeda pada segmen yang sama konsisten",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0010",
        "section": "3. Kesesuaian dengan Standar Teknis",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Kesesuaian dengan Standar Teknis",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7",
            "3.8"
          ],
          "source_rows": [
            [
              "3.1",
              "Data sesuai dengan format LRS (Linear Referencing System)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.2",
              "Data koordinat sesuai dengan SHP file acuan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.3",
              "Data penampang melintang sesuai dengan standar teknis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.4",
              "Data drainase sesuai dengan standar teknis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.5",
              "Kodifikasi objek referensi sesuai dengan standar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.6",
              "Kode atribut sesuai dengan standar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.7",
              "Klasifikasi tipe jalan sesuai dengan standar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.8",
              "Klasifikasi tipe terrain sesuai dengan standar",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0011",
        "section": "1. Pemeriksaan Silang Antar Parameter",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Pemeriksaan Silang Antar Parameter",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7",
            "1.8"
          ],
          "source_rows": [
            [
              "1.1",
              "Kesesuaian antara koordinat dan jarak",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.2",
              "Kesesuaian antara penampang melintang dan dokumentasi visual",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.3",
              "Kesesuaian antara data drainase dan dokumentasi visual",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.4",
              "Kesesuaian antara objek referensi dan koordinat",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.5",
              "Kesesuaian antara jenis permukaan dan dokumentasi visual",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.6",
              "Kesesuaian antara tipe terrain dan dokumentasi visual",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.7",
              "Kesesuaian antara tata guna lahan dan dokumentasi visual",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.8",
              "Kesesuaian antara data LRP dan objek referensi lapangan",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0012",
        "section": "2. Pemeriksaan Silang Antar Segmen",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Pemeriksaan Silang Antar Segmen",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7",
            "2.8"
          ],
          "source_rows": [
            [
              "2.1",
              "Kontinuitas data antar segmen yang berdekatan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.2",
              "Transisi geometri antar segmen logis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.3",
              "Transisi penampang melintang antar segmen logis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.4",
              "Transisi drainase antar segmen logis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.5",
              "Perubahan tipe jalan antar segmen logis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.6",
              "Perubahan tipe terrain antar segmen logis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.7",
              "Tidak ada tumpang-tindih (overlap) segmen",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.8",
              "Tidak ada kesenjangan (gap) antar segmen",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0013",
        "section": "3. Pemeriksaan Silang dengan Data Sebelumnya",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Pemeriksaan Silang dengan Data Sebelumnya",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7",
            "3.8"
          ],
          "source_rows": [
            [
              "3.1",
              "Kesesuaian dengan data RNI terdahulu (jika ada)",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.2",
              "Perubahan signifikan dari data terdahulu diverifikasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.3",
              "Perubahan geometri sejak survei terakhir logis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.4",
              "Perubahan penampang melintang sejak survei terakhir logis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.5",
              "Perubahan drainase sejak survei terakhir logis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.6",
              "Perubahan objek referensi sejak survei terakhir logis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.7",
              "Perubahan tata guna lahan sejak survei terakhir logis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.8",
              "Perubahan kondisi jalan sejak survei terakhir logis",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0014",
        "section": "1. Identifikasi Ketidaksesuaian",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Identifikasi Ketidaksesuaian",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7",
            "1.8"
          ],
          "source_rows": [
            [
              "1.1",
              "Ketidaksesuaian format data diidentifikasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.2",
              "Ketidaksesuaian kelengkapan data diidentifikasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.3",
              "Ketidaksesuaian ketelitian data diidentifikasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.4",
              "Ketidaksesuaian kewajaran data diidentifikasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.5",
              "Ketidaksesuaian dikategorikan berdasarkan tingkat keparahan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.6",
              "Penyebab ketidaksesuaian dianalisis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.7",
              "Ketidaksesuaian dikomunikasikan kepada tim survei",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.8",
              "Ketidaksesuaian didokumentasikan dalam laporan",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0015",
        "section": "2. Tindakan Perbaikan",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Tindakan Perbaikan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7",
            "2.8"
          ],
          "source_rows": [
            [
              "2.1",
              "Tindakan perbaikan ditetapkan untuk setiap ketidaksesuaian",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.2",
              "Jadwal tindakan perbaikan ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.3",
              "Penanggung jawab tindakan perbaikan ditetapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.4",
              "Survei ulang dilakukan jika diperlukan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.5",
              "Pemrosesan ulang data dilakukan jika diperlukan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.6",
              "Pelatihan ulang personil dilakukan jika diperlukan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.7",
              "Kalibrasi ulang alat dilakukan jika diperlukan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.8",
              "Tindakan pencegahan ditetapkan untuk menghindari pengulangan",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0016",
        "section": "3. Verifikasi Hasil Perbaikan",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Verifikasi Hasil Perbaikan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7",
            "3.8"
          ],
          "source_rows": [
            [
              "3.1",
              "Hasil tindakan perbaikan diverifikasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.2",
              "Hasil perbaikan memenuhi kriteria penerimaan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.3",
              "Data hasil perbaikan diintegrasikan ke database",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.4",
              "Efektivitas tindakan perbaikan dievaluasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.5",
              "Efektivitas tindakan pencegahan dipantau",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.6",
              "Pembelajaran dari tindakan perbaikan didokumentasikan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.7",
              "Prosedur survei diperbarui berdasarkan pembelajaran",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.8",
              "Hasil verifikasi tindakan perbaikan dilaporkan",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0017",
        "section": "1. Berita Acara Verifikasi dan Validasi Internal",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Berita Acara Verifikasi dan Validasi Internal",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "1.1",
            "1.2",
            "1.3",
            "1.4",
            "1.5",
            "1.6",
            "1.7",
            "1.8"
          ],
          "source_rows": [
            [
              "1.1",
              "Berita acara verifikasi harian dibuat",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.2",
              "Berita acara validasi 2 mingguan dibuat",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.3",
              "Format berita acara sesuai standar",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.4",
              "Berita acara dilengkapi dengan temuan dan rekomendasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.5",
              "Berita acara ditandatangani oleh pihak berwenang",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.6",
              "Berita acara didistribusikan kepada pihak terkait",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.7",
              "Berita acara diarsipkan dengan baik",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "1.8",
              "Berita acara tindak lanjut ketidaksesuaian dibuat",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0018",
        "section": "2. Statistik Verifikasi dan Validasi",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Statistik Verifikasi dan Validasi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5",
            "2.6",
            "2.7",
            "2.8"
          ],
          "source_rows": [
            [
              "2.1",
              "Statistik jumlah data yang diverifikasi dibuat",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.2",
              "Statistik jumlah data yang divalidasi dibuat",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.3",
              "Statistik jumlah ketidaksesuaian dibuat",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.4",
              "Statistik jenis ketidaksesuaian dibuat",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.5",
              "Statistik tindakan perbaikan dibuat",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.6",
              "Tren ketidaksesuaian dianalisis",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.7",
              "Grafik statistik dibuat",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "2.8",
              "Statistik disampaikan dalam laporan",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0019",
        "section": "3. Manajemen Data Verifikasi dan Validasi",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Manajemen Data Verifikasi dan Validasi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Kriteria Pemeriksaan",
            "Ya",
            "Tidak",
            "N/A",
            "Catatan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7",
            "3.8"
          ],
          "source_rows": [
            [
              "3.1",
              "Data hasil verifikasi dan validasi dikelola dengan baik",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.2",
              "Basis data terpusat untuk penyimpanan hasil digunakan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.3",
              "Sistem backup rutin diterapkan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.4",
              "Akses ke data dikendalikan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.5",
              "Perubahan data terdokumentasi",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.6",
              "Data dapat diakses untuk audit",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.7",
              "Data disinkronkan dengan sistem SMD Jalan",
              "□",
              "□",
              "□",
              ""
            ],
            [
              "3.8",
              "Data dikomunikasikan kepada pengguna jasa",
              "□",
              "□",
              "□",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0020",
        "section": "3. Manajemen Data Verifikasi dan Validasi",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "KESIMPULAN DAN REKOMENDASI",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0021",
        "section": "3. Manajemen Data Verifikasi dan Validasi",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Manajemen Data Verifikasi dan Validasi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Komponen",
            "Hasil",
            "Catatan"
          ],
          "row_labels": [
            "A. Persiapan Verifikasi dan Validasi Internal",
            "B. Verifikasi Data Harian",
            "C. Validasi Data Berkala",
            "D. Pemeriksaan Silang Data",
            "E. Tindak Lanjut Ketidaksesuaian",
            "F. Dokumentasi dan Pelaporan"
          ],
          "source_rows": [
            [
              "A. Persiapan Verifikasi dan Validasi Internal",
              "□ Memenuhi □ Tidak Memenuhi",
              ""
            ],
            [
              "B. Verifikasi Data Harian",
              "□ Memenuhi □ Tidak Memenuhi",
              ""
            ],
            [
              "C. Validasi Data Berkala",
              "□ Memenuhi □ Tidak Memenuhi",
              ""
            ],
            [
              "D. Pemeriksaan Silang Data",
              "□ Memenuhi □ Tidak Memenuhi",
              ""
            ],
            [
              "E. Tindak Lanjut Ketidaksesuaian",
              "□ Memenuhi □ Tidak Memenuhi",
              ""
            ],
            [
              "F. Dokumentasi dan Pelaporan",
              "□ Memenuhi □ Tidak Memenuhi",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0022",
        "section": "3. Manajemen Data Verifikasi dan Validasi",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "Rekomendasi:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0023",
        "section": "3. Manajemen Data Verifikasi dan Validasi",
        "options": [],
        "required": false,
        "order": 23,
        "sourceOrder": 23,
        "unit": "",
        "rule": {},
        "label": "PERSETUJUAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0024",
        "section": "3. Manajemen Data Verifikasi dan Validasi",
        "options": [],
        "required": false,
        "order": 24,
        "sourceOrder": 24,
        "unit": "",
        "rule": {},
        "label": "Tanggal Verifikasi: _______________________________",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0025",
        "section": "3. Manajemen Data Verifikasi dan Validasi",
        "options": [],
        "required": false,
        "order": 25,
        "sourceOrder": 25,
        "unit": "",
        "rule": {},
        "label": "Tim Verifikasi dan Validasi Internal:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0026",
        "section": "3. Manajemen Data Verifikasi dan Validasi",
        "options": [],
        "required": false,
        "order": 26,
        "sourceOrder": 26,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Manajemen Data Verifikasi dan Validasi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Nama",
            "Jabatan",
            "Tanda Tangan"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3."
          ],
          "source_rows": [
            [
              "1.",
              "",
              "",
              ""
            ],
            [
              "2.",
              "",
              "",
              ""
            ],
            [
              "3.",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0027",
        "section": "3. Manajemen Data Verifikasi dan Validasi",
        "options": [],
        "required": false,
        "order": 27,
        "sourceOrder": 27,
        "unit": "",
        "rule": {},
        "label": "Disetujui oleh:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0028",
        "section": "3. Manajemen Data Verifikasi dan Validasi",
        "options": [],
        "required": false,
        "order": 28,
        "sourceOrder": 28,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Manajemen Data Verifikasi dan Validasi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Pihak",
            "Nama",
            "Jabatan",
            "Tanda Tangan",
            "Tanggal"
          ],
          "row_labels": [
            "Penyedia Jasa",
            "Pengguna Jasa"
          ],
          "source_rows": [
            [
              "Penyedia Jasa",
              "",
              "",
              "",
              ""
            ],
            [
              "Pengguna Jasa",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 2,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0029",
        "section": "3. Manajemen Data Verifikasi dan Validasi",
        "options": [],
        "required": false,
        "order": 29,
        "sourceOrder": 29,
        "unit": "",
        "rule": {},
        "label": "Lampiran:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0030",
        "section": "3. Manajemen Data Verifikasi dan Validasi",
        "options": [],
        "required": false,
        "order": 30,
        "sourceOrder": 30,
        "unit": "",
        "rule": {},
        "label": "Laporan statistik verifikasi dan validasi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0031",
        "section": "3. Manajemen Data Verifikasi dan Validasi",
        "options": [],
        "required": false,
        "order": 31,
        "sourceOrder": 31,
        "unit": "",
        "rule": {},
        "label": "Daftar ketidaksesuaian dan status tindak lanjut",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0032",
        "section": "3. Manajemen Data Verifikasi dan Validasi",
        "options": [],
        "required": false,
        "order": 32,
        "sourceOrder": 32,
        "unit": "",
        "rule": {},
        "label": "Catatan tindakan perbaikan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_RNI_INTERNAL_0033",
        "section": "3. Manajemen Data Verifikasi dan Validasi",
        "options": [],
        "required": false,
        "order": 33,
        "sourceOrder": 33,
        "unit": "",
        "rule": {},
        "label": "Hasil analisis tren verifikasi dan validasi",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-combined-iri-consistency",
    "survey": "IRI",
    "phase": "consistency",
    "items": [
      {
        "code": "DOCX_IRI_CONSISTENCY_0001",
        "section": "1. Informasi Umum",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 1. Informasi Umum",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Item",
            "Detail"
          ],
          "row_labels": [
            "Nama Proyek",
            "Nomor Kontrak",
            "Periode Konsistensi",
            "Lokasi",
            "Tanggal Pemeriksaan",
            "Nama Petugas",
            "Nama Supervisor"
          ],
          "source_rows": [
            [
              "Nama Proyek",
              ""
            ],
            [
              "Nomor Kontrak",
              ""
            ],
            [
              "Periode Konsistensi",
              ""
            ],
            [
              "Lokasi",
              ""
            ],
            [
              "Tanggal Pemeriksaan",
              ""
            ],
            [
              "Nama Petugas",
              ""
            ],
            [
              "Nama Supervisor",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_CONSISTENCY_0002",
        "section": "2. Keterulangan (Repeatability)",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 2. Keterulangan (Repeatability)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "2.1",
            "2.2",
            "2.3",
            "2.4",
            "2.5"
          ],
          "source_rows": [
            [
              "2.1",
              "Survei ulang dilakukan pada ruas yang sama (min. 5 km) setiap 14 hari",
              "☐",
              "☐",
              ""
            ],
            [
              "2.2",
              "Survei ulang dilakukan sebanyak 3 lintasan",
              "☐",
              "☐",
              ""
            ],
            [
              "2.3",
              "Hasil pengukuran ulang konsisten dengan hasil awal",
              "☐",
              "☐",
              ""
            ],
            [
              "2.4",
              "Standar deviasi pengukuran pada setiap segmen berada dalam batas toleransi",
              "☐",
              "☐",
              ""
            ],
            [
              "2.5",
              "Variasi hasil pengukuran tidak melebihi 5%",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_CONSISTENCY_0003",
        "section": "3. Kondisi Operasional",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 3. Kondisi Operasional",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "3.1",
            "3.2",
            "3.3",
            "3.4",
            "3.5",
            "3.6",
            "3.7",
            "3.8",
            "3.9",
            "3.10"
          ],
          "source_rows": [
            [
              "3.1",
              "Kendaraan survei dalam kondisi baik",
              "☐",
              "☐",
              ""
            ],
            [
              "3.2",
              "Bounce test dilakukan setiap hari",
              "☐",
              "☐",
              ""
            ],
            [
              "3.3",
              "Kecepatan kendaraan sesuai rekomendasi pabrik",
              "☐",
              "☐",
              ""
            ],
            [
              "3.4",
              "Pemeriksaan terhadap sistem sensor dilakukan",
              "☐",
              "☐",
              ""
            ],
            [
              "3.5",
              "Pemeriksaan terhadap peralatan perekam data dilakukan",
              "☐",
              "☐",
              ""
            ],
            [
              "3.6",
              "Kondisi ban kendaraan survei baik",
              "☐",
              "☐",
              ""
            ],
            [
              "3.7",
              "Tekanan ban sesuai rekomendasi",
              "☐",
              "☐",
              ""
            ],
            [
              "3.8",
              "Kondisi suspensi kendaraan baik",
              "☐",
              "☐",
              ""
            ],
            [
              "3.9",
              "Survei dilakukan pada cuaca kering",
              "☐",
              "☐",
              ""
            ],
            [
              "3.10",
              "Permukaan jalan dalam kondisi kering",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_CONSISTENCY_0004",
        "section": "4. Format dan Kualitas Data",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 4. Format dan Kualitas Data",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "4.1",
            "4.2",
            "4.3",
            "4.4",
            "4.5",
            "4.6",
            "4.7",
            "4.8",
            "4.9",
            "4.10"
          ],
          "source_rows": [
            [
              "4.1",
              "Data IRI disajikan dengan interval 100 meter",
              "☐",
              "☐",
              ""
            ],
            [
              "4.2",
              "Interval pengambilan data memanjang tidak lebih dari 50 mm",
              "☐",
              "☐",
              ""
            ],
            [
              "4.3",
              "Data terekam dari dua jalur roda per lajur",
              "☐",
              "☐",
              ""
            ],
            [
              "4.4",
              "Nilai IRI lajur adalah rata-rata dari roda kiri dan kanan",
              "☐",
              "☐",
              ""
            ],
            [
              "4.5",
              "Format data sesuai ketentuan SMD Jalan",
              "☐",
              "☐",
              ""
            ],
            [
              "4.6",
              "Metadata terekam dengan baik",
              "☐",
              "☐",
              ""
            ],
            [
              "4.7",
              "Nama ruas dan sta (chainage) terekam dengan benar",
              "☐",
              "☐",
              ""
            ],
            [
              "4.8",
              "Data koordinat GPS tersedia untuk setiap segmen 100m",
              "☐",
              "☐",
              ""
            ],
            [
              "4.9",
              "Arah pengukuran terekam dengan benar",
              "☐",
              "☐",
              ""
            ],
            [
              "4.10",
              "Kecepatan kendaraan saat survei terekam",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_CONSISTENCY_0005",
        "section": "5. Dokumentasi Konsistensi",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 5. Dokumentasi Konsistensi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Item Pemeriksaan",
            "Ya",
            "Tidak",
            "Keterangan"
          ],
          "row_labels": [
            "5.1",
            "5.2",
            "5.3",
            "5.4",
            "5.5"
          ],
          "source_rows": [
            [
              "5.1",
              "Log harian operasi alat tersedia",
              "☐",
              "☐",
              ""
            ],
            [
              "5.2",
              "Catatan kondisi lingkungan tersedia",
              "☐",
              "☐",
              ""
            ],
            [
              "5.3",
              "Faktor-faktor yang mempengaruhi pengukuran tercatat",
              "☐",
              "☐",
              ""
            ],
            [
              "5.4",
              "Berita acara konsistensi tersedia",
              "☐",
              "☐",
              ""
            ],
            [
              "5.5",
              "Dokumentasi foto/video saat survei tersedia",
              "☐",
              "☐",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_CONSISTENCY_0006",
        "section": "6. Hasil Konsistensi",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 6. Hasil Konsistensi",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Segmen",
            "Pengukuran 1",
            "Pengukuran 2",
            "Pengukuran 3",
            "Rata-rata",
            "Std. Deviasi",
            "CV (%)",
            "Status"
          ],
          "row_labels": [
            "1",
            "2",
            "3",
            "4",
            "5"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "4",
              "",
              "",
              "",
              "",
              "",
              "",
              ""
            ],
            [
              "5",
              "",
              "",
              "",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_CONSISTENCY_0007",
        "section": "7. Faktor-faktor yang Mempengaruhi Pengukuran",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 7. Faktor-faktor yang Mempengaruhi Pengukuran",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Jenis Faktor",
            "Ya",
            "Tidak",
            "Lokasi",
            "Keterangan"
          ],
          "row_labels": [
            "7.1",
            "7.2",
            "7.3",
            "7.4",
            "7.5",
            "7.6",
            "7.7",
            "7.8",
            "7.9",
            "7.10",
            "7.11"
          ],
          "source_rows": [
            [
              "7.1",
              "Kemacetan lalu lintas",
              "☐",
              "☐",
              "",
              ""
            ],
            [
              "7.2",
              "Kegiatan konstruksi jalan",
              "☐",
              "☐",
              "",
              ""
            ],
            [
              "7.3",
              "Hujan",
              "☐",
              "☐",
              "",
              ""
            ],
            [
              "7.4",
              "Genangan air",
              "☐",
              "☐",
              "",
              ""
            ],
            [
              "7.5",
              "Penyimpangan dari lajur yang diukur",
              "☐",
              "☐",
              "",
              ""
            ],
            [
              "7.6",
              "Kecepatan terlalu rendah",
              "☐",
              "☐",
              "",
              ""
            ],
            [
              "7.7",
              "Hentakan pada saat percepatan/perlambatan/berbelok",
              "☐",
              "☐",
              "",
              ""
            ],
            [
              "7.8",
              "Geometrik jalan yang berkelok-kelok/naik turun",
              "☐",
              "☐",
              "",
              ""
            ],
            [
              "7.9",
              "Abutments/expansion joints jembatan",
              "☐",
              "☐",
              "",
              ""
            ],
            [
              "7.10",
              "Lumpur, sampah di permukaan jalan",
              "☐",
              "☐",
              "",
              ""
            ],
            [
              "7.11",
              "Faktor lainnya (sebutkan)",
              "☐",
              "☐",
              "",
              ""
            ]
          ],
          "table_rows": 11,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_CONSISTENCY_0008",
        "section": "8. Tindakan Perbaikan",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 8. Tindakan Perbaikan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No",
            "Temuan",
            "Tindakan Perbaikan",
            "Status",
            "Tanggal Penyelesaian"
          ],
          "row_labels": [
            "1",
            "2",
            "3"
          ],
          "source_rows": [
            [
              "1",
              "",
              "",
              "",
              ""
            ],
            [
              "2",
              "",
              "",
              "",
              ""
            ],
            [
              "3",
              "",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_CONSISTENCY_0009",
        "section": "8. Tindakan Perbaikan",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Persetujuan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_IRI_CONSISTENCY_0010",
        "section": "8. Tindakan Perbaikan",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: 8. Tindakan Perbaikan",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Jabatan",
            "Nama",
            "Tanda Tangan",
            "Tanggal"
          ],
          "row_labels": [
            "Petugas Survei",
            "Supervisor",
            "Quality Control",
            "Pejabat Pembuat Komitmen"
          ],
          "source_rows": [
            [
              "Petugas Survei",
              "",
              "",
              ""
            ],
            [
              "Supervisor",
              "",
              "",
              ""
            ],
            [
              "Quality Control",
              "",
              "",
              ""
            ],
            [
              "Pejabat Pembuat Komitmen",
              "",
              "",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-combined-lendutan-consistency",
    "survey": "Lendutan",
    "phase": "consistency",
    "items": [
      {
        "code": "DOCX_LENDUTAN_CONSISTENCY_0001",
        "section": "IV. PENGUKURAN KONSISTENSI (REPEATABILITY)",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: IV. PENGUKURAN KONSISTENSI (REPEATABILITY)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Parameter",
            "Hasil",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3.",
            "4."
          ],
          "source_rows": [
            [
              "1.",
              "Rata-rata hasil pengukuran",
              "",
              "□ Wajar □ Tidak Wajar",
              ""
            ],
            [
              "2.",
              "Standar deviasi hasil pengukuran",
              "",
              "□ Wajar □ Tidak Wajar",
              ""
            ],
            [
              "3.",
              "Koefisien variasi (CV) hasil pengukuran",
              "%",
              "□ ≤ 5% □ > 5%",
              ""
            ],
            [
              "4.",
              "Perbandingan dengan hasil pengukuran sebelumnya (jika ada)",
              "",
              "□ Konsisten □ Tidak Konsisten □ Tidak Ada Data Sebelumnya",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-combined-lendutan-internal",
    "survey": "Lendutan",
    "phase": "internal",
    "items": [
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0001",
        "section": "BERITA ACARA AUDIT INTERNAL PENYEDIA JASA",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "BERITA ACARA AUDIT INTERNAL PENYEDIA JASA",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0002",
        "section": "BERITA ACARA AUDIT INTERNAL PENYEDIA JASA",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "SURVEI LENDUTAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0003",
        "section": "BERITA ACARA AUDIT INTERNAL PENYEDIA JASA",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Nomor : ............................Tanggal : ............................",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0004",
        "section": "I. INFORMASI UMUM",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: I. INFORMASI UMUM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Jenis Pemeriksaan",
            ": Audit Internal Penyedia Jasa - Survei Lendutan"
          ],
          "row_labels": [
            "Nama Kontrak",
            "Nomor Kontrak",
            "Lokasi",
            "Penyedia Jasa",
            "Pelaksana Audit Internal",
            "Periode Audit"
          ],
          "source_rows": [
            [
              "Nama Kontrak",
              ":"
            ],
            [
              "Nomor Kontrak",
              ":"
            ],
            [
              "Lokasi",
              ":"
            ],
            [
              "Penyedia Jasa",
              ":"
            ],
            [
              "Pelaksana Audit Internal",
              ":"
            ],
            [
              "Periode Audit",
              ":"
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0005",
        "section": "II. INFORMASI PERALATAN DAN PERSONIL",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: II. INFORMASI PERALATAN DAN PERSONIL",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Jenis Alat Uji Lendutan",
            ": □ FWD □ BB □ LWD"
          ],
          "row_labels": [
            "Nama/Merk Alat",
            "Nomor Seri Alat",
            "Tanggal Kalibrasi Terakhir",
            "Ahli Teknik/Penanggung Jawab",
            "Operator Alat"
          ],
          "source_rows": [
            [
              "Nama/Merk Alat",
              ":"
            ],
            [
              "Nomor Seri Alat",
              ":"
            ],
            [
              "Tanggal Kalibrasi Terakhir",
              ":"
            ],
            [
              "Ahli Teknik/Penanggung Jawab",
              ":"
            ],
            [
              "Operator Alat",
              ":"
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0006",
        "section": "III. AUDIT PERSIAPAN DAN PELAKSANAAN SURVEI",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: III. AUDIT PERSIAPAN DAN PELAKSANAAN SURVEI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Parameter",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3.",
            "4.",
            "5.",
            "6.",
            "7."
          ],
          "source_rows": [
            [
              "1.",
              "Kalibrasi dan validasi alat telah dilakukan dengan benar",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "2.",
              "Validasi berjalan (on-going validation) dilaksanakan secara rutin",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "3.",
              "Perencanaan survei memadai (jadwal, rute, personil)",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "4.",
              "Personil memiliki kompetensi yang memadai",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "5.",
              "Prosedur K3 dilaksanakan dengan baik",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "6.",
              "Manajemen lalu lintas dilaksanakan dengan baik",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "7.",
              "Koordinasi dengan pihak terkait dilakukan",
              "□ Ya □ Tidak",
              ""
            ]
          ],
          "table_rows": 7,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0007",
        "section": "IV. AUDIT PENGUMPULAN DAN PENGOLAHAN DATA",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: IV. AUDIT PENGUMPULAN DAN PENGOLAHAN DATA",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Parameter",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.",
            "",
            "",
            "",
            "2.",
            "",
            "",
            "",
            "3.",
            "",
            "",
            "",
            ""
          ],
          "source_rows": [
            [
              "1.",
              "Lokasi Pengujian:",
              "",
              ""
            ],
            [
              "",
              "a. Kesesuaian dengan rencana",
              "□ Sesuai □ Tidak Sesuai",
              ""
            ],
            [
              "",
              "b. Interval pengujian",
              "□ Sesuai □ Tidak Sesuai",
              ""
            ],
            [
              "",
              "c. Posisi pengujian pada lajur",
              "□ Sesuai □ Tidak Sesuai",
              ""
            ],
            [
              "2.",
              "Pengukuran Lendutan:",
              "",
              ""
            ],
            [
              "",
              "a. Metode pengukuran",
              "□ Sesuai □ Tidak Sesuai",
              ""
            ],
            [
              "",
              "b. Penerapan beban",
              "□ Sesuai □ Tidak Sesuai",
              ""
            ],
            [
              "",
              "c. Pembacaan lendutan",
              "□ Akurat □ Tidak Akurat",
              ""
            ],
            [
              "3.",
              "Pengolahan Data:",
              "",
              ""
            ],
            [
              "",
              "a. Koreksi temperatur",
              "□ Diterapkan □ Tidak Diterapkan",
              ""
            ],
            [
              "",
              "b. Koreksi musim",
              "□ Diterapkan □ Tidak Diterapkan",
              ""
            ],
            [
              "",
              "c. Formula perhitungan",
              "□ Sesuai □ Tidak Sesuai",
              ""
            ],
            [
              "",
              "d. Perangkat lunak analisis",
              "□ Sesuai □ Tidak Sesuai",
              ""
            ]
          ],
          "table_rows": 13,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0008",
        "section": "V. AUDIT PENCATATAN DAN DOKUMENTASI",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: V. AUDIT PENCATATAN DAN DOKUMENTASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Parameter",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3.",
            "4.",
            "5.",
            "6."
          ],
          "source_rows": [
            [
              "1.",
              "Kelengkapan data (nomor ruas, koordinat, beban, dll)",
              "□ Lengkap □ Tidak Lengkap",
              ""
            ],
            [
              "2.",
              "Format data sesuai dengan ketentuan",
              "□ Sesuai □ Tidak Sesuai",
              ""
            ],
            [
              "3.",
              "Penyimpanan dan backup data dilakukan dengan baik",
              "□ Ya □ Tidak",
              ""
            ],
            [
              "4.",
              "Dokumentasi foto/video lokasi pengujian",
              "□ Ada □ Tidak Ada",
              ""
            ],
            [
              "5.",
              "Pencatatan faktor-faktor yang mempengaruhi hasil",
              "□ Ada □ Tidak Ada",
              ""
            ],
            [
              "6.",
              "Penanganan data anomali",
              "□ Ada Prosedur □ Tidak Ada Prosedur",
              ""
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0009",
        "section": "VI. AUDIT HASIL SURVEI",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: VI. AUDIT HASIL SURVEI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Parameter",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.",
            "",
            "",
            "",
            "2.",
            "",
            "",
            "3.",
            "",
            ""
          ],
          "source_rows": [
            [
              "1.",
              "Kewajaran Data:",
              "",
              ""
            ],
            [
              "",
              "a. Nilai lendutan",
              "□ Wajar □ Tidak Wajar",
              ""
            ],
            [
              "",
              "b. Konsistensi data dalam satu segmen",
              "□ Konsisten □ Tidak Konsisten",
              ""
            ],
            [
              "",
              "c. Konsistensi dengan data historis (jika ada)",
              "□ Konsisten □ Tidak Konsisten □ Tidak Ada Data Historis",
              ""
            ],
            [
              "2.",
              "Kelengkapan Data:",
              "",
              ""
            ],
            [
              "",
              "a. Cakupan ruas",
              "□ Lengkap □ Tidak Lengkap",
              ""
            ],
            [
              "",
              "b. Parameter data",
              "□ Lengkap □ Tidak Lengkap",
              ""
            ],
            [
              "3.",
              "Format Data:",
              "",
              ""
            ],
            [
              "",
              "a. Kesesuaian dengan format SMD Jalan",
              "□ Sesuai □ Tidak Sesuai",
              ""
            ],
            [
              "",
              "b. Ketelitian desimal",
              "□ Sesuai □ Tidak Sesuai",
              ""
            ]
          ],
          "table_rows": 10,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0010",
        "section": "VII. TEMUAN DAN TINDAKAN PERBAIKAN",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: VII. TEMUAN DAN TINDAKAN PERBAIKAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Temuan",
            "Tindakan Perbaikan",
            "Status",
            "Tenggat Waktu"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3.",
            "4.",
            "5."
          ],
          "source_rows": [
            [
              "1.",
              "",
              "",
              "□ Selesai □ Dalam Proses □ Belum Ditindaklanjuti",
              ""
            ],
            [
              "2.",
              "",
              "",
              "□ Selesai □ Dalam Proses □ Belum Ditindaklanjuti",
              ""
            ],
            [
              "3.",
              "",
              "",
              "□ Selesai □ Dalam Proses □ Belum Ditindaklanjuti",
              ""
            ],
            [
              "4.",
              "",
              "",
              "□ Selesai □ Dalam Proses □ Belum Ditindaklanjuti",
              ""
            ],
            [
              "5.",
              "",
              "",
              "□ Selesai □ Dalam Proses □ Belum Ditindaklanjuti",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0011",
        "section": "VIII. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Kesimpulan:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0012",
        "section": "VIII. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "................................................................................................... ................................................................................................... ...................................................................................................",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0013",
        "section": "VIII. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Rekomendasi:",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0014",
        "section": "VIII. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "................................................................................................... ................................................................................................... ...................................................................................................",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0015",
        "section": "IX. TANDA TANGAN",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: IX. TANDA TANGAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Pelaksana Audit Internal",
            "Penanggung Jawab Penyedia Jasa"
          ],
          "row_labels": [
            "Nama: Jabatan: Tanda Tangan: Tanggal:"
          ],
          "source_rows": [
            [
              "Nama: Jabatan: Tanda Tangan: Tanggal:",
              "Nama: Jabatan: Tanda Tangan: Tanggal:"
            ]
          ],
          "table_rows": 1,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0016",
        "section": "IX. TANDA TANGAN",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "LAMPIRAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0017",
        "section": "IX. TANDA TANGAN",
        "options": [],
        "required": false,
        "order": 17,
        "sourceOrder": 17,
        "unit": "",
        "rule": {},
        "label": "Data Hasil Survei yang Diaudit",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0018",
        "section": "IX. TANDA TANGAN",
        "options": [],
        "required": false,
        "order": 18,
        "sourceOrder": 18,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi Pelaksanaan Audit Internal",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0019",
        "section": "IX. TANDA TANGAN",
        "options": [],
        "required": false,
        "order": 19,
        "sourceOrder": 19,
        "unit": "",
        "rule": {},
        "label": "Bukti Tindakan Perbaikan (jika ada)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0020",
        "section": "IX. TANDA TANGAN",
        "options": [],
        "required": false,
        "order": 20,
        "sourceOrder": 20,
        "unit": "",
        "rule": {},
        "label": "BERITA ACARA AUDIT PENGGUNA JASA",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0021",
        "section": "IX. TANDA TANGAN",
        "options": [],
        "required": false,
        "order": 21,
        "sourceOrder": 21,
        "unit": "",
        "rule": {},
        "label": "SURVEI LENDUTAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_INTERNAL_0022",
        "section": "IX. TANDA TANGAN",
        "options": [],
        "required": false,
        "order": 22,
        "sourceOrder": 22,
        "unit": "",
        "rule": {},
        "label": "Nomor : ............................Tanggal : ............................",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  },
  {
    "id": "docx-combined-lendutan-periodic14",
    "survey": "Lendutan",
    "phase": "periodic14",
    "items": [
      {
        "code": "DOCX_LENDUTAN_PERIODIC14_0001",
        "section": "BERITA ACARA VALIDASI BERJALAN",
        "options": [],
        "required": false,
        "order": 1,
        "sourceOrder": 1,
        "unit": "",
        "rule": {},
        "label": "BERITA ACARA VALIDASI BERJALAN (ON-GOING VALIDATION)",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_PERIODIC14_0002",
        "section": "BERITA ACARA VALIDASI BERJALAN",
        "options": [],
        "required": false,
        "order": 2,
        "sourceOrder": 2,
        "unit": "",
        "rule": {},
        "label": "SURVEI LENDUTAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_PERIODIC14_0003",
        "section": "BERITA ACARA VALIDASI BERJALAN",
        "options": [],
        "required": false,
        "order": 3,
        "sourceOrder": 3,
        "unit": "",
        "rule": {},
        "label": "Nomor : ............................Tanggal : ............................",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_PERIODIC14_0004",
        "section": "I. INFORMASI UMUM",
        "options": [],
        "required": false,
        "order": 4,
        "sourceOrder": 4,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: I. INFORMASI UMUM",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Jenis Pemeriksaan",
            ": Validasi Berjalan Survei Lendutan"
          ],
          "row_labels": [
            "Nama Kontrak",
            "Nomor Kontrak",
            "Lokasi Validasi",
            "Penyedia Jasa",
            "Penanggung Jawab Penyedia Jasa",
            "Pengguna Jasa",
            "Penanggung Jawab Pengguna Jasa",
            "Periode Validasi Berjalan"
          ],
          "source_rows": [
            [
              "Nama Kontrak",
              ":"
            ],
            [
              "Nomor Kontrak",
              ":"
            ],
            [
              "Lokasi Validasi",
              ":"
            ],
            [
              "Penyedia Jasa",
              ":"
            ],
            [
              "Penanggung Jawab Penyedia Jasa",
              ":"
            ],
            [
              "Pengguna Jasa",
              ":"
            ],
            [
              "Penanggung Jawab Pengguna Jasa",
              ":"
            ],
            [
              "Periode Validasi Berjalan",
              ": (2 mingguan/berkala)"
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_PERIODIC14_0005",
        "section": "II. INFORMASI PERALATAN",
        "options": [],
        "required": false,
        "order": 5,
        "sourceOrder": 5,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: II. INFORMASI PERALATAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Jenis Alat Uji Lendutan",
            ": □ FWD □ BB □ LWD"
          ],
          "row_labels": [
            "Nama/Merk Alat",
            "Nomor Seri Alat",
            "Tahun Pembuatan",
            "Tanggal Kalibrasi Referensi Terakhir",
            "Tanggal Kalibrasi Relatif Terakhir",
            "Operator Alat"
          ],
          "source_rows": [
            [
              "Nama/Merk Alat",
              ":"
            ],
            [
              "Nomor Seri Alat",
              ":"
            ],
            [
              "Tahun Pembuatan",
              ":"
            ],
            [
              "Tanggal Kalibrasi Referensi Terakhir",
              ":"
            ],
            [
              "Tanggal Kalibrasi Relatif Terakhir",
              ":"
            ],
            [
              "Operator Alat",
              ":"
            ]
          ],
          "table_rows": 6,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_PERIODIC14_0006",
        "section": "III. PELAKSANAAN VALIDASI BERJALAN",
        "options": [],
        "required": false,
        "order": 6,
        "sourceOrder": 6,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: III. PELAKSANAAN VALIDASI BERJALAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Parameter",
            "Keterangan",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3."
          ],
          "source_rows": [
            [
              "1.",
              "Lokasi validasi berjalan",
              "",
              "□ Memenuhi □ Tidak Memenuhi",
              ""
            ],
            [
              "2.",
              "Jumlah pengulangan pengukuran (minimal 3x)",
              "",
              "□ Memenuhi □ Tidak Memenuhi",
              ""
            ],
            [
              "3.",
              "Jarak pengulangan pengukuran",
              "",
              "□ Sama Persis □ Bervariasi",
              ""
            ]
          ],
          "table_rows": 3,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_PERIODIC14_0007",
        "section": "IV. PENGUKURAN KONSISTENSI (REPEATABILITY)",
        "options": [],
        "required": false,
        "order": 7,
        "sourceOrder": 7,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: IV. PENGUKURAN KONSISTENSI (REPEATABILITY)",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Parameter",
            "Hasil",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3.",
            "4."
          ],
          "source_rows": [
            [
              "1.",
              "Rata-rata hasil pengukuran",
              "",
              "□ Wajar □ Tidak Wajar",
              ""
            ],
            [
              "2.",
              "Standar deviasi hasil pengukuran",
              "",
              "□ Wajar □ Tidak Wajar",
              ""
            ],
            [
              "3.",
              "Koefisien variasi (CV) hasil pengukuran",
              "%",
              "□ ≤ 5% □ > 5%",
              ""
            ],
            [
              "4.",
              "Perbandingan dengan hasil pengukuran sebelumnya (jika ada)",
              "",
              "□ Konsisten □ Tidak Konsisten □ Tidak Ada Data Sebelumnya",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_PERIODIC14_0008",
        "section": "V. MONITORING KONDISI ALAT",
        "options": [],
        "required": false,
        "order": 8,
        "sourceOrder": 8,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: V. MONITORING KONDISI ALAT",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Parameter",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3.",
            "4.",
            "5."
          ],
          "source_rows": [
            [
              "1.",
              "Kondisi umum alat",
              "□ Baik □ Perlu Perbaikan",
              ""
            ],
            [
              "2.",
              "Kondisi sensor lendutan",
              "□ Baik □ Perlu Perbaikan",
              ""
            ],
            [
              "3.",
              "Kondisi pengukur jarak",
              "□ Baik □ Perlu Perbaikan",
              ""
            ],
            [
              "4.",
              "Kondisi perangkat lunak pengolah data",
              "□ Baik □ Perlu Perbaikan",
              ""
            ],
            [
              "5.",
              "Apakah ditemukan penyimpangan dalam kinerja alat?",
              "□ Tidak □ Ya",
              ""
            ]
          ],
          "table_rows": 5,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_PERIODIC14_0009",
        "section": "VI. DOKUMENTASI HASIL VALIDASI BERJALAN",
        "options": [],
        "required": false,
        "order": 9,
        "sourceOrder": 9,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: VI. DOKUMENTASI HASIL VALIDASI BERJALAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Parameter",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3.",
            "4.",
            "5.",
            "6.",
            "7.",
            "8."
          ],
          "source_rows": [
            [
              "1.",
              "Nomor ruas jalan",
              "□ Tercatat □ Tidak Tercatat",
              ""
            ],
            [
              "2.",
              "Station/koordinat pengujian",
              "□ Tercatat □ Tidak Tercatat",
              ""
            ],
            [
              "3.",
              "Tanggal dan waktu pengujian",
              "□ Tercatat □ Tidak Tercatat",
              ""
            ],
            [
              "4.",
              "Nama operator",
              "□ Tercatat □ Tidak Tercatat",
              ""
            ],
            [
              "5.",
              "Beban yang digunakan",
              "□ Tercatat □ Tidak Tercatat",
              ""
            ],
            [
              "6.",
              "Lendutan pada tiap pengulangan",
              "□ Tercatat □ Tidak Tercatat",
              ""
            ],
            [
              "7.",
              "Temperatur perkerasan",
              "□ Tercatat □ Tidak Tercatat",
              ""
            ],
            [
              "8.",
              "Pencatatan faktor-faktor yang mempengaruhi hasil pengujian",
              "□ Tercatat □ Tidak Tercatat",
              ""
            ]
          ],
          "table_rows": 8,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_PERIODIC14_0010",
        "section": "VII. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 10,
        "sourceOrder": 10,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: VII. KESIMPULAN DAN REKOMENDASI",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "No.",
            "Parameter",
            "Status",
            "Catatan"
          ],
          "row_labels": [
            "1.",
            "2.",
            "3.",
            "4."
          ],
          "source_rows": [
            [
              "1.",
              "Konsistensi (repeatability) hasil pengukuran",
              "□ Memenuhi Persyaratan □ Tidak Memenuhi Persyaratan",
              ""
            ],
            [
              "2.",
              "Kondisi alat",
              "□ Memenuhi Persyaratan □ Tidak Memenuhi Persyaratan",
              ""
            ],
            [
              "3.",
              "Dokumentasi",
              "□ Memenuhi Persyaratan □ Tidak Memenuhi Persyaratan",
              ""
            ],
            [
              "4.",
              "Kesimpulan Keseluruhan",
              "□ Disetujui □ Disetujui dengan Catatan □ Tidak Disetujui",
              ""
            ]
          ],
          "table_rows": 4,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_PERIODIC14_0011",
        "section": "VII. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 11,
        "sourceOrder": 11,
        "unit": "",
        "rule": {},
        "label": "Catatan dan Rekomendasi Tindakan Perbaikan (jika ada):",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_PERIODIC14_0012",
        "section": "VII. KESIMPULAN DAN REKOMENDASI",
        "options": [],
        "required": false,
        "order": 12,
        "sourceOrder": 12,
        "unit": "",
        "rule": {},
        "label": "................................................................................................... ................................................................................................... ................................................................................................... ................................................................................................... ...................................................................................................",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_PERIODIC14_0013",
        "section": "VIII. TANDA TANGAN",
        "options": [],
        "required": false,
        "order": 13,
        "sourceOrder": 13,
        "unit": "",
        "rule": {},
        "label": "Tabel pemeriksaan: VIII. TANDA TANGAN",
        "inputType": "JSON",
        "checkType": "TABLE_INPUT",
        "metadata": {
          "table_columns": [
            "Penyedia Jasa",
            "Pengguna Jasa (jika diperlukan)"
          ],
          "row_labels": [
            "Nama: Jabatan: Tanda Tangan: Tanggal:"
          ],
          "source_rows": [
            [
              "Nama: Jabatan: Tanda Tangan: Tanggal:",
              "Nama: Jabatan: Tanda Tangan: Tanggal:"
            ]
          ],
          "table_rows": 1,
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_PERIODIC14_0014",
        "section": "VIII. TANDA TANGAN",
        "options": [],
        "required": false,
        "order": 14,
        "sourceOrder": 14,
        "unit": "",
        "rule": {},
        "label": "LAMPIRAN",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_PERIODIC14_0015",
        "section": "VIII. TANDA TANGAN",
        "options": [],
        "required": false,
        "order": 15,
        "sourceOrder": 15,
        "unit": "",
        "rule": {},
        "label": "Data Hasil Validasi Berjalan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      },
      {
        "code": "DOCX_LENDUTAN_PERIODIC14_0016",
        "section": "VIII. TANDA TANGAN",
        "options": [],
        "required": false,
        "order": 16,
        "sourceOrder": 16,
        "unit": "",
        "rule": {},
        "label": "Dokumentasi Validasi Berjalan",
        "inputType": "TEXT",
        "checkType": "UNMAPPED",
        "metadata": {
          "needs_review": true
        }
      }
    ]
  }
];
