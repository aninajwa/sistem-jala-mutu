import { CALIBRATION_REVIEW_SUBJECTS, calibrationSourceSignature } from '../src/workflow/calibrationReview';
import { sourceDocument } from '../src/workflow/sourceDocumentModel';
import { sourceFormFixture } from '../src/workflow/testing/sourceFormFixture';
import { evaluateStageGate } from '../src/workflow/workflowGate';
import { withCompleteDailyRecord } from '../src/workflow/testing/dailyRecordFixture';
import { stagePresentation } from "../src/design/c/stagePresentation";
import { openFilterPanels } from "./filterInteractions";
import { PACKAGE_WORKFLOW_ITEMS } from "../src/workflow/roleNavigation";
import { prepareIriPeriod } from "./sourceFormInteractions";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { checklistCoverageFixture } from "./checklistCoverageFixture";
import { createDemoWorkflow } from "../src/workflow/demoScenario";
import { withProductionReferences } from "../src/workflow/testing/productionFixture";
import { PACKAGE_STORE_KEY } from "../src/workflow/packageStore";
import { SURVEY_TYPES, type WorkflowRole } from "../src/workflow/model";
import { BA_TEMPLATES } from "../src/workflow/ba/docxEngine";
import { sourceDocumentKey } from "../src/workflow/sourceDocumentModel";
import catalog from "../src/workflow/sourceChecklistCatalog.json";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const output =
  process.env.TEST_ARTIFACTS ||
  fileURLToPath(new URL("../test-artifacts/ui09-final", import.meta.url));
fs.mkdirSync(output + "/screenshots", { recursive: true });
fs.mkdirSync(output + "/ba-samples", { recursive: true });
const server = await createServer({
  configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url)),
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
});
await server.listen();
try {
  const response = await fetch("http://127.0.0.1:5173", {signal: AbortSignal.timeout(15000)});
  assert.ok(response.ok && (await response.text()).includes('id="root"'), "Vite entry point unavailable");
  console.log("Vite HTTP ready");
} catch (error) {
  fs.writeFileSync(output + "/startup-error.txt", String(error));
  await server.close();
  throw error;
}
async function navigateReady(page: import("playwright").Page, url: string) {
  const expected = new URL(url);
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      assert.ok(response?.ok(), `Navigation HTTP status: ${response?.status()}`);
      await page.locator('.app-shell .topbar').waitFor({ state: 'visible', timeout: 60000 });
      await page.locator('.jm-loading').waitFor({ state: 'detached', timeout: 60000 });
      const actual = new URL(page.url());
      assert.equal(actual.pathname, expected.pathname, 'Unexpected navigation route');
      console.log(`READY ${expected.pathname} (attempt ${attempt})`);
      return;
    } catch (error) {
      console.error(`Navigation attempt ${attempt}: ${url}`, String(error));
      const prefix = `${output}/navigation-${Date.now()}-${attempt}`;
      fs.writeFileSync(prefix + '.txt', `${url}\n${page.url()}\n${String(error)}`);
      try { await page.screenshot({path: prefix + '.png', timeout: 5000}); } catch {}
      try { fs.writeFileSync(prefix + '-dom.txt', await page.locator('body').innerText({timeout: 3000})); } catch {}
      if (attempt === 2) throw error;
    }
  }
}
async function reloadReady(page: import("playwright").Page) {
  const url = page.url();
  // Refresh must retain localStorage and use actual reload semantics.
  await page.reload({waitUntil: 'domcontentloaded', timeout: 60000});
  await page.locator('.app-shell .topbar').waitFor({state:'visible', timeout:60000});
  await page.locator('.jm-loading').waitFor({state:'detached', timeout:60000});
  assert.equal(new URL(page.url()).pathname, new URL(url).pathname);
}

const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.CHROMIUM_EXECUTABLE }
    : {}),
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const roles: WorkflowRole[] = [
  "Penyedia Jasa / Ketua Tim",
  "PIC Balai / Pengguna Jasa",
  "Direktorat / Pusat",
  "Admin",
];
const selections = [
  "/entry:Persiapan & SPMK",
  "/documents:Kalibrasi & personel",
  "/entry:Validasi produksi",
  "/entry:Survei harian",
  "/verification:Verval 14 hari",
  "/entry:Gerbang RNI/LRS",
  "/verification:Audit tingkat 1–3",
  "/reports:Penerimaan & termin",
];
const results: any[] = [],
  errors: string[] = [];
