import { test } from 'node:test';import { strict as assert } from 'node:assert';
import { auditSampleIntegrity } from './auditSampleIntegrity';import {buildAuditSamplePlan,buildDirectorateScopePlan} from './auditSamplePlan';import {samplingRule,type DailySurveyRecord} from './model';
const record={id:'R1',surveyType:'IRI',road:'A',state:'Tercatat'} as DailySurveyRecord;
const base={audit:{level:2 as const,sampleIds:['R1']},records:[record],surveyTypes:['IRI'] as const,routes:['A']};
test('legacy sampel valid tetap terbaca tanpa migrasi destruktif',()=>assert.deepEqual(auditSampleIntegrity(base),[]));
test('rekaman hilang memblokir keputusan',()=>assert.ok(auditSampleIntegrity({...base,records:[]}).some(x=>x.includes('tidak ditemukan'))));
test('sampel di luar ruas memblokir keputusan',()=>assert.ok(auditSampleIntegrity({...base,routes:['B']}).some(x=>x.includes('luar ruas'))));
test('rekaman berubah menjadi ditahan memblokir keputusan',()=>assert.ok(auditSampleIntegrity({...base,records:[{...record,state:'Ditahan'}]}).some(x=>x.includes('Tercatat'))));
test('cakupan multi jenis wajib ada',()=>assert.ok(auditSampleIntegrity({...base,surveyTypes:['IRI','PCI'] as const}).some(x=>x.includes('PCI'))));
test('Lendutan level 2 memilih 5% dari titik individual, bukan 5% rekaman',()=>{const units=Array.from({length:101},(_,i)=>({id:`T${i+1}`,type:'point'}));const r={...record,surveyType:'Lendutan' as const,lengthKm:0,technicalData:{auditUnits:JSON.stringify(units),assetId:'AGG'}} as DailySurveyRecord;const plan=buildAuditSamplePlan({packageId:'P',auditLevel:2,surveyTypes:['Lendutan'],routes:['A'],records:[r]});assert.equal(plan.sampleUnits.length,6);assert.deepEqual(plan.sampleIds,['R1']);assert.equal(plan.coverage.Lendutan?.sourceUnits,101);assert.equal(plan.coverage.Lendutan?.sampleUnits,6);});
test('unit sampel Balai wajib memiliki hasil dan bukti sebelum audit lulus',()=>{const unit={id:'R1::point:T1',sourceRecordId:'R1',surveyType:'IRI' as const,road:'A',unitType:'point' as const,unitKey:'T1',reviewStatus:'Belum Diperiksa' as const};const issues=auditSampleIntegrity({...base,audit:{level:2,sampleIds:['R1'],sampleUnits:[unit]}});assert.ok(issues.some(x=>x.includes('hasil pemeriksaan')));assert.ok(issues.some(x=>x.includes('bukti')));assert.deepEqual(auditSampleIntegrity({...base,audit:{level:2,sampleIds:['R1'],sampleUnits:[{...unit,reviewStatus:'Valid',evidenceReference:'FOTO-1'}]}}),[]);});

// KAK 2026 11.10.5: 1% applies to Jembatan, not all survey categories.
test('audit Direktorat tidak menerapkan 1% secara umum pada non-Jembatan',()=>{
 assert.equal(samplingRule('Jembatan',3).rate,1);
 assert.equal(samplingRule('Lendutan',3).rate,0);
 assert.equal(samplingRule('IRI',3).rate,0);
});
test('pemanggilan sampling Tingkat 3 non-Jembatan langsung dari domain tetap diblokir',()=>{
 const plan=buildAuditSamplePlan({packageId:'P',auditLevel:3,surveyTypes:['IRI'],routes:['A'],records:[{...record,technicalData:{segmentId:'S1'}}]});
 assert.equal(plan.sampleIds.length,0);
 assert.equal(plan.sampleUnits.length,0);
 assert.match(plan.issues.join(' '),/non-Jembatan/);
});
test('paket audit campuran tidak menerbitkan sampel Tingkat 3 secara parsial',()=>{
 const bridge={...record,id:'B1',surveyType:'Jembatan' as const,technicalData:{objectId:'B-01'}} as DailySurveyRecord;
 const plan=buildAuditSamplePlan({packageId:'P',auditLevel:3,surveyTypes:['Jembatan','IRI'],routes:['A'],records:[bridge,{...record,technicalData:{segmentId:'S1'}}]});
 assert.equal(plan.sampleUnits.length,0);
 assert.ok(plan.issues.length);
});

