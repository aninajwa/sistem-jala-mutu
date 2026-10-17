import { ShieldCheck } from 'lucide-react';
import type { WorkflowRole } from './model';

const LABELS:Record<string,{provider:string;balai:string;directorate:string}>={
  '/entry:Persiapan & SPMK':{provider:'Mengisi survei pendahuluan, ruang lingkup dan dokumen persiapan.',balai:'Meninjau dan memberi keputusan atas Laporan Pendahuluan.',directorate:'Monitoring bila diperlukan.'},
  '/documents:Kalibrasi & personel':{provider:'Mencatat alat, sertifikat, personel, pelatihan dan checklist per jenis survei.',balai:'Meninjau kesiapan/bukti sebelum metode disetujui.',directorate:'Monitoring.'},
  '/entry:Validasi produksi':{provider:'Menyiapkan hasil source/uji coba dan evidence per jenis survei.',balai:'Meninjau hasil system-check dan memberi keputusan alat/metode.',directorate:'Monitoring.'},
  '/entry:Survei harian':{provider:'Mencatat/melengkapi kegiatan harian, evidence, pemeriksaan alat dan faktor pengganggu.',balai:'Monitoring hasil kegiatan; bukan input utama.',directorate:'Monitoring.'},
  '/verification:Verval 14 hari':{provider:'Menyiapkan hasil konsistensi, checklist dan evidence periode.',balai:'Assurance/review berkala, catatan keputusan dan BA.',directorate:'Monitoring sebagai input audit tingkat pusat.'},
  '/entry:Gerbang RNI/LRS':{provider:'Menyiapkan paket data, dokumen mutu dan keterikatan RNI/LRS.',balai:'Melakukan verval bertahap/review sesuai kewenangan.',directorate:'Monitoring kesiapan sebelum audit.'},
  '/verification:Audit tingkat 1–3':{provider:'Audit/kesiapan internal Tingkat 1.',balai:'Audit Tingkat 2.',directorate:'Audit Tingkat 3.'},
  '/reports:Penerimaan & termin':{provider:'Menyiapkan bukti, klarifikasi, laporan dan tindak lanjut.',balai:'Menilai kriteria penerimaan dan menerbitkan BA penerimaan.',directorate:'Monitoring hasil audit tingkat pusat dan status penerimaan.'},
};

export function StageOwnershipBanner({selection,role}:{selection:string;role:WorkflowRole}){
  const row=LABELS[selection]; if(!row)return null;
  const active=role==='Penyedia Jasa / Ketua Tim'?row.provider:role==='PIC Balai / Pengguna Jasa'?row.balai:role==='Direktorat / Pusat'?row.directorate:'Admin dapat meninjau seluruh tahap untuk kebutuhan administrasi tanpa menggantikan keputusan operasional.';
  return <div className="wf-callout" data-testid="stage-ownership"><strong><ShieldCheck size={12} style={{display:'inline',marginRight:5}}/>Peran aktif: {role}</strong><br/>{active}</div>;
}
