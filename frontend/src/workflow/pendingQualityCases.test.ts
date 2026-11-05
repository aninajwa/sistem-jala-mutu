import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoWorkflow} from './demoScenario';
import {canMarkFinalReport, pendingQualityCases, termReadiness} from './flowRules';

test('an open substantive correction blocks T2 T3 T4 and final report, even when another case is closed',()=>{
  const state=createDemoWorkflow('complete');
  const existing=state.corrections[0];
  assert.ok(existing,'fixture must include a corrective case');
  state.corrections=[{...existing,id:'CLOSED-1',status:'Ditutup'}, {...existing,id:'OPEN-2',status:'Terbuka'}];
  assert.deepEqual(pendingQualityCases(state).map(c=>c.id),['OPEN-2']);
  for(const id of ['T2','T3','T4'])assert.ok(termReadiness(state,id).some(message=>message.includes('Kasus tindakan perbaikan')),id);
  assert.equal(canMarkFinalReport(state),false);
});

test('closed corrections and H+0 reminders do not create a new gate blocker',()=>{
  const state=createDemoWorkflow('complete');
  const example=state.corrections[0];
  assert.ok(example);
  state.corrections=[{...example,id:'CLOSED',status:'Ditutup'},{...example,id:'REMINDER',status:'Terbuka',source:'Notifikasi H+0: pengingat'}];
  assert.deepEqual(pendingQualityCases(state),[]);
  for(const id of ['T2','T3','T4'])assert.ok(!termReadiness(state,id).some(message=>message.includes('Kasus tindakan perbaikan')),id);
});
