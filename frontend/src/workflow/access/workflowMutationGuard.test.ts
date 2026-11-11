import test from 'node:test';
import assert from 'node:assert/strict';
import {INITIAL_WORKFLOW,type WorkflowRole} from '../model';
import {workflowMutationError} from './workflowMutationGuard';

const P:WorkflowRole='Penyedia Jasa / Ketua Tim';
const B:WorkflowRole='PIC Balai / Pengguna Jasa';
const D:WorkflowRole='Direktorat / Pusat';
const A:WorkflowRole='Admin';
const fixture=(role:WorkflowRole)=>({...structuredClone(INITIAL_WORKFLOW),role});
const check=(role:WorkflowRole,mutate:(s:ReturnType<typeof fixture>)=>void)=>{
 const old=fixture(role),next=structuredClone(old);mutate(next);return workflowMutationError(old,next,role);
};
test('Admin cannot alter decisions even without UI',()=>{
 assert.match(check(A,s=>{s.audits[1].status='Lulus';})??'',/Admin/);
 assert.match(check(A,s=>{s.acceptance.finalAcceptance=true;})??'',/Admin/);
});
test('Admin may operate administrative backup without QAQC change',()=>{
 assert.equal(check(A,s=>{s.backupSchedule={enabled:false,intervalDays:7,nextDate:'',media:[]};}),undefined);
});
test('Provider cannot decide Balai or Directorate audits',()=>{
 assert.match(check(P,s=>{s.audits[1].status='Lulus';})??'',/tingkat 2/);
 assert.match(check(P,s=>{s.audits[2].status='Lulus';})??'',/tingkat 3/);
 const old=fixture(P);old.project.preparation.reportApproval='Draft';const next=structuredClone(old);next.project.preparation.reportApproval='Disetujui';assert.ok(workflowMutationError(old,next,P));
});
test('Balai cannot write level 3 and Directorate cannot write level 2',()=>{
 assert.match(check(B,s=>{s.audits[2].status='Dalam Review';})??'',/tingkat 3/);
 assert.match(check(D,s=>{s.audits[1].status='Dalam Review';})??'',/tingkat 2/);
});
test('Directorate level 3 approval requires Balai and valid submission',()=>{
 assert.ok(check(D,s=>{s.audits[2].status='Lulus';}));
 const old=fixture(D);old.audits[0].status='Lulus';old.audits[1].status='Lulus';old.submission.validationStatus='VALID';
 const next=structuredClone(old);next.audits[2].status='Lulus';
 assert.equal(workflowMutationError(old,next,D),undefined);
});
test('Balai level 2 approval requires level 1',()=>{
 assert.ok(check(B,s=>{s.audits[1].status='Lulus';}));
 const old=fixture(B);old.audits[0].status='Lulus';const next=structuredClone(old);next.audits[1].status='Lulus';
 assert.equal(workflowMutationError(old,next,B),undefined);
});
test('Final acceptance requires both Balai and Directorate audit',()=>{
 assert.ok(check(B,s=>{s.acceptance.finalAcceptance=true;}));
 const old=fixture(B);old.audits[1].status='Lulus';old.audits[2].status='Lulus';const next=structuredClone(old);next.acceptance.finalAcceptance=true;
 assert.equal(workflowMutationError(old,next,B),undefined);
});
test('Previous event records cannot be removed or overwritten',()=>{
 const old=fixture(B);old.events=[{id:'e1',date:'2026-11-10',actor:B,action:'review',object:'paket',oldValue:'Draft',newValue:'Lulus'}];
 const next=structuredClone(old);next.events=[];
 assert.ok(workflowMutationError(old,next,B));
 const modified=structuredClone(old);modified.events[0].newValue='DIUBAH';
 assert.ok(workflowMutationError(old,modified,B));
});
test('New correction cannot skip workflow or source scope',()=>{
 assert.ok(check(D,s=>{s.corrections.push({id:'new'} as never);}));
});
test('Direct unauthorized role switch and package mutation rejected',()=>{
 assert.ok(check(P,s=>{s.role=B;}));
 assert.ok(check(B,s=>{s.project.id='PAKET-LAIN';}));
});

test('Balai may request preparation revision with exact downstream invalidation and retained audit snapshots',()=>{
 const before=fixture(B);
 before.project.preparation.reportApproval='Diajukan';
 before.audits[0].status='Lulus';before.audits[1].status='Lulus';before.audits[2].status='Lulus';
 const after=structuredClone(before);
 after.project.preparation.reportApproval='Perlu Revisi';
 after.project.preparation.reviewerNote='Bukti persiapan harus diperbaiki';
 const reason='Laporan pendahuluan perlu revisi; validasi dan audit harus diulang.';
 after.productionApproval='Draft';after.productionApprovalBa='';after.bridgeInspectionPermit=false;
 after.submission.validationStatus='Draft';after.submission.validationMessage=reason;
 after.acceptance.finalAcceptance=false;after.acceptance.finalReport=false;after.acceptance.semesterTwoRevalidation=false;
 after.audits=before.audits.map(a=>{const {history:_,...snapshot}=a;return {...a,requiresReview:true,reviewReason:reason,history:[...(a.history??[]),snapshot]};}) as typeof after.audits;
 assert.equal(workflowMutationError(before,after,B),undefined);
 const illicit=structuredClone(after);illicit.audits[2].status='Lulus';illicit.audits[2].decisionNote='Direktorat dipalsukan';
 assert.ok(workflowMutationError(before,illicit,B));
});
