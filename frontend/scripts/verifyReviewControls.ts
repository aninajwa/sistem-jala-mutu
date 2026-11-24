import { correctionMutationError } from '../src/workflow/checkpoint09Corrections';
import type { CorrectionCase, OperationalWorkflowState } from '../src/workflow/model';
import { withCompleteDailyRecord } from '../src/workflow/testing/dailyRecordFixture';
import {calibrationSourceSignature} from "../src/workflow/calibrationReview";
import { openFilterPanels } from "./filterInteractions";
import { sourceFormFixture } from "../src/workflow/testing/sourceFormFixture";
import { fillSourceForm } from "./sourceFormInteractions";
import { chromium } from "playwright";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import assert from "node:assert/strict";
import { createDemoWorkflow } from "../src/workflow/demoScenario";
import { withProductionReferences } from "../src/workflow/testing/productionFixture";
import {
  documentQuestions,
  sourceDocument,
  sourceDocumentKey,
} from "../src/workflow/sourceDocumentModel";
import { PACKAGE_STORE_KEY } from "../src/workflow/packageStore";
import {
  evaluateProductionTest,
  CYCLE_PROTOCOLS, CYCLE_SHARED_PROTOCOLS,
  type WorkflowRole,
} from "../src/workflow/model";
const output = process.env.TEST_ARTIFACTS || "test-artifacts/review-controls";
fs.mkdirSync(output, { recursive: true });
const state = withProductionReferences(createDemoWorkflow("complete"));
state.project.id = "PAKET-DEMO-001";
state.project.packageName = "Paket Uji Review Terisolasi";
state.project.surveyTypes = ["RNI", "IRI"];
state.project.surveyStartDate = "2027-05-01";
state.project.surveyEndDate = "2027-05-28";
state.role = "Penyedia Jasa / Ketua Tim";
state.productionApproval = "Belum Diperiksa";
state.productionApprovalBa = "";
state.corrections = [];
state.dailyRecords = state.dailyRecords
  .filter(record => state.project.surveyTypes.includes(record.surveyType))
  .flatMap(record => [
    withCompleteDailyRecord({ ...record, id: `${record.id}-P1`, date: "2027-05-07" }),
    withCompleteDailyRecord({ ...record, id: `${record.id}-P2`, date: "2027-05-21" }),
  ]);
state.dailyRecords.push(
  { ...state.dailyRecords[0], id: "HELD-P1", state: "Ditahan" },
  { ...state.dailyRecords[0], id: "INCOMPLETE-P1", dailyToolCheck: {} },
);

state.activeCyclePeriod = 1;
state.cycleHistory = {};
state.calibrations = state.project.surveyTypes.map((type) => ({
  ...state.calibrations[0],
  id: "alat-" + type,
  surveyType: type,
  condition: "Baik",
  qualificationValid: true,
  trainingVerified: true,
  dueDate: "2099-01-01",
}));
for (const type of state.project.surveyTypes) {
  state.calibrationChecklist[type] = true;
  assert.equal(
    evaluateProductionTest(type, state.productionTests[type]).passed,
    true,
    `${type} initial technical fixture must satisfy existing source evaluator`,
  );
}
state.productionTests.IRI.sourceMode = "Sinkronisasi source/SMD";
state.cycle = {
  ...state.cycle,
  selectedTypes: [],
  checkedProtocols: Object.fromEntries([
    ...state.project.surveyTypes.flatMap(type => CYCLE_PROTOCOLS[type].map(label => `${type} · ${label}`)),
    ...CYCLE_SHARED_PROTOCOLS,
  ].map(label => [label, true])) ,
  surveyReviews: {},
  reviewPendingTypes: [],
  userReview: "Belum Diperiksa",
  certificateId: "",
  periodCompleted: false,
  requiresReview: false,
};
const sourceAnswers: Record<string, string> = {};
for (const type of state.project.surveyTypes)
  for (const phase of ["calibration", "consistency", "internal"]) {
    const doc = sourceDocument(type, phase)!;
    for (const period of phase === "calibration" ? [1] : [1, 2]) {
      const scope = period === 1 ? state.project.id : `${state.project.id}::period-${period}`;
      const start = period === 1 ? "2027-05-01" : "2027-05-15";
      const end = period === 1 ? "2027-05-14" : "2027-05-28";
      sourceAnswers[sourceDocumentKey(scope, doc.id)] = JSON.stringify(
        sourceFormFixture(doc, phase === "calibration" ? state.project : { ...state.project, periodStart: start, periodEnd: end }),
      );
    }
  }
