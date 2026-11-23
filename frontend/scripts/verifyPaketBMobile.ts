import { chromium } from "playwright";
import { createServer } from "vite";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createDemoWorkflow } from "../src/workflow/demoScenario";
import { PACKAGE_STORE_KEY } from "../src/workflow/packageStore";
import { WORKFLOW_ROLE_OPTIONS } from "../src/workflow/workflowConfig";
import { aggregateDashboard } from "../src/pages/dashboardMetrics";
const out = process.env.TEST_ARTIFACTS || "test-artifacts/paket-b-mobile";
fs.mkdirSync(out, { recursive: true });
const server = await createServer({
  server: { host: "127.0.0.1", port: 5204, strictPort: true },
});
await server.listen();
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const results: any[] = [],
  errors: string[] = [];
async function check(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, passed: true });
  } catch (e) {
    results.push({ name, passed: false, error: String(e) });
    console.log("FAIL", name, String(e));
  }
}
try {
  for (const [i, role] of WORKFLOW_ROLE_OPTIONS.entries()) {
    const state = createDemoWorkflow("complete");
    state.role = role;
    const context = await browser.newContext();
    await context.addInitScript(
      ({ key, state, role }) => {
        if (sessionStorage.getItem("b-mobile-seed")) return;
        sessionStorage.setItem("b-mobile-seed", "1");
        localStorage.setItem(
          key,
          JSON.stringify({
            activeRole: role,
            activePackageId: state.project.id,
            packages: { [state.project.id]: state },
          }),
        );
        localStorage.setItem("jala-mutu-demo-session-v1", "active");
      },
      { key: PACKAGE_STORE_KEY, state, role },
    );
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    page.setDefaultTimeout(15000);
    for (const width of [360, 390, 768, 1440]) {
      await page.setViewportSize({
        width,
        height: width === 1440 ? 1000 : 844,
      });
      await page.goto("http://127.0.0.1:5204/?testRoles=1");
      await page.locator(".b-dashboard").waitFor();
      await page.locator(".b-metrics>.b-metric").last().waitFor();
      const store = await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!),
        PACKAGE_STORE_KEY,
      );
      const expected = aggregateDashboard(store.packages, role);
      await check(
        `${role}/${width}: four original KPI values remain accessible`,
        async () => {
          assert.equal(await page.locator(".b-metrics>.b-metric").count(), 4);
          const values = await page
            .locator(".b-metrics>.b-metric strong")
            .allTextContents();
          const wanted =
            i === 0
              ? [
                  expected.packages,
                  expected.dailyRecords,
                  expected.correctionsOpen,
                  expected.accepted,
                ]
              : i === 1
                ? [
                    expected.packages,
                    expected.auditPending,
                    expected.correctionsOpen,
                    expected.dailyRecords,
                  ]
                : i === 2
                  ? [
                      expected.balai,
                      expected.packages,
                      expected.correctionsOpen,
                      expected.auditPending,
                    ]
                  : null;
          if (wanted) assert.deepEqual(values, wanted.map(String));
          else {
            assert.equal(values[0], String(expected.packages));
            assert.equal(values[1], String(expected.balai));
            assert.equal(values[3], "Belum aktif");
          }
          if (width <= 780) {
            const boxes = await Promise.all(
              (await page.locator(".b-metrics>.b-metric").all()).map((el) =>
                el.boundingBox(),
              ),
            );
            assert.ok(Math.abs(boxes[0]!.y - boxes[1]!.y) < 2);
            assert.ok(Math.abs(boxes[2]!.y - boxes[3]!.y) < 2);
            assert.ok(boxes[2]!.y > boxes[0]!.y);
          }
        },
      );
      await check(
        `${role}/${width}: compact account and available logout`,
        async () => {
          const menu = page.locator(".b-account-menu");
          if (width <= 780) {
            assert.equal(await menu.getAttribute("open"), null);
            assert.ok(
              (await page.locator(".topbar").boundingBox())!.height <= 100,
            );
            await menu.locator("summary").focus();
            await page.keyboard.press("Enter");
            await page.getByTestId("button-logout").waitFor();
            assert.ok(
              (await page.getByTestId("button-logout").boundingBox())!.height >=
                44,
            );
            await page.keyboard.press("Escape");
            assert.equal(await menu.getAttribute("open"), null);
          } else {
            await menu.locator("summary").click();
            assert.equal(
              await page.getByTestId("button-logout").isVisible(),
              true,
            );
          }
        },
      );
      if (i !== 3)
        await check(
          `${role}/${width}: filters open, count, retain values and reset`,
          async () => {
            const panel = page.locator("details[data-filter-panel]").first();
            if (width <= 780)
              assert.equal(await panel.getAttribute("open"), null);
            if ((await panel.getAttribute("open")) === null) {
              await panel.locator(":scope>summary").focus();
              await page.keyboard.press("Enter");
            }
            const selector = page.getByLabel(
              i === 0 ? "Paket" : "Wilayah Balai",
              { exact: true },
            );
            const options = await selector.locator("option").all();
            assert.ok(options.length > 1);
            const value =
              (await options[1].getAttribute("value")) ||
              (await options[1].innerText());
            await selector.selectOption(value);
            assert.match(
              await panel.locator(":scope>summary").innerText(),
              /1 aktif/,
            );
            await panel.locator(":scope>summary").click();
            assert.equal(await panel.getAttribute("open"), null);
            await panel.locator(":scope>summary").click();
            assert.equal(await selector.inputValue(), value);
            await panel
              .getByRole("button", { name: "Reset semua filter", exact: true })
              .click();
            assert.doesNotMatch(
              await panel.locator(":scope>summary").innerText(),
              /\d+ aktif/,
            );
            if (width <= 780) await panel.locator(":scope>summary").click();
          },
        );
      if (i === 2)
        await check(
          `Direktorat/${width}: real basemap, no fabricated markers, geographic selection filters data`,
          async () => {
            const map = page.getByTestId("directorate-map");
            await map
              .locator(".leaflet-overlay-pane path")
              .first()
              .waitFor({ state: "attached" });
            assert.match(await map.innerText(), /Lokasi Balai belum tersedia/);
            assert.equal(await map.locator(".leaflet-interactive").count(), 0);
            const geometry = map.locator(".leaflet-overlay-pane path").first(),
              before = await geometry.getAttribute("d");
            await map
              .getByRole("button", { name: "Perbesar peta", exact: true })
              .click();
            await page.waitForTimeout(400);
            assert.notEqual(await geometry.getAttribute("d"), before);
            await map
              .getByRole("button", {
                name: "Tampilkan seluruh Indonesia",
                exact: true,
              })
              .click();
            const region = map
              .getByLabel("Balai pada peta / cakupan")
              .or(map.getByLabel("Pilih Balai pada peta"));
            const option = await region
              .locator("option")
              .nth(1)
              .getAttribute("value");
            assert.ok(option);
            await region.selectOption(option!);
            const filtered = aggregateDashboard(store.packages, role, option!);
            assert.equal(
              await page
                .locator(".b-metrics>.b-metric")
                .nth(1)
                .locator("strong")
                .innerText(),
              String(filtered.packages),
            );
            assert.equal(
              await page.evaluate(
                (key) => localStorage.getItem(key),
                PACKAGE_STORE_KEY,
              ),
              JSON.stringify(store),
            );
            await page.screenshot({
              path: path.join(out, `map-selected-${width}.png`),
              fullPage: false,
            });
            await region.selectOption("Semua Balai");
          },
        );
      await check(
        `${role}/${width}: no horizontal overflow and keyboard navigation remains available`,
        async () => {
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth + 2,
            ),
            false,
          );
          if (width <= 780) {
            await page.getByTestId("button-open-navigation").click();
            await page
              .getByRole("button", { name: "Tutup navigasi" })
              .waitFor();
            await page.keyboard.press("Escape");
            assert.equal(await page.locator(".sidebar.open").count(), 0);
          }
        },
      );
      await page.screenshot({
        path: path.join(out, `dashboard-r${i}-${width}.png`),
        fullPage: true,
        animations: "disabled",
      });
    }
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
  fs.writeFileSync(
    path.join(out, "summary.json"),
    JSON.stringify(
      {
        results,
        errors,
        passed: results.every((r) => r.passed) && errors.length === 0,
      },
      null,
      2,
    ),
  );
}
console.log(
  JSON.stringify(
    {
      checks: results.length,
      failed: results.filter((r) => !r.passed),
      errors,
    },
    null,
    2,
  ),
);
if (results.some((r) => !r.passed) || errors.length) process.exitCode = 1;
