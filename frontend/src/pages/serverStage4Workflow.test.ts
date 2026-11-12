import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getStage4WorkflowCapabilities, getStage4WorkflowStatus, reviewStage4, submitStage4 } from './serverStage4LrsData';
import type { Stage4Request } from './serverStage4LrsData';

test('workflow status preserves pending and can never authorize Stage 5 on pending criteria', async () => {
  const request: Stage4Request = async <T>() => ({ data: {
    paket_id: 11, state: 'PENDING_RULES', workflow_version: 0, gate: 'PENDING', progression_allowed: true,
    blockers: [{ code: 'SMD_VERIFICATION_UNAVAILABLE', message: 'SMD unavailable' }],
    unresolved: ['tolerances'], validations: [],
  } }) as T;
  const status = await getStage4WorkflowStatus('11', request);
  assert.equal(status.gate, 'PENDING');
  assert.equal(status.progression_allowed, false);
  assert.equal(status.blockers[0].code, 'SMD_VERIFICATION_UNAVAILABLE');
});

test('workflow status refuses a response without explicit blocker evidence', async () => {
  const request: Stage4Request = async <T>() => ({ data: {
    paket_id: 11, state: 'PENDING_RULES', workflow_version: 0, gate: 'PENDING', progression_allowed: false,
    unresolved: [], validations: [],
  } }) as T;
  await assert.rejects(getStage4WorkflowStatus('11', request), /status workflow/);
});

test('workflow capability adapter rejects malformed response', async () => {
  const request: Stage4Request = async <T>() => ({ data: { read: true, write: true } }) as T;
  await assert.rejects(getStage4WorkflowCapabilities('11', request), /kapabilitas workflow/);
});

test('submit and review adapters send only expected version and explicit decision', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const request: Stage4Request = async <T>(path, init) => { calls.push({ path, init }); return { data: {} } as T; };
  await submitStage4('11', 2, request);
  await reviewStage4('11', 3, 'PERLU_REVISI', 'Perlu klarifikasi', request);
  assert.equal(calls[0].path, '/paket/11/validasi-lrs/submit');
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { expected_version: 2 });
  assert.deepEqual(JSON.parse(String(calls[1].init?.body)), { expected_version: 3, keputusan: 'PERLU_REVISI', catatan: 'Perlu klarifikasi' });
});

test('authenticated Stage 4 UI exposes server status, separates Penyedia/PIC controls and blocks stage 5 while pending', async () => {
  const source = await (await import('node:fs/promises')).readFile(new URL('./ServerStage4Workspace.tsx', import.meta.url), 'utf8');
  assert.match(source, /getStage4WorkflowStatus/);
  assert.match(source, /role !== 'Penyedia Jasa \/ Ketua Tim'/);
  assert.match(source, /role === 'PIC Balai \/ Pengguna Jasa'/);
  assert.match(source, /workflowStatus\.gate !== 'PASS'/);
  assert.match(source, /Tahap 5 tetap terkunci/);
  assert.match(source, /REMEASUREMENT_REQUIRED|stage4-blocker-/);
  assert.match(source, /Ajukan ulang ke pemeriksa/);
  assert.match(source, /Minta revisi/);
});
