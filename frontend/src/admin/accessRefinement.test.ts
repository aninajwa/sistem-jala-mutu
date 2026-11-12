import test from 'node:test';import assert from 'node:assert/strict';
import {describePermission} from './accessPolicy';
test('permission details distinguish Balai review and central audit',()=>{
 assert.match(describePermission('PIC Balai / Pengguna Jasa','balai'),/Balai/);
 assert.match(describePermission('Direktorat / Pusat','pusat'),/tingkat 3/);
 assert.equal(describePermission('Admin','balai'),'Pemantauan sesuai kewenangan');
 assert.equal(describePermission('Penyedia Jasa / Ketua Tim','pusat'),'—');
});
