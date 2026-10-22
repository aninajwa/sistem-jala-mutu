import { recordDailyChange, markAuditsForReview } from './workflowRevisions';
import { DEFAULT_SEMESTER_TWO, INITIAL_WORKFLOW, evaluateProductionTest, type OperationalWorkflowState, type CorrectionCase } from './model';

export const AUDIT_REVIEW_CHECKS: Record<number,string[]> = {
  1:['Format, kelengkapan, ketelitian dan kewajaran seluruh data','Tanggal, ruas, arah, cuaca, alat dan personel diperiksa','Gambar/video dan foto PCI memenuhi spesifikasi'],
  2:['Dokumen, kalibrasi dan proses verval diperiksa','Penilaian ulang acak tanpa melihat data awal','Cek acak gambar/video: ruas, arah dan kualitas','Seluruh ketidaksesuaian diklarifikasi dan diterima'],
  3:['Format, kelengkapan, ketelitian dan kewajaran data sistem diperiksa','Penilaian ulang acak minimum 1% selesai'],
};

export function fieldReadiness(state:OperationalWorkflowState): string[] {
  const c=state.cycle;
  return [
    c.requiresReview?'Periode memerlukan pemeriksaan ulang':'',
    Object.values(state.cycleHistory??{}).some(period=>period.requiresReview)?'Periode terdahulu memerlukan pemeriksaan ulang':'',
    state.productionApproval!=='Disetujui'?'BA persetujuan alat/metode belum disetujui':'',
    state.project.surveyTypes.some(type=>!c.selectedTypes.includes(type))?'Verval belum mencakup seluruh jenis dalam paket':'',
    state.project.surveyTypes.some(type=>!state.dailyRecords.some(r=>r.surveyType===type&&r.state==='Tercatat'&&state.project.routes.includes(r.road)))?'Rekaman valid untuk setiap jenis dalam paket belum lengkap':'',
    !c.periodCompleted?'Periode survei belum selesai':'',
    !c.certificateId||c.consistency!=='Konsisten'?'BA verval konsisten belum tersedia':'',
    c.heldRecordIds.length?'Data masih ditahan':'',
    c.userReview!=='Sesuai'?'Pemeriksaan proses/hasil verval oleh Pengguna Jasa belum sesuai':'',
    state.project.surveyTypes.includes('Jembatan')&&(!c.bridgeFieldValidation||(c.bridgeValidatedPercent??0)<10||!c.bridgeValidationReport?.trim())?'Validasi lapangan jembatan ≥10% dan referensi laporan wajib':'',
    !c.finalPeriodValidation||!c.finalValidationLocation?.trim()||!c.finalToolUnchanged?'Uji lokasi validasi akhir dan konfirmasi alat tidak berubah wajib':'',
    state.corrections.some(item=>item.status!=='Ditutup'&&!item.source.startsWith('Notifikasi H+0'))?'Kasus mutu masih terbuka':'',
  ].filter(Boolean);
}

/** KAK 2026, lingkup pelaksanaan: siklus Semester II adalah survei IRI.
 * Paket tanpa IRI tidak dikenai revalidasi alat IRI. Tidak menyimpulkan
 * pengecualian bagi paket IRI hanya dari tanggal kontrak/semester tampilan. */
export function semesterTwoApplies(state:OperationalWorkflowState):boolean {
  return state.project.surveyTypes.includes('IRI');
}
export function semesterTwoReadiness(state:OperationalWorkflowState):string[] {
  if(!semesterTwoApplies(state))return [];
  const e=state.acceptance.semesterTwoEvidence??DEFAULT_SEMESTER_TWO;
  const year=state.simulationDate.slice(0,4);
  const inPeriod=(date:string)=>date>=`${year}-07-01`&&date<=state.simulationDate;
  return [
    !inPeriod(e.calibrationDate)||!e.calibrationReference.trim()?'Kalibrasi ulang IRI Semester II beserta referensi wajib':'',
    !inPeriod(e.validationDate)||e.validationDate<e.calibrationDate||!e.validationReference.trim()||!evaluateProductionTest('IRI',state.productionTests.IRI).passed?'Validasi ulang IRI setelah kalibrasi wajib lulus dan memiliki BA':'',
    !state.calibrations.some(c=>c.surveyType==='IRI'&&c.lastCalibrated>=e.calibrationDate&&inPeriod(c.lastCalibrated)&&c.dueDate>=state.simulationDate&&c.condition==='Baik')?'Rekaman kalibrasi ulang IRI Semester II belum dicatat di inventaris':'',
    !inPeriod(state.productionTestDates?.IRI||'')||(state.productionTestDates?.IRI||'')<e.calibrationDate||state.productionApproval!=='Disetujui'?'Uji produksi IRI dan persetujuan metode harus diperbarui pada Semester II':'',
    !state.dailyRecords.some(r=>r.surveyType==='IRI'&&r.state==='Tercatat'&&inPeriod(r.date)&&state.project.routes.includes(r.road)&&r.date>=e.validationDate)?'Rekaman survei IRI Semester II setelah validasi belum tersedia':'',
    !inPeriod(e.uploadDate)||e.uploadDate<e.validationDate||!e.uploadValid?'Upload IRI Semester II harus berstatus VALID simulasi':'',
    !e.objectionsClosed?'Sanggah Semester II belum ditutup':'',
  ].filter(Boolean);
}

