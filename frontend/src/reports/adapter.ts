import type { OperationalWorkflowState } from '../workflow/model';
import type { Principal } from '../workflow/repository/contracts';
import { isValidReviewDate } from '../pages/reviewDateValidation';
import type { ReportRow, ReportSnapshot } from './model';
/** Adapter for the current LOCAL package store. No network or fabricated API contract. */
export function readLocalReports(input:Record<string,OperationalWorkflowState>, principal:Principal):ReportSnapshot {
 const result:ReportSnapshot={packages:{},rows:{activities:[],reviews:[],corrections:[],stages:[]},warnings:[],denied:principal.role==='Admin'};
 if(result.denied || !['Penyedia Jasa / Ketua Tim','PIC Balai / Pengguna Jasa','Direktorat / Pusat'].includes(principal.role)) {result.denied=true;return result;}
 for(const [id,p] of Object.entries(input)) {
  if(id!==p.project.id || !principal.packageIds.includes(id)) continue;
  result.packages[id]=p;
  const base={packageId:id,packageName:p.project.packageName||id,balai:p.project.balai||'Belum ditentukan'};
  const append=(kind:keyof ReportSnapshot['rows'], rows:ReportRow[])=>{
   const grouped=new Map<string,ReportRow[]>();
   for(const row of rows) {const group=grouped.get(row.key)||[];group.push(row);grouped.set(row.key,group);}
   for(const group of grouped.values()) {
    // Exclude ambiguous duplicate identities rather than selecting an arbitrary version.
    if(group.length>1){result.warnings.push(`${id}: identitas ganda pada ${kind}; rekaman dikeluarkan.`);continue;}
    result.rows[kind].push(group[0]);
   }
  };
  append('activities',p.dailyRecords.filter(r=>!!r.id).map(r=>({...base,key:JSON.stringify([id,'activity',r.id]),survey:r.surveyType,date:isValidReviewDate(r.date)?r.date:'',dateBasis:'Tanggal kegiatan',status:r.state,reference:r.id,context:r.road||'Ruas belum diisi'})));
  const reviews:ReportRow[]=[];
  const addReview=(stage:string,source:typeof p.cycle.surveyReviews,pending:string[]=[])=>{
   for(const [survey,r] of Object.entries(source||{})) {
    if(!r || !p.project.surveyTypes.includes(survey as typeof p.project.surveyTypes[number]))continue;
    const isPending=pending.includes(survey);
    reviews.push({...base,key:JSON.stringify([id,stage,survey]),survey,date:!isPending&&isValidReviewDate(r.reviewedAt)?r.reviewedAt:'',dateBasis:'Tanggal keputusan terkini',status:isPending?'Dalam pemeriksaan':r.decision,reference:stage,context:stage==='Verval berkala'?`Periode aktif ${p.activeCyclePeriod ?? 1}`:'V&V bertahap'});
   }
  };
  addReview('Verval berkala',p.cycle.surveyReviews,p.cycle.reviewPendingTypes);
  addReview('V&V bertahap',p.submission.stagedReviews);
  append('reviews',reviews);
  // Current workflow state; no inferred decision dates or cross-stage approvals.
  const stages:ReportRow[]=[];
  const addStage=(stage:string, ref:string, status:string, survey='—', date='', context=stage)=>stages.push({...base,key:JSON.stringify([id,'stage',stage,ref,survey]),survey,date:isValidReviewDate(date)?date:'',dateBasis:isValidReviewDate(date)?'Tanggal keputusan tercatat':'Status terkini (tanpa tanggal keputusan)',status,reference:ref,context:context===stage?stage:`${stage} · ${context}`});
  addStage('Tahap 0','Persetujuan persiapan',p.project.preparation.reportApproval);
  for(const survey of p.project.surveyTypes){
   const review=p.calibrationReviews?.[survey];
   for(const [subject,entry] of Object.entries(review?.sections??{})) if(entry) addStage('Tahap 1',subject,entry.result,survey,entry.reviewedAt,'Kalibrasi · keputusan tercatat, bukan validitas bukti terkini');
   if(!Object.keys(review?.sections??{}).length) addStage('Tahap 1',review?.subject??'Kalibrasi',review?.result??'Belum diperiksa',survey,review?.reviewedAt??'','Kalibrasi · keputusan tercatat, bukan validitas bukti terkini');
  }
  addStage('Tahap 2','Persetujuan produksi',p.productionApproval,'—','',p.productionApprovalBa||'Validasi produksi');
  for(const audit of p.audits) addStage('Tahap 5',`Audit Tingkat ${audit.level}`,audit.requiresReview?'Perlu pemeriksaan ulang':audit.status,'—','',audit.baNumber||'Audit QA/QC');
  addStage('Tahap 6','Penerimaan akhir',p.acceptance.acceptanceDecision??'Belum Diperiksa','—','',p.acceptance.finalAcceptanceBa||'Penerimaan data');
  append('stages',stages);
  append('corrections',p.corrections.filter(c=>!!c.id).map(c=>({...base,key:JSON.stringify([id,'correction',c.id]),survey:c.surveyType,date:isValidReviewDate(c.dueDate)?c.dueDate:'',dateBasis:'Tenggat tindakan (bukan tanggal temuan)',status:c.status,reference:c.id,context:c.blockedStage||c.source})));
 }
 for(const rows of Object.values(result.rows)) rows.sort((a,b)=>b.date.localeCompare(a.date)||a.key.localeCompare(b.key));
 return result;
}
