import { productionFields, PRODUCTION_REFERENCE_CHECKS } from './surveyStandards';

export const SURVEY_TYPES = [
  'IRI', 'PCI', 'Lendutan', 'Jembatan', 'Lereng', 'Drainase', 'Lalu Lintas', 'RNI',
] as const;

export type SurveyType = typeof SURVEY_TYPES[number];
export type WorkflowRole =
  | 'Penyedia Jasa / Ketua Tim'
  | 'PIC Balai / Pengguna Jasa'
  | 'Direktorat / Pusat'
  | 'Admin';
export type ApprovalState = 'Draft' | 'Diajukan' | 'Perlu Revisi' | 'Disetujui' | 'Ditolak';

export type PreparationState = {
  sourceReviews: Record<string, boolean>;
  fieldPlan: Record<string, boolean>;
  coordination: Record<string, boolean>;
  documents: Record<string, boolean>;
  reportApproval: ApprovalState;
  reviewerNote: string;
};

export type CalibrationRecord = {
  id: string;
  equipment: string;
  serialNumber: string;
  year: number;
  condition: string;
  calibrationKind: 'Referensi tahunan' | 'Relatif berkala';
  lastCalibrated: string;
  dueDate: string;
  personInCharge: string;
  qualificationValid: boolean;
  trainingVerified: boolean;
  standardReference?: string;
  certificateReference?: string;
  surveyType?: SurveyType;
};

export type ProductionTest = {
  trialKm: number;
  sections: number;
  sectionLengthKm: number;
  repeats: number;
  speedTrials40: number;
  speedTrials50: number;
  speedTrialsAbove60: number;
  coefficientA: number;
  coefficientB: number;
  rSquared: number;
  coefficientVariation: number;
  f1Before: number;
  f1After: number;
  meanAveragePrecision: number;
  segmentsWithinFive: number;
  segmentsAtLeastFifteen: number;
  standardDeviation: number;
  fwdLoad: number;
  deflectionBowlOrdered: boolean;
  locations: number;
  trafficHours: number;
  bridgePersonnelPassed: boolean;
  ratersAgree: boolean;
  stationingConsistent: boolean;

  pciManual?: boolean;
  pciBenchmarkBalanced?: boolean;
  bridgeTrialReportComplete?: boolean;

  referenceChecks?: Record<string, boolean>;

  productionDetails?: Record<
    string,
    string | number | boolean
  >;

  evidenceReference?: string;

  deflectionMethod?: 'FWD' | 'LWD';
  sensorCount?: number;
  lwdCorrelationPoints?: number;
  lwdRepeats?: number;
  lwdDifferenceMicrons?: number;
  lwdDifferencePercent?: number;

  sourceMode?:
    | 'Sinkronisasi sistem sumber'
    | 'Lampiran / bukti kegiatan'
    | 'Pencatatan manual'
    | 'Sinkronisasi source/SMD'
    | 'Import/evidence'
    | 'Input manual fallback';
};

export type DailySurveyRecord = {
  id: string;
  date: string;
  time: string;
  surveyType: SurveyType;
  road: string;
  lengthKm: number;
  trafficDurationMinutes: number;
  lane: string;

  direction:
    | 'Normal'
    | 'Opposite';

  weather:
    | 'Cerah'
    | 'Berawan'
    | 'Hujan';

  surfaceDry: boolean;
  glareFree: boolean;
  speedAndLaneCompliant: boolean;

  tool: string;
  operator: string;
  driver: string;

  poi: string;
  disturbances: string;
  eventNotes: string;

  dailyToolCheck:
    Record<string, boolean>;

  rawValue: string;
  cleanedValue: string;
  cleaningReason: string;

  state:
    | 'Tercatat'
    | 'Survei Ulang'
    | 'Ditahan';

  slopeFailureType?: string;

  technicalData?:
    Record<string, string>;
};

export type VervalCycle = {
  lastCompletedDate: string;
  selectedTypes: SurveyType[];
  periodCompleted: boolean;
  heldRecordIds: string[];
  checkedProtocols: Record<string, boolean>;
  iriCoefficientVariation: number | null;
  pciAiStandardDeviation: number | null;
  reRatingStatus: 'Belum Diperiksa' | 'Sesuai' | 'Tidak Sesuai';
  consistency: 'Belum Diperiksa' | 'Konsisten' | 'Tidak Konsisten';
  bridgeFieldValidation: boolean;
  finalPeriodValidation: boolean;
  certificateId: string;
  userReview?: 'Belum Diperiksa' | 'Sesuai' | 'Temuan';
  userReviewNote?: string;
  bridgeValidatedPercent?: number;
  bridgeValidationReport?: string;
  finalValidationLocation?: string;
  finalToolUnchanged?: boolean;
  affectedTool?: string;
};

export type SubmissionState = {
  routeChanged: boolean;
  routeLengthDeviation: number;
  geometryFormat: 'SHP' | 'GeoJSON' | '';
  topologyErrors: number;
  stationingConsistent: boolean;
  rawSeparated: boolean;
  cleanedSeparated: boolean;
  rniValidatedDate: string;
  rawFileName: string;
  cleanedFileName: string;
  videoLink: string;
  requiredDocuments: Record<string, boolean>;
  internalAudit: Record<string, boolean>;
  internalAuditBa: string;
  targetSystems: string[];
  validationStatus: 'Draft' | 'VALID' | 'Error';
  validationMessage: string;
  coordinatesBoundToLrs?: boolean;
  formatGlossaryCompliant?: boolean;
};

export type AuditLevel = {
  level: 1 | 2 | 3;
  status: 'Belum Dimulai' | 'Dalam Review' | 'Klarifikasi' | 'Lulus' | 'Ditolak';
  sampleIds: string[];
  decisionNote: string;
  baNumber: string;
  bridgeTrustScore: number;
  reviewChecks?: Record<string, boolean>;
  bridgeTrustReference?: string;
};

export type AcceptanceTerm = {
  id: 'T1' | 'T2' | 'T3' | 'T4';
  percentage: number;
  milestone: string;
  dueDate: string;
  complete: boolean;
  note: string;
  progress?: number;
};

export type CorrectionCase = {
  id: string;
  source: string;
  blockedStage: string;
  road: string;
  stationing: string;
  rejectionReason: string;
  severity: 'Kritis' | 'Mayor' | 'Minor';
  owner: string;
  dueDate: string;
  rootCause: 'Alat' | 'Personel' | 'Metode' | 'Kondisi lapangan' | 'Pemrosesan' | '';
  fieldDataValid: 'Ya' | 'Tidak' | 'Tidak Berlaku' | '';
  surveyType: SurveyType;
  actionType: string;
  evidence: string;
  originalValue: string;
  proposedValue: string;
  approval: ApprovalState;
  retest: 'Belum Diuji' | 'Lulus' | 'Gagal';
  status: 'Terbuka' | 'Menunggu Persetujuan' | 'Disetujui' | 'Dilaksanakan' | 'Verifikasi Ulang' | 'Ditutup';
  returnStage: string;
  linkedRecordId?: string;
  verification?: { surveyor: boolean; teamLeader: boolean; balai: boolean };
  reviewNote?: string;
  ruleScenario?: string;
  ruleChecks?: Record<string,boolean>;
  ruleNumbers?: Record<string,number>;
  provinceUpdateBa?: string;
};

