import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { canEditPreparationChecklist } from './preparationChecklistLock';

const stage=fs.readFileSync(new URL('./stages/Stage0PreparationWorkspace.tsx',import.meta.url),'utf8');
const attachments=[...stage.matchAll(/<DocumentAttachments\b[^>]*\bscope=\{`\$\{state\.project\.id\}:stage0`\}[^>]*\/>/g)].map(m=>m[0]);

test('lampiran Penyedia mengikuti guard status; lampiran pemeriksa selalu baca saja',()=>{
 assert.equal(attachments.length,2);
 assert.match(attachments[0],/editable=\{canEditChecklist\}/);
 assert.match(attachments[1],/editable=\{false\}/);
 for(const attachment of attachments)assert.doesNotMatch(attachment,/editable=\{canPrepareInput\}/);
 assert.match(stage,/const canEditChecklist = canEditPreparationChecklist\(state\.role, prep\.reportApproval\)/);
});
test('Penyedia dapat melengkapi bukti pada Draft atau Perlu Revisi',()=>{
 for(const s of ['Draft','Perlu Revisi'] as const)assert.equal(canEditPreparationChecklist('Penyedia Jasa / Ketua Tim',s),true);
});
test('Penyedia tidak dapat mengganti lampiran ketika Diajukan atau Disetujui',()=>{
 for(const s of ['Diajukan','Disetujui'] as const)assert.equal(canEditPreparationChecklist('Penyedia Jasa / Ketua Tim',s),false);
});
test('Balai Direktorat Admin tidak dapat mengedit lampiran Tahap 0',()=>{
 for(const role of ['PIC Balai / Pengguna Jasa','Direktorat / Pusat','Admin'] as const)
 for(const status of ['Draft','Perlu Revisi','Diajukan','Disetujui'] as const)
 assert.equal(canEditPreparationChecklist(role,status),false);
});
