import test from 'node:test';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import {
  createStage2Measurement, createStage2Section, createStage2Trial, eligibleStage2Equipment, reviewStage2Trial,
  getStage2PackageCompletion, getStage2Workspace, parseStage2PackageCompletion, saveStage2Evaluation,
  submitStage2Trial, type Stage2Request, type Stage2Trial,
} from './serverStage2Data';

function harness() {
  const calls: Array<{ path: string; method: string; body?: Record<string, unknown> }> = [];
  const trials: Stage2Trial[] = [];
  let detail: { uji_coba: Stage2Trial; seksi: Array<{ seksi_id: number; pengukuran: unknown[] }> } | null = null;
  let submission: Record<string, any> = { status: 'DRAFT', versi: 1, pengajuan: null, review: null };
  let evaluation: { hasil: Array<{ kode: string; nilai: number }> } = { hasil: [] };
  let staleReadback = false;
  const request: Stage2Request = async <T>(path: string, init: RequestInit = {}) => {
    const method = init.method ?? 'GET';
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ path, method, body });
    if (method === 'POST' && path.endsWith('/uji-coba')) {
      const created = { uji_coba_id: 77, paket_id: 5, ...body, status: 'DRAFT', versi: 1 } as Stage2Trial;
      trials.push(created); detail = { uji_coba: created, seksi: [] }; return { data: created } as T;
    }
    if (method === 'POST' && path.endsWith('/evaluasi')) {
      evaluation = { hasil: body.hasil }; return { data: evaluation } as T;
    }
    if (method === 'POST' && path.endsWith('/seksi')) {
      const section = { seksi_id: 88, uji_coba_id: 77, ...body, pengukuran: [] };
      if (detail) detail.seksi.push(section); return { data: section } as T;
    }
    if (method === 'POST' && path.endsWith('/pengukuran')) {
      const section = detail?.seksi.find(item => path.includes(`/seksi/${item.seksi_id}/`));
      const measurement = { pengukuran_id: 99, seksi_id: 88, ...body };
      section?.pengukuran.push(measurement); return { data: measurement } as T;
    }
    if (method === 'POST' && path.endsWith('/pengajuan/review')) {
      if (staleReadback) return { data: { status: body.keputusan } } as T;
      const trial = trials[0]; trial.status = body.keputusan; trial.versi += 1;
      submission = { status: body.keputusan, versi: trial.versi, pengajuan: { diajukan_oleh: 3, diajukan_pada: '2026-11-09', snapshot: {} }, review: { keputusan: body.keputusan, pengguna_id: 9, catatan: body.catatan, waktu: '2026-11-09' } };
      return { data: submission } as T;
    }
    if (method === 'POST' && path.endsWith('/pengajuan')) {
      const trial = trials[0]; trial.status = 'DIAJUKAN'; trial.versi += 1;
      submission = { status: 'DIAJUKAN', versi: trial.versi, pengajuan: { diajukan_oleh: 3, diajukan_pada: '2026-11-09', snapshot: {} }, review: null };
      return { data: submission } as T;
    }
    if (path.endsWith('/uji-coba')) return { data: trials } as T;
    if (path.endsWith('/pengajuan')) return { data: submission } as T;
    if (path.endsWith('/evaluasi')) return { data: evaluation } as T;
    if (path.match(/\/uji-coba\/\d+$/)) return { data: detail } as T;
    throw new Error(`Unexpected request: ${method} ${path}`);
  };
  return { calls, trials, request, setStaleReadback() { staleReadback = true; } };
}

test('equipment choices respect team survey type and assignment dates', () => {
  const team = { tim_id: 4, jenis_survei_id: 2, nama_tim: 'T', jenis_survei: { kode: 'IRI', nama: 'IRI' } };
  const choices = eligibleStage2Equipment(team, [
    { alat_id: 1, alat_survei: { jenis_survei_id: 2 }, mulai: '2026-01-01', selesai: '2026-12-31' },
    { alat_id: 2, alat_survei: { jenis_survei_id: 3 } },
    { alat_id: 3, alat_survei: { jenis_survei_id: 2 }, selesai: '2026-11-08' },
  ], '2026-11-09');
  assert.deepEqual(choices.map(item => item.alat_id), [1]);
});

