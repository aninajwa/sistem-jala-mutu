import {periodRange} from '../stages/periodSchedule';
import {stagedSurveyReviewMode,stagedFallbackReviewReady} from '../stagedReviewPolicy';
import type {OperationalWorkflowState,SurveyType} from '../model';
import {sourceInspectionStatus} from './sourceChecklistRepository';
import {sourceDocument,sourceDocumentKey,documentAnswersComplete} from '../sourceDocumentModel';
import {readLocal} from './localPersistence';
export const SOURCE_FORM_CHANGED='jala-source-form-changed';
export type ReconciliationIssue={stage:string;message:string};
/** Read-only reconciliation. Historical decisions are retained, never silently upgraded/reset. */
export function workflowFormIssues(state:OperationalWorkflowState):ReconciliationIssue[]{
 const issues:ReconciliationIssue[]=[];
 const check=(scope:string,type:SurveyType,phase:string,stage:string,label:string)=>{if(!sourceInspectionStatus(scope,type,phase,state.productionTests.PCI.pciManual!==false,state.project).complete)issues.push({stage,message:`${type}: ${label} belum lengkap menurut formulir yang berlaku.`});};
 for(const type of state.project.surveyTypes){
  if(type==='Lendutan'&&(state.acceptance.finalAcceptance||state.audits.every(audit=>audit.status==='Lulus')))check(state.project.id,type,'acceptance','Tahap 6','formulir penerimaan');
  if(state.calibrationChecklist[type])check(state.project.id,type,'calibration','Tahap 1','isian kalibrasi');
  if(state.submission.validationStatus==='VALID'){if(stagedSurveyReviewMode(type,state.productionTests.PCI.pciManual!==false)==='generic-review'){if(!stagedFallbackReviewReady(state,type))issues.push({stage:'Tahap 4',message:`${type}: pemeriksaan bertahap Balai belum tercatat sesuai sumber yang tersedia.`});}else check(state.project.id,type,'staged','Tahap 4','pemeriksaan bertahap');}
  for(const audit of state.audits)if(audit.status==='Lulus')check(`${state.project.id}::audit-${audit.level}`,type,'audit','Tahap 5',`Audit Tingkat ${audit.level}`);
 }
 const periods={...state.cycleHistory,[String(state.activeCyclePeriod??1)]:state.cycle};
 for(const [number,cycle] of Object.entries(periods)){
  if(!cycle.certificateId)continue;
  const scope=number==='1'?state.project.id:`${state.project.id}::period-${number}`;
  const range=periodRange(state.project.id,Number(number),state.project.surveyStartDate,state.project.surveyEndDate);
  const projectInfo={...state.project,periodStart:range.start,periodEnd:range.end};
  for(const type of state.project.surveyTypes)for(const phase of ['consistency','internal','periodic14']){
   const status=sourceInspectionStatus(scope,type,phase,state.productionTests.PCI.pciManual!==false,projectInfo);
   if(!status.complete||type==='Lendutan'&&phase==='periodic14'&&status.concerns.length)issues.push({stage:'Tahap 3B',message:`Periode ${number} · ${type}: ${phase==='consistency'?'Konsistensi':phase==='internal'?'V&V Internal':'V&V Bersama'} belum lengkap pada formulir yang berlaku.`});
  }
 }
 return issues;
}
