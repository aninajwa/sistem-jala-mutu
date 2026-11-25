import test from 'node:test';
import assert from 'node:assert/strict';
import { submissionProblems, canSubmitHandover, canReviewHandover, applyHandoverSubmission, applyHandoverReview, handoverLinkProblems, type HandoverRecord } from './stage6Handover';

const sample:HandoverRecord={id:'x',packageId:'p',survey:'IRI',scope:'Ruas 1',evidence:'BA audit',submittedAt:'2026-11-24T00:00:00Z',status:'Diajukan',version:1,events:[]};
test('Penyerahan per survei mensyaratkan data dan bukti QAQC serta audit yang berlaku',()=>{
 assert.equal(submissionProblems('IRI','Ruas 1','BA',1,true).length,0);
 assert.equal(submissionProblems('IRI','','',0,false).length,4);
 assert.equal(canSubmitHandover('Penyedia Jasa / Ketua Tim',[],undefined),true);
 assert.equal(canSubmitHandover('Penyedia Jasa / Ketua Tim',[],sample),false);
});
test('Penyerahan dapat diajukan ulang setelah dikembalikan tanpa menghapus riwayat',()=>{
 const returned={...sample,status:'Perlu Perbaikan' as const};
 assert.equal(canSubmitHandover('Penyedia Jasa / Ketua Tim',[],returned),true);
 assert.equal(canReviewHandover('PIC Balai / Pengguna Jasa',returned),false);
 assert.equal(canReviewHandover('PIC Balai / Pengguna Jasa',sample),true);
});
test('Admin dan Direktorat tidak bisa mengirim atau memeriksa penyerahan Balai',()=>{
 for(const role of ['Admin','Direktorat / Pusat'] as const){
  assert.equal(canSubmitHandover(role,[],undefined),false);
  assert.equal(canReviewHandover(role,sample),false);
 }
 assert.equal(canReviewHandover('Penyedia Jasa / Ketua Tim',sample),false);
});


test('perjalanan utuh Penyedia → Balai kembalikan → Penyedia ajukan ulang → Balai periksa tidak menghapus riwayat',()=>{
  const first=applyHandoverSubmission({role:'Penyedia Jasa / Ketua Tim',packageId:'p',survey:'IRI',scope:'Ruas A',evidence:'BA IRI',problems:[],at:'2026-11-25T01:00:00Z',eventId:'e1',recordId:'r1'});
  assert.equal(first.status,'Diajukan'); assert.equal(first.version,1);
  const returned=applyHandoverReview({role:'PIC Balai / Pengguna Jasa',record:first,action:'Kembalikan',reason:'Bukti validasi tidak lengkap',at:'2026-11-25T02:00:00Z',eventId:'e2'});
  assert.equal(returned.status,'Perlu Perbaikan'); assert.equal(first.status,'Diajukan');
  const resubmitted=applyHandoverSubmission({role:'Penyedia Jasa / Ketua Tim',packageId:'p',survey:'IRI',scope:'Ruas A diperbaiki',evidence:'BA revisi',problems:[],previous:returned,at:'2026-11-25T03:00:00Z',eventId:'e3',recordId:'unused'});
  assert.equal(resubmitted.id,first.id); assert.equal(resubmitted.version,2); assert.equal(resubmitted.events.length,3);
  assert.deepEqual(resubmitted.events.map(e=>e.action),['Ajukan','Kembalikan','Ajukan']);
  const checked=applyHandoverReview({role:'PIC Balai / Pengguna Jasa',record:resubmitted,action:'Periksa',reason:'',at:'2026-11-25T04:00:00Z',eventId:'e4'});
  assert.equal(checked.status,'Diperiksa'); assert.equal(checked.events.length,4);
  assert.deepEqual(handoverLinkProblems('p',['IRI'],[checked]),[]);
  assert.equal(checked.status==='Diperiksa',true); // not an official acceptance decision
});

