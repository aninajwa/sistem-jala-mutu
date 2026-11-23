import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createSurveySegmentAndConfirm,
  createSurveySessionAndConfirm,
  eligibleApprovedTrials,
  getPackageSurveyProgress,
  getSurveySegments,
  getSurveySessions,
  packageSurveyProgressLabel,
  sessionSummary,
  type ProtectedRequest,
} from './serverStage3Data';

function responder(response: unknown, calls: Array<{ path: string; init?: RequestInit }>): ProtectedRequest {
  return (async <T>(path: string, init?: RequestInit) => {
    calls.push({ path, init });
    return response as T;
  }) as ProtectedRequest;
}

test('session GET and segment GET are scoped to the requested package/session', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const sessions = [{ sesi_id: 91, paket_id: 9, tanggal: '2026-05-20', ruas_id: 4, tim_id: 7 }];
  assert.deepEqual(await getSurveySessions('9', responder({ data: sessions }, calls)), sessions);
  assert.equal(calls[0].path, '/paket/9/sesi-survei');
  assert.equal(calls[0].init?.method, undefined);
  assert.equal(sessionSummary(sessions[0]), '2026-05-20 · Ruas #4 · Tim #7');
  assert.deepEqual(await getSurveySegments('9', 91, responder({ data: [] }, calls)), []);
  assert.equal(calls[1].path, '/paket/9/sesi-survei/91/data-segmen');
});

test('package survey progress counts sessions and segments across every session without fixed IDs', async () => {
  const calls: string[] = [];
  const request = (async <T>(path: string) => {
    calls.push(path);
    if (path.endsWith('/sesi-survei')) {
      return { data: [{ sesi_id: 8, paket_id: 42 }, { sesi_id: 13, paket_id: 42 }] } as T;
    }
    if (path.endsWith('/8/data-segmen')) return { data: [{ data_id: 101 }, { data_id: 102 }] } as T;
    if (path.endsWith('/13/data-segmen')) return { data: [{ data_id: 103 }] } as T;
    throw new Error(`Unexpected path: ${path}`);
  }) as ProtectedRequest;
  assert.deepEqual(await getPackageSurveyProgress('42', request), { sessionCount: 2, segmentCount: 3 });
  assert.deepEqual(calls.sort(), [
    '/paket/42/sesi-survei',
    '/paket/42/sesi-survei/8/data-segmen',
    '/paket/42/sesi-survei/13/data-segmen',
  ].sort());

  const empty = await getPackageSurveyProgress('42', (async <T>() => ({ data: [] }) as T) as ProtectedRequest);
  assert.deepEqual(empty, { sessionCount: 0, segmentCount: 0 });
});

test('package survey progress rejects failed reads and mismatched package sessions', async () => {
  await assert.rejects(
    getPackageSurveyProgress('42', (async <T>() => { throw new Error('read failed'); }) as ProtectedRequest),
    /read failed/,
  );
  await assert.rejects(
    getPackageSurveyProgress('42', (async <T>() => ({ data: [{ sesi_id: 8, paket_id: 99 }] }) as T) as ProtectedRequest),
    /tidak sepadan/,
  );
});

test('package survey progress label distinguishes loaded, empty, loading, and failed reads', () => {
  assert.equal(packageSurveyProgressLabel({ sessionCount: 1, segmentCount: 1 }, false, false), 'Sedang berjalan · 1 sesi · 1 segmen');
  assert.equal(packageSurveyProgressLabel({ sessionCount: 0, segmentCount: 0 }, false, false), 'Belum ada sesi');
  assert.equal(packageSurveyProgressLabel(null, true, false), 'Progres sedang dimuat');
  const failed = packageSurveyProgressLabel(null, false, true);
  assert.equal(failed, 'Progres belum dapat dimuat');
  assert.doesNotMatch(failed, /\b0\b/);
});
test('session prerequisites include only approved trials with matching team/type, road, and date-valid assigned tool', () => {
  const base = { uji_coba_id: 1, paket_id: 9, tim_id: 7, jenis_survei_id: 3, alat_id: 8, ruas_id: 4, tanggal: '2026-05-20' };
  const trials = [
    { ...base, status: 'DISETUJUI' },
    { ...base, uji_coba_id: 2, status: 'DRAFT' },
    { ...base, uji_coba_id: 3, ruas_id: 99, status: 'DISETUJUI' },
    { ...base, uji_coba_id: 4, tim_id: 77, status: 'DISETUJUI' },
  ];
  const assignments = [{ alat_id: 8, mulai: '2026-01-01', selesai: '2026-12-31', alat_survei: { jenis_survei_id: 3 } }];
  assert.deepEqual(eligibleApprovedTrials(trials, assignments, [{ ruas_id: 4 }], 7, 3, '2026-05-20').map(row => row.uji_coba_id), [1]);
  assert.deepEqual(eligibleApprovedTrials(trials, [{ alat_id: 8, mulai: '2026-06-01' }], [{ ruas_id: 4 }], 7, 3, '2026-05-20'), []);
});

