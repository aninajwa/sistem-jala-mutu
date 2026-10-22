import test from 'node:test';
import assert from 'node:assert/strict';
import {createDemoWorkflow} from './demoScenario';
import {stagedFallbackReviewReady,stagedSurveyReviewMode} from './stagedReviewPolicy';

test('Lendutan tidak dibuatkan checklist staged palsu dan butuh review Balai eksplisit',()=>{
  const state=createDemoWorkflow('complete');
  state.submission.stagedReviews={};
  assert.equal(stagedSurveyReviewMode('Lendutan'),'generic-review');
  assert.equal(stagedFallbackReviewReady(state,'Lendutan'),false);
  state.submission.stagedReviews={Lendutan:{decision:'Sesuai',note:'Bukti V&V bertahap diperiksa',reviewedAt:'2026-10-22'}};
  assert.equal(stagedFallbackReviewReady(state,'Lendutan'),true);
});

test('survei yang memiliki dokumen staged tetap memakai source form',()=>{
  assert.equal(stagedSurveyReviewMode('IRI'),'source-form');
  assert.equal(stagedSurveyReviewMode('PCI',true),'source-form');
});
