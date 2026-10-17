import type { DailySurveyRecord, ProductionTest, SurveyType } from './model';

export type TechnicalField = { key: string; label: string; options?: string[]; numeric?: boolean };
const text = (key: string, label: string): TechnicalField => ({ key, label });
const number = (key: string, label: string): TechnicalField => ({ key, label, numeric: true });
const choice = (key: string, label: string, options: string[]): TechnicalField => ({ key, label, options });

export const SURVEY_REFERENCES: Record<SurveyType, string> = {
  IRI: 'QA dan QC IRI 2026, hlm. 7–9 dan 12–14.',
  PCI: 'IKP/PCI QAQC 2026, hlm. PDF 49–52 (slide 97–104); kriteria ground truth pada slide 101 berlaku pada hasil bacaan survei.',
  Lendutan: 'Pengujian Data Lendutan 6 April 2026, hlm. 3, 16–18, 28, 45, 48, 61–62. FWD dan LWD memiliki prosedur berbeda.',
  Jembatan: 'VV Pemeriksaan Jembatan 2026, hlm. 103–106; Pemeriksaan Khusus pada Jembatan Khusus, hlm. 4 dan 19–20.',
  Lereng: 'Inventarisasi Lereng, hlm. 19, 66, 80–90; Inspeksi/Risiko, hlm. 4–5, 46, 59; VV Lereng, hlm. 5–18; InSlope, hlm. 3–5.',
  'Lalu Lintas': 'QA QC Survei Lalu Lintas 2026, slide 31, 33–36. Durasi sesuai rancangan; data kosong berbeda dari volume nol.',
  RNI: 'RNI 2026, hlm. 2–11: 42 parameter; from_sta/to_sta menggunakan decameter (10 m), bukan km.',
  Drainase: 'Lampiran Checklist QA/QC Drainase tersedia untuk kalibrasi/validasi, konsistensi, verval internal/2-mingguan/bertahap, dan audit data. Detail ambang tetap mengikuti sumber QA/QC yang berlaku.',
};

export const PRODUCTION_FIELDS: Record<SurveyType, (keyof ProductionTest)[]> = {
  IRI: ['trialKm','sections','sectionLengthKm','repeats','speedTrials40','speedTrials50','speedTrialsAbove60','coefficientA','coefficientB','rSquared','coefficientVariation'],
  PCI: ['trialKm','repeats','sections','f1Before','f1After','meanAveragePrecision','segmentsWithinFive','segmentsAtLeastFifteen','standardDeviation'],
  Lendutan: ['locations','fwdLoad'],
  Jembatan: ['locations'],
  Lereng: ['locations'],
  Drainase: ['trialKm'],
  'Lalu Lintas': ['locations','trafficHours','repeats'],
  RNI: ['trialKm'],
};

export const PRODUCTION_REFERENCE_CHECKS: Record<SurveyType, string[]> = {
  IRI: [
    'Referensi statis Kelas 1 pada jejak roda kiri dan kanan',
    'Lima seksi memenuhi rentang IRI pada tabel hlm. 9, lead-in/out ±100 m, lurus dan kelandaian ≤4%',
    'Regresi diperiksa per seksi/kecepatan; CV diperiksa per segmen 100 m, bukan hanya rata-rata gabungan',
  ],
  PCI: ['Ground truth lapangan dan pasangan nilai per segmen terdokumentasi'],
  Lendutan: ['Kalibrasi sensor, jarak dan temperatur sesuai jenis alat terdokumentasi'],
  Jembatan: ['Identitas, inventarisasi dan formulir sesuai jenis pemeriksaan', 'Bukti foto dan konsistensi penilaian elemen ditinjau'],
  Lereng: ['Tim geoteknik, geologi dan asisten sesuai kualifikasi acuan', 'Formulir inventarisasi/inspeksi dan risiko sesuai jenis keruntuhan', 'Nomor lereng, koordinat awal/tengah/akhir dan KM diperiksa'],
  'Lalu Lintas': ['Lokasi pos, arah/lajur, klasifikasi kendaraan, format raw dan rancangan durasi ditetapkan'],
  RNI: ['Pemetaan 42 parameter, kode lajur dan satuan STA decameter diperiksa'],
  Drainase: [],
};

export function productionFields(type: SurveyType, test: ProductionTest) {
  if (type === 'PCI' && test.pciManual) return PRODUCTION_FIELDS.PCI.filter(k => !['sections','f1Before','f1After','meanAveragePrecision','standardDeviation'].includes(k));
  if (type === 'Lendutan' && test.deflectionMethod === 'LWD') return ['locations','lwdCorrelationPoints','lwdRepeats','lwdDifferenceMicrons','lwdDifferencePercent'] as (keyof ProductionTest)[];
  return PRODUCTION_FIELDS[type];
}

