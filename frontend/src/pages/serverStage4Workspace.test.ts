import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const component = await readFile(new URL('./ServerStage4Workspace.tsx', import.meta.url), 'utf8');
const shell = await readFile(new URL('./ServerPackageWorkspace.tsx', import.meta.url), 'utf8');

test('authenticated Stage 4 reads persisted sessions/segments and refreshes from server data', () => {
  assert.match(component, /getSurveySessions\(packageId, apiRequest/);
  assert.match(component, /getSurveySegments\(packageId, selected, apiRequest/);
  assert.match(component, /setRevision\(value => value \+ 1\)/);
  assert.match(component, /Data survei tersimpan/);
  assert.match(shell, /selection === '\/entry:Gerbang RNI\/LRS' \? <ServerStage4Workspace/);
});

test('Stage 4 write is capability-gated; submit/review remain visibly disabled and failures are surfaced', () => {
  assert.match(component, /Simpan validasi LRS dinonaktifkan/);
  assert.match(component, /capabilities\?\.write/);
  assert.match(component, /fieldset disabled=\{!capabilities\.write/);
  assert.match(component, /saveStage4LrsAndConfirm/);
  assert.match(component, /Simpan validasi/);
  assert.match(component, /Ajukan ke pemeriksa/);
  assert.match(component, /role="alert" className="wf-callout danger"/);
  assert.match(component, /role="status"/);
});
