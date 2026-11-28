import type { OperationalWorkflowState, WorkflowRole } from '../workflow/model';
import { calibrationReviewEntries, calibrationSourceSignature, CALIBRATION_REVIEW_SUBJECTS } from '../workflow/calibrationReview';
import { effectiveProductionApproval } from '../workflow/workflowGate';
import { periodicSurveyTypes } from '../workflow/reviewReadiness';
import { stagedSurveyReviewMode } from '../workflow/stagedReviewPolicy';
import { sourceInspectionStatus } from '../workflow/repository/sourceChecklistRepository';
import { stagedDecisionProjection } from '../workflow/ba/stagedDecisionProjection';
import { isAdministrativeReminder } from '../workflow/correctionSourcePolicy';
import { projectDecisionHistory } from './biDecisionHistory';

export const QUALITY_CATEGORIES = ['Kalibrasi','Persetujuan produksi','Verval berkala','Verval bertahap','Audit Tingkat 1','Audit Tingkat 2','Audit Tingkat 3','Penerimaan akhir'] as const;
export type Category = typeof QUALITY_CATEGORIES[number];
export type QualityStatus = 'Sesuai'|'Temuan'|'Belum diputuskan'|'Perlu pemeriksaan ulang'|'Klarifikasi'|'Diterima dengan catatan'|'Diterima bersyarat'|'Ditolak sebagian';
export type QualityRow = {id:string;packageId:string;packageName:string;balai:string;survey:string;category:Category;object:string;status:QualityStatus;detail:string;date:string;period?:number;auditLevel?:1|2|3};
export type QualityScope = Record<string,OperationalWorkflowState>;
export const canAnalyze = (role:WorkflowRole) => role==='PIC Balai / Pengguna Jasa'||role==='Direktorat / Pusat';
export const validScope = (packages:QualityScope) => Object.fromEntries(Object.entries(packages).filter(([id,s])=>id===s.project.id));
export function qualityRows(packages:QualityScope,role:WorkflowRole):QualityRow[]{
 if(!canAnalyze(role))return [];
 const rows:QualityRow[]=[];
 for(const [packageId,s] of Object.entries(validScope(packages))){
 const base={packageId,packageName:s.project.packageName,balai:s.project.balai||'Belum ditentukan'};
 const add=(category:Category,survey:string,object:string,status:QualityStatus,detail='',date='',period?:number,auditLevel?:1|2|3)=>rows.push({...base,id:JSON.stringify([packageId,category,survey,object,period,auditLevel]),category,survey,object,status,detail,date,period,auditLevel});
 const decision=(v:string|undefined):QualityStatus=>v==='Sesuai'||v==='Lulus'||v==='Disetujui'||v==='Diterima'?'Sesuai':v==='Temuan'||v==='Ditolak'||v==='Ada ketidaksesuaian'?'Temuan':v==='Perlu klarifikasi'||v==='Klarifikasi'?'Klarifikasi':v==='Diterima dengan Catatan'?'Diterima dengan catatan':'Belum diputuskan';
 for(const survey of new Set(s.project.surveyTypes)){
 const entries=calibrationReviewEntries(s,survey),signature=calibrationSourceSignature(s,survey);
 for(const subject of CALIBRATION_REVIEW_SUBJECTS){const r=entries[subject];const stale=!!r&&r.sourceSignature!==signature;const open=s.corrections.some(c=>c.calibrationFinding?.surveyType===survey&&c.calibrationFinding.subject===subject&&c.status!=='Ditutup');add('Kalibrasi',survey,subject,stale?'Perlu pemeriksaan ulang':open?'Temuan':decision(r?.result),stale?'Bukti berubah sejak pemeriksaan':open?'Tindakan perbaikan masih terbuka':r?.evidenceReference||'',r?.reviewedAt||'');}
 const mode=stagedSurveyReviewMode(survey,s.productionTests.PCI.pciManual!==false);
 if(mode==='source-form'){
 const result=sourceInspectionStatus(packageId,survey,'staged',s.productionTests.PCI.pciManual!==false,s.project);
 const projection=stagedDecisionProjection(s,survey);
 add('Verval bertahap',survey,'Checklist sumber',projection?.status??'Belum diputuskan',[projection?.detail,result.complete?'':result.reason].filter(Boolean).join(' · '),projection?.date??'');
 }else{const r=s.submission.stagedReviews?.[survey];add('Verval bertahap',survey,'Review Balai',decision(r?.decision),r?.note||'',r?.reviewedAt||'');}
 }
 const active=s.activeCyclePeriod??1;
 const cycles={...s.cycleHistory,[String(active)]:s.cycle};
 for(const [key,cycle] of Object.entries(cycles)){
 const period=Number(key);if(!Number.isSafeInteger(period)||period<1)continue;
 for(const survey of periodicSurveyTypes({...s,cycle})){
 const r=cycle.surveyReviews?.[survey];const pending=cycle.requiresReview||cycle.reviewPendingTypes?.includes(survey)||cycle.providerResubmissionRequired;
 add('Verval berkala',survey,`Siklus ${period}`,pending?'Perlu pemeriksaan ulang':decision(r?.decision),pending?'Menunggu pemeriksaan kembali':r?.note||'',r?.reviewedAt||'',period);
 }}
 const approval=s.productionApproval;
 add('Persetujuan produksi','Seluruh paket','Keputusan Balai',approval==='Disetujui'&&!effectiveProductionApproval(s)?'Perlu pemeriksaan ulang':decision(approval),s.productionApprovalBa||s.productionApprovalNote||'');
 for(const level of [1,2,3] as const){if(level===3&&role==='PIC Balai / Pengguna Jasa')continue;const a=s.audits.find(a=>a.level===level);add(`Audit Tingkat ${level}`,'Seluruh paket',`Audit ${level}`,a?.requiresReview?'Perlu pemeriksaan ulang':decision(a?.status),a?.baNumber||a?.decisionNote||'', '',undefined,level);}
 const a=s.acceptance;add('Penerimaan akhir','Seluruh paket','Keputusan penerimaan',a.acceptanceDecision==='Diterima'&&(!a.finalAcceptance||!a.finalAcceptanceBa?.trim())?'Perlu pemeriksaan ulang':decision(a.acceptanceDecision),a.finalAcceptanceBa||a.acceptanceReviewNote||'');
 }
 return rows;
}
export function qualityCases(packages:QualityScope,role:WorkflowRole){
 if(!canAnalyze(role))return [];
 return Object.entries(validScope(packages)).flatMap(([packageId,s])=>{const grouped=new Map<string,typeof s.corrections>();for(const c of s.corrections){if(c.id)grouped.set(c.id,[...(grouped.get(c.id)??[]),c]);}return [...grouped.values()].filter(group=>group.every(c=>JSON.stringify(c)===JSON.stringify(group[0]))).map(group=>group[0]).filter(c=>!isAdministrativeReminder(c.source)&&s.project.surveyTypes.includes(c.surveyType)).map(c=>({...c,packageId,packageName:s.project.packageName,balai:s.project.balai}));});
}
export function qualityHistory(packages:QualityScope,role:WorkflowRole){
 if(role!=='Direktorat / Pusat')return [];
 return projectDecisionHistory(validScope(packages)).flatMap(e=>{
 let category:Category|undefined;let survey='Seluruh paket';let status=e.status;
 if(e.stage==='Tahap 5'&&e.auditLevel&&[1,2,3].includes(e.auditLevel)&&e.actor===(['Penyedia Jasa / Ketua Tim','PIC Balai / Pengguna Jasa','Direktorat / Pusat'] as const)[e.auditLevel-1])category=`Audit Tingkat ${e.auditLevel}`;
 else if(e.stage==='Tahap 2'&&e.actor==='PIC Balai / Pengguna Jasa')category='Persetujuan produksi';
 else if(e.stage==='Tahap 3B'&&e.actor==='PIC Balai / Pengguna Jasa'){
 const split=status.split(': ');if(split.length!==2||!packages[e.packageId].project.surveyTypes.some(t=>t===split[0]))return [];survey=split[0];status=split[1];category='Verval berkala';
 }else if(e.stage==='Tahap 6'&&e.actor==='PIC Balai / Pengguna Jasa')category='Penerimaan akhir';
 if(!category)return [];
 const result=['Sesuai','Lulus','Disetujui','Diterima'].includes(status)?'Sesuai':['Temuan','Ditolak'].includes(status)?'Temuan':undefined;
 if(!result)return [];
 return [{...e,category,survey,result,balai:packages[e.packageId].project.balai}];
 });
}
export function countQuality(rows:readonly QualityRow[]){const sesuai=rows.filter(r=>r.status==='Sesuai').length,temuan=rows.filter(r=>r.status==='Temuan').length;return {sesuai,temuan,other:rows.length-sesuai-temuan,ratio:sesuai+temuan?sesuai/(sesuai+temuan):null};}
export function qualityCsv(headers:string[],rows:(string|number)[][]){const cell=(x:string|number)=>`"${String(x).replace(/^[\s]*[=+\-@\t\r]/,"'$&").replace(/"/g,'""')}"`;return '\uFEFF'+[headers,...rows].map(r=>r.map(cell).join(',')).join('\r\n');}

