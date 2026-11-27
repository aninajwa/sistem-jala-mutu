import test from 'node:test';
import assert from 'node:assert/strict';
import { canEditPreparationChecklist } from './preparationChecklistLock';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const provider = 'Penyedia Jasa / Ketua Tim';
const balai = 'PIC Balai / Pengguna Jasa';
const pusat = 'Direktorat / Pusat';
const admin = 'Admin';

test('Penyedia boleh mengisi Draft dan menindaklanjuti Perlu Revisi', () => {
  assert.equal(canEditPreparationChecklist(provider,'Draft'),true);
  assert.equal(canEditPreparationChecklist(provider,'Perlu Revisi'),true);
});
test('Pengajuan menunggu dan persetujuan Balai mengunci checklist Penyedia', () => {
  assert.equal(canEditPreparationChecklist(provider,'Diajukan'),false);
  assert.equal(canEditPreparationChecklist(provider,'Disetujui'),false);
});
test('Role lain tidak dapat mengisi checklist Penyedia dalam status apa pun', () => {
  for (const role of [balai,pusat,admin] as const)
    for (const status of ['Draft','Diajukan','Perlu Revisi','Disetujui','Ditolak'] as const)
      assert.equal(canEditPreparationChecklist(role,status),false,`${role} / ${status}`);
});
test('Semua checklist Tahap 0 menggunakan guard status, bukan sekadar pengecekan role', () => {
  const src=readFileSync(fileURLToPath(new URL('./stages/Stage0PreparationWorkspace.tsx',import.meta.url)),'utf8');
  assert.match(src,/canEditPreparationChecklist\(state\.role,\s*prep\.reportApproval\)/);
  assert.equal((src.match(/!canEditChecklist\s*,/g)??[]).length,4);
  assert.match(src,/<Stage0StepForm locked=\{!canEditChecklist\}/);
  assert.match(src,/!canEditChecklist && <div[^>]*role="status"/);
});
