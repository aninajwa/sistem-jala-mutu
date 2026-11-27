import { correctionExecutionSummary } from "./correctionFormEngine";
import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoWorkflow} from './demoScenario';
import {correctionMutationError,correctionReviewer} from './checkpoint09Corrections';
import {applyClosedCorrection, correctionClosureErrors} from './flowRules';
import type {CorrectionCase,OperationalWorkflowState,WorkflowRole} from './model';

const P:WorkflowRole='Penyedia Jasa / Ketua Tim';
const B:WorkflowRole='PIC Balai / Pengguna Jasa';
const D:WorkflowRole='Direktorat / Pusat';
const A:WorkflowRole='Admin';

function start():OperationalWorkflowState {
  const state=createDemoWorkflow('verval-finding');
  assert.equal(state.corrections.length,1);
  return state;
}
function transact(s:OperationalWorkflowState,role:WorkflowRole,patch:Partial<CorrectionCase>):OperationalWorkflowState {
  const before={...s,role};
  const after={...before,corrections:before.corrections.map((c,i)=>i===0?{...c,...patch}:c)};
  assert.equal(correctionMutationError(before,after),undefined,`${role}: ${JSON.stringify(patch)}`);
  return after;
}
function blocked(s:OperationalWorkflowState,role:WorkflowRole,patch:Partial<CorrectionCase>):void {
  const before={...s,role};
  const after={...before,corrections:before.corrections.map((c,i)=>i===0?{...c,...patch}:c)};
  assert.ok(correctionMutationError(before,after),`${role} seharusnya ditolak: ${JSON.stringify(patch)}`);
}
function submit(s:OperationalWorkflowState):OperationalWorkflowState {
  return transact(s,P,{status:'Menunggu Persetujuan',approval:'Diajukan'});
}
function approve(s:OperationalWorkflowState):OperationalWorkflowState {
  s=transact(s,B,{reviewNote:'Sesuai bukti yang disampaikan',verification:{surveyor:true,teamLeader:true,balai:true}});
  return transact(s,B,{status:'Disetujui',approval:'Disetujui'});
}
function execute(s:OperationalWorkflowState):OperationalWorkflowState {
  const c=s.corrections[0];
  return transact(s,P,{status:'Dilaksanakan',executionReference:'SRC-IRI-ULANG-001 | laporan dan bukti pelaksanaan',executionResult:{date:s.simulationDate,summary:'Survei ulang',sourceReference:'SRC-IRI-ULANG-001',period:String(c.cyclePeriod??1),lane:'1 / A',equipment:'IRI-1',verificationReference:'CONS-001',actionFields:{coverage:c.stationing,newRecord:'SRC-IRI-ULANG-001'},evidenceKeys:[`${s.project.id}::correction::${c.id}::execution:documents:1`],evidenceNote:''}});
}

test('perjalanan lengkap: usulan → review Balai → pelaksanaan → uji ulang → penutupan',()=>{
  let s=start();
  assert.equal(s.corrections[0].status,'Terbuka');
  blocked(s,A,{status:'Menunggu Persetujuan',approval:'Diajukan'});
  blocked(s,B,{status:'Menunggu Persetujuan',approval:'Diajukan'});
  s=submit(s);
  blocked(s,P,{status:'Disetujui',approval:'Disetujui'});
  blocked(s,D,{reviewNote:'Keputusan pusat palsu'});
  s=approve(s);
  blocked(s,B,{status:'Dilaksanakan',executionReference:'Tidak sah'});
  s=execute(s);
  blocked(s,P,{status:'Verifikasi Ulang',retest:'Lulus',retestReference:'RETEST-001'});
  s=transact(s,B,{status:'Verifikasi Ulang',retest:'Lulus',retestReference:'BA-RETEST-IRI-001'});
  assert.deepEqual(correctionClosureErrors(s,s.corrections[0]),[]);
  blocked(s,P,{status:'Ditutup'});
  const beforeClose=s;
  s={...s,role:B};
  const afterClose=applyClosedCorrection(s,s.corrections[0]);
  assert.equal(correctionMutationError(s,afterClose),undefined);
  assert.equal(afterClose.corrections[0].status,'Ditutup');
  assert.equal(afterClose.corrections[0].originalValue,beforeClose.corrections[0].originalValue);
  blocked(afterClose,B,{owner:'Mengubah kasus yang telah ditutup'});
});

