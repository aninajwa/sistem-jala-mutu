import { chromium } from "playwright";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import assert from "node:assert/strict";
import { createDemoWorkflow } from "../src/workflow/demoScenario";
import { PACKAGE_STORE_KEY } from "../src/workflow/packageStore";
import { BA_TEMPLATES, fieldsFor } from "../src/workflow/ba/docxEngine";
import { baKey, type BaIdentity } from "../src/workflow/ba/documentRepository";
const output = process.env.TEST_ARTIFACTS || "test-artifacts/documents";
fs.mkdirSync(output, { recursive: true });
const roles = [
  "Penyedia Jasa / Ketua Tim",
  "PIC Balai / Pengguna Jasa",
  "Direktorat / Pusat",
  "Admin",
] as const;
const state = createDemoWorkflow("complete");
state.project.surveyTypes = ["IRI", "PCI"];
state.activeCyclePeriod = 2;
state.cycleHistory = { "1": structuredClone(state.cycle) };
state.project.id = "PAKET-DEMO-001";
state.role = roles[0];
const identity: BaIdentity = {
  packageId: state.project.id,
  kind: "internal",
  period: 2,
  survey: "IRI",
  auditLevel: 1,
};
const template = BA_TEMPLATES.find((t) => t.id === "internal")!;
const fields = Object.fromEntries(
  fieldsFor(template, "IRI").map((f) => [
    f.id,
    f.choices?.[0] ??
      (/tanggal|dd\/mm/i.test(f.label) ? "2026-10-26" : "Isian uji terisolasi"),
  ]),
);
const record = {
  draft: fields,
  versions: [
    {
      id: "TEST-REVISION-1",
      version: 1,
      createdAt: "2026-10-26T01:00:00Z",
      actor: roles[0],
      templateHash: template.sha256,
      status: "local-draft",
      fields,
      officiallySigned: false,
    },
  ],
};
const server = await createServer({
  configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url)),
  server: { host: "127.0.0.1", port: 5178, strictPort: true },
});
await server.listen();
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const results: string[] = [],
  errors: string[] = [];
