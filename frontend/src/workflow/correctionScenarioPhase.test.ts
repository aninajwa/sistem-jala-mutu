import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoWorkflow } from './demoScenario';
import { correctionProposalScenarioErrors, visibleProposalScenarioChecks, updateProposalScenarioCheck } from './correctionRules';
import { correctionExecutionErrors, type CorrectionExecution } from './correctionFormEngine';
const state = createDemoWorkflow('verval-finding');
const c = {...state.corrections[0], surveyType:'IRI' as const, rejectionReason:'kehilangan data', ruleScenario:'Kehilangan data / underspeed', actionType:'Survei ulang sebagian ruas', ruleChecks:{}, ruleNumbers:{}};
const result:CorrectionExecution={date:'2026-11-25',summary:'Survei ulang',sourceReference:'NEW',period:String(c.cyclePeriod??1),lane:'1',equipment:'IRI-1',verificationReference:'TEST',actionFields:{coverage:'STA 0+000–0+100',newRecord:'NEW'},evidenceKeys:[`${state.project.id}::correction::${c.id}::execution:documents:1`],evidenceNote:''};
test('usulan survei ulang tidak perlu mengaku sudah dilaksanakan',()=>assert.deepEqual(correctionProposalScenarioErrors(c),[]));
test('hasil survei ulang tetap harus memenuhi checklist teknis siklus berjalan',()=>{
 assert.ok(correctionExecutionErrors(c,result,state.project.id).length);
 assert.ok(correctionExecutionErrors({...c,ruleChecks:{'Survei ulang dilakukan saat lalu lintas normal':true},ruleNumbers:{'Data valid hilang per 100 m':0,'Jumlah survei ulang':1}},result,state.project.id).length);
 assert.deepEqual(correctionExecutionErrors(c,{...result,scenarioChecks:{'Survei ulang dilakukan saat lalu lintas normal':true},scenarioNumbers:{'Data valid hilang per 100 m':0,'Jumlah survei ulang':1}},state.project.id),[]);
});
test('prasyarat koreksi pemrosesan tidak dipindah ke pelaksanaan',()=>assert.ok(correctionProposalScenarioErrors({...c,actionType:'Koreksi pemrosesan dengan bukti'}).length));

test('IRI kemacetan requires new survey at a different time, not processing correction',()=>{
 const traffic={...c,rejectionReason:'underspeed akibat kemacetan',ruleScenario:'Kemacetan / kendaraan parkir IRI'};
 assert.deepEqual(correctionProposalScenarioErrors(traffic),[]);
 assert.ok(correctionProposalScenarioErrors({...traffic,actionType:'Koreksi pemrosesan dengan bukti'}).length);
 assert.ok(correctionExecutionErrors(traffic,result,state.project.id).length);
 assert.deepEqual(correctionExecutionErrors(traffic,{...result,scenarioChecks:{'Survei ulang pada waktu berbeda saat lalu lintas normal':true}},state.project.id),[]);
});
test('scenario rejects truthy non-boolean evidence and fractional survey counts',()=>{
 const checks={'Survei ulang dilakukan saat lalu lintas normal':true};
 const numbers={'Data valid hilang per 100 m':0,'Jumlah survei ulang':1};
 assert.ok(correctionExecutionErrors(c,{...result,scenarioChecks:{...checks,'Survei ulang dilakukan saat lalu lintas normal':'false' as unknown as boolean},scenarioNumbers:numbers},state.project.id).length);
 assert.ok(correctionExecutionErrors(c,{...result,scenarioChecks:checks,scenarioNumbers:{...numbers,'Jumlah survei ulang':1.5}},state.project.id).length);
});

