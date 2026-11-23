import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
const stage=readFileSync(new URL('./stages/Stage0PreparationWorkspace.tsx',import.meta.url),'utf8');
const form=readFileSync(new URL('./Stage0StepForm.tsx',import.meta.url),'utf8');
const style=readFileSync(new URL('./stage0StepForm.css',import.meta.url),'utf8');
test('Penyedia menggunakan formulir 4 langkah dan semua kelompok sumber tetap ada',()=>{
 assert.match(stage,/<Stage0StepForm\b/);for(const k of ['PREPARATION_SOURCE_REVIEWS','PREPARATION_FIELD_PLAN','PREPARATION_COORDINATION','PREPARATION_DOCUMENTS'])assert.match(stage,new RegExp('total:'+k+'\\.length'));
});
test('Semua kelompok tetap memakai callback setCheck dan guard edit yang sudah teruji',()=>{
 for(const k of ['sourceReviews','fieldPlan','coordination','documents'])assert.match(stage,new RegExp('setCheck\\("'+k+'"'));
 assert.equal((stage.match(/!canEditChecklist/g)||[]).length>=4,true);
});
test('Form tidak membuat status keputusan baru dan tidak mengubah model',()=>{
 assert.match(form,/status:string/);assert.doesNotMatch(form,/setPreparation|onUpdate|productionApproval|reportApproval\s*=/);
});
test('Pengguna dapat memilih langkah, navigasi berikutnya/sebelumnya dan melihat progres',()=>{
 for(const p of ['aria-current','Sebelumnya','Berikutnya','step.complete','step.total'])assert.ok(form.includes(p),p);
});
test('Reviewer tetap dapat membuka checklist tanpa formulir edit',()=>{
 assert.match(stage,/<details className="stage0-readonly-checklists">/);
 assert.match(stage,/Lihat rincian checklist Penyedia/);
});
test('Mobile mendukung 2 kolom navigasi dan tombol tetap terlihat',()=>{
 assert.match(style,/@media\(max-width:540px\)/);assert.match(style,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});
