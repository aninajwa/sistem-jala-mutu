import test from 'node:test';import assert from 'node:assert/strict';
import catalog from './sourceChecklistCatalog.json';import {documentAnswersComplete,documentQuestions,sourceDocument} from './sourceDocumentModel';
test('every source-derived choice is traceable to the original exact table and row',()=>{
 let total=0;
 for(const document of catalog){const questions=documentQuestions(document);const ids=new Set<string>();for(const question of questions){assert.ok(!ids.has(question.id));ids.add(question.id);assert.ok(question.options.length>=2);const table=document.tables.find(table=>table.table===question.table);const source=question.paragraph?(document as {blocks?:{id?:string;text?:string}[]}).blocks?.find(block=>block.id===question.paragraph)?.text??'':table?[...table.rows[question.row-1],...table.rows[0]].join(' '):'';for(const option of question.options)assert.ok(source.includes(option));total++;}}
 assert.ok(total>1000,'All source documents must be inspected, not just one checklist');
});
test('PCI source preserves separate availability and condition answers, not a generic yes/no',()=>{
 const document=sourceDocument('PCI','staged')!,questions=documentQuestions(document);
 const availability=questions.find(item=>item.label.includes('Kamera Digital')&&item.label.includes('Ketersediaan'))!;
 const condition=questions.find(item=>item.label.includes('Kamera Digital')&&item.label.includes('Kondisi'))!;
 assert.deepEqual(availability.options,['Ada','Tidak']);assert.deepEqual(condition.options,['Baik','Rusak']);assert.notEqual(availability.id,condition.id);
});
test('blank, partially answered and foreign answer values never mark a source form complete',()=>{
 const document=sourceDocument('PCI','audit')!,questions=documentQuestions(document);assert.ok(questions.length>0);
 assert.equal(documentAnswersComplete(document,{}),false);const answers=Object.fromEntries(questions.map(item=>[item.id,item.multiple?JSON.stringify(item.options):item.options[0]]));assert.equal(documentAnswersComplete(document,answers),true);answers[questions[0].id]='arbitrary';assert.equal(documentAnswersComplete(document,answers),false);
});
test('traffic periodic and general audit sections stay in their own source scope',()=>{
 assert.ok(sourceDocument('Lalu Lintas','periodic14')?.title.includes('2 MINGGUAN'));
 for(const type of ['Lendutan','Lereng','Lalu Lintas'])assert.ok(documentQuestions(sourceDocument(type,'audit')!).length>0);
});
test('raw and processed data checkboxes are independent source choices, not exclusive radios',()=>{
 const question=catalog.flatMap(documentQuestions).find(item=>item.options.includes('Data Mentah')&&item.options.includes('Data Terproses'))!;assert.ok(question);assert.equal(question.multiple,true);
});

test('Jembatan preserves M numerical table, N exact choices, recommendation and O identities',()=>{
 const document=sourceDocument('Jembatan','calibration')!,questions=documentQuestions(document);
 assert.ok(document.tables.some(table=>/^M\./.test(table.heading??'')&&table.rows[0].includes('Nilai Kondisi Verifikasi')));
 const equipment=questions.find(question=>question.table===14&&question.label.includes('Peralatan Pemeriksaan'))!;
 assert.deepEqual(equipment.options,['Memenuhi','Perlu Perbaikan','Tidak Memenuhi']);
 const documents=questions.find(question=>question.table===14&&question.label.includes('Dokumentasi Pendukung'))!;
 assert.deepEqual(documents.options,['Lengkap','Perlu Dilengkapi','Tidak Lengkap']);
 assert.ok(questions.some(question=>question.paragraph&&question.options.includes('Diterima dengan catatan perbaikan')));
 assert.ok(document.blocks?.some(block=>block.text?.includes('Tuliskan rekomendasi')));
 assert.ok(document.tables.some(table=>/^O\./.test(table.heading??'')&&table.rows[0].includes('Nama')));
});

import {formSections,questionsInBlocks} from './formSections';
test('all original form blocks keep their sequence while identical chapter/group headings share one accordion',()=>{for(const document of catalog){const blocks=(document as {blocks?:import('./sourceDocumentModel').SourceBlock[]}).blocks??[];assert.deepEqual(formSections(blocks).flatMap(section=>section.groups.flatMap(group=>group.blocks)),blocks);}const bridge=sourceDocument('Jembatan','calibration')!;const section=formSections(bridge.blocks!).find(section=>section.label==='A. INFORMASI UMUM')!;assert.equal(section.groups.filter(group=>group.label!==section.label&&group.blocks.some(block=>block.kind!=='heading')).length,0);});

import {readEvidenceLinks,updateEvidenceLink,evidenceCategories} from './repository/evidenceLinks';
test('legacy evidence links gain multiple categories/items and append history without rewriting another scope',()=>{
 const memory=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>memory.set(key,value)}});
 memory.set('p:activity:documents:links',JSON.stringify({old:{category:'Foto',status:'Tersedia'}}));
 updateEvidenceLink('p:activity','old',{categories:['Foto','Dokumen'],items:['q1','q2']},'Tautkan');
 updateEvidenceLink('p:activity','old',{status:'Perlu perbaikan'},'Status');
 const link=readEvidenceLinks('p:activity').old;assert.deepEqual(evidenceCategories(link),['Foto','Dokumen']);assert.deepEqual(link.items,['q1','q2']);assert.equal(link.history?.length,2);assert.deepEqual(link.history?.[0].before.categories,['Foto']);
 updateEvidenceLink('p:period-2','shared',{fileKey:'p:activity:documents:file',categories:['Foto']},'Gunakan kembali');assert.deepEqual(readEvidenceLinks('p:activity').old,link);
 updateEvidenceLink('p:period-2','shared',{detached:true},'Lepaskan');assert.equal(readEvidenceLinks('p:period-2').shared.fileKey,'p:activity:documents:file');assert.equal(readEvidenceLinks('p:period-2').shared.history?.length,2);
});

test('embedded Lendutan acceptance form belongs to stage 6 and is not duplicated in calibration',()=>{const acceptance=sourceDocument('Lendutan','acceptance')!;assert.ok(acceptance);assert.ok(acceptance.blocks?.some(block=>block.text==='BERITA ACARA PENERIMAAN DATA'));assert.ok(acceptance.tables.length>0);assert.equal(sourceDocument('Lendutan','calibration')!.blocks?.some(block=>block.text==='BERITA ACARA PENERIMAAN DATA'),false);assert.ok(acceptance.blocks?.some(block=>block.text==='Bukti Tindakan Perbaikan (jika ada)'));});

test('category progress never counts unrelated tables or undefined paragraph IDs',()=>{
 const doc=sourceDocument('IRI','calibration')!,questions=documentQuestions(doc);
 assert.ok(questions.length>0);assert.equal(questionsInBlocks(questions,[{kind:'heading',text:'Informasi Umum'}]).length,0);
 for(const section of formSections(doc.blocks!))for(const group of section.groups){const scoped=questionsInBlocks(questions,group.blocks);for(const q of scoped)assert.ok(group.blocks.some(block=>block.kind==='table'&&block.table===q.table||block.kind==='paragraph'&&block.id!==undefined&&block.id===q.paragraph));}
 const table=doc.tables.find(table=>questions.some(q=>q.table===table.table))!;assert.equal(questionsInBlocks(questions,[{kind:'table',table:table.table}]).length,questions.filter(q=>q.table===table.table).length);
});
