import { CALIBRATION_REVIEW_SUBJECTS, calibrationSourceSignature } from '../src/workflow/calibrationReview';
import { sourceDocument, sourceDocumentKey } from '../src/workflow/sourceDocumentModel';
import { sourceFormFixture } from '../src/workflow/testing/sourceFormFixture';
import { evaluateStageGate } from '../src/workflow/workflowGate';
import { withCompleteDailyRecord } from '../src/workflow/testing/dailyRecordFixture';
import { openFilterPanels } from "./filterInteractions";
import { fillSourceForm, prepareIriPeriod } from "./sourceFormInteractions";
import { SURVEY_TYPES } from "../src/workflow/model";
import { unzipSync, strFromU8 } from "fflate";
import { chromium } from "playwright";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import assert from "node:assert/strict";
import { createDemoWorkflow } from "../src/workflow/demoScenario";
import { withProductionReferences } from "../src/workflow/testing/productionFixture";
import { PACKAGE_STORE_KEY } from "../src/workflow/packageStore";
import { BA_TEMPLATES } from "../src/workflow/ba/docxEngine";
import type { WorkflowRole, SurveyType } from "../src/workflow/model";
const output =
  process.env.TEST_ARTIFACTS ||
  fileURLToPath(new URL("../test-artifacts", import.meta.url));
fs.mkdirSync(output + "/screenshots", { recursive: true });
fs.mkdirSync(output + "/ba-samples", { recursive: true });
const port = Number(process.env.OPERATIONAL_PORT || 5173),
  baseUrl = `http://127.0.0.1:${port}`;
const server = await createServer({
  configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url)),
  server: { host: "127.0.0.1", port, strictPort: true, watch: { ignored: ["**/test-artifacts/**"] } },
});
await server.listen();
const executablePath = process.env.CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  headless: true,
  args: executablePath
    ? [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
      ]
    : [],
});
const roles: WorkflowRole[] = [
  "Penyedia Jasa / Ketua Tim",
  "PIC Balai / Pengguna Jasa",
  "Direktorat / Pusat",
  "Admin",
];
const selections = [
  "/entry:Persiapan & SPMK",
  "/documents:Kalibrasi & personel",
  "/entry:Validasi produksi",
  "/entry:Survei harian",
  "/verification:Verval 14 hari",
  "/entry:Gerbang RNI/LRS",
  "/verification:Audit tingkat 1\u20133",
  "/reports:Penerimaan & termin",
];
const fixture = withProductionReferences(createDemoWorkflow("complete"));
fixture.project.id = "PAKET-DEMO-001";
fixture.project.packageName = "Paket Uji Terisolasi QA/QC";
fixture.project.surveyStartDate = "2027-01-01";
fixture.project.surveyEndDate = "2027-12-31";
fixture.activeCyclePeriod = 1;
fixture.productionTests.PCI.pciManual = true;
fixture.cycle.surveyReviews = Object.fromEntries(
  fixture.project.surveyTypes.map((type) => [
    type,
    {
      decision: "Sesuai",
      note: "Referensi uji terisolasi",
      reviewedAt: fixture.simulationDate,
    },
  ]),
);
for (const type of fixture.project.surveyTypes) {
  if (!fixture.calibrations.some((c) => c.surveyType === type)) {
    fixture.calibrations.push({
      ...fixture.calibrations[0],
      id: "TEST-CAL-" + type,
      surveyType: type,
      condition: "Baik",
      dueDate: "2027-12-31",
    });
  }
}
const results: any[] = [];
let errors: string[] = [];
let completed = false;
async function setup(
  role: WorkflowRole,
  allSourceTypes = false,
  scope?: SurveyType[],
  initialScenario?: "preparation-draft" | "audit-review" | "period-draft",
) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  const state = { ...structuredClone(fixture), role };
  const sourceAnswers: Record<string, string> = {};
  if (allSourceTypes) state.project.surveyTypes = [...SURVEY_TYPES];
  if (scope) state.project.surveyTypes = scope;
  if (initialScenario === "preparation-draft")
    state.project.preparation.reportApproval = "Draft";
  if (initialScenario === "audit-review")
    state.audits[0].status = "Dalam Review";
  if (initialScenario === "period-draft") {
    state.dailyRecords = state.dailyRecords.filter(record => record.surveyType === "IRI")
      .map(record => withCompleteDailyRecord({ ...record, date: "2027-01-07", state: "Tercatat" }));
    state.cycle = { ...state.cycle, selectedTypes: ["IRI"], periodCompleted: false,
      submittedRecordIds: undefined, certificateId: "", userReview: "Belum Diperiksa",
      surveyReviews: {}, reviewPendingTypes: [], requiresReview: false };
    const doc = sourceDocument("IRI", "calibration")!;
    sourceAnswers[sourceDocumentKey(state.project.id, doc.id)] = JSON.stringify(sourceFormFixture(doc, state.project));
    const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => sourceAnswers[key] ?? null } });
    try {
      const section = {
        result: 'Sesuai' as const, reviewer: roles[1], reviewedAt: state.simulationDate,
        note: 'Kalibrasi IRI diperiksa untuk skenario BA', evidenceReference: 'BA-KAL-IRI-UJI',
        sourceSignature: calibrationSourceSignature(state, 'IRI'),
      };
      state.calibrationReviews = { IRI: { ...section, subject: CALIBRATION_REVIEW_SUBJECTS[0],
        sections: Object.fromEntries(CALIBRATION_REVIEW_SUBJECTS.map(subject => [subject, section])),
      } };
      assert.equal(evaluateStageGate(state, 'Tahap 2').readyToComplete, true);
    } finally {
      if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
      else Reflect.deleteProperty(globalThis, 'localStorage');
    }
  }
  await context.addInitScript(
    ({ key, state, role, origin, sourceAnswers }) => {
      if (
        location.origin !== origin ||
        sessionStorage.getItem("fixture-initialized")
      )
        return;
      sessionStorage.setItem("fixture-initialized", "yes");
      localStorage.setItem(
        key,
        JSON.stringify({
          activePackageId: state.project.id,
          activeRole: role,
          packages: { [state.project.id]: state },
        }),
      );
      localStorage.setItem("jala-mutu-demo-session-v1", "active");
      for (const [key, value] of Object.entries(sourceAnswers)) localStorage.setItem(key, value);
    },
    { key: PACKAGE_STORE_KEY, state, role, origin: baseUrl, sourceAnswers },
  );
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(45000);
  page.on("pageerror", (e) => errors.push(e.message));
  return { context, page };
}
async function openBaContext(page: any) {
  const panel = page
    .locator("details.wf-panel")
    .filter({
      has: page
        .locator("summary")
        .getByText("Ganti konteks dokumen", { exact: true }),
    });
  if ((await panel.getAttribute("open")) === null)
    await panel.locator(":scope > summary").click();
}
async function openFirstBaTextareaSection(page: any) {
  const picker = page.getByLabel("Bagian formulir");
  await picker.waitFor({ state: "visible" });

  const count = await picker.locator("option").count();
  for (let i = 0; i < count; i++) {
    await picker.selectOption({ index: i });
    const textarea = page.locator(
      ".ba-form-section .ba-field-row textarea:visible"
    ).first();

    if (await textarea.count() > 0 && await textarea.isEnabled()) {
      await textarea.waitFor({ state: "visible" });
      return;
    }
  }

  throw new Error("Tidak ditemukan isian teks BA pada seluruh bagian formulir.");
}

