import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoWorkflow} from '../demoScenario';
import {CALIBRATION_REVIEW_SUBJECTS,calibrationReviewIsSuitable,calibrationSourceSignature} from '../calibrationReview';
import {evaluateStageGate} from '../workflowGate';
import {withProductionReferences} from '../testing/productionFixture';
import {applyPeriodicFinding} from '../periodicFinding';
import {retainDecisionHistory} from '../workflowRevisions';
import {workflowMutationError} from './workflowMutationGuard';
import type {OperationalWorkflowState} from '../model';
function setup(){const s=withProductionReferences(createDemoWorkflow('complete'));s.role='PIC Balai / Pengguna Jasa';s.project.surveyTypes=['IRI'];s.project.surveyStartDate='2027-05-01';s.project.surveyEndDate='2027-05-28';s.cycle.selectedTypes=['IRI'];s.corrections=[];s.activeCyclePeriod=1;s.cycle.surveyReviews={...s.cycle.surveyReviews,IRI:{decision:'Sesuai',note:'Bukti periode perlu diperbaiki',reviewedAt:s.simulationDate}};
 // Fixture for this *later-stage* Balai Verval test: all four calibration checks
 // must already have been recorded. Never alter demoScenario or production data.
 const signature=calibrationSourceSignature(s,'IRI');
 const approvedSection={result:'Sesuai' as const,note:'Kalibrasi IRI telah diperiksa Balai.',evidenceReference:'BA-KAL-IRI-UJI-001',reviewedAt:s.simulationDate,reviewer:'PIC Balai / Pengguna Jasa' as const,sourceSignature:signature};
 s.calibrationReviews={...s.calibrationReviews,IRI:{...approvedSection,subject:'Alat dan personel',sections:Object.fromEntries(CALIBRATION_REVIEW_SUBJECTS.map(subject=>[subject,{...approvedSection}]))}};
 return s;}
function journal(before:OperationalWorkflowState,next:OperationalWorkflowState){const after=retainDecisionHistory(before,next);after.events=[{id:'finding-event',date:before.simulationDate,actor:before.role,action:'Buka kasus dari pemeriksaan proses verval',object:'FINDING-1',oldValue:'',newValue:''},...before.events];return after;}
test('Fixture pemeriksaan berkala memakai persetujuan kalibrasi yang masih berlaku',()=>{
 const ready=setup();
 assert.equal(calibrationReviewIsSuitable(ready,'IRI'),true);
 assert.equal(evaluateStageGate(ready,'Tahap 2').readyToComplete,true);
 const missing=structuredClone(ready);delete missing.calibrationReviews?.IRI;
 assert.equal(evaluateStageGate(missing,'Tahap 2').readyToComplete,false);
});
test('Balai finding persists as open remediation; audit decisions, samples and BA survive in history',()=>{
 const before=setup(),after=journal(before,applyPeriodicFinding(before,'IRI','FINDING-1'));
 assert.equal(workflowMutationError(before,after,before.role),undefined);
 assert.equal(after.cycle.surveyReviews?.IRI?.decision,'Temuan');assert.equal(after.corrections[0].status,'Terbuka');assert.equal(after.corrections[0].approval,'Draft');assert.equal(after.corrections[0].cyclePeriod,1);
 for(let i=0;i<3;i++){assert.equal(after.audits[i].status,before.audits[i].status);assert.equal(after.audits[i].baNumber,before.audits[i].baNumber);assert.deepEqual(after.audits[i].sampleIds,before.audits[i].sampleIds);assert.equal(after.audits[i].requiresReview,true);assert.equal(after.audits[i].history?.at(-1)?.baNumber,before.audits[i].baNumber);}
 assert.equal(after.submission.validationStatus,'Draft');assert.equal(after.acceptance.finalAcceptance,false);
});
test('the same automatic cascade remains valid with the workspace journal',()=>{
 const before=setup(),expected=applyPeriodicFinding(before,'IRI','FINDING-1');assert.notEqual(expected,before);const after=retainDecisionHistory(before,expected,'2026-11-17T00:00:00.000Z');
 after.events=[{id:'event-finding',date:before.simulationDate,actor:before.role,action:'Buka kasus dari pemeriksaan proses verval',object:'FINDING-1',oldValue:'',newValue:''},...before.events];
 assert.equal(workflowMutationError(before,after,before.role),undefined);
});
const attacks:Record<string,(s:OperationalWorkflowState)=>void>={
 'forged Directorate decision':s=>{s.audits[2].decisionNote='Palsu';},
 'forged Provider BA':s=>{s.audits[0].baNumber='Palsu';},
 'forged history':s=>{s.audits[0].history!.push({...s.audits[0].history![0],decisionNote:'Palsu'});},
 'altered review reason':s=>{s.audits[0].reviewReason='Alasan palsu';},
 'extra production change':s=>{s.productionTests.IRI.trialLengthKm=999;},
 'closed remediation':s=>{s.corrections[0].status='Ditutup';},
 'wrong period':s=>{s.corrections[0].cyclePeriod=2;},
 'forged retest':s=>{s.corrections[0].retest='Lulus';},
};
for(const [name,attack] of Object.entries(attacks))test(`Balai finding cannot hide ${name}`,()=>{const before=setup(),after=structuredClone(journal(before,applyPeriodicFinding(before,'IRI','FINDING-1')));attack(after);assert.ok(workflowMutationError(before,after,before.role));});
test('finding needs a reason, correct role, readiness and scope; duplicate finding is not reopened',()=>{
 for(const role of ['Penyedia Jasa / Ketua Tim','Direktorat / Pusat','Admin'] as const){const s=setup();s.role=role;assert.equal(applyPeriodicFinding(s,'IRI','new'),s);}
 const s=setup();s.cycle.surveyReviews!.IRI!.note='';assert.equal(applyPeriodicFinding(s,'IRI','new'),s);
 const ready=setup(),next=applyPeriodicFinding(ready,'IRI','one');assert.equal(applyPeriodicFinding(next,'IRI','two'),next);
 ready.project.surveyTypes=['RNI'];assert.equal(applyPeriodicFinding(ready,'IRI','new'),ready);
});

