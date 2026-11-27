import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoWorkflow} from './demoScenario';
import {defaultCase} from './correctionDefaults';
import {correctionMutationError} from './checkpoint09Corrections';
import type {CorrectionCase} from './model';
const state = {...createDemoWorkflow('verval-finding'),role:'Penyedia Jasa / Ketua Tim' as const,corrections:[] as CorrectionCase[]};
const c = {...defaultCase(state,'NEW'),rejectionReason:'Temuan uji',originReference:'UJI-001'};
const check = (...cases:CorrectionCase[])=>correctionMutationError(state,{...state,corrections:cases});
test('temuan baru tanpa keputusan dapat dibuka',()=>assert.equal(check(c),undefined));
test('temuan baru tidak dapat membawa hasil atau pengesahan',()=>{assert.ok(check({...c,retest:'Lulus'}));assert.ok(check({...c,verification:{surveyor:true,teamLeader:false,balai:false}}));assert.ok(check({...c,executionReference:'lama'}));});
test('temuan audit tidak dapat dibuat melalui pembukaan manual',()=>{assert.ok(check({...c,blockedStage:'Audit tingkat 3',returnStage:'Audit tingkat 3'}));assert.ok(check({...c,source:'Penolakan audit tingkat 2'}));});
test('rekaman tidak sah ditolak pada transaksi domain',()=>assert.ok(check({...c,linkedRecordId:'tidak-ada'})));
test('dua temuan identik pada transaksi yang sama ditolak, periode berbeda diperbolehkan',()=>{assert.ok(check(c,{...c,id:'NEW2'}));assert.equal(check({...c,cyclePeriod:1},{...c,id:'NEW2',cyclePeriod:2}),undefined);});
test('linked source cannot be assigned to an unrelated period',()=>{
 const record=state.dailyRecords[0];assert.ok(record);
 const linked={...c,road:record.road,surveyType:record.surveyType,linkedRecordId:record.id,cyclePeriod:999};
 assert.match(check(linked)??'',/Periode kasus/);
});

test('draft cannot be linked to a source from an unrelated period',()=>{
 const record=state.dailyRecords[0];assert.ok(record);
 const draft={...c,road:record.road,surveyType:record.surveyType,cyclePeriod:999};
 const before={...state,corrections:[draft]};
 assert.match(correctionMutationError(before,{...before,corrections:[{...draft,linkedRecordId:record.id}]})??'',/periode kasus/);
});

test('PCI production finding must capture the actual source method',()=>{
 const before={...state,project:{...state.project,surveyTypes:['PCI' as const]},productionTests:{...state.productionTests,PCI:{...state.productionTests.PCI,pciManual:false}}};
 const finding={...c,surveyType:'PCI' as const,source:'Uji coba gagal'};
 const checkMethod=(n:CorrectionCase)=>correctionMutationError(before,{...before,corrections:[n]});
 assert.match(checkMethod(finding)??'',/Metode PCI/);
 assert.match(checkMethod({...finding,originPciMethod:'Manual'})??'',/Metode PCI/);
 const valid={...finding,originPciMethod:'AI' as const};
 assert.equal(checkMethod(valid),undefined);
 const opened={...before,corrections:[valid]};
 assert.match(correctionMutationError(opened,{...opened,corrections:[{...valid,originPciMethod:'Manual'}]})??'',/Identitas temuan/);
 assert.match(correctionMutationError(opened,{...opened,corrections:[{...valid,originPciMethod:undefined}]})??'',/Identitas temuan/);
 assert.match(checkMethod({...valid,source:'Validasi produksi'})??'',/uji produksi/);
});

 test('draft relinking cannot duplicate an active source finding',()=>{
 const record=state.dailyRecords[0];assert.ok(record);
 const draft={...c,road:record.road,surveyType:record.surveyType};
 const existing={...draft,id:'EXISTING',linkedRecordId:record.id};
 const before={...state,corrections:[draft,existing]};
 const relinked={...draft,linkedRecordId:record.id};
 assert.match(correctionMutationError(before,{...before,corrections:[relinked,existing]})??'',/Kasus aktif/);
 const closed={...existing,status:'Ditutup' as const};
 const withClosed={...before,corrections:[draft,closed]};
 assert.equal(correctionMutationError(withClosed,{...withClosed,corrections:[relinked,closed]}),undefined);
});

