import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_WORKFLOW, evaluateProductionTest, evaluateLrsGate, notificationsFor, type DailySurveyRecord, type CorrectionCase } from './model';
import { fieldReadiness, canMarkFinalReport, correctionClosureErrors, applyClosedCorrection, dueScheduledBackup, semesterTwoReadiness, termReadiness, workflowDocumentReferences } from './flowRules';
import { pairStatistics, repeatStatistics, f1 } from './measurements';
import { specialCorrectionErrors } from './correctionRules';
import { PRODUCTION_REFERENCE_CHECKS, dailyChecks, evaluateDailySurvey } from './surveyStandards';

const fresh=()=>{
  const state=structuredClone(INITIAL_WORKFLOW);
  state.productionApproval='Disetujui';
  state.productionApprovalBa='BA-UJI-SIMULASI';
  state.bridgeInspectionPermit=true;
  for(const type of state.project.surveyTypes){
    state.productionTests[type].evidenceReference='BA-UJI-SIMULASI';
    state.productionTests[type].referenceChecks=Object.fromEntries(PRODUCTION_REFERENCE_CHECKS[type].map(key=>[key,true]));
  }
  return state;
};
const record:DailySurveyRecord={id:'TEST-RAW',date:'2027-06-10',time:'08:00',surveyType:'IRI',road:'Medan – Binjai',lengthKm:1,trafficDurationMinutes:0,lane:'1',direction:'Normal',weather:'Cerah',surfaceDry:true,glareFree:true,speedAndLaneCompliant:true,tool:'Profilometer Laser',operator:'Surveyor demo',driver:'Pengemudi demo',poi:'',disturbances:'',eventNotes:'',dailyToolCheck:{},rawValue:'4.5',cleanedValue:'4.5',cleaningReason:'',state:'Tercatat'};
const correction:CorrectionCase={id:'TEST-CASE',source:'Audit tingkat 2',blockedStage:'Audit tingkat 2',road:record.road,stationing:'0+000',rejectionReason:'Bukti pemrosesan perlu diperiksa',severity:'Mayor',owner:'PIC demo',dueDate:'2027-06-12',rootCause:'Pemrosesan',fieldDataValid:'Ya',surveyType:'IRI',actionType:'Koreksi pemrosesan dengan bukti',evidence:'Video dan foto referensi demo',originalValue:'4.5',proposedValue:'4.2',approval:'Disetujui',retest:'Lulus',status:'Verifikasi Ulang',returnStage:'Audit tingkat 2',linkedRecordId:record.id,verification:{surveyor:true,teamLeader:true,balai:true},reviewNote:'Bukti cocok'};

