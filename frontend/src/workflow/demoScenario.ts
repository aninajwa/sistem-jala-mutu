import {
  CYCLE_PROTOCOLS,
  CYCLE_SHARED_PROTOCOLS,
  INITIAL_WORKFLOW,
  PREPARATION_COORDINATION,
  PREPARATION_DOCUMENTS,
  PREPARATION_FIELD_PLAN,
  PREPARATION_SOURCE_REVIEWS,
  SUBMISSION_DOCUMENTS,
  type CorrectionCase,
  type DailySurveyRecord,
  type OperationalWorkflowState,
  type SurveyType,
  type WorkflowRole,
} from './model';
import { PRODUCTION_REFERENCE_CHECKS } from './surveyStandards';

export type DemoCheckpointId =
  | 'start'
  | 'prep-review'
  | 'calibration-production'
  | 'daily-survey'
  | 'verval-finding'
  | 'correction-provider'
  | 'stage4-ready'
  | 'audit1-provider'
  | 'audit2-balai'
  | 'audit3-directorate'
  | 'acceptance-balai'
  | 'complete';

export type DemoCheckpoint = {
  id: DemoCheckpointId;
  order: number;
  stage: string;
  actor: WorkflowRole;
  title: string;
  detail: string;
  selection: string;
};

export const DEMO_CHECKPOINTS: DemoCheckpoint[] = [
  {id:'start',order:0,stage:'Tahap 0',actor:'Penyedia Jasa / Ketua Tim',title:'Mulai paket & lengkapi persiapan',detail:'Penyedia menyiapkan survei pendahuluan, dokumen awal, Program Mutu, RKK/SMKK, dan Laporan Pendahuluan.',selection:'/entry:Persiapan & SPMK'},
  {id:'prep-review',order:1,stage:'Tahap 0',actor:'PIC Balai / Pengguna Jasa',title:'Review Laporan Pendahuluan',detail:'Balai meninjau hasil persiapan Penyedia dan memberi keputusan sebelum alat/metode dipakai.',selection:'/entry:Persiapan & SPMK'},
  {id:'calibration-production',order:2,stage:'Tahap 1–2',actor:'Penyedia Jasa / Ketua Tim',title:'Kalibrasi, personel & uji produksi',detail:'Penyedia melengkapi kesiapan alat/personel lalu menyiapkan hasil uji coba beserta evidence untuk review Balai.',selection:'/entry:Validasi produksi'},
  {id:'daily-survey',order:3,stage:'Tahap 3A',actor:'Penyedia Jasa / Ketua Tim',title:'Survei harian berjalan',detail:'Data kegiatan harian tersedia dari source/mock; Penyedia melengkapi bukti QA/QC, pemeriksaan alat dan faktor pengganggu.',selection:'/entry:Survei harian'},
  {id:'verval-finding',order:4,stage:'Tahap 3B',actor:'PIC Balai / Pengguna Jasa',title:'Verval 14 hari menemukan ketidaksesuaian',detail:'Balai melihat repeatability tidak sesuai pada IRI, menahan rekaman terkait, dan membuka temuan.',selection:'/verification:Verval 14 hari'},
  {id:'correction-provider',order:5,stage:'Tindakan Perbaikan',actor:'Penyedia Jasa / Ketua Tim',title:'Penyedia menindaklanjuti temuan',detail:'Penyedia mencatat akar masalah, tindakan, evidence, dan hasil uji ulang. Data sumber tidak diubah langsung di JALA MUTU.',selection:'/actions:Koreksi berbukti'},
  {id:'stage4-ready',order:6,stage:'Tahap 4',actor:'Penyedia Jasa / Ketua Tim',title:'Temuan selesai & paket data siap',detail:'Temuan sudah diverifikasi Balai, verval dinyatakan sesuai, dan paket melewati gerbang RNI/LRS.',selection:'/entry:Gerbang RNI/LRS'},
  {id:'audit1-provider',order:7,stage:'Tahap 5',actor:'Penyedia Jasa / Ketua Tim',title:'Bukti kesiapan Audit Tingkat 1',detail:'Penyedia mencatat bukti audit internal/kesiapan sebelum paket masuk assurance formal Balai.',selection:'/verification:Audit tingkat 1–3'},
  {id:'audit2-balai',order:8,stage:'Tahap 5',actor:'PIC Balai / Pengguna Jasa',title:'Audit Tingkat 2 oleh Balai',detail:'Balai melakukan sampling, klarifikasi, checklist audit, dan keputusan/BA sesuai kewenangannya.',selection:'/verification:Audit tingkat 1–3'},
  {id:'audit3-directorate',order:9,stage:'Tahap 5',actor:'Direktorat / Pusat',title:'Audit Tingkat 3 oleh Direktorat',detail:'Direktorat menilai hasil yang telah melalui Balai dan menyelesaikan audit tingkat pusat.',selection:'/verification:Audit tingkat 1–3'},
  {id:'acceptance-balai',order:10,stage:'Tahap 6',actor:'PIC Balai / Pengguna Jasa',title:'Penerimaan data oleh Balai',detail:'Balai menilai kriteria penerimaan dan menerbitkan BA penerimaan parsial/akhir bila seluruh syarat terpenuhi.',selection:'/reports:Penerimaan & termin'},
  {id:'complete',order:11,stage:'Selesai',actor:'Direktorat / Pusat',title:'Paket diterima & dimonitor',detail:'Seluruh audit dan penerimaan selesai. Direktorat memantau status akhir; dokumen dan riwayat tetap dapat ditelusuri.',selection:'/reports:Penerimaan & termin'},
];

