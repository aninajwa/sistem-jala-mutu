import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [workspace, packageWorkspace] = await Promise.all([
  readFile(new URL('./ServerVervalWorkspace.tsx', import.meta.url), 'utf8'),
  readFile(new URL('./ServerPackageWorkspace.tsx', import.meta.url), 'utf8'),
]);

test('authenticated Stage 3B gates on server capabilities and shows only RPC-allowed actions', () => {
  assert.match(workspace, /getStage3BCapabilities(packageId, apiRequest/);
  assert.match(workspace, /!capabilities.read/);
  assert.match(workspace, /capabilities?.write/);
  assert.match(workspace, /vervalActions(pkg, cycle, role)/);
  assert.match(workspace, /expected_version: cycle.versi ?? 0/);
  assert.match(workspace, /getVervalPackage(packageId, controller.signal)/);
  assert.match(packageWorkspace, /<ServerVervalWorkspace packageId={packageId} role={role}/);
});

test('production workspace shows disabled and mutation errors and stays the server 3B screen', () => {
  assert.match(workspace, /Verval Berkala belum tersedia/);
  assert.match(workspace, /role="alert" className="wf-callout danger"/);
  assert.match(workspace, /data-testid="verval-submit"/);
  assert.match(workspace, /data-testid="verval-accept"/);
  assert.match(packageWorkspace, /SERVER_STAGE3B ? <ServerVervalWorkspace/);
});
