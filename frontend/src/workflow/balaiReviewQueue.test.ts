import test from 'node:test';
import assert from 'node:assert/strict';
import {INITIAL_WORKFLOW} from './model';
import {balaiReviewQueue,filterBalaiReviews} from './balaiReviewQueue';
import {workflowMutationError} from './workflowMutationPermissions';
import {balaiDecisionError} from './balaiDecisionPolicy';
import {retainDecisionHistory} from './workflowRevisions';
const fresh=()=>structuredClone(INITIAL_WORKFLOW);
const queue=(s:ReturnType<typeof fresh>)=>balaiReviewQueue({[s.project.id]:s});
test('queue has no invented work or totals for an empty authorized scope',()=>assert.deepEqual(balaiReviewQueue({}),[]));
test('projection is read only, periods are distinct and active period wins over old history',()=>{
 const s=fresh();s.activeCyclePeriod=2;s.cycleHistory={'1':{...s.cycle,periodCompleted:true},'2':{...s.cycle,certificateId:'STALE'}};s.cycle.certificateId='';
 const before=JSON.stringify(s),rows=queue(s);assert.equal(JSON.stringify(s),before);assert.equal(rows.filter(r=>r.stage==='Tahap 3B').length,2);
 assert.equal(rows.find(r=>r.period===2)?.status,'Menunggu');assert.equal(rows.find(r=>r.period===1)?.status,'Perlu Review');
});
test('submission, revision and note search reflect actual persisted state',()=>{
 const s=fresh();s.project.preparation.reportApproval='Diajukan';s.project.preparation.reviewerNote='Klarifikasi sertifikat alat';
 const rows=queue(s);assert.equal(rows.find(r=>r.stage==='Tahap 0')?.status,'Perlu Review');
 assert.equal(filterBalaiReviews(rows,'  SERTIFIKAT  ','Tahap 0','Perlu Review').length,1);
 assert.equal(filterBalaiReviews(rows,'','Tahap 0','Selesai/Lulus').length,0);
 s.project.preparation.reportApproval='Perlu Revisi';assert.equal(queue(s)[0].status,'Perlu Perbaikan');
});
test('audit level 2 waits for level 1 and valid upload; clarification is not a finding',()=>{
 const s=fresh();s.audits[1].status='Belum Dimulai';s.audits[0].status='Belum Dimulai';s.submission.validationStatus='Draft';
 assert.equal(queue(s).find(r=>r.auditLevel===2)?.status,'Menunggu');s.audits[0].status='Lulus';s.submission.validationStatus='VALID';
 assert.equal(queue(s).find(r=>r.auditLevel===2)?.status,'Perlu Review');s.audits[1].status='Klarifikasi';
 assert.equal(queue(s).find(r=>r.auditLevel===2)?.status,'Menunggu');s.audits[1].status='Ditolak';
 assert.equal(queue(s).find(r=>r.auditLevel===2)?.status,'Perlu Perbaikan');
});
test('acceptance never becomes complete from a simulation percentage',()=>{
 const s=fresh();s.acceptance.terms.forEach(t=>t.progress=100);s.acceptance.finalAcceptance=false;s.audits[0].status='Belum Dimulai';
 assert.notEqual(queue(s).find(r=>r.stage==='Tahap 6')?.status,'Selesai/Lulus');
});
test('preparation revision needs a reason; provider cannot impersonate reviewer',()=>{
 const s=fresh();s.project.preparation.reportApproval='Diajukan';s.role='PIC Balai / Pengguna Jasa';
 const n=structuredClone(s);n.project.preparation.reportApproval='Perlu Revisi';n.project.preparation.reviewerNote='';
 assert.match(balaiDecisionError(s,n)??'',/wajib/);n.project.preparation.reviewerNote='Lengkapi bukti koordinasi';
 assert.equal(workflowMutationError(s,n,'/entry:Persiapan & SPMK'),undefined);s.role='Penyedia Jasa / Ketua Tim';
 assert.match(workflowMutationError(s,n,'/entry:Persiapan & SPMK')??'',/berwenang/);
});
test('ordinary preparation note saves without a finding or decision change',()=>{
 const s=fresh();s.role='PIC Balai / Pengguna Jasa';const n=structuredClone(s);n.project.preparation.reviewerNote='Catatan rapat';
 assert.equal(workflowMutationError(s,n,'/entry:Persiapan & SPMK'),undefined);assert.equal(n.corrections.length,s.corrections.length);
 assert.equal(n.project.preparation.reportApproval,s.project.preparation.reportApproval);
});
test('production revision requires resubmission before approval',()=>{
 const s=fresh();s.productionApproval='Perlu Revisi';s.role='PIC Balai / Pengguna Jasa';const n=structuredClone(s);n.productionApproval='Disetujui';
 assert.match(balaiDecisionError(s,n)??'',/diajukan ulang/);s.productionApproval='Diajukan';n.productionApproval='Perlu Revisi';n.productionApprovalNote='';
 assert.match(balaiDecisionError(s,n)??'',/wajib/);
});
test('production notes and revision decisions deny all other roles',()=>{
 for(const role of ['Penyedia Jasa / Ketua Tim','Direktorat / Pusat','Admin'] as const){
  const s=fresh();s.role=role;const n=structuredClone(s);n.productionApprovalNote='Catatan yang disuntik';
  assert.match(workflowMutationError(s,n,'/entry:Validasi produksi')??'',/berwenang/);
 }
});
test('blank V&V finding is rejected and note-only operation does not create a finding',()=>{
 const s=fresh();const n=structuredClone(s);n.cycle.surveyReviews={IRI:{decision:'Temuan',note:'',reviewedAt:'2026-11-09'}};
 assert.match(balaiDecisionError(s,n)??'',/wajib/);n.cycle.surveyReviews.IRI!.note='Dokumen pengukuran ulang belum tersedia';
 assert.equal(balaiDecisionError(s,n),undefined);
});
test('decision history retains rejection reason through resubmission and later approval',()=>{
 const s=fresh();s.role='PIC Balai / Pengguna Jasa';s.productionApproval='Diajukan';
 const rejected=retainDecisionHistory(s,{...s,productionApproval:'Perlu Revisi',productionApprovalNote:'Referensi tidak terbaca'});
 const provider={...rejected,role:'Penyedia Jasa / Ketua Tim' as const};
 const submitted=retainDecisionHistory(provider,{...provider,productionApproval:'Diajukan',productionApprovalNote:''});
 assert.equal(submitted.balaiDecisionHistory?.length,2);assert.equal(submitted.balaiDecisionHistory?.[0].note,'Referensi tidak terbaca');
 assert.equal(submitted.balaiDecisionHistory?.[1].previousNote,'Referensi tidak terbaca');
});
test('staged review is Balai authority; provider cannot decide and Balai cannot edit source data',()=>{
 const s=fresh();s.project.surveyTypes=['Lendutan'];s.role='PIC Balai / Pengguna Jasa';
 const n=structuredClone(s);n.submission.stagedReviews={Lendutan:{decision:'Sesuai',note:'Bukti diperiksa',reviewedAt:'2026-11-09'}};
 assert.equal(workflowMutationError(s,n,'/entry:Gerbang RNI/LRS'),undefined);
 const injected=structuredClone(n);injected.submission.rawFileName='data-lain.csv';
 assert.match(workflowMutationError(s,injected,'/entry:Gerbang RNI/LRS')??'',/berwenang/);
 s.role='Penyedia Jasa / Ketua Tim';assert.match(workflowMutationError(s,n,'/entry:Gerbang RNI/LRS')??'',/berwenang/);
});
test('staged finding requires a concrete reason and cannot introduce an outside-scope survey',()=>{
 const s=fresh();s.project.surveyTypes=['Lendutan'];s.role='PIC Balai / Pengguna Jasa';const n=structuredClone(s);
 n.submission.stagedReviews={Lendutan:{decision:'Temuan',note:'',reviewedAt:'2026-11-09'}};
 assert.match(workflowMutationError(s,n,'/entry:Gerbang RNI/LRS')??'',/wajib/);
 n.submission.stagedReviews={IRI:{decision:'Sesuai',note:'Tidak boleh',reviewedAt:'2026-11-09'}};
 assert.match(workflowMutationError(s,n,'/entry:Gerbang RNI/LRS')??'',/lingkup/);
});
test('acceptance with notes is distinct from rejection and never fabricates BA',()=>{
 const s=fresh();s.acceptance.finalAcceptance=false;s.acceptance.acceptanceDecision='Belum Diperiksa';const n=structuredClone(s);
 n.acceptance.acceptanceDecision='Diterima dengan Catatan';n.acceptance.acceptanceReviewNote='';
 assert.match(balaiDecisionError(s,n)??'',/Catatan penerimaan wajib/);
 n.acceptance.acceptanceReviewNote='Dokumen diterima, arsip administrasi menyusul';n.acceptance.finalAcceptance=true;n.acceptance.finalAcceptanceBa='';
 assert.match(balaiDecisionError(s,n)??'',/BA penerimaan wajib/);
 n.acceptance.finalAcceptanceBa='BA-REFERENSI-UJI';assert.equal(balaiDecisionError(s,n),undefined);
 const history=retainDecisionHistory(s,n);assert.equal(history.balaiDecisionHistory?.at(-1)?.note,n.acceptance.acceptanceReviewNote);
});
test('production approval requires an explicitly entered BA reference',()=>{
 const s=fresh();s.productionApproval='Diajukan';const n=structuredClone(s);n.productionApproval='Disetujui';n.productionApprovalBa='';
 assert.match(balaiDecisionError(s,n)??'',/BA persetujuan/);
});
test('editing an ordinary V&V note never clears a pending re-review or restores old conformity',async()=>{
 const {reviewSurvey}=await import('./periodicReview');const s=fresh();s.cycle.selectedTypes=['IRI'];s.cycle.reviewPendingTypes=['IRI'];
 s.cycle.surveyReviews={IRI:{decision:'Sesuai',note:'Keputusan lama',reviewedAt:'2026-10-01'}};
 const note=reviewSurvey(s.cycle,'IRI',{userReviewNote:'Catatan klarifikasi biasa'},'2026-11-09',['IRI']);
 assert.deepEqual(note.reviewPendingTypes,['IRI']);assert.equal(note.userReview,'Belum Diperiksa');assert.equal(note.surveyReviews?.IRI?.reviewedAt,'2026-10-01');
 const decision=reviewSurvey({...s.cycle,...note},'IRI',{userReview:'Sesuai'},'2026-11-09',['IRI']);
 assert.deepEqual(decision.reviewPendingTypes,[]);assert.equal(decision.userReview,'Sesuai');
});
test('V&V note-only projection preserves previous technical decisions',async()=>{
 const {periodicNoteOnly,reviewSurvey}=await import('./periodicReview');const s=fresh();s.cycle.selectedTypes=['IRI'];s.cycle.reviewPendingTypes=[];
 s.cycle.surveyReviews={IRI:{decision:'Sesuai',note:'Sesuai',reviewedAt:'2026-10-01'}};s.cycle.userReview='Sesuai';
 const patch=reviewSurvey(s.cycle,'IRI',{userReviewNote:'Tambahan informasi'},'2026-11-09',['IRI']);assert.equal(periodicNoteOnly(s.cycle,patch),true);
 assert.equal(periodicNoteOnly(s.cycle,{...patch,userReview:'Temuan'}),false);
});
test('audit correction submitted for re-verification returns to the Balai review queue',()=>{
 const s=fresh();s.audits[1].status='Ditolak';
 s.corrections.push({id:'AUD-RETEST',source:'Penolakan audit tingkat 2',blockedStage:'Audit tingkat 2',road:s.project.routes[0]??'',stationing:'',rejectionReason:'Referensi belum sesuai',severity:'Mayor',owner:'Penyedia Jasa / Ketua Tim',dueDate:'2026-11-09',rootCause:'',fieldDataValid:'',surveyType:'IRI',actionType:'',evidence:'REF-UJI',originalValue:'',proposedValue:'',approval:'Disetujui',retest:'Belum Diuji',status:'Verifikasi Ulang',returnStage:'Audit tingkat 2'});
 assert.equal(queue(s).find(row=>row.auditLevel===2)?.status,'Perlu Review');
});
