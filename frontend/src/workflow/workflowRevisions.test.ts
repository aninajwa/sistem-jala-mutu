import test from "node:test";
import assert from "node:assert/strict";
import {
  INITIAL_WORKFLOW,
  loadOperationalWorkflowState,
  type DailySurveyRecord,
} from "./model";
import { recordDailyChange, retainDecisionHistory } from "./workflowRevisions";
import { workflowMutationError } from "./workflowMutationPermissions";
import {
  createInitialPackageStore,
  loadWorkflowPackageStore,
  PACKAGE_STORE_KEY,
} from "./packageStore";
import { evaluateStageGate } from "./workflowGate";
const fresh = () => {
  const s = structuredClone(INITIAL_WORKFLOW);
  s.project.surveyStartDate = "2027-06-01";
  s.project.surveyEndDate = "2027-08-31";
  s.activeCyclePeriod = 2;
  s.cycleHistory = {
    "1": {
      ...s.cycle,
      certificateId: "BA-P1",
      periodCompleted: true,
      lastCompletedDate: "2027-06-14",
    },
  };
  s.cycle = {
    ...s.cycle,
    certificateId: "BA-P2",
    periodCompleted: true,
    lastCompletedDate: "2027-06-28",
  };
  s.audits = s.audits.map((a) => ({
    ...a,
    status: "Lulus",
    baNumber: `BA-A${a.level}`,
    sampleIds: ["R-OLD"],
  })) as typeof s.audits;
  return s;
};
const record = (date: string): DailySurveyRecord => ({
  id: "R-NEW",
  date,
  time: "08:00",
  surveyType: "IRI",
  road: "Medan – Binjai",
  lengthKm: 1,
  trafficDurationMinutes: 0,
  lane: "1",
  direction: "Normal",
  weather: "Cerah",
  surfaceDry: true,
  glareFree: true,
  speedAndLaneCompliant: true,
  tool: "Profilometer Laser",
  operator: "Surveyor",
  driver: "Driver",
  poi: "",
  disturbances: "",
  eventNotes: "",
  dailyToolCheck: {},
  rawValue: "4",
  cleanedValue: "4",
  cleaningReason: "",
  state: "Tercatat",
});
test("3A periode baru mempertahankan BA seluruh periode sebelumnya", () => {
  const s = fresh();
  const n = recordDailyChange(s, record("2027-07-01"));
  assert.deepEqual(n.cycle, s.cycle);
  assert.deepEqual(n.cycleHistory, s.cycleHistory);
  assert.equal(n.audits[1].baNumber, "BA-A2");
  assert.equal(n.audits[1].requiresReview, true);
});
test("perubahan rekaman lama hanya menandai periode terkait", () => {
  const s = fresh();
  const n = recordDailyChange(s, record("2027-06-03"));
  assert.equal(n.cycleHistory?.["1"].requiresReview, true);
  assert.equal(n.cycleHistory?.["1"].certificateId, "BA-P1");
  assert.deepEqual(n.cycle, s.cycle);
});
test("reset audit lama mempertahankan keputusan, BA, dan sampel", () => {
  const s = fresh();
  const n = retainDecisionHistory(s, {
    ...s,
    audits: structuredClone(INITIAL_WORKFLOW.audits),
  });
  assert.equal(n.audits[1].status, "Lulus");
  assert.equal(n.audits[1].requiresReview, true);
  assert.deepEqual(n.audits[1].sampleIds, ["R-OLD"]);
  assert.equal(evaluateStageGate(n, "Tahap 6").readyToComplete, false);
});
test("review audit baru mengarsipkan keputusan terdahulu", () => {
  const s = fresh();
  const audits = structuredClone(s.audits);
  audits[0].status = "Dalam Review";
  const n = retainDecisionHistory(s, { ...s, audits });
  assert.equal(n.audits[0].history?.[0].baNumber, "BA-A1");
});
test("perubahan periode mengarsipkan BA tanpa menghapus referensinya", () => {
  const s = fresh();
  const n = retainDecisionHistory(s, {
    ...s,
    cycle: { ...s.cycle, certificateId: "", userReview: "Belum Diperiksa" },
  });
  assert.equal(n.cycle.certificateId, "BA-P2");
  assert.equal(n.cycle.requiresReview, true);
  assert.equal(n.cycleRevisions?.["2"][0].certificateId, "BA-P2");
});
test("keempat role hanya boleh mengambil keputusan audit tingkatnya", () => {
  for (const role of [
    "Penyedia Jasa / Ketua Tim",
    "PIC Balai / Pengguna Jasa",
    "Direktorat / Pusat",
    "Admin",
  ] as const) {
    for (let i = 0; i < 3; i++) {
      const s = fresh();
      s.role = role;
      const n = structuredClone(s);
      n.audits[i].status = "Ditolak";
      const allowed =
        workflowMutationError(s, n, "/verification:Audit tingkat 1–3") ===
        undefined;
      assert.equal(
        allowed,
        (
          [
            "Penyedia Jasa / Ketua Tim",
            "PIC Balai / Pengguna Jasa",
            "Direktorat / Pusat",
          ] as const
        )[i] === role,
        `${role}: audit ${i + 1}`,
      );
    }
  }
});
test("Admin tidak mengesahkan persiapan atau penerimaan", () => {
  const s = fresh();
  s.role = "Admin";
  const n = structuredClone(s);
  n.project.preparation.reportApproval = "Disetujui";
  assert.ok(workflowMutationError(s, n, "/entry:Persiapan & SPMK"));
  n.acceptance.finalAcceptance = true;
  assert.ok(workflowMutationError(s, n, "/reports:Penerimaan & termin"));
});
test("3A dan 3B sama-sama dapat dikerjakan tanpa menunggu satu sama lain", () => {
  const s = fresh();
  s.role = "Penyedia Jasa / Ketua Tim";
  s.productionApproval = "Disetujui";
  s.dailyRecords = [];
  s.cycle.periodCompleted = false;
  assert.equal(evaluateStageGate(s, "Tahap 3A").canWork, true);
  assert.equal(evaluateStageGate(s, "Tahap 3B").canWork, true);
});
test("store baru hanya memakai satu paket contoh yang sudah tersedia", () => {
  assert.equal(Object.keys(createInitialPackageStore().packages).length, 1);
});
test("memuat data lama tidak menulis migrasi atau menyisipkan paket", () => {
  const data = JSON.stringify({
    activePackageId: "OLD",
    activeRole: "Admin",
    packages: { OLD: fresh() },
  });
  const writes: unknown[] = [];
  const storage = {
    getItem: (key: string) =>
      key === PACKAGE_STORE_KEY
        ? data
        : JSON.stringify({ ...fresh(), flowContractVersion: 1 }),
    setItem: (...args: unknown[]) => writes.push(args),
  };
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: storage },
    configurable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
  });
  const loaded = loadWorkflowPackageStore();
  assert.deepEqual(Object.keys(loaded.packages), ["OLD"]);
  const legacy = loadOperationalWorkflowState();
  assert.equal(legacy.audits[1].baNumber, "BA-A2");
  assert.equal(writes.length, 0);
});

