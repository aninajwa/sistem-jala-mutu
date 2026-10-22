import {readLendutanPeriod,INTERNAL_PARAMETERS,JOINT_PARAMETERS} from '../repository/lendutanPeriod';
import type {AuditLevel,DailySurveyRecord,OperationalWorkflowState,SurveyType} from '../model';
import type {BaTemplate,TemplateField} from './docxEngine';

const AUDIT_SURVEY_ROWS:SurveyType[]=['IRI','PCI','Jembatan','Lendutan','Lereng','Drainase','Lalu Lintas','RNI'];
const finite=(value:unknown)=>typeof value==='number'&&Number.isFinite(value)?String(value):undefined;
const unique=<T,>(items:T[])=>[...new Set(items)];
const inRange=(record:DailySurveyRecord,range:{start:string;end:string})=>(!range.start||record.date>=range.start)&&(!range.end||record.date<=range.end);
const periodText=(range:{start:string;end:string})=>range.start&&range.end?`${range.start} s.d. ${range.end}`:'';
const recordReference=(record:DailySurveyRecord)=>record.technicalData?.evidence||record.technicalData?.sourceReference||record.id;
const pct=(part:number,total:number)=>total>0?`${Number(((part/total)*100).toFixed(2))}%`:undefined;
const auditUnits=(audit:AuditLevel)=>audit.sampleUnits??[];
const auditFindingStage=(level:number)=>`audit tingkat ${level}`;

