import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoWorkflow} from '../demoScenario';
import {sourceDocument,sourceDocumentKey} from '../sourceDocumentModel';
import {sourceFormFixture} from '../testing/sourceFormFixture';
import {sourceInspectionStatus} from '../repository/sourceChecklistRepository';
import {documentActionErrors} from './documentWorkflow';
import {stagedDecisionProjection} from './stagedDecisionProjection';
import {transitionDocument} from './documentService';
import {BA_TEMPLATES,fieldsFor} from './baTemplateModel';
import {evaluateStageGate} from '../workflowGate';
import type {BaIdentity} from './documentRepository';
const P='Penyedia Jasa / Ketua Tim' as const,B='PIC Balai / Pengguna Jasa' as const;
function setup(){
 const memory=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>memory.set(key,value),removeItem:(key:string)=>memory.delete(key)}});
 const state=createDemoWorkflow('complete');state.project.id='STAGED-CLOSURE';state.project.surveyTypes=['IRI'];state.role=P;state.submission.validationStatus='Draft';
 const id:BaIdentity={packageId:state.project.id,kind:'bertahap',period:0,survey:'IRI',auditLevel:1};
 const doc=sourceDocument('IRI','staged')!,key=sourceDocumentKey(id.packageId,doc.id),answers=sourceFormFixture(doc,state.project);
 answers['t14:r2:c2']='Perlu perbaikan sebelum diterima';localStorage.setItem(key,JSON.stringify(answers));
 const template=BA_TEMPLATES.find(t=>t.id==='bertahap')!;
 const fields=Object.fromEntries(fieldsFor(template,'IRI').map(f=>[f.id,f.choices?.[0]??'Referensi uji terisolasi']));
 fields['word/document.xml:p356:m0']='Sebagian data memerlukan perbaikan; belum diterima.';
 return {state,id,doc,key,answers,template,fields};
}
test('adverse staged result can be reviewed locally without validating submission or advancing stage',()=>{
 const {state,id,key,answers,template,fields}=setup();
 assert.equal(sourceInspectionStatus(id.packageId,'IRI','staged',true,state.project).complete,true);
 const submitted=transitionDocument(state,id,'submit',fields,template.sha256,0,'',0);state.role=B;
 assert.ok(documentActionErrors(state,id,'approve',submitted,0,'').some(e=>e.includes('Catatan')));
 const before=JSON.stringify(state);
 const result=transitionDocument(state,id,'approve',{},template.sha256,0,'Perbaiki data dan periksa ulang.',1);
 assert.equal(result.officiallySigned,false);assert.equal(JSON.stringify(state),before);
 assert.equal(stagedDecisionProjection(state,'IRI')?.status,'Temuan');
 assert.equal(evaluateStageGate(state,'Tahap 4').readyToComplete,false);
 answers['t14:r2:c2']='Diterima';localStorage.setItem(key,JSON.stringify(answers));
 assert.equal(stagedDecisionProjection(state,'IRI')?.status,'Perlu pemeriksaan ulang');
});
test('incomplete source, missing narrative, stale data and unauthorized roles still block BA review',()=>{
 const {state,id,key,template,fields}=setup();const submitted=transitionDocument(state,id,'submit',fields,template.sha256,0,'',0);state.role=B;
 assert.ok(documentActionErrors(state,id,'approve',{...submitted,fields:{}},0,'Tindak lanjut').some(e=>e.includes('Kesimpulan')));
 for(const role of [P,'Admin','Direktorat / Pusat'] as const){state.role=role;assert.ok(documentActionErrors(state,id,'approve',submitted,0,'Tindak lanjut').length);}
 state.role=B;localStorage.removeItem(key);const errors=documentActionErrors(state,id,'approve',submitted,0,'Tindak lanjut');assert.ok(errors.some(e=>e.includes('Checklist')));assert.ok(errors.some(e=>e.includes('berubah')));
});
test('conditional outcome is recorded separately from full compliance',()=>{
 const {state,id,key,answers,template,fields}=setup();
 answers['t14:r2:c2']='Diterima dengan catatan';localStorage.setItem(key,JSON.stringify(answers));
 fields['word/document.xml:p356:m0']='Diterima dengan catatan; tindak lanjut masih diperlukan.';
 const submitted=transitionDocument(state,id,'submit',fields,template.sha256,0,'',0);state.role=B;
 assert.ok(documentActionErrors(state,id,'approve',submitted,0,'').some(e=>e.includes('Catatan')));
 transitionDocument(state,id,'approve',{},template.sha256,0,'Tindak lanjut catatan pemeriksaan.',1);
 assert.equal(stagedDecisionProjection(state,'IRI')?.status,'Diterima dengan catatan');
});
