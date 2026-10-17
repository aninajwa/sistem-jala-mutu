import type { SurveyType } from './model';

import type {
  StructuredChecklistItem,
  StructuredChecklistTemplate,
} from './structuredChecklist';

import {
  pciManualCalibration,
} from './structuredChecklistTemplatesPci';

import {
  pciAiCalibration,
} from './structuredChecklistTemplatesPciAi';

import {
  lendutanCalibration,
} from './structuredChecklistTemplatesLendutan';

import {
  jembatanCalibration,
} from './structuredChecklistTemplatesJembatan';

import {
  laluLintasCalibration,
} from './structuredChecklistTemplatesLaluLintas';

import {
  lerengCalibration,
} from './structuredChecklistTemplatesLereng';

import {
  drainaseCalibration,
} from './structuredChecklistTemplatesDrainase';

import {
  rniCalibration,
} from './structuredChecklistTemplatesRni';

export type StructuredSurvey =
  | SurveyType
  | 'PCI Manual'
  | 'PCI AI';

const PROVIDER = [
  'Penyedia Jasa / Ketua Tim',
] as const;

function yesNo(
  id: string,
  number: string,
  label: string,
): StructuredChecklistItem {
  return {
    id,
    number,
    label,
    responseType: 'yes-no',
    options: ['Ya', 'Tidak'],
    noteAllowed: true,
    dataOrigin: 'provider',
    editableRoles: [...PROVIDER],
  };
}

function readonly(
  id: string,
  label: string,
): StructuredChecklistItem {
  return {
    id,
    label,
    responseType: 'readonly',
    dataOrigin: 'package',
  };
}

/* =========================================================
   IRI — TAHAP 1
   CHECKLIST KALIBRASI DAN VALIDASI ALAT
   ========================================================= */