/** Only a recorded creation and terminal closure establish elapsed days. */
export function caseClosureDays(s:OperationalWorkflowState|undefined,id:string):number|null{
 if(!s||s.corrections.filter(c=>c.id===id).length!==1||s.corrections.find(c=>c.id===id)?.status!=='Ditutup')return null;
 const h=(s.correctionRevisionHistory??[]).filter(e=>e.caseId===id).sort((a,b)=>a.sequence-b.sequence);
 if(!h.length||h[0].before||h[0].sequence!==1||h.some((e,i)=>e.sequence!==i+1)||h.at(-1)?.after.status!=='Ditutup')return null;
 const dates=h.map(e=>e.recordedOn.slice(0,10));
 if(dates.some(d=>!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d)||dates.some((d,i)=>i>0&&d<dates[i-1]))return null;
 return (Date.parse(dates[dates.length-1])-Date.parse(dates[0]))/86400000;
}

/** Conflicting same-ID records are not counted as trustworthy cases. */
export function qualityCaseConflicts(packages:QualityScope,role:WorkflowRole){if(!canAnalyze(role))return [];return Object.entries(validScope(packages)).flatMap(([packageId,s])=>{const groups=new Map<string,typeof s.corrections>();for(const c of s.corrections){if(c.id)groups.set(c.id,[...(groups.get(c.id)??[]),c]);}return [...groups.entries()].filter(([,g])=>g.some(c=>JSON.stringify(c)!==JSON.stringify(g[0]))).map(([id])=>({packageId,packageName:s.project.packageName,id}));});}
