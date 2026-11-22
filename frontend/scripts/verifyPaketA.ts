import { openFilterPanels,openAccountMenu } from "./filterInteractions";
/** Paket A: entry, role routes, responsive shell, stepper, logout, production isolation. */
import { chromium } from "playwright";
import { createServer, preview } from "vite";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createDemoWorkflow } from "../src/workflow/demoScenario";
import { PACKAGE_STORE_KEY } from "../src/workflow/packageStore";
import {
  WORKFLOW_ROLE_OPTIONS,
  ROLE_ROUTE_ACCESS,
} from "../src/workflow/workflowConfig";
const before = process.env.PAKET_A_BEFORE === "1";
const root = path.resolve(
  process.env.PAKET_A_OUTPUT || "test-artifacts/paket-a",
);
fs.mkdirSync(root, { recursive: true });
const server = await createServer({
  server: { host: "127.0.0.1", port: 5192, strictPort: true },
});
await server.listen();
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const results: Array<{ name: string; ok: boolean; error?: string }> = [];
const errors: string[] = [];
async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, error: String(e) });
    console.error("FAIL", name, String(e));
  }
}
async function shot(page: any, name: string) {
  await page.screenshot({
    path: path.join(root, name + ".png"),
    fullPage: true,
    animations: "disabled",
    timeout: 20000,
  });
}
const dimensions = [
  { width: 1440, height: 1000, name: "desktop" },
  { width: 390, height: 844, name: "mobile" },
];
try {
  for (const size of dimensions) {
    const context = await browser.newContext({ viewport: size });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:5192/");
    await page.locator("h1").first().waitFor();
    await shot(page, "entry-" + size.name);
    if (!before) {
      await check("Login unavailable " + size.name, async () => {
        assert.equal(
          await page
            .getByRole("button", { name: "Masuk", exact: true })
            .isDisabled(),
          true,
        );
        await page.getByLabel("Nama pengguna").fill("uji");
        await page.getByLabel("Kata sandi", { exact: true }).fill("rahasia");
        await page
          .getByRole("button", { name: "Tampilkan kata sandi" })
          .click();
        assert.equal(
          await page
            .getByLabel("Kata sandi", { exact: true })
            .getAttribute("type"),
          "text",
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
      });
    }
    await context.close();
  }
  for (const [index, role] of WORKFLOW_ROLE_OPTIONS.entries()) {
    const context = await browser.newContext();
    const workflow = createDemoWorkflow("complete");
    workflow.role = role;
    await context.addInitScript(
      ({ key, workflow, role }) => {
        if (sessionStorage.getItem("paket-a-seed")) return;
        sessionStorage.setItem("paket-a-seed", "1");
        localStorage.setItem(
          key,
          JSON.stringify({
            activePackageId: workflow.project.id,
            activeRole: role,
            packages: { [workflow.project.id]: workflow },
          }),
        );
        localStorage.setItem("jala-mutu-demo-session-v1", "active");
      },
      { key: PACKAGE_STORE_KEY, workflow, role },
    );
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    for (const size of dimensions) {
      await page.setViewportSize(size);
      await page.goto("http://127.0.0.1:5192/?testRoles=1");
      await page.locator(".topbar").waitFor();
      await openFilterPanels(page);
      if (!before) await page.locator(".b-dashboard").waitFor();
      await shot(page, `role-${index}-${size.name}`);
      if (!before)
        await check(role + " shell " + size.name, async () => {
          await openAccountMenu(page);
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth + 2,
            ),
            false,
          );
          assert.equal(
            await page.getByTestId("button-logout").isVisible(),
            true,
          );
          if (size.name === "desktop") {
            const sidebar = await page.locator(".sidebar").boundingBox();
            const main = await page.locator(".main-area").boundingBox();
            assert.ok(sidebar && main);
            assert.ok(
              Math.abs(main.x - (sidebar.x + sidebar.width)) <= 2,
              "Desktop content must begin next to the sidebar without a duplicate gutter",
            );
          }
          if (size.name === "mobile") {
            assert.ok(
              (await page.getByTestId("button-logout").boundingBox())!.height >=
                44,
              "Mobile logout touch target must be at least 44px",
            );
            await page.getByTestId("button-open-navigation").click();
            await page
              .getByRole("button", { name: "Tutup navigasi" })
              .waitFor();
            await shot(page, `nav-${index}-mobile`);
            await page.keyboard.press("Escape");
            assert.equal(await page.locator(".sidebar.open").count(), 0);
          }
        });
    }
    await page.setViewportSize(dimensions[0]);
    if (!before) {
      for (const route of [...new Set(Object.values(ROLE_ROUTE_ACCESS).flat())])
        await check(role + " " + route, async () => {
          await page.goto("http://127.0.0.1:5192" + route + "?testRoles=1");
          if (!ROLE_ROUTE_ACCESS[role].includes(route)) {
            await page.getByTestId("state-forbidden").waitFor();
            assert.equal(new URL(page.url()).pathname, route);
          } else {
            await page.locator(".topbar").waitFor();
            assert.equal(await page.getByTestId("state-forbidden").count(), 0);
          }
        });
    }
    for (const size of dimensions) {
      await page.setViewportSize(size);
      await page.goto("http://127.0.0.1:5192/data-master?testRoles=1");
      await page.locator(".content").waitFor();
      await shot(page, `access-${index}-${size.name}`);
      await page.goto("http://127.0.0.1:5192/not-a-jala-route?testRoles=1");
      await page.locator(".content").waitFor();
      await shot(page, `404-${index}-${size.name}`);
      if (!before)
        await check(role + " 404 " + size.name, async () => {
          assert.equal(await page.getByTestId("state-not-found").count(), 1);
        });
      await page.goto(
        "http://127.0.0.1:5192/packages?submodule=" +
          encodeURIComponent("/packages:Ringkasan Paket") +
          "&testRoles=1",
      );
      await page.locator(".package-detail-page").waitFor();
      await shot(page, `stepper-${index}-${size.name}`);
      if (!before)
        await check(role + " stepper " + size.name, async () => {
          assert.equal(
            await page.locator('.side-nav [title*="Akses halaman"]').count(),
            0,
          );
          assert.equal(
            await page.locator(".jm-stage-stepper button").count(),
            8,
          );
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth + 2,
            ),
            false,
          );
          await openFilterPanels(page);
          for (const code of ["0", "1", "2", "3A", "3B", "4", "5", "6"]) {
            await page.getByTestId("stage-nav-" + code).click();
            await page.locator(".package-detail-page").waitFor();
            assert.ok(new URL(page.url()).searchParams.get("submodule"));
          }
        });
    }
    if (!before)
      await check(role + " logout retains packages", async () => {
        await openFilterPanels(page);await openAccountMenu(page);
        const snapshot = await page.evaluate(
          (key) => localStorage.getItem(key),
          PACKAGE_STORE_KEY,
        );
        await page.getByTestId("button-logout").click();
        await page.getByLabel("Nama pengguna").waitFor();
        assert.equal(
          await page.evaluate(
            (key) => localStorage.getItem(key),
            PACKAGE_STORE_KEY,
          ),
          snapshot,
        );
        await page.reload();
        assert.equal(await page.locator(".topbar").count(), 0);
        await page.goto("http://127.0.0.1:5192/?testRoles=1");
        await page
          .getByTestId(
            "button-enter-role-" +
              role.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          )
          .click();
        await page.locator(".topbar").waitFor();
      });
    await context.close();
  }
  for (const size of dimensions) {
    const context = await browser.newContext({ viewport: size });
    const page = await context.newPage();
    for (const state of ["empty", "loading", "error"]) {
      await page.goto(
        "http://127.0.0.1:5192/scripts/paket-a-states.html?state=" + state,
      );
      await page
        .locator(
          state === "loading"
            ? "[role=status]"
            : "[data-testid=state-" + state + "]",
        )
        .waitFor();
      await shot(page, "component-" + state + "-" + size.name);
    }
    await context.close();
  }
  // No-result state through the actual package search; development retains existing demo fixtures.
  const empty = await browser.newContext({ viewport: dimensions[1] });
  await empty.addInitScript((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        activePackageId: null,
        activeRole: "Penyedia Jasa / Ketua Tim",
        packages: {},
      }),
    );
    localStorage.setItem("jala-mutu-demo-session-v1", "active");
  }, PACKAGE_STORE_KEY);
  const ep = await empty.newPage();
  await ep.goto("http://127.0.0.1:5192/packages?testRoles=1");
  await ep.locator(".content").waitFor();
  await openFilterPanels(ep);
  await ep.getByLabel("Cari paket").fill("paket-tidak-ditemukan-948572");
  await ep.getByTestId("state-empty").waitFor();
  await shot(ep, "empty-mobile");
  await empty.close();
  if (!before) {
    const prod = await preview({
      preview: { host: "127.0.0.1", port: 5193, strictPort: true },
    });
    try {
      const context = await browser.newContext();
      await context.addInitScript(() =>
        localStorage.setItem("jala-mutu-demo-session-v1", "active"),
      );
      const page = await context.newPage();
      for (const route of [
        "/?testRoles=1",
        "/audit?testRoles=1",
        "/packages?testRoles=1",
      ])
        await check("Production isolation " + route, async () => {
          await page.goto("http://127.0.0.1:5193" + route);
          await page.getByLabel("Nama pengguna").waitFor();
          assert.equal(
            await page.locator('[data-testid^="button-enter-role-"]').count(),
            0,
          );
          assert.equal(await page.locator(".topbar").count(), 0);
          assert.equal(
            await page
              .getByRole("button", { name: "Masuk", exact: true })
              .isDisabled(),
            true,
          );
        });
      await shot(page, "production-entry");
      await context.close();
    } finally {
      await new Promise<void>((resolve) =>
        prod.httpServer.close(() => resolve()),
      );
    }
  }
} finally {
  await browser.close();
  await server.close();
  fs.writeFileSync(
    path.join(root, "summary.json"),
    JSON.stringify(
      {
        before,
        results,
        errors,
        passed: results.every((r) => r.ok) && errors.length === 0,
      },
      null,
      2,
    ),
  );
}
if (results.some((r) => !r.ok) || errors.length) process.exitCode = 1;
console.log(
  JSON.stringify(
    { checks: results.length, failures: results.filter((r) => !r.ok), errors },
    null,
    2,
  ),
);
