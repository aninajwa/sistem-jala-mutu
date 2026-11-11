import test from 'node:test';
import assert from 'node:assert/strict';
import {INITIAL_WORKFLOW} from './model';
import {directorateAuditRows,adminReviewRows,adminAuditRows} from './monitoringProjection';
import type {OperationalWorkflowState} from './model';

const packageWith=(internal:'Lulus'|'Belum Dimulai',balai:'Lulus'|'Klarifikasi'|'Belum Dimulai',central:'Belum Dimulai'|'Dalam Review'|'Lulus'|'Ditolak',validation:'Draft'|'VALID'='VALID'):OperationalWorkflowState=>({
 ...structuredClone(INITIAL_WORKFLOW),
 project:{...structuredClone(INITIAL_WORKFLOW.project),id:`TEST-${central}-${balai}`,packageName:'Paket uji',balai:'Balai uji'},
 audits:[{...structuredClone(INITIAL_WORKFLOW.audits[0]),status:internal},{...structuredClone(INITIAL_WORKFLOW.audits[1]),status:balai},{...structuredClone(INITIAL_WORKFLOW.audits[2]),status:central}],
 submission:{...structuredClone(INITIAL_WORKFLOW.submission),validationStatus:validation},
});
const bucket=(p:OperationalWorkflowState)=>directorateAuditRows({[p.project.id]:p})[0].status;
test('level 3 ready only with levels 1-2 passed and VALID submission',()=>{
 assert.equal(bucket(packageWith('Lulus','Lulus','Belum Dimulai')),'siap');
 assert.equal(bucket(packageWith('Lulus','Belum Dimulai','Belum Dimulai')),'tertahan');
 assert.equal(bucket(packageWith('Lulus','Lulus','Belum Dimulai','Draft')),'tertahan');
});
test('level 3 ongoing is not counted as a new ready task',()=>{
 assert.equal(bucket(packageWith('Lulus','Klarifikasi','Dalam Review')),'berjalan');
 assert.equal(bucket(packageWith('Lulus','Lulus','Dalam Review')),'berjalan');
});
test('clarification and rejection do not count as ready',()=>{
 assert.equal(bucket(packageWith('Lulus','Lulus','Ditolak')),'tertahan');
 const p=packageWith('Lulus','Lulus','Lulus');p.audits[2].requiresReview=true;
 assert.equal(bucket(p),'tertahan');
});
test('completed level 3 is a result, not a pending task',()=>{
 assert.equal(bucket(packageWith('Lulus','Lulus','Lulus')),'riwayat');
});
test('admin review and audit are different projections and never mutate records',()=>{
 const p=packageWith('Lulus','Lulus','Belum Dimulai');
 const before=JSON.stringify(p);
 const review=adminReviewRows({x:p}), audits=adminAuditRows({x:p});
 assert.ok(review.length>0);
 assert.ok(review.every(r=>['Tahap 0','Tahap 2','Tahap 3B','Tahap 4'].includes(r.stage)));
 assert.equal(audits.length,3);
 assert.deepEqual(audits.map(x=>x.level),[1,2,3]);
 assert.equal(JSON.stringify(p),before);
});

test('directorate history shows only real current/snapshot states and never invents signed decisions',async()=>{
 const {directorateAuditHistory}=await import('./monitoringProjection');
 const empty=packageWith('Lulus','Lulus','Belum Dimulai');
 assert.deepEqual(directorateAuditHistory(empty),[]);
 const p=packageWith('Lulus','Klarifikasi','Dalam Review');
 p.audits[2].requiresReview=true;
 p.audits[2].reviewReason='Data PCI berubah';
 p.audits[2].history=[{...p.audits[2],status:'Lulus',requiresReview:false,reviewReason:'',decisionNote:'Hasil lama tersimpan',history:undefined}];
 const before=JSON.stringify(p);
 const entries=directorateAuditHistory(p);
 assert.equal(entries.length,2);
 assert.equal(entries[0].source,'current');
 assert.equal(entries[0].status,'Dalam Review');
 assert.equal(entries[0].requiresReview,true);
 assert.equal(entries[1].source,'snapshot');
 assert.equal(entries[1].status,'Lulus');
 assert.equal(entries[1].note,'Hasil lama tersimpan');
 assert.equal(JSON.stringify(p),before);
});