export type SemesterTwoEvidence = {
  calibrationDate: string;
  calibrationReference: string;
  validationDate: string;
  validationReference: string;
  uploadDate: string;
  uploadValid: boolean;
  objectionsClosed: boolean;
  finalReportReference: string;
};
export const DEFAULT_SEMESTER_TWO: SemesterTwoEvidence = {
  calibrationDate:'', calibrationReference:'', validationDate:'', validationReference:'',
  uploadDate:'', uploadValid:false, objectionsClosed:false, finalReportReference:'',
};

export type BackupSnapshot = {
  id: string;
  createdAt: string;
  media: string[];
  includesRaw: boolean;
  includesProcessed: boolean;
  note: string;
};

export type WorkflowEvent = {
  id: string;
  date: string;
  actor: WorkflowRole;
  action: string;
  object: string;
  oldValue?: string;
  newValue?: string;
};

export type OperationalWorkflowState = {
  flowContractVersion?: number;
  simulationDate: string;
  role: WorkflowRole;
  productionApproval: ApprovalState;

productionSubmissionNote?: string;

productionApprovalBa: string;
productionApprovalNote: string;
  bridgeInspectionPermit: boolean;
  project: {
    id: string;
    packageName: string;
    spmkDate: string;
    surveyStartDate?: string;
    surveyEndDate?: string;
    contractNumber?: string;
    contractor: string;
    balai: string;
    satker: string;
    ppk: string;
    routes: string[];
    surveyTypes: SurveyType[];
    semester: 'Semester I' | 'Semester II';
    preparation: PreparationState;
  };
  calibrations: CalibrationRecord[];
  calibrationChecklist: Record<SurveyType, boolean>;
  productionTests: Record<SurveyType, ProductionTest>;
  productionTestDates?: Partial<Record<SurveyType,string>>;
  dailyRecords: DailySurveyRecord[];
  cycle: VervalCycle;
  cycleHistory?: Record<string, VervalCycle>;
  submission: SubmissionState;
  audits: [AuditLevel, AuditLevel, AuditLevel];
  acceptance: {
    partialReceipts: string[];
    terms: AcceptanceTerm[];
    semesterTwoRevalidation: boolean;
    finalReport: boolean;
    finalAcceptance: boolean;
    finalAcceptanceBa?: string;
    acceptanceCriteria?: Record<string, boolean>;
    acceptanceDecision?: 'Belum Diperiksa' | 'Diterima' | 'Ditolak';
    acceptanceRejectionReason?: string;
    semesterTwoEvidence?: SemesterTwoEvidence;
  };
  corrections: CorrectionCase[];
  backups: BackupSnapshot[];
  events: WorkflowEvent[];
  backupSchedule?: { enabled: boolean; intervalDays: number; nextDate: string; media: string[] };
};

export const PREPARATION_SOURCE_REVIEWS = [
  'Survei tahun sebelumnya',
  'BA verval jembatan 2024–2026',
  'PHO/FHO penanganan',
  'Peta dan dataset lereng',
];

export const PREPARATION_FIELD_PLAN = [
  'Kondisi konstruksi berjalan',
  'Perubahan geometri/trase',
  'Titik awal-akhir dan POI',
  'Kebutuhan survei detail dan lokasi PCI manual',
  'Rencana validasi per 200 km',
];

export const PREPARATION_COORDINATION = [
  'Satker P2JN',
  'Satker PJN',
  'Penilik Jalan',
  'BKJTK untuk jembatan khusus',
  'Uji coba aplikasi AI, GPS, dan penyimpanan',
];

export const PREPARATION_DOCUMENTS = [
  'Laporan Pendahuluan',
  'Daftar peralatan yang akan digunakan',
  'Sertifikat kalibrasi & metodologi validasi',
  'Laporan uji coba pemeriksaan jembatan (bila ada)',
  'Rencana validasi per 200 km',
  'Metodologi survei',
  'Sumber daya & jadwal kerja',
  'Format-format survei',
  'Program Mutu / Quality Management Plan',
  'RKK / SMKK',
  'RMLLP / pengaturan lalu lintas bila diperlukan',
];

export const CYCLE_PROTOCOLS: Record<SurveyType, string[]> = {
  IRI: ['Survei ulang minimal 10 km', '3 lintasan/pengulangan pada lokasi konsistensi', 'Hitung koefisien variasi (KV) IRI'],
  PCI: ['Survei/penilaian ulang minimal 5 km', '3 pengulangan/penilai sesuai metode', 'Bandingkan penilaian antar-rater atau keluaran software peratingan'],
  Lendutan: ['Minimal 1 lokasi per tim survei', 'Pengujian diulang 3 kali sesuai metode alat'],
  Jembatan: ['Minimal 1 jembatan per tim survei', 'Pemeriksaan/penilaian diulang 2 kali'],
  Lereng: ['Minimal 1 lokasi per tim survei', 'Penilaian diulang 2 kali'],
  Drainase: ['Minimal panjang 5 km', 'Penilaian/pengukuran diulang 3 kali'],
  'Lalu Lintas': ['Minimal 1 lokasi traffic counter', 'Pengamatan 1 × 24 jam dan diulang 2 kali'],
  RNI: ['Minimal panjang 5 km', 'Survei/pengukuran diulang 3 kali'],
};

export const CYCLE_SHARED_PROTOCOLS = [
  'Dokumentasi proses verifikasi & validasi periode tersedia',
  'Temuan/deviasi dan tindak lanjut tercatat',
  'Referensi hasil/BA verifikasi 2-mingguan tersedia',
];

export const SUBMISSION_DOCUMENTS = [
  'Dokumen kalibrasi & validasi',
  'Validasi produksi data / uji coba',
  'Verifikasi & validasi internal Penyedia Jasa',
  'Verifikasi & validasi 2-mingguan',
  'Verifikasi & validasi bertahap',
  'Tindakan perbaikan',
  'Log koreksi data',
  'Faktor pengganggu lapangan',
];

export const INTERNAL_AUDIT_CHECKS = [
  'Format, kelengkapan, ketelitian, dan kewajaran',
  'Tanggal-waktu, ruas, dan arah',
  'Cuaca, permukaan, alat, dan personel',
  'Gambar/video cerah, kering, lensa bersih, tanpa silau',
  'Foto defect PCI memenuhi spesifikasi dataset AI',
];

export const CORRECTION_ACTIONS = [
  'Survei ulang sebagian ruas',
  'Survei ulang seluruh ruas',
  'Penilaian ulang (re-rating)',
  'Ambil ulang foto/video',
  'Pelatihan ulang personel',
  'Kalibrasi ulang alat',
  'Penggantian komponen alat',
  'Penggantian personel',
  'Koreksi pemrosesan dengan bukti',
  'Investigasi keterlambatan dan rencana tindak lanjut',
];

