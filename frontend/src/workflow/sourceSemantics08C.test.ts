import test from 'node:test';import assert from 'node:assert/strict';
import catalog from './sourceChecklistCatalog.json';
import {sourceDocument,documentQuestions,sourceDocumentKey,type SourceDocument} from './sourceDocumentModel';
import {sourceFieldRules,sourceRuleActive,validateSourceDocument} from './sourceFormValidation';
import {filledSourceFixture} from './testing/sourceFixture';
import {sourceInspectionStatus} from './repository/sourceChecklistRepository';
import {sourceParagraphSlots} from './sourceParagraphFields';
import {sourceCellEditable} from './sourceInputs';
// Reviewed witnesses: concrete locations in original tables, independently fixed here.
const witnesses=['value:t1:r2:c2','paragraph:p1:text','paragraph:p1:text','value:t2:r2:c2','paragraph:p3:text','value:t1:r7:c2','value:t1:r7:c2','value:t1:r7:c2','value:t1:r7:c2','value:t1:r7:c2','value:t1:r7:c2','value:t1:r6:c2','value:t1:r9:c2','value:t1:r3:c2','value:t1:r6:c2','value:t1:r7:c2','value:t1:r3:c2','value:t2:r9:c2','value:t2:r6:c2','value:t1:r5:c2','value:t2:r6:c2','value:t2:r8:c2','value:t1:r3:c2','value:t1:r3:c2','value:t1:r3:c2','value:t1:r7:c2','value:t1:r3:c2','value:t1:r3:c2','value:t1:r7:c2','value:t1:r8:c2','value:t1:r6:c2','value:t1:r7:c2','value:t1:r7:c2','value:t1:r2:c2','value:t1:r2:c2','value:t1:r2:c2','value:t1:r5:c2','t1:r2:c3','value:t1:r2:c2','value:t1:r3:c2','value:t1:r2:c2','value:t1:r2:c2','value:t1:r2:c2','value:t1:r2:c2','value:t1:r3:c2','value:t1:r2:c2','t13:r2','t16:r2','t22:r2','value:t7:r6:c2','value:t12:r6:c2','value:t20:r6:c2','value:t28:r8:c2','value:t38:r8:c2','value:t46:r3:c2'];
for(const [index,document] of (catalog as SourceDocument[]).entries())test(`08C formulir ${index+1}/55 ${document.survey} ${document.phase} ${document.id}: kosong, terisi, dan kehilangan isian sumber`,()=>{
 assert.equal(validateSourceDocument(document,{}).complete,false);
 const answers=filledSourceFixture(document),result=validateSourceDocument(document,answers);
 assert.equal(result.complete,true,JSON.stringify(result.issues));
 const witness=witnesses[index];assert.ok(result.rules.some(r=>r.id===witness),`Witness ${witness} harus wajib menurut tabel sumber`);
 delete answers[witness];assert.equal(validateSourceDocument(document,answers).complete,false,`Isian ${witness} tidak boleh lolos tanpa konteks paket`);
});
test('08C identitas wajib tidak bisa dilewati repository tanpa project, dan paket/tingkat tetap terisolasi',()=>{
 const values=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v)}});
 const doc=sourceDocument('IRI','calibration')!,answers=filledSourceFixture(doc);
 values.set(sourceDocumentKey('p',doc.id),JSON.stringify(answers));assert.equal(sourceInspectionStatus('p','IRI','calibration').complete,true);
 delete answers['value:t1:r6:c2'];values.set(sourceDocumentKey('p',doc.id),JSON.stringify(answers));assert.equal(sourceInspectionStatus('p','IRI','calibration').complete,false);
});
test('08C FWD/BB/LWD mengaktifkan kalibrasi alat sendiri dan tiga cabang penggantian sensor',()=>{
 const d=sourceDocument('Lendutan','calibration')!,a=filledSourceFixture(d);
 a['t2:r1:c2']='BB';a['t6:r3:c3']='Tidak';
 const active=()=>validateSourceDocument(d,a).rules.map(r=>r.id);
 assert.ok(!active().includes('t3:r2:c4'));assert.ok(active().includes('t3:r6:c4'));
 assert.ok(!active().includes('t6:r4:c3'));
 a['t6:r3:c3']='Ya';delete a['t6:r4:c3'];assert.ok(validateSourceDocument(d,a).issues.some(i=>i.id==='t6:r4:c3'));
 a['t6:r4:c3']='Tidak';delete a['t6:r5:c3'];assert.ok(validateSourceDocument(d,a).issues.some(i=>i.id==='t6:r5:c3'));assert.ok(!active().includes('t6:r6:c3'));
 a['t6:r4:c3']='Ya';delete a['t6:r6:c3'];assert.ok(validateSourceDocument(d,a).issues.some(i=>i.id==='t6:r6:c3'));assert.ok(!active().includes('t6:r5:c3'));
});
test('08C tabel drone kondisional mengikuti heading, kosong tidak memblokir, diaktifkan menuntut jawaban',()=>{
 const d=sourceDocument('Lereng','calibration')!,a=filledSourceFixture(d);
 for(const r of sourceFieldRules(d))if(r.table===6)delete a[r.id];
 assert.equal(validateSourceDocument(d,a).complete,true);
 a['applicable:t6']='yes';assert.ok(validateSourceDocument(d,a).issues.some(i=>i.id==='t6:r2'));
 a['applicable:t6']='no';assert.equal(validateSourceDocument(d,a).complete,true);
});
test('08C temuan kosong bukan lima temuan wajib; baris yang dimulai tidak boleh setengah terisi',()=>{
 const d=sourceDocument('Lendutan','audit',true,1)!,a=filledSourceFixture(d);
 const rows=sourceFieldRules(d).filter(r=>r.table===26);for(const r of rows)delete a[r.id];
 assert.equal(validateSourceDocument(d,a).complete,true);
 a['value:t26:r2:c2']='Retak ditemukan';assert.equal(validateSourceDocument(d,a).complete,false);
 a['value:t26:r2:c3']='Periksa ulang';a['t26:r2:c4']='Selesai';a['value:t26:r2:c5']='2026-11-01';assert.equal(validateSourceDocument(d,a).complete,true);
});
test('08C baris sampel cadangan boleh kosong tetapi hasil sampel tidak boleh seluruhnya kosong',()=>{
 const d=sourceDocument('IRI','audit')!,a=filledSourceFixture(d);
 for(const r of sourceFieldRules(d))if(r.table===9&&r.row!==2)delete a[r.id];
 assert.equal(validateSourceDocument(d,a).complete,true);
 for(const r of sourceFieldRules(d))if(r.table===9)delete a[r.id];
 assert.ok(validateSourceDocument(d,a).issues.some(i=>i.id==='table:9'));
});
test('08C skor hanya dibatasi oleh skala tercetak, CV tidak diberi batas 100 dan selisih boleh bertanda',()=>{
 const d=sourceDocument('Lereng','calibration')!,a=filledSourceFixture(d);
 a['value:t18:r2:c3']='6';assert.ok(validateSourceDocument(d,a).issues.some(i=>i.id==='value:t18:r2:c3'));
 a['value:t18:r2:c3']='0';assert.ok(validateSourceDocument(d,a).issues.some(i=>i.id==='value:t18:r2:c3'));
 const iri=sourceDocument('IRI','calibration')!,b=filledSourceFixture(iri);b['value:t6:r2:c4']='-0.2';assert.equal(validateSourceDocument(iri,b).complete,true);
 const ongoing=sourceDocument('Lendutan','consistency')!,c=filledSourceFixture(ongoing);c['value:t15:r4:c3']='150';assert.equal(validateSourceDocument(ongoing,c).complete,true);
});
test('08C Lainnya adalah pilihan sumber yang wajib diuraikan bila dipilih, bukan alasan mengecualikan seluruh pertanyaan',()=>{
 const d=sourceDocument('PCI','consistency')!,a=filledSourceFixture(d);
 const q=documentQuestions(d).find(q=>q.id==='t1:r2:c2')!;a[q.id]=q.options.find(o=>o.startsWith('Lainnya'))!;delete a[`detail:${q.id}`];
 assert.ok(validateSourceDocument(d,a).issues.some(i=>i.id===`detail:${q.id}`));a[`detail:${q.id}`]='Setiap 14 hari kontrak';assert.equal(validateSourceDocument(d,a).complete,true);
});
test('08C tanggal multi-isian terpisah, tanggal kalender dan placeholder palsu tidak diterima',()=>{
 const slots=sourceParagraphSlots({kind:'paragraph',id:'p',text:'Nomor : ........ Tanggal : ........'});assert.equal(slots.length,2);
 const d=sourceDocument('IRI','calibration')!,a=filledSourceFixture(d);for(const v of ['2026-02-30','2025-02-29','[Tanggal]']){a['value:t1:r5:c2']=v;assert.equal(validateSourceDocument(d,a).complete,false);}a['value:t1:r5:c2']='2024-02-29';assert.equal(validateSourceDocument(d,a).complete,true);
 assert.ok(sourceCellEditable('________ km'));assert.ok(sourceCellEditable('Lintang: ___ Bujur: ___'));
});
test('08C pilihan vertikal Lereng satu keputusan dan skema menolak revisi hash yang belum diaudit',()=>{
 const d=sourceDocument('Lereng','calibration')!,q=documentQuestions(d).find(q=>q.id==='t19:selection')!;assert.equal(q.options.length,4);
 const a=filledSourceFixture(d);assert.equal(validateSourceDocument({...d,sha256:'unknown'},a).complete,false);
 assert.notEqual(sourceDocument('PCI','calibration',true)!.id,sourceDocument('PCI','calibration',false)!.id);
});
test('08C alasan perubahan hanya wajib saat status PCI AI Berubah; lokasi faktor IRI hanya saat Ya',()=>{
 const d=sourceDocument('PCI','staged',false)!,a=filledSourceFixture(d);a['t5:r2:c3']='Konsisten';delete a['value:t5:r2:c4'];delete a['value:t5:r2:c5'];assert.equal(validateSourceDocument(d,a).complete,true);
 a['t5:r2:c3']='Berubah';assert.ok(validateSourceDocument(d,a).issues.some(i=>i.id==='value:t5:r2:c4'));
 const iri=sourceDocument('IRI','consistency')!,b=filledSourceFixture(iri);b['t13:r2']='Tidak';delete b['value:t13:r2:c5'];assert.equal(validateSourceDocument(iri,b).complete,true);b['t13:r2']='Ya';assert.ok(validateSourceDocument(iri,b).issues.some(i=>i.id==='value:t13:r2:c5'));
});
test('08C tipe dokumen PCI multiseleksi meminta satu jenis yang benar-benar diverifikasi, tanpa mewajibkan semua jenis',()=>{
 const d=sourceDocument('PCI','internal')!,a=filledSourceFixture(d);a['t1:r5:c2']=JSON.stringify(['Foto Dokumentasi']);assert.equal(validateSourceDocument(d,a).complete,true);a['t1:r5:c2']='[]';assert.equal(validateSourceDocument(d,a).complete,false);
});
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {SourceResultTables} from './SourceResultTables';
test('08C render 55 formulir mempertahankan akses ke semua sel wajib termasuk tabel Ya/Tidak dan hasil sistem',()=>{
 for(const document of catalog as SourceDocument[]){
  const markup=renderToStaticMarkup(React.createElement(SourceResultTables,{document,answers:filledSourceFixture(document),editable:true,onChange:()=>{}}));
  for(const r of sourceFieldRules(document).filter(r=>r.required&&r.kind!=='choice'&&r.column!==undefined))assert.ok(markup.includes(`data-source-field="${r.id}"`),`${document.id}: ${r.id} wajib tetapi tidak dirender`);
 }
});
test('08C status sistem Jembatan tidak menuntut input tersembunyi dan membandingkan dua hasil yang dilaporkan',()=>{
 const d=sourceDocument('Jembatan','calibration')!,a=filledSourceFixture(d);a['value:t13:r2:c3']='2';a['value:t13:r2:c4']='3';delete a['value:t13:r2:c5'];assert.equal(validateSourceDocument(d,a).complete,true);
 delete a['value:t13:r2:c3'];assert.equal(validateSourceDocument(d,a).complete,false);
});
test('08C nilai CV Lendutan harus numerik dan jawaban Tidak pada faktor/penyimpangan tidak menjadi temuan palsu',()=>{
 const values=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v)}});
 const d=sourceDocument('Lendutan','consistency')!,a=filledSourceFixture(d);a['value:t15:r4:c3']='bukan angka';assert.ok(validateSourceDocument(d,a).issues.some(i=>i.id==='value:t15:r4:c3'));
 a['value:t14:r3:c3']='3';a['value:t15:r4:c3']='5';a['t16:r6:c3']='Tidak';values.set(sourceDocumentKey('p',d.id),JSON.stringify(a));assert.ok(!sourceInspectionStatus('p','Lendutan','consistency').concerns.some(x=>x.includes('Apakah ditemukan penyimpangan')));
});
