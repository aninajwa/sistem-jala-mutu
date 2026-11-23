import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from './supabase';
import { assertStage1IriChecklistEditor, assertStage1IriChecklistEnabled } from './stage1-iri-checklist-policy';

const active = { enabled: 'true', projectDraftAccepted: 'true', authorizationInstalled: 'true' };
test('Stage 1 endpoint gate recognizes internal project draft but remains closed until installed and enabled', () => {
  assert.throws(() => assertStage1IriChecklistEnabled({ ...active, projectDraftAccepted: 'false' }), (error: unknown) => error instanceof ApiError && error.status === 503);
  assert.throws(() => assertStage1IriChecklistEnabled({ ...active, authorizationInstalled: 'false' }), (error: unknown) => error instanceof ApiError && error.status === 503);
  assert.doesNotThrow(() => assertStage1IriChecklistEnabled(active));
});
test('writes require provider role; PIC read is not blocked by this editor-only check', () => {
  assert.doesNotThrow(() => assertStage1IriChecklistEditor({ roles: [{ nama: 'penyedia_jasa' }] }));
  assert.throws(() => assertStage1IriChecklistEditor({ roles: [{ nama: 'pic_balai' }] }), (error: unknown) => error instanceof ApiError && error.status === 403);
});
