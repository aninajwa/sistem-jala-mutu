/** Pemeriksaan integritas sampel audit sebelum keputusan. Tidak mengubah sumber data. */
import type { AuditLevel, DailySurveyRecord, SurveyType } from './model';

export function auditSampleIntegrity(args: {
  audit: Pick<AuditLevel,'sampleIds'>;
  records: readonly DailySurveyRecord[];
  surveyTypes: readonly SurveyType[];
  routes: readonly string[];
}): string[] {
  const {audit, records, surveyTypes, routes}=args;
  const issues: string[]=[];
  const sampleIds=[...new Set(audit.sampleIds)];
  if (!sampleIds.length) return ['Belum ada sampel audit yang ditetapkan.'];
  if (sampleIds.length!==audit.sampleIds.length) issues.push('Daftar sampel memiliki ID ganda.');
  const selected:DailySurveyRecord[]=[];
  for(const id of sampleIds){
    const record=records.find(r=>r.id===id);
    if(!record){issues.push(`Sampel ${id} tidak ditemukan pada rekaman terkini.`);continue;}
    if(record.state!=='Tercatat') issues.push(`Sampel ${id} tidak lagi berstatus Tercatat.`);
    if(!routes.includes(record.road)) issues.push(`Sampel ${id} berada di luar ruas paket.`);
    if(!surveyTypes.includes(record.surveyType)) issues.push(`Sampel ${id} berada di luar jenis survei paket.`);
    selected.push(record);
  }
  for(const type of surveyTypes){
    if(!selected.some(r=>r.surveyType===type)) issues.push(`Sampel untuk ${type} belum tersedia.`);
  }
  return issues;
}
