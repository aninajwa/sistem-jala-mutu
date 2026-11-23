import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCorrectionCases, mapCorrectionRpcError } from './serverCorrectionData';
import { readFile } from 'node:fs/promises';

const serverDashboard = await readFile(new URL('./ServerCorrectionDashboard.tsx', import.meta.url), 'utf8');

test('Correction response mapping reads case and correction identity without fabricating evidence or decision', () => {
  const mapped = normalizeCorrectionCases([{ kasus_temuan: { kasus_id: 2, status: 'Menunggu Persetujuan', uraian: 'Temuan', tingkat: 'Mayor' }, koreksi_data: [{ koreksi_data: { koreksi_id: 7, bukti: null, keputusan: null }, verifikasi_koreksi: [] }], tindakan_perbaikan: [], riwayat_status_kasus: [] }], '9');
  assert.equal(mapped.length, 1);
  assert.equal(mapped[0].correctionId, 7);
  assert.equal(mapped[0].packageId, '9');
  assert.equal(mapped[0].data.bukti, null);
  assert.equal(mapped[0].data.keputusan, null);
  assert.throws(() => normalizeCorrectionCases([{ kasus_temuan: { kasus_id: 3, status: 'APPROVED' }, koreksi_data: [] }], '9'), /tidak sesuai kontrak/);
});

test('Correction RPC errors explain stale versions, missing contracts and authorization distinctly', () => {
  assert.match(mapCorrectionRpcError(new Error('40001 version changed')), /Muat ulang detail/);
  assert.match(mapCorrectionRpcError(new Error('PGRST202 schema cache')), /Tidak ada perubahan yang disimpan/);
  assert.match(mapCorrectionRpcError(new Error('42501')), /tidak berwenang/);
});

test('authenticated Correction view preserves role-specific controls and visibly gates unavailable writes', () => {
  assert.match(serverDashboard, /data-testid="correction-disabled"/);
  assert.match(serverDashboard, /capability\.write/);
  assert.match(serverDashboard, /role !== 'Penyedia Jasa \/ Ketua Tim'/);
  assert.match(serverDashboard, /role !== 'PIC Balai \/ Pengguna Jasa'/);
  assert.match(serverDashboard, /submitCorrectionAndReadBack/);
  assert.match(serverDashboard, /reviewCorrectionAndReadBack/);
});
