import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoWorkflow} from './demoScenario';
import {correctionReviewer,correctionNextStep,correctionMutationError} from './checkpoint09Corrections';
import {documentIdentityErrors,documentReviewContext} from './ba/documentContext09';
import {documentActors} from './ba/documentWorkflow';
import {documentInsights} from './documents/DocumentInsights09';
import {BA_TEMPLATES} from './ba/docxEngine';
import type {WorkflowRole,CorrectionCase} from './model';
const roles:WorkflowRole[]=['Penyedia Jasa / Ketua Tim','PIC Balai / Pengguna Jasa','Direktorat / Pusat','Admin'];
function fixture(role:WorkflowRole=roles[0]){const s=createDemoWorkflow('verval-finding');s.role=role;return s;}
function mutate(role:WorkflowRole,old:Partial<CorrectionCase>,patch:Partial<CorrectionCase>){const s=fixture(role);s.corrections=[{...s.corrections[0],...old}];return correctionMutationError(s,{...s,corrections:[{...s.corrections[0],...patch}]});}
for(const [level,actor] of [roles[0],roles[1],roles[2]].entries()){
 test(`09 audit ${level+1}: hanya pemeriksa tingkat sumber melakukan retest`,()=>{
  const old={blockedStage:`Audit tingkat ${level+1}`,status:'Dilaksanakan' as const,executionReference:'EXEC-09'};
  for(const role of roles){const error=mutate(role,old,{status:'Verifikasi Ulang',retest:'Lulus',retestReference:'RETEST-09'});assert.equal(!error,role===actor,error);}
 });
 test(`09 audit ${level+1}: gagal kembali ke Penyedia dengan alasan, bukan dead end`,()=>{
  const s=fixture(actor),c={...s.corrections[0],blockedStage:`Audit tingkat ${level+1}`};assert.equal(correctionReviewer(c),actor);
  const patch={status:'Terbuka' as const,approval:'Perlu Revisi' as const,retest:'Gagal' as const,retestReference:'R-09',retestFailureReason:'Hasil belum sesuai',verification:{surveyor:false,teamLeader:false,balai:false}};
  assert.equal(mutate(actor,{...c,status:'Dilaksanakan',executionReference:'E-09'},patch),undefined);
  assert.equal(correctionNextStep({...c,...patch}).actor,roles[0]);
  assert.ok(mutate(actor,{...c,status:'Dilaksanakan',executionReference:'E-09'},{...patch,retestFailureReason:''}));
 });
}
test('09 penutupan tidak boleh melewati uji, mengubah bukti, atau menghapus kasus',()=>{
 for(const role of roles)assert.ok(mutate(role,{status:'Terbuka'},{status:'Ditutup'}));
 const s=fixture();assert.ok(correctionMutationError(s,{...s,corrections:[]}));
 assert.ok(mutate(roles[1],{status:'Verifikasi Ulang',retest:'Lulus'},{status:'Ditutup',evidence:'DIUBAH'}));
 assert.ok(mutate(roles[0],{status:'Ditutup'},{owner:'diganti'}));
});
test('09 usulan perlu penanggung jawab, bukti, dan verifikasi internal; Admin tidak menulis',()=>{
 const old={status:'Terbuka' as const,approval:'Draft' as const,rootCause:'Metode',evidence:'REF',owner:'Ketua Tim',fieldDataValid:'Tidak' as const,actionType:'Survei ulang sebagian ruas',verification:{surveyor:true,teamLeader:true,balai:false}};
 assert.equal(mutate(roles[0],old,{status:'Menunggu Persetujuan',approval:'Diajukan'}),undefined);
 assert.ok(mutate(roles[0],{...old,owner:''},{status:'Menunggu Persetujuan',approval:'Diajukan'}));
 assert.ok(mutate(roles[3],old,{owner:'Admin'}));assert.equal(mutate(roles[0],{...old,status:'Verifikasi Ulang',retest:'Gagal'},{status:'Terbuka',approval:'Draft',owner:'PIC revisi'}),undefined);
 assert.ok(mutate(roles[0],old,{verification:{surveyor:true,teamLeader:true,balai:true}}));
});
test('09 revisi Balai menyimpan alasan dan membuka kembali usulan',()=>{
 const old={status:'Menunggu Persetujuan' as const,approval:'Diajukan' as const,reviewNote:'Lengkapi bukti',verification:{surveyor:true,teamLeader:true,balai:false}};
 assert.equal(mutate(roles[1],old,{status:'Terbuka',approval:'Perlu Revisi',retest:'Belum Diuji',verification:{surveyor:false,teamLeader:false,balai:false}}),undefined);
 assert.ok(mutate(roles[1],{...old,reviewNote:''},{status:'Terbuka',approval:'Perlu Revisi'}));
 assert.ok(mutate(roles[1],old,{verification:{surveyor:false,teamLeader:true,balai:true}}));
});
test('09 tujuh BA mempertahankan pemilik dan konteks identitas',()=>{
 const s=fixture();const identity={packageId:s.project.id,kind:'audit' as const,period:0,survey:'IRI',auditLevel:1};
 assert.equal(BA_TEMPLATES.length,7);
 for(const t of BA_TEMPLATES){const id={...identity,kind:t.id,period:['konsistensi','internal','duaMingguan'].includes(t.id)?1:0};assert.deepEqual(documentIdentityErrors(s,id),[]);assert.ok(!documentActors(id).authors.includes(roles[3]));assert.notEqual(documentActors(id).reviewer,roles[3]);}
 assert.ok(documentIdentityErrors(s,{...identity,packageId:'foreign'}).length);
 assert.ok(documentIdentityErrors(s,{...identity,kind:'duaMingguan',period:88}).length);
 assert.ok(documentIdentityErrors(s,{...identity,kind:'bertahap',period:1}).length);
 assert.ok(documentIdentityErrors(s,{...identity,auditLevel:4}).length);
});
test('09 pemeriksaan BA historis memakai periode yang diminta',()=>{
 const s=fixture();s.activeCyclePeriod=2;s.cycleHistory={'1':{...s.cycle,requiresReview:true}};
 const id={packageId:s.project.id,kind:'duaMingguan' as const,period:1,survey:'IRI',auditLevel:1};
 assert.equal(documentReviewContext(s,id).cycle.requiresReview,true);assert.equal(documentReviewContext(s,id).activeCyclePeriod,1);assert.deepEqual(documentReviewContext(s,id).cycleHistory,{});assert.equal(s.activeCyclePeriod,2);
});
test('09 grafik menghitung identitas unik, bukan versi atau stale ganda; kosong bukan 100%',()=>{
 const row=(id:string,status:string,stale=false)=>({id,localStatus:status,stale,identity:{packageId:'p'}} as any);
 const rows=[row('a','local-draft'),row('a','local-draft'),row('b','submitted-local',true),row('c','reviewed-local'),row('d','rejected-local'),row('e','revision-requested-local'),row('f','decision-recorded-local')];
 const d=documentInsights(rows);assert.equal(d.total,6);assert.equal(d.groups.reduce((a,b)=>a+b.count,0),6);assert.equal(d.stale,1);assert.equal(d.packages,1);assert.equal(documentInsights([]).total,0);
});

