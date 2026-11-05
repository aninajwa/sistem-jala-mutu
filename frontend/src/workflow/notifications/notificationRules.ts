import type {OperationalWorkflowState,WorkflowRole} from '../model';
import {correctionReviewer} from '../checkpoint09Corrections';
import {documentActors} from '../ba/documentWorkflow';
import type {BaIdentity,BaVersion} from '../ba/documentRepository';
import type {Principal} from '../repository/contracts';
import {BALAI,CENTRE,PROVIDER,documentIdentityAvailable,documentIdentityKey,eventId,operationalPackage,projectWorkflow,type Member,type NoticeEvent,type Notification,type NotificationConfig,type Obligation,type Projection,type Subject,type Target,type Duty} from './notificationEvents';
export const SELECTION={preparation:'/entry:Persiapan & SPMK',production:'/entry:Validasi produksi',period:'/verification:Verval 14 hari',submission:'/entry:Gerbang RNI/LRS',audit:'/verification:Audit tingkat 1–3',calibration:'/documents:Kalibrasi & personel',acceptance:'/reports:Penerimaan & termin'};
export function assigned(m:Member,s:OperationalWorkflowState,role:WorkflowRole,duty:Duty){return m.active&&m.role===role&&m.assignments.some(a=>a.packageId===s.project.id&&a.balai===s.project.balai&&a.duties.includes(duty));}
export function viewerMember(config:NotificationConfig,principal:Principal){const id=principal.source==='server'?principal.id:config.bindings[principal.id];return config.members.find(m=>m.id===id&&m.role===principal.role&&m.active);}
export function canAccessNotification(n:Notification,s:OperationalWorkflowState|undefined,config:NotificationConfig,p:Principal){const m=viewerMember(config,p);return !!s&&operationalPackage(s)&&!!m&&n.recipientId===m.id&&n.recipientRole===p.role&&p.packageIds.includes(s.project.id)&&recipients(n,s,config).some(x=>x.id===m.id);}
export function recipients(e:NoticeEvent,s:OperationalWorkflowState,config:NotificationConfig){return config.members.filter(m=>assigned(m,s,e.recipientRole,e.duty)).filter(m=>e.subject.kind==='correction'&&e.recipientRole===PROVIDER?config.caseOwners?.[`${e.packageId}:${e.subject.id}`]===m.id:true).filter(m=>e.subject.kind==='document'&&e.type!=='document.submitted-local'?!!config.documentOwners?.[documentIdentityKey(e.subject.identity!)]?.includes(m.id):true).filter(m=>e.escalationRuleId?config.escalations.some(r=>r.id===e.escalationRuleId&&r.enabled&&r.recipientId===m.id):true);}
export function workflowEvents(old:Projection,next:OperationalWorkflowState,revision:number,at:string):NoticeEvent[]{
 if(!operationalPackage(next))return [];
 const now=projectWorkflow(next),out:NoticeEvent[]=[],pkg=next.project.id;
 function emit(type:string,title:string,subject:Subject,role:WorkflowRole,duty:Duty,state:string,target:Target,action=true,rule='TURUNAN SUMBER: diagram01–04 dan matriks kewenangan'){
  out.push({id:eventId('workflow',pkg,revision,type,subject),type,title,packageId:pkg,subject,recipientRole:role,duty,sourceVersion:String(revision),occurredAt:at,expectedState:state,target,actionRequired:action,rule});
 }
 for(const kind of ['preparation','production'] as const){if(old[kind]===now[kind])continue;const subject={kind,id:kind},target:Target={module:'workflow',packageId:pkg,selection:SELECTION[kind]};
  if(now[kind]==='Diajukan')emit('workflow.submitted',`${kind==='preparation'?'Persiapan':'Validasi produksi'} menunggu pemeriksaan`,subject,BALAI,'review','Diajukan',target);
  if(['Perlu Revisi','Ditolak'].includes(now[kind]))emit('workflow.returned',`${kind==='preparation'?'Persiapan':'Validasi produksi'} dikembalikan`,subject,PROVIDER,'lead',now[kind],target);
  if(now[kind]==='Disetujui')emit('workflow.approved',`${kind==='preparation'?'Persiapan':'Validasi produksi'} disetujui`,subject,PROVIDER,'lead','Disetujui',target,false);
 }
 for(const [id,p] of Object.entries(now.periods)){const previous=old.periods[id];if(!previous)continue;const subject:Subject={kind:'period',id,period:Number(id)},target:Target={module:'workflow',packageId:pkg,selection:SELECTION.period,period:Number(id)};
  if(!previous.submitted&&p.submitted&&p.review!=='Sesuai')emit('period.submitted','Hasil periode verval menunggu pemeriksaan',subject,BALAI,'review','submitted',target);
  if(previous.review!==p.review&&p.review==='Temuan')emit('period.returned','Hasil verval memerlukan tindak lanjut',subject,PROVIDER,'lead','Temuan',target);
  if(previous.review!==p.review&&p.review==='Sesuai')emit('period.reviewed','Hasil verval diperiksa sesuai',subject,PROVIDER,'lead','Sesuai',target,false);
 }
 if(old.submission!==now.submission&&now.submission==='Error')emit('submission.returned','Penyerahan data memerlukan perbaikan',{kind:'submission',id:'submission'},PROVIDER,'lead','Error',{module:'workflow',packageId:pkg,selection:SELECTION.submission});
 function auditReady(level:number,p:Projection){return p.submission==='VALID'&&p.audits[level-2]?.status==='Lulus'&&!p.audits[level-2]?.requiresReview&&(p.audits[level-1]?.requiresReview||!['Lulus','Ditolak'].includes(p.audits[level-1]?.status));}
 for(const level of [2,3])if(!auditReady(level,old)&&auditReady(level,now))emit('audit.ready',`Audit tingkat ${level} siap diperiksa`,{kind:'audit',id:String(level),auditLevel:level},level===2?BALAI:CENTRE,'audit','ready',{module:'workflow',packageId:pkg,selection:SELECTION.audit,auditLevel:level});
 for(const [index,a] of now.audits.entries())if(a.status==='Ditolak'&&old.audits[index]?.status!=='Ditolak')emit('audit.returned',`Audit tingkat ${index+1} ditolak; tinjau alasan`,{kind:'audit',id:String(index+1),auditLevel:index+1},index===2?BALAI:PROVIDER,index===2?'supervise':'lead','Ditolak',{module:'workflow',packageId:pkg,selection:SELECTION.audit,auditLevel:index+1},index!==2);
 for(const c of next.corrections){const prev=old.corrections[c.id];if(prev&&prev.status===c.status&&prev.approval===c.approval&&prev.retest===c.retest)continue;const subject:Subject={kind:'correction',id:c.id},target:Target={module:'correction',packageId:pkg,caseId:c.id};
  if(c.status==='Menunggu Persetujuan')emit('correction.submitted','Usulan tindakan menunggu keputusan',subject,BALAI,'review',c.status,target);
  else if(c.status==='Disetujui')emit('correction.approved','Tindakan disetujui untuk dilaksanakan',subject,PROVIDER,'lead',c.status,target);
  else if(c.status==='Dilaksanakan')emit('correction.executed','Hasil pelaksanaan siap diperiksa ulang',subject,correctionReviewer(c),correctionReviewer(c)===PROVIDER?'lead':correctionReviewer(c)===CENTRE?'audit':'review',c.status,target);
  else if(c.status==='Terbuka'&&(c.approval==='Perlu Revisi'||c.retest==='Gagal'))emit('correction.returned','Hasil tindakan dikembalikan untuk diperbaiki',subject,PROVIDER,'lead',`${c.status}:${c.approval}:${c.retest}`,target);
  else if(c.status==='Verifikasi Ulang'&&c.retest==='Lulus')emit('correction.retested','Uji ulang lulus; periksa syarat penutupan',subject,correctionReviewer(c),correctionReviewer(c)===PROVIDER?'lead':correctionReviewer(c)===CENTRE?'audit':'review',c.status,target);
  else if(c.status==='Ditutup')emit('correction.closed','Kasus ditutup; periksa kembali tahap sumber',subject,PROVIDER,'lead',c.status,target,false);
 }
 return out;
}
export function documentEvents(id:BaIdentity,v:BaVersion,s:OperationalWorkflowState):NoticeEvent[]{
 if(!operationalPackage(s)||!documentIdentityAvailable(id,s))return [];
 const actors=documentActors(id),subject:Subject={kind:'document',id:documentIdentityKey(id!),identity:id},target:Target={module:'document',packageId:id.packageId,identity:id};
 const roles=v.status==='submitted-local'?[actors.reviewer]:['revision-requested-local','rejected-local','reviewed-local'].includes(v.status)?actors.authors:[];
 return roles.map(role=>({id:eventId('BA',id,v.id,v.version,role),type:`document.${v.status}`,title:v.status==='submitted-local'?'BA diajukan untuk pemeriksaan':v.status==='reviewed-local'?'Pemeriksaan BA selesai':'BA dikembalikan untuk revisi',packageId:id.packageId,subject,sourceVersion:String(v.version),occurredAt:v.createdAt,recipientRole:role,duty:role===PROVIDER?'lead':role===CENTRE?'audit':'review',actionRequired:v.status!=='reviewed-local',expectedState:v.status,target,rule:'TURUNAN SUMBER: matriks tujuh BA; pemeriksaan lokal bukan pengesahan'}));
}
export function stateMatches(e:NoticeEvent,s:OperationalWorkflowState,latestDocument?:{status:string;version:number}){
 const p=projectWorkflow(s),a=e.subject;
 if(a.kind==='document')return !!latestDocument&&latestDocument.status===e.expectedState&&String(latestDocument.version)===e.sourceVersion;
 if(a.kind==='correction'){const c=s.corrections.find(c=>c.id===a.id);return !!c&&(e.type==='correction.returned'?`${c.status}:${c.approval}:${c.retest}`===e.expectedState:c.status===e.expectedState);}
 if(a.kind==='audit'){const level=a.auditLevel!;return e.expectedState==='ready'?p.submission==='VALID'&&p.audits[level-2]?.status==='Lulus'&&!p.audits[level-2]?.requiresReview&&(p.audits[level-1]?.requiresReview||!['Lulus','Ditolak'].includes(p.audits[level-1]?.status)):p.audits[level-1]?.status===e.expectedState;}
 if(a.kind==='period'){const c=p.periods[String(a.period)];return !!c&&(e.expectedState==='submitted'?c.submitted&&c.review!=='Sesuai':c.review===e.expectedState);}
 return p[a.kind]===e.expectedState;
}
