import test from 'node:test';
import assert from 'node:assert/strict';
import {correctionReturnTab,correctionOpenLabel,matchesRoleTab,correctionMetrics,correctionDisplayStatus,filterCorrectionRows,correctionStatusCounts,type CorrectionRow} from './correctionViewModel';
import {correctionEventSummary} from '../../workflow/correctionHistory';
import {correctionAttemptNumber} from '../../workflow/correctionAttempt';
import {defaultCase} from '../../workflow/correctionDefaults';
import {INITIAL_WORKFLOW} from '../../workflow/model';
const P='Penyedia Jasa / Ketua Tim', B='PIC Balai / Pengguna Jasa', D='Direktorat / Pusat';
const row=(blockedStage: string,status: CorrectionRow['status'],retest: CorrectionRow['retest']='Belum Diuji')=>({blockedStage,status,retest,dueDate:'',severity:'Mayor'} as CorrectionRow);
test('approval stays with Balai for Audit 3; result review belongs to Directorate',()=>{
 assert.equal(matchesRoleTab(row('Audit tingkat 3','Menunggu Persetujuan'),B,'Antrian Verifikasi'),true);
 assert.equal(matchesRoleTab(row('Audit tingkat 3','Dilaksanakan'),D,'Verifikasi Ulang'),true);
 assert.equal(matchesRoleTab(row('Audit tingkat 3','Dilaksanakan'),B,'Verifikasi Ulang'),false);
 assert.equal(matchesRoleTab(row('Verval 14 hari','Dilaksanakan'),D,'Verifikasi Ulang'),false);
});
test('Audit 1 and failed retests return to provider; waiting KPI matches queue',()=>{
 const rows=[row('Audit tingkat 1','Dilaksanakan'),row('Verval 14 hari','Dilaksanakan'),row('Audit tingkat 3','Verifikasi Ulang','Gagal')];
 assert.equal(matchesRoleTab(rows[0],P,'Tugas Saya'),true);
 assert.equal(matchesRoleTab(rows[2],P,'Tugas Saya'),true);
 assert.equal(correctionMetrics(rows,P).find(r=>r.label==='Menunggu Verifikasi')?.value,1);
});
test('history renders operational values instead of internal paths',()=>{
 const summary=correctionEventSummary({action:'Catat hasil',object:'KOR-1',newValue:'corrections[KOR-1].status: Dilaksanakan · corrections[KOR-1].verification.balai: true'});
 assert.equal(summary.detail,'Status: Dilaksanakan');
});
test('submission attempt is scoped by case; new findings have no invented raw or STA',()=>{
 const action='Ajukan tindakan koreksi untuk persetujuan';
 assert.equal(correctionAttemptNumber([{object:'A',action},{object:'B',action},{object:'A',action}],'A'),2);
 const item=defaultCase(INITIAL_WORKFLOW,'TEST');
 assert.equal(item.linkedRecordId,undefined); assert.equal(item.stationing,'');
});
test('Admin: kasus aktif, tenggat dan riwayat memakai status yang sama',()=>{
 const active=row('Verval 14 hari','Terbuka');const closed=row('Audit tingkat 3','Ditutup');
 assert.equal(matchesRoleTab(active,'Admin','Monitoring Kasus'),true);
 assert.equal(matchesRoleTab(closed,'Admin','Monitoring Kasus'),false);
 assert.equal(matchesRoleTab(closed,'Admin','Riwayat'),true);
 assert.equal(matchesRoleTab(closed,'Admin','Pemantauan Tenggat'),false);
 assert.equal(matchesRoleTab(closed,D,'Tindak Lanjut Audit 3'),false);
 assert.equal(matchesRoleTab(closed,D,'Riwayat'),true);
});