test('Direktorat: cakupan non-Jembatan tidak terbit tanpa referensi dan jumlah unit eksplisit',()=>{
 const r={...record,technicalData:{segmentIds:'S1,S2,S3'}} as DailySurveyRecord;
 const input={packageId:'P',surveyTypes:['IRI'] as const,routes:['A'],records:[r],counts:{IRI:2}};
 const missing=buildDirectorateScopePlan({...input,basisReference:''});
 assert.equal(missing.sampleUnits.length,0);assert.match(missing.issues.join(' '),/Referensi/);
 const invalid=buildDirectorateScopePlan({...input,counts:{IRI:4},basisReference:'BA-01'});
 assert.equal(invalid.sampleUnits.length,0);assert.match(invalid.issues.join(' '),/antara 1 dan 3/);
 const valid=buildDirectorateScopePlan({...input,basisReference:'BA-01'});
 assert.deepEqual(valid.issues,[]);assert.equal(valid.sampleUnits.length,2);assert.equal(valid.coverage.IRI?.sampleUnits,2);
 assert.deepEqual(buildDirectorateScopePlan({...input,basisReference:'BA-01'}).sampleUnits.map(u=>u.id),valid.sampleUnits.map(u=>u.id));
});
test('Direktorat: paket campuran tetap memilih minimal 1% Jembatan dan jumlah non-Jembatan yang ditetapkan',()=>{
 const bridge={...record,id:'B1',surveyType:'Jembatan' as const,technicalData:{objectIds:Array.from({length:101},(_,i)=>`B-${i}`).join(',')}} as DailySurveyRecord;
 const iri={...record,technicalData:{segmentIds:'I-1,I-2'}} as DailySurveyRecord;
 const plan=buildDirectorateScopePlan({packageId:'P',surveyTypes:['Jembatan','IRI'],routes:['A'],records:[bridge,iri],counts:{IRI:1},basisReference:'SURAT-02'});
 assert.deepEqual(plan.issues,[]);assert.equal(plan.coverage.Jembatan?.sampleUnits,2);assert.equal(plan.coverage.IRI?.sampleUnits,1);
});

// The editor must not leave a previously approved audit/BA current after evidence changes.
import { reviseAuditSampleUnit } from './auditSampleRevisions';
import type { OperationalWorkflowState } from './model';
test('Tahap 5: revisi hasil sampel setelah Lulus membuka audit ulang dan menahan penerimaan',()=>{
 const sample={id:'R1::point:T1',sourceRecordId:'R1',surveyType:'IRI' as const,road:'A',unitType:'point' as const,unitKey:'T1',reviewStatus:'Valid' as const,evidenceReference:'FOTO-LAMA'};
 const a1={level:1 as const,status:'Lulus' as const,sampleIds:['R1'],decisionNote:'',baNumber:'BA-1',bridgeTrustScore:0};
 const a2={level:2 as const,status:'Lulus' as const,sampleIds:['R1'],sampleUnits:[sample],decisionNote:'',baNumber:'BA-2',bridgeTrustScore:0};
 const a3={level:3 as const,status:'Lulus' as const,sampleIds:['R1'],decisionNote:'',baNumber:'BA-3',bridgeTrustScore:0};
 const state={audits:[a1,a2,a3],acceptance:{finalReport:true,finalAcceptance:true,terms:[{id:'T3',complete:true},{id:'T4',complete:true}]}} as unknown as OperationalWorkflowState;
 const next=reviseAuditSampleUnit(state,2,sample.id,{reviewStatus:'Tidak Valid'});
 assert.equal(next.audits[1].status,'Dalam Review');
 assert.equal(next.audits[1].requiresReview,true);
 assert.equal(next.audits[1].baNumber,'BA-2');
 assert.equal(next.audits[1].history?.at(-1)?.status,'Lulus');
 assert.equal(next.audits[1].sampleUnits?.[0].reviewStatus,'Tidak Valid');
 assert.equal(next.audits[2].requiresReview,true);
 assert.equal(next.audits[0].status,'Lulus');
 assert.equal(next.acceptance.finalAcceptance,false);
 assert.ok(next.acceptance.terms.every(term=>!term.complete));
 assert.equal(reviseAuditSampleUnit(next,2,sample.id,{reviewStatus:'Tidak Valid'}),next);
});
test('Tahap 5: perubahan bukti sebelum keputusan Lulus tidak mereset tingkat lain',()=>{
 const sample={id:'R1::point:T1',sourceRecordId:'R1',surveyType:'IRI' as const,road:'A',unitType:'point' as const,unitKey:'T1',reviewStatus:'Valid' as const,evidenceReference:'FOTO-1'};
 const audits=[{level:1,status:'Lulus'}, {level:2,status:'Dalam Review',sampleUnits:[sample]}, {level:3,status:'Belum Dimulai'}] as unknown as OperationalWorkflowState['audits'];
 const state={audits,acceptance:{finalReport:false,finalAcceptance:false,terms:[]}} as unknown as OperationalWorkflowState;
 const next=reviseAuditSampleUnit(state,2,sample.id,{evidenceReference:'FOTO-2'});
 assert.equal(next.audits[1].sampleUnits?.[0].evidenceReference,'FOTO-2');
 assert.equal(next.audits[1].requiresReview,undefined);
 assert.equal(next.audits[2],state.audits[2]);
 assert.equal(next.acceptance,state.acceptance);
});

