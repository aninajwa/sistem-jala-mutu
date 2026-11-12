import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessStage4Kak2026 } from './stage4KakAssessment';
import { getStage4LrsRows, type Stage4LrsRow } from './serverStage4LrsData';
import type { Stage4Request } from './serverStage4LrsData';

const row = (measured: number | null, reference: number | null): Stage4LrsRow => ({
  validasi_lrs_id: 1, paket_id: 11, ruas_id: 1, versi: 1,
  panjang_lapangan_m: measured, panjang_acuan_m: reference, jumlah_error_topologi: 0,
  format_sesuai_glossary: true, sta_konsisten_iri_pci_ldt: false,
  deviasi_m: null, status: null, tgl_valid: null,
});

test('KAK 2026 absolute length assessment handles 0, 30, 30.01 and 34 metre boundaries', () => {
  for (const [difference, category] of [
    [0, 'WITHIN_TOLERANCE'], [30, 'WITHIN_TOLERANCE'],
    [30.01, 'REMEASUREMENT_REQUIRED'], [34, 'REMEASUREMENT_REQUIRED'],
  ] as const) {
    const assessment = assessStage4Kak2026(row(1200 + difference, 1200));
    assert.equal(assessment.length.absoluteDifferenceM, difference);
    assert.equal(assessment.length.category, category);
    assert.equal(assessment.officialWorkflow, 'NOT_EVALUATED');
  }
});

test('existing synthetic package-11 observation calculates 34 m and requests remeasurement only', () => {
  const result = assessStage4Kak2026(row(1234, 1200));
  assert.equal(result.length.absoluteDifferenceM, 34);
  assert.equal(result.length.category, 'REMEASUREMENT_REQUIRED');
  assert.equal(result.officialWorkflow, 'NOT_EVALUATED');
});

test('missing, negative, non-finite and invalid length inputs are INCOMPLETE without a computed difference', () => {
  for (const input of [row(null, 100), row(100, null), row(-1, 100), row(Number.NaN, 100), row(Number.POSITIVE_INFINITY, 100)]) {
    const result = assessStage4Kak2026(input);
    assert.equal(result.length.category, 'INCOMPLETE');
    assert.equal(result.length.absoluteDifferenceM, null);
  }
});

test('topology, glossary and STA observations remain separate findings', () => {
  const result = assessStage4Kak2026({ ...row(1234, 1200), jumlah_error_topologi: 2, format_sesuai_glossary: false, sta_konsisten_iri_pci_ldt: true });
  assert.equal(result.topology.state, 'ISSUE_RECORDED');
  assert.equal(result.glossary.state, 'ISSUE_RECORDED');
  assert.equal(result.sta.state, 'OBSERVED_OK');
  assert.equal(result.length.category, 'REMEASUREMENT_REQUIRED');
});

test('persisted read adapter refreshes read-only data and preserves nullable observations', async () => {
  let calls = 0;
  const request: Stage4Request = async <T>(path: string, init?: RequestInit) => {
    calls++;
    assert.equal(path, '/paket/11/validasi-lrs');
    assert.equal(init?.method ?? 'GET', 'GET');
    return { data: [{ ...row(1234, 1200), jumlah_error_topologi: null, format_sesuai_glossary: null }] } as T;
  };
  const firstRead = await getStage4LrsRows('11', request);
  const first = assessStage4Kak2026(firstRead[0]);
  assert.equal(first.length.absoluteDifferenceM, 34);
  assert.equal(first.length.category, 'REMEASUREMENT_REQUIRED');
  assert.equal(first.topology.state, 'NOT_RECORDED');
  assert.equal(first.glossary.state, 'NOT_RECORDED');
  const refreshedRows = await getStage4LrsRows('11', request);
  assert.deepEqual(refreshedRows, firstRead);
  assert.equal(calls, 2);
});

test('assessment is role-independent read-only while LRS write remains Penyedia-only', async () => {
  const component = await (await import('node:fs/promises')).readFile(new URL('./ServerStage4Workspace.tsx', import.meta.url), 'utf8');
  assert.match(component, /assessStage4Kak2026\(currentValidation\)/);
  assert.match(component, /role !== 'Penyedia Jasa \/ Ketua Tim'/);
  assert.match(component, /fieldset disabled=\{!capabilities\.write \|\| role !== 'Penyedia Jasa \/ Ketua Tim'/);
  assert.doesNotMatch(component, /role === 'PIC Balai \/ Pengguna Jasa'.*stage4-kak-assessment/);
  assert.match(component, /Penilaian teknis panjang ruas/);
  assert.match(component, /bukan PASS\/FAIL workflow, status VALID SMD, persetujuan PIC, atau kelayakan Tahap 5/);
});
