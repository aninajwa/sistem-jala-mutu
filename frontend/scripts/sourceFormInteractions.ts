import assert from 'node:assert/strict';
import type {Locator} from 'playwright';
import catalog from '../src/workflow/sourceChecklistCatalog.json';
import type {SourceDocument} from '../src/workflow/sourceDocumentModel';
import {sourceFormFixture} from '../src/workflow/testing/sourceFormFixture';
/** Isolated synthetic form data entered through real controls, never a decision or signature.
 * Fill one observation per optional table, not every spare row. No storage writes. */
export async function fillSourceForm(form:Locator){
 await form.waitFor();
 const id=await form.getAttribute('data-source-document-id');
 const document=(catalog as SourceDocument[]).find(item=>item.id===id);
 assert.ok(document,`Unknown source form ${id}; do not guess its required inputs`);
 for(const d of (await form.locator('xpath=ancestor::details').all()).reverse())if(await d.getAttribute('open')===null)await d.locator(':scope > summary').click();
 for(const d of await form.locator('details').all())if(await d.getAttribute('open')===null)await d.locator(':scope > summary').click();
 for(const [key,value] of Object.entries(sourceFormFixture(document))){
  const field=form.locator(`[data-source-field="${key}"]`);
  const choices=field.locator('input[type=radio]:enabled,input[type=checkbox]:enabled');
  if(await choices.count()){
   const selected=value.startsWith('[')?JSON.parse(value) as string[]:[value];
   for(const choice of await choices.all()){
    const label=(await choice.locator('xpath=..').innerText()).trim();
    if(selected.includes(label))await choice.check();
    else if(await choice.getAttribute('type')==='checkbox')await choice.uncheck();
   }
  }else{
   const input=field.locator('input:enabled:not([type=file]),textarea:enabled');
   if(await input.count()&&await input.first().isVisible()&&await input.first().inputValue()!==value)await input.first().fill(value);
  }
 }
}

/** Stage 0 renders only the active group; visit every step through its tab. */
export async function fillPreparationChecklist(page:import('playwright').Page){
 const form=page.locator('.stage0-step-form');
 await form.waitFor();
 for(const tab of await form.locator('.stage0-step-tab').all()){
  await tab.click();
  for(const box of await form.locator('.stage0-step-active input[type=checkbox]:enabled').all())await box.check();
 }
}

/** Prepare and re-review the IRI period through its actual source owners before
 * submitting a BA. Editing source answers legitimately invalidates prior review. */
export async function prepareIriPeriod(page:import('playwright').Page,actor:(role:import('../src/workflow/model').WorkflowRole)=>Promise<void>){
 const origin=new URL(page.url()).origin;
 const url=origin+'/verification?testRoles=1&submodule='+encodeURIComponent('/verification:Verval 14 hari');
 await actor('Penyedia Jasa / Ketua Tim');await page.goto(url);
 for(const tab of ['Konsistensi','V&V Internal']){
  await page.getByRole('tab',{name:tab,exact:true}).click();
  await page.getByLabel('Jenis survei checklist sumber',{exact:true}).selectOption('IRI');
  await fillSourceForm(page.locator('.source-exact-checklist'));
 }
 await actor('PIC Balai / Pengguna Jasa');await page.goto(url);
 await page.getByTestId('select-periodic-review-survey').selectOption('IRI');
 await fillSourceForm(page.locator('.source-exact-checklist'));
 await page.getByTestId('select-cycle-user-review').selectOption('Sesuai');
 const complete=page.getByTestId('button-cycle-complete');
 assert.equal(await complete.isEnabled(),true,(await complete.getAttribute('title'))??'Period is not ready for review');
 for(const detail of (await complete.locator('xpath=ancestor::details').all()).reverse())if(await detail.getAttribute('open')===null)await detail.locator(':scope > summary').click();
 await complete.click();
}
