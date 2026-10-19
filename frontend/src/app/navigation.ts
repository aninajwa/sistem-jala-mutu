export const titleFor:Record<string,string> = {'/':'Dashboard QA/QC Survei Kondisi Jalan','/data-master':'Data Master & Referensi','/packages':'Paket Kontrak','/entry':'Workspace Paket','/verification':'Verifikasi & Validasi Berjenjang','/actions':'Temuan & Tindakan Perbaikan','/compliance':'Analisis & Kepatuhan','/reports':'Dashboard & Pelaporan','/documents':'Manajemen Dokumen Mutu','/notifications':'Notifikasi & Pengingat','/audit':'Keamanan & Jejak Audit'};
export const sectionTargets:Record<string,Record<string,string>>={
 '/':{'Kepatuhan per jenis survei':'dashboard-compliance'},
 '/data-master':{'Kelola data master':'master-data'},
 '/entry':{'Form entri data uji':'entry-data','Hasil uji awal':'entry-results','Daftar pengajuan survei':'entry-history'},
 '/verification':{'Aspek mutu yang diperiksa':'verification-self-audit','Status hasil verifikasi':'verification-results','Daftar sampel untuk diverifikasi':'verification-sampling'},
 '/actions':{'Daftar tindakan perbaikan':'actions-cases'},
 '/compliance':{'Kepatuhan per jenis survei':'compliance-calculation','Tren kepatuhan QA/QC':'compliance-trend','Peringkat balai':'compliance-ranking'},
 '/reports':{'Paket laporan tersedia':'reports-export'},
 '/documents':{'File manager dokumen':'documents-list'},
 '/notifications':{'Kotak notifikasi':'notifications-list','Alur eskalasi notifikasi':'notifications-escalation'},
 '/audit':{'Matriks hak akses per peran':'audit-permissions','Log aktivitas pengguna':'audit-activity'}
};
export const headingTargets:Record<string,Record<string,string>>={
 '/':{'Ringkasan operasional':'dashboard-main'},
 '/reports':{'Dashboard kinerja & pelaporan':'reports-summary'}
};
export const workflowSubmodules = new Set([
  '/packages:Ringkasan Paket',
  '/documents:BA & dokumen workflow',
  '/entry:Persiapan & SPMK',
  '/documents:Kalibrasi & personel',
  '/entry:Validasi produksi',
  '/entry:Survei harian',
  '/verification:Verval 14 hari',
  '/entry:Gerbang RNI/LRS',
  '/verification:Audit tingkat 1â€“3',
  '/reports:Penerimaan & termin',
  '/actions:Koreksi berbukti',
  '/notifications:Pengingat & eskalasi',
  '/audit:Peran & backup',
  '/reports:Matriks cakupan diagram',
]);