import {isBalaiPeriodDecision} from './balaiVervalCascade';
import {applyCycleEdit} from '../cycleEdit';
import {reviewSurvey} from '../periodicReview';
import {recordPeriodicBa,periodicBaBlockers} from '../periodicDecision';
import {sourceDocument,sourceDocumentKey} from '../sourceDocumentModel';
import {sourceFormFixture} from '../testing/sourceFormFixture';
function sources(s:OperationalWorkflowState){const m=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>m.get(key)??null,setItem:(key:string,value:string)=>m.set(key,value)}});for(const phase of ['consistency','internal','periodic14']){const doc=sourceDocument('IRI',phase)!;localStorage.setItem(sourceDocumentKey(s.project.id,doc.id),JSON.stringify(sourceFormFixture(doc,s.project)));}}
function periodJournal(before:OperationalWorkflowState,next:OperationalWorkflowState,action:string,object=before.project.packageName){const after=retainDecisionHistory(before,next);after.events=[{id:'period-event',date:before.simulationDate,actor:before.role,action,object,oldValue:'',newValue:''},...before.events];return after;}
test('Balai may re-review complete source with exact downstream invalidation; cannot alter another audit',()=>{
 const before=setup();sources(before);before.cycle.reviewPendingTypes=['IRI'];
 const next=applyCycleEdit(before,reviewSurvey(before.cycle,'IRI',{userReview:'Sesuai'},before.simulationDate,['IRI']));
 const after=periodJournal(before,next,'Catat pemeriksaan Pengguna Jasa dan bukti akhir periode');
 assert.equal(isBalaiPeriodDecision(before,after),true);assert.equal(workflowMutationError(before,after,before.role),undefined);
 const forged=structuredClone(after);forged.audits[0].decisionNote='Palsu';assert.ok(workflowMutationError(before,forged,before.role));
});
test('Balai BA re-review preserves old BA and audit history and refuses missing source/open finding',()=>{
 const before=setup();sources(before);
 assert.deepEqual(periodicBaBlockers(before,'BA-NEW'),[]);
 const next=recordPeriodicBa(before,'BA-NEW');assert.notEqual(next,before);
 const after=periodJournal(before,next,'Catat BA verval Balai 14 hari','BA-NEW');
 assert.equal(workflowMutationError(before,after,before.role),undefined);assert.equal(after.cycle.certificateId,'BA-NEW');assert.equal(after.cycleRevisions?.['1']?.at(-1)?.certificateId,before.cycle.certificateId);
 for(let i=0;i<3;i++){assert.equal(after.audits[i].baNumber,before.audits[i].baNumber);assert.equal(after.audits[i].requiresReview,true);}
 sources(before);localStorage.setItem(sourceDocumentKey(before.project.id,sourceDocument('IRI','periodic14')!.id),'{}');assert.equal(recordPeriodicBa(before,'BA-NEW'),before);
 sources(before);const finding=applyPeriodicFinding(before,'IRI','open');assert.equal(recordPeriodicBa(finding,'BA-NEW'),finding);
});
test('Balai final-validation evidence may invalidate readiness but cannot replace Provider measurements',()=>{
 const before=setup(),next=applyCycleEdit(before,{finalPeriodValidation:!before.cycle.finalPeriodValidation}),after=periodJournal(before,next,'Validasi akhir periode');
 assert.equal(workflowMutationError(before,after,before.role),undefined);
 const forged=structuredClone(after);forged.cycle.iriCoefficientVariation=0;assert.ok(workflowMutationError(before,forged,before.role));
});

test('Balai cannot directly change Provider consistency measurements, handover or protocol answers',()=>{
 const attacks:Record<string,unknown>={iriCoefficientVariation:0,checkedProtocols:{},periodCompleted:false,reRatingStatus:'Tidak Sesuai',selectedTypes:['PCI']};
 for(const [key,value] of Object.entries(attacks)){const before=setup(),after=structuredClone(before);(after.cycle as unknown as Record<string,unknown>)[key]=value;assert.ok(workflowMutationError(before,after,before.role),key);}
});
test('Provider cannot directly record Balai period BA or final-validation evidence',()=>{
 for(const [key,value] of Object.entries({certificateId:'FORGED',lastCompletedDate:'2099-01-01',bridgeFieldValidation:false,finalPeriodValidation:false,finalValidationLocation:'FORGED',finalToolUnchanged:false})){
  const before=setup();before.role='Penyedia Jasa / Ketua Tim';const after=structuredClone(before);(after.cycle as unknown as Record<string,unknown>)[key]=value;assert.ok(workflowMutationError(before,after,before.role),key);
 }
});

import {workflowMutationError as workspaceMutationError} from '../workflowMutationPermissions';
test('workspace and storage guards both accept BA renewal even with an unchanged BA number',()=>{
 const before=setup();sources(before);before.cycle.requiresReview=true;
 const next=recordPeriodicBa(before,before.cycle.certificateId);assert.notEqual(next,before);
 assert.equal(workspaceMutationError(before,next,'/verification:Verval 14 hari'),undefined);
 assert.equal(workflowMutationError(before,next,before.role),undefined);
});