test('underspeed geometrik memerlukan survei ulang untuk anomali yang tidak dapat ditentukan visual',()=>{
 const geometry={...c,rejectionReason:'underspeed akibat tikungan dengan anomali',ruleScenario:'Underspeed / anomali geometrik'};
 assert.deepEqual(correctionProposalScenarioErrors(geometry),[]);
 assert.ok(correctionProposalScenarioErrors({...geometry,actionType:'Koreksi pemrosesan dengan bukti'}).length);
 assert.ok(correctionProposalScenarioErrors({...geometry,actionType:'Penilaian ulang'}).length);
 assert.deepEqual(correctionExecutionErrors(geometry,{...result,scenarioChecks:{'Anomali tidak dapat ditentukan secara visual':true,'Survei ulang lokasi dilakukan':true}},state.project.id),[]);
});
test('underspeed jalan rusak berat requires visual evidence and classification above 12',()=>{
 const damaged={...c,rejectionReason:'underspeed jalan rusak berat',ruleScenario:'Underspeed / jalan rusak berat',actionType:'Koreksi pemrosesan dengan bukti',ruleChecks:{'Kerusakan berat dikonfirmasi melalui bukti visual':true,'Raw IRI tidak diubah':true},ruleNumbers:{'Nilai klasifikasi IRI (m/km)':13}};
 assert.deepEqual(correctionProposalScenarioErrors(damaged),[]);
 assert.ok(correctionProposalScenarioErrors({...damaged,ruleNumbers:{'Nilai klasifikasi IRI (m/km)':12}}).length);
 assert.ok(correctionProposalScenarioErrors({...damaged,ruleChecks:{}}).length);
});
test('longsor requires pavement impact, GIS length, preserved raw and recomputation',()=>{
 const slide={...c,rejectionReason:'longsor',ruleScenario:'Longsor',actionType:'Koreksi pemrosesan dengan bukti',ruleChecks:{'Longsoran mengenai perkerasan jalan':true,'Raw IRI tidak diubah':true,'Rata-rata IRI per 100 m dihitung ulang':true},ruleNumbers:{'Nilai klasifikasi IRI (m/km)':13,'Panjang longsor via GIS (m)':25}};
 assert.deepEqual(correctionProposalScenarioErrors(slide),[]);
 assert.ok(correctionProposalScenarioErrors({...slide,ruleChecks:{...slide.ruleChecks,'Longsoran mengenai perkerasan jalan':false}}).length);
 assert.ok(correctionProposalScenarioErrors({...slide,ruleNumbers:{...slide.ruleNumbers,'Panjang longsor via GIS (m)':0}}).length);
});

 test('data IRI hilang dipisahkan dari underspeed tanpa penyebab',()=>{
 const missing={...c,ruleScenario:'Kehilangan data IRI',actionType:'Koreksi pemrosesan dengan bukti',ruleChecks:{'Survei ulang dilakukan':true,'Data raw IRI tetap utuh':true},ruleNumbers:{'Data valid hilang per 100 m':1,'Jumlah survei ulang':1}};
 assert.deepEqual(correctionProposalScenarioErrors(missing),[]);
 assert.ok(correctionProposalScenarioErrors({...missing,ruleNumbers:{...missing.ruleNumbers,'Jumlah survei ulang':0}}).length);
 assert.ok(correctionProposalScenarioErrors({...missing,ruleNumbers:{...missing.ruleNumbers,'Data valid hilang per 100 m':0}}).length);
 assert.ok(correctionProposalScenarioErrors({...missing,rejectionReason:'underspeed',ruleScenario:'Kehilangan data / underspeed'}).length);
 assert.deepEqual(correctionProposalScenarioErrors({...missing,actionType:'Survei ulang sebagian ruas',ruleChecks:{},ruleNumbers:{}}),[]);
 });

test('beban FWD menerima batas 36 dan 44 kN tetapi menolak hasil di luar rentang',()=>{
 const load={...c,surveyType:'Lendutan' as const,rejectionReason:'beban FWD',ruleScenario:'Beban FWD'};
 assert.deepEqual(correctionProposalScenarioErrors(load),[]);
 assert.ok(correctionProposalScenarioErrors({...load,actionType:'Koreksi pemrosesan dengan bukti'}).length);
 const execution={...result,equipment:'FWD-1',scenarioChecks:{'Pengujian ulang dilakukan':true,'Data temperatur tidak dimodifikasi':true}};
 for(const value of [36,44]) assert.deepEqual(correctionExecutionErrors(load,{...execution,scenarioNumbers:{'Beban hasil uji ulang (kN)':value}},state.project.id),[]);
 for(const value of [35.99,44.01]) assert.ok(correctionExecutionErrors(load,{...execution,scenarioNumbers:{'Beban hasil uji ulang (kN)':value}},state.project.id).length);
});

test('deflection bowl memerlukan sembilan nilai yang menurun ketat',()=>{
 const bowl={...c,surveyType:'Lendutan' as const,rejectionReason:'deflection bowl',ruleScenario:'Deflection bowl'};
 const execution={...result,equipment:'FWD-1',scenarioChecks:{'Pengujian ulang sekitar titik asal dilakukan':true,'Data temperatur tidak dimodifikasi':true},scenarioNumbers:Object.fromEntries(Array.from({length:9},(_,i)=>[`D${i} hasil uji ulang`,9-i]))};
 assert.deepEqual(correctionProposalScenarioErrors(bowl),[]);
 assert.deepEqual(correctionExecutionErrors(bowl,execution,state.project.id),[]);
 assert.ok(correctionExecutionErrors(bowl,{...execution,scenarioNumbers:{...execution.scenarioNumbers,'D1 hasil uji ulang':9}},state.project.id).length);
});

