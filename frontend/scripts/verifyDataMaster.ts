import { chromium } from 'playwright';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createDemoWorkflow } from '../src/workflow/demoScenario';
import { PACKAGE_STORE_KEY } from '../src/workflow/packageStore';

const output=process.env.TEST_ARTIFACTS || 'test-artifacts/data-master';
fs.mkdirSync(output,{recursive:true});
const server=await createServer({configFile:fileURLToPath(new URL('../vite.config.ts',import.meta.url)),server:{host:'127.0.0.1',port:5185,strictPort:true}});
await server.listen();
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const findings:string[]=[];
const exceptions:string[]=[];
let completed=false;
try {
 const context=await browser.newContext({viewport:{width:1365,height:850},acceptDownloads:true});
 const workflow=createDemoWorkflow('complete');
 workflow.role='Admin';
 await context.addInitScript(({key,workflow})=>{
  if(sessionStorage.getItem('data-master-e2e-seed'))return;
  sessionStorage.setItem('data-master-e2e-seed','1');
  localStorage.setItem(key,JSON.stringify({activePackageId:workflow.project.id,activeRole:'Admin',packages:{[workflow.project.id]:workflow}}));
  localStorage.setItem('jala-mutu-demo-session-v1','active');
  localStorage.removeItem('jala-master-registry-v1');
 },{key:PACKAGE_STORE_KEY,workflow});
 const page=await context.newPage();
 page.on('pageerror',e=>exceptions.push(e.message));
 const url='http://127.0.0.1:5185/data-master?testRoles=1';
 await page.goto(url);
 const sidebar=page.locator('aside.sidebar');
 await page.getByTestId('table-master').waitFor();
 assert.equal(await page.getByTestId('select-global-balai').count(),0);
 assert.equal(await page.getByTestId('select-global-periode').count(),0);
 assert.equal(await page.getByTestId('button-switch-role').count(),1);
 assert.equal(await page.getByTestId('kpi-master-balai').getByText('5',{exact:true}).count(),1);
 await page.getByRole('button',{name:'Detail Balai Sumatera Utara'}).click();
 await page.getByRole('dialog',{name:'Detail Balai & Wilayah'}).getByText('Belum tercatat').first().waitFor();
 await page.getByRole('button',{name:'Tutup detail'}).click();
 findings.push('Data bawaan tetap tersedia, Detail tidak mengarang atribut, filter global tidak berulang');

 async function choose(label:string){await sidebar.getByText(label,{exact:true}).click();}
 async function formSave(kind:string,inputs:Record<string,string>,survey?:string){
  await page.getByTestId('button-add-reference').click();
  const form=page.getByRole('dialog',{name:kind});
  await form.waitFor();
  for(const [key,value] of Object.entries(inputs))await form.locator(`#master-${key}`).fill(value);
  if(survey)await form.locator('#master-surveyId').selectOption({label:survey});
  await form.getByTestId('button-submit-master').click();
  await form.waitFor({state:'hidden'});
 }
 await choose('Referensi Survei');
 await formSave('Tambah Jenis Survei',{name:'Survei E2E',metode:'Metode uji E2E',satuanVolume:'lokasi',sistemTujuan:'Sistem Uji'});
 await page.getByText('Survei E2E',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Parameter Uji'}).click();
 await formSave('Tambah Parameter Uji',{name:'Parameter E2E',kodeParameter:'P-E2E',satuan:'unit'},'Survei E2E');
 await page.getByRole('button',{name:'Detail Parameter E2E'}).click();
 const detailParameter=page.getByRole('dialog',{name:'Detail Parameter Uji'});
 await detailParameter.getByText('Survei E2E').waitFor();
 await detailParameter.getByText('P-E2E').waitFor();
 await detailParameter.getByRole('button',{name:'Tutup detail'}).click();
 findings.push('Jenis survei dan parameter saling terhubung; Detail menampilkan relasi aktual');

 await choose('Alat & Personel');
 await formSave('Tambah Alat Survei',{name:'Laser E2E',merekTipe:'Model E2E',nomorSeri:'SERIAL-E2E-01',tahunPerolehan:'2025',kondisi:'Baik'},'IRI');
 await page.getByTestId('kpi-master-tools').getByText('1',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Detail Laser E2E'}).click();
 const detailTool=page.getByRole('dialog',{name:'Detail Alat Survei'});
 await detailTool.getByText('SERIAL-E2E-01').waitFor();
 await detailTool.getByText('Model E2E').waitFor();
 await detailTool.getByRole('button',{name:'Tutup detail'}).click();
 await page.getByRole('button',{name:'Personel',exact:true}).click();
 await formSave('Tambah Personel',{name:'Personel E2E',pendidikan:'S1',pengalamanTahun:'5',penyedia:'Organisasi E2E'});
 await page.getByTestId('kpi-master-staff').getByText('1',{exact:true}).waitFor();
 await page.reload();
 await page.getByTestId('kpi-master-staff').getByText('1',{exact:true}).waitFor();
 // Reload resets App.activeTab to 'Semua': Data Master reopens Balai & Wilayah.
  // Return to the correct sidebar section before selecting the inner Personel tab.
  await choose('Alat & Personel');
 await page.getByRole('button',{name:'Personel',exact:true}).click();
  await page.getByTestId('table-master').getByText('Personel E2E',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Detail Personel E2E'}).click();
 await page.getByRole('dialog',{name:'Detail Personel'}).getByText('Organisasi E2E').waitFor();
 await page.getByRole('button',{name:'Tutup detail'}).click();
 findings.push('Alat dan Personel tersimpan, KPI berubah, dan Detail bertahan setelah reload');

 await page.getByRole('textbox',{name:'Cari Personel'}).fill('tidak-ada-personel-E2E');
 await page.getByText('Tidak ada referensi yang cocok dengan pencarian.').waitFor();
 await page.getByRole('button',{name:'Hapus pencarian'}).first().click();
 await page.getByRole('textbox',{name:'Cari Personel'}).fill('Organisasi E2E');
 await page.getByRole('button',{name:'Detail Personel E2E'}).waitFor();
 const downloadPromise=page.waitForEvent('download');
 await page.getByTestId('button-export-master').click();
 const download=await downloadPromise;
 await download.saveAs(`${output}/personel.csv`);
 const csv=fs.readFileSync(`${output}/personel.csv`,'utf8');
 assert.ok(csv.includes('Personel E2E')&&csv.includes('Organisasi E2E'));
 assert.ok(!csv.includes('Laser E2E'),'CSV must not include another category');
 await page.setViewportSize({width:390,height:844});
 await page.reload();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2),false,'390px document has horizontal overflow');
 findings.push('Pencarian scoped, CSV aktual, dan halaman 390px tanpa overflow global');
 assert.deepEqual(exceptions,[]);
 completed=true;
 await context.close();
}finally{
 fs.writeFileSync(`${output}/results.json`,JSON.stringify({completed,findings,exceptions},null,2));
 await browser.close();await server.close();
}
if(completed){console.log(`DATA MASTER E2E: PASS (${findings.length}/4 scenario groups)`);findings.forEach((v,i)=>console.log(`  PASS ${i+1}. ${v}`));}
