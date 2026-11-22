import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {createDemoWorkflow} from '../src/workflow/demoScenario';
import {PACKAGE_STORE_KEY} from '../src/workflow/packageStore';
import type {WorkflowRole} from '../src/workflow/model';

const roles: {id:string;role:WorkflowRole}[]=[
 {id:'penyedia',role:'Penyedia Jasa / Ketua Tim'},
 {id:'balai',role:'PIC Balai / Pengguna Jasa'},
 {id:'direktorat',role:'Direktorat / Pusat'},
 {id:'admin',role:'Admin'},
];
const viewports=[{id:'desktop',width:1440,height:900},{id:'mobile',width:390,height:844}];
const port=Number(process.env.STAGE1_TEST_PORT||5198);
const base=`http://127.0.0.1:${port}`;
const output=path.resolve('test-artifacts/stage1-four-role');
fs.mkdirSync(output,{recursive:true});
const results:{name:string;ok:boolean;error?:string}[]=[];
const server=await createServer({configFile:path.resolve('vite.config.ts'),server:{host:'127.0.0.1',port,strictPort:true}});
let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
try {
 await server.listen();
 browser=await chromium.launch({headless:true});
 for(const entry of roles) for(const device of viewports){
  const name=`${entry.id}-${device.id}`;
  const context=await browser.newContext({viewport:{width:device.width,height:device.height}});
  const fixture=structuredClone(createDemoWorkflow('complete'));
  fixture.project.id=`S1-${entry.id}`;
  fixture.role=entry.role;
  await context.addInitScript(({key,state,role,base})=>{
   if(location.origin!==base||sessionStorage.getItem('s1-start')) return;
   sessionStorage.setItem('s1-start','yes');
   localStorage.setItem(key,JSON.stringify({activePackageId:state.project.id,activeRole:role,packages:{[state.project.id]:state}}));
   localStorage.setItem('jala-mutu-demo-session-v1','active');
  },{key:PACKAGE_STORE_KEY,state:fixture,role:entry.role,base});
  const page=await context.newPage();
  const runtimeErrors:string[]=[];
  page.on('pageerror',err=>runtimeErrors.push(err.message));
  try {
   await page.goto(`${base}/documents?testRoles=1&submodule=${encodeURIComponent('/documents:Kalibrasi & personel')}`,{waitUntil:'domcontentloaded',timeout:45000});
   const root=page.locator(entry.id==='penyedia'?'[data-testid="stage1-provider-workspace"]':'[data-testid="stage1-readonly-workspace"]');
   await root.waitFor({state:'visible',timeout:25000});
   assert((await root.innerText()).includes('Kalibrasi'),'Judul kalibrasi hilang');
   assert((await root.locator('.stage1-survey-picker button,.calibration-survey-tabs button').count())>0,'Jenis survei hilang');
   if(entry.id==='penyedia'){
    await root.locator('[data-testid="button-open-calibration-form"]').click();
    await root.locator('.stage1-edit-form').waitFor({state:'visible'});
    assert.equal(await root.locator('[data-testid="button-save-calibration"]').count(),1,'Simpan penugasan hilang');
    await root.locator('[data-testid="button-cancel-calibration"]').click();
    assert.equal(await root.locator('.stage1-edit-form').count(),0,'Batal tidak menutup form');
   } else {
    assert.equal(await root.locator('[data-testid="button-open-calibration-form"],[data-testid="button-save-calibration"],[data-testid="button-save-source-calibration"]').count(),0,'Role baca-saja dapat menulis');
    if(entry.id==='balai'){
      await root.locator('[data-testid="button-open-calibration-review"]').click();
      const form=root.locator('[data-testid="calibration-review-form"]');
      await form.waitFor({state:'visible'});
      await form.getByLabel('Bagian kalibrasi yang diperiksa').selectOption('Hasil kalibrasi');
      await form.getByLabel('Catatan pemeriksaan kalibrasi').fill('Mohon lampirkan penjelasan terkait hasil kalibrasi.');
      await form.locator('[data-testid="button-save-calibration-review"]').click();
      assert(await form.getByRole('alert').count(),'Pesan kesalahan simpan tidak ditampilkan dekat formulir');
      await form.getByLabel('Hasil pemeriksaan kalibrasi').selectOption('Perlu klarifikasi');
      await form.locator('[data-testid="button-save-calibration-review"]').click();
      await form.waitFor({state:'detached'});
      assert((await root.locator('[data-testid="calibration-review-panel"]').innerText()).includes('Perlu klarifikasi'),'Hasil pemeriksaan Balai gagal disimpan');
      assert.equal(await root.locator('.stage1-review-section').count(),4,'Empat bagian pemeriksaan harus muncul');
    } else {
      assert.equal(await root.locator('[data-testid="button-open-calibration-review"],[data-testid="calibration-review-form"]').count(),0,'Kontrol pemeriksaan muncul untuk role yang bukan Balai');
    }
    const checklist=root.locator('.stage1-inspection');
    await checklist.locator(':scope > summary').click();
    assert(await checklist.evaluate(el=>(el as HTMLDetailsElement).open),'Checklist tidak bisa dibuka');
   }
   assert.deepEqual(runtimeErrors,[],'Ada error JavaScript');
   assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2)),'Overflow horizontal');
   await page.screenshot({path:path.join(output,`${name}.png`),fullPage:true,animations:'disabled'});
   results.push({name,ok:true});console.log('PASS',name);
  }catch(e){const message=e instanceof Error?e.stack||e.message:String(e);try{await page.screenshot({path:path.join(output,`${name}-failed.png`),fullPage:true,animations:'disabled'});}catch{}results.push({name,ok:false,error:message});console.error('FAIL',name,message);}
  finally{await context.close();}
 }
}finally{
 fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(results,null,2));
 await browser?.close();await server.close();
}
console.log(`STAGE1 BROWSER ${results.filter(r=>r.ok).length}/${results.length} PASS`);
if(results.some(r=>!r.ok))process.exitCode=1;
