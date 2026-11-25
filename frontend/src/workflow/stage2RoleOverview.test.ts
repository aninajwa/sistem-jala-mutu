import test from 'node:test';
import assert from 'node:assert/strict';
import { stage2RoleOverview } from './stage2RoleOverviewModel';

test('Penyedia diberi arahan mengisi serta mengajukan hasil, bukan memutuskan',()=>{
 const v=stage2RoleOverview('Penyedia Jasa / Ketua Tim','Draft',2,3);
 assert.match(v.title,/Lengkapi/); assert.match(v.actionLabel,/pengajuan/); assert.match(v.helper,/Belum siap/);
});
test('Penyedia mendapat arahan memperbaiki ketika dikembalikan',()=>{
 const v=stage2RoleOverview('Penyedia Jasa / Ketua Tim','Perlu Revisi',1,2);
 assert.match(v.actionLabel,/perbaikan/);
});
test('Balai meninjau, dengan status keputusan terpisah dari evaluasi sistem',()=>{
 const v=stage2RoleOverview('PIC Balai / Pengguna Jasa','Diajukan',0,2);
 assert.match(v.title,/Periksa/); assert.match(v.helper,/referensi BA/);
});
test('Balai tidak diarahkan menyetujui saat masih ada penghalang',()=>{
 const v=stage2RoleOverview('PIC Balai / Pengguna Jasa','Diajukan',2,1);
 assert.match(v.helper,/Persetujuan tertahan/);
});
test('Persetujuan lama yang kini gagal persyaratan bukan lulus baru',()=>{
 const v=stage2RoleOverview('PIC Balai / Pengguna Jasa','Disetujui',1,2);
 assert.match(v.status,/perlu pemeriksaan ulang/);assert.notEqual(v.tone,'success');
});
test('Direktorat tidak ditampilkan sebagai pengambil keputusan metode',()=>{
 const v=stage2RoleOverview('Direktorat / Pusat','Diajukan',0,2);
 assert.match(v.title,/Pantau/);assert.match(v.helper,/Tidak ada tindakan persetujuan/);
});
test('Admin hanya memantau, tanpa instruksi review teknis',()=>{
 const v=stage2RoleOverview('Admin','Diajukan',0,2);
 assert.match(v.title,/Pantau/);assert.match(v.helper,/tidak mengajukan maupun menyetujui/);
});
