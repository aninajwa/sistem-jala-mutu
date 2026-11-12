import { chromium } from 'playwright';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createDemoWorkflow } from '../src/workflow/demoScenario';
import { PACKAGE_STORE_KEY } from '../src/workflow/packageStore';

const server = await createServer({configFile:fileURLToPath(new URL('../vite.config.ts', import.meta.url)),server:{host:'127.0.0.1',port:5187,strictPort:true}});
await server.listen();
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const results:string[]=[];
const errors:string[]=[];
try {
 const context=await browser.newContext({viewport:{width:1365,height:850},acceptDownloads:true});
 const workflow=createDemoWorkflow('complete');workflow.role='Admin';
 await context.addInitScript(({key,workflow})=>{
  if(sessionStorage.getItem('jala-admin-e2e-seed'))return;
  sessionStorage.setItem('jala-admin-e2e-seed','1');
  sessionStorage.removeItem('jala-admin-account-proposals-session-v1');
  localStorage.setItem(key,JSON.stringify({activePackageId:workflow.project.id,activeRole:'Admin',packages:{[workflow.project.id]:workflow}}));
  localStorage.setItem('jala-mutu-demo-session-v1','active');
 },{key:PACKAGE_STORE_KEY,workflow});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5187/audit?testRoles=1');
 await page.getByTestId('admin-access-workspace').waitFor();
 assert.equal(await page.getByTestId('admin-users-empty').count(),1);
 assert.equal(await page.getByTestId('select-global-balai').count(),0);
 assert.equal(await page.getByTestId('select-global-periode').count(),0);
 assert.equal(await page.getByText('42',{exact:true}).count(),0);
 await page.getByTestId('admin-add-proposal').click();
 await page.getByLabel('Username *').fill('pengguna.e2e');
 await page.getByLabel('Email *').fill('test@example.org');
 await page.getByLabel('Instansi/organisasi *').fill('Instansi E2E');
 await page.getByLabel('Peran',{exact:true}).selectOption('PIC Balai / Pengguna Jasa');
 await page.getByLabel('Cakupan penugasan').selectOption('balai');
 await page.getByLabel('Balai penugasan *').selectOption({label:'Balai Jawa Barat'});
 await page.getByTestId('admin-add-assignment').click();
 await page.getByTestId('admin-save-proposal').click();
 assert.equal(await page.getByTestId('admin-proposal-detail').count(),0,'Detail tidak tampil otomatis');
 await page.getByTestId('admin-proposals-table').getByRole('button',{name:'Detail'}).click();
 await page.getByTestId('admin-proposal-detail').getByText('Balai Jawa Barat',{exact:false}).waitFor();
 await page.getByRole('button',{name:'Tutup Detail Usulan'}).click();
 assert.equal(await page.getByTestId('admin-proposal-count').innerText(),'1');
 results.push('Usulan akun dan penugasan Balai tersimpan tanpa mengaktifkan akses');
 await page.reload();
 await page.getByTestId('admin-proposal-count').getByText('1').waitFor();
 await page.getByTestId('admin-proposals-table').getByText('pengguna.e2e').waitFor();
 assert.equal(await page.getByTestId('admin-proposals-table').getByText('Belum aktif').count(),1);
 results.push('Usulan dapat ditinjau setelah refresh dalam sesi pengujian');
 await page.getByRole('tab',{name:'Hak Akses'}).click();
 await page.getByLabel('Pilih peran untuk hak akses').selectOption('Admin');
 const permission=await page.getByTestId('admin-permission-table').innerText();
 assert.ok(permission.includes('Review Balai'));assert.ok(permission.includes('Audit pusat'));
 const adminApproval=await page.getByTestId('admin-permission-table').locator('tbody tr').allInnerTexts();
 assert.ok(adminApproval.some(x=>x.includes('Review Balai')&&!x.includes('Putuskan')));
 assert.ok(adminApproval.some(x=>x.includes('Audit pusat')&&!x.includes('Putuskan')));
 await page.getByRole('tab',{name:'Jejak Aktivitas'}).click();
 await page.getByTestId('admin-trail-table').waitFor();
 assert.equal(await page.getByText('14 Jun 2027 14:32',{exact:true}).count(),0);
 assert.equal(await page.getByRole('button',{name:'Data contoh'}).count(),0,'Tab contoh tidak boleh terlihat');
 assert.equal(await page.getByTestId('admin-trail-detail').count(),0,'Detail aktivitas tidak tampil sebelum diklik');
 const trailRows=page.getByTestId('admin-trail-table').locator('tbody tr');
 // Tidak ada aktivitas nyata dalam sesi baru adalah kondisi sah, bukan kegagalan.
 assert.equal(await trailRows.count(),0,'Sesi E2E bersih tidak boleh mengarang aktivitas');
 await page.getByText('Tidak ada aktivitas yang cocok.',{exact:true}).waitFor();
 // Rekaman fixture hanya berada pada browser pengujian terisolasi dan tidak masuk aplikasi pengguna.
 // Gunakan penyimpanan demo yang memang dibaca UI agar popup Detail diuji secara nyata.
 await page.evaluate(() => {
  const key='road-qaqc-local-v1';
  const raw=localStorage.getItem(key);
  let stored:Record<string,unknown>={};
  if(raw){try{stored=JSON.parse(raw) as Record<string,unknown>;}catch{stored={};}}
  const existing=Array.isArray(stored.logs)?stored.logs:[];
  localStorage.setItem(key,JSON.stringify({...stored,logs:[...existing,{
   id:'LOG-E2E-ADMIN-001',waktu:'12 Nov 2026 10:00',pengguna:'Penguji E2E',
   aktivitas:'Pemeriksaan tampilan detail',objek:'Objek E2E',hasil:'Berhasil',
  }]}));
 });
 await page.reload();
 await page.getByRole('tab',{name:'Jejak Aktivitas'}).click();
 const fixtureRow=page.getByTestId('admin-trail-table').locator('tbody tr').filter({hasText:'Objek E2E'});
 await fixtureRow.waitFor();
 assert.equal(await fixtureRow.count(),1,'Rekaman fixture perlu tampil tepat satu kali');
 assert.equal(await page.getByTestId('admin-trail-detail').count(),0,'Detail tidak otomatis terbuka');
 await fixtureRow.getByRole('button',{name:'Detail'}).click();
 await page.getByTestId('admin-trail-detail').getByText('LOG-E2E-ADMIN-001',{exact:true}).waitFor();
 await page.getByRole('button',{name:'Tutup Detail Aktivitas'}).click();
 const promise=page.waitForEvent('download');
 await page.getByTestId('admin-export-trail').click();
 const download=await promise;
 assert.ok(download.suggestedFilename().endsWith('.csv'));
 results.push('Matriks Admin benar; keadaan log kosong, popup Detail, dan ekspor CSV teruji');
 await page.getByRole('tab',{name:'Pengguna & Peran'}).click();
 await page.getByRole('button',{name:'Hapus usulan pengguna.e2e'}).click();
 assert.equal(await page.getByTestId('admin-proposal-count').innerText(),'0');
 await page.setViewportSize({width:390,height:844});
 await page.reload();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2),false);
 results.push('Usulan dapat dihapus; halaman 390px tidak meluber horizontal');
 assert.deepEqual(errors,[]);
 console.log(`ADMIN ACCESS E2E: PASS (${results.length}/4 scenario groups)`);
 for(let i=0;i<results.length;i++)console.log(`  PASS ${i+1}. ${results[i]}`);
 await context.close();
} finally {await browser.close();await server.close();}