test('PCI hujan menunggu hujan reda dan genangan relatif hilang',()=>{
 const rain={...c,surveyType:'PCI' as const,rejectionReason:'hujan dan genangan',ruleScenario:'Hujan / genangan'};
 assert.deepEqual(correctionProposalScenarioErrors(rain),[]);
 assert.ok(correctionProposalScenarioErrors({...rain,actionType:'Koreksi pemrosesan dengan bukti'}).length);
 assert.ok(correctionProposalScenarioErrors({...rain,actionType:'Penilaian ulang'}).length);
});
test('PCI alur memerlukan pengukuran langsung dan nilai kedalaman, bukan foto saja',()=>{
 const rut={...c,surveyType:'PCI' as const,rejectionReason:'alur',ruleScenario:'Alur / amblas'};
 assert.deepEqual(correctionProposalScenarioErrors(rut),[]);
 assert.ok(correctionProposalScenarioErrors({...rut,actionType:'Koreksi pemrosesan dengan bukti',ruleChecks:{'Pengukuran fisik straight edge / laser profilometer tercatat':true}}).length);
 assert.deepEqual(correctionProposalScenarioErrors({...rut,actionType:'Koreksi pemrosesan dengan bukti',ruleChecks:{'Pengukuran fisik straight edge / laser profilometer tercatat':true},ruleNumbers:{'Kedalaman alur hasil pengukuran langsung (mm)':8}}),[]);
 const execution={...result,actionFields:{...result.actionFields,pciMethod:'Manual',pciRaterReference:'CHECK'},scenarioChecks:{'Pengukuran fisik straight edge / laser profilometer tercatat':true}};
 assert.ok(correctionExecutionErrors(rut,execution,state.project.id).length);
 assert.deepEqual(correctionExecutionErrors(rut,{...execution,scenarioNumbers:{'Kedalaman alur hasil pengukuran langsung (mm)':8}},state.project.id),[]);
});


test('PCI macet memperbolehkan evaluasi kondisi tanpa pembanding IRI',()=>{
 const traffic={...c,surveyType:'PCI' as const,rejectionReason:'macet',ruleScenario:'Macet / kendaraan parkir',ruleChecks:{'Kondisi lokasi ditinjau dan dicatat':true}};
 assert.deepEqual(correctionProposalScenarioErrors(traffic),[]);
 assert.ok(correctionProposalScenarioErrors({...traffic,ruleChecks:{}}).length);
});
test('pembanding IRI untuk PCI macet memerlukan STA sama, kondisi normal dan catatan',()=>{
 const traffic={...c,surveyType:'PCI' as const,rejectionReason:'kendaraan parkir',ruleScenario:'Macet / kendaraan parkir',ruleChecks:{'Kondisi lokasi ditinjau dan dicatat':true,'Menggunakan IRI sebagai pembanding':true,'IRI pada STA yang sama':true,'IRI direkam tanpa kemacetan atau kendaraan parkir':true,'Catatan pembandingan IRI tersedia':true}};
 assert.deepEqual(correctionProposalScenarioErrors(traffic),[]);
 for(const key of ['IRI pada STA yang sama','IRI direkam tanpa kemacetan atau kendaraan parkir','Catatan pembandingan IRI tersedia']) assert.ok(correctionProposalScenarioErrors({...traffic,ruleChecks:{...traffic.ruleChecks,[key]:false}}).length);
 assert.ok(correctionProposalScenarioErrors({...traffic,ruleChecks:{...traffic.ruleChecks,'Menggunakan IRI sebagai pembanding':false}}).length);
});

test('PCI pembanding opsional: hanya tampil saat dipilih, reset bukti ketika dibatalkan',()=>{
 const traffic={...c,surveyType:'PCI' as const,rejectionReason:'macet',ruleScenario:'Macet / kendaraan parkir',ruleChecks:{'Kondisi lokasi ditinjau dan dicatat':true,'Menggunakan IRI sebagai pembanding':true,'IRI pada STA yang sama':true,'IRI direkam tanpa kemacetan atau kendaraan parkir':true,'Catatan pembandingan IRI tersedia':true}};
 assert.equal(visibleProposalScenarioChecks(traffic).length,5);
 const cleared={...traffic,ruleChecks:updateProposalScenarioCheck(traffic,'Menggunakan IRI sebagai pembanding',false)};
 assert.equal(visibleProposalScenarioChecks(cleared).length,2);
 assert.deepEqual(correctionProposalScenarioErrors(cleared),[]);
 const restored={...cleared,ruleChecks:updateProposalScenarioCheck(cleared,'Menggunakan IRI sebagai pembanding',true)};
 assert.ok(correctionProposalScenarioErrors(restored).length);
});
