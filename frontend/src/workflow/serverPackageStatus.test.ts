import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  preparationStageFact,
  stage1ConfirmationFact,
  stage2PackageFact,
  serverStageFactFor,
  stageTilePresentation,
  UNKNOWN_AGGREGATE_STATUS, finalStagesFacts } from './serverPackageStatus';

test('server-backed preparation approval remains visible when aggregate status is unknown', () => {
  const preparation = preparationStageFact({ submissionStatus: 'DISETUJUI' });
  assert.equal(preparation.state, 'complete');
  assert.equal(preparation.label, 'Persiapan disetujui');
  assert.equal(UNKNOWN_AGGREGATE_STATUS, 'Status keseluruhan belum tersedia');
});

test('loading, failed, pending, and unknown server stage states stay distinct', () => {
  assert.equal(preparationStageFact({ loading: true }).state, 'loading');
  assert.equal(preparationStageFact({ error: true }).state, 'error');
  assert.equal(preparationStageFact({ submissionStatus: 'DIAJUKAN' }).state, 'pending');
  assert.equal(preparationStageFact({ checklistStatus: 'DRAFT' }).state, 'pending');
  assert.equal(preparationStageFact({}).state, 'unknown');
});

test('Tahap 1 completes only from the current server-approved PIC snapshot with the Tahap 2 gate', () => {
  const approved = stage1ConfirmationFact({
    active: true, status: 'DISETUJUI', snapshotMatches: true, stage2Allowed: true,
  });
  assert.deepEqual(approved, { state: 'complete', label: 'Dikonfirmasi PIC · Tahap 2 diizinkan' });
  for (const incomplete of [
    { active: false, status: 'DISETUJUI', snapshotMatches: true, stage2Allowed: true },
    { active: true, status: 'DISETUJUI', snapshotMatches: false, stage2Allowed: false },
    { active: true, status: 'DISETUJUI', snapshotMatches: true, stage2Allowed: false },
    { active: true, status: 'DIAJUKAN', snapshotMatches: true, stage2Allowed: false },
  ]) assert.notEqual(stage1ConfirmationFact(incomplete).state, 'complete');
  assert.equal(stage1ConfirmationFact({ loading: true }).state, 'loading');
  assert.equal(stage1ConfirmationFact({ error: true }).state, 'error');
});

test('opening a rail page does not infer completion for an unmapped stage', () => {
  const stage5 = serverStageFactFor('Tahap 5', { 'Tahap 0': { state: 'complete', label: 'Persiapan disetujui' } });
  assert.deepEqual(stage5, { state: 'unknown', label: 'Belum diverifikasi' });
});

test('Tahap 2 uses the backend package-wide result and preserves unavailable/partial states', () => {
  const partial = stage2PackageFact({
    completion: {
      state: 'partial', approved_count: 1, total_count: 2,
      label: '1/2 jenis survei disetujui · Menunggu PCI',
    },
  });
  assert.deepEqual(partial, { state: 'pending', label: '1/2 jenis survei disetujui · Menunggu PCI' });

  const complete = stage2PackageFact({
    completion: { state: 'complete', approved_count: 2, total_count: 2, label: 'Selesai · 2/2 jenis survei' },
  });
  assert.deepEqual(complete, { state: 'complete', label: 'Selesai · 2/2 jenis survei' });
  const tile = stageTilePresentation('Tahap 2', 'Validasi Produksi', complete, true);
  assert.equal(tile.showCompletionIcon, true);
  assert.equal(tile.ariaCurrent, 'step');

  const unavailable = stage2PackageFact({
    completion: { state: 'unavailable', approved_count: null, total_count: null, label: 'Belum tersedia · skop survei rasmi belum ditetapkan' },
  });
  assert.deepEqual(unavailable, { state: 'unknown', label: 'Belum tersedia · skop survei rasmi belum ditetapkan' });
  assert.equal(stage2PackageFact({ loading: true }).state, 'loading');
  assert.equal(stage2PackageFact({ error: true }).state, 'error');
});

test('completed stage styling stays complete when a different page is selected', () => {
  const tile = stageTilePresentation('Tahap 0', 'Persiapan', {
    state: 'complete',
    label: 'Persiapan disetujui',
  }, false);
  assert.equal(tile.state, 'complete');
  assert.equal(tile.ariaCurrent, undefined);
  assert.equal(tile.showCompletionIcon, true);
  assert.equal('visibleFact' in tile, false);
  assert.match(tile.accessibleLabel, /Persiapan disetujui/);
});

