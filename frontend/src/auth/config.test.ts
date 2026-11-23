import assert from 'node:assert/strict';
import test from 'node:test';
import { apiConfigurationIssue, authConfigurationIssue, JALA_MUTU_SUPABASE_URL, SANDBOX_SUPABASE_URL } from './config';

test('auth configuration accepts both approved projects and a non-secret publishable key', () => {
  assert.equal(authConfigurationIssue(JALA_MUTU_SUPABASE_URL, 'sb_publishable_test-key'), '');
  assert.equal(authConfigurationIssue(SANDBOX_SUPABASE_URL, 'sb_publishable_test-key'), '');
  for (const url of [
    'https://production.supabase.co',
    'https://vnvknmwcidberkjwtqjx.supabase.co.evil.test',
    'https://vnvknmwcidberkjwtqjx.supabase.co.evil.test/',
  ]) {
    assert.ok(authConfigurationIssue(url, 'sb_publishable_test-key'), `${url} should be rejected`);
  }
  assert.ok(authConfigurationIssue(JALA_MUTU_SUPABASE_URL, 'sb_secret_test-key'));
  assert.ok(authConfigurationIssue(SANDBOX_SUPABASE_URL, 'sb_secret_test-key'));
  assert.ok(authConfigurationIssue(JALA_MUTU_SUPABASE_URL, 'service_role_test-key'));
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
