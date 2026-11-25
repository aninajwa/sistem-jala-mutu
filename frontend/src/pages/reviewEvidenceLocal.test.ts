import test from 'node:test';
import assert from 'node:assert/strict';
import {localReviewAttachmentKey,checkLocalReviewEvidence} from './reviewEvidenceLocal';
test('hanya kunci lampiran eksplisit milik paket yang boleh diperiksa',()=>{
 assert.equal(localReviewAttachmentKey('paket-1','paket-1:form:bukti'),'paket-1:form:bukti');
 for(const ref of ['BA-01','paket-2:form:bukti','paket-1','paket-1:',' paket-1:form:bukti'])assert.equal(localReviewAttachmentKey('paket-1',ref),null);
});
test('keberadaan lokal bukan verifikasi dokumen maupun server',async()=>{
 let calls=0;
 const get=async()=>{calls++;return {file:new Blob(['bukti']) as File};};
 assert.equal(await checkLocalReviewEvidence('p','BA-01',get),'referensi-belum-terpetakan');
 assert.equal(calls,0);
 assert.equal(await checkLocalReviewEvidence('p','p:form:bukti',get),'tersedia-lokal');
 assert.equal(await checkLocalReviewEvidence('p','p:form:hilang',async()=>null),'tidak-tersedia-lokal');
 assert.equal(await checkLocalReviewEvidence('p','p:form:error',async()=>{throw Error('blocked');}),'tidak-dapat-diperiksa');
});