/** Expand only document accordions needed by browser fixtures; no production DOM changes. */
async function revealSourceSections(page: import("playwright").Page) {
  await page.locator(".source-exact-checklist").first().evaluate(element => {
    for (let parent = element.parentElement; parent; parent = parent.parentElement) {
      if (parent instanceof HTMLDetailsElement) parent.open = true;
    }
    for (const detail of element.querySelectorAll("details")) {
      if (detail instanceof HTMLDetailsElement) detail.open = true;
    }
  });
}
const selectedScenario = process.env.OPERATIONAL_SCENARIO;
async function scenario(name: string, run: () => Promise<void>) {
  if (selectedScenario && name !== selectedScenario) return;
  console.log("RUN", name);
  try {
    await run();
    console.log("DONE", name);
  } catch (error) {
    const detail =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    errors.push(name + ": " + detail);
    results.push({ scenario: name, result: "fail", error: detail });
    console.error("FAIL", name, detail);
    for (const context of browser.contexts())
      for (const page of context.pages()) {
        if (page.isClosed()) continue;
        const prefix = output + "/" + name.replace(/[^a-zA-Z0-9_-]/g, "-");
        try {
          fs.writeFileSync(
            prefix + "-dom.txt",
            await page.locator("body").innerText({ timeout: 3000 }),
          );
          fs.writeFileSync(
            prefix + "-storage.json",
            JSON.stringify(
              await page.evaluate(() =>
                Object.fromEntries(Object.entries(localStorage)),
              ),
              null,
              2,
            ),
          );
          await page.screenshot({ path: prefix + ".png", timeout: 5000 });
        } catch {}
      }
  } finally {
    fs.writeFileSync(
      output + "/scenario-progress.json",
      JSON.stringify(
        {
          results,
          errors,
          completed: false,
          selectedScenario: selectedScenario ?? null,
        },
        null,
        2,
      ),
    );
    for (const context of browser.contexts()) await context.close();
  }
}