test('usulan ditolak: alasan wajib, dikembalikan ke Penyedia dan dapat diajukan ulang',()=>{
  let s=submit(start());
  blocked(s,B,{status:'Terbuka',approval:'Perlu Revisi',reviewNote:''});
  s=transact(s,B,{reviewNote:'Bukti survei ulang belum lengkap'});
  s=transact(s,B,{status:'Terbuka',approval:'Perlu Revisi',retest:'Belum Diuji',verification:{surveyor:false,teamLeader:false,balai:false}});
  assert.equal(s.corrections[0].reviewNote,'Bukti survei ulang belum lengkap');
  blocked(s,A,{owner:'Admin'});
  s=transact(s,P,{verification:{surveyor:true,teamLeader:false,balai:false}});
  s=transact(s,P,{verification:{surveyor:true,teamLeader:true,balai:false}});
  s=submit(s);
  assert.equal(s.corrections[0].status,'Menunggu Persetujuan');
});

test('uji ulang gagal: referensi dan alasan wajib; siklus koreksi terbuka kembali',()=>{
  let s=execute(approve(submit(start())));
  blocked(s,B,{status:'Terbuka',approval:'Perlu Revisi',retest:'Gagal',retestReference:'BA-FAIL-001',retestFailureReason:''});
  s=transact(s,B,{status:'Terbuka',approval:'Perlu Revisi',retest:'Gagal',retestReference:'BA-FAIL-001',retestFailureReason:'Ketidaksesuaian pada pengukuran ulang',verification:{surveyor:false,teamLeader:false,balai:false}});
  assert.equal(s.corrections[0].status,'Terbuka');
  blocked(s,P,{status:'Ditutup'});
  s=transact(s,P,{rootCause:'Alat',verification:{surveyor:false,teamLeader:false,balai:false},approval:'Draft',retest:'Belum Diuji',retestReference:undefined,retestFailureReason:undefined,executionReference:undefined,executionResult:undefined});
  s=transact(s,P,{verification:{surveyor:true,teamLeader:true,balai:false}});
  s=submit(s);
  assert.equal(s.corrections[0].approval,'Diajukan');
});

test('audit 3: hanya Direktorat boleh uji ulang; Admin dan Balai tidak menggantikan otoritas audit',()=>{
  let s=execute(approve(submit(start())));
  s.corrections=[{...s.corrections[0],blockedStage:'Audit tingkat 3',returnStage:'Audit tingkat 3'}];
  assert.equal(correctionReviewer(s.corrections[0]),D);
  for(const role of [P,B,A])blocked(s,role,{status:'Verifikasi Ulang',retest:'Lulus',retestReference:'BA-AUDIT3-001'});
  s=transact(s,D,{status:'Verifikasi Ulang',retest:'Lulus',retestReference:'BA-AUDIT3-001'});
  blocked(s,A,{status:'Ditutup'});
  assert.equal(s.corrections[0].status,'Verifikasi Ulang');
});

test('approval Balai untuk koreksi pemrosesan ditolak bila pemeriksaan internal belum dilakukan',()=>{
  let s=submit(start());
  s={...s,corrections:[{...s.corrections[0],actionType:'Koreksi pemrosesan dengan bukti',verification:{surveyor:false,teamLeader:false,balai:false}}]};
  blocked(s,B,{status:'Disetujui',approval:'Disetujui',verification:{surveyor:false,teamLeader:false,balai:true}});
});

 test('hasil lulus terkunci sebelum penutupan dan tidak dapat diganti diam-diam',()=>{
  let s=execute(approve(submit(start())));
  blocked(s,B,{status:'Verifikasi Ulang',retest:'Lulus',retestReference:'BA-001',retestFailureReason:'Alasan gagal yang bertentangan'});
  s=transact(s,B,{status:'Verifikasi Ulang',retest:'Lulus',retestReference:'BA-001'});
  blocked(s,B,{retestReference:'BA-002'});
  blocked(s,B,{status:'Terbuka',approval:'Perlu Revisi',retest:'Gagal',retestReference:'BA-002',retestFailureReason:'Keputusan lain',verification:{surveyor:false,teamLeader:false,balai:false}});
  assert.equal(s.corrections[0].retestReference,'BA-001');
  assert.equal(correctionMutationError({...s,role:B},applyClosedCorrection({...s,role:B},s.corrections[0])),undefined);
});

test('ringkasan hasil menggunakan label teknis yang dikenal tanpa path lampiran',()=>{
 const s=execute(approve(submit(start()))),c=s.corrections[0];
 const result=correctionExecutionSummary(c);
 assert.ok(result.some(r=>r.label==='ID rekaman survei ulang' && r.value==='SRC-IRI-ULANG-001'));
 assert.ok(result.some(r=>r.label==='Referensi lampiran tercatat' && r.value==='1'));
 assert.ok(!JSON.stringify(result).includes('::correction::'));
 assert.deepEqual(correctionExecutionSummary({...c,executionResult:undefined}),[]);
});
