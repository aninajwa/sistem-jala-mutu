import assert from 'node:assert/strict';
import test from 'node:test';

import { preserveSessionForSameUser } from './sessionStability';

type TestSession = { user: { id: string }; access_token: string };

test('token refresh for the same user preserves the mounted application session', () => {
  const current: TestSession = { user: { id: 'user-1' }, access_token: 'old-token' };
  const refreshed: TestSession = { user: { id: 'user-1' }, access_token: 'new-token' };
  assert.equal(preserveSessionForSameUser(current, refreshed), current);
});

test('sign-in, sign-out and account changes still update session state', () => {
  const first: TestSession = { user: { id: 'user-1' }, access_token: 'token-1' };
  const second: TestSession = { user: { id: 'user-2' }, access_token: 'token-2' };
  assert.equal(preserveSessionForSameUser(null, first), first);
  assert.equal(preserveSessionForSameUser(first, null), null);
  assert.equal(preserveSessionForSameUser(first, second), second);
});