test('package completion response is consumed from the backend route and validated against the package', async () => {
  const completion = {
    paket_id: 7421, state: 'partial', approved_count: 1, total_count: 2,
    pending_surveys: [{ jenis_survei_id: 44, kode: 'PCI', nama: 'PCI' }],
    reason: null, label: '1/2 jenis survei disetujui · Menunggu PCI',
  };
  const calls: string[] = [];
  const request: Stage2Request = async <T>(path: string) => {
    calls.push(path);
    return { data: completion } as T;
  };
  const result = await getStage2PackageCompletion('7421', request);
  assert.deepEqual(result, completion);
  assert.deepEqual(calls, ['/paket/7421/tahap2-status']);
  assert.throws(() => parseStage2PackageCompletion(completion, '5'), /tidak lengkap|tidak sesuai paket/);
  assert.throws(() => parseStage2PackageCompletion({
    ...completion, state: 'complete', approved_count: 1, label: 'Selesai',
  }, '7421'), /Status selesai Tahap 2/);
});

test('workspace overview and Tahap 2 consume the identical backend package completion endpoint', async () => {
  const completion = {
    paket_id: 7421, state: 'complete', approved_count: 2, total_count: 2,
    pending_surveys: [], reason: null, label: 'Selesai · 2/2 jenis survei',
  };
  const paths: string[] = [];
  const request: Stage2Request = async <T>(path: string) => {
    paths.push(path);
    if (path.endsWith('/tahap2-status')) return { data: completion } as T;
    if (path.endsWith('/konfirmasi-kalibrasi')) return { data: { paket_id: 7421, aktif: true, status: 'DISETUJUI', snapshot_sesuai: true, stage2_allowed: true } } as T;
    if (path.endsWith('/uji-coba')) return { data: [] } as T;
    if (path.endsWith('/tim')) return { data: [] } as T;
    if (path.endsWith('/ruas-jalan')) return { data: [] } as T;
    if (path === '/jenis-survei') return { data: [] } as T;
    throw new Error(`Unexpected request ${path}`);
  };
  const workspace = await getStage2Workspace('7421', request);
  assert.equal(workspace.completion.label, 'Selesai · 2/2 jenis survei');
  assert.equal(paths.filter(path => path === '/paket/7421/tahap2-status').length, 1);
});

test('create trial sends selected scoped road only when called, then confirms by server GET', async () => {
  const api = harness();
  assert.equal(api.calls.length, 0, 'adapter does not write before form submit handler calls it');
  const result = await createStage2Trial('5', { tim_id: 4, jenis_survei_id: 2, alat_id: 8, ruas_id: 9, tanggal: '2026-11-09', panjang_km: 1.2, percobaan_ke: 1 }, api.request);
  assert.equal(api.calls[0].method, 'POST');
  assert.equal(api.calls[0].body?.ruas_id, 9);
  assert.equal(api.calls.at(-1)?.method, 'GET');
  assert.equal(result.state.trials[0].status, 'DRAFT');
});

test('submit and PIC review send version and report success only after authoritative readback', async () => {
  const api = harness();
  await createStage2Trial('5', { tim_id: 4, jenis_survei_id: 2, alat_id: 8, ruas_id: 9, tanggal: '2026-11-09', panjang_km: 1, percobaan_ke: 1 }, api.request);
  const submitted = await submitStage2Trial('5', 77, 1, api.request);
  assert.equal(submitted.confirmed.status, 'DIAJUKAN');
  assert.equal(api.calls.find(call => call.method === 'POST' && call.path.endsWith('/pengajuan'))?.body?.expected_version, 1);
  const reviewed = await reviewStage2Trial('5', 77, { expected_version: 2, keputusan: 'DISETUJUI', catatan: '' }, api.request);
  assert.equal(reviewed.confirmed.status, 'DISETUJUI');
  assert.equal(api.trials[0].status, 'DISETUJUI');
  assert.equal(api.calls.find(call => call.method === 'POST' && call.path.endsWith('/pengajuan/review'))?.body?.expected_version, 2);
});