const iriCalibration: StructuredChecklistTemplate = {
  id: 'iri-calibration-2025',
  survey: 'IRI',
  phase: 'calibration',
  title: 'Checklist Kalibrasi & Validasi IRI',

  sections: [
    {
      id: 'iri-cal-info',
      number: '1',
      title: 'Informasi Umum',
      description:
        'Identitas paket tidak diisi ulang pada checklist. Informasi kontrak, lokasi dan penugasan mengikuti data paket serta rekaman alat/personel.',
      mode: 'auto',

      items: [
        readonly(
          'iri-cal-project',
          'Nama Proyek',
        ),
        readonly(
          'iri-cal-contract',
          'Nomor Kontrak',
        ),
        readonly(
          'iri-cal-location',
          'Lokasi',
        ),
        readonly(
          'iri-cal-date',
          'Tanggal Kalibrasi',
        ),
        readonly(
          'iri-cal-officer',
          'Nama Petugas',
        ),
        readonly(
          'iri-cal-supervisor',
          'Nama Supervisor',
        ),
      ],
    },

    {
      id: 'iri-cal-equipment',
      number: '2',
      title: 'Kalibrasi Alat',

      items: [
        yesNo(
          'iri-cal-2-1',
          '2.1',
          'Sertifikat kalibrasi alat masih berlaku',
        ),
        yesNo(
          'iri-cal-2-2',
          '2.2',
          'Kalibrasi transducer pengukur jarak (odometer) setelah pemasangan',
        ),
        yesNo(
          'iri-cal-2-3',
          '2.3',
          'Kalibrasi jarak mencapai minimal 1 km',
        ),
        yesNo(
          'iri-cal-2-4',
          '2.4',
          'Accelerometer diperiksa sesuai dengan prosedur pabrik',
        ),
        yesNo(
          'iri-cal-2-5',
          '2.5',
          'Transducer laser dikalibrasi sesuai petunjuk pabrik',
        ),
        yesNo(
          'iri-cal-2-6',
          '2.6',
          'Resolusi alat pengukur <0,1 mm',
        ),
        yesNo(
          'iri-cal-2-7',
          '2.7',
          'Ketelitian pengukuran mencapai <0,1 mm',
        ),
        yesNo(
          'iri-cal-2-8',
          '2.8',
          'Kalibrasi dilakukan setelah penggantian roda kendaraan',
        ),
        yesNo(
          'iri-cal-2-9',
          '2.9',
          'Semua sensor berfungsi dengan baik',
        ),
        yesNo(
          'iri-cal-2-10',
          '2.10',
          'Parameter kalibrasi sesuai standar SNI 3426:2022',
        ),
      ],
    },

    {
      id: 'iri-cal-validation',
      number: '3',
      title: 'Validasi Alat',

      items: [
        yesNo(
          'iri-cal-3-1',
          '3.1',
          'Validasi dilakukan pada minimal 3 lokasi (300 m/lokasi)',
        ),
        yesNo(
          'iri-cal-3-2',
          '3.2',
          'Validasi mencakup nilai ketidakrataan <4, 4–6, dan >6',
        ),
        yesNo(
          'iri-cal-3-3',
          '3.3',
          'Pengukuran dilakukan minimal 3 kali per lajur roda',
        ),
        yesNo(
          'iri-cal-3-4',
          '3.4',
          'Pengukuran dengan alat yang divalidasi dilakukan 5 kali pada 3 kecepatan berbeda',
        ),
        yesNo(
          'iri-cal-3-5',
          '3.5',
          'Kecepatan validasi mencakup 40 km/jam, 50 km/jam, dan >60 km/jam',
        ),
        yesNo(
          'iri-cal-3-6',
          '3.6',
          'Nilai gradien persamaan regresi (A) berada dalam rentang 0,95 ≤ A ≤ 1,05',
        ),
        yesNo(
          'iri-cal-3-7',
          '3.7',
          'Nilai intersep persamaan regresi (B) berada dalam rentang -0,25 ≤ B ≤ 0,25 m/km',
        ),
        yesNo(
          'iri-cal-3-8',
          '3.8',
          'Nilai koefisien determinasi (R²) ≥ 0,95',
        ),
        yesNo(
          'iri-cal-3-9',
          '3.9',
          'Koefisien variasi (CV) dari 5 kali pengukuran ≤ 5%',
        ),
        yesNo(
          'iri-cal-3-10',
          '3.10',
          'Bounce test dilakukan sebelum dan sesudah pengukuran',
        ),
      ],
    },

    {
      id: 'iri-cal-gps',
      number: '4',
      title: 'GPS & Pengukuran Jarak',

      items: [
        yesNo(
          'iri-cal-4-1',
          '4.1',
          'GPS memiliki ketelitian ±1 m pada 90% waktu',
        ),
        yesNo(
          'iri-cal-4-2',
          '4.2',
          'Odometer terkalibrasi',
        ),
        yesNo(
          'iri-cal-4-3',
          '4.3',
          'Ketelitian pengukuran jarak mencapai 0,1%',
        ),
        yesNo(
          'iri-cal-4-4',
          '4.4',
          'Pembacaan jarak berfungsi dengan baik',
        ),
        yesNo(
          'iri-cal-4-5',
          '4.5',
          'Integrasi GPS-odometer berfungsi dengan baik',
        ),
      ],
    },

    {
  id: 'iri-cal-documentation',
  number: '5',
  title: 'Dokumentasi Kalibrasi',

  items: [
    {
      id: 'iri-cal-5-1',
      number: '5.1',
      label: 'Laporan hasil kalibrasi tersedia dan lengkap',
      responseType: 'yes-no',
      options: ['Ya', 'Tidak'],
      dataOrigin: 'provider',
      noteAllowed: true,
      evidenceAllowed: true,
    },
    {
      id: 'iri-cal-5-2',
      number: '5.2',
      label: 'Foto saat kalibrasi tersedia',
      responseType: 'yes-no',
      options: ['Ya', 'Tidak'],
      dataOrigin: 'provider',
      noteAllowed: true,
      evidenceAllowed: true,
    },
    {
      id: 'iri-cal-5-3',
      number: '5.3',
      label: 'Berita acara kalibrasi tersedia',
      responseType: 'yes-no',
      options: ['Ya', 'Tidak'],
      dataOrigin: 'provider',
      noteAllowed: true,
      evidenceAllowed: true,
    },
    {
      id: 'iri-cal-5-4',
      number: '5.4',
      label: 'Sertifikat kalibrasi dari lembaga yang berwenang tersedia',
      responseType: 'yes-no',
      options: ['Ya', 'Tidak'],
      dataOrigin: 'provider',
      noteAllowed: true,
      evidenceAllowed: true,
    },
    {
      id: 'iri-cal-5-5',
      number: '5.5',
      label: 'Data mentah hasil kalibrasi tersedia',
      responseType: 'yes-no',
      options: ['Ya', 'Tidak'],
      dataOrigin: 'provider',
      noteAllowed: true,
      evidenceAllowed: true,
    },
  ],
},

    {
  id: 'iri-cal-result',
  number: '6',
  title: 'Hasil Validasi',
  mode: 'table',

  items: [
    {
      id: 'iri-cal-result-table',
      label: 'Hasil Validasi IRI',
      responseType: 'table',
      dataOrigin: 'system',
      tableColumns: [
        'Lokasi',
        'Nilai IRI Alat Referensi',
        'Nilai IRI Alat yang Divalidasi',
        'Selisih',
        'Status',
      ],
    },
  ],
},
  ],
};

