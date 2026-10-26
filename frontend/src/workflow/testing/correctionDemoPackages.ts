
import { createDemoWorkflow } from "../demoScenario";
import type {
  CorrectionCase,
  OperationalWorkflowState,
} from "../model";
import type { WorkflowPackageStore } from "../packageStore";

type DemoFinding = {
  id: string;
  surveyType: CorrectionCase["surveyType"];
  road: string;
  reason: string;
  action: string;
  severity: CorrectionCase["severity"];
  recordId: string;
  submitted?: boolean;
};

function makeCase(
  base: CorrectionCase,
  item: DemoFinding,
): CorrectionCase {
  const submitted = item.submitted === true;

  return {
    ...structuredClone(base),
    id: item.id,
    source: "Verval 14 hari",
    blockedStage: "Verval 14 hari",
    returnStage: "Verval 14 hari",
    road: item.road,
    stationing: "STA 2+000 – 2+500",
    rejectionReason: item.reason,
    severity: item.severity,
    surveyType: item.surveyType,
    linkedRecordId: item.recordId,
    owner: "Ketua Tim Penyedia",
    dueDate: "2027-06-25",
    rootCause: submitted ? "Metode" : "",
    fieldDataValid: submitted ? "Tidak" : "",
    actionType: item.action,
    evidence: submitted
      ? `EVID-${item.id} · referensi dokumen pengujian`
      : "",
    originalValue: "Data raw tetap pada sistem sumber.",
    proposedValue: submitted
      ? "Perbaikan diusulkan berdasarkan pemeriksaan ulang."
      : "",
    approval: submitted ? "Diajukan" : "Draft",
    status: submitted ? "Menunggu Persetujuan" : "Terbuka",
    retest: "Belum Diuji",
    reviewNote: "",
    verification: {
      surveyor: submitted,
      teamLeader: submitted,
      balai: false,
    },
  };
}

function createPackage(
  id: string,
  packageName: string,
  balai: string,
  satker: string,
  road: string,
  findings: DemoFinding[],
): OperationalWorkflowState {
  // Seluruh struktur 0–6 berasal dari generator demo
  // yang sudah dimiliki proyek.
  const state = createDemoWorkflow("verval-finding");

  state.project = {
    ...state.project,
    id,
    packageName,
    balai,
    satker,
    contractor: "PT Penyedia Demo Infrastruktur",
    routes: [road],
    semester: "Semester I",
  };

  state.dailyRecords = state.dailyRecords.map((record) => ({
    ...record,
    road,
  }));

  const baseCase = state.corrections[0];

  if (!baseCase) {
    throw new Error("Template kasus koreksi demo tidak ditemukan.");
  }

  state.corrections = findings.map((item) =>
    makeCase(baseCase, item),
  );

  state.cycle = {
    ...state.cycle,
    consistency: "Tidak Konsisten",
    userReview: "Temuan",
    userReviewNote:
      "Pemeriksaan berkala menemukan ketidaksesuaian yang perlu ditindaklanjuti.",
  };

  state.submission = {
    ...state.submission,
    validationStatus: "Draft",
  };

  state.audits = state.audits.map((audit) => ({
    ...audit,
    status: "Belum Dimulai",
    decisionNote: "",
    baNumber: "",
  })) as OperationalWorkflowState["audits"];

  state.acceptance = {
    ...state.acceptance,
    finalAcceptance: false,
    finalReport: false,
    acceptanceDecision: "Belum Diperiksa",
    finalAcceptanceBa: "",
  };

  return state;
}

export function addCorrectionDemoPackages(
  current: WorkflowPackageStore,
): WorkflowPackageStore {
  // Jangan menjalankan seed dari build produksi.
  if (!import.meta.env.DEV) return current;

  // Jangan menimpa paket yang sudah dimodifikasi pengguna.
  const additions: Record<string, OperationalWorkflowState> = {};

  if (!current.packages["PAKET-DEMO-003"]) {
    additions["PAKET-DEMO-003"] = createPackage(
      "PAKET-DEMO-003",
      "Paket QA/QC Surabaya–Gresik 2027",
      "Balai Jawa Timur",
      "Satker P2JN Jawa Timur",
      "Surabaya–Gresik",
      [
        {
          id: "KOR-JTM-001",
          surveyType: "IRI",
          road: "Surabaya–Gresik",
          reason: "Hasil repeatability IRI belum konsisten.",
          action: "Survei ulang sebagian ruas",
          severity: "Mayor",
          recordId: "IRI-001",
        },
        {
          id: "KOR-JTM-002",
          surveyType: "PCI",
          road: "Surabaya–Gresik",
          reason: "Dokumentasi penilaian PCI perlu diperiksa ulang.",
          action: "Ambil ulang foto/video",
          severity: "Minor",
          recordId: "PCI-001",
          submitted: true,
        },
        {
          id: "KOR-JTM-003",
          surveyType: "RNI",
          road: "Surabaya–Gresik",
          reason: "Referensi lokasi dan data inventori perlu klarifikasi.",
          action: "Koreksi pemrosesan dengan bukti",
          severity: "Mayor",
          recordId: "RNI-001",
        },
      ],
    );
  }

  if (!current.packages["PAKET-DEMO-004"]) {
    additions["PAKET-DEMO-004"] = createPackage(
      "PAKET-DEMO-004",
      "Paket QA/QC Semarang–Demak 2027",
      "Balai Jawa Tengah",
      "Satker P2JN Jawa Tengah",
      "Semarang–Demak",
      [
        {
          id: "KOR-JTG-001",
          surveyType: "IRI",
          road: "Semarang–Demak",
          reason: "Konsistensi hasil pengukuran perlu diuji ulang.",
          action: "Survei ulang sebagian ruas",
          severity: "Mayor",
          recordId: "IRI-001",
          submitted: true,
        },
        {
          id: "KOR-JTG-002",
          surveyType: "PCI",
          road: "Semarang–Demak",
          reason: "Bukti foto kondisi perkerasan belum memadai.",
          action: "Ambil ulang foto/video",
          severity: "Minor",
          recordId: "PCI-001",
        },
        {
          id: "KOR-JTG-003",
          surveyType: "Lendutan",
          road: "Semarang–Demak",
          reason: "Pemeriksaan konsistensi alat lendutan memerlukan klarifikasi.",
          action: "Kalibrasi ulang alat",
          severity: "Mayor",
          recordId: "LND-001",
        },
      ],
    );
  }

  if (Object.keys(additions).length === 0) {
    return current;
  }

  return {
    ...current,
    packages: {
      ...current.packages,
      ...additions,
    },
  };
}
