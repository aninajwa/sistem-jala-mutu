import type {
  StructuredChecklistItem,
  StructuredChecklistSection,
  StructuredChecklistTemplate,
} from './structuredChecklist';

const PROVIDER = [
  'Penyedia Jasa / Ketua Tim',
] as const;

/* =========================================================
   HELPER
   ========================================================= */

function readonlyItem(
  id: string,
  label: string,
  origin:
    | 'package'
    | 'source-system'
    | 'system' = 'package',
): StructuredChecklistItem {
  return {
    id,
    label,
    responseType: 'readonly',
    dataOrigin: origin,
  };
}

function yesNoNa(
  id: string,
  number: string,
  label: string,
  evidenceAllowed = false,
): StructuredChecklistItem {
  return {
    id,
    number,
    label,
    responseType: 'yes-no',
    options: [
      'Ya',
      'Tidak',
      'N/A',
    ],
    noteAllowed: true,
    evidenceAllowed,
    dataOrigin: 'provider',
    editableRoles: [...PROVIDER],
  };
}

function section(
  id: string,
  title: string,
  items: StructuredChecklistItem[],
): StructuredChecklistSection {
  return {
    id,
    title,
    items,
  };
}

/* =========================================================
   JEMBATAN — TAHAP 1
   CHECKLIST KALIBRASI DAN VALIDASI
   Bagian A–E dokumen sumber.
   ========================================================= */

