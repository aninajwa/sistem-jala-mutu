import assert from "node:assert/strict";
import { stagePresentation } from "../src/design/c/stagePresentation";
import { chromium } from "playwright";
import { createServer } from "vite";
import fs from "node:fs";
import path from "node:path";
import { createDemoWorkflow } from "../src/workflow/demoScenario";
import { PACKAGE_STORE_KEY } from "../src/workflow/packageStore";
import {
  WORKFLOW_ROLE_OPTIONS,
  ROLE_ROUTE_ACCESS,
} from "../src/workflow/workflowConfig";
import { PACKAGE_WORKFLOW_ITEMS } from "../src/workflow/roleNavigation";
const output =
  process.env.B_VISUAL_OUT ||
  process.env.TEST_ARTIFACTS ||
  "test-artifacts/paket-c";
fs.mkdirSync(output, { recursive: true });
const port = Number(process.env.B_VISUAL_PORT || 5211),
  before = process.env.B_VISUAL_BEFORE === "1";
const server = await createServer({
  server: { host: "127.0.0.1", port, strictPort: true },
});
await server.listen();
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const records: any[] = [],
  errors: string[] = [];
try {
  for (const [i, role] of WORKFLOW_ROLE_OPTIONS.entries()) {
    const fixture = createDemoWorkflow("complete");
    fixture.role = role;
    const context = await browser.newContext();
    await context.addInitScript(
      ({ key, fixture, role }) => {
        if (sessionStorage.getItem("b-visual-seed")) return;
        sessionStorage.setItem("b-visual-seed", "1");
        localStorage.setItem(
          key,
          JSON.stringify({
            activePackageId: fixture.project.id,
            activeRole: role,
            packages: { [fixture.project.id]: fixture },
          }),
        );
        localStorage.setItem("jala-mutu-demo-session-v1", "active");
      },
      { key: PACKAGE_STORE_KEY, fixture, role },
    );
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.on("pageerror", (e) => errors.push(e.message));
    const targets = [
      ...[
        "/",
        "/packages",
        "/entry",
        "/verification",
        "/actions",
        "/documents",
        "/notifications",
        "/reports",
        "/compliance",
        "/data-master",
        "/audit",
      ]
        .filter((r) => ROLE_ROUTE_ACCESS[role].includes(r))
        .map((r) => ({ name: r === "/" ? "dashboard" : r.slice(1), route: r })),
      ...PACKAGE_WORKFLOW_ITEMS.map((s) => ({
        name: "stage-" + s.code.replace("Tahap ", ""),
        route:
          s.selection.split(":")[0] +
          "?submodule=" +
          encodeURIComponent(s.selection),
      })),
    ];
    for (const width of [1440, 768, 390, 360]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      for (const t of targets.filter(
        (t) =>
          !process.env.B_VISUAL_TARGET ||
          t.name === process.env.B_VISUAL_TARGET,
      )) {
        const record: any = {
          role,
          width,
          target: t.name,
          requested: t.route,
          ok: false,
        };
        try {
          await page.goto(
            `http://127.0.0.1:${port}${t.route}${t.route.includes("?") ? "&" : "?"}testRoles=1`,
          );
          await page.locator(".topbar").waitFor();
          if (t.name === "dashboard")
            await page
              .locator(before ? ".ds-work-queue" : ".b-dashboard")
              .waitFor();
          if (t.name.startsWith("stage-")) {
            const heading = page
              .locator(".package-detail-page .wf-title")
              .first();
            await heading.waitFor();
            const stage = PACKAGE_WORKFLOW_ITEMS.find(
              (item) => "stage-" + item.code.replace("Tahap ", "") === t.name,
            )!;
            const expected = stagePresentation(role, stage.code);
            assert.equal(
              await page.locator(".c-stage-layout").getAttribute("data-mode"),
              expected.mode,
            );
            record.stageMode = expected.mode;
            const views = page.locator(".c-stage-views");
            if (await views.count()) {
              const beforeValues = await page
                .locator(
                  ".c-stage-main input,.c-stage-main select,.c-stage-main textarea",
                )
                .evaluateAll((els) =>
                  els.map((el) => ({
                    value: (el as HTMLInputElement).value,
                    checked: (el as HTMLInputElement).checked,
                  })),
                );
              const saved = await page.evaluate(
                (key) => localStorage.getItem(key),
                PACKAGE_STORE_KEY,
              );
              const choices = views.getByRole("button");
              if ((await choices.count()) > 1) {
                await choices.nth(1).focus();
                await page.keyboard.press("Enter");
                assert.equal(
                  await choices.nth(1).getAttribute("aria-pressed"),
                  "true",
                );
                await choices.first().click();
              }
              assert.deepEqual(
                await page
                  .locator(
                    ".c-stage-main input,.c-stage-main select,.c-stage-main textarea",
                  )
                  .evaluateAll((els) =>
                    els.map((el) => ({
                      value: (el as HTMLInputElement).value,
                      checked: (el as HTMLInputElement).checked,
                    })),
                  ),
                beforeValues,
              );
              assert.equal(
                await page.evaluate(
                  (key) => localStorage.getItem(key),
                  PACKAGE_STORE_KEY,
                ),
                saved,
              );
            }
            await page.locator(".c-stage-context").scrollIntoViewIfNeeded();
          }
          await page.waitForTimeout(80);
          record.url = new URL(page.url()).pathname;
          record.headings = await page
            .locator("h1,h2,.module-title,.wf-title")
            .allTextContents();
          if(width<=780){record.headerHeight=(await page.locator('.topbar').boundingBox())!.height;assert.ok(record.headerHeight<=100,`Header exceeds compact height: ${record.headerHeight}px`);}
          const visible = await page.locator(".content").innerText();
          if (
            /Simulasi lokal ·|Sumber lokal frontend|Termasuk catatan contoh dev|repository lampiran/.test(
              visible,
            )
          )
            throw Error("Development copy leaked into operational content");
          record.overflow = await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth + 2,
          );
          record.accessDenied = await page
            .locator(
              "[data-testid=state-forbidden],[data-testid=state-not-found]",
            )
            .count();
          if (record.accessDenied)
            throw Error("Incorrect target: forbidden/not found");
          record.file = `r${i}-${width}-${t.name}.png`;
          await page.screenshot({
            path: path.join(output, record.file),
            fullPage: t.name === "dashboard",
            animations: "disabled",
          });
          record.ok = !record.overflow;
          console.log(record.ok ? "PASS" : "OVERFLOW", record.file);
        } catch (e) {
          record.error = String(e);
          console.log("FAIL", role, width, t.name, String(e));
        }
        records.push(record);
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
  fs.writeFileSync(
    path.join(output, "summary.json"),
    JSON.stringify(
      {
        before,
        records,
        errors,
        passed: records.every((r) => r.ok) && !errors.length,
      },
      null,
      2,
    ),
  );
}
if (records.some((r) => !r.ok) || errors.length) process.exitCode = 1;
