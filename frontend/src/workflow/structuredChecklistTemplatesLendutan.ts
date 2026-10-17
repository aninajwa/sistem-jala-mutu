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

function readonlyItem(
  id: string,
  label: string,
  origin:
    | 'package'
    | 'source-system' = 'package',
): StructuredChecklistItem {
  return {
    id,
    label,
    responseType: 'readonly',
    dataOrigin: origin,
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

export const lendutanCalibration:
  StructuredChecklistTemplate = {
  id: 'lendutan-calibration-2025',
  survey: 'Lendutan',
  phase: 'calibration',
  title: 'Checklist Kalibrasi & Validasi Lendutan',

  sections: [
    section(
      'lendutan-general',
      'I. Informasi Umum',
      [
        readonlyItem(
          'lendutan-general-check-type',
          'Jenis Pemeriksaan: Kalibrasi dan Validasi Survei Lendutan',
        ),
        readonlyItem(
          'lendutan-general-contract',
          'Nama Kontrak',
        ),
        readonlyItem(
          'lendutan-general-contract-number',
          'Nomor Kontrak',
        ),
        readonlyItem(
          'lendutan-general-location',
          'Lokasi Uji',
        ),
        readonlyItem(
          'lendutan-general-provider',
          'Penyedia Jasa',
        ),
        readonlyItem(
          'lendutan-general-provider-pic',
          'Penanggung Jawab Penyedia Jasa',
        ),
        readonlyItem(
          'lendutan-general-user',
          'Pengguna Jasa',
        ),
        readonlyItem(
          'lendutan-general-user-pic',
          'Penanggung Jawab Pengguna Jasa',
        ),
      ],
    ),

    section(
      'lendutan-equipment',
      'II. Informasi Peralatan',
      [
        readonlyItem(
          'lendutan-equipment-type',
          'Jenis Alat Uji Lendutan: FWD / BB / LWD',
          'source-system',
        ),
        readonlyItem(
          'lendutan-equipment-name',
          'Nama/Merk Alat',
          'source-system',
        ),
        readonlyItem(
          'lendutan-equipment-serial',
          'Nomor Seri Alat',
          'source-system',
        ),
        readonlyItem(
          'lendutan-equipment-year',
          'Tahun Pembuatan',
          'source-system',
        ),
        readonlyItem(
          'lendutan-equipment-reference-date',
          'Tanggal Kalibrasi Referensi Terakhir',
          'source-system',
        ),
        readonlyItem(
          'lendutan-equipment-relative-date',
          'Tanggal Kalibrasi Relatif Terakhir',
          'source-system',
        ),
        readonlyItem(
          'lendutan-equipment-operator',
          'Operator Alat',
          'source-system',
        ),
      ],
    ),

    section(
      'lendutan-reference',
      'III. Kalibrasi Referensi Tahunan',
      [
        choice(
          'lendutan-reference-1',
          '1',
          'FWD: Load cell dan deflection sensors tervalidasi (AASHTO 2009, R32)',
          ['Ada', 'Tidak Ada'],
          true,
        ),
        choice(
          'lendutan-reference-2',
          '2',
          'FWD: Temperature measurement sensors tervalidasi (sesuai spesifikasi pabrik)',
          ['Ada', 'Tidak Ada'],
          true,
        ),
        choice(
          'lendutan-reference-3',
          '3',
          'LWD: Geophone dan Level Beban tervalidasi (ASTM E2835-11 2015)',
          ['Ada', 'Tidak Ada'],
          true,
        ),
        choice(
          'lendutan-reference-4',
          '4',
          'LWD: Temperature measurement sensors tervalidasi (sesuai spesifikasi pabrik)',
          ['Ada', 'Tidak Ada'],
          true,
        ),
        choice(
          'lendutan-reference-5',
          '5',
          'BB: Kalibrasi dial gauge',
          ['Ada', 'Tidak Ada'],
          true,
        ),
        choice(
          'lendutan-reference-6',
          '6',
          'BB: Kalibrasi beban',
          ['Ada', 'Tidak Ada'],
          true,
        ),
      ],
    ),

    section(
      'lendutan-relative',
      'IV. Kalibrasi Relatif',
      [
        choice(
          'lendutan-relative-1',
          '1',
          'FWD: Deflection sensors tervalidasi (AASHTO 2009, R32 / COST 336 U4)',
          ['Ada', 'Tidak Ada'],
          true,
        ),
        choice(
          'lendutan-relative-2',
          '2',
          'LWD: Deflection sensors tervalidasi (ASTM E2835-11 2015)',
          ['Ada', 'Tidak Ada'],
          true,
        ),
        choice(
          'lendutan-relative-3',
          '3',
          'BB: Kalibrasi relatif terhadap sensor lain',
          ['Ada', 'Tidak Ada'],
          true,
        ),
      ],
    ),

    section(
      'lendutan-repeatability',
      'V. Pengukuran Konsistensi (Repeatability)',
      [
        choice(
          'lendutan-repeatability-1',
          '1',
          'Pengulangan pengukuran pada lokasi yang sama (minimal 3 kali)',
          [
            'Memenuhi',
            'Tidak Memenuhi',
          ],
        ),
        choice(
          'lendutan-repeatability-2',
          '2',
          'Koefisien variasi (CV) hasil pengukuran',
          [
            '≤ 5%',
            '> 5%',
          ],
        ),
        choice(
          'lendutan-repeatability-3',
          '3',
          'Perbandingan hasil pengukuran dengan alat acuan',
          [
            'Memenuhi',
            'Tidak Memenuhi',
          ],
        ),
      ],
    ),

    section(
      'lendutan-sensor',
      'VI. Monitoring Sensor Lendutan',
      [
        choice(
          'lendutan-sensor-1',
          '1',
          'Kondisi sensor lendutan',
          [
            'Baik',
            'Perlu Penggantian',
          ],
        ),
        choice(
          'lendutan-sensor-2',
          '2',
          'Apakah penggantian sensor diperlukan?',
          [
            'Ya',
            'Tidak',
          ],
        ),
        choice(
          'lendutan-sensor-3',
          '3',
          'Jika penggantian dilakukan, apakah sensor pengganti tersertifikasi dalam kalibrasi referensi sebelumnya (dalam 12 bulan terakhir)?',
          [
            'Ya',
            'Tidak',
            'Tidak Relevan',
          ],
        ),
        choice(
          'lendutan-sensor-4',
          '4',
          'Jika No. 3 dijawab "Tidak", apakah kalibrasi referensi ulang telah dilakukan?',
          [
            'Ya',
            'Tidak',
            'Tidak Relevan',
          ],
        ),
        choice(
          'lendutan-sensor-5',
          '5',
          'Jika No. 3 dijawab "Ya", apakah kalibrasi relatif telah dilakukan?',
          [
            'Ya',
            'Tidak',
            'Tidak Relevan',
          ],
        ),
      ],
    ),

    section(
      'lendutan-system',
      'VII. Validasi Sistem',
      [
        choice(
          'lendutan-system-1',
          '1',
          'Validasi pengukur jarak dilaksanakan sesuai AG:AM/T005',
          [
            'Ya',
            'Tidak',
          ],
        ),
        choice(
          'lendutan-system-2',
          '2',
          'Validasi konsistensi (repeatability) sensor lendutan dilaksanakan sesuai standar',
          [
            'Ya',
            'Tidak',
          ],
        ),
        choice(
          'lendutan-system-3',
          '3',
          'Apakah semua komponen alat berfungsi dengan baik?',
          [
            'Ya',
            'Tidak',
          ],
        ),
      ],
    ),

    section(
      'lendutan-trial',
      'VIII. Uji Coba Pengukuran',
      [
        choice(
          'lendutan-trial-1',
          '1',
          'Lokasi uji coba (minimum 1 lokasi per tim survei)',
          [
            'Memenuhi',
            'Tidak Memenuhi',
          ],
        ),
        choice(
          'lendutan-trial-2',
          '2',
          'Tingkat beban yang diterapkan pada uji',
          [
            'Memenuhi',
            'Tidak Memenuhi',
          ],
        ),
        choice(
          'lendutan-trial-3',
          '3',
          'Nilai lendutan yang terukur',
          [
            'Wajar',
            'Tidak Wajar',
          ],
        ),
        choice(
          'lendutan-trial-4',
          '4',
          'Penerapan koreksi temperatur',
          [
            'Diterapkan',
            'Tidak Diterapkan',
          ],
        ),
        choice(
          'lendutan-trial-5',
          '5',
          'Penerapan koreksi musim',
          [
            'Diterapkan',
            'Tidak Diterapkan',
          ],
        ),
        choice(
          'lendutan-trial-6',
          '6',
          'Hasil dievaluasi terhadap data historis (jika ada)',
          [
            'Konsisten',
            'Tidak Konsisten',
            'Tidak Ada Data Historis',
          ],
        ),
      ],
    ),

    section(
      'lendutan-documentation',
      'IX. Dokumentasi Hasil Uji',
      [
        choice(
          'lendutan-documentation-1',
          '1',
          'Nomor ruas jalan',
          ['Tercatat', 'Tidak Tercatat'],
        ),
        choice(
          'lendutan-documentation-2',
          '2',
          'Station/koordinat pengujian',
          ['Tercatat', 'Tidak Tercatat'],
        ),
        choice(
          'lendutan-documentation-3',
          '3',
          'Arah pengujian',
          ['Tercatat', 'Tidak Tercatat'],
        ),
        choice(
          'lendutan-documentation-4',
          '4',
          'Tanggal dan waktu pengujian',
          ['Tercatat', 'Tidak Tercatat'],
        ),
        choice(
          'lendutan-documentation-5',
          '5',
          'Posisi pengujian (L/Ln, R/Rn, sambungan pendekat, sambungan jauh)',
          ['Tercatat', 'Tidak Tercatat'],
        ),
        choice(
          'lendutan-documentation-6',
          '6',
          'Nomor seri alat uji',
          ['Tercatat', 'Tidak Tercatat'],
        ),
        choice(
          'lendutan-documentation-7',
          '7',
          'Nama operator',
          ['Tercatat', 'Tidak Tercatat'],
        ),
        choice(
          'lendutan-documentation-8',
          '8',
          'Beban yang digunakan',
          ['Tercatat', 'Tidak Tercatat'],
        ),
        choice(
          'lendutan-documentation-9',
          '9',
          'Lendutan masing-masing sensor',
          ['Tercatat', 'Tidak Tercatat'],
        ),
        choice(
          'lendutan-documentation-10',
          '10',
          'Jarak antar sensor',
          ['Tercatat', 'Tidak Tercatat'],
        ),
        choice(
          'lendutan-documentation-11',
          '11',
          'Tipe permukaan',
          ['Tercatat', 'Tidak Tercatat'],
        ),
        choice(
          'lendutan-documentation-12',
          '12',
          'Temperatur perkerasan',
          ['Tercatat', 'Tidak Tercatat'],
        ),
        choice(
          'lendutan-documentation-13',
          '13',
          'Tebal perkerasan',
          ['Tercatat', 'Tidak Tercatat'],
        ),
        choice(
          'lendutan-documentation-14',
          '14',
          'Pencatatan faktor-faktor yang mempengaruhi hasil pengujian',
          ['Tercatat', 'Tidak Tercatat'],
          true,
        ),
      ],
    ),

    section(
      'lendutan-conclusion',
      'X. Kesimpulan dan Rekomendasi',
      [
        choice(
          'lendutan-conclusion-1',
          '1',
          'Kalibrasi dan validasi peralatan',
          [
            'Memenuhi Persyaratan',
            'Tidak Memenuhi Persyaratan',
          ],
        ),
        choice(
          'lendutan-conclusion-2',
          '2',
          'Uji coba pengukuran',
          [
            'Memenuhi Persyaratan',
            'Tidak Memenuhi Persyaratan',
          ],
        ),
        choice(
          'lendutan-conclusion-3',
          '3',
          'Dokumentasi',
          [
            'Memenuhi Persyaratan',
            'Tidak Memenuhi Persyaratan',
          ],
          true,
        ),
        choice(
          'lendutan-conclusion-4',
          '4',
          'Kesimpulan Keseluruhan',
          [
            'Disetujui',
            'Disetujui dengan Catatan',
            'Tidak Disetujui',
          ],
        ),

        {
          id: 'lendutan-conclusion-note',
          label: 'Catatan dan Rekomendasi',
          responseType: 'text',
          noteAllowed: false,
          dataOrigin: 'provider',
          editableRoles: [...PROVIDER],
        },
      ],
    ),

    {
      id: 'lendutan-signature',
      title: 'XI. Tanda Tangan',
      mode: 'table',

      items: [
        {
          id: 'lendutan-signature-table',
          label: 'Pengesahan',
          responseType: 'table',
          dataOrigin: 'system',

          tableColumns: [
            'Pihak',
            'Nama',
            'Jabatan',
            'Tanda Tangan',
            'Tanggal',
          ],

          tableRows: [
            {
              Pihak: 'Penyedia Jasa',
            },
            {
              Pihak: 'Pengguna Jasa',
            },
          ],
        },
      ],
    },

    section(
      'lendutan-attachments',
      'Lampiran',
      [
        choice(
          'lendutan-attachment-1',
          '1',
          'Sertifikat Kalibrasi Alat',
          ['Ada', 'Tidak Ada'],
          true,
        ),
        choice(
          'lendutan-attachment-2',
          '2',
          'Dokumentasi Uji Coba Lapangan',
          ['Ada', 'Tidak Ada'],
          true,
        ),
        choice(
          'lendutan-attachment-3',
          '3',
          'Data Hasil Uji Coba',
          ['Ada', 'Tidak Ada'],
          true,
        ),
      ],
    ),
  ],
};