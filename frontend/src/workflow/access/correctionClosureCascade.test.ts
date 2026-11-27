import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoWorkflow} from '../demoScenario';
import {applyClosedCorrection} from '../flowRules';
import {retainDecisionHistory} from '../workflowRevisions';
import {workflowMutationError} from './workflowMutationGuard';
import {workflowMutationError as workspaceError} from '../workflowMutationPermissions';
import type {OperationalWorkflowState,WorkflowRole} from '../model';
const roles:WorkflowRole[]=['Penyedia Jasa / Ketua Tim','PIC Balai / Pengguna Jasa','Direktorat / Pusat','Admin'];
function setup(level:number){const s=createDemoWorkflow('complete'),finding=createDemoWorkflow('verval-finding').corrections[0];s.role=roles[level-1];s.corrections=[{...finding,id:'CLOSE-REGRESSION',source:`Penolakan audit tingkat ${level}`,blockedStage:`Audit tingkat ${level}`,returnStage:`Audit tingkat ${level}`,status:'Verifikasi Ulang',approval:'Disetujui',retest:'Lulus',fieldDataValid:'Tidak Berlaku',actionType:'Pelatihan ulang personel',linkedRecordId:undefined,evidence:'REF-BUKTI-UJI',executionReference:'REF-PELAKSANAAN-UJI',retestReference:'REF-UJI-ULANG',verification:{surveyor:true,teamLeader:true,balai:true}}];return s;}
function close(s:OperationalWorkflowState){const next=retainDecisionHistory(s,applyClosedCorrection(s,s.corrections[0]));next.events=[{id:'closure-event',date:s.simulationDate,actor:s.role,action:'Tutup kasus setelah verifikasi hasil pada sistem sumber',object:s.corrections[0].id,oldValue:'Verifikasi Ulang',newValue:'Ditutup'},...s.events];return next;}
for(const level of [1,2,3])test(`source reviewer ${level} closes only its own verified case; raw and historic audits remain intact`,()=>{
 const before=setup(level),raw=applyClosedCorrection(before,before.corrections[0]),after=close(before);
 assert.equal(workspaceError(before,raw,'/actions:Koreksi berbukti'),undefined);
 assert.equal(workflowMutationError(before,raw,before.role),undefined);assert.equal(workflowMutationError(before,after,before.role),undefined);
 assert.equal(after.corrections[0].status,'Ditutup');assert.deepEqual(after.dailyRecords,before.dailyRecords);
 for(let i=0;i<3;i++){assert.equal(after.audits[i].status,before.audits[i].status);assert.equal(after.audits[i].baNumber,before.audits[i].baNumber);if(i+1>=level){assert.equal(after.audits[i].requiresReview,true);assert.equal(after.audits[i].history?.at(-1)?.baNumber,before.audits[i].baNumber);}else{assert.deepEqual(after.audits[i],before.audits[i]);}}
 assert.deepEqual(after.submission,before.submission);assert.deepEqual(after.acceptance.terms.find(t=>t.id==='T2'),before.acceptance.terms.find(t=>t.id==='T2'));assert.equal(after.acceptance.semesterTwoRevalidation,before.acceptance.semesterTwoRevalidation);
 for(const role of roles.filter(r=>r!==before.role)){const wrong=structuredClone(before);wrong.role=role;assert.ok(workflowMutationError(wrong,applyClosedCorrection(wrong,wrong.corrections[0]),role));}
});
const attacks:Record<string,(s:OperationalWorkflowState)=>void>={
 'rewrites Provider BA':s=>{s.audits[0].baNumber='FORGED';},
 'rewrites Balai decision':s=>{s.audits[1].decisionNote='FORGED';},
 'rewrites survey bytes':s=>{s.dailyRecords[0].rawValue='FORGED';},
 'forges audit history':s=>{s.audits[0].history=[...(s.audits[0].history??[]),{...s.audits[2].history!.at(-1)!,decisionNote:'FORGED'}];},
 'omits linked evidence':s=>{s.corrections[0].retestReference='';},
};
for(const [name,attack] of Object.entries(attacks))test(`Directorate closure cannot hide a change that ${name}`,()=>{const before=setup(3),after=structuredClone(close(before));attack(after);assert.ok(workflowMutationError(before,after,before.role));});
test('closure is refused until source retest and evidence checks are complete',()=>{
 const before=setup(3);before.corrections[0].retest='Belum Diuji';const after=structuredClone(before);after.corrections[0].status='Ditutup';assert.ok(workflowMutationError(before,after,before.role));
 before.corrections[0].retest='Lulus';before.corrections[0].verification.balai=false;assert.ok(workflowMutationError(before,after,before.role));
});

test('closure at production reopens T1 readiness without rewriting its evidence',()=>{
 const before=setup(2);const c=before.corrections[0];c.blockedStage=c.returnStage='Validasi produksi';c.source='Validasi produksi';
 before.acceptance.terms=before.acceptance.terms.map(t=>({...t,complete:true}));
 const after=applyClosedCorrection(before,c);
 assert.equal(after.productionApproval,'Draft');assert.equal(after.acceptance.terms.find(t=>t.id==='T1')?.complete,false);
 assert.equal(before.acceptance.terms.find(t=>t.id==='T1')?.complete,true);
});
test('non-IRI data closure preserves independent IRI Semester II revalidation',()=>{
 const before=setup(2);const c=before.corrections[0];c.surveyType='PCI';c.fieldDataValid='Tidak';c.actionType='Survei ulang sebagian';
 before.acceptance.semesterTwoRevalidation=true;
 const after=applyClosedCorrection(before,c);
 assert.equal(after.submission.validationStatus,'Draft');assert.equal(after.acceptance.semesterTwoRevalidation,true);
 assert.equal(after.acceptance.finalAcceptance,false);
});

test('periodic closure refuses an unavailable historical source period',()=>{
 const before=setup(2);const c=before.corrections[0];c.blockedStage=c.returnStage='Verval 14 hari';c.cyclePeriod=999;
 assert.throws(()=>applyClosedCorrection(before,c),/Kasus belum memenuhi syarat/);
});
