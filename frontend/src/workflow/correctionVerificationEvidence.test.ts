import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoWorkflow} from './demoScenario';
import {correctionMutationError} from './checkpoint09Corrections';
import {correctionVerificationMetadataFor, correctionVerificationEvidenceErrors, CORRECTION_VERIFICATION_STEPS, type CorrectionVerificationStep} from './correctionVerificationEvidence';
import {correctionExecutionErrors, type CorrectionExecution} from './correctionFormEngine';
import {correctionClosureErrors} from './flowRules';
import type {CorrectionCase,OperationalWorkflowState,WorkflowRole} from './model';
const P:WorkflowRole='Penyedia Jasa / Ketua Tim', B:WorkflowRole='PIC Balai / Pengguna Jasa';
const setup=()=>{
  const s=createDemoWorkflow('verval-finding');
  const c=s.corrections[0];
  const raw=s.dailyRecords.find(r=>r.road===c.road&&r.surveyType===c.surveyType)!;
  assert.ok(raw);
  s.corrections=[{...c,rootCause:'Pemrosesan',fieldDataValid:'Ya',actionType:'Koreksi pemrosesan dengan bukti',rejectionReason:'Kesalahan input data',linkedRecordId:raw.id,originalValue:raw.rawValue,proposedValue:'4.2',proposedPlan:'Koreksi input dengan dokumen sumber, simpan raw',evidence:'DOK-BUKTI',ruleScenario:undefined,ruleChecks:undefined,ruleNumbers:undefined,verification:{surveyor:false,teamLeader:false,balai:false},verificationEvidence:undefined}];
  return s;
};
const record=(c:CorrectionCase,step:CorrectionVerificationStep,attempt=1,patch:Partial<{reviewerIdentity:string;reviewedAt:string;dataVersionReference:string;evidenceReference:string}>={})=>correctionVerificationMetadataFor(c,step,attempt,{reviewerIdentity:`Pemeriksa ${step}`,reviewedAt:`2027-06-10T0${CORRECTION_VERIFICATION_STEPS.indexOf(step)+7}:00:00+07:00`,dataVersionReference:'CLEANED-V1',evidenceReference:`DOK-${step}`,...patch});
function mutate(s:OperationalWorkflowState,role:WorkflowRole,patch:Partial<CorrectionCase>) {
  const before={...s,role};const after={...before,corrections:[{...before.corrections[0],...patch}]};
  return {after,error:correctionMutationError(before,after)};
}
function apply(s:OperationalWorkflowState,role:WorkflowRole,patch:Partial<CorrectionCase>) {const {after,error}=mutate(s,role,patch);assert.equal(error,undefined);return after;}
function recordStep(s:OperationalWorkflowState,step:CorrectionVerificationStep) {
  const c=s.corrections[0];return apply(s,step==='balai'?B:P,{verification:{...c.verification!,[step]:true},verificationEvidence:{...c.verificationEvidence,[step]:record(c,step)}});
}
function draftChecked(){return recordStep(recordStep(setup(),'surveyor'),'teamLeader');}
function submitted(){const s=apply(draftChecked(),P,{status:'Menunggu Persetujuan',approval:'Diajukan'});return {...s,events:[{id:'SUBMIT-1',actor:P,date:s.simulationDate,object:s.corrections[0].id,action:'Ajukan tindakan koreksi untuk persetujuan'},...s.events]};}
function approved(){const s=recordStep(submitted(),'balai');return apply(s,B,{status:'Disetujui',approval:'Disetujui',reviewNote:'Bukti ketiga pemeriksa ditinjau'});}