/* =========================================================
   IRI — TAHAP 3B
   CHECKLIST KONSISTENSI / VERVAL BERKALA
   ========================================================= */

const iriPeriodic14: StructuredChecklistTemplate = {
  id: 'iri-periodic14-2025',
  survey: 'IRI',
  phase: 'periodic14',
  title: 'Checklist Konsistensi IRI',

  sections: [
    {
      id: 'iri-period-info',
      number: '1',
      title: 'Informasi Umum',
      description:
        'Identitas paket dan periode siklus dibaca dari data paket serta jadwal verval.',

      mode: 'auto',

      items: [
        readonly(
          'iri-period-project',
          'Nama Proyek',
        ),
        readonly(
          'iri-period-contract',
          'Nomor Kontrak',
        ),
        readonly(
          'iri-period-cycle',
          'Periode Konsistensi',
        ),
        readonly(
          'iri-period-location',
          'Lokasi',
        ),
        readonly(
          'iri-period-date',
          'Tanggal Pemeriksaan',
        ),
        readonly(
          'iri-period-officer',
          'Nama Petugas',
        ),
        readonly(
          'iri-period-supervisor',
          'Nama Supervisor',
        ),
      ],
    },

    {
      id: 'iri-period-repeatability',
      number: '2',
      title: 'Keterulangan / Repeatability',

      items: [
        yesNo(
          'iri-period-2-1',
          '2.1',
          'Survei ulang dilakukan pada ruas yang sama (min. 5 km) setiap 14 hari',
        ),
        yesNo(
          'iri-period-2-2',
          '2.2',
          'Survei ulang dilakukan sebanyak 3 lintasan',
        ),
        yesNo(
          'iri-period-2-3',
          '2.3',
          'Hasil pengukuran ulang konsisten dengan hasil awal',
        ),
        yesNo(
          'iri-period-2-4',
          '2.4',
          'Standar deviasi pengukuran pada setiap segmen berada dalam batas toleransi',
        ),
        yesNo(
          'iri-period-2-5',
          '2.5',
          'Variasi hasil pengukuran tidak melebihi 5%',
        ),
      ],
    },

    {
      id: 'iri-period-operation',
      number: '3',
      title: 'Kondisi Operasional',

      items: [
        yesNo(
          'iri-period-3-1',
          '3.1',
          'Kendaraan survei dalam kondisi baik',
        ),
        yesNo(
          'iri-period-3-2',
          '3.2',
          'Bounce test dilakukan setiap hari',
        ),
        yesNo(
          'iri-period-3-3',
          '3.3',
          'Kecepatan kendaraan sesuai rekomendasi pabrik',
        ),
        yesNo(
          'iri-period-3-4',
          '3.4',
          'Pemeriksaan terhadap sistem sensor dilakukan',
        ),
        yesNo(
          'iri-period-3-5',
          '3.5',
          'Pemeriksaan terhadap peralatan perekam data dilakukan',
        ),
        yesNo(
          'iri-period-3-6',
          '3.6',
          'Kondisi ban kendaraan survei baik',
        ),
        yesNo(
          'iri-period-3-7',
          '3.7',
          'Tekanan ban sesuai rekomendasi',
        ),
        yesNo(
          'iri-period-3-8',
          '3.8',
          'Kondisi suspensi kendaraan baik',
        ),
        yesNo(
          'iri-period-3-9',
          '3.9',
          'Survei dilakukan pada cuaca kering',
        ),
        yesNo(
          'iri-period-3-10',
          '3.10',
          'Permukaan jalan dalam kondisi kering',
        ),
      ],
    },

    {
      id: 'iri-period-quality',
      number: '4',
      title: 'Format & Kualitas Data',

      items: [
        yesNo(
          'iri-period-4-1',
          '4.1',
          'Data IRI disajikan dengan interval 100 meter',
        ),
        yesNo(
          'iri-period-4-2',
          '4.2',
          'Interval pengambilan data memanjang tidak lebih dari 50 mm',
        ),
        yesNo(
          'iri-period-4-3',
          '4.3',
          'Data terekam dari dua jalur roda per lajur',
        ),
        yesNo(
          'iri-period-4-4',
          '4.4',
          'Nilai IRI lajur adalah rata-rata dari roda kiri dan kanan',
        ),
        yesNo(
          'iri-period-4-5',
          '4.5',
          'Format data sesuai ketentuan SMD Jalan',
        ),
        yesNo(
          'iri-period-4-6',
          '4.6',
          'Metadata terekam dengan baik',
        ),
        yesNo(
          'iri-period-4-7',
          '4.7',
          'Nama ruas dan STA (chainage) terekam dengan benar',
        ),
        yesNo(
          'iri-period-4-8',
          '4.8',
          'Data koordinat GPS tersedia untuk setiap segmen 100 m',
        ),
        yesNo(
          'iri-period-4-9',
          '4.9',
          'Arah pengukuran terekam dengan benar',
        ),
        yesNo(
          'iri-period-4-10',
          '4.10',
          'Kecepatan kendaraan saat survei terekam',
        ),
      ],
    },

    {
      id: 'iri-period-documentation',
      number: '5',
      title: 'Dokumentasi Konsistensi',

      items: [
        yesNo(
          'iri-period-5-1',
          '5.1',
          'Log harian operasi alat tersedia',
        ),
        yesNo(
          'iri-period-5-2',
          '5.2',
          'Catatan kondisi lingkungan tersedia',
        ),
        yesNo(
          'iri-period-5-3',
          '5.3',
          'Faktor-faktor yang mempengaruhi pengukuran tercatat',
        ),
        yesNo(
          'iri-period-5-4',
          '5.4',
          'Berita acara konsistensi tersedia',
        ),
        yesNo(
          'iri-period-5-5',
          '5.5',
          'Dokumentasi foto/video saat survei tersedia',
        ),
      ],
    },

    {
      id: 'iri-period-result',
      number: '6',
      title: 'Hasil Konsistensi',
      description:
        'Nilai pengukuran, rata-rata, standar deviasi, CV dan status berasal dari hasil pemeriksaan konsistensi.',

      mode: 'table',

      items: [
        {
          id: 'iri-period-result-table',
          label:
            'Segmen · Pengukuran 1 · Pengukuran 2 · Pengukuran 3 · Rata-rata · Std. Deviasi · CV (%) · Status',
          responseType: 'table',
          dataOrigin: 'system',
        },
      ],
    },

    {
      id: 'iri-period-factors',
      number: '7',
      title: 'Faktor yang Mempengaruhi Pengukuran',

      items: [
        yesNo(
          'iri-period-7-1',
          '7.1',
          'Kemacetan lalu lintas',
        ),
        yesNo(
          'iri-period-7-2',
          '7.2',
          'Kegiatan konstruksi jalan',
        ),
        yesNo(
          'iri-period-7-3',
          '7.3',
          'Hujan',
        ),
        yesNo(
          'iri-period-7-4',
          '7.4',
          'Genangan air',
        ),
        yesNo(
          'iri-period-7-5',
          '7.5',
          'Penyimpangan dari lajur yang diukur',
        ),
        yesNo(
          'iri-period-7-6',
          '7.6',
          'Kecepatan terlalu rendah',
        ),
        yesNo(
          'iri-period-7-7',
          '7.7',
          'Hentakan pada saat percepatan/perlambatan/berbelok',
        ),
        yesNo(
          'iri-period-7-8',
          '7.8',
          'Geometrik jalan yang berkelok-kelok/naik turun',
        ),
        yesNo(
          'iri-period-7-9',
          '7.9',
          'Abutments/expansion joints jembatan',
        ),
        yesNo(
          'iri-period-7-10',
          '7.10',
          'Lumpur, sampah di permukaan jalan',
        ),
        yesNo(
          'iri-period-7-11',
          '7.11',
          'Faktor lainnya',
        ),
      ],
    },

    {
      id: 'iri-period-correction',
      number: '8',
      title: 'Tindakan Perbaikan',
      description:
        'Temuan yang membutuhkan tindak lanjut diteruskan ke modul Temuan & Perbaikan. Data raw tidak diubah dari checklist.',

      mode: 'table',

      items: [
        {
          id: 'iri-period-correction-table',
          label:
            'Temuan · Tindakan Perbaikan · Status · Tanggal Penyelesaian',
          responseType: 'table',
          dataOrigin: 'system',
        },
      ],
    },

    {
      id: 'iri-period-approval',
      title: 'Persetujuan',
      description:
        'Status persetujuan dan BA mengikuti workflow review yang berwenang.',

      mode: 'table',

      items: [
        {
          id: 'iri-period-approval-table',
          label:
            'Petugas Survei · Supervisor · Quality Control · Pejabat Pembuat Komitmen',
          responseType: 'table',
          dataOrigin: 'system',
        },
      ],
    },
  ],
};

const templates: StructuredChecklistTemplate[] = [
  iriCalibration,
  iriPeriodic14,

  pciManualCalibration,
  pciAiCalibration,
  lendutanCalibration,
  jembatanCalibration,
  laluLintasCalibration,
lerengCalibration,
drainaseCalibration,
rniCalibration,
];

export function getStructuredChecklistTemplate(
  survey: StructuredSurvey,
  phase: StructuredChecklistTemplate['phase'],
) {
  return templates.find(
    template =>
      template.survey === survey &&
      template.phase === phase,
  );
}