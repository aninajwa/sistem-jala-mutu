import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoWorkflow} from './demoScenario';
import {evaluateStageGate,effectiveProductionApproval} from './workflowGate';
const setup=()=>createDemoWorkflow('complete');
const finding=()=>createDemoWorkflow('verval-finding').corrections[0];
test('open preparation finding cannot leave approved production or downstream gates ready',()=>{
 const s=setup(); s.corrections=[{...finding(),blockedStage:'Persiapan',returnStage:'Persiapan',status:'Terbuka'}];
 assert.equal(effectiveProductionApproval(s),false);
 for(const stage of ['Tahap 0','Tahap 2','Tahap 3A','Tahap 3B','Tahap 4','Tahap 5','Tahap 6'] as const){const gate=evaluateStageGate(s,stage);assert.equal(gate.readyToComplete,false,stage);assert.ok(gate.blockers.length,stage);assert.equal(gate.canView,true);}
});
test('open calibration finding blocks calibration gate even when checklist is retained',()=>{
 const s=setup();s.corrections=[{...finding(),blockedStage:'Kalibrasi',returnStage:'Kalibrasi',status:'Terbuka'}];assert.equal(evaluateStageGate(s,'Tahap 1').readyToComplete,false);assert.ok(evaluateStageGate(s,'Tahap 1').blockers.some(x=>x.includes('Temuan kalibrasi')));
});
test('active quality finding cannot leave audit and acceptance readiness green',()=>{
 const s=setup();s.corrections=[{...finding(),status:'Terbuka'}];for(const stage of ['Tahap 4','Tahap 5','Tahap 6'] as const){const gate=evaluateStageGate(s,stage);assert.equal(gate.readyToComplete,false);assert.ok(gate.blockers.includes('Temuan mutu masih terbuka.'));}
});
test('closed case and H+0 reminder do not add quality blockers',()=>{
 const s=setup();const before=evaluateStageGate(s,'Tahap 5');s.corrections.push({...finding(),status:'Ditutup'},{...finding(),id:'REMINDER',source:'Notifikasi H+0',status:'Terbuka'});assert.deepEqual(evaluateStageGate(s,'Tahap 5'),before);
});
test('administrative reminders do not block production or periodic readiness even with historical stage metadata',()=>{
 const s=setup();const before=['Tahap 2','Tahap 3B'].map(stage=>evaluateStageGate(s,stage as 'Tahap 2'|'Tahap 3B'));
 s.corrections.push({...finding(),id:'REM-PROD',source:'Notifikasi H+0',blockedStage:'Validasi produksi',status:'Terbuka'},{...finding(),id:'REM-PERIOD',source:'Pengingat H+0 terlewat',blockedStage:'Verval 14 hari',status:'Terbuka'});
 assert.deepEqual(['Tahap 2','Tahap 3B'].map(stage=>evaluateStageGate(s,stage as 'Tahap 2'|'Tahap 3B')),before);
});
test('daily survey finding also blocks periodic gate with a specific explanation',()=>{
 const s=setup();s.corrections=[{...finding(),blockedStage:'Survei harian',status:'Terbuka'}];
 const gate=evaluateStageGate(s,'Tahap 3B');assert.equal(gate.readyToComplete,false);assert.ok(gate.blockers.includes('Temuan survei harian masih terbuka.'));
});