test("review 3B disimpan terpisah per jenis dan tidak menyetujui jenis lain", async () => {
  const { reviewSurvey } = await import("./periodicReview");
  const s = fresh();
  s.cycle.selectedTypes = ["IRI", "PCI"];
  const iri = reviewSurvey(
    s.cycle,
    "IRI",
    { userReview: "Sesuai", userReviewNote: "IRI sesuai" },
    "2027-06-14",
  );
  assert.equal(iri.userReview, "Belum Diperiksa");
  const pci = reviewSurvey(
    { ...s.cycle, ...iri },
    "PCI",
    { userReview: "Sesuai", userReviewNote: "PCI sesuai" },
    "2027-06-14",
  );
  assert.equal(pci.userReview, "Sesuai");
  assert.equal(pci.surveyReviews?.IRI?.note, "IRI sesuai");
  assert.equal(pci.surveyReviews?.PCI?.note, "PCI sesuai");
  assert.equal(s.cycleHistory?.["1"].surveyReviews, undefined);
});

test("audit cascade retains decisions and only permits review flags at later levels", () => {
  const before = fresh(); before.role = "PIC Balai / Pengguna Jasa";
  before.audits[1].status = "Lulus"; before.audits[2].status = "Lulus"; before.audits[2].baNumber = "BA-PUSAT-ARSIP";
  const after = structuredClone(before); after.audits[1].status = "Ditolak";
  after.audits[2].requiresReview = true; after.audits[2].reviewReason = "Audit Balai berubah";
  assert.equal(workflowMutationError(before, after, "/verification:Audit tingkat 1–3"), undefined);
  after.audits[2].baNumber = "DIUBAH-TANPA-WEWENANG";
  assert.ok(workflowMutationError(before, after, "/verification:Audit tingkat 1–3"));
  after.audits[2] = { ...before.audits[2], status: "Belum Dimulai" };
  assert.ok(workflowMutationError(before, after, "/verification:Audit tingkat 1–3"));
});
