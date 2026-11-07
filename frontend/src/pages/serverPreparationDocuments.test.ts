import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { canEditPreparation, type ServerChecklist } from './serverPreparation';
import { addPreparationDocumentVersion, canUseServerDocumentCategory, documentsForCategory, fetchPreparationDocument, linkPreparationDocument, mapServerDocumentCategory, uploadPreparationDocument } from './serverPreparationDocuments';

const checklist: ServerChecklist = {
  paket_id: 9,
  pengisian: { status: 'DRAFT', versi: 4 },
  ringkasan: { jumlah_item: 25, jumlah_terjawab: 2 },
  items: [
    { item_id: 1001, kode: 'DOK-01', bagian: 'Dokumen persiapan', uraian: 'Laporan Pendahuluan', jawaban: null },
    { item_id: 1009, kode: 'DOK-09', bagian: 'Dokumen persiapan', uraian: 'Program Mutu / Quality Management Plan', jawaban: null },
  ],
};
const docs = [
  { dokumen_id: 21, paket_id: 9, judul: 'Laporan', status: 'TERSEDIA', versi_aktif: 1, jenis_dokumen: { kode: 'LAPORAN_PENDAHULUAN', nama: 'Laporan Pendahuluan' } },
  { dokumen_id: 22, paket_id: 9, judul: 'Mutu', status: 'TERSEDIA', versi_aktif: 2, jenis_dokumen: { kode: 'PROGRAM_MUTU', nama: 'Program Mutu' } },
  { dokumen_id: 23, paket_id: 9, judul: 'Other', status: 'TERSEDIA', versi_aktif: 1, jenis_dokumen: { kode: 'OTHER', nama: 'Other' } },
];

test('server document mapping only accepts the two applied backend type-to-checklist relationships', () => {
  assert.equal(mapServerDocumentCategory(docs[0]), 'Laporan Pendahuluan');
  assert.equal(mapServerDocumentCategory(docs[1]), 'Program Mutu / Quality Management Plan');
  assert.equal(mapServerDocumentCategory(docs[2]), null);
  assert.deepEqual(documentsForCategory(docs, 'Laporan Pendahuluan').map(row => row.dokumen_id), [21]);
  assert.deepEqual(documentsForCategory([], 'Laporan Pendahuluan'), []);
  for (const category of ['RMPK', 'RKK', 'RMLLP', 'Bukti Koordinasi']) assert.equal(canUseServerDocumentCategory(category), false);
});

test('document mutations are role/status guarded and PATCH the exact linked item with expected_version', async () => {
  assert.equal(canEditPreparation('Penyedia Jasa / Ketua Tim', 'DRAFT', 'DRAFT'), true);
  assert.equal(canEditPreparation('PIC Balai / Pengguna Jasa', 'DRAFT', 'DRAFT'), false);
  assert.equal(canEditPreparation('Penyedia Jasa / Ketua Tim', 'DRAFT', 'DIAJUKAN'), false);
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    calls.push({ path, init });
    if (init?.method === 'POST') return { data: { dokumen: { dokumen_id: 24 } } } as T;
    if (path.endsWith('/dokumen')) return { data: [...docs, { dokumen_id: 24, paket_id: 9, judul: 'Report', status: 'TERSEDIA', versi_aktif: 1, jenis_dokumen: { kode: 'LAPORAN_PENDAHULUAN' } }] } as T;
    return {} as T;
  };
  const file = new File(['pdf'], 'report.pdf', { type: 'application/pdf' });
  await uploadPreparationDocument('9', checklist, 'Laporan Pendahuluan', file, 'Report', request);
  const upload = calls.find(call => call.init?.method === 'POST');
  assert.equal(upload?.path, '/paket/9/dokumen');
  assert.ok(upload?.init?.body instanceof FormData);
  assert.equal((upload?.init?.body as FormData).get('jenis_dokumen'), 'LAPORAN_PENDAHULUAN');
  const evidence = calls.find(call => call.path.endsWith('/checklist-persiapan/bukti'));
  assert.equal(evidence?.init?.method, 'PATCH');
  assert.deepEqual(JSON.parse(String(evidence?.init?.body)), { expected_version: 4, item_id: 1001, bukti_dokumen_id: 24 });
});

test('reuse rejects a document from another package or with a mismatched type before checklist PATCH', async () => {
  const calls: string[] = [];
  const request = async <T>(path: string): Promise<T> => { calls.push(path); return { data: [{ ...docs[0], paket_id: 10 }] } as T; };
  await assert.rejects(linkPreparationDocument('9', checklist, 21, 'Laporan Pendahuluan', request), /bukan milik paket/);
  assert.equal(calls.length, 1);
});

test('version upload mock sends the expected active version and does not use browser/local file storage', async () => {
  let call: { path: string; init?: RequestInit } | undefined;
  const request = async <T>(path: string, init?: RequestInit): Promise<T> => { call = { path, init }; return {} as T; };
  const file = new File(['pdf-v2'], 'report-v2.pdf', { type: 'application/pdf' });
  await addPreparationDocumentVersion('9', docs[0], file, 1, request);
  assert.equal(call?.path, '/paket/9/dokumen/21/versi');
  assert.equal(call?.init?.method, 'POST');
  assert.equal((call?.init?.body as FormData).get('expected_version'), '1');
  assert.equal((call?.init?.body as FormData).get('file'), file);
});

test('PDF download uses authenticated versioned endpoint and returns raw response for the browser', async () => {
  let requested = '';
  let auth = '';
  const fetcher: typeof fetch = async (input, init) => {
    requested = String(input);
    auth = new Headers(init?.headers).get('Authorization') || '';
    return new Response(new Blob(['pdf'], { type: 'application/pdf' }), { status: 200 });
  };
  const response = await fetchPreparationDocument('9', 21, 'mock-token', 3, fetcher, '/api');
  assert.equal(response.status, 200);
  assert.equal(requested, '/api/paket/9/dokumen/21/versi/3/download');
  assert.equal(auth, 'Bearer mock-token');
});

test('authenticated document panel exposes loading/error/empty server states and never invokes local persistence', async () => {
  const source = await readFile(new URL('../workflow/DocumentAttachments.tsx', import.meta.url), 'utf8');
  const serverPart = source.slice(source.indexOf('function ServerDocumentAttachments'), source.indexOf('function LocalDocumentAttachments'));
  assert.match(serverPart, /server\.loading&&/);
  assert.match(serverPart, /server\.error&&/);
  assert.match(serverPart, /files\.length===0/);
  assert.doesNotMatch(serverPart, /readLocal|writeLocal|attachmentRepository/);
  assert.match(source, /if\(props\.server\)return <ServerDocumentAttachments/);
  assert.match(source, /return <LocalDocumentAttachments/);
});
