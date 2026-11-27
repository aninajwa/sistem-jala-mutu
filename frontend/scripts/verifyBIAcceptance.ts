import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
const port=Number(process.env.TEST_PORT||5198),out=process.env.TEST_ARTIFACTS||'test-artifacts/bi-acceptance';
await fs.mkdir(out,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port,strictPort:true,hmr:false}});
await server.listen();
try {
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE});
 try {
  const titles=['Dashboard Pekerjaan','Dashboard Pengawasan','Dashboard Nasional','Dashboard Sistem'];
  for(let i=0;i<4;i++){
   const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors:string[]=[];page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto(`http://127.0.0.1:${port}/scripts/bi-acceptance.html?role=${i}`,{waitUntil:"domcontentloaded",timeout:120000});
    await page.getByRole('heading',{name:titles[i],exact:true}).waitFor();
    assert.equal(await page.locator('.b-metrics > .b-metric').count(),4);
    assert.equal(await page.locator('.b-metrics button, .b-metrics a, .b-metrics summary, .b-metrics [role=button], .bi-kpi-detail').count(),0);
    const chart=page.locator('.bi-visuals .ds-chart-control').first(); await chart.click(); assert.equal(await chart.getAttribute('aria-pressed'),'true'); await page.locator('.bi-visuals .ds-chart-detail').first().waitFor(); await chart.click();
    if(i===1) assert.equal(await page.locator('.ds-inspection-table').count(),0);
    if(i!==3){await page.getByLabel('Jenis survei',{exact:true}).selectOption('IRI');await page.getByRole('heading',{name:'Target dan realisasi volume'}).waitFor();assert.ok(await page.locator('.bi-volume-row').count()>0);}
    if(i===2){await page.getByTestId('directorate-map').waitFor();await page.locator('.leaflet-interactive').first().waitFor();await page.getByLabel('Wilayah Balai').selectOption('Balai Simulasi A');assert.equal(await page.getByLabel('Wilayah Balai').inputValue(),'Balai Simulasi A');}
    assert.deepEqual(errors,[]);await page.screenshot({path:path.join(out,`dashboard-${i}.png`),fullPage:true});
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(out,`dashboard-${i}-mobile.png`),fullPage:true});
    if(i===1){await page.goto(`http://127.0.0.1:${port}/scripts/bi-acceptance.html?role=${i}&tab=Kepatuhan`,{waitUntil:'domcontentloaded',timeout:120000}); await page.getByRole('heading',{name:'Hasil pemeriksaan per jenis survei',exact:true}).waitFor(); assert.equal(await page.locator('.ds-inspection-table').count(),1);}
    await page.goto(`http://127.0.0.1:${port}/scripts/bi-acceptance.html?role=${i}&page=reports&tab=Laporan%20periodik`,{waitUntil:"domcontentloaded",timeout:120000});
    if(i===0){await page.getByLabel('Jenis laporan',{exact:true}).waitFor();assert.equal(await page.getByLabel('Jenis laporan',{exact:true}).locator('option').count(),8);await page.getByLabel('Paket laporan',{exact:true}).selectOption('BI-TEST-A');}
    else if(i===3){await page.getByText(/Laporan teknis dan ekspornya tidak tersedia untuk Admin/).waitFor();}
    else{await page.getByRole('button',{name:'Buka rekap',exact:true}).waitFor();assert.equal(await page.locator('textarea').count(),0);}
    await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:path.join(out,`reports-${i}.png`),fullPage:true});assert.deepEqual(errors,[]);console.log('PASS',titles[i]);
   }catch(e){await fs.writeFile(path.join(out,`failure-${i}.txt`),String(e)+"\n"+errors.join("\n")+"\n"+page.url()+"\n"+await page.locator("body").innerText({timeout:5000}).catch(()=>"Body unavailable"));await page.screenshot({path:path.join(out,`failure-${i}.png`),timeout:10000}).catch(()=>{});throw e;}finally{await page.close();}
  }
 }finally{await browser.close();}
}finally{await server.close();}