export function canMarkFinalReport(state:OperationalWorkflowState):boolean {
  return state.acceptance.terms.filter(t=>t.id!=='T4').every(t=>t.complete)
    &&state.audits.every(a=>a.status==='Lulus'&&!a.requiresReview)
    &&!!state.acceptance.semesterTwoEvidence?.finalReportReference.trim();
}

export function termReadiness(state:OperationalWorkflowState,id:string):string[] {
  if(id==='T1')return state.project.preparation.reportApproval==='Disetujui'&&state.productionApproval==='Disetujui'&&state.calibrations.length>0&&state.calibrations.every(c=>c.dueDate>=state.simulationDate&&c.condition==='Baik'&&c.qualificationValid&&c.trainingVerified)&&state.project.surveyTypes.every(t=>state.calibrationChecklist[t]&&evaluateProductionTest(t,state.productionTests[t]).passed)?[]:['Persiapan, kalibrasi, metode dan uji produksi belum disetujui'];
  if(id==='T2'&&(state.cycle.requiresReview||Object.values(state.cycleHistory??{}).some(c=>c.requiresReview)))return ['Pemeriksaan ulang periode belum selesai'];
  if(id==='T3'&&state.audits.some(a=>a.requiresReview))return ['Pemeriksaan ulang audit belum selesai'];
  if(id==='T2')return state.dailyRecords.some(r=>r.state==='Tercatat')&&state.cycle.certificateId&&state.cycle.consistency==='Konsisten'&&!state.cycle.heldRecordIds.length?[]:['Rekaman lapangan dan BA verval konsisten wajib'];
  if(id==='T3')return state.submission.validationStatus==='VALID'&&state.audits[1].status==='Lulus'&&state.audits[2].status==='Lulus'?[]:['Upload VALID dan BA audit Pengguna Jasa/Direktorat wajib'];
  return [...semesterTwoReadiness(state),...(semesterTwoApplies(state)&&!state.acceptance.semesterTwoRevalidation?['Persetujuan revalidasi Semester II wajib']:[]),...(!state.acceptance.finalReport?['Laporan akhir wajib']:[])];
}

export function correctionClosureErrors(state:OperationalWorkflowState,c:CorrectionCase):string[] {
  const record=state.dailyRecords.find(r=>r.id===c.linkedRecordId);
  return [
    c.status!=='Verifikasi Ulang'||c.retest!=='Lulus'?'Uji ulang harus lulus':'',
    !c.verification?.surveyor||!c.verification?.teamLeader||!c.verification?.balai?'Verifikasi Surveyor → Team Leader → Balai belum lengkap':'',
    !c.evidence.trim()?'Bukti wajib tersedia':'',
    c.fieldDataValid==='Ya'&&(!record||record.rawValue!==c.originalValue||!c.proposedValue.trim())?'Pilih rekaman raw asli yang sesuai dan usulan cleaned':'',
  ].filter(Boolean);
}

