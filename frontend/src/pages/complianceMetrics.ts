import type { OperationalWorkflowState, WorkflowRole } from '../workflow/model';

export type ComplianceScope = Record<string, OperationalWorkflowState>;
export type DecisionCount = { total: number; sesuai: number; temuan: number };
export type ComplianceRow = {
  packageId: string;
  packageName: string;
  balai: string;
  survey: string;
  periodic: DecisionCount;
  staged: DecisionCount;
  audit: DecisionCount;
  openCorrections: number;
  closedCorrections: number;
  dailyRecords: number;
};
export type ComplianceSummary = {
  packages: number;
  balais: number;
  dailyRecords: number;
  openCorrections: number;
  closedCorrections: number;
  periodic: DecisionCount;
  staged: DecisionCount;
  audit: DecisionCount;
  rows: ComplianceRow[];
  survey: { name: string; periodic: DecisionCount; staged: DecisionCount; records: number }[];
  byBalai: { name: string; packages: number; audit: DecisionCount; open: number }[];
  byMonth: { month: string; records: number }[];
};
const empty = (): DecisionCount => ({ total: 0, sesuai: 0, temuan: 0 });
const add = (to: DecisionCount, from: DecisionCount) => {
  to.total += from.total;
  to.sesuai += from.sesuai;
  to.temuan += from.temuan;
};
const decision = (value: unknown): DecisionCount => {
  const result = empty();
  if (value === 'Sesuai' || value === 'Lulus') { result.total = 1; result.sesuai = 1; }
  if (value === 'Temuan' || value === 'Ditolak') { result.total = 1; result.temuan = 1; }
  return result;
};
/** Descriptive evidence counts, NOT contractual compliance scores or official approvals.
 * Caller must supply packages already scoped to the active principal. */
