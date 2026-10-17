import type {
  StructuredChecklistItem,
  StructuredChecklistSection,
  StructuredChecklistTemplate,
} from './structuredChecklist';

const PROVIDER = [
  'Penyedia Jasa / Ketua Tim',
] as const;

function choice(
  id: string,
  number: string,
  label: string,
  options: string[],
  evidenceAllowed = false,
): StructuredChecklistItem {
  return {
    id,
    number,
    label,
    responseType: 'yes-no',
    options,
    noteAllowed: true,
    evidenceAllowed,
    dataOrigin: 'provider',
    editableRoles: [...PROVIDER],
  };
}

function check(
  id: string,
  number: string,
  label: string,
  evidenceAllowed = false,
): StructuredChecklistItem {
  return {
    id,
    number,
    label,
    responseType: 'check',
    noteAllowed: true,
    evidenceAllowed,
    dataOrigin: 'provider',
    editableRoles: [...PROVIDER],
  };
}

function numberItem(
  id: string,
  number: string,
  label: string,
): StructuredChecklistItem {
  return {
    id,
    number,
    label,
    responseType: 'number',
    noteAllowed: true,
    dataOrigin: 'provider',
    editableRoles: [...PROVIDER],
  };
}

function yesNoSection(
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
        choice(
          `${id}-${index + 1}`,
          `${startNumber + index}`,
          label,
          ['Ya', 'Tidak'],
        ),
    ),
  };
}

function checkSection(
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
        check(
          `${id}-${index + 1}`,
          `${startNumber + index}`,
          label,
        ),
    ),
  };
}

/* =========================================================
   PCI MANUAL — TAHAP 1
   ========================================================= */

