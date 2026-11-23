import { submittedPeriodicRecords } from '../periodicRecords';
import type {OperationalWorkflowState} from '../model';
import {applyPeriodicFinding} from '../periodicFinding';
import {matchesJournaledTransition} from './providerChecklistCascade';
/** Allow only the full transition produced by the Balai finding action.
 * Comparing the whole state rejects forged audit flags/history/BA and extra writes. */
export function isBalaiVervalCascade(before:OperationalWorkflowState,after:OperationalWorkflowState){
 if(before.role!=='PIC Balai / Pengguna Jasa'||after.corrections.length!==before.corrections.length+1)return false;
 const finding=after.corrections[0];
 if(!finding||before.corrections.some(c=>c.id===finding.id))return false;
 const expected=applyPeriodicFinding(before,finding.surveyType,finding.id);
 return expected!==before&&matchesJournaledTransition(before,expected,after,['Buka kasus dari pemeriksaan proses verval'],finding.id);
}

import {applyCycleEdit} from '../cycleEdit';
import {reviewSurvey} from '../periodicReview';
import {periodicSurveyTypes} from '../reviewReadiness';
import {periodSourceReady,recordPeriodicBa} from '../periodicDecision';
import {evaluateStageGate} from '../workflowGate';
/** Reconstruct each allowed Balai review/evidence/BA action and its exact cascade. */
export function isBalaiPeriodDecision(before:OperationalWorkflowState,after:OperationalWorkflowState){
 if(before.role!=='PIC Balai / Pengguna Jasa'||!before.cycle.periodCompleted||!submittedPeriodicRecords(before).confirmed||before.cycle.providerResubmissionRequired||!evaluateStageGate(before,'Tahap 2').readyToComplete)return false;
 const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
 const types=periodicSurveyTypes(before),action='Catat pemeriksaan Pengguna Jasa dan bukti akhir periode';
 for(const type of types){
  const old=before.cycle.surveyReviews?.[type],review=after.cycle.surveyReviews?.[type];
  const clearsPending=before.cycle.reviewPendingTypes?.includes(type)&&!after.cycle.reviewPendingTypes?.includes(type);
  if(!review||equal(old,review)&&!clearsPending)continue;
  const patch:Partial<OperationalWorkflowState['cycle']>={};
  if(review.note!==(old?.note??''))patch.userReviewNote=review.note;
  if(clearsPending||review.decision!==(old?.decision??'Belum Diperiksa')||review.reviewedAt!==(old?.reviewedAt??'')){
   // Findings must open their linked correction through applyPeriodicFinding.
   if(review.decision==='Temuan'&&!before.corrections.some(c=>c.source==='Temuan proses verval'&&c.status!=='Ditutup'&&c.surveyType===type&&(c.cyclePeriod===undefined||c.cyclePeriod===(before.activeCyclePeriod??1))))continue;
   if(review.decision==='Sesuai'&&(!before.cycle.periodCompleted||!submittedPeriodicRecords(before).confirmed||!periodSourceReady(before,type,'periodic14')))continue;
   patch.userReview=review.decision;
  }
  const expected=applyCycleEdit(before,reviewSurvey(before.cycle,type,patch,before.simulationDate,types));
  if(matchesJournaledTransition(before,expected,after,[action],before.project.packageName))return true;
 }
 for(const key of ['bridgeFieldValidation','finalPeriodValidation','bridgeValidatedPercent','bridgeValidationReport','finalValidationLocation','finalToolUnchanged'] as const){
  if(equal(before.cycle[key],after.cycle[key]))continue;
  const expected=applyCycleEdit(before,{[key]:after.cycle[key]});
  const allowed=key==='bridgeFieldValidation'?['Validasi lapangan jembatan']:key==='finalPeriodValidation'?['Validasi akhir periode']:[action];
  if(matchesJournaledTransition(before,expected,after,allowed,before.project.packageName))return true;
 }
 const expected=recordPeriodicBa(before,after.cycle.certificateId);
 return expected!==before&&matchesJournaledTransition(before,expected,after,['Catat BA verval Balai 14 hari'],after.cycle.certificateId);
}