// Model the preexisting Balai calibration inspection for the Stage 2 review scenario.
// Signatures are calculated after the calibration source answers are seeded below.
// The browser calculates these against the same seeded answers to avoid test-only shortcuts.
const priorStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>sourceAnswers[key]??null}});
state.calibrationReviews=Object.fromEntries(state.project.surveyTypes.map(type=>[type,{result:'Sesuai',subject:'Hasil kalibrasi',note:'Dokumen kalibrasi diperiksa Balai',evidenceReference:'',reviewedAt:state.simulationDate,reviewer:'PIC Balai / Pengguna Jasa',sourceSignature:calibrationSourceSignature(state,type),sections:Object.fromEntries(['Alat dan personel','Sertifikat kalibrasi','Hasil kalibrasi','Dokumen pendukung'].map(subject=>[subject,{result:'Sesuai',note:'Dokumen kalibrasi diperiksa Balai',evidenceReference:'',reviewedAt:state.simulationDate,reviewer:'PIC Balai / Pengguna Jasa',sourceSignature:calibrationSourceSignature(state,type)}]))}]));
if(priorStorage)Object.defineProperty(globalThis,'localStorage',priorStorage);else delete (globalThis as {localStorage?:unknown}).localStorage;
const server = await createServer({
  configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url)),
  server: { host: "127.0.0.1", port: 5175, strictPort: true },
});
await server.listen();
const executablePath = process.env.CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--no-zygote"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
await context.addInitScript(
  ({ state, key, sourceAnswers }) => {
    if (
      location.origin !== "http://127.0.0.1:5175" ||
      sessionStorage.getItem("seeded")
    )
      return;
    sessionStorage.setItem("seeded", "yes");
    localStorage.setItem(
      key,
      JSON.stringify({
        activePackageId: state.project.id,
        activeRole: state.role,
        packages: { [state.project.id]: state },
      }),
    );
    localStorage.setItem("jala-mutu-demo-session-v1", "active");
    for (const [k, v] of Object.entries(sourceAnswers))
      localStorage.setItem(k, v);
  },
  { state, key: PACKAGE_STORE_KEY, sourceAnswers },
);
const page = await context.newPage(),
  results: string[] = [],
  errors: string[] = [];
page.setDefaultTimeout(20_000);
page.setDefaultNavigationTimeout(60_000);
page.on("pageerror", (e) => errors.push(e.message));
let completed = false;
const url = (s: string) =>
  "http://127.0.0.1:5175" +
  s.split(":")[0] +
  "?testRoles=1&submodule=" +
  encodeURIComponent(s);
const prod = "/entry:Validasi produksi",
  periodic = "/verification:Verval 14 hari";