export const pciManualCalibration:
  StructuredChecklistTemplate = {
  id: 'pci-manual-calibration-2025',
  survey: 'PCI Manual',
  phase: 'calibration',
  title: 'Checklist Kalibrasi & Validasi PCI Manual',

  sections: [
    yesNoSection(
      'pci-manual-equipment',
      'A. Kalibrasi Peralatan',
      1,
      [
        'Kamera digital/video telah dikalibrasi',
        'Resolusi kamera minimum 1280x1920 pixel (full HD)',
        'Frame rate kamera minimum 24 fps',
        'Kamera memiliki komponen stabilisasi gambar',
        'GPS pada kamera memiliki ketelitian ±5 meter pada 90% waktu',
        'Lensa kamera bersih dari debu, air, dan kotoran lain',
        'Kapasitas penyimpanan kamera mencukupi',
        'Baterai kamera terisi penuh',
        'Tripod/mounting perangkat dalam kondisi baik dan stabil',
      ],
    ),

    yesNoSection(
      'pci-manual-preparation',
      'B. Persiapan Survei',
      10,
      [
        'Rute survei telah ditetapkan dan dikonfirmasi',
        'Peta jaringan jalan/informasi ruas yang akan disurvei tersedia',
        'Data sekunder terkait dengan kondisi jalan telah ditelaah',
        'Personil survei telah dilatih dalam identifikasi jenis kerusakan jalan',
        'Semua peralatan keselamatan tersedia (rompi, helm, dsb)',
        'Formulir survei tersedia dan sesuai format',
        'Rencana manajemen lalu lintas telah disusun',
        'Kendaraan survei dalam kondisi baik dan telah diperiksa',
        'Kaca kendaraan dalam keadaan bersih dan bebas jamur',
        'Dashboard kendaraan berwarna gelap/ditutupi kain gelap',
      ],
    ),

    yesNoSection(
      'pci-manual-trial',
      'C. Validasi Uji Coba Survei',
      20,
      [
        'Uji coba dilakukan pada segmen jalan minimal 5 km',
        'Cuaca cerah dan permukaan jalan kering',
        'Arah pengambilan tidak berlawanan dengan matahari',
        'Interval pengambilan gambar maksimum 10 meter',
        'Semua gambar memiliki koordinat GPS',
        'Jenis kerusakan dapat teridentifikasi dari gambar',
        'Dimensi kerusakan dapat diukur dengan ketelitian 0.1m',
        'Komposisi gambar menampilkan 70% permukaan jalan',
        'Keseluruhan dokumentasi dapat menampilkan kerusakan dengan jelas',
        'Proses identifikasi, pencatatan, dan analisis konsisten',
      ],
    ),

    yesNoSection(
      'pci-manual-rater',
      'D. Validasi Konsistensi Penilai',
      30,
      [
        'Minimal 2 orang penilai mengevaluasi segmen yang sama',
        'Perbedaan hasil penilaian antar penilai <15%',
        'Kategori kerusakan teridentifikasi secara konsisten',
        'Tingkat keparahan kerusakan dinilai secara konsisten',
        'Pengukuran dimensi kerusakan konsisten antar penilai',
      ],
    ),

    {
      id: 'pci-manual-distress',
      title: 'E. Penilaian Jenis Kerusakan',
      mode: 'table',

      items: [
        {
          id: 'pci-manual-distress-table',
          label: 'Penilaian Jenis Kerusakan',
          responseType: 'table',
          dataOrigin: 'system',

          tableColumns: [
            'No.',
            'Jenis Kerusakan',
            'Teridentifikasi',
            'Ketelitian Pengukuran',
            'Catatan',
          ],

          tableRows: [
            { 'No.': 1, 'Jenis Kerusakan': 'Retak Buaya (Crocodile Cracking)' },
            { 'No.': 2, 'Jenis Kerusakan': 'Retak Tepi (Edge Cracking)' },
            { 'No.': 3, 'Jenis Kerusakan': 'Retak Melintang (Transverse Cracking)' },
            { 'No.': 4, 'Jenis Kerusakan': 'Retak lainnya (Other Cracking)' },
            { 'No.': 5, 'Jenis Kerusakan': 'Lubang (Pothole)' },
            { 'No.': 6, 'Jenis Kerusakan': 'Tambalan (Patching)' },
            { 'No.': 7, 'Jenis Kerusakan': 'Alur (Rutting)' },
            { 'No.': 8, 'Jenis Kerusakan': 'Keriting (Corrugations)' },
            { 'No.': 9, 'Jenis Kerusakan': 'Sungkur/Amblas (Shoving/Depression)' },
            { 'No.': 10, 'Jenis Kerusakan': 'Pelapukan/Pelepasan Butir (Weathering/Ravelling)' },
            { 'No.': 11, 'Jenis Kerusakan': 'Kegemukan/Licin (Bleeding/Slippery Surface)' },
            { 'No.': 12, 'Jenis Kerusakan': 'Penurunan Bahu (Drop off)' },
          ],
        },
      ],
    },

    yesNoSection(
      'pci-manual-report',
      'F. Format Pelaporan Data',
      36,
      [
        'Format data sesuai dengan ketentuan Ditjen Bina Marga',
        'Data terstruktur dengan baik dan mudah diakses',
        'Nilai PCI dihitung dengan benar pada setiap segmen',
        'Semua metadata (tanggal, waktu, koordinat) tersedia',
        'Data memiliki sistem backup yang memadai',
      ],
    ),

    {
      id: 'pci-manual-conclusion',
      title: 'G. Kesimpulan dan Rekomendasi',

      items: [
        choice(
          'pci-manual-result',
          'G.1',
          'Hasil Validasi',
          [
            'Diterima tanpa catatan',
            'Diterima dengan catatan',
            'Perlu perbaikan',
            'Ditolak',
          ],
        ),

        {
          id: 'pci-manual-recommendation',
          number: 'G.2',
          label: 'Catatan dan Rekomendasi',
          responseType: 'text',
          noteAllowed: false,
          dataOrigin: 'provider',
          editableRoles: [...PROVIDER],
        },
      ],
    },

    {
      id: 'pci-manual-validation-officer',
      title: 'Petugas Validasi',

      items: [
        {
          id: 'pci-manual-validator-name',
          label: 'Nama',
          responseType: 'text',
          dataOrigin: 'provider',
          editableRoles: [...PROVIDER],
        },
        {
          id: 'pci-manual-validator-position',
          label: 'Jabatan',
          responseType: 'text',
          dataOrigin: 'provider',
          editableRoles: [...PROVIDER],
        },
        {
          id: 'pci-manual-validator-signature',
          label: 'Tanda tangan / referensi pengesahan',
          responseType: 'text',
          dataOrigin: 'provider',
          editableRoles: [...PROVIDER],
        },
        {
          id: 'pci-manual-validator-date',
          label: 'Tanggal',
          responseType: 'text',
          dataOrigin: 'provider',
          editableRoles: [...PROVIDER],
        },
      ],
    },

    {
      id: 'pci-manual-approval',
      title: 'Disetujui oleh',

      items: [
        {
          id: 'pci-manual-approver-name',
          label: 'Nama',
          responseType: 'text',
          dataOrigin: 'reviewer',
          editableRoles: [
            'PIC Balai / Pengguna Jasa',
          ],
        },
        {
          id: 'pci-manual-approver-position',
          label: 'Jabatan',
          responseType: 'text',
          dataOrigin: 'reviewer',
          editableRoles: [
            'PIC Balai / Pengguna Jasa',
          ],
        },
        {
          id: 'pci-manual-approver-signature',
          label: 'Tanda tangan / referensi pengesahan',
          responseType: 'text',
          dataOrigin: 'reviewer',
          editableRoles: [
            'PIC Balai / Pengguna Jasa',
          ],
        },
        {
          id: 'pci-manual-approver-date',
          label: 'Tanggal',
          responseType: 'text',
          dataOrigin: 'reviewer',
          editableRoles: [
            'PIC Balai / Pengguna Jasa',
          ],
        },
      ],
    },
  ],
};