export function dailyFields(record: Pick<DailySurveyRecord, 'surveyType'|'technicalData'>): TechnicalField[] {
  const data = record.technicalData ?? {};
  const location = [text('assetId','ID objek / titik / segmen'), number('longitude','Longitude WGS84'), number('latitude','Latitude WGS84'), text('evidence','Referensi formulir / raw / foto (simulasi)')];
  switch (record.surveyType) {
    case 'IRI': return [...location, choice('iriClass','Kelas alat IRI',['Kelas 1','Kelas 3']), number('crew','Jumlah personel'), text('recorder','Nama pencatat'), number('targetSpeed','Target kecepatan (km/jam)'), number('actualSpeed','Kecepatan aktual (km/jam)'), choice('longWarmup','IRI >8 atau kondisi dingin/basah?',['Tidak','Ya']), number('warmup','Pemanasan (menit)')];
    case 'PCI': return [...location, choice('pciMethod','Metode PCI',['Manual','AI']), number('pci','Nilai PCI (0–100)'), text('sampleUnit','ID unit sampel / seksi'), text('distressForm','Referensi jenis, tingkat dan kuantitas kerusakan')];
    case 'Lendutan': return [...location, choice('method','Metode lendutan',['FWD','LWD']), number('station','KM / station titik'), number('temperature','Temperatur perkerasan (°C)'), number('drops','Jumlah drop (termasuk seating)'), number('load','Beban aktual (kN)'), number('slope','Kemiringan titik (%)'), ...(data.method === 'LWD'
      ? [text('geophones','Konfigurasi ≥3 geophone dan jaraknya (mm)'), number('repeatDifferenceMicrons','Selisih ulangan (µm)'), number('repeatDifferencePercent','Selisih ulangan (%)')]
      : [choice('sensors','Jumlah sensor FWD',['7','9']), text('geophones','Jarak sensor sesuai konfigurasi (mm)')])];
    case 'Jembatan': return [...location, choice('inspection','Jenis pemeriksaan',['Inventarisasi','Detail','Khusus']), number('condition','Nilai kondisi level 1 (0–5)'), text('elementForm','Referensi formulir elemen/kerusakan'), ...(data.inspection === 'Khusus' ? [text('specialPlan','Referensi rencana pemeriksaan khusus / NDT / geometri / uji beban')] : [])];
    case 'Lereng': return [...location, choice('activity','Kegiatan lereng',['Inventarisasi baru','Inventarisasi ulang','Inventarisasi cepat','Inspeksi rutin','Inspeksi berkala','Inspeksi khusus']), number('kmStart','KM awal'), number('kmEnd','KM akhir'), text('middleCoordinate','Koordinat tengah (longitude,latitude)'), text('endCoordinate','Koordinat akhir (longitude,latitude)'), text('riskForm','Referensi formulir bahaya dan konsekuensi'), ...(data.activity?.startsWith('Inspeksi') ? [text('inventoryReference','Referensi inventarisasi yang sudah ada')] : [])];
    case 'Lalu Lintas': return [...location, choice('trafficMethod','Rancangan survei',['Durasi pendek','Menerus']), text('classification','Skema klasifikasi kendaraan'), number('plannedMinutes','Durasi yang direncanakan untuk rekaman ini (menit)'), number('maxGap','Data hilang menerus terlama (menit)'), text('logbook','Referensi logbook / raw / arsip')];
    case 'RNI': return [...location, number('fromSta','from_sta (decameter)'), number('toSta','to_sta (decameter)'), text('laneCode','lane_code (L1/L2/L3/R1/R2/R3)'), text('surfaceType','surf_type (kode)'), number('surfaceYear','surf_year'), number('laneWidth','lane_width (m)'), number('surfaceWidth','surf_width (m)'), text('inventoryForm','Referensi formulir lengkap 42 parameter RNI')];
    case 'Drainase': return [...location, text('drainageForm','Referensi formulir dan metode kontrak (acuan teknis belum dilampirkan)')];
  }
}

