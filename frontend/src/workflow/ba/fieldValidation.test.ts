import test from 'node:test';import assert from 'node:assert/strict';
import {BA_TEMPLATES} from './docxEngine';import {baFieldErrors,baFieldRequiredForDraft} from './fieldValidation';
test('nomor resmi, NIP, tanda tangan dan field kondisional tidak dipaksa pada draft lokal',()=>{
 for(const template of BA_TEMPLATES){const fields=template.fields;
  for(const field of fields.filter(f=>/tanda tangan|nip|dibuat di/i.test(`${f.label} ${f.context}`)))assert.equal(baFieldRequiredForDraft(field,fields),false);
  const official=fields.find(f=>/^(diisi nomor dokumen|nomor ba|nomor:)$/i.test(f.label.trim()));if(official)assert.equal(baFieldRequiredForDraft(official,fields),false);
 }
});

test('tahun BA penerimaan harus diisi eksplisit dan tidak mewarisi jam simulasi',()=>{
 assert.ok(baFieldErrors('penerimaan','IRI',{}).some(error=>error.startsWith('Tahun pelaksanaan')));
 assert.ok(baFieldErrors('penerimaan','IRI',{__year:'tahun ini'}).some(error=>error.startsWith('Tahun pelaksanaan')));
 assert.equal(baFieldErrors('penerimaan','IRI',{__year:'2026'}).some(error=>error.startsWith('Tahun pelaksanaan')),false);
});
