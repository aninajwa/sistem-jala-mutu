import { createServer } from "vite";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { INITIAL_WORKFLOW, type WorkflowRole } from "../src/workflow/model";
import { PACKAGE_STORE_KEY } from "../src/workflow/packageStore";
import {CATALOG} from "../src/reports/periodic";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const project =
  process.env.REPORT_PROJECT_ROOT ||
  fileURLToPath(new URL("..", import.meta.url));
const port = Number(process.env.TEST_PORT || 5184);
const address = "jala-http.test";
const base = `http://${address}:${port}`;
const out =
  process.env.TEST_ARTIFACTS || "../docs/laporan-v2.1/evidence/browser";
await fs.mkdir(out, { recursive: true });
const server = await createServer({
  configFile: path.join(project, "vite.config.ts"),
  server: { host: "127.0.0.1", port, strictPort: true, hmr: false },
});
await server.listen();
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--no-proxy-server",
    "--host-resolver-rules=MAP jala-http.test 127.0.0.1",
  ],
});
const roles: WorkflowRole[] = [
  "Penyedia Jasa / Ketua Tim",
  "PIC Balai / Pengguna Jasa",
  "Direktorat / Pusat",
  "Admin",
];
const results: any[] = [],
  errors: string[] = [];
function fixture(id: string, balai: string, n: number) {
  const p = structuredClone(INITIAL_WORKFLOW);
  p.project.id = id;
  p.project.packageName =
    id === "A"
      ? "Paket Koridor Utara"
      : id === "B"
        ? "Paket Koridor Selatan"
        : "Paket Persiapan";
  p.project.balai = balai;
  p.project.surveyTypes = ["IRI", "PCI", "Drainase"];
  p.dailyRecords = Array.from({ length: n }, (_, i) => ({
    id: `${id}-R${String(i + 1).padStart(2, "0")}`,
    date: `2026-${i < 3 ? "09" : i < 8 ? "10" : "11"}-${String((i % 20) + 1).padStart(2, "0")}`,
    surveyType: (["IRI", "PCI", "Drainase"] as const)[i % 3],
    state: "Tercatat",
    road: "Ruas pengujian",
  })) as any;
  p.corrections = n
    ? ([
        {
          id: `${id}-OPEN`,
          surveyType: "IRI",
          status: "Terbuka",
          dueDate: "2026-11-08",
          blockedStage: "Tahap 3B",
        },
        {
          id: `${id}-CLOSED`,
          surveyType: "PCI",
          status: "Ditutup",
          dueDate: "2026-11-07",
          blockedStage: "Tahap 3B",
        },
      ] as any)
    : [];
  p.cycle.surveyReviews = n
    ? {
        IRI: {
          decision: "Sesuai",
          reviewedAt: "2026-11-02",
          note: "Fixture pemeriksaan",
        },
        PCI: {
          decision: "Temuan",
          reviewedAt: "2026-11-03",
          note: "Fixture pemeriksaan",
        },
      }
    : {};
  return p;
}
async function setup(role: WorkflowRole, width: number) {
  const packages = {
    A: fixture("A", "Balai Utara", 13),
    B: fixture("B", "Balai Selatan", 5),
    C: fixture("C", "Balai Selatan", 0),
    SECRET: fixture("SECRET", "BALAI RAHASIA", 8),
  };
  packages.SECRET.project.packageName = "RAHASIA DI LUAR AKSES";
  const context = await browser.newContext({
    viewport: { width, height: 960 },
    isMobile: width < 768,
    hasTouch: width < 768,
    acceptDownloads: true,
  });
  // Keep the document on a genuine insecure HTTP origin; route bytes locally for isolated Work networking.
  await context.route(`http://jala-http.test:${port}/**`, async (route) => {
    const response = await route.fetch({
      url: route.request().url().replace("jala-http.test", "127.0.0.1"),
    });
    await route.fulfill({ response });
  });
  await context.addInitScript(
    ({ key, packages, role }: any) => {
      if (localStorage.getItem("v21-init")) return;
      localStorage.setItem(
        key,
        JSON.stringify({ activeRole: role, activePackageId: null, packages }),
      );
      localStorage.setItem(
        "jala-local-assignments-v1",
        JSON.stringify({ ["local:" + role]: ["A", "B", "C"] }),
      );
      localStorage.setItem("jala-mutu-demo-session-v1", "active");
      localStorage.setItem("v21-init", "1");
    },
    { key: PACKAGE_STORE_KEY, packages, role },
  );
  const page = await context.newPage();
  page.on("pageerror", (e: any) => errors.push(e.message));
  await page.goto(base + "/reports?testRoles=1");
  return { context, page };
}
async function noOverflow(page: any, label: string) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    true,
    label + " page overflow",
  );
}
try {
  if (process.env.EXPECT_BASELINE_CRASH) {
    const { page, context } = await setup(roles[0], 390);
    const capabilities = await page.evaluate(() => ({
      secure: isSecureContext,
      randomUUID: typeof crypto.randomUUID,
      getRandomValues: typeof crypto.getRandomValues,
    }));
    assert.equal(capabilities.secure, false);
    assert.equal(capabilities.randomUUID, "undefined");
    assert.equal(capabilities.getRandomValues, "function");
    await page
      .getByRole("button", { name: "Laporan periodik", exact: true })
      .last()
      .click();
    await page
      .getByText("crypto.randomUUID is not a function", { exact: false })
      .first()
      .waitFor();
    await page.screenshot({
      path: out + "/baseline-http-crash.png",
      fullPage: true,
    });
    results.push({
      check:
        "original baseline reproduces randomUUID crash on actual insecure HTTP",
      capabilities,
      origin: base,
      status: "pass",
    });
    await context.close();
  } else
    for (const [index, role] of [...roles.entries()].filter(
      ([i]) => !process.env.TEST_ROLE || String(i) === process.env.TEST_ROLE,
    ))
      for (const width of process.env.TEST_WIDTHS
        ? process.env.TEST_WIDTHS.split(",").map(Number)
        : [1440, 768, 390, 360]) {
        const { page, context } = await setup(role, width);
        const capabilities = await page.evaluate(() => ({
          secure: isSecureContext,
          randomUUID: typeof crypto.randomUUID,
          getRandomValues: typeof crypto.getRandomValues,
        }));
        assert.equal(capabilities.secure, false);
        assert.equal(capabilities.randomUUID, "undefined");
        if (role === "Admin") {
          await page
            .getByText(
              "Laporan teknis dan ekspornya tidak tersedia untuk Admin.",
              { exact: false },
            )
            .waitFor();
          assert.equal(
            await page.getByTestId("button-export-report").count(),
            0,
          );
          await page.screenshot({
            path: `${out}/admin-${width}.png`,
            fullPage: true,
          });
          await noOverflow(page, "Admin");
          results.push({ role, width, capabilities, status: "pass" });
          await context.close();
          continue;
        }
        await page.locator("[data-chart]").first().waitFor();
        assert.equal(await page.locator("[data-chart]").count(), 4);
        assert.equal(
          await page
            .getByText("RAHASIA DI LUAR AKSES", { exact: false })
            .count(),
          0,
        );
        const expected =
          index === 0
            ? ["trend", "types", "actions", "packages"]
            : index === 1
              ? ["packages", "reviews", "actions", "trend"]
              : ["regions", "trend", "actions", "reviews"];
        assert.deepEqual(
          await page
            .locator("[data-chart]")
            .evaluateAll((els: any[]) => els.map((e) => e.dataset.chart)),
          expected,
        );
        await noOverflow(page, "dashboard");
        await page.screenshot({
          path: `${out}/initial-${index}-${width}.png`,
          fullPage: true,
        });
        const chart = page.locator(
          index === 0
            ? "[data-chart=packages]"
            : "[data-chart=" + expected[0] + "]",
        );
        const target = chart.locator(".recharts-rectangle").first();
        await target.waitFor();
        await target.scrollIntoViewIfNeeded();
        const box = await target.boundingBox();
        assert.ok(box);
        if (width < 768) {
          await page.touchscreen.tap(
            box.x + box.width / 2,
            box.y + box.height / 2,
          );
        } else
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await chart
          .locator(".recharts-tooltip-wrapper")
          .waitFor({ state: "visible" });
        assert.ok(
          (await chart.locator(".recharts-tooltip-wrapper").innerText())
            .length > 0,
        );
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({
          path: `${out}/dashboard-${index}-${width}.png`,
          fullPage: true,
        });
        await page
          .getByLabel("Tanggal awal", { exact: true })
          .fill("2035-01-01");
        assert.equal(
          await page
            .getByText("Belum ada data pada cakupan ini.", { exact: true })
            .count(),
          4,
        );
        await page
          .getByRole("button", { name: "Reset filter", exact: true })
          .click();
        await page.locator(".rv-filter-more summary").click();
        await page
          .getByLabel("Balai", { exact: true })
          .selectOption("Balai Utara");
        assert.equal(await page.locator(".rv-filter-chips button").count(), 1);
        await page.locator(".rv-filter-more summary").click();
        await page.getByLabel("Paket", { exact: true }).selectOption("A");
        await page
          .getByRole("button", { name: "Lihat Semua · Aktivitas", exact: true })
          .first()
          .click();
        assert.equal(
          await page.getByLabel("Paket", { exact: true }).inputValue(),
          "A",
        );
        assert.equal(
          await page.getByLabel("Balai", { exact: true }).inputValue(),
          "Balai Utara",
        );
        assert.equal(
          await page
            .locator("[data-testid=table-report-rows] tbody tr")
            .count(),
          10,
        );
        await page
          .getByRole("button", { name: "Berikutnya", exact: true })
          .click();
        assert.equal(
          await page
            .locator("[data-testid=table-report-rows] tbody tr")
            .count(),
          3,
        );
        await page.getByLabel("Cari rekap", { exact: true }).fill("A-R13");
        assert.equal(
          await page
            .locator("[data-testid=table-report-rows] tbody tr")
            .count(),
          1,
        );
        await page.getByLabel("Cari rekap", { exact: true }).fill("");
        const dl = page.waitForEvent("download");
        await page.getByTestId("button-export-report").click();
        const csv = await dl;
        const bytes = await fs.readFile((await csv.path())!, "utf8");
        assert.match(bytes, /A-R13/);
        assert.doesNotMatch(bytes, /B-R|SECRET|RAHASIA/);
        await csv.saveAs(`${out}/csv-${index}-${width}.csv`);
        if (width < 768) {
          const scroll = await page
            .locator(".rv-report-table")
            .evaluate((el: HTMLElement) => {
              el.scrollLeft = el.scrollWidth;
              return {
                left: el.scrollLeft,
                width: el.clientWidth,
                content: el.scrollWidth,
              };
            });
          assert.ok(scroll.left > 0);
          assert.ok(scroll.content > scroll.width);
        }
        await noOverflow(page, "recap");
        await page.screenshot({
          path: `${out}/recap-${index}-${width}.png`,
          fullPage: true,
        });
        await page
          .getByRole("button", { name: "Rincian A-R13", exact: true })
          .click();
        await page.getByTestId("report-detail").waitFor();
        await page
          .getByRole("button", { name: "Tutup rincian", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Laporan periodik", exact: true })
          .last()
          .click();
        if(width<768){assert.equal(await page.locator('.rv-report-catalog').getAttribute('open'),null);await page.locator('.rv-report-catalog > summary').click();assert.equal(await page.locator('.rv-report-catalog button').count(),4);assert.equal(await page.locator('.rv-report-catalog button').first().isVisible(),true);await page.locator('.rv-report-catalog > summary').click();}
        await page
          .getByLabel("Paket laporan", { exact: true })
          .selectOption("A");
        await page
          .getByLabel("Awal periode", { exact: true })
          .fill("2026-11-01");
        await page
          .getByLabel("Akhir periode", { exact: true })
          .fill("2026-11-07");
        if (index === 0) {
          await page
            .getByRole("button", { name: "Simpan versi draf", exact: true })
            .click();
          await page
            .getByText(
              "Lengkapi paket, periode yang valid, dan seluruh bagian laporan.",
              { exact: true },
            )
            .waitFor();
          for (const label of [
            "Kemajuan kegiatan",
            "Kendala",
            "Tindak lanjut",
            "Dokumentasi",
          ])
            await page
              .getByLabel(label, { exact: true })
              .fill("Uraian HTTP " + label);
          await page
            .getByLabel("Lampiran draf", { exact: false })
            .setInputFiles({
              name: "ditolak.txt",
              mimeType: "text/plain",
              buffer: Buffer.from("No"),
            });
          await page.getByText("Lampiran ditolak:", { exact: false }).waitFor();
          await page
            .getByLabel("Lampiran draf", { exact: false })
            .setInputFiles({
              name: "bukti.png",
              mimeType: "image/png",
              buffer: Buffer.from(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRz0AAAAASUVORK5CYII=",
                "base64",
              ),
            });
          await page
            .getByText("Lampiran siap disimpan bersama versi draf.", {
              exact: true,
            })
            .waitFor();
          await page
            .getByRole("button", { name: "Simpan versi draf", exact: true })
            .click();
          await page
            .getByText("Draf lokal versi 1 tersimpan.", { exact: true })
            .waitFor();
          await page.getByLabel("Kendala", { exact: true }).fill("Revisi HTTP");
          await page
            .getByRole("button", { name: "Simpan versi draf", exact: true })
            .click();
          await page
            .getByText("Draf lokal versi 2 tersimpan.", { exact: true })
            .waitFor();
          await page
            .getByRole("button", { name: "Buka versi 1", exact: true })
            .click();
          assert.equal(
            await page.getByLabel("Kendala", { exact: true }).inputValue(),
            "Uraian HTTP Kendala",
          );
          const jsonDl = page.waitForEvent("download");
          await page
            .getByRole("button", { name: "Unduh draf JSON", exact: true })
            .click();
          const jsonFile = await jsonDl;
          const json = JSON.parse(
            await fs.readFile((await jsonFile.path())!, "utf8"),
          );
          assert.match(json.id, /^[a-f0-9-]{36}$/);
          assert.equal(json.version, 1);
          assert.equal(json.attachments[0].name, "bukti.png");
          assert.match(json.sifat, /BELUM DISAHKAN/);
          await jsonFile.saveAs(`${out}/draft-${width}.json`);
          await page.reload();
          await page
            .getByRole("button", { name: "Laporan periodik", exact: true })
            .last()
            .click();
          await page
            .getByRole("button", { name: "Buka versi 2", exact: true })
            .click();
          assert.equal(
            await page.getByLabel("Kendala", { exact: true }).inputValue(),
            "Revisi HTTP",
          );
          if(width===1440){
            await page.evaluate(()=>{const original=Storage.prototype.setItem;(window as any).__restoreDraftStore=()=>{Storage.prototype.setItem=original;};Storage.prototype.setItem=function(k,v){if(k.startsWith('jala-report-drafts-v2:'))throw new DOMException('Kuota penuh','QuotaExceededError');return original.call(this,k,v);};});
            await page.getByLabel('Kendala',{exact:true}).fill('Perubahan yang gagal disimpan');await page.getByRole('button',{name:'Simpan versi draf',exact:true}).click();await page.getByText('Draf gagal disimpan:',{exact:false}).waitFor();
            assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('jala-report-drafts-v2:'))!)!).length),2);
            await page.evaluate(()=>(window as any).__restoreDraftStore());await page.getByRole('button',{name:'Buka versi 2',exact:true}).click();
          }

        } else
          assert.equal(
            await page
              .getByRole("button", { name: "Simpan versi draf", exact: true })
              .count(),
            0,
          );
        assert.equal(
          await page
            .getByRole("button", {
              name: "Ajukan · belum tersedia",
              exact: true,
            })
            .isDisabled(),
          true,
        );
        await noOverflow(page, "periodic");
        await page.screenshot({
          path: `${out}/periodic-${index}-${width}.png`,
          fullPage: true,
        });
        results.push({
          role,
          width,
          capabilities,
          checks: [
            "role charts",
            "tooltip hover/touch",
            "empty state",
            "filters preserved",
            "search",
            "pagination",
            "CSV",
            "internal table scroll",
            "draft HTTP",
            "permissions",
            "no overflow",
          ],
          status: "pass",
        });
        await context.close();
      }
  if(!process.env.EXPECT_BASELINE_CRASH&&!process.env.TEST_ROLE){
    const {page,context}=await setup(roles[0],360);
    await page.getByRole('button',{name:'Laporan periodik',exact:true}).last().click();
    await page.getByLabel('Paket laporan',{exact:true}).selectOption('A');await page.getByLabel('Awal periode',{exact:true}).fill('2026-11-01');await page.getByLabel('Akhir periode',{exact:true}).fill('2026-11-07');
    for(const item of CATALOG){await page.getByLabel('Jenis laporan',{exact:true}).selectOption(item.id);for(const section of item.sections)await page.getByLabel(section,{exact:true}).fill('Draf '+item.name);await page.getByRole('button',{name:'Simpan versi draf',exact:true}).click();await page.getByText('Draf lokal versi 1 tersimpan.',{exact:true}).waitFor();const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Unduh draf JSON',exact:true}).click();const file=await downloadPromise;const exported=JSON.parse(await fs.readFile((await file.path())!,'utf8'));assert.equal(exported.kind,item.id);assert.equal(exported.content.length,4);}
    assert.equal(await page.evaluate(()=>{const key=Object.keys(localStorage).find(k=>k.startsWith('jala-report-drafts-v2:'))!;return new Set(JSON.parse(localStorage.getItem(key)!).map((d:any)=>d.id)).size;}),4);
    await page.getByLabel('Jenis laporan',{exact:true}).selectOption('weekly');
    await page.evaluate(()=>Object.defineProperty(crypto,'getRandomValues',{value:undefined,configurable:true}));
    await page.getByLabel('Paket laporan',{exact:true}).selectOption('A');await page.getByLabel('Awal periode',{exact:true}).fill('2026-11-01');await page.getByLabel('Akhir periode',{exact:true}).fill('2026-11-07');
    for(const label of ['Kemajuan kegiatan','Kendala','Tindak lanjut','Dokumentasi'])await page.getByLabel(label,{exact:true}).fill('Tetap ada');
    await page.getByRole('button',{name:'Simpan versi draf',exact:true}).click();await page.getByText('Draf gagal disimpan: Pembuat ID aman',{exact:false}).waitFor();assert.equal(await page.getByLabel('Kendala',{exact:true}).inputValue(),'Tetap ada');
    await page.screenshot({path:out+'/crypto-unavailable-safe-error-360.png',fullPage:true});
    const key=await page.evaluate(()=>`jala-report-drafts-v2:${encodeURIComponent('local:Penyedia Jasa / Ketua Tim')}`);
    await page.evaluate(k=>localStorage.setItem(k,'CORRUPT'),key);await page.reload();await page.getByRole('button',{name:'Laporan periodik',exact:true}).last().click();await page.getByText('Data draf tidak dapat dibaca.',{exact:false}).first().waitFor();assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),'CORRUPT');await noOverflow(page,'corrupt draft');
    results.push({check:'four report types save/export with distinct identities; crypto absent safe; corrupt history retained; quota rejected',width:360,status:'pass'});await context.close();
  }
  if (!process.env.EXPECT_BASELINE_CRASH) assert.deepEqual(errors, []);
} finally {
  await fs.writeFile(
    out + "/results.json",
    JSON.stringify(
      {
        browser: browser.version(),
        base,
        baseline: !!process.env.EXPECT_BASELINE_CRASH,
        results,
        errors,
      },
      null,
      2,
    ),
  );
  await browser.close();
  await server.close();
}
console.log(JSON.stringify({ passed: results.length, errors }, null, 2));