/** Time filter applies only to dated daily survey records; other decisions are current snapshots. */
export function matchesSurveyPeriod(date: string, period?: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date))) return false;
  if (!period || period==='Semua periode') return true;
  const match=/^Semester (I|II) (\d{4})$/.exec(period.trim());
  if (!match) return true; // Do not silently discard records for an unsupported header label.
  const month=Number(date.slice(5,7));
  return date.slice(0,4)===match[2] && month>=1 && month<=12 && (match[1]==='I'?month<=6:month>=7);
}
export function summarizeCompliance(packages: ComplianceScope, period?: string): ComplianceSummary {
  const rows: ComplianceRow[] = [];
  const totalPeriodic = empty(), totalStaged = empty(), totalAudit = empty();
  const balaiMap = new Map<string, ComplianceSummary['byBalai'][number]>();
  const surveyMap = new Map<string, ComplianceSummary['survey'][number]>();
  const monthMap = new Map<string, number>();
  let dailyRecords = 0, openCorrections = 0, closedCorrections = 0;
  for (const [id, packageState] of Object.entries(packages)) {
    if (id !== packageState.project.id) continue;
    const project = packageState.project;
    const balai = project.balai?.trim() || 'Belum ditentukan';
    const name = project.packageName?.trim() || id;
    const audit = empty();
    for (const item of packageState.audits) {
      // Pending re-review is not a current passing decision.
      add(audit, item.requiresReview ? empty() : decision(item.status));
    }
    add(totalAudit, audit);
    const b = balaiMap.get(balai) ?? { name: balai, packages: 0, audit: empty(), open: 0 };
    b.packages++;
    add(b.audit, audit);
    balaiMap.set(balai, b);
    const correctionOpen = packageState.corrections.filter(c => c.status !== 'Ditutup').length;
    const correctionClosed = packageState.corrections.length - correctionOpen;
    b.open += correctionOpen;
    openCorrections += correctionOpen;
    closedCorrections += correctionClosed;
    const recorded = packageState.dailyRecords.filter(r => r.state === 'Tercatat' && project.surveyTypes.includes(r.surveyType) && matchesSurveyPeriod(r.date,period));
    dailyRecords += recorded.length;
    for (const record of recorded) {
      if (!project.surveyTypes.includes(record.surveyType)) continue;
      const s = surveyMap.get(record.surveyType) ?? { name: record.surveyType, periodic: empty(), staged: empty(), records: 0 };
      s.records++;
      surveyMap.set(record.surveyType, s);
      if (/^\d{4}-\d{2}-\d{2}$/.test(record.date)) {
        const month = record.date.slice(0, 7);
        monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
      }
    }
    for (const survey of project.surveyTypes) {
      const periodicReview = packageState.cycle.surveyReviews?.[survey];
      const periodic = packageState.cycle.reviewPendingTypes?.includes(survey) || packageState.cycle.requiresReview
        ? empty() : decision(periodicReview?.decision);
      const stagedReview = packageState.submission.stagedReviews?.[survey];
      const staged = decision(stagedReview?.decision);
      const s = surveyMap.get(survey) ?? { name: survey, periodic: empty(), staged: empty(), records: 0 };
      add(s.periodic, periodic);
      add(s.staged, staged);
      surveyMap.set(survey, s);
      add(totalPeriodic, periodic);
      add(totalStaged, staged);
      rows.push({packageId:id, packageName:name, balai, survey, periodic, staged, audit:empty(),
        openCorrections: correctionOpen, closedCorrections: correctionClosed,
        dailyRecords: recorded.filter(r => r.surveyType === survey).length});
    }
    // The audit is package-level: do not replicate it as a survey decision.
    rows.push({packageId:id, packageName:name, balai, survey:'Seluruh paket', periodic:empty(), staged:empty(), audit,
      openCorrections: correctionOpen, closedCorrections: correctionClosed, dailyRecords: recorded.length});
  }
  return { packages: [...new Set(rows.map(r=>r.packageId))].length, balais:balaiMap.size,
    dailyRecords, openCorrections, closedCorrections, periodic:totalPeriodic, staged:totalStaged, audit:totalAudit,
    rows: rows.sort((a,b)=>a.balai.localeCompare(b.balai)||a.packageName.localeCompare(b.packageName)||a.survey.localeCompare(b.survey)),
    survey:[...surveyMap.values()].sort((a,b)=>a.name.localeCompare(b.name)),
    byBalai:[...balaiMap.values()].sort((a,b)=>a.name.localeCompare(b.name)),
    byMonth:[...monthMap].sort(([a],[b])=>a.localeCompare(b)).map(([month,records])=>({month,records})) };
}
export function decisionPercent(count: DecisionCount): string {
  return count.total ? `${(100 * count.sesuai / count.total).toLocaleString('id-ID', {maximumFractionDigits:1})}%` : '—';
}
const csvCell=(x:string|number)=>`"${String(x).replace(/^[=+\-@\t\r]/,'\'$&').replace(/"/g,'""')}"`;
export function complianceCsv(summary:ComplianceSummary,role:WorkflowRole,period?:string):string {
 const lines: (string|number)[][]=[['Cakupan peran',role],['Periode rekaman survei',period??'Seluruh periode'],['Catatan','Audit, review, dan koreksi dihitung sebagai snapshot terkini, bukan disaring berdasarkan periode rekaman'],['Sumber','Snapshot paket yang dapat diakses di frontend lokal'],['Definisi','Sesuai/Lulus adalah keputusan terkini; angka bukan pengesahan atau nilai kepatuhan kontraktual'],[],
  ['ID Paket','Paket','Balai','Jenis survei','Keputusan berkala tercatat','Berkala sesuai','Berkala temuan','Keputusan bertahap tercatat','Bertahap sesuai','Bertahap temuan','Keputusan audit tingkat 1–3 tercatat (hanya baris Seluruh paket)','Audit lulus','Audit ditolak','Koreksi terbuka (tingkat paket)','Koreksi tertutup (tingkat paket)','Rekaman survei tercatat']];
 for(const r of summary.rows)lines.push([r.packageId,r.packageName,r.balai,r.survey,r.periodic.total,r.periodic.sesuai,r.periodic.temuan,r.staged.total,r.staged.sesuai,r.staged.temuan,r.audit.total,r.audit.sesuai,r.audit.temuan,r.survey==='Seluruh paket'?r.openCorrections:'',r.survey==='Seluruh paket'?r.closedCorrections:'',r.survey==='Seluruh paket'?'':r.dailyRecords]);
 return '\uFEFF'+lines.map(row=>row.map(x=>csvCell(x)).join(',')).join('\r\n')+'\r\n';
}