export const CORRECTION_GUIDANCE: Record<SurveyType, string[]> = {
  IRI: [
    'Lajur melenceng: toleransi radius 20 m per 100 m bila kondisi jalan seragam dan data raw sesuai video.',
    'Kehilangan data valid >20 m dalam 100 m atau underspeed akibat macet/parkir: survei ulang saat lalu lintas normal.',
    'Segmen hilang setelah satu kali survei ulang: koreksi hanya dengan bukti verifikasi.',
    'Speedhump/oprit/jembatan: eliminasi subsegmen maks. 40 m per 100 m; jika data valid <60 m, tandai dan jangan dirata-ratakan; raw 10 m tetap utuh.',
    'Longsor/ruas terputus: raw IRI tidak diubah; tandai Rusak Berat (>12 m/km) dan ukur panjang longsor melalui GIS.',
  ],
  PCI: [
    'Hujan atau genangan: tidak boleh dikoreksi; tunggu permukaan kering.',
    'Alur dan amblas wajib diukur secara fisik (straight edge/laser), bukan dari foto atau perkiraan.',
    'Foto defect tidak sesuai spesifikasi: ambil ulang.',
    'Macet/kendaraan parkir: koreksi hanya atas persetujuan Pengguna Jasa; Penyedia Jasa merekam ulang di luar jam sibuk atau inspeksi visual manual. Perbandingan IRI hanya bukti pendukung, bukan pengganti; catat dasar dan keputusan PIC.',
  ],
  Lendutan: [
    'Gradien >10% atau geofon menggantung: pindah ke titik rata, sesuaikan STA, dan catat alasannya.',
    'Bukan deflection bowl: uji ulang serta periksa permukaan, geofon, dan sistem.',
    'Beban di luar 40 ±4 kN: uji ulang atau periksa alat.',
    'Nilai ekstrem: konfirmasi minimal 3 kali, simpan seluruh hasil dan foto; data temperatur tidak dimodifikasi.',
  ],
  Jembatan: [
    'Pemutakhiran setelah verval Direktorat (misalnya bencana/FHO) harus melalui BA Pemutakhiran Data Provinsi.',
  ],
  Lereng: ['Jika lokasi atau jenis keruntuhan tidak dapat dinilai, dokumentasikan kondisi dan lakukan penilaian ulang sesuai metode yang disetujui.'],
  Drainase: ['Jika kondisi lapangan mengganggu penilaian, dokumentasikan faktor pengganggu dan lakukan survei ulang pada kondisi yang dapat dinilai.'],
  'Lalu Lintas': ['Jika pencatatan 1 × 24 jam tidak representatif atau alat terganggu, ulangi pencatatan dan simpan catatan gangguannya.'],
  RNI: ['Perbaikan geometri harus lolos kembali seluruh gerbang LRS; pertahankan file raw secara terpisah dan catat alasan perubahan.'],
};

export const INITIAL_WORKFLOW: OperationalWorkflowState = {
  flowContractVersion: 3,
  simulationDate: '2027-06-10',
  role: 'Penyedia Jasa / Ketua Tim',
  productionApproval: 'Draft',
  productionApprovalBa: '',
  productionApprovalNote: 'Baseline alur simulasi; bukan persetujuan atau BA nyata.',
  bridgeInspectionPermit: false,
  project: {
    id: 'PAKET-SKJ-2027-01',
    packageName: 'Survei Kondisi Jalan TA 2027',
    spmkDate: '2027-01-01',
    contractor: 'Penyedia Jasa Demo',
    balai: 'Balai Sumatera Utara',
    satker: 'Satker P2JN Sumatera Utara',
    ppk: 'PPK 1.1',
    routes: ['Medan – Binjai', 'Pematang Siantar – Parapat'],
    surveyTypes: [...SURVEY_TYPES],
    semester: 'Semester I',
    preparation: {
      sourceReviews: Object.fromEntries(PREPARATION_SOURCE_REVIEWS.map(item=>[item,true])),
      fieldPlan: Object.fromEntries(PREPARATION_FIELD_PLAN.map(item=>[item,true])),
      coordination: Object.fromEntries(PREPARATION_COORDINATION.map(item=>[item,true])),
      documents: Object.fromEntries(PREPARATION_DOCUMENTS.map(item=>[item,true])),
      reportApproval: 'Disetujui',
      reviewerNote: 'Baseline alur simulasi; bukan persetujuan atau BA nyata.',
    },
  },
  calibrations: [
    {
      id: 'CAL-001',
      equipment: 'Profilometer Laser',
      surveyType: 'IRI',
      serialNumber: 'PL-2026-014',
      year: 2026,
      condition: 'Baik',
      calibrationKind: 'Referensi tahunan',
      lastCalibrated: '2026-12-14',
      dueDate: '2027-12-14',
      personInCharge: 'D. Prasetyo',
      qualificationValid: true,
      trainingVerified: true,
    },
    {
      id: 'CAL-002',
      equipment: 'FWD Dynatest',
      surveyType: 'Lendutan',
      serialNumber: 'FWD-8821',
      year: 2024,
      condition: 'Baik',
      calibrationKind: 'Relatif berkala',
      lastCalibrated: '2027-05-14',
      dueDate: '2027-06-14',
      personInCharge: 'B. Santoso',
      qualificationValid: true,
      trainingVerified: true,
      standardReference: 'AASHTO R32',
    },
  ],
  calibrationChecklist: {
    IRI: true, PCI: true, Lendutan: true, Jembatan: true,
    Lereng: true, Drainase: true, 'Lalu Lintas': true, RNI: true,
  },
  productionTests: {
    IRI: { trialKm: 10, sections: 5, sectionLengthKm: 0.5, repeats: 5, speedTrials40: 5, speedTrials50: 5, speedTrialsAbove60: 5, coefficientA: 1.02, coefficientB: 0.1, rSquared: 0.97, coefficientVariation: 4.3, f1Before: 0, f1After: 0, meanAveragePrecision: 0, segmentsWithinFive: 0, segmentsAtLeastFifteen: 0, standardDeviation: 0, fwdLoad: 40, deflectionBowlOrdered: true, locations: 1, trafficHours: 24, bridgePersonnelPassed: true, ratersAgree: true, stationingConsistent: true },
    PCI: { trialKm: 5, sections: 6, sectionLengthKm: 0, repeats: 5, speedTrials40: 0, speedTrials50: 0, speedTrialsAbove60: 0, coefficientA: 1, coefficientB: 0, rSquared: 0.96, coefficientVariation: 4, f1Before: 0.84, f1After: 0.92, meanAveragePrecision: 0.93, segmentsWithinFive: 56, segmentsAtLeastFifteen: 8, standardDeviation: 7.2, fwdLoad: 40, deflectionBowlOrdered: true, locations: 1, trafficHours: 24, bridgePersonnelPassed: true, ratersAgree: true, stationingConsistent: true, pciBenchmarkBalanced:true, pciManual:false },
    Lendutan: { trialKm: 0, sections: 0, sectionLengthKm: 0, repeats: 9, speedTrials40: 0, speedTrials50: 0, speedTrialsAbove60: 0, coefficientA: 1, coefficientB: 0, rSquared: 0.96, coefficientVariation: 4, f1Before: 0, f1After: 0, meanAveragePrecision: 0, segmentsWithinFive: 0, segmentsAtLeastFifteen: 0, standardDeviation: 0, fwdLoad: 40, deflectionBowlOrdered: true, locations: 1, trafficHours: 24, bridgePersonnelPassed: true, ratersAgree: true, stationingConsistent: true },
    Jembatan: { trialKm: 0, sections: 0, sectionLengthKm: 0, repeats: 2, speedTrials40: 0, speedTrials50: 0, speedTrialsAbove60: 0, coefficientA: 1, coefficientB: 0, rSquared: 0.96, coefficientVariation: 4, f1Before: 0, f1After: 0, meanAveragePrecision: 0, segmentsWithinFive: 0, segmentsAtLeastFifteen: 0, standardDeviation: 0, fwdLoad: 40, deflectionBowlOrdered: true, locations: 1, trafficHours: 24, bridgePersonnelPassed: true, ratersAgree: true, stationingConsistent: true, bridgeTrialReportComplete:true },
    Lereng: { trialKm: 0, sections: 0, sectionLengthKm: 0, repeats: 2, speedTrials40: 0, speedTrials50: 0, speedTrialsAbove60: 0, coefficientA: 1, coefficientB: 0, rSquared: 0.96, coefficientVariation: 4, f1Before: 0, f1After: 0, meanAveragePrecision: 0, segmentsWithinFive: 0, segmentsAtLeastFifteen: 0, standardDeviation: 0, fwdLoad: 40, deflectionBowlOrdered: true, locations: 1, trafficHours: 24, bridgePersonnelPassed: true, ratersAgree: true, stationingConsistent: true },
    Drainase: { trialKm: 5, sections: 0, sectionLengthKm: 0, repeats: 3, speedTrials40: 0, speedTrials50: 0, speedTrialsAbove60: 0, coefficientA: 1, coefficientB: 0, rSquared: 0.96, coefficientVariation: 4, f1Before: 0, f1After: 0, meanAveragePrecision: 0, segmentsWithinFive: 0, segmentsAtLeastFifteen: 0, standardDeviation: 0, fwdLoad: 40, deflectionBowlOrdered: true, locations: 1, trafficHours: 24, bridgePersonnelPassed: true, ratersAgree: true, stationingConsistent: true },
    'Lalu Lintas': { trialKm: 0, sections: 0, sectionLengthKm: 0, repeats: 2, speedTrials40: 0, speedTrials50: 0, speedTrialsAbove60: 0, coefficientA: 1, coefficientB: 0, rSquared: 0.96, coefficientVariation: 4, f1Before: 0, f1After: 0, meanAveragePrecision: 0, segmentsWithinFive: 0, segmentsAtLeastFifteen: 0, standardDeviation: 0, fwdLoad: 40, deflectionBowlOrdered: true, locations: 1, trafficHours: 24, bridgePersonnelPassed: true, ratersAgree: true, stationingConsistent: true },
    RNI: { trialKm: 5, sections: 0, sectionLengthKm: 0, repeats: 3, speedTrials40: 0, speedTrials50: 0, speedTrialsAbove60: 0, coefficientA: 1, coefficientB: 0, rSquared: 0.96, coefficientVariation: 4, f1Before: 0, f1After: 0, meanAveragePrecision: 0, segmentsWithinFive: 0, segmentsAtLeastFifteen: 0, standardDeviation: 0, fwdLoad: 40, deflectionBowlOrdered: true, locations: 1, trafficHours: 24, bridgePersonnelPassed: true, ratersAgree: true, stationingConsistent: true },
  },
  dailyRecords: [],
  cycle: {
    lastCompletedDate: '2027-05-28',
    selectedTypes: [...SURVEY_TYPES],
    periodCompleted: false,
    heldRecordIds: [],
    checkedProtocols: Object.fromEntries([
      ...SURVEY_TYPES.flatMap(type=>CYCLE_PROTOCOLS[type].map(protocol=>[`${type} · ${protocol}`,true])),
      ...CYCLE_SHARED_PROTOCOLS.map(protocol=>[protocol,true]),
    ]),
    iriCoefficientVariation: 4.3,
    pciAiStandardDeviation: 7.2,
    reRatingStatus: 'Sesuai',
    consistency: 'Konsisten',
    bridgeFieldValidation: true,
    finalPeriodValidation: false,
    certificateId: '',
  },
  submission: {
    routeChanged: false,
    routeLengthDeviation: 12,
    geometryFormat: 'GeoJSON',
    topologyErrors: 0,
    stationingConsistent: true,
    rawSeparated: true,
    cleanedSeparated: true,
    rniValidatedDate: '2027-05-20',
    rawFileName: '',
    cleanedFileName: '',
    videoLink: '',
    requiredDocuments: {},
    internalAudit: {},
    internalAuditBa: '',
    targetSystems: ['SMD Jalan'],
    validationStatus: 'Draft',
    validationMessage: '',
  },
  audits: [
    { level: 1, status: 'Belum Dimulai', sampleIds: [], decisionNote: '', baNumber: '', bridgeTrustScore: 0 },
    { level: 2, status: 'Belum Dimulai', sampleIds: [], decisionNote: '', baNumber: '', bridgeTrustScore: 0 },
    { level: 3, status: 'Belum Dimulai', sampleIds: [], decisionNote: '', baNumber: '', bridgeTrustScore: 0 },
  ],
  acceptance: {
    partialReceipts: ['BA penerimaan T1', 'BA penerimaan T2'],
    terms: [
      { id: 'T1', percentage: 30, milestone: 'Mobilisasi, kalibrasi/validasi, survei pendahuluan, laporan awal & SMKK', dueDate: '2027-02-28', complete: true, note: '' },
      { id: 'T2', percentage: 30, milestone: 'Pengumpulan & pengolahan Semester I; BA hasil validasi', dueDate: '2027-05-21', complete: true, note: '' },
      { id: 'T3', percentage: 20, milestone: 'Upload VALID, laporan hasil Semester I, BA verval', dueDate: '2027-06-14', complete: false, note: '' },
      { id: 'T4', percentage: 20, milestone: 'IRI Semester II, BA validasi Semester II, laporan akhir', dueDate: '2027-11-28', complete: false, note: '' },
    ],
    semesterTwoRevalidation: false,
    finalReport: false,
    finalAcceptance: false,
    acceptanceCriteria: {},
    acceptanceDecision: 'Belum Diperiksa',
    acceptanceRejectionReason: '',
  },
  corrections: [],
  backups: [],
  events: [],
};

