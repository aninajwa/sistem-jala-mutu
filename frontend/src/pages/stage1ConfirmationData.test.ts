import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../auth/client';
import {
  getStage1Confirmation,
  reviewStage1Confirmation,
  stage1ConfirmationBlockers,
  Stage1ConfirmationOutcomeUncertainError,
  submitStage1Confirmation,
  type Stage1ConfirmationRequest,
} from './stage1ConfirmationData';

const snapshot = {
  paket_id: 5,
  declared_scope_version: 1,
  blockers: [],
  applicable_surveys: [{ jenis_survei: { kode: 'IRI' }, locations: [], teams: [{ tim_id: 10 }] }],
  calibration_records: [{ kalibrasi_id: 20, versi: 2 }],
};

function mockFlow() {
  const calls: Array<{ path: string; method: string; body?: Record<string, unknown> }> = [];
  let state = {
    aktif: true, paket_id: 5, status: 'BELUM_DIAJUKAN', versi: 0, snapshot_saat_ini: snapshot,
    pengajuan: null as null | { versi: number; snapshot: unknown },
    review: null as null | { keputusan: string; catatan: string | null },
    snapshot_sesuai: false, stage2_allowed: false,
  };
  let changeSnapshotOnRead = false;
  const request: Stage1ConfirmationRequest = async <T>(path: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined;
    calls.push({ path, method, body });
    if (method === 'GET') {
      if (changeSnapshotOnRead) state = { ...state, snapshot_saat_ini: { ...snapshot, calibration_records: [{ kalibrasi_id: 20, versi: 3 }] }, snapshot_sesuai: false, stage2_allowed: false };
      return { data: structuredClone(state) } as T;
    }
    if (path.endsWith('/pengajuan')) {
      if (body?.expected_version !== state.versi) throw new Error('409 stale version');
      state = { ...state, status: 'DIAJUKAN', versi: state.versi + 1, pengajuan: { versi: state.versi + 1, snapshot: structuredClone(state.snapshot_saat_ini) }, review: null, snapshot_sesuai: true, stage2_allowed: false };
      return { data: structuredClone(state) } as T;
    }
    if (path.endsWith('/review')) {
      if (body?.expected_version !== state.versi) throw new Error('409 stale version');
      if (!state.snapshot_sesuai) throw new ApiError(409, 'submitted snapshot no longer matches current records');
      const decision = String(body.keputusan);
      state = { ...state, status: decision, versi: state.versi + 1, review: { keputusan: decision, catatan: String(body.catatan) || null }, stage2_allowed: decision === 'DISETUJUI' && state.snapshot_sesuai };
      return { data: structuredClone(state) } as T;
    }
    throw new Error(`Unexpected ${method} ${path}`);
  };
  return {
    request, calls, get state() { return state; },
    mutateSnapshot() {
      state = { ...state, snapshot_saat_ini: { ...snapshot, calibration_records: [{ kalibrasi_id: 20, versi: 3 }] }, snapshot_sesuai: false, stage2_allowed: false };
      changeSnapshotOnRead = true;
    },
  };
}

test('Provider submit captures one package-wide snapshot and confirms the persisted readback', async () => {
  const api = mockFlow();
  const result = await submitStage1Confirmation('5', 0, api.request);
  assert.equal(result.status, 'DIAJUKAN');
  assert.deepEqual(result.pengajuan?.snapshot, snapshot);
  assert.deepEqual(api.calls.map(call => call.method), ['POST', 'GET']);
  assert.equal(api.calls[0].body?.expected_version, 0);
});

test('successful mutation with the installed RPC shape recovers through authoritative GET', async () => {
  const api = mockFlow();
  const request: Stage1ConfirmationRequest = async <T>(path: string, init?: RequestInit) => {
    const result = await api.request<T>(path, init);
    if (path.endsWith('/pengajuan') && (init?.method ?? 'GET') === 'POST') {
      const envelope = result as { data: Record<string, unknown> };
      const { aktif: _routeOnlyField, ...rpcShape } = envelope.data;
      return { data: rpcShape } as T;
    }
    return result;
  };
  const result = await submitStage1Confirmation('5', 0, request);
  assert.equal(result.status, 'DIAJUKAN');
  assert.equal(result.versi, 1);
  assert.equal(result.stage2_allowed, false);
  assert.deepEqual(api.calls.map(call => call.method), ['POST', 'GET']);
});

