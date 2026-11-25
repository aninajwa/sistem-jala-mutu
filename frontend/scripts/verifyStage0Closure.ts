import { openFilterPanels } from "./filterInteractions";
import { fillPreparationChecklist } from "./sourceFormInteractions";
/**
 * JALA MUTU — audit browser terisolasi Tahap 0: pengajuan, revisi, persetujuan,
 * proteksi pengajuan ulang, dan batas tombol untuk empat role.
 * Jalankan dari frontend: node --import tsx scripts/verifyStage0Closure.ts
 * Tidak mengubah data browser pengguna ataupun berkas kerja proyek.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import { zipSync, strToU8 } from "fflate";
import { createDemoWorkflow } from "../src/workflow/demoScenario";
import { PACKAGE_STORE_KEY } from "../src/workflow/packageStore";
import { evaluateStageGate } from "../src/workflow/workflowGate";
import type { WorkflowRole } from "../src/workflow/model";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const out =
  process.env.TEST_ARTIFACTS ||
  path.join(ROOT, "test-artifacts", "stage0-closure");
fs.mkdirSync(out, { recursive: true });
const host = "http://127.0.0.1:5189";
const route = `${host}/entry?testRoles=1&submodule=${encodeURIComponent("/entry:Persiapan & SPMK")}`;
const PACKAGE_ID = "PAKET-UJI-CLOSURE-TAHAP0";
const provider: WorkflowRole = "Penyedia Jasa / Ketua Tim";
const balai: WorkflowRole = "PIC Balai / Pengguna Jasa";
const directorate: WorkflowRole = "Direktorat / Pusat";
const admin: WorkflowRole = "Admin";
const state = createDemoWorkflow("start");
state.project.id = PACKAGE_ID;
state.project.packageName = "Paket Uji Terisolasi Tahap 0";
state.project.spmkDate = "2027-03-01";
state.project.preparation.reportApproval = "Draft";
state.project.preparation.reviewerNote = "";
for (const group of [
  "sourceReviews",
  "fieldPlan",
  "coordination",
  "documents",
] as const) {
  for (const k of Object.keys(state.project.preparation[group]))
    state.project.preparation[group][k] = false;
}
state.role = provider;
const server = await createServer({
  configFile: path.join(ROOT, "vite.config.ts"),
  server: { host: "127.0.0.1", port: 5189, strictPort: true },
});
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
const results: { test: string; status: "PASS" | "FAIL"; detail?: string }[] =
  [];
const errors: string[] = [];
let page: import("playwright").Page | undefined;
let ctx: import("playwright").BrowserContext | undefined;
async function check(name: string, run: () => Promise<void>) {
  try {
    await run();
    results.push({ test: name, status: "PASS" });
    console.log("PASS", name);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    results.push({ test: name, status: "FAIL", detail: message });
    console.error("FAIL", name, message);
    throw e;
  }
}
function snapshot() {
  return page!.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) throw Error("Store uji tidak ada");
    return JSON.parse(raw).packages["PAKET-UJI-CLOSURE-TAHAP0"];
  }, PACKAGE_STORE_KEY);
}
async function actor(role: WorkflowRole) {
  await page!.evaluate(
    ({ key, role, id }) => {
      const store = JSON.parse(localStorage.getItem(key)!);
      store.activeRole = role;
      store.packages[id].role = role;
      localStorage.setItem(key, JSON.stringify(store));
    },
    { key: PACKAGE_STORE_KEY, role, id: PACKAGE_ID },
  );
  await page!.reload();
  await page!.getByTestId("operational-workflow-workspace").waitFor();
}
async function screenshot(name: string, mobile = false) {
  await page!.setViewportSize(
    mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
  );
  await page!.screenshot({
    path: path.join(out, `${name}-${mobile ? "mobile" : "desktop"}.png`),
    fullPage: true,
    animations: "disabled",
  });
  assert.equal(
    await page!.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2,
    ),
    false,
    `${name}: overflow horizontal`,
  );
}
try {
  await server.listen();
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.CHROMIUM_EXECUTABLE }
      : {}),
    args: process.env.CHROMIUM_EXECUTABLE
      ? ["--no-sandbox", "--disable-dev-shm-usage"]
      : [],
  });
  ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await ctx.addInitScript(
    ({ key, id, state }) => {
      if (
        location.origin !== "http://127.0.0.1:5189" ||
        sessionStorage.getItem("stage0-closure-seeded")
      )
        return;
      sessionStorage.setItem("stage0-closure-seeded", "yes");
      localStorage.setItem(
        key,
        JSON.stringify({
          activePackageId: id,
          activeRole: state.role,
          packages: { [id]: state },
        }),
      );
      localStorage.setItem("jala-mutu-demo-session-v1", "active");
    },
    { key: PACKAGE_STORE_KEY, id: PACKAGE_ID, state },
  );
  page = await ctx.newPage();
  page.on("pageerror", (err) => errors.push(err.message));
  await page.goto(route);
  await openFilterPanels(page);
  await page.getByTestId("operational-workflow-workspace").waitFor();
  await check(
    "Penyedia: Draft belum lengkap tidak dapat diajukan",
    async () => {
      assert.equal(
        (await snapshot()).project.preparation.reportApproval,
        "Draft",
      );
      assert.equal(
        await page!.getByTestId("button-prep-submit").isDisabled(),
        true,
      );
    },
  );
  await check("Penyedia: checklist lengkap dapat diajukan", async () => {
    await fillPreparationChecklist(page!);
    assert.equal(
      await page!.getByTestId("button-prep-submit").isEnabled(),
      true,
    );
    await page!.getByTestId("button-prep-submit").click();
    assert.equal(
      (await snapshot()).project.preparation.reportApproval,
      "Diajukan",
    );
  });
  await screenshot("penyedia-menunggu");
  await check("Balai: dapat meminta revisi dengan catatan", async () => {
    await actor(balai);
    assert.equal(await page!.getByTestId("button-prep-submit").count(), 0);
    await page!
      .getByTestId("input-prep-review-note")
      .fill("Mohon lengkapi referensi awal dan bukti koordinasi.");
    await page!.getByTestId("button-prep-revise").click();
    assert.equal(
      (await snapshot()).project.preparation.reportApproval,
      "Perlu Revisi",
    );
  });
  await screenshot("balai-revisi");
  await check("Penyedia: boleh ajukan ulang setelah revisi", async () => {
    await actor(provider);
    assert.equal(
      await page!.getByTestId("button-prep-submit").isEnabled(),
      true,
    );
    await page!.getByTestId("button-prep-submit").click();
    assert.equal(
      (await snapshot()).project.preparation.reportApproval,
      "Diajukan",
    );
  });
  await check(
    "Balai: dapat menyetujui dan gate Tahap 0 menjadi siap",
    async () => {
      await actor(balai);
      await page!.getByTestId("button-prep-approve").click();
      const updated = await snapshot();
      assert.equal(updated.project.preparation.reportApproval, "Disetujui");
      assert.equal(evaluateStageGate(updated, "Tahap 0").readyToComplete, true);
    },
  );
  await screenshot("balai-disetujui");
  await check(
    "Penyedia: persetujuan tidak bisa ditimpa, termasuk setelah refresh",
    async () => {
      await actor(provider);
      assert.equal(
        await page!.getByTestId("button-prep-submit").isDisabled(),
        true,
      );
      await page!.reload();
      assert.equal(
        (await snapshot()).project.preparation.reportApproval,
        "Disetujui",
      );
      assert.equal(
        await page!.getByTestId("button-prep-submit").isDisabled(),
        true,
      );
    },
  );
  await screenshot("penyedia-disetujui", true);
  await check(
    "Direktorat dan Admin: tidak memiliki tombol keputusan Tahap 0",
    async () => {
      for (const role of [directorate, admin]) {
        await actor(role);
        for (const id of [
          "button-prep-submit",
          "button-prep-approve",
          "button-prep-revise",
        ])
          assert.equal(
            await page!.getByTestId(id).count(),
            0,
            `${role}: ${id}`,
          );
        await screenshot(
          role === directorate ? "direktorat-pantau" : "admin-pantau",
          true,
        );
      }
    },
  );
  assert.deepEqual(errors, [], "Tidak boleh ada pageerror JavaScript");
} catch (e) {
  console.error("Audit Tahap 0 mendeteksi kegagalan:", e);
} finally {
  await ctx?.close().catch(() => {});
  await browser?.close().catch(() => {});
  await server.close().catch(() => {});
  const summary = {
    total: results.length,
    passed: results.filter((r) => r.status === "PASS").length,
    failed: results.filter((r) => r.status === "FAIL").length,
    errors,
    results,
    notes: [
      "Tidak memvalidasi keabsahan berkas lampiran server.",
      "Skenario dibuat dari data uji terisolasi; bukan persetujuan nyata.",
    ],
  };
  fs.writeFileSync(
    path.join(out, "summary.json"),
    JSON.stringify(summary, null, 2),
  );
  const entries: Record<string, Uint8Array> = {};
  for (const filename of fs.readdirSync(out)) {
    if (filename.endsWith(".png") || filename === "summary.json")
      entries[filename] = new Uint8Array(
        fs.readFileSync(path.join(out, filename)),
      );
  }
  fs.writeFileSync(
    path.join(out, "stage0-closure.zip"),
    Buffer.from(zipSync(entries, { level: 5 })),
  );
  console.log(
    "HASIL AUDIT TAHAP 0:",
    JSON.stringify({
      total: summary.total,
      passed: summary.passed,
      failed: summary.failed,
      jsErrors: errors.length,
    }),
  );
  console.log("Artefak:", path.join(out, "stage0-closure.zip"));
  if (summary.failed || errors.length || summary.total !== 7)
    process.exitCode = 1;
}
