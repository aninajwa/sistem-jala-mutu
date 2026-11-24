/**
 * Write test of the Koreksi lifecycle against the real API + Jala-Mutu (test data).
 * Creates one correction case on JM_PACKAGE (default 3) and drives it to Ditutup:
 *   Penyedia: buat -> verifikasi surveyor/team_leader -> ajukan
 *   PIC:      verifikasi balai -> setujui
 *   Penyedia: laksana
 *   PIC:      uji ulang Lulus -> tutup  (blocked_stage is PIC-owned)
 * Also checks guards: wrong role, stale version, bad order.
 *
 * Requires JM_ALLOW_WRITES=1, backend :5000 with CORRECTION_PRODUCTION_RPCS=true, and
 * credentials only from env (JM_PROVIDER_EMAIL/PASSWORD, JM_PIC_EMAIL/PASSWORD).
 * Supabase URL/publishable key are read from frontend/.env at runtime and never printed.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

if (process.env.JM_ALLOW_WRITES !== '1') {
  console.error('Refusing to run: this script writes test data. Set JM_ALLOW_WRITES=1.');
  process.exit(2);
}
const api = process.env.JM_API_URL ?? 'http://127.0.0.1:5000/api';
const packageId = Number(process.env.JM_PACKAGE ?? '3');
const env = Object.fromEntries(readFileSync(new URL('../.env', import.meta.url), 'utf8')
  .split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1).trim()]));

async function login(email?: string, password?: string) {
  assert.ok(email && password, 'Set JM_PROVIDER_* and JM_PIC_* credentials in the environment.');
  const response = await fetch(`${env.VITE_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200, `login failed for ${email}`);
  return ((await response.json()) as { access_token: string }).access_token;
}

type Case = { kasus: Record<string, unknown>; detail: Record<string, unknown>; version: number; correctionId: number };
async function call(token: string, method: string, path: string, body?: unknown) {
  const response = await fetch(`${api}${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json().catch(() => null) as { data?: unknown; error?: string } | null };
}
function parse(data: unknown): Case {
  const item = data as { kasus_temuan: Record<string, unknown>; koreksi_data: Array<{ koreksi_data: { koreksi_id: number; versi: number } }> };
  const correction = item.koreksi_data[0].koreksi_data;
  return { kasus: item.kasus_temuan, detail: item.kasus_temuan.detail as Record<string, unknown>, version: correction.versi, correctionId: correction.koreksi_id };
}
async function step(label: string, token: string, method: string, path: string, body: unknown, expected = 200) {
  const result = await call(token, method, path, body);
  assert.equal(result.status, expected, `${label}: HTTP ${result.status} ${result.body?.error ?? ''}`);
  console.log(`✔ ${label}`);
  return result;
}

const provider = await login(process.env.JM_PROVIDER_EMAIL, process.env.JM_PROVIDER_PASSWORD);
const pic = await login(process.env.JM_PIC_EMAIL, process.env.JM_PIC_PASSWORD);
const base = `/paket/${packageId}/koreksi`;

const caps = await call(provider, 'GET', `/paket/${packageId}/koreksi-capabilities`);
assert.deepEqual(caps.body?.data, { read: true, write: true, reason: null }, 'correction gate must be on');

await step('PIC cannot open a case', pic, 'POST', base, { source: 'x' }, 403);
const created = await step('Penyedia opens a case', provider, 'POST', base, {
  source: 'Validasi sistem', blocked_stage: 'Validasi produksi', road: 'Ruas uji koreksi', stationing: '0+000 - 0+500',
  rejection_reason: `UJI-KOREKSI ${new Date().toISOString()}`, severity: 'Minor', owner: 'Penyedia Jasa',
  due_date: '2026-12-31', survey_type: 'IRI',
}, 201);
let c = parse(created.body!.data);
assert.equal(c.kasus.status, 'Terbuka');
const path = `${base}/${c.correctionId}`;

// Needs migration 20261124010000 (PT409); with 40001 PostgREST retries until timeout. JM_CHECK_STALE=0 skips it.
if (process.env.JM_CHECK_STALE !== '0') {
  await step('stale version is rejected', provider, 'PATCH', path, { expected_version: c.version + 5, evidence: 'x' }, 409);
}
c = parse((await step('Penyedia fills the proposal', provider, 'PATCH', path, {
  expected_version: c.version, root_cause: 'Alat', field_data_valid: 'Tidak', action_type: 'Kalibrasi ulang alat',
  evidence: 'Laporan kalibrasi ulang alat IRI (uji)',
})).body!.data);
await step('Team Leader before Surveyor is rejected', provider, 'POST', `${path}/verifikasi`, { expected_version: c.version, tahap: 'team_leader', nilai: true }, 409);
c = parse((await step('Surveyor verifies', provider, 'POST', `${path}/verifikasi`, { expected_version: c.version, tahap: 'surveyor', nilai: true })).body!.data);
c = parse((await step('Team Leader verifies', provider, 'POST', `${path}/verifikasi`, { expected_version: c.version, tahap: 'team_leader', nilai: true })).body!.data);
c = parse((await step('Penyedia submits', provider, 'POST', `${path}/ajukan`, { expected_version: c.version }, 201)).body!.data);
assert.equal(c.kasus.status, 'Menunggu Persetujuan');

await step('approval without Balai verification is rejected', pic, 'POST', `${path}/review`, { expected_version: c.version, keputusan: 'Disetujui', catatan: '' }, 409);
c = parse((await step('PIC verifies (Balai)', pic, 'POST', `${path}/verifikasi`, { expected_version: c.version, tahap: 'balai', nilai: true })).body!.data);
c = parse((await step('PIC approves', pic, 'POST', `${path}/review`, { expected_version: c.version, keputusan: 'Disetujui', catatan: 'Disetujui (uji)' })).body!.data);
assert.equal(c.kasus.status, 'Disetujui');

c = parse((await step('Penyedia executes', provider, 'POST', `${path}/laksana`, { expected_version: c.version, execution_reference: 'BA pelaksanaan kalibrasi ulang (uji)' })).body!.data);
assert.equal(c.kasus.status, 'Dilaksanakan');
await step('Penyedia cannot retest a PIC-owned stage', provider, 'POST', `${path}/uji-ulang`, { expected_version: c.version, hasil: 'Lulus', retest_reference: 'x' }, 403);
c = parse((await step('PIC records retest Lulus', pic, 'POST', `${path}/uji-ulang`, { expected_version: c.version, hasil: 'Lulus', retest_reference: 'Hasil uji ulang IRI (uji)' })).body!.data);
assert.equal(c.kasus.status, 'Verifikasi Ulang');
c = parse((await step('PIC closes the case', pic, 'POST', `${path}/tutup`, { expected_version: c.version })).body!.data);
assert.equal(c.kasus.status, 'Ditutup');

const listed = await step('closed case is listed', provider, 'GET', base, undefined);
assert.ok(JSON.stringify(listed.body?.data).includes(`"koreksi_id":${c.correctionId}`));
console.log(`correction lifecycle passed (koreksi_id ${c.correctionId})`);
