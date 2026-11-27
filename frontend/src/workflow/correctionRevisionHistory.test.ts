import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoWorkflow } from './demoScenario';
import { retainCorrectionRevisionHistory } from './correctionRevisionHistory';
import type { OperationalWorkflowState } from './model';

test('retains old proposal and failed result independently of later edits', () => {
  const before = createDemoWorkflow('verval-finding');
  const c = before.corrections[0];
  const failed: OperationalWorkflowState = {...before, corrections: [{...c,status:'Terbuka',approval:'Perlu Revisi',retest:'Gagal',retestReference:'OLD-RESULT'}]};
  const saved = retainCorrectionRevisionHistory(before,failed,'Uji ulang gagal');
  const proposed: OperationalWorkflowState = {...saved, corrections:[{...saved.corrections[0],status:'Menunggu Persetujuan',approval:'Diajukan',retest:'Belum Diuji',retestReference:undefined}]};
  const next = retainCorrectionRevisionHistory(saved,proposed,'Ajukan ulang');
  assert.equal(next.correctionRevisionHistory?.length,2);
  assert.equal(next.correctionRevisionHistory?.[1].before?.retestReference,'OLD-RESULT');
  assert.equal(next.correctionRevisionHistory?.[1].attempt,1);
  proposed.corrections[0].proposedPlan='changed';
  assert.notEqual(next.correctionRevisionHistory?.[1].after.proposedPlan,'changed');
});
test('ignores caller journal and does not create entries on unrelated changes',()=>{
  const s=createDemoWorkflow('verval-finding');
  const next=retainCorrectionRevisionHistory(s,{...s,correctionRevisionHistory:[]} ,'Other');
  assert.deepEqual(next.correctionRevisionHistory,[]);
  const changed=retainCorrectionRevisionHistory(s,{...s,corrections:[{...s.corrections[0],status:'Menunggu Persetujuan'}]},'Submit');
  const retained=retainCorrectionRevisionHistory(changed,{...changed,correctionRevisionHistory:[]},'Other');
  assert.deepEqual(retained.correctionRevisionHistory,changed.correctionRevisionHistory);
});
