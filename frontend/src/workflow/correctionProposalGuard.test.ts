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
 assert.equal(check(B,old,{status:'Terbuka',approval:'Perlu Revisi',reviewNote:'Bukti sumber tidak sesuai lokasi; unggah ulang.'}),undefined);
 assert.ok(check(A,old,{status:'Terbuka',approval:'Perlu Revisi',reviewNote:'Tidak sah'}));
});

test('kasus yang sudah ditutup tidak dapat diedit atau dihapus',()=>{
 const state=base();state.role=P;state.corrections[0]={...state.corrections[0],status:'Ditutup'};
 const after={...state,corrections:[{...state.corrections[0],rootCause:'Ubah tanpa hak'}]};
 assert.match(correctionMutationError(state,after)??'',/ditutup/i);
 assert.match(correctionMutationError(state,{...state,corrections:[]})??'',/tidak boleh dihapus/i);
});
