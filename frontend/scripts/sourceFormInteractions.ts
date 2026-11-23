import assert from 'node:assert/strict';
import type {Locator,Page} from 'playwright';
import catalog from '../src/workflow/sourceChecklistCatalog.json';
import type {SourceDocument} from '../src/workflow/sourceDocumentModel';
import {sourceFormFixture} from '../src/workflow/testing/sourceFormFixture';
/** Isolated synthetic form data entered through real controls, never a decision or signature.
 * Fill one observation per optional table, not every spare row. No storage writes. */
export async function fillSourceForm(form:Locator){
 await form.waitFor({ state: 'attached' });
 const id=await form.getAttribute('data-source-document-id');
 const document=(catalog as SourceDocument[]).find(item=>item.id===id);
 assert.ok(document,`Unknown source form ${id}; do not guess its required inputs`);
 const fixture = sourceFormFixture(document);
 // Open only sections containing an answer that this fixture enters.
 // Every value still goes through the same controls as the application.
 await form.evaluate((element, keys) => {
  const wanted = new Set(keys);
  const sections = new Set<HTMLDetailsElement>();
  for (const field of element.querySelectorAll<HTMLElement>('[data-source-field]')) {
   if (!wanted.has(field.dataset.sourceField ?? '')) continue;
   const ancestors: HTMLDetailsElement[] = [];
   for (let node = field.parentElement; node; node = node.parentElement) {
    if (node instanceof HTMLDetailsElement) ancestors.unshift(node);
   }
   for (const section of ancestors) sections.add(section);
  }
  for (const section of sections) {
   if (!section.open) section.querySelector<HTMLElement>(':scope > summary')?.click();
  }
 }, Object.keys(fixture));
 for (const [key, value] of Object.entries(fixture)) {
  const field = form.locator(`[data-source-field="${key}"]`);
  const choices = field.locator('input[type=radio]:enabled,input[type=checkbox]:enabled');
  const options = await choices.evaluateAll(inputs => inputs.map(node => {
   const input = node as HTMLInputElement;
   return { label: input.parentElement?.textContent?.trim(), checked: input.checked, type: input.type };
  }));
  if (options.length) {
   const selected: string[] = value.startsWith('[') ? JSON.parse(value) : [value];
   for (const [index, option] of options.entries()) {
    const shouldCheck = selected.includes(option.label ?? '');
    if (shouldCheck && !option.checked) await choices.nth(index).check();
    else if (!shouldCheck && option.checked && option.type === 'checkbox') await choices.nth(index).uncheck();
   }
  } else {
   const input = field.locator('input:enabled:not([type=file]):visible,textarea:enabled:visible').first();
   if (await input.count() && await input.inputValue() !== value) await input.fill(value);
  }
 }
}

/** Stage 0 renders only the active group; visit every step through its tab. */
export async function fillPreparationChecklist(page:import('playwright').Page){
 const form=page.locator('.stage0-step-form');
 await form.waitFor({ state: 'attached' });
 for(const tab of await form.locator('.stage0-step-tab').all()){
  await tab.click();
  for(const box of await form.locator('.stage0-step-active input[type=checkbox]:enabled').all())await box.check();
 }
}

export async function selectPeriodicTask(page: Page, label: string) {
 await page.getByRole('navigation', { name: 'Pekerjaan Tahap 3B' })
   .getByRole('button', { name: label, exact: true }).click();
}

/** Prepare and re-review the IRI period through its actual source owners. */
export async function prepareIriPeriod(page:Page,actor:(role:import('../src/workflow/model').WorkflowRole)=>Promise<void>){
 const origin=new URL(page.url()).origin;
 const url=origin+'/verification?testRoles=1&submodule='+encodeURIComponent('/verification:Verval 14 hari');
 await actor('Penyedia Jasa / Ketua Tim');
 await page.goto(url);
 for(const label of ['Konsistensi','V&V Internal']){
  await selectPeriodicTask(page,label);
  await page.getByLabel('Jenis survei checklist sumber',{exact:true}).selectOption('IRI');
  await fillSourceForm(page.locator('.source-exact-checklist'));
 }
 await selectPeriodicTask(page,'Penyerahan ke Balai');
 const submit = page.getByTestId('button-cycle-submit');
 if (await submit.count()) {
  assert.equal(await submit.isEnabled(), true, await page.locator('.stage3b-workspace').innerText());
  await submit.click();
 }
 await actor('PIC Balai / Pengguna Jasa');
 await page.goto(url);
 await selectPeriodicTask(page,'Pemeriksaan Bersama');
 await page.getByTestId('select-periodic-review-survey').selectOption('IRI');
 await fillSourceForm(page.locator('.source-exact-checklist'));
 await selectPeriodicTask(page,'Keputusan & Tindak Lanjut');
 await page.getByTestId('select-cycle-user-review').selectOption('Sesuai');
 await selectPeriodicTask(page,'BA');
 const reference = page.getByTestId('input-cycle-ba');
 if (!(await reference.inputValue()).trim()) await reference.fill('BA-UJI-IRI-PERIODE');
 const complete=page.getByTestId('button-cycle-complete');
 assert.equal(await complete.isEnabled(),true,await page.locator('.stage3b-workspace').innerText());
 await complete.click();
}