export const jembatanCalibration:
  StructuredChecklistTemplate = {
  id: 'jembatan-calibration-2025',
  survey: 'Jembatan',
  phase: 'calibration',
  title: 'Checklist Kalibrasi & Validasi Survei Jembatan',

  sections: [
    /* =====================================================
       A. INFORMASI UMUM
       ===================================================== */

    {
      id: 'jembatan-general',
      number: 'A',
      title: 'Informasi Umum',
      mode: 'auto',

      items: [
        readonlyItem(
          'jembatan-general-project',
          'Nama Proyek',
          'package',
        ),
        readonlyItem(
          'jembatan-general-contract',
          'Nomor Kontrak',
          'package',
        ),
        readonlyItem(
          'jembatan-general-location',
          'Lokasi',
          'package',
        ),
        readonlyItem(
          'jembatan-general-date',
          'Tanggal Pemeriksaan',
          'system',
        ),
        readonlyItem(
          'jembatan-general-officer',
          'Nama Petugas',
          'system',
        ),
        readonlyItem(
          'jembatan-general-position',
          'Jabatan',
          'system',
        ),
        readonlyItem(
          'jembatan-general-agency',
          'Instansi',
          'system',
        ),
      ],
    },

    /* =====================================================
       B. INFORMASI JEMBATAN YANG DIPERIKSA
       ===================================================== */

    {
      id: 'jembatan-information',
      number: 'B',
      title: 'Informasi Jembatan yang Diperiksa',
      mode: 'auto',

      items: [
        readonlyItem(
          'jembatan-number',
          'Nomor Jembatan',
          'source-system',
        ),
        readonlyItem(
          'jembatan-name',
          'Nama Jembatan',
          'source-system',
        ),
        readonlyItem(
          'jembatan-road-number',
          'Nomor Ruas Jalan',
          'source-system',
        ),
        readonlyItem(
          'jembatan-road-name',
          'Nama Ruas Jalan',
          'source-system',
        ),
        readonlyItem(
          'jembatan-coordinate',
          'Koordinat Jembatan — Lintang / Bujur',
          'source-system',
        ),
        readonlyItem(
          'jembatan-length',
          'Panjang Jembatan',
          'source-system',
        ),
        readonlyItem(
          'jembatan-width',
          'Lebar Jembatan',
          'source-system',
        ),
        readonlyItem(
          'jembatan-span-count',
          'Jumlah Bentang',
          'source-system',
        ),
        readonlyItem(
          'jembatan-superstructure',
          'Tipe Bangunan Atas',
          'source-system',
        ),
        readonlyItem(
          'jembatan-construction-year',
          'Perkiraan Tahun Pembangunan',
          'source-system',
        ),
        readonlyItem(
          'jembatan-inspection-type',
          'Jenis Pemeriksaan — Inventarisasi / Detail / Rutin / Khusus',
          'source-system',
        ),
      ],
    },

    /* =====================================================
       C. KALIBRASI PERALATAN PEMERIKSAAN
       ===================================================== */

    section(
      'jembatan-equipment-calibration',
      'C. Kalibrasi Peralatan Pemeriksaan',
      [
        yesNoNa(
          'jembatan-c-1',
          'C.1',
          'Peralatan pembersih cacat elemen tersedia dan berfungsi',
        ),

        yesNoNa(
          'jembatan-c-2',
          'C.2',
          'Alat inspeksi (pisau saku, ice pick, bor tangan, dll) tersedia dan berfungsi',
        ),

        yesNoNa(
          'jembatan-c-3',
          'C.3',
          'Alat bantu penglihatan (teropong, senter, kaca pembesar, dll) tersedia dan berfungsi',
        ),

        yesNoNa(
          'jembatan-c-4',
          'C.4',
          'Alat pengukur (meteran tangan, meteran pita, kaliper, dll) tersedia dan akurat',
        ),

        yesNoNa(
          'jembatan-c-5',
          'C.5',
          'Pengukur retak/crack meter terkalibrasi',
          true,
        ),

        yesNoNa(
          'jembatan-c-6',
          'C.6',
          'Pengukur ketebalan film cat terkalibrasi (jika digunakan)',
          true,
        ),

        yesNoNa(
          'jembatan-c-7',
          'C.7',
          'Tiltmeter dan busur derajat terkalibrasi',
          true,
        ),

        yesNoNa(
          'jembatan-c-8',
          'C.8',
          'Termometer terkalibrasi',
          true,
        ),

        yesNoNa(
          'jembatan-c-9',
          'C.9',
          'D-Meter (pengukur ketebalan ultrasonik) terkalibrasi',
          true,
        ),

        yesNoNa(
          'jembatan-c-10',
          'C.10',
          'Electronic Distance Meter (EDM) terkalibrasi',
          true,
        ),

        yesNoNa(
          'jembatan-c-11',
          'C.11',
          'Alat leveling terkalibrasi',
          true,
        ),

        yesNoNa(
          'jembatan-c-12',
          'C.12',
          'GPS terkalibrasi dengan ketelitian yang memadai',
          true,
        ),

        yesNoNa(
          'jembatan-c-13',
          'C.13',
          'Smartphone dengan aplikasi INVI-J terbaru tersedia',
        ),

        yesNoNa(
          'jembatan-c-14',
          'C.14',
          'Kamera digital/smartphone dengan resolusi memadai tersedia',
        ),

        yesNoNa(
          'jembatan-c-15',
          'C.15',
          'Peralatan khusus untuk pemeriksaan khusus (jika diperlukan) tersedia dan terkalibrasi',
          true,
        ),

        yesNoNa(
          'jembatan-c-16',
          'C.16',
          'Drone/UAV berfungsi dan terkalibrasi (jika digunakan)',
          true,
        ),

        yesNoNa(
          'jembatan-c-17',
          'C.17',
          'Peralatan Alat Pelindung Diri (APD) tersedia dan dalam kondisi baik',
        ),
      ],
    ),

    /* =====================================================
       D. VALIDASI KOMPETENSI PERSONIL PEMERIKSAAN
       ===================================================== */

    section(
      'jembatan-personnel-validation',
      'D. Validasi Kompetensi Personil Pemeriksaan',
      [
        yesNoNa(
          'jembatan-d-1',
          'D.1',
          'Ahli Teknik Jembatan memiliki sertifikat kompetensi (SKK/SKA) yang masih berlaku',
          true,
        ),

        yesNoNa(
          'jembatan-d-2',
          'D.2',
          'Ahli Teknik Jembatan memiliki pengalaman pemeriksaan jembatan minimal 2 tahun',
        ),

        yesNoNa(
          'jembatan-d-3',
          'D.3',
          'Ahli Teknik Jembatan telah mengikuti pelatihan/penyegaran/kegiatan QA-QC dari Ditjen Bina Marga',
          true,
        ),

        yesNoNa(
          'jembatan-d-4',
          'D.4',
          'Asisten Tenaga Ahli Jembatan memiliki kualifikasi minimum S1 Teknik Sipil',
          true,
        ),

        yesNoNa(
          'jembatan-d-5',
          'D.5',
          'Asisten Tenaga Ahli Jembatan memiliki pengalaman pemeriksaan jembatan minimal 1 tahun',
        ),

        yesNoNa(
          'jembatan-d-6',
          'D.6',
          'Asisten Tenaga Ahli Jembatan telah mengikuti pelatihan/penyegaran/kegiatan QA-QC',
          true,
        ),

        yesNoNa(
          'jembatan-d-7',
          'D.7',
          'Tim pemeriksaan memiliki pemahaman yang baik tentang Pedoman Pemeriksaan Jembatan (Nomor 01/P/BM/2022)',
        ),

        yesNoNa(
          'jembatan-d-8',
          'D.8',
          'Tim pemeriksaan memiliki pemahaman yang baik tentang aplikasi INVI-J',
        ),

        yesNoNa(
          'jembatan-d-9',
          'D.9',
          'Tim pemeriksaan memiliki pemahaman yang baik tentang prosedur verifikasi dan validasi (Pedoman No. 01/P/BM/2023)',
        ),

        yesNoNa(
          'jembatan-d-10',
          'D.10',
          'Tim pemeriksaan telah lulus uji coba pemeriksaan inventarisasi dan detail',
          true,
        ),
      ],
    ),

    /* =====================================================
       E. VALIDASI DOKUMENTASI PENDUKUNG
       ===================================================== */

    section(
      'jembatan-supporting-document',
      'E. Validasi Dokumentasi Pendukung',
      [
        yesNoNa(
          'jembatan-e-1',
          'E.1',
          'Dokumentasi Laporan Pemeriksaan tahun sebelumnya tersedia',
          true,
        ),

        yesNoNa(
          'jembatan-e-2',
          'E.2',
          'Peta Fungsi dan Status Jalan terbaru tersedia',
          true,
        ),

        yesNoNa(
          'jembatan-e-3',
          'E.3',
          'Laporan data lalu lintas dan ruas jalan terkait tersedia',
          true,
        ),

        yesNoNa(
          'jembatan-e-4',
          'E.4',
          'Laporan pemeriksaan atau pengujian jembatan sebelumnya tersedia',
          true,
        ),

        yesNoNa(
          'jembatan-e-5',
          'E.5',
          'Formulir Pemeriksaan Inventarisasi/Detail/Rutin/Khusus tersedia',
          true,
        ),

        yesNoNa(
          'jembatan-e-6',
          'E.6',
          'Data Pokok Jembatan tersedia',
          true,
        ),

        yesNoNa(
          'jembatan-e-7',
          'E.7',
          'Gambar as-built drawing tersedia (jika ada)',
          true,
        ),

        yesNoNa(
          'jembatan-e-8',
          'E.8',
          'Pedoman Bidang Jalan dan Jembatan No. 01/P/BM/2022 tersedia',
        ),

        yesNoNa(
          'jembatan-e-9',
          'E.9',
          'Pedoman Bidang Jembatan dan Terowongan No. 01/P/BM/2023 tersedia',
        ),

        yesNoNa(
          'jembatan-e-10',
          'E.10',
          'Pedoman Pemeriksaan Kondisi Sungai (No. 04/P/BM/2021) tersedia',
        ),
      ],
    ),
  ],
};