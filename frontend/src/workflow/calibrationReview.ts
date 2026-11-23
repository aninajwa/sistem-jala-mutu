import type {OperationalWorkflowState, SurveyType, CalibrationReviewSubject, CalibrationReviewEntry, CalibrationReview} from './model';
import {sourceDocument, sourceDocumentKey} from './sourceDocumentModel';
import {readLocal} from './repository/localPersistence';
import {validateSourceDocument} from './sourceFormValidation';
import {daysBetween} from './model';

/** Fingerprint the actual calibration material, not merely its completion flag. */
export function calibrationSourceSignature(state: OperationalWorkflowState,type: SurveyType):string {
 const doc=sourceDocument(type,'calibration',state.productionTests.PCI.pciManual!==false);
 const answers=doc ? readLocal<Record<string,string>>(sourceDocumentKey(state.project.id,doc.id),doc.derivedFrom?readLocal<Record<string,string>>(sourceDocumentKey(state.project.id,doc.derivedFrom),{}):{}) : {};
 const records=state.calibrations.filter(record=>record.surveyType===type);
 const raw=JSON.stringify({records,checklist:!!state.calibrationChecklist[type],answers});
 let hash=2166136261;
 for(let i=0;i<raw.length;i++){hash^=raw.charCodeAt(i);hash=Math.imul(hash,16777619);}
 return (hash>>>0).toString(16);
}
export const CALIBRATION_REVIEW_SUBJECTS: CalibrationReviewSubject[] = [
 'Alat dan personel','Sertifikat kalibrasi','Hasil kalibrasi','Dokumen pendukung'
];
export function calibrationReviewEntries(state:OperationalWorkflowState,type:SurveyType):Partial<Record<CalibrationReviewSubject,CalibrationReviewEntry>>{
 const record=state.calibrationReviews?.[type];
 if(!record)return {};
 // Previous single-section records remain visible, never silently count as four inspections.
 return record.sections ?? {[record.subject]:record};
}
/** Each section can be assessed independently, while a final approval still needs all four. */
export function calibrationSubjectEvidenceReady(state:OperationalWorkflowState,type:SurveyType,subject:CalibrationReviewSubject):boolean{
 const records=state.calibrations.filter(item=>item.surveyType===type);
 if(subject==='Alat dan personel')return records.length>0 && records.every(item=>item.condition==='Baik' && daysBetween(state.simulationDate,item.dueDate)>=0 && item.qualificationValid && item.trainingVerified);
 if(subject==='Sertifikat kalibrasi')return records.length>0 && records.every(item=>!!item.certificateReference?.trim() && daysBetween(state.simulationDate,item.dueDate)>=0);
 const doc=sourceDocument(type,'calibration',state.productionTests.PCI.pciManual!==false);
 if(!doc)return false;
 const answers=readLocal<Record<string,string>>(sourceDocumentKey(state.project.id,doc.id),doc.derivedFrom?readLocal<Record<string,string>>(sourceDocumentKey(state.project.id,doc.derivedFrom),{}):{});
 const formComplete=!!state.calibrationChecklist[type] && validateSourceDocument(doc,answers,state.project).complete;
 if(subject==='Hasil kalibrasi')return formComplete;
 return formComplete && records.length>0 && records.every(item=>!!item.standardReference?.trim());
}
export function calibrationReviewIsCurrent(state:OperationalWorkflowState,type:SurveyType){
 const entries=calibrationReviewEntries(state,type),signature=calibrationSourceSignature(state,type);
 return CALIBRATION_REVIEW_SUBJECTS.every(subject=>entries[subject]?.sourceSignature===signature);
}
export function calibrationReviewIsSuitable(state:OperationalWorkflowState,type:SurveyType){
 const entries=calibrationReviewEntries(state,type),signature=calibrationSourceSignature(state,type);
 return CALIBRATION_REVIEW_SUBJECTS.every(subject=>entries[subject]?.sourceSignature===signature && entries[subject]?.result==='Sesuai' && !state.corrections.some(c=>c.calibrationFinding?.surveyType===type&&c.calibrationFinding?.subject===subject&&c.status!=='Ditutup'));
}
export function calibrationReviewBlockedReason(state:OperationalWorkflowState,type:SurveyType):string|undefined{
 const entries=calibrationReviewEntries(state,type),signature=calibrationSourceSignature(state,type);
 // An active formal correction takes priority over incomplete sections: the
 // blocker must remain visible even when other calibration checks are pending.
 for(const subject of CALIBRATION_REVIEW_SUBJECTS){
  const openCase=state.corrections.find(c=>c.calibrationFinding?.surveyType===type&&c.calibrationFinding?.subject===subject&&c.status!=='Ditutup');
  if(openCase)return `${subject}: tindakan perbaikan ${openCase.id} belum ditutup`;
 }
 for(const subject of CALIBRATION_REVIEW_SUBJECTS){
  const r=entries[subject];
  if(!r)return `${subject}: belum diperiksa`;
  if(r.sourceSignature!==signature)return `${subject}: hasil pemeriksaan perlu diperbarui setelah perubahan data`;
  if(r.result==='Perlu klarifikasi')return `${subject}: klarifikasi kalibrasi belum dituntaskan`;
  if(r.result==='Ada ketidaksesuaian')return `${subject}: ketidaksesuaian kalibrasi belum diselesaikan`;
 }
 return undefined;
}
export function canRespondToCalibrationReview(review:CalibrationReviewEntry|undefined):boolean{
 return !!review && review.result!=='Sesuai';
}
export function isOnlyCalibrationResponseUpdate(before:OperationalWorkflowState,after:OperationalWorkflowState):boolean{
 const old=before.calibrationReviews??{},next=after.calibrationReviews??{};
 const types=new Set([...Object.keys(old),...Object.keys(next)]);
 let changed=false;
 for(const type of types){
  const a=old[type as SurveyType],b=next[type as SurveyType];
  if(JSON.stringify(a)===JSON.stringify(b))continue;
  if(!a||!b||!b.sections)return false;
  const aRoot={...a,sections:undefined},bRoot={...b,sections:undefined};
  if(JSON.stringify(aRoot)!==JSON.stringify(bRoot))return false;
  const oldSections=calibrationReviewEntries(before,type as SurveyType);
  const subjects=new Set([...Object.keys(oldSections),...Object.keys(b.sections)]);
  for(const key of subjects){
   const subject=key as CalibrationReviewSubject;
   const beforeEntry=oldSections[subject],afterEntry=b.sections[subject];
   if(JSON.stringify(beforeEntry)===JSON.stringify(afterEntry))continue;
   if(!beforeEntry||!canRespondToCalibrationReview(beforeEntry)||!afterEntry||!afterEntry.response?.note?.trim())return false;
   if(beforeEntry.response && JSON.stringify(beforeEntry.response)!==JSON.stringify(afterEntry.response))return false;
   if(beforeEntry.sourceSignature!==calibrationSourceSignature(before,type as SurveyType))return false;
   if(JSON.stringify({...beforeEntry,response:undefined})!==JSON.stringify({...afterEntry,response:undefined}))return false;
   changed=true;
  }
 }
 return changed;
}
export function validCalibrationReviewShape(state:OperationalWorkflowState):boolean {
 return Object.entries(state.calibrationReviews??{}).every(([type,review])=>{
  if(!state.project.surveyTypes.includes(type as SurveyType))return false;
  if(!review)return true;
  if(!review.note?.trim() || (review.result==='Ada ketidaksesuaian'&&!review.evidenceReference?.trim()))return false;
  if(!review.sections)return true;
  return Object.entries(review.sections).every(([subject,section])=>
   CALIBRATION_REVIEW_SUBJECTS.includes(subject as CalibrationReviewSubject) && !!section?.note?.trim() &&
   (section.result!=='Ada ketidaksesuaian'||!!section.evidenceReference?.trim()) &&
   (!section.response || (section.result!=='Sesuai'&&!!section.response.note?.trim()))
  );
 });
}

export function changedSuitableCalibrationSectionIsInvalid(before:OperationalWorkflowState,after:OperationalWorkflowState):boolean{
 for(const type of after.project.surveyTypes){
  const old=calibrationReviewEntries(before,type),next=calibrationReviewEntries(after,type);
  for(const subject of CALIBRATION_REVIEW_SUBJECTS){
   const section=next[subject];
   if(section?.result==='Sesuai'&&JSON.stringify(section)!==JSON.stringify(old[subject])&&
      (!calibrationSubjectEvidenceReady(after,type,subject)||after.corrections.some(c=>c.calibrationFinding?.surveyType===type&&c.calibrationFinding?.subject===subject&&c.status!=='Ditutup')))return true;
  }
 }
 return false;
}