let completed = false;
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  await context.addInitScript(
    ({ state, key, identityKey, record }) => {
      if (sessionStorage.getItem("seeded")) return;
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem(
        key,
        JSON.stringify({
          activePackageId: state.project.id,
          activeRole: state.role,
          packages: { [state.project.id]: state },
        }),
      );
      localStorage.setItem("jala-mutu-demo-session-v1", "active");
      localStorage.setItem(identityKey, JSON.stringify(record));
      localStorage.setItem(
        "jala-ba-draft-v1:legacy-protected",
        '{"nomor":"ARSIP-TETAP"}',
      );
    },
    { state, key: PACKAGE_STORE_KEY, identityKey: baKey(identity), record },
  );
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  const origin = "http://127.0.0.1:5178";
  await page.goto(origin + "/documents?testRoles=1");
  await page.getByTestId("table-documents").waitFor();
  const protectedValue = await page.evaluate(() =>
    localStorage.getItem("jala-ba-draft-v1:legacy-protected"),
  );
  assert.equal(
    await page.getByTestId("table-documents").locator("tbody tr").count(),
    1,
  );
  await page.locator(".document-filter-panel summary").click();
  assert.equal(await page.getByLabel("Filter survei dokumen").locator("option").count(),9);
  await page.getByLabel("Cari dokumen mutu").fill("tidak-ada");
  await page
    .getByText(/Tidak ada dokumen yang sesuai filter/)
    .waitFor();
  await page.getByRole("button", { name: "Reset filter", exact: true }).click();
  await page.getByLabel("Filter periode dokumen").selectOption("2");
  assert.equal(
    await page.getByTestId("table-documents").locator("tbody tr").count(),
    1,
  );
  results.push(
    "List reads real stored document; search and period filter work without creating empty records",
  );
  async function showContext(){
    const field=page.getByLabel('Format BA',{exact:true});
    await field.waitFor({state:'attached'});
    if(!await field.isVisible())await page.getByText('Ganti konteks dokumen',{exact:true}).click();
  }
  for(const [category,count] of [['Kalibrasi',0],['Validasi',0],['Verifikasi berkala',1],['Audit & penerimaan',0],['Semua',1]] as const){
    await page.locator('.documents-page .tabs').getByRole('button',{name:category,exact:true}).click();
    assert.equal(await page.getByTestId('table-documents').locator('tbody tr button').count(),count);
  }
  await page.getByLabel('Filter tahap dokumen').selectOption('Tahap 0');
  assert.equal(await page.getByTestId('table-documents').locator('tbody tr button').count(),0);
  await page.getByLabel('Filter tahap dokumen').selectOption('Tahap 3B');
  await page.getByLabel('Filter survei dokumen').selectOption('Drainase');
  assert.equal(await page.getByTestId('table-documents').locator('tbody tr button').count(),0);
  await page.getByLabel('Filter survei dokumen').selectOption('IRI');
  await page.getByLabel('Cari dokumen mutu').fill('Internal');
  await page.getByTestId('table-documents').getByRole('button').click();
  await showContext();
  await page.getByRole('button',{name:'Kembali ke asal',exact:true}).click();
  await page.getByTestId('table-documents').waitFor();
  await page.locator('.document-filter-panel summary').click();
  assert.equal(await page.getByLabel('Filter tahap dokumen').inputValue(),'Tahap 3B');
  assert.equal(await page.getByLabel('Filter survei dokumen').inputValue(),'IRI');
  assert.equal(await page.getByLabel('Filter periode dokumen').inputValue(),'2');
  assert.equal(await page.getByLabel('Cari dokumen mutu').inputValue(),'Internal');
  await page.getByRole('button',{name:'Reset filter',exact:true}).click();
  await page.getByRole('button',{name:'Format dokumen',exact:true}).click();
  assert.equal(await page.getByLabel('Jenis dokumen BA',{exact:true}).locator('option').count(),7);
  assert.equal(await page.getByTestId('table-documents').count(),0);
  await page.getByText(/Belum disiapkan oleh/).waitFor();
  await page.getByRole('button',{name:'Buka dokumen',exact:true}).click();
  await page.getByRole('button',{name:'Kembali ke asal',exact:true}).click();
  await page.getByLabel('Jenis dokumen BA',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Semua',exact:true}).click();
  results.push('All categories filter real records; format catalog is distinct; eight survey types, stage/period filters and list return preserve context');
  async function role(name: string) {
    await page.evaluate(
      ({ key, name, id }) => {
        const store = JSON.parse(localStorage.getItem(key)!);
        store.activeRole = name;
        store.packages[id].role = name;
        localStorage.setItem(key, JSON.stringify(store));
      },
      { key: PACKAGE_STORE_KEY, name, id: state.project.id },
    );
    await page.goto(origin + "/documents?testRoles=1");
    await page.getByTestId("table-documents").waitFor();
  }
  for (const [index, name] of roles.entries()) {
    await role(name);
    await page.screenshot({
      path: `${output}/role-${index + 1}-list.png`,
      fullPage: true,
    });
    await page.setViewportSize({width:390,height:844});
    await page.waitForTimeout(350);
    await page.screenshot({path:`${output}/role-${index+1}-list-mobile.png`,fullPage:true});
    fs.writeFileSync(`${output}/mobile-layout.json`,JSON.stringify(await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,items:[...document.querySelectorAll('main *')].map(el=>({tag:el.tagName,cls:el.className,width:el.getBoundingClientRect().width,right:el.getBoundingClientRect().right})).filter(el=>el.right>innerWidth+2)})),null,2));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
    await page.setViewportSize({width:1440,height:1000});
    await page.getByTestId("table-documents").getByRole("button").click();
    await showContext();
    assert.equal(
      await page.getByLabel("Format BA", { exact: true }).inputValue(),
      "internal",
    );
    assert.equal(
      await page.getByLabel("Periode BA", { exact: true }).inputValue(),
      "2",
    );
    assert.equal(
      await page.getByLabel("Jenis survei BA", { exact: true }).inputValue(),
      "IRI",
    );
    if (index !== 0) {
      assert.equal(
        await page
          .getByRole("button", { name: "Simpan revisi draft", exact: true })
          .count(),
        0,
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Ajukan pemeriksaan BA", exact: true })
          .count(),
        0,
      );
    }
    await page.getByText('Ganti konteks dokumen',{exact:true}).click();
    if(index===0)await page.getByRole('button',{name:'Lengkapi isian template',exact:true}).click();
    else {
      assert.equal(await page.locator('.ba-form-sections').count(),0);
      assert.equal(await page.getByTestId('document-review-summary').count(),1);
    }
    await page.screenshot({
      path: `${output}/role-${index + 1}-editor.png`,
      fullPage: true,
    });
    await page.screenshot({
      path: `${output}/role-${index + 1}-editor-top.png`,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(350);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 2,
      ),
      false,
    );
    await page.screenshot({
      path: `${output}/role-${index + 1}-mobile.png`,
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page
      .getByRole("button", { name: "Daftar Dokumen Mutu", exact: true })
      .click();
    await page.getByTestId("table-documents").waitFor();
  }
  results.push(
    "Four roles: list → exact BA identity → list, role-based edit controls, desktop and 390px screenshots",
  );
  await role(roles[0]);
  await page.getByTestId("table-documents").getByRole("button").click();
  await showContext();
  const before = await page.evaluate(
    (key) => localStorage.getItem(key),
    baKey(identity),
  );
  for (const spec of BA_TEMPLATES) {
    if (spec.id === "penerimaan") {
      await role(roles[1]);
      await page.getByTestId("table-documents").getByRole("button").click();
      await showContext();
    }
    if (spec.id === "duaMingguan") {
      await role(roles[0]);
      await page.getByTestId("table-documents").getByRole("button").click();
      await showContext();
    }
    await page.getByLabel("Format BA", { exact: true }).selectOption(spec.id);
    await page
      .getByRole("button", { name: "Pratinjau DOCX", exact: true })
      .click();
    await page.locator(".ba-document-preview section.docx").first().waitFor();
    assert.ok(
      (await page.locator(".ba-document-preview").innerText()).includes(
        "DRAFT LOKAL",
      ),
    );
    const downloadPromise = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "Unduh DOCX draft", exact: true })
      .click();
    const download = await downloadPromise;
    await download.saveAs(`${output}/${spec.id}.docx`);
    await page
      .locator(".ba-document-preview")
      .screenshot({ path: `${output}/preview-${spec.id}.png` });
  }
  assert.equal(
    await page.evaluate((key) => localStorage.getItem(key), baKey(identity)),
    before,
  );
  results.push(
    "Seven original template previews and DOCX downloads succeed; download and preview preserve document versions/status",
  );
  await page.getByLabel("Format BA", { exact: true }).selectOption("internal");
  await page
    .getByRole("button", { name: "Simpan revisi draft", exact: true })
    .click();
  await page
    .getByText("Revisi draft tersimpan di perangkat.", { exact: true })
    .waitFor();
  await page.reload();
  assert.equal(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).versions.length,
      baKey(identity),
    ),
    2,
  );
  assert.equal(
    await page.evaluate(() =>
      localStorage.getItem("jala-ba-draft-v1:legacy-protected"),
    ),
    protectedValue,
  );
  results.push(
    "Explicit save creates checkpoint; reload retains revision and old legacy data",
  );
  const attachmentArea = page
    .locator(".ba-workspace")
    .locator("..")
    .locator(".documents-area")
    .first();
  const chooserPromise = page.waitForEvent("filechooser");
  await attachmentArea
    .getByRole("button", { name: "Tambah berkas", exact: true })
    .click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: "bukti-ba-uji.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("BUKTI UJI TERISOLASI"),
  });
  await attachmentArea.getByText("bukti-ba-uji.txt", { exact: true }).waitFor();
  await page.reload();
  await page.getByText("bukti-ba-uji.txt", { exact: true }).waitFor();
  results.push("BA evidence file persists in IndexedDB across reload");
  const fileCount=await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('jala-local-attachment-index-v1')??'{}')).length);
  await showContext();
  await page.getByLabel('Periode BA',{exact:true}).selectOption('1');
  await page.getByRole('button',{name:'Gunakan berkas tersimpan',exact:true}).click();
  await page.getByLabel('Pilih berkas tersimpan untuk kategori ini',{exact:true}).selectOption({index:1});
  await page.getByText('bukti-ba-uji.txt',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('jala-local-attachment-index-v1')??'{}')).length),fileCount);
  await page.getByRole('button',{name:'Gunakan berkas tersimpan',exact:true}).click();
  await page.getByLabel('Pilih berkas tersimpan untuk kategori ini',{exact:true}).selectOption({index:1});
  await page.getByText('Berkas ini sudah ditautkan. Tambahkan kategori pada keterkaitan yang ada.',{exact:true}).waitFor();
  await page.getByLabel('Periode BA',{exact:true}).selectOption('2');
  results.push('A single stored file is linked across two document periods without duplicating bytes; duplicate reuse within one BA is blocked');

  await page
    .getByRole("button", { name: "Ajukan pemeriksaan BA", exact: true })
    .click();
  await page.getByLabel("Catatan pemeriksaan BA", { exact: true }).waitFor();
  await page
    .getByLabel("Catatan pemeriksaan BA", { exact: true })
    .fill("Lengkapi bukti pengujian");
  await page
    .getByRole("button", { name: "Minta revisi BA", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ajukan pemeriksaan BA", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Ajukan pemeriksaan BA", exact: true })
    .click();
  await page
    .getByLabel("Catatan pemeriksaan BA", { exact: true })
    .fill("Perlu perbaikan hasil sumber");
  await page.getByRole("button", { name: "Tolak BA", exact: true }).click();
  await page
    .getByRole("button", { name: "Ajukan pemeriksaan BA", exact: true })
    .waitFor();
  const savedHistory = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).versions,
    baKey(identity),
  );
  assert.deepEqual(
    savedHistory.slice(-4).map((v: any) => v.status),
    [
      "submitted-local",
      "revision-requested-local",
      "submitted-local",
      "rejected-local",
    ],
  );
  assert.ok(savedHistory.every((v: any) => v.officiallySigned === false));
  await page.reload();
  await page
    .getByText("Catatan pemeriksaan: Perlu perbaikan hasil sumber", {
      exact: true,
    })
    .waitFor();
  results.push(
    "UI submit → revision → resubmit → rejection retains immutable fields/history and never signs",
  );
  await role(roles[3]);
  await page.getByTestId("table-documents").getByRole("button").click();
  await page
    .getByLabel("Kategori lampiran baca saja", { exact: true })
    .waitFor();
  await page
    .getByLabel("Kategori lampiran baca saja", { exact: true })
    .selectOption({ index: 1 });
  await page
    .getByLabel("Kategori lampiran baca saja", { exact: true })
    .selectOption({ index: 0 });
  await page.getByText("bukti-ba-uji.txt", { exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Tambah berkas", exact: true })
      .count(),
    0,
  );
  results.push(
    "Admin can browse evidence categories and read stored files, without upload or technical actions",
  );
  await role(roles[1]);
  await page.getByTestId("table-documents").getByRole("button").click();
  await showContext();
  await page.getByLabel("Format BA", { exact: true }).selectOption("audit");
  await page.getByRole("button", { name: "Buka Tahap 5", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Lihat / susun dokumen audit tingkat 2",
      exact: true,
    })
    .click();
  await showContext();
  await page.getByLabel("Tingkat audit BA", { exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("Tingkat audit BA", { exact: true }).inputValue(),
    "2",
  );
  results.push("Balai audit-level 2 stage link opens audit-level 2 document");
  await role(roles[0]);
  await page.getByTestId("table-documents").getByRole("button").click();
  await showContext();
  await page.getByLabel("Format BA", { exact: true }).selectOption("audit");
  await page.getByRole("button", { name: "Buka Tahap 5", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Lihat / susun dokumen audit tingkat 1",
      exact: true,
    })
    .waitFor();
  await page
    .getByRole("button", {
      name: "Lihat / susun dokumen audit tingkat 1",
      exact: true,
    })
    .click();
  await showContext();
  await page.getByLabel("Tingkat audit BA", { exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("Tingkat audit BA", { exact: true }).inputValue(),
    "1",
  );
  await page
    .getByRole("button", { name: "Kembali ke asal", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Lihat / susun dokumen audit tingkat 1",
      exact: true,
    })
    .waitFor();
  results.push("BA ↔ stage route preserves origin and audit identity");
  assert.deepEqual(errors, []);
  completed = true;
  await context.close();
} catch (error) {
  results.push(String(error));
  throw error;
} finally {
  fs.writeFileSync(
    output + "/results.json",
    JSON.stringify({ completed, results, errors }, null, 2),
  );
  await browser.close();
  await server.close();
}