try {
  for (let r = 0; r < roles.length; r++) {
    await scenario(`role-${roles[r]}`, async () => {
      const { context, page } = await setup(roles[r]);
      await page.goto(baseUrl + "/packages?testRoles=1");
      await openFilterPanels(page);
      await page
        .getByTestId("package-card-" + fixture.project.id)
        .waitFor({ state: "visible" });
      // The package hub also renders summary cards: identify the seeded package explicitly.
      assert.equal(
        await page.getByTestId("package-card-" + fixture.project.id).count(),
        1,
      );
      await page
        .getByTestId("package-card-" + fixture.project.id)
        .getByText(fixture.project.packageName, { exact: true })
        .waitFor();
      await page.waitForTimeout(450);
      await page.screenshot({
        animations: "disabled",
        path: `${output}/screenshots/role-${r}-packages.png`,
      });
      for (let i = 0; i < selections.length; i++) {
        await page.goto(
          `${baseUrl}${selections[i].split(":")[0]}?testRoles=1&submodule=${encodeURIComponent(selections[i])}`,
        );
        await openFilterPanels(page);
        await page
          .locator('[data-testid="operational-workflow-workspace"]')
          .waitFor();
        await page.locator('[data-testid="operational-workflow-workspace"]').first().waitFor({ state: "visible" });
        assert.equal(
          await page.locator('[data-testid="select-global-balai"]').count(),
          0,
        );
        assert.equal(
          await page.locator('[data-testid="mobile-global-filters"]').count(),
          0,
        );
        const content = await page.locator("body").innerText();
        assert.equal(content.includes("DATA SIMULASI"), false);
        if (r === 3)
          assert.equal(
            await page.locator('[data-testid="button-prep-approve"]').count(),
            0,
          );

        if (i === 7) {
          // Acceptance is a dedicated screen; package status belongs to the package hub.
          // Check the actual role boundaries without requiring a removed stage selector.
          const balai = roles[r] === "PIC Balai / Pengguna Jasa";
          const provider = roles[r] === "Penyedia Jasa / Ketua Tim";
          const decision = page.getByTestId("select-acceptance-decision");
          assert.equal(await decision.count() > 0, balai,
            `Role ${roles[r]}: only Balai sees the acceptance decision editor`);
          assert.equal(await page.getByTestId("button-final-acceptance").count() > 0, balai,
            `Role ${roles[r]}: only Balai sees the acceptance action`);
          if (balai) {
            assert.equal(await decision.isEnabled(), true,
              "Balai acceptance editor must be enabled");
          }
          const term = page.getByTestId("input-term-progress-T1");
          if (provider) {
            await term.waitFor({ state: "visible" });
            assert.equal(await term.isEnabled(), true,
              "Provider term progress must be editable");
          } else if (!balai) {
            assert.equal(await term.count(), 0,
              `Role ${roles[r]}: monitor must not render a disabled term editor`);
            await page.getByRole("region", { name: "Monitoring penerimaan data" }).waitFor();
          } else {
            assert.equal(await term.count(), 0,
              "Balai reads term progress without provider input controls");
            await page.getByTestId("table-acceptance-terms").waitFor();
          }
        }
        await page.waitForTimeout(450);
        await page.screenshot({
          animations: "disabled",
          path: `${output}/screenshots/role-${r}-stage-${i}.png`,
        });
        results.push({
          role: roles[r],
          stage: selections[i],
          result: "pass",
          kind: "browser render + role context",
        });
      }
      await page.setViewportSize({ width: 390, height: 844 });
      for (let i = 0; i < selections.length; i++) {
        await page.goto(
          `${baseUrl}${selections[i].split(":")[0]}?testRoles=1&submodule=${encodeURIComponent(selections[i])}`,
        );
        await openFilterPanels(page);
        await page.locator('[data-testid="operational-workflow-workspace"]').first().waitFor({ state: "visible" });
        await page.screenshot({
          animations: "disabled",
          path: `${output}/screenshots/mobile-role-${r}-stage-${i}.png`,
        });
        fs.writeFileSync(
          `${output}/mobile-width-${r}-${i}.json`,
          JSON.stringify(
            await page
              .locator("body *")
              .evaluateAll((elements) =>
                elements
                  .filter(
                    (el) =>
                      el.getBoundingClientRect().right > window.innerWidth + 2,
                  )
                  .map((el) => ({
                    tag: el.tagName,
                    class: el.className,
                    width: el.getBoundingClientRect().width,
                    right: el.getBoundingClientRect().right,
                  })),
              ),
            null,
            2,
          ),
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > window.innerWidth + 2,
          ),
          false,
          `Mobile overflow: role ${r}, stage ${i}`,
        );
        results.push({
          role: roles[r],
          stage: selections[i],
          result: "pass",
          kind: "390px mobile role workspace without page overflow",
        });
      }
      const snapshot = await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!),
        PACKAGE_STORE_KEY,
      );
      assert.equal(
        snapshot.packages[fixture.project.id].productionApproval,
        "Disetujui",
        "Browsing pages must not revoke production approval",
      );
      await context.close();
    });
  }
  // Export all seven source formats through their real UI buttons.
  for (const template of BA_TEMPLATES) {
    const role =
      template.id === "audit" ||
      ["kalibrasi", "konsistensi", "internal"].includes(template.id)
        ? roles[0]
        : roles[1];
    const { context, page } = await setup(role);
    await page.goto(
      baseUrl +
        "/documents?testRoles=1&submodule=" +
        encodeURIComponent("/documents:BA & dokumen workflow"),
    );
    await openFilterPanels(page);
    await openBaContext(page);
    await page
      .getByLabel("Format BA", { exact: true })
      .selectOption(template.id);
    await page
      .getByRole("button", { name: "Lengkapi isian template", exact: true })
      .click();
    const draftValue =
      template.id === "penerimaan" ? "Kamis" : "Lokasi uji terisolasi";
    await openFirstBaTextareaSection(page);
    const chosenSection = await page.getByLabel("Bagian formulir").inputValue();
    const first = page.locator(".ba-form-section .ba-field-row textarea:visible").first();
    const inputId = await first.getAttribute("id");
    assert.ok(inputId, "BA field must have a stable form label");
    const fieldLabel = await page.locator(`label[for="${inputId}"]`).innerText();
    await first.fill(draftValue);
    // Refresh must retain the draft: init script only seeds workflow/session, never document keys.
    await page.reload();
    await openBaContext(page);
    await page
      .getByLabel("Format BA", { exact: true })
      .selectOption(template.id);
    const expandBa = page.getByRole("button", {
      name: "Lengkapi isian template",
      exact: true,
    });
    if (await expandBa.isVisible()) await expandBa.click();
    await page.getByLabel("Bagian formulir").selectOption(chosenSection);
    const restoredField = page.locator(".ba-form-section .ba-field-row")
      .filter({ has: page.getByText(fieldLabel, { exact: true }) })
      .locator("textarea").first();
    await restoredField.waitFor({ state: "visible" });
    assert.equal(await restoredField.inputValue(), draftValue,
      `BA ${template.id}: saved field must survive reload`);
    const downloadEvent = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Unduh DOCX draft", exact: true })
      .click();
    const download = await downloadEvent;
    await download.saveAs(`${output}/ba-samples/${template.id}.docx`);
    assert.ok(
      fs.statSync(`${output}/ba-samples/${template.id}.docx`).size > 1000,
    );
    const actual = unzipSync(
      fs.readFileSync(`${output}/ba-samples/${template.id}.docx`),
    );
    const original = unzipSync(
      fs.readFileSync(
        fileURLToPath(
          new URL(
            "../public/ba-templates/" + template.filename,
            import.meta.url,
          ),
        ),
      ),
    );
    assert.deepEqual(
      Object.keys(actual).sort(),
      Object.keys(original).sort(),
      "DOCX must retain relationships, headers, footers and assets",
    );
    const xml = strFromU8(actual["word/document.xml"]);
    const text = xml.replace(/<[^>]+>/g, "");
    assert.ok(text.includes("DRAFT LOKAL"));
    assert.equal(
      /[\u00e2][\u20ac\u2020\u2030]|\u00c2[\u00b7\u00b2]/.test(text),
      false,
      "Generated DOCX text must not contain mojibake",
    );
    if (template.id === "penerimaan") {
      assert.equal(text.includes("Dua Ribu Dua Puluh Lima (2025)"), false);
      assert.ok(text.includes("2027"));
    }
    if (template.id === "audit")
      assert.equal(
        text.includes("2026-12-18"),
        false,
        "Non-periodic BA must use package dates, not period zero",
      );
    if (template.id === "kalibrasi")
      assert.ok(
        text.includes("berikutnya dijadwalkan pada: [BELUM DIISI]"),
        "Unknown next calibration date must not be fabricated",
      );

    if (template.id === "kalibrasi" || template.id === "penerimaan") {
      await page
        .getByRole("button", { name: "Pratinjau DOCX", exact: true })
        .click();
      await page.locator(".ba-document-preview .docx").first().waitFor();
      await page.waitForTimeout(450);
      await page.screenshot({
        animations: "disabled",
        path: `${output}/screenshots/ba-${template.id}.png`,
      });
    }
    results.push({
      format: template.id,
      result: "pass",
      kind: "real DOCX download + draft persistence",
    });
    await context.close();
  }
  await scenario("audit-rejection", async () => {
    const { context, page } = await setup(roles[1]);
    await page.goto(
      baseUrl +
        "/verification?testRoles=1&submodule=" +
        encodeURIComponent(selections[6]),
    );
    await openFilterPanels(page);
    await page.getByTestId("button-audit-level-2").click();
    await page.getByTestId("stage5-tab-keputusan").click();
    await page.getByTestId("select-audit-status-2").selectOption("Ditolak");
    await page.getByTestId("select-audit-rejection-type-2").selectOption("PCI");
    await page
      .getByTestId("input-audit-rejection-2")
      .fill("Bukti pembanding belum sesuai");
    await page
      .getByRole("button", { name: "Simpan keputusan / BA", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Buka tindak lanjut", exact: true })
      .waitFor();
    const rejected = await page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key)!).packages["PAKET-DEMO-001"],
      PACKAGE_STORE_KEY,
    );
    const followUp = rejected.corrections.find(
      (item: any) =>
        item.source === "Penolakan audit tingkat 2" &&
        item.status !== "Ditutup",
    );
    assert.equal(followUp.surveyType, "PCI");
    assert.equal(
      rejected.audits[2].baNumber,
      fixture.audits[2].baNumber,
      "Downstream audit BA must be retained",
    );
    results.push({
      result: "pass",
      kind: "audit rejection creates follow-up via browser",
    });
    await context.close();
  });
  // Period navigation is a viewing action; it must persist without invalidating the previous BA.
  await scenario("operational-2", async () => {
    const { context, page } = await setup(roles[0]);
    await page.goto(
      baseUrl +
        "/verification?testRoles=1&submodule=" +
        encodeURIComponent(selections[4]),
    );
    await openFilterPanels(page);
    const previousBa = await page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key)!).packages["PAKET-DEMO-001"].cycle
          .certificateId,
      PACKAGE_STORE_KEY,
    );
    await page
      .getByLabel("Periode pemeriksaan", { exact: true })
      .selectOption("2");
    await page.reload();
    await page.getByLabel("Periode pemeriksaan", { exact: true }).waitFor();
    assert.equal(
      await page
        .getByLabel("Periode pemeriksaan", { exact: true })
        .inputValue(),
      "2",
    );
    await page
      .getByLabel("Periode pemeriksaan", { exact: true })
      .selectOption("1");
    const ba = await page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key)!).packages["PAKET-DEMO-001"].cycle
          .certificateId,
      PACKAGE_STORE_KEY,
    );
    assert.equal(ba, previousBa);
    await page
      .getByRole("button", { name: "Ubah jadwal survei", exact: true })
      .click();
    await page
      .getByLabel("Mulai pelaksanaan survei", { exact: true })
      .fill("2027-01-01");
    await page
      .getByLabel("Selesai pelaksanaan survei", { exact: true })
      .fill("2027-12-30");
    await page
      .getByRole("button", { name: "Simpan jadwal survei", exact: true })
      .click();
    await page.reload();
    const scheduled = await page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key)!).packages["PAKET-DEMO-001"],
      PACKAGE_STORE_KEY,
    );
    assert.equal(scheduled.project.surveyEndDate, "2027-12-30");
    assert.equal(scheduled.cycle.certificateId, previousBa);
    assert.equal(scheduled.cycle.requiresReview, true);
    results.push({
      result: "pass",
      kind: "3B period and legitimate schedule edits persist without removing previous BA; changed schedule requires review",
    });
    await context.close();
  });
  // An isolated preparation scenario uses one package and real submit/revise/resubmit/approve handlers.
  await scenario("operational-3", async () => {
    const { context, page } = await setup(
      roles[0],
      false,
      undefined,
      "preparation-draft",
    );
    const url =
      baseUrl +
      "/entry?testRoles=1&submodule=" +
      encodeURIComponent(selections[0]);
    await page.goto(url);
    await openFilterPanels(page);
    await page.getByTestId("button-prep-submit").click();
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
    await actor(roles[1]);
    await page
      .getByTestId("input-prep-review-note")
      .fill("Perbaiki referensi laporan pendahuluan");
    await page.getByTestId("button-prep-revise").click();
    await actor(roles[0]);
    await page.getByTestId("button-prep-submit").click();
    await actor(roles[1]);
    await page.getByTestId("button-prep-approve").click();
    const status = await page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key)!).packages["PAKET-DEMO-001"]
          .project.preparation.reportApproval,
      PACKAGE_STORE_KEY,
    );
    assert.equal(status, "Disetujui");
    results.push({
      result: "pass",
      kind: "Stage 0 submit, revise, resubmit and approve through browser",
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(450);
    await page.screenshot({
      animations: "disabled",
      path: output + "/screenshots/mobile-stage-0.png",
      fullPage: true,
    });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2,
    );
    assert.equal(overflow, false, "Mobile page must not overflow");
    results.push({
      result: "pass",
      kind: "390px mobile stage layout without page overflow",
    });
    await context.close();
  });

  // Real BA review/rejection/revision cycle; all input is explicitly isolated test data.
  await scenario("operational-4", async () => {
    const { context, page } = await setup(roles[0], false, ["IRI"], "period-draft");
    const url =
      baseUrl +
      "/documents?testRoles=1&submodule=" +
      encodeURIComponent("/documents:BA & dokumen workflow");
    async function openDocument() {
      await page.goto(url);
      await openFilterPanels(page);
      await openBaContext(page);
      await page
        .getByLabel("Format BA", { exact: true })
        .selectOption("duaMingguan");
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
      await openDocument();
    }
    // Complete the Penyedia submission and Balai review before preparing its BA document.
    await openDocument();
    await prepareIriPeriod(page, actor);
    await actor(roles[0]);
    await page
      .getByRole("button", { name: "Lengkapi isian template", exact: true })
      .click();
    // Redesign V2 renders one BA section at a time. Visit every section,
    // fill all editable controls, and retain the real submit/review assertions.
    const sectionPicker = page.getByLabel("Bagian formulir", { exact: true });
    await sectionPicker.waitFor({ state: "visible" });
    const sectionValues = await sectionPicker.locator("option").evaluateAll(
      (options: HTMLOptionElement[]) => options.map((option) => option.value),
    );
    assert.ok(sectionValues.length > 0, "BA must provide sections");
    let editedFields = 0;
    for (const sectionValue of sectionValues) {
      await sectionPicker.selectOption(sectionValue);
      await page.locator(".ba-form-section").waitFor({ state: "visible" });
      for (const input of await page
        .locator(".ba-form-section .ba-field-row textarea:not([disabled])")
        .all()) {
        await input.fill("Isian pengujian terisolasi, bukan data pengesahan");
        editedFields++;
      }
      for (const input of await page
        .locator('.ba-form-section .ba-field-row input[type="date"]:not([disabled])')
        .all()) {
        await input.fill("2027-01-14");
        editedFields++;
      }
      for (const input of await page
        .locator(".ba-form-section .ba-field-row select:not([disabled])")
        .all()) {
        const options = await input.locator("option").count();
        if (options > 1) {
          await input.selectOption({ index: 1 });
          editedFields++;
        }
      }
    }
    assert.ok(editedFields > 0, "BA must expose editable fields");
    await page
      .getByRole("button", { name: "Ajukan pemeriksaan BA", exact: true })
      .click();
    await page
      .getByText("Menunggu pemeriksaan", { exact: true })
      .first()
      .waitFor();
    await actor(roles[1]);
    await page.getByLabel("Catatan pemeriksaan BA").fill("Koreksi dokumen uji");
    await page.getByRole("button", { name: "Tolak BA", exact: true }).click();
    await actor(roles[0]);
    await page
      .getByRole("button", { name: "Ajukan pemeriksaan BA", exact: true })
      .click();
    await actor(roles[1]);
    await page
      .getByLabel("Catatan pemeriksaan BA")
      .fill("Perjelas lokasi pada dokumen uji");
    await page
      .getByRole("button", { name: "Minta revisi BA", exact: true })
      .click();
    await actor(roles[0]);
    await page
      .getByRole("button", { name: "Lengkapi isian template", exact: true })
      .click();
    await openFirstBaTextareaSection(page);
    await page
      .locator(".ba-field-row textarea:visible")
      .first()
      .fill("Lokasi pengujian setelah koreksi");
    await page
      .getByRole("button", { name: "Ajukan pemeriksaan BA", exact: true })
      .click();
    await actor(roles[1]);
    await page
      .getByRole("button", { name: "Selesaikan pemeriksaan BA", exact: true })
      .click();
    await page
      .getByText("Pemeriksaan selesai", { exact: true })
      .first()
      .waitFor();
    await page.reload();
    await openBaContext(page);
    await page
      .getByLabel("Format BA", { exact: true })
      .selectOption("duaMingguan");
    await page
      .getByText("Pemeriksaan selesai", { exact: true })
      .first()
      .waitFor();
    const versions = await page.evaluate(
      () =>
        JSON.parse(
          localStorage.getItem(
            "jala-ba-source-v1:PAKET-DEMO-001:duaMingguan:1:IRI:1",
          )!,
        ).versions,
    );
    assert.deepEqual(
      versions.map((v: any) => v.status),
      [
        "submitted-local",
        "rejected-local",
        "submitted-local",
        "revision-requested-local",
        "submitted-local",
        "reviewed-local",
      ],
    );
    assert.ok(versions.every((v: any) => v.officiallySigned === false));

    await page.waitForTimeout(450);
    await page.screenshot({
      animations: "disabled",
      path: output + "/screenshots/ba-reviewed.png",
    });
    results.push({
      result: "pass",
      kind: "BA submit, reject, resubmit, revision, correct, approve review and refresh through real UI",
    });
    await context.close();
  });

  // Required source answers must gate a new audit decision; each audit level has independent answers.
  await scenario("operational-5", async () => {
    const { context, page } = await setup(
      roles[0],
      false,
      undefined,
      "audit-review",
    );
    const url =
      baseUrl +
      "/verification?testRoles=1&submodule=" +
      encodeURIComponent(selections[6]);
    await page.goto(url);
    await openFilterPanels(page);
    await page.getByTestId("stage5-tab-keputusan").click();
    await page.getByTestId("select-audit-status-1").selectOption("Lulus");
    assert.equal(
      await page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key)!).packages["PAKET-DEMO-001"]
            .audits[0].status,
        PACKAGE_STORE_KEY,
      ),
      "Dalam Review",
      "Blank source checklist must block Lulus",
    );
    await page.getByTestId("stage5-tab-formulir").click();
    let interacted = 0;
    for (const type of fixture.project.surveyTypes) {
      await page
        .getByLabel("Jenis survei checklist sumber", { exact: true })
        .selectOption(type);
      await fillSourceForm(page.locator(".source-exact-checklist"));
      interacted += await page
        .locator(".source-exact-checklist fieldset")
        .count();
    }
    await page.reload();
    await page.getByTestId("stage5-tab-keputusan").click();
    await page.getByTestId("select-audit-status-1").selectOption("Lulus");
    // The status selector edits a local draft; a decision is not persisted until Save.
    await page.getByTestId("button-save-audit-1").click();
    const savedAudit = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).packages["PAKET-DEMO-001"].audits[0],
      PACKAGE_STORE_KEY,
    );
    assert.equal(
      savedAudit.status,
      "Lulus",
      `Audit 1 has a seeded BA and must persist after valid source review and explicit Save; actual status=${savedAudit.status}. Inspect remaining gates.`,
    );
    await page.getByTestId("button-audit-level-2").click();
    await page.getByTestId("stage5-tab-formulir").click();
    assert.equal(
      await page
        .locator(".source-exact-checklist input[type=radio]:checked")
        .count(),
      0,
    );
    assert.equal(
      await page
        .locator(".source-exact-checklist input[type=radio]:enabled")
        .count(),
      0,
    );
    results.push({
      result: "pass",
      kind: "Audit source checklist blocks blank approval, persists after refresh and isolates levels/roles",
      sourceRadioGroupsInteracted: interacted,
    });
    await context.close();
  });

  // General attachments must store real bytes, distinguish metadata and survive refresh.
  await scenario("operational-6", async () => {
    const { context, page } = await setup(
      roles[0],
      false,
      undefined,
      "preparation-draft",
    );
    await page.goto(
      baseUrl +
        "/entry?testRoles=1&submodule=" +
        encodeURIComponent(selections[0]),
    );
    await openFilterPanels(page);
    const attachment = page.locator(".documents-area").first();
    await attachment.locator(".document-references > summary").click();
    await page
      .getByLabel("Referensi Laporan Pendahuluan", { exact: true })
      .fill("REF-UJI-METADATA");
    await attachment
      .getByText(/Referensi saja.*file belum tersimpan/)
      .waitFor();
    const bytes = fs.readFileSync(
      fileURLToPath(
        new URL("../public/ba-templates/kalibrasi.docx", import.meta.url),
      ),
    );
    await attachment
      .getByLabel("Tambah dokumen dan lampiran", { exact: true })
      .setInputFiles({
        name: "lampiran-uji.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        buffer: bytes,
      });
    await attachment.getByText("1 berkas", { exact: true }).waitFor();
    await page.reload();
    await attachment.getByText("1 berkas", { exact: true }).waitFor();
    const event = page.waitForEvent("download");
    await attachment
      .getByRole("button", { name: "Unduh", exact: true })
      .click();
    const download = await event;
    await download.saveAs(output + "/lampiran-uji.docx");
    assert.ok(fs.readFileSync(output + "/lampiran-uji.docx").equals(bytes));
    results.push({
      result: "pass",
      kind: "Attachment metadata is not file proof; real IndexedDB bytes survive refresh and download unchanged",
    });
    await context.close();
  });

  // All survey forms are exercised in one isolated package, without adding operational packages.
  await scenario("operational-7", async () => {
    const { context, page } = await setup(roles[0], true);
    await page.goto(
      baseUrl +
        "/documents?testRoles=1&submodule=" +
        encodeURIComponent(selections[1]),
    );
    await openFilterPanels(page);
    const surveys = [];
    for (const type of SURVEY_TYPES) {
      await page
        .getByRole("button", { name: new RegExp("^" + type + "(?:\\s|$)") })
        .first()
        .click();
      await revealSourceSections(page);
      for (const section of await page
        .locator(".source-exact-checklist .structured-checklist-section")
        .all())
        if ((await section.getAttribute("open")) === null)
          await section.locator(":scope > summary").click();
      const group = page.locator(".source-exact-checklist fieldset").first();
      await group.waitFor();
      await group
        .locator("input[type=radio],input[type=checkbox]")
        .first()
        .check();
      surveys.push(type);
    }
    await page.reload();
    await revealSourceSections(page);
    for (const section of await page
      .locator(".source-exact-checklist .structured-checklist-section")
      .all())
      if ((await section.getAttribute("open")) === null)
        await section.locator(":scope > summary").click();
    await page.locator(".source-exact-checklist fieldset").first().waitFor();
    assert.equal(
      await page
        .locator(".source-exact-checklist fieldset")
        .first()
        .locator("input[type=radio]")
        .first()
        .isChecked(),
      true,
    );
    results.push({
      result: "pass",
      kind: "All eight calibration survey forms use real source choices and retain answers after refresh",
      surveys,
    });
    await context.close();
  });

  await scenario("operational-8", async () => {
    const { context, page } = await setup(roles[0]);
    await page.goto(
      baseUrl +
        "/entry?testRoles=1&submodule=" +
        encodeURIComponent(selections[2]),
    );
    await openFilterPanels(page);
    await page.getByRole("button", { name: "PCI", exact: true }).click();
    await page
      .getByRole("button", { name: "PCI Berbasis AI", exact: true })
      .click();
    assert.equal(
      await page.getByTestId("button-production-submit-review").isDisabled(),
      true,
    );
    await page.reload();
    const method = await page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key)!).packages["PAKET-DEMO-001"]
          .productionTests.PCI.pciManual,
      PACKAGE_STORE_KEY,
    );
    assert.equal(method, false);
    await page.getByRole("button", { name: "PCI", exact: true }).click();
    await page.getByRole("button", { name: "PCI Manual", exact: true }).click();
    assert.equal(
      await page.evaluate(
        (key) =>
          JSON.parse(localStorage.getItem(key)!).packages["PAKET-DEMO-001"]
            .productionTests.PCI.pciManual,
        PACKAGE_STORE_KEY,
      ),
      true,
    );
    results.push({
      result: "pass",
      kind: "PCI Manual and AI switch independently through real controls; unresolved AI authorization holds submission after refresh",
    });
    await context.close();
  });
  await scenario("operational-9", async () => {
    const { context, page } = await setup(roles[0]);
    await page.goto(
      baseUrl +
        "/verification?testRoles=1&submodule=" +
        encodeURIComponent(selections[4]),
    );
    await openFilterPanels(page);
    const form = page.locator(".source-exact-checklist");
    await form
      .getByLabel("Jenis survei checklist sumber", { exact: true })
      .selectOption("PCI");
    await revealSourceSections(page);
    for (const details of await form
      .locator(".structured-checklist-section")
      .all())
      if ((await details.getAttribute("open")) === null)
        await details.locator(":scope > summary").click();
    for (const details of await form
      .locator(".source-table-section > details")
      .all())
      if ((await details.getAttribute("open")) === null)
        await details.locator(":scope > summary").click();
    await form
      .getByLabel(
        "D. ANALISIS STATISTIK KONSISTENSI, Standar Deviasi PCI, Nilai",
        { exact: true },
      )
      .fill("5.1");
    await form
      .locator("strong")
      .filter({ hasText: /^Tidak Sesuai$/ })
      .first()
      .waitFor();
    assert.equal(await form.locator("fieldset input:checked").count(), 0);
    results.push({
      result: "pass",
      kind: "PCI source scalar comparison shows exact source threshold without automatically answering reviewer choices",
    });
    await context.close();
  });
  // Restored Word controls, bridge numeric evaluation, multi-file evidence and refresh.
  await scenario("operational-10", async () => {
    const { context, page } = await setup(roles[0], true);
    await page.goto(
      baseUrl +
        "/documents?testRoles=1&submodule=" +
        encodeURIComponent(selections[1]),
    );
    await openFilterPanels(page);
    await page
      .getByRole("button", { name: /^Jembatan(?:\s|$)/ })
      .first()
      .click();
    const form = page.locator(".source-exact-checklist");
    await revealSourceSections(page);
    assert.equal(
      await form
        .locator("summary")
        .filter({ hasText: /^A\. INFORMASI UMUM$/ })
        .count(),
      1,
    );
    for (const section of await form
      .locator(".structured-checklist-section")
      .all())
      if ((await section.getAttribute("open")) === null)
        await section.locator(":scope > summary").click();
    await form
      .getByLabel(
        "M. HASIL UJI SAMPLING VALIDASI LAPANGAN, 1, Nilai Kondisi Tim Surveyor",
        { exact: true },
      )
      .fill("2");
    await form
      .getByLabel(
        "M. HASIL UJI SAMPLING VALIDASI LAPANGAN, 1, Nilai Kondisi Verifikasi",
        { exact: true },
      )
      .fill("4");
    await form.getByText("Major", { exact: true }).waitFor();
    const conclusion = form.getByRole("group", {
      name: "Peralatan Pemeriksaan · Status",
      exact: true,
    });
    await conclusion.getByLabel("Perlu Perbaikan", { exact: true }).check();
    const upload = form.getByLabel("Tambah dokumen dan lampiran", {
      exact: true,
    });
    await upload.setInputFiles([
      {
        name: "uji-1.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("Bukti uji 1"),
      },
      {
        name: "uji-2.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("Bukti uji 2"),
      },
    ]);
    await form.getByText("2 berkas", { exact: true }).waitFor();
    await page.reload();
    await page
      .getByRole("button", { name: /^Jembatan(?:\s|$)/ })
      .first()
      .click();
    await form.getByText("2 berkas", { exact: true }).waitFor();
    for (const section of await form
      .locator(".structured-checklist-section")
      .all())
      if ((await section.getAttribute("open")) === null)
        await section.locator(":scope > summary").click();
    assert.equal(
      await conclusion
        .getByLabel("Perlu Perbaikan", { exact: true })
        .isChecked(),
      true,
    );
    await form.getByText("Major", { exact: true }).waitFor();
    const firstFile = form
      .locator(".document-file")
      .filter({ has: page.getByText("uji-1.txt", { exact: true }) });
    await firstFile
      .locator("details")
      .first()
      .locator(":scope > summary")
      .click();
    const linkSelect = firstFile.getByLabel("Tambah keterkaitan uji-1.txt", {
      exact: true,
    });
    const choices = await linkSelect
      .locator('optgroup[label="Butir pemeriksaan"] option')
      .evaluateAll((options) =>
        options
          .slice(0, 2)
          .map((option) => (option as HTMLOptionElement).value),
      );
    assert.equal(choices.length, 2);
    for (const value of choices) await linkSelect.selectOption(value);
    await firstFile
      .getByText(/2 butir/)
      .first()
      .waitFor();
    await page.goto(
      baseUrl +
        "/verification?testRoles=1&submodule=" +
        encodeURIComponent(selections[4]),
    );
    await openFilterPanels(page);
    const periodFiles = page.locator(".source-exact-checklist .documents-area");
    await periodFiles
      .getByRole("button", { name: "Gunakan berkas tersimpan", exact: true })
      .click();
    const reuse = periodFiles.getByLabel(
      "Pilih berkas tersimpan untuk kategori ini",
      { exact: true },
    );
    const saved = await reuse
      .locator("option")
      .filter({ hasText: "uji-1.txt" })
      .getAttribute("value");
    assert.ok(saved);
    await reuse.selectOption(saved!);
    await periodFiles.getByText("1 berkas", { exact: true }).waitFor();
    const downloadEvent = page.waitForEvent("download");
    await periodFiles
      .getByRole("button", { name: "Unduh", exact: true })
      .click();
    await (await downloadEvent).saveAs(output + "/reused-evidence.txt");
    assert.equal(
      fs.readFileSync(output + "/reused-evidence.txt", "utf8"),
      "Bukti uji 1",
    );
    page.once("dialog", (dialog) => dialog.accept());
    await periodFiles
      .getByRole("button", {
        name: "Lepaskan uji-1.txt dari lampiran",
        exact: true,
      })
      .click();
    await periodFiles.getByText("0 berkas", { exact: true }).waitFor();
    await page.goto(
      baseUrl +
        "/documents?testRoles=1&submodule=" +
        encodeURIComponent(selections[1]),
    );
    await openFilterPanels(page);
    await page
      .getByRole("button", { name: /^Jembatan(?:\s|$)/ })
      .first()
      .click();
    await form.getByText("2 berkas", { exact: true }).waitFor();
    const restored = form
      .locator(".document-file")
      .filter({ has: page.getByText("uji-1.txt", { exact: true }) });
    const settings = restored.locator("details.document-advanced").first();
    if ((await settings.getAttribute("open")) === null)
      await settings.locator(":scope > summary").click();
    await restored
      .getByText(/2 butir/)
      .first()
      .waitFor();
    results.push({
      result: "pass",
      kind: "One real file links to two source items, reuses across activities, retains history and remains after unlink/refresh",
    });
    await page.screenshot({
      path: output + "/screenshots/bridge-complete-form.png",
      fullPage: true,
    });
    results.push({
      result: "pass",
      kind: "Bridge A/M/N/O form structure, original nested choices, exact Major evaluation and two real attachments persist",
    });
    await context.close();
  });
  assert.deepEqual(errors, []);
  completed = true;
  fs.writeFileSync(
    output + "/browser-results.json",
    JSON.stringify(
      { results, errors, completeJourneyFromBlank: false },
      null,
      2,
    ),
  );
  console.log(
    `PASS ${results.length} browser checks; scope=${selectedScenario ?? "all"}; no page errors`,
  );
} catch (error) {
  errors.push(
    error instanceof Error ? (error.stack ?? error.message) : String(error),
  );
  throw error;
} finally {
  fs.writeFileSync(
    output + "/browser-results.json",
    JSON.stringify(
      {
        results,
        errors,
        completed,
        selectedScenario: selectedScenario ?? null,
        completeJourneyFromBlank: false,
      },
      null,
      2,
    ),
  );
  await browser.close();
  await server.close();
}
