import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getStage4LrsRows, getStage4Roads, saveStage4LrsAndConfirm, stage4LrsErrorMessage, type Stage4LrsInput, type Stage4Request } from './serverStage4LrsData';

const input: Stage4LrsInput = {
  panjang_lapangan_m: 100.25, panjang_acuan_m: 100, jumlah_error_topologi: 0,
  format_sesuai_glossary: true, sta_konsisten_iri_pci_ldt: false,
};
const row = (versi = 1) => ({
  validasi_lrs_id: 31, paket_id: 8, ruas_id: 6, versi,
  ...input, deviasi_m: null, status: null, tgl_valid: null,
});

test('LRS save waits for matching persisted readback and returns the server row', async () => {
  const calls: Array<{ path: string; init?: RequestInit }> = [];
  const request: Stage4Request = async <T>(path: string, init?: RequestInit) => {
    calls.push({ path, init });
    if (init?.method === 'PUT') return { data: row() } as T;
    return { data: [row()] } as T;
  };
  const result = await saveStage4LrsAndConfirm('8', 6, 0, input, request);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].init?.method, 'PUT');
  assert.equal(result.row.versi, 1);
  assert.equal(result.rows[0].validasi_lrs_id, 31);
});

test('Stage 4 road adapter reads only valid package-road rows', async () => {
  const paths: string[] = [];
  const roads = await getStage4Roads('11', async <T>(path: string) => {
    paths.push(path);
    return { data: [{ ruas_id: 7, nama_ruas: 'Ruas uji' }] } as T;
  });
  assert.deepEqual(paths, ['/paket/11/ruas-jalan']);
  assert.equal(roads[0].ruas_id, 7);
  await assert.rejects(() => getStage4Roads('11', async <T>() => ({ data: [{ ruas_id: 0 }] }) as T), /ID yang sah/);
  await assert.rejects(() => getStage4Roads('11', async <T>() => ({ data: {} }) as T), /senarai dijangka/);
});

test('LRS readback rejects cross-package, malformed and mismatching persisted data', async () => {
  await assert.rejects(() => getStage4LrsRows('8', async <T>() => ({ data: [{ ...row(), paket_id: 9 }] }) as T), /cakupan paket/);
  await assert.rejects(() => getStage4LrsRows('8', async <T>() => ({ data: {} }) as T), /bukan array/);
  await assert.rejects(() => saveStage4LrsAndConfirm('8', 6, 0, input, async <T>(path, init) =>
    init?.method === 'PUT' ? ({ data: row() } as T) : ({ data: [{ ...row(), jumlah_error_topologi: 2 }] } as T)), /belum cocok saat dibaca ulang/);
});

test('version conflict is presented as reload-needed guidance', () => {
  assert.match(stage4LrsErrorMessage(new Error('40001 validasi LRS changed')), /Muat ulang/);
});