const pending:string[]=[];
const failures:{scope:string,error:string}[]=[];
const fixture = withProductionReferences(createDemoWorkflow("complete"));
fixture.project.surveyTypes = [...SURVEY_TYPES];
fixture.project.id = "CP09-TEST";
fixture.project.packageName = "Paket pengujian Checkpoint 09";
fixture.project.surveyStartDate = "2027-05-01";
fixture.project.surveyEndDate = "2027-05-28";
fixture.productionTests.PCI.pciManual = true;
fixture.corrections = [];
const navigate = async (page: any, selection: string) => {
  await navigateReady(page, 
    `http://127.0.0.1:5173${selection.split(":")[0]}?testRoles=1&submodule=${encodeURIComponent(selection)}`,
  );
  await openFilterPanels(page);
  await page
    .locator(selection.startsWith("/actions:") ? "main" : selection.includes("Survei harian") ? ".stage3a-title h1" : selection.includes("Audit tingkat") ? ".stage5-header h2" : ".wf-title")
    .first()
    .waitFor({ timeout: 30000 });
};
async function noOverflow(page: any, label: string) {
  const bad = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth + 2,
  );
  if (bad) {
    await page.screenshot({
      path: output + "/overflow-" + label.replace(/[^a-z0-9]/gi, "-") + ".png",
    });
    fs.writeFileSync(
      output + "/overflow-details.json",
      JSON.stringify(
        await page
          .locator("body *")
          .evaluateAll((els: any[]) =>
            els
              .filter((el) => el.getBoundingClientRect().right > innerWidth + 2)
              .map((el) => ({
                tag: el.tagName,
                class: el.className,
                text: el.textContent?.slice(0, 80),
                right: el.getBoundingClientRect().right,
              })),
          ),
        null,
        2,
      ),
    );
  }
  assert.equal(bad, false, label);
}
async function setup(role: WorkflowRole, custom = fixture, sourceAnswers:Record<string,string> = {}) {
  const state = { ...structuredClone(custom), role };
  if (custom === fixture) {
    const sample = structuredClone(
      createDemoWorkflow("verval-finding").corrections[0],
    );
    sample.id = "UI09-CASE";
    sample.owner = "Ketua Tim";
    sample.rootCause = "Metode";
    sample.fieldDataValid = "Tidak";
    sample.evidence = "Referensi laporan dan bukti pengujian";
    sample.actionType = "Survei ulang sebagian ruas";
    sample.status =
      role === roles[1]
        ? "Menunggu Persetujuan"
        : role === roles[2]
          ? "Dilaksanakan"
          : "Terbuka";
    sample.approval =
      role === roles[1]
        ? "Diajukan"
        : role === roles[2]
          ? "Disetujui"
          : "Draft";
    sample.verification = {
      surveyor: role !== roles[0],
      teamLeader: role !== roles[0],
      balai: role === roles[2],
    };
    if (role === roles[2]) {
      sample.blockedStage = "Audit tingkat 3";
      sample.returnStage = "Audit tingkat 3";
      sample.source = "Penolakan audit tingkat 3";
      sample.executionReference = "EXEC-UI09";
    }
    state.corrections = [sample];
  }
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    acceptDownloads: true,
  });
  await context.addInitScript(
    ({ key, state, role, sourceAnswers }) => {
      if (
        location.origin !== "http://127.0.0.1:5173" ||
        sessionStorage.getItem("cp09seed")
      )
        return;
      sessionStorage.setItem("cp09seed", "yes");
      localStorage.setItem(
        key,
        JSON.stringify({
          activePackageId: state.project.id,
          activeRole: role,
          packages: Object.fromEntries([state.project.id,"PAKET-DEMO-003","PAKET-DEMO-004"].map(id=>{const copy=structuredClone(state);copy.project.id=id;if(id!==state.project.id)copy.corrections=[];return [id,copy];})),
        }),
      );
      localStorage.setItem("jala-mutu-demo-session-v1", "active");
      for (const [key,value] of Object.entries(sourceAnswers)) localStorage.setItem(key,value);
    },
    { key: PACKAGE_STORE_KEY, state, role, sourceAnswers },
  );
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(60000);
  page.on("pageerror", (e: any) => errors.push(e.message));
  return { page, context };
}
async function openCase(page: import('playwright').Page, role: WorkflowRole, id: string, tab: string) {
 const width=page.viewportSize()?.width??1440;
 if(width<780&&!(await page.locator('.sidebar.open').count()))await page.locator('.mobile-toggle').click();
 const module=page.locator('.nav-module-button').filter({hasText:'Tindakan Perbaikan'});
 if(await module.getAttribute('aria-expanded')!=='true')await module.click();
 await module.locator('..').getByRole('button',{name:tab,exact:true}).click();
 const dashboard=page.locator('.corr-dashboard');await dashboard.getByRole('heading',{name:tab,exact:true}).waitFor();
 const row=(role===roles[0]?dashboard.locator('.provider-case-queue > li'):dashboard.locator('.corr-submodule tbody tr')).filter({has:page.getByText(id,{exact:true})});
 assert.equal(await row.count(),1,id);
 await (role===roles[0]?row.locator('.provider-case-action button'):row.locator('.corr-row-actions button')).click();
 await page.locator('.case-detail-header').getByRole('heading',{name:id,exact:true}).waitFor();
}
async function openCalibrationForm(page: import('playwright').Page) {
 const form=page.locator('.source-exact-checklist').first();await form.waitFor({state:'attached'});
 await form.evaluate(element=>{for(let p=element.parentElement;p;p=p.parentElement)if(p instanceof HTMLDetailsElement)p.open=true;for(const d of element.querySelectorAll('details'))d.open=true;});
 return form;
}
// The redesigned BA editor mounts only one section at a time.
async function visitBaSections(page: import('playwright').Page, visit: () => Promise<boolean>) {
  const picker = page.getByRole('combobox', {name:'Bagian formulir',exact:true});
  await picker.waitFor();
  const sections = await picker.locator('option').evaluateAll(options => options.map(o => (o as HTMLOptionElement).value));
  assert.ok(sections.length && sections.every(Boolean), 'BA section list missing');
  for (const section of sections) {
    await picker.selectOption(section);
    await page.locator('.ba-form-section').getByRole('heading',{name:section,exact:true}).waitFor();
    if (await visit()) return true;
  }
  return false;
}
const baHistoryOnly = process.argv.includes("--ba-history-only") || process.env.JALA_UI09_BA_HISTORY_ONLY === "1";
const sourceCoverageOnly = process.argv.includes("--source-coverage-only") || process.env.JALA_UI09_SOURCE_COVERAGE_ONLY === "1";
assert.ok(!(sourceCoverageOnly && baHistoryOnly), "Choose only one scoped suite");
const runScope = sourceCoverageOnly ? "source-coverage-only" : baHistoryOnly ? "ba-decision-history-only" : "full";
const executedGroups:string[]=[];
async function group(scope:string,run:()=>Promise<void>){
 if(baHistoryOnly && scope!=="ba-decision-history")return;
 if(sourceCoverageOnly && !scope.startsWith("source-"))return;
 executedGroups.push(scope);
 console.log('RUN',scope);
 try{await run();console.log('DONE',scope);}catch(error){failures.push({scope,error:String(error)});console.error('FAIL',scope,String(error));for(const ctx of browser.contexts())for(const p of ctx.pages()){try{await p.screenshot({path:`${output}/failure-${scope}.png`,timeout:5000});fs.writeFileSync(`${output}/failure-${scope}-dom.txt`,await p.locator('body').innerText({timeout:3000}));}catch{}}}finally{for(const ctx of browser.contexts())await ctx.close();fs.writeFileSync(output+'/results.json',JSON.stringify({scope:runScope,executedGroups,results,errors,failures,pending},null,2));}
}
try {
  await group("stage-layout",async()=>{
  if (!process.env.CP09_INTERACTIONS_ONLY)
    for (let r = 0; r < roles.length; r++) {
      console.log("ROLE", r);
      const { page, context } = await setup(roles[r]);
      const navLabel = (label: string) => label + (r >= 2 ? " · Lihat" : "");
      for (const width of [1440, 360, 390]) {
        await page.setViewportSize({
          width,
          height: width === 390 ? 844 : 1000,
        });
        for (let i = 0; i < selections.length; i++) {
          await navigate(page, selections[i]);
          for (const item of PACKAGE_WORKFLOW_ITEMS)
            assert.equal(
              await page
                .getByTestId("stage-nav-" + item.code.replace("Tahap ", ""))
                .count(),
              1,
            );
          if (width < 780)
            assert.equal(await page.locator(".sidebar.open").count(), 0);
          assert.equal(
            await page
              .getByTestId(
                "stage-nav-" +
                  PACKAGE_WORKFLOW_ITEMS[i].code.replace("Tahap ", ""),
              )
              .getAttribute("aria-current"),
            "step",
          );
          // The removed generic source index is no longer a stage workspace.
          // Check the actual role-specific scene; source forms are checked separately below.
          assert.equal(await page.locator('.v2-stage-scene').getAttribute('data-mode'), stagePresentation(roles[r], PACKAGE_WORKFLOW_ITEMS[i].code).mode);
          if (
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth + 2,
            )
          ) {
            await page.screenshot({ path: output + "/overflow.png" });
            fs.writeFileSync(
              output + "/overflow.json",
              JSON.stringify(
                await page
                  .locator("body *")
                  .evaluateAll((els: any[]) =>
                    els
                      .filter(
                        (el) =>
                          el.getBoundingClientRect().right > innerWidth + 2,
                      )
                      .map((el) => ({
                        tag: el.tagName,
                        class: el.className,
                        text: el.textContent?.slice(0, 70),
                        right: el.getBoundingClientRect().right,
                      })),
                  ),
                null,
                2,
              ),
            );
          }
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth + 2,
            ),
            false,
            `overflow ${r} ${i} ${width}`,
          );
          if (i === 0)
            await page.screenshot({
              path: `${output}/screenshots/first-fold-r${r}-${width}.png`,
              animations: "disabled",
            });
          if (i === 4 || i === 6)
            await page.screenshot({
              path: `${output}/screenshots/r${r}-s${i}-${width}.png`,
              animations: "disabled",
            });
          results.push({
            role: roles[r],
            stage: selections[i],
            width,
            result: "pass",
            check: "stage navigation, actual role scene, responsive page",
          });
        }
        for (const index of [7, 0]) {
          const button = page.getByTestId(
            "stage-nav-" +
              PACKAGE_WORKFLOW_ITEMS[index].code.replace("Tahap ", ""),
          );
          await button.focus();
          await page.keyboard.press("Enter");
          assert.equal(await button.getAttribute("aria-current"), "step");
          await page.locator(".wf-title").first().waitFor();
        }
        if (width !== 1440)
          await page.screenshot({
            path: `${output}/screenshots/package-keyboard-r${r}.png`,
            animations: "disabled",
          });
        results.push({
          role: roles[r],
          width,
          result: "pass",
          check:
            "keyboard contextual stepper Enter navigates acceptance and preparation",
        });
        await navigateReady(page, "http://127.0.0.1:5173/documents?testRoles=1");
        await openFilterPanels(page);
        await page
          .getByText("Grafik status & cakupan dokumen", { exact: true })
          .click();
        await page.locator(".cp09-insights").waitFor();
        assert.match(
          await page.locator(".cp09-insights").innerText(),
          /0 identitas dokumen/,
        );
        await noOverflow(page, "documents-" + r + "-" + width);
        await page.screenshot({
          path: `${output}/screenshots/documents-r${r}-${width}.png`,
          animations: "disabled",
        });
        results.push({
          role: roles[r],
          width,
          result: "pass",
          check: "Dokumen Mutu empty denominator and responsive",
        });
        await navigateReady(page, "http://127.0.0.1:5173/actions?testRoles=1");
        await openFilterPanels(page);
        await page.locator(".corr-dashboard").waitFor();
        assert.equal(
          await page.getByTestId("mobile-global-filters").isVisible(),
          false,
        );
        await page.screenshot({
          path: `${output}/screenshots/corrections-r${r}-${width}.png`,
          animations: "disabled",
        });
        await noOverflow(page, "corrections-" + r + "-" + width);
        results.push({
          role: roles[r],
          width,
          result: "pass",
          check: "correction role entry, responsive",
        });
        await openCase(page,roles[r],"UI09-CASE",["Tugas Saya","Antrian Verifikasi","Verifikasi Ulang","Monitoring Kasus"][r]);
        await noOverflow(page, "detail-" + r + "-" + width);
        await page.screenshot({
          path: `${output}/screenshots/correction-detail-r${r}-${width}.png`,
          animations: "disabled",
        });
        if (r === 3)
          assert.equal(
            await page
              .getByRole("button", { name: "Tutup kasus", exact: true })
              .count(),
            0,
          );
        if (r === 2)
          assert.equal(
            await page
              .getByRole("button", {
                name: "Simpan hasil pemeriksaan",
                exact: true,
              })
              .count(),
            1,
          );
        results.push({
          role: roles[r],
          width,
          result: "pass",
          check:
            "real correction detail, role action visibility and responsive",
        });
      }
      await context.close();
    }

  });
  await group("sidebar-links",async()=>{
  // The package links must reach real module lists rather than an unselected correction detail.
  for (const role of roles) {
    const { page, context } = await setup(role);
    await page.setViewportSize({ width: 360, height: 844 });
    await navigate(page, selections[0]);
    async function chooseModule(label: string, child: string, route: string) {
      if (!(await page.locator('.sidebar.open').count())) await page.locator('.mobile-toggle').click();
      const module = page.locator('.nav-module-button').filter({hasText: label});
      if (await module.getAttribute('aria-expanded') !== 'true') await module.click();
      await module.locator('..').getByRole('button', {name: child, exact: true}).click();
      await page.locator('.sidebar.open').waitFor({state:'detached'});
      assert.equal(new URL(page.url()).pathname, route);
    }
    const index = roles.indexOf(role);
    await chooseModule('Tindakan Perbaikan', ['Tugas Saya','Antrian Verifikasi','Temuan Lintas Paket','Monitoring Kasus'][index], '/actions');
    await page.locator('.corr-dashboard').waitFor();
    assert.equal(await page.locator('.case-detail-header').count(), 0);
    await navigate(page, selections[0]);
    await chooseModule('Dokumen Mutu', ['Tugas Dokumen','Antrian Pemeriksaan','Audit & Dokumen Pusat','Monitoring Dokumen'][index], '/documents');
    await page.locator('.documents-page').waitFor();
    results.push({
      role,
      result: "pass",
      check:
        "actual sidebar module links reach usable corrections and document lists on 360px",
    });
    await context.close();
  }


  });
  await group("proposal-review",async()=>{
  // Real proposal/review controls remain operable after the compact layout changes.
  for (const width of [1440, 360, 390])
    for (const role of roles.slice(0, 2)) {
      const { page, context } = await setup(role);
      await page.setViewportSize({ width, height: 844 });
      await navigateReady(page, "http://127.0.0.1:5173/actions?testRoles=1");
      await openFilterPanels(page);
      await openCase(page,role,"UI09-CASE",role===roles[0]?"Tugas Saya":"Antrian Verifikasi");
      assert.equal(await page.evaluate(() => window.scrollY), 0);
      if (role === roles[0]) {
        const plan=page.getByTestId('input-case-proposed-plan-UI09-CASE');
        if(!await plan.isVisible()){const edit=page.getByRole('button',{name:'Mulai perbaikan',exact:true});if(await edit.isVisible())await edit.click();else await page.getByRole('button',{name:'Edit draft',exact:true}).click();}
        await page.getByLabel('Penanggung jawab pelaksanaan',{exact:true}).fill('PIC UI final');
        await plan.fill('Rencana survei ulang dan dokumentasi bukti.');
        await page.getByRole('button',{name:'Simpan draf & lanjut',exact:true}).click();
        assert.equal(await page.getByTestId('check-correction-verify-surveyor').count(),0);
        await page.getByRole('button',{name:'Catat pengajuan',exact:true}).click();
      } else {
        await page.getByRole("button",{name:"Lanjut ke usulan",exact:true}).click();
        await page.getByRole("button",{name:"Lanjut ke keputusan",exact:true}).click();
        await page.getByTestId("check-correction-verify-balai").check();
        await page
          .getByTestId("input-case-review-note")
          .fill("Usulan dan bukti diperiksa pada uji UI");
        await page
          .getByRole("button", { name: "Setujui usulan", exact: true })
          .click();
      }
      const expected = role === roles[0] ? "Menunggu Persetujuan" : "Disetujui";
      try {
        await page.waitForFunction(
          ({ key, expected }) =>
            JSON.parse(localStorage.getItem(key)!).packages[
              "CP09-TEST"
            ].corrections.find((c: any) => c.id === "UI09-CASE")?.status ===
            expected,
          { key: PACKAGE_STORE_KEY, expected },
          { timeout: 5000 },
        );
      } catch (error) {
        console.log(
          "PRIMARY ACTION FAILED",
          role,
          width,
          await page.locator(".notice").allTextContents(),
          await page.evaluate(
            (key) =>
              JSON.parse(localStorage.getItem(key)!).packages[
                "CP09-TEST"
              ].corrections.find((c: any) => c.id === "UI09-CASE"),
            PACKAGE_STORE_KEY,
          ),
        );
        await page.screenshot({ path: output + "/primary-failed.png" });
        throw error;
      }
      await noOverflow(page, "action-" + width + "-" + roles.indexOf(role));
      results.push({
        role,
        width,
        result: "pass",
        check:
          "actual primary proposal or review action persists with unchanged authorization",
      });
      await context.close();
    }


  });
  await group("audit3-return",async()=>{
  {
    const custom = createDemoWorkflow("verval-finding");
    custom.project.id = "CP09-TEST";
    custom.corrections = [
      {
        ...custom.corrections[0],
        id: "UI09-REVISION",
        source: "Penolakan audit tingkat 3",
        blockedStage: "Audit tingkat 3",
        returnStage: "Audit tingkat 3",
        status: "Menunggu Persetujuan",
        approval: "Diajukan",
        retest: "Belum Diuji",
        verification: { surveyor: true, teamLeader: true, balai: false },
      },
    ];
    const { page, context } = await setup(roles[1], custom);
    await page.setViewportSize({ width: 360, height: 844 });
    await navigateReady(page, "http://127.0.0.1:5173/actions?testRoles=1");
    await openFilterPanels(page);
    await openCase(page,roles[1],"UI09-REVISION","Antrian Verifikasi");
    await page.getByRole("button",{name:"Lanjut ke usulan",exact:true}).click();
    await page.getByRole("button",{name:"Lanjut ke keputusan",exact:true}).click();
    await page
      .getByTestId("input-case-review-note")
      .fill("Lengkapi bukti usulan audit3");
    await page
      .getByRole("button", { name: "Kembalikan untuk revisi", exact: true })
      .click();
    await page.waitForFunction(
      (key) =>
        JSON.parse(localStorage.getItem(key)!).packages["CP09-TEST"]
          .corrections[0].status === "Terbuka",
      PACKAGE_STORE_KEY,
    );
    const c = await page.evaluate(
      (key) =>
        JSON.parse(localStorage.getItem(key)!).packages["CP09-TEST"]
          .corrections[0],
      PACKAGE_STORE_KEY,
    );
    assert.equal(c.approval, "Perlu Revisi");
    assert.equal(c.retest, "Belum Diuji");
    assert.equal(c.verification.surveyor, false);
    results.push({
      role: roles[1],
      width: 360,
      result: "pass",
      check:
        "Balai returns audit3 proposal for revision without acquiring Directorate retest rights",
    });
    await context.close();
  }


  });
  await group("calibration-persistence",async()=>{
  // Real source inputs remain readable/editable and retain their exact repository values.
  for (const width of [1440, 360, 390]) {
    const { page, context } = await setup(roles[0]);
    await page.setViewportSize({ width, height: 844 });
    await navigate(page, selections[1]);
    const source = catalog.find(d=>d.survey==="IRI"&&d.phase==="calibration")!;
    const form=await openCalibrationForm(page);
    assert.equal(await form.getAttribute('data-source-document-id'),source.id);
    const input=form.locator('input[type=text]:not([disabled])').first();
    await input.fill("Bukti input UI final");
    await input.press("Tab");
    if (width < 780)
      assert.ok(
        await input.evaluate(
          (el: HTMLElement) => parseFloat(getComputedStyle(el).fontSize) >= 16,
        ),
      );
    await noOverflow(page, "source-form-" + width);
    await input.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `${output}/screenshots/source-form-${width}.png`,
      animations: "disabled",
    });
    await reloadReady(page);
    const restored=await openCalibrationForm(page);
    assert.equal(await restored.getAttribute('data-source-document-id'),source.id);
    assert.equal(
      await restored
        .locator("input[type=text]:not([disabled])")
        .first()
        .inputValue(),
      "Bukti input UI final",
    );
    results.push({
      role: roles[0],
      width,
      result: "pass",
      check:
        "real source field, readable mobile font, no page overflow and persistence after reload",
    });
    await context.close();
  }


  });
  await group("source-index-coverage",async()=>{
    if (process.env.CP09_INTERACTIONS_ONLY && !sourceCoverageOnly) return;
    const ids=catalog.map(d=>d.id);
    assert.equal(new Set(ids).size,ids.length);
    assert.equal(ids.length,55);
    // Each identity is exercised at its owning workspace, never via the removed generic index.
    // A synthetic prior-stage snapshot is validated in checklistCoverageFixture for the periodic Balai view.
    // One failure does not stop the remaining identities. No sourceId PASS is recorded on a failed group.
    for (const [index,doc] of catalog.entries()) {
      await group(`source-${doc.id}`,async()=>{
        const {custom,sourceAnswers,type}=checklistCoverageFixture(doc);
        const level=('auditLevel' in doc && typeof doc.auditLevel==='number')?doc.auditLevel:1;
        const role=doc.phase==='audit'?roles[level-1]:['periodic14','staged','acceptance'].includes(doc.phase)?roles[1]:roles[0];
        const {page,context}=await setup(role,custom,sourceAnswers);
        const width=index%2===0?1440:360;
        await page.setViewportSize({width,height:900});
        const stage=doc.phase==='calibration'?1:['consistency','internal','periodic14'].includes(doc.phase)?4:doc.phase==='staged'?5:doc.phase==='audit'?6:7;
        await navigate(page,selections[stage]);
        if(doc.phase==='calibration') {
          await page.locator('.stage1-inspection > summary').click();
        } else if(['consistency','internal','periodic14'].includes(doc.phase)) {
          const label=doc.phase==='consistency'?'Konsistensi':doc.phase==='internal'?'V&V Internal':'Pemeriksaan Bersama';
          await page.getByRole('navigation',{name:'Pekerjaan Tahap 3B'}).getByRole('button',{name:label,exact:true}).click();
          if(doc.phase==='periodic14')await page.getByTestId('select-periodic-review-survey').selectOption(type);
        } else if(doc.phase==='staged') {
          await page.getByTestId('stage4-tab-bertahap').click();
        } else if(doc.phase==='audit') {
          await page.getByTestId(`button-audit-level-${level}`).click();
          await page.getByTestId('stage5-tab-formulir').click();
        } else if(doc.phase==='acceptance') {
          await page.getByTestId('stage6-tab-criteria').click();
        } else throw new Error(`Unknown checklist phase ${doc.phase}`);
        if(doc.id==='ba-audit-lendutan'){
          // Supplementary general audit reference: download only, not a second editable form.
          const link=page.locator(`[data-source-reference-id="${doc.id}"]`);
          await link.waitFor({state:'visible'});
          assert.equal(await page.locator(`[data-source-document-id="${doc.id}"]`).count(),0);
          const mainDoc=sourceDocument(type,'audit',true,level)!;
          assert.notEqual(mainDoc.id,doc.id);
          await page.locator(`[data-source-document-id="${mainDoc.id}"]`).waitFor({state:'visible'});
          const [download]=await Promise.all([page.waitForEvent('download'),link.click()]);
          const saved=`${output}/ba-samples/checklist-${doc.id}.docx`;
          await download.saveAs(saved);
          assert.equal(createHash('sha256').update(fs.readFileSync(saved)).digest('hex'),doc.sha256);
          await noOverflow(page,`source-${doc.id}`);
          await link.scrollIntoViewIfNeeded();
        } else {
          const form=page.locator(`.source-exact-checklist[data-source-document-id="${doc.id}"]`);
          await form.waitFor({state:'visible'});
          assert.equal(await form.count(),1,`${doc.id}: source identity must not be duplicated`);
          assert.ok(await form.locator('[data-source-field],[data-source-table]').count()>0,`${doc.id}: form has no mapped source fields/tables`);
          const response=await context.request.get(`http://127.0.0.1:5173/${doc.asset}`);
          assert.ok(response.ok(),`${doc.id}: original asset HTTP ${response.status()}`);
          assert.equal(createHash('sha256').update(await response.body()).digest('hex'),doc.sha256,`${doc.id}: original asset mismatch`);
          await noOverflow(page,`source-${doc.id}`);
          await form.locator('.wf-panel-head').first().scrollIntoViewIfNeeded();
        }
        await page.screenshot({path:`${output}/screenshots/source-${doc.id}-${width}.png`,animations:'disabled'});
        results.push({result:'pass',sourceId:doc.id,survey:doc.survey,phase:doc.phase,role,width,
          check:doc.id==='ba-audit-lendutan'?'supplementary download and separate main audit form':'actual owning workspace renders exact source ID; original asset SHA256 matches',fixture:'isolated synthetic prior-stage data'});
        await context.close();
      });
    }
    const reached=results.filter(r=>r.sourceId).map(r=>r.sourceId);
    const missing=ids.filter(id=>!reached.includes(id));
    if(missing.length)pending.push(`Unverified checklist IDs: ${missing.join(', ')}`);
    assert.deepEqual([...reached].sort(),[...ids].sort(),'55 checklist identities must all be reached exactly once');
  });
  await group("seven-ba-drafts",async()=>{
  // All seven BA drafts survive reload and download through real buttons (no official signing).
  for (const t of BA_TEMPLATES)
    for (const width of [1440, 360, 390]) {
      await group(`ba-${t.id}-${width}`, async()=>{
      console.log("BA", t.id, width);
      const role = ["kalibrasi", "konsistensi", "internal", "audit"].includes(
        t.id,
      )
        ? roles[0]
        : roles[1];
      const { page, context } = await setup(role);
      await page.setViewportSize({ width, height: 844 });
      await navigate(page, "/documents:BA & dokumen workflow");
      await page.getByText("Ganti konteks dokumen", { exact: true }).click();
      await page.getByLabel("Format BA", { exact: true }).selectOption(t.id);
      await page
        .getByRole("button", { name: "Lengkapi isian template", exact: true })
        .click();
      const marker = 'Isian uji Checkpoint 09';
      let sectionName = '', fieldLabel = '';
      assert.ok(await visitBaSections(page, async () => {
        const field = page.locator('.ba-field-row textarea:not([disabled])').first();
        if (!(await field.count())) return false;
        sectionName = await page.getByRole('combobox',{name:'Bagian formulir',exact:true}).inputValue();
        fieldLabel = await field.locator('..').locator('label').innerText();
        await field.fill(marker);
        return true;
      }), 'No editable text field in BA '+t.id);
      await reloadReady(page);
      await page.getByText("Ganti konteks dokumen", { exact: true }).click();
      await page.getByLabel("Format BA", { exact: true }).selectOption(t.id);
      await page
        .getByRole("button", { name: "Lengkapi isian template", exact: true })
        .click();
      await page.getByRole('combobox',{name:'Bagian formulir',exact:true}).selectOption(sectionName);
      const restored = page.locator('.ba-field-row').filter({has:page.getByText(fieldLabel,{exact:true})}).locator('textarea').first();
      assert.equal(await restored.inputValue(), marker);
      if (t.id === "penerimaan")
        await page
          .getByLabel("Tahun pelaksanaan BA", { exact: true })
          .fill("2026");
      const download = page.waitForEvent("download", { timeout: 15000 });
      await page
        .getByRole("button", { name: "Unduh DOCX draft", exact: true })
        .click();
      await page.screenshot({ path: output + "/ba-current.png" });
      console.log(
        "download clicked",
        await page.locator(".ba-workspace [role=status]").allTextContents(),
      );
      await (
        await download
      ).saveAs(`${output}/ba-samples/${t.id}-${width}.docx`);
      assert.ok(
        fs.statSync(`${output}/ba-samples/${t.id}-${width}.docx`).size > 1000,
      );
      await noOverflow(page, "BA-" + t.id + "-" + width);
      results.push({
        format: t.id,
        width,
        result: "pass",
        check: "real draft persistence, responsive editor and DOCX download",
      });
      await context.close();
      });
    }

  });
  await group("ba-decision-history",async()=>{
  // BA decision history follows real UI; empty source blocks approval even if legacy technical flags pass.
  {
    const custom = structuredClone(fixture);
    custom.project.surveyTypes = ["IRI"];
    custom.project.surveyStartDate = "2027-01-01";
    custom.project.surveyEndDate = "2027-12-31";
    custom.activeCyclePeriod = 1;
    const sourceAnswers: Record<string,string> = {};
    custom.dailyRecords = custom.dailyRecords.filter(record => record.surveyType === "IRI")
      .map(record => withCompleteDailyRecord({ ...record, date: "2027-01-07", state: "Tercatat" }));
    custom.cycle = { ...custom.cycle, selectedTypes: ["IRI"], periodCompleted: false,
      submittedRecordIds: undefined, certificateId: "", userReview: "Belum Diperiksa",
      surveyReviews: {}, reviewPendingTypes: [], requiresReview: false };
    const doc = sourceDocument("IRI", "calibration")!;
    sourceAnswers[sourceDocumentKey(custom.project.id, doc.id)] = JSON.stringify(sourceFormFixture(doc, custom.project));
    const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => sourceAnswers[key] ?? null } });
    try {
      const section = {
        result: 'Sesuai' as const, reviewer: roles[1], reviewedAt: custom.simulationDate,
        note: 'Kalibrasi IRI diperiksa untuk skenario BA', evidenceReference: 'BA-KAL-IRI-UJI',
        sourceSignature: calibrationSourceSignature(custom, 'IRI'),
      };
      custom.calibrationReviews = { IRI: { ...section, subject: CALIBRATION_REVIEW_SUBJECTS[0],
        sections: Object.fromEntries(CALIBRATION_REVIEW_SUBJECTS.map(subject => [subject, section])),
      } };
      assert.equal(evaluateStageGate(custom, 'Tahap 2').readyToComplete, true);
    } finally {
      if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage);
      else Reflect.deleteProperty(globalThis, 'localStorage');
    }
    const { page, context } = await setup(roles[0], custom, sourceAnswers);
    const url =
      "http://127.0.0.1:5173/documents?testRoles=1&submodule=" +
      encodeURIComponent("/documents:BA & dokumen workflow");
    async function openDocument() {
      await navigateReady(page, url);
      await openFilterPanels(page);
      await page.getByText("Ganti konteks dokumen", { exact: true }).click();
      await page
        .getByLabel("Format BA", { exact: true })
        .selectOption("duaMingguan");
    }
    async function actor(role: WorkflowRole) {
      await page.evaluate(
        ({ key, role }) => {
          const s = JSON.parse(localStorage.getItem(key)!);
          s.activeRole = role;
          s.packages["CP09-TEST"].role = role;
          localStorage.setItem(key, JSON.stringify(s));
        },
        { key: PACKAGE_STORE_KEY, role },
      );
      await openDocument();
    }
    await openDocument();
    await page
      .getByRole("button", { name: "Lengkapi isian template", exact: true })
      .click();
    await visitBaSections(page, async () => {
      for (const input of await page.locator('.ba-field-row textarea:not([disabled])').all())
        await input.fill('Isian pengujian pemeriksaan BA');
      for (const input of await page.locator('.ba-field-row input[type=date]:not([disabled])').all())
        await input.fill('2027-01-14');
      for (const input of await page.locator('.ba-field-row select:not([disabled])').all())
        await input.selectOption({index:1});
      return false;
    });
    await page
      .getByRole("button", { name: "Ajukan pemeriksaan BA", exact: true })
      .click();
    await actor(roles[1]);
    const approve = page.getByRole("button", {
      name: "Selesaikan pemeriksaan BA",
      exact: true,
    });
    assert.equal(await approve.isDisabled(), true);
    assert.match((await approve.getAttribute("title")) || "", /Checklist/);
    await page
      .getByLabel("Catatan pemeriksaan BA")
      .fill("Bukti sumber belum lengkap");
    await page.getByRole("button", { name: "Tolak BA", exact: true }).click();
    await actor(roles[0]);
    await page
      .getByRole("button", { name: "Ajukan pemeriksaan BA", exact: true })
      .click();
    await actor(roles[1]);
    await page.getByLabel("Catatan pemeriksaan BA").fill("Perjelas lokasi");
    await page
      .getByRole("button", { name: "Minta revisi BA", exact: true })
      .click();
    await prepareIriPeriod(page, actor);
    const submitted = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).packages['CP09-TEST'].cycle, PACKAGE_STORE_KEY);
    assert.deepEqual(submitted.submittedRecordIds, ['IRI-001'], 'Actual UI handover must record the eligible IRI record');
    assert.equal(submitted.periodCompleted,true);
    await actor(roles[0]);
    await page
      .getByRole("button", { name: "Ajukan pemeriksaan BA", exact: true })
      .click();
    await actor(roles[1]);
    await page
      .getByRole("button", { name: "Selesaikan pemeriksaan BA", exact: true })
      .click();
    await page
      .getByText("Pemeriksaan selesai", { exact: true })
      .first()
      .waitFor();
    await reloadReady(page);
    await page.getByText("Ganti konteks dokumen", { exact: true }).click();
    await page
      .getByLabel("Format BA", { exact: true })
      .selectOption("duaMingguan");
    await page
      .getByText("Pemeriksaan selesai", { exact: true })
      .first()
      .waitFor();
    const versions = await page.evaluate(
      () =>
        JSON.parse(
          localStorage.getItem(
            "jala-ba-source-v1:CP09-TEST:duaMingguan:1:IRI:1",
          )!,
        ).versions,
    );
    assert.deepEqual(
      versions.map((v: any) => v.status),
      [
        "submitted-local",
        "rejected-local",
        "submitted-local",
        "revision-requested-local",
        "submitted-local",
        "reviewed-local",
      ],
    );
    assert.ok(versions.every((v: any) => v.officiallySigned === false));
    await page.screenshot({
      path: output + "/screenshots/ba-revision-reviewed.png",
    });
    results.push({
      result: "pass",
      check:
        "BA normal/reject/revise/resubmit/review with source completeness blocking and immutable unsigned history",
    });
    await context.close();
  }


  });
  await group("document-filters",async()=>{
  // Real filtered document graph, including live notifications after draft edits.
  {
    const { page, context } = await setup(roles[1]);
    await navigateReady(page, "http://127.0.0.1:5173/documents?testRoles=1");
    await openFilterPanels(page);
    await page
      .getByText("Grafik status & cakupan dokumen", { exact: true })
      .click();
    await page.locator(".cp09-insights").waitFor();
    await page.evaluate(() => {
      for (const [survey, status] of [
        ["IRI", "submitted-local"],
        ["PCI", "reviewed-local"],
      ]) {
        const identity = {
          packageId: "CP09-TEST",
          kind: "duaMingguan",
          period: 1,
          survey,
          auditLevel: 1,
        };
        const v = {
          version: 1,
          status,
          fields: { test: "Uji" },
          actor: "Penyedia Jasa / Ketua Tim",
          createdAt: "2026-11-01",
          officiallySigned: false,
        };
        localStorage.setItem(
          `jala-ba-source-v1:CP09-TEST:duaMingguan:1:${survey}:1`,
          JSON.stringify({ identity, draft: { test: "Uji" }, versions: [v] }),
        );
      }
      dispatchEvent(new Event("jala-ba-document-changed"));
    });
    await reloadReady(page);
    await page
      .getByText("Grafik status & cakupan dokumen", { exact: true })
      .click();
    await page.locator(".cp09-insights").waitFor();
    assert.match(
      await page.locator(".cp09-insights").innerText(),
      /2 identitas dokumen/,
    );
    await page.locator(".ui09-doc-filters > summary").click();
    await page
      .getByLabel("Filter survei dokumen", { exact: true })
      .selectOption("IRI");
    assert.match(
      await page.locator(".cp09-insights").innerText(),
      /1 identitas dokumen/,
    );
    await page
      .getByPlaceholder("Nama dokumen atau paket")
      .fill("tidak-ada-hasil");
    assert.match(
      await page.locator(".cp09-insights").innerText(),
      /0 identitas dokumen/,
    );
    await page
      .getByRole("button", { name: "Reset filter", exact: true })
      .click();
    assert.match(
      await page.locator(".cp09-insights").innerText(),
      /2 identitas dokumen/,
    );
    await page.screenshot({
      path: output + "/screenshots/documents-filtered-real.png",
    });
    results.push({
      result: "pass",
      check:
        "actual document identities, status graph denominator, survey/query filters, reset",
    });
    await context.close();
  }

  });
  await group("directorate-retest",async()=>{
  // Regression: Directorate can now retest its own audit-3 correction through the actual detail screen.
  for (const result of ["Lulus", "Gagal"]) {
    const custom = withProductionReferences(
      createDemoWorkflow("verval-finding"),
    );
    custom.project.id = "CP09-TEST";
    custom.audits = structuredClone(fixture.audits);
    custom.corrections = [
      {
        ...custom.corrections[0],
        id: "CP09-CASE",
        source: "Penolakan audit tingkat 3",
        blockedStage: "Audit tingkat 3",
        returnStage: "Audit tingkat 3",
        status: "Dilaksanakan",
        approval: "Disetujui",
        fieldDataValid: "Tidak",
        owner: "Ketua Tim",
        evidence: "Referensi bukti sumber",
        executionReference: "EXEC-09",
        verification: { surveyor: true, teamLeader: true, balai: true },
      },
    ];
    const { page, context } = await setup(roles[2], custom);
    await navigateReady(page, "http://127.0.0.1:5173/actions?testRoles=1");
    await openFilterPanels(page);
    await openCase(page,roles[2],"CP09-CASE","Verifikasi Ulang");
    await page
      .getByRole("button", { name: "Simpan hasil pemeriksaan", exact: true })
      .waitFor();
    await page
      .locator(
        'textarea[placeholder="Nomor BA atau referensi pemeriksaan tahap asal"]',
      )
      .fill("RETEST-09");
    await page.getByTestId("select-retest-CP09-CASE").selectOption(result);
    if (result === "Gagal")
      await page
        .getByTestId("input-retest-failure-reason-CP09-CASE")
        .fill("Sampel belum memenuhi");
    await page
      .getByRole("button", { name: "Simpan hasil pemeriksaan", exact: true })
      .click();
    const state = async () =>
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).packages["CP09-TEST"],
        PACKAGE_STORE_KEY,
      );
    if (result === "Lulus") {
      await page
        .getByRole("button", { name: "Tutup kasus", exact: true })
        .click();
      await page.waitForTimeout(100);
      assert.equal((await state()).corrections[0].status, "Ditutup");
      assert.deepEqual((await state()).dailyRecords, custom.dailyRecords);
      assert.equal((await state()).audits[2].requiresReview, true);
    } else {
      await page.waitForTimeout(100);
      assert.equal((await state()).corrections[0].status, "Terbuka");
      assert.equal((await state()).corrections[0].approval, "Perlu Revisi");
      assert.equal((await state()).corrections[0].verification.balai, false);
    }
    await page.screenshot({
      path: `${output}/screenshots/audit3-correction-${result}.png`,
    });
    results.push({
      result: "pass",
      check: `real Directorate audit3 retest ${result}; ${result === "Lulus" ? "closure preserves raw and marks audit for review" : "returns to provider with reason"}`,
    });
    await context.close();
  }


  });
  assert.deepEqual(errors, []);
  assert.deepEqual(failures, []);
  assert.deepEqual(pending, [], "Unverified replacement coverage remains");
  if(baHistoryOnly){assert.deepEqual(executedGroups,["ba-decision-history"]);assert.ok(results.some(r=>r.check?.includes("immutable unsigned history")));}
  if(sourceCoverageOnly){assert.equal(executedGroups.length,56);assert.equal(results.filter(r=>r.sourceId).length,55);}
} finally {
  fs.writeFileSync(
    output + "/results.json",
    JSON.stringify({ scope:runScope, executedGroups, browser: browser.version(), errors, results, failures, pending }, null, 2),
  );
  await browser.close();
  await server.close();
}
console.log(`PASS ${results.length} browser checks; scope=${runScope} (scoped checks are not full Ui09); no page errors`);