test('Audit 3 monitoring excludes the actionable result queue; passed retest awaits closure',()=>{
 const waiting=row('Audit tingkat 3','Dilaksanakan');
 assert.equal(matchesRoleTab(waiting,D,'Tindak Lanjut Audit 3'),false);
 assert.equal(matchesRoleTab(waiting,D,'Verifikasi Ulang'),true);
 assert.equal(matchesRoleTab(row('Audit tingkat 3','Disetujui'),D,'Tindak Lanjut Audit 3'),true);
 assert.equal(correctionDisplayStatus(row('Audit tingkat 3','Verifikasi Ulang','Lulus')),'Menunggu Penutupan');
});

test('operational status filter and chart count agree for passed and failed retests',()=>{
 const rows=[row('Audit tingkat 3','Verifikasi Ulang','Lulus'),row('Audit tingkat 3','Terbuka','Gagal'),row('Audit tingkat 3','Dilaksanakan')].map((r,i)=>({...r,id:`C${i}`,packageId:'P',balai:i===0?'A':'B'}));
 assert.equal(filterCorrectionRows(rows,{status:'Menunggu Penutupan'}).length,1);
 assert.equal(filterCorrectionRows(rows,{status:'Menunggu Penutupan',balai:'B'}).length,0);
 assert.equal(filterCorrectionRows(rows,{query:' c1 '}).length,1);
 assert.deepEqual(correctionStatusCounts(rows),[{label:'Menunggu Penutupan',value:1},{label:'Uji Ulang Gagal',value:1},{label:'Menunggu Pemeriksaan Hasil',value:1}]);
});

test('action labels follow actual reviewer and never imply technical permission for Admin',()=>{
 const audit=row('Audit tingkat 3','Dilaksanakan');
 assert.equal(correctionOpenLabel(audit,D),'Periksa hasil');
 assert.equal(correctionOpenLabel(audit,B),'Lihat detail');
 assert.equal(correctionOpenLabel(audit,'Admin'),'Lihat detail');
 assert.equal(correctionOpenLabel(row('Audit tingkat 3','Verifikasi Ulang','Lulus'),D),'Periksa penutupan');
 assert.equal(correctionOpenLabel(row('Audit tingkat 3','Menunggu Persetujuan'),B),'Periksa usulan');
 assert.equal(correctionOpenLabel(row('Audit tingkat 3','Menunggu Persetujuan'),D),'Lihat detail');
 assert.equal(correctionOpenLabel(row('Audit tingkat 3','Ditutup'),D),'Lihat riwayat');
});

 test('shared case presentation distinguishes pending work from closed history', async()=>{
 const {correctionHasPendingWork,correctionDisplayStatus: shared}=await import('../../workflow/correctionPresentation');
 for(const item of [row('Audit tingkat 3','Dilaksanakan'),row('Audit tingkat 3','Verifikasi Ulang','Lulus'),row('Audit tingkat 3','Ditutup')]){
 assert.equal(shared(item),correctionDisplayStatus(item));
 assert.equal(correctionHasPendingWork(item),item.status!=='Ditutup');
 }
 });

test('deadline monitoring uses Jakarta day, rejects invalid dates and ignores closed cases', async()=>{
 const {isOverdue,dueInSevenDays}=await import('./correctionViewModel');
 const {jakartaDay}=await import('../../workflow/operationalCalendar');
 const today=jakartaDay(new Date('2026-11-25T18:00:00Z'));
 assert.equal(today,'2026-11-26');
 const active={...row('Verval 14 hari','Terbuka'),dueDate:'2026-11-25'};
 assert.equal(isOverdue(active,today),true);
 assert.equal(dueInSevenDays({...active,dueDate:'2026-12-03'},today),true);
 assert.equal(dueInSevenDays({...active,dueDate:'2026-12-04'},today),false);
 for(const dueDate of ['2026-02-30','bad','']){
  assert.equal(isOverdue({...active,dueDate},today),false);
  assert.equal(dueInSevenDays({...active,dueDate},today),false);
 }
 assert.equal(isOverdue({...active,status:'Ditutup'},today),false);
});


