import type { OperationalWorkflowState } from '../workflow/model';
/** Package-level decision events; never substitute for per-survey decisions. */
export function projectDecisionHistory(packages:Record<string,OperationalWorkflowState>,period='Semua periode') {
 return Object.entries(packages).flatMap(([packageId,state])=>{
  if(packageId!==state.project.id)return [];
  const events=state.reviewActivityHistory??[];
  const counts=new Map<string,number>();
  for(const e of events) counts.set(e.id,(counts.get(e.id)??0)+1);
  return events.filter(e=>{
   if(!e.id||counts.get(e.id)!==1||e.action!=='keputusan'||!['PIC Balai / Pengguna Jasa','Direktorat / Pusat','Penyedia Jasa / Ketua Tim'].includes(e.actor))return false;
   const date=e.recordedAt.slice(0,10);
   if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date)return false;
   return (!period.startsWith('Bulan ')||date.slice(0,7)===period.slice(6))&&(!period.startsWith('Tahun ')||date.slice(0,4)===period.slice(6));
  }).map(e=>({...e,packageId,packageName:state.project.packageName,month:e.recordedAt.slice(0,7)}));
 });
}