test('PCI source record method is required at creation, without guessing unknown history',()=>{
 const record={...state.dailyRecords[0],surveyType:'PCI' as const,technicalData:{pciMethod:'AI'}};
 const before={...state,project:{...state.project,surveyTypes:['PCI' as const]},dailyRecords:[record]};
 const finding={...c,road:record.road,surveyType:'PCI' as const,linkedRecordId:record.id};
 const validate=(n:CorrectionCase)=>correctionMutationError(before,{...before,corrections:[n]});
 assert.match(validate(finding)??'',/Metode PCI/);
 assert.match(validate({...finding,originPciMethod:'Manual'})??'',/Metode PCI/);
 assert.equal(validate({...finding,originPciMethod:'AI'}),undefined);
});

test('source and stage cannot be assigned independently',()=>{
 assert.match(check({...c,blockedStage:'Kalibrasi',returnStage:'Kalibrasi'})??'',/Sumber temuan/);
 assert.match(check({...c,source:'Validasi sistem LRS'})??'',/Sumber temuan/);
 assert.equal(check({...c,source:'Validasi sistem LRS',blockedStage:'Gerbang RNI/LRS',returnStage:'Gerbang RNI/LRS'}),undefined);
 assert.match(check({...c,source:'Pengingat H+0 terlewat'})??'',/Notifikasi/);
});

import { correctionCreationError } from './correctionCreation';
import { eligibleCorrectionRecords } from './correctionRecordLink';
test('batch creation cannot duplicate the same calibration subject across routes',()=>{
 const finding={...c,source:'Pemeriksaan kalibrasi',blockedStage:'Kalibrasi',returnStage:'Kalibrasi',calibrationFinding:{surveyType:c.surveyType,subject:'Alat dan personel',sourceSignature:'v1',reviewedAt:'2027-01-01'}} as CorrectionCase;
 const other={...finding,id:'SECOND',road:'Ruas lain'};
 assert.match(correctionCreationError(state,finding,[finding,other])??'',/bagian kalibrasi/);
 assert.equal(correctionCreationError(state,finding,[finding,{...other,status:'Ditutup'}]),undefined);
});
test('relink options follow known PCI method and do not infer unknown history',()=>{
 const record={...state.dailyRecords[0],surveyType:'PCI' as const,technicalData:{pciMethod:'AI'}};
 const manual={...record,id:'manual',technicalData:{pciMethod:'Manual'}};
 const unknown={...record,id:'unknown',technicalData:{}};
 const linked={...c,road:record.road,surveyType:'PCI' as const,linkedRecordId:record.id};
 assert.deepEqual(eligibleCorrectionRecords(linked,[record,manual,unknown]).map(r=>r.id),[record.id]);
 assert.equal(eligibleCorrectionRecords({...linked,linkedRecordId:undefined},[record,manual,unknown]).length,3);
});

test('relinking requires clearing technical evidence and proposed values from the previous source',()=>{
 const record=state.dailyRecords[0];
 const draft={...c,road:record.road,surveyType:record.surveyType,ruleChecks:{'Bukti lama':true},ruleNumbers:{'Nilai lama':40},provinceUpdateBa:'BA-LAMA',proposedValue:'9'};
 const before={...state,corrections:[draft]};
 const relinked={...draft,linkedRecordId:record.id,ruleChecks:{},ruleNumbers:{},provinceUpdateBa:'',proposedValue:''};
 for(const key of ['ruleChecks','ruleNumbers','provinceUpdateBa','proposedValue'] as const){
  assert.match(correctionMutationError(before,{...before,corrections:[{...relinked,[key]:draft[key]}]})??'',/Perubahan rekaman sumber/);
 }
 assert.equal(correctionMutationError(before,{...before,corrections:[relinked]}),undefined);
});

test('optional deadlines must be real calendar dates on creation and draft changes',()=>{
 assert.match(check({...c,dueDate:'2026-02-30'})??'',/tanggal kalender/);
 assert.equal(check({...c,dueDate:'2026-02-28'}),undefined);
 const before={...state,corrections:[c]};
 assert.match(correctionMutationError(before,{...before,corrections:[{...c,dueDate:'bad'}]})??'',/tanggal kalender/);
 assert.equal(correctionMutationError(before,{...before,corrections:[{...c,dueDate:'2026-11-26'}]}),undefined);
});