export function loadOperationalWorkflowState(): OperationalWorkflowState {
  try {
    const saved = localStorage.getItem('road-qaqc-workflow-v1');
    if (!saved) return INITIAL_WORKFLOW;
    const parsed = JSON.parse(saved) as Partial<OperationalWorkflowState>;
    if(parsed.flowContractVersion!==3){
      parsed.productionApproval='Draft';parsed.productionApprovalBa='';parsed.bridgeInspectionPermit=false;
      if(parsed.productionTests){
        if(parsed.productionTests.PCI)parsed.productionTests.PCI={...parsed.productionTests.PCI,pciBenchmarkBalanced:false};
        if(parsed.productionTests.Jembatan)parsed.productionTests.Jembatan={...parsed.productionTests.Jembatan,bridgeTrialReportComplete:false};
      }
      parsed.submission={...INITIAL_WORKFLOW.submission,...parsed.submission,validationStatus:'Draft',validationMessage:'Acuan teknis per jenis survei diperbarui; bukti metode dan audit perlu diperiksa ulang. Rekaman sumber tetap tersimpan.'};
      parsed.audits=[{...INITIAL_WORKFLOW.audits[0],sampleIds:[]},{...INITIAL_WORKFLOW.audits[1],sampleIds:[]},{...INITIAL_WORKFLOW.audits[2],sampleIds:[]}];
      parsed.acceptance={...INITIAL_WORKFLOW.acceptance,...parsed.acceptance,finalReport:false,finalAcceptance:false,semesterTwoRevalidation:false,terms:(parsed.acceptance?.terms??INITIAL_WORKFLOW.acceptance.terms).map(t=>['T1','T3','T4'].includes(t.id)?{...t,complete:false,progress:0}:t)};
    }
    parsed.flowContractVersion=3;
    const acceptanceTerms=parsed.acceptance?.terms??INITIAL_WORKFLOW.acceptance.terms;
    const existingReceipts=parsed.acceptance?.partialReceipts??INITIAL_WORKFLOW.acceptance.partialReceipts;
    const partialReceipts=[...new Set(existingReceipts)];
    return {
      ...INITIAL_WORKFLOW,
      ...parsed,
      project: {
        ...INITIAL_WORKFLOW.project,
        ...parsed.project,
        preparation: { ...INITIAL_WORKFLOW.project.preparation, ...parsed.project?.preparation },
      },
      productionTests: Object.fromEntries(SURVEY_TYPES.map(type => [
        type,
        { ...INITIAL_WORKFLOW.productionTests[type], ...parsed.productionTests?.[type] },
      ])) as OperationalWorkflowState['productionTests'],
      cycle: { ...INITIAL_WORKFLOW.cycle, ...parsed.cycle },
      cycleHistory: parsed.cycleHistory ?? {},
      calibrationChecklist: Object.fromEntries(SURVEY_TYPES.map(type=>[type,parsed.calibrationChecklist?.[type]??false])) as Record<SurveyType,boolean>,
      submission: {
        ...INITIAL_WORKFLOW.submission,
        ...parsed.submission,
        requiredDocuments: { ...INITIAL_WORKFLOW.submission.requiredDocuments, ...parsed.submission?.requiredDocuments },
        internalAudit: { ...INITIAL_WORKFLOW.submission.internalAudit, ...parsed.submission?.internalAudit },
      },
      acceptance: { ...INITIAL_WORKFLOW.acceptance, ...parsed.acceptance, partialReceipts, terms: acceptanceTerms },
      calibrations: parsed.calibrations ?? INITIAL_WORKFLOW.calibrations,
      dailyRecords: (parsed.dailyRecords ?? []).map(record => ({ ...record, surveyType: record.surveyType || 'IRI', lengthKm: record.lengthKm ?? 0, trafficDurationMinutes: record.trafficDurationMinutes ?? 0 })),
      audits: parsed.audits ?? INITIAL_WORKFLOW.audits,
      corrections: parsed.corrections ?? [],
      backups: parsed.backups ?? [],
      events: parsed.events ?? [],
    };
  } catch {
    return INITIAL_WORKFLOW;
  }
}

