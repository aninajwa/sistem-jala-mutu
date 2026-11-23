import { submittedPeriodicRecords } from './periodicRecords';
import type {OperationalWorkflowState,SurveyType} from './model';
import {defaultCase} from './correctionDefaults';
import {invalidateVervalStages} from './dependentStageInvalidation';
import {reviewSurvey} from './periodicReview';
import {periodicSurveyTypes} from './reviewReadiness';
import {evaluateStageGate} from './workflowGate';
/** KAK 2026 11.10.7–8: a Balai finding opens remediation and invalidates
 * downstream readiness, while all previous audit decisions and BA remain. */
export function applyPeriodicFinding(state:OperationalWorkflowState,type:SurveyType,id:string):OperationalWorkflowState {
 const types=periodicSurveyTypes(state),period=state.activeCyclePeriod??1,note=state.cycle.surveyReviews?.[type]?.note??'';
 if(state.role!=='PIC Balai / Pengguna Jasa'||!state.cycle.periodCompleted||!submittedPeriodicRecords(state).confirmed||state.cycle.providerResubmissionRequired||!types.includes(type)||!note.trim()||!id||
    !evaluateStageGate(state,'Tahap 2').readyToComplete||state.corrections.some(c=>c.id===id||c.source==='Temuan proses verval'&&c.status!=='Ditutup'&&c.surveyType===type&&(c.cyclePeriod===undefined||c.cyclePeriod===period)))return state;
 const finding={...defaultCase(state,id),source:'Temuan proses verval',cyclePeriod:period,surveyType:type,blockedStage:'Verval 14 hari',returnStage:'Verval 14 hari',rejectionReason:note};
 return {...invalidateVervalStages(state,'Temuan pemeriksaan periode memerlukan tindak lanjut.'),
  cycle:{...state.cycle,...reviewSurvey(state.cycle,type,{userReview:'Temuan'},state.simulationDate,types)},corrections:[finding,...state.corrections]};
}
