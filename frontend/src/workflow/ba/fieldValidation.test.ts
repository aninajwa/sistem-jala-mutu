import test from 'node:test';import assert from 'node:assert/strict';
import {BA_TEMPLATES} from './docxEngine';import {baFieldRequiredForDraft} from './fieldValidation';
test('nomor resmi, NIP, tanda tangan dan field kondisional tidak dipaksa pada draft lokal',()=>{
 for(const template of BA_TEMPLATES){const fields=template.fields;
  for(const field of fields.filter(f=>/tanda tangan|nip|dibuat di/i.test(`${f.label} ${f.context}`)))assert.equal(baFieldRequiredForDraft(field,fields),false);
  const official=fields.find(f=>/^(diisi nomor dokumen|nomor ba|nomor:)$/i.test(f.label.trim()));if(official)assert.equal(baFieldRequiredForDraft(official,fields),false);
 }
});
