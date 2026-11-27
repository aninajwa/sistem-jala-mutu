import { recordPciMethod } from './correctionRecordLink';
import type { CorrectionCase, OperationalWorkflowState, SurveyType, WorkflowRole } from './model';
import { defaultCase } from './correctionDefaults';
import { resolveAuditRejectionRecords, hasOpenAuditRejectionCase } from './auditRejectionCases';

const actors: Record<1|2|3,WorkflowRole> = {1:'Penyedia Jasa / Ketua Tim',2:'PIC Balai / Pengguna Jasa',3:'Direktorat / Pusat'};
export const auditRejectionAction = (level: number) => `Simpan keputusan audit tingkat ${level}`;
export type AuditRejectionInput = {level:1|2|3; surveyType:SurveyType; note:string; baNumber?:string; caseIds:string[]};

/** Only a source audit rejection can create Audit 3 findings. Reconstruct the
 * complete transition so the Directorate cannot acquire general acceptance or
 * Balai write permissions through this action. No raw values are modified. */
export function applyAuditRejection(state:OperationalWorkflowState,input:AuditRejectionInput):{next?:OperationalWorkflowState; error?:string; caseId?:string} {
 const {level,surveyType,caseIds}=input;
 const audit=state.audits[level-1],note=input.note.trim(),source=`Penolakan audit tingkat ${level}`,stage=`Audit tingkat ${level}`;
 if(state.role!==actors[level]||!audit||audit.status==='Belum Dimulai')return {error:'Penolakan hanya oleh pemeriksa tingkat audit yang sudah dimulai.'};
 if(level>1&&(state.audits[level-2].status!=='Lulus'||state.audits[level-2].requiresReview))return {error:'Audit sebelumnya harus lulus dan tidak menunggu pemeriksaan ulang.'};
 if(level===3&&state.submission.validationStatus!=='VALID')return {error:'Keputusan Audit Tingkat 3 menunggu status VALID dari sistem sumber.'};
 if(!note||!state.project.surveyTypes.includes(surveyType))return {error:'Jenis survei dalam lingkup paket dan alasan penolakan wajib diisi.'};
 const resolved=resolveAuditRejectionRecords({units:audit.sampleUnits??[],surveyType,records:state.dailyRecords});
 if(resolved.error)return {error:resolved.error};
 const existing=resolved.recordIds.flatMap(recordId=>state.corrections.filter(c=>c.source===source&&c.surveyType===surveyType&&c.linkedRecordId===recordId&&c.status!=='Ditutup'));
 const required=resolved.recordIds.filter(recordId=>!hasOpenAuditRejectionCase({cases:state.corrections,source,surveyType,recordId}));
 if(required.length!==caseIds.length||new Set(caseIds).size!==caseIds.length||caseIds.some(id=>!id.trim()||state.corrections.some(c=>c.id===id)))return {error:'ID kasus tidak sesuai dengan temuan audit yang belum tercatat.'};
 const cases:CorrectionCase[]=[];
 for(let i=0;i<required.length;i++){
  const recordId=required[i],record=state.dailyRecords.find(r=>r.id===recordId&&r.surveyType===surveyType);
  if(recordId&&(!record||!state.project.routes.includes(record.road)))return {error:'Rekaman audit tidak berada dalam lingkup paket.'};
  const sourceEvidence=(audit.sampleUnits??[]).filter(unit=>unit.sourceRecordId===recordId&&unit.reviewStatus==='Tidak Valid').map(unit=>unit.evidenceReference?.trim()).filter(Boolean).join(' · ');
  cases.push({...defaultCase(state,caseIds[i]),source,blockedStage:stage,returnStage:stage,surveyType,road:record?.road??'',stationing:'',owner:'',dueDate:'',linkedRecordId:record?.id,originPciMethod:recordPciMethod(record),originalValue:record?.rawValue??'Belum ada nilai raw tertaut',rejectionReason:note,severity:level===3?'Kritis':'Mayor',originReference:sourceEvidence||input.baNumber?.trim()||audit.baNumber||undefined});
 }
 const invalidates=audit.status==='Lulus';
 const next:OperationalWorkflowState={...state,audits:state.audits.map(a=>a.level===level?{...a,status:'Ditolak' as const,decisionNote:note,baNumber:input.baNumber??a.baNumber}:invalidates&&a.level>level&&a.status!=='Belum Dimulai'?{...a,requiresReview:true,reviewReason:`Audit tingkat ${level} berubah; periksa kembali keterkaitan keputusan.`}:a) as OperationalWorkflowState['audits'],corrections:cases.length?[...cases,...state.corrections]:state.corrections,acceptance:{...state.acceptance,finalReport:false,finalAcceptance:false,terms:state.acceptance.terms.map(t=>['T3','T4'].includes(t.id)?{...t,complete:false}:t)}};
 return {next,caseId:cases[0]?.id??existing[0]?.id};
}
