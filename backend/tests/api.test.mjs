import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
let mock, child, base, lastRpc;
const storageFiles = new Map();
let registeredDocument;
let cleanupCalls = 0;
const profile = { pengguna_id: 3, auth_user_id: 'provider-id', username: 'penyedia.jasa', email: 'provider@example.test', terkunci: false };
async function request(path, token, body, method) {
  const r = await fetch(base + path, { method: method ?? (body === undefined ? 'GET' : 'POST'), headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: r.status, body: await r.json() };
}
before(async () => {
  mock = http.createServer(async (req, res) => {
    const token = req.headers.authorization?.slice(7);
    assert.equal(req.headers.apikey, 'test-publishable-key');
    res.setHeader('Content-Type', 'application/json');
    const url = new URL(req.url, 'http://localhost');
    const send = (data, code = 200) => { res.statusCode = code; res.end(JSON.stringify(data)); };
    if (url.pathname === '/auth/v1/user') return token === 'expired' ? send({ error: 'expired' }, 401) : send({ id: token?.includes('reviewer') ? 'reviewer-id' : 'provider-id' });
    if (url.pathname === '/rest/v1/pengguna') return send(token === 'unlinked' ? [] : [{ ...profile, auth_user_id: token?.includes('reviewer') ? 'reviewer-id' : 'provider-id', terkunci: token === 'locked' }]);
    if (url.pathname === '/rest/v1/pengguna_peran') return send([{ peran_id: token?.includes('reviewer') ? 1 : 3, scope_balai_id: null, scope_paket_id: null }]);
    if (url.pathname === '/rest/v1/peran') return send([{ peran_id: token?.includes('reviewer') ? 1 : 3, nama: token?.includes('reviewer') ? 'pic_balai' : 'penyedia_jasa' }]);
    if (url.pathname === '/rest/v1/balai') return send([{ balai_id: 1, nama: 'Balai Ujian', aktif: true }]);
    if (url.pathname === '/rest/v1/paket_kontrak') {
      const filter = url.searchParams.get('paket_id');
      if (!filter) return send([]);
      return send(filter === 'eq.3' && token !== 'foreign-reviewer' ? [{ paket_id: 3, nama_paket: 'Paket Ujian', status: 'DRAFT', nama_ppk: null, tgl_spmk: null }] : []);
    }
    if (url.pathname === '/rest/v1/jenis_dokumen') return send([{ jenis_dokumen_id: 1, kode: 'LAPORAN_PENDAHULUAN', nama: 'Laporan Pendahuluan' }]);
    if (url.pathname === '/rest/v1/dokumen') {
      const id = url.searchParams.get('dokumen_id');
      if (id === 'eq.998') return send([]);
      if (id === 'eq.999' && registeredDocument) return send([{ ...registeredDocument, dokumen_versi: [{ ...registeredDocument.dokumen_versi[0], hash_file: 'bad' }] }]);
      return send(registeredDocument ? [registeredDocument] : []);
    }
    if (url.pathname.startsWith('/storage/v1/object/authenticated/dokumen-persiapan/')) {
      const path = decodeURIComponent(url.pathname.split('/dokumen-persiapan/')[1]);
      const data = storageFiles.get(path);
      if (!data) return send({ message: 'Object not found' }, 404);
      res.setHeader('Content-Type', 'application/pdf'); return res.end(data);
    }
    if (url.pathname === '/storage/v1/object/dokumen-persiapan' && req.method === 'DELETE') {
      let raw = ''; for await (const chunk of req) raw += chunk;
      cleanupCalls++; for (const path of JSON.parse(raw).prefixes) storageFiles.delete(path);
      return send([]);
    }
    if (url.pathname.startsWith('/storage/v1/object/dokumen-persiapan/') && req.method === 'POST') {
      if (token === 'no-bucket') return send({ message: 'Bucket not found' }, 404);
      assert.equal(req.headers['content-type'], 'application/pdf');
      assert.equal(req.headers['x-upsert'], 'false');
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const path = decodeURIComponent(url.pathname.split('/dokumen-persiapan/')[1]);
      storageFiles.set(path, Buffer.concat(chunks)); return send({ Key: path });
    }
    if (url.pathname === '/rest/v1/rpc/daftar_dokumen_persiapan') {
      let raw = ''; for await (const chunk of req) raw += chunk; lastRpc = JSON.parse(raw);
      if (lastRpc.p_judul === 'REJECT') return send({ code: '22023', message: 'Metadata rejected' }, 400);
      if (lastRpc.p_judul === 'UNCERTAIN') return send({ error: 'Unknown upstream failure' }, 500);
      const data = storageFiles.get(lastRpc.p_object_path);
      assert.equal(lastRpc.p_ukuran, data.length);
      assert.equal(lastRpc.p_sha256, createHash('sha256').update(data).digest('hex'));
      const version = { bucket_id: 'dokumen-persiapan', object_path: lastRpc.p_object_path, nama_file: lastRpc.p_nama_file, ukuran_byte: data.length, hash_file: lastRpc.p_sha256, versi_ke: 1 };
      registeredDocument = { dokumen_id: 51, paket_id: 3, judul: lastRpc.p_judul, status: 'TERSEDIA', versi_aktif: 1, dokumen_versi: [version] };
      return send({ dokumen: registeredDocument, versi: version });
    }
    if (url.pathname === '/rest/v1/rpc/tautkan_bukti_persiapan') {
      let raw = ''; for await (const chunk of req) raw += chunk; lastRpc = JSON.parse(raw);
      if (lastRpc.p_paket_id === 999) return send({ code: 'P0002' }, 404);
      if (lastRpc.p_paket_id === 4) return send({ code: '55000', message: 'Checklist bukan berstatus DRAFT' }, 400);
      if (lastRpc.p_expected_version === 42) return send({ code: '40001' }, 409);
      if (lastRpc.p_item_id !== 15 || (lastRpc.p_dokumen_id !== null && lastRpc.p_dokumen_id !== 2)) return send({ code: '22023', message: 'Dokumen bukan paket yang sama atau jenis bukti tidak sepadan' }, 400);
      return send({ paket_id: lastRpc.p_paket_id, pengisian: { status: 'DRAFT', versi: lastRpc.p_expected_version + 1 }, ringkasan: { jumlah_terjawab: 2, persen_terisi: 8 }, items: [{ item_id: 15, jenis_bukti_kode: 'LAPORAN_PENDAHULUAN', jawaban: null, keterangan: null, bukti_dokumen_id: lastRpc.p_dokumen_id }] });
    }
    if (url.pathname === '/rest/v1/rpc/baca_checklist_persiapan' || url.pathname === '/rest/v1/rpc/simpan_checklist_persiapan') {
      let raw = ''; for await (const chunk of req) raw += chunk;
      lastRpc = JSON.parse(raw);
      if (lastRpc.p_paket_id === 999) return send({ code: 'P0002' }, 404);
      if (lastRpc.p_paket_id === 4 && url.pathname.includes('simpan')) return send({ code: '55000', message: 'Checklist bukan berstatus DRAFT' }, 400);
      if (lastRpc.p_expected_version === 42) return send({ code: '40001' }, 409);
      if (lastRpc.p_jawaban?.some(row => row.item_id === 999)) return send({ code: '22023', message: 'Item bukan milik template persiapan' }, 400);
      const saved = url.pathname.includes('simpan');
      return send({ paket_id: lastRpc.p_paket_id, template: { template_id: 1, revisi: 'DRAFT-01' }, pengisian: { pengisian_id: saved ? 1 : null, status: 'DRAFT', versi: saved ? lastRpc.p_expected_version + 1 : 0 }, ringkasan: { jumlah_item: 25, jumlah_terjawab: saved ? 1 : 0, syarat_submit_aktif: false }, items: Array.from({ length: 25 }, (_, i) => ({ item_id: i + 1, jawaban: saved && i === 0 ? lastRpc.p_jawaban[0].jawaban : null })) });
    }
    if (url.pathname === '/rest/v1/rpc/ubah_paket_draft') {
      let raw = ''; for await (const chunk of req) raw += chunk;
      lastRpc = JSON.parse(raw);
      if (lastRpc.p_paket_id === 999) return send({ code: 'P0002' }, 404);
      if (lastRpc.p_paket_id === 4) return send({ code: '55000' }, 400);
      if (lastRpc.p_patch.nomor_kontrak === 'DUPLICATE') return send({ code: '23505' }, 409);
      return send({ paket_id: lastRpc.p_paket_id, status: 'DRAFT', created_by: 3, ...lastRpc.p_patch });
    }
    if (url.pathname === '/rest/v1/rpc/buat_paket_draft') {
      let raw = ''; for await (const chunk of req) raw += chunk;
      lastRpc = JSON.parse(raw);
      if (lastRpc.p_nomor_kontrak === 'DUPLICATE') return send({ code: '23505' }, 409);
      return send({ paket_id: 1, nama_paket: lastRpc.p_nama_paket, status: 'DRAFT', created_by: 3 });
    }
    send({}, 404);
  });
  await new Promise(resolve => mock.listen(0, '127.0.0.1', resolve));
  const probe = http.createServer(); await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  base = `http://127.0.0.1:${port}/api`;
  child = spawn(process.execPath, ['dist/index.mjs'], { env: { ...process.env, PORT: String(port), SUPABASE_URL: `http://127.0.0.1:${mock.address().port}`, SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key', LOG_LEVEL: 'silent', NODE_ENV: 'production' }, stdio: 'ignore' });
  let ready = false;
  for (let i = 0; i < 60; i++) { try { if ((await fetch(base + '/healthz')).ok) { ready = true; break; } } catch {} await delay(50); }
  assert.ok(ready, 'server starts');
});
after(async () => { child?.kill(); if (mock) await new Promise(resolve => mock.close(resolve)); });
const draft = { nama_paket: ' Paket Ujian ', nomor_kontrak: 'K-001', tahun_anggaran: 2026, balai_id: 1 };
test('health remains public', async () => assert.equal((await request('/healthz')).status, 200));
test('login required', async () => assert.equal((await request('/me')).status, 401));
test('expired token rejected', async () => assert.equal((await request('/me', 'expired')).status, 401));
test('unlinked and locked profiles rejected', async () => { for (const token of ['unlinked', 'locked']) assert.equal((await request('/me', token)).status, 403); });
test('own profile and roles returned', async () => { const r = await request('/me', 'provider'); assert.equal(r.status, 200); assert.equal(r.body.data.peran[0].nama, 'penyedia_jasa'); });
test('Balai and package list available', async () => { assert.equal((await request('/balai', 'provider')).status, 200); assert.equal((await request('/paket', 'provider')).status, 200); });
test('invalid pagination rejected', async () => assert.equal((await request('/paket?page=-1', 'provider')).status, 400));
test('PIC cannot create', async () => assert.equal((await request('/paket', 'reviewer', draft)).status, 403));
test('status and creator spoofing rejected', async () => { for (const fields of [{ status: 'DISETUJUI' }, { created_by: 1 }, { nama_paket: ' ' }]) assert.equal((await request('/paket', 'provider', { ...draft, ...fields })).status, 400); });
test('valid draft uses caller token and validated fields', async () => { const r = await request('/paket', 'provider', draft); assert.equal(r.status, 201); assert.equal(r.body.data.status, 'DRAFT'); assert.deepEqual(lastRpc, { p_nama_paket: 'Paket Ujian', p_nomor_kontrak: 'K-001', p_tahun_anggaran: 2026, p_balai_id: 1 }); });
test('duplicate contract maps to 409', async () => assert.equal((await request('/paket', 'provider', { ...draft, nomor_kontrak: 'DUPLICATE' })).status, 409));

test('detail endpoint reads one package', async () => { const r = await request('/paket/3', 'provider'); assert.equal(r.status, 200); assert.equal(r.body.data.paket_id, 3); });
test('missing or invisible detail returns 404', async () => assert.equal((await request('/paket/999', 'provider')).status, 404));
test('invalid package identifiers rejected', async () => { for (const id of ['0', '-1', '3abc', '2147483648']) { assert.equal((await request('/paket/' + id, 'provider')).status, 400); assert.equal((await request('/paket/' + id, 'provider', { nama_ppk: 'PPK' }, 'PATCH')).status, 400); } });
test('PIC cannot edit draft', async () => assert.equal((await request('/paket/3', 'reviewer', { nama_ppk: 'PPK' }, 'PATCH')).status, 403));
test('empty and protected fields rejected on edit', async () => { for (const body of [{}, { status: 'DISETUJUI' }, { created_by: 1 }, { balai_id: 2 }, { nama_paket: null }, { tahun_anggaran: 2026.5 }]) assert.equal((await request('/paket/3', 'provider', body, 'PATCH')).status, 400); });
test('invalid calendar dates rejected', async () => { for (const value of ['2026-02-30', '2026-02-29', '2026-13-01', '17/10/2026', '0000-01-01']) assert.equal((await request('/paket/3', 'provider', { tgl_spmk: value }, 'PATCH')).status, 400); });
test('valid edit forwards only supplied fields', async () => { const r = await request('/paket/3', 'provider', { nama_ppk: ' PPK Ujian ', tgl_spmk: '2026-10-17' }, 'PATCH'); assert.equal(r.status, 200); assert.equal(r.body.data.nama_ppk, 'PPK Ujian'); assert.deepEqual(lastRpc, { p_paket_id: 3, p_patch: { nama_ppk: 'PPK Ujian', tgl_spmk: '2026-10-17' } }); });
test('optional fields can be cleared', async () => { const r = await request('/paket/3', 'provider', { nama_ppk: '', tgl_spmk: null }, 'PATCH'); assert.equal(r.status, 200); assert.equal(lastRpc.p_patch.nama_ppk, null); assert.equal(lastRpc.p_patch.tgl_spmk, null); });
test('non-draft and duplicate edit return 409', async () => { assert.equal((await request('/paket/4', 'provider', { nama_ppk: 'PPK' }, 'PATCH')).status, 409); assert.equal((await request('/paket/3', 'provider', { nomor_kontrak: 'DUPLICATE' }, 'PATCH')).status, 409); });
test('missing edit target returns 404', async () => assert.equal((await request('/paket/999', 'provider', { nama_ppk: 'PPK' }, 'PATCH')).status, 404));

const checklistPath = '/paket/3/checklist-persiapan';
const checklistBody = { expected_version: 0, jawaban: [{ item_id: 1, jawaban: 'Ya', keterangan: ' Catatan ujian ' }] };
test('checklist requires login', async () => assert.equal((await request(checklistPath)).status, 401));
test('checklist GET returns unsaved items without creating', async () => { const r = await request(checklistPath, 'provider'); assert.equal(r.status, 200); assert.equal(r.body.data.items.length, 25); assert.equal(r.body.data.pengisian.pengisian_id, null); assert.equal(r.body.data.pengisian.versi, 0); assert.equal(r.body.data.ringkasan.syarat_submit_aktif, false); });
test('PIC may read authorized checklist', async () => assert.equal((await request(checklistPath, 'reviewer')).status, 200));
test('invisible checklist returns 404', async () => assert.equal((await request('/paket/999/checklist-persiapan', 'reviewer')).status, 404));
test('PIC cannot save checklist', async () => assert.equal((await request(checklistPath, 'reviewer', checklistBody, 'PATCH')).status, 403));
test('checklist rejects protected and missing fields', async () => { for (const body of [{ ...checklistBody, status: 'DISETUJUI' }, { ...checklistBody, template_id: 1 }, { jawaban: checklistBody.jawaban }, { expected_version: -1, jawaban: checklistBody.jawaban }, { expected_version: 0, jawaban: [] }]) assert.equal((await request(checklistPath, 'provider', body, 'PATCH')).status, 400); });
test('checklist rejects invalid answers and duplicate IDs', async () => { for (const rows of [[{ item_id: 1, jawaban: 'N/A' }], [{ item_id: 1, jawaban: true }], [{ item_id: 1 }], [{ item_id: 0, jawaban: 'Ya' }], [{ item_id: 1, jawaban: 'Ya', bukti_dokumen_id: 1 }], [{ item_id: 1, jawaban: 'Ya', keterangan: 'x'.repeat(2001) }], [{ item_id: 1, jawaban: 'Ya' }, { item_id: 1, jawaban: 'Tidak' }]]) assert.equal((await request(checklistPath, 'provider', { expected_version: 0, jawaban: rows }, 'PATCH')).status, 400); });
test('checklist save sends only validated payload and version', async () => { const r = await request(checklistPath, 'provider', checklistBody, 'PATCH'); assert.equal(r.status, 200); assert.equal(r.body.data.pengisian.versi, 1); assert.deepEqual(lastRpc, { p_paket_id: 3, p_expected_version: 0, p_jawaban: [{ item_id: 1, jawaban: 'Ya', keterangan: 'Catatan ujian' }] }); });
test('checklist answer can be cleared with null', async () => { const r = await request(checklistPath, 'provider', { expected_version: 1, jawaban: [{ item_id: 1, jawaban: null }] }, 'PATCH'); assert.equal(r.status, 200); assert.equal(lastRpc.p_jawaban[0].jawaban, null); assert.equal('keterangan' in lastRpc.p_jawaban[0], false); });
test('stale checklist version returns 409', async () => assert.equal((await request(checklistPath, 'provider', { ...checklistBody, expected_version: 42 }, 'PATCH')).status, 409));
test('submitted checklist returns 409', async () => assert.equal((await request('/paket/4/checklist-persiapan', 'provider', checklistBody, 'PATCH')).status, 409));
test('foreign template item rejected by database response', async () => assert.equal((await request(checklistPath, 'provider', { expected_version: 0, jawaban: [{ item_id: 999, jawaban: 'Ya' }] }, 'PATCH')).status, 400));

const pdfBytes = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n');
function uploadForm({ file = pdfBytes, filename = 'ujian.pdf', type = 'application/pdf', judul = 'Laporan Ujian', extra = false, includeFile = true, double = false } = {}) {
  const form = new FormData(); form.set('judul', judul); form.set('jenis_dokumen', 'LAPORAN_PENDAHULUAN');
  if (includeFile) form.append('file', new Blob([file], { type }), filename);
  if (double) form.append('file', new Blob([file], { type }), 'kedua.pdf');
  if (extra) form.set('status', 'DISETUJUI');
  return form;
}
async function uploadDocument(form = uploadForm(), token = 'provider') {
  const r = await fetch(base + '/paket/3/dokumen', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  return { status: r.status, body: await r.json() };
}
test('document types can be listed', async () => assert.equal((await request('/jenis-dokumen', 'provider')).status, 200));
test('document list respects invisible package', async () => assert.equal((await request('/paket/3/dokumen', 'foreign-reviewer')).status, 404));
test('PIC cannot upload documents', async () => assert.equal((await uploadDocument(uploadForm(), 'reviewer')).status, 403));
test('upload requires a file', async () => assert.equal((await uploadDocument(uploadForm({ includeFile: false }))).status, 400));
test('upload rejects wrong extension, MIME and PDF contents', async () => { for (const opts of [{ filename: 'ujian.txt' }, { type: 'text/plain' }, { file: Buffer.from('fake PDF content') }]) assert.equal((await uploadDocument(uploadForm(opts))).status, 400); });
test('upload rejects oversized PDF', async () => assert.equal((await uploadDocument(uploadForm({ file: Buffer.alloc(10 * 1024 * 1024 + 1) }))).status, 413));
test('upload rejects extra metadata and multiple files', async () => { assert.equal((await uploadDocument(uploadForm({ extra: true }))).status, 400); assert.equal((await uploadDocument(uploadForm({ double: true }))).status, 400); });
test('missing bucket gives actionable error', async () => { const r = await uploadDocument(uploadForm(), 'no-bucket'); assert.equal(r.status, 503); assert.match(r.body.error, /Bucket/); });
test('valid PDF uploaded and registered with server hash and size', async () => { const r = await uploadDocument(); assert.equal(r.status, 201); assert.equal(r.body.data.dokumen.dokumen_id, 51); assert.match(lastRpc.p_object_path, /^3\/[0-9a-f-]+\.pdf$/); });
test('registered document is listed', async () => { const r = await request('/paket/3/dokumen', 'provider'); assert.equal(r.status, 200); assert.equal(r.body.data[0].dokumen_id, 51); });
test('authorized document download returns exact PDF bytes', async () => { const r = await fetch(base + '/paket/3/dokumen/51/download', { headers: { Authorization: 'Bearer reviewer' } }); assert.equal(r.status, 200); assert.match(r.headers.get('content-type'), /application\/pdf/); assert.match(r.headers.get('content-disposition'), /attachment/); assert.equal(r.headers.get('cache-control'), 'private, no-store'); assert.deepEqual(Buffer.from(await r.arrayBuffer()), pdfBytes); });
test('foreign PIC cannot download', async () => assert.equal((await request('/paket/3/dokumen/51/download', 'foreign-reviewer')).status, 404));
test('missing document returns 404', async () => assert.equal((await request('/paket/3/dokumen/998/download', 'provider')).status, 404));
test('download integrity mismatch rejected', async () => assert.equal((await request('/paket/3/dokumen/999/download', 'provider')).status, 502));
test('definite registration failure attempts orphan cleanup', async () => { const before = cleanupCalls; const r = await uploadDocument(uploadForm({ judul: 'REJECT' })); assert.equal(r.status, 400); assert.equal(cleanupCalls, before + 1); });
test('uncertain registration failure does not delete possibly registered file', async () => { const before = cleanupCalls; const r = await uploadDocument(uploadForm({ judul: 'UNCERTAIN' })); assert.equal(r.status, 502); assert.equal(cleanupCalls, before); });

const evidencePath = '/paket/3/checklist-persiapan/bukti';
const evidenceBody = { expected_version: 1, item_id: 15, bukti_dokumen_id: 2 };
test('evidence linking requires login', async () => { const r = await fetch(base + evidencePath, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(evidenceBody) }); assert.equal(r.status, 401); });
test('PIC cannot link evidence', async () => assert.equal((await request(evidencePath, 'reviewer', evidenceBody, 'PATCH')).status, 403));
test('evidence validates IDs, required version and protected fields', async () => { for (const body of [{ item_id: 15, bukti_dokumen_id: 2 }, { ...evidenceBody, expected_version: -1 }, { ...evidenceBody, item_id: 0 }, { ...evidenceBody, bukti_dokumen_id: '2' }, { ...evidenceBody, bukti_dokumen_id: 0 }, { ...evidenceBody, status: 'DISETUJUI' }, { ...evidenceBody, jawaban: 'Ya' }]) assert.equal((await request(evidencePath, 'provider', body, 'PATCH')).status, 400); });
test('evidence linked without answering checklist automatically', async () => { const r = await request(evidencePath, 'provider', evidenceBody, 'PATCH'); assert.equal(r.status, 200); assert.equal(r.body.data.items[0].bukti_dokumen_id, 2); assert.equal(r.body.data.items[0].jawaban, null); assert.equal(r.body.data.ringkasan.jumlah_terjawab, 2); assert.deepEqual(lastRpc, { p_paket_id: 3, p_expected_version: 1, p_item_id: 15, p_dokumen_id: 2 }); });
test('evidence unlinked with null', async () => { const r = await request(evidencePath, 'provider', { ...evidenceBody, bukti_dokumen_id: null }, 'PATCH'); assert.equal(r.status, 200); assert.equal(lastRpc.p_dokumen_id, null); });
test('wrong-type or unavailable evidence rejected', async () => { assert.equal((await request(evidencePath, 'provider', { ...evidenceBody, item_id: 23 }, 'PATCH')).status, 400); assert.equal((await request(evidencePath, 'provider', { ...evidenceBody, bukti_dokumen_id: 999 }, 'PATCH')).status, 400); });
test('stale evidence version rejected', async () => assert.equal((await request(evidencePath, 'provider', { ...evidenceBody, expected_version: 42 }, 'PATCH')).status, 409));
test('submitted or missing evidence target rejected', async () => { assert.equal((await request('/paket/4/checklist-persiapan/bukti', 'provider', evidenceBody, 'PATCH')).status, 409); assert.equal((await request('/paket/999/checklist-persiapan/bukti', 'provider', evidenceBody, 'PATCH')).status, 404); });
