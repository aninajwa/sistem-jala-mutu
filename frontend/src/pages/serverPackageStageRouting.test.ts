import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { serverPackageStage, SERVER_STAGE3A, SERVER_STAGE3B } from './serverPackageStageRouting';

test('authenticated package stage routing selects prototype Tahap 3A, preserving implemented earlier stages', () => {
  assert.equal(serverPackageStage(SERVER_STAGE3A), 'stage3a-prototype');
  assert.equal(serverPackageStage(SERVER_STAGE3B), 'stage3b-readonly');
  assert.equal(serverPackageStage('/entry:Persiapan & SPMK'), 'implemented');
  assert.equal(serverPackageStage('/documents:Kalibrasi & personel'), 'implemented');
  assert.equal(serverPackageStage('/entry:Validasi produksi'), 'implemented');
  assert.equal(serverPackageStage('/verification:Audit tingkat 1–3'), 'placeholder');
});

test('server package workspace renders the shared Stage 3A prototype panel for the selected route', async () => {
  const source = await readFile(new URL('./ServerPackageWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(source, /selection === SERVER_STAGE3A \? <section[^>]*data-testid="server-stage3a-workspace"/);
  assert.match(source, /<ServerStage3DailyWorkspace packageId=\{packageId\} \/>/);
  assert.match(source, /<Stage3DailyWorkspacePrototypePanel \/>/);
});

test('server package workspace renders the read-only Verval workspace on the actual Tahap 3B menu route', async () => {
  const source = await readFile(new URL('./ServerPackageWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(source, /selection === SERVER_STAGE3B \? <ServerVervalWorkspace packageId=\{packageId\} \/>/);
  assert.equal(serverPackageStage(SERVER_STAGE3B), 'stage3b-readonly');
});
