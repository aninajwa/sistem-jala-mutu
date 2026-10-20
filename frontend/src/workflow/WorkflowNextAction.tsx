import { ArrowRight, Route } from 'lucide-react';
import type { OperationalWorkflowState } from './model';
import { PREPARATION_SOURCE_REVIEWS, PREPARATION_FIELD_PLAN, PREPARATION_COORDINATION, PREPARATION_DOCUMENTS, evaluateProductionTest } from './model';

export type NextWorkflowAction={title:string;detail:string;selection:string;stage:string};

function preparationComplete(state:OperationalWorkflowState){
  const prep=state.project.preparation;
  return [...PREPARATION_SOURCE_REVIEWS.map(x=>prep.sourceReviews[x]),...PREPARATION_FIELD_PLAN.map(x=>prep.fieldPlan[x]),...PREPARATION_COORDINATION.map(x=>prep.coordination[x]),...PREPARATION_DOCUMENTS.map(x=>prep.documents[x])].every(Boolean)&&prep.reportApproval==='Disetujui';
}
function calibrationComplete(state:OperationalWorkflowState){
  const scoped=state.project.surveyTypes;
  const recordsReady=state.calibrations.length>0&&state.calibrations.every(item=>item.condition==='Baik'&&item.qualificationValid&&item.trainingVerified&&item.dueDate>=state.simulationDate);
  return recordsReady&&scoped.length>0&&scoped.every(type=>state.calibrationChecklist[type]);
}
function productionComplete(state:OperationalWorkflowState){
  return state.productionApproval==='Disetujui'&&state.project.surveyTypes.every(type=>evaluateProductionTest(type,state.productionTests[type]).passed);
}
function stage3Complete(state:OperationalWorkflowState){
  return !!state.cycle.certificateId&&state.cycle.userReview==='Sesuai'&&state.cycle.consistency==='Konsisten'&&state.cycle.heldRecordIds.length===0;
}

export function getNextWorkflowAction(state:OperationalWorkflowState,finalAcceptanceValid=state.acceptance.finalAcceptance):NextWorkflowAction{
  const role=state.role;
  if(role==='Penyedia Jasa / Ketua Tim'){
    if(!preparationComplete(state))return {stage:'Tahap 0',title:'Lengkapi persiapan & Laporan Pendahuluan',detail:'Selesaikan survei pendahuluan, dokumen persiapan, lalu ajukan kepada PIC Balai.',selection:'/entry:Persiapan & SPMK'};
    if(!calibrationComplete(state))return {stage:'Tahap 1',title:'Lengkapi kalibrasi alat & personel',detail:'Catat alat, sertifikat/rujukan, kualifikasi personel, dan checklist sesuai jenis survei.',selection:'/documents:Kalibrasi & personel'};
    if(!productionComplete(state))return {stage:'Tahap 2',title:'Siapkan validasi produksi / uji coba',detail:'Lengkapi hasil source, evidence dan hasil uji per jenis sebelum diajukan ke Balai.',selection:'/entry:Validasi produksi'};
    if(state.dailyRecords.length===0)return {stage:'Tahap 3A',title:'Mulai pencatatan kegiatan survei harian',detail:'Pantau kegiatan lapangan, pemeriksaan alat, evidence dan faktor pengganggu.',selection:'/entry:Survei harian'};
    if(!stage3Complete(state))return {stage:'Tahap 3B',title:'Lengkapi bahan verval 14 hari',detail:'Siapkan checklist/evidence konsistensi agar PIC Balai dapat melakukan review berkala.',selection:'/verification:Verval 14 hari'};
    if(state.submission.validationStatus!=='VALID')return {stage:'Tahap 4',title:'Siapkan paket data & gerbang RNI/LRS',detail:'Pastikan dokumen mutu, keterikatan LRS, dan referensi paket siap sebelum audit.',selection:'/entry:Gerbang RNI/LRS'};
    if(state.audits[0].status!=='Lulus')return {stage:'Tahap 5',title:'Lengkapi bukti kesiapan Audit Tingkat 1',detail:'Catat bukti audit internal/kesiapan dan tindak lanjuti klarifikasi sebelum review Balai.',selection:'/verification:Audit tingkat 1–3'};
    return {stage:'Tahap 6',title:'Pantau penerimaan & tindak lanjut',detail:'Lengkapi bukti termin/laporan dan tanggapi klarifikasi bila data belum dapat diterima.',selection:'/reports:Penerimaan & termin'};
  }
  if(role==='PIC Balai / Pengguna Jasa'){
    if(state.project.preparation.reportApproval==='Diajukan')return {stage:'Tahap 0',title:'Review Laporan Pendahuluan',detail:'Tinjau persiapan paket dan berikan keputusan Balai.',selection:'/entry:Persiapan & SPMK'};
    if(state.productionApproval==='Diajukan'||state.productionApproval==='Perlu Revisi')return {stage:'Tahap 2',title:'Review hasil validasi produksi',detail:'Tinjau hasil system-check, evidence dan putuskan persetujuan alat/metode.',selection:'/entry:Validasi produksi'};
    if(state.cycle.userReview!=='Sesuai'||!state.cycle.certificateId)return {stage:'Tahap 3B',title:'Lakukan verval berkala 14 hari',detail:'Review evidence, konsistensi, temuan, dan catat BA berkala.',selection:'/verification:Verval 14 hari'};
    if(state.audits[1].status!=='Lulus')return {stage:'Tahap 5',title:'Lakukan Audit Tingkat 2',detail:'Sampling, klarifikasi, keputusan dan BA dilakukan pada level PIC Balai/Pengguna Jasa.',selection:'/verification:Audit tingkat 1–3'};
    if(!finalAcceptanceValid)return {stage:'Tahap 6',title:'Nilai penerimaan data',detail:'Periksa lima kriteria penerimaan, BA parsial/bertahap, dan keputusan penerimaan akhir.',selection:'/reports:Penerimaan & termin'};
    return {stage:'Selesai',title:'Paket telah diterima',detail:'Pantau dokumentasi dan status penyerahan sesuai periode pekerjaan.',selection:'/reports:Penerimaan & termin'};
  }
  if(role==='Direktorat / Pusat'){
    if(state.audits[2].status!=='Lulus')return {stage:'Tahap 5',title:'Lakukan Audit Tingkat 3',detail:'Review hasil yang telah melalui Balai dan catat keputusan audit tingkat pusat.',selection:'/verification:Audit tingkat 1–3'};
    return {stage:'Tahap 6',title:'Pantau status penerimaan',detail:'Penerimaan formal/BA berada pada PIC Balai; Direktorat memantau hasil audit dan status penerimaan.',selection:'/reports:Penerimaan & termin'};
  }
  return {stage:'Administrasi',title:'Pantau konfigurasi & integritas sistem',detail:'Admin mendukung konfigurasi, referensi dan audit trail tanpa mengambil alih keputusan QA/QC.',selection:'/audit:Peran & backup'};
}

export function WorkflowNextAction({state,onNavigate,finalAcceptanceValid}:{state:OperationalWorkflowState;onNavigate:(selection:string)=>void;finalAcceptanceValid?:boolean}){
  const next=getNextWorkflowAction(state,finalAcceptanceValid);
  return <div className="wf-next-action" data-testid="workflow-next-action"><div className="wf-next-icon"><Route size={17}/></div><div className="wf-next-copy"><span>{next.stage} · langkah berikutnya</span><strong>{next.title}</strong><small>{next.detail}</small></div><button className="wf-button primary" onClick={()=>onNavigate(next.selection)}>Buka <ArrowRight size={13}/></button></div>;
}