const DEMO_TYPES: SurveyType[] = ['IRI','PCI','Jembatan','Drainase','RNI'];
const DEMO_ROAD = 'Medan – Binjai';

const cloneInitial = (): OperationalWorkflowState => JSON.parse(JSON.stringify(INITIAL_WORKFLOW)) as OperationalWorkflowState;
const checked = (keys: readonly string[]) => Object.fromEntries(keys.map(key=>[key,true]));

function approvedPreparation(state: OperationalWorkflowState){
  state.project.preparation = {
    sourceReviews: checked(PREPARATION_SOURCE_REVIEWS),
    fieldPlan: checked(PREPARATION_FIELD_PLAN),
    coordination: checked(PREPARATION_COORDINATION),
    documents: checked(PREPARATION_DOCUMENTS),
    reportApproval: 'Disetujui',
    reviewerNote: 'Disetujui untuk melanjutkan kesiapan alat, personel, dan validasi produksi.',
  };
}

function productionReady(state: OperationalWorkflowState){
  state.project.surveyTypes = [...DEMO_TYPES];
  state.calibrationChecklist = Object.fromEntries(state.project.surveyTypes.map(type=>[type,true])) as OperationalWorkflowState['calibrationChecklist'];
  state.calibrations = [
    {...state.calibrations[0], id:'CAL-DEMO-IRI', surveyType:'IRI', dueDate:'2027-12-31', condition:'Baik', qualificationValid:true, trainingVerified:true, certificateReference:'CERT-IRI-DEMO-001'},
    {id:'CAL-DEMO-CAM',equipment:'Kamera Survei',surveyType:'PCI',serialNumber:'CAM-2027-014',year:2027,condition:'Baik',calibrationKind:'Referensi tahunan',lastCalibrated:'2027-02-15',dueDate:'2028-02-15',personInCharge:'R. Wijaya',qualificationValid:true,trainingVerified:true,certificateReference:'CHECK-CAM-DEMO-001'},
  ];
  state.project.surveyTypes.forEach(type=>{
    state.productionTests[type] = {
      ...state.productionTests[type],
      evidenceReference:`EVID-UJI-${type.toUpperCase().replace(/\s+/g,'-')}-001`,
      referenceChecks: checked(PRODUCTION_REFERENCE_CHECKS[type]),
    };
  });
  state.productionApproval = 'Disetujui';
  state.productionApprovalBa = 'BA-VALIDASI-PRODUKSI-DEMO-001';
  state.productionApprovalNote = 'Metode dan bukti uji produksi paket demo dinyatakan siap untuk pelaksanaan survei.';
  state.bridgeInspectionPermit = true;
}

