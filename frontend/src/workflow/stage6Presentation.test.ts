import test from 'node:test';
import assert from 'node:assert/strict';
import { stage6TabsForRole, stage6MonitorTabsForRole, canAuthorStage6Note } from './stage6Presentation';

test('Penyedia selalu dapat menelusuri semua survei; IRI Semester II bukan tab utama',()=>{
  for(const iri of [true,false])assert.deepEqual(stage6TabsForRole('Penyedia Jasa / Ketua Tim',iri).map(x=>x.id),['overview','surveys','terms','documents']);
});
test('Balai memisahkan pemeriksaan, keputusan, dan dokumen',()=>{
  assert.deepEqual(stage6TabsForRole('PIC Balai / Pengguna Jasa',true).map(x=>x.id),['overview','criteria','decision','documents']);
});
test('Direktorat punya pengawasan dan catatan, Admin hanya administrasi',()=>{
  assert.deepEqual(stage6MonitorTabsForRole('Direktorat / Pusat').map(x=>x.id),['overview','audit','notes','documents']);
  assert.deepEqual(stage6MonitorTabsForRole('Admin').map(x=>x.id),['overview','terms','documents','history']);
  assert.equal(stage6MonitorTabsForRole('Admin').some(t=>t.id==='notes'||t.id==='audit'),false);
});

test('Hanya Direktorat boleh menulis catatan pengawasan Tahap 6',()=>{
  assert.equal(canAuthorStage6Note('Direktorat / Pusat'),true);
  assert.equal(canAuthorStage6Note('Admin'),false);
  assert.equal(canAuthorStage6Note('PIC Balai / Pengguna Jasa'),false);
  assert.equal(canAuthorStage6Note('Penyedia Jasa / Ketua Tim'),false);
});