async function snapshot() {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).packages["PAKET-DEMO-001"],
    PACKAGE_STORE_KEY,
  );
}
async function actor(role: WorkflowRole) {
  await page.evaluate(
    ({ key, role }) => {
      const store = JSON.parse(localStorage.getItem(key)!);
      store.activeRole = role;
      store.packages["PAKET-DEMO-001"].role = role;
      localStorage.setItem(key, JSON.stringify(store));
    },
    { key: PACKAGE_STORE_KEY, role },
  );
  await page.reload();
}
async function openDetails() {
  for (const d of await page.locator(".role-work-details").all())
    if ((await d.getAttribute("open")) === null)
      await d.locator(":scope > summary").click();
}
async function task(label: string) {
  await page.getByRole("navigation", { name: "Pekerjaan Tahap 3B" })
    .getByRole("button", { name: label, exact: true }).click();
}
const periodSelect = () => page.getByLabel("Periode pemeriksaan", { exact: true });
async function submitPeriod(period: 1 | 2) {
  await task("Konsistensi");
  if (period === 2) {
    await page.getByLabel("Jenis survei checklist sumber").selectOption("IRI");
    await page.locator(".stage3b-workspace summary").filter({ hasText: "Hasil konsistensi dan penahanan data" }).click();
    await page.getByTestId("input-cycle-iri-cv").fill("3");
    await page.getByTestId("select-cycle-rerating").selectOption("Sesuai");
  }
  await task("Penyerahan ke Balai");
  if (period === 2) {
    await page.locator(".stage3b-workspace summary").filter({ hasText: /^Pemeriksaan pelaksanaan \(/ }).click();
    for (const check of await page.locator('input[data-testid^="check-cycle-protocol-"]').all()) {
      await check.check();
    }
  }
  const submit = page.getByTestId("button-cycle-submit");
  assert.equal(await submit.isEnabled(), true, await page.locator(".stage3b-workspace").innerText());
  await submit.click();
  assert.equal((await snapshot()).cycle.periodCompleted, true);
  assert.deepEqual((await snapshot()).cycle.submittedRecordIds.sort(), [`IRI-001-P${period}`, `RNI-001-P${period}`]);
  await page.reload();
  assert.equal((await snapshot()).cycle.periodCompleted, true);
}
async function fillShared(type: string) {
  await page.getByTestId("select-periodic-review-survey").selectOption(type);
  const form = page.locator(".source-exact-checklist");
  await form
    .getByRole("heading", { name: "Formulir pemeriksaan " + type, exact: true })
    .waitFor();
  await fillSourceForm(form);
}
try {
  await page.goto(url(prod));
  await openFilterPanels(page);
  await page.getByRole("button", { name: "IRI", exact: true }).click();
  await openDetails();
  await page.getByTestId("select-production-source-mode").waitFor({ state: "visible" });
  assert.equal(
    (await page.locator("body").innerText()).includes("Data terintegrasi"),
    false,
  );
  const mode = page.getByTestId("select-production-source-mode");
  assert.ok(await mode.inputValue());
  await mode.selectOption("Pencatatan manual");
  results.push(
    "Legacy source mode is visible, honestly local and editable; manual choice persists",
  );
  const productionSubmit = page.getByTestId("button-production-submit-review");
  const productionBlockers = page.locator(".stage2-blockers li");
  assert.equal(
    await productionSubmit.isEnabled(),
    true,
    `Stage 2 fixture cannot submit: ${(await productionBlockers.allTextContents()).join("; ")}`,
  );
  await productionSubmit.click();
  assert.equal((await snapshot()).productionApproval, "Diajukan");
  await actor("PIC Balai / Pengguna Jasa");
  await page.getByTestId("button-production-type-iri").click();
  await page
    .getByTestId("input-production-review-note")
    .fill("Perjelas referensi hasil uji IRI");
  await page.getByTestId("button-production-request-revision").click();
  assert.equal((await snapshot()).productionApproval, "Perlu Revisi");
  await actor("Penyedia Jasa / Ketua Tim");
  await openDetails();
  await page.getByRole("button", { name: "IRI", exact: true }).click();
  await page
    .getByLabel(/^Referensi hasil uji(?! gagal)/)
    .fill("REF-IRI-PERBAIKAN");
  await page.getByTestId("button-production-submit-review").click();
  assert.equal((await snapshot()).productionApproval, "Diajukan");
  await actor("PIC Balai / Pengguna Jasa");
  await page.getByTestId("button-production-type-rni").click();
  await page.getByTestId("input-production-approval-ba").fill("BA-UJI-REVIEW");
  await page.getByTestId("button-production-approve-method").click();
  assert.equal((await snapshot()).productionApproval, "Disetujui");
  await page.reload();
  assert.equal((await snapshot()).productionApproval, "Disetujui");
  results.push(
    "Stage2 provider submits, Balai requests revision, provider corrects and resubmits, Balai approves; refresh retains decision",
  );
  await page.screenshot({ path: output + "/balai-stage2.png" });
  await page.goto(url(periodic));
  await openFilterPanels(page);
  const survey = page.getByTestId("select-periodic-review-survey"),
    decision = page.getByTestId("select-cycle-user-review");
  await task("Keputusan & Tindak Lanjut");
  assert.equal(await decision.count(), 0);
  assert.match(await page.locator(".stage3b-workspace").innerText(), /Menunggu penyerahan/);
  await page.screenshot({ path: output + "/balai-sebelum-penyerahan.png", fullPage: true });
  await actor("Penyedia Jasa / Ketua Tim");
  await submitPeriod(1);
  await actor("PIC Balai / Pengguna Jasa");
  await page.screenshot({ path: output + "/balai-diserahkan.png" });
  const providerForm = page.getByLabel("Formulir Penyedia", { exact: true });
  await providerForm.selectOption("internal");
  const providerResults = page.locator(".source-exact-checklist");
  await providerResults.waitFor();
  assert.equal(await providerResults.locator("fieldset input:enabled, .wf-field input:enabled, .wf-field textarea:enabled").count(), 0);
  await providerForm.selectOption("");

  await task("Keputusan & Tindak Lanjut");
  assert.deepEqual(await survey.locator("option").evaluateAll(options =>
    options.map(option => (option as HTMLOptionElement).value)), ["RNI", "IRI"]);
  for (const type of ["IRI", "RNI"]) {
    await survey.selectOption(type);
    await page.getByTestId("input-cycle-user-review-note").fill(`Catatan ${type}`);
  }
  await survey.selectOption("IRI");
  assert.equal(await page.getByTestId("input-cycle-user-review-note").inputValue(), "Catatan IRI");
  assert.equal(await decision.locator('option[value="Sesuai"]').isDisabled(), true);
  results.push("Balai controls require real submission, period scope and per-survey notes persist, incomplete review blocks conformity");

  for (const type of ["RNI", "IRI"]) {
    await task("Pemeriksaan Bersama");
    await fillShared(type);
    await task("Keputusan & Tindak Lanjut");
    await decision.selectOption("Sesuai");
    assert.equal((await snapshot()).cycle.surveyReviews[type].decision, "Sesuai");
  }
  assert.equal((await snapshot()).cycle.userReview, "Sesuai");
  await task("BA");
  await page.getByTestId("input-cycle-ba").fill("DRAFT-P1");
  await periodSelect().selectOption("2");
  assert.equal(await page.getByTestId("input-cycle-ba").count(), 0);
  await actor("Penyedia Jasa / Ketua Tim");
  await submitPeriod(2);
  await actor("PIC Balai / Pengguna Jasa");
  await task("BA");
  assert.equal(await page.getByTestId("input-cycle-ba").inputValue(), "");
  await page.getByTestId("input-cycle-ba").fill("DRAFT-P2");
  await page.reload();
  await task("BA");
  assert.equal(await page.getByTestId("input-cycle-ba").inputValue(), "DRAFT-P2");
  await periodSelect().selectOption("1");
  assert.equal(await page.getByTestId("input-cycle-ba").inputValue(), "DRAFT-P1");
  await page.getByTestId("button-cycle-complete").click();
  assert.equal((await snapshot()).cycle.certificateId, "DRAFT-P1");
  await page.screenshot({ path: output + "/balai-selesai.png" });
  await actor("Penyedia Jasa / Ketua Tim");
  assert.equal(await page.locator(".source-exact-checklist fieldset input:enabled").count(), 0);
  await actor("PIC Balai / Pengguna Jasa");
  results.push("Whole-package submission uses eligible in-period record IDs; complete per-survey source review permits BA; drafts persist independently");

  await task("Keputusan & Tindak Lanjut");
  await survey.selectOption("RNI");
  await page.getByTestId("input-cycle-user-review-note").fill("Perbaiki bukti RNI periode 1");
  await decision.selectOption("Temuan");
  let snap = await snapshot();
  const finding = snap.corrections.find(
    (c: any) => c.source === "Temuan proses verval" && c.cyclePeriod === 1,
  );
  assert.ok(finding);
  assert.equal(finding.surveyType, "RNI");
  await page.screenshot({ path: output + "/balai-perlu-perbaikan.png" });
  await actor("Penyedia Jasa / Ketua Tim");
  const form = page.locator(".source-exact-checklist");
  await form.getByLabel("Jenis survei checklist sumber").selectOption("RNI");
  assert.equal(await form.locator('fieldset input:enabled').count(), 0);
  async function correctionStep(role: WorkflowRole, patch: Partial<CorrectionCase>) {
    await actor(role);
    const before: OperationalWorkflowState = await snapshot();
    const next = {
      ...before, corrections: before.corrections.map(item => item.id === finding.id ? { ...item, ...patch } : item),
    };
    assert.equal(correctionMutationError(before, next), undefined);
    await page.evaluate(({ key, next }) => {
      const store = JSON.parse(localStorage.getItem(key)!);
      store.packages[store.activePackageId] = next;
      localStorage.setItem(key, JSON.stringify(store));
    }, { key: PACKAGE_STORE_KEY, next });
    await page.reload();
  }
  await correctionStep("Penyedia Jasa / Ketua Tim", {
    status: "Menunggu Persetujuan", approval: "Diajukan", rootCause: "Pemrosesan",
    fieldDataValid: "Tidak Berlaku", owner: "Petugas Uji", actionType: "Penilaian ulang",
    proposedPlan: "Periksa bukti RNI", evidence: "BUKTI-RNI-1",
    verification: { surveyor: true, teamLeader: true, balai: false },
  });
  await form.getByLabel("Jenis survei checklist sumber").selectOption("RNI");
  assert.equal(await form.locator('fieldset input:enabled').count(), 0);
  await correctionStep("PIC Balai / Pengguna Jasa", {
    status: "Disetujui", approval: "Disetujui", reviewNote: "Periksa ulang bukti RNI",
    verification: { surveyor: true, teamLeader: true, balai: true },
  });
  await actor("Penyedia Jasa / Ketua Tim");
  await form.getByLabel("Jenis survei checklist sumber").selectOption("RNI");
  assert.ok(await form.locator('fieldset input:enabled').count());

  for (const d of await form.locator(".structured-checklist-section").all())
    if ((await d.getAttribute("open")) === null)
      await d.locator(":scope > summary").click();
  const group = form.locator("fieldset").first();
  await group.locator("input[type=radio]").nth(1).check();
  await group.locator("input[type=radio]").first().check();
  snap = await snapshot();
  assert.ok(snap.cycle.reviewPendingTypes.includes("RNI"));
  assert.equal(snap.cycle.surveyReviews.IRI.decision, "Sesuai");
  await actor("PIC Balai / Pengguna Jasa");
  await task("Keputusan & Tindak Lanjut");
  await survey.selectOption("RNI");
  assert.equal(await decision.inputValue(), "Belum Diperiksa");
  await decision.selectOption("Sesuai");
  assert.equal((await snapshot()).cycle.reviewPendingTypes.length, 0);
  await task("BA");
  assert.equal(await page.getByTestId("button-cycle-complete").isDisabled(), true);
  results.push("Finding links a unique case; provider changes require affected survey review and an open case blocks BA");

  await periodSelect().selectOption("2");
  await task("Keputusan & Tindak Lanjut");
  await survey.selectOption("RNI");
  await page.getByTestId("input-cycle-user-review-note").fill("Temuan RNI periode 2 — data uji terisolasi");
  await decision.selectOption("Temuan");
  assert.equal((await snapshot()).corrections.filter((c: any) => c.source === "Temuan proses verval").length, 2);
  results.push("Same-survey findings in separate periods keep distinct cases");
  for (const role of [
    "Penyedia Jasa / Ketua Tim",
    "PIC Balai / Pengguna Jasa",
    "Direktorat / Pusat",
    "Admin",
  ] as WorkflowRole[]) {
    const work = page.locator(".stage3b-workspace");
    for (const [size, width, height] of [["desktop", 1440, 1000], ["mobile", 390, 844]] as const) {
      await page.setViewportSize({ width, height });
      await actor(role);
      const tasks = role === "Penyedia Jasa / Ketua Tim"
        ? ["Konsistensi", "V&V Internal", "Bukti & BA", "Penyerahan ke Balai"]
        : role === "PIC Balai / Pengguna Jasa"
          ? ["Hasil Penyedia", "Pemeriksaan Bersama", "Keputusan & Tindak Lanjut", "BA"]
          : [""];
      for (const [i, label] of tasks.entries()) {
        if (label) await task(label);
        await work.locator(".stage3b-header").evaluate(header => header.scrollIntoView({ block: "start" }));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false, `${role} / ${size} / ${label}`);
        assert.equal(await page.locator(".sidebar.open").count(), 0, "Mobile menu must not obscure the task");
        assert.doesNotMatch(await work.innerText(), /Panduan kegiatan|Gerbang Tahap 3|local storage|workflow guard|data lokal tersimpan/i);
        await page.screenshot({ path: `${output}/${size}-${role.split(" ")[0]}-${i + 1}.png`, animations: "disabled" });
        if (label) assert.equal(await work.locator('nav [aria-current="page"]').count(), 1);
        assert.ok(await work.locator(".source-exact-checklist:visible").count() <= 1);
        const records = work.locator("summary").filter({ hasText: /^Rekaman Tahap 3A/ });
        if (i === 0 && await records.count()) {
          await records.click();
          const table = work.getByRole("table", { name: "Rekaman survei harian" });
          await table.waitFor();
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2), false);
          await table.screenshot({ path: `${output}/${size}-${role.split(" ")[0]}-rekaman.png`, animations: "disabled" });
          await records.click();
        }
        if (role === "Direktorat / Pusat") {
          const history = work.locator("details").filter({ has: page.locator("summary", { hasText: /^Riwayat periode$/ }) });
          await history.locator("summary").click();
          await history.screenshot({ path: `${output}/${size}-Direktorat-riwayat.png`, animations: "disabled" });
        }
      }
    }
    if (role === "Admin" || role === "Direktorat / Pusat")
      assert.equal(
        await page.getByTestId("select-cycle-user-review").count(),
        0,
      );
  }
  results.push(
    "Four role views remain responsive at 390px; Admin has no technical review controls",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await actor("Direktorat / Pusat");
  await page.getByRole("button", { name: "Catatan Direktorat", exact: true }).click();
  const notes = page.getByRole("dialog", { name: "Catatan Direktorat" });
  await notes.getByLabel("Catatan untuk Penyedia").fill("Catatan pemantauan periode kedua.");
  await notes.getByRole("button", { name: "Simpan catatan", exact: true }).click();
  await notes.getByRole("button", { name: "Edit", exact: true }).click();
  await notes.getByLabel("Ubah catatan").fill("Catatan pemantauan periode kedua (diperbarui).");
  await notes.getByRole("button", { name: "Simpan perubahan", exact: true }).click();
  await actor("PIC Balai / Pengguna Jasa");
  // Balai reads Directorate notes from the BA/document workspace, not the results workspace.
  await page.getByRole("button", { name: "BA", exact: true }).click();
  await page.getByRole("button", { name: "Catatan Direktorat", exact: true }).click();
  assert.match(await notes.innerText(), /Catatan pemantauan periode kedua \(diperbarui\)/);
  assert.equal(await notes.getByRole("button", { name: "Edit", exact: true }).count(), 0);
  assert.equal(await notes.getByRole("button", { name: "Tarik catatan", exact: true }).count(), 0);
  await notes.getByRole("button", { name: "Tutup", exact: true }).click();
  await periodSelect().selectOption("1");
  await page.getByRole("button", { name: "Catatan Direktorat", exact: true }).click();
  assert.match(await notes.innerText(), /Belum ada catatan tambahan/);
  await notes.getByRole("button", { name: "Tutup", exact: true }).click();
  results.push("Directorate note is isolated to its period and editable only by its author");
  const empty = await browser.newContext();
  await empty.addInitScript(
    ({ key, state }) => {
      if (
        location.origin !== "http://127.0.0.1:5175" ||
        sessionStorage.getItem("empty-seed")
      )
        return;
      sessionStorage.setItem("empty-seed", "yes");
      const draft = structuredClone(state);
      draft.project.surveyTypes = [];
      draft.role = "Penyedia Jasa / Ketua Tim";
      localStorage.setItem(
        key,
        JSON.stringify({
          activePackageId: draft.project.id,
          activeRole: draft.role,
          packages: { [draft.project.id]: draft },
        }),
      );
      localStorage.setItem("jala-mutu-demo-session-v1", "active");
    },
    { key: PACKAGE_STORE_KEY, state },
  );
  const emptyPage = await empty.newPage();
  emptyPage.on("pageerror", (error) => errors.push(error.message));
  await emptyPage.goto(url(periodic));
  const emptyForm = emptyPage.locator(".source-exact-checklist");
  assert.equal(await emptyForm.locator("fieldset input").count(), 0);
  assert.equal(
    await emptyForm
      .getByLabel("Jenis survei checklist sumber", { exact: true })
      .isDisabled(),
    true,
  );
  await emptyPage.screenshot({ path: output + "/empty-scope.png" });
  await empty.close();
  results.push(
    "Empty package scope has an explicit placeholder, no outside-scope source form and no editable answer controls",
  );
  assert.deepEqual(errors, []);
  completed = true;
} catch (error) {
  fs.writeFileSync(output + "/failure.txt", String(error));
  fs.writeFileSync(
    output + "/state.json",
    JSON.stringify(await snapshot(), null, 2),
  );
  fs.writeFileSync(output + "/dom.txt", await page.locator("body").innerText());
  await page.screenshot({ path: output + "/failure.png", fullPage: true });
  throw error;
} finally {
  fs.writeFileSync(
    output + "/results.json",
    JSON.stringify({ completed, results, errors }, null, 2),
  );
  await browser.close();
  await server.close();
}