export function applyClosedCorrection(state:OperationalWorkflowState,c:CorrectionCase):OperationalWorkflowState {
  if(correctionClosureErrors(state,c).length)throw new Error('Kasus belum memenuhi syarat penutupan');
  const resetsProduction=['Kalibrasi','Validasi produksi'].includes(c.blockedStage);
  const revised=c.fieldDataValid==='Ya'?state.dailyRecords.find(row=>row.id===c.linkedRecordId):undefined;
  const affected=revised?recordDailyChange(state,{...revised,cleanedValue:c.proposedValue,cleaningReason:`${c.id}: ${c.evidence}`}):state;
  return {
    ...state,
    ...(resetsProduction?{productionApproval:'Draft' as const,productionApprovalBa:'',bridgeInspectionPermit:false}:{}),
    corrections:state.corrections.map(item=>item.id===c.id?{...item,status:'Ditutup' as const}:item),
    dailyRecords:state.dailyRecords.map(r=>r.id===c.linkedRecordId&&c.fieldDataValid==='Ya'?{...r,cleanedValue:c.proposedValue,cleaningReason:`${c.id}: ${c.reviewNote||c.rejectionReason} · ${c.evidence}`} :r),
    cycleHistory:affected.cycleHistory,
    cycle:c.blockedStage==='Verval 14 hari'&&!c.linkedRecordId?{...state.cycle,requiresReview:true,reviewReason:`Tindak lanjut ${c.id} selesai; periksa ulang periode terkait.`}:affected.cycle,
    submission:{...state.submission,validationStatus:'Draft',validationMessage:'Koreksi selesai; penyerahan dan audit wajib diulang.'},
    audits:markAuditsForReview(state,`Tindak lanjut ${c.id} selesai; tinjau ulang data terkait.`),
    acceptance:{...state.acceptance,terms:state.acceptance.terms.map(t=>['T2','T3','T4'].includes(t.id)?{...t,complete:false}:t),finalReport:false,finalAcceptance:false,semesterTwoRevalidation:false},
  };
}

export function dueScheduledBackup(state:OperationalWorkflowState):OperationalWorkflowState {
  const schedule=state.backupSchedule;
  if(!schedule?.enabled||schedule.media.length<2||schedule.nextDate>state.simulationDate)return state;
  const next=new Date(`${state.simulationDate}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate()+Math.max(1,schedule.intervalDays));
  return {...state,backups:[{id:`BKP-SCHEDULE-${state.simulationDate}`,createdAt:`${state.simulationDate} 17:00`,media:schedule.media,includesRaw:true,includesProcessed:true,note:'Snapshot terjadwal simulasi; tidak menyalin file'},...state.backups],backupSchedule:{...schedule,nextDate:next.toISOString().slice(0,10)},events:[{id:`EVT-BKP-${state.simulationDate}`,date:state.simulationDate,actor:state.role,action:'Catat snapshot terjadwal simulasi',object:state.project.packageName,oldValue:schedule.nextDate,newValue:next.toISOString().slice(0,10)},...state.events]};
}

export function workflowDocumentReferences(state:OperationalWorkflowState):Array<{name:string;reference:string;status:string}> {
  const evidence=state.acceptance.semesterTwoEvidence??DEFAULT_SEMESTER_TWO;
  return [
    {name:'BA Persetujuan Alat & Metode',reference:state.productionApprovalBa,status:state.productionApproval},
    {name:'BA Verval 2-Mingguan',reference:state.cycle.certificateId,status:state.cycle.consistency},
    {name:'Laporan Validasi Lapangan Jembatan',reference:state.cycle.bridgeValidationReport||'',status:state.cycle.bridgeFieldValidation?'Terverifikasi':'Draft'},
    ...state.audits.map(a=>({name:`BA Audit Tingkat ${a.level}`,reference:a.baNumber,status:a.status})),
    ...state.acceptance.partialReceipts.map(reference=>({name:'BA Penerimaan Parsial',reference,status:'Tercatat'})),
    {name:'BA Validasi IRI Semester II',reference:evidence.validationReference,status:state.acceptance.semesterTwoRevalidation?'Disetujui':'Draft'},
    {name:'Laporan Akhir',reference:evidence.finalReportReference,status:state.acceptance.finalReport?'Tersedia':'Draft'},
    {name:'BA Penerimaan Akhir',reference:state.acceptance.finalAcceptanceBa||'',status:state.acceptance.finalAcceptance?'Diterima':'Draft'},
    ...state.corrections.filter(c=>c.status==='Ditutup').map(c=>({name:'Dokumentasi Koreksi & Retest',reference:`${c.id} · ${c.evidence}`,status:c.status})),
  ].filter(row=>row.reference.trim());
}
