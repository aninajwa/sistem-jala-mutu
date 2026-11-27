import {validDate} from "./operationalCalendar";
import { periodForDate } from './workflowRevisions';
import { CORRECTION_VERIFICATION_STEPS, correctionVerificationAttempt, correctionVerificationEvidenceErrors } from "./correctionVerificationEvidence";
import { correctionCreationError } from "./correctionCreation";
import { correctionAttemptNumber } from "./correctionAttempt";
import { requiresLayeredCorrectionVerification } from "./correctionActionPolicy";
import { correctionExecutionErrors } from "./correctionFormEngine";
import {correctionProposalScenarioErrors} from "./correctionRules";
import {correctionRecordLink, recordPciMethod, correctionWithSourceMethod} from "./correctionRecordLink";
import {correctionActionErrors} from "./correctionActionPolicy";
import type {CorrectionCase,OperationalWorkflowState,WorkflowRole} from './model';
import {correctionClosureErrors} from './flowRules';
import {calibrationFindingCreationError} from './calibrationCorrectionBridge';
const P:WorkflowRole='Penyedia Jasa / Ketua Tim',B:WorkflowRole='PIC Balai / Pengguna Jasa',D:WorkflowRole='Direktorat / Pusat';
export function correctionReviewer(c:Pick<CorrectionCase,"blockedStage">):WorkflowRole{return /^Audit tingkat 3$/i.test(c.blockedStage)?D:/^Audit tingkat 1$/i.test(c.blockedStage)?P:B;}
export function correctionNextStep(c:CorrectionCase){
 if(c.status==='Ditutup')return {actor:correctionReviewer(c),label:'Kasus diarsipkan; periksa kembali kesiapan tahap sumber.'};
 if(c.status==='Terbuka'||c.status==='Verifikasi Ulang'&&c.retest==='Gagal')return {actor:P,label:c.retest==='Gagal'?'Perbaiki tindakan berdasarkan alasan uji ulang, lalu ajukan kembali.':'Tetapkan penanggung jawab, usulan dan bukti; ajukan kepada Balai.'};
 if(c.status==='Menunggu Persetujuan')return {actor:B,label:'Periksa bukti; setujui tindakan atau kembalikan dengan alasan revisi.'};
 if(c.status==='Disetujui')return {actor:P,label:'Laksanakan tindakan dan kirim hasil serta referensi bukti.'};
 return {actor:correctionReviewer(c),label:c.retest==='Lulus'?'Periksa syarat penutupan dan kembalikan ke tahap sumber.':'Periksa ulang hasil; catat lulus atau gagal beserta referensinya.'};
}
/** Existing wire format retained; enforce the correction transaction at the frontend boundary. */
export function correctionMutationError(before:OperationalWorkflowState,after:OperationalWorkflowState):string|undefined{
 const role=before.role,old=new Map(before.corrections.map(c=>[c.id,c]));
 if(new Set(after.corrections.map(c=>c.id)).size!==after.corrections.length)return 'ID kasus harus unik.';
 if(before.corrections.some(c=>!after.corrections.some(n=>n.id===c.id)))return 'Kasus dan riwayat tidak boleh dihapus melalui tindak lanjut.';
 for(const n of after.corrections){
  const c=old.get(n.id);if(JSON.stringify(c)===JSON.stringify(n))continue;
  if((!c || c.dueDate!==n.dueDate) && n.dueDate && !validDate(n.dueDate))return "Tenggat harus berupa tanggal kalender yang sah.";
  if(!c){const creationError=correctionCreationError(before,n,after.corrections);if(creationError)return creationError;if(n.calibrationFinding){const reason=calibrationFindingCreationError(before,n);if(reason)return reason;}else if(n.source==='Pemeriksaan kalibrasi')return 'Temuan kalibrasi harus ditautkan pada pemeriksaan Balai.';if(![P,B].includes(role)||n.status!=='Terbuka'||n.approval!=='Draft'||!n.rejectionReason.trim()||!before.project.surveyTypes.includes(n.surveyType)||!before.project.routes.includes(n.road))return 'Kasus baru harus berasal dari lingkup paket dan dibuka oleh Penyedia atau Balai.';continue;}
  const keys=([...new Set([...Object.keys(c),...Object.keys(n)])] as (keyof CorrectionCase)[]).filter(k=>JSON.stringify(c[k])!==JSON.stringify(n[k]));
  if(c.status==='Ditutup')return 'Kasus ditutup hanya dapat dibaca; buat temuan baru dari pemeriksaan sumber.';
  if(['id','source','blockedStage','road','stationing','surveyType','severity','rejectionReason','calibrationFinding','cyclePeriod','returnStage','originReference','originPciMethod'].some(k=>keys.includes(k as keyof CorrectionCase)))return 'Identitas temuan tidak boleh diganti dalam tindak lanjut.';
  const priorMethod=correctionWithSourceMethod(c,before.dailyRecords).originPciMethod;
  if(keys.includes('linkedRecordId') && priorMethod && !n.linkedRecordId && c.linkedRecordId) return 'Rekaman sumber dengan metode PCI yang diketahui tidak boleh dilepas.';
  if(keys.includes('linkedRecordId') && n.linkedRecordId){
   const linked=correctionRecordLink(before.dailyRecords,n.road,n.surveyType,n.linkedRecordId);
   if(!linked || (n.cyclePeriod !== undefined && periodForDate(before,linked.date) !== n.cyclePeriod)) return 'Rekaman sumber harus sesuai ruas, jenis survei dan periode kasus.';
   if(priorMethod && recordPciMethod(linked)!==priorMethod) return 'Metode PCI rekaman baru harus sama dengan metode sumber.';
   if(after.corrections.some(other=>other.id!==n.id && other.status!=='Ditutup' && other.linkedRecordId===n.linkedRecordId && other.source===n.source && other.blockedStage===n.blockedStage && other.road===n.road && other.surveyType===n.surveyType)) return 'Kasus aktif untuk rekaman sumber tersebut sudah ada.';
  }
  const evidenceChanged=keys.includes('verificationEvidence');
  const evidenceCleared=Object.keys(n.verificationEvidence ?? {}).length===0;
  const attempt=correctionVerificationAttempt(c,correctionAttemptNumber(before.events,c.id));
  const reviewer=correctionReviewer(c),only=(allowed:string[])=>keys.every(k=>allowed.includes(k));
  if(n.status==='Ditutup'){
   if(!only(['status']))return 'Penutupan tidak boleh mengubah usulan atau bukti.';
   if(role!==reviewer)return 'Penutupan hanya oleh pemeriksa sesuai tingkat sumber.';
   const errors=correctionClosureErrors(before,c);if(errors.length)return errors.join(' · ');continue;
  }
  if(c.status==='Dilaksanakan'&&c.approval==='Disetujui'&&role===reviewer&&only(['status','approval','retest','retestReference','retestFailureReason','verification','verificationEvidence'])){
   if(!n.retestReference?.trim()||!n.executionReference?.trim())return 'Pemeriksaan ulang memerlukan referensi pelaksanaan dan hasil uji.';
   if(n.status==='Verifikasi Ulang'&&n.retest==='Lulus'&&!n.retestFailureReason?.trim()&&only(['status','retest','retestReference','retestFailureReason']))continue;
   if(n.status==='Terbuka'&&n.retest==='Gagal'&&n.approval==='Perlu Revisi'&&n.retestFailureReason?.trim()&&!n.verification?.surveyor&&!n.verification?.teamLeader&&!n.verification?.balai&&evidenceCleared)continue;
   return 'Hasil gagal harus kembali untuk revisi dengan alasan; hasil lulus menunggu penutupan.';
  }
  if(role===P&&c.status==='Disetujui'&&c.approval==='Disetujui'&&n.status==='Dilaksanakan'&&n.executionReference?.trim()&&only(['status','executionReference','executionResult'])){const errors=correctionExecutionErrors(correctionWithSourceMethod(c,before.dailyRecords),n.executionResult,before.project.id,correctionAttemptNumber(before.events,c.id));if(errors.length)return errors.join(' · ');continue;}
  if(role===B&&c.status==='Menunggu Persetujuan'&&only(['reviewNote','verification','verificationEvidence','approval','status','retest'])){
   if(n.verification?.surveyor!==c.verification?.surveyor||n.verification?.teamLeader!==c.verification?.teamLeader){if(!(n.status==='Terbuka'&&n.approval==='Perlu Revisi'&&!n.verification?.surveyor&&!n.verification?.teamLeader&&!n.verification?.balai))return 'Pemeriksa tidak dapat mengisi verifikasi internal Penyedia.';}
   const returning=n.status==='Terbuka'&&n.approval==='Perlu Revisi';
   if(!returning){
    if(['surveyor','teamLeader'].some(step=>JSON.stringify(c.verificationEvidence?.[step as 'surveyor'|'teamLeader'])!==JSON.stringify(n.verificationEvidence?.[step as 'surveyor'|'teamLeader'])))return 'Balai tidak dapat mencatat bukti atas nama pemeriksa internal.';
    if(evidenceChanged||keys.includes('verification')){const errors=correctionVerificationEvidenceErrors(n,attempt);if(errors.length)return errors.join(' · ');}
    if(n.status==='Disetujui'&&requiresLayeredCorrectionVerification(n)){const errors=correctionVerificationEvidenceErrors(n,attempt,CORRECTION_VERIFICATION_STEPS);if(errors.length)return errors.join(' · ');}
   }
   if(n.status==='Menunggu Persetujuan'&&n.approval===c.approval&&n.retest===c.retest)continue;
   if(!n.reviewNote?.trim())return 'Keputusan pemeriksa memerlukan alasan atau catatan.';
   if(c.approval==='Diajukan'&&n.status==='Disetujui'&&n.approval==='Disetujui'&&n.retest==='Belum Diuji'&&n.reviewNote?.trim()&&n.verification?.balai&&(!requiresLayeredCorrectionVerification(n)||n.verification?.surveyor&&n.verification?.teamLeader))continue;
   if(n.status==='Terbuka'&&n.approval==='Perlu Revisi'&&n.retest==='Belum Diuji'&&!n.verification?.surveyor&&!n.verification?.teamLeader&&!n.verification?.balai&&evidenceCleared)continue;
  }
  if(role===P&&(c.status==='Terbuka'||c.status==='Verifikasi Ulang'&&c.retest==='Gagal')&&only(['rootCause','fieldDataValid','actionType','proposedPlan','evidence','proposedValue','originalValue','linkedRecordId','ruleScenario','ruleChecks','ruleNumbers','provinceUpdateBa','verification','verificationEvidence','approval','status','retest','retestReference','retestFailureReason','executionReference','executionResult','reviewNote','owner','dueDate'])){
   if(keys.includes('reviewNote')&&n.reviewNote?.trim())return 'Penyedia tidak dapat menulis keputusan pemeriksa.';
   if(n.verification?.balai)return 'Penyedia tidak dapat memverifikasi atas nama Balai.';
   if(n.verification?.teamLeader&&!n.verification?.surveyor)return 'Bukti pemeriksaan Surveyor harus ditinjau sebelum pemeriksaan Ketua Tim.';
   if(keys.includes('actionType') && (Object.keys(n.ruleChecks ?? {}).length || Object.keys(n.ruleNumbers ?? {}).length || n.provinceUpdateBa?.trim() || n.proposedValue?.trim()))return 'Perubahan jenis tindakan memerlukan pengosongan hasil teknis dan usulan nilai sebelumnya.';
   if(keys.includes('ruleScenario') && (Object.keys(n.ruleChecks ?? {}).length || Object.keys(n.ruleNumbers ?? {}).length || n.provinceUpdateBa?.trim() || n.proposedValue?.trim()))return 'Perubahan skenario teknis memerlukan pengosongan hasil teknis dan usulan nilai sebelumnya.';
   if(keys.includes('linkedRecordId') && (Object.keys(n.ruleChecks ?? {}).length || Object.keys(n.ruleNumbers ?? {}).length || n.provinceUpdateBa?.trim() || n.proposedValue?.trim()))return 'Perubahan rekaman sumber memerlukan pengosongan hasil teknis dan usulan nilai sebelumnya.';
   const technicalEdit=keys.some(k=>['rootCause','fieldDataValid','actionType','proposedPlan','evidence','proposedValue','originalValue','linkedRecordId','ruleScenario','ruleChecks','ruleNumbers','provinceUpdateBa','owner','dueDate'].includes(k));
   if(technicalEdit&&(n.verification?.surveyor||n.verification?.teamLeader||!evidenceCleared))return 'Perubahan usulan teknis memerlukan pemeriksaan bukti internal kembali.';
   if(evidenceChanged&&c.verificationEvidence?.teamLeader&&JSON.stringify(c.verificationEvidence.surveyor)!==JSON.stringify(n.verificationEvidence?.surveyor)&&JSON.stringify(c.verificationEvidence.teamLeader)===JSON.stringify(n.verificationEvidence?.teamLeader))return 'Perubahan bukti Surveyor memerlukan pemeriksaan Ketua Tim kembali.';
   if(n.verificationEvidence?.balai)return 'Penyedia tidak dapat mencatat bukti pemeriksaan Balai.';
   if(evidenceChanged||keys.includes('verification')){const errors=correctionVerificationEvidenceErrors(n,attempt);if(errors.length)return errors.join(' · ');}
   if(n.status==='Terbuka'&&['Draft','Perlu Revisi'].includes(n.approval)){if(keys.some(k=>['retest','retestReference','retestFailureReason','executionReference','executionResult'].includes(k))&&(n.retest!=='Belum Diuji'||n.retestReference||n.retestFailureReason||n.executionReference||n.executionResult))return 'Hasil pemeriksaan atau pelaksanaan tidak dapat dicatat dalam draf usulan.';continue;}
   if(n.status==='Menunggu Persetujuan'&&n.approval==='Diajukan'&&n.rootCause.trim()&&n.actionType&&n.proposedPlan?.trim()&&n.evidence.trim()&&n.owner.trim()&&n.fieldDataValid&&(!requiresLayeredCorrectionVerification(n)||n.verification?.surveyor&&n.verification?.teamLeader)){const errors=[...correctionActionErrors(n),...correctionProposalScenarioErrors(n)];if(n.actionType==='Koreksi pemrosesan dengan bukti'){const raw=correctionRecordLink(before.dailyRecords,n.road,n.surveyType,n.linkedRecordId);if(!raw||!n.originalValue.trim()||raw.rawValue!==n.originalValue||!n.proposedValue.trim())errors.push('Koreksi pemrosesan memerlukan nilai raw sumber yang sesuai dan nilai usulan cleaned.');}if(requiresLayeredCorrectionVerification(n))errors.push(...correctionVerificationEvidenceErrors(n,attempt,['surveyor','teamLeader']));if(errors.length)return errors.join(" · ");if(n.executionReference||n.executionResult||n.retestReference||n.retestFailureReason||n.retest!=="Belum Diuji")return "Pengajuan baru tidak boleh membawa hasil siklus sebelumnya.";continue;}
  }
  return `Transisi ${c.status} → ${n.status} bukan kewenangan ${role} atau belum memenuhi syarat.`;
 }
 return undefined;
}
