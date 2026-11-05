import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DAILY_EQUIPMENT_CHECK_MOCK, getDailyEquipmentCheckMock } from './dailyEquipmentCheckMock';

test('fixture contains only synthetic prototype checks with recognized values', () => {
  assert.ok(DAILY_EQUIPMENT_CHECK_MOCK.length > 0);
  assert.ok(DAILY_EQUIPMENT_CHECK_MOCK.every((row) => row.id.startsWith('QA-')));
  assert.ok(DAILY_EQUIPMENT_CHECK_MOCK.every((row) => row.packageId === 301));
  assert.deepEqual(new Set(DAILY_EQUIPMENT_CHECK_MOCK.map((row) => row.result)), new Set(['OK', 'BERMASALAH', 'TIDAK_DILAKUKAN']));
  assert.deepEqual(new Set(DAILY_EQUIPMENT_CHECK_MOCK.map((row) => row.item)), new Set(['GPS', 'BATERAI', 'PENYIMPANAN', 'BOUNCE_TEST_KELAS_I']));
});

test('mock selector is package-scoped and returns no records for other packages', () => {
  assert.equal(getDailyEquipmentCheckMock(301).length, 4);
  assert.deepEqual(getDailyEquipmentCheckMock(9), []);
});
