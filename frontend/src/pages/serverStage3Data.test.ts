import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSurveySegments, getSurveySessions, sessionSummary, type ProtectedGet } from './serverStage3Data';

function responder(response: unknown, calls: Array<{ path: string; init?: RequestInit }>): ProtectedGet {
  return (async <T>(path: string, init?: RequestInit) => {
    calls.push({ path, init });
    return response as T;
  }) as ProtectedGet;
}

test('session list GET returns sessions for the requested package and preserves returned fields', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const rows = [{ sesi_id: 91, paket_id: 9, tanggal: '2026-05-20', ruas_id: 4, tim_id: 7 }];
  assert.deepEqual(await getSurveySessions('9', responder({ data: rows }, calls)), rows);
  assert.equal(calls[0].path, '/paket/9/sesi-survei');
  assert.equal(calls[0].init?.method, undefined); // apiRequest defaults to GET; never a CREATE request.
  assert.equal(sessionSummary(rows[0]), '2026-05-20 · Ruas #4 · Tim #7');
});

test('selecting a session requests only its segment list and supports an empty list', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  assert.deepEqual(await getSurveySegments('9', 91, responder({ data: [] }, calls)), []);
  assert.equal(calls[0].path, '/paket/9/sesi-survei/91/data-segmen');
  assert.equal(calls[0].init?.method, undefined);
});

test('session and segment API failures and malformed responses are surfaced to the view', async () => {
  const failure = async <T>() => { throw new Error('Backend tidak dapat dihubungi'); };
  await assert.rejects(getSurveySessions('9', failure), /Backend tidak dapat dihubungi/);
  await assert.rejects(getSurveySegments('9', 91, failure), /Backend tidak dapat dihubungi/);
  await assert.rejects(getSurveySessions('9', responder({ data: null }, [])), /senarai dijangka/);
});
