import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoWorkflow} from './demoScenario';
import {correctionMutationError} from './checkpoint09Corrections';
import type {CorrectionCase,WorkflowRole} from './model';
const P:WorkflowRole='Penyedia Jasa / Ketua Tim';
const B:WorkflowRole='PIC Balai / Pengguna Jasa';
const A:WorkflowRole='Admin';
const base=()=>createDemoWorkflow('verval-finding');
function check(role:WorkflowRole,old:Partial<CorrectionCase>,patch:Partial<CorrectionCase>){
 const state=base();state.role=role;state.corrections[0]={...state.corrections[0],...old};
 const after={...state,corrections:[{...state.corrections[0],...patch}]};
 return correctionMutationError(state,after);
}
test('usulan baru memerlukan uraian rencana kerja eksplisit',()=>{
 const old:Partial<CorrectionCase>={status:'Terbuka',rootCause:'Metode',fieldDataValid:'Tidak',actionType:'Survei ulang sebagian ruas',owner:'Ketua Tim',evidence:'Foto dan dokumen sumber',proposedPlan:'',verification:{surveyor:true,teamLeader:true,balai:false}};
 assert.match(check(P,old,{status:'Menunggu Persetujuan',approval:'Diajukan'})??'',/Transisi/);
 assert.equal(check(P,{...old,proposedPlan:'Survei ulang STA temuan; bandingkan hasil dengan rekaman asli.'},{status:'Menunggu Persetujuan',approval:'Diajukan'}),undefined);
 assert.ok(check(A,old,{proposedPlan:'Palsu'}));
});
test('Balai mengesahkan hanya dengan catatan keputusan dan verifikasi sah',()=>{
 const old:Partial<CorrectionCase>={status:'Menunggu Persetujuan',approval:'Diajukan',reviewNote:'',verification:{surveyor:true,teamLeader:true,balai:true}};
 assert.ok(check(B,old,{status:'Disetujui',approval:'Disetujui'}));
 assert.equal(check(B,old,{status:'Disetujui',approval:'Disetujui',reviewNote:'Hasil ditinjau dan sesuai'}),undefined);
 assert.ok(check(P,old,{status:'Disetujui',approval:'Disetujui',reviewNote:'Persetujuan palsu'}));
});

test('pengembalian usulan memerlukan alasan; admin tidak dapat memutuskan',()=>{
 const old:Partial<CorrectionCase>={status:'Menunggu Persetujuan',approval:'Diajukan',reviewNote:'',verification:{surveyor:true,teamLeader:true,balai:false}};
 assert.ok(check(B,old,{status:'Terbuka',approval:'Perlu Revisi'}));
 assert.equal(check(B,old,{status:'Terbuka',approval:'Perlu Revisi',reviewNote:'Bukti sumber tidak sesuai lokasi; unggah ulang.',verification:{surveyor:false,teamLeader:false,balai:false}}),undefined);
 assert.ok(check(A,old,{status:'Terbuka',approval:'Perlu Revisi',reviewNote:'Tidak sah'}));
});

test('kasus yang sudah ditutup tidak dapat diedit atau dihapus',()=>{
 const state=base();state.role=P;state.corrections[0]={...state.corrections[0],status:'Ditutup'};
 const after={...state,corrections:[{...state.corrections[0],rootCause:'Ubah tanpa hak'}]};
 assert.match(correctionMutationError(state,after)??'',/ditutup/i);
 assert.match(correctionMutationError(state,{...state,corrections:[]})??'',/tidak boleh dihapus/i);
});

 test('pengembalian usulan membatalkan seluruh pemeriksaan versi lama',()=>{
 const old:Partial<CorrectionCase>={status:'Menunggu Persetujuan',approval:'Diajukan',retest:'Belum Diuji',verification:{surveyor:true,teamLeader:true,balai:true}};
 const patch:Partial<CorrectionCase>={status:'Terbuka',approval:'Perlu Revisi',reviewNote:'Perbaiki rencana'};
 assert.ok(check(B,old,patch));
 assert.ok(check(B,old,{...patch,verification:{surveyor:false,teamLeader:false,balai:true}}));
 assert.equal(check(B,old,{...patch,verification:{surveyor:false,teamLeader:false,balai:false}}),undefined);
});
test('perubahan penanggung jawab atau tenggat membatalkan pemeriksaan usulan',()=>{
 const old:Partial<CorrectionCase>={status:'Terbuka',approval:'Draft',owner:'Ketua Tim A',dueDate:'2027-01-01',verification:{surveyor:true,teamLeader:true,balai:false}};
 for(const patch of [{owner:'Ketua Tim B'},{dueDate:'2027-02-01'}]){
  assert.match(check(P,old,patch)??'',/pemeriksaan bukti internal kembali/);
  assert.equal(check(P,old,{...patch,verification:{surveyor:false,teamLeader:false,balai:false}}),undefined);
 }
});

test('perubahan skenario mengharuskan pengosongan bukti dan nilai lama',()=>{
 const old:Partial<CorrectionCase>={status:'Terbuka',approval:'Draft',ruleScenario:'Umum',ruleChecks:{'Bukti lama':true},ruleNumbers:{'Nilai lama':40},provinceUpdateBa:'BA-LAMA',proposedValue:'9',verification:{surveyor:false,teamLeader:false,balai:false}};
 const patch:Partial<CorrectionCase>={ruleScenario:'Macet / kendaraan parkir',ruleChecks:{},ruleNumbers:{},provinceUpdateBa:'',proposedValue:''};
 for(const key of ['ruleChecks','ruleNumbers','provinceUpdateBa','proposedValue'] as const){
  assert.match(check(P,old,{...patch,[key]:old[key]})??'',/Perubahan skenario teknis/);
 }
 assert.equal(check(P,old,patch),undefined);
});
