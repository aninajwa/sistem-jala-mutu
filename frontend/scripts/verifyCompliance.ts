import { chromium } from "playwright";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createDemoWorkflow } from "../src/workflow/demoScenario";
import { PACKAGE_STORE_KEY } from "../src/workflow/packageStore";

const out = process.env.TEST_ARTIFACTS || "test-artifacts/compliance";
fs.mkdirSync(out, { recursive: true });
const server = await createServer({
  configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url)),
  server: { host: "127.0.0.1", port: 5182, strictPort: true },
});
await server.listen();
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const errors: string[] = [];
const results: string[] = [];
let completed = false;
try {
  const roleNames = [
    "PIC Balai / Pengguna Jasa",
    "Direktorat / Pusat",
    "Admin",
  ] as const;
  const state = createDemoWorkflow("complete");
  state.project.id = "PAKET-E2E-COMPLIANCE-001";
  state.project.packageName = "Paket Uji Analisis Terbatas";
  state.project.balai = "Balai Jawa Barat";
  state.role = roleNames[0];
  state.productionTests.PCI.pciManual = false;
  const context = await browser.newContext({
    viewport: { width: 1365, height: 850 },
    acceptDownloads: true,
  });
  await context.addInitScript(
    ({ key, state }) => {
      if (sessionStorage.getItem("compliance-seed")) return;
      sessionStorage.setItem("compliance-seed", "1");
      localStorage.setItem(
        key,
        JSON.stringify({
          activePackageId: state.project.id,
          activeRole: state.role,
          packages: { [state.project.id]: state },
        }),
      );
      localStorage.setItem("jala-mutu-demo-session-v1", "active");
    },
    { key: PACKAGE_STORE_KEY, state },
  );
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(180000);
  page.setDefaultTimeout(60000);
  page.on("pageerror", (e) => errors.push(e.message));
  const origin = "http://127.0.0.1:5182";
  await page.goto(origin + "/compliance?testRoles=1");
  async function loadRole(role: string, tab = 'Semua') {
    await page.evaluate(({key,role})=>{const store=JSON.parse(localStorage.getItem(key)!);store.activeRole=role;for(const p of Object.values(store.packages) as any[])p.role=role;localStorage.setItem(key,JSON.stringify(store));},{key:PACKAGE_STORE_KEY,role});
    await page.goto(origin + '/compliance?testRoles=1&tab='+encodeURIComponent(tab));
  }
  for(const [role,tab,title] of [[roleNames[0],'Semua','Evaluasi Mutu Paket'],[roleNames[0],'Ketidaksesuaian','Analisis Ketidaksesuaian'],[roleNames[1],'Semua','Kepatuhan per Jenis Survei'],[roleNames[1],'Peringkat','Kepatuhan per Balai'],[roleNames[1],'Tren','Tren Mutu QA/QC']]){
    await loadRole(role,tab);
    const workspace=page.getByTestId('compliance-workspace');
    await workspace.getByRole('heading',{name:title,exact:true}).waitFor();
    assert.equal(await workspace.locator('.b-metric a,.b-metric button,.bi-kpi-detail').count(),0);
    assert.equal(await workspace.locator('.b-view-tabs').count(),0);
    if(title==='Evaluasi Mutu Paket'){assert.equal(await workspace.getByRole('heading',{name:'Matriks evaluasi mutu'}).count(),0);await workspace.getByRole('button',{name:'Lihat evaluasi'}).first().click();await workspace.getByRole('heading',{name:'Matriks evaluasi mutu'}).waitFor();assert.ok(await workspace.locator('table').first().locator('tbody tr').count()<=15);await workspace.getByRole('button',{name:'Tutup evaluasi'}).click();}
    if(title==='Tren Mutu QA/QC'){assert.equal(await workspace.locator('input[type=month]').count(),2);}
    const bars=workspace.locator('.qa-bar-row');
    if(await bars.count()){await bars.first().click();assert.equal(await bars.first().getAttribute('aria-pressed'),'true');await bars.first().click();assert.equal(await bars.first().getAttribute('aria-pressed'),'false');}
    const download=page.waitForEvent('download');await workspace.getByTestId('button-export-compliance').click();assert.ok((await download).suggestedFilename().endsWith('.csv'));
    await page.screenshot({path:`${out}/${tab}-${role===roleNames[0]?'balai':'pusat'}.png`,fullPage:true});
    results.push(title);
  }
  // Follow a specific staged inspection from the analysis, rather than the package landing page.
  await loadRole(roleNames[0]);
  const evaluation=page.getByTestId('compliance-workspace');
  await evaluation.getByLabel('Jenis survei',{exact:true}).selectOption('PCI');
  await evaluation.locator('.qa-bar-row').filter({hasText:'Verval bertahap'}).click();
  await evaluation.getByRole('button',{name:'Buka pemeriksaan'}).first().click();
  await page.getByLabel('Jenis survei checklist sumber',{exact:true}).waitFor();
  assert.equal(await page.getByLabel('Jenis survei checklist sumber',{exact:true}).inputValue(),'PCI');
  results.push('Rincian Verval bertahap → PCI');
  const selector=page.getByLabel('Jenis survei checklist sumber',{exact:true});
  const decisionPanel=page.getByRole('region',{name:'Kesimpulan Verval bertahap',exact:true});
  await decisionPanel.getByRole('radio',{name:'DITERIMA DENGAN CATATAN',exact:true}).waitFor();
  assert.equal(await decisionPanel.getByRole('radio').count(),3);
  assert.equal(await page.locator('[data-source-field="paragraph:p62"]').count(),1);
  assert.equal(await page.getByText('KEMENTERIAN PEKERJAAN UMUM DAN PERUMAHAN RAKYAT',{exact:true}).count(),0);
  await page.screenshot({path:`${out}/staged-pci-ai-decision.png`,fullPage:true});
  await selector.selectOption('RNI');
  await decisionPanel.getByRole('radio',{name:'Disetujui tanpa catatan',exact:true}).waitFor();
  assert.equal(await decisionPanel.getByRole('radio').count(),3);
  assert.equal(await page.locator('[data-source-field="paragraph:p36"]').count(),1);
  await page.screenshot({path:`${out}/staged-rni-decision.png`,fullPage:true});
  await decisionPanel.getByRole('radio',{name:'Disetujui dengan catatan (perbaikan minor)',exact:true}).check();
  assert.equal(await decisionPanel.getByRole('radio',{name:'Disetujui dengan catatan (perbaikan minor)',exact:true}).isChecked(),true);
  const savedRni=await page.evaluate(()=>JSON.parse(localStorage.getItem('jala-source-exact-v1:PAKET-E2E-COMPLIANCE-001:9b870467a26e2b8a')??'{}')['paragraph:p36']);
  assert.equal(savedRni,'Disetujui dengan catatan (perbaikan minor)');
  results.push('Pilihan kesimpulan PCI AI dan RNI terlihat');
  for(const role of ['Admin','Penyedia Jasa / Ketua Tim']){await loadRole(role);await page.getByText('Halaman ini di luar kewenangan Anda',{exact:true}).first().waitFor();assert.equal(await page.getByTestId('compliance-workspace').count(),0);results.push('URL blocked: '+role);}
  assert.deepEqual(errors,[]);completed=true;
} finally {
  fs.writeFileSync(`${out}/summary.json`,JSON.stringify({completed,results,errors},null,2));
  await browser.close();await server.close();
}
console.log('PASS',results.join(' | '));