test('selected completed stage keeps both completion and current-page semantics', () => {
  const tile = stageTilePresentation('Tahap 0', 'Persiapan', {
    state: 'complete',
    label: 'Persiapan disetujui',
  }, true);
  assert.equal(tile.state, 'complete');
  assert.equal(tile.ariaCurrent, 'step');
  assert.equal(tile.showCompletionIcon, true);
  assert.match(tile.accessibleLabel, /halaman dibuka.*Persiapan disetujui/);
});

test('tiles omit visible status phrases but retain status in accessible labels', () => {
  const tile = stageTilePresentation('Tahap 2', 'Validasi Produksi', {
    state: 'unknown',
    label: 'Belum diverifikasi',
  }, false);
  assert.equal(tile.showCompletionIcon, false);
  assert.match(tile.accessibleLabel, /Belum diverifikasi/);
});

test('pending and correction status remain available to assistive technology without a visible phrase', () => {
  for (const label of ['Menunggu review PIC', 'Perlu revisi']) {
    const tile = stageTilePresentation('Tahap 1', 'Kalibrasi', { state: 'pending', label }, false);
    assert.equal(tile.showCompletionIcon, false);
    assert.match(tile.accessibleLabel, new RegExp(label));
  }
});

test('Tahap 4-6 rail facts turn complete only from server progress', () => {
  const base = { status_paket: 'DRAFT', tahap4: 'DRAFT' as const, audit: {}, koreksi_audit_terbuka: 0, termin_selesai: 0, termin_total: 4, penerimaan_akhir: false };
  assert.equal(finalStagesFacts(base)['Tahap 4']?.state, 'unknown');
  const done = finalStagesFacts({ ...base, status_paket: 'SELESAI', tahap4: 'DISETUJUI', audit: { 1: 'Lulus', 2: 'Lulus', 3: 'Lulus' }, termin_selesai: 4, penerimaan_akhir: true });
  assert.deepEqual([done['Tahap 4']?.state, done['Tahap 5']?.state, done['Tahap 6']?.state], ['complete', 'complete', 'complete']);
  const midway = finalStagesFacts({ ...base, tahap4: 'DISETUJUI', audit: { 1: 'Lulus', 2: 'Ditolak' }, koreksi_audit_terbuka: 1, termin_selesai: 2 });
  assert.equal(midway['Tahap 5']?.state, 'blocked');
  assert.equal(midway['Tahap 6']?.label, '2/4 termin diterima');
  assert.equal(finalStagesFacts(null, false, true)['Tahap 6']?.state, 'error');
});

test('Tahap 3A/3B turn complete when Tahap 4 is approved and show progress before that', () => {
  const base = { status_paket: 'DRAFT', tahap4: 'DRAFT' as const, audit: {}, koreksi_audit_terbuka: 0, termin_selesai: 0, termin_total: 4, penerimaan_akhir: false, jumlah_sesi_survei: 1, jumlah_siklus_verval: 0 };
  const early = finalStagesFacts(base);
  assert.equal(early['Tahap 3A'], undefined, 'keeps the detailed session label until complete');
  assert.equal(early['Tahap 3B']?.state, 'unknown');
  assert.equal(finalStagesFacts({ ...base, jumlah_siklus_verval: 2 })['Tahap 3B']?.state, 'pending');
  const approved = finalStagesFacts({ ...base, tahap4: 'DISETUJUI' });
  assert.equal(approved['Tahap 3A']?.state, 'complete');
  assert.equal(approved['Tahap 3B']?.state, 'complete');
});

test('Tahap 3B is blocked while a verval cycle is held and counts accepted cycles', () => {
  const base = { status_paket: 'DRAFT', tahap4: 'DRAFT' as const, audit: {}, koreksi_audit_terbuka: 0, termin_selesai: 0, termin_total: 4, penerimaan_akhir: false, jumlah_sesi_survei: 1 };
  assert.equal(finalStagesFacts({ ...base, jumlah_siklus_verval: 2, verval_diterima: 1 })['Tahap 3B']?.label, '1/2 siklus verval diterima');
  assert.equal(finalStagesFacts({ ...base, jumlah_siklus_verval: 1, verval_ditahan: 1 })['Tahap 3B']?.state, 'blocked');
});