test('unreadable successful submission outcome requires refresh and never retries POST', async () => {
  const api = mockFlow();
  const request: Stage1ConfirmationRequest = async <T>(path: string, init?: RequestInit) => {
    if ((init?.method ?? 'GET') === 'GET') throw new Error('read unavailable');
    return api.request<T>(path, init);
  };
  await assert.rejects(submitStage1Confirmation('5', 0, request), Stage1ConfirmationOutcomeUncertainError);
  assert.equal(api.calls.filter(call => call.method === 'POST').length, 1);
});

test('audit trail bigint IDs remain exact decimal strings', async () => {
  const api = mockFlow();
  await submitStage1Confirmation('5', 0, api.request);
  const exactId = '900719925474099312345';
  const state = { ...api.state, pengajuan: { ...api.state.pengajuan!, audit_id: exactId } };
  const result = await getStage1Confirmation('5', async <T>() => ({ data: state }) as T);
  assert.equal(result.pengajuan?.audit_id, exactId);
  await assert.rejects(
    getStage1Confirmation('5', async <T>() => ({ data: { ...state, pengajuan: { ...state.pengajuan!, audit_id: Number(exactId) } } }) as T),
    /ID audit konfirmasi kalibrasi tidak valid/,
  );
});

test('PIC correction then Provider resubmission advances versions and does not open Stage 2', async () => {
  const api = mockFlow();
  await submitStage1Confirmation('5', 0, api.request);
  const returned = await reviewStage1Confirmation('5', { expected_version: 1, keputusan: 'PERLU_REVISI', catatan: 'Mohon perbarui rekod kalibrasi yang ditunjuk.' }, api.request);
  assert.equal(returned.review?.catatan, 'Mohon perbarui rekod kalibrasi yang ditunjuk.');
  const resubmitted = await submitStage1Confirmation('5', 2, api.request);
  assert.equal(resubmitted.versi, 3);
  assert.equal(resubmitted.status, 'DIAJUKAN');
  assert.equal(resubmitted.stage2_allowed, false);
});

test('PIC confirmation cannot claim success if the current package snapshot changed after submit', async () => {
  const api = mockFlow();
  await submitStage1Confirmation('5', 0, api.request);
  api.mutateSnapshot();
  await assert.rejects(
    reviewStage1Confirmation('5', { expected_version: 1, keputusan: 'DISETUJUI', catatan: '' }, api.request),
    /snapshot no longer matches current records/,
  );
});

test('PIC decision recovers committed mutation from authoritative GET after transport failure', async () => {
  const api = mockFlow();
  await submitStage1Confirmation('5', 0, api.request);
  const request: Stage1ConfirmationRequest = async <T>(path: string, init?: RequestInit) => {
    const result = await api.request<T>(path, init);
    if (path.endsWith('/review') && init?.method === 'POST') {
      throw new Error('response connection lost after commit');
    }
    return result;
  };
  const result = await reviewStage1Confirmation('5', {
    expected_version: 1, keputusan: 'PERLU_REVISI', catatan: 'Semak rekod yang ditunjuk.',
  }, request);
  assert.equal(result.status, 'PERLU_REVISI');
  assert.equal(result.versi, 2);
  assert.deepEqual(api.calls.filter(call => call.path.endsWith('/review')).map(call => call.method), ['POST']);
  assert.equal(api.calls.at(-1)?.method, 'GET');
});

