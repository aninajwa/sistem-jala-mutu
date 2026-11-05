import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';import assert from 'node:assert/strict';
import {createDemoWorkflow} from '../src/workflow/demoScenario';
import {PACKAGE_STORE_KEY} from '../src/workflow/packageStore';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const output=process.env.TEST_ARTIFACTS||fileURLToPath(new URL('../test-artifacts/ui09-states',import.meta.url));fs.mkdirSync(output,{recursive:true});
const server=await createServer({configFile:fileURLToPath(new URL('../vite.config.ts',import.meta.url)),server:{host:'127.0.0.1',port:5174,strictPort:true}});await server.listen();
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const results:any[]=[];let viewportWidth=1440;
async function setup(role:string){const context=await browser.newContext({viewport:{width:viewportWidth,height:1000}});const state=createDemoWorkflow('complete');state.project.id='CP09-STATES';await context.addInitScript(({key,state,role})=>{if(sessionStorage.getItem('seed'))return;sessionStorage.setItem('seed','1');localStorage.setItem(key,JSON.stringify({activePackageId:state.project.id,activeRole:role,packages:{[state.project.id]:{...state,role}}}));localStorage.setItem('jala-mutu-demo-session-v1','active');},{key:PACKAGE_STORE_KEY,state,role});const page=await context.newPage();page.setDefaultTimeout(15000);return {page,context};}
try{
 for(const width of [1440,360,390]){viewportWidth=width;
 for(const [role,required,forbidden] of [['PIC Balai / Pengguna Jasa','audit:2','audit:3'],['Direktorat / Pusat','audit:3','audit:2']]){
  const {page,context}=await setup(role);await page.goto('http://127.0.0.1:5174/documents?testRoles=1');await page.getByText('Siapkan BA dalam kewenangan Anda',{exact:true}).click();const values=await page.getByLabel('Jenis dokumen BA').locator('option').evaluateAll((els:HTMLOptionElement[])=>els.map(e=>e.value));assert.ok(values.includes(required));assert.ok(!values.includes(forbidden));await page.getByLabel('Jenis dokumen BA').selectOption(required);await page.getByRole('button',{name:'Mulai siapkan BA',exact:true}).click();await page.locator('.ba-workspace').first().waitFor();assert.equal(await page.getByLabel('Format BA',{exact:true}).inputValue(),'audit');results.push({role,width:viewportWidth,result:'pass',check:'authorized BA picker opens exact audit identity; other audit level absent'});await context.close();
 }
 const {page,context}=await setup('Penyedia Jasa / Ketua Tim');await page.goto('http://127.0.0.1:5174/documents?testRoles=1&submodule='+encodeURIComponent('/documents:BA & dokumen workflow'));
 let release:()=>void=()=>{};const pause=new Promise<void>(r=>{release=r});await page.route('**/ba-templates/**',async(route:any)=>{await pause;await route.fulfill({status:404,body:'Missing test template'});});
 const preview=page.getByRole('button',{name:'Pratinjau DOCX',exact:true});await preview.click();await page.locator('.ba-document-preview[aria-busy=true]').waitFor();assert.equal(await preview.isDisabled(),true);await page.screenshot({path:output+'/ba-loading-'+viewportWidth+'.png'});release();await page.locator('.ba-document-preview[aria-busy=false]').waitFor();assert.equal(await preview.isEnabled(),true);const notice=await page.locator('.ba-workspace [role=status]').allTextContents();assert.ok(notice.some(t=>/template|Template|gagal|Gagal/.test(t)),notice.join(' '));await page.screenshot({path:output+'/ba-template-error-'+viewportWidth+'.png'});await page.unroute('**/ba-templates/**');await preview.click();await page.locator('.ba-document-preview .docx').first().waitFor();await page.locator('.ba-document-preview[aria-busy=false]').waitFor();await page.screenshot({path:output+'/ba-preview-recovered-'+viewportWidth+'.png'});results.push({width:viewportWidth,result:'pass',check:'BA loading disables actions, missing template error is visible, retry recovers actual DOCX preview'});await context.close();
}
}finally{fs.writeFileSync(output+'/results.json',JSON.stringify({browser:browser.version(),results},null,2));await browser.close();await server.close();}
console.log(`PASS ${results.length} state checks`);
