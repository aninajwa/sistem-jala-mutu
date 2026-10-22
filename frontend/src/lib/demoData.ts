import { localPersistence } from '../workflow/repository/localPersistence';
import type { DemoStore } from '../types';

export const DEMO_STORE_KEY = 'road-qaqc-local-v1';
export const DEMO_SESSION_KEY = 'jala-mutu-demo-session-v1';

export const balais = ['Balai Sumatera Utara','Balai Jawa Barat','Balai Kalimantan Timur','Balai Sulawesi Selatan','Balai Nusa Tenggara'];
export const surveiTypes = ['IRI','PCI','Lendutan','Jembatan','Lereng','Drainase','Lalu Lintas','RNI'];
export const demoStoreSeed:DemoStore = {
 surveys:[
  {id:'SRV-0271',balai:balais[0],ruas:'Medan – Binjai',jenis:'IRI',tanggal:'2027-06-14',alat:'Profilometer Laser',status:'Lulus',hasil:'IRI 2,14 m/km',km:42.8},
  {id:'SRV-0270',balai:balais[1],ruas:'Bandung – Cileunyi',jenis:'PCI',tanggal:'2027-06-13',alat:'Kamera Survei',status:'Verifikasi',hasil:'PCI 78,2',km:31.4},
  {id:'SRV-0269',balai:balais[2],ruas:'Samarinda – Tenggarong',jenis:'Drainase',tanggal:'2027-06-12',alat:'Video Log',status:'Perlu Perbaikan',hasil:'4 anomali',km:26.1},
  {id:'SRV-0268',balai:balais[3],ruas:'Makassar – Maros',jenis:'Lendutan',tanggal:'2027-06-11',alat:'FWD Dynatest',status:'Lulus',hasil:'0,42 mm',km:38.6},
  {id:'SRV-0267',balai:balais[0],ruas:'Pematang Siantar – Parapat',jenis:'IRI',tanggal:'2027-06-10',alat:'Profilometer Laser',status:'Draft',hasil:'Menunggu hasil',km:54.2},
  {id:'SRV-0266',balai:balais[4],ruas:'Mataram – Praya',jenis:'Jembatan',tanggal:'2027-06-09',alat:'Total Station',status:'Lulus',hasil:'Baik',km:19.7},
  {id:'SRV-0265',balai:balais[1],ruas:'Cirebon – Kuningan',jenis:'PCI',tanggal:'2027-06-08',alat:'Kamera Survei',status:'Perlu Perbaikan',hasil:'PCI 51,6',km:29.3}
 ],
 findings:[
  {id:'TP-027-013',ruas:'Samarinda – Tenggarong',jenis:'Kelengkapan dokumen',prioritas:'Tinggi',status:'Diusulkan',pic:'Rizal Hidayat',due:'2027-06-20'},
  {id:'TP-027-012',ruas:'Cirebon – Kuningan',jenis:'Nilai di luar rentang',prioritas:'Kritis',status:'Dilaksanakan',pic:'Siti Rahma',due:'2027-06-18'},
  {id:'TP-027-011',ruas:'Pematang Siantar – Parapat',jenis:'Kalibrasi alat',prioritas:'Sedang',status:'Verifikasi Ulang',pic:'Budi Santoso',due:'2027-06-21'},
  {id:'TP-027-010',ruas:'Bandung – Cileunyi',jenis:'Konsistensi data',prioritas:'Rendah',status:'Selesai',pic:'Nina Anggraini',due:'2027-06-11'},
  {id:'TP-027-009',ruas:'Makassar – Maros',jenis:'Metode pengukuran',prioritas:'Sedang',status:'Disetujui',pic:'Agus Kurniawan',due:'2027-06-19'}
 ],
 docs:[
  {id:'DOC-104',nama:'Sertifikat Kalibrasi Profilometer.pdf',kategori:'Kalibrasi',versi:'v2.1',status:'Lengkap'},
  {id:'DOC-103',nama:'Hasil Validasi Lapangan.xlsx',kategori:'Validasi',versi:'v1.4',status:'Lengkap'},
  {id:'DOC-102',nama:'Verifikasi Berkala Juni.pdf',kategori:'Verifikasi berkala',versi:'v1.3',status:'Perlu Dilengkapi'},
   {id:'DOC-101',nama:'Berita Acara Survei.jpg',kategori:'Berita acara',versi:'v1.0',status:'Lengkap'},
   {id:'DOC-100',nama:'Foto Pendukung Survei Medan – Binjai.zip',kategori:'Bukti pendukung',versi:'v1.0',status:'Lengkap'}
 ],
 logs:[
  {id:'LOG-0281',waktu:'14 Jun 2027 14:32',pengguna:'D. Prasetyo',aktivitas:'Validasi data survei',objek:'SRV-0271 · Medan – Binjai',hasil:'Berhasil'},
  {id:'LOG-0280',waktu:'14 Jun 2027 13:47',pengguna:'N. Anggraini',aktivitas:'Ubah status temuan',objek:'TP-027-010',hasil:'Berhasil'},
  {id:'LOG-0279',waktu:'14 Jun 2027 11:20',pengguna:'B. Santoso',aktivitas:'Unggah dokumen mutu',objek:'Sertifikat Kalibrasi',hasil:'Berhasil'},
  {id:'LOG-0278',waktu:'13 Jun 2027 16:08',pengguna:'R. Hidayat',aktivitas:'Ajukan verifikasi',objek:'SRV-0270 · Bandung – Cileunyi',hasil:'Berhasil'}
 ]
};

export const periodeOptions = ['Semester I 2027','Triwulan II 2027','Juni 2027','Mei 2027','Tahun 2027'];

export function loadDemoStore():DemoStore {
 try {
  const saved=localPersistence.getItem(DEMO_STORE_KEY);
  if(saved){
   const parsed=JSON.parse(saved) as Partial<DemoStore>;
   const docs=parsed.docs||demoStoreSeed.docs;
   const proofDoc=demoStoreSeed.docs.find(d=>d.kategori==='Bukti pendukung');
   return {...demoStoreSeed,...parsed,docs:proofDoc&&!docs.some(d=>d.id===proofDoc.id)?[...docs,proofDoc]:docs};
  }
 } catch { /* demo data fallback */ }
 return demoStoreSeed;
}
