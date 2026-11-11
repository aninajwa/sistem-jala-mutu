import test from 'node:test';
import assert from 'node:assert/strict';
import type { OperationalWorkflowState } from '../workflow/model';
import { complianceCsv, decisionPercent, summarizeCompliance, matchesSurveyPeriod } from './complianceMetrics';
const role='PIC Balai / Pengguna Jasa' as const;
function fixture(id:string,balai:string): OperationalWorkflowState {
 return {
  project:{id,packageName:`Paket ${id}`,balai,surveyTypes:['IRI','PCI']},
  cycle:{surveyReviews:{IRI:{decision:'Sesuai'},PCI:{decision:'Temuan'}},reviewPendingTypes:[],requiresReview:false},
  submission:{stagedReviews:{IRI:{decision:'Temuan'}}},
  dailyRecords:[{id:id+'-d',surveyType:'IRI',state:'Tercatat',date:'2026-11-10'}],
  audits:[{status:'Lulus',requiresReview:false},{status:'Lulus',requiresReview:true},{status:'Ditolak'}],
  corrections:[{status:'Terbuka'},{status:'Ditutup'}],role
 } as unknown as OperationalWorkflowState;
}
test('empty dataset gives no manufactured ratios, balai ranking, or months',()=>{
 const m=summarizeCompliance({});assert.equal(m.packages,0);assert.equal(m.audit.total,0);
 assert.equal(decisionPercent(m.audit),'—');assert.deepEqual(m.byBalai,[]);assert.deepEqual(m.byMonth,[]);
});
test('decisions use current evidence, and pending re-review is not a passing audit',()=>{
 const p=fixture('A','Balai A');const m=summarizeCompliance({A:p});
 assert.equal(m.audit.total,2);assert.equal(m.audit.sesuai,1);assert.equal(m.audit.temuan,1);
 assert.equal(m.periodic.total,2);assert.equal(m.periodic.sesuai,1);
 assert.equal(m.staged.total,1);assert.equal(m.staged.temuan,1);
 assert.equal(m.openCorrections,1);assert.equal(m.closedCorrections,1);
 assert.equal(m.dailyRecords,1);assert.deepEqual(m.byMonth,[{month:'2026-11',records:1}]);
 assert.equal(m.rows.filter(r=>r.audit.total>0).length,1,'audit is package-level, never multiplied by survey count');
});
test('review pending is excluded and package scope is never expanded',()=>{
 const p=fixture('A','Balai A');p.cycle.reviewPendingTypes=['IRI'];
 const q=fixture('B','Balai B');const m=summarizeCompliance({A:p});
 assert.equal(m.periodic.total,1);assert.equal(m.balais,1);
 assert.equal(m.rows.some(r=>r.packageId==='B'),false);
 assert.equal(summarizeCompliance({B:q}).byBalai[0].name,'Balai B');
});
test('CSV includes only scoped input, source and role, with spreadsheet formula injection mitigated',()=>{
 const p=fixture('A','Balai A');p.project.packageName='=FORMULA';
 const m=summarizeCompliance({A:p});const csv=complianceCsv(m,role);
 assert.match(csv,/PIC Balai \/ Pengguna Jasa/);assert.match(csv,/'=FORMULA/);
 assert.ok(!csv.includes('Paket B'));assert.match(csv,/Seluruh paket/);
});

test('semester filters only dated records; current decisions remain snapshots',()=>{
 const p=fixture('A','Balai A');
 p.dailyRecords.push({id:'jul',surveyType:'IRI',state:'Tercatat',date:'2027-07-01'} as never);
 p.dailyRecords.push({id:'may',surveyType:'IRI',state:'Tercatat',date:'2027-05-14'} as never);
 const first=summarizeCompliance({A:p},'Semester I 2027');
 assert.equal(first.dailyRecords,1);assert.deepEqual(first.byMonth,[{month:'2027-05',records:1}]);
 assert.equal(first.audit.total,2);assert.equal(first.openCorrections,1);
 const second=summarizeCompliance({A:p},'Semester II 2027');
 assert.equal(second.dailyRecords,1);assert.equal(second.byMonth[0].month,'2027-07');
 assert.equal(matchesSurveyPeriod('2027-13-01','Semester I 2027'),false);
});


test('search scoped at package source gives identical cards and CSV evidence',()=>{
 const all={A:fixture('A','Balai A'),B:fixture('B','Balai B')};
 const filtered=Object.fromEntries(Object.entries(all).filter(([id,s])=>id==='A'&&s.project.balai==='Balai A'));
 const summary=summarizeCompliance(filtered,'Semester II 2026');
 assert.equal(summary.packages,1);assert.equal(summary.openCorrections,1);
 assert.equal(summary.dailyRecords,1);
 const csv=complianceCsv(summary,role,'Semester II 2026');
 assert.ok(csv.includes('Paket A'));assert.ok(!csv.includes('Paket B'));
});