test('flag tanpa dokumen individual tidak dapat mengajukan atau menyetujui koreksi data',()=>{
 const s=setup(),flags={surveyor:true,teamLeader:true,balai:false};
 assert.match(mutate(s,P,{verification:flags}).error??'',/Surveyor/);
 assert.ok(mutate({...s,corrections:[{...s.corrections[0],verification:flags}]},P,{status:'Menunggu Persetujuan',approval:'Diajukan'}).error);
 const pending=submitted();assert.ok(mutate(pending,B,{status:'Disetujui',approval:'Disetujui',reviewNote:'tanpa bukti Balai',verification:{...flags,balai:true}}).error);
});
test('pencatatan dokumen terikat pada identitas kasus, versi, urutan, dan pemeriksa yang berbeda',()=>{
 const s=setup(),c=s.corrections[0],survey=record(c,'surveyor');
 assert.ok(correctionVerificationEvidenceErrors({...c,verification:{surveyor:true,teamLeader:false,balai:false},verificationEvidence:{surveyor:{...survey,caseId:'LAIN'}}},1).length);
 assert.ok(correctionVerificationEvidenceErrors({...c,verification:{surveyor:true,teamLeader:false,balai:false},verificationEvidence:{surveyor:survey}},2).length);
 const checked=recordStep(s,'surveyor'),checkedCase=checked.corrections[0];
 for(const patch of [{reviewerIdentity:survey.reviewerIdentity},{dataVersionReference:'LAIN'},{reviewedAt:'2027-06-10T06:00:00+07:00'}]){
  assert.ok(mutate(checked,P,{verification:{surveyor:true,teamLeader:true,balai:false},verificationEvidence:{surveyor:survey,teamLeader:record(checkedCase,'teamLeader',1,patch)}}).error);
 }
 const valid=draftChecked();assert.deepEqual(correctionVerificationEvidenceErrors(valid.corrections[0],1,['surveyor','teamLeader']),[]);
});
test('perubahan bukti Surveyor tidak mempertahankan pemeriksaan Ketua Tim lama',()=>{
 const s=draftChecked(),c=s.corrections[0];
 assert.match(mutate(s,P,{verificationEvidence:{...c.verificationEvidence,surveyor:record(c,'surveyor',1,{evidenceReference:'DOK-BARU'})}}).error??'',/Ketua Tim kembali/);
 assert.equal(mutate(s,P,{verification:{surveyor:true,teamLeader:false,balai:false},verificationEvidence:{surveyor:record(c,'surveyor',1,{evidenceReference:'DOK-BARU'})}}).error,undefined);
});
test('Balai tidak dapat mengganti bukti internal, Penyedia tidak dapat mencatat Balai',()=>{
 const s=draftChecked(),c=s.corrections[0];
 assert.ok(mutate(s,P,{verificationEvidence:{...c.verificationEvidence,balai:record(c,'balai')}}).error);
 const pending=submitted(),p=pending.corrections[0];
 assert.ok(mutate(pending,B,{verificationEvidence:{...p.verificationEvidence,surveyor:record(p,'surveyor',1,{evidenceReference:'DOK-LAIN'})}}).error);
 assert.equal(approved().corrections[0].approval,'Disetujui');
});
test('pengembalian usulan wajib mengosongkan dokumen lama, percobaan baru tidak memakai versi lama',()=>{
 const s=submitted(),c=s.corrections[0],patch:Partial<CorrectionCase>={status:'Terbuka',approval:'Perlu Revisi',reviewNote:'Revisi dokumen',retest:'Belum Diuji',verification:{surveyor:false,teamLeader:false,balai:false}};
 assert.ok(mutate(s,B,patch).error);
 const returned=apply(s,B,{...patch,verificationEvidence:undefined});
 assert.ok(mutate(returned,P,{verification:{surveyor:true,teamLeader:false,balai:false},verificationEvidence:{surveyor:c.verificationEvidence!.surveyor!}}).error);
 assert.equal(mutate(returned,P,{verification:{surveyor:true,teamLeader:false,balai:false},verificationEvidence:{surveyor:record(returned.corrections[0],'surveyor',2)}}).error,undefined);
});
test('pelaksanaan koreksi pemrosesan dan penutupan menggunakan dokumen berlapis, versi cleaned harus sama',()=>{
 const s=approved(),c=s.corrections[0];
 const result:CorrectionExecution={date:'2027-06-10',summary:'Koreksi pemrosesan',sourceReference:'CLEANED-V1',period:String(c.cyclePeriod??1),lane:'',equipment:'',verificationReference:'DOK-KONS',actionFields:{rawReference:c.linkedRecordId!,cleanedReference:'CLEANED-V1',processingMethod:'Koreksi kesalahan input'},evidenceKeys:[`${s.project.id}::correction::${c.id}::execution:documents:1`],evidenceNote:''};
 assert.deepEqual(correctionExecutionErrors(c,result,s.project.id,1),[]);
 assert.match(correctionExecutionErrors(c,{...result,actionFields:{...result.actionFields,cleanedReference:'LAIN'}},s.project.id,1).join(' '),/Versi hasil cleaned/);
 const executed=apply(s,P,{status:'Dilaksanakan',executionReference:'CLEANED-V1',executionResult:result});
 const verified=apply(executed,B,{status:'Verifikasi Ulang',retest:'Lulus',retestReference:'DOK-UJI-ULANG'});
 assert.deepEqual(correctionClosureErrors(verified,verified.corrections[0]),[]);
 assert.ok(correctionClosureErrors(verified,{...verified.corrections[0],verificationEvidence:undefined}).length);
});
