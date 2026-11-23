import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertStage1ConfirmationPic,
  assertStage1ConfirmationProvider,
  assertStage1ConfirmationEnabled,
  stage1ConfirmationEnabled,
} from './stage1-confirmation-policy';
import { ApiError } from './supabase';

test('activation requires explicit approval, installed authorization and enabled switch', () => {
  assert.equal(stage1ConfirmationEnabled({ enabled: 'true', approved: 'true', authorizationInstalled: 'true' }), true);
  assert.equal(stage1ConfirmationEnabled({ enabled: 'true', approved: 'true', authorizationInstalled: 'false' }), false);
  assert.equal(stage1ConfirmationEnabled({ enabled: 'false', approved: 'true', authorizationInstalled: 'true' }), false);
  assert.throws(() => assertStage1ConfirmationEnabled({ enabled: 'true', approved: 'true', authorizationInstalled: 'false' }), ApiError);
});

test('Provider and PIC endpoint role guards are independent', () => {
  assert.doesNotThrow(() => assertStage1ConfirmationProvider({ roles: [{ nama: 'penyedia_jasa' }] }));
  assert.doesNotThrow(() => assertStage1ConfirmationPic({ roles: [{ nama: 'pic_balai' }] }));
  assert.throws(() => assertStage1ConfirmationProvider({ roles: [{ nama: 'pic_balai' }] }), ApiError);
  assert.throws(() => assertStage1ConfirmationPic({ roles: [{ nama: 'admin' }] }), ApiError);
});