function sourceResult(state:OperationalWorkflowState,survey:SurveyType){
 const review=state.cycle.surveyReviews?.[survey];
 if(review?.decision==='Sesuai')return {valid:'Valid',verified:'Terverifikasi',note:review.note};
 if(review?.decision==='Temuan')return {valid:'Tidak Valid',verified:'Tidak Terverifikasi',note:review.note};
 return {valid:undefined,verified:undefined,note:''};
}
function fillCoverageField(field:TemplateField,records:DailySurveyRecord[],survey:SurveyType,range:{start:string;end:string}){
 const label=field.label.toLowerCase();const row=(field.tableRow??1)-1;const roads=unique(records.map(record=>record.road));const road=roads[row];
 const roadRecords=road?records.filter(record=>record.road===road):[];
 if(label==='jenis survei'||label==='jenis survey')return row===0?survey:undefined;
 if(label==='ruas'||label==='ruas/lokasi'||label==='nama ruas')return road;
 if(label==='panjang/jumlah')return roadRecords.length?`${roadRecords.length} rekaman sumber`:undefined;
 if(label==='tanggal'){
  const dates=unique(roadRecords.map(record=>record.date)).sort();
  return dates.length===1?dates[0]:dates.length?`${dates[0]} s.d. ${dates.at(-1)}`:undefined;
 }
 if(label==='periode')return periodText(range)||undefined;
 return undefined;
}
function mapSurveyResultField(field:TemplateField,state:OperationalWorkflowState,survey:SurveyType,records:DailySurveyRecord[]){
 const section=field.section??'';const label=field.label.toLowerCase();
 const result=sourceResult(state,survey);const road=unique(records.map(record=>record.road))[(field.tableRow??1)-1];
 if(label==='ruas'||label==='jembatan')return road;
 if(/valid\/tidak valid/i.test(field.label)&&result.valid&&field.choices?.includes(result.valid))return result.valid;
 if(/terverifikasi\/tidak terverifikasi/i.test(field.label)&&result.verified&&field.choices?.includes(result.verified))return result.verified;
 if(label==='catatan'&&result.note)return result.note;
 if(/survei lainnya/i.test(section)&&/tampilkan hasil (validasi|verifikasi)/i.test(field.label)&&result.valid){
  return `${survey}: ${/verifikasi/i.test(field.label)?result.verified:result.valid}${result.note?` — ${result.note}`:''}`;
 }
 return undefined;
}
function auditField(field:TemplateField,state:OperationalWorkflowState,survey:SurveyType,audit:AuditLevel,auditLevel:number,records:DailySurveyRecord[],corrections:OperationalWorkflowState['corrections']){
 const label=field.label.toLowerCase();const section=field.section??'';const units=auditUnits(audit);const scopedUnits=units.filter(unit=>unit.surveyType===survey);
 if(label==='diisi nomor dokumen'&&audit.baNumber)return audit.baNumber;
 if(label==='internal/pengguna jasa/direktorat')return ['Internal','Pengguna Jasa','Direktorat'][auditLevel-1];
 if(section==='1.1 Data Survey yang Diaudit'){
  if(label==='jenis survey')return survey;
  if(label==='ruas/lokasi')return unique((scopedUnits.length?scopedUnits.map(unit=>unit.road):records.map(record=>record.road))).join(', ')||undefined;
  if(label==='periode')return unique((scopedUnits.length?scopedUnits.map(unit=>unit.date).filter(Boolean):records.map(record=>record.date)) as string[]).sort().filter(Boolean).join(' s.d. ')||undefined;
  if(label==='penyedia jasa')return state.project.contractor||undefined;
 }
 if(section==='1.4 Metode Sampling'){
  if(/jelaskan metode sampling/.test(label)){
   if(audit.level===1)return units.length?'Audit internal seluruh unit populasi ter-normalisasi.':'Audit internal seluruh data sesuai lingkup paket.';
   return units.length?`Sampling unit ${unique(scopedUnits.map(unit=>unit.unitType)).join('/')||'titik/segmen/objek'} sesuai aturan Audit Tingkat ${audit.level}.`:undefined;
  }
  if(/persentase data/.test(label)){
   const coverage=audit.samplingCoverage?.[survey];
   if(coverage){
    const useLength=typeof coverage.populationKm==='number'&&coverage.populationKm>0&&typeof coverage.sampledKm==='number';
    const percentage=useLength?pct(coverage.sampledKm??0,coverage.populationKm??0):pct(coverage.sampledUnits,coverage.populationUnits);
    if(percentage)return useLength
      ?`${percentage} (${coverage.sampledKm?.toFixed(3)} km dari ${coverage.populationKm?.toFixed(3)} km)`
      :`${percentage} (${coverage.sampledUnits} dari ${coverage.populationUnits} unit)`;
   }
  }
  if(/kriteria pemilihan/.test(label)&&units.length)return 'Unit dipilih dari identitas titik/segmen/objek yang stabil pada ruas dan jenis survei dalam lingkup audit.';
 }
 if(section==='10.1 Ringkasan Temuan'){
  const row=field.tableRow??0;
  if(row>=1&&row<=AUDIT_SURVEY_ROWS.length){
   const rowSurvey=AUDIT_SURVEY_ROWS[row-1];const rowUnits=units.filter(unit=>unit.surveyType===rowSurvey);
   const findings=state.corrections.filter(item=>item.surveyType===rowSurvey&&item.blockedStage.toLowerCase().includes(auditFindingStage(auditLevel)));
   if(field.tableColumn===2||field.label==='Jumlah'&&field.tableColumn===2)return rowUnits.length?String(rowUnits.length):undefined;
   if(field.tableColumn===3||field.label==='Jumlah'&&field.tableColumn===3)return rowUnits.length?String(findings.length):undefined;
   if(/persentase/i.test(field.label))return rowUnits.length?pct(findings.length,rowUnits.length):undefined;
  }
  if(row===9){
   const findings=state.corrections.filter(item=>item.blockedStage.toLowerCase().includes(auditFindingStage(auditLevel)));
   if(field.tableColumn===2)return units.length?String(units.length):undefined;
   if(field.tableColumn===3)return units.length?String(findings.length):undefined;
   if(field.tableColumn===4)return units.length?pct(findings.length,units.length):undefined;
  }
 }
 if(/berikan kesimpulan status audit/.test(label)&&audit.status!=='Belum Dimulai')return `${audit.status}${audit.decisionNote?`: ${audit.decisionNote}`:''}`;
 if(/uraikan temuan utama/.test(label)&&audit.decisionNote.trim())return audit.decisionNote;
 if(/bukti|referensi/i.test(label)&&scopedUnits.some(unit=>unit.evidenceReference))return unique(scopedUnits.map(unit=>unit.evidenceReference).filter(Boolean) as string[]).join(', ');
 if(/uraikan temuan/.test(label)&&corrections.length)return corrections.map(item=>`${item.road}: ${item.rejectionReason}`).join('\n');
 return undefined;
}

