import assert from 'node:assert/strict';
import test from 'node:test';
import { apiConfigurationIssue, authConfigurationIssue, SANDBOX_SUPABASE_URL } from './config';

test('auth configuration accepts only the approved sandbox and a non-secret publishable key', () => {
  assert.equal(authConfigurationIssue(SANDBOX_SUPABASE_URL, 'sb_publishable_test-key'), '');
  assert.ok(authConfigurationIssue('https://production.supabase.co', 'sb_publishable_test-key'));
  assert.ok(authConfigurationIssue(SANDBOX_SUPABASE_URL, 'sb_secret_test-key'));
  assert.ok(authConfigurationIssue(SANDBOX_SUPABASE_URL, 'REPLACE_WITH_KEY'));
});

test('API base accepts same-origin /api or local port 5001 only', () => {
  assert.equal(apiConfigurationIssue(undefined), '');
  assert.equal(apiConfigurationIssue('/api'), '');
  assert.equal(apiConfigurationIssue('http://127.0.0.1:5001/api'), '');
  assert.equal(apiConfigurationIssue('http://localhost:5001/api'), '');
  assert.ok(apiConfigurationIssue('http://localhost:5501/api'));
  assert.ok(apiConfigurationIssue('http://localhost:5000/api'));
  assert.ok(apiConfigurationIssue('https://api.example.test/api'));
});
