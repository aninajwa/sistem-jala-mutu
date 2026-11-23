import assert from 'node:assert/strict';
import test from 'node:test';
import { stageDone } from './stageCompletion';

test('without server facts, stages before the current process position are done', () => {
  assert.equal(stageDone('Tahap 0', 'Tahap 2'), true);
  assert.equal(stageDone('Tahap 1', 'Tahap 2'), true);
  assert.equal(stageDone('Tahap 2', 'Tahap 2'), false);
  assert.equal(stageDone('Tahap 4', 'Tahap 2'), false);
  assert.equal(stageDone('Tahap 6', 'Selesai'), true);
  assert.equal(stageDone('Tahap 0', 'bukan tahap'), false);
});

test('server facts decide completion on their own when provided', () => {
  const completed = new Set(['Tahap 0', 'Tahap 2']);
  assert.equal(stageDone('Tahap 0', 'Tahap 3A', completed), true);
  assert.equal(stageDone('Tahap 1', 'Tahap 3A', completed), false);
  assert.equal(stageDone('Tahap 2', 'Tahap 3A', completed), true);
  assert.equal(stageDone('Tahap 0', 'Tahap 3A', new Set()), false);
});