export function dailyChecks(record: Pick<DailySurveyRecord, 'surveyType'|'technicalData'>): string[] {
  const data = record.technicalData ?? {};
  const common = ['Baterai','Penyimpanan'];
  const perType: Record<SurveyType,string[]> = {
    IRI: data.iriClass === 'Kelas 3'
      ? ['Posisi sensor','Muatan sesuai kalibrasi','Tekanan dan kondisi ban','Suspensi','BBM diperiksa']
      : ['Bounce test','Laser bersih','Ketinggian laser / block test bila berubah'],
    PCI: ['Unit sampel, kerusakan dan tingkat keparahan terdokumentasi', ...(data.pciMethod === 'AI' ? ['Citra tajam, cakupan dan pencahayaan sesuai'] : ['Penilai mengikuti formulir PCI'])],
    Lendutan: ['Pelat stabil dan titik bersih','Konfigurasi sensor dan jejak roda sesuai','Kalibrasi relatif, DMI dan temperatur masih sesuai periode penggunaan'],
    Jembatan: ['Foto inventarisasi/kerusakan memadai','Kondisi level 1–3 konsisten atau intervensi dijelaskan','Rencana keselamatan pemeriksaan sesuai'],
    Lereng: ['Tim dan keselamatan lokasi sesuai','Geometri koordinat/KM ditinjau pada peta','Formulir bahaya/konsekuensi sesuai jenis keruntuhan'],
    'Lalu Lintas': ['Peralatan dan posisi kamera/counter sesuai','Metadata waktu, lajur, arah dan klasifikasi lengkap','Volume nol dibedakan dari data kosong'],
    RNI: ['Seluruh 42 parameter diperiksa pada formulir sumber','Kode, satuan, lebar dan STA konsisten'],
    Drainase: ['Formulir kontrak dan keselamatan diperiksa'],
  };
  return [...common,...perType[record.surveyType]];
}

