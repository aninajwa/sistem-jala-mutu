import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const component = await readFile(new URL('./ServerVervalWorkspace.tsx', import.meta.url), 'utf8');
const css = await readFile(new URL('../workflow/workflow.css', import.meta.url), 'utf8');

test('cycle detail uses dedicated responsive attributes styling without changing loading/error states', () => {
  assert.match(component, /className="package-context-grid verval-cycle-attributes" data-testid="verval-cycle-attributes"/);
  assert.match(component, /Memuat detail siklus/);
  assert.match(component, /role="alert" className="wf-callout danger"/);
  assert.match(css, /\.verval-cycle-attributes\{grid-template-columns:repeat\(auto-fit,minmax\(min\(100%,220px\),1fr\)\)/);
  assert.match(css, /\.verval-cycle-attributes strong\{[^}]*white-space:normal[^}]*overflow-wrap:anywhere/);
});
