/** JALA MUTU â€” Tahap 0: interactive four-step form and locked-status browser audit.
 * Copy into frontend/scripts/ and run: node --import tsx scripts/verifyStage0FourStepBrowser.ts
 * All scenarios use isolated browser contexts and a synthetic package; nothing is written to the user's app storage.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';
import { zipSync } from 'fflate';
import { createDemoWorkflow } from '../src/workflow/demoScenario';
import { PACKAGE_STORE_KEY } from '../src/workflow/packageStore';
import type { ApprovalState,WorkflowRole } from '../src/workflow/model';

const roles: {key:string;value:WorkflowRole}[] = [
 {key:'penyedia',value:'Penyedia Jasa / Ketua Tim'},
 {key:'balai',value:'PIC Balai / Pengguna Jasa'},
 {key:'direktorat',value:'Direktorat / Pusat'},
 {key:'admin',value:'Admin'},
];
const statuses:ApprovalState[] = ['Draft','Diajukan','Perlu Revisi','Ditolak','Disetujui'];
const devices = [{key:'desktop',width:1440,height:900},{key:'mobile',width:390,height:844}];
const port=Number(process.env.TEST_PORT||5197), base=`http://127.0.0.1:${port}`;
const out=path.resolve(process.env.TEST_ARTIFACTS||'test-artifacts/stage0-form-browser');
fs.mkdirSync(out,{recursive:true});
const summary:{cases:number;passed:number;failed:number;results:{name:string;passed:boolean;issues:string[]}[]}={cases:0,passed:0,failed:0,results:[]};
let server:Awaited<ReturnType<typeof createServer>>|undefined;
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try {
 server=await createServer({configFile:path.resolve('vite.config.ts'),server:{host:'127.0.0.1',port,strictPort:true}});
 await server.listen();
 browser=await chromium.launch(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']}:{headless:true});
 for(const role of roles)for(const status of statuses)for(const device of devices){
  const name=`${role.key}-${status.toLowerCase().replace(/\s+/g,'-')}-${device.key}`;
  const issues:string[]=[];
  const ctx=await browser.newContext({viewport:{width:device.width,height:device.height},acceptDownloads:false});
  const fixture=structuredClone(createDemoWorkflow('complete'));
  fixture.project.id=`AUDIT-STEP0-${role.key}-${status.replace(/\s+/g,'-')}`;
  fixture.project.packageName='Paket Uji Formulir Tahap 0 (Terisolasi)';
  fixture.role=role.value;
  fixture.project.preparation.reportApproval=status;
  if(status==='Perlu Revisi')fixture.project.preparation.reviewerNote='Lengkapi dan perbaiki dokumen menurut catatan pemeriksaan.';
  await ctx.addInitScript(({key,state,activeRole,origin})=>{
   if(location.origin!==origin||sessionStorage.getItem('step0-bootstrapped'))return;
   sessionStorage.setItem('step0-bootstrapped','yes');
   localStorage.setItem(key,JSON.stringify({activePackageId:state.project.id,activeRole,packages:{[state.project.id]:state}}));
   localStorage.setItem('jala-mutu-demo-session-v1','active');
  },{key:PACKAGE_STORE_KEY,state:fixture,activeRole:role.value,origin:base});
  const page=await ctx.newPage();
  const errors:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.goto(base+'/entry?testRoles=1&submodule='+encodeURIComponent('/entry:Persiapan & SPMK'),{waitUntil:'domcontentloaded'});
   await page.locator('.wf-head').first().waitFor({timeout:20000});
   if(role.key==='penyedia'){
    const form=page.locator('.stage0-step-form');
    await form.waitFor({timeout:12000});
    const tabs=form.locator('.stage0-step-tab');
    assert.equal(await tabs.count(),4,'Harus ada empat kelompok langkah');
    const content=form.locator('.stage0-step-active');
    const headings:string[]=[];
    for(let i=0;i<4;i++){
     await tabs.nth(i).click();
     assert.equal(await tabs.nth(i).getAttribute('aria-current'),'step','Tab aktif harus ditandai');
     const heading=await content.locator('.stage0-step-active-head').innerText();
     assert(heading.includes(`Langkah ${i+1} dari 4`),`Isi langkah ${i+1} tidak sesuai`);
     headings.push(heading);
     assert((await content.locator('input[type="checkbox"]').count())>0,`Kelompok ${i+1} tidak memiliki checklist`);
    }
    assert.equal(new Set(headings).size,4,'Isi keempat langkah tidak berbeda');
    const controls=form.locator('.stage0-step-controls');
    await controls.getByRole('button',{name:'Sebelumnya'}).click();
    assert((await content.innerText()).includes('Langkah 3 dari 4'),'Tombol Sebelumnya tidak bekerja');
    await controls.getByRole('button',{name:'Berikutnya'}).click();
    assert((await content.innerText()).includes('Langkah 4 dari 4'),'Tombol Berikutnya tidak bekerja');
    const locked=status==='Diajukan'||status==='Disetujui';
    assert.equal(await form.locator('.stage0-step-locked').count(),locked?1:0,'Pesan kunci tidak cocok dengan status');
    const checkboxes=content.locator('input[type="checkbox"]');
    assert.equal(await checkboxes.first().isDisabled(),locked,'Hak edit checklist tidak sesuai status');
    if (!locked) {
     await tabs.first().click();
     const box = content.locator('input[type="checkbox"]').first();
     const expected = !(await box.isChecked());
     await box.click();
     assert.equal(await box.isChecked(), expected, 'Checklist tidak berubah setelah klik');
     await page.reload();
     await form.waitFor();
     await tabs.first().click();
     assert.equal(await box.isChecked(), expected, 'Checklist tidak persisten setelah refresh');
    }
    const attachmentSection=page.locator('#documents-'+fixture.project.id.replace(/[^a-zA-Z0-9_-]/g,'-')+'-stage0');
    // Check upload controls without assuming any specific file fixtures or saved attachments.
    const uploadCount=await page.getByRole('button',{name:'Unggah berkas'}).count();
    if(locked) assert.equal(uploadCount,0,'Tombol unggah harus hilang ketika laporan sedang direview/disetujui');
    void attachmentSection;
   } else {
    assert.equal(await page.locator('.stage0-step-form').count(),0,'Form input Penyedia tampil untuk role selain Penyedia');
    const readOnly=page.locator('.stage0-readonly-checklists');
    await readOnly.waitFor({timeout:10000});
    await readOnly.locator('summary').first().click();
    assert((await readOnly.locator('input[type="checkbox"]').count())>0,'Checklist baca-saja tidak dapat dibuka');
    assert.equal(await readOnly.locator('input[type="checkbox"]:not(:disabled)').count(),0,'Role baca-saja dapat mengubah checklist');
   }
   assert.equal(await page.getByTestId('button-prep-approve').count(),role.key==='balai'?1:0,'Tombol persetujuan salah role');
   assert.equal(await page.getByTestId('button-prep-revise').count(),role.key==='balai'?1:0,'Tombol revisi salah role');
   assert.equal(await page.getByTestId('button-prep-submit').count(),role.key==='penyedia'?1:0,'Tombol ajukan salah role');
   const overflow=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,innerWidth:window.innerWidth}));
   assert(overflow.scrollWidth<=overflow.innerWidth+2,`Overflow horizontal ${overflow.scrollWidth} > ${overflow.innerWidth}`);
   if(errors.length)issues.push(...errors.map(e=>'JavaScript: '+e));
  }catch(e){issues.push(e instanceof Error?e.message:String(e));}
  await page.screenshot({path:path.join(out,name+'.png'),fullPage:true,animations:'disabled'}).catch(e=>issues.push('Screenshot: '+String(e)));
  const passed=issues.length===0;
  summary.cases++;summary[passed?'passed':'failed']++;
  summary.results.push({name,passed,issues});
  console.log(`${passed?'PASS':'FAIL'} ${name}${passed?'':' | '+issues.join(' | ')}`);
  await ctx.close();
 }
}catch(e){summary.failed++;summary.results.push({name:'setup',passed:false,issues:[e instanceof Error?e.message:String(e)]});console.error(e);}
finally{
 await browser?.close().catch(()=>{});await server?.close().catch(()=>{});
 fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({...summary,createdAt:new Date().toISOString()},null,2));
 const entries:Record<string,Uint8Array>={};
 for(const name of fs.readdirSync(out))if(name.endsWith('.png')||name==='summary.json')entries[name]=new Uint8Array(fs.readFileSync(path.join(out,name)));
 fs.writeFileSync(path.join(out,'stage0-form-browser.zip'),Buffer.from(zipSync(entries,{level:3})));
 console.log(`\nAUDIT FORM TAHAP 0: ${summary.passed}/${summary.cases} PASS; gagal: ${summary.failed}`);
 console.log('Hasil:',path.join(out,'stage0-form-browser.zip'));
 if(summary.failed)process.exitCode=1;
}