export function evaluateDailySurvey(record: Omit<DailySurveyRecord,'id'>, existing: DailySurveyRecord[] = []): string[] {
  const errors: string[] = [];
  const data = record.technicalData ?? {};
  const value = (key: string) => Number(data[key]);
  for (const field of dailyFields(record)) {
    if (!data[field.key]?.trim()) errors.push(`${field.label} wajib diisi.`);
    else if (field.numeric && !Number.isFinite(value(field.key))) errors.push(`${field.label} harus angka valid.`);
    else if (field.options && !field.options.includes(data[field.key])) errors.push(`${field.label} tidak valid.`);
  }
  if (value('longitude') < 94 || value('longitude') > 141 || value('latitude') < -11 || value('latitude') > 6) errors.push('Koordinat harus longitude/latitude Indonesia dalam WGS84.');
  if (!dailyChecks(record).every(key => record.dailyToolCheck[key])) errors.push('Pemeriksaan harian sesuai jenis/metode belum lengkap.');
  if (!record.operator.trim() || !record.rawValue.trim() || !record.lane.trim() || !record.time || !record.date) errors.push('Metadata waktu, lajur, operator dan raw wajib lengkap.');
  if (record.surveyType === 'IRI' && ((data.iriClass === 'Kelas 3') !== (record.tool === 'IRI Tipe Respon'))) errors.push('Kelas IRI harus sesuai alat yang digunakan.');
  if (record.surveyType === 'Lendutan' && ((data.method === 'LWD') !== (record.tool === 'LWD'))) errors.push('Metode lendutan harus sesuai alat yang digunakan.');
  if (!Number.isFinite(record.lengthKm) || record.lengthKm < 0 || !['Jembatan','Lereng','Lendutan','Lalu Lintas'].includes(record.surveyType) && record.lengthKm <= 0) errors.push('Panjang tidak valid; survei linier memerlukan panjang >0.');
  if (record.surveyType === 'IRI') {
    if (!Number.isInteger(value('crew')) || value('crew') < 3 || !record.driver.trim()) errors.push('IRI memerlukan minimal 3 personel: pengemudi, operator dan pencatat.');
    if (value('targetSpeed') <= 0 || Math.abs(value('actualSpeed') - value('targetSpeed')) > value('targetSpeed') * .05 || !record.speedAndLaneCompliant) errors.push('IRI: kecepatan konstan dalam ±5% target dan jejak roda harus sesuai.');
    if (value('warmup') < (data.longWarmup === 'Ya' ? 15 : 5)) errors.push('Pemanasan IRI minimal 5 menit; kondisi IRI >8/dingin/basah minimal 15 menit.');
    if ((record.weather === 'Hujan' || !record.surfaceDry) && data.longWarmup !== 'Ya') errors.push('Kondisi basah memerlukan kategori pemanasan lebih lama.');
  }
  if (record.surveyType === 'PCI' && (value('pci') < 0 || value('pci') > 100)) errors.push('PCI harus 0–100.');
  if (record.surveyType === 'PCI' && data.pciMethod === 'AI' && (!record.surfaceDry || !record.glareFree)) errors.push('Citra PCI AI memerlukan kondisi permukaan/pencahayaan sesuai protokol kamera.');
  if (record.surveyType === 'Lendutan') {
    const spacing=(data.geophones ?? '').trim().split(/[,;\s]+/).map(Number);
    const count=data.method==='LWD'?3:Number(data.sensors);
    if (spacing.some(n=>!Number.isFinite(n)||n<0) || spacing[0]!==0 || spacing.some((n,i)=>i>0&&n<=spacing[i-1]) || (data.method==='LWD'?spacing.length<count:spacing.length!==count)) errors.push('Konfigurasi sensor: jarak berurutan mulai 0 mm, ≥3 sensor LWD atau sesuai 7/9 sensor FWD.');
    if (value('load') <= 0 || value('slope') < 0) errors.push('Beban harus positif dan kemiringan tidak negatif.');
    if (data.method === 'LWD') {
      if (value('drops') < 5 || !Number.isInteger(value('drops')) || value('slope') > 4) errors.push('LWD: ≥2 seating drop + ≥3 pengukuran, kemiringan ≤4%.');
      if (value('repeatDifferenceMicrons') < 0 || value('repeatDifferencePercent') < 0 || !(value('repeatDifferenceMicrons') < 20 || value('repeatDifferencePercent') < 10)) errors.push('LWD: selisih ulangan harus <20 µm atau <10%.');
    } else if (value('drops') < 2 || !Number.isInteger(value('drops')) || value('slope') > 10) errors.push('FWD: ≥2 drop dan lokasi tidak berkelandaian >10%; beban mengikuti tujuan/perkerasan, bukan selalu 40 kN.');
  }
  if (record.surveyType === 'Jembatan' && (value('condition') < 0 || value('condition') > 5 || !Number.isInteger(value('condition')))) errors.push('Nilai kondisi jembatan harus bilangan bulat 0–5.');
  if (record.surveyType === 'Lereng') {
    if(!record.slopeFailureType?.trim())errors.push('Jenis/potensi keruntuhan lereng wajib dicatat untuk memilih formulir risiko.');
    if (value('kmStart') < 0 || value('kmEnd') <= value('kmStart')) errors.push('Lereng: KM akhir harus lebih besar dari KM awal.');
    for (const key of ['middleCoordinate','endCoordinate']) {
      const parts=(data[key] ?? '').split(',').map(Number);
      if (parts.length !== 2 || parts[0] < 94 || parts[0] > 141 || parts[1] < -11 || parts[1] > 6 || parts.some(n=>!Number.isFinite(n))) errors.push('Koordinat tengah/akhir harus longitude,latitude WGS84 Indonesia.');
    }
    if (data.activity === 'Inventarisasi baru' && existing.some(r => r.surveyType === 'Lereng' && r.technicalData?.assetId === data.assetId)) errors.push('Nomor lereng sudah ada: gunakan inventarisasi ulang/inspeksi, bukan inventarisasi baru.');
  }
  if (record.surveyType === 'Lalu Lintas') {
    const planned=value('plannedMinutes'), available=record.trafficDurationMinutes, missing=planned-available;
    if (!Number.isFinite(available) || planned <= 0 || available <= 0 || available > planned || missing/planned > .15) errors.push('Lalu lintas: data tersedia harus positif, tidak melebihi rancangan, kehilangan ≤15%.');
    const limit=data.trafficMethod === 'Menerus' ? 4*24*60 : 120;
    if (value('maxGap') < 0 || value('maxGap') >= limit || value('maxGap') > missing+.01) errors.push(`Data hilang menerus harus <${limit} menit dan tidak melebihi total data hilang.`);
  }
  if (record.surveyType === 'RNI') {
    const km=(value('toSta')-value('fromSta'))/100;
    if (value('fromSta') < 0 || km <= 0 || Math.abs(km-record.lengthKm) > .00001) errors.push('RNI: panjang km harus sama dengan (to_sta − from_sta)/100 karena STA dalam decameter.');
    if (!/^[LR][1-3]$/.test(data.laneCode ?? '') || value('laneWidth') <= 0 || value('surfaceWidth') < value('laneWidth')) errors.push('RNI: kode lajur L1–L3/R1–R3 dan lebar permukaan ≥ lebar lajur >0.');
    if (!Number.isInteger(value('surfaceYear')) || value('surfaceYear') < 1900 || value('surfaceYear') > Number(record.date.slice(0,4))) errors.push('Tahun permukaan RNI tidak valid.');
  }
  return errors;
}
