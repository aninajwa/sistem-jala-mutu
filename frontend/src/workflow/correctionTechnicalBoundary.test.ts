import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoWorkflow} from './demoScenario';
import {correctionMutationError} from './checkpoint09Corrections';
import type {CorrectionCase} from './model';
function submit(patch:Partial<CorrectionCase>){
 const s=createDemoWorkflow('verval-finding');s.role='Penyedia Jasa / Ketua Tim';
 const c={...s.corrections[0],...patch};s.corrections=[c];
 return correctionMutationError(s,{...s,corrections:[{...c,status:'Menunggu Persetujuan',approval:'Diajukan'}]});
}
test('guard teknis menolak skenario lintas jenis survei',()=>{
 assert.match(submit({ruleScenario:'Nilai ekstrem'})??'',/jenis survei/);
});
test('guard teknis menolak penggantian skenario khusus dengan skenario lain',()=>{
 assert.match(submit({rejectionReason:'Kehilangan data',ruleScenario:'Lajur melenceng'})??'',/Kehilangan data/);
});
test('guard teknis menolak koreksi pemrosesan dengan referensi raw palsu',()=>{
 assert.match(submit({fieldDataValid:'Ya',actionType:'Koreksi pemrosesan dengan bukti',linkedRecordId:'PALSU'})??'',/raw sumber/);
});
test('guard teknis menerima rencana survei ulang sebelum bukti baru tersedia, tetapi menolak pelaksanaan tanpa checklist',()=>{
 const patch:Partial<CorrectionCase>={rejectionReason:'Kehilangan data',ruleScenario:'Kehilangan data / underspeed',ruleChecks:{},ruleNumbers:{}};
 assert.equal(submit(patch),undefined);
 const s=createDemoWorkflow('verval-finding');s.role='Penyedia Jasa / Ketua Tim';
 const c={...s.corrections[0],...patch,status:'Disetujui' as const,approval:'Disetujui' as const};s.corrections=[c];
 const result={date:'2026-11-25',summary:'Survei ulang',sourceReference:'NEW',period:String(c.cyclePeriod??1),lane:'1',equipment:'IRI-1',verificationReference:'TEST',actionFields:{coverage:'STA 0+000–0+100',newRecord:'NEW'},evidenceKeys:[`${s.project.id}::correction::${c.id}::execution:documents:1`],evidenceNote:''};
 const next={...c,status:'Dilaksanakan' as const,executionReference:'NEW',executionResult:result};
 assert.match(correctionMutationError(s,{...s,corrections:[next]})??'',/Checklist/);
 assert.equal(correctionMutationError(s,{...s,corrections:[{...next,executionResult:{...result,scenarioChecks:{'Survei ulang dilakukan saat lalu lintas normal':true},scenarioNumbers:{'Data valid hilang per 100 m':0,'Jumlah survei ulang':1}}}]}),undefined);
});
test('guard teknis menolak pemeriksaan Ketua Tim sebelum bukti Surveyor',()=>{
 assert.match(submit({verification:{surveyor:false,teamLeader:true,balai:false}})??'',/Surveyor/);
});
test('guard teknis tetap menerima usulan survei ulang umum',()=>{
 assert.equal(submit({}),undefined);
});

test('perubahan isi usulan mengharuskan pemeriksaan internal kembali',()=>{
 const s=createDemoWorkflow('verval-finding');s.role='Penyedia Jasa / Ketua Tim';
 const c=s.corrections[0];
 const next={...c,proposedPlan:'Rencana teknis diubah'};
 assert.match(correctionMutationError(s,{...s,corrections:[next]})??'',/pemeriksaan bukti internal kembali/);
 assert.equal(correctionMutationError(s,{...s,corrections:[{...next,verification:{surveyor:false,teamLeader:false,balai:false}}]}),undefined);
});
