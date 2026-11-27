import type { OperationalWorkflowState } from '../workflow/model';
import { isValidReviewDate } from '../pages/reviewDateValidation';
export type DailyLength = {date:string; survey:string; km:number; sessions:number};
/** Recorded session distance, not unique coverage or a validation decision. */
export function dailyLengthEvidence(state:OperationalWorkflowState|undefined,start:string,end:string):DailyLength[] {
 if(!state||!isValidReviewDate(start)||!isValidReviewDate(end)||start>end)return [];
 const counts=new Map<string,number>(); for(const r of state.dailyRecords)counts.set(r.id,(counts.get(r.id)||0)+1);
 const result=new Map<string,DailyLength>();
 for(const r of state.dailyRecords){if(!r.id||counts.get(r.id)!==1||r.state!=='Tercatat'||!isValidReviewDate(r.date)||r.date<start||r.date>end||!Number.isFinite(r.lengthKm)||r.lengthKm<=0)continue;
 const key=JSON.stringify([r.date,r.surveyType]);const v=result.get(key)||{date:r.date,survey:r.surveyType,km:0,sessions:0};v.km+=r.lengthKm;v.sessions++;result.set(key,v);}
 return [...result.values()].sort((a,b)=>a.survey.localeCompare(b.survey)||a.date.localeCompare(b.date)).map(v=>({...v,km:Math.round(v.km*1000)/1000}));
}
export function lengthEvidenceText(rows:readonly DailyLength[]){return rows.length?'Panjang sesi tercatat (km), bukan cakupan ruas unik atau volume tervalidasi:\n'+rows.map(r=>`${r.date} · ${r.survey}: ${r.km} km (${r.sessions} sesi)`).join('\n'):'Belum ada panjang sesi tercatat pada periode ini.';}
