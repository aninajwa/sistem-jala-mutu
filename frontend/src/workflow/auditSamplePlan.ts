/** Tahap 5: rencana sampel deterministik pada unit titik/segmen/objek, bukan jumlah rekaman harian. */
import {samplingRule,type AuditSampleUnit,type DailySurveyRecord,type SurveyType} from './model';
import {buildAuditPopulation} from './auditSampleUnits';

export type AuditSampleInput={packageId:string;auditLevel:1|2|3;surveyTypes:readonly SurveyType[];routes:readonly string[];records:readonly DailySurveyRecord[];};
export type AuditSamplePlan={sampleIds:string[];sampleUnits:AuditSampleUnit[];issues:string[];coverage:Partial<Record<SurveyType,{sourceCount:number;sampleCount:number;sourceKm:number;sampleKm:number;sourceUnits:number;sampleUnits:number}>>};
function hash(value:string):number {let h=2166136261;for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619);return h>>>0;}
function stable<T extends {id:string}>(records:readonly T[],seed:string):T[]{return [...records].sort((a,b)=>hash(seed+':'+a.id)-hash(seed+':'+b.id)||a.id.localeCompare(b.id));}
const lengthBased=(type:SurveyType,level:1|2|3)=>level===2&&samplingRule(type,level).unit.includes('panjang jalan');

export function buildAuditSamplePlan(input:AuditSampleInput):AuditSamplePlan {
 const selected:AuditSampleUnit[]=[],issues:string[]=[];const coverage:AuditSamplePlan['coverage']={};
 const population=buildAuditPopulation(input.records,input.surveyTypes,input.routes);issues.push(...population.issues);
 for(const type of input.surveyTypes){
  const rows=input.records.filter(r=>r.surveyType===type&&input.routes.includes(r.road)&&r.state==='Tercatat');
  const units=population.units.filter(unit=>unit.surveyType===type),chosen:AuditSampleUnit[]=[];const seed=`${input.packageId}:${input.auditLevel}:${type}`,rule=samplingRule(type,input.auditLevel);
  if(!units.length){issues.push(`Belum ada unit titik/segmen/objek ter-normalisasi untuk ${type}.`);continue;}
  if(input.auditLevel===1)chosen.push(...units);
  else if(input.auditLevel===2&&type==='Lalu Lintas'){
   const dates=[...new Set(units.map(unit=>unit.date).filter(Boolean))].sort();for(const date of dates){const eligible=units.filter(unit=>unit.date===date);if(eligible.length)chosen.push(stable(eligible,seed+':'+date)[0]);}
  } else if(input.auditLevel===2&&type==='Lereng'){
   const missing=units.filter(unit=>!unit.groupKey?.trim());if(missing.length)issues.push(`Lereng: ${missing.length} unit belum memiliki jenis keruntuhan.`);
   for(const category of [...new Set(units.map(unit=>unit.groupKey).filter((v):v is string=>!!v?.trim()))].sort()){const group=units.filter(unit=>unit.groupKey===category);chosen.push(...stable(group,seed+':'+category).slice(0,Math.max(1,Math.ceil(group.length*.1))));}
  } else if(lengthBased(type,input.auditLevel)){
   const invalid=units.filter(unit=>!Number.isFinite(unit.lengthKm)||!(unit.lengthKm!>0));if(invalid.length){issues.push(`${type}: ${invalid.length} unit belum memiliki panjang individual; denominator 5% tidak boleh dihitung dari jumlah rekaman.`);}
   else {const total=units.reduce((n,unit)=>n+(unit.lengthKm??0),0),cap=total*rule.rate/100;let km=0;for(const unit of stable(units,seed)){const length=unit.lengthKm??0;if(length>0&&km+length<=cap+1e-8){chosen.push(unit);km+=length;}}
    if(!chosen.length)issues.push(`${type}: unit terkecil melebihi batas ${rule.rate}% (${cap.toFixed(3)} km). Sumber perlu menyediakan segmen sampling yang lebih rinci.`);
   }
  } else {const count=Math.max(1,Math.ceil(units.length*rule.rate/100));chosen.push(...stable(units,seed).slice(0,count));}
  selected.push(...chosen);
  coverage[type]={sourceCount:rows.length,sampleCount:new Set(chosen.map(unit=>unit.sourceRecordId)).size,sourceKm:units.reduce((n,u)=>n+(u.lengthKm??0),0),sampleKm:chosen.reduce((n,u)=>n+(u.lengthKm??0),0),sourceUnits:units.length,sampleUnits:chosen.length};
  if(!chosen.length&&!issues.some(text=>text.startsWith(type+':')||text.includes(`untuk ${type}`)))issues.push(`${type}: cakupan sampel kosong.`);
 }
 if(!input.surveyTypes.length)issues.push('Lingkup survei paket belum ditetapkan.');
 const unique=[...new Map(selected.map(unit=>[unit.id,unit])).values()];return {sampleUnits:unique,sampleIds:[...new Set(unique.map(unit=>unit.sourceRecordId))],issues:[...new Set(issues)],coverage};
}
