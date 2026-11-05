import test from 'node:test';
import assert from 'node:assert/strict';
import {traceReviewEvidence} from './reviewEvidenceTrace';
test('tidak menyimpulkan bukti dari keputusan review tanpa referensi eksplisit',()=>{
 assert.deepEqual(traceReviewEvidence({}),{status:'belum-tertaut',references:[]});
 assert.deepEqual(traceReviewEvidence({evidenceReferences:'dokumen-lain'}),{status:'belum-tertaut',references:[]});
});
test('referensi eksplisit dinormalisasi tanpa menganggap file telah diverifikasi',()=>{
 assert.deepEqual(traceReviewEvidence({evidenceReferences:[' BA-01 ','BA-01','',null,'UJI-2']}),{status:'referensi-tercatat',references:['BA-01','UJI-2']});
});
