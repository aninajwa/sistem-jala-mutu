import test from 'node:test';
import assert from 'node:assert/strict';
import {INITIAL_WORKFLOW,type WorkflowRole} from '../model';
import {workflowMutationError} from './workflowMutationGuard';
import {retainDecisionHistory} from '../workflowRevisions';

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
test('Final acceptance rejects a direct flag even with Balai and Directorate audits',()=>{
 assert.ok(check(B,s=>{s.acceptance.finalAcceptance=true;}));
 const old=fixture(B);old.audits[1].status='Lulus';old.audits[2].status='Lulus';const next=structuredClone(old);next.acceptance.finalAcceptance=true;
 assert.ok(workflowMutationError(old,next,B));
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

// Regression: revoking Balai approval invalidates Directorate review but
// must not grant Balai the ability to rewrite Directorate's historic decision.
test('Balai rejection preserves Directorate audit snapshot and marks it for re-review',()=>{
 const before=fixture(B);
 before.audits[0].status='Lulus';before.audits[1].status='Lulus';before.audits[2].status='Lulus';
 before.submission.validationStatus='VALID';
 const after=structuredClone(before);
 after.audits[1].status='Ditolak';after.audits[1].decisionNote='Bukti belum sesuai';
 after.audits[2].requiresReview=true;
 after.audits[2].reviewReason='Audit tingkat 2 berubah; periksa kembali keterkaitan keputusan.';
 const retained=retainDecisionHistory(before,after);
 assert.equal(retained.audits[2].history?.length,1);
 assert.equal(workflowMutationError(before,retained,B),undefined);
 const forged=structuredClone(retained);
 forged.audits[2].decisionNote='Keputusan Direktorat palsu';
 assert.match(workflowMutationError(before,forged,B)??'',/tingkat 3/);
 const invented=structuredClone(retained);
 invented.audits[2].history?.push({...before.audits[2],decisionNote:'Riwayat palsu'});
 assert.match(workflowMutationError(before,invented,B)??'',/tingkat 3/);
});

test('partial receipt cannot bypass readiness and a term cannot be completed without prior receipt',()=>{
 const before=fixture(B); before.acceptance.partialReceipts=[]; before.acceptance.terms[0].complete=false; before.productionApproval='Draft';
 const receipt=structuredClone(before);receipt.acceptance.partialReceipts.push('BA penerimaan T1');
 assert.match(workflowMutationError(before,receipt,B)??'',/Penerimaan parsial tertahan/);
 const provider={...before,role:P};const completed=structuredClone(provider);completed.acceptance.terms[0].complete=true;
 assert.match(workflowMutationError(provider,completed,P)??'',/BA penerimaan parsial/);
 const illicit=structuredClone(before);illicit.acceptance.terms[0].complete=true;assert.ok(workflowMutationError(before,illicit,B));
});

import {applySubmissionEdit} from '../submissionEdit';
test('Balai staged Lendutan review may invalidate later audits without rewriting decisions',()=>{
 const before=fixture(B); before.project.surveyTypes=['Lendutan'];
 before.audits.forEach(a=>{a.status='Lulus';});
 const after=applySubmissionEdit(before,{stagedReviews:{Lendutan:{decision:'Sesuai',note:'Bukti diperiksa',reviewedAt:before.simulationDate}}});
 assert.equal(workflowMutationError(before,after,B),undefined);
 assert.equal(after.audits[2].requiresReview,true);
 assert.equal(after.audits[2].status,'Lulus');
 const bad=structuredClone(after);bad.audits[2].decisionNote='Keputusan palsu';
 assert.ok(workflowMutationError(before,bad,B));
 const foreign=applySubmissionEdit(before,{stagedReviews:{IRI:{decision:'Sesuai',note:'Bukti',reviewedAt:before.simulationDate}}});
 assert.ok(workflowMutationError(before,foreign,B));
 const journaled=retainDecisionHistory(before,after);
 journaled.events=[{id:'test-staged',date:before.simulationDate,actor:B,action:'Review V&V bertahap Lendutan',object:before.project.packageName,oldValue:'',newValue:''},...before.events];
 assert.equal(workflowMutationError(before,journaled,B),undefined);
});

test('Balai staged review note preserves historical decision date and denies fabricated fields',()=>{
 const before=fixture(B);before.project.surveyTypes=['Lendutan'];
 before.audits.forEach(a=>{a.status='Lulus';});
 const draft=applySubmissionEdit(before,{stagedReviews:{Lendutan:{decision:'Belum Diperiksa',note:'Catatan awal',reviewedAt:''}}});
 assert.equal(workflowMutationError(before,draft,B),undefined);
 before.submission.stagedReviews={Lendutan:{decision:'Sesuai',note:'Catatan awal',reviewedAt:'2026-01-01'}};
 const review={...before.submission.stagedReviews.Lendutan!,note:'Catatan tambahan'};
 const edited=applySubmissionEdit(before,{stagedReviews:{Lendutan:review}});
 assert.equal(workflowMutationError(before,edited,B),undefined);
 const falsified=applySubmissionEdit(before,{stagedReviews:{Lendutan:{...review,reviewedAt:'2099-12-31'}}});
 assert.ok(workflowMutationError(before,falsified,B));
 const illicit=structuredClone(edited);illicit.submission.rawFileName='diganti Balai';
 assert.ok(workflowMutationError(before,illicit,B));
 const unreasoned=applySubmissionEdit(before,{stagedReviews:{Lendutan:{decision:'Temuan',note:' ',reviewedAt:before.simulationDate}}});
 assert.ok(workflowMutationError(before,unreasoned,B));
 const foreignRole={...before,role:P};
 assert.ok(workflowMutationError(foreignRole,{...edited,role:P},P));
});

test('No interactive role can create external VALID status, even with an internal audit and a local reference',()=>{
 for(const role of [P,B,D,A]) {
  const old=fixture(role);old.submission.validationStatus='Draft';old.submission.localReadinessConfirmed=true;old.submission.reviewHandoverReference='REF-LOKAL';old.audits[0].status='Lulus';
  const next=structuredClone(old);next.submission.validationStatus='VALID';
  assert.match(workflowMutationError(old,next,role)??'',/sistem sumber/);
 }
});
