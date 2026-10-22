import {SURVEY_TYPES} from '../src/workflow/model';
import {unzipSync,strFromU8} from 'fflate';
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';import assert from 'node:assert/strict';
import {createDemoWorkflow} from '../src/workflow/demoScenario';
import {withProductionReferences} from '../src/workflow/testing/productionFixture';
import {PACKAGE_STORE_KEY} from '../src/workflow/packageStore';
import {BA_TEMPLATES} from '../src/workflow/ba/docxEngine';
import type {WorkflowRole} from '../src/workflow/model';
const output=process.env.TEST_ARTIFACTS||fileURLToPath(new URL('../test-artifacts',import.meta.url));fs.mkdirSync(output+'/screenshots',{recursive:true});fs.mkdirSync(output+'/ba-samples',{recursive:true});
const server=await createServer({configFile:fileURLToPath(new URL('../vite.config.ts',import.meta.url)),server:{host:'127.0.0.1',port:5173,strictPort:true}});await server.listen();
const executablePath=process.env.CHROMIUM_EXECUTABLE;
const browser=await chromium.launch({...(executablePath?{executablePath}:{}),headless:true,args:executablePath?["--no-sandbox","--disable-dev-shm-usage","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--no-zygote"]:[]});
const roles:WorkflowRole[]=['Penyedia Jasa / Ketua Tim','PIC Balai / Pengguna Jasa','Direktorat / Pusat','Admin'];
const selections=['/entry:Persiapan & SPMK','/documents:Kalibrasi & personel','/entry:Validasi produksi','/entry:Survei harian','/verification:Verval 14 hari','/entry:Gerbang RNI/LRS','/verification:Audit tingkat 1–3','/reports:Penerimaan & termin'];
const fixture=withProductionReferences(createDemoWorkflow('complete'));fixture.project.id='PAKET-DEMO-001';fixture.project.packageName='Paket Uji Terisolasi QA/QC';fixture.project.surveyStartDate='2027-01-01';fixture.project.surveyEndDate='2027-12-31';fixture.activeCyclePeriod=1;fixture.productionTests.PCI.pciManual=true;fixture.cycle.surveyReviews=Object.fromEntries(fixture.project.surveyTypes.map(type=>[type,{decision:'Sesuai',note:'Referensi uji terisolasi',reviewedAt:fixture.simulationDate}]));
for(const type of fixture.project.surveyTypes){if(!fixture.calibrations.some(c=>c.surveyType===type)){fixture.calibrations.push({...fixture.calibrations[0],id:'TEST-CAL-'+type,surveyType:type,condition:'Baik',dueDate:'2027-12-31'});}}
const results:any[]=[];let errors:string[]=[];let completed=false;
async function setup(role:WorkflowRole,allSourceTypes=false){const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});const state={...structuredClone(fixture),role};if(allSourceTypes)state.project.surveyTypes=[...SURVEY_TYPES];await context.addInitScript(({key,state,role})=>{if(location.origin!=='http://127.0.0.1:5173'||sessionStorage.getItem('fixture-initialized'))return;sessionStorage.setItem('fixture-initialized','yes');localStorage.setItem(key,JSON.stringify({activePackageId:state.project.id,activeRole:role,packages:{[state.project.id]:state}}));localStorage.setItem('jala-mutu-demo-session-v1','active');},{key:PACKAGE_STORE_KEY,state,role});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));return {context,page};}
try{
 for(let r=0;r<roles.length;r++){
  const {context,page}=await setup(roles[r]);
  await page.goto('http://127.0.0.1:5173/packages?testRoles=1');await page.getByRole('button',{name:'Buka paket',exact:true}).first().waitFor();
  assert.equal(await page.locator('.package-card').count(),1);
  await page.waitForTimeout(450);await page.screenshot({animations:'disabled',path:`${output}/screenshots/role-${r}-packages.png`});
  for(let i=0;i<selections.length;i++){
   await page.goto(`http://127.0.0.1:5173${selections[i].split(':')[0]}?testRoles=1&submodule=${encodeURIComponent(selections[i])}`);
   await page.locator('[data-testid="operational-workflow-workspace"]').waitFor();await page.locator('.wf-title').first().waitFor();
   assert.equal(await page.locator('[data-testid="select-global-balai"]').count(),0);
   assert.equal(await page.locator('[data-testid="mobile-global-filters"]').count(),0);
   const content=await page.locator('body').innerText();assert.equal(content.includes('DATA SIMULASI'),false);
   if(r===3)assert.equal(await page.locator('[data-testid="button-prep-approve"]').count(),0);

   if(i===7)assert.match(await page.getByLabel('Tahap paket yang dibuka',{exact:true}).locator('option:checked').innerText(),/Perlu pemeriksaan formulir/);
   await page.waitForTimeout(450);await page.screenshot({animations:'disabled',path:`${output}/screenshots/role-${r}-stage-${i}.png`});results.push({role:roles[r],stage:selections[i],result:'pass',kind:'browser render + role context'});
  }
  await page.setViewportSize({width:390,height:844});
  for(let i=0;i<selections.length;i++){
   await page.goto(`http://127.0.0.1:5173${selections[i].split(':')[0]}?testRoles=1&submodule=${encodeURIComponent(selections[i])}`);await page.locator('.wf-title').first().waitFor();
   await page.screenshot({animations:'disabled',path:`${output}/screenshots/mobile-role-${r}-stage-${i}.png`});
   fs.writeFileSync(`${output}/mobile-width-${r}-${i}.json`,JSON.stringify(await page.locator('body *').evaluateAll(elements=>elements.filter(el=>el.getBoundingClientRect().right>window.innerWidth+2).map(el=>({tag:el.tagName,class:el.className,width:el.getBoundingClientRect().width,right:el.getBoundingClientRect().right}))),null,2));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2),false,`Mobile overflow: role ${r}, stage ${i}`);results.push({role:roles[r],stage:selections[i],result:'pass',kind:'390px mobile role workspace without page overflow'});
  }
  const snapshot=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!),PACKAGE_STORE_KEY);
  assert.equal(snapshot.packages[fixture.project.id].productionApproval,'Disetujui','Browsing pages must not revoke production approval');
  await context.close();
 }
 // Export all seven source formats through their real UI buttons.
 for(const template of BA_TEMPLATES){
  const role=template.id==='audit'||['kalibrasi','konsistensi','internal'].includes(template.id)?roles[0]:roles[1];const {context,page}=await setup(role);
  await page.goto('http://127.0.0.1:5173/documents?testRoles=1&submodule='+encodeURIComponent('/documents:BA & dokumen workflow'));
  await page.getByLabel('Format BA',{exact:true}).selectOption(template.id);
  await page.getByRole('button',{name:'Lengkapi isian template',exact:true}).click();
  const draftValue=template.id==='penerimaan'?'Kamis':'Lokasi uji terisolasi';const first=page.locator('.ba-field-row textarea').first();await first.fill(draftValue);
  // Refresh must retain the draft: init script only seeds workflow/session, never document keys.
  await page.reload();await page.getByLabel('Format BA',{exact:true}).selectOption(template.id);await page.getByRole('button',{name:'Lengkapi isian template',exact:true}).click();assert.equal(await page.locator('.ba-field-row textarea').first().inputValue(),draftValue);
  const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'Unduh DOCX draft',exact:true}).click();const download=await downloadEvent;await download.saveAs(`${output}/ba-samples/${template.id}.docx`);
  assert.ok(fs.statSync(`${output}/ba-samples/${template.id}.docx`).size>1000);
  const actual=unzipSync(fs.readFileSync(`${output}/ba-samples/${template.id}.docx`));
  const original=unzipSync(fs.readFileSync(fileURLToPath(new URL('../public/ba-templates/'+template.filename,import.meta.url))));
  assert.deepEqual(Object.keys(actual).sort(),Object.keys(original).sort(),'DOCX must retain relationships, headers, footers and assets');
  const xml=strFromU8(actual['word/document.xml']);const text=xml.replace(/<[^>]+>/g,'');assert.ok(text.includes('DRAFT LOKAL'));assert.equal(/[\u00e2][\u20ac\u2020\u2030]|\u00c2[\u00b7\u00b2]/.test(text),false,'Generated DOCX text must not contain mojibake');
  if(template.id==='penerimaan'){assert.equal(text.includes('Dua Ribu Dua Puluh Lima (2025)'),false);assert.ok(text.includes('2027'));}
  if(template.id==='audit')assert.equal(text.includes('2026-12-18'),false,'Non-periodic BA must use package dates, not period zero');
  if(template.id==='kalibrasi')assert.ok(text.includes('berikutnya dijadwalkan pada: [BELUM DIISI]'),'Unknown next calibration date must not be fabricated');

  if(template.id==='kalibrasi'||template.id==='penerimaan'){await page.getByRole('button',{name:'Pratinjau DOCX',exact:true}).click();await page.locator('.ba-document-preview .docx').first().waitFor();
   await page.waitForTimeout(450);await page.screenshot({animations:'disabled',path:`${output}/screenshots/ba-${template.id}.png`});}
  results.push({format:template.id,result:'pass',kind:'real DOCX download + draft persistence'});await context.close();
 }
 const {context,page}=await setup(roles[1]);await page.goto('http://127.0.0.1:5173/verification?testRoles=1&submodule='+encodeURIComponent(selections[6]));await page.getByTestId('button-audit-level-2').click();await page.getByTestId('select-audit-rejection-type-2').selectOption('PCI');await page.getByTestId('input-audit-rejection-2').fill('Bukti pembanding belum sesuai');await page.getByTestId('select-audit-status-2').selectOption('Ditolak');await page.getByRole('button',{name:'Buka tindak lanjut',exact:true}).waitFor();const rejected=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).packages['PAKET-DEMO-001'],PACKAGE_STORE_KEY);const followUp=rejected.corrections.find((item:any)=>item.source==='Penolakan audit tingkat 2'&&item.status!=='Ditutup');assert.equal(followUp.surveyType,'PCI');assert.equal(rejected.audits[2].baNumber,fixture.audits[2].baNumber,'Downstream audit BA must be retained');results.push({result:'pass',kind:'audit rejection creates follow-up via browser'});await context.close();
 // Period navigation is a viewing action; it must persist without invalidating the previous BA.
 {const {context,page}=await setup(roles[0]);await page.goto('http://127.0.0.1:5173/verification?testRoles=1&submodule='+encodeURIComponent(selections[4]));
 const previousBa=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).packages['PAKET-DEMO-001'].cycle.certificateId,PACKAGE_STORE_KEY);
 await page.getByLabel('Periode pemeriksaan',{exact:true}).selectOption('2');await page.reload();await page.getByLabel('Periode pemeriksaan',{exact:true}).waitFor();
 assert.equal(await page.getByLabel('Periode pemeriksaan',{exact:true}).inputValue(),'2');
 await page.getByLabel('Periode pemeriksaan',{exact:true}).selectOption('1');
 const ba=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).packages['PAKET-DEMO-001'].cycle.certificateId,PACKAGE_STORE_KEY);assert.equal(ba,previousBa);
 await page.getByRole('button',{name:'Ubah jadwal survei',exact:true}).click();await page.getByLabel('Mulai pelaksanaan survei',{exact:true}).fill('2027-01-01');await page.getByLabel('Selesai pelaksanaan survei',{exact:true}).fill('2027-12-30');await page.getByRole('button',{name:'Simpan jadwal survei',exact:true}).click();await page.reload();const scheduled=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).packages['PAKET-DEMO-001'],PACKAGE_STORE_KEY);assert.equal(scheduled.project.surveyEndDate,'2027-12-30');assert.equal(scheduled.cycle.certificateId,previousBa);assert.equal(scheduled.cycle.requiresReview,true);
 results.push({result:'pass',kind:'3B period and legitimate schedule edits persist without removing previous BA; changed schedule requires review'});await context.close();}
 // An isolated preparation scenario uses one package and real submit/revise/resubmit/approve handlers.
 {const {context,page}=await setup(roles[0]);const url='http://127.0.0.1:5173/entry?testRoles=1&submodule='+encodeURIComponent(selections[0]);await page.goto(url);
 await page.evaluate(key=>{const store=JSON.parse(localStorage.getItem(key)!);store.packages['PAKET-DEMO-001'].project.preparation.reportApproval='Draft';localStorage.setItem(key,JSON.stringify(store));},PACKAGE_STORE_KEY);await page.reload();
 await page.getByTestId('button-prep-submit').click();
 async function actor(role:WorkflowRole){await page.evaluate(({key,role})=>{const store=JSON.parse(localStorage.getItem(key)!);store.activeRole=role;store.packages['PAKET-DEMO-001'].role=role;localStorage.setItem(key,JSON.stringify(store));},{key:PACKAGE_STORE_KEY,role});await page.reload();}
 await actor(roles[1]);await page.getByTestId('input-prep-review-note').fill('Perbaiki referensi laporan pendahuluan');await page.getByTestId('button-prep-revise').click();
 await actor(roles[0]);await page.getByTestId('button-prep-submit').click();await actor(roles[1]);await page.getByTestId('button-prep-approve').click();
 const status=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).packages['PAKET-DEMO-001'].project.preparation.reportApproval,PACKAGE_STORE_KEY);assert.equal(status,'Disetujui');results.push({result:'pass',kind:'Stage 0 submit, revise, resubmit and approve through browser'});
 await page.setViewportSize({width:390,height:844});
   await page.waitForTimeout(450);await page.screenshot({animations:'disabled',path:output+'/screenshots/mobile-stage-0.png',fullPage:true});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+2);assert.equal(overflow,false,'Mobile page must not overflow');results.push({result:'pass',kind:'390px mobile stage layout without page overflow'});await context.close();}

 // Real BA review/rejection/revision cycle; all input is explicitly isolated test data.
 {const {context,page}=await setup(roles[0]);
 const url='http://127.0.0.1:5173/documents?testRoles=1&submodule='+encodeURIComponent('/documents:BA & dokumen workflow');
 async function openDocument(){await page.goto(url);await page.getByLabel('Format BA',{exact:true}).selectOption('duaMingguan');}
 async function actor(role:WorkflowRole){await page.evaluate(({key,role})=>{const store=JSON.parse(localStorage.getItem(key)!);store.activeRole=role;store.packages['PAKET-DEMO-001'].role=role;localStorage.setItem(key,JSON.stringify(store));},{key:PACKAGE_STORE_KEY,role});await openDocument();}
 await openDocument();await page.getByRole('button',{name:'Lengkapi isian template',exact:true}).click();
 for(const section of await page.locator('.ba-form-section').all())if(await section.getAttribute('open')===null)await section.locator(':scope > summary').click();
 for(const input of await page.locator('.ba-field-row textarea:not([disabled])').all())await input.fill('Isian pengujian terisolasi, bukan data pengesahan');
 for(const input of await page.locator('.ba-field-row input[type=date]:not([disabled])').all())await input.fill('2027-01-14');
 for(const input of await page.locator('.ba-field-row select:not([disabled])').all())await input.selectOption({index:1});
 await page.getByRole('button',{name:'Ajukan pemeriksaan BA',exact:true}).click();await page.getByText('Menunggu pemeriksaan',{exact:true}).first().waitFor();
 await actor(roles[1]);await page.getByLabel('Catatan pemeriksaan BA').fill('Koreksi dokumen uji');await page.getByRole('button',{name:'Tolak BA',exact:true}).click();
 await actor(roles[0]);await page.getByRole('button',{name:'Ajukan pemeriksaan BA',exact:true}).click();
 await actor(roles[1]);await page.getByLabel('Catatan pemeriksaan BA').fill('Perjelas lokasi pada dokumen uji');await page.getByRole('button',{name:'Minta revisi BA',exact:true}).click();
 await actor(roles[0]);await page.getByRole('button',{name:'Lengkapi isian template',exact:true}).click();await page.locator('.ba-field-row textarea').first().fill('Lokasi pengujian setelah koreksi');await page.getByRole('button',{name:'Ajukan pemeriksaan BA',exact:true}).click();
 await actor(roles[1]);await page.getByRole('button',{name:'Selesaikan pemeriksaan BA',exact:true}).click();await page.getByText('Pemeriksaan selesai',{exact:true}).first().waitFor();
 await page.reload();await page.getByLabel('Format BA',{exact:true}).selectOption('duaMingguan');await page.getByText('Pemeriksaan selesai',{exact:true}).first().waitFor();
 const versions=await page.evaluate(()=>JSON.parse(localStorage.getItem('jala-ba-source-v1:PAKET-DEMO-001:duaMingguan:1:IRI:1')!).versions);
 assert.deepEqual(versions.map((v:any)=>v.status),['submitted-local','rejected-local','submitted-local','revision-requested-local','submitted-local','reviewed-local']);assert.ok(versions.every((v:any)=>v.officiallySigned===false));

   await page.waitForTimeout(450);await page.screenshot({animations:'disabled',path:output+'/screenshots/ba-reviewed.png'});
 results.push({result:'pass',kind:'BA submit, reject, resubmit, revision, correct, approve review and refresh through real UI'});await context.close();}

 // Required source answers must gate a new audit decision; each audit level has independent answers.
 {const {context,page}=await setup(roles[0]);const url='http://127.0.0.1:5173/verification?testRoles=1&submodule='+encodeURIComponent(selections[6]);await page.goto(url);
 await page.evaluate(key=>{const store=JSON.parse(localStorage.getItem(key)!);store.packages['PAKET-DEMO-001'].audits[0].status='Dalam Review';localStorage.setItem(key,JSON.stringify(store));},PACKAGE_STORE_KEY);await page.reload();
 await page.getByTestId('select-audit-status-1').selectOption('Lulus');
 assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).packages['PAKET-DEMO-001'].audits[0].status,PACKAGE_STORE_KEY),'Dalam Review','Blank source checklist must block Lulus');
 let interacted=0;
 for(const type of fixture.project.surveyTypes){
  await page.getByLabel('Jenis survei checklist sumber',{exact:true}).selectOption(type);
  for(const section of await page.locator('.source-exact-checklist .structured-checklist-section').all())if(await section.getAttribute('open')===null)await section.locator(':scope > summary').click();
  for(const group of await page.locator('.source-exact-checklist fieldset').all()){if(await group.locator('input[type=radio]').count())await group.locator('input[type=radio]').first().check();else for(const choice of await group.locator('input[type=checkbox]').all())await choice.check();interacted++;}
 }
 await page.reload();await page.getByTestId('select-audit-status-1').selectOption('Lulus');
 assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).packages['PAKET-DEMO-001'].audits[0].status,PACKAGE_STORE_KEY),'Lulus');
 await page.getByTestId('button-audit-level-2').click();assert.equal(await page.locator('.source-exact-checklist input[type=radio]:checked').count(),0);assert.equal(await page.locator('.source-exact-checklist input[type=radio]:enabled').count(),0);
 results.push({result:'pass',kind:'Audit source checklist blocks blank approval, persists after refresh and isolates levels/roles',sourceRadioGroupsInteracted:interacted});await context.close();}

 // General attachments must store real bytes, distinguish metadata and survive refresh.
 {const {context,page}=await setup(roles[0]);await page.goto('http://127.0.0.1:5173/entry?testRoles=1&submodule='+encodeURIComponent(selections[0]));
 const attachment=page.locator('.documents-area').first();await attachment.locator('.document-references > summary').click();
 await page.getByLabel('Referensi Laporan Pendahuluan',{exact:true}).fill('REF-UJI-METADATA');await attachment.getByText(/Referensi saja · file belum tersimpan/).waitFor();
 const bytes=fs.readFileSync(fileURLToPath(new URL('../public/ba-templates/kalibrasi.docx',import.meta.url)));
 await attachment.getByLabel('Tambah dokumen dan lampiran',{exact:true}).setInputFiles({name:'lampiran-uji.docx',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',buffer:bytes});
 await attachment.getByText('1 berkas lokal',{exact:true}).waitFor();await page.reload();await attachment.getByText('1 berkas lokal',{exact:true}).waitFor();
 const event=page.waitForEvent('download');await attachment.getByRole('button',{name:'Unduh',exact:true}).click();const download=await event;await download.saveAs(output+'/lampiran-uji.docx');assert.ok(fs.readFileSync(output+'/lampiran-uji.docx').equals(bytes));
 results.push({result:'pass',kind:'Attachment metadata is not file proof; real IndexedDB bytes survive refresh and download unchanged'});await context.close();}

 // All survey forms are exercised in one isolated package, without adding operational packages.
 {const {context,page}=await setup(roles[0],true);await page.goto('http://127.0.0.1:5173/documents?testRoles=1&submodule='+encodeURIComponent(selections[1]));
 const surveys=[];
 for(const type of SURVEY_TYPES){await page.getByRole('button',{name:new RegExp('^'+type+'(?:\\s|$)')}).first().click();for(const section of await page.locator('.source-exact-checklist .structured-checklist-section').all())if(await section.getAttribute('open')===null)await section.locator(':scope > summary').click();const group=page.locator('.source-exact-checklist fieldset').first();await group.waitFor();await group.locator('input[type=radio],input[type=checkbox]').first().check();surveys.push(type);}
 await page.reload();for(const section of await page.locator('.source-exact-checklist .structured-checklist-section').all())if(await section.getAttribute('open')===null)await section.locator(':scope > summary').click();await page.locator('.source-exact-checklist fieldset').first().waitFor();assert.equal(await page.locator('.source-exact-checklist fieldset').first().locator('input[type=radio]').first().isChecked(),true);
 results.push({result:'pass',kind:'All eight calibration survey forms use real source choices and retain answers after refresh',surveys});await context.close();}

 {const {context,page}=await setup(roles[0]);await page.goto('http://127.0.0.1:5173/entry?testRoles=1&submodule='+encodeURIComponent(selections[2]));await page.getByRole('button',{name:'PCI',exact:true}).click();await page.getByRole('button',{name:'PCI Berbasis AI',exact:true}).click();assert.equal(await page.getByTestId('button-production-submit-review').isDisabled(),true);await page.reload();const method=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).packages['PAKET-DEMO-001'].productionTests.PCI.pciManual,PACKAGE_STORE_KEY);assert.equal(method,false);await page.getByRole('button',{name:'PCI',exact:true}).click();await page.getByRole('button',{name:'PCI Manual',exact:true}).click();assert.equal(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)!).packages['PAKET-DEMO-001'].productionTests.PCI.pciManual,PACKAGE_STORE_KEY),true);results.push({result:'pass',kind:'PCI Manual and AI switch independently through real controls; unresolved AI authorization holds submission after refresh'});await context.close();}
 {const {context,page}=await setup(roles[0]);await page.goto('http://127.0.0.1:5173/verification?testRoles=1&submodule='+encodeURIComponent(selections[4]));const form=page.locator('.source-exact-checklist');await form.getByLabel('Jenis survei checklist sumber',{exact:true}).selectOption('PCI');for(const details of await form.locator('.structured-checklist-section').all())if(await details.getAttribute('open')===null)await details.locator(':scope > summary').click();for(const details of await form.locator('.source-table-section > details').all())if(await details.getAttribute('open')===null)await details.locator(':scope > summary').click();await form.getByLabel('D. ANALISIS STATISTIK KONSISTENSI, Standar Deviasi PCI, Nilai',{exact:true}).fill('5.1');await form.locator('strong').filter({hasText:/^Tidak Sesuai$/}).first().waitFor();assert.equal(await form.locator('fieldset input:checked').count(),0);results.push({result:'pass',kind:'PCI source scalar comparison shows exact source threshold without automatically answering reviewer choices'});await context.close();}
 // Restored Word controls, bridge numeric evaluation, multi-file evidence and refresh.
 {const {context,page}=await setup(roles[0],true);await page.goto('http://127.0.0.1:5173/documents?testRoles=1&submodule='+encodeURIComponent(selections[1]));
 await page.getByRole('button',{name:/^Jembatan(?:\s|$)/}).first().click();
 const form=page.locator('.source-exact-checklist');assert.equal(await form.locator('summary').filter({hasText:/^A\. INFORMASI UMUM$/}).count(),1);
 for(const section of await form.locator('.structured-checklist-section').all())if(await section.getAttribute('open')===null)await section.locator(':scope > summary').click();
 await form.getByLabel('M. HASIL UJI SAMPLING VALIDASI LAPANGAN, 1, Nilai Kondisi Tim Surveyor',{exact:true}).fill('2');
 await form.getByLabel('M. HASIL UJI SAMPLING VALIDASI LAPANGAN, 1, Nilai Kondisi Verifikasi',{exact:true}).fill('4');
 await form.getByText('Major',{exact:true}).waitFor();
 const conclusion=form.getByRole('group',{name:'Peralatan Pemeriksaan · Status',exact:true});await conclusion.getByLabel('Perlu Perbaikan',{exact:true}).check();
 const upload=form.getByLabel('Tambah dokumen dan lampiran',{exact:true});await upload.setInputFiles([{name:'uji-1.txt',mimeType:'text/plain',buffer:Buffer.from('Bukti uji 1')},{name:'uji-2.txt',mimeType:'text/plain',buffer:Buffer.from('Bukti uji 2')}]);await form.getByText('2 berkas lokal',{exact:true}).waitFor();
 await page.reload();await page.getByRole('button',{name:/^Jembatan(?:\s|$)/}).first().click();await form.getByText('2 berkas lokal',{exact:true}).waitFor();
 for(const section of await form.locator('.structured-checklist-section').all())if(await section.getAttribute('open')===null)await section.locator(':scope > summary').click();assert.equal(await conclusion.getByLabel('Perlu Perbaikan',{exact:true}).isChecked(),true);await form.getByText('Major',{exact:true}).waitFor();
 const firstFile=form.locator('.document-file').filter({has:page.getByText('uji-1.txt',{exact:true})});await firstFile.locator('details').first().locator(':scope > summary').click();
 const linkSelect=firstFile.getByLabel('Tambah keterkaitan uji-1.txt',{exact:true});const choices=await linkSelect.locator('optgroup[label="Butir pemeriksaan"] option').evaluateAll(options=>options.slice(0,2).map(option=>(option as HTMLOptionElement).value));assert.equal(choices.length,2);for(const value of choices)await linkSelect.selectOption(value);
 await firstFile.getByText(/2 butir/).first().waitFor();
 await page.goto('http://127.0.0.1:5173/verification?testRoles=1&submodule='+encodeURIComponent(selections[4]));
 const periodFiles=page.locator('.source-exact-checklist .documents-area');const reuse=periodFiles.getByLabel('Gunakan berkas tersimpan',{exact:true});const saved=await reuse.locator('option').filter({hasText:'uji-1.txt'}).getAttribute('value');assert.ok(saved);await reuse.selectOption(saved!);await periodFiles.getByText('1 berkas lokal',{exact:true}).waitFor();
 const downloadEvent=page.waitForEvent('download');await periodFiles.getByRole('button',{name:'Unduh',exact:true}).click();await (await downloadEvent).saveAs(output+'/reused-evidence.txt');assert.equal(fs.readFileSync(output+'/reused-evidence.txt','utf8'),'Bukti uji 1');
 await periodFiles.getByRole('button',{name:'Lepaskan berkas',exact:true}).click();await periodFiles.getByText('0 berkas lokal',{exact:true}).waitFor();
 await page.goto('http://127.0.0.1:5173/documents?testRoles=1&submodule='+encodeURIComponent(selections[1]));await page.getByRole('button',{name:/^Jembatan(?:\s|$)/}).first().click();await form.getByText('2 berkas lokal',{exact:true}).waitFor();
 const restored=form.locator('.document-file').filter({has:page.getByText('uji-1.txt',{exact:true})});await restored.getByText(/2 butir/).first().waitFor();results.push({result:'pass',kind:'One real file links to two source items, reuses across activities, retains history and remains after unlink/refresh'});
 await page.screenshot({path:output+'/screenshots/bridge-complete-form.png',fullPage:true});results.push({result:'pass',kind:'Bridge A/M/N/O form structure, original nested choices, exact Major evaluation and two real attachments persist'});await context.close();}
 assert.deepEqual(errors,[]);completed=true;fs.writeFileSync(output+'/browser-results.json',JSON.stringify({results,errors,completeJourneyFromBlank:false},null,2));console.log(`PASS ${results.length} browser checks; 7 DOCX downloads; no page errors`);
}finally{fs.writeFileSync(output+'/browser-results.json',JSON.stringify({results,errors,completed,completeJourneyFromBlank:false},null,2));await browser.close();await server.close();}