test('session POST waits for explicit call and confirms both detail and list before returning', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const row = { sesi_id: 91, paket_id: 9, tim_id: 7, ruas_id: 4, alat_id: 8, tanggal: '2026-05-20' };
  let writes = 0;
  const request = (async <T>(path: string, init?: RequestInit) => {
    calls.push({ path, init });
    if (init?.method === 'POST') { writes += 1; return { data: row } as T; }
    if (path.endsWith('/91')) return { data: row } as T;
    return { data: [row] } as T;
  }) as ProtectedRequest;
  assert.equal(writes, 0);
  const result = await createSurveySessionAndConfirm('9', { tim_id: 7, ruas_id: 4, alat_id: 8, tanggal: '2026-05-20' }, request);
  assert.equal(writes, 1);
  assert.equal(calls[0].path, '/paket/9/sesi-survei');
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { tim_id: 7, ruas_id: 4, alat_id: 8, tanggal: '2026-05-20' });
  assert.deepEqual(calls.slice(1).map(call => call.path).sort(), ['/paket/9/sesi-survei', '/paket/9/sesi-survei/91'].sort());
  assert.equal(result.session.sesi_id, 91);
  assert.equal(result.sessions.length, 1);
});

test('segment POST returns only after detail and list GET confirm the same server ID', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const row = { data_id: 501, sesi_id: 91, jenis_survei_id: 7, sta_awal: 1, sta_akhir: 2 };
  const request = (async <T>(path: string, init?: RequestInit) => {
    calls.push({ path, init });
    if (init?.method === 'POST') return { data: row } as T;
    if (path.endsWith('/501')) return { data: row } as T;
    return { data: [row] } as T;
  }) as ProtectedRequest;
  const result = await createSurveySegmentAndConfirm('9', 91, { jenis_survei_id: 7, sta_awal: 1, sta_akhir: 2 }, request);
  assert.equal(calls[0].path, '/paket/9/sesi-survei/91/data-segmen');
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { jenis_survei_id: 7, sta_awal: 1, sta_akhir: 2 });
  assert.deepEqual(calls.slice(1).map(call => call.path).sort(), [
    '/paket/9/sesi-survei/91/data-segmen', '/paket/9/sesi-survei/91/data-segmen/501',
  ].sort());
  assert.equal(result.segment.data_id, 501);
  assert.equal(result.segments.length, 1);
});

test('API failure or missing readback rejects without returning a created row', async () => {
  let postCalls = 0;
  const failure = (async <T>(_path: string, init?: RequestInit) => {
    if (init?.method === 'POST') postCalls += 1;
    if (init?.method === 'POST') throw new Error('server validation failed');
    return { data: [] } as T;
  }) as ProtectedRequest;
  await assert.rejects(createSurveySessionAndConfirm('9', { tim_id: 7, ruas_id: 4, alat_id: 8, tanggal: '2026-05-20' }, failure), /server validation failed/);
  assert.equal(postCalls, 1);

  const readbackMissing = (async <T>(path: string, init?: RequestInit) => {
    if (init?.method === 'POST') return { data: { sesi_id: 92 } } as T;
    if (path.endsWith('/92')) return { data: { sesi_id: 92 } } as T;
    return { data: [] } as T;
  }) as ProtectedRequest;
  await assert.rejects(createSurveySessionAndConfirm('9', { tim_id: 7, ruas_id: 4, alat_id: 8, tanggal: '2026-05-20' }, readbackMissing), /Muat semula sebelum cuba menyimpan lagi/);

  const segmentReadbackMissing = (async <T>(path: string, init?: RequestInit) => {
    if (init?.method === 'POST') return { data: { data_id: 502 } } as T;
    if (path.endsWith('/502')) return { data: { data_id: 502, sesi_id: 91 } } as T;
    return { data: [] } as T;
  }) as ProtectedRequest;
  await assert.rejects(createSurveySegmentAndConfirm('9', 91, { jenis_survei_id: 7, nilai_utama: 4 }, segmentReadbackMissing), /Muat semula sebelum cuba menyimpan lagi/);
});

test('authenticated input uses submit-only POST, provider role gate and no local persistence/demo fallback', async () => {
  const source = await readFile(new URL('./ServerStage3DailyWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(source, /role === 'Penyedia Jasa \/ Ketua Tim'/);
  assert.match(source, /<form className="server-stage3-entry" onSubmit=\{event => void submitSession\(event\)\}/);
  assert.match(source, /<form className="server-stage3-entry" onSubmit=\{event => void submitSegment\(event\)\}/);
  assert.match(source, /await createSurveySessionAndConfirm\(packageId, payload, apiRequest\)/);
  assert.match(source, /await createSurveySegmentAndConfirm\(packageId, selectedSession\.sesi_id, payload, apiRequest\)/);
  assert.match(source, /jalamutu:package-stage-facts-refresh/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|usePersistedDraft|dailyEquipmentCheckMock/);
  const parent = await readFile(new URL('./ServerPackageWorkspace.tsx', import.meta.url), 'utf8');
  assert.match(parent, /<ServerStage3DailyWorkspace packageId=\{packageId\} role=\{role\} onNavigate=\{onNavigate\} \/>/);
  assert.doesNotMatch(parent, /Stage3DailyWorkspacePrototypePanel/);
  assert.match(parent, /getPackageSurveyProgress\(packageId, apiRequest, controller\.signal\)/);
  assert.match(parent, /packageSurveyProgressLabel\(stage3aProgress, stage3aProgressLoading, stage3aProgressError\)/);
  assert.match(parent, /packageSurveyProgressLabel/);
  const navigator = await readFile(new URL('../workflow/Checkpoint09Package.tsx', import.meta.url), 'utf8');
  assert.match(navigator, /ui09-stage-progress/);
});
