import { test } from 'node:test';
import assert from 'node:assert/strict';
import { authorizedPackageOptions, documentsPageUrl, initialAuthorizedPackageId, packageDocumentsUrl, readPackageDocuments } from './serverPicDocumentsData';

test('package document read uses existing scoped API and keeps packages with no documents in the picker source', async () => {
  const packages = authorizedPackageOptions([
    { id: '7421', name: 'Paket tanpa dokumen' },
    { id: '7422', name: 'Paket lain' },
    { id: 'invalid', name: 'Tidak valid' },
  ]);
  assert.deepEqual(packages.map(item => item.id), ['7421', '7422']);
  assert.equal(initialAuthorizedPackageId(packages, '7422', ''), '7422');
  assert.equal(initialAuthorizedPackageId(packages, null, ''), '7421');
  assert.equal(initialAuthorizedPackageId(packages, '9999', ''), '');

  let requested = '';
  const documents = await readPackageDocuments('7421', async <T>(path: string) => {
    requested = path;
    return { data: [] } as T;
  });
  assert.equal(requested, '/paket/7421/dokumen');
  assert.deepEqual(documents, []);
});

test('document API failures and malformed responses remain errors, not empty states', async () => {
  await assert.rejects(
    readPackageDocuments('7421', async () => { throw new Error('server unavailable'); }),
    /server unavailable/,
  );
  await assert.rejects(
    readPackageDocuments('7421', async <T>() => ({ data: null } as T)),
    /Respons daftar dokumen paket tidak sesuai/,
  );
  await assert.rejects(
    readPackageDocuments('7421', async <T>() => ({
      data: [{ dokumen_id: 1, paket_id: 9999, judul: 'Paket lain', status: 'TERSEDIA', versi_aktif: 1 }],
    } as T)),
    /Identitas dokumen paket dari server tidak valid/,
  );
});

test('package context stays in the URL across navigation, package changes and refresh', () => {
  const detailUrl = 'https://jala-mutu.test/packages?paket=7421&submodule=%2Fpackages%3ARingkasan%20Paket';
  const documentsUrl = documentsPageUrl(detailUrl, 'Semua');
  assert.equal(documentsUrl, '/documents?paket=7421&tab=Semua');

  const switched = packageDocumentsUrl(`https://jala-mutu.test${documentsUrl}`, '7422');
  assert.match(switched, /paket=7422/);
  const afterRefresh = new URL(switched, 'https://jala-mutu.test');
  assert.equal(afterRefresh.searchParams.get('paket'), '7422');
});
