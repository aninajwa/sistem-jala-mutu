import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { preparationSubmissionEligibility } from './preparationSubmissionPolicy';

test('Draft lengkap dapat diajukan', () => assert.equal(preparationSubmissionEligibility('Draft', 8, 8).allowed, true));
test('Revisi yang sudah lengkap boleh diajukan kembali', () => assert.equal(preparationSubmissionEligibility('Perlu Revisi', 8, 8).allowed, true));
test('Persetujuan Balai tidak boleh ditimpa pengajuan ulang', () => {
 const result = preparationSubmissionEligibility('Disetujui', 8, 8);
 assert.equal(result.allowed, false);
 assert.match(result.reason, /disetujui/i);
});
test('Pengajuan yang sedang menunggu review tidak dapat dikirim dua kali', () => assert.equal(preparationSubmissionEligibility('Diajukan', 8, 8).allowed, false));
test('Checklist belum lengkap tetap memblokir pengajuan', () => assert.equal(preparationSubmissionEligibility('Perlu Revisi', 7, 8).allowed, false));
test('Paket tanpa checklist tidak dianggap lengkap', () => assert.equal(preparationSubmissionEligibility('Draft', 0, 0).allowed, false));
test('Guard digunakan pada fungsi dan tombol Tahap 0', () => {
 const source = readFileSync(new URL('./stages/Stage0PreparationWorkspace.tsx', import.meta.url), 'utf8');
 assert.match(source, /preparationSubmissionEligibility\(prep\.reportApproval,\s*complete,\s*allItems\.length\)/);
 assert.match(source, /disabled=\{\s*!preparationSubmissionEligibility\(/);
});
