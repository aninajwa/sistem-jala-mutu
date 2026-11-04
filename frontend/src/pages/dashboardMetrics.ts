import type { OperationalWorkflowState, WorkflowRole } from '../workflow/model';
import { isInPeriod } from '../lib/periods';
import { isValidReviewDate } from './reviewDateValidation';
import { traceReviewEvidence } from './reviewEvidenceTrace';

export type DashboardPackage = OperationalWorkflowState;
export type SurveyReviewItem = {
  packageId: string; packageName: string; surveyType: string;
  stage: 'Review berkala' | 'V&V bertahap'; decision: 'Sesuai' | 'Temuan';
  reviewedAt: string; note: string; evidenceReferences: string[];
};
export type DashboardMetrics = {
  surveyReviews: SurveyReviewItem[];
  packages: number; balai: number; correctionsOpen: number; correctionsClosed: number;
  awaitingReview: number; auditPending: number; accepted: number; dailyRecords: number;
  byBalai: {name:string; packages:number; open:number}[];
  bySurvey: {name:string; records:number}[];
  trend: {label:string; records:number}[];
  attention: {id:string; name:string; balai:string; open:number; pending:number}[];
};

/** Only consume the package collection already scoped by the parent application.
 * This does not replace backend authorization or imply access to unscoped records. */
export function aggregateDashboard(packages: Record<string, DashboardPackage>, role: WorkflowRole, balaiFilter = 'Semua Balai', surveyFilter = 'Semua', periodFilter = 'Semua periode'): DashboardMetrics {
  const entries = Object.entries(packages).filter(([,p]) => {
    if (balaiFilter !== 'Semua Balai' && p.project.balai !== balaiFilter) return false;
    return true;
  });
  const byBalai = new Map<string,{name:string;packages:number;open:number}>();
  const bySurvey = new Map<string,number>();
  const byMonth = new Map<string,number>();
  let correctionsOpen=0,correctionsClosed=0,awaitingReview=0,auditPending=0,accepted=0,dailyRecords=0;
  const attention: DashboardMetrics['attention'] = [];
  const surveyReviews: SurveyReviewItem[] = [];
  for (const [id,p] of entries) {
    // Only explicit, current review decisions are counted. Never infer from survey volume,
    // historical cycles, generic package status, or an unconfirmed pending re-review.
    const appendReviews = (stage: SurveyReviewItem['stage'], source: typeof p.cycle.surveyReviews, pending: string[] = []) => {
      for (const [surveyType, review] of Object.entries(source ?? {})) {
        if (!review || pending.includes(surveyType) || (review.decision !== 'Sesuai' && review.decision !== 'Temuan')) continue;
        if (!isValidReviewDate(review.reviewedAt)) continue;
        if (!p.project.surveyTypes.includes(surveyType as typeof p.project.surveyTypes[number])) continue;
        surveyReviews.push({packageId:id,packageName:p.project.packageName||id,surveyType,stage,decision:review.decision,reviewedAt:review.reviewedAt,note:review.note||'',evidenceReferences:traceReviewEvidence(review).references});
      }
    };
    appendReviews('Review berkala',p.cycle?.surveyReviews,p.cycle?.reviewPendingTypes);
    appendReviews('V&V bertahap',p.submission?.stagedReviews);
    const open = p.corrections.filter(c=>c.status!=='Ditutup').length;
    const closed = p.corrections.length-open;
    const pending = p.corrections.filter(c=>c.status==='Menunggu Persetujuan'||c.status==='Verifikasi Ulang').length;
    const audits = p.audits.filter(a=>a && (a.status==='Dalam Review'||a.status==='Klarifikasi')).length;
    correctionsOpen+=open; correctionsClosed+=closed; awaitingReview+=pending; auditPending+=audits;
    if (p.acceptance.finalAcceptance) accepted++;
    const balai = p.project.balai || 'Balai belum ditentukan';
    const b=byBalai.get(balai)||{name:balai,packages:0,open:0}; b.packages++;b.open+=open;byBalai.set(balai,b);
    for (const r of p.dailyRecords) {
      if (r.state!=='Tercatat') continue;
      if (periodFilter.startsWith('Bulan ') ? r.date.slice(0,7)!==periodFilter.slice(6) : /^Tahun \d{4}$/.test(periodFilter) ? r.date.slice(0,4)!==periodFilter.slice(6) : periodFilter !== 'Semua periode' && !isInPeriod(r.date, periodFilter)) continue;
      if (surveyFilter!=='Semua' && r.surveyType!==surveyFilter) continue;
      dailyRecords++;
      bySurvey.set(r.surveyType,(bySurvey.get(r.surveyType)||0)+1);
      if (/^\d{4}-\d{2}-\d{2}$/.test(r.date)) byMonth.set(r.date.slice(0,7),(byMonth.get(r.date.slice(0,7))||0)+1);
    }
    if (open||pending||audits) attention.push({id,name:p.project.packageName||id,balai,open,pending:pending+audits});
  }
  // Jenis survei hanya memfilter rekaman. Koreksi/audit/penerimaan tidak memiliki
  // atribusi per jenis survei yang terverifikasi, sehingga tetap berlevel paket.
  // Role scope is applied upstream by scopedPackages; no synthetic records are created here.
  void role;
  return {surveyReviews:surveyReviews.sort((a,b)=>b.reviewedAt.localeCompare(a.reviewedAt)),packages:entries.length,balai:byBalai.size,correctionsOpen,correctionsClosed,awaitingReview,auditPending,accepted,dailyRecords,
    byBalai:[...byBalai.values()].sort((a,b)=>b.open-a.open||a.name.localeCompare(b.name)),
    bySurvey:[...bySurvey].map(([name,records])=>({name,records})).sort((a,b)=>b.records-a.records),
    trend:[...byMonth].sort(([a],[b])=>a.localeCompare(b)).map(([label,records])=>({label,records})),
    attention:attention.sort((a,b)=>(b.open+b.pending)-(a.open+a.pending)).slice(0,8)};
}
