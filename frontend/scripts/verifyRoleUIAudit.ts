/**
 * JALA MUTU — visual role audit (read-only, isolated browser context).
 * Run: node --import tsx scripts/verifyRoleUIAudit.ts
 * Creates: test-artifacts/role-ui-audit/role-ui-audit.zip and summary.json
 * No changes to source data, package repository or user's regular browser profile.
 */
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { zipSync } from 'fflate';
import { createDemoWorkflow } from '../src/workflow/demoScenario';
import { PACKAGE_STORE_KEY } from '../src/workflow/packageStore';
import type { WorkflowRole } from '../src/workflow/model';

const ROOT = path.resolve('test-artifacts/role-ui-audit');
const PORT = 5186;
const BASE = `http://127.0.0.1:${PORT}`;
const roles: Array<{ name: WorkflowRole; slug: string }> = [
  {name:'Penyedia Jasa / Ketua Tim',slug:'penyedia'},
  {name:'PIC Balai / Pengguna Jasa',slug:'balai'},
  {name:'Direktorat / Pusat',slug:'direktorat'},
  {name:'Admin',slug:'admin'},
];
const routes = [
  {name:'dashboard',url:'/'},
  {name:'paket',url:'/packages'},
  {name:'tindakan-perbaikan',url:'/actions'},
  {name:'notifikasi',url:'/notifications'},
  {name:'verifikasi',url:'/verification'},
  {name:'dokumen',url:'/documents'},
] as const;
const sizes = [
  {name:'desktop',width:1440,height:1000},
  {name:'mobile',width:390,height:844},
] as const;

fs.mkdirSync(ROOT,{recursive:true});
const records: Array<Record<string,unknown>> = [];
const server = await createServer({
  configFile:fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
  server:{host:'127.0.0.1',port:PORT,strictPort:true},
});
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  await server.listen();
  const executablePath=process.env.CHROMIUM_EXECUTABLE;
  browser=await chromium.launch({headless:true,...(executablePath?{
    executablePath,
    args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-zygote'],
  }:{} )});

  for (const {name:role,slug} of roles) {
    const fixture=structuredClone(createDemoWorkflow('complete'));
    fixture.role=role;
    fixture.project.id='PAKET-DEMO-001';
    fixture.project.packageName='Paket Uji Tampilan QA/QC';
    const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:1,acceptDownloads:false});
    await context.addInitScript(({key,state,activeRole})=>{
      if (location.origin !== 'http://127.0.0.1:5186') return;
      if (sessionStorage.getItem('jala-role-visual-test-seeded')) return;
      sessionStorage.setItem('jala-role-visual-test-seeded','yes');
      localStorage.setItem(key,JSON.stringify({activePackageId:state.project.id,activeRole,packages:{[state.project.id]:state}}));
      localStorage.setItem('jala-mutu-demo-session-v1','active');
    },{key:PACKAGE_STORE_KEY,state:fixture,activeRole:role});
    const page=await context.newPage();
    let currentPageErrors:string[]=[];
    page.on('pageerror',e=>currentPageErrors.push(e.message));
    for (const size of sizes) {
      await page.setViewportSize({width:size.width,height:size.height});
      for (const route of routes) {
        const label=`${slug}-${size.name}-${route.name}`;
        const before=currentPageErrors.length;
        const entry:Record<string,unknown>={role,viewport:size.name,route:route.url,file:`${label}.png`,ok:false};
        try {
          await page.goto(`${BASE}${route.url}?testRoles=1`,{waitUntil:'domcontentloaded',timeout:25000});
          await page.locator('body').waitFor({state:'visible',timeout:15000});
          await page.waitForTimeout(300);
          entry.title=await page.title();
          entry.headings=(await page.locator('h1, h2').allTextContents()).map(s=>s.trim()).filter(Boolean).slice(0,12);
          entry.horizontalOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+3);
          entry.overflowPixels=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-window.innerWidth));
          entry.visibleButtons=await page.locator('button:visible').count();
          entry.newPageErrors=currentPageErrors.slice(before);
          await page.screenshot({path:path.join(ROOT,`${label}.png`),fullPage:true,animations:'disabled',timeout:30000});
          entry.ok=true;
        } catch(e) {
          entry.error=String(e);
          entry.newPageErrors=currentPageErrors.slice(before);
          try {await page.screenshot({path:path.join(ROOT,`${label}-ERROR.png`),fullPage:false,timeout:5000});} catch {/* record error even if screenshot cannot be made */}
        }
        records.push(entry);
        const status=entry.ok?(entry.horizontalOverflow?'OVERFLOW':'OK'):'ERROR';
        console.log(`${status} ${label}`);
      }
    }
    await context.close();
  }
} finally {
  if (browser) await browser.close();
  await server.close();
  const summary={
    createdAt:new Date().toISOString(),
    purpose:'Pemeriksaan rendering, screenshot dan overflow UI untuk empat role; bukan validasi keputusan QA/QC',
    total:records.length,
    renderErrors:records.filter(r=>!r.ok).length,
    horizontalOverflow:records.filter(r=>r.horizontalOverflow).length,
    javascriptErrorScreens:records.filter(r=>Array.isArray(r.newPageErrors)&&(r.newPageErrors as string[]).length>0).length,
    records,
  };
  fs.writeFileSync(path.join(ROOT,'summary.json'),JSON.stringify(summary,null,2));
  const files:Record<string,Uint8Array>={};
  for (const filename of fs.readdirSync(ROOT)) {
    if (filename.endsWith('.png')||filename==='summary.json') files[filename]=new Uint8Array(fs.readFileSync(path.join(ROOT,filename)));
  }
  const zipped=zipSync(files,{level:4});
  fs.writeFileSync(path.join(ROOT,'role-ui-audit.zip'),Buffer.from(zipped));
  console.log('\nHASIL AUDIT VISUAL:');
  console.log(JSON.stringify({total:summary.total,renderErrors:summary.renderErrors,horizontalOverflow:summary.horizontalOverflow,javascriptErrorScreens:summary.javascriptErrorScreens},null,2));
  console.log('Artefak: test-artifacts\\role-ui-audit\\role-ui-audit.zip');
  console.log('Laporan: test-artifacts\\role-ui-audit\\summary.json');
  console.log('Screenshot dan laporan memakai browser terisolasi; tidak mengubah data pengguna.');
}
