import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { createServer, preview } from "vite";
import { createDemoWorkflow } from "../src/workflow/demoScenario";
import { PACKAGE_STORE_KEY } from "../src/workflow/packageStore";
import { WORKFLOW_ROLE_OPTIONS } from "../src/workflow/workflowConfig";
import { buildRoleNavigation, PACKAGE_WORKFLOW_ITEMS } from "../src/workflow/roleNavigation";
import { stagePresentation } from "../src/design/c/stagePresentation";

const output = process.env.TEST_ARTIFACTS ?? "test-artifacts/v2";
await mkdir(output, { recursive: true });
const port = 5227;
const previewDir = process.env.V2_PREVIEW_DIR;
const server = previewDir
  ? await preview({ build: { outDir: previewDir }, preview: { host: "127.0.0.1", port, strictPort: true } })
  : await createServer({ server: { host: "127.0.0.1", port, strictPort: true } });
if ("listen" in server) await server.listen();

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE, args: ["--no-sandbox"] });
const results: { check: string; ok: boolean; error?: string }[] = [];
const origin = `http://127.0.0.1:${port}`;
const audit = PACKAGE_WORKFLOW_ITEMS.find((item) => item.code === "Tahap 5")!;
const url = (selection: string) => `${origin}${selection.split(":")[0]}?testRoles=1&submodule=${encodeURIComponent(selection)}`;

async function verify(check: string, action: () => Promise<void>) {
  try {
    await action();
    results.push({ check, ok: true });
  } catch (error) {
    results.push({ check, ok: false, error: String(error) });
    console.error(check, String(error));
  }
  await writeFile(join(output, "matrix.json"), JSON.stringify(results, null, 2));
}

try {
  for (const [index, role] of WORKFLOW_ROLE_OPTIONS.entries()) {
    const fixture = createDemoWorkflow("complete");
    fixture.role = role;
    const context = await browser.newContext();
    await context.addInitScript(({ key, role, fixture }) => {
      if (window.top !== window || sessionStorage.getItem("v2-fixture")) return;
      sessionStorage.setItem("v2-fixture", "1");
      localStorage.setItem("jala-mutu-demo-session-v1", "active");
      localStorage.setItem(key, JSON.stringify({
        activeRole: role,
        activePackageId: fixture.project.id,
        packages: { [fixture.project.id]: fixture },
      }));
    }, { key: PACKAGE_STORE_KEY, role, fixture });
    const page = await context.newPage();
    page.setDefaultTimeout(6000);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      for (const stage of PACKAGE_WORKFLOW_ITEMS) {
        const name = `role-${index}-${width}-stage-${stage.code.replace("Tahap ", "")}`;
        await verify(name, async () => {
          await page.goto(url(stage.selection));
          const layout = page.locator(".v2-stage-scene");
          await layout.waitFor();
          assert.equal(await layout.getAttribute("data-mode"), stagePresentation(role, stage.code).mode);
          await page.screenshot({ path: join(output, name + ".png"), animations: "disabled" });
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        });
      }
      if (index === 0 && width === 390) {
        await verify("Drawer mobile memilih submenu lintas modul", async () => {
          await page.goto(`${origin}/?testRoles=1`);
          await page.getByTestId("button-open-navigation").click();
          const menu = page.locator(".sidebar");
          await menu.getByRole("button", { name: "Dokumen Mutu", exact: true }).click();
          await menu.getByRole("button", { name: "Siapkan BA", exact: true }).click();
          await page.locator("#main-content").getByRole("heading", { name: "Siapkan BA", exact: true }).first().waitFor();
          assert.equal(new URL(page.url()).searchParams.get("tab"), "Siapkan BA");
        });
      }
      if (index === 0) {
        for (const item of buildRoleNavigation(role, false, "Tahap 0")) {
          for (const child of item.children.filter((entry) => entry.href)) {
            const name = `provider-${width}-${child.label.replace(/[^\p{L}\p{N}]+/gu, "-")}`;
            await verify(name, async () => {
              const query = new URLSearchParams({ testRoles: "1", tab: child.tab ?? "Semua" });
              await page.goto(`${origin}${child.href}?${query}`);
              await page.locator(".topbar").waitFor();
              await page.locator("#main-content h1, #main-content h2").first().waitFor();
              await page.screenshot({ path: join(output, name + ".png"), animations: "disabled" });
              assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
            });
          }
        }
      }
    }
    if (role === "Direktorat / Pusat") {
      await verify("Catatan, refresh, tanda baca, dan isolasi workflow", async () => {
        await page.goto(url(audit.selection));
        const original = await page.evaluate((key) => localStorage.getItem(key), PACKAGE_STORE_KEY);
        await page.getByRole("button", { name: "Tambah catatan" }).click();
        await page.getByLabel("Catatan untuk Penyedia").fill("Periksa kembali keterbacaan bukti audit.");
        await page.getByRole("button", { name: "Simpan catatan" }).click();
        await page.getByText("Periksa kembali keterbacaan bukti audit.").waitFor();
        await page.screenshot({ path: join(output, "directorate-context-note.png") });
        assert.equal(await page.evaluate((key) => localStorage.getItem(key), PACKAGE_STORE_KEY), original);
        await page.evaluate((key) => {
          const snapshot = JSON.parse(localStorage.getItem(key)!);
          snapshot.activeRole = "Penyedia Jasa / Ketua Tim";
          localStorage.setItem(key, JSON.stringify(snapshot));
        }, PACKAGE_STORE_KEY);
        await page.reload();
        await page.getByRole("button", { name: /1 belum dibaca/ }).click();
        const beforeRead = await page.evaluate((key) => localStorage.getItem(key), PACKAGE_STORE_KEY);
        await page.getByRole("button", { name: "Tandai dibaca" }).click();
        assert.equal(await page.getByRole("button", { name: "Tandai dibaca" }).count(), 0);
        assert.equal(await page.evaluate((key) => localStorage.getItem(key), PACKAGE_STORE_KEY), beforeRead);
        await page.reload();
        await page.getByRole("button", { name: "Catatan audit Balai", exact: true }).click();
        await page.getByText("Periksa kembali keterbacaan bukti audit.").waitFor();
        assert.equal(await page.getByRole("button", { name: "Tandai dibaca" }).count(), 0);
      });
    }
    await context.close();
  }
} finally {
  await browser.close();
  if ("close" in server) await server.close();
  else server.httpServer.close();
}
if (results.some((entry) => !entry.ok)) process.exitCode = 1;
