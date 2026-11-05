import type {OperationalWorkflowState} from '../model';
import {BALAI,PROVIDER,eventId,operationalPackage,type NotificationConfig,type Obligation,type NoticeEvent} from './notificationEvents';
import {SELECTION,assigned} from './notificationRules';
export function validDate(value:unknown):value is string{return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;}
export function days(from:string,to:string){return Math.round((Date.parse(to+'T00:00:00Z')-Date.parse(from+'T00:00:00Z'))/86400000);}
export function addDays(date:string,count:number){const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+count);return d.toISOString().slice(0,10);}
export function jakartaDay(at=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(at);return ['year','month','day'].map(k=>parts.find(p=>p.type===k)!.value).join('-');}
/** Dates are read from the actual entity, never from simulationDate or a diagram's example year. */
export function sourceObligations(s:OperationalWorkflowState):Obligation[]{
 if(!operationalPackage(s))return [];const pkg=s.project.id,out:Obligation[]=[];
 const start=s.project.surveyStartDate,end=s.project.surveyEndDate;
 if(validDate(start)&&validDate(end)&&end>=start&&days(start,end)<=3660){
  for(let n=1,from=start;from<=end;n++,from=addDays(from,14)){const due=addDays(from,13)>end?end:addDays(from,13),c=n===(s.activeCyclePeriod??1)?s.cycle:s.cycleHistory?.[String(n)];out.push({id:`${pkg}:cycle:${n}`,packageId:pkg,title:`Verifikasi dan validasi internal Penyedia Jasa · periode ${n}`,kind:'cycle14',dueDate:due,completed:!!c?.periodCompleted,cancelled:false,role:PROVIDER,duty:'lead',subject:{kind:'period',id:String(n),period:n},target:{module:'workflow',packageId:pkg,selection:SELECTION.period,period:n},reference:`project.surveyStartDate/surveyEndDate; periode ${n}`});}
 }
 for(const t of s.acceptance.terms)if(validDate(t.dueDate))out.push({id:`${pkg}:term:${t.id}`,packageId:pkg,title:`Termin ${t.id}`,kind:'long-term',dueDate:t.dueDate,completed:t.complete,cancelled:false,role:PROVIDER,duty:'lead',subject:{kind:'submission',id:t.id},target:{module:'workflow',packageId:pkg,selection:SELECTION.acceptance},reference:`acceptance.terms.${t.id}.dueDate`});
 for(const c of s.corrections)if(validDate(c.dueDate))out.push({id:`${pkg}:case:${c.id}`,packageId:pkg,title:`Tindak lanjut ${c.id}`,kind:'correction',dueDate:c.dueDate,completed:c.status==='Ditutup',cancelled:false,role:PROVIDER,duty:'lead',subject:{kind:'correction',id:c.id},target:{module:'correction',packageId:pkg,caseId:c.id},reference:`corrections.${c.id}.dueDate`});
 for(const c of s.calibrations)if(validDate(c.dueDate))out.push({id:`${pkg}:calibration:${c.id}`,packageId:pkg,title:`Masa berlaku kalibrasi ${c.equipment}`,kind:'calibration',dueDate:c.dueDate,reminderOffsets:c.calibrationKind==='Referensi tahunan'?[30,7]:[7,1],completed:s.acceptance.finalAcceptance,cancelled:false,role:PROVIDER,duty:'lead',subject:{kind:'production',id:c.id},target:{module:'workflow',packageId:pkg,selection:SELECTION.calibration},reference:`calibrations.${c.id}.dueDate`});
 return out;
}
export function obligationsFor(packages:Record<string,OperationalWorkflowState>,cfg:NotificationConfig){
 const out=Object.values(packages).flatMap(sourceObligations).filter(o=>cfg.confirmedDates[o.id]?.date===o.dueDate&&!!cfg.confirmedDates[o.id]?.reference.trim()).map(o=>({...o,reference:cfg.confirmedDates[o.id].reference,effectiveFrom:cfg.confirmedDates[o.id].effectiveFrom}));
 for(const a of cfg.appointments??[]){const s=packages[a.packageId];if(!s||!operationalPackage(s)||!validDate(a.date))continue;out.push({id:`${a.packageId}:appointment:${a.id}`,packageId:a.packageId,title:a.title,kind:'appointment',dueDate:a.date,effectiveFrom:a.effectiveFrom,completed:!!a.completed,cancelled:!!a.cancelled,role:a.role,duty:a.duty,target:a.target,subject:{kind:'audit',id:a.id,auditLevel:a.target.module==='workflow'?a.target.auditLevel:undefined},reference:a.reference});}
 return out;
}
export function reminderEvents(o:Obligation,s:OperationalWorkflowState,cfg:NotificationConfig,today:string,at:string):NoticeEvent[]{
 if(o.completed||o.cancelled||!validDate(o.dueDate)||!validDate(today))return [];
 const remaining=days(today,o.dueDate),offsets=o.reminderOffsets??(o.kind==='cycle14'?[7,1]:o.kind==='long-term'?[30,7]:[7,1]);
 // H-30 is only valid when the obligation was effective at least 30 days before
 // the confirmed due date. A category label alone is not sufficient evidence.
 const eligibleOffsets=offsets.filter(offset=>offset!==30||(validDate(o.effectiveFrom)&&days(o.effectiveFrom,o.dueDate)>=30&&days(o.effectiveFrom,today)>=0));
 const stage=remaining<0?'overdue':remaining===0?'due':eligibleOffsets.includes(remaining)?`H-${remaining}`:undefined;
 const base=(role:NoticeEvent['recipientRole'],duty:NoticeEvent['duty'],suffix:string):NoticeEvent=>({id:eventId('reminder',o.id,o.dueDate,suffix),type:suffix,title:`${o.title} · ${suffix==='overdue'?'terlambat':suffix==='due'?'jatuh tempo hari ini':suffix}`,packageId:o.packageId,subject:o.subject,sourceVersion:o.dueDate,occurredAt:at,recipientRole:role,duty,expectedState:'obligation-active',actionRequired:true,target:o.target,rule:`KEPUTUSAN DESAIN: pengingat ${o.kind}; ${o.reference}`,obligationId:o.id});
 const out:NoticeEvent[]=[];if(stage)out.push(base(o.role,o.duty,stage));
 if(remaining<0)out.push({...base(BALAI,'supervise','overdue'),id:eventId('supervision',o.id,o.dueDate),type:'supervision.overdue',actionRequired:false,title:`Keterlambatan dalam pengawasan · ${o.title}`});
 for(const r of cfg.escalations){const member=cfg.members.find(m=>m.id===r.recipientId&&m.active);if(!r.enabled||r.packageId!==o.packageId||r.obligationKind!==o.kind||remaining>=0||-remaining<r.afterDays||!r.reference.trim()||!member||member.role==='Admin'||!assigned(member,s,member.role,'supervise'))continue;
  out.push({...base(member.role,'supervise','escalation'),id:eventId('escalation',o.id,o.dueDate,r.id,member.id),type:'escalation',title:`Pemberitahuan eskalasi · ${o.title}`,actionRequired:false,rule:`KEPUTUSAN DESAIN terkonfigurasi ${r.id}: ${r.reference}`,escalationRuleId:r.id});
 }
 return out;
}
