import {describe,it,expect} from 'vitest';
import {createDemoWorkflow} from './demoScenario';
import {calibrationSourceSignature,calibrationReviewIsSuitable,calibrationReviewBlockedReason,CALIBRATION_REVIEW_SUBJECTS} from './calibrationReview';
import {calibrationFindingCreationError,pendingCalibrationFinding} from './calibrationCorrectionBridge';
import {correctionMutationError} from './checkpoint09Corrections';
import {defaultCase} from './correctionDefaults';
import type {CorrectionCase, CalibrationReviewEntry} from './model';
const B='PIC Balai / Pengguna Jasa' as const;
function fixture(){
 const state=createDemoWorkflow('complete');state.role=B;state.project.surveyTypes=['IRI'];
 const subject='Sertifikat kalibrasi' as const;const signature=calibrationSourceSignature(state,'IRI');
 const entry:CalibrationReviewEntry={result:'Ada ketidaksesuaian',note:'Sertifikat belum sah',evidenceReference:'BUKTI-001',reviewedAt:state.simulationDate,reviewer:B,sourceSignature:signature};
 state.calibrationReviews={IRI:{...entry,subject,sections:{[subject]:entry}}};
 const item:CorrectionCase={...defaultCase(state,'KOR-KAL-TEST'),source:'Pemeriksaan kalibrasi',blockedStage:'Kalibrasi',returnStage:'Kalibrasi',road:state.project.routes[0],surveyType:'IRI',stationing:'',linkedRecordId:undefined,fieldDataValid:'Tidak',rejectionReason:entry.note,evidence:entry.evidenceReference,calibrationFinding:{surveyType:'IRI',subject,sourceSignature:signature,reviewedAt:entry.reviewedAt}};
 return {state,item,subject};
}
describe('Tautan pemeriksaan kalibrasi → Tindakan Perbaikan',()=>{
 it('hanya Balai bisa membuat kasus dari ketidaksesuaian berbukti dan tidak duplikat',()=>{
  const {state,item,subject}=fixture();
  expect(calibrationFindingCreationError(state,item)).toBeUndefined();
  expect(correctionMutationError(state,{...state,corrections:[item,...state.corrections]})).toBeUndefined();
  const next={...state,corrections:[item,...state.corrections]};
  expect(pendingCalibrationFinding(next,'IRI',subject)?.id).toBe(item.id);
  expect(calibrationFindingCreationError(next,{...item,id:'OTHER'})).toBeTruthy();
  expect(calibrationReviewBlockedReason(next,'IRI')).toContain('tindakan perbaikan');
  expect(calibrationReviewIsSuitable(next,'IRI')).toBe(false);
  const provider={...state,role:'Penyedia Jasa / Ketua Tim' as const};
  expect(calibrationFindingCreationError(provider,item)).toBeTruthy();
  expect(calibrationFindingCreationError(state,{...item,rejectionReason:'Catatan palsu'})).toBeTruthy();
 });
 it('hasil sesuai pada empat bagian tidak mengabaikan kasus perbaikan yang belum ditutup',()=>{
  const {state,item}=fixture();
  const signature=calibrationSourceSignature(state,'IRI');
  const passed:CalibrationReviewEntry={result:'Sesuai',note:'Telah diperiksa',evidenceReference:'',reviewedAt:state.simulationDate,reviewer:B,sourceSignature:signature};
  state.calibrationReviews={IRI:{...passed,subject:'Alat dan personel',sections:Object.fromEntries(CALIBRATION_REVIEW_SUBJECTS.map(subject=>[subject,passed]))}};
  state.corrections=[item,...state.corrections];
  expect(calibrationReviewIsSuitable(state,'IRI')).toBe(false);
  item.status='Ditutup';
  expect(calibrationReviewIsSuitable(state,'IRI')).toBe(true);
 });
 it('tidak membuka kasus dari klarifikasi atau pemeriksaan yang usang',()=>{
  const {state,item}=fixture();
  state.calibrationReviews!.IRI!.sections!['Sertifikat kalibrasi']!.result='Perlu klarifikasi';
  expect(calibrationFindingCreationError(state,item)).toBeTruthy();
  state.calibrationReviews!.IRI!.sections!['Sertifikat kalibrasi']!.result='Ada ketidaksesuaian';
  state.calibrations.push({...state.calibrations[0],id:'CAL-CHANGED'});
  expect(calibrationFindingCreationError(state,item)).toBeTruthy();
 });
});
