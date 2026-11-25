import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daysLeft, dueText } from './serverNotificationTime';

test('notification due text counts calendar days', () => {
  const today = new Date(2026, 10, 25);
  assert.equal(daysLeft('2026-12-02', today), 7);
  assert.equal(dueText('2026-12-02', today), 'Tenggat 7 hari lagi');
  assert.equal(dueText('2026-11-25', today), 'Jatuh tempo hari ini');
  assert.equal(dueText('2026-11-20', today), 'Lewat 5 hari');
  assert.equal(dueText(null, today), '');
});