/* =========================================================
   PCI AI — TAHAP 1
   BOOLEAN di source Word = checkbox tunggal.
   ========================================================= */

const aiDetection = [
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
  'Perkerasan tanpa penutup: Kondisi baik/sedang/rusak ringan/rusak berat',
  'Bahu Jalan (ada/tidak, lebar, diperkeras/tidak, jenis bahan, kondisi)',
];

export const pciAiCalibration:
  StructuredChecklistTemplate = {
  id: 'pci-ai-calibration-2025',
  survey: 'PCI AI',
  phase: 'calibration',
  title: 'Checklist Kalibrasi & Validasi PCI Berbasis AI',

  sections: [
    checkSection(
      'pci-ai-smartphone',
      'A. Spesifikasi Smartphone',
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

    checkSection(
      'pci-ai-support',
      'B. Perangkat Pendukung',
      7,
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

    checkSection(
      'pci-ai-app',
      'A. Instalasi dan Konfigurasi Aplikasi',
      14,
      [
        'Aplikasi smartphone untuk akuisisi video terinstall dengan benar',
        'Aplikasi berfungsi pada perangkat Android maupun iOS',
        'Fitur keamanan data pada aplikasi berfungsi',
        'Aplikasi memiliki fitur akuisisi video berdasarkan informasi ruas jalan',
        'Aplikasi dapat mengunggah video melalui sinkronisasi cloud server',
      ],
    ),

    {
      id: 'pci-ai-self-calibration',
      title: 'B. Kalibrasi Mandiri',

      items: [
        check(
          'pci-ai-self-19',
          '19',
          'Dilakukan input dimensi groundtruth untuk pengukuran',
        ),
        check(
          'pci-ai-self-20',
          '20',
          'Boundary box untuk penyesuaian sudut kamera terhadap permukaan jalan dikonfigurasi',
        ),
        numberItem(
          'pci-ai-self-21',
          '21',
          'Komposisi pengambilan gambar: 70% objek jalan',
        ),
        check(
          'pci-ai-self-22',
          '22',
          'Area of Interest (AOI) berbentuk trapesium terkonfigurasi dengan benar',
        ),
        check(
          'pci-ai-self-23',
          '23',
          'Kecepatan kendaraan diatur maksimum 60 km/jam untuk hasil optimal',
        ),
      ],
    },

    checkSection(
      'pci-ai-model',
      'A. Verifikasi Model AI',
      24,
      [
        'Model AI telah melalui proses uji coba dan kliring teknologi melalui Direktorat Bina Teknik Jalan dan Jembatan',
        'Model AI telah melalui uji coba dan kliring teknologi melalui Balai Perkerasan dan Lingkungan Jalan (BPLJ)',
        'Model AI memiliki akurasi (F1 score) minimal 0,8 sebelum perbaikan (QA)',
        'Model AI memiliki akurasi (F1 score) minimal 0,9 setelah perbaikan (QA)',
        'Model AI memiliki kemampuan minimal untuk mengolah 3.000 km rekaman video lajur per hari',
      ],
    ),

    checkSection(
      'pci-ai-detection',
      'B. Kemampuan Deteksi Model AI',
      29,
      aiDetection,
    ),

    checkSection(
      'pci-ai-trial-prep',
      'A. Persiapan Uji Coba',
      55,
      [
        'Segmen uji coba dengan panjang minimal 5 km telah ditetapkan',
        'Terdapat variasi kerusakan pada segmen uji coba',
        'Kondisi cuaca cerah, dan permukaan jalan kering',
        'Penyangga smartphone terpasang dengan benar',
        'Pendingin smartphone beroperasi dengan baik',
        'Daya smartphone dan perangkat pendukung mencukupi',
      ],
    ),

    checkSection(
      'pci-ai-trial-run',
      'B. Pelaksanaan Uji Coba',
      61,
      [
        'Smartphone mulai merekam saat berada di awal lajur',
        'Kecepatan kendaraan tetap stabil, maksimum 60 km/jam',
        'Kendaraan tetap pada lajur yang sama',
        'Smartphone tidak mengalami overheat selama perekaman',
        'Smartphone berhenti merekam di akhir lajur',
        'Video berhasil diunggah ke cloud server',
      ],
    ),

    {
      id: 'pci-ai-trial-analysis',
      title: 'C. Analisis Hasil Uji Coba',

      items: [
        check('pci-ai-analysis-67', '67', 'Video hasil rekaman memiliki kualitas yang jelas'),
        check('pci-ai-analysis-68', '68', 'Model AI berhasil mendeteksi kerusakan pada video'),
        check('pci-ai-analysis-69', '69', 'Deteksi kerusakan relevan dengan kondisi lapangan'),
        check('pci-ai-analysis-70', '70', 'Dimensi kerusakan terukur secara akurat'),
        check('pci-ai-analysis-71', '71', 'Nilai PCI dihasilkan untuk setiap 50 meter'),
        numberItem(
          'pci-ai-analysis-72',
          '72',
          'Hasil memiliki keakuratan yang memadai (F1 score ≥ 0,8)',
        ),
      ],
    },

    checkSection(
      'pci-ai-internal',
      'A. Validasi Internal (Penyedia Jasa)',
      73,
      [
        'Dilakukan validasi mandiri setiap 14 hari',
        'Validasi dilakukan pada minimal 5 km jalan yang sama',
        'Hasil validasi mandiri didokumentasikan dengan baik',
        'Dilakukan perbandingan hasil dengan pengukuran sebelumnya',
        'Konsistensi kinerja alat dan model AI terjaga',
      ],
    ),

    {
      id: 'pci-ai-external',
      title: 'B. Validasi Eksternal (Pengguna Jasa)',

      items: [
        numberItem(
          'pci-ai-external-78',
          '78',
          'Dilakukan pemeriksaan acak terhadap minimal 5% panjang jalan',
        ),
        check(
          'pci-ai-external-79',
          '79',
          'Dilakukan perbandingan hasil deteksi AI dengan kondisi aktual',
        ),
        check('pci-ai-external-80', '80', 'Precision score minimal 0,9 terpenuhi'),
        check('pci-ai-external-81', '81', 'Recall score minimal 0,9 terpenuhi'),
        check('pci-ai-external-82', '82', 'F1 score minimal 0,9 terpenuhi'),
      ],
    },

    checkSection(
      'pci-ai-correction',
      'C. Tindakan Perbaikan',
      83,
      [
        'Dilakukan identifikasi kesalahan deteksi',
        'Dilakukan pelabelan manual untuk perbaikan akurasi',
        'Dilakukan transfer learning untuk meningkatkan performa model',
        'Dilakukan ensemble methods untuk meningkatkan akurasi',
        'Dilakukan survei ulang pada segmen dengan hasil tidak akurat',
      ],
    ),

    {
      id: 'pci-ai-metrics',
      title: 'A. Metrik Evaluasi',
      mode: 'table',
      items: [
        {
          id: 'pci-ai-metrics-table',
          label: 'Metrik Evaluasi',
          responseType: 'table',
          dataOrigin: 'system',
          tableColumns: [
            'No.',
            'Metrik',
            'Nilai',
            'Standar Minimal',
            'Keterangan',
          ],
          tableRows: [
            { 'No.': 1, Metrik: 'Precision' },
            { 'No.': 2, Metrik: 'Recall' },
            { 'No.': 3, Metrik: 'F1 Score' },
            { 'No.': 4, Metrik: 'Average Precision (AP)' },
            { 'No.': 5, Metrik: 'Mean Average Precision (mAP)' },
          ],
        },
      ],
    },

    {
      id: 'pci-ai-confusion',
      title: 'B. Analisis Confusion Matrix',
      mode: 'table',
      items: [
        {
          id: 'pci-ai-confusion-table',
          label: 'Analisis Confusion Matrix',
          responseType: 'table',
          dataOrigin: 'system',
          tableColumns: [
            'No.',
            'Metrik',
            'Nilai',
            'Keterangan',
          ],
          tableRows: [
            { 'No.': 1, Metrik: 'True Positive (TP)' },
            { 'No.': 2, Metrik: 'False Positive (FP)' },
            { 'No.': 3, Metrik: 'True Negative (TN)' },
            { 'No.': 4, Metrik: 'False Negative (FN)' },
          ],
        },
      ],
    },

    {
      id: 'pci-ai-distress-evaluation',
      title: 'C. Evaluasi Per Jenis Kerusakan',
      mode: 'table',
      items: [
        {
          id: 'pci-ai-distress-evaluation-table',
          label: 'Evaluasi Per Jenis Kerusakan',
          responseType: 'table',
          dataOrigin: 'system',
          tableColumns: [
            'No.',
            'Jenis Kerusakan',
            'Precision',
            'Recall',
            'F1 Score',
            'Keterangan',
          ],
          tableRows: [
            { 'No.': 1, 'Jenis Kerusakan': 'Retak Buaya' },
            { 'No.': 2, 'Jenis Kerusakan': 'Retak Tepi' },
            { 'No.': 3, 'Jenis Kerusakan': 'Retak Melintang' },
            { 'No.': 4, 'Jenis Kerusakan': 'Lubang' },
            { 'No.': 5, 'Jenis Kerusakan': 'Tambalan' },
          ],
        },
      ],
    },

    checkSection(
      'pci-ai-result',
      'A. Hasil Kegiatan Kalibrasi dan Validasi',
      91,
      [
        'Kalibrasi smartphone dan perangkat pendukung telah dilakukan',
        'Validasi aplikasi dan sistem pengambilan video telah dilakukan',
        'Validasi model AI telah dilakukan',
        'Uji coba lapangan telah dilakukan',
        'Hasil evaluasi kinerja model AI memenuhi standar minimal',
      ],
    ),

    {
      id: 'pci-ai-conclusion',
      title: 'B. Kesimpulan dan Rekomendasi',
      mode: 'table',

      items: [
        {
          id: 'pci-ai-conclusion-table',
          label: 'Kesimpulan dan Rekomendasi',
          responseType: 'table',
          dataOrigin: 'system',

          tableColumns: [
            'Pihak',
            'Penyedia Jasa',
            'Pengguna Jasa',
            'Direktorat Bina Teknik',
          ],

          tableRows: [
            { Pihak: 'Nama' },
            { Pihak: 'Jabatan' },
            { Pihak: 'Tanggal' },
            { Pihak: 'Tanda Tangan' },
          ],
        },
      ],
    },
  ],
};