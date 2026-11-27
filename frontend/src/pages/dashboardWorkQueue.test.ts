import test from 'node:test';
import assert from 'node:assert/strict';
import {INITIAL_WORKFLOW, type OperationalWorkflowState} from '../workflow/model';
import {dashboardWorkQueue} from './dashboardWorkQueue';
const P = 'Penyedia Jasa / Ketua Tim' as const;
const B = 'PIC Balai / Pengguna Jasa' as const;
const D = 'Direktorat / Pusat' as const;
const A = 'Admin' as const;
function fixture(): OperationalWorkflowState {const s = structuredClone(INITIAL_WORKFLOW);s.project.id='TEST-001';s.project.packageName='Paket uji';s.project.preparation.reportApproval='Draft';s.productionApproval='Draft';s.cycle.periodCompleted=false;s.corrections=[];s.acceptance.finalAcceptance=false;s.audits[1].status='Belum Dimulai';s.audits[2].status='Belum Dimulai';return s;}
const list = (s:OperationalWorkflowState,role:typeof P|typeof B|typeof D|typeof A)=>dashboardWorkQueue({[s.project.id]:s},role);
test('data kosong tidak mengada-adakan tugas atau paket',()=>assert.deepEqual(dashboardWorkQueue({},P),[]));
test('Penyedia melihat koreksi terbuka sebagai tindakan, bukan lulus',()=>{const s=fixture();s.corrections=[{id:'C-1',status:'Terbuka',blockedStage:'Validasi produksi'} as never];const q=list(s,P)[0];assert.equal(q.priority,'action');assert.match(q.label,/koreksi/i);});
test('Balai mendapat antrean saat laporan pendahuluan diajukan',()=>{const s=fixture();s.project.preparation.reportApproval='Diajukan';assert.equal(list(s,B)[0].priority,'action');assert.match(list(s,B)[0].label,/Balai/);});
test('Direktorat tidak menerima tugas audit pusat saat audit Balai belum lulus',()=>{const s=fixture();s.audits[2].status='Dalam Review';const q=list(s,D)[0];assert.equal(q.priority,'waiting');assert.match(q.label,/Balai/);});
test('Direktorat melihat proses audit tingkat 3 setelah audit Balai lulus',()=>{const s=fixture();s.audits[1].status='Lulus';s.audits[2].status='Dalam Review';assert.equal(list(s,D)[0].priority,'action');});
test('Admin tidak memperoleh tugas keputusan teknis walau ada pengajuan',()=>{const s=fixture();s.project.preparation.reportApproval='Diajukan';s.audits[1].status='Dalam Review';assert.equal(list(s,A)[0].priority,'monitor');});
test('Tidak mengubah state sumber ketika menghitung antrian',()=>{const s=fixture();const before=JSON.stringify(s);list(s,B);assert.equal(JSON.stringify(s),before);});

test('Penyedia melihat kasus yang sudah diajukan sebagai pekerjaan pemeriksa', () => {
  const state = fixture();
  state.corrections = [{
    id: 'C-1',
    status: 'Menunggu Persetujuan',
    blockedStage: 'Tahap 3B',
  } as OperationalWorkflowState['corrections'][number]];
  assert.equal(list(state, P)[0].priority, 'waiting');
});


test('Persetujuan produksi lama yang syaratnya tidak berlaku lagi menjadi tugas Penyedia', () => {
  const state = fixture();
  state.productionApproval = 'Disetujui';
  state.productionApprovalBa = 'BA-TEST-01';
  const queue = list(state, P)[0];
  assert.equal(queue.priority, 'action');
  assert.match(queue.label, /validasi produksi/i);
});

test('Balai melihat persetujuan produksi lama yang perlu diperiksa ulang', () => {
  const state = fixture();
  state.productionApproval = 'Disetujui';
  state.productionApprovalBa = 'BA-TEST-01';
  const queue = list(state, B)[0];
  assert.equal(queue.priority, 'action');
  assert.match(queue.label, /periksa ulang/i);
});

 test('Balai and Directorate work queues follow the correction reviewer, not audit gate status',()=>{
 const s=fixture();
 s.corrections=[{id:'A3',status:'Menunggu Persetujuan',blockedStage:'Audit tingkat 3'} as never];
 assert.equal(list(s,B)[0].priority,'action');
 assert.equal(list(s,D)[0].priority,'waiting');
 s.corrections=[{...s.corrections[0],status:'Dilaksanakan'}];
 assert.equal(list(s,D)[0].priority,'action');
 assert.equal(list(s,B)[0].priority,'monitor');
 assert.equal(list(s,A)[0].priority,'monitor');
 s.corrections=[{...s.corrections[0],status:'Verifikasi Ulang',retest:'Lulus'}];
 assert.equal(list(s,D)[0].priority,'action');
 s.corrections=[{...s.corrections[0],status:'Ditutup'}];
 assert.equal(list(s,D)[0].priority,'waiting');
 });
