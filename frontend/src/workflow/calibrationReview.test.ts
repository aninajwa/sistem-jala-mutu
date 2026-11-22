import {describe,it,expect} from 'vitest';
import {createDemoWorkflow} from './demoScenario';
import {canPerformAction} from './workflowPermissions';
import {workflowMutationError} from './workflowMutationPermissions';
import {calibrationReviewIsCurrent,calibrationReviewIsSuitable,calibrationSourceSignature} from './calibrationReview';
import {productionReviewBlockers} from './reviewReadiness';

describe('Pemeriksaan kalibrasi Balai',()=>{
 it('hanya Balai dapat mencatat pemeriksaan; admin dan Direktorat tidak bisa',()=>{
  expect(canPerformAction('PIC Balai / Pengguna Jasa','calibration.review')).toBe(true);
  for(const role of ['Penyedia Jasa / Ketua Tim','Direktorat / Pusat','Admin'] as const)expect(canPerformAction(role,'calibration.review')).toBe(false);
 });
 it('hasil pemeriksaan harus disertai catatan, bukti wajib untuk ketidaksesuaian',()=>{
  const s=createDemoWorkflow('complete');s.project.surveyTypes=['IRI'];s.role='PIC Balai / Pengguna Jasa';
  const good={result:'Perlu klarifikasi' as const,subject:'Sertifikat kalibrasi' as const,note:'Sertifikat perlu dijelaskan',evidenceReference:'',reviewedAt:s.simulationDate,reviewer:s.role as 'PIC Balai / Pengguna Jasa',sourceSignature:calibrationSourceSignature(s,'IRI')};
  const after={...s,calibrationReviews:{IRI:good}};
  expect(workflowMutationError(s,after,'/documents:Kalibrasi & personel')).toBeUndefined();
  expect(workflowMutationError(s,{...after,calibrationReviews:{IRI:{...good,result:'Ada ketidaksesuaian'}}},'/documents:Kalibrasi & personel')).toBeTruthy();
  const dir={...s,role:'Direktorat / Pusat' as const};
  expect(workflowMutationError(dir,{...dir,calibrationReviews:{IRI:good}},'/documents:Kalibrasi & personel')).toBeTruthy();
 });
 it('perubahan kalibrasi menjadikan hasil lama perlu ditinjau ulang; klarifikasi tidak membuka persetujuan',()=>{
  const s=createDemoWorkflow('complete');s.project.surveyTypes=['IRI'];
  const base={subject:'Alat dan personel' as const,note:'Periksa dokumen',evidenceReference:'',reviewedAt:s.simulationDate,reviewer:'PIC Balai / Pengguna Jasa' as const,sourceSignature:calibrationSourceSignature(s,'IRI')};
  s.calibrationReviews={IRI:{...base,result:'Perlu klarifikasi'}};
  expect(calibrationReviewIsCurrent(s,'IRI')).toBe(false); // satu catatan lama tidak mewakili empat bagian
  expect(calibrationReviewIsSuitable(s,'IRI')).toBe(false);
  expect(productionReviewBlockers(s).some(b=>b.includes('klarifikasi kalibrasi'))).toBe(true);
  s.calibrations=[...s.calibrations,{...s.calibrations[0],id:'alat-baru',surveyType:'IRI'}];
  expect(calibrationReviewIsCurrent(s,'IRI')).toBe(false);
  expect(productionReviewBlockers(s).some(b=>b.includes('perlu diperbarui'))).toBe(true);
 });
});