test('review readback mismatch fails instead of accepting a local approval', async () => {
  const api = harness();
  await createStage2Trial('5', { tim_id: 4, jenis_survei_id: 2, alat_id: 8, ruas_id: 9, tanggal: '2026-11-09', panjang_km: 1, percobaan_ke: 1 }, api.request);
  api.setStaleReadback();
  await assert.rejects(reviewStage2Trial('5', 77, { expected_version: 1, keputusan: 'DISETUJUI', catatan: '' }, api.request), /belum disahkan/);
});

test('section, measurement and IRI preview are confirmed from refreshed server detail', async () => {
  const api = harness();
  await createStage2Trial('5', { tim_id: 4, jenis_survei_id: 2, alat_id: 8, ruas_id: 9, tanggal: '2026-11-09', panjang_km: 1, percobaan_ke: 1 }, api.request);
  const sectionResult = await createStage2Section('5', 77, { nama_seksi: 'Seksi A', sta_awal: 0, sta_akhir: 100, nilai_referensi: null, kategori_kondisi: null }, api.request);
  assert.equal(sectionResult.confirmed.seksi_id, 88);
  const measurementResult = await createStage2Measurement('5', 77, 88, { ulangan_ke: 1, kecepatan_kmh: 30, nilai_alat: 2.1, beban_kn: null, rater_personel_id: null }, api.request);
  assert.equal(measurementResult.confirmed.pengukuran_id, 99);
  const values = [{ kode: 'IRI_A', nilai: 1 }, { kode: 'IRI_B', nilai: 2 }, { kode: 'IRI_R2', nilai: 3 }, { kode: 'IRI_CV', nilai: 4 }];
  const evaluationResult = await saveStage2Evaluation('5', 77, { expected_version: 1, hasil: values }, api.request);
  assert.deepEqual(evaluationResult.confirmed.hasil, values);
  assert.equal(api.calls.find(call => call.method === 'POST' && call.path.endsWith('/evaluasi'))?.body?.expected_version, 1);
});

test('failed create request does not produce a client-side trial record', async () => {
  const api = harness();
  const failingRequest: Stage2Request = async <T>(path: string, init?: RequestInit) => {
    if (init?.method === 'POST') throw new Error('Server menolak data');
    return api.request<T>(path, init);
  };
  await assert.rejects(createStage2Trial('5', { tim_id: 4, jenis_survei_id: 2, alat_id: 8, ruas_id: 9, tanggal: '2026-11-09', panjang_km: 1, percobaan_ke: 1 }, failingRequest), /Server menolak/);
  assert.equal(api.trials.length, 0);
});

test('authenticated UI keeps writes behind existing provider and PIC role guards', async () => {
  const source = await readFile(new URL('./ServerStage2Workspace.tsx', import.meta.url), 'utf8');
  assert.match(source, /const provider = role === 'Penyedia Jasa \/ Ketua Tim'/);
  assert.match(source, /const pic = role === 'PIC Balai \/ Pengguna Jasa'/);
  assert.match(source, /\{provider && <form onSubmit=\{createTrial\}>/);
  assert.match(source, /\{canMutateDraft && <form onSubmit=\{createSection\}>/);
  assert.match(source, /\{pic && submission\?\.status === 'DIAJUKAN'/);
  assert.match(source, /stage1Gate\?\.aktif === true && stage1Gate\.stage2_allowed === true/);
  assert.match(source, /stage2-blocked-by-stage1/);
  assert.match(source, /disabled=\{!stage2Allowed \|\| busy/);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
});

test('authenticated Tahap 2 reuses Dirah workspace panels, role section, survey tabs and responsive columns', async () => {
  const source = await readFile(new URL('./ServerStage2Workspace.tsx', import.meta.url), 'utf8');
  assert.match(source, /import \{ RoleWorkSection \} from '\.\.\/workflow\/RoleWorkSection'/);
  assert.match(source, /import \{ Badge, Panel \} from '\.\.\/workflow\/stages\/stageSupport'/);
  assert.match(source, /title="Dokumen Hasil Uji & Persetujuan"/);
  assert.match(source, /title="Jenis Survei yang Diperiksa"/);
  assert.match(source, /role="tablist"/);
  assert.match(source, /production-workspace-columns/);
  assert.match(source, /className="wf-empty"/);
  assert.match(source, /Lampiran BA terpisah belum tersedia daripada server/);
});
