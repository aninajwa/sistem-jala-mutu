import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { preview } from "vite";
import { createDemoWorkflow } from "../src/workflow/demoScenario";
import { PACKAGE_STORE_KEY } from "../src/workflow/packageStore";
import { WORKFLOW_ROLE_OPTIONS } from "../src/workflow/workflowConfig";

const output = process.env.TEST_ARTIFACTS ?? "test-artifacts/continuation";
const outDir = process.env.V2_PREVIEW_DIR;
if (!outDir) throw new Error("V2_PREVIEW_DIR is required");
await mkdir(output, { recursive: true });
const origin = "http://127.0.0.1:5231";
const server = await preview({ build: { outDir }, preview: { host: "127.0.0.1", port: 5231, strictPort: true } });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE, args: ["--no-sandbox"] });
const results: { check: string; ok: boolean; error?: string }[] = [];
async function verify(check: string, action: () => Promise<void>) {
  try {
    await action();
    results.push({ check, ok: true });
  } catch (error) {
    results.push({ check, ok: false, error: String(error) });
    console.error(check, error);
  }
}
function url(path: string, params: Record<string, string> = {}) {
  return origin + path + "?" + new URLSearchParams({ testRoles: "1", ...params });
}
try {
  for (const [index, role] of WORKFLOW_ROLE_OPTIONS.entries()) {
    const fixture = createDemoWorkflow("verval-finding");
    fixture.role = role;
    const correction = fixture.corrections.find((item) => item.status === "Terbuka") ?? fixture.corrections[0];
    assert.ok(correction);
    const context = await browser.newContext({ viewport: { width: index ? 1440 : 390, height: 950 } });
    await context.addInitScript(({ key, fixture, correctionId, role }) => {
      if (window.top !== window || sessionStorage.getItem("continuation-fixture")) return;
      sessionStorage.setItem("continuation-fixture", "1");
      localStorage.setItem("jala-mutu-demo-session-v1", "active");
      localStorage.setItem(`jala-correction-selection:${fixture.project.id}`, correctionId);
      localStorage.setItem(key, JSON.stringify({ activeRole: role, activePackageId: fixture.project.id, packages: { [fixture.project.id]: fixture } }));
    }, { key: PACKAGE_STORE_KEY, fixture, correctionId: correction.id, role });
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    await verify(`Tahap 6 · ${role}`, async () => {
      await page.goto(url("/reports", { submodule: "/reports:Penerimaan & termin" }));
      await page.locator(".v2-stage-scene").waitFor();
      const editor = page.getByTestId("input-final-acceptance-ba");
      assert.equal(await editor.count(), index === 1 ? 1 : 0);
      if (index !== 1) await page.getByRole("heading", { name: "Hasil penerimaan Balai" }).waitFor();
      await page.screenshot({ path: join(output, `acceptance-${index}.png`) });
    });
    await verify(`Tahap 3A · ${role}`, async () => {
      await page.goto(url("/entry", { submodule: "/entry:Survei harian" }));
      await page.locator(".v2-stage-scene").waitFor();
      assert.equal(await page.locator('[aria-label="Pencatatan kegiatan harian"]').count(), index === 0 ? 1 : 0);
      if (index !== 0) await page.getByRole("heading", { name: "Monitoring kegiatan lapangan" }).waitFor();
    });
    if (index === 0) {
      await verify("Tindakan Perbaikan · formulir fase terpisah dan histori", async () => {
        await page.goto(url("/actions", { submodule: "/actions:Koreksi berbukti" }));
        const nav = page.getByRole("navigation", { name: "Bagian kasus" });
        await nav.getByRole("button", { name: "Temuan", exact: true }).click();
        await page.getByRole("heading", { name: "Temuan dan bukti sumber" }).waitFor();
        assert.equal(await page.locator(".correction-proposal").count(), 0);
        await nav.getByRole("button", { name: "Rencana tindakan", exact: true }).click();
        await page.getByRole("heading", { name: "Rencana tindakan dan bukti" }).waitFor();
        await page.screenshot({ path: join(output, "correction-proposal-mobile.png") });
        await nav.getByRole("button", { name: "Riwayat", exact: true }).click();
        await page.getByRole("heading", { name: "Riwayat kasus", exact: true }).waitFor();
        assert.equal(await page.locator(".correction-proposal").count(), 0);
      });
      await verify("BA · pemilih kelompok dan kelengkapan isian", async () => {
        await page.goto(url("/documents", { tab: "Siapkan BA" }));
        await page.getByRole("button", { name: "Mulai siapkan BA" }).click();
        await page.getByRole("button", { name: "Lengkapi isian template" }).click();
        const section = page.getByLabel("Bagian formulir", { exact: true });
        await section.waitFor();
        const options = await section.locator("option").allTextContents();
        assert.ok(options.length > 1);
        assert.equal(await page.locator(".ba-form-section").count(), 1);
        await section.selectOption({ label: options[1] });
        await page.locator(".ba-form-section").getByRole("heading", { name: options[1], exact: true }).waitFor();
        assert.equal(await page.locator(".ba-form-section").count(), 1);
        await page.getByText(/dari \d+ isian wajib lengkap/).waitFor();
        await page.screenshot({ path: join(output, "ba-group-mobile.png") });
      });
      await verify("Rekap dan Ekspor · satu navigasi dan judul spesifik", async () => {
        await page.goto(url("/reports", { tab: "Rekap & Ekspor" }));
        await page.getByTestId("button-export-report").waitFor();
        assert.equal(await page.locator(".rv-nav").count(), 0);
        await page.screenshot({ path: join(output, "report-recap-mobile.png") });
      });
    }
    await context.close();
  }
} finally {
  await writeFile(join(output, "matrix.json"), JSON.stringify(results, null, 2));
  await browser.close();
  server.httpServer.close();
}
if (results.some((record) => !record.ok)) process.exitCode = 1;
