import type { CorrectionCase, SurveyType } from './model';
export const RULE_SCENARIOS:Partial<Record<SurveyType,string[]>>={
  IRI:['Lajur melenceng','Kehilangan data / underspeed','Speedhump / oprit / jembatan','Longsor / ruas terputus'],
  PCI:['Hujan / genangan','Alur / amblas','Foto defect tidak sesuai','Macet / kendaraan parkir'],
  Lendutan:['Gradien / geofon','Beban / deflection bowl','Nilai ekstrem'],
  Jembatan:['Pemutakhiran setelah verval Direktorat'],
};
export const RULE_CHECKS:Record<string,string[]>={
  'Lajur melenceng':['Kondisi jalan seragam','Raw sesuai video'],
  'Kehilangan data / underspeed':['Survei ulang dilakukan saat lalu lintas normal'],
  'Speedhump / oprit / jembatan':['Raw 10 m tetap utuh','Segmen <60 m ditandai dan tidak dirata-ratakan'],
  'Longsor / ruas terputus':['Raw IRI tidak diubah','Segmen diberi keterangan tidak dapat dilewati'],
  'Hujan / genangan':['Rekaman ulang dilakukan setelah permukaan kering'],
  'Alur / amblas':['Pengukuran fisik straight edge / laser tercatat'],
  'Foto defect tidak sesuai':['Foto defect diambil ulang sesuai spesifikasi'],
  'Macet / kendaraan parkir':['Rekam ulang di luar jam sibuk','Inspeksi visual manual','IRI hanya digunakan sebagai bukti pendukung'],
  'Gradien / geofon':['Pindah ke titik rata','STA diperbarui beserta alasan'],
  'Beban / deflection bowl':['Uji ulang dan pemeriksaan alat dilakukan'],
  'Nilai ekstrem':['Semua nilai konfirmasi dan foto disimpan','Data temperatur tidak dimodifikasi'],
  'Pemutakhiran setelah verval Direktorat':['Bencana / FHO dan perubahan dijelaskan'],
};
export const RULE_NUMBERS:Record<string,string[]>={
  'Lajur melenceng':['Radius deviasi (m)'],
  'Kehilangan data / underspeed':['Data valid hilang per 100 m','Jumlah survei ulang'],
  'Speedhump / oprit / jembatan':['Panjang dieliminasi per 100 m','Sisa panjang valid (m)'],
  'Longsor / ruas terputus':['Nilai klasifikasi IRI (m/km)','Panjang longsor via GIS (m)'],
  'Nilai ekstrem':['Jumlah konfirmasi'],
};
export function suggestedScenario(type:SurveyType,text:string):string {
  const s=text.toLowerCase();
  if(type==='IRI'){
    if(/speedhump|oprit/.test(s))return 'Speedhump / oprit / jembatan';
    if(/longsor|terputus/.test(s))return 'Longsor / ruas terputus';
    if(/kehilangan|underspeed/.test(s))return 'Kehilangan data / underspeed';
    if(/lajur.*melenceng/.test(s))return 'Lajur melenceng';
  }
  if(type==='PCI'){
    if(/hujan|genangan/.test(s))return 'Hujan / genangan';
    if(/alur|amblas/.test(s))return 'Alur / amblas';
    if(/macet|parkir/.test(s))return 'Macet / kendaraan parkir';
    if(/foto.*tidak sesuai/.test(s))return 'Foto defect tidak sesuai';
  }
  if(type==='Lendutan'){
    if(/ekstrem/.test(s))return 'Nilai ekstrem';
    if(/gradien|menggantung/.test(s))return 'Gradien / geofon';
    if(/beban|bowl/.test(s))return 'Beban / deflection bowl';
  }
  if(type==='Jembatan'&&/bencana|fho|pemutakhiran/.test(s))return 'Pemutakhiran setelah verval Direktorat';
  return 'Umum';
}
export function specialCorrectionErrors(c:CorrectionCase):string[] {
  const scenario=c.ruleScenario||'Umum',checks=c.ruleChecks||{},numbers=c.ruleNumbers||{},errors:string[]=[];
  const inferred=suggestedScenario(c.surveyType,c.rejectionReason);
  if(scenario==='Umum'&&inferred!=='Umum')return [`Pilih skenario khusus: ${inferred}`];
  if(scenario==='Umum')return errors;
  const required=(RULE_CHECKS[scenario]||[]).filter(key=>scenario==='Macet / kendaraan parkir'?key==='IRI hanya digunakan sebagai bukti pendukung':scenario==='Speedhump / oprit / jembatan'?key==='Raw 10 m tetap utuh':true);
  if(required.some(key=>!checks[key]))errors.push('Checklist bukti skenario khusus belum lengkap');
  if((RULE_NUMBERS[scenario]||[]).some(key=>!Number.isFinite(numbers[key])||numbers[key]<0))errors.push('Angka pengukuran skenario wajib dan tidak boleh negatif');
  if(scenario==='Lajur melenceng'&&numbers['Radius deviasi (m)']>20&&c.actionType==='Koreksi pemrosesan dengan bukti')errors.push('Deviasi >20 m: toleransi tanpa koreksi tidak berlaku; lakukan survei ulang');
  if(scenario==='Kehilangan data / underspeed'&&c.actionType==='Koreksi pemrosesan dengan bukti'&&numbers['Jumlah survei ulang']<1)errors.push('Koreksi segmen hilang hanya setelah minimal satu survei ulang');
  if(scenario==='Speedhump / oprit / jembatan'){
    if(numbers['Panjang dieliminasi per 100 m']>40)errors.push('Eliminasi melebihi 40 m/100 m tidak sah');
    if(numbers['Sisa panjang valid (m)']<60&&!checks['Segmen <60 m ditandai dan tidak dirata-ratakan'])errors.push('Sisa valid <60 m: wajib tandai dan jangan dirata-ratakan');
  }
  if(scenario==='Longsor / ruas terputus'&&(numbers['Nilai klasifikasi IRI (m/km)']<=12||numbers['Panjang longsor via GIS (m)']<=0))errors.push('Klasifikasi Rusak Berat >12 m/km dan panjang GIS >0 wajib; raw tidak diubah');
  if(scenario==='Hujan / genangan'&&c.actionType==='Koreksi pemrosesan dengan bukti')errors.push('PCI hujan/genangan tidak boleh dikoreksi');
  if(scenario==='Foto defect tidak sesuai'&&c.actionType!=='Ambil ulang foto/video')errors.push('Foto defect harus diambil ulang');
  if(scenario==='Macet / kendaraan parkir'&&(!checks['Rekam ulang di luar jam sibuk']&&!checks['Inspeksi visual manual']))errors.push('Penyedia wajib rekam ulang di luar jam sibuk atau inspeksi manual');
  if(scenario==='Nilai ekstrem'&&numbers['Jumlah konfirmasi']<3)errors.push('Nilai ekstrem lendutan harus dikonfirmasi minimal tiga kali');
  if(scenario==='Pemutakhiran setelah verval Direktorat'&&!c.provinceUpdateBa?.trim())errors.push('BA Pemutakhiran Data Provinsi wajib');
  return errors;
}