/**
 * Maps only values that already exist in operational state/source evidence.
 * It deliberately does not invent signer identities, official dates/numbers, external-system status,
 * or infer survey population length from repeated daily records.
 */
export function technicalFields(template:BaTemplate,state:OperationalWorkflowState,survey:SurveyType,range:{start:string;end:string},auditLevel=1){
 const values:Record<string,string>={};const production=state.productionTests[survey];
 const records=state.calibrations.filter(record=>record.surveyType===survey);
 const daily=state.dailyRecords.filter(record=>record.surveyType===survey&&record.state==='Tercatat'&&inRange(record,range));
 const audit=state.audits[auditLevel-1];
 const periodRecordIds=new Set(daily.map(record=>record.id));
 const corrections=state.corrections.filter(item=>item.surveyType===survey&&(!['internal','konsistensi','duaMingguan'].includes(template.id)||item.cyclePeriod===(state.activeCyclePeriod??1)||!!item.linkedRecordId&&periodRecordIds.has(item.linkedRecordId)));
 for(const field of template.fields){
  if(field.survey&&field.survey!==survey)continue;
  const label=field.label.toLowerCase(),section=field.section??'',context=field.context;
  let value:string|undefined;

  if(['internal','duaMingguan','bertahap'].includes(template.id)&&/3\.1 Cakupan Data/.test(section))value=fillCoverageField(field,daily,survey,range);
  if(['internal','duaMingguan','bertahap'].includes(template.id)&&/5\.[12]\./.test(section))value=mapSurveyResultField(field,state,survey,daily);

  if(template.id==='penerimaan'){
   const roads=unique(daily.map(record=>record.road));const road=roads[(field.tableRow??1)-1];const rowRecords=road?daily.filter(record=>record.road===road):[];const rowRecord=rowRecords[0];
   if(field.target?.kind==='cell'&&road){
    if(/^nama ruas$/i.test(field.label))value=road;
    if(/^jenis survei$/i.test(field.label))value=survey;
    if(/^periode$/i.test(field.label)&&range.start&&range.end)value=periodText(range);
    if(/^lokasi \(sta\/titik\)$/i.test(field.label))value=rowRecord?.technicalData?.stationing||rowRecord?.poi;
    if(/^tanggal survei$/i.test(field.label))value=rowRecord?.date;
    if(/^no\. ruas$/i.test(field.label))value=rowRecord?.technicalData?.roadNumber;
    // Panjang, jumlah titik/objek, dan status sistem eksternal hanya diisi jika sumber menyediakannya eksplisit.
    if(/^panjang \(lajur-km\)$/i.test(field.label))value=rowRecord?.technicalData?.acceptedLaneKm;
    if(/^panjang \(km\)$/i.test(field.label))value=rowRecord?.technicalData?.acceptedLengthKm;
    if(/^jumlah titik$/i.test(field.label))value=rowRecord?.technicalData?.pointCount;
    if(/^jumlah jembatan$/i.test(field.label))value=rowRecord?.technicalData?.bridgeCount;
    if(/^total panjang \(m\)$/i.test(field.label))value=rowRecord?.technicalData?.bridgeLengthM;
   }
   if(field.label==='Keputusan penerimaan'&&state.acceptance.acceptanceDecision&&state.acceptance.acceptanceDecision!=='Belum Diperiksa'){
    const decision=state.acceptance.acceptanceDecision.toUpperCase();if(field.choices?.includes(decision))value=decision;
   }
   if(field.label==='Periode penerimaan'){
    const choice=state.project.semester==='Semester I'?'Penerimaan Data Semester I':'Penerimaan Data Semester II dan menjadi salah satu syarat pembayaran tagihan PIHAK KEDUA untuk periode waktu yang sesuai.';
    if(field.choices?.includes(choice))value=choice;
   }
   if(/^Nomor:/i.test(context)&&state.acceptance.finalAcceptanceBa)value=state.acceptance.finalAcceptanceBa;
   if(/^Nama\s*:/i.test(context)&&/Perusahaan\s*:/i.test(context)&&field.match===2)value=state.project.contractor;
  }

  if(survey==='Lendutan'&&['internal','duaMingguan'].includes(template.id)){
   const phase=template.id==='internal'?'internal':'periodic14',scope=(state.activeCyclePeriod??1)===1?state.project.id:`${state.project.id}::period-${state.activeCyclePeriod}`;
   const data=readLendutanPeriod(scope,phase).values;
   if(/survei lainnya/i.test(section)&&/tampilkan hasil (validasi|verifikasi)/.test(label)){
    const parameters=phase==='internal'?INTERNAL_PARAMETERS:JOINT_PARAMETERS;
    const lines=parameters.filter(key=>data[key]?.trim()).map(key=>`${key}: ${data[key]}`);
    if(phase==='periodic14'&&data.sampleReference)lines.push(`Sampel ${data.sample??'?'} dari ${data.total??'?'} titik; referensi ${data.sampleReference}`);
    if(lines.length)value=lines.join('\n');
   }
   if(/berikan kesimpulan/.test(label)&&data.Kesimpulan)value=data.Kesimpulan;
   if(/uraikan rekomendasi/.test(label)&&data.Rekomendasi)value=data.Rekomendasi;
  }

  if(template.id==='kalibrasi'){
   const record=records[(field.tableRow??1)-1];
   if(record&&/3\.1/.test(section)){
    if(label==='jenis')value=record.equipment;
    if(label==='nomor seri')value=record.serialNumber;
    if(label==='tahun'&&record.year)value=String(record.year);
   }
   if(/6\.1 Hasil Kalibrasi/.test(section)&&record){
    if(label==='jenis')value=record.equipment;
    if(label==='status')value=state.calibrationChecklist[survey]?'Sesuai bukti kalibrasi':'Belum lengkap';
    if(label==='catatan')value=record.certificateReference||record.standardReference;
   }
   if(survey==='IRI'&&production.evidenceReference?.trim()&&/5\.4/.test(section)){
    if(/Nilai A\s*\(/i.test(context))value=finite(production.coefficientA);
    else if(/Nilai B\s*\(/i.test(context))value=finite(production.coefficientB);
    else if(/Nilai R[²2]/i.test(context))value=finite(production.rSquared);
    else if(/Koefisien variasi/i.test(context))value=finite(production.coefficientVariation);
   }
   if(/6\.3 Kesimpulan/.test(section)&&state.productionApproval!=='Draft')value=`Status pemeriksaan validasi produksi: ${state.productionApproval}${state.productionApprovalNote?` — ${state.productionApprovalNote}`:''}`;
  }

  if(template.id==='konsistensi'){
   if(/berikan kesimpulan status konsistensi/.test(label)&&state.cycle.consistency!=='Belum Diperiksa')value=state.cycle.consistency;
   if(/sebutkan periode konsistensi/.test(label)&&range.start&&range.end)value=periodText(range);
   if(/5\.2/.test(section)&&field.tableRow===1&&/koefisien variasi/i.test(field.columnLabel??'')&&survey==='IRI'&&state.cycle.iriCoefficientVariation!==null)value=finite(state.cycle.iriCoefficientVariation);
   if(/4\.1 Hasil Kalibrasi Awal/.test(section)){
    const record=records[(field.tableRow??1)-1];if(record){if(label==='alat')value=record.equipment;if(label==='status')value=state.calibrationChecklist[survey]?'Bukti tersedia':'Belum lengkap';if(label==='catatan')value=record.certificateReference;}
   }
  }

  if(template.id==='duaMingguan'){
   if(/berikan kesimpulan (status|tentang kualitas)/.test(label)&&state.cycle.userReview&&state.cycle.userReview!=='Belum Diperiksa')value=`${state.cycle.userReview}${state.cycle.userReviewNote?': '+state.cycle.userReviewNote:''}`;
   if(/detail data yang telah divalidasi/.test(label)&&daily.length)value=daily.map(record=>`${record.road} · ${record.date} · ${recordReference(record)}`).join('\n');
   if(/detail hasil verifikasi data sampling/.test(label)){
    const reviewed=state.audits[1]?.sampleUnits?.filter(unit=>unit.surveyType===survey&&unit.reviewStatus&&unit.reviewStatus!=='Belum Diperiksa')??[];
    if(reviewed.length)value=reviewed.map(unit=>`${unit.road} · ${unit.unitKey} · ${unit.reviewStatus}${unit.evidenceReference?` · ${unit.evidenceReference}`:''}`).join('\n');
   }
   if(/data mentah hasil survei/.test(label)&&state.submission.rawFileName)value=state.submission.rawFileName;
  }

  if(template.id==='bertahap'){
   if(/4\.1 Survei Pendahuluan/.test(section)&&/selesai\/dalam proses\/belum dilaksanakan/.test(label))value=state.project.preparation.reportApproval==='Disetujui'?'Selesai':state.project.preparation.reportApproval==='Draft'?'Belum Dilaksanakan':'Dalam Proses';
   if(/4\.2 Pengumpulan Data Lapangan/.test(section)&&/selesai\/dalam proses\/belum dilaksanakan/.test(label))value=daily.length?(state.project.surveyEndDate&&state.simulationDate>=state.project.surveyEndDate?'Selesai':'Dalam Proses'):'Belum Dilaksanakan';
   if(/4\.3 Validasi Internal/.test(section)&&/selesai\/dalam proses\/belum dilaksanakan/.test(label))value=state.cycle.consistency==='Konsisten'?'Selesai':state.cycle.periodCompleted?'Dalam Proses':'Belum Dilaksanakan';
   if(/5\.2 Pemeriksaan Data Sampling/.test(section)){
    const unit=(state.audits[1].sampleUnits??[]).filter(item=>item.surveyType===survey)[(field.tableRow??1)-1];
    if(unit){if(label==='ruas/lokasi')value=`${unit.road} · ${unit.unitKey}`;if(label==='jenis survei')value=unit.surveyType;if(label==='hasil')value=unit.reviewStatus;if(label==='catatan')value=unit.reviewNote||unit.evidenceReference;}
   }
  }

  if(template.id==='audit')value=auditField(field,state,survey,audit,auditLevel,daily,corrections)??value;

  if(/uraikan temuan/.test(label)&&corrections.length)value=corrections.map(item=>`${item.road}: ${item.rejectionReason}`).join('\n');
  if(/uraikan tindak lanjut yang telah dilakukan/.test(label)&&corrections.some(item=>item.actionType))value=corrections.filter(item=>item.actionType).map(item=>`${item.road}: ${item.actionType} (${item.status})${item.evidence?` · bukti ${item.evidence}`:''}`).join('\n');
  if(/bukti|lampiran|dokumentasi/i.test(label)&&!value){
   const refs=unique([production.evidenceReference,...records.map(record=>record.certificateReference),...corrections.map(item=>item.evidence)].filter(Boolean) as string[]);
   if(refs.length&&/referensi|bukti dukung|lampiran/i.test(label))value=refs.join(', ');
  }

  // A role/name in a template is not a signer identity; never fill personnel or signature dates here.
  if(value!==undefined&&value.trim())values[field.id]=value;
 }
 return values;
}
