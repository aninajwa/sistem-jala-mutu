/** Contract deliverables are not QA/QC periodic drafts. KAK 2026 chapters 19–21.
 * No approval or submission state is inferred from these descriptions. */
export const CONTRACT_REPORTS = [
 {name:'Laporan Pendahuluan',source:'KAK Bab 19',items:['Survei pendahuluan','Peralatan, sertifikat kalibrasi dan metodologi validasi','Uji coba jembatan apabila berlaku, rencana validasi per 200 km','Metodologi, sumber daya, jadwal, format survei dan Quality Management Plan']},
 {name:'Laporan Hasil Survei Semester I',source:'KAK Bab 20',items:['IRI, PCI dan data kerusakan PCI','Hasil survei jembatan, BA V&V dan bukti yang dipersyaratkan','Lendutan, lereng, drainase, lalu lintas, RNI dan jembatan khusus apabila termasuk lingkup']},
 {name:'Laporan Hasil Survei Semester II',source:'KAK Bab 20',items:['IRI semester II','PCI dan data kerusakan PCI yang belum selesai pada semester I']},
 {name:'Laporan Akhir Pekerjaan',source:'KAK Bab 21',items:['Kalibrasi, verifikasi dan validasi','Survei lapangan, backup dan arsip','Statistik survei dan waktu kerusakan','Permasalahan dan tindakan','Grafik panjang survei harian','Pembelajaran dan rekomendasi']},
] as const;
