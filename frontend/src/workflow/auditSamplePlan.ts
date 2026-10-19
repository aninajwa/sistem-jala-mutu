/** Tahap 5: rencana sampel deterministik, terpisah dari UI dan tidak mengubah rekaman sumber. */
import { samplingRule, type DailySurveyRecord, type SurveyType } from './model';

export type AuditSampleInput={
  packageId:string;
  auditLevel:1|2|3;
  surveyTypes:readonly SurveyType[];
  routes:readonly string[];
  records:readonly DailySurveyRecord[];
};
export type AuditSamplePlan={sampleIds:string[];issues:string[];coverage:Partial<Record<SurveyType,{sourceCount:number;sampleCount:number;sourceKm:number;sampleKm:number}>>};

function hash(value:string):number {let h=2166136261;for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619);return h>>>0;}
function stable<T extends {id:string}>(records:readonly T[],seed:string):T[]{return [...records].sort((a,b)=>hash(seed+':'+a.id)-hash(seed+':'+b.id)||a.id.localeCompare(b.id));}

export function buildAuditSamplePlan(input:AuditSampleInput):AuditSamplePlan {
  const sampleIds:string[]=[];
  const issues:string[]=[];
  const coverage:AuditSamplePlan['coverage']={};
  for(const type of input.surveyTypes){
    const rows=input.records.filter(r=>r.surveyType===type&&input.routes.includes(r.road)&&r.state==='Tercatat');
    const chosen:DailySurveyRecord[]=[];
    const seed=`${input.packageId}:${input.auditLevel}:${type}`;
    const rule=samplingRule(type,input.auditLevel);
    if(rows.length===0){issues.push(`Belum ada rekaman sumber tercatat untuk ${type}.`);continue;}
    if(input.auditLevel===1){chosen.push(...rows);}
    else if(input.auditLevel===2&&type==='Lalu Lintas'){
      const dates=[...new Set(rows.map(r=>r.date))].sort();
      for(const date of dates){
        const eligible=rows.filter(r=>r.date===date&&r.trafficDurationMinutes>=10);
        if(!eligible.length){issues.push(`Lalu Lintas ${date}: belum ada rekaman berdurasi minimal 10 menit.`);continue;}
        chosen.push(stable(eligible,seed+':'+date)[0]);
      }
    }
    else if(input.auditLevel===2&&type==='Lereng'){
      const missing=rows.filter(r=>!r.slopeFailureType?.trim());
      if(missing.length)issues.push(`Lereng: ${missing.length} rekaman belum memiliki jenis keruntuhan.`);
      for(const category of [...new Set(rows.map(r=>r.slopeFailureType).filter((v):v is string=>!!v?.trim()))].sort()){
        const group=rows.filter(r=>r.slopeFailureType===category);
        chosen.push(...stable(group,seed+':'+category).slice(0,Math.max(1,Math.ceil(group.length*.1))));
      }
    }
    else if(input.auditLevel===2&&rule.rate===5){
      const sum=rows.reduce((n,r)=>n+Math.max(0,r.lengthKm),0);
      const cap=sum*.05;
      if(sum<=0){issues.push(`${type}: panjang sumber tidak tersedia.`);}
      else {
        let km=0;
        for(const r of stable(rows,seed)){
          if(r.lengthKm>0&&km+r.lengthKm<=cap+1e-8){chosen.push(r);km+=r.lengthKm;}
        }
        if(!chosen.length)issues.push(`${type}: tidak ada rekaman utuh dalam batas 5% (${cap.toFixed(3)} km). Perlu data segmen yang dapat diaudit; jangan memilih melebihi batas.`);
      }
    }
    else {
      const count=Math.max(1,Math.ceil(rows.length*rule.rate/100));
      chosen.push(...stable(rows,seed).slice(0,count));
    }
    sampleIds.push(...chosen.map(r=>r.id));
    coverage[type]={sourceCount:rows.length,sampleCount:chosen.length,sourceKm:rows.reduce((n,r)=>n+Math.max(0,r.lengthKm),0),sampleKm:chosen.reduce((n,r)=>n+Math.max(0,r.lengthKm),0)};
    if(!chosen.length&&!issues.some(t=>t.startsWith(type+':')||t.startsWith(type+' ')))issues.push(`${type}: cakupan sampel kosong.`);
  }
  if(!input.surveyTypes.length)issues.push('Lingkup survei paket belum ditetapkan.');
  return {sampleIds:[...new Set(sampleIds)],issues,coverage};
}
