import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { INITIAL_WORKFLOW, type WorkflowRole } from "../src/workflow/model";
import { PACKAGE_STORE_KEY } from "../src/workflow/packageStore";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const port=Number(process.env.TEST_PORT||5176);
const baseUrl=`http://127.0.0.1:${port}`;
const server = await createServer({
  configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url)),
  server: { host: "127.0.0.1", port, strictPort: true },
});
await server.listen();
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const out = process.env.TEST_ARTIFACTS || "../docs/laporan-v2/evidence/browser";
await fs.mkdir(out, { recursive: true });
const roles: WorkflowRole[] = [
  "Penyedia Jasa / Ketua Tim",
  "PIC Balai / Pengguna Jasa",
  "Direktorat / Pusat",
  "Admin",
];
const results: unknown[] = [],
  errors: string[] = [];
try {
  for (const [index, role] of roles.entries())
    for (const width of [1440, 390]) {
      const state = structuredClone(INITIAL_WORKFLOW);
      state.project.id = "REPORT-TEST-A";
      state.project.packageName = "Paket laporan uji";
      state.project.balai = "Balai Uji";
      state.project.surveyTypes = ["IRI"];
      state.role = role;
      state.dailyRecords = [
        {
          id: "ROW-TEST-1",
          date: "2026-11-01",
          surveyType: "IRI",
          state: "Tercatat",
          road: "Ruas uji",
        },
      ] as typeof state.dailyRecords;
      state.dailyRecords = Array.from({ length: 13 }, (_, i) => ({
        ...state.dailyRecords[0],
        id: `ROW-TEST-${i + 1}`,
      }));
      state.cycle.surveyReviews = {
        IRI: {
          decision: "Sesuai",
          reviewedAt: "2026-11-02",
          note: "Keputusan uji",
        },
      };
      state.corrections = [
        {
          id: "CASE-TEST-1",
          surveyType: "IRI",
          dueDate: "2026-11-03",
          status: "Terbuka",
          blockedStage: "Tahap 3B",
        },
      ] as typeof state.corrections;
      const hidden = structuredClone(state);
      hidden.project.id = "REPORT-SECRET";
      hidden.project.packageName = "RAHASIA TIDAK BOLEH TAMPIL";
      const context = await browser.newContext({
        viewport: { width, height: 960 },
        acceptDownloads: true,
      });
      await context.addInitScript(
        ({ state, hidden, key, role }: any) => {
          if (localStorage.getItem("report-test-init")) return;
          localStorage.setItem(
            key,
            JSON.stringify({
              activeRole: role,
              activePackageId: null,
              packages: {
                [state.project.id]: state,
                [hidden.project.id]: hidden,
              },
            }),
          );
          localStorage.setItem(
            "jala-local-assignments-v1",
            JSON.stringify({ ["local:" + role]: [state.project.id] }),
          );
          localStorage.setItem("jala-mutu-demo-session-v1", "active");
          localStorage.setItem("report-test-init", "1");
        },
        { state, hidden, key: PACKAGE_STORE_KEY, role },
      );
      const page = await context.newPage();
      page.on("pageerror", (e: any) => errors.push(e.message));
      await page.goto(baseUrl+"/reports?testRoles=1");
      if (role === "Admin") {
        await page
          .getByText(
            "Laporan teknis dan ekspornya tidak tersedia untuk Admin.",
            { exact: false },
          )
          .waitFor();
        assert.equal(await page.getByTestId("button-export-report").count(), 0);
        await page.screenshot({
          path: `${out}/admin-${width}.png`,
          fullPage: true,
        });
      } else {
        await page
          .getByText("Aktivitas tercatat per bulan", { exact: true })
          .waitFor({ timeout: 10000 })
          .catch(async (e) => {
            console.log(
              "INITIAL",
              role,
              width,
              await page.locator("body").innerText(),
              errors,
            );
            await page.screenshot({
              path: out + "/failure.png",
              fullPage: true,
            });
            throw e;
          });
        await page
          .getByLabel("Paket", { exact: true })
          .selectOption("REPORT-TEST-A");
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
        await page
          .getByLabel("Paket", { exact: true })
          .selectOption("REPORT-TEST-A");
        await page.screenshot({
          path: `${out}/dashboard-${index}-${width}.png`,
          fullPage: true,
        });
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
          true,
          "no page overflow",
        );
        await page
          .getByRole("button", { name: "Lihat Semua · Aktivitas", exact: true })
          .first()
          .click();
        assert.equal(
          await page.getByLabel("Paket", { exact: true }).inputValue(),
          "REPORT-TEST-A",
        );
        await page.getByTestId("table-report-rows").waitFor();
        await page
          .getByLabel("Paket", { exact: true })
          .selectOption("REPORT-TEST-A");
        assert.equal(
          await page
            .locator('[data-testid="table-report-rows"] tbody tr')
            .count(),
          10,
        );
        assert.equal(
          await page
            .getByText("RAHASIA TIDAK BOLEH TAMPIL", { exact: false })
            .count(),
          0,
        );
        await page
          .getByRole("button", { name: "Berikutnya", exact: true })
          .click();
        assert.equal(
          await page
            .locator('[data-testid="table-report-rows"] tbody tr')
            .count(),
          3,
        );
        await page
          .getByRole("button", { name: "Sebelumnya", exact: true })
          .click();
        await page
          .getByLabel("Cari rekap", { exact: true })
          .fill("ROW-TEST-13");
        assert.equal(
          await page
            .locator('[data-testid="table-report-rows"] tbody tr')
            .count(),
          1,
        );
        await page.getByLabel("Cari rekap", { exact: true }).fill("");
        assert.equal(await page.getByTestId("select-global-balai").count(), 0);
        assert.equal(
          await page.getByTestId("mobile-global-filters").count(),
          0,
        );
        await page
          .getByLabel("Tanggal awal", { exact: true })
          .fill("2026-11-02");
        assert.equal(
          await page
            .locator('[data-testid="table-report-rows"] tbody tr')
            .count(),
          0,
        );
        assert.equal(
          await page.getByTestId("button-export-report").isDisabled(),
          true,
        );
        await page
          .getByRole("button", { name: "Reset filter", exact: true })
          .click();
        await page
          .getByLabel("Paket", { exact: true })
          .selectOption("REPORT-TEST-A");
        let downloads = 0;
        page.on("download", () => downloads++);
        const dl = page.waitForEvent("download");
        await page.getByTestId("button-export-report").click();
        const download = await dl;
        const path = await download.path();
        const bytes = await fs.readFile(path!, "utf8");
        assert.match(bytes, /ROW-TEST-1/);
        assert.doesNotMatch(bytes, /REPORT-SECRET|RAHASIA|1.250/);
        assert.match(bytes, /Informatif/);
        await download.saveAs(`${out}/role-${index}-${width}.csv`);
        await page.waitForTimeout(150);
        assert.equal(downloads, 1, "exactly one download, no demo export");
        await page
          .getByLabel("Jenis rekap", { exact: true })
          .selectOption("reviews");
        await page
          .getByLabel("Paket", { exact: true })
          .selectOption("REPORT-TEST-A");
        assert.match(
          await page.getByTestId("table-report-rows").innerText(),
          /Sesuai/,
        );
        await page
          .getByLabel("Jenis rekap", { exact: true })
          .selectOption("corrections");
        await page
          .getByLabel("Paket", { exact: true })
          .selectOption("REPORT-TEST-A");
        assert.match(
          await page.getByTestId("table-report-rows").innerText(),
          /CASE-TEST-1/,
        );
        await page
          .getByRole("button", { name: "Rincian CASE-TEST-1", exact: true })
          .click();
        await page.getByTestId("report-detail").waitFor();
        await page.screenshot({
          path: `${out}/role-${index}-${width}.png`,
          fullPage: true,
        });
        await page
          .getByRole("button", { name: "Laporan periodik", exact: true })
          .last()
          .click();
        await page
          .getByText("Draf tersimpan pada browser ini.", { exact: false })
          .waitFor();
        await page
          .getByLabel("Paket laporan", { exact: true })
          .selectOption("REPORT-TEST-A");
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
              .fill("Uraian uji " + label);
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
            .getByRole("button", { name: "Simpan versi draf", exact: true })
            .click();
          await page
            .getByText("Draf lokal versi 1 tersimpan.", { exact: true })
            .waitFor();
          await page
            .getByLabel("Kendala", { exact: true })
            .fill("Revisi kendala");
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
            "Uraian uji Kendala",
          );
          const draftDl = page.waitForEvent("download");
          await page
            .getByRole("button", { name: "Unduh draf JSON", exact: true })
            .click();
          const jsonDownload = await draftDl;
          const draftJson = JSON.parse(
            await fs.readFile((await jsonDownload.path())!, "utf8"),
          );
          assert.equal(draftJson.attachments[0].name, "bukti.png");
          assert.match(
            draftJson.attachments[0].data,
            /^data:image\/png;base64,/,
          );
          assert.match(draftJson.sifat, /BELUM DISAHKAN/);
          await page.reload();
          await page
            .getByRole("button", { name: "Laporan periodik", exact: true })
            .last()
            .click();
          await page
            .getByRole("button", { name: "Buka versi 1", exact: true })
            .click();
          assert.equal(
            await page.getByLabel("Kendala", { exact: true }).inputValue(),
            "Uraian uji Kendala",
          );
        }
        assert.equal(
          await page
            .getByRole("button", {
              name: "Ajukan · belum tersedia",
              exact: true,
            })
            .isDisabled(),
          true,
        );
        await page.screenshot({
          path: `${out}/periodic-${index}-${width}.png`,
          fullPage: true,
        });
        await page
          .getByRole("link", { name: "Buka Dokumen Mutu", exact: true })
          .click();
        await page.waitForURL(/\/documents/);
        await page.goto(baseUrl+"/reports?testRoles=1");
        await page
          .getByRole("button", { name: "Lihat Semua · Tindakan", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Rincian CASE-TEST-1", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Buka paket sumber", exact: true })
          .click();
        await page.waitForURL(/\/packages/);
        assert.equal(
          await page.evaluate(
            () =>
              JSON.parse(localStorage.getItem("jala-mutu-package-store-v3")!)
                .activePackageId,
          ),
          "REPORT-TEST-A",
        );
      }
      if(role!=="Admin"){
        await page.goto(baseUrl+"/?testRoles=1");
        await page.getByText('Cakupan ringkasan',{exact:true}).waitFor();
        await page.screenshot({path:`${out}/summary-regression-${index}-${width}.png`,fullPage:true});
      }
      results.push({ role, width, status: "pass" });
      await context.close();
    }
  assert.deepEqual(errors, []);
} finally {
  await fs.writeFile(
    `${out}/results.json`,
    JSON.stringify({ results, errors }, null, 2),
  );
  await browser.close();
  await server.close();
}
console.log(JSON.stringify({ passed: results.length, errors }, null, 2));
