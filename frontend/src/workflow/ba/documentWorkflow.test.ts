import {STAGE3B_DOCX_CANDIDATES} from '../stage3bChecklistData.docx-candidate';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoWorkflow} from '../demoScenario';
import {documentActionErrors,documentFingerprint} from './documentWorkflow';
import {saveDocumentDraft,transitionDocument as rawTransitionDocument} from './documentService';
import {documentRepository,type BaIdentity} from './documentRepository';
const P='Penyedia Jasa / Ketua Tim' as const,B='PIC Balai / Pengguna Jasa' as const;
const identity:BaIdentity={packageId:'isolated',kind:'audit',period:0,survey:'IRI',auditLevel:1};
import {sourceDocument} from '../sourceDocumentModel';
import {BA_TEMPLATES,fieldsFor} from './docxEngine';
import type {SurveyType} from '../model';
function transitionDocument(...args:Parameters<typeof rawTransitionDocument>){const template=BA_TEMPLATES.find(item=>item.id===args[1].kind)!;const filled=Object.fromEntries(fieldsFor(template,args[1].survey as SurveyType).map(field=>[field.id,field.choices?.[0]??'Isian pengujian terisolasi']));args[3]={...filled,...args[3]};return rawTransitionDocument(...args);}
function setup(){const memory=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>memory.set(key,value),removeItem:(key:string)=>memory.delete(key)}});const state=createDemoWorkflow('complete');state.role=P;state.project.id=identity.packageId;return state;}
test('BA submit → revision → resubmit → review retains immutable history and never signs',()=>{
 const state=setup(),fields={name:'Uji'};saveDocumentDraft(state,identity,fields);
 transitionDocument(state,identity,'submit',fields,'hash',0,'',0);
 assert.throws(()=>saveDocumentDraft(state,identity,{name:'changed'}),/terkunci/);
 transitionDocument(state,identity,'revise',fields,'hash',0,'Lengkapi hasil',1);
 saveDocumentDraft(state,identity,{name:'Uji revisi'});
 transitionDocument(state,identity,'submit',{name:'Uji revisi'},'hash',0,'',2);
 transitionDocument(state,identity,'approve',{},'hash',0,'Diperiksa',3);
 const result=documentRepository.read(identity);assert.deepEqual(result.versions.map(v=>v.status),['submitted-local','revision-requested-local','submitted-local','reviewed-local']);
 assert.equal(result.versions[0].fields.name,'Uji');assert.equal(result.versions[3].fields.name,'Uji revisi');assert.ok(result.versions.every(v=>v.officiallySigned===false));
 assert.throws(()=>saveDocumentDraft(state,identity,{}),/terkunci/);
 transitionDocument(state,identity,'reopen',{},'hash',0,'',4);assert.equal(documentRepository.read(identity).versions.length,5);
});
test('Admin and reviewers at another audit level cannot transition documents',()=>{
 const state=setup();for(const role of ['Admin',B,'Direktorat / Pusat'] as const){state.role=role;assert.throws(()=>transitionDocument(state,identity,'submit',{},'hash',0,'',0),/kewenangan/);}
});
test('unsubmitted documents, missing fields, missing reasons and blocked gate cannot be approved',()=>{
 const state=setup();assert.throws(()=>transitionDocument(state,identity,'approve',{},'hash',0,'',0),/diajukan/);
 assert.throws(()=>transitionDocument(state,identity,'submit',{},'hash',1,'',0),/isian/);
 transitionDocument(state,identity,'submit',{},'hash',0,'',0);
 assert.throws(()=>transitionDocument(state,identity,'reject',{},'hash',0,'',1),/alasan/);
 state.audits[0].status='Dalam Review';assert.throws(()=>transitionDocument(state,identity,'approve',{},'hash',0,'',1),/belum lulus/);
});
test('stale source and stale revision are rejected; rejection preserves the submitted fields',()=>{
 const state=setup();transitionDocument(state,identity,'submit',{result:'lama'},'hash',0,'',0);state.productionTests.IRI.coefficientVariation=20;
 assert.throws(()=>transitionDocument(state,identity,'approve',{},'hash',0,'',1),/berubah/);
 assert.throws(()=>transitionDocument(state,identity,'revise',{},'hash',0,'Perbaiki',0),/tab lain/);
 transitionDocument(state,identity,'reject',{},'hash',0,'Data berubah',1);assert.equal(documentRepository.read(identity).versions[1].fields.result,'lama');
});
test('joint BA allows provider draft and Balai review, without transferring internal editing rights',()=>{
 const state=setup(),joint={...identity,kind:'duaMingguan' as const,period:1};
 transitionDocument(state,joint,'submit',{},'hash',0,'',0);const submitted=documentRepository.read(joint).versions.at(-1)!;
 assert.ok(documentActionErrors(state,joint,'revise',submitted,0,'Perbaiki').length);
 state.role=B;assert.deepEqual(documentActionErrors(state,joint,'revise',submitted,0,'Perbaiki'),[]);
 transitionDocument(state,joint,'revise',{},'hash',0,'Perbaiki',1);
 const before=documentFingerprint(state,joint);state.activeCyclePeriod=2;state.cycleHistory={...state.cycleHistory,'1':state.cycle};assert.equal(documentFingerprint(state,joint),before,'Changing viewing period must not invalidate a document');
});
test('editing linked source answers also makes a submitted BA stale without erasing its snapshot',()=>{
 const state=setup(),joint={...identity,kind:'duaMingguan' as const,period:1};state.role=P;transitionDocument(state,joint,'submit',{},'hash',0,'',0);
 const old=documentRepository.read(joint).versions[0];globalThis.localStorage.setItem('jala-mutu-stage3b-docx-isolated-v1',JSON.stringify({[`isolated::${STAGE3B_DOCX_CANDIDATES.find(t=>t.survey==='IRI'&&t.phase==='periodic14')!.id}::test` ]:'changed'}));state.role=B;
 assert.ok(documentActionErrors(state,joint,'approve',old,0,'').some(text=>text.includes('berubah')));
 assert.deepEqual((old.sourceSnapshot as any).answers,{});
});
test('attachment replacement changes only the relevant period document fingerprint',()=>{
 const state=setup(),periodOne={...identity,kind:'duaMingguan' as const,period:1},periodTwo={...periodOne,period:2};
 const one=documentFingerprint(state,periodOne),two=documentFingerprint(state,periodTwo);
 globalThis.localStorage.setItem('jala-local-attachment-index-v1',JSON.stringify({'isolated:stage3b-repeatability-2':{name:'uji.pdf',size:5,mimeType:'application/pdf',digest:'changed',updatedAt:'today'}}));
 assert.equal(documentFingerprint(state,periodOne),one);assert.notEqual(documentFingerprint(state,periodTwo),two);
});

