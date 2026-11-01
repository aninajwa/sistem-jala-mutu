import type {CorrectionCase,OperationalWorkflowState,WorkflowRole} from './model';
import {correctionClosureErrors} from './flowRules';
const P:WorkflowRole='Penyedia Jasa / Ketua Tim',B:WorkflowRole='PIC Balai / Pengguna Jasa',D:WorkflowRole='Direktorat / Pusat';
export function correctionReviewer(c:CorrectionCase):WorkflowRole{return /^Audit tingkat 3$/i.test(c.blockedStage)?D:/^Audit tingkat 1$/i.test(c.blockedStage)?P:B;}
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
  if(!c){if(![P,B].includes(role)||n.status!=='Terbuka'||n.approval!=='Draft'||!n.rejectionReason.trim()||!before.project.surveyTypes.includes(n.surveyType)||!before.project.routes.includes(n.road))return 'Kasus baru harus berasal dari lingkup paket dan dibuka oleh Penyedia atau Balai.';continue;}
  const keys=(Object.keys(n) as (keyof CorrectionCase)[]).filter(k=>JSON.stringify(c[k])!==JSON.stringify(n[k]));
  if(c.status==='Ditutup')return 'Kasus ditutup hanya dapat dibaca; buat temuan baru dari pemeriksaan sumber.';
  if(['id','source','blockedStage','road','stationing','surveyType','severity','rejectionReason'].some(k=>keys.includes(k as keyof CorrectionCase)))return 'Identitas temuan tidak boleh diganti dalam tindak lanjut.';
  const reviewer=correctionReviewer(c),only=(allowed:string[])=>keys.every(k=>allowed.includes(k));
  if(n.status==='Ditutup'){
   if(!only(['status']))return 'Penutupan tidak boleh mengubah usulan atau bukti.';
   if(role!==reviewer)return 'Penutupan hanya oleh pemeriksa sesuai tingkat sumber.';
   const errors=correctionClosureErrors(before,c);if(errors.length)return errors.join(' · ');continue;
  }
  if(['Dilaksanakan','Verifikasi Ulang'].includes(c.status)&&role===reviewer&&only(['status','approval','retest','retestReference','retestFailureReason','verification'])){
   if(!n.retestReference?.trim()||!n.executionReference?.trim())return 'Pemeriksaan ulang memerlukan referensi pelaksanaan dan hasil uji.';
   if(n.status==='Verifikasi Ulang'&&n.retest==='Lulus')continue;
   if(n.status==='Terbuka'&&n.retest==='Gagal'&&n.approval==='Perlu Revisi'&&n.retestFailureReason?.trim()&&!n.verification?.surveyor&&!n.verification?.teamLeader&&!n.verification?.balai)continue;
   return 'Hasil gagal harus kembali untuk revisi dengan alasan; hasil lulus menunggu penutupan.';
  }
  if(role===P&&c.status==='Disetujui'&&n.status==='Dilaksanakan'&&n.executionReference?.trim()&&only(['status','executionReference']))continue;
  if(role===B&&c.status==='Menunggu Persetujuan'&&only(['reviewNote','verification','approval','status','retest'])){
   if(n.verification?.surveyor!==c.verification?.surveyor||n.verification?.teamLeader!==c.verification?.teamLeader){if(!(n.status==='Terbuka'&&n.approval==='Perlu Revisi'&&!n.verification?.surveyor&&!n.verification?.teamLeader&&!n.verification?.balai))return 'Pemeriksa tidak dapat mengisi verifikasi internal Penyedia.';}
   if(n.status==='Menunggu Persetujuan'&&n.approval===c.approval&&n.retest===c.retest)continue;
   if(!n.reviewNote?.trim())return 'Keputusan pemeriksa memerlukan alasan atau catatan.';
   if(n.status==='Disetujui'&&n.approval==='Disetujui'&&n.verification?.balai)continue;
   if(n.status==='Terbuka'&&n.approval==='Perlu Revisi')continue;
  }
  if(role===P&&(c.status==='Terbuka'||c.status==='Verifikasi Ulang'&&c.retest==='Gagal')&&only(['rootCause','fieldDataValid','actionType','evidence','proposedValue','originalValue','returnStage','linkedRecordId','ruleScenario','ruleChecks','ruleNumbers','provinceUpdateBa','verification','approval','status','retest','retestReference','retestFailureReason','executionReference','reviewNote','owner','dueDate'])){
   if(keys.includes('reviewNote')&&n.reviewNote?.trim())return 'Penyedia tidak dapat menulis keputusan pemeriksa.';
   if(n.verification?.balai)return 'Penyedia tidak dapat memverifikasi atas nama Balai.';
   if(n.status==='Terbuka'&&['Draft','Perlu Revisi'].includes(n.approval))continue;
   if(n.status==='Menunggu Persetujuan'&&n.approval==='Diajukan'&&n.rootCause.trim()&&n.actionType&&n.evidence.trim()&&n.owner.trim()&&n.fieldDataValid&&n.verification?.surveyor&&n.verification?.teamLeader)continue;
  }
  return `Transisi ${c.status} → ${n.status} bukan kewenangan ${role} atau belum memenuhi syarat.`;
 }
 return undefined;
}
