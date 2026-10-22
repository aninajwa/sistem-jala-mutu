/** Pemeriksaan integritas unit sampel audit sebelum keputusan. Tidak mengubah sumber data. */
import type { AuditLevel, DailySurveyRecord, SurveyType } from './model';
export function auditSampleIntegrity(args:{audit:Pick<AuditLevel,'level'|'sampleIds'|'sampleUnits'>;records:readonly DailySurveyRecord[];surveyTypes:readonly SurveyType[];routes:readonly string[]}):string[]{
 const {audit,records,surveyTypes,routes}=args,issues:string[]=[];
 if(audit.sampleUnits?.length){
  const ids=[...new Set(audit.sampleUnits.map(unit=>unit.id))];if(ids.length!==audit.sampleUnits.length)issues.push('Daftar unit sampel memiliki ID ganda.');
  for(const unit of audit.sampleUnits){const record=records.find(row=>row.id===unit.sourceRecordId);if(!record){issues.push(`Unit ${unit.id}: rekaman sumber tidak ditemukan.`);continue;}if(record.state!=='Tercatat')issues.push(`Unit ${unit.id}: rekaman sumber tidak lagi berstatus Tercatat.`);if(!routes.includes(unit.road)||unit.road!==record.road)issues.push(`Unit ${unit.id}: ruas tidak sesuai paket/sumber.`);if(!surveyTypes.includes(unit.surveyType)||unit.surveyType!==record.surveyType)issues.push(`Unit ${unit.id}: jenis survei tidak sesuai paket/sumber.`);if(!unit.unitKey.trim())issues.push(`Unit ${unit.id}: identitas unit kosong.`);
   if(audit.level>1){if(!unit.reviewStatus||unit.reviewStatus==='Belum Diperiksa')issues.push(`Unit ${unit.unitKey}: hasil pemeriksaan sampel belum dicatat.`);if(!unit.evidenceReference?.trim())issues.push(`Unit ${unit.unitKey}: referensi bukti pemeriksaan belum dicatat.`);if(unit.reviewStatus==='Tidak Valid')issues.push(`Unit ${unit.unitKey}: hasil sampel Tidak Valid.`);}
  }
  for(const type of surveyTypes)if(!audit.sampleUnits.some(unit=>unit.surveyType===type))issues.push(`Sampel untuk ${type} belum tersedia.`);
  return [...new Set(issues)];
 }
 const sampleIds=[...new Set(audit.sampleIds)];if(!sampleIds.length)return ['Belum ada sampel audit yang ditetapkan.'];if(sampleIds.length!==audit.sampleIds.length)issues.push('Daftar sampel memiliki ID ganda.');const selected:DailySurveyRecord[]=[];
 for(const id of sampleIds){const record=records.find(r=>r.id===id);if(!record){issues.push(`Sampel ${id} tidak ditemukan pada rekaman terkini.`);continue;}if(record.state!=='Tercatat')issues.push(`Sampel ${id} tidak lagi berstatus Tercatat.`);if(!routes.includes(record.road))issues.push(`Sampel ${id} berada di luar ruas paket.`);if(!surveyTypes.includes(record.surveyType))issues.push(`Sampel ${id} berada di luar jenis survei paket.`);selected.push(record);}
 for(const type of surveyTypes)if(!selected.some(r=>r.surveyType===type))issues.push(`Sampel untuk ${type} belum tersedia.`);return issues;
}