export function evaluateProductionTest(type: SurveyType, test: ProductionTest) {
  const checks: { label: string; actual: string; pass: boolean }[] = [];
  const add = (label: string, actual: string, pass: boolean) => checks.push({ label, actual, pass });
  const relevant=productionFields(type,test);
  const numbers=relevant.map(key=>[key,test[key] as number] as const);
  const bounded=relevant.filter(key=>['f1Before','f1After','meanAveragePrecision','rSquared'].includes(key)).every(key=>(test[key] as number)>=0&&(test[key] as number)<=1)
    &&relevant.filter(key=>['segmentsWithinFive','segmentsAtLeastFifteen'].includes(key)).every(key=>(test[key] as number)>=0&&(test[key] as number)<=100);
  const numericValid=bounded&&numbers.every(([key,value])=>Number.isFinite(value)&&(key==='coefficientB'||value>=0)&&(!['sections','repeats','speedTrials40','speedTrials50','speedTrialsAbove60','locations','lwdCorrelationPoints','lwdRepeats'].includes(key)||Number.isInteger(value)));
  add('Isian angka valid dan dalam rentang',numericValid?'Rentang diperiksa':'Ada angka kosong/di luar rentang atau jumlah bukan bilangan bulat',numericValid);
  if(PRODUCTION_REFERENCE_CHECKS[type].length){
    add('Referensi bukti uji/metode tercatat',test.evidenceReference?.trim()||'Belum dicatat',!!test.evidenceReference?.trim());
    PRODUCTION_REFERENCE_CHECKS[type].forEach(label=>add(label,test.referenceChecks?.[label]?'Dikonfirmasi pada bukti sumber':'Belum diperiksa',test.referenceChecks?.[label]===true));
  }
  if(!numericValid)return {checks,passed:false};

  if (type === 'IRI') {
    add('Uji coba ≥10 km', `${test.trialKm} km`, test.trialKm >= 10);
    add('5 seksi × 0,5 km dan 5 pengulangan', `${test.sections} seksi × ${test.sectionLengthKm} km · ${test.repeats} ulangan`, test.sections >= 5 && test.sectionLengthKm === 0.5 && test.repeats >= 5);
    add('5 ulangan pada 40 / 50 / >60 km/jam', `${test.speedTrials40} / ${test.speedTrials50} / ${test.speedTrialsAbove60}`, test.speedTrials40 >= 5 && test.speedTrials50 >= 5 && test.speedTrialsAbove60 >= 5);
    add('0,95 ≤ A ≤ 1,05', test.coefficientA.toFixed(3), test.coefficientA >= 0.95 && test.coefficientA <= 1.05);
    add('−0,25 ≤ B ≤ 0,25 m/km', test.coefficientB.toFixed(3), test.coefficientB >= -0.25 && test.coefficientB <= 0.25);
    add('R² ≥0,95', test.rSquared.toFixed(2), test.rSquared >= 0.95);
    add('CV ≤5%', `${test.coefficientVariation.toFixed(1)}%`, test.coefficientVariation <= 5);
 } else if (type === 'PCI') {
  const detail =
    test.productionDetails ?? {};

  const text = (
    key: string,
  ) =>
    String(
      detail[key] ?? '',
    ).trim();

  add(
    'Uji coba PCI minimal 5 km',
    `${test.trialKm} km`,
    test.trialKm >= 5,
  );

  add(
    'Ruas/segmen uji tercatat',
    text(
      'pciSegmentReference',
    ) ||
      'Belum tercatat',
    !!text(
      'pciSegmentReference',
    ),
  );

  if (
    test.pciManual !== false
  ) {
    add(
      'Data kerusakan/rating tersedia',
      text(
        'pciDistressReference',
      ) ||
        'Belum tersedia',
      !!text(
        'pciDistressReference',
      ),
    );

    add(
      'Data pembanding / objek standar tersedia',
      text(
        'pciComparisonReference',
      ) ||
        'Belum tersedia',
      !!text(
        'pciComparisonReference',
      ),
    );

    add(
      'Penilaian visual telah diperiksa penilai lain',
      test.ratersAgree
        ? 'Sudah diperiksa'
        : 'Belum diperiksa',
      test.ratersAgree === true,
    );
  } else {
    add(
      'Versi model AI tercatat',
      text(
        'pciModelVersion',
      ) ||
        'Belum tercatat',
      !!text(
        'pciModelVersion',
      ),
    );

    add(
      'Benchmark / kondisi aktual tersedia',
      text(
        'pciBenchmarkReference',
      ) ||
        'Belum tersedia',
      !!text(
        'pciBenchmarkReference',
      ),
    );

    add(
      'Hasil evaluasi kinerja AI tersedia',
      text(
        'pciPerformanceReport',
      ) ||
        'Belum tersedia',
      !!text(
        'pciPerformanceReport',
      ),
    );
  }

  add(
    'Metode dan peralatan memenuhi persyaratan',
    detail
      .methodEquipmentCompliant ===
      true
      ? 'Dikonfirmasi'
      : 'Belum dikonfirmasi',
    detail
      .methodEquipmentCompliant ===
      true,
  );

  add(
    'Data hasil uji telah diproses',
    detail.dataProcessed === true
      ? 'Sudah diproses'
      : 'Belum diproses',
    detail.dataProcessed === true,
  );

  add(
    'Hasil PCI konsisten dengan LRS',
    test.stationingConsistent
      ? 'Konsisten'
      : 'Belum konsisten',
    test.stationingConsistent ===
      true,
  );

    } else if (type === 'Lendutan') {
    const detail =
      test.productionDetails ?? {};

    const text = (key: string) =>
      String(detail[key] ?? '').trim();

    const yes = (key: string) =>
      detail[key] === true;

    add(
      'Minimal 1 lokasi uji per tim',
      `${test.locations} lokasi`,
      test.locations >= 1,
    );

    add(
      'Lokasi / STA pengukuran tercatat',
      text('deflectionLocation') ||
        'Belum tercatat',
      !!text('deflectionLocation'),
    );

    add(
      'Koordinat / referensi LRS tercatat',
      text('deflectionCoordinates') ||
        'Belum tercatat',
      !!text('deflectionCoordinates'),
    );

    add(
      'Referensi hasil pengukuran tersedia',
      text('deflectionResultReference') ||
        'Belum tersedia',
      !!text('deflectionResultReference'),
    );

    if (test.deflectionMethod === 'LWD') {
      add(
        'Korelasi LWD terhadap FWD pada minimal 3 titik',
        `${test.lwdCorrelationPoints ?? 0} titik`,
        (test.lwdCorrelationPoints ?? 0) >= 3,
      );

      add(
        'Pengukuran LWD minimal 3 kali',
        `${test.lwdRepeats ?? 0} pengukuran`,
        (test.lwdRepeats ?? 0) >= 3,
      );

      add(
        'Selisih pengukuran LWD memenuhi ketentuan',
        `${test.lwdDifferenceMicrons ?? '—'} µm / ${
          test.lwdDifferencePercent ?? '—'
        }%`,
        (test.lwdDifferenceMicrons ?? Infinity) < 20 ||
          (test.lwdDifferencePercent ?? Infinity) < 10,
      );
    } else {
      add(
        'Beban FWD berada pada 40 ±4 kN',
        `${test.fwdLoad} kN`,
        test.fwdLoad >= 36 &&
          test.fwdLoad <= 44,
      );

      add(
        'Konfigurasi sensor FWD sesuai',
        `${test.sensorCount ?? '—'} sensor`,
        [7, 9].includes(
          test.sensorCount ?? 0,
        ),
      );

      add(
        'Urutan deflection bowl valid',
        test.deflectionBowlOrdered
          ? 'Terpenuhi'
          : 'Belum terpenuhi',
        test.deflectionBowlOrdered === true,
      );
    }

    add(
      'Metode dan peralatan memenuhi persyaratan',
      yes('methodEquipmentCompliant')
        ? 'Dikonfirmasi'
        : 'Belum dikonfirmasi',
      yes('methodEquipmentCompliant'),
    );

    add(
      'Data hasil uji telah diproses',
      yes('dataProcessed')
        ? 'Sudah diproses'
        : 'Belum diproses',
      yes('dataProcessed'),
    );

    add(
      'Lokasi pengukuran konsisten dengan LRS',
      test.stationingConsistent
        ? 'Konsisten'
        : 'Belum konsisten',
      test.stationingConsistent === true,
    );

  } else if (type === 'Jembatan') {
    const detail =
      test.productionDetails ?? {};

    const text = (key: string) =>
      String(detail[key] ?? '').trim();

    const numberValue = (key: string) =>
      Number(detail[key]);

    const sample1Ready =
      !!text('bridgeSample1Id') &&
      numberValue('bridgeSample1Spans') >= 2 &&
      numberValue('bridgeSample1SpanLength') > 6 &&
      !!text('bridgeSample1Reference');

    const sample2Ready =
      !!text('bridgeSample2Id') &&
      numberValue('bridgeSample2SpanLength') > 40 &&
      !!text('bridgeSample2Reference');

    const sample3Ready =
      !!text('bridgeSample3Id') &&
      numberValue('bridgeSample3SpanLength') > 15 &&
      !!text('bridgeSample3Reference');

    add(
      'Sampel 1 inventarisasi memenuhi karakteristik KAK',
      sample1Ready
        ? 'Lengkap'
        : 'Belum lengkap',
      sample1Ready,
    );

    add(
      'Sampel 2 rangka baja >40 m tersedia',
      sample2Ready
        ? 'Lengkap'
        : 'Belum lengkap',
      sample2Ready,
    );

    add(
      'Sampel 3 beton bertulang >15 m tersedia',
      sample3Ready
        ? 'Lengkap'
        : 'Belum lengkap',
      sample3Ready,
    );

    const reportReady =
      !!text('bridgeReportIntro') &&
      !!text('bridgeReportResult') &&
      !!text('bridgeReportEvaluation') &&
      !!text('bridgeReportConclusion');

    add(
      'Laporan uji coba BAB I–IV lengkap',
      reportReady
        ? 'Lengkap'
        : 'Belum lengkap',
      reportReady,
    );

    add(
      'Lampiran formulir, foto dan sketsa tersedia',
      text('bridgeReportAttachment') ||
        'Belum tersedia',
      !!text('bridgeReportAttachment'),
    );

    add(
      'Personel pemeriksa memenuhi hasil uji coba',
      test.bridgePersonnelPassed
        ? 'Memenuhi'
        : 'Belum memenuhi',
      test.bridgePersonnelPassed === true,
    );

    add(
      'Data hasil uji telah diproses',
      detail.dataProcessed === true
        ? 'Sudah diproses'
        : 'Belum diproses',
      detail.dataProcessed === true,
    );

    add(
      'Data/lokasi konsisten dengan LRS',
      test.stationingConsistent
        ? 'Konsisten'
        : 'Belum konsisten',
      test.stationingConsistent === true,
    );

  } else if (type === 'Lereng') {
    const detail =
      test.productionDetails ?? {};

    const text = (key: string) =>
      String(detail[key] ?? '').trim();

    const yes = (key: string) =>
      detail[key] === true;

    add(
      'Minimal 1 lokasi uji per tim',
      `${test.locations} lokasi`,
      test.locations >= 1,
    );

    add(
      'Lokasi / STA dan koordinat tercatat',
      text('road') &&
      text('locationReference') &&
      text('coordinates')
        ? 'Lengkap'
        : 'Belum lengkap',
      !!text('road') &&
      !!text('locationReference') &&
      !!text('coordinates'),
    );

    add(
      'Geometri dan material/kondisi lereng tercatat',
      text('slopeGeometry') &&
      text('slopeMaterial')
        ? 'Lengkap'
        : 'Belum lengkap',
      !!text('slopeGeometry') &&
      !!text('slopeMaterial'),
    );

    add(
      'Jenis/kondisi keruntuhan dan drainase tercatat',
      text('failureCondition') &&
      text('drainageCondition')
        ? 'Lengkap'
        : 'Belum lengkap',
      !!text('failureCondition') &&
      !!text('drainageCondition'),
    );

    add(
      'Bangunan pengaman dan instrumentasi tercatat',
      text('protectionStructure') &&
      text('instrumentation')
        ? 'Lengkap'
        : 'Belum lengkap',
      !!text('protectionStructure') &&
      !!text('instrumentation'),
    );

    add(
      'Foto dan sketsa tersedia',
      text('photoReference') &&
      text('sketchReference')
        ? 'Tersedia'
        : 'Belum lengkap',
      !!text('photoReference') &&
      !!text('sketchReference'),
    );

    add(
      'Referensi InSlope tersedia',
      text('inSlopeReference') ||
        'Belum tersedia',
      !!text('inSlopeReference'),
    );

    add(
      'Metode dan peralatan memenuhi persyaratan',
      yes('methodEquipmentCompliant')
        ? 'Dikonfirmasi'
        : 'Belum dikonfirmasi',
      yes('methodEquipmentCompliant'),
    );

    add(
      'Data hasil uji telah diproses',
      yes('dataProcessed')
        ? 'Sudah diproses'
        : 'Belum diproses',
      yes('dataProcessed'),
    );

    add(
      'Penilaian visual diperiksa personel lain',
      yes('secondRaterChecked')
        ? 'Sudah diperiksa'
        : 'Belum diperiksa',
      yes('secondRaterChecked'),
    );

    add(
      'Referensi lokasi konsisten dengan LRS',
      test.stationingConsistent
        ? 'Konsisten'
        : 'Belum konsisten',
      test.stationingConsistent === true,
    );

  } else if (
    type === 'Drainase'
  ) {
    const detail =
      test.productionDetails ?? {};

    const text = (
      key: string,
    ) =>
      String(
        detail[key] ?? '',
      ).trim();

    const yes = (
      key: string,
    ) =>
      detail[key] === true;

    add(
      'Uji coba Drainase minimal 5 km',
      `${test.trialKm} km`,
      test.trialKm >= 5,
    );

    add(
      'Segmen, ruas, STA, dan koordinat tercatat',
      text('segmentId') &&
        text('road') &&
        text('staStart') &&
        text('staEnd') &&
        text('coordinates')
        ? 'Lengkap'
        : 'Belum lengkap',
      !!text('segmentId') &&
        !!text('road') &&
        !!text('staStart') &&
        !!text('staEnd') &&
        !!text(
          'coordinates',
        ),
    );

    add(
      'Jenis, material, dan dimensi saluran tercatat',
      text(
        'channelType',
      ) &&
        text('material') &&
        text('widthM') &&
        text('depthM')
        ? 'Lengkap'
        : 'Belum lengkap',
      !!text(
        'channelType',
      ) &&
        !!text('material') &&
        !!text('widthM') &&
        !!text('depthM'),
    );

    add(
      'Kondisi, hambatan/sedimen, aliran, dan outlet tercatat',
      text(
        'conditionClass',
      ) &&
        text(
          'obstructionSediment',
        ) &&
        text(
          'flowCondition',
        ) &&
        text(
          'outletCondition',
        )
        ? 'Lengkap'
        : 'Belum lengkap',
      !!text(
        'conditionClass',
      ) &&
        !!text(
          'obstructionSediment',
        ) &&
        !!text(
          'flowCondition',
        ) &&
        !!text(
          'outletCondition',
        ),
    );

    add(
      'Referensi InDrain dan data inspeksi tersedia',
      text(
        'inDrainReference',
      ) &&
        text(
          'inspectionReference',
        )
        ? 'Tersedia'
        : 'Belum lengkap',
      !!text(
        'inDrainReference',
      ) &&
        !!text(
          'inspectionReference',
        ),
    );

    add(
      'Metode dan peralatan memenuhi persyaratan',
      yes(
        'methodEquipmentCompliant',
      )
        ? 'Dikonfirmasi'
        : 'Belum dikonfirmasi',
      yes(
        'methodEquipmentCompliant',
      ),
    );

    add(
      'Data hasil uji telah diproses',
      yes('dataProcessed')
        ? 'Sudah diproses'
        : 'Belum diproses',
      yes('dataProcessed'),
    );

    add(
      'Penilaian visual diperiksa personel lain',
      yes(
        'secondRaterChecked',
      )
        ? 'Sudah diperiksa'
        : 'Belum diperiksa',
      yes(
        'secondRaterChecked',
      ),
    );

    add(
      'Referensi lokasi konsisten dengan LRS',
      test
        .stationingConsistent
        ? 'Konsisten'
        : 'Belum konsisten',
      test
        .stationingConsistent ===
        true,
    );

  } else if (
    type === 'Lalu Lintas'
  ) {
    const detail =
      test.productionDetails ?? {};

    const text = (
      key: string,
    ) =>
      String(
        detail[key] ?? '',
      ).trim();

    const yes = (
      key: string,
    ) =>
      detail[key] === true;

    const counts = [
      'motorcycleCount',
      'lightVehicleCount',
      'busCount',
      'truckCount',
      'otherVehicleCount',
    ];

    const countsValid =
      counts.every(key => {
        const value =
          Number(
            detail[key],
          );

        return (
          Number.isFinite(value) &&
          value >= 0
        );
      });

    add(
      'Minimal 1 lokasi traffic counter',
      `${test.locations} lokasi`,
      test.locations >= 1,
    );

    add(
      'Pengamatan uji minimal 1 × 24 jam',
      `${test.trafficHours} jam`,
      test.trafficHours >= 24,
    );

    add(
      'Lokasi TC, ruas, arah, dan lajur tercatat',
      text('tcId') &&
        text('road') &&
        text('direction') &&
        text('lane')
        ? 'Lengkap'
        : 'Belum lengkap',
      !!text('tcId') &&
        !!text('road') &&
        !!text('direction') &&
        !!text('lane'),
    );

    add(
      'Metode pencacahan tercatat',
      text('method') ||
        'Belum dipilih',
      [
        'Manual',
        'Rekaman video / off-site',
      ].includes(
        text('method'),
      ),
    );

    add(
      'Data pencacahan kendaraan valid',
      countsValid
        ? 'Tercatat'
        : 'Belum valid',
      countsValid,
    );

    add(
      'Rekap hasil pencacahan tersedia',
      text(
        'recapReference',
      ) ||
        'Belum tersedia',
      !!text(
        'recapReference',
      ),
    );

    if (
      text('method') ===
      'Rekaman video / off-site'
    ) {
      add(
        'Bukti video tersedia',
        text(
          'videoReference',
        ) ||
          'Belum tersedia',
        !!text(
          'videoReference',
        ),
      );
    }

    add(
      'Metode dan peralatan memenuhi persyaratan',
      yes(
        'methodEquipmentCompliant',
      )
        ? 'Dikonfirmasi'
        : 'Belum dikonfirmasi',
      yes(
        'methodEquipmentCompliant',
      ),
    );

    add(
      'Data hasil uji telah diproses',
      yes('dataProcessed')
        ? 'Sudah diproses'
        : 'Belum diproses',
      yes('dataProcessed'),
    );

  } else {
    /*
     * RNI
     */
    const detail =
      test.productionDetails ?? {};

    const text = (
      key: string,
    ) =>
      String(
        detail[key] ?? '',
      ).trim();

    const yes = (
      key: string,
    ) =>
      detail[key] === true;

    add(
      'Uji coba RNI minimal 5 km',
      `${test.trialKm} km`,
      test.trialKm >= 5,
    );

    add(
      'Ruas dan rentang STA uji tercatat',
      text('road') &&
        text('staStart') &&
        text('staEnd')
        ? `${text(
            'road',
          )} · ${text(
            'staStart',
          )}–${text(
            'staEnd',
          )}`
        : 'Belum lengkap',
      !!text('road') &&
        !!text('staStart') &&
        !!text('staEnd'),
    );

    add(
      'Link description dan LRP tercatat',
      text(
        'linkDescription',
      ) &&
        text(
          'lrpReference',
        )
        ? 'Lengkap'
        : 'Belum lengkap',
      !!text(
        'linkDescription',
      ) &&
        !!text(
          'lrpReference',
        ),
    );

    add(
      'Penampang melintang dan atribut inventori tercatat',
      text(
        'crossSectionInventory',
      ) &&
        text(
          'inventoryAttributes',
        )
        ? 'Lengkap'
        : 'Belum lengkap',
      !!text(
        'crossSectionInventory',
      ) &&
        !!text(
          'inventoryAttributes',
        ),
    );

    add(
      'Referensi GPS/GNSS dan RAW data tersedia',
      text(
        'gpsReference',
      ) &&
        text(
          'rawDataReference',
        )
        ? 'Tersedia'
        : 'Belum lengkap',
      !!text(
        'gpsReference',
      ) &&
        !!text(
          'rawDataReference',
        ),
    );

    add(
      'Metode dan peralatan memenuhi persyaratan',
      yes(
        'methodEquipmentCompliant',
      )
        ? 'Dikonfirmasi'
        : 'Belum dikonfirmasi',
      yes(
        'methodEquipmentCompliant',
      ),
    );

    add(
      'Data hasil uji telah diproses',
      yes('dataProcessed')
        ? 'Sudah diproses'
        : 'Belum diproses',
      yes('dataProcessed'),
    );

    add(
      'STA / referensi lokasi konsisten dengan LRS',
      test
        .stationingConsistent
        ? 'Konsisten'
        : 'Belum konsisten',
      test
        .stationingConsistent ===
        true,
    );
  }
  return { checks, passed: checks.every(check => check.pass) };
}

