import { isAdministrativeReminder } from './correctionSourcePolicy';
import { CORRECTION_VERIFICATION_STEPS, correctionVerificationAttempt, correctionVerificationEvidenceErrors } from "./correctionVerificationEvidence";
import { correctionAttemptNumber } from "./correctionAttempt";
import { requiresLayeredCorrectionVerification } from "./correctionActionPolicy";
import { correctionRecordLink } from './correctionRecordLink';
import { markAuditsForReview, periodForDate } from './workflowRevisions';
import { DEFAULT_SEMESTER_TWO, INITIAL_WORKFLOW, evaluateProductionTest, type OperationalWorkflowState, type CorrectionCase } from './model';

export const AUDIT_REVIEW_CHECKS: Record<number,string[]> = {
  1:['Format, kelengkapan, ketelitian dan kewajaran seluruh data','Tanggal, ruas, arah, cuaca, alat dan personel diperiksa','Gambar/video dan foto PCI memenuhi spesifikasi'],
  2:['Dokumen, kalibrasi dan proses verval diperiksa','Penilaian ulang acak tanpa melihat data awal','Cek acak gambar/video: ruas, arah dan kualitas','Seluruh ketidaksesuaian diklarifikasi dan diterima'],
  3:['Format, kelengkapan, ketelitian dan kewajaran data sistem diperiksa','Penilaian ulang acak sesuai cakupan audit selesai (jembatan minimum 1%)'],
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
    pendingQualityCases(state).length?'Kasus mutu masih terbuka':'',
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

/** Only substantive open corrective cases block downstream gates.
 * H+0 reminders are notifications, not QA/QC findings. */
export function pendingQualityCases(state:OperationalWorkflowState):CorrectionCase[] {
  return state.corrections.filter(item=>item.status!=='Ditutup'&&!isAdministrativeReminder(item.source));
}

export function canMarkFinalReport(state:OperationalWorkflowState):boolean {
  return pendingQualityCases(state).length===0
    &&state.acceptance.terms.filter(t=>t.id!=='T4').every(t=>t.complete)
    &&state.audits.every(a=>a.status==='Lulus'&&!a.requiresReview)
    &&!!state.acceptance.semesterTwoEvidence?.finalReportReference.trim();
}

export function termReadiness(state:OperationalWorkflowState,id:string):string[] {
  if(['T2','T3','T4'].includes(id)&&pendingQualityCases(state).length)return ['Kasus tindakan perbaikan masih terbuka; seluruh temuan terkait harus ditutup dan gate asal diperiksa ulang'];
  if(id==='T1'&&pendingQualityCases(state).some(c=>['Persiapan','Persiapan & SPMK','Kalibrasi','Validasi produksi'].includes(c.blockedStage)))return ['Temuan persiapan, kalibrasi atau validasi produksi masih terbuka'];
  if(id==='T1')return state.project.preparation.reportApproval==='Disetujui'&&state.productionApproval==='Disetujui'&&state.calibrations.length>0&&state.calibrations.every(c=>c.dueDate>=state.simulationDate&&c.condition==='Baik'&&c.qualificationValid&&c.trainingVerified)&&state.project.surveyTypes.every(t=>state.calibrationChecklist[t]&&evaluateProductionTest(t,state.productionTests[t]).passed)?[]:['Persiapan, kalibrasi, metode dan uji produksi belum disetujui'];
  if(id==='T2'&&(state.cycle.requiresReview||Object.values(state.cycleHistory??{}).some(c=>c.requiresReview)))return ['Pemeriksaan ulang periode belum selesai'];
  if(id==='T3'&&state.audits.some(a=>a.requiresReview))return ['Pemeriksaan ulang audit belum selesai'];
  if(id==='T2')return state.dailyRecords.some(r=>r.state==='Tercatat')&&state.cycle.certificateId&&state.cycle.consistency==='Konsisten'&&!state.cycle.heldRecordIds.length?[]:['Rekaman lapangan dan BA verval konsisten wajib'];
  if(id==='T3')return state.submission.validationStatus==='VALID'&&state.audits[1].status==='Lulus'&&state.audits[2].status==='Lulus'?[]:['Upload VALID dan BA audit Pengguna Jasa/Direktorat wajib'];
  return [...semesterTwoReadiness(state),...(semesterTwoApplies(state)&&!state.acceptance.semesterTwoRevalidation?['Persetujuan revalidasi Semester II wajib']:[]),...(!state.acceptance.finalReport?['Laporan akhir wajib']:[])];
}

export function correctionClosureErrors(state:OperationalWorkflowState,c:CorrectionCase):string[] {
  const record=correctionRecordLink(state.dailyRecords,c.road,c.surveyType,c.linkedRecordId);
  const period = c.cyclePeriod ?? (record ? periodForDate(state,record.date) : undefined);
  return [
    c.blockedStage === 'Verval 14 hari' && period !== undefined && period !== (state.activeCyclePeriod ?? 1) && !state.cycleHistory?.[String(period)] ? 'Arsip periode pemeriksaan asal tidak tersedia' : '',
    c.linkedRecordId && !record ? 'Rekaman sumber tidak sesuai atau tidak ditemukan' : '',
    c.cyclePeriod !== undefined && record && periodForDate(state,record.date) !== c.cyclePeriod ? 'Periode kasus tidak sesuai rekaman sumber' : '',
    c.status!=='Verifikasi Ulang'||c.retest!=='Lulus'?'Uji ulang harus lulus':'',
    !c.verification?.balai?'Pemeriksaan Balai belum lengkap':'',
    requiresLayeredCorrectionVerification(c)&&(!c.verification?.surveyor||!c.verification?.teamLeader)?'Bukti pemeriksaan Surveyor dan Ketua Tim belum lengkap':'',
    ...(requiresLayeredCorrectionVerification(c)?correctionVerificationEvidenceErrors(c,correctionVerificationAttempt(c,correctionAttemptNumber(state.events,c.id)),CORRECTION_VERIFICATION_STEPS):[]),
    !c.evidence.trim()?'Bukti wajib tersedia':'',
    !c.executionReference?.trim()?'Hasil pelaksanaan belum ditautkan ke dokumen/rekaman sumber':'',
    !c.retestReference?.trim()?'Hasil uji ulang tahap asal belum memiliki referensi pemeriksaan':'',
    c.fieldDataValid==='Ya'&&(!record||record.rawValue!==c.originalValue||!c.proposedValue.trim())?'Referensi raw tidak cocok atau usulan hasil pemrosesan belum tersedia':'',
  ].filter(Boolean);
}

export function applyClosedCorrection(state:OperationalWorkflowState,c:CorrectionCase):OperationalWorkflowState {
  if(correctionClosureErrors(state,c).length)throw new Error('Kasus belum memenuhi syarat penutupan');
  if (isAdministrativeReminder(c.source)) return {...state, corrections:state.corrections.map(item=>item.id===c.id?{...item,status:'Ditutup' as const}:item)};
  const linkedRecord = correctionRecordLink(state.dailyRecords,c.road,c.surveyType,c.linkedRecordId);
  const linkedPeriod = linkedRecord ? periodForDate(state,linkedRecord.date) : undefined;
  const correctionPeriod = c.cyclePeriod ?? linkedPeriod ?? state.activeCyclePeriod ?? 1;
  const activePeriod = state.activeCyclePeriod ?? 1;
  const isPeriodic = c.blockedStage === 'Verval 14 hari';
  const archivedCycle = state.cycleHistory?.[String(correctionPeriod)];
  const markForReview = (cycle: OperationalWorkflowState['cycle']): OperationalWorkflowState['cycle'] => ({
    ...cycle, requiresReview: true,
    providerResubmissionRequired: cycle.periodCompleted ? true : cycle.providerResubmissionRequired,
    reviewReason: `Tindak lanjut ${c.id} selesai; periksa ulang periode ${correctionPeriod}.`,
    reviewPendingTypes: [...new Set([...(cycle.reviewPendingTypes ?? []), c.surveyType])],
  });
  const auditLevel = /^Audit tingkat ([123])$/i.exec(c.blockedStage)?.[1];
  // A changed raw/cleaned dataset must pass the submission gate again.
  // Closing an audit finding without a linked data change does not invalidate SMD.
  const auditOnly = !!auditLevel && c.fieldDataValid === 'Tidak Berlaku' && !c.linkedRecordId && !requiresLayeredCorrectionVerification(c);
  const resetsPreparation=['Persiapan','Persiapan & SPMK'].includes(c.blockedStage);
  const resetsProduction=['Kalibrasi','Validasi produksi'].includes(c.blockedStage);
  // Semester II revalidation is specific to IRI. Preserve it for other surveys
  // and for a linked IRI record dated in Semester I of the same contract year.
  const semesterStart = `${state.simulationDate.slice(0,4)}-07-01`;
  const affectsSemesterTwo = !auditOnly && c.surveyType === 'IRI' && (resetsProduction || !linkedRecord || linkedRecord.date.slice(0,4) !== state.simulationDate.slice(0,4) || linkedRecord.date >= semesterStart);
  const affectedTerms = new Set(auditOnly ? ['T3','T4'] : ['T2','T3','T4']);
  if (resetsPreparation || resetsProduction) affectedTerms.add('T1');
  // JALA MUTU memverifikasi hasil dari sistem sumber, bukan menulis ulang data survei.
  // proposedValue hanyalah usulan/reference untuk pembandingan QA/QC.
  // Penutupan kasus tidak memutasi rawValue maupun cleanedValue.
  return {
    ...state,
    ...(resetsPreparation?{project:{...state.project,preparation:{...state.project.preparation,reportApproval:'Perlu Revisi' as const,reviewerNote:`Tindak lanjut ${c.id} selesai; periksa kembali persyaratan persiapan.`}}}:{}),
    ...(resetsProduction?{productionApproval:'Draft' as const,productionApprovalBa:'',bridgeInspectionPermit:false}:{}),
    corrections:state.corrections.map(item=>item.id===c.id?{...item,status:'Ditutup' as const}:item),
    // Data survei tidak diubah; penerimaan versi baru harus berasal dari SMD/API.
    // Keputusan tahapan tidak dibuat 'Sesuai' otomatis karena kasus ditutup.
    cycle: isPeriodic && correctionPeriod === activePeriod ? markForReview(state.cycle) : state.cycle,
    ...(isPeriodic && correctionPeriod !== activePeriod && archivedCycle ? {
      cycleHistory: { ...state.cycleHistory, [correctionPeriod]: markForReview(archivedCycle) },
    } : {}),
    submission: auditOnly ? state.submission : {...state.submission,validationStatus:'Draft',validationMessage:'Koreksi selesai; penyerahan dan audit wajib diulang.'},
    audits: markAuditsForReview(state,`Tindak lanjut ${c.id} selesai; tinjau ulang data terkait.`).map((audit,i)=>auditOnly && audit.level < Number(auditLevel) ? state.audits[i] : audit) as OperationalWorkflowState['audits'],
    acceptance:{...state.acceptance,terms:state.acceptance.terms.map(t=>affectedTerms.has(t.id)?{...t,complete:false}:t),finalReport:false,finalAcceptance:false,semesterTwoRevalidation:affectsSemesterTwo?false:state.acceptance.semesterTwoRevalidation},
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
  const archived = Object.entries(state.cycleHistory ?? {}).filter(([period]) => period !== String(state.activeCyclePeriod ?? 1)).sort(([a],[b])=>Number(a)-Number(b));
  return [
    {name:'BA Persetujuan Alat & Metode',reference:state.productionApprovalBa,status:state.productionApproval},
    {name:'BA Verval 2-Mingguan',reference:state.cycle.certificateId,status:state.cycle.requiresReview?'Perlu pemeriksaan ulang':state.cycle.consistency},
    ...archived.map(([period,cycle])=>({name:`BA Verval 2-Mingguan · Periode ${period}`,reference:cycle.certificateId,status:cycle.requiresReview?'Perlu pemeriksaan ulang':cycle.consistency})),
    {name:'Laporan Validasi Lapangan Jembatan',reference:state.cycle.bridgeValidationReport||'',status:state.cycle.requiresReview?'Perlu pemeriksaan ulang':state.cycle.bridgeFieldValidation?'Terverifikasi':'Draft'},
    ...archived.map(([period,cycle])=>({name:`Laporan Validasi Lapangan Jembatan · Periode ${period}`,reference:cycle.bridgeValidationReport||'',status:cycle.requiresReview?'Perlu pemeriksaan ulang':cycle.bridgeFieldValidation?'Terverifikasi':'Draft'})),
    ...state.audits.map(a=>({name:`BA Audit Tingkat ${a.level}`,reference:a.baNumber,status:a.requiresReview?'Perlu pemeriksaan ulang':a.status})),
    ...state.acceptance.partialReceipts.map(reference=>{
      const termId = /^BA penerimaan (T[1-4])$/.exec(reference)?.[1];
      const term = state.acceptance.terms.find(item=>item.id===termId);
      return {name:'BA Penerimaan Parsial',reference,status:termId && !term?.complete?'Perlu pemeriksaan ulang':'Tercatat'};
    }),
    {name:'BA Validasi IRI Semester II',reference:evidence.validationReference,status:state.acceptance.semesterTwoRevalidation?'Disetujui':'Draft'},
    {name:'Laporan Akhir',reference:evidence.finalReportReference,status:state.acceptance.finalReport?'Tersedia':'Draft'},
    {name:'BA Penerimaan Akhir',reference:state.acceptance.finalAcceptanceBa||'',status:state.acceptance.finalAcceptance?'Diterima':'Draft'},
    ...state.corrections.filter(c=>c.status==='Ditutup').flatMap(c=>[
      {name:'Bukti usulan tindakan perbaikan',reference:c.evidence,status:'Tercatat'},
      {name:'Hasil pelaksanaan tindakan perbaikan',reference:c.executionReference??'',status:'Tercatat'},
      {name:'Hasil pemeriksaan ulang tindakan perbaikan',reference:c.retestReference??'',status:c.retest==='Lulus'?'Lulus':'Perlu diperiksa'},
    ].filter(row=>row.reference.trim()).map(row=>({...row,reference:`${c.id} · ${row.reference}`}))),
  ].filter(row=>row.reference.trim());
}
