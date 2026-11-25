import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const component = await readFile(new URL('./ServerVervalWorkspace.tsx', import.meta.url), 'utf8');

test('cycle detail shows the period, consistency table, live KV preview and loading/error states', () => {
  assert.match(component, /data-testid="verval-cycle-detail"/);
  assert.match(component, /data-testid="verval-tests"/);
  assert.match(component, /data-testid="verval-preview"/);
  assert.match(component, /Memuat siklus verval/);
  assert.match(component, /role="alert" className="wf-callout danger"/);
});
