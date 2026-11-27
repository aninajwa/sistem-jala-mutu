import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoWorkflow} from '../demoScenario';
import {applyAuditRejection,auditRejectionAction} from '../auditRejectionTransition';
import {workflowMutationError} from './workflowMutationGuard';
import {workflowMutationError as workspaceError} from '../workflowMutationPermissions';
import {retainDecisionHistory} from '../workflowRevisions';
import type {OperationalWorkflowState} from '../model';
const D='Direktorat / Pusat';
function fixture(){const s=createDemoWorkflow('complete');s.role=D;const record=s.dailyRecords[0];s.audits[2]={...s.audits[2],status:'Dalam Review',sampleUnits:[{id:'U1',sourceRecordId:record.id,surveyType:record.surveyType,road:record.road,unitType:'segment',unitKey:'unit-1',reviewStatus:'Tidak Valid',evidenceReference:'REF-AUD-3'}]};return s;}
function reject(s:OperationalWorkflowState){return applyAuditRejection(s,{level:3,surveyType:s.dailyRecords[0].surveyType,note:'Sampel tidak sesuai',caseIds:['CASE-AUD-3']});}
test('Direktorat dapat membuka kasus dari keputusan audit 3 yang sah tanpa mengambil alih BA Balai',()=>{
 const before=fixture(),result=reject(before);assert.ok(result.next,result.error);const next=result.next!;
 assert.equal(next.corrections[0].linkedRecordId,before.dailyRecords[0].id);assert.equal(next.corrections[0].originReference,'REF-AUD-3');
 assert.equal(next.corrections[0].owner,'');assert.equal(next.audits[2].status,'Ditolak');assert.deepEqual(next.audits.slice(0,2),before.audits.slice(0,2));assert.deepEqual(next.dailyRecords,before.dailyRecords);
 assert.equal(workspaceError(before,next,'/verification:Audit tingkat 1–3'),undefined);
 assert.equal(workflowMutationError(before,next,D),undefined);
 const recorded=retainDecisionHistory(before,next);recorded.events=[{id:'new-audit-event',actor:D,date:before.simulationDate,action:auditRejectionAction(3),object:'Audit tingkat 3'},...before.events];
 assert.equal(workflowMutationError(before,recorded,D),undefined);
 for(const mutate of [(s:OperationalWorkflowState)=>{s.dailyRecords[0].rawValue='PALSU'},(s:OperationalWorkflowState)=>{s.audits[1].baNumber='PALSU'},(s:OperationalWorkflowState)=>{s.corrections[0].approval='Disetujui'},(s:OperationalWorkflowState)=>{s.acceptance.finalAcceptanceBa='PALSU'}]){
  const forged=structuredClone(next);mutate(forged);assert.ok(workflowMutationError(before,forged,D));
 }
});
test('Audit 3 tidak boleh dilompati dari admin/Balai atau SMD Draft',()=>{
 const s=fixture();s.role='Admin';assert.ok(reject(s).error);s.role='PIC Balai / Pengguna Jasa';assert.ok(reject(s).error);s.role=D;s.submission.validationStatus='Draft';assert.ok(reject(s).error);
});
test('Temuan aktif dari sampel yang sama tidak diduplikasi',()=>{
 const s=fixture(),next=reject(s).next!;assert.ok(next);assert.ok(reject(next).error);
 const result=applyAuditRejection(next,{level:3,surveyType:next.dailyRecords[0].surveyType,note:'Sampel tidak sesuai',caseIds:[]});assert.ok(result.next);assert.equal(result.next!.corrections.length,next.corrections.length);
});
