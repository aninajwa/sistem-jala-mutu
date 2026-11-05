import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_WORKFLOW, type WorkflowRole } from '../workflow/model';
import type { Principal } from '../workflow/repository/contracts';
import { readLocalReports } from './adapter';
import { EMPTY_FILTER } from './model';
import { filterReport, summarizeReport, filterError } from './query';
import { createReportCsv, csvCell } from './export';
const roles:WorkflowRole[]=['Penyedia Jasa / Ketua Tim','PIC Balai / Pengguna Jasa','Direktorat / Pusat','Admin'];
const principal=(role=roles[0]):Principal=>({id:'test',role,packageIds:['A'],balaiIds:[],source:'local-test'});
function pkg(id='A') {
 const p=structuredClone(INITIAL_WORKFLOW);p.project.id=id;p.project.packageName='Paket "A",\nIndonesia';p.project.balai='Balai A';p.project.surveyTypes=['IRI','PCI'];
 p.dailyRecords=[{id:'R1',date:'2026-11-01',surveyType:'IRI',state:'Tercatat',road:'Ruas 1'},{id:'R2',date:'2026-11-02',surveyType:'PCI',state:'Ditahan',road:'Ruas 2'},{id:'R3',date:'2026-02-30',surveyType:'IRI',state:'Survei Ulang',road:'Ruas 3'}] as typeof p.dailyRecords;
 p.cycle.surveyReviews={IRI:{decision:'Sesuai',reviewedAt:'2026-11-01',note:'sumber'},PCI:{decision:'Temuan',reviewedAt:'2026-11-02',note:'periksa'}};p.cycle.reviewPendingTypes=['IRI'];
 p.corrections=[{id:'C1',surveyType:'PCI',dueDate:'2026-12-01',status:'Terbuka',blockedStage:'Tahap 3B'}] as typeof p.corrections;return p;
}
for(const role of roles)test(`scope and export ${role}`,()=>{
 const p=principal(role),s=readLocalReports({A:pkg(),B:pkg('B')},p);
 if(role==='Admin'){assert.equal(s.denied,true);assert.equal(s.rows.activities.length,0);assert.throws(()=>createReportCsv({A:pkg()},p,'activities',EMPTY_FILTER));}
 else{assert.deepEqual(Object.keys(s.packages),['A']);assert.equal(s.rows.activities.length,3);assert.equal(createReportCsv({A:pkg(),B:pkg('B')},p,'activities',EMPTY_FILTER).count,3);}
});
test('unknown role and mismatched identity fail closed',()=>{assert.equal(readLocalReports({A:pkg()}, {...principal(),role:'x' as WorkflowRole}).denied,true);assert.equal(readLocalReports({A:pkg('B')},principal()).rows.activities.length,0);});
test('empty assignment has no rows or export',()=>{const p={...principal(),packageIds:[]};assert.equal(readLocalReports({A:pkg()},p).rows.activities.length,0);assert.throws(()=>createReportCsv({A:pkg()},p,'activities',EMPTY_FILTER));});
test('duplicates excluded; cross-package IDs distinct',()=>{const p=pkg();p.dailyRecords.push({...p.dailyRecords[0]});const s=readLocalReports({A:p,B:pkg('B')},{...principal(),packageIds:['A','B']});assert.equal(s.rows.activities.length,5);assert.equal(s.warnings.length,1);assert.equal(new Set(s.rows.activities.map(r=>r.key)).size,5);});
test('filters intersect and date boundaries inclusive',()=>{const rows=readLocalReports({A:pkg()},principal()).rows.activities;
 assert.equal(filterReport(rows,{...EMPTY_FILTER,start:'2026-11-01',end:'2026-11-01',packageId:'A',balai:'Balai A',survey:'IRI',status:'Tercatat'}).length,1);
 for(const [k,v] of [['packageId','B'],['balai','Balai B'],['survey','RNI'],['status','Unknown']])assert.equal(filterReport(rows,{...EMPTY_FILTER,[k]:v}).length,0);
 assert.equal(filterReport(rows,{...EMPTY_FILTER,start:'2026-11-01'}).length,2);assert.equal(filterReport(rows,{...EMPTY_FILTER,end:'2026-11-01'}).length,1);assert.equal(summarizeReport(rows).undated,1);
});
test('invalid and reversed dates block display and export',()=>{for(const f of [{...EMPTY_FILTER,start:'2026-02-30'},{...EMPTY_FILTER,start:'2026-11-02',end:'2026-11-01'}]){assert.ok(filterError(f));assert.deepEqual(filterReport([],f),[]);assert.throws(()=>createReportCsv({A:pkg()},principal(),'activities',f));}});
test('pending review replaces old decision and excludes old date',()=>{const s=readLocalReports({A:pkg()},principal());const r=s.rows.reviews.find(r=>r.survey==='IRI')!;assert.equal(r.status,'Dalam pemeriksaan');assert.equal(r.date,'');assert.equal(s.rows.reviews.length,2);assert.equal(filterReport(s.rows.reviews,{...EMPTY_FILTER,start:'2026-11-01'}).length,1);});
test('correction filters use due date',()=>{const rows=readLocalReports({A:pkg()},principal()).rows.corrections;assert.equal(filterReport(rows,{...EMPTY_FILTER,start:'2026-11-01',end:'2026-11-30'}).length,0);assert.match(rows[0].dateBasis,/Tenggat/);});
test('status aggregate equals row count, no technical ratio',()=>{const rows=readLocalReports({A:pkg()},principal()).rows.activities;const s=summarizeReport(rows);assert.equal(s.statuses.reduce((n,s)=>n+s.count,0),rows.length);assert.equal(s.packages,1);assert.equal('compliance' in s,false);});
function parseCsv(content:string){const rows:string[][]=[];let row:string[]=[],cell='',quote=false;for(let i=1;i<content.length;i++){const c=content[i];if(c==='"'){if(quote&&content[i+1]==='"'){cell+='"';i++;}else quote=!quote;}else if(c===','&&!quote){row.push(cell);cell='';}else if(c==='\r'&&!quote){assert.equal(content[++i],'\n');row.push(cell);rows.push(row);row=[];cell='';}else cell+=c;}return rows;}
test('CSV actual bytes roundtrip and same filters as display',()=>{const data={A:pkg(),B:pkg('B')};const file=createReportCsv(data,principal(),'activities',{...EMPTY_FILTER,status:'Tercatat'});const parsed=parseCsv(file.content);const body=parsed.slice(parsed.findIndex(r=>r[0]==='ID Paket')+1);assert.equal(body.length,1);assert.equal(body[0][1],data.A.project.packageName);assert.equal(body[0][0],'A');assert.equal(body[0][4],'2026-11-01');assert.equal(body[0][6],'Tercatat');assert.ok(parsed.some(r=>r.join(' ').includes('belum terhubung API')));assert.ok(file.filename.endsWith('.csv'));});
test('CSV neutralizes spreadsheet formulas',()=>{for(const v of ['=cmd()', '+SUM(A1)', '-1+2','@foo',' \t=HYPERLINK("x")'])assert.ok(csvCell(v).startsWith('"\''));});
test('all report kinds share display/export population and context',()=>{for(const kind of ['activities','reviews','corrections'] as const){const data={A:pkg()},p=principal();const rows=readLocalReports(data,p).rows[kind];for(const status of new Set(rows.map(r=>r.status))){const filter={...EMPTY_FILTER,status};const file=createReportCsv(data,p,kind,filter);const parsed=parseCsv(file.content);const body=parsed.slice(parsed.findIndex(r=>r[0]==='ID Paket')+1);assert.equal(body.length,filterReport(rows,filter).length);assert.ok(body.every(r=>r[6]===status));assert.ok(body.every(r=>r[5]===rows.find(s=>s.status===status)!.dateBasis));}}});