test('keputusan penerimaan akhir prototipe harus mempunyai pengajuan diperiksa untuk semua jenis survei',()=>{
  const checked=applyHandoverReview({role:'PIC Balai / Pengguna Jasa',record:sample,action:'Periksa',reason:'',at:'2026-11-25T02:00:00Z',eventId:'e1'});
  assert.equal(handoverLinkProblems('p',['IRI','PCI'],[checked]).length,2); // sample has no Ajukan event; PCI missing
  const ready=applyHandoverSubmission({role:'Penyedia Jasa / Ketua Tim',packageId:'p',survey:'IRI',scope:'Ruas A',evidence:'BA',problems:[],at:'2026-11-25T01:00:00Z',eventId:'a1',recordId:'a'});
  const verified=applyHandoverReview({role:'PIC Balai / Pengguna Jasa',record:ready,action:'Periksa',reason:'',at:'2026-11-25T02:00:00Z',eventId:'a2'});
  assert.equal(handoverLinkProblems('p',['IRI','PCI'],[verified]).length,1);
  assert.equal(handoverLinkProblems('p',['IRI'],[verified]).length,0);
  assert.equal(handoverLinkProblems('other',['IRI'],[verified]).length,1);
});

test('peran terlarang, duplikat pengajuan, alasan kosong, dan pengajuan beda survei ditolak',()=>{
  const base=applyHandoverSubmission({role:'Penyedia Jasa / Ketua Tim',packageId:'p',survey:'IRI',scope:'Ruas A',evidence:'BA',problems:[],at:'2026-11-25T01:00:00Z',eventId:'a1',recordId:'a'});
  assert.throws(()=>applyHandoverSubmission({role:'Penyedia Jasa / Ketua Tim',packageId:'p',survey:'IRI',scope:'Ruas A',evidence:'BA',problems:[],previous:base,at:'2026-11-25T02:00:00Z',eventId:'a2',recordId:'z'}));
  assert.throws(()=>applyHandoverSubmission({role:'Admin',packageId:'p',survey:'IRI',scope:'Ruas A',evidence:'BA',problems:[],at:'2026-11-25T02:00:00Z',eventId:'a2',recordId:'z'}));
  assert.throws(()=>applyHandoverReview({role:'Direktorat / Pusat',record:base,action:'Periksa',reason:'',at:'2026-11-25T02:00:00Z',eventId:'a2'}));
  assert.throws(()=>applyHandoverReview({role:'PIC Balai / Pengguna Jasa',record:base,action:'Kembalikan',reason:'',at:'2026-11-25T02:00:00Z',eventId:'a2'}));
  const returned=applyHandoverReview({role:'PIC Balai / Pengguna Jasa',record:base,action:'Kembalikan',reason:'Perbaiki data',at:'2026-11-25T02:00:00Z',eventId:'a2'});
  assert.throws(()=>applyHandoverSubmission({role:'Penyedia Jasa / Ketua Tim',packageId:'p',survey:'PCI',scope:'Ruas A',evidence:'BA',problems:[],previous:returned,at:'2026-11-25T02:00:00Z',eventId:'a3',recordId:'a'}));
});

test('penyerahan yang baru dikirim belum cukup untuk penerimaan akhir',()=>{
  const pending=applyHandoverSubmission({role:'Penyedia Jasa / Ketua Tim',packageId:'p',survey:'IRI',scope:'Ruas A',evidence:'BA',problems:[],at:'2026-11-25T01:00:00Z',eventId:'a1',recordId:'a'});
  assert.ok(handoverLinkProblems('p',['IRI'],[pending]).length);
  const returned=applyHandoverReview({role:'PIC Balai / Pengguna Jasa',record:pending,action:'Kembalikan',reason:'Perbaiki bukti',at:'2026-11-25T02:00:00Z',eventId:'a2'});
  assert.ok(handoverLinkProblems('p',['IRI'],[returned]).length);
});
