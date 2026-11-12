import test from 'node:test';
import assert from 'node:assert/strict';
import { allowed, adminAccessRoles, accessAreas, filterTrail, trailCsv } from './accessPolicy';

test('all four roles and five areas are available without invented accounts', () => {
  assert.equal(adminAccessRoles.length, 4);
  assert.equal(accessAreas.length, 5);
});
test('admin cannot approve Balai or Directorate technical decisions', () => {
  assert.equal(allowed('Admin', 'balai', 'setujui'), false);
  assert.equal(allowed('Admin', 'pusat', 'setujui'), false);
  assert.equal(allowed('Admin', 'entry', 'tulis'), false);
  assert.equal(allowed('Admin', 'access', 'kelola'), true);
});
test('Balai and Directorate approval is restricted to their own area', () => {
  assert.equal(allowed('PIC Balai / Pengguna Jasa', 'balai', 'setujui'), true);
  assert.equal(allowed('PIC Balai / Pengguna Jasa', 'pusat', 'setujui'), false);
  assert.equal(allowed('Direktorat / Pusat', 'pusat', 'setujui'), true);
});
test('trail search uses real rows and includes result', () => {
  const rows = [{id:'A1',waktu:'12 Nov',pengguna:'User',aktivitas:'Ubah',objek:'Balai',hasil:'Ditolak'}];
  assert.equal(filterTrail(rows, 'ditolak').length, 1);
  assert.equal(filterTrail(rows, 'tidak ada').length, 0);
});
test('CSV exports supplied rows, escaping spreadsheet formulas', () => {
  const csv = trailCsv([{id:'A1',waktu:'12 Nov',pengguna:'=CMD()',aktivitas:'Ekspor',objek:'Ruas',hasil:'Berhasil'}]);
  assert.ok(csv.includes("'=CMD()"));
  assert.ok(!csv.includes('42 pengguna'));
});
