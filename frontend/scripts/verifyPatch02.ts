import {chromium,type Browser} from 'playwright';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createDemoWorkflow} from '../src/workflow/demoScenario';
import {withProductionReferences} from '../src/workflow/testing/productionFixture';
import {PACKAGE_STORE_KEY} from '../src/workflow/packageStore';
import type {WorkflowRole} from '../src/workflow/model';
// Test data exists only in an isolated browser context, never in the delivered app seed.
const output=process.env.TEST_ARTIFACTS||'test-artifacts/patch02';fs.mkdirSync(output,{recursive:true});
const state=withProductionReferences(createDemoWorkflow('complete'));
state.project.id='PAKET-DEMO-001';state.project.packageName='SIMULASI UJI PATCH02 Ã¢â‚¬â€ bukan data QA/QC nyata';
state.role='PIC Balai / Pengguna Jasa';state.project.surveyTypes=['Lendutan'];state.activeCyclePeriod=1;
state.project.preparation.reportApproval='Diajukan';state.project.preparation.reviewerNote='';state.corrections=[];
state.submission.stagedReviews={};
for(const group of ['sourceReviews','fieldPlan','coordination','documents'] as const)for(const key of Object.keys(state.project.preparation[group]))state.project.preparation[group][key]=true;
const server=await createServer({configFile:fileURLToPath(new URL('../vite.config.ts',import.meta.url)),server:{host:'127.0.0.1',port:5182,strictPort:true}});
const results:string[]=[],errors:string[]=[];let browser:Browser|undefined,completed=false,phase='server';
try{
 await server.listen();phase='browser-launch';
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--no-zygote']});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.addInitScript(({state,key})=>{if(location.origin!=='http://127.0.0.1:5182'||sessionStorage.getItem('patch02-seeded'))return;sessionStorage.setItem('patch02-seeded','yes');localStorage.setItem(key,JSON.stringify({activePackageId:state.project.id,activeRole:state.role,packages:{[state.project.id]:state}}));localStorage.setItem('jala-mutu-demo-session-v1','active');},{state,key:PACKAGE_STORE_KEY});
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 const url=(selection?:string)=>'http://127.0.0.1:5182/'+(selection?selection.split(':')[0].slice(1):'verification')+'?testRoles=1'+(selection?'&submodule='+encodeURIComponent(selection):'');
 const snapshot=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).packages['PAKET-DEMO-001'],PACKAGE_STORE_KEY);
 async function actor(role:WorkflowRole){await page.evaluate(({key,role})=>{const stored=JSON.parse(localStorage.getItem(key)!);stored.activeRole=role;stored.packages['PAKET-DEMO-001'].role=role;localStorage.setItem(key,JSON.stringify(stored));},{key:PACKAGE_STORE_KEY,role});await page.reload();}
 phase='queue';await page.goto(url(),{waitUntil:'domcontentloaded'});await page.getByText('Verifikasi & Review Balai',{exact:true}).last().waitFor();
 assert.equal(await page.getByTestId('button-approve-verification').count(),0);assert.equal(await page.getByTestId('textarea-verification-note').count(),0);
 for(let i=0;i<4;i++)await page.getByTestId('kpi-balai-review-'+i).waitFor();
 await page.getByLabel('Filter tahap pemeriksaan').selectOption('Tahap 0');// Status filter was removed from the approved UI; the actionable tab is the status scope.
 assert.equal(await page.getByTestId('balai-review-item').count(),1);
 await page.getByLabel('Cari pemeriksaan Balai').fill('tidak-ada-paket-ini');assert.equal(await page.getByTestId('balai-review-item').count(),0);
 await page.getByLabel('Cari pemeriksaan Balai').fill('');
 await page.getByTestId('balai-review-item').getByRole('button',{name:'Buka pemeriksaan',exact:true}).click();await page.getByTestId('input-prep-review-note').waitFor();
 results.push('Queue has four derived KPIs, stage/search filters, no legacy decision controls and opens exact package stage.');
 await page.goto(url('/verification:Hasil verifikasi'));assert.equal(await page.getByRole('heading',{name:'Keputusan verifikasi',exact:true}).count(),0);await page.goto(url('/entry:Persiapan & SPMK'));
 phase='preparation';await page.getByTestId('input-prep-review-note').fill('Catatan rapat biasa');await page.getByTestId('button-prep-save-note').click();let current=await snapshot();assert.equal(current.project.preparation.reportApproval,'Diajukan');assert.equal(current.corrections.length,0);
 await page.reload();assert.equal((await snapshot()).project.preparation.reviewerNote,'Catatan rapat biasa');
 await page.getByTestId('input-prep-review-note').fill(' ');await page.getByTestId('button-prep-revise').click();assert.equal((await snapshot()).project.preparation.reportApproval,'Diajukan');
 await page.getByTestId('input-prep-review-note').fill('Lengkapi referensi koordinasi Ã¢â‚¬â€ temuan uji terisolasi');await page.getByTestId('button-prep-revise').click();assert.equal((await snapshot()).project.preparation.reportApproval,'Perlu Revisi');
 await actor('Penyedia Jasa / Ketua Tim');assert.ok((await page.locator('body').innerText()).includes('Lengkapi referensi koordinasi'));await page.getByTestId('button-prep-submit').click();assert.equal((await snapshot()).project.preparation.reportApproval,'Diajukan');
 await actor('PIC Balai / Pengguna Jasa');await page.getByTestId('button-prep-approve').click();await page.reload();current=await snapshot();assert.equal(current.project.preparation.reportApproval,'Disetujui');assert.ok(current.balaiDecisionHistory.some((r:any)=>r.decision==='Perlu Revisi'&&r.note.includes('referensi koordinasi')));
 results.push('Ordinary note persists without finding; blank revision rejected; provider resubmits; Balai approves; history survives reload.');
 phase='staged-review';await page.goto(url('/entry:Gerbang RNI/LRS'));const note=page.getByPlaceholder('Isi catatan bila ada temuan atau klarifikasi');await note.fill('Bukti Lendutan diperiksa pada pengujian terisolasi');await page.getByTestId('stage4-staged-review-lendutan').selectOption('Sesuai');await page.reload();assert.equal((await snapshot()).submission.stagedReviews.Lendutan.decision,'Sesuai');
 results.push('Stage4 Balai staged decision and note persist through actual UI and refresh.');
 phase='scope-and-layout';for(const role of ['Penyedia Jasa / Ketua Tim','Direktorat / Pusat','Admin'] as WorkflowRole[]){await actor(role);assert.equal(await page.getByTestId('stage4-staged-review-lendutan').isDisabled(),true);}
 await actor('PIC Balai / Pengguna Jasa');await page.goto(url(),{waitUntil:'domcontentloaded'});await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
 assert.deepEqual(errors,[]);results.push('Other roles cannot alter Balai staged decision; queue has no horizontal overflow at 390px and no page errors.');completed=true;
}catch(error){fs.writeFileSync(output+'/failure.txt',String(error));throw error;}
finally{fs.writeFileSync(output+'/results.json',JSON.stringify({completed,phase,results,errors,classification:phase==='browser-launch'?'BLOCKED_ENVIRONMENT':completed?'PASS':'FAIL'},null,2));await browser?.close();await server.close();}
