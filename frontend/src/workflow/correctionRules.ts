import type { CorrectionCase, SurveyType } from './model';
export const RULE_SCENARIOS:Partial<Record<SurveyType,string[]>>={
  IRI:['Lajur melenceng','Kehilangan data IRI','Kehilangan data / underspeed','Kemacetan / kendaraan parkir IRI','Underspeed / jalan rusak berat','Underspeed / anomali geometrik','Longsor','Speedhump / oprit / jembatan','Longsor / ruas terputus'],
  PCI:['Hujan / genangan','Alur / amblas','Foto defect tidak sesuai','Macet / kendaraan parkir'],
  Lendutan:['Gradien / geofon','Beban FWD','Deflection bowl','Beban / deflection bowl','Nilai ekstrem'],
  Jembatan:['Pemutakhiran setelah verval Direktorat'],
};
export const RULE_CHECKS:Record<string,string[]>={
  'Lajur melenceng':['Kondisi jalan seragam','Raw sesuai video'],
  'Kehilangan data IRI':['Survei ulang dilakukan','Data raw IRI tetap utuh'],
  'Kehilangan data / underspeed':['Survei ulang dilakukan saat lalu lintas normal'],
  'Kemacetan / kendaraan parkir IRI':['Survei ulang pada waktu berbeda saat lalu lintas normal'],
  'Underspeed / jalan rusak berat':['Kerusakan berat dikonfirmasi melalui bukti visual','Raw IRI tidak diubah'],
  'Underspeed / anomali geometrik':['Anomali tidak dapat ditentukan secara visual','Survei ulang lokasi dilakukan'],
  'Longsor':['Longsoran mengenai perkerasan jalan','Raw IRI tidak diubah','Rata-rata IRI per 100 m dihitung ulang'],
  'Speedhump / oprit / jembatan':['Raw 10 m tetap utuh','Segmen <60 m ditandai dan tidak dirata-ratakan'],
  'Longsor / ruas terputus':['Raw IRI tidak diubah','Segmen diberi keterangan tidak dapat dilewati'],
  'Hujan / genangan':['Rekaman ulang setelah hujan reda dan genangan relatif hilang'],
  'Alur / amblas':['Pengukuran fisik straight edge / laser profilometer tercatat'],
  'Foto defect tidak sesuai':['Foto defect diambil ulang sesuai spesifikasi'],
  'Macet / kendaraan parkir':['Kondisi lokasi ditinjau dan dicatat','Menggunakan IRI sebagai pembanding','IRI pada STA yang sama','IRI direkam tanpa kemacetan atau kendaraan parkir','Catatan pembandingan IRI tersedia'],
  'Gradien / geofon':['Pindah ke titik rata','STA asal dipertahankan dan alasan pemindahan dicatat'],
  'Beban FWD':['Pengujian ulang dilakukan','Data temperatur tidak dimodifikasi'],
  'Deflection bowl':['Pengujian ulang sekitar titik asal dilakukan','Data temperatur tidak dimodifikasi'],
  'Beban / deflection bowl':['Pengujian ulang dilakukan','Pengujian ulang sekitar titik asal dilakukan','Data temperatur tidak dimodifikasi'],
  'Nilai ekstrem':['Semua nilai konfirmasi dan foto disimpan','Konfirmasi dilakukan pada waktu yang sama','Data temperatur tidak dimodifikasi'],
  'Pemutakhiran setelah verval Direktorat':['Bencana / FHO dan perubahan dijelaskan'],
};
const PCI_COMPARISON_TOGGLE = 'Menggunakan IRI sebagai pembanding';
const PCI_COMPARISON_KEYS = ['IRI pada STA yang sama','IRI direkam tanpa kemacetan atau kendaraan parkir','Catatan pembandingan IRI tersedia'];
export function visibleProposalScenarioChecks(c: CorrectionCase): string[] {
  if (requiresNewScenarioEvidence(c)) return [];
  return (RULE_CHECKS[c.ruleScenario || ''] || []).filter(key => c.ruleScenario !== 'Macet / kendaraan parkir' || !PCI_COMPARISON_KEYS.includes(key) || c.ruleChecks?.[PCI_COMPARISON_TOGGLE] === true);
}
export function updateProposalScenarioCheck(c: CorrectionCase, key: string, value: boolean): Record<string, boolean> {
  const checks = { ...c.ruleChecks, [key]: value };
  if (c.ruleScenario === 'Macet / kendaraan parkir' && key === PCI_COMPARISON_TOGGLE && !value) {
    for (const dependent of PCI_COMPARISON_KEYS) delete checks[dependent];
  }
  return checks;
}
export const RULE_NUMBERS:Record<string,string[]>={
  'Alur / amblas':['Kedalaman alur hasil pengukuran langsung (mm)'],
  'Lajur melenceng':['Radius deviasi (m)'],
  'Kehilangan data IRI':['Data valid hilang per 100 m','Jumlah survei ulang'],
  'Kehilangan data / underspeed':['Data valid hilang per 100 m','Jumlah survei ulang'],
  'Speedhump / oprit / jembatan':['Panjang dieliminasi per 100 m','Sisa panjang valid (m)'],
  'Underspeed / jalan rusak berat':['Nilai klasifikasi IRI (m/km)'],
  'Longsor':['Nilai klasifikasi IRI (m/km)','Panjang longsor via GIS (m)'],
  'Longsor / ruas terputus':['Nilai klasifikasi IRI (m/km)','Panjang longsor via GIS (m)'],
  'Beban FWD':['Beban hasil uji ulang (kN)'],
  'Deflection bowl':Array.from({length:9},(_,i)=>`D${i} hasil uji ulang`),
  'Beban / deflection bowl':['Beban hasil uji ulang (kN)',...Array.from({length:9},(_,i)=>`D${i} hasil uji ulang`)],
  'Nilai ekstrem':['Jumlah konfirmasi'],
};
export function suggestedScenario(type:SurveyType,text:string):string {
  const s=text.toLowerCase();
  if(type==='IRI'){
    if(/longsor/.test(s))return 'Longsor';
    if(/terputus/.test(s))return 'Longsor / ruas terputus';
    if(/macet|kemacetan|kendaraan parkir/.test(s))return 'Kemacetan / kendaraan parkir IRI';
    if(/underspeed/.test(s)&&/rusak berat/.test(s))return 'Underspeed / jalan rusak berat';
    if(/underspeed/.test(s)&&/anomali|bias/.test(s)&&/tikungan|tanjakan|turunan|box culvert|jembatan|fly.?over/.test(s))return 'Underspeed / anomali geometrik';
    if(/speedhump|oprit/.test(s))return 'Speedhump / oprit / jembatan';
    if(/kehilangan|data.*hilang|segmen.*hilang/.test(s))return 'Kehilangan data IRI';
    if(/underspeed/.test(s))return 'Kehilangan data / underspeed';
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
    if(/beban/.test(s)&&/bowl/.test(s))return 'Beban / deflection bowl';
    if(/beban/.test(s))return 'Beban FWD';
    if(/bowl/.test(s))return 'Deflection bowl';
  }
  if(type==='Jembatan'&&/bencana|fho|pemutakhiran/.test(s))return 'Pemutakhiran setelah verval Direktorat';
  return 'Umum';
}
export function specialCorrectionErrors(c:CorrectionCase):string[] {
  const scenario=c.ruleScenario||'Umum',checks=c.ruleChecks||{},numbers=c.ruleNumbers||{},errors:string[]=[];
  const inferred=suggestedScenario(c.surveyType,c.rejectionReason);
  if(scenario!=='Umum'&&!(RULE_SCENARIOS[c.surveyType]||[]).includes(scenario))return ['Skenario teknis tidak sesuai jenis survei.'];
  if(inferred!=='Umum'&&scenario!==inferred&&!(inferred==='Kehilangan data IRI'&&scenario==='Kehilangan data / underspeed'&&/survei ulang/i.test(c.actionType)))return [`Pilih skenario khusus: ${inferred}`];
  if(scenario==='Umum')return errors;
  const required=(RULE_CHECKS[scenario]||[]).filter(key=>scenario==='Macet / kendaraan parkir'?key==='Kondisi lokasi ditinjau dan dicatat':scenario==='Speedhump / oprit / jembatan'?key==='Raw 10 m tetap utuh':true);
  if(required.some(key=>checks[key]!==true))errors.push('Checklist bukti skenario khusus belum lengkap');
  if((RULE_NUMBERS[scenario]||[]).some(key=>!Number.isFinite(numbers[key])||numbers[key]<0))errors.push('Angka pengukuran skenario wajib dan tidak boleh negatif');
  if(['Jumlah survei ulang','Jumlah konfirmasi'].some(key=>(RULE_NUMBERS[scenario]||[]).includes(key)&&!Number.isInteger(numbers[key])))errors.push('Jumlah pengujian harus berupa bilangan bulat.');
  if(scenario==='Kemacetan / kendaraan parkir IRI'&&!/survei ulang/i.test(c.actionType))errors.push('IRI pada kemacetan atau kendaraan parkir wajib disurvei ulang.');
  if(scenario==='Underspeed / anomali geometrik'&&!/survei ulang/i.test(c.actionType))errors.push('Anomali IRI yang tidak dapat ditentukan secara visual wajib disurvei ulang.');
  if(scenario==='Underspeed / jalan rusak berat'&&(c.actionType!=='Koreksi pemrosesan dengan bukti'||numbers['Nilai klasifikasi IRI (m/km)']<=12))errors.push('Jalan rusak berat memerlukan koreksi berbasis bukti dengan klasifikasi IRI >12 m/km.');
  if(scenario==='Longsor'&&(c.actionType!=='Koreksi pemrosesan dengan bukti'||numbers['Nilai klasifikasi IRI (m/km)']<=12||numbers['Panjang longsor via GIS (m)']<=0))errors.push('Longsor memerlukan koreksi berbasis bukti, klasifikasi IRI >12 m/km dan panjang GIS >0.');
  if(scenario==='Lajur melenceng'&&numbers['Radius deviasi (m)']>20&&c.actionType==='Koreksi pemrosesan dengan bukti')errors.push('Deviasi >20 m: toleransi tanpa koreksi tidak berlaku; lakukan survei ulang');
  if(scenario==='Kehilangan data / underspeed'&&!/survei ulang/i.test(c.actionType))errors.push('Klarifikasi penyebab underspeed sebelum koreksi; skenario lama hanya mendukung survei ulang.');
  if(['Kehilangan data IRI','Kehilangan data / underspeed'].includes(scenario)&&numbers['Jumlah survei ulang']<1)errors.push('Minimal satu survei ulang wajib tercatat.');
  if(scenario==='Kehilangan data IRI'&&c.actionType==='Koreksi pemrosesan dengan bukti'&&numbers['Data valid hilang per 100 m']<=0)errors.push('Koreksi hanya jika data masih hilang setelah survei ulang.');
  if(scenario==='Kehilangan data IRI'&&!/survei ulang/i.test(c.actionType)&&c.actionType!=='Koreksi pemrosesan dengan bukti')errors.push('Data hilang memerlukan survei ulang atau koreksi berbasis bukti setelah survei ulang.');
  if(scenario==='Speedhump / oprit / jembatan'){
    if(numbers['Panjang dieliminasi per 100 m']>40)errors.push('Eliminasi melebihi 40 m/100 m tidak sah');
    if(numbers['Sisa panjang valid (m)']<60&&!checks['Segmen <60 m ditandai dan tidak dirata-ratakan'])errors.push('Sisa valid <60 m: wajib tandai dan jangan dirata-ratakan');
  }
  if(scenario==='Longsor / ruas terputus'&&(numbers['Nilai klasifikasi IRI (m/km)']<=12||numbers['Panjang longsor via GIS (m)']<=0))errors.push('Klasifikasi Rusak Berat >12 m/km dan panjang GIS >0 wajib; raw tidak diubah');
  if(scenario==='Hujan / genangan'&&!/survei ulang|ambil ulang foto/i.test(c.actionType))errors.push('PCI hujan/genangan memerlukan pengambilan ulang setelah hujan reda dan genangan relatif hilang.');
  if(scenario==='Alur / amblas'&&!/survei ulang|penilaian ulang/i.test(c.actionType)&&c.actionType!=='Koreksi pemrosesan dengan bukti')errors.push('Kedalaman alur wajib berdasarkan pengukuran langsung.');
  if(scenario==='Foto defect tidak sesuai'&&c.actionType!=='Ambil ulang foto/video')errors.push('Foto defect harus diambil ulang');
  if(scenario==='Macet / kendaraan parkir'){
    const comparisonKeys=PCI_COMPARISON_KEYS;
    if(checks['Menggunakan IRI sebagai pembanding']===true&&comparisonKeys.some(key=>checks[key]!==true))errors.push('Pembanding IRI wajib pada STA yang sama, tanpa kemacetan atau kendaraan parkir, dan disertai catatan.');
    if(checks['Menggunakan IRI sebagai pembanding']!==true&&comparisonKeys.some(key=>checks[key]===true))errors.push('Nyatakan penggunaan pembanding IRI jika bukti pembandingan dicatat.');
  }
  if(['Beban FWD','Deflection bowl','Beban / deflection bowl'].includes(scenario)&&!/survei ulang/i.test(c.actionType))errors.push('Anomali beban atau deflection bowl memerlukan pengujian ulang.');
  if(['Beban FWD','Beban / deflection bowl'].includes(scenario)&&(numbers['Beban hasil uji ulang (kN)']<36||numbers['Beban hasil uji ulang (kN)']>44))errors.push('Beban FWD harus 36–44 kN; jika belum tercapai, periksa sistem alat dan ulangi pengujian.');
  if(['Deflection bowl','Beban / deflection bowl'].includes(scenario)&&Array.from({length:8},(_,i)=>i).some(i=>numbers[`D${i} hasil uji ulang`]<=numbers[`D${i+1} hasil uji ulang`]))errors.push('Deflection bowl harus memenuhi D0 > D1 > ... > D8; periksa permukaan, geofon dan sistem FWD jika anomali berlanjut.');
  if(scenario==='Nilai ekstrem'&&numbers['Jumlah konfirmasi']<3)errors.push('Nilai ekstrem lendutan harus dikonfirmasi minimal tiga kali');
  if(scenario==='Pemutakhiran setelah verval Direktorat'&&!c.provinceUpdateBa?.trim())errors.push('BA Pemutakhiran Data Provinsi wajib');
  return errors;
}

