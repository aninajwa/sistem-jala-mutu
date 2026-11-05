import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateDashboard } from './dashboardMetrics';
import type { OperationalWorkflowState } from '../workflow/model';

function packageState(balai:string, surveyType:'IRI'|'PCI', status:'Terbuka'|'Ditutup'): OperationalWorkflowState {
 return {project:{balai,packageName:`Paket ${balai}`,surveyTypes:[surveyType]},corrections:[{status}],dailyRecords:[{id:'1',date:'2026-11-01',surveyType,state:'Tercatat'}],audits:[{status:'Dalam Review'}],acceptance:{finalAcceptance:false}} as unknown as OperationalWorkflowState;
}
test('menghitung hanya paket yang diberikan dan filter Balai/jenis survei',()=>{
 const data={a:packageState('Balai A','IRI','Terbuka'),b:packageState('Balai B','PCI','Ditutup')};
 const result=aggregateDashboard(data,'Direktorat / Pusat','Balai A','IRI');
 assert.equal(result.packages,1);
 assert.equal(result.balai,1);
 assert.equal(result.correctionsOpen,1);
 assert.equal(result.dailyRecords,1);
 assert.equal(result.bySurvey[0].name,'IRI');
});
test('tidak membuat metrik atau titik data fiktif ketika kosong',()=>{
 const result=aggregateDashboard({},'Penyedia Jasa / Ketua Tim');
 assert.equal(result.packages,0);
 assert.deepEqual(result.trend,[]);
 assert.deepEqual(result.byBalai,[]);
});

test('filter periode hanya membatasi rekaman survei, bukan menyembunyikan status paket',()=>{
 const data={a:packageState('Balai A','IRI','Terbuka')};
 const r=aggregateDashboard(data,'PIC Balai / Pengguna Jasa','Semua Balai','Semua','Semester I 2027');
 assert.equal(r.packages,1);
 assert.equal(r.correctionsOpen,1);
 assert.equal(r.dailyRecords,0);
 assert.deepEqual(r.trend,[]);
});
test('rekaman dalam periode yang dipilih tetap dihitung',()=>{
 const data={a:packageState('Balai A','IRI','Terbuka')};
 const r=aggregateDashboard(data,'PIC Balai / Pengguna Jasa','Semua Balai','Semua','Tahun 2027');
 assert.equal(r.dailyRecords,0);
 const r2=aggregateDashboard(data,'PIC Balai / Pengguna Jasa','Semua Balai','Semua','Semua periode');
 assert.equal(r2.dailyRecords,1);
});

test('pilihan tahun dan bulan dinamis membatasi rekaman tanpa mengubah status kasus',()=>{
 const data={a:packageState('Balai A','IRI','Terbuka')};
 assert.equal(aggregateDashboard(data,'PIC Balai / Pengguna Jasa','Semua Balai','Semua','Tahun 2026').dailyRecords,1);
 assert.equal(aggregateDashboard(data,'PIC Balai / Pengguna Jasa','Semua Balai','Semua','Bulan 2026-11').dailyRecords,1);
 const r=aggregateDashboard(data,'PIC Balai / Pengguna Jasa','Semua Balai','Semua','Bulan 2026-10');
 assert.equal(r.dailyRecords,0);
 assert.equal(r.correctionsOpen,1);
});

test('filter jenis survei tidak menyembunyikan paket atau kasus yang tidak memiliki atribusi jenis survei',()=>{
 const data={a:packageState('Balai A','IRI','Terbuka'),b:packageState('Balai B','PCI','Ditutup')};
 const r=aggregateDashboard(data,'Direktorat / Pusat','Semua Balai','IRI');
 assert.equal(r.packages,2);
 assert.equal(r.correctionsOpen,1);
 assert.equal(r.correctionsClosed,1);
 assert.equal(r.dailyRecords,1);
 assert.deepEqual(r.bySurvey.map(x=>x.name),['IRI']);
});


test('menampilkan hanya keputusan eksplisit review per jenis dan tahap, tanpa menganggapnya penerimaan akhir',()=>{
 const p=packageState('Balai A','IRI','Terbuka');
 p.cycle={surveyReviews:{IRI:{decision:'Sesuai',note:'Review IRI',reviewedAt:'2026-11-02'}},reviewPendingTypes:[]} as OperationalWorkflowState['cycle'];
 p.submission={stagedReviews:{IRI:{decision:'Temuan',note:'Perlu cek ulang',reviewedAt:'2026-11-03'}}} as OperationalWorkflowState['submission'];
 const result=aggregateDashboard({a:p},'PIC Balai / Pengguna Jasa');
 assert.equal(result.surveyReviews.length,2);
 assert.deepEqual(result.surveyReviews.map(x=>x.stage).sort(),['Review berkala','V&V bertahap']);
 assert.equal(result.accepted,0);
});
test('review yang menunggu ulang, belum diperiksa, atau tanpa tanggal tidak dianggap keputusan sah',()=>{
 const p=packageState('Balai A','IRI','Terbuka');
 p.project.surveyTypes=['IRI','PCI'];
 p.cycle={surveyReviews:{IRI:{decision:'Sesuai',note:'Lama',reviewedAt:'2026-11-02'},PCI:{decision:'Belum Diperiksa',note:'',reviewedAt:'2026-11-02'}},reviewPendingTypes:['IRI']} as OperationalWorkflowState['cycle'];
 p.submission={stagedReviews:{PCI:{decision:'Temuan',note:'',reviewedAt:''}}} as OperationalWorkflowState['submission'];
 assert.deepEqual(aggregateDashboard({a:p},'PIC Balai / Pengguna Jasa').surveyReviews,[]);
});
