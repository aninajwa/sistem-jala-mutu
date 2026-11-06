import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createLocalConsistencyRepository,
  LocalPrototypeError,
  simulateConsistencyWrite,
} from '../prototypes/uji-konsistensi-write-local.mjs';

const packageId = 9;
const cycles = [{ paket_id: 9, siklus_id: 1 }, { paket_id: 10, siklus_id: 2 }];
const referenceRows = [{
  paket_id: 9,
  siklus_id: 1,
  jenis_survei_id: 4,
  tim_id: 12,
  ruas_id: 30,
  personel_ids: [101, 102],
}];
const payload = {
  siklus_id: 1,
  jenis_survei_id: 4,
  tim_id: 12,
  ruas_id: 30,
  sta_awal: 1.2,
  sta_akhir: 2.4,
  jumlah_ulangan: 2,
  ulangan: [
    { ulangan_ke: 1, rater_personel_id: 101, nilai: 3.5 },
    { ulangan_ke: 2, rater_personel_id: 102, nilai: 3.7 },
  ],
};
const auth = { actorId: 500, assignments: [{ packageId: 9 }], fixtureRoleAllowsWrite: true };
const repository = () => createLocalConsistencyRepository({ cycles, referenceRows });

async function assertPrototypeError(operation, code) {
  await assert.rejects(operation, (error) => error instanceof LocalPrototypeError && error.code === code);
}

test('local validator rejects malformed, extra, non-finite and invalid numeric input', async () => {
  const repo = repository();
  for (const invalid of [
    { ...payload, unexpected_field: 'not a DB column' },
    { ...payload, status: 'LULUS' },
    { ...payload, pencatat_id: 500 },
    { ...payload, siklus_id: 0 },
    { ...payload, sta_awal: '1.2' },
    { ...payload, jumlah_ulangan: 0 },
    { ...payload, ulangan: [] },
    { ...payload, ulangan: [{ ...payload.ulangan[0], nilai: Number.NaN }] },
    { ...payload, ulangan: [{ ...payload.ulangan[0], evidence_id: 22 }, payload.ulangan[1]] },
  ]) {
    await assertPrototypeError(simulateConsistencyWrite({ repository: repo, packageId, auth, payload: invalid }), 'INVALID_INPUT');
  }
  assert.equal(repo.snapshot().consistency.length, 0);
});

test('local authorization fixture separately requires package assignment and an approved role decision', async () => {
  const repo = repository();
  await assertPrototypeError(simulateConsistencyWrite({
    repository: repo, packageId, auth: { ...auth, assignments: [{ packageId: 10 }] }, payload,
  }), 'FORBIDDEN');
  await assertPrototypeError(simulateConsistencyWrite({
    repository: repo, packageId, auth: { ...auth, fixtureRoleAllowsWrite: false }, payload,
  }), 'FORBIDDEN');
  assert.equal(repo.snapshot().consistency.length, 0);
});

test('cycle ownership prevents cross-package and mismatched-cycle writes', async () => {
  const repo = repository();
  await assertPrototypeError(simulateConsistencyWrite({ repository: repo, packageId: 10, auth: { ...auth, assignments: [{ packageId: 10 }] }, payload }), 'NOT_FOUND');
  await assertPrototypeError(simulateConsistencyWrite({ repository: repo, packageId, auth, payload: { ...payload, siklus_id: 2 } }), 'NOT_FOUND');
  assert.equal(repo.snapshot().consistency.length, 0);
});

test('related survey/team/road/rater references must match the package-cycle fixture', async () => {
  const repo = repository();
  for (const altered of [
    { jenis_survei_id: 5 },
    { tim_id: 99 },
    { ruas_id: 99 },
    { ulangan: [{ ...payload.ulangan[0], rater_personel_id: 999 }, payload.ulangan[1]] },
  ]) {
    await assertPrototypeError(simulateConsistencyWrite({ repository: repo, packageId, auth, payload: { ...payload, ...altered } }), 'REFERENCE_MISMATCH');
  }
  const foreignRepo = createLocalConsistencyRepository({
    cycles,
    referenceRows: [{ ...referenceRows[0], paket_id: 10, siklus_id: 2 }],
  });
  await assertPrototypeError(simulateConsistencyWrite({ repository: foreignRepo, packageId, auth, payload }), 'REFERENCE_MISMATCH');
});

test('successful local transaction creates parent and repetitions without actor or approval fields', async () => {
  const repo = repository();
  const result = await simulateConsistencyWrite({ repository: repo, packageId, auth, payload });
  assert.equal(result.status, null);
  assert.equal(result.konsistensi_id, 1);
  assert.equal(result.ulangan.length, 2);
  assert.deepEqual(Object.keys(result).sort(), ['jenis_survei_id', 'konsistensi_id', 'jumlah_ulangan', 'ruas_id', 'sta_akhir', 'sta_awal', 'status', 'siklus_id', 'tim_id', 'ulangan'].sort());
  assert.equal('actorId' in result, false);
  assert.equal('pencatat_id' in result, false);
  assert.equal('evidence_id' in result, false);
  assert.equal(repo.snapshot().consistency.length, 1);
  assert.equal(repo.snapshot().repetitions.length, 2);
});

test('failure while inserting a repetition rolls back parent, prior repetitions and generated IDs', async () => {
  const repo = repository();
  await assertPrototypeError(simulateConsistencyWrite({ repository: repo, packageId, auth, payload, failRepeatAt: 1 }), 'SIMULATED_INSERT_FAILURE');
  const afterFailure = repo.snapshot();
  assert.equal(afterFailure.consistency.length, 0);
  assert.equal(afterFailure.repetitions.length, 0);
  assert.equal(afterFailure.nextConsistencyId, 1);
  assert.equal(afterFailure.nextRepetitionId, 1);

  const success = await simulateConsistencyWrite({ repository: repo, packageId, auth, payload });
  assert.equal(success.konsistensi_id, 1);
  assert.deepEqual(success.ulangan.map((item) => item.ulangan_id), [1, 2]);
});
