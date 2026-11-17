import test from 'node:test';
import assert from 'node:assert/strict';
import { stage1RolePresentation } from './stage1RolePresentation';

test('Penyedia melihat arahan pengisian dan label Penyedia', () => {
  const x=stage1RolePresentation('Penyedia Jasa / Ketua Tim');
  assert.equal(x.badge,'PENYEDIA');
  assert.match(x.checklistHeading,/Isi checklist/);
});
test('Balai tidak mendapat instruksi mengisi checklist Penyedia', () => {
  const x=stage1RolePresentation('PIC Balai / Pengguna Jasa');
  assert.equal(x.badge,'PIC BALAI');
  assert.match(x.checklistHeading,/Lihat/);
  assert.match(x.description,/Tinjau/);
});
test('Direktorat ditampilkan sebagai pemantau, bukan pengisi', () => {
  const x=stage1RolePresentation('Direktorat / Pusat');
  assert.equal(x.badge,'DIREKTORAT');
  assert.match(x.description,/bukan formulir pengisian/);
});
test('Admin hanya mendapat informasi administrasi', () => {
  const x=stage1RolePresentation('Admin');
  assert.equal(x.badge,'ADMIN');
  assert.match(x.description,/tidak mengubah checklist/);
});
