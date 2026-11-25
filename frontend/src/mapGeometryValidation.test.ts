import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { validateMapPoint, validMapPoints } from './mapGeometryValidation';
const valid = {id:'ruas-01',label:'Ruas 01',latitude:-6.2,longitude:106.8,sourceId:'smd-01',sourceSystem:'SMD'};
test('only traceable and finite geometry passes', () => {
  assert.deepEqual(validateMapPoint(valid), valid);
  for (const bad of [{...valid,latitude:NaN},{...valid,latitude:91},{...valid,longitude:181},{...valid,sourceId:''},{...valid,latitude:0,longitude:0},{...valid,latitude:'-6.2'},{}]) assert.equal(validateMapPoint(bad),null);
});
test('duplicate geometry identifiers do not create duplicate markers', () => {
  assert.deepEqual(validMapPoints([valid,valid,{...valid,id:'ruas-02'},null]).map(x=>x.id),['ruas-01','ruas-02']);
});
