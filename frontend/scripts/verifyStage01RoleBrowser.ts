import { openFilterPanels } from "./filterInteractions";
/** JALA MUTU — isolated stage 0–1 role and responsive browser audit.
 * Copy into frontend/scripts/ and run: node --import tsx scripts/verifyStage01RoleBrowser.ts
 * Does not overwrite application or user records. Uses a separate Playwright context.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { createServer } from "vite";
import { zipSync } from "fflate";
import { createDemoWorkflow } from "../src/workflow/demoScenario";
import { PACKAGE_STORE_KEY } from "../src/workflow/packageStore";
import type { WorkflowRole } from "../src/workflow/model";

const roleCases: Array<{ id: string; role: WorkflowRole }> = [
  { id: "penyedia", role: "Penyedia Jasa / Ketua Tim" },
  { id: "balai", role: "PIC Balai / Pengguna Jasa" },
  { id: "direktorat", role: "Direktorat / Pusat" },
  { id: "admin", role: "Admin" },
];
const stages = [
  { stage: 0 as const, url: "/entry", submodule: "/entry:Persiapan & SPMK" },
  {
    stage: 1 as const,
    url: "/documents",
    submodule: "/documents:Kalibrasi & personel",
  },
];
const port = 5191;
const base = `http://127.0.0.1:${port}`;
const output = path.resolve(
  process.env.TEST_ARTIFACTS || "test-artifacts/stage01-role-browser",
);
fs.mkdirSync(output, { recursive: true });
const seed = createDemoWorkflow("complete");
seed.project.id = "AUDIT-STAGE01-ROLE-ISOLATED";
seed.project.packageName = "Paket Audit Terisolasi Tahap 0–1";
const results: Array<Record<string, unknown>> = [];
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
let server: Awaited<ReturnType<typeof createServer>> | undefined;
let failures = 0;
try {
  server = await createServer({
    configFile: path.resolve("vite.config.ts"),
    server: { host: "127.0.0.1", port, strictPort: true },
  });
  await server.listen();
  const browserArgs = process.env.CHROMIUM_EXECUTABLE
    ? {
        executablePath: process.env.CHROMIUM_EXECUTABLE,
        headless: true,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      }
    : { headless: true };
  browser = await chromium.launch(browserArgs);
  for (const { id, role } of roleCases) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      acceptDownloads: false,
    });
    const fixture = structuredClone(seed);
    fixture.role = role;
    await context.addInitScript(
      ({ key, state, role }) => {
        if (
          location.origin !== `http://127.0.0.1:${5191}` ||
          sessionStorage.getItem("audit-stage01-initialized")
        )
          return;
        sessionStorage.setItem("audit-stage01-initialized", "true");
        localStorage.setItem(
          key,
          JSON.stringify({
            activePackageId: state.project.id,
            activeRole: role,
            packages: { [state.project.id]: state },
          }),
        );
        localStorage.setItem("jala-mutu-demo-session-v1", "active");
      },
      { key: PACKAGE_STORE_KEY, state: fixture, role },
    );
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));
    try {
      for (const { stage, url, submodule } of stages) {
        for (const device of ["desktop", "mobile"] as const) {
          await page.setViewportSize(
            device === "desktop"
              ? { width: 1440, height: 900 }
              : { width: 390, height: 844 },
          );
          const name = `${id}-${device}-tahap${stage}`;
          const issues: string[] = [];
          try {
            await page.goto(
              base +
                url +
                "?testRoles=1&submodule=" +
                encodeURIComponent(submodule),
              { waitUntil: "domcontentloaded" },
            );
            await openFilterPanels(page);
            const guide =
              stage === 0
                ? page.locator(".stage0-compact-status")
                : page.getByTestId(`role-journey-stage-${stage}`);
            await guide.waitFor({ state: "visible", timeout: 20000 });
            if (stage === 0) {
              assert.ok((await guide.innerText()).includes("Checklist:"));
              assert.equal(
                await page.locator(".stage0-compact-status").count(),
                1,
              );
              assert.equal(
                await page.locator(".stage0-step-form").count(),
                role === "Penyedia Jasa / Ketua Tim" ? 1 : 0,
              );
            } else {
              const guideText = await guide.innerText();
              assert(guideText.trim().length > 75, "Panduan tugas kosong");
              const href = await guide
                .locator('a[href^="#"]')
                .first()
                .getAttribute("href");
              assert(href, "Tombol navigasi panduan tidak ditemukan");
              assert.equal(await page.locator(href).count(), 1);
              assert.equal(await guide.count(), 1);
            }
            if (stage === 0) {
              const approval = await page
                .getByTestId("button-prep-approve")
                .count();
              const revise = await page
                .getByTestId("button-prep-revise")
                .count();
              const submit = await page
                .getByTestId("button-prep-submit")
                .count();
              assert.equal(
                approval,
                role === "PIC Balai / Pengguna Jasa" ? 1 : 0,
                "Tombol setujui Tahap 0 salah role",
              );
              assert.equal(
                revise,
                role === "PIC Balai / Pengguna Jasa" ? 1 : 0,
                "Tombol revisi Tahap 0 salah role",
              );
              assert.equal(
                submit,
                role === "Penyedia Jasa / Ketua Tim" ? 1 : 0,
                "Tombol pengajuan Tahap 0 salah role",
              );
            } else {
              const add = await page
                .getByTestId("button-open-calibration-form")
                .count();
              assert.equal(
                add,
                role === "Penyedia Jasa / Ketua Tim" ? 1 : 0,
                "Tombol ubah alat/personel salah role",
              );
              const save = await page
                .getByTestId("button-save-source-calibration")
                .count();
              assert.equal(
                save,
                role === "Penyedia Jasa / Ketua Tim" ? 1 : 0,
                "Tombol simpan checklist salah role",
              );
            }
            const overflow = await page.evaluate(() => ({
              scroll: document.documentElement.scrollWidth,
              viewport: window.innerWidth,
              overflow:
                document.documentElement.scrollWidth > window.innerWidth + 2,
            }));
            assert.equal(
              overflow.overflow,
              false,
              `Halaman melebar ${overflow.scroll}px dari viewport ${overflow.viewport}px`,
            );
            if (pageErrors.length)
              issues.push(
                ...pageErrors.splice(0).map((x) => "JavaScript: " + x),
              );
          } catch (error) {
            issues.push(error instanceof Error ? error.message : String(error));
          }
          await page
            .screenshot({
              path: path.join(output, name + ".png"),
              fullPage: true,
              animations: "disabled",
            })
            .catch((e) => issues.push("Screenshot: " + String(e)));
          const passed = issues.length === 0;
          if (!passed) failures++;
          results.push({ name, role, stage, device, passed, issues });
          console.log(
            (passed ? "PASS " : "FAIL ") +
              name +
              (passed ? "" : ": " + issues.join(" | ")),
          );
        }
      }
    } finally {
      await context.close();
    }
  }
} catch (error) {
  failures++;
  results.push({
    name: "setup",
    passed: false,
    issues: [error instanceof Error ? error.message : String(error)],
  });
  console.error("Audit browser gagal dimulai:", error);
} finally {
  await browser?.close().catch(() => {});
  await server?.close().catch(() => {});
  const summary = {
    timestamp: new Date().toISOString(),
    cases: results.length,
    passed: results.filter((x) => x.passed).length,
    failed: failures,
    results,
  };
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify(summary, null, 2),
  );
  const entries: Record<string, Uint8Array> = {};
  for (const filename of fs.readdirSync(output)) {
    if (filename.endsWith(".png") || filename === "summary.json")
      entries[filename] = new Uint8Array(
        fs.readFileSync(path.join(output, filename)),
      );
  }
  fs.writeFileSync(
    path.join(output, "stage01-role-browser.zip"),
    Buffer.from(zipSync(entries, { level: 3 })),
  );
  console.log(
    "\nAUDIT TAHAP 0–1:",
    JSON.stringify({
      cases: summary.cases,
      passed: summary.passed,
      failed: summary.failed,
    }),
  );
  console.log("Hasil:", path.join(output, "stage01-role-browser.zip"));
  if (failures) process.exitCode = 1;
}
