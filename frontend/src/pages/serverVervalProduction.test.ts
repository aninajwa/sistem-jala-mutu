import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [workspace, packageWorkspace] = await Promise.all([
  readFile(new URL('./ServerVervalWorkspace.tsx', import.meta.url), 'utf8'),
  readFile(new URL('./ServerPackageWorkspace.tsx', import.meta.url), 'utf8'),
]);

test('authenticated Stage 3B remains distinct and gates production controls on server capabilities and provider role', () => {
  assert.match(workspace, /getStage3BCapabilities\(packageId, apiRequest/);
  assert.match(workspace, /!capabilities\.read/);
  assert.match(workspace, /capabilities\?\.write/);
  assert.match(workspace, /role !== 'Penyedia Jasa \/ Ketua Tim'/);
  assert.match(workspace, /expected_version: cycle\.versi \?\? 0/);
  assert.match(workspace, /saveConsistencyAndConfirm/);
  assert.match(packageWorkspace, /<ServerVervalWorkspace packageId=\{packageId\} role=\{role\}/);
});

test('production workspace displays disabled/mutation errors and does not replace local-demo stage component', () => {
  assert.match(workspace, /Verval Berkala belum tersedia/);
  assert.match(workspace, /role="alert" className="wf-callout danger"/);
  assert.match(packageWorkspace, /SERVER_STAGE3B \? <ServerVervalWorkspace/);
});