test('malformed PIC mutation response is recovered only when GET confirms the persisted decision', async () => {
  const api = mockFlow();
  await submitStage1Confirmation('5', 0, api.request);
  const request: Stage1ConfirmationRequest = async <T>(path: string, init?: RequestInit) => {
    const result = await api.request<T>(path, init);
    if (path.endsWith('/review') && init?.method === 'POST') return { data: { paket_id: 5 } } as T;
    return result;
  };
  const result = await reviewStage1Confirmation('5', {
    expected_version: 1, keputusan: 'DISETUJUI', catatan: '',
  }, request);
  assert.equal(result.status, 'DISETUJUI');
  assert.equal(result.versi, 2);
  assert.equal(result.stage2_allowed, true);
  assert.equal(api.calls.at(-1)?.method, 'GET');
});

test('ambiguous committed PIC decision with unavailable GET is uncertain and never retried', async () => {
  const api = mockFlow();
  await submitStage1Confirmation('5', 0, api.request);
  let readFails = true;
  const request: Stage1ConfirmationRequest = async <T>(path: string, init?: RequestInit) => {
    const result = await api.request<T>(path, init);
    if (path.endsWith('/review') && init?.method === 'POST') throw new Error('response connection lost');
    if (readFails && (init?.method ?? 'GET') === 'GET') throw new Error('readback unavailable');
    return result;
  };
  await assert.rejects(
    reviewStage1Confirmation('5', { expected_version: 1, keputusan: 'DISETUJUI', catatan: '' }, request),
    Stage1ConfirmationOutcomeUncertainError,
  );
  const reviewPosts = api.calls.filter(call => call.path.endsWith('/review') && call.method === 'POST');
  assert.equal(reviewPosts.length, 1);
});

test('ambiguous uncommitted PIC decision requires readback and does not retry', async () => {
  const api = mockFlow();
  await submitStage1Confirmation('5', 0, api.request);
  let reviewPosts = 0;
  const request: Stage1ConfirmationRequest = async <T>(path: string, init?: RequestInit) => {
    if (path.endsWith('/review') && init?.method === 'POST') {
      reviewPosts++;
      throw new Error('connection lost before outcome was known');
    }
    return api.request<T>(path, init);
  };
  await assert.rejects(
    reviewStage1Confirmation('5', { expected_version: 1, keputusan: 'DISETUJUI', catatan: '' }, request),
    Stage1ConfirmationOutcomeUncertainError,
  );
  assert.equal(reviewPosts, 1);
  assert.equal(api.state.status, 'DIAJUKAN');
});

test('authoritative PIC confirmation permits Stage 2 only for matching snapshot and correct package', async () => {
  const api = mockFlow();
  await submitStage1Confirmation('5', 0, api.request);
  const confirmed = await reviewStage1Confirmation('5', { expected_version: 1, keputusan: 'DISETUJUI', catatan: '' }, api.request);
  assert.equal(confirmed.stage2_allowed, true);
  await assert.rejects(getStage1Confirmation('6', async <T>() => ({ data: { ...api.state, paket_id: 5 } }) as T), /tidak lengkap atau tidak sesuai paket/);
});

test('confirmation blockers fail closed for unset scope and keep unavailable readiness distinct from a pass', () => {
  const state = {
    aktif: true, paket_id: 5, status: 'BELUM_DIAJUKAN', versi: 0,
    snapshot_saat_ini: { paket_id: 5, blockers: ['DECLARED_SCOPE_UNSET'], applicable_surveys: [] },
    pengajuan: null, review: null, snapshot_sesuai: false, stage2_allowed: false,
  } as const;
  assert.deepEqual(stage1ConfirmationBlockers(state), ['DECLARED_SCOPE_UNSET']);
  assert.deepEqual(stage1ConfirmationBlockers({
    ...state,
    aktif: false,
    alasan: 'Kontrak konfirmasi belum aktif.',
  }), ['Kontrak konfirmasi belum aktif.']);
  assert.deepEqual(stage1ConfirmationBlockers({
    ...state,
    snapshot_saat_ini: { paket_id: 5, applicable_surveys: [] },
  }), ['DECLARED_SCOPE_UNSET']);
});
