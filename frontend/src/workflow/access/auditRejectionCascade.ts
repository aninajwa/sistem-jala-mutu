import {applyAuditRejection,auditRejectionAction} from '../auditRejectionTransition';
import type {OperationalWorkflowState} from '../model';
import {matchesJournaledTransition} from './providerChecklistCascade';

/** Match the exact permitted audit rejection including source-linked cases and
 * derived readiness invalidation. Never authorize arbitrary additional edits. */
export function isAuditRejectionCascade(before:OperationalWorkflowState,after:OperationalWorkflowState):boolean {
 const level=before.role==='Penyedia Jasa / Ketua Tim'?1:before.role==='PIC Balai / Pengguna Jasa'?2:before.role==='Direktorat / Pusat'?3:undefined;
 if(!level)return false;
 const audit=after.audits[level-1];
 if(!audit||audit.status!=='Ditolak')return false;
 const added=after.corrections.filter(c=>!before.corrections.some(old=>old.id===c.id));
 if(added.some(c=>c.source!==`Penolakan audit tingkat ${level}`))return false;
 const types=added.length?[...new Set(added.map(c=>c.surveyType))]:before.project.surveyTypes;
 for(const surveyType of types){
  const result=applyAuditRejection(before,{level,surveyType,note:audit.decisionNote,baNumber:audit.baNumber,caseIds:added.map(c=>c.id)});
  if(result.next&&matchesJournaledTransition(before,result.next,after,[auditRejectionAction(level)],`Audit tingkat ${level}`))return true;
 }
 return false;
}