test('transaction rejects empty or foreign template answers even when caller reports zero missing',()=>{const state=setup();assert.throws(()=>rawTransitionDocument(state,identity,'submit',{},'hash',0,'',0),/isian/);const template=BA_TEMPLATES.find(item=>item.id===identity.kind)!;const fields=Object.fromEntries(fieldsFor(template,'IRI').map(field=>[field.id,field.choices?.[0]??'Uji']));const choice=fieldsFor(template,'IRI').find(field=>field.choices)!;fields[choice.id]='PILIHAN PALSU';assert.throws(()=>rawTransitionDocument(state,identity,'submit',fields,'hash',0,'',0),/isian/);});

test('detached evidence no longer tracks unrelated later byte replacements while its history remains',()=>{const state=setup(),joint={...identity,kind:'duaMingguan' as const,period:1},doc=sourceDocument('IRI','periodic14')!,linkKey=`isolated:form-${doc.id}:documents:links`;const metadata=(digest:string)=>({'isolated:shared':{name:'proof.pdf',size:3,mimeType:'application/pdf',digest,updatedAt:'same'}});globalThis.localStorage.setItem('jala-local-attachment-index-v1',JSON.stringify(metadata('one')));globalThis.localStorage.setItem(linkKey,JSON.stringify({ref:{fileKey:'isolated:shared',category:'Foto',status:'Tersedia'}}));const active=documentFingerprint(state,joint);globalThis.localStorage.setItem('jala-local-attachment-index-v1',JSON.stringify(metadata('two')));assert.notEqual(documentFingerprint(state,joint),active);globalThis.localStorage.setItem(linkKey,JSON.stringify({ref:{fileKey:'isolated:shared',category:'Foto',status:'Tersedia',detached:true,history:[{action:'Lepaskan'}]}}));const detached=documentFingerprint(state,joint);globalThis.localStorage.setItem('jala-local-attachment-index-v1',JSON.stringify(metadata('three')));assert.equal(documentFingerprint(state,joint),detached);assert.equal(JSON.parse(globalThis.localStorage.getItem(linkKey)!).ref.history.length,1);});