// Revisi besar 1: enforcement of contextual note authoring without inventing approval.
import { noteAuthoringPolicy } from './comments/noteAuthoringPolicy';
test('Direktorat: catatan pengawasan awal Tahap 0,1,3A,3B boleh; Tahap 4 tetap menunggu hasil',()=>{
 const base={role:'Direktorat / Pusat' as const,eligible:true,recipientEligible:true,hasResult:false,hasDailyRecord:false};
 for(const context of ['stage0','stage1','stage3a','stage3b'] as const){
  const allowed=noteAuthoringPolicy({...base,context});
  assert.equal(allowed.canWrite,true,context);assert.equal(allowed.preliminary,true,context);
 }
 assert.equal(noteAuthoringPolicy({...base,context:'stage4'}).canWrite,false);
 assert.equal(noteAuthoringPolicy({...base,context:'stage4',hasResult:true}).canWrite,true);
 assert.equal(noteAuthoringPolicy({...base,context:'stage3a'}).needsRecord,false);
});
test('Catatan Direktorat: Admin dan Penyedia tidak dapat menulis, dan penerima di luar paket ditolak',()=>{
 const base={context:'stage0' as const,eligible:true,recipientEligible:true,hasResult:true,hasDailyRecord:true};
 assert.equal(noteAuthoringPolicy({...base,role:'Admin'}).canWrite,false);
 assert.equal(noteAuthoringPolicy({...base,role:'Penyedia Jasa / Ketua Tim'}).canWrite,false);
 assert.equal(noteAuthoringPolicy({...base,role:'Direktorat / Pusat',recipientEligible:false}).canWrite,false);
 assert.equal(noteAuthoringPolicy({...base,role:'Direktorat / Pusat',eligible:false}).canWrite,false);
 assert.equal(noteAuthoringPolicy({...base,context:'stage3a-field',role:'PIC Balai / Pengguna Jasa',hasResult:false}).canWrite,false);
});

// Revisi Besar 2: requirements vary by audit level and survey scope,
// without fabricating new checklists where the source provides one shared form.
import { auditChecksForScope } from './auditChecklistPolicy';
import { sourceDocument } from './sourceDocumentModel';
test('audit checklist keputusan membedakan kewenangan dan butir visual menurut lingkup survei',()=>{
 const internalIri=auditChecksForScope(1,['IRI']);
 assert.equal(internalIri.length,2);
 assert.equal(internalIri.some(x=>/foto PCI|gambar\/video/i.test(x)),false);
 const internalPci=auditChecksForScope(1,['PCI']);
 assert.equal(internalPci.length,3);
 assert.ok(internalPci.some(x=>/gambar\/video/i.test(x)));
 const balaiIri=auditChecksForScope(2,['IRI']);
 assert.equal(balaiIri.length,3);
 const balaiJembatan=auditChecksForScope(2,['Jembatan']);
 assert.equal(balaiJembatan.length,4);
});
test('audit Direktorat non-Jembatan tidak menagih pernyataan 1 persen Jembatan',()=>{
 const withoutBridge=auditChecksForScope(3,['IRI','Lendutan']);
 assert.equal(withoutBridge.length,2);
 assert.ok(withoutBridge.every(x=>!x.includes('jembatan minimum 1%')));
 const withBridge=auditChecksForScope(3,['IRI','Jembatan']);
 assert.ok(withBridge.some(x=>x.includes('jembatan minimum 1%')));
});
test('source formulir audit sembilan survei sesuai katalog dan tidak dipalsukan menjadi tiga template berbeda',()=>{
 const sources=['IRI','PCI','RNI','Drainase','Lereng','Lalu Lintas','Jembatan'];
 for(const survey of sources){
  const a=sourceDocument(survey,'audit',true,1);
  assert.ok(a,`missing ${survey}`);
  assert.ok(a!.source.trim());
  assert.equal(sourceDocument(survey,'audit',true,2)?.id,a?.id);
  assert.equal(sourceDocument(survey,'audit',true,3)?.id,a?.id);
 }
 const ai=sourceDocument('PCI','audit',false,2);
 const manual=sourceDocument('PCI','audit',true,2);
 assert.ok(ai&&manual&&ai.id!==manual.id);
 assert.ok(sourceDocument('Lendutan','audit',true,1));
 assert.ok(sourceDocument('Lendutan','audit',true,2));
 assert.ok(sourceDocument('Lendutan','audit',true,3));
 const lendutanIds=[1,2,3].map(level=>sourceDocument('Lendutan','audit',true,level)?.id);
 assert.equal(new Set(lendutanIds).size,3);
});

import {auditStatusForDisplay} from './auditChecklistPolicy';
test('status lulus historis yang butuh pemeriksaan ulang tidak tampil sebagai persetujuan aktif',()=>{
 assert.equal(auditStatusForDisplay({status:'Lulus',requiresReview:true}),'Perlu Review Ulang');
 assert.equal(auditStatusForDisplay({status:'Lulus',requiresReview:false}),'Lulus');
 assert.equal(auditStatusForDisplay({status:'Klarifikasi',requiresReview:true}),'Perlu Review Ulang');
});
