import type {
  StructuredChecklistItem,
  StructuredChecklistSection,
  StructuredChecklistTemplate,
} from './structuredChecklist';

const PROVIDER = [
  'Penyedia Jasa / Ketua Tim',
] as const;

function statusItem(
  id: string,
  number: string,
  label: string,
): StructuredChecklistItem {
  return {
    id,
    number,
    label,
    responseType: 'comply',
    options: [
      'Memenuhi',
      'Tidak Memenuhi',
    ],
    noteAllowed: true,
    dataOrigin: 'provider',
    editableRoles: [...PROVIDER],
  };
}

function readonlyItem(
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

function section(
  id: string,
  title: string,
  startNumber: number,
  labels: string[],
): StructuredChecklistSection {
  return {
    id,
    title,

    items: labels.map(
      (label, index) =>
        statusItem(
          `${id}-${index + 1}`,
          `${startNumber + index}`,
          label,
        ),
    ),
  };
}

export const pciAiCalibration:
  StructuredChecklistTemplate = {
  id: 'pci-ai-calibration-2025',
  survey: 'PCI AI',
  phase: 'calibration',
  title: 'Checklist Kalibrasi & Validasi PCI Berbasis AI',

  sections: [
    {
      id: 'pci-ai-general',
      number: 'I',
      title: 'Informasi Umum',
      mode: 'auto',

      items: [
        readonlyItem(
          'pci-ai-general-title',
          'Nama/Judul Kegiatan',
        ),
        readonlyItem(
          'pci-ai-general-contract',
          'Nomor Kontrak',
        ),
        readonlyItem(
          'pci-ai-general-period',
          'Waktu Pelaksanaan',
        ),
        readonlyItem(
          'pci-ai-general-provider',
          'Nama Penyedia Jasa',
        ),
        readonlyItem(
          'pci-ai-general-road',
          'Lokasi Ruas Jalan',
        ),
        readonlyItem(
          'pci-ai-general-road-number',
          'Nomor Ruas',
        ),
        readonlyItem(
          'pci-ai-general-length',
          'Panjang Ruas (km)',
        ),
        readonlyItem(
          'pci-ai-general-date',
          'Tanggal Kalibrasi/Validasi',
        ),
        readonlyItem(
          'pci-ai-general-officer',
          'Nama Petugas',
        ),
      ],
    },

    section(
      'pci-ai-smartphone',
      'II.A. Spesifikasi Smartphone',
      1,
      [
        'RAM minimal 8GB dengan penyimpanan internal tersedia minimal 150GB',
        'Kamera utama dengan resolusi minimal 12MP (wide)',
        'Kemampuan merekam video hingga 4K pada 60fps atau lebih tinggi',
        'Kapasitas baterai minimum 4.000mAh dengan dukungan pengisian cepat minimal 20W',
        'Sistem operasi minimal Android 11 atau iOS setara',
        'Tersedia smartphone cadangan untuk antisipasi masalah teknis',
      ],
    ),

    section(
      'pci-ai-support',
      'II.B. Perangkat Pendukung',
      1,
      [
        'Penyangga smartphone (mount holder) dengan stabilitas tinggi',
        'Dudukan smartphone terpasang dengan sudut optimal untuk pengambilan area permukaan jalan',
        'Pendingin smartphone (cooling fan) untuk mencegah overheating',
        'Sumber daya tambahan baterai smartphone (power bank/car charger)',
        'Paket data/WiFi portable dengan kuota yang mencukupi',
        'Kaca kendaraan dalam keadaan bersih dan bebas jamur',
        'Dashboard kendaraan berwarna gelap atau ditutupi kain gelap',
      ],
    ),

    section(
      'pci-ai-app',
      'III.A. Instalasi dan Konfigurasi Aplikasi',
      1,
      [
        'Aplikasi smartphone untuk akuisisi video terinstall dengan benar',
        'Aplikasi berfungsi pada perangkat Android maupun iOS',
        'Fitur keamanan data pada aplikasi berfungsi',
        'Aplikasi memiliki fitur akuisisi video berdasarkan informasi ruas jalan',
        'Aplikasi dapat mengunggah video melalui sinkronisasi cloud server',
      ],
    ),

    section(
      'pci-ai-self-calibration',
      'III.B. Kalibrasi Mandiri',
      1,
      [
        'Dilakukan input dimensi groundtruth untuk pengukuran',
        'Boundary box untuk penyesuaian sudut kamera terhadap permukaan jalan dikonfigurasi',
        'Komposisi pengambilan gambar: 70% objek jalan',
        'Area of Interest (AOI) berbentuk trapesium terkonfigurasi dengan benar',
        'Kecepatan kendaraan diatur maksimum 60 km/jam untuk hasil optimal',
      ],
    ),

    section(
      'pci-ai-model-verification',
      'IV.A. Verifikasi Model AI',
      1,
      [
        'Model AI telah melalui proses uji coba dan kliring teknologi melalui Direktorat Bina Teknik Jalan dan Jembatan',
        'Model AI telah melalui uji coba dan kliring teknologi melalui Balai Perkerasan dan Lingkungan Jalan (BPLJ)',
        'Model AI memiliki akurasi (F1 score) minimal 0,8 sebelum perbaikan (QA)',
        'Model AI memiliki akurasi (F1 score) minimal 0,9 setelah perbaikan (QA)',
        'Model AI memiliki kemampuan minimal untuk mengolah 3.000 km rekaman video lajur per hari',
      ],
    ),

    {
      id: 'pci-ai-detection',
      title: 'IV.B. Kemampuan Deteksi Model AI',

      items: [
        ...[
          'Retak Buaya (Crocodile Cracking), (m²)',
          'Retak Tepi (Edge Cracking), (m)',
          'Retak Melintang (Transverse Cracking), (m)',
          'Retak lainnya (Other Cracking), (m²)',
          'Lubang (Pothole), (jumlah, luas, kedalaman)',
          'Tambalan (Patching), (m²)',
          'Alur (Rutting), (m², kedalaman)',
          'Keriting (Corrugations), (m²)',
          'Sungkur/Amblas (Shoving/Depression), (m²)',
          'Pelapukan/Pelepasan Butir (Weathering/Ravelling), (m²)',
          'Kegemukan/Licin (Bleeding/Slippery Surface), (m²)',
          'Penurunan Bahu (Drop off), (mm)',
        ].map((label, index) =>
          statusItem(
            `pci-ai-flexible-${index + 1}`,
            `${index + 1}`,
            label,
          ),
        ),

        ...[
          'Retak Sudut (Corner Break), (1 plat)',
          'Pemisahan Panel (Divided Slab), (1 plat)',
          'Penanggaan (Faulting), (1 plat)',
          'Retak Linear (Linear Cracking), (1 plat)',
          'Panel Pecah (Punched Out), (1 plat)',
          'Retak Susut/Lainnya (Shrinkage/Other Cracking), (1 plat)',
          'Pemompaan (Pumping), (2 plat)',
          'Gompal Sudut (Spalling Corner), (1 plat)',
          'Gompal Sambungan (Spalling Join), (1 plat)',
          'Tambalan (Patching), (1 plat)',
          'Kerusakan Bahan Penyumbat (Joint Seal), (1 plat)',
          'Penurunan Lajur/Bahu (Drop Off), (mm)',
        ].map((label, index) =>
          statusItem(
            `pci-ai-rigid-${index + 1}`,
            `${index + 13}`,
            label,
          ),
        ),

        statusItem(
          'pci-ai-other-25',
          '25',
          'Perkerasan tanpa penutup: Kondisi baik/sedang/rusak ringan/rusak berat',
        ),

        statusItem(
          'pci-ai-other-26',
          '26',
          'Bahu Jalan (ada/tidak, lebar, diperkeras/tidak, jenis bahan, kondisi)',
        ),
      ],
    },
  ],
};