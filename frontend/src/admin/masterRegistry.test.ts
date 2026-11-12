import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {registryRows,validateMasterEntry,filterRegistry,masterRegistryCsv,parseRegistry,masterDetailSections,type MasterEntry} from './masterRegistry';
const base=()=>registryRows(['Balai Jawa Barat'],['IRI','PCI'],[],[]);
test('bawaan remain visible and no fake tool or personel',()=>{const r=base();assert.equal(r.length,3);assert.equal(r.filter(x=>x.category==='Alat survei').length,0)});
test('tool needs actual survey relationship and unique serial',()=>{const rows=base();const ok={name:'Laser X',surveyId:rows.find(r=>r.name==='IRI')!.id,nomorSeri:'A-123'};assert.deepEqual(validateMasterEntry('Alat survei',ok,rows),[]);assert.ok(validateMasterEntry('Alat survei',{...ok,surveyId:'fake'},rows).length);const more=registryRows(['Balai Jawa Barat'],['IRI'],[],[{id:'x',category:'Alat survei',name:'Laser X',fields:ok,createdAt:'now'}]);assert.ok(validateMasterEntry('Alat survei',{...ok,name:'Laser B'},more).some(s=>s.includes('Nomor seri')))});
test('parameter code is unique within same survey only',()=>{const r=base();const id=r.find(x=>x.name==='IRI')!.id;const f={name:'CV',surveyId:id,kodeParameter:'CV'};assert.deepEqual(validateMasterEntry('Parameter mutu',f,r),[]);const rows=registryRows(['Balai Jawa Barat'],['IRI','PCI'],[],[{id:'P1',category:'Parameter mutu',name:'CV',fields:f,createdAt:'now'}]);assert.ok(validateMasterEntry('Parameter mutu',{...f,name:'Lain'},rows).some(x=>x.includes('Kode parameter')))});
test('search covers model and serial but remains category scoped',()=>{const e:MasterEntry={id:'123',category:'Alat survei',name:'Laser',fields:{merekTipe:'Model A',nomorSeri:'XX99'},createdAt:'now'};const rows=registryRows([],[],[],[e]);assert.equal(filterRegistry(rows,'Alat survei','XX99').length,1);assert.equal(filterRegistry(rows,'Personel','XX99').length,0)});
test('CSV exports field values and neutralizes formulas',()=>{const e:MasterEntry={id:'123',category:'Personel',name:'=2+2',fields:{pendidikan:'S1',kualifikasiCatatan:'@cmd'},createdAt:'now'};const csv=masterRegistryCsv(registryRows([],[],[],[e]),new Map());assert.ok(csv.includes("\"'=2+2\""));assert.ok(csv.includes("\"'@cmd\""));assert.ok(csv.includes('pendidikan'))});
test('invalid registry cannot break loaded list',()=>{assert.deepEqual(parseRegistry('broken'),[]);assert.deepEqual(parseRegistry('{"a":1}'),[]);assert.equal(parseRegistry(JSON.stringify([{id:'x',category:'Personel',name:'B',fields:{pendidikan:'S1'},createdAt:''}])).length,1)});
test('year and experience range guards',()=>{const r=base();assert.ok(validateMasterEntry('Personel',{name:'Test',pengalamanTahun:'99'},r).length);assert.ok(validateMasterEntry('Balai & wilayah',{name:''},r).length)});

test('detail groups expose actual stored data beyond summary table without inventing missing evidence',()=>{
 const baseRows=base();
 const builtIn=baseRows.find(x=>x.category==='Balai & wilayah')!;
 const builtDetails=masterDetailSections(builtIn,new Map());
 assert.equal(builtDetails[0].attributes.find(x=>x.label==='Provinsi')?.value,'Belum tercatat');
 const survey=baseRows.find(x=>x.name==='IRI')!;
 const rows=registryRows([],['IRI'],[],[{id:'a1',category:'Alat survei',name:'Laser',fields:{surveyId:survey.id,merekTipe:'Model A',nomorSeri:'X-44',kondisi:'Baik'},createdAt:'2026-11-12T00:00:00.000Z'}]);
 const tool=rows.find(x=>x.category==='Alat survei')!;
 const sections=masterDetailSections(tool,new Map([[survey.id,'IRI']]));
 assert.equal(sections.length,2);
 assert.ok(sections.flatMap(s=>s.attributes).some(x=>x.label==='Nomor seri'&&x.value==='X-44'));
 assert.ok(sections.flatMap(s=>s.attributes).some(x=>x.label==='Jenis survei terkait'&&x.value==='IRI'));
 assert.ok(sections.flatMap(s=>s.attributes).some(x=>x.label==='Kondisi Fisik'&&x.value==='Baik'));
});


test('new display reference codes use stable readable category sequences without mutating storage IDs',()=>{
 const entries:MasterEntry[]=[
  {id:'1731412-bb9x',category:'Balai & wilayah',name:'Balai Uji',fields:{},createdAt:'2026-11-12T00:00:00Z'},
  {id:'1731413-cc8y',category:'Alat survei',name:'Alat Uji',fields:{nomorSeri:'X1'},createdAt:'2026-11-12T00:00:00Z'},
  {id:'1731414-dd7z',category:'Alat survei',name:'Alat Uji Kedua',fields:{nomorSeri:'X2'},createdAt:'2026-11-12T00:00:00Z'},
 ];
 const a=registryRows(['Balai Jawa Barat'],['IRI'],[],entries);
 assert.equal(a.find(r=>r.id===entries[0].id)?.code,'REF-BAL-002');
 assert.equal(a.find(r=>r.id===entries[1].id)?.code,'REF-ALT-001');
 assert.equal(a.find(r=>r.id===entries[2].id)?.code,'REF-ALT-002');
 assert.deepEqual(a.map(r=>r.code),registryRows(['Balai Jawa Barat'],['IRI'],[],entries).map(r=>r.code));
 assert.equal(a.find(r=>r.id===entries[1].id)?.id,entries[1].id);
});
