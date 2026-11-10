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


test('butir kondisional checklist dengan pilihan N/A wajib dijawab eksplisit',()=>{
 const audit=BA_TEMPLATES.find(template=>template.id==='audit');
 assert.ok(audit);
 const drone=audit.fields.find(field=>field.label==='Dokumentasi drone (jika ada) tersedia');
 assert.ok(drone);
 assert.equal(baFieldRequiredForDraft(drone,audit.fields),true);
 assert.ok(baFieldErrors('audit','Lereng',{}).some(error=>error.includes(drone.label)));
 assert.equal(baFieldErrors('audit','Lereng',{[drone.id]:'N/A'}).some(error=>error.includes(drone.label)),false);
 const video=audit.fields.find(field=>field.label==='Data video survei tersedia (khusus untuk PCI berbasis AI)');
 assert.ok(video);
 assert.ok(baFieldErrors('audit','PCI',{}).some(error=>error.includes(video.label)));
 assert.equal(baFieldErrors('audit','PCI',{[video.id]:'N/A'}).some(error=>error.includes(video.label)),false);
});
