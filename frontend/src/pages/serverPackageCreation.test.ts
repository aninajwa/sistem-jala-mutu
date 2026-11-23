import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { canCreateServerPackage, createServerPackage, type CreateServerPackageInput } from './serverPackageCreation';

const input: CreateServerPackageInput = {
  nama_paket: 'Paket ujian',
  nomor_kontrak: 'KONTRAK-1',
  tahun_anggaran: 2026,
  balai_id: 7,
  jenis_survei_ids: [2, 5],
};
const scope = {
  paket_id: 42,
  state: 'defined' as const,
  version: 1,
  surveys: [
    { jenis_survei_id: 2, kode: 'IRI', nama: 'International Roughness Index', aktif: true },
    { jenis_survei_id: 5, kode: 'PCI', nama: 'Pavement Condition Index', aktif: true },
  ],
};

test('hanya role Penyedia Jasa dibenarkan membuat paket', () => {
  assert.equal(canCreateServerPackage('Penyedia Jasa / Ketua Tim'), true);
  assert.equal(canCreateServerPackage('PIC Balai / Pengguna Jasa'), false);
  assert.equal(canCreateServerPackage('Direktorat / Pusat'), false);
  assert.equal(canCreateServerPackage('Admin'), false);
});

test('halaman paket authenticated hanya memasang butang create untuk role yang dibenarkan', async () => {
  const source = await readFile(new URL('./PackagesPage.tsx', import.meta.url), 'utf8');
  assert.match(source, /const canCreate = canCreateServerPackage\(role\)/);
  assert.match(source, /onCreatePackage=\{canCreate \? \(\) => \{ setNotice\(''\); setCreatePackageOpen\(true\); \} : undefined\}/);
  assert.match(source, /\{onCreatePackage && \(role === 'Penyedia Jasa \/ Ketua Tim' \|\| role === 'Admin'\) && \(/);
  assert.match(source, /\{notice && <div role="status" className="wf-callout"/);
});

test('POST paket mengirim selection atomik dan mengonfirmasi scope dari readback server', async () => {
  let requests = 0;
  const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    requests += 1;
    if (path === '/paket') {
      assert.equal(init?.method, 'POST');
      assert.deepEqual(JSON.parse(String(init?.body)), input);
      return { data: { paket_id: 42, nama_paket: input.nama_paket, status: 'DRAFT', declared_survey_scope: scope } } as T;
    }
    assert.equal(path, '/paket/42/declared-survey-scope');
    assert.equal(init?.cache, 'no-store');
    return { data: scope } as T;
  };

  assert.equal(requests, 0, 'tiada POST sebelum submit memanggil helper');
  const created = await createServerPackage(input, request);
  assert.equal(requests, 2);
  assert.deepEqual(created, { paket_id: 42, nama_paket: 'Paket ujian', status: 'DRAFT', declared_survey_scope: scope });
});

test('kegagalan API atau respons tidak sah tidak menghasilkan item ciptaan', async () => {
  let onCreatedCalls = 0;
  const failedRequest = async <T>(): Promise<T> => { throw new Error('Balai tidak aktif'); };
  await assert.rejects(createServerPackage(input, failedRequest), /Balai tidak aktif/);
  const malformedRequest = async <T>(): Promise<T> => ({ data: { paket_id: 0, nama_paket: input.nama_paket, status: 'DRAFT' } } as T);
  const created = await createServerPackage(input, malformedRequest).catch(() => null);
  if (created) onCreatedCalls += 1;
  assert.equal(created, null);
  assert.equal(onCreatedCalls, 0);
});

test('komponen memanggil callback hanya selepas submit berjaya dan memaparkan error API', async () => {
  const source = await readFile(new URL('./CreatePackageDialog.tsx', import.meta.url), 'utf8');
  const submit = source.slice(source.indexOf('async function submit'), source.indexOf('\n  return <div className="overlay"'));
  assert.match(source, /<form className="dialog-content" onSubmit=\{submit\}>/);
  assert.ok(submit.indexOf('await createServerPackage(') < submit.indexOf('onCreated(created)'));
  assert.match(submit, /catch \(cause\)\s*\{\s*setError\(errorText\(cause\)\);\s*\}/);
  assert.match(source, /\{error && <p role="alert" className="notice">\{error\}<\/p>\}/);
});

