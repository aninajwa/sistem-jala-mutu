import test from 'node:test';
import assert from 'node:assert/strict';
import {CALIBRATION_REVIEW_SUBJECTS,calibrationSourceSignature} from '../calibrationReview';
import {effectiveProductionApproval} from '../workflowGate';
import {withProductionReferences} from '../testing/productionFixture';
import {createDemoWorkflow} from '../demoScenario';
import {sourceDocument,sourceDocumentKey,documentQuestions} from '../sourceDocumentModel';
import {sourceFormFixture} from '../testing/sourceFormFixture';
import {sourceInspectionStatus} from '../repository/sourceChecklistRepository';
import {documentActionErrors,documentFingerprint} from './documentWorkflow';
import type {BaIdentity,BaVersion} from './documentRepository';
const P='Penyedia Jasa / Ketua Tim' as const,B='PIC Balai / Pengguna Jasa' as const;
function setup(){
 const memory=new Map<string,string>();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>memory.get(key)??null,setItem:(key:string,value:string)=>memory.set(key,value),removeItem:(key:string)=>memory.delete(key)}});
 const state=withProductionReferences(createDemoWorkflow('complete'));state.project.id='BA-SOURCE-REGRESSION';state.role=B;
 const id:BaIdentity={packageId:state.project.id,kind:'duaMingguan',period:1,survey:'IRI',auditLevel:1};
 const doc=sourceDocument('IRI','periodic14')!,key=sourceDocumentKey(id.packageId,doc.id);
 const submitted=()=>({actor:P,status:'submitted-local',sourceFingerprint:documentFingerprint(state,id)} as BaVersion);
 return {state,id,doc,key,submitted};
}
test('BA complete template does not replace missing source answers; reason identifies missing source',()=>{
 const {state,id,submitted}=setup();
 assert.ok(documentActionErrors(state,id,'approve',submitted(),0,'').some(e=>e.includes('Checklist')));
});
test('periodic source fixture is complete without concerns but never supplies a signature',()=>{
 const {state,id,doc,key,submitted}=setup();localStorage.setItem(key,JSON.stringify(sourceFormFixture(doc,state.project)));
 const status=sourceInspectionStatus(id.packageId,'IRI','periodic14',true,state.project);
 assert.equal(status.complete,true);assert.deepEqual(status.concerns,[]);
 // A pilot inspection also depends on a current approval for the same equipment.
 assert.ok(documentActionErrors(state,id,'approve',submitted(),0,'').includes('Kesiapan alat/metode belum disetujui.'));
 state.project.surveyTypes=['IRI'];
 state.calibrations=state.calibrations.filter(item=>item.surveyType==='IRI');
 const calibration=sourceDocument('IRI','calibration')!;
 localStorage.setItem(sourceDocumentKey(state.project.id,calibration.id),JSON.stringify(sourceFormFixture(calibration,state.project)));
 const review={result:'Sesuai',note:'Bukti kalibrasi diperiksa',evidenceReference:'BA Kalibrasi IRI',reviewedAt:state.simulationDate,reviewer:B,sourceSignature:calibrationSourceSignature(state,'IRI')} as const;
 state.calibrationReviews={IRI:{...review,subject:'Hasil kalibrasi',sections:Object.fromEntries(CALIBRATION_REVIEW_SUBJECTS.map(subject=>[subject,review]))}};
 assert.equal(effectiveProductionApproval(state),true);
 const latest=submitted();assert.deepEqual(documentActionErrors(state,id,'approve',latest,0,''),[]);
 for(const role of [P,'Direktorat / Pusat','Admin'] as const){state.role=role;assert.ok(documentActionErrors(state,id,'approve',latest,0,'').length);}
});
test('complete answers with a negative reviewer choice still block approval',()=>{
 const {state,id,doc,key,submitted}=setup(),answers=sourceFormFixture(doc,state.project);
 const question=documentQuestions(doc).find(q=>q.options.includes('Tidak'))!;answers[question.id]='Tidak';
 localStorage.setItem(key,JSON.stringify(answers));assert.equal(sourceInspectionStatus(id.packageId,'IRI','periodic14',true,state.project).complete,true);
 assert.ok(documentActionErrors(state,id,'approve',submitted(),0,'').some(e=>e.includes('Checklist')));
});
test('radio choices alone cannot satisfy source metadata; stale submission requires revision',()=>{
 const {state,id,doc,key,submitted}=setup();const latest=submitted();
 localStorage.setItem(key,JSON.stringify(Object.fromEntries(documentQuestions(doc).map(q=>[q.id,q.multiple?JSON.stringify([q.options[0]]):q.options[0]]))));
 assert.equal(sourceInspectionStatus(id.packageId,'IRI','periodic14',true,state.project).complete,false);
 localStorage.setItem(key,JSON.stringify(sourceFormFixture(doc,state.project)));
 assert.ok(documentActionErrors(state,id,'approve',latest,0,'').some(e=>e.includes('berubah')));
});
test('period-one source answers do not satisfy period-two review',()=>{
 const {state,id,doc,key}=setup();localStorage.setItem(key,JSON.stringify(sourceFormFixture(doc,state.project)));
 const two={...id,period:2};state.cycleHistory={'2':structuredClone(state.cycle)};
 const latest={actor:P,status:'submitted-local',sourceFingerprint:documentFingerprint(state,two)} as BaVersion;
 assert.ok(documentActionErrors(state,two,'approve',latest,0,'').some(e=>e.includes('Checklist')));
});
for(const level of [1,2,3] as const)test(`audit ${level} source isolation and reviewer ownership`,()=>{
 const {state,id}=setup();const audit={...id,kind:'audit' as const,period:0,auditLevel:level};
 const doc=sourceDocument('IRI','audit',true,level)!;
 localStorage.setItem(sourceDocumentKey(id.packageId+'::audit-'+level,doc.id),JSON.stringify(sourceFormFixture(doc,state.project)));
 const latest={actor:([P,B,'Direktorat / Pusat'] as const)[level-1],status:'submitted-local',sourceFingerprint:documentFingerprint(state,audit)} as BaVersion;
 for(const role of [P,B,'Direktorat / Pusat','Admin'] as const){state.role=role;const errors=documentActionErrors(state,audit,'approve',latest,0,'');assert.equal(errors.length===0,role===latest.actor,errors.join(' '));}
});
