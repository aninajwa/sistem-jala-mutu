import {describe,it,expect} from 'vitest';
import {createDemoWorkflow} from './demoScenario';
import {calibrationSourceSignature,CALIBRATION_REVIEW_SUBJECTS,calibrationReviewIsSuitable,calibrationReviewBlockedReason,isOnlyCalibrationResponseUpdate,validCalibrationReviewShape} from './calibrationReview';
import {workflowMutationError as mutationError} from './workflowMutationPermissions';
import {workflowMutationError as boundaryError} from './access/workflowMutationGuard';
import type {CalibrationReviewEntry,OperationalWorkflowState} from './model';
const B='PIC Balai / Pengguna Jasa' as const;
const P='Penyedia Jasa / Ketua Tim' as const;
function fixture(){
 const s=createDemoWorkflow('complete');s.project.surveyTypes=['IRI'];s.role=B;
 const signature=calibrationSourceSignature(s,'IRI');
 const entry:CalibrationReviewEntry={result:'Sesuai',note:'Pemeriksaan bukti sesuai',evidenceReference:'',reviewedAt:s.simulationDate,reviewer:B,sourceSignature:signature};
 return {s,entry};
}
describe('Pemeriksaan kalibrasi empat bagian',()=>{
 it('status satu bagian tidak pernah memenuhi empat bagian atau menimpa bagian lain',()=>{
  const {s,entry}=fixture();
  s.calibrationReviews={IRI:{...entry,subject:'Alat dan personel',sections:{'Alat dan personel':entry}}};
  expect(calibrationReviewIsSuitable(s,'IRI')).toBe(false);
  expect(calibrationReviewBlockedReason(s,'IRI')).toContain('Sertifikat kalibrasi');
  s.calibrationReviews.IRI!.sections=Object.fromEntries(CALIBRATION_REVIEW_SUBJECTS.map(subject=>[subject,{...entry}])) as typeof s.calibrationReviews.IRI.sections;
  expect(calibrationReviewIsSuitable(s,'IRI')).toBe(true);
  s.calibrationReviews.IRI!.sections!['Dokumen pendukung']={...entry,result:'Perlu klarifikasi'};
  expect(calibrationReviewIsSuitable(s,'IRI')).toBe(false);
  expect(calibrationReviewBlockedReason(s,'IRI')).toContain('klarifikasi');
 });
 it('perubahan data mengharuskan pemeriksaan ulang namun hasil lama tetap tersedia',()=>{
  const {s,entry}=fixture();
  s.calibrationReviews={IRI:{...entry,subject:'Alat dan personel',sections:Object.fromEntries(CALIBRATION_REVIEW_SUBJECTS.map(subject=>[subject,{...entry}]))}};
  const before=JSON.stringify(s.calibrationReviews);
  s.calibrations.push({...s.calibrations[0],id:'new-calibration',surveyType:'IRI'});
  expect(calibrationReviewIsSuitable(s,'IRI')).toBe(false);
  expect(calibrationReviewBlockedReason(s,'IRI')).toContain('diperbarui');
  expect(JSON.stringify(s.calibrationReviews)).toBe(before);
 });
 it('Penyedia boleh mengirim tanggapan sekali, tidak boleh memalsukan keputusan Balai',()=>{
  const {s,entry}=fixture();
  s.role=P;
  const clarification={...entry,result:'Perlu klarifikasi' as const};
  s.calibrationReviews={IRI:{...clarification,subject:'Sertifikat kalibrasi',sections:{'Sertifikat kalibrasi':clarification}}};
  const after:OperationalWorkflowState={...s,calibrationReviews:{IRI:{...s.calibrationReviews.IRI!,sections:{'Sertifikat kalibrasi':{...clarification,response:{note:'Sertifikat diperjelas',respondedAt:s.simulationDate}}}}}};
  expect(isOnlyCalibrationResponseUpdate(s,after)).toBe(true);
  expect(mutationError(s,after,'/documents:Kalibrasi & personel')).toBeUndefined();
  expect(boundaryError(s,after,P)).toBeUndefined();
  const forged=structuredClone(after);
  forged.calibrationReviews!.IRI!.sections!['Sertifikat kalibrasi']!.result='Sesuai';
  expect(isOnlyCalibrationResponseUpdate(s,forged)).toBe(false);
  expect(mutationError(s,forged,'/documents:Kalibrasi & personel')).toBeTruthy();
  expect(boundaryError(s,forged,P)).toBeTruthy();
 });
 it('semua bagian mengharuskan catatan; ketidaksesuaian mewajibkan bukti',()=>{
  const {s,entry}=fixture();
  s.calibrationReviews={IRI:{...entry,subject:'Hasil kalibrasi',sections:{'Hasil kalibrasi':{...entry,result:'Ada ketidaksesuaian'}}}};
  expect(validCalibrationReviewShape(s)).toBe(false);
  s.calibrationReviews.IRI!.sections!['Hasil kalibrasi']!.evidenceReference='BERITA-ACARA-01';
  expect(validCalibrationReviewShape(s)).toBe(true);
 });
});