test('baseline delapan jenis dan rentang angka',()=>{
  const state=fresh();
  state.project.surveyTypes.forEach(type=>assert.equal(evaluateProductionTest(type,state.productionTests[type]).passed,true,type));
  assert.equal(evaluateProductionTest('IRI',{...state.productionTests.IRI,coefficientVariation:-1}).passed,false);
  assert.equal(evaluateProductionTest('PCI',{...state.productionTests.PCI,f1After:1.2}).passed,false);
});
test('PCI AI memerlukan enam benchmark, kategori dan lima ulangan',()=>{
  const pci=fresh().productionTests.PCI;
  for(const patch of [{sections:5},{repeats:4},{pciBenchmarkBalanced:false}])assert.equal(evaluateProductionTest('PCI',{...pci,...patch}).passed,false);
  assert.equal(evaluateProductionTest('PCI',{...pci,pciManual:true,f1Before:0,f1After:0,meanAveragePrecision:0}).passed,true);
});
test('bukti sumber wajib; angka jenis lain tidak mempengaruhi IRI; blank aman setelah reload',()=>{
  assert.equal(evaluateProductionTest('IRI',INITIAL_WORKFLOW.productionTests.IRI).passed,false);
  const iri=fresh().productionTests.IRI;
  assert.equal(evaluateProductionTest('IRI',{...iri,f1After:-5,fwdLoad:-1}).passed,true);
  assert.equal(evaluateProductionTest('IRI',{...iri,sectionLengthKm:.6}).passed,false);
  const blank=JSON.parse(JSON.stringify({...iri,coefficientVariation:NaN}));
  assert.equal(evaluateProductionTest('IRI',blank).passed,false);
});
test('PCI manual tetap harus memenuhi ground truth, bukan F1/SD AI',()=>{
  const pci={...fresh().productionTests.PCI,pciManual:true,standardDeviation:99,f1After:-1};
  assert.equal(evaluateProductionTest('PCI',pci).passed,true);
  assert.equal(evaluateProductionTest('PCI',{...pci,segmentsWithinFive:50}).passed,false);
  assert.equal(evaluateProductionTest('PCI',{...pci,segmentsAtLeastFifteen:13}).passed,false);
});
test('LWD bukan FWD; korelasi 3 titik dan pengulangan diperiksa',()=>{
  const lwd={...fresh().productionTests.Lendutan,deflectionMethod:'LWD' as const,fwdLoad:10,lwdCorrelationPoints:3,lwdRepeats:3,lwdDifferenceMicrons:19,lwdDifferencePercent:12};
  assert.equal(evaluateProductionTest('Lendutan',lwd).passed,true);
  assert.equal(evaluateProductionTest('Lendutan',{...lwd,lwdCorrelationPoints:2}).passed,false);
  assert.equal(evaluateProductionTest('Lendutan',{...lwd,lwdDifferenceMicrons:20}).passed,false);
});
test('IRI harian memeriksa personel, pemanasan, kecepatan dan kelas alat',()=>{
  const r={...record,technicalData:{assetId:'STA-01',longitude:'98',latitude:'3',evidence:'RAW-DEMO',iriClass:'Kelas 1',crew:'3',recorder:'Pencatat',targetSpeed:'50',actualSpeed:'52.5',longWarmup:'Tidak',warmup:'5'}};
  r.dailyToolCheck=Object.fromEntries(dailyChecks(r).map(k=>[k,true]));
  assert.deepEqual(evaluateDailySurvey(r),[]);
  assert.ok(evaluateDailySurvey({...r,technicalData:{...r.technicalData,actualSpeed:'53'}}).length);
  assert.ok(evaluateDailySurvey({...r,weather:'Hujan'}).length);
  assert.deepEqual(evaluateDailySurvey({...r,weather:'Hujan',technicalData:{...r.technicalData,longWarmup:'Ya',warmup:'15'}}),[]);
  assert.equal(dailyChecks({...r,technicalData:{iriClass:'Kelas 3'}}).includes('Bounce test'),false);
});
test('lalu lintas memisahkan data hilang dari volume nol, hujan bukan blok umum',()=>{
  const r={...record,surveyType:'Lalu Lintas' as const,tool:'Traffic Counter',lengthKm:0,weather:'Hujan' as const,rawValue:'0',trafficDurationMinutes:85,technicalData:{assetId:'POS-1',longitude:'98',latitude:'3',evidence:'RAW',trafficMethod:'Durasi pendek',classification:'BM',plannedMinutes:'100',maxGap:'15',logbook:'LOG'}};
  r.dailyToolCheck=Object.fromEntries(dailyChecks(r).map(k=>[k,true]));
  assert.deepEqual(evaluateDailySurvey(r),[]);
  assert.ok(evaluateDailySurvey({...r,trafficDurationMinutes:84}).length);
  assert.ok(evaluateDailySurvey({...r,technicalData:{...r.technicalData,maxGap:'120'}}).length);
});
test('RNI menggunakan decameter dan formulir sumber 42 parameter',()=>{
  const r={...record,surveyType:'RNI' as const,tool:'Video Log',technicalData:{assetId:'LINK-1',longitude:'98',latitude:'3',evidence:'RAW',fromSta:'0',toSta:'100',laneCode:'L1',surfaceType:'21',surfaceYear:'2026',laneWidth:'3.5',surfaceWidth:'7',inventoryForm:'RNI-42'}};
  r.dailyToolCheck=Object.fromEntries(dailyChecks(r).map(k=>[k,true]));
  assert.deepEqual(evaluateDailySurvey(r),[]);
  assert.ok(evaluateDailySurvey({...r,lengthKm:100}).length);
});
test('LWD harian memerlukan seating, tiga pengukuran dan konfigurasi sensor',()=>{
  const r={...record,surveyType:'Lendutan' as const,tool:'LWD',lengthKm:0,technicalData:{assetId:'LWD-1',longitude:'98',latitude:'3',evidence:'RAW',method:'LWD',station:'5',temperature:'35',drops:'5',load:'12',slope:'4',geophones:'0,200,900',repeatDifferenceMicrons:'19',repeatDifferencePercent:'11'}};
  r.dailyToolCheck=Object.fromEntries(dailyChecks(r).map(k=>[k,true]));
  assert.deepEqual(evaluateDailySurvey(r),[]);
  assert.ok(evaluateDailySurvey({...r,technicalData:{...r.technicalData,drops:'4'}}).length);
  assert.ok(evaluateDailySurvey({...r,technicalData:{...r.technicalData,geophones:'0,200'}}).length);
});
test('jembatan khusus memerlukan rencana khusus dan objek tidak dipaksa memiliki km',()=>{
  const r={...record,surveyType:'Jembatan' as const,tool:'Formulir Survei',lengthKm:0,weather:'Hujan' as const,technicalData:{assetId:'BR-1',longitude:'98',latitude:'3',evidence:'FOTO',inspection:'Khusus',condition:'2',elementForm:'EL-1',specialPlan:'NDT-PLAN'}};
  r.dailyToolCheck=Object.fromEntries(dailyChecks(r).map(k=>[k,true]));
  assert.deepEqual(evaluateDailySurvey(r),[]);
  assert.ok(evaluateDailySurvey({...r,technicalData:{...r.technicalData,specialPlan:''}}).length);
});
test('lereng: urutan KM, keunikan ID inventarisasi dan rujukan inspeksi',()=>{
  const r={...record,surveyType:'Lereng' as const,tool:'GPS Navigasi',lengthKm:0,slopeFailureType:'Longsoran',technicalData:{assetId:'SL-1',longitude:'98',latitude:'3',evidence:'FOTO',activity:'Inventarisasi baru',kmStart:'5',kmEnd:'5.1',middleCoordinate:'98.001,3.001',endCoordinate:'98.002,3.002',riskForm:'RISK'}};
  r.dailyToolCheck=Object.fromEntries(dailyChecks(r).map(k=>[k,true]));
  assert.deepEqual(evaluateDailySurvey(r),[]);
  assert.ok(evaluateDailySurvey(r,[{...r,id:'EXISTING'}]).length);
  assert.ok(evaluateDailySurvey({...r,technicalData:{...r.technicalData,activity:'Inspeksi rutin'}}).length);
});
test('PCI harian manual tidak memakai larangan silau umum, tetapi nilai PCI dibatasi',()=>{
  const r={...record,surveyType:'PCI' as const,tool:'Formulir Survei',glareFree:false,technicalData:{assetId:'PCI-1',longitude:'98',latitude:'3',evidence:'FORM',pciMethod:'Manual',pci:'100',sampleUnit:'SU-1',distressForm:'DISTRESS'}};
  r.dailyToolCheck=Object.fromEntries(dailyChecks(r).map(k=>[k,true]));
  assert.deepEqual(evaluateDailySurvey(r),[]);
  assert.ok(evaluateDailySurvey({...r,technicalData:{...r.technicalData,pci:'101'}}).length);
});
test('laporan jembatan dan LRS drainase adalah gerbang nyata',()=>{
  const s=fresh();assert.equal(evaluateProductionTest('Jembatan',{...s.productionTests.Jembatan,bridgeTrialReportComplete:false}).passed,false);
  assert.equal(evaluateProductionTest('Drainase',{...s.productionTests.Drainase,stationingConsistent:false}).passed,false);
});
test('gerbang akhir periode, PIC, lokasi dan cakupan jembatan',()=>{
  const s=fresh();s.project.surveyTypes=['IRI'];s.dailyRecords=[record];
  assert.ok(fieldReadiness(s).length);
  Object.assign(s.cycle,{certificateId:'BA-DEMO',periodCompleted:true,userReview:'Sesuai',finalPeriodValidation:true,finalValidationLocation:'Lokasi kontrol',finalToolUnchanged:true});
  assert.deepEqual(fieldReadiness(s),[]);
  s.project.surveyTypes.push('Jembatan');s.dailyRecords.push({...record,id:'BRIDGE',surveyType:'Jembatan'});
  s.cycle.bridgeValidatedPercent=9;s.cycle.bridgeValidationReport='FRM-02-DEMO';
  assert.ok(fieldReadiness(s).some(m=>m.includes('≥10%')));
  s.cycle.bridgeValidatedPercent=10;assert.deepEqual(fieldReadiness(s),[]);
});
test('upload mengharuskan ikatan koordinat LRS dan Glossary',()=>{
  const s=fresh();Object.assign(s.submission,{rniValidatedDate:'2027-06-03'});
  assert.equal(evaluateLrsGate(s.submission,s.simulationDate).passed,false);
  Object.assign(s.submission,{coordinatesBoundToLrs:true,formatGlossaryCompliant:true});
  assert.equal(evaluateLrsGate(s.submission,s.simulationDate).passed,true);
});
test('laporan akhir tidak menunggu T4 yang memerlukannya',()=>{
  const s=fresh();s.acceptance.terms=s.acceptance.terms.map(t=>({...t,complete:t.id!=='T4'}));
  s.audits=s.audits.map(a=>({...a,status:'Lulus'})) as typeof s.audits;
  s.acceptance.semesterTwoEvidence={calibrationDate:'',calibrationReference:'',validationDate:'',validationReference:'',uploadDate:'',uploadValid:false,objectionsClosed:false,finalReportReference:'LAP-AKHIR-DEMO'};
  assert.equal(canMarkFinalReport(s),true);
});
test('Semester I tidak dapat dianggap sebagai siklus Semester II',()=>{
  const s=fresh();s.acceptance.semesterTwoRevalidation=true;
  assert.ok(semesterTwoReadiness(s).length);assert.ok(termReadiness(s,'T4').length);
});
test('bukti Semester II ditopang kalibrasi, uji baru dan rekaman',()=>{
  const s=fresh();s.simulationDate='2027-11-28';
  s.acceptance.semesterTwoEvidence={calibrationDate:'2027-07-01',calibrationReference:'CAL-II',validationDate:'2027-07-02',validationReference:'BA-II',uploadDate:'2027-11-20',uploadValid:true,objectionsClosed:true,finalReportReference:'LAP-II'};
  s.calibrations[0].lastCalibrated='2027-07-01';s.productionTestDates={IRI:'2027-07-02'};
  s.dailyRecords=[{...record,date:'2027-07-03'}];
  assert.deepEqual(semesterTwoReadiness(s),[]);
  s.productionTestDates.IRI='2027-06-10';assert.ok(semesterTwoReadiness(s).length);
});
test('koreksi diterapkan pada cleaned saja; persetujuan lama tidak bertahan',()=>{
  const s=fresh();s.dailyRecords=[structuredClone(record)];s.corrections=[correction];s.submission.validationStatus='VALID';s.acceptance.finalAcceptance=true;
  assert.deepEqual(correctionClosureErrors(s,correction),[]);
  const next=applyClosedCorrection(s,correction);
  assert.equal(next.dailyRecords[0].rawValue,'4.5');assert.equal(next.dailyRecords[0].cleanedValue,'4.2');
  assert.equal(s.dailyRecords[0].cleanedValue,'4.5');assert.equal(next.submission.validationStatus,'Draft');assert.equal(next.acceptance.finalAcceptance,false);
  assert.equal(next.corrections[0].status,'Ditutup');assert.ok(next.dailyRecords[0].cleaningReason.includes(correction.id));
});
test('raw tidak cocok atau verifikasi tidak lengkap menahan penutupan',()=>{
  const s=fresh();s.dailyRecords=[record];
  assert.ok(correctionClosureErrors(s,{...correction,originalValue:'9'}).length);
  assert.ok(correctionClosureErrors(s,{...correction,verification:{surveyor:true,teamLeader:false,balai:false}}).length);
  assert.throws(()=>applyClosedCorrection(s,{...correction,retest:'Gagal'}));
});
test('aturan khusus IRI, lendutan dan pemutakhiran jembatan',()=>{
  assert.ok(specialCorrectionErrors({...correction,rejectionReason:'speedhump'}).length);
  assert.ok(specialCorrectionErrors({...correction,ruleScenario:'Speedhump / oprit / jembatan',ruleChecks:{'Raw 10 m tetap utuh':true},ruleNumbers:{'Panjang dieliminasi per 100 m':41,'Sisa panjang valid (m)':59}}).length);
  assert.deepEqual(specialCorrectionErrors({...correction,ruleScenario:'Speedhump / oprit / jembatan',ruleChecks:{'Raw 10 m tetap utuh':true,'Segmen <60 m ditandai dan tidak dirata-ratakan':true},ruleNumbers:{'Panjang dieliminasi per 100 m':40,'Sisa panjang valid (m)':59}}),[]);
  assert.ok(specialCorrectionErrors({...correction,surveyType:'Lendutan',ruleScenario:'Nilai ekstrem',ruleNumbers:{'Jumlah konfirmasi':2}}).length);
  assert.ok(specialCorrectionErrors({...correction,surveyType:'Jembatan',ruleScenario:'Pemutakhiran setelah verval Direktorat',ruleChecks:{'Bencana / FHO dan perubahan dijelaskan':true}}).length);
});
test('statistik dihitung dari pengamatan; masukan rusak ditolak',()=>{
  const p=pairStatistics('1,1.1\n2,2.1\n3,3.1');assert.ok(Math.abs(p.coefficientA-1)<1e-9);assert.ok(Math.abs(p.coefficientB-.1)<1e-9);assert.ok(p.rSquared>.999);
  assert.deepEqual(repeatStatistics([2,2,2]),{mean:2,standardDeviation:0,coefficientVariation:0});
  assert.equal(f1(90,5,5),180/190);assert.throws(()=>pairStatistics('1,2\n1,2'));assert.throws(()=>repeatStatistics([0,0]));assert.throws(()=>f1(-1,0,0));
});
test('jadwal backup memerlukan multi-media dan tidak menggandakan snapshot',()=>{
  const s=fresh();s.backupSchedule={enabled:true,intervalDays:7,nextDate:s.simulationDate,media:['Perangkat kerja']};
  assert.equal(dueScheduledBackup(s),s);s.backupSchedule.media.push('Media eksternal');
  const next=dueScheduledBackup(s);assert.equal(next.backups.length,1);assert.equal(next.backupSchedule?.nextDate,'2027-06-17');assert.equal(dueScheduledBackup(next),next);
});
test('pengingat kasus dan milestone semester; referensi dokumen mengikuti status',()=>{
  const s=fresh();s.corrections=[{...correction,status:'Terbuka'}];
  assert.ok(notificationsFor(s).some(n=>n.id===`correction-${correction.id}`));assert.ok(notificationsFor(s).some(n=>n.id==='semester-one-upload'));
  s.simulationDate='2027-11-14';assert.ok(notificationsFor(s).some(n=>n.id==='semester-two-upload'));
  s.productionApproval='Draft';assert.equal(workflowDocumentReferences(s).find(r=>r.name==='BA Persetujuan Alat & Metode')?.status,'Draft');
});
