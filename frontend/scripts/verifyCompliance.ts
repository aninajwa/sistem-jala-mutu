import { chromium } from 'playwright';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDemoWorkflow } from '../src/workflow/demoScenario';
import { PACKAGE_STORE_KEY } from '../src/workflow/packageStore';

const out = process.env.TEST_ARTIFACTS || 'test-artifacts/compliance';
fs.mkdirSync(out, {recursive:true});
const server = await createServer({configFile:fileURLToPath(new URL('../vite.config.ts', import.meta.url)),server:{host:'127.0.0.1',port:5182,strictPort:true}});
await server.listen();
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const errors:string[]=[];
const results:string[]=[];
let completed=false;
try {
 const roleNames=['PIC Balai / Pengguna Jasa','Direktorat / Pusat','Admin'] as const;
 const state=createDemoWorkflow('complete');
 state.project.id='PAKET-E2E-COMPLIANCE-001';
 state.project.packageName='Paket Uji Analisis Terbatas';
 state.project.balai='Balai Jawa Barat';
 state.role=roleNames[0];
 const context=await browser.newContext({viewport:{width:1365,height:850},acceptDownloads:true});
 await context.addInitScript(({key,state})=>{
  if(sessionStorage.getItem('compliance-seed'))return;
  sessionStorage.setItem('compliance-seed','1');
  localStorage.setItem(key,JSON.stringify({activePackageId:state.project.id,activeRole:state.role,packages:{[state.project.id]:state}}));
  localStorage.setItem('jala-mutu-demo-session-v1','active');
 },{key:PACKAGE_STORE_KEY,state});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 const origin='http://127.0.0.1:5182';
 async function loadRole(role:string){
  await page.evaluate(({key,role})=>{const stored=JSON.parse(localStorage.getItem(key)!);stored.activeRole=role;for(const pkg of Object.values(stored.packages) as any[])pkg.role=role;localStorage.setItem(key,JSON.stringify(stored));},{key:PACKAGE_STORE_KEY,role});
  await page.goto(origin+'/compliance?testRoles=1');
  await page.getByTestId('compliance-workspace').waitFor();
  assert.equal(await page.getByTestId('button-switch-role').count(),1,'role test control must remain');
  assert.equal(await page.getByTestId('select-global-balai').count(),0,'redundant header Balai must be hidden');
  assert.equal(await page.getByTestId('select-global-periode').count(),0,'redundant header period must be hidden');
 }
 await page.goto(origin+'/compliance?testRoles=1');
 await page.getByTestId('compliance-workspace').waitFor();
 assert.equal(await page.getByTestId('button-switch-role').count(),1);
 assert.equal(await page.getByTestId('select-global-balai').count(),0);
 assert.equal(await page.getByTestId('select-global-periode').count(),0);
 results.push('Header filters hidden only for compliance; role test control retained');
 await page.getByLabel('Periode rekaman analisis').selectOption('Semua periode');
 assert.equal(await page.getByLabel('Periode rekaman analisis').inputValue(),'Semua periode');
 await page.getByLabel('Cari paket dalam analisis').fill('paket-yang-tidak-ada-12345');
 await page.getByTestId('kpi-compliance-packages').getByText('0',{exact:true}).waitFor();
 assert.equal(await page.getByTestId('table-compliance-source').locator('tbody tr').count(),0);
 const downloadPromise=page.waitForEvent('download');
 await page.getByTestId('button-export-compliance').click();
 const download=await downloadPromise;
 await download.saveAs(`${out}/filtered.csv`);
 const csv=fs.readFileSync(`${out}/filtered.csv`,'utf8');
 assert.ok(!csv.includes(state.project.packageName),'filtered export must exclude invisible package');
 results.push('Page period/search controls work; KPI, source table and CSV share the filtered scope');
  // Isolate the reset interaction from the preceding empty-results / CSV scenario.
  // The real user path starts with an unfiltered page, enters a matching package,
  // observes the filtered data, then resets to the original data.
  await page.reload();
  await page.getByTestId('compliance-workspace').waitFor();
  const searchInput=page.getByLabel('Cari paket dalam analisis');
  const resetButton=page.getByRole('button',{name:'Reset',exact:true});
  await searchInput.fill('Paket Uji');
  await page.getByTestId('kpi-compliance-packages').getByText('1',{exact:true}).waitFor();
  assert.equal(await searchInput.inputValue(),'Paket Uji','search keeps the user input');
  try {
   await resetButton.waitFor({state:'visible'});
   await page.waitForFunction(()=>{
    const button=Array.from(document.querySelectorAll('button')).find(b=>b.textContent?.trim()==='Reset');
    const input=document.querySelector('input[aria-label="Cari paket dalam analisis"]') as HTMLInputElement|null;
    return !!button && !button.disabled && input?.value==='Paket Uji';
   },undefined,{timeout:5000});
  } catch(error) {
   const state=await page.evaluate(()=>({
    input:(document.querySelector('input[aria-label="Cari paket dalam analisis"]') as HTMLInputElement|null)?.value,
    buttons:Array.from(document.querySelectorAll('button')).filter(b=>b.textContent?.includes('Reset')).map(b=>({text:b.textContent?.trim(),disabled:b.disabled})),
   }));
   throw new Error(`Reset tidak aktif setelah hasil pencarian diperbarui: ${JSON.stringify(state)}; ${String(error)}`);
  }
  await resetButton.click();
  assert.equal(await searchInput.inputValue(),'','reset clears the search');
  assert.equal(await resetButton.isDisabled(),true,'reset disabled again after filters cleared');
 for (const role of roleNames){
  await loadRole(role);
  await page.screenshot({path:`${out}/${role.startsWith('PIC')?'balai':role==='Admin'?'admin':'direktorat'}.png`,fullPage:true});
  assert.equal(await page.getByText('Dasar penghitungan:',{exact:false}).count(),0,'no technical calculation banner');
  if(role==='PIC Balai / Pengguna Jasa'){
   assert.equal(await page.getByLabel('Filter Balai analisis').count(),0,'Balai should not select other regions');
   assert.equal(await page.getByText('Cakupan paket yang diberikan').count(),0,'no developer-facing scope banner');
   assert.equal(await page.getByText('Perbandingan Paket',{exact:true}).count(),1);
   // Local development may expose multiple assigned/demo packages. Never hardcode one.
   const sourcePackageCount=await page.getByTestId('table-compliance-source').locator('tbody tr').count();
   await page.getByText('Perbandingan Paket',{exact:true}).click();
   await page.getByTestId('table-compliance-packages').waitFor();
   assert.equal(await page.getByTestId('table-compliance-balai').count(),0,'Balai comparison must use packages, not other Balai ranking');
   const comparisonRows=page.getByTestId('table-compliance-packages').locator('tbody tr');
   assert.equal(await comparisonRows.count(),sourcePackageCount,'comparison must contain precisely the packages in the accessible source list');
   assert.ok(sourcePackageCount>0,'seeded test must expose at least one authorized package');
   assert.equal(await comparisonRows.getByRole('button',{name:'Lihat paket'}).count(),sourcePackageCount,'every compared package must have a package link');
  } else {
   assert.equal(await page.getByLabel('Filter Balai analisis').count(),1,'Cross-Balai roles have region filter');
  }
  if(role==='Admin'){
   assert.equal(await page.getByTestId('kpi-compliance-audits').count(),0,'admin must not show technical scorecard');
   await page.getByText('Jejak ketersediaan rekaman').waitFor();
  } else {
   assert.equal(await page.getByTestId('kpi-compliance-audits').count(),1);
  }
 }
 results.push('Balai only compares assigned packages without cross-region filter; Directorate and Admin retain regional analysis');
 await page.setViewportSize({width:390,height:844});
 await page.reload();
 await page.getByTestId('compliance-workspace').waitFor();
 assert.equal(await page.getByTestId('mobile-global-filters').count(),0,'mobile redundant filters must be hidden');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2),false,'page must have no horizontal overflow at 390px');
 results.push('390px page has no global filter duplication and no horizontal overflow');
 assert.deepEqual(errors,[],'no browser errors');
 completed=true;
 await context.close();
} finally {
 fs.writeFileSync(`${out}/results.json`,JSON.stringify({completed,results,errors},null,2));
 await browser.close();await server.close();
}
if(completed){console.log(`COMPLIANCE E2E: PASS (${results.length}/${results.length} scenario groups)`);for(const [i,result] of results.entries())console.log(`  PASS ${i+1}. ${result}`);}
