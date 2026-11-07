import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { nextChecklistAnswer } from '../workflow/WorkflowComponents';
import { PREPARATION_COORDINATION, PREPARATION_DOCUMENTS, PREPARATION_FIELD_PLAN, PREPARATION_SOURCE_REVIEWS } from '../workflow/model';

import {
  buildChecklistPayload,
  buildContractPatch,
  buildPreparationReviewPayload,
  canEditPreparation,
  canReviewPreparation,
  canSubmitPreparation,
  checklistDraft,
  contractDraft,
  groupChecklistItems,
  mapPreparationChecklist,
  patchChecklistThenRefetch,
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

test('only assigned-role UI can review a submitted preparation', () => {
  assert.equal(canReviewPreparation('PIC Balai / Pengguna Jasa', 'DRAFT', 'DIAJUKAN'), true);
  assert.equal(canReviewPreparation('Penyedia Jasa / Ketua Tim', 'DRAFT', 'DIAJUKAN'), false);
  assert.equal(canReviewPreparation('PIC Balai / Pengguna Jasa', 'DRAFT', 'PERLU_REVISI'), false);
  assert.equal(canReviewPreparation('PIC Balai / Pengguna Jasa', 'AKTIF', 'DIAJUKAN'), false);
});

test('review payload trims notes and requires a revision reason', () => {
  assert.deepEqual(buildPreparationReviewPayload(4, 'DISETUJUI', '  Sesuai  '), {
    expected_version: 4,
    keputusan: 'DISETUJUI',
    catatan: 'Sesuai',
  });
  assert.throws(() => buildPreparationReviewPayload(4, 'PERLU_REVISI', '   '), /wajib/);
  assert.throws(() => buildPreparationReviewPayload(4, 'DISETUJUI', 'x'.repeat(2001)), /2000/);
});

test('maps checklist only by exact server code, section, and proven Dirah label while preserving tri-state answers', () => {
  const rows = [
    { item_id: 101, kode: 'AWAL-01', bagian: 'Telaah data awal', uraian: 'Survei tahun sebelumnya', jawaban: 'Tidak' as const },
    { item_id: 102, kode: 'AWAL-02', bagian: 'Telaah data awal', uraian: 'BA verval jembatan 2024–2026', jawaban: null },
    { item_id: 103, kode: 'AWAL-03', bagian: 'Telaah data awal', uraian: 'PHO/FHO penanganan', jawaban: 'Ya' as const },
    { item_id: 104, kode: 'AWAL-04', bagian: 'Telaah data awal', uraian: 'Peta dan dataset lereng', jawaban: null },
    { item_id: 105, kode: 'LAP-01', bagian: 'Telaah data awal', uraian: 'wrong category', jawaban: null },
    { item_id: 999, kode: 'UNKNOWN', bagian: 'Persiapan', uraian: 'Unknown', jawaban: null },
  ];
  const result = mapPreparationChecklist(rows);
  assert.deepEqual(result.mapped.map(item => [item.code, item.itemId, item.answer]), [
    ['AWAL-01', 101, 'Tidak'], ['AWAL-02', 102, null], ['AWAL-03', 103, 'Ya'], ['AWAL-04', 104, null],
  ]);
  assert.ok(result.gaps.some(gap => gap.startsWith('LAP-01')));
  assert.ok(result.gaps.some(gap => gap.startsWith('UNKNOWN')));
});

test('all 25 applied backend preparation codes map to original Dirah labels and groups', () => {
  const codes = [
    ['Telaah data awal', 'AWAL', PREPARATION_SOURCE_REVIEWS],
    ['Rencana lapangan', 'LAP', PREPARATION_FIELD_PLAN],
    ['Koordinasi', 'KOOR', PREPARATION_COORDINATION],
    ['Dokumen persiapan', 'DOK', PREPARATION_DOCUMENTS],
  ] as const;
  let itemId = 500;
  const rows = codes.flatMap(([bagian, prefix, labels]) => labels.map((uraian, index) => ({
    item_id: itemId++,
    kode: `${prefix}-${String(index + 1).padStart(2, '0')}`,
    bagian,
    uraian,
    jawaban: null,
  })));
  const result = mapPreparationChecklist(rows);
  assert.equal(rows.length, 25);
  assert.equal(result.mapped.length, 25);
  assert.deepEqual(result.gaps, []);
  assert.deepEqual(result.mapped.map(item => item.label), [...PREPARATION_SOURCE_REVIEWS, ...PREPARATION_FIELD_PLAN, ...PREPARATION_COORDINATION, ...PREPARATION_DOCUMENTS]);
});

test('PATCH is followed by authoritative GET; conflicts and validation errors never become success', async () => {
  const sequence: string[] = [];
  const state = await patchChecklistThenRefetch(async () => { sequence.push('PATCH'); }, async () => { sequence.push('GET'); return { answer: 'Ya' }; });
  assert.deepEqual(sequence, ['PATCH', 'GET']); assert.deepEqual(state, { answer: 'Ya' });
  await assert.rejects(() => patchChecklistThenRefetch(async () => { throw Object.assign(new Error('version conflict'), { status: 409 }); }, async () => { throw new Error('must not refetch'); }), error => (error as {status:number}).status === 409);
  await assert.rejects(() => patchChecklistThenRefetch(async () => { throw Object.assign(new Error('validation'), { status: 400 }); }, async () => null), error => (error as {status:number}).status === 400);
});

test('submit readiness remains disabled when official server gate is inactive', async () => {
  const [stage, contract, sqlReference] = await Promise.all([
    readFile(new URL('../workflow/stages/Stage0PreparationWorkspace.tsx', import.meta.url), 'utf8'),
    readFile(new URL('./serverPreparation.ts', import.meta.url), 'utf8'),
    readFile(new URL('../../../backend/db-reference/checklist-persiapan-applied.sql', import.meta.url), 'utf8'),
  ]);
  assert.match(contract, /validasi_kelengkapan_resmi_aktif/);
  assert.match(sqlReference, /'syarat_submit_aktif',false/);
  assert.match(stage, /Pengajuan rasmi dinonaktifkan kerana syarat submit server belum aktif/);
  assert.match(stage, /!!server \|\| complete !== allItems\.length/);
});

test('Dirah checkbox interaction cycles through Ya, Tidak, and unanswered without conflating values', () => {
  assert.equal(nextChecklistAnswer(null), 'Ya');
  assert.equal(nextChecklistAnswer('Ya'), 'Tidak');
  assert.equal(nextChecklistAnswer('Tidak'), null);
});

test('authenticated stage keeps Dirah gate and role-card structure, with tri-state checkbox affordance and no local persistence', async () => {
  const [stage, workflowComponents, workspace] = await Promise.all([
    readFile(new URL('../workflow/stages/Stage0PreparationWorkspace.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../workflow/WorkflowComponents.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../workflow/OperationalWorkflowWorkspace.tsx', import.meta.url), 'utf8'),
  ]);
  for (const marker of ['Kesiapan menuju Kalibrasi & Validasi Awal', 'workflow-role-block provider', 'INPUT PENYEDIA', 'Telaah data awal', 'Rencana survei lapangan', 'Koordinasi & uji kesiapan', 'Dokumen pendahuluan', 'Pengajuan ke PIC Balai', 'Review Persiapan']) assert.ok(stage.includes(marker), `missing Dirah structure ${marker}`);
  assert.match(workflowComponents, /indeterminate=item\.onAnswer!==undefined&&item\.answer==='Tidak'/);
  assert.match(workflowComponents, /data-answer=\{item\.onAnswer\?/);
  assert.match(workspace, /DraftPersistenceBoundary enabled=\{false\}/);
  assert.match(stage, /server \? officialServerReady : complete === allItems\.length/);
  assert.match(stage, /server \? false : complete === allItems\.length/);
});