const daily = (type:SurveyType,id:string,raw:string):DailySurveyRecord => ({
  id,date:'2027-05-30',time:'08:00',surveyType:type,road:DEMO_ROAD,lengthKm:['Jembatan'].includes(type)?0:5,trafficDurationMinutes:type==='Lalu Lintas'?1440:0,
  lane:'Lajur 1',direction:'Normal',weather:'Cerah',surfaceDry:true,glareFree:true,speedAndLaneCompliant:true,
  tool:type==='IRI'?'Profilometer Laser':type==='PCI'?'Kamera Survei':type==='Jembatan'?'Peralatan Pemeriksaan Jembatan':type==='Drainase'?'Peralatan Inspeksi Drainase':'Perangkat RNI',
  operator:'Operator Demo',driver:'Pengemudi Demo',poi:'STA 0+000',disturbances:'Tidak ada faktor pengganggu signifikan',eventNotes:'Rekaman demo untuk pembelajaran alur QA/QC.',
  dailyToolCheck:{Baterai:true,Penyimpanan:true},rawValue:raw,cleanedValue:raw,cleaningReason:'',state:'Tercatat',
  technicalData:{assetId:`OBJ-${id}`,longitude:'98.67',latitude:'3.59',evidence:`SRC-${id}`},
});

function dailyReady(state:OperationalWorkflowState){
  state.dailyRecords = [
    daily('IRI','IRI-001','IRI 4.2 m/km'),
    daily('PCI','PCI-001','PCI 78'),
    daily('Jembatan','JBT-001','NK 2'),
    daily('Drainase','DRN-001','Kondisi Baik'),
    daily('RNI','RNI-001','RNI lengkap'),
  ];
  state.backups=[{id:'BKP-DEMO-001',createdAt:'2027-05-30 17:00',media:['Perangkat kerja','Penyimpanan jaringan'],includesRaw:true,includesProcessed:true,note:'Snapshot demo kegiatan harian'}];
}

function cycleProtocols(state:OperationalWorkflowState){
  state.cycle.selectedTypes=[...state.project.surveyTypes];
  state.cycle.checkedProtocols=checked([
    ...state.project.surveyTypes.flatMap(type=>CYCLE_PROTOCOLS[type].map(protocol=>`${type} · ${protocol}`)),
    ...CYCLE_SHARED_PROTOCOLS,
  ]);
  state.cycle.periodCompleted=true;
  state.cycle.bridgeFieldValidation=true;
  state.cycle.bridgeValidatedPercent=10;
  state.cycle.bridgeValidationReport='LAP-VALIDASI-LAPANGAN-JEMBATAN-DEMO-001';
  state.cycle.finalPeriodValidation=true;
  state.cycle.finalValidationLocation='Medan – Binjai · STA 5+000';
  state.cycle.finalToolUnchanged=true;
}

function correctionCase(status:CorrectionCase['status']):CorrectionCase{
  return {
    id:'KOR-DEMO-001',source:'Verval 14 hari',blockedStage:'Verval 14 hari',road:DEMO_ROAD,stationing:'STA 2+000 – 2+100',
    rejectionReason:'Koefisien variasi IRI pada sampel repeatability melebihi batas konfigurasi demo.',severity:'Mayor',owner:'Ketua Tim IRI',dueDate:'2027-06-04',
    rootCause:'Metode',fieldDataValid:'Tidak',surveyType:'IRI',actionType:'Survei ulang sebagian ruas',evidence:'EVID-KOREKSI-IRI-DEMO-001',
    originalValue:'IRI 4.2 m/km',proposedValue:'Hasil survei ulang tersimpan pada sistem sumber; referensi SRC-IRI-RETEST-001',approval:status==='Terbuka'?'Draft':'Disetujui',
    retest:status==='Terbuka'?'Belum Diuji':'Lulus',status,returnStage:'Verval 14 hari',linkedRecordId:'IRI-001',
    verification:status==='Ditutup'?{surveyor:true,teamLeader:true,balai:true}:{surveyor:true,teamLeader:true,balai:false},
    reviewNote:status==='Ditutup'?'Balai menerima bukti survei ulang dan hasil verval ulang konsisten.':'Penyedia sudah menyiapkan evidence dan menunggu verifikasi Balai.',
  };
}

function cyclePassed(state:OperationalWorkflowState){
  cycleProtocols(state);
  state.cycle.iriCoefficientVariation=4.1;
  state.cycle.pciAiStandardDeviation=7.0;
  state.cycle.reRatingStatus='Sesuai';
  state.cycle.consistency='Konsisten';
  state.cycle.userReview='Sesuai';
  state.cycle.userReviewNote='Hasil verval ulang sesuai setelah tindak lanjut temuan IRI.';
  state.cycle.certificateId='BA-VERVAL-14H-DEMO-001';
  state.cycle.heldRecordIds=[];
  state.corrections=[correctionCase('Ditutup')];
}

