import test from 'node:test';
import assert from 'node:assert/strict';
import {isReviewPackageInScope} from './reviewEvidenceAccess';
test('review drill-down is limited to package IDs in the current scope',()=>{
 const scope=new Set(['paket-a']);
 assert.equal(isReviewPackageInScope('paket-a',scope),true);
 for(const id of ['paket-b','', 'paket-a ', 'PAKET-A'])assert.equal(isReviewPackageInScope(id,scope),false);
});
test('empty package scope denies all review drill-down',()=>{
 assert.equal(isReviewPackageInScope('paket-a',new Set()),false);
});
