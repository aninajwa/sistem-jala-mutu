import type {Locator} from 'playwright';
/** Fill actual visible form controls; required metadata is part of the checklist. */
export async function fillSourceForm(form:Locator){
 for(const d of await form.locator('details').all())if(await d.getAttribute('open')===null)await d.locator(':scope > summary').click();
 for(const group of await form.locator('fieldset').all()){
  const inputs=group.locator('input:enabled');
  if(await inputs.count())await inputs.first().check();
 }
 for(const input of await form.locator('input:enabled:not([type=radio]):not([type=checkbox]):not([type=file])').all()){
  if(!await input.isVisible()||await input.inputValue())continue;
  const kind=await input.getAttribute('type');
  await input.fill(kind==='date'?'2027-05-01':kind==='number'?'1':'Referensi uji terisolasi');
 }
}