function submissionReady(state:OperationalWorkflowState){
  cyclePassed(state);
  state.submission={
    ...state.submission,
    coordinatesBoundToLrs:true,formatGlossaryCompliant:true,routeChanged:false,routeLengthDeviation:8,geometryFormat:'GeoJSON',topologyErrors:0,
    stationingConsistent:true,rawSeparated:true,cleanedSeparated:true,rniValidatedDate:'2027-05-20',
    rawFileName:'SRC-PAKET-DEMO-RAW',cleanedFileName:'SRC-PAKET-DEMO-VALIDATED',videoLink:'EVID-VISUAL-DEMO-001',
    requiredDocuments:checked(SUBMISSION_DOCUMENTS),targetSystems:['SMD Jalan','INVI-J','InDrain'],validationStatus:'VALID',validationMessage:'Paket demo memenuhi gerbang penyiapan data dan siap masuk audit.',
  };
}

function auditsPassed(state:OperationalWorkflowState,until:1|2|3){
  submissionReady(state);
  state.audits = [1,2,3].map(level=>({
    ...state.audits[level-1],
    level:level as 1|2|3,
    status: level<=until?'Lulus':'Belum Dimulai',
    sampleIds: level<=until?state.dailyRecords.slice(0,level===1?state.dailyRecords.length:Math.max(1,level===2?2:1)).map(r=>r.id):[],
    decisionNote: level<=until?`Audit Tingkat ${level} paket demo dinyatakan lulus.`:'',
    baNumber: level<=until?`BA-AUDIT-T${level}-DEMO-001`:'',
    bridgeTrustScore:level===3&&level<=until?92:0,
    reviewChecks: level<=until?{'Format, kelengkapan, ketelitian dan kewajaran seluruh data':true,'Tanggal, ruas, arah, cuaca, alat dan personel diperiksa':true,'Gambar/video dan foto PCI memenuhi spesifikasi':true,'Dokumen, kalibrasi dan proses verval diperiksa':true,'Penilaian ulang acak tanpa melihat data awal':true,'Cek acak gambar/video: ruas, arah dan kualitas':true,'Seluruh ketidaksesuaian diklarifikasi dan diterima':true,'Format, kelengkapan, ketelitian dan kewajaran data sistem diperiksa':true,'Penilaian ulang acak minimum 1% selesai':true}:{},
  })) as OperationalWorkflowState['audits'];
}

function acceptanceReady(state:OperationalWorkflowState,final=false){
  auditsPassed(state,3);
  const criteria=[
    'Format data sesuai dengan ketentuan',
    'Data lengkap untuk semua parameter yang disyaratkan',
    'Ketelitian data memenuhi standar',
    'Hasil verifikasi dan validasi menunjukkan kesesuaian',
    'Dokumentasi QA/QC lengkap dan sesuai',
  ];
  state.acceptance.partialReceipts=['BA-PENERIMAAN-T1-DEMO-001','BA-PENERIMAAN-T2-DEMO-001','BA-PENERIMAAN-T3-DEMO-001'];
  state.acceptance.acceptanceCriteria=checked(criteria);
  state.acceptance.acceptanceDecision=final?'Diterima':'Belum Diperiksa';
  state.acceptance.acceptanceRejectionReason='';
  state.acceptance.finalAcceptance=final;
  state.acceptance.finalAcceptanceBa=final?'BA-PENERIMAAN-AKHIR-DEMO-001':'';
  state.acceptance.terms=state.acceptance.terms.map(term=>({...term,complete:final||term.id!=='T4',progress:final?100:(term.id==='T4'?60:100),note:final?'Selesai pada skenario demo':'Status demo mengikuti checkpoint.'}));
  state.acceptance.semesterTwoRevalidation=final;
  state.acceptance.finalReport=final;
  state.acceptance.semesterTwoEvidence={
    calibrationDate:'2027-07-05',calibrationReference:'BA-KAL-IRI-S2-DEMO-001',validationDate:'2027-07-07',validationReference:'BA-VALIDASI-IRI-S2-DEMO-001',
    uploadDate:'2027-11-20',uploadValid:final,objectionsClosed:final,finalReportReference:final?'LAPORAN-AKHIR-QAQC-DEMO-001':'LAPORAN-AKHIR-DRAFT-DEMO',
  };
}

