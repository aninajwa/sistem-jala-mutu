import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../auth/client';
import { draftSaveError, readIriChecklist, saveIriDraft, STAGE1_IRI_CANDIDATE, STAGE1_IRI_ITEMS, hydrateIriChecklist, mergeIriDraft, type IriChecklistRequest, type IriChecklistResponse } from './stage1IriChecklist';

const fixture: IriChecklistResponse = {
  paket_id: 3, survey: 'IRI', template: { ...STAGE1_IRI_CANDIDATE, template_id: 17 },
  filling: { pengisian_id: 21, version: 4, answer_status: 'DRAFT', updated_at: '2026-11-14T00:00:00Z' },
  items: STAGE1_IRI_ITEMS,
  answers: { 'IRI-CAL-2.1': { value: 'Ya', note: 'dari server' }, 'IRI-CAL-2.2': { value: null, note: null } },
};

test('candidate is exactly 30 source-derived IRI binary rows and excludes structured table and other surveys', () => {
  assert.equal(STAGE1_IRI_ITEMS.length, 30);
  assert.equal(new Set(STAGE1_IRI_ITEMS.map(item => item.key)).size, 30);
  assert.ok(STAGE1_IRI_ITEMS.every(item => item.applicability.length === 1 && item.applicability[0] === 'IRI' && item.mandatory === null));
  assert.equal(STAGE1_IRI_ITEMS.some(item => item.key.includes('VAL-6')), false);
  assert.equal(STAGE1_IRI_CANDIDATE.approvalState, 'INTERNAL_PROJECT_DRAFT');
  assert.equal(STAGE1_IRI_CANDIDATE.officialRevision, null);
});

test('read hydration rejects cross-package and template/source-hash responses', () => {
  assert.equal(hydrateIriChecklist(fixture, '3'), fixture);
  assert.throws(() => hydrateIriChecklist({ ...fixture, paket_id: 11 }, '3'), /tidak sesuai paket\/template/);
  assert.throws(() => hydrateIriChecklist({ ...fixture, template: { ...fixture.template, sourceHash: 'wrong' } }, '3'), /tidak sesuai paket\/template/);
  assert.throws(() => hydrateIriChecklist({ ...fixture, answers: { 'IRI-VAL-6.1': { value: 'Ya', note: null } } }, '3'), /Jawaban server tidak sesuai kontrak/);
});

test('partial draft merge keeps untouched server answers while local edits remain separable', () => {
  const draft = { 'IRI-CAL-2.1': { value: 'Tidak' as const, note: 'local unsaved' } };
  assert.deepEqual(mergeIriDraft(fixture.answers, draft), {
    'IRI-CAL-2.1': { value: 'Tidak', note: 'local unsaved' },
    'IRI-CAL-2.2': { value: null, note: null },
  });
  assert.equal(fixture.answers['IRI-CAL-2.1'].note, 'dari server', 'server snapshot is not mutated by draft edits');
});

test('read is package scoped and saved response hydrates only after a newer persisted version returns', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const mock: IriChecklistRequest = async <T>(path: string, init?: RequestInit) => {
    calls.push({ path, init });
    return { data: fixture } as T;
  };
  assert.equal(await readIriChecklist('3', mock), fixture);
  assert.match(calls[0].path, /paket\/3\/checklist-kalibrasi\?survey=IRI/);
  const persisted = { ...fixture, filling: { ...fixture.filling, version: 5 }, answers: { ...fixture.answers, 'IRI-CAL-2.1': { value: 'Tidak' as const, note: 'persisted' } } };
  const saveMock: IriChecklistRequest = async <T>(_path: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    assert.equal(body.expected_version, 4);
    assert.deepEqual(body.answers.map((answer: { key: string }) => answer.key), ['IRI-CAL-2.1']);
    return { data: persisted } as T;
  };
  assert.equal((await saveIriDraft('3', fixture, { 'IRI-CAL-2.1': { value: 'Tidak', note: 'local' } }, saveMock)).filling.version, 5);
  await assert.rejects(saveIriDraft('3', fixture, { 'IRI-CAL-2.1': { value: 'Tidak', note: null } }, async <T>() => ({ data: fixture }) as T), /tidak mengonfirmasi versi/);
});

test('mocked QA draft request sends only the selected unanswered row and accepts persisted readback', async () => {
  const qaNote = 'TEST/QA — ujian persistence, bukan bukti kalibrasi.';
  const baseline: IriChecklistResponse = {
    ...fixture,
    filling: { pengisian_id: null, version: 0, answer_status: 'DRAFT', updated_at: null },
    answers: {},
  };
  const persisted: IriChecklistResponse = {
    ...baseline,
    filling: { pengisian_id: 22, version: 1, answer_status: 'DRAFT', updated_at: '2026-11-15T00:00:00Z' },
    answers: { 'IRI-CAL-2.1': { value: null, note: qaNote } },
  };
  let calls = 0;
  const mock: IriChecklistRequest = async <T>(path: string, init?: RequestInit) => {
    calls += 1;
    assert.equal(path, '/paket/3/checklist-kalibrasi');
    assert.equal(init?.method, 'PATCH');
    assert.deepEqual(JSON.parse(String(init?.body)), {
      template_id: fixture.template.template_id,
      expected_version: 0,
      answers: [{ key: 'IRI-CAL-2.1', value: null, note: qaNote }],
    });
    return { data: persisted } as T;
  };
  const result = await saveIriDraft('3', baseline, { 'IRI-CAL-2.1': { value: null, note: qaNote } }, mock);
  assert.equal(calls, 1);
  assert.equal(result.filling.pengisian_id, 22);
  assert.equal(result.filling.version, 1);
  assert.deepEqual(result.answers, persisted.answers);
});

test('save failures and version conflicts are not converted into success', () => {
  assert.deepEqual(draftSaveError(new ApiError(409, 'stale')), {
    conflict: true,
    message: 'Versi checklist berubah di server. Perubahan lokal Anda tetap disimpan di layar; muat ulang data secara sadar sebelum menggabungkan.',
  });
  assert.equal(draftSaveError(new Error('network down')).conflict, false);
});
