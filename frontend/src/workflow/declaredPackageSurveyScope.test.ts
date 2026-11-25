import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  normalizeSurveyIds,
  parseDeclaredPackageSurveyScope,
  parseDeclaredPackageSurveyScopeBatch,
  readDeclaredPackageSurveyScopes,
  saveDeclaredPackageSurveyScope,
} from './declaredPackageSurveyScope';

const iri = { jenis_survei_id: 2, kode: 'IRI', nama: 'International Roughness Index', aktif: true };
const pci = { jenis_survei_id: 5, kode: 'PCI', nama: 'Pavement Condition Index', aktif: true };

test('single/multiple selections normalize to stable unique IDs and reject invalid IDs', () => {
  assert.deepEqual(normalizeSurveyIds([5, 2, 5]), [2, 5]);
  assert.deepEqual(normalizeSurveyIds([2]), [2]);
  for (const ids of [[0], [-1], [1.1], [2147483648], ['2'] as unknown as number[]]) {
    assert.throws(() => normalizeSurveyIds(ids));
  }
});

test('read contract distinguishes previously unset packages from persisted single/multiple selections', () => {
  assert.deepEqual(parseDeclaredPackageSurveyScope({ paket_id: 7, state: 'unset', version: null, surveys: [] }, 7).state, 'unset');
  const selection = parseDeclaredPackageSurveyScope({ paket_id: 8, state: 'defined', version: 4, surveys: [pci, iri] }, 8);
  assert.deepEqual(selection.surveys.map(item => item.jenis_survei_id), [2, 5]);
  assert.throws(() => parseDeclaredPackageSurveyScope({ paket_id: 8, state: 'defined', version: null, surveys: [iri] }, 8), /tidak konsisten/);
  assert.throws(() => parseDeclaredPackageSurveyScopeBatch([{ paket_id: 8, state: 'unset', version: null, surveys: [] }], [8, 9]), /tidak mencakup/);
});

test('one denied package scope read does not hide authorized sibling package selections', async () => {
  const result = await readDeclaredPackageSurveyScopes([3, 4], async (path): Promise<{ data: unknown }> => {
    if (path.endsWith('paket_ids=3')) throw new Error('403 denied');
    return { data: [{ paket_id: 4, state: 'defined', version: 1, surveys: [iri] }] };
  });
  assert.equal(result.get(3), null);
  assert.deepEqual(result.get(4)?.surveys.map(item => item.kode), ['IRI']);
});

test('edit sends selected IDs with expected version and confirms only after authoritative readback', async () => {
  const requests: Array<{ path: string; init?: RequestInit }> = [];
  const saved = await saveDeclaredPackageSurveyScope(8, 3, [5, 2, 5], async <T>(path: string, init?: RequestInit): Promise<T> => {
    requests.push({ path, init });
    if (path.endsWith('/survey-scope')) return {} as T;
    return { data: { paket_id: 8, state: 'defined', version: 4, surveys: [iri, pci] } } as T;
  });
  assert.equal(saved.version, 4);
  assert.deepEqual(requests.map(item => item.path), [
    '/paket/8/survey-scope',
    '/paket/8/declared-survey-scope',
  ]);
  assert.deepEqual(JSON.parse(String(requests[0].init?.body)), { expected_version: 3, jenis_survei_ids: [2, 5] });
  await assert.rejects(
    saveDeclaredPackageSurveyScope(8, 3, [2], async <T>(path: string): Promise<T> => {
      if (path.endsWith('/survey-scope')) return {} as T;
      return { data: { paket_id: 8, state: 'defined', version: 4, surveys: [iri, pci] } } as T;
    }),
    /Readback scope survei tidak sama/,
  );
  await assert.rejects(
    saveDeclaredPackageSurveyScope(8, 3, [2], async <T>(): Promise<T> => { throw new Error('409 conflict'); }),
    /409 conflict/,
  );
});

test('locked/conflicted edit keeps unsaved selection and shows server denial without a success message', async () => {
  const source = await readFile(new URL('../pages/ServerPackageWorkspace.tsx', import.meta.url), 'utf8');
  const save = source.slice(source.indexOf('async function saveSurveyScope()'), source.indexOf('async function saveChecklist()'));
  assert.match(save, /catch \(cause\)[\s\S]*setScopeError\(errorMessage\(cause/);
  assert.doesNotMatch(save.slice(save.indexOf('catch (cause)')), /setScopeDraftIds\(/);
  assert.match(save, /setScopeMessage\(`Scope kontrak tersimpan dan dibaca ulang/);
  assert.match(source, /scopeError && <p role="alert"/);
});