test('09 persetujuan BA tidak melewati checklist sumber kosong meski status teknis lama lulus',async()=>{
 const {documentActionErrors,documentFingerprint}=await import('./ba/documentWorkflow');
 const memory=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v)}});
 for(const kind of ['kalibrasi','konsistensi','internal','duaMingguan','bertahap','audit'] as const){const state=fixture();const id={packageId:state.project.id,kind,period:['konsistensi','internal','duaMingguan'].includes(kind)?1:0,survey:'IRI',auditLevel:1};state.role=documentActors(id).reviewer;const latest={status:'submitted-local',actor:roles[0],sourceFingerprint:documentFingerprint(state,id)} as any;assert.ok(documentActionErrors(state,id,'approve',latest,0,'').some(e=>e.includes('Checklist')||e.includes('pengajuannya')));}
});


test('09 Lendutan bertahap memakai review eksplisit dan tidak menagih DOCX yang tidak ada',async()=>{const {workflowFormIssues}=await import('./repository/workflowReconciliation');const s=fixture();s.project.surveyTypes=['Lendutan'];s.submission.validationStatus='VALID';s.submission.stagedReviews={Lendutan:{decision:'Sesuai',note:'Diperiksa Balai',reviewedAt:s.simulationDate}};assert.equal(workflowFormIssues(s).filter(i=>i.stage==='Tahap 4').length,0);s.submission.stagedReviews.Lendutan!.decision='Belum Diperiksa';assert.equal(workflowFormIssues(s).filter(i=>i.stage==='Tahap 4').length,1);});