export function createDemoWorkflow(checkpointId:DemoCheckpointId):OperationalWorkflowState{
  const state=cloneInitial();
  state.flowContractVersion=3;
  state.simulationDate='2027-06-10';
  state.project={...state.project,id:'PAKET-DEMO-E2E-001',packageName:'Paket Demo QA/QC Medan–Binjai 2027',contractor:'PT Penyedia Demo Infrastruktur',balai:'Balai Sumatera Utara',satker:'Satker P2JN Sumatera Utara',ppk:'PPK 1.1',routes:[DEMO_ROAD],surveyTypes:[...DEMO_TYPES],semester:'Semester I'};
  state.events=[];state.corrections=[];state.dailyRecords=[];state.backups=[];
  const checkpoint=DEMO_CHECKPOINTS.find(item=>item.id===checkpointId)??DEMO_CHECKPOINTS[0];
  state.role=checkpoint.actor;

  if(checkpointId==='start'){
    state.project.preparation={sourceReviews:{},fieldPlan:{},coordination:{},documents:{},reportApproval:'Draft',reviewerNote:''};
    state.calibrations=[];
    state.calibrationChecklist=Object.fromEntries(DEMO_TYPES.map(type=>[type,false])) as OperationalWorkflowState['calibrationChecklist'];
    state.productionApproval='Draft';
    return state;
  }

  approvedPreparation(state);
  if(checkpointId==='prep-review'){
    state.project.preparation.reportApproval='Diajukan';
    state.project.preparation.reviewerNote='Menunggu review PIC Balai pada skenario demo.';
    state.productionApproval='Draft';
    return state;
  }

  productionReady(state);
  if(checkpointId==='calibration-production'){
    state.productionApproval='Diajukan';
    state.productionApprovalBa='';
    state.productionApprovalNote='Evidence uji produksi sudah disiapkan Penyedia dan menunggu keputusan Balai.';
    return state;
  }

  dailyReady(state);
  if(checkpointId==='daily-survey'){
    state.cycle.periodCompleted=false;
    state.cycle.userReview='Belum Diperiksa';
    state.cycle.certificateId='';
    return state;
  }

  cycleProtocols(state);
  if(checkpointId==='verval-finding'){
    state.cycle.iriCoefficientVariation=6.8;
    state.cycle.pciAiStandardDeviation=7.0;
    state.cycle.reRatingStatus='Sesuai';
    state.cycle.consistency='Tidak Konsisten';
    state.cycle.userReview='Temuan';
    state.cycle.userReviewNote='IRI perlu survei ulang pada sampel repeatability.';
    state.cycle.certificateId='';
    state.cycle.heldRecordIds=['IRI-001'];
    state.corrections=[correctionCase('Terbuka')];
    return state;
  }

  if(checkpointId==='correction-provider'){
    state.cycle.iriCoefficientVariation=6.8;state.cycle.pciAiStandardDeviation=7;state.cycle.reRatingStatus='Sesuai';state.cycle.consistency='Tidak Konsisten';state.cycle.userReview='Temuan';state.cycle.certificateId='';state.cycle.heldRecordIds=['IRI-001'];
    state.corrections=[correctionCase('Verifikasi Ulang')];
    return state;
  }

  submissionReady(state);
  if(checkpointId==='stage4-ready') return state;

  if(checkpointId==='audit1-provider'){
    state.audits[0]={...state.audits[0],status:'Dalam Review',sampleIds:state.dailyRecords.map(r=>r.id),decisionNote:'Penyedia sedang melengkapi bukti kesiapan audit internal.',baNumber:'',reviewChecks:{}};
    return state;
  }

  auditsPassed(state,1);
  if(checkpointId==='audit2-balai'){
    state.audits[1]={...state.audits[1],status:'Dalam Review',sampleIds:['IRI-001','PCI-001'],decisionNote:'Sampling Balai sedang direview.',baNumber:'',reviewChecks:{}};
    return state;
  }

  auditsPassed(state,2);
  if(checkpointId==='audit3-directorate'){
    state.audits[2]={...state.audits[2],status:'Dalam Review',sampleIds:['JBT-001'],decisionNote:'Direktorat sedang melakukan audit tingkat pusat.',baNumber:'',reviewChecks:{}};
    return state;
  }

  acceptanceReady(state,checkpointId==='complete');
  return state;
}