test('all fourteen role tabs constrain visible filter options and results', async () => {
 const {ROLE_TABS, correctionTabRows} = await import('./correctionViewModel');
 const rows = [row('Audit tingkat 3','Dilaksanakan'),row('Verval 14 hari','Terbuka'),row('Audit tingkat 3','Ditutup'),row('Verval 14 hari','Menunggu Persetujuan')].map((r,i)=>({...r,id:`CASE${i}`,packageId:`P${i}`,key:`P${i}:CASE${i}`}));
 let count=0;
 for(const role of Object.keys(ROLE_TABS) as (keyof typeof ROLE_TABS)[]) for(const tab of ROLE_TABS[role]) {
  count++;
  const result=correctionTabRows(rows,role,tab);
  assert.deepEqual(result.available,rows.filter(r=>matchesRoleTab(r,role,tab)));
  assert.deepEqual(result.visible,result.available);
  assert.deepEqual(correctionTabRows(rows,role,tab,{packageId:'missing'}).visible,[]);
 }
 assert.equal(count,14);
});
test('monitoring queues prioritize deadlines without changing history order',async()=>{
 const {sortCorrectionQueue}=await import('./correctionViewModel');
 const rows=[{...row('Verval 14 hari','Terbuka'),key:'A',dueDate:''},{...row('Verval 14 hari','Terbuka'),key:'B',dueDate:'2026-11-25'}];
 assert.deepEqual(sortCorrectionQueue(rows,'Pemantauan Tenggat').map(r=>r.key),['B','A']);
 assert.deepEqual(sortCorrectionQueue(rows,'Riwayat').map(r=>r.key),['A','B']);
 assert.equal(rows[0].key,'A');
});

test("empty queue filter count includes search but ignores whitespace", async () => {
 const {correctionFilterCount}=await import("./correctionViewModel");
 assert.equal(correctionFilterCount({query:"  "}),0);
 assert.equal(correctionFilterCount({query:" IRI ",packageId:"P",balai:"B"}),3);
 assert.equal(correctionFilterCount({}),0);
});

 test('return queue follows current case status and never carries an invalid role tab',()=>{
 assert.equal(correctionReturnTab(P,'Tugas Saya',row('Verval 14 hari','Menunggu Persetujuan')),'Menunggu Verifikasi');
 assert.equal(correctionReturnTab(B,'Antrian Verifikasi',row('Verval 14 hari','Disetujui')),'Tindak Lanjut Paket');
 assert.equal(correctionReturnTab(D,'Tindak Lanjut Audit 3',row('Audit tingkat 3','Dilaksanakan')),'Verifikasi Ulang');
 assert.equal(correctionReturnTab(D,'Temuan Lintas Paket',row('Audit tingkat 3','Dilaksanakan')),'Temuan Lintas Paket');
 assert.equal(correctionReturnTab(D,'Antrian Verifikasi',row('Audit tingkat 3','Ditutup')),'Riwayat');
 assert.equal(correctionReturnTab('Admin','Tugas Saya'),'Monitoring Kasus');
 });

// Array.filter supplies its index as a second argument: metrics must not pass that index as a date.
test('deadline KPI counts due and late cases using the Jakarta calendar, not array indexes',async()=>{
 const {jakartaDay,addDays}=await import('../../workflow/operationalCalendar');
 const today=jakartaDay();
 const cases=[{...row('Verval 14 hari','Terbuka'),dueDate:addDays(today,-1)}, {...row('Verval 14 hari','Terbuka'),dueDate:addDays(today,3)}, {...row('Verval 14 hari','Ditutup'),dueDate:addDays(today,-1)}];
 assert.equal(correctionMetrics(cases,P).find(r=>r.label==='Mendekati Tenggat')?.value,1);
 assert.equal(correctionMetrics(cases,'Admin').find(r=>r.label==='Terlambat')?.value,1);
});