/** New fieldwork cannot be certified during planning. Processing corrections still
 * require the existing source evidence before approval (KAK 2026, IRI/PCI/Lendutan). */
export function requiresNewScenarioEvidence(c: CorrectionCase): boolean {
  return /survei ulang|ambil ulang foto|penilaian ulang/i.test(c.actionType) &&
    ["Kehilangan data IRI", "Kehilangan data / underspeed", "Kemacetan / kendaraan parkir IRI", "Underspeed / anomali geometrik", "Hujan / genangan", "Alur / amblas", "Foto defect tidak sesuai", "Gradien / geofon", "Beban FWD", "Deflection bowl", "Beban / deflection bowl", "Nilai ekstrem"].includes(c.ruleScenario || "");
}
export function correctionProposalScenarioErrors(c: CorrectionCase): string[] {
  if (!requiresNewScenarioEvidence(c)) return specialCorrectionErrors(c);
  const scenario = c.ruleScenario || "Umum";
  const inferred = suggestedScenario(c.surveyType, c.rejectionReason);
  if (!(RULE_SCENARIOS[c.surveyType] || []).includes(scenario)) return ["Skenario teknis tidak sesuai jenis survei."];
  if (inferred !== "Umum" && scenario !== inferred && !(inferred === "Kehilangan data IRI" && scenario === "Kehilangan data / underspeed" && /survei ulang/i.test(c.actionType))) return [`Pilih skenario khusus: ${inferred}`];
  if (["Kehilangan data IRI", "Kehilangan data / underspeed", "Kemacetan / kendaraan parkir IRI", "Underspeed / anomali geometrik"].includes(scenario) && !/survei ulang/i.test(c.actionType)) return ["Skenario IRI ini wajib disurvei ulang."];
  if (["Beban FWD", "Deflection bowl", "Beban / deflection bowl"].includes(scenario) && !/survei ulang/i.test(c.actionType)) return ["Anomali beban atau deflection bowl memerlukan pengujian ulang."];
  if (scenario === "Hujan / genangan" && !/survei ulang|ambil ulang foto/i.test(c.actionType)) return ["PCI hujan/genangan memerlukan pengambilan ulang setelah hujan reda dan genangan relatif hilang."];
  if (scenario === "Alur / amblas" && !/survei ulang|penilaian ulang/i.test(c.actionType)) return ["Kedalaman alur wajib berdasarkan pengukuran langsung."];
  if (scenario === "Foto defect tidak sesuai" && c.actionType !== "Ambil ulang foto/video") return ["Foto defect harus diambil ulang"];
  return [];
}
