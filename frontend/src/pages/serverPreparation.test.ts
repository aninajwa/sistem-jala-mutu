import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildChecklistPayload,
  buildContractPatch,
  canEditPreparation,
  canSubmitPreparation,
  checklistDraft,
  contractDraft,
  groupChecklistItems,
  validatePreparationPdf,
  type ServerContract,
} from './serverPreparation';

const contract: ServerContract = {
  paket_id: 3,
  nama_paket: 'Paket Ujian',
  nomor_kontrak: 'UJIAN-001',
  balai_id: 1,
  tahun_anggaran: 2026,
  status: 'DRAFT',
  nama_ppk: 'PPK Lama',
  penyedia_id: null,
  tgl_spmk: '2026-10-17',
  tgl_selesai: null,
  nilai_kontrak: null,
  batas_lap_pendahuluan: null,
};

test('contract patch sends only supported changed fields and can clear optional values', () => {
  const draft = contractDraft(contract);
  const patch = buildContractPatch(contract, {
    ...draft,
    nama_paket: ' Paket Ujian Revisi ',
    nama_ppk: ' ',
    tgl_spmk: '',
  });
  assert.deepEqual(patch, {
    nama_paket: 'Paket Ujian Revisi',
    nama_ppk: null,
    tgl_spmk: null,
  });
  assert.equal('balai_id' in patch, false);
  assert.equal('status' in patch, false);
});

test('contract patch rejects invalid required values and calendar dates', () => {
  const draft = contractDraft(contract);
  assert.throws(() => buildContractPatch(contract, { ...draft, nama_paket: ' ' }), /Nama paket/);
  assert.throws(() => buildContractPatch(contract, { ...draft, tahun_anggaran: '2026.5' }), /Tahun anggaran/);
  assert.throws(() => buildContractPatch(contract, { ...draft, tgl_spmk: '2026-02-30' }), /Tanggal SPMK/);
});

test('checklist payload preserves item identity, null answers and trimmed notes', () => {
  const items = [
    { item_id: 1, jawaban: null, keterangan: null },
    { item_id: 2, jawaban: 'Tidak' as const, keterangan: 'Lama' },
  ];
  const draft = checklistDraft(items);
  draft[1] = { jawaban: 'Ya', keterangan: '  Bukti tersedia  ' };
  draft[2] = { jawaban: null, keterangan: '' };
  assert.deepEqual(buildChecklistPayload(items, draft), [
    { item_id: 1, jawaban: 'Ya', keterangan: 'Bukti tersedia' },
    { item_id: 2, jawaban: null },
  ]);
});

test('checklist items stay in server order and are grouped like the Dira interface', () => {
  const groups = groupChecklistItems([
    { item_id: 1, bagian: 'Telaah data awal', uraian: 'Survei lama', jawaban: null },
    { item_id: 2, bagian: 'Telaah data awal', uraian: 'BA verval', jawaban: 'Ya' },
    { item_id: 3, bagian: 'Rencana survei lapangan', uraian: 'Titik awal-akhir', jawaban: null },
  ]);
  assert.deepEqual(groups.map(group => [group.title, group.items.map(item => item.item_id)]), [
    ['Telaah data awal', [1, 2]],
    ['Rencana survei lapangan', [3]],
  ]);
});

test('preparation report accepts only a non-empty PDF up to 10 MB', () => {
  assert.doesNotThrow(() => validatePreparationPdf({
    name: 'laporan-pendahuluan.pdf', type: 'application/pdf', size: 1024,
  }));
  assert.throws(() => validatePreparationPdf({
    name: 'laporan.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 1024,
  }), /PDF/);
  assert.throws(() => validatePreparationPdf({
    name: 'kosong.pdf', type: 'application/pdf', size: 0,
  }), /kosong/);
  assert.throws(() => validatePreparationPdf({
    name: 'besar.pdf', type: 'application/pdf', size: 10 * 1024 * 1024 + 1,
  }), /10 MB/);
});

test('only provider can edit an open preparation record', () => {
  assert.equal(canEditPreparation('Penyedia Jasa / Ketua Tim', 'DRAFT', 'DRAFT'), true);
  assert.equal(canEditPreparation('Penyedia Jasa / Ketua Tim', 'DRAFT', 'PERLU_REVISI'), true);
  assert.equal(canEditPreparation('PIC Balai / Pengguna Jasa', 'DRAFT', 'DRAFT'), false);
  assert.equal(canEditPreparation('Penyedia Jasa / Ketua Tim', 'DRAFT', 'DIAJUKAN'), false);
  assert.equal(canEditPreparation('Penyedia Jasa / Ketua Tim', 'AKTIF', 'DRAFT'), false);
});

test('submission requires provider, open draft and linked preliminary report', () => {
  assert.equal(canSubmitPreparation('Penyedia Jasa / Ketua Tim', 'DRAFT', 'DRAFT', true), true);
  assert.equal(canSubmitPreparation('Penyedia Jasa / Ketua Tim', 'DRAFT', 'PERLU_REVISI', true), true);
  assert.equal(canSubmitPreparation('Penyedia Jasa / Ketua Tim', 'DRAFT', 'DRAFT', false), false);
  assert.equal(canSubmitPreparation('PIC Balai / Pengguna Jasa', 'DRAFT', 'DRAFT', true), false);
  assert.equal(canSubmitPreparation('Penyedia Jasa / Ketua Tim', 'DRAFT', 'DIAJUKAN', true), false);
});
