/**
 * Adapter paket server → view model UI Dirah.
 *
 * UI Dirah (LocalPackagesPage) tidak diubah sama sekali; modul ini
 * memetakan response backend (`/paket`, `/balai`) ke bentuk
 * `OperationalWorkflowState` yang dibutuhkan kartu paket Dirah.
 *
 * Aturan mapping:
 *  - `project.id` = String(paket_id) agar navigasi membuka paket
 *    berdasarkan ID server yang benar (App.openPackage memvalidasi
 *    `/^[1-9]\d*$/` untuk sesi backend).
 *  - Field workflow yang belum disediakan `/paket` dibiarkan NETRAL
 *    (kosong), bukan diisi data demo. Label Tahap/Status/Peran berikutnya
 *    dihitung Dirah sendiri lewat derivePackageStage/packageStatus/
 *    packageWaitingFor dan disederhanakan menjadi nilai awal Tahap 0.
 *  - Tidak ada data demo (PAKET-DEMO-*) yang dipakai pada sesi backend.
 */
import type {
  OperationalWorkflowState,
  ProductionTest,
  WorkflowRole,
} from '../workflow/model';
import { SURVEY_TYPES } from '../workflow/model';
import type { ServerContract } from './serverPreparation';

export type ServerPackageRow = {
  paket_id: number;
  nama_paket: string;
  nomor_kontrak: string | null;
  tahun_anggaran: number | null;
  balai_id: number | null;
  status: string;
};

export type ServerBalaiRow = {
  balai_id: number;
  nama: string;
  kode: string;
};

export type ServerPackageListResponse = {
  data: ServerPackageRow[];
  page: number;
  page_size: number;
};

export type ServerListResponse<T> = { data: T[] };

/** Nama balai UI Dirah dipetakan dari endpoint /balai, bukan ID kosong abstrak. */
export function balaiLabel(
  balais: ServerBalaiRow[],
  id: number | null,
): string {
  if (id === null) return 'Balai belum ditetapkan';
  const match = balais.find(balai => balai.balai_id === id);
  return match?.nama || match?.kode || `Balai #${id}`;
}

/**
 * ID paket untuk navigasi UI Dirah. Bentuk ID numeric string dipertahankan
 * agar App.openPackage menerima ID server dan membuka workspace paket
 * berdasarkan ID yang benar.
 */
export function serverPackageId(paket_id: number): string {
  return String(paket_id);
}

/**
 * Struktur teknis netral untuk semua jenis survei. Semua nilai 0/false —
 * cukup agar komponen tambahan Dirah merender aman; BUKAN data demo atau
 * data hasil pemeriksaan.
 */
function zeroProductionTest(): ProductionTest {
  return {
    trialKm: 0,
    sections: 0,
    sectionLengthKm: 0,
    repeats: 0,
    speedTrials40: 0,
    speedTrials50: 0,
    speedTrialsAbove60: 0,
    coefficientA: 1,
    coefficientB: 1,
    rSquared: 0,
    coefficientVariation: 0,
    f1Before: 0,
    f1After: 0,
    meanAveragePrecision: 0,
    segmentsWithinFive: 0,
    segmentsAtLeastFifteen: 0,
    standardDeviation: 0,
    fwdLoad: 0,
    deflectionBowlOrdered: false,
    locations: 0,
    trafficHours: 0,
    bridgePersonnelPassed: false,
    ratersAgree: false,
    stationingConsistent: true,
  };
}

export function neutralProductionTests(): OperationalWorkflowState['productionTests'] {
  const map = {} as OperationalWorkflowState['productionTests'];
  for (const type of SURVEY_TYPES) map[type] = zeroProductionTest();
  return map;
}

export function neutralCalibrationChecklist(): OperationalWorkflowState['calibrationChecklist'] {
  const map = {} as OperationalWorkflowState['calibrationChecklist'];
  for (const type of SURVEY_TYPES) map[type] = false;
  return map;
}

/** Pemberitahuan untuk akses yang belum dijembatani ke backend. */
export const SERVER_STAGE_NOT_CONNECTED =
  'Belum terhubung: modul ini belum mempunyai tautan backend. Simpan dan setujui dinonaktifkan agar tidak muncul data semu.';

