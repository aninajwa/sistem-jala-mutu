import assert from 'node:assert/strict';
import {test} from 'node:test';
import {resolveEditablePackageId} from './resolveEditablePackageId';

test('direct navigation uses the same first visible package shown by the UI',()=>{
  assert.equal(resolveEditablePackageId(null,['PAKET-DEMO-001','PAKET-DEMO-002']),'PAKET-DEMO-001');
});
test('explicit selection always wins over fallback',()=>{
  assert.equal(resolveEditablePackageId('PAKET-DEMO-002',['PAKET-DEMO-001','PAKET-DEMO-002']),'PAKET-DEMO-002');
});
test('forbidden explicit package never falls back to another package',()=>{
  assert.equal(resolveEditablePackageId('PAKET-LAIN',['PAKET-DEMO-001']),null);
});
test('empty assignment cannot persist a mutation',()=>{
  assert.equal(resolveEditablePackageId(null,[]),null);
});
