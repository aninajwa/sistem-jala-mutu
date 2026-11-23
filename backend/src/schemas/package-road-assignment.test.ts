import test from 'node:test';
import assert from 'node:assert/strict';
import { packageRoadAssignmentSchema } from './package-road-assignment';

test('road location add accepts explicit active survey scope and nullable semester', () => {
  assert.equal(packageRoadAssignmentSchema.safeParse({ ruas_id: 13, jenis_survei_id: 1, semester: null }).success, true);
  assert.equal(packageRoadAssignmentSchema.safeParse({ ruas_id: 13, jenis_survei_id: 1, semester: 2 }).success, true);
});

test('road location add rejects malformed, protected and out-of-range fields', () => {
  const base = { ruas_id: 13, jenis_survei_id: 1, semester: null };
  for (const input of [
    { ...base, paket_id: 3 },
    { ...base, status: 'DISETUJUI' },
    { ...base, ruas_id: 0 },
    { ...base, jenis_survei_id: 1.5 },
    { ...base, semester: 2147483648 },
    { ...base, semester: '2' },
  ]) assert.equal(packageRoadAssignmentSchema.safeParse(input).success, false);
});