/** Stage stage jembatan yang belum ada penyimpanan server. */
export function neutralWorkflowState(
  role: WorkflowRole,
  project: OperationalWorkflowState['project'],
): OperationalWorkflowState {
  return {
    flowContractVersion: 3,
    simulationDate: '',
    role,
    productionApproval: 'Draft',
    productionApprovalBa: '',
    productionApprovalNote: '',
    bridgeInspectionPermit: false,
    project,
    calibrations: [],
    calibrationChecklist: neutralCalibrationChecklist(),
    productionTests: neutralProductionTests(),
    dailyRecords: [],
    cycle: {
      lastCompletedDate: '',
      selectedTypes: [],
      periodCompleted: false,
      heldRecordIds: [],
      checkedProtocols: {},
      iriCoefficientVariation: null,
      pciAiStandardDeviation: null,
      reRatingStatus: 'Belum Diperiksa',
      consistency: 'Belum Diperiksa',
      bridgeFieldValidation: false,
      finalPeriodValidation: false,
      certificateId: '',
    },
    submission: {
      routeChanged: false,
      routeLengthDeviation: 0,
      geometryFormat: '',
      topologyErrors: 0,
      stationingConsistent: true,
      rawSeparated: false,
      cleanedSeparated: false,
      rniValidatedDate: '',
      rawFileName: '',
      cleanedFileName: '',
      videoLink: '',
      requiredDocuments: {},
      internalAudit: {},
      internalAuditBa: '',
      targetSystems: [],
      validationStatus: 'Draft',
      validationMessage: '',
    },
    audits: [
      { level: 1, status: 'Belum Dimulai', sampleIds: [], decisionNote: '', baNumber: '', bridgeTrustScore: 0 },
      { level: 2, status: 'Belum Dimulai', sampleIds: [], decisionNote: '', baNumber: '', bridgeTrustScore: 0 },
      { level: 3, status: 'Belum Dimulai', sampleIds: [], decisionNote: '', baNumber: '', bridgeTrustScore: 0 },
    ],
    acceptance: {
      partialReceipts: [],
      terms: [],
      semesterTwoRevalidation: false,
      finalReport: false,
      finalAcceptance: false,
      acceptanceDecision: 'Belum Diperiksa',
      acceptanceRejectionReason: '',
    },
    corrections: [],
    backups: [],
    events: [],
  };
}

type DirahProjectInput = Omit<OperationalWorkflowState['project'], 'semester'>;

/**
 * Satu response `/paket` menjadi satu view model Dirah; field yang belum
 * dikirim backend dibiarkan kosong, bukan digantikan data demo.
 */
export function serverPackageToDirahState(
  paket: ServerPackageRow,
  balais: ServerBalaiRow[],
  role: WorkflowRole,
): OperationalWorkflowState {
  const id = serverPackageId(paket.paket_id);
  // `semester` pada UI Dirah dipakai sebagai slot label tampilan; pada data
  // server, tahun anggaran yang tersedia dan dipetakan ke slot tersebut.
  const semester: OperationalWorkflowState['project']['semester'] =
    paket.tahun_anggaran !== null
      ? (`TA ${paket.tahun_anggaran}` as OperationalWorkflowState['project']['semester'])
      : 'Tahun anggaran belum diisi' as OperationalWorkflowState['project']['semester'];

  const project: DirahProjectInput & { semester: OperationalWorkflowState['project']['semester'] } = {
    id,
    packageName: paket.nama_paket,
    // Kontrak boleh kosong; kartu Dirah memakai `contractNumber || id`.
    contractNumber: paket.nomor_kontrak ?? '',
    // Penyedia/PPK/ruas/jenis survei belum tersedia pada endpoint daftar.
    contractor: '',
    balai: balaiLabel(balais, paket.balai_id),
    satker: '',
    ppk: '',
    spmkDate: '',
    routes: [],
    surveyTypes: [],
    semester,
    preparation: {
      sourceReviews: {},
      fieldPlan: {},
      coordination: {},
      documents: {},
      // Status paket server belum dipetakan ke keputusan persiapan; netral.
      reportApproval: 'Draft',
      reviewerNote: '',
    },
  };

  return neutralWorkflowState(role, project);
}

/**
 * Mapping untuk halaman detail paket: memakai kontrak penuh dari
 * `GET /paket/:id` sehingga header Dirah menampilkan PPK/SPMK/terjadwal
 * dari server. Contract fields tambahan (nilai kontrak, batas laporan
 * pendahuluan, penyedia_id) belum mempunyai slot pada model Dirah.
 */
export function serverDetailToDirahState(
  contract: ServerContract,
  balais: ServerBalaiRow[],
  role: WorkflowRole,
): OperationalWorkflowState {
  const state = serverPackageToDirahState(
    {
      paket_id: contract.paket_id,
      nama_paket: contract.nama_paket,
      nomor_kontrak: contract.nomor_kontrak,
      tahun_anggaran: contract.tahun_anggaran,
      balai_id: contract.balai_id,
      status: contract.status,
    },
    balais,
    role,
  );
  return {
    ...state,
    project: {
      ...state.project,
      ppk: contract.nama_ppk ?? '',
      spmkDate: contract.tgl_spmk ?? '',
      // Hitungan jadwal paket pada UI Dirah memakai rentang tanggal
      // survei; tanggal kontrak server dipetakan ke slot yang sama.
      surveyStartDate: contract.tgl_spmk ?? state.project.surveyStartDate,
      surveyEndDate: contract.tgl_selesai ?? state.project.surveyEndDate,
    },
  };
}

export function mapServerPackagesToDirahPackages(
  packages: ServerPackageRow[],
  balais: ServerBalaiRow[],
  role: WorkflowRole,
): Record<string, OperationalWorkflowState> {
  const map: Record<string, OperationalWorkflowState> = {};
  for (const paket of packages) {
    const id = serverPackageId(paket.paket_id);
    if (map[id]) continue; // dedupe bila pemuatan halaman berikutnya dobel
    map[id] = serverPackageToDirahState(paket, balais, role);
  }
  return map;
}