export function samplingRule(type: SurveyType, level: 1 | 2 | 3) {
  if (level === 1) return { label: 'Audit Penyedia Jasa', rate: 100, unit: 'seluruh data' };
  if (level === 3) return { label: 'Audit Direktorat', rate: 1, unit: 'minimum 1% data' };
  if (type === 'Jembatan' || type === 'Lereng' || type === 'Lendutan') {
    return { label: 'Sampling Pengguna Jasa', rate: 10, unit: type === 'Lendutan' ? 'titik lendutan' : 'data/lokasi' };
  }
  if (type === 'Lalu Lintas') return { label: 'Sampling Pengguna Jasa', rate: 100, unit: '10 menit per hari' };
  return { label: 'Sampling Pengguna Jasa', rate: 5, unit: 'maksimal 5% panjang jalan' };
}

function dayNumber(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return Date.UTC(year, month - 1, day) / 86400000;
}

export function daysBetween(from: string, to: string) {
  if (!from || !to) return Number.NaN;
  return Math.round(dayNumber(to) - dayNumber(from));
}

export function cycleDueDate(lastDate: string) {
  if (!lastDate) return '';
  const next = new Date(`${lastDate}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 14);
  return next.toISOString().slice(0, 10);
}

function dateOffset(date: string, days: number) {
  if (!date) return '';
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function evaluateLrsGate(state: SubmissionState, date: string) {
  const daysSinceRni = daysBetween(state.rniValidatedDate, date);
  const checks = [
    { label: 'Seluruh data berkoordinat dan terikat LRS', actual: state.coordinatesBoundToLrs ? 'Dikonfirmasi' : 'Belum dikonfirmasi', pass: state.coordinatesBoundToLrs === true },
    { label: 'Format Kode & Glossary DJBM dipenuhi', actual: state.formatGlossaryCompliant ? 'Dikonfirmasi' : 'Belum dikonfirmasi', pass: state.formatGlossaryCompliant === true },
    { label: 'Deviasi panjang ≤30 m per ruas', actual: `${Math.abs(state.routeLengthDeviation)} m`, pass: Number.isFinite(state.routeLengthDeviation) && Math.abs(state.routeLengthDeviation) <= 30 },
    { label: 'Format SHP/GeoJSON', actual: state.geometryFormat || 'Belum dipilih', pass: state.geometryFormat === 'SHP' || state.geometryFormat === 'GeoJSON' },
    { label: 'Tidak ada kesalahan topologi', actual: `${state.topologyErrors} kesalahan`, pass: Number.isInteger(state.topologyErrors) && state.topologyErrors === 0 },
    { label: 'STA konsisten pada semua survei', actual: state.stationingConsistent ? 'Konsisten' : 'Tidak konsisten', pass: state.stationingConsistent },
    { label: 'RNI valid ≥7 hari sebelum upload', actual: Number.isFinite(daysSinceRni) ? `${daysSinceRni} hari` : 'Belum divalidasi', pass: Number.isFinite(daysSinceRni) && daysSinceRni >= 7 },
    { label: 'Raw dan cleaned disimpan terpisah', actual: state.rawSeparated && state.cleanedSeparated ? 'Terpisah' : 'Belum lengkap', pass: state.rawSeparated && state.cleanedSeparated },
  ];
  return { checks, passed: checks.every(check => check.pass) };
}

export function notificationsFor(state: OperationalWorkflowState) {
  const deadlines = [
    { id: 'cycle-14d', title: 'Verval mandiri 14 hari', due: cycleDueDate(state.cycle.lastCompletedDate), object: state.project.packageName },
    ...state.calibrations.map(record => ({
      id: `calibration-${record.id}`,
      title: `Kalibrasi ${record.equipment}`,
      due: record.dueDate,
      object: record.serialNumber,
    })),
    ...(state.project.preparation.reportApproval === 'Disetujui' ? [] : [{
      id: 'preliminary-report-30d',
      title: 'Persetujuan Laporan Pendahuluan (maks. 30 hari sejak SPMK)',
      due: dateOffset(state.project.spmkDate, 30),
      object: state.project.packageName,
    }]),
    ...state.acceptance.terms.filter(term => !term.complete).map(term => ({ id: `term-${term.id}`, title: `Termin ${term.id} (${term.percentage}%)`, due: term.dueDate, object: term.milestone })),
    ...state.corrections.filter(item=>item.status!=='Ditutup'&&!item.source.startsWith('Notifikasi H+0')).map(item=>({id:`correction-${item.id}`,title:'Tindak lanjut kasus koreksi',due:item.dueDate,object:`${item.id} · ${item.owner}`})),
    ...(!state.acceptance.terms.find(term=>term.id==='T3')?.complete ? [
      ...(!state.submission||state.submission.validationStatus!=='VALID'?[{id:'semester-one-upload',title:'Upload Semester I (minggu ke-1 Juni)',due:'2027-06-07',object:state.project.packageName}]:[]),
      ...(!state.audits.every(a=>a.status==='Lulus')?[{id:'semester-one-objections',title:'Sanggah Semester I (minggu ke-2 Juni)',due:'2027-06-14',object:state.project.packageName}]:[]),
    ] : []),
    ...(!state.acceptance.terms.find(term=>term.id==='T4')?.complete ? [
      ...(!state.acceptance.semesterTwoEvidence?.uploadValid?[{id:'semester-two-upload',title:'Upload IRI Semester II (minggu ke-3 November)',due:'2027-11-21',object:state.project.packageName}]:[]),
      ...(!state.acceptance.semesterTwoEvidence?.objectionsClosed?[{id:'semester-two-objections',title:'Sanggah Semester II (minggu ke-4 November)',due:'2027-11-28',object:state.project.packageName}]:[]),
    ] : []),
    ...(state.backupSchedule?.enabled?[{id:'scheduled-backup',title:'Snapshot backup terjadwal (simulasi)',due:state.backupSchedule.nextDate,object:state.project.packageName}]:[]),
    ...(!state.project.preparation.documents['RMLLP (minimal 1 minggu sebelum kegiatan)'] && state.dailyRecords.length > 0
      ? [{
          id: 'rmllp-before-survey',
          title: 'RMLLP minimal 1 minggu sebelum kegiatan',
          due: dateOffset([...state.dailyRecords].map(record => record.date).sort()[0], -7),
          object: state.project.packageName,
        }]
      : []),
  ];
  return deadlines.filter(item => item.due).map(item => {
    const remaining = daysBetween(state.simulationDate, item.due);
    const stage = remaining <= 0 ? 'H+0' : remaining <= 7 ? 'H-7' : remaining <= 30 ? 'H-30' : '';
    return { ...item, remaining, stage };
  }).filter(item => item.stage);
}
