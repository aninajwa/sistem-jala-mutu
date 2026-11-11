/** Browser regression for the current role-based Dokumen Mutu UI.
 * Isolated on 127.0.0.1:5178; never imports user browser storage.
 * Legacy table-documents selectors deliberately removed.
 */
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createDemoWorkflow} from '../src/workflow/demoScenario';
import {PACKAGE_STORE_KEY} from '../src/workflow/packageStore';
import {BA_TEMPLATES,fieldsFor} from '../src/workflow/ba/docxEngine';
import {baKey,type BaIdentity} from '../src/workflow/ba/documentRepository';
import type {WorkflowRole} from '../src/workflow/model';

const output=process.env.TEST_ARTIFACTS||'test-artifacts/documents';
fs.mkdirSync(output,{recursive:true});
const origin='http://127.0.0.1:5178';
const PROVIDER:WorkflowRole='Penyedia Jasa / Ketua Tim';
const BALAI:WorkflowRole='PIC Balai / Pengguna Jasa';
const DIRECTORATE:WorkflowRole='Direktorat / Pusat';
const ADMIN:WorkflowRole='Admin';
const state=createDemoWorkflow('complete');
state.project.id='PAKET-DEMO-001';
state.project.packageName='PAKET UJI DOKUMEN TERISOLASI';
state.project.surveyTypes=['IRI','PCI'];
state.activeCyclePeriod=2;
state.cycleHistory={'1':structuredClone(state.cycle)};
state.role=PROVIDER;
const id=(kind:BaIdentity['kind'],period:number,auditLevel:number):BaIdentity=>({packageId:state.project.id,kind,period,survey:'IRI',auditLevel});
const internal=id('internal',2,1),joint=id('duaMingguan',2,1),audit3=id('audit',0,3);
const filled=(identity:BaIdentity)=>{
 const template=BA_TEMPLATES.find(t=>t.id===identity.kind)!;
 return Object.fromEntries(fieldsFor(template,'IRI').map(f=>[f.id,f.choices?.[0]??(/tanggal|dd\/mm/i.test(f.label)?'2026-11-11':'ISIAN UJI TERISOLASI')]));
};
const record=(identity:BaIdentity,status:'local-draft'|'submitted-local')=>{
 const template=BA_TEMPLATES.find(t=>t.id===identity.kind)!;
 const fields=filled(identity);
 return {draft:fields,versions:[{id:`E2E-${identity.kind}-${identity.auditLevel}`,version:1,createdAt:'2026-11-11T00:00:00Z',actor:PROVIDER,templateHash:template.sha256,status,fields,officiallySigned:false}]};
};
const seededRecords=Object.fromEntries([[baKey(internal),record(internal,'local-draft')],[baKey(joint),record(joint,'submitted-local')],[baKey(audit3),record(audit3,'submitted-local')]]);
const results:string[]=[],errors:string[]=[];
let completed=false,phase='starting',browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
const server=await createServer({configFile:fileURLToPath(new URL('../vite.config.ts',import.meta.url)),server:{host:'127.0.0.1',port:5178,strictPort:true}});
try{
 await server.listen();phase='browser launch';
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const context=await browser.newContext({viewport:{width:1440,height:950},acceptDownloads:true});
 await context.addInitScript(({state,key,records,origin})=>{
  if(location.origin!==origin||sessionStorage.getItem('documents-seeded'))return;
  sessionStorage.setItem('documents-seeded','yes');
  localStorage.setItem(key,JSON.stringify({activePackageId:state.project.id,activeRole:state.role,packages:{[state.project.id]:state}}));
  localStorage.setItem('jala-mutu-demo-session-v1','active');
  for(const [key,value] of Object.entries(records))localStorage.setItem(key,JSON.stringify(value));
  localStorage.setItem('jala-ba-draft-v1:legacy-protected','{"nomor":"ARSIP-TETAP"}');
 },{state,key:PACKAGE_STORE_KEY,records:seededRecords,origin});
 const page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 const goto=async(tab?:string)=>{
  await page.goto(`${origin}/documents?testRoles=1${tab?'&tab='+encodeURIComponent(tab):''}`,{waitUntil:'domcontentloaded'});
  await page.locator('main.documents-page').waitFor({state:'visible'});
 };
 const role=async(name:WorkflowRole,tab?:string)=>{
  await page.evaluate(({name,key,id})=>{
   const saved=JSON.parse(localStorage.getItem(key)!);
   saved.activeRole=name;saved.packages[id].role=name;
   localStorage.setItem(key,JSON.stringify(saved));
  },{name,key:PACKAGE_STORE_KEY,id:state.project.id});
  await goto(tab);
 };
 const recordCount=()=>page.locator('main.documents-page article.dr-record').count();
 const seedRead=()=>page.evaluate((keys:string[])=>Object.fromEntries(keys.map(key=>[key,localStorage.getItem(key)])),[...Object.keys(seededRecords),'jala-ba-draft-v1:legacy-protected']);
 phase='provider list/filter/navigation';await goto('Tugas Dokumen');
 await page.getByText('Tugas Dokumen',{exact:true}).first().waitFor();
 assert.equal(await recordCount(),1,'Provider tasks must contain only the local internal draft');
 await page.getByLabel('Cari dokumen',{exact:true}).fill('paket-tidak-ada');
 assert.equal(await recordCount(),0,'Search must filter existing records without inventing drafts');
 await page.getByRole('button',{name:'Reset filter',exact:true}).click();
 assert.equal(await recordCount(),1);
 await page.locator('main.documents-page article.dr-record').first().getByRole('button').click();
 await page.getByRole('heading',{name:'Berita acara dan dokumen pemeriksaan'}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Simpan revisi draft',exact:true}).count(),1,'Provider may edit owned local draft');
 await page.getByText('Ganti konteks dokumen',{exact:true}).click();
 assert.equal(await page.getByLabel('Format BA',{exact:true}).inputValue(),'internal');
 assert.equal(await page.getByLabel('Periode BA',{exact:true}).inputValue(),'2');
 await page.getByRole('button',{name:'Daftar Dokumen Mutu',exact:true}).click();
 await page.locator('main.documents-page').waitFor();
 results.push('Provider: current card list, search/reset, exact BA identity, and editable own draft');

 phase='seven original BA templates';
 // Preview every template. Download is only expected when an existing draft or
 // the active role's authoring permission makes the download button available.
 // A disabled button is legitimate read-only protection, not a browser failure.
 await role(PROVIDER,'Tugas Dokumen');
 await page.locator('main.documents-page article.dr-record').first().getByRole('button').click();
 await page.getByRole('heading',{name:'Berita acara dan dokumen pemeriksaan'}).waitFor();
 await page.getByText('Ganti konteks dokumen',{exact:true}).click();
 const downloaded:string[]=[],restricted:string[]=[];
 for(const template of BA_TEMPLATES){
  phase=`BA ${template.id}: select and preview`;
  await page.getByLabel('Format BA',{exact:true}).selectOption(template.id);
  await page.getByRole('button',{name:'Pratinjau DOCX',exact:true}).click();
  await page.locator('.ba-document-preview section.docx').first().waitFor({timeout:30000});
  assert.ok((await page.locator('.ba-document-preview').innerText()).includes('DRAFT LOKAL'),`${template.id}: preview must remain unsigned`);
  const downloadButton=page.getByRole('button',{name:'Unduh DOCX draft',exact:true});
  phase=`BA ${template.id}: download permission`;
  if(await downloadButton.isDisabled()){
   // No permitted active draft in this context; never force a download event.
   restricted.push(template.id);
   console.log(`  BA ${template.id}: preview PASS; download correctly unavailable for current role/draft`);
   continue;
  }
  phase=`BA ${template.id}: download event`;
  // Register the event before clicking to avoid losing a fast browser download.
  // Record a meaningful failure instead of an unexplained 30s timeout.
  try{
   const [download]=await Promise.all([
    page.waitForEvent('download',{timeout:12000}),
    downloadButton.click(),
   ]);
   assert.ok(download.suggestedFilename().endsWith('-DRAFT.docx'),`${template.id}: unsigned filename required`);
   await download.saveAs(`${output}/${template.id}.docx`);
   downloaded.push(template.id);
  }catch(error){
   const notice=await page.locator('[role="status"]').allTextContents();
   throw new Error(`BA ${template.id}: tombol unduh aktif tetapi unduhan tidak terjadi. Pesan halaman: ${notice.join(' | ')||'(tidak ada)'}. Detail: ${String(error)}`);
  }
 }
 assert.ok(downloaded.includes('internal'),'The authorized provider internal BA must download successfully');
 results.push(`Seven original BA previews rendered as unsigned drafts; downloads verified where enabled (${downloaded.join(', ')}); protected when unavailable (${restricted.join(', ')||'none'})`);

 phase='Balai queue and read-only source';await role(BALAI,'Antrian Pemeriksaan');
 assert.equal(await recordCount(),1,'Balai queue must contain the submitted joint BA');
 await page.locator('main.documents-page article.dr-record').first().getByRole('button').click();
 await page.getByRole('heading',{name:'Berita acara dan dokumen pemeriksaan'}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Simpan revisi draft',exact:true}).count(),0,'Balai cannot edit provider submitted draft');
 assert.equal(await page.getByRole('button',{name:'Minta revisi BA',exact:true}).count(),1,'Balai can review submitted joint BA');
 results.push('Balai: submitted collaborative BA review is available without provider editing rights');

 phase='Directorate audit level 3';await role(DIRECTORATE,'Audit & Dokumen Pusat');
 assert.equal(await recordCount(),1,'Directorate audit tab must contain audit level 3 only');
 await page.locator('main.documents-page article.dr-record').first().getByRole('button').click();
 await page.getByRole('heading',{name:'Berita acara dan dokumen pemeriksaan'}).waitFor();
 await page.getByText('Ganti konteks dokumen',{exact:true}).click();
 assert.equal(await page.getByLabel('Format BA',{exact:true}).inputValue(),'audit');
 assert.equal(await page.getByLabel('Tingkat audit BA',{exact:true}).inputValue(),'3');
 results.push('Directorate: audit-level 3 card opens the exact BA identity');

 phase='Admin read-only archive';await role(ADMIN,'Monitoring Dokumen');
 assert.equal(await recordCount(),3,'Admin monitors three real stored documents');
 await page.locator('main.documents-page article.dr-record').first().getByRole('button').click();
 await page.getByRole('heading',{name:'Berita acara dan dokumen pemeriksaan'}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Simpan revisi draft',exact:true}).count(),0);
 assert.equal(await page.getByRole('button',{name:'Ajukan pemeriksaan BA',exact:true}).count(),0);
 assert.equal(await page.getByRole('button',{name:'Minta revisi BA',exact:true}).count(),0);
 results.push('Admin: monitors existing documents without draft or review actions');

 phase='layout, integrity';await role(PROVIDER,'Tugas Dokumen');
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'Document list must not overflow mobile viewport');
 const final=await seedRead();
 for(const [key,value] of Object.entries(seededRecords))assert.equal(final[key],JSON.stringify(value),'Navigation and previews must not mutate seeded BA history');
 assert.equal(final['jala-ba-draft-v1:legacy-protected'],'{"nomor":"ARSIP-TETAP"}');
 assert.deepEqual(errors,[],'Browser should have no uncaught page errors');
 results.push('390px list has no page overflow; document versions and legacy data remain unchanged; no browser errors');
 completed=true;
 await context.close();
 console.log(`DOCUMENTS E2E: PASS (${results.length}/${results.length} scenario groups)`);
 results.forEach((r,i)=>console.log(`  PASS ${i+1}. ${r}`));
}catch(error){console.error(`DOCUMENTS E2E FAIL at: ${phase}`);console.error(error);throw error;}
finally{
 fs.writeFileSync(output+'/results.json',JSON.stringify({completed,phase,results,errors,classification:completed?'PASS':'FAIL'},null,2));
 await browser?.close();await server.close();
}
